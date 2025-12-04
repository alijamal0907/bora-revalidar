import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

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

export async function getFlashcardsByMateriaAndTema(materia: string, tema: string): Promise<Flashcard[]> {
  const { data, error } = await supabase.rpc("get_flashcards_by_materia_tema", {
    p_materia: materia,
    p_tema: tema,
  })

  if (error) {
    console.error("Error fetching flashcards:", error)
    // Fallback para query SQL direta se RPC não existir
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
  const { data, error } = await supabase.rpc("get_flashcards_by_materia", {
    p_materia: materia,
  })

  if (error) {
    console.error("Error fetching flashcards by materia:", error)
    // Fallback
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
  const { data, error } = await supabase.rpc("get_all_flashcards")

  if (error) {
    console.error("Error fetching all flashcards:", error)
    // Fallback
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

  // Filter flashcards by materia and remove duplicates
  const flashcardsMap = new Map<string, Flashcard>()
  data?.forEach((item: any) => {
    if (item.flashcards && item.flashcards.materia === materia) {
      flashcardsMap.set(item.flashcard_id, item.flashcards)
    }
  })

  return Array.from(flashcardsMap.values())
}

export async function getAllWrongFlashcards(userId: string): Promise<Flashcard[]> {
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

  // Remove duplicates
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

export async function getWrongFlashcardsCountByMateria(userId: string): Promise<Record<string, number>> {
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

  // Count unique flashcards by materia
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

    // Agrupar por matéria
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

    // Converter para array
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

  // Contar apenas flashcards únicos (remover duplicatas)
  const uniqueFlashcards = new Set(data?.map((item: any) => item.flashcard_id) || [])
  return uniqueFlashcards.size
}
