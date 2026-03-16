'use server'

import { createClient } from '@/lib/supabase/server'

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

const WEEKS_CONTENT: Record<number, Record<string, string>> = {
  1: {
    'Clínica Médica': 'Hipertensão arterial',
    Cirurgia: 'Abdome agudo',
    Pediatria: 'Puericultura',
    'Ginecologia e Obstetrícia': 'Pré-natal de baixo risco',
    'Medicina Preventiva': 'SUS princípios',
  },
  2: {
    'Clínica Médica': 'Diabetes mellitus',
    Cirurgia: 'Colelitíase',
    Pediatria: 'Aleitamento materno',
    'Ginecologia e Obstetrícia': 'Alterações do primeiro trimestre',
    'Medicina Preventiva': 'Atenção primária',
  },
  3: {
    'Clínica Médica': 'Dislipidemia',
    Cirurgia: 'Apendicite aguda',
    Pediatria: 'Vacinação',
    'Ginecologia e Obstetrícia': 'Abortamento',
    'Medicina Preventiva': 'Vigilância epidemiológica',
  },
  4: {
    'Clínica Médica': 'Insuficiência cardíaca',
    Cirurgia: 'Hérnias da parede abdominal',
    Pediatria: 'Diarreias agudas',
    'Ginecologia e Obstetrícia': 'Gestação de alto risco',
    'Medicina Preventiva': 'Indicadores de saúde',
  },
  5: {
    'Clínica Médica': 'DPOC e Asma',
    Cirurgia: 'Trauma torácico',
    Pediatria: 'Infecções respiratórias',
    'Ginecologia e Obstetrícia': 'Doenças da gestação - DHEG',
    'Medicina Preventiva': 'Epidemiologia',
  },
  6: {
    'Clínica Médica': 'Pneumonias',
    Cirurgia: 'Trauma abdominal',
    Pediatria: 'Afecções neonatais',
    'Ginecologia e Obstetrícia': 'Diabetes gestacional',
    'Medicina Preventiva': 'Imunização',
  },
  7: {
    'Clínica Médica': 'Tuberculose',
    Cirurgia: 'TCE',
    Pediatria: 'Doenças exantemáticas',
    'Ginecologia e Obstetrícia': 'Trabalho de parto',
    'Medicina Preventiva': 'Saúde da mulher',
  },
  8: {
    'Clínica Médica': 'ITU',
    Cirurgia: 'Choque',
    Pediatria: 'Meningites',
    'Ginecologia e Obstetrícia': 'Parto normal',
    'Medicina Preventiva': 'Saúde da criança',
  },
  9: {
    'Clínica Médica': 'Insuficiência renal',
    Cirurgia: 'Queimaduras',
    Pediatria: 'Cardiopatias congênitas',
    'Ginecologia e Obstetrícia': 'Cesariana',
    'Medicina Preventiva': 'Saúde do idoso',
  },
  10: {
    'Clínica Médica': 'Distúrbios hidroeletrolíticos',
    Cirurgia: 'Fraturas',
    Pediatria: 'Distúrbios nutricionais',
    'Ginecologia e Obstetrícia': 'Hemorragias pós-parto',
    'Medicina Preventiva': 'Saúde mental',
  },
  11: {
    'Clínica Médica': 'AVC',
    Cirurgia: 'Cirurgia vascular',
    Pediatria: 'Asma na infância',
    'Ginecologia e Obstetrícia': 'Puerpério',
    'Medicina Preventiva': 'DST/AIDS',
  },
  12: {
    'Clínica Médica': 'Epilepsia',
    Cirurgia: 'Câncer de mama',
    Pediatria: 'Bronquiolite',
    'Ginecologia e Obstetrícia': 'Anticoncepção',
    'Medicina Preventiva': 'Hepatites virais',
  },
  13: {
    'Clínica Médica': 'Anemias',
    Cirurgia: 'Câncer colorretal',
    Pediatria: 'ITU pediátrica',
    'Ginecologia e Obstetrícia': 'Climatério',
    'Medicina Preventiva': 'Tuberculose - saúde pública',
  },
  14: {
    'Clínica Médica': 'Leucemias e linfomas',
    Cirurgia: 'Câncer de próstata',
    Pediatria: 'Febre reumática',
    'Ginecologia e Obstetrícia': 'Sangramento uterino anormal',
    'Medicina Preventiva': 'Hanseníase',
  },
  15: {
    'Clínica Médica': 'Hipotireoidismo e hipertireoidismo',
    Cirurgia: 'Câncer gástrico',
    Pediatria: 'Epilepsia na infância',
    'Ginecologia e Obstetrícia': 'Miomatose',
    'Medicina Preventiva': 'Dengue e arboviroses',
  },
  16: {
    'Clínica Médica': 'Doenças da tireoide',
    Cirurgia: 'Pancreatite',
    Pediatria: 'Parasitoses intestinais',
    'Ginecologia e Obstetrícia': 'Endometriose',
    'Medicina Preventiva': 'Saúde do trabalhador',
  },
  17: {
    'Clínica Médica': 'Cirrose e hepatopatias',
    Cirurgia: 'Obstrução intestinal',
    Pediatria: 'Dermatoses pediátricas',
    'Ginecologia e Obstetrícia': 'Infertilidade',
    'Medicina Preventiva': 'Vigilância sanitária',
  },
  18: {
    'Clínica Médica': 'Doenças reumatológicas',
    Cirurgia: 'Abdome agudo vascular',
    Pediatria: 'Urgências pediátricas',
    'Ginecologia e Obstetrícia': 'Oncologia ginecológica',
    'Medicina Preventiva': 'Política de saúde',
  },
  19: {
    'Clínica Médica': 'HIV/AIDS',
    Cirurgia: 'Coloproctologia',
    Pediatria: 'Revisão geral',
    'Ginecologia e Obstetrícia': 'Revisão geral',
    'Medicina Preventiva': 'Gestão em saúde',
  },
  20: {
    'Clínica Médica': 'Revisão e simulados',
    Cirurgia: 'Revisão e simulados',
    Pediatria: 'Simulados finais',
    'Ginecologia e Obstetrícia': 'Simulados finais',
    'Medicina Preventiva': 'Simulados finais',
  },
}

