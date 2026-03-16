import { createClient } from '@/lib/supabase/client'

// ─── Tipos ────────────────────────────────────────────────────────────────────

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

// ─── Constantes ───────────────────────────────────────────────────────────────

const AREAS_MEDICAS = [
  'Clínica Médica',
  'Clínica Cirúrgica',
  'Pediatria',
  'Ginecologia e Obstetrícia',
  'Medicina Preventiva',
]

// Subtemas reais da tabela questoes, distribuídos pedagogicamente por semana
const WEEKS_CONTENT: Record<number, Record<string, string>> = {
  1: {
    'Clínica Médica': 'Cardiologia',
    'Clínica Cirúrgica': 'Abdome Agudo / Cirurgia Digestiva',
    'Pediatria': 'Neonatologia',
    'Ginecologia e Obstetrícia': 'Pré-natal e Obstetrícia',
    'Medicina Preventiva': 'Políticas Públicas de Saúde',
  },
  2: {
    'Clínica Médica': 'Infectologia',
    'Clínica Cirúrgica': 'Trauma / ATLS',
    'Pediatria': 'Infectologia Pediátrica',
    'Ginecologia e Obstetrícia': 'Ginecologia Geral',
    'Medicina Preventiva': 'Epidemiologia',
  },
  3: {
    'Clínica Médica': 'Pneumologia',
    'Clínica Cirúrgica': 'Ortopedia e Traumatologia',
    'Pediatria': 'Pneumologia Pediátrica',
    'Ginecologia e Obstetrícia': 'IST / Infecções Ginecológicas',
    'Medicina Preventiva': 'APS / Saúde da Família',
  },
  4: {
    'Clínica Médica': 'Gastroenterologia',
    'Clínica Cirúrgica': 'Oncologia Cirúrgica',
    'Pediatria': 'Crescimento e Desenvolvimento',
    'Ginecologia e Obstetrícia': 'Oncologia Ginecológica',
    'Medicina Preventiva': 'Imunizações e Vigilância Epidemiológica',
  },
  5: {
    'Clínica Médica': 'Endocrinologia',
    'Clínica Cirúrgica': 'Urologia / Proctologia',
    'Pediatria': 'Gastroenterologia Pediátrica',
    'Ginecologia e Obstetrícia': 'Endocrinologia Reprodutiva',
    'Medicina Preventiva': 'Ética Médica e Bioética',
  },
  6: {
    'Clínica Médica': 'Nefrologia / Urologia',
    'Clínica Cirúrgica': 'Pós-operatório / Complicações Cirúrgicas',
    'Pediatria': 'Neurologia Pediátrica',
    'Ginecologia e Obstetrícia': 'Pré-natal e Obstetrícia',
    'Medicina Preventiva': 'Epidemiologia',
  },
  7: {
    'Clínica Médica': 'Neurologia',
    'Clínica Cirúrgica': 'Feridas / Técnica Cirúrgica',
    'Pediatria': 'Hematologia / Oncologia Pediátrica',
    'Ginecologia e Obstetrícia': 'Ginecologia Geral',
    'Medicina Preventiva': 'APS / Saúde da Família',
  },
  8: {
    'Clínica Médica': 'Hematologia',
    'Clínica Cirúrgica': 'Urgências Clínicas / Outros',
    'Pediatria': 'Imunizações e Vigilância Epidemiológica',
    'Ginecologia e Obstetrícia': 'IST / Infecções Ginecológicas',
    'Medicina Preventiva': 'Políticas Públicas de Saúde',
  },
  9: {
    'Clínica Médica': 'Reumatologia',
    'Clínica Cirúrgica': 'Abdome Agudo / Cirurgia Digestiva',
    'Pediatria': 'Urgências Pediátricas',
    'Ginecologia e Obstetrícia': 'Oncologia Ginecológica',
    'Medicina Preventiva': 'Imunizações e Vigilância Epidemiológica',
  },
  10: {
    'Clínica Médica': 'Urgências Clínicas / Outros',
    'Clínica Cirúrgica': 'Trauma / ATLS',
    'Pediatria': 'Saúde da Criança e Adolescente',
    'Ginecologia e Obstetrícia': 'Endocrinologia Reprodutiva',
    'Medicina Preventiva': 'Ética Médica e Bioética',
  },
  11: {
    'Clínica Médica': 'Cardiologia',
    'Clínica Cirúrgica': 'Ortopedia e Traumatologia',
    'Pediatria': 'Neonatologia',
    'Ginecologia e Obstetrícia': 'Pré-natal e Obstetrícia',
    'Medicina Preventiva': 'APS / Saúde da Família',
  },
  12: {
    'Clínica Médica': 'Psiquiatria',
    'Clínica Cirúrgica': 'Oncologia Cirúrgica',
    'Pediatria': 'Psiquiatria / Comportamento',
    'Ginecologia e Obstetrícia': 'Ginecologia Geral',
    'Medicina Preventiva': 'Epidemiologia',
  },
  13: {
    'Clínica Médica': 'Oncologia / Hematologia',
    'Clínica Cirúrgica': 'Urologia / Proctologia',
    'Pediatria': 'Endocrinologia / Adolescência',
    'Ginecologia e Obstetrícia': 'IST / Infecções Ginecológicas',
    'Medicina Preventiva': 'Políticas Públicas de Saúde',
  },
  14: {
    'Clínica Médica': 'Dermatologia',
    'Clínica Cirúrgica': 'Feridas / Técnica Cirúrgica',
    'Pediatria': 'Ortopedia / Cirurgia Pediátrica',
    'Ginecologia e Obstetrícia': 'Oncologia Ginecológica',
    'Medicina Preventiva': 'Imunizações e Vigilância Epidemiológica',
  },
  15: {
    'Clínica Médica': 'Geriatria',
    'Clínica Cirúrgica': 'Pós-operatório / Complicações Cirúrgicas',
    'Pediatria': 'Infectologia Pediátrica',
    'Ginecologia e Obstetrícia': 'Endocrinologia Reprodutiva',
    'Medicina Preventiva': 'Ética Médica e Bioética',
  },
  16: {
    'Clínica Médica': 'Oftalmologia',
    'Clínica Cirúrgica': 'Urgências Clínicas / Outros',
    'Pediatria': 'Crescimento e Desenvolvimento',
    'Ginecologia e Obstetrícia': 'Pré-natal e Obstetrícia',
    'Medicina Preventiva': 'APS / Saúde da Família',
  },
  17: {
    'Clínica Médica': 'Reumatologia / Ortopedia',
    'Clínica Cirúrgica': 'Abdome Agudo / Cirurgia Digestiva',
    'Pediatria': 'Neurologia Pediátrica',
    'Ginecologia e Obstetrícia': 'Ginecologia Geral',
    'Medicina Preventiva': 'Epidemiologia',
  },
  18: {
    'Clínica Médica': 'Clínica Geral',
    'Clínica Cirúrgica': 'Trauma / ATLS',
    'Pediatria': 'Pneumologia Pediátrica',
    'Ginecologia e Obstetrícia': 'IST / Infecções Ginecológicas',
    'Medicina Preventiva': 'Imunizações e Vigilância Epidemiológica',
  },
  19: {
    'Clínica Médica': 'Urgências Clínicas / Outros',
    'Clínica Cirúrgica': 'Ortopedia e Traumatologia',
    'Pediatria': 'Hematologia / Oncologia Pediátrica',
    'Ginecologia e Obstetrícia': 'Oncologia Ginecológica',
    'Medicina Preventiva': 'Políticas Públicas de Saúde',
  },
  20: {
    'Clínica Médica': 'Cardiologia',
    'Clínica Cirúrgica': 'Abdome Agudo / Cirurgia Digestiva',
    'Pediatria': 'Saúde da Criança e Adolescente',
    'Ginecologia e Obstetrícia': 'Pré-natal e Obstetrícia',
    'Medicina Preventiva': 'Epidemiologia',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getDb() {
  return createClient()
}

function generateMockProgress(userId: string): UserProgress[] {
  const progress: UserProgress[] = []
  for (let week = 1; week <= 20; week++) {
    for (const area of AREAS_MEDICAS) {
      progress.push({
        id: `mock-${week}-${area}`,
        user_id: userId,
        week_number: week,
        area_name: area,
        subtopic_name: WEEKS_CONTENT[week]?.[area] ?? `${area} – Semana ${week}`,
        status_completed: false,
        completed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
  }
  return progress
}

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

// ─── Funções exportadas ───────────────────────────────────────────────────────

export async function initializeStudyPlan(userId: string) {
  try {
    const supabase = getDb()
    if (!supabase) return

    // Verifica se já existe progresso para este usuário
    const { data: existing } = await supabase
      .from('user_progress')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (existing && existing.length > 0) return

    // Cria 100 registros (20 semanas × 5 áreas) com subtemas inline
    const records = []
    for (let week = 1; week <= 20; week++) {
      for (const area of AREAS_MEDICAS) {
        records.push({
          user_id: userId,
          week_number: week,
          area_name: area,
          subtopic_name: WEEKS_CONTENT[week]?.[area] ?? `${area} – Semana ${week}`,
          status_completed: false,
          completed_at: null,
        })
      }
    }

    const { error } = await supabase.from('user_progress').insert(records)
    if (error && error.code !== '42P01') {
      console.error('[gamification] Erro ao inicializar plano:', error)
    }
  } catch (error) {
    console.error('[gamification] Erro em initializeStudyPlan:', error)
  }
}

export async function getUserProgress(userId: string): Promise<UserProgress[]> {
  try {
    const supabase = getDb()
    if (!supabase) return generateMockProgress(userId)

    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .order('week_number', { ascending: true })

    if (error) {
      // tabela ainda não existe
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return generateMockProgress(userId)
      }
      console.error('[gamification] Erro ao buscar progresso:', error)
      return generateMockProgress(userId)
    }

    if (!data || data.length === 0) return generateMockProgress(userId)

    return data as UserProgress[]
  } catch (error) {
    console.error('[gamification] Erro em getUserProgress:', error)
    return generateMockProgress(userId)
  }
}

export async function getUserCurrentWeek(userId: string): Promise<number> {
  try {
    const progress = await getUserProgress(userId)
    if (!progress || progress.length === 0) return 1

    for (let week = 1; week <= 20; week++) {
      const weekModules = progress.filter((p) => p.week_number === week)
      const completedCount = weekModules.filter((p) => p.status_completed).length
      if (completedCount < AREAS_MEDICAS.length) return week
    }

    return 21
  } catch {
    return 1
  }
}

export async function completeModule(userId: string, week: number, area: string) {
  try {
    const supabase = getDb()
    if (!supabase) return

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

    await addWeeklyPoints(userId, 50)
  } catch (error) {
    console.error('[gamification] Erro em completeModule:', error)
    throw error
  }
}

export async function getUserWeakTopics(userId: string, limit = 10): Promise<WeakTopic[]> {
  try {
    const supabase = getDb()
    if (!supabase) return []

    const { data, error } = await supabase
      .from('weak_topics')
      .select('*')
      .eq('user_id', userId)
      .gt('error_rate', 0.4)
      .order('error_rate', { ascending: false })
      .limit(limit)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) return []
      console.error('[gamification] Erro ao buscar temas fracos:', error)
      return []
    }

    return (data as WeakTopic[]) || []
  } catch {
    return []
  }
}

export async function addWeeklyPoints(userId: string, points: number) {
  try {
    const supabase = getDb()
    if (!supabase) return

    const { weekStartStr, weekEndStr } = getCurrentWeekDates()

    const { data: existing } = await supabase
      .from('weekly_points')
      .select('id, points')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartStr)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('weekly_points')
        .update({ points: existing.points + points, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
    } else {
      await supabase.from('weekly_points').insert({
        user_id: userId,
        week_start_date: weekStartStr,
        week_end_date: weekEndStr,
        points,
      })
    }
  } catch (error) {
    console.error('[gamification] Erro em addWeeklyPoints:', error)
  }
}

export async function getWeeklyRanking(limit = 10) {
  try {
    const supabase = getDb()
    if (!supabase) return []

    const { weekStartStr } = getCurrentWeekDates()

    const { data, error } = await supabase
      .from('weekly_points')
      .select('id, user_id, points, week_start_date')
      .eq('week_start_date', weekStartStr)
      .order('points', { ascending: false })
      .limit(limit)

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) return []
      console.error('[gamification] Erro ao obter ranking:', error)
      return []
    }

    return (data || []).map((item: any, index: number) => ({
      position: index + 1,
      userId: item.user_id,
      email: '',
      name: `Estudante ${index + 1}`,
      points: item.points,
      medal: index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null,
    }))
  } catch {
    return []
  }
}

