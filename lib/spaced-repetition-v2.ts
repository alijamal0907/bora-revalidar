import { createClient } from '@/lib/supabase/client'
import { differenceInDays, addDays } from 'date-fns'

export interface ReviewItem {
  id: string
  user_id: string
  content_type: 'questao' | 'flashcard'
  content_id: string
  last_seen: string
  next_review: string
  interval_days: number
  ease_factor: number
  review_count: number
  created_at: string
  updated_at: string
}

/**
 * Algoritmo de Espacamento de Revisao (SM-2 melhorado)
 * Baseado em: https://en.wikipedia.org/wiki/Spaced_repetition#SM-2
 *
 * Regras:
 * - Erro 1a vez: revisar em 1 dia
 * - Erro novamente: revisar em 3 dias
 * - Depois: 7 dias
 * - Depois: 15 dias
 * - Depois: 30 dias
 */

const REVIEW_INTERVALS: Record<number, number> = {
  0: 1, // Primeira revisao em 1 dia
  1: 3, // Segunda revisao em 3 dias
  2: 7, // Terceira revisao em 7 dias
  3: 15, // Quarta revisao em 15 dias
  4: 30, // Quinta revisao em 30 dias
  5: 60, // Sexta revisao em 60 dias
}

// Helper para verificar se tabela existe
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select('id').limit(1)
    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Obter itens vencidos para revisao
 */
export async function getDueReviewItems(
  userId: string,
  contentType?: 'questao' | 'flashcard'
): Promise<ReviewItem[]> {
  try {
    const supabase = createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'review_schedule'))) {
      return []
    }

    let query = supabase
      .from('review_schedule')
      .select('*')
      .eq('user_id', userId)
      .lte('next_review', new Date().toISOString())
      .order('next_review', { ascending: true })

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { data, error } = await query.limit(20)

    if (error) {
      console.error('[spaced-repetition] Erro ao buscar itens de revisao:', error)
      return []
    }

    return (data as ReviewItem[]) || []
  } catch (error) {
    console.error('[spaced-repetition] Erro em getDueReviewItems:', error)
    return []
  }
}

/**
 * Registrar resultado de revisao e atualizar agendamento
 */
export async function recordReviewResult(
  userId: string,
  contentId: string,
  contentType: 'questao' | 'flashcard',
  isCorrect: boolean,
  quality: number = isCorrect ? 4 : 1
) {
  try {
    const supabase = createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'review_schedule'))) {
      console.log('[spaced-repetition] Tabela review_schedule nao existe')
      return {
        nextReviewDate: addDays(new Date(), isCorrect ? 7 : 1),
        interval: isCorrect ? 7 : 1,
        easeFactor: 2.5,
      }
    }

    // Validar qualidade
    const q = Math.max(0, Math.min(5, quality))

    // Buscar review atual
    const { data: existingReview, error: fetchError } = await supabase
      .from('review_schedule')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[spaced-repetition] Erro ao buscar review:', fetchError)
    }

    const currentReview = existingReview as ReviewItem | null

    // Calcular novo intervalo baseado em SM-2
    let newInterval: number
    let newEaseFactor: number
    let reviewCount: number

    if (!currentReview) {
      // Primeiro registro
      newInterval = REVIEW_INTERVALS[0] || 1
      newEaseFactor = 2.5
      reviewCount = 1
    } else {
      reviewCount = (currentReview.review_count || 0) + 1
      newEaseFactor = Math.max(1.3, currentReview.ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

      if (q < 3) {
        // Resposta incorreta - resetar para 1 dia
        newInterval = 1
      } else {
        // Resposta correta - aplicar intervalo
        const intervalIndex = Math.min(reviewCount - 1, 5)
        newInterval = REVIEW_INTERVALS[intervalIndex] || 30
      }
    }

    // Calcular proxima data de revisao
    const nextReviewDate = addDays(new Date(), newInterval)

    // Upsert no banco
    const { error: upsertError } = await supabase.from('review_schedule').upsert(
      {
        user_id: userId,
        content_id: contentId,
        content_type: contentType,
        last_seen: new Date().toISOString(),
        next_review: nextReviewDate.toISOString(),
        interval_days: newInterval,
        ease_factor: newEaseFactor,
        review_count: reviewCount,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,content_type,content_id',
      }
    )

    if (upsertError) {
      console.error('[spaced-repetition] Erro ao upsert review:', upsertError)
    }

    return {
      nextReviewDate,
      interval: newInterval,
      easeFactor: newEaseFactor,
    }
  } catch (error) {
    console.error('[spaced-repetition] Erro em recordReviewResult:', error)
    return {
      nextReviewDate: addDays(new Date(), isCorrect ? 7 : 1),
      interval: isCorrect ? 7 : 1,
      easeFactor: 2.5,
    }
  }
}

/**
 * Obter estatisticas de revisao do usuario
 */