// Helper para verificar se tabela existe
async function tableExists(supabase: any, tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase.from(tableName).select('id').limit(1)
    // Se erro contém "relation does not exist", tabela não existe
    if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Gerar dados de progresso mock para quando tabelas não existem
 */
function generateMockProgress(userId: string): UserProgress[] {
  const progress: UserProgress[] = []

  for (let week = 1; week <= 20; week++) {
    for (const area of AREAS_MEDICAS) {
      const subtopicName = WEEKS_CONTENT[week]?.[area] || `${area} - Semana ${week}`

      progress.push({
        id: `mock-${week}-${area}`,
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

  return progress
}

/**
 * Inicializar o plano de estudo para um novo usuário
 */
export async function initializeStudyPlan(userId: string) {
  try {
    const supabase = await createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'user_progress'))) {
      console.log('[gamification] Tabela user_progress não existe ainda')
      return
    }

    // Verificar se já existe progresso
    const { data: existing } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (existing && existing.length > 0) {
      return
    }

    // Criar 100 registros (20 semanas × 5 áreas)
    const records: Partial<UserProgress>[] = []

    for (let week = 1; week <= 20; week++) {
      for (const area of AREAS_MEDICAS) {
        const subtopicName = WEEKS_CONTENT[week]?.[area] || `${area} - Semana ${week}`

        records.push({
          user_id: userId,
          week_number: week,
          area_name: area,
          subtopic_name: subtopicName,
          status_completed: false,
          completed_at: null,
        })
      }
    }

    const { error } = await supabase.from('user_progress').insert(records)

    if (error) {
      console.error('[gamification] Erro ao inicializar plano:', error)
    }
  } catch (error) {
    console.error('[gamification] Erro em initializeStudyPlan:', error)
  }
}

/**
 * Obter progresso do usuário por semana
 */
export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  try {
    const supabase = await createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'user_progress'))) {
      console.log('[gamification] Retornando dados mock - tabela não existe')
      return generateMockProgress(userId)
    }

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .order('week_number', { ascending: true })

    if (error) {
      console.error('[gamification] Erro ao buscar progresso:', error)
      return generateMockProgress(userId)
    }

    // Se não há dados, retornar mock
    if (!data || data.length === 0) {
      return generateMockProgress(userId)
    }

    return data as UserProgress[]
  } catch (error) {
    console.error('[gamification] Erro em getUserProgress:', error)
    return generateMockProgress(userId)
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

    return 21
  } catch (error) {
    console.error('[gamification] Erro ao obter semana atual:', error)
    return 1
  }
}

/**
 * Marcar módulo como completo
 */
export async function completeModule(userId: string, week: number, area: string) {
  try {
    const supabase = await createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'user_progress'))) {
      console.log('[gamification] Tabela não existe - ignorando completeModule')
      return
    }

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

    if (error) {
      console.error('[gamification] Erro ao completar módulo:', error)
      throw error
    }

    // Adicionar pontos ao ranking semanal
    await addWeeklyPoints(userId, 50)
  } catch (error) {
    console.error('[gamification] Erro em completeModule:', error)
    throw error
  }
}

/**
 * Obter temas fracos do usuário
 */
export async function getUserWeakTopics(userId: string, limit: number = 10): Promise<WeakTopic[]> {
  try {
    const supabase = await createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'weak_topics'))) {
      return []
    }

    const { data, error } = await supabase
      .from('weak_topics')
      .select('*')
      .eq('user_id', userId)
      .gt('error_rate', 0.4)
      .order('error_rate', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[gamification] Erro ao buscar temas fracos:', error)
      return []
    }

    return (data as WeakTopic[]) || []
  } catch (error) {
    console.error('[gamification] Erro em getUserWeakTopics:', error)
    return []
  }
}

