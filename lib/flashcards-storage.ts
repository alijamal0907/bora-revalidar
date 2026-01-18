import { createClient } from "@/lib/supabase/client"

function getSupabaseClient() {
  return createClient()
}

export interface Flashcard {
  id: string
  materia: string
  tema: string
  frente: string
  verso: string
  created_at: string
  updated_at: string
  is_global: boolean
  user_id: string | null
}

export interface FlashcardSession {
  flashcards: Flashcard[]
  currentIndex: number
  correct: number
  wrong: number
  reviewedIds: Set<string>
}

export async function orderFlashcardsWithSpacedRepetition(
  userId: string | null,
  flashcards: Flashcard[],
): Promise<Flashcard[]> {
  if (!userId || flashcards.length === 0) {
    // Se não tiver usuário, apenas embaralha
    return shuffleArray(flashcards)
  }

  const supabase = getSupabaseClient()
  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

  // Busca histórico de todos os flashcards (últimas 48h para performance)
  const { data: history, error } = await supabase
    .from("flashcard_history")
    .select("flashcard_id, correct, answered_at")
    .eq("user_id", userId)
    .in(
      "flashcard_id",
      flashcards.map((f) => f.id),
    )
    .gte("answered_at", new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString())
    .order("answered_at", { ascending: false })

  if (error) {
    console.error("Error fetching flashcard history:", error)
    return shuffleArray(flashcards)
  }

  // Cria um mapa com estatísticas de cada flashcard
  const statsMap = new Map<
    string,
    {
      lastAnswered: Date
      totalAnswers: number
      correctCount: number
      wrongCount: number
      wasWrongRecently: boolean
    }
  >()

  history?.forEach((h: any) => {
    if (!statsMap.has(h.flashcard_id)) {
      statsMap.set(h.flashcard_id, {
        lastAnswered: new Date(h.answered_at),
        totalAnswers: 1,
        correctCount: h.correct ? 1 : 0,
        wrongCount: h.correct ? 0 : 1,
        wasWrongRecently: !h.correct,
      })
    } else {
      const stats = statsMap.get(h.flashcard_id)!
      stats.totalAnswers++
      if (h.correct) {
        stats.correctCount++
      } else {
        stats.wrongCount++
        stats.wasWrongRecently = true
      }
    }
  })

  // Separa flashcards em categorias baseado em performance
  const needsReview: Flashcard[] = [] // Errados recentemente
  const dueForPractice: Flashcard[] = [] // Respondidos há mais de 1 dia
  const notYetStudied: Flashcard[] = [] // Nunca estudados
  const recentlyStudied: Flashcard[] = [] // Estudados nas últimas 24h

  flashcards.forEach((flashcard) => {
    const stats = statsMap.get(flashcard.id)

    if (!stats) {
      // Nunca estudado
      notYetStudied.push(flashcard)
    } else if (stats.wasWrongRecently) {
      // Errou recentemente, precisa revisar
      needsReview.push(flashcard)
    } else if (stats.lastAnswered < oneDayAgo) {
      // Não estudou há mais de 1 dia
      dueForPractice.push(flashcard)
    } else {
      // Estudou recentemente e acertou
      recentlyStudied.push(flashcard)
    }
  })

  // Ordena flashcards que precisam revisar pela taxa de erro (maior taxa = maior prioridade)
  needsReview.sort((a, b) => {
    const aStats = statsMap.get(a.id)!
    const bStats = statsMap.get(b.id)!
    const aErrorRate = aStats.wrongCount / aStats.totalAnswers
    const bErrorRate = bStats.wrongCount / bStats.totalAnswers
    return bErrorRate - aErrorRate // Maior erro primeiro
  })

  // Ordena os que precisam praticar pelos menos recentemente estudados
  dueForPractice.sort((a, b) => {
    const aStats = statsMap.get(a.id)!
    const bStats = statsMap.get(b.id)!
    return aStats.lastAnswered.getTime() - bStats.lastAnswered.getTime()
  })

  // Embaralha os não estudados e os recentes
  const shuffledNew = shuffleArray(notYetStudied)
  const shuffledRecent = shuffleArray(recentlyStudied)

  // Combina: prioridade para revisar erros, depois praticar, depois novos, depois recentes
  return intercalateFlashcards([...needsReview, ...dueForPractice, ...shuffledNew, ...shuffledRecent])
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function intercalateFlashcards(flashcards: Flashcard[]): Flashcard[] {
  if (flashcards.length <= 2) return flashcards

  const result: Flashcard[] = [flashcards[0]]
  const remaining = flashcards.slice(1)

  while (remaining.length > 0) {
    const lastAdded = result[result.length - 1]

    // Tenta encontrar um flashcard diferente do último
    const differentIndex = remaining.findIndex((f) => f.id !== lastAdded.id && f.tema !== lastAdded.tema)

    if (differentIndex !== -1) {
      result.push(remaining[differentIndex])
      remaining.splice(differentIndex, 1)
    } else {
      // Se não encontrar diferente, pega o primeiro disponível
      result.push(remaining[0])
      remaining.shift()
    }
  }

  return result
}

export async function getFlashcardsByMateriaAndTema(materia: string, tema: string): Promise<Flashcard[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc("get_flashcards_by_materia_tema", {
    p_materia: materia,
    p_tema: tema,
  })

  if (error) {
    console.error("Error fetching flashcards:", error)
    const result = await supabase
      .from("flashcards")
      .select("*")
      .eq("materia", materia)
      .eq("tema", tema)
      .eq("is_global", true)
      .order("created_at", { ascending: true })

    if (result.error) {
      console.error("Fallback query also failed:", result.error)
      throw result.error
    }
    return result.data || []
  }

  return data || []
}

export async function getAllFlashcardsByMateria(materia: string): Promise<Flashcard[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc("get_flashcards_by_materia", {
    p_materia: materia,
  })

  if (error) {
    console.error("Error fetching flashcards by materia:", error)
    const result = await supabase
      .from("flashcards")
      .select("*")
      .eq("materia", materia)
      .eq("is_global", true)
      .order("tema", { ascending: true })
      .order("created_at", { ascending: true })

    if (result.error) {
      console.error("Fallback query also failed:", result.error)
      throw result.error
    }
    return result.data || []
  }

  return data || []
}

export async function getAllFlashcards(): Promise<Flashcard[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase.rpc("get_all_flashcards")

  if (error) {
    console.error("Error fetching all flashcards:", error)
    const result = await supabase
      .from("flashcards")
      .select("*")
      .eq("is_global", true)
      .order("materia", { ascending: true })
      .order("tema", { ascending: true })
      .order("created_at", { ascending: true })

    if (result.error) {
      console.error("Fallback query also failed:", result.error)
      throw result.error
    }
    return result.data || []
  }

  return data || []
}

export async function getFlashcardCountByMateriaAndTema(materia: string, tema: string): Promise<number> {
  const supabase = getSupabaseClient()
  const { count, error } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true })
    .eq("materia", materia)
    .eq("tema", tema)
    .eq("is_global", true)

  if (error) {
    console.error("Error counting flashcards:", error)
    return 0
  }

  return count || 0
}

