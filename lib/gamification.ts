'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos
export interface UserProgress {
  id: string
  user_id: string
  week_number: number
  area_name: string
  subtopic_name: string
  status_completed: boolean
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface WeeklyPoints {
  id: string
  user_id: string
  points: number
  week_start_date: string
  week_end_date: string
  created_at: string
  updated_at: string
}

export interface WeakTopic {
  id: string
  user_id: string
  subtema: string
  area_name: string
  error_rate: number
  total_attempts: number
  correct_attempts: number
  last_updated: string
  created_at: string
}

// Constantes
const AREAS_MEDICAS = [
  'Clínica Médica',
  'Cirurgia',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Medicina Preventiva',
]

const WEEKS_CONTENT = {
  1: {
    'Clínica Médica': 'Hipertensão arterial',
    'Cirurgia': 'Abdome agudo',
    'Pediatria': 'Puericultura',
    'Ginecologia e Obstetrícia': 'Pré-natal de baixo risco',
    'Medicina Preventiva': 'SUS princípios',
  },
  2: {
    'Clínica Médica': 'Diabetes mellitus',
    'Cirurgia': 'Colelitíase',
    'Pediatria': 'Aleitamento materno',
    'Ginecologia e Obstetrícia': 'Alterações do primeiro trimestre',
    'Medicina Preventiva': 'Atenção primária',
  },
  3: {
    'Clínica Médica': 'Dislipidemia',
    'Cirurgia': 'Apendicite aguda',
    'Pediatria': 'Vacinação',
    'Ginecologia e Obstetrícia': 'Abortamento',
    'Medicina Preventiva': 'Vigilância epidemiológica',
  },
  // Adicionar mais semanas conforme necessário
}

/**
 * Inicializar o plano de estudo para um novo usuário
 */
export async function initializeStudyPlan(userId: string) {
  try {
    // Verificar se já existe progresso
    const { data: existing } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (existing && existing.length > 0) {
      console.log('[v0] Plano de estudo já existe para', userId)
      return
    }

    // Criar 100 registros (20 semanas × 5 áreas)
    const records: UserProgress[] = []

    for (let week = 1; week <= 20; week++) {
      for (const area of AREAS_MEDICAS) {
        const subtopicName =
          WEEKS_CONTENT[week as keyof typeof WEEKS_CONTENT]?.[area as keyof typeof WEEKS_CONTENT[1]] ||
          `${area} - Semana ${week}`

        records.push({
          id: '',
          user_id: userId,
          week_number: week,
          area_name: area,
          subtopic_name: subtopicName,
          status_completed: false,
          completed_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
      }
    }

    const { error } = await supabase.from('user_progress').insert(records)

    if (error) {
      console.error('[v0] Erro ao inicializar plano de estudo:', error)
      throw error
    }

    console.log('[v0] Plano de estudo inicializado para', userId)
  } catch (error) {
    console.error('[v0] Erro em initializeStudyPlan:', error)
    throw error
  }
}

/**
 * Obter progresso do usuário por semana
 */
export async function getUserProgress(userId: string) {
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .order('week_number', { ascending: true })

    if (error) throw error
    return (data as UserProgress[]) || []
  } catch (error) {
    console.error('[v0] Erro ao buscar progresso:', error)
    return []
  }
}

/**
 * Obter semana atual do usuário
 */
export async function getUserCurrentWeek(userId: string): Promise<number> {
  try {
    const progress = await getUserProgress(userId)

    if (!progress || progress.length === 0) return 1

    // Encontrar a primeira semana que não está 100% completa
    for (let week = 1; week <= 20; week++) {
      const weekModules = progress.filter((p) => p.week_number === week)
      const completedCount = weekModules.filter((p) => p.status_completed).length

      if (completedCount < 5) {
        return week
      }
    }

    // Se todas as semanas foram completas
    return 21
  } catch (error) {
    console.error('[v0] Erro ao obter semana atual:', error)
    return 1
  }
}

/**
 * Marcar módulo como completo
 */
export async function completeModule(userId: string, week: number, area: string) {
  try {
    const { error } = await supabase
      .from('user_progress')
      .update({
        status_completed: true,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('week_number', week)
      .eq('area_name', area)

    if (error) throw error

    // Adicionar pontos ao ranking semanal
    await addWeeklyPoints(userId, 50)

    console.log('[v0] Módulo marcado como completo:', { week, area })
  } catch (error) {
    console.error('[v0] Erro ao completar módulo:', error)
    throw error
  }
}

/**
 * Obter temas fracos do usuário
 */
export async function getUserWeakTopics(userId: string, limit: number = 10): Promise<WeakTopic[]> {
  try {
    const { data, error } = await supabase
      .from('weak_topics')
      .select('*')
      .eq('user_id', userId)
      .gt('error_rate', 0.4)
      .order('error_rate', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data as WeakTopic[]) || []
  } catch (error) {
    console.error('[v0] Erro ao buscar temas fracos:', error)
    return []
  }
}

/**
 * Adicionar pontos semanais
 */
export async function addWeeklyPoints(userId: string, points: number) {
  try {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    // Upsert: se existe, incrementa os pontos
    const { error } = await supabase.from('weekly_points').upsert(
      {
        user_id: userId,
        week_start_date: weekStartStr,
        week_end_date: weekEndStr,
        points: points,
      },
      {
        onConflict: 'user_id,week_start_date',
      },
    )

    if (error) throw error

    console.log('[v0] Pontos adicionados:', points)
  } catch (error) {
    console.error('[v0] Erro ao adicionar pontos:', error)
    throw error
  }
}

/**
 * Obter ranking semanal
 */
export async function getWeeklyRanking(limit: number = 10) {
  try {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)

    const weekStartStr = weekStart.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('weekly_points')
      .select(
        `
        id,
        user_id,
        points,
        week_start_date,
        auth.users!inner (email, user_metadata)
      `,
      )
      .eq('week_start_date', weekStartStr)
      .order('points', { ascending: false })
      .limit(limit)

    if (error) throw error

    return (data || []).map((item: any, index: number) => ({
      position: index + 1,
      userId: item.user_id,
      email: item.auth?.users?.email || 'Anônimo',
      name: item.auth?.users?.user_metadata?.name || 'Usuário',
      points: item.points,
      medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null,
    }))
  } catch (error) {
    console.error('[v0] Erro ao obter ranking:', error)
    return []
  }
}

/**
 * Obter posição do usuário no ranking
 */
export async function getUserRankingPosition(userId: string) {
  try {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)

    const weekStartStr = weekStart.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('weekly_points')
      .select('points')
      .eq('week_start_date', weekStartStr)
      .order('points', { ascending: false })

    if (error) throw error

    const position = (data || []).findIndex((item: any) => item.user_id === userId) + 1

    return {
      position: position || 0,
      userPoints: data?.[0]?.points || 0,
    }
  } catch (error) {
    console.error('[v0] Erro ao obter posição no ranking:', error)
    return { position: 0, userPoints: 0 }
  }
}

/**
 * Registrar tentativa de questão
 */
export async function recordQuestionAttempt(
  userId: string,
  questionId: string,
  subtema: string,
  areaName: string,
  isCorrect: boolean,
) {
  try {
    const { error } = await supabase.from('user_question_attempts').insert({
      user_id: userId,
      question_id: questionId,
      subtema: subtema,
      area_name: areaName,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
    })

    if (error) throw error

    // Adicionar pontos
    const points = isCorrect ? 10 : 2
    await addWeeklyPoints(userId, points)

    console.log('[v0] Tentativa registrada:', { questionId, isCorrect, points })
  } catch (error) {
    console.error('[v0] Erro ao registrar tentativa:', error)
    throw error
  }
}

/**
 * Obter pontuação semanal do usuário
 */
export async function getUserWeeklyPoints(userId: string): Promise<number> {
  try {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)

    const weekStartStr = weekStart.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('weekly_points')
      .select('points')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartStr)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return data?.points || 0
  } catch (error) {
    console.error('[v0] Erro ao obter pontos semanais:', error)
    return 0
  }
}