/**
 * Obter semana atual (início e fim)
 */
function getCurrentWeekDates() {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const weekStart = new Date(today)
  weekStart.setDate(today.getDate() - dayOfWeek)
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  return {
    weekStartStr: weekStart.toISOString().split('T')[0],
    weekEndStr: weekEnd.toISOString().split('T')[0],
  }
}

/**
 * Adicionar pontos semanais
 */
export async function addWeeklyPoints(userId: string, points: number) {
  try {
    const supabase = await createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'weekly_points'))) {
      console.log('[gamification] Tabela weekly_points não existe')
      return
    }

    const { weekStartStr, weekEndStr } = getCurrentWeekDates()

    // Verificar se já existe registro para esta semana
    const { data: existing } = await supabase
      .from('weekly_points')
      .select('id, points')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartStr)
      .single()

    if (existing) {
      // Atualizar pontos existentes
      const { error } = await supabase
        .from('weekly_points')
        .update({ points: existing.points + points, updated_at: new Date().toISOString() })
        .eq('id', existing.id)

      if (error) console.error('[gamification] Erro ao atualizar pontos:', error)
    } else {
      // Inserir novo registro
      const { error } = await supabase.from('weekly_points').insert({
        user_id: userId,
        week_start_date: weekStartStr,
        week_end_date: weekEndStr,
        points: points,
      })

      if (error) console.error('[gamification] Erro ao inserir pontos:', error)
    }
  } catch (error) {
    console.error('[gamification] Erro em addWeeklyPoints:', error)
  }
}

/**
 * Obter ranking semanal
 */
export async function getWeeklyRanking(limit: number = 10) {
  try {
    const supabase = await createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'weekly_points'))) {
      console.log('[gamification] Tabela weekly_points não existe - retornando ranking vazio')
      return []
    }

    const { weekStartStr } = getCurrentWeekDates()

    const { data, error } = await supabase
      .from('weekly_points')
      .select('id, user_id, points, week_start_date')
      .eq('week_start_date', weekStartStr)
      .order('points', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[gamification] Erro ao obter ranking:', error)
      return []
    }

    return (data || []).map((item: any, index: number) => ({
      position: index + 1,
      userId: item.user_id,
      email: 'usuario@email.com',
      name: `Estudante ${index + 1}`,
      points: item.points,
      medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null,
    }))
  } catch (error) {
    console.error('[gamification] Erro em getWeeklyRanking:', error)
    return []
  }
}

/**
 * Obter posição do usuário no ranking
 */
export async function getUserRankingPosition(userId: string) {
  try {
    const supabase = await createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'weekly_points'))) {
      return { position: 0, userPoints: 0 }
    }

    const { weekStartStr } = getCurrentWeekDates()

    // Buscar pontos do usuário
    const { data: userPointsData } = await supabase
      .from('weekly_points')
      .select('points')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartStr)
      .single()

    const userPoints = userPointsData?.points || 0

    // Buscar todos os pontos para calcular posição
    const { data: allPoints } = await supabase
      .from('weekly_points')
      .select('user_id, points')
      .eq('week_start_date', weekStartStr)
      .order('points', { ascending: false })

    const position = (allPoints || []).findIndex((item: any) => item.user_id === userId) + 1

    return {
      position: position || 0,
      userPoints,
    }
  } catch (error) {
    console.error('[gamification] Erro ao obter posição no ranking:', error)
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
  isCorrect: boolean
) {
  try {
    const supabase = await createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'user_question_attempts'))) {
      // Adicionar pontos mesmo sem tabela
      const points = isCorrect ? 10 : 2
      await addWeeklyPoints(userId, points)
      return
    }

    const { error } = await supabase.from('user_question_attempts').insert({
      user_id: userId,
      question_id: questionId,
      subtema: subtema,
      area_name: areaName,
      is_correct: isCorrect,
      answered_at: new Date().toISOString(),
    })

    if (error) {
      console.error('[gamification] Erro ao registrar tentativa:', error)
    }

    // Adicionar pontos
    const points = isCorrect ? 10 : 2
    await addWeeklyPoints(userId, points)
  } catch (error) {
    console.error('[gamification] Erro em recordQuestionAttempt:', error)
  }
}

/**
 * Obter pontuação semanal do usuário
 */
export async function getUserWeeklyPoints(userId: string): Promise<number> {
  try {
    const supabase = await createClient()

    // Verificar se tabela existe
    if (!(await tableExists(supabase, 'weekly_points'))) {
      return 0
    }

    const { weekStartStr } = getCurrentWeekDates()

    const { data, error } = await supabase
      .from('weekly_points')
      .select('points')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartStr)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('[gamification] Erro ao obter pontos semanais:', error)
      return 0
    }

    return data?.points || 0
  } catch (error) {
    console.error('[gamification] Erro em getUserWeeklyPoints:', error)
    return 0
  }
}