export async function getWrongFlashcardsByMateria(userId: string, materia: string): Promise<Flashcard[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("flashcard_history")
    .select(
      `
      flashcard_id,
      correct,
      flashcards (*)
    `,
    )
    .eq("user_id", userId)
    .eq("correct", false)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching wrong flashcards:", error)
    return []
  }

  const flashcardsMap = new Map<string, Flashcard>()
  data?.forEach((item: any) => {
    if (item.flashcards && item.flashcards.materia === materia) {
      flashcardsMap.set(item.flashcard_id, item.flashcards)
    }
  })

  return Array.from(flashcardsMap.values())
}

export async function getAllWrongFlashcards(userId: string): Promise<Flashcard[]> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("flashcard_history")
    .select(
      `
      flashcard_id,
      correct,
      flashcards (*)
    `,
    )
    .eq("user_id", userId)
    .eq("correct", false)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching all wrong flashcards:", error)
    return []
  }

  const flashcardsMap = new Map<string, Flashcard>()
  data?.forEach((item: any) => {
    if (item.flashcards) {
      flashcardsMap.set(item.flashcard_id, item.flashcards)
    }
  })

  return Array.from(flashcardsMap.values())
}

export const getWrongFlashcards = getAllWrongFlashcards

export async function saveFlashcardAnswer(
  userId: string,
  flashcardId: string,
  correct: boolean,
  materia: string,
  tema: string,
): Promise<void> {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("flashcard_history").insert({
    user_id: userId,
    flashcard_id: flashcardId,
    materia: materia,
    tema: tema,
    correct: correct,
    answered_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error saving flashcard answer:", error)
    throw error
  }
}

export async function deleteFlashcardAnswer(
  userId: string,
  flashcardId: string,
  answeredAt: string,
): Promise<void> {
  const supabase = getSupabaseClient()

  // Deleta a resposta específica baseada no timestamp
  const { error } = await supabase
    .from("flashcard_history")
    .delete()
    .eq("user_id", userId)
    .eq("flashcard_id", flashcardId)
    .eq("answered_at", answeredAt)

  if (error) {
    console.error("Error deleting flashcard answer:", error)
    throw error
  }
}

export async function getWrongFlashcardsCountByMateria(userId: string): Promise<Record<string, number>> {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("flashcard_history")
    .select(
      `
      flashcard_id,
      correct,
      flashcards!inner (materia)
    `,
    )
    .eq("user_id", userId)
    .eq("correct", false)

  if (error) {
    console.error("Error counting wrong flashcards:", error)
    return {}
  }

  const materiaMap = new Map<string, Set<string>>()
  data?.forEach((item: any) => {
    if (item.flashcards?.materia) {
      const materia = item.flashcards.materia
      if (!materiaMap.has(materia)) {
        materiaMap.set(materia, new Set())
      }
      materiaMap.get(materia)!.add(item.flashcard_id)
    }
  })

  const result: Record<string, number> = {}
  materiaMap.forEach((flashcards, materia) => {
    result[materia] = flashcards.size
  })

  return result
}

export async function getFlashcardProgressByMateria(userId: string): Promise<any[]> {
  try {
    const supabase = getSupabaseClient()
    const { data: history, error: histError } = await supabase
      .from("flashcard_history")
      .select("flashcard_id, correct, materia")
      .eq("user_id", userId)

    if (histError) {
      console.error("Error fetching flashcard history:", histError)
      return []
    }

    if (!history || history.length === 0) {
      return []
    }

    const materiaMap: { [key: string]: { total: number; correct: number; wrong: number } } = {}

    history.forEach((h: any) => {
      if (h.materia) {
        const materia = h.materia

        if (!materiaMap[materia]) {
          materiaMap[materia] = { total: 0, correct: 0, wrong: 0 }
        }

        materiaMap[materia].total++
        if (h.correct) {
          materiaMap[materia].correct++
        } else {
          materiaMap[materia].wrong++
        }
      }
    })

    const result = Object.entries(materiaMap).map(([materia, stats]) => ({
      materia,
      total: stats.total,
      correct: stats.correct,
      wrong: stats.wrong,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }))

    return result
  } catch (error) {
    console.error("Error in getFlashcardProgressByMateria:", error)
    return []
  }
}

export async function getFlashcardsStudiedToday(userId: string): Promise<number> {
  const supabase = getSupabaseClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayISO = today.toISOString()

  const { data, error } = await supabase
    .from("flashcard_history")
    .select("flashcard_id")
    .eq("user_id", userId)
    .gte("answered_at", todayISO)

  if (error) {
    console.error("Error counting today's flashcards:", error)
    return 0
  }

  const uniqueFlashcards = new Set(data?.map((item: any) => item.flashcard_id) || [])
  return uniqueFlashcards.size
}