export async function getUserRankingPosition(userId: string) {
  try {
    const supabase = getDb()
    if (!supabase) return { position: 0, userPoints: 0 }

    const { weekStartStr } = getCurrentWeekDates()

    const { data: userRow } = await supabase
      .from('weekly_points')
      .select('points')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartStr)
      .maybeSingle()

    const userPoints = userRow?.points ?? 0

    const { data: allPoints } = await supabase
      .from('weekly_points')
      .select('user_id, points')
      .eq('week_start_date', weekStartStr)
      .order('points', { ascending: false })

    const position = (allPoints || []).findIndex((item: any) => item.user_id === userId) + 1

    return { position: position || 0, userPoints }
  } catch {
    return { position: 0, userPoints: 0 }
  }
}

export async function recordQuestionAttempt(
  userId: string,
  questionId: string,
  subtema: string,
  areaName: string,
  isCorrect: boolean,
) {
  try {
    const supabase = getDb()
    const points = isCorrect ? 10 : 2
    await addWeeklyPoints(userId, points)

    if (!supabase) return

    await supabase.from('user_question_attempts').insert({
      user_id: userId,
      question_id: questionId,
      subtema,
      area_name: areaName,
      is_correct: isCorrect,
      attempted_at: new Date().toISOString(),
    })

    // Atualizar temas fracos
    const { data: existing } = await supabase
      .from('weak_topics')
      .select('*')
      .eq('user_id', userId)
      .eq('subtema', subtema)
      .maybeSingle()

    if (existing) {
      const newTotal = existing.total_attempts + 1
      const newCorrect = existing.correct_attempts + (isCorrect ? 1 : 0)
      const newErrorRate = 1 - newCorrect / newTotal

      await supabase
        .from('weak_topics')
        .update({
          total_attempts: newTotal,
          correct_attempts: newCorrect,
          error_rate: newErrorRate,
          last_updated: new Date().toISOString(),
        })
        .eq('id', existing.id)
    } else if (!isCorrect) {
      await supabase.from('weak_topics').insert({
        user_id: userId,
        subtema,
        area_name: areaName,
        total_attempts: 1,
        correct_attempts: 0,
        error_rate: 1.0,
        last_updated: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error('[gamification] Erro em recordQuestionAttempt:', error)
  }
}

export async function getUserWeeklyPoints(userId: string): Promise<number> {
  try {
    const supabase = getDb()
    if (!supabase) return 0

    const { weekStartStr } = getCurrentWeekDates()

    const { data } = await supabase
      .from('weekly_points')
      .select('points')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartStr)
      .maybeSingle()

    return data?.points ?? 0
  } catch {
    return 0
  }
}
