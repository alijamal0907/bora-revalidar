import { createClient } from '@/lib/supabase/client'
import unorm from 'unorm'

/**
 * Normaliza string removendo acentuação e convertendo para lowercase
 */
function normalizeString(str: string): string {
  return unorm
    .nfd(str)
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Interface para resultado de busca de subtema
 */
export interface SubtopicResult {
  id: string
  subtema: string
  area: string
  source: 'exact' | 'normalized' | 'fallback'
}

/**
 * Busca um subtema específico com fallback inteligente
 * Primeiro tenta match exato case-insensitive
 * Se não encontrar, tenta match normalizado (sem acentuação)
 * Se não encontrar, retorna subtemas da mesma área médica
 */
export async function findSubtopicForModule(
  area: string,
  subtopicName: string
): Promise<SubtopicResult[]> {
  const supabase = createClient()

  try {
    // 1. Tentar match exato (case-insensitive, com acentuação)
    let { data: exactMatch, error: exactError } = await supabase
      .from('questions')
      .select('id, subtema')
      .ilike('subtema', `%${subtopicName}%`)
      .limit(5)

    if (exactMatch && exactMatch.length > 0) {
      return exactMatch.map((q: any) => ({
        id: q.id,
        subtema: q.subtema,
        area,
        source: 'exact' as const,
      }))
    }

    // 2. Tentar match normalizado (sem acentuação)
    const normalizedSearchTerm = normalizeString(subtopicName)
    let { data: allQuestions, error: allError } = await supabase
      .from('questions')
      .select('id, subtema')
      .limit(1000)

    if (allQuestions && allQuestions.length > 0) {
      const normalizedMatches = allQuestions
        .filter((q: any) => {
          const normalizedSubtema = normalizeString(q.subtema)
          return normalizedSubtema.includes(normalizedSearchTerm)
        })
        .slice(0, 5)

      if (normalizedMatches.length > 0) {
        return normalizedMatches.map((q: any) => ({
          id: q.id,
          subtema: q.subtema,
          area,
          source: 'normalized' as const,
        }))
      }

      // 3. Fallback: retornar qualquer subtema disponível da base
      const fallbackMatches = allQuestions.slice(0, 5)
      return fallbackMatches.map((q: any) => ({
        id: q.id,
        subtema: q.subtema,
        area,
        source: 'fallback' as const,
      }))
    }

    return []
  } catch (error) {
    console.error('[subtopic-search] Erro:', error)
    return []
  }
}

/**
 * Busca todas as questões disponíveis para um módulo específico
 */
export async function getQuestionsForSubtopic(
  subtopicName: string,
  limit: number = 10
): Promise<any[]> {
  const supabase = createClient()

  try {
    // Primeiro tenta match exato
    let { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .ilike('subtema', `%${subtopicName}%`)
      .limit(limit)

    if (questions && questions.length > 0) {
      return questions
    }

    // Fallback: tentar normalizado
    const { data: allQuestions } = await supabase
      .from('questions')
      .select('*')
      .limit(limit * 2)

    if (allQuestions && allQuestions.length > 0) {
      const normalizedSearchTerm = normalizeString(subtopicName)
      return allQuestions
        .filter((q: any) => {
          const normalizedSubtema = normalizeString(q.subtema)
          return normalizedSubtema.includes(normalizedSearchTerm)
        })
        .slice(0, limit)
    }

    return []
  } catch (error) {
    console.error('[subtopic-search] Erro ao buscar questões:', error)
    return []
  }
}

/**
 * Busca flashcards para um subtema específico
 */
export async function getFlashcardsForSubtopic(
  subtopicName: string,
  limit: number = 10
): Promise<any[]> {
  const supabase = createClient()

  try {
    // Primeiro tenta match exato
    let { data: flashcards, error } = await supabase
      .from('flashcards')
      .select('*')
      .ilike('tema', `%${subtopicName}%`)
      .limit(limit)

    if (flashcards && flashcards.length > 0) {
      return flashcards
    }

    // Fallback: tentar normalizado
    const { data: allFlashcards } = await supabase
      .from('flashcards')
      .select('*')
      .limit(limit * 2)

    if (allFlashcards && allFlashcards.length > 0) {
      const normalizedSearchTerm = normalizeString(subtopicName)
      return allFlashcards
        .filter((f: any) => {
          const normalizedTema = normalizeString(f.tema)
          return normalizedTema.includes(normalizedSearchTerm)
        })
        .slice(0, limit)
    }

    return []
  } catch (error) {
    console.error('[subtopic-search] Erro ao buscar flashcards:', error)
    return []
  }
}