export async function getReviewStats(userId: string) {
  const defaultStats = {
    total: 0,
    due: 0,
    overdue: 0,
    questoes: 0,
    flashcards: 0,
    averageEaseFactor: '0',
  }

  try {
    const supabase = createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'review_schedule'))) {
      return defaultStats
    }

    const { data, error } = await supabase.from('review_schedule').select('*').eq('user_id', userId)

    if (error) {
      console.error('[spaced-repetition] Erro ao buscar stats:', error)
      return defaultStats
    }

    const items = (data as ReviewItem[]) || []
    const now = new Date()

    return {
      total: items.length,
      due: items.filter((item) => new Date(item.next_review) <= now).length,
      overdue: items.filter(
        (item) => new Date(item.next_review) <= now && differenceInDays(now, new Date(item.next_review)) > 0
      ).length,
      questoes: items.filter((item) => item.content_type === 'questao').length,
      flashcards: items.filter((item) => item.content_type === 'flashcard').length,
      averageEaseFactor:
        items.length > 0
          ? (items.reduce((sum, item) => sum + item.ease_factor, 0) / items.length).toFixed(2)
          : '0',
    }
  } catch (error) {
    console.error('[spaced-repetition] Erro em getReviewStats:', error)
    return defaultStats
  }
}

/**
 * Obter proxima data de revisao de um item
 */
export async function getNextReviewDate(
  userId: string,
  contentId: string,
  contentType: 'questao' | 'flashcard'
): Promise<Date | null> {
  try {
    const supabase = createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'review_schedule'))) {
      return null
    }

    const { data, error } = await supabase
      .from('review_schedule')
      .select('next_review')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('[spaced-repetition] Erro ao buscar next review:', error)
      return null
    }

    return new Date((data as any).next_review)
  } catch (error) {
    console.error('[spaced-repetition] Erro em getNextReviewDate:', error)
    return null
  }
}

/**
 * Resetar agendamento de revisao
 */
export async function resetReviewSchedule(
  userId: string,
  contentType?: 'questao' | 'flashcard'
): Promise<number> {
  try {
    const supabase = createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'review_schedule'))) {
      return 0
    }

    let query = supabase.from('review_schedule').delete().eq('user_id', userId)

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { count, error } = await query

    if (error) {
      console.error('[spaced-repetition] Erro ao resetar:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('[spaced-repetition] Erro em resetReviewSchedule:', error)
    return 0
  }
}

/**
 * Obter recomendacoes de revisao com base em pontos fracos
 */
export async function getReviewRecommendations(userId: string, limit: number = 5) {
  try {
    const supabase = createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'weak_topics'))) {
      return []
    }

    const { data: weakTopics, error } = await supabase
      .from('weak_topics')
      .select('*')
      .eq('user_id', userId)
      .gt('error_rate', 0.3)
      .order('error_rate', { ascending: false })
      .limit(limit)

    if (error && error.code !== 'PGRST116') {
      console.error('[spaced-repetition] Erro ao buscar weak topics:', error)
      return []
    }

    return (weakTopics || []).map((topic: any) => ({
      subtema: topic.subtema,
      area_name: topic.area_name,
      error_rate: topic.error_rate,
      priority: topic.error_rate > 0.6 ? 'high' : topic.error_rate > 0.4 ? 'medium' : 'low',
    }))
  } catch (error) {
    console.error('[spaced-repetition] Erro em getReviewRecommendations:', error)
    return []
  }
}

/**
 * Atualizar ponto fraco automaticamente apos resposta
 */
export async function updateWeakTopicAfterAnswer(
  userId: string,
  subtema: string,
  areaName: string,
  isCorrect: boolean
) {
  try {
    const supabase = createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'weak_topics'))) {
      return
    }

    // Buscar ponto fraco atual
    const { data: existing, error: fetchError } = await supabase
      .from('weak_topics')
      .select('*')
      .eq('user_id', userId)
      .eq('subtema', subtema)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('[spaced-repetition] Erro ao buscar weak topic:', fetchError)
      return
    }

    const current = existing as any

    if (!current) {
      // Criar novo
      const { error } = await supabase.from('weak_topics').insert({
        user_id: userId,
        subtema: subtema,
        area_name: areaName,
        error_rate: isCorrect ? 0 : 1,
        total_attempts: 1,
        correct_attempts: isCorrect ? 1 : 0,
      })

      if (error) console.error('[spaced-repetition] Erro ao inserir weak topic:', error)
    } else {
      // Atualizar existente
      const newTotal = current.total_attempts + 1
      const newCorrect = current.correct_attempts + (isCorrect ? 1 : 0)
      const newErrorRate = (newTotal - newCorrect) / newTotal

      const { error } = await supabase
        .from('weak_topics')
        .update({
          total_attempts: newTotal,
          correct_attempts: newCorrect,
          error_rate: newErrorRate,
          last_updated: new Date().toISOString(),
        })
        .eq('id', current.id)

      if (error) console.error('[spaced-repetition] Erro ao atualizar weak topic:', error)
    }
  } catch (error) {
    console.error('[spaced-repetition] Erro em updateWeakTopicAfterAnswer:', error)
  }
}
