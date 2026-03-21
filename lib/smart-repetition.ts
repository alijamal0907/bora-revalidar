import type { Flashcard } from "@/lib/flashcards-storage"
import { createClient } from "@/lib/supabase/client"
import { getSupabaseUser } from "@/lib/auth-supabase"

interface FlashcardStats {
  flashcardId: string
  wrongCount: number
  correctCount: number
  lastSeen: Date | null
  nextReview: Date | null
  intervalDays: number
}

/**
 * Ordena flashcards com repetição inteligente (SM-2)
 * Prioridade:
 * 1. Flashcards vencidos para revisão (next_review <= agora)
 * 2. Flashcards errados recentemente
 * 3. Flashcards nunca vistos
 * 4. Flashcards já dominados
 */
export async function orderWithSmartRepetition(cards: Flashcard[]): Promise<Flashcard[]> {
  if (cards.length === 0) return cards

  try {
    const user = await getSupabaseUser()
    if (!user) {
      // Sem usuário, apenas embaralha
      return shuffleArray(cards)
    }

    const supabase = createClient()
    const now = new Date()

    // Busca histórico de flashcards do usuário
    const flashcardIds = cards.map(c => c.id)
    
    const [historyResult, scheduleResult] = await Promise.all([
      supabase
        .from("flashcard_history")
        .select("flashcard_id, correct, answered_at")
        .eq("user_id", user.id)
        .in("flashcard_id", flashcardIds)
        .order("answered_at", { ascending: false }),
      supabase
        .from("review_schedule")
        .select("content_id, next_review, interval_days, ease_factor")
        .eq("user_id", user.id)
        .eq("content_type", "flashcard")
        .in("content_id", flashcardIds)
    ])

    const history = historyResult.data || []
    const schedule = scheduleResult.data || []

    // Criar mapa de estatísticas por flashcard
    const statsMap = new Map<string, FlashcardStats>()

    // Processar histórico
    for (const h of history) {
      const existing = statsMap.get(h.flashcard_id)
      if (!existing) {
        statsMap.set(h.flashcard_id, {
          flashcardId: h.flashcard_id,
          wrongCount: h.correct ? 0 : 1,
          correctCount: h.correct ? 1 : 0,
          lastSeen: new Date(h.answered_at),
          nextReview: null,
          intervalDays: 0
        })
      } else {
        if (h.correct) {
          existing.correctCount++
        } else {
          existing.wrongCount++
        }
      }
    }

    // Processar agendamento de revisão
    for (const s of schedule) {
      const existing = statsMap.get(s.content_id)
      if (existing) {
        existing.nextReview = new Date(s.next_review)
        existing.intervalDays = s.interval_days
      } else {
        statsMap.set(s.content_id, {
          flashcardId: s.content_id,
          wrongCount: 0,
          correctCount: 0,
          lastSeen: null,
          nextReview: new Date(s.next_review),
          intervalDays: s.interval_days
        })
      }
    }

    // Categorizar flashcards
    const dueForReview: Flashcard[] = [] // Vencidos para revisão
    const recentlyWrong: Flashcard[] = [] // Errados recentemente
    const neverSeen: Flashcard[] = [] // Nunca vistos
    const mastered: Flashcard[] = [] // Dominados

    for (const card of cards) {
      const stats = statsMap.get(card.id)

      if (!stats) {
        // Nunca visto
        neverSeen.push(card)
      } else if (stats.nextReview && stats.nextReview <= now) {
        // Vencido para revisão
        dueForReview.push(card)
      } else if (stats.wrongCount > stats.correctCount) {
        // Mais erros que acertos
        recentlyWrong.push(card)
      } else {
        // Dominado
        mastered.push(card)
      }
    }

    // Ordenar flashcards vencidos pelo mais atrasado primeiro
    dueForReview.sort((a, b) => {
      const statsA = statsMap.get(a.id)
      const statsB = statsMap.get(b.id)
      if (!statsA?.nextReview) return 1
      if (!statsB?.nextReview) return -1
      return statsA.nextReview.getTime() - statsB.nextReview.getTime()
    })

    // Ordenar errados pela taxa de erro (mais erros primeiro)
    recentlyWrong.sort((a, b) => {
      const statsA = statsMap.get(a.id)!
      const statsB = statsMap.get(b.id)!
      const errorRateA = statsA.wrongCount / (statsA.wrongCount + statsA.correctCount)
      const errorRateB = statsB.wrongCount / (statsB.wrongCount + statsB.correctCount)
      return errorRateB - errorRateA
    })

    // Embaralhar novos e dominados
    const shuffledNew = shuffleArray(neverSeen)
    const shuffledMastered = shuffleArray(mastered)

    // Combinar: vencidos > errados > novos > dominados
    const ordered = [
      ...dueForReview,
      ...recentlyWrong,
      ...shuffledNew,
      ...shuffledMastered
    ]

    // Intercalar para evitar repetição de temas
    return intercalateByTema(ordered)
  } catch (error) {
    console.error("Erro ao ordenar flashcards:", error)
    return shuffleArray(cards)
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function intercalateByTema(flashcards: Flashcard[]): Flashcard[] {
  if (flashcards.length <= 2) return flashcards

  const result: Flashcard[] = [flashcards[0]]
  const remaining = flashcards.slice(1)

  while (remaining.length > 0) {
    const lastAdded = result[result.length - 1]

    // Tenta encontrar um flashcard com tema diferente
    const differentIndex = remaining.findIndex(
      f => f.tema !== lastAdded.tema
    )

    if (differentIndex !== -1) {
      result.push(remaining[differentIndex])
      remaining.splice(differentIndex, 1)
    } else {
      result.push(remaining[0])
      remaining.shift()
    }
  }

  return result
}
