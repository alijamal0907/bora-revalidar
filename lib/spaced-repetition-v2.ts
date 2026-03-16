'use server'

import { createClient } from '@supabase/supabase-js'
import { differenceInDays, addDays } from 'date-fns'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

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
 * Algoritmo de Espaçamento de Revisão (SM-2 melhorado)
 * Baseado em: https://en.wikipedia.org/wiki/Spaced_repetition#SM-2
 *
 * Regras:
 * - Erro 1ª vez: revisar em 1 dia
 * - Erro novamente: revisar em 3 dias
 * - Depois: 7 dias
 * - Depois: 15 dias
 * - Depois: 30 dias
 */

const REVIEW_INTERVALS = {
  0: 1, // Primeira revisão em 1 dia
  1: 3, // Segunda revisão em 3 dias
  2: 7, // Terceira revisão em 7 dias
  3: 15, // Quarta revisão em 15 dias
  4: 30, // Quinta revisão em 30 dias
  5: 60, // Sexta revisão em 60 dias
}

/**
 * Obter itens vencidos para revisão
 */
export async function getDueReviewItems(userId: string, contentType?: 'questao' | 'flashcard'): Promise<ReviewItem[]> {
  try {
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

    if (error) throw error
    return (data as ReviewItem[]) || []
  } catch (error) {
    console.error('[v0] Erro ao buscar itens de revisão:', error)
    return []
  }
}

/**
 * Registrar resultado de revisão e atualizar agendamento
 *
 * @param userId - ID do usuário
 * @param contentId - ID do conteúdo
 * @param contentType - Tipo de conteúdo
 * @param isCorrect - Se a resposta estava correta
 * @param quality - Qualidade da resposta (0-5): 0=completo erro, 5=perfeito
 */
export async function recordReviewResult(
  userId: string,
  contentId: string,
  contentType: 'questao' | 'flashcard',
  isCorrect: boolean,
  quality: number = isCorrect ? 4 : 1,
) {
  try {
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
      throw fetchError
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
      newEaseFactor = Math.max(
        1.3,
        currentReview.ease_factor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02),
      )

      if (q < 3) {
        // Resposta incorreta - resetar para 1 dia
        newInterval = 1
      } else {
        // Resposta correta - aplicar intervalo
        const intervalIndex = Math.min(reviewCount - 1, 5)
        newInterval = REVIEW_INTERVALS[intervalIndex as keyof typeof REVIEW_INTERVALS] || 30
      }
    }

    // Calcular próxima data de revisão
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
      },
    )

    if (upsertError) throw upsertError

    console.log('[v0] Resultado de revisão registrado:', {
      contentId,
      quality: q,
      nextInterval: newInterval,
      easeFactor: newEaseFactor,
    })

    return {
      nextReviewDate,
      interval: newInterval,
      easeFactor: newEaseFactor,
    }
  } catch (error) {
    console.error('[v0] Erro ao registrar resultado de revisão:', error)
    throw error
  }
}

/**
 * Obter estatísticas de revisão do usuário
 */
export async function getReviewStats(userId: string) {
  try {
    const { data, error } = await supabase
      .from('review_schedule')
      .select('*')
      .eq('user_id', userId)

    if (error) throw error

    const items = (data as ReviewItem[]) || []
    const now = new Date()

    const stats = {
      total: items.length,
      due: items.filter((item) => new Date(item.next_review) <= now).length,
      overdue: items.filter(
        (item) => new Date(item.next_review) <= now && differenceInDays(now, new Date(item.next_review)) > 0,
      ).length,
      questoes: items.filter((item) => item.content_type === 'questao').length,
      flashcards: items.filter((item) => item.content_type === 'flashcard').length,
      averageEaseFactor: items.length > 0 ? (items.reduce((sum, item) => sum + item.ease_factor, 0) / items.length).toFixed(2) : '0',
    }

    return stats
  } catch (error) {
    console.error('[v0] Erro ao obter estatísticas de revisão:', error)
    return {
      total: 0,
      due: 0,
      overdue: 0,
      questoes: 0,
      flashcards: 0,
      averageEaseFactor: '0',
    }
  }
}

/**
 * Obter próxima data de revisão de um item
 */
export async function getNextReviewDate(
  userId: string,
  contentId: string,
  contentType: 'questao' | 'flashcard',
): Promise<Date | null> {
  try {
    const { data, error } = await supabase
      .from('review_schedule')
      .select('next_review')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .eq('content_type', contentType)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Não encontrado
      throw error
    }

    return new Date((data as any).next_review)
  } catch (error) {
    console.error('[v0] Erro ao obter próxima data de revisão:', error)
    return null
  }
}

/**
 * Resetar agendamento de revisão (para quando o usuário quer estudar desde o início)
 */
export async function resetReviewSchedule(
  userId: string,
  contentType?: 'questao' | 'flashcard',
): Promise<number> {
  try {
    let query = supabase.from('review_schedule').delete().eq('user_id', userId)

    if (contentType) {
      query = query.eq('content_type', contentType)
    }

    const { count, error } = await query

    if (error) throw error

    console.log('[v0] Agendamento de revisão resetado:', count)
    return count || 0
  } catch (error) {
    console.error('[v0] Erro ao resetar agendamento:', error)
    throw error
  }
}

/**
 * Obter recomendações de revisão com base em pontos fracos
 */
export async function getReviewRecommendations(userId: string, limit: number = 5) {
  try {
    // Buscar temas fracos
    const { data: weakTopics, error: weakError } = await supabase
      .from('weak_topics')
      .select('*')
      .eq('user_id', userId)
      .gt('error_rate', 0.3)
      .order('error_rate', { ascending: false })
      .limit(limit)

    if (weakError && weakError.code !== 'PGRST116') {
      throw weakError
    }

    return (weakTopics || []).map((topic: any) => ({
      subtema: topic.subtema,
      area_name: topic.area_name,
      error_rate: topic.error_rate,
      priority: topic.error_rate > 0.6 ? 'high' : topic.error_rate > 0.4 ? 'medium' : 'low',
    }))
  } catch (error) {
    console.error('[v0] Erro ao obter recomendações de revisão:', error)
    return []
  }
}

/**
 * Atualizar ponto fraco automaticamente após resposta
 */
export async function updateWeakTopicAfterAnswer(
  userId: string,
  subtema: string,
  areaName: string,
  isCorrect: boolean,
) {
  try {
    // Buscar ponto fraco atual
    const { data: existing, error: fetchError } = await supabase
      .from('weak_topics')
      .select('*')
      .eq('user_id', userId)
      .eq('subtema', subtema)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError
    }

    const current = existing as any

    if (!current) {
      // Criar novo
      await supabase.from('weak_topics').insert({
        user_id: userId,
        subtema: subtema,
        area_name: areaName,
        error_rate: isCorrect ? 0 : 1,
        total_attempts: 1,
        correct_attempts: isCorrect ? 1 : 0,
      })
    } else {
      // Atualizar existente
      const newTotal = current.total_attempts + 1
      const newCorrect = current.correct_attempts + (isCorrect ? 1 : 0)
      const newErrorRate = (newTotal - newCorrect) / newTotal

      await supabase
        .from('weak_topics')
        .update({
          total_attempts: newTotal,
          correct_attempts: newCorrect,
          error_rate: newErrorRate,
          last_updated: new Date().toISOString(),
        })
        .eq('id', current.id)
    }
  } catch (error) {
    console.error('[v0] Erro ao atualizar ponto fraco:', error)
  }
}
