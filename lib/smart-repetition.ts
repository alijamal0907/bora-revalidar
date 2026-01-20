import type { Flashcard } from "@/lib/flashcards-storage"

/**
 * Ordena flashcards com repetição inteligente
 * Prioriza flashcards que o usuário errou ou nunca viu
 */
export async function orderWithSmartRepetition(cards: Flashcard[]): Promise<Flashcard[]> {
  // Por enquanto, retorna os cards na ordem original
  // Em futuras versões, pode integrar com histórico de aprendizado
  return cards
}
