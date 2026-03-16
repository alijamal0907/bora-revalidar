import { createClient } from '@/lib/supabase/client'
import { initializeUserStudyPlan as initializePlan } from '@/lib/study-plan-complete'

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
  'Ginecologia',
  'Obstetrícia',
  'Medicina Preventiva',
]

const WEEKS_CONTENT: Record<number, Record<string, string>> = {
  1: {
    'Clínica Médica': 'Doenças cardiovasculares (IAM, ICC, Arritmias, HAS)',
    'Clínica Cirúrgica': 'Abdômen agudo (apendicite, colecistite, obstrução, pancreatite)',
    'Pediatria': 'Puericultura e curva de crescimento',
    'Ginecologia': 'Anticoncepção (incluindo DIU, pílula, emergência e contraindicações)',
    'Obstetrícia': 'Pré-natal de baixo e alto risco (consultas, exames, calendário vacinal)',
    'Medicina Preventiva': 'Políticas públicas de saúde (SUS)',
  },
  2: {
    'Clínica Médica': 'Diabetes e emergências metabólicas (CAD, EHH)',
    'Clínica Cirúrgica': 'Hérnias (inguinal, femoral, encarceramento, estrangulamento)',
    'Pediatria': 'Vacinas (PNI) e contraindicações',
    'Ginecologia': 'Infecções ginecológicas (vaginose, candidíase, DIP)',
    'Obstetrícia': 'Infecções na gestação (sífilis, HIV, hepatites, toxoplasmose, Zika)',
    'Medicina Preventiva': 'Saúde da família e atenção primária',
  },
  3: {
    'Clínica Médica': 'Doenças pulmonares (asma, DPOC, TEP, pneumonia)',
    'Clínica Cirúrgica': 'Trauma (ABCDE, TCE, trauma abdominal)',
    'Pediatria': 'Doenças exantemáticas (sarampo, rubéola, roséola, varicela)',
    'Ginecologia': 'Climatério e reposição hormonal',
    'Obstetrícia': 'Hemorragias do 1º e 2º/3º trimestre (DPP, placenta prévia, abortamento)',
    'Medicina Preventiva': 'Vigilância sanitária, epidemiológica e ambiental',
  },
  4: {
    'Clínica Médica': 'Doenças gastrointestinais (DRGE, hepatites, pancreatite, hemorragia digestiva)',
    'Clínica Cirúrgica': 'Doenças vasculares (isquemia aguda, trombose, aneurisma de aorta)',
    'Pediatria': 'Diarreia aguda e desidratação (Plano A/B/C)',
    'Ginecologia': 'Miomas uterinos (tipos, sintomas, tratamento)',
    'Obstetrícia': 'Doença hipertensiva específica da gestação (PIG, eclâmpsia, pré-eclâmpsia)',
    'Medicina Preventiva': 'Indicadores de saúde (mortalidade, incidência, prevalência)',
  },
  5: {
    'Clínica Médica': 'Insuficiência renal aguda e crônica',
    'Clínica Cirúrgica': 'Queimaduras (classificação e conduta inicial)',
    'Pediatria': 'IRA / Doenças respiratórias (asma, bronquiolite, pneumonia)',
    'Ginecologia': 'Sangramento uterino anormal',
    'Obstetrícia': 'Trabalho de parto e condução',
    'Medicina Preventiva': 'Epidemiologia básica (sensibilidade, especificidade, VPP/VPN)',
  },
  6: {
    'Clínica Médica': 'Distúrbios hidroeletrolíticos (hipo/hipernatremia, hipo/hipercalemia)',
    'Clínica Cirúrgica': 'Infecções cirúrgicas',
    'Pediatria': 'Meningites (viral, bacteriana)',
    'Ginecologia': 'Dor pélvica crônica e endometriose',
    'Obstetrícia': 'Parto normal, fórcipe e cesárea – indicações',
    'Medicina Preventiva': 'Imunizações e calendário vacinal',
  },
  7: {
    'Clínica Médica': 'Doenças infecciosas (HIV, sífilis, meningite, TB)',
    'Clínica Cirúrgica': 'Oncologia cirúrgica',
    'Pediatria': 'Doenças do período neonatal (icterícia, sepse, Apgar)',
    'Ginecologia': 'Câncer ginecológico (colo, ovário, endométrio, mama — rastreio)',
    'Obstetrícia': 'Puerpério e complicações (hemorragia pós-parto, infecções)',
    'Medicina Preventiva': 'Rastreamento (câncer de colo, mama, próstata, DM, HAS)',
  },
  8: {
    'Clínica Médica': 'Doenças hematológicas (anemias, púrpuras, leucemias)',
    'Clínica Cirúrgica': 'Doenças anorretais (hemorroidas, fissuras, abscessos)',
    'Pediatria': 'Cardiopatias congênitas mais comuns',
    'Ginecologia': 'Anticoncepção (incluindo DIU, pílula, emergência e contraindicações)',
    'Obstetrícia': 'Sofrimento fetal agudo / cardiotocografia',
    'Medicina Preventiva': 'Estudos epidemiológicos (coorte, caso-controle, transversal)',
  },
  9: {
    'Clínica Médica': 'Reumatologia (AR, lupus, gota, espondiloartropatias)',
    'Clínica Cirúrgica': 'Abdômen agudo (apendicite, colecistite, obstrução, pancreatite)',
    'Pediatria': 'Crises convulsivas / epilepsia pediátrica',
    'Ginecologia': 'Infecções ginecológicas (vaginose, candidíase, DIP)',
    'Obstetrícia': 'Pré-natal de baixo e alto risco (consultas, exames, calendário vacinal)',
    'Medicina Preventiva': 'Planejamento em saúde / gestão',
  },
  10: {
    'Clínica Médica': 'Emergências clínicas (sepse, choque, intoxicações)',
    'Clínica Cirúrgica': 'Trauma (ABCDE, TCE, trauma abdominal)',
    'Pediatria': 'Desnutrição e obesidade',
    'Ginecologia': 'Climatério e reposição hormonal',
    'Obstetrícia': 'Infecções na gestação (sífilis, HIV, hepatites, toxoplasmose, Zika)',
    'Medicina Preventiva': 'Bioestatística aplicada (IC, p-valor, testes estatísticos básicos)',
  },
  11: {
    'Clínica Médica': 'Doenças cardiovasculares (IAM, ICC, Arritmias, HAS)',
    'Clínica Cirúrgica': 'Doenças vasculares (isquemia aguda, trombose, aneurisma de aorta)',
    'Pediatria': 'IRA / Doenças respiratórias (asma, bronquiolite, pneumonia)',
    'Ginecologia': 'Sangramento uterino anormal',
    'Obstetrícia': 'Doença hipertensiva específica da gestação (PIG, eclâmpsia, pré-eclâmpsia)',
    'Medicina Preventiva': 'Políticas públicas de saúde (SUS)',
  },
  12: {
    'Clínica Médica': 'Doenças pulmonares (asma, DPOC, TEP, pneumonia)',
    'Clínica Cirúrgica': 'Hérnias (inguinal, femoral, encarceramento, estrangulamento)',
    'Pediatria': 'Diarreia aguda e desidratação (Plano A/B/C)',
    'Ginecologia': 'Miomas uterinos (tipos, sintomas, tratamento)',
    'Obstetrícia': 'Trabalho de parto e condução',
    'Medicina Preventiva': 'Saúde da família e atenção primária',
  },
  13: {
    'Clínica Médica': 'Doenças hematológicas (anemias, púrpuras, leucemias)',
    'Clínica Cirúrgica': 'Oncologia cirúrgica',
    'Pediatria': 'Meningites (viral, bacteriana)',
    'Ginecologia': 'Dor pélvica crônica e endometriose',
    'Obstetrícia': 'Parto normal, fórcipe e cesárea – indicações',
    'Medicina Preventiva': 'Vigilância sanitária, epidemiológica e ambiental',
  },
  14: {
    'Clínica Médica': 'Doenças infecciosas (HIV, sífilis, meningite, TB)',
    'Clínica Cirúrgica': 'Infecções cirúrgicas',
    'Pediatria': 'Doenças do período neonatal (icterícia, sepse, Apgar)',
    'Ginecologia': 'Câncer ginecológico (colo, ovário, endométrio, mama — rastreio)',
    'Obstetrícia': 'Puerpério e complicações (hemorragia pós-parto, infecções)',
    'Medicina Preventiva': 'Indicadores de saúde (mortalidade, incidência, prevalência)',
  },
  15: {
    'Clínica Médica': 'Reumatologia (AR, lupus, gota, espondiloartropatias)',
    'Clínica Cirúrgica': 'Queimaduras (classificação e conduta inicial)',
    'Pediatria': 'Crises convulsivas / epilepsia pediátrica',
    'Ginecologia': 'Anticoncepção (incluindo DIU, pílula, emergência e contraindicações)',
    'Obstetrícia': 'Hemorragias do 1º e 2º/3º trimestre (DPP, placenta prévia, abortamento)',
    'Medicina Preventiva': 'Rastreamento (câncer de colo, mama, próstata, DM, HAS)',
  },
  16: {
    'Clínica Médica': 'Emergências clínicas (sepse, choque, intoxicações)',
    'Clínica Cirúrgica': 'Doenças anorretais (hemorroidas, fissuras, abscessos)',
    'Pediatria': 'Cardiopatias congênitas mais comuns',
    'Ginecologia': 'Infecções ginecológicas (vaginose, candidíase, DIP)',
    'Obstetrícia': 'Sofrimento fetal agudo / cardiotocografia',
    'Medicina Preventiva': 'Epidemiologia básica (sensibilidade, especificidade, VPP/VPN)',
  },
  17: {
    'Clínica Médica': 'Doenças gastrointestinais (DRGE, hepatites, pancreatite, hemorragia digestiva)',
    'Clínica Cirúrgica': 'Abdômen agudo (apendicite, colecistite, obstrução, pancreatite)',
    'Pediatria': 'Desnutrição e obesidade',
    'Ginecologia': 'Climatério e reposição hormonal',
    'Obstetrícia': 'Pré-natal de baixo e alto risco (consultas, exames, calendário vacinal)',
    'Medicina Preventiva': 'Estudos epidemiológicos (coorte, caso-controle, transversal)',
  },
  18: {
    'Clínica Médica': 'Distúrbios hidroeletrolíticos (hipo/hipernatremia, hipo/hipercalemia)',
    'Clínica Cirúrgica': 'Trauma (ABCDE, TCE, trauma abdominal)',
    'Pediatria': 'Puericultura e curva de crescimento',
    'Ginecologia': 'Sangramento uterino anormal',
    'Obstetrícia': 'Doença hipertensiva específica da gestação (PIG, eclâmpsia, pré-eclâmpsia)',
    'Medicina Preventiva': 'Planejamento em saúde / gestão',
  },
  19: {
    'Clínica Médica': 'Insuficiência renal aguda e crônica',
    'Clínica Cirúrgica': 'Doenças vasculares (isquemia aguda, trombose, aneurisma de aorta)',
    'Pediatria': 'Vacinas (PNI) e contraindicações',
    'Ginecologia': 'Miomas uterinos (tipos, sintomas, tratamento)',
    'Obstetrícia': 'Trabalho de parto e condução',
    'Medicina Preventiva': 'Bioestatística aplicada (IC, p-valor, testes estatísticos básicos)',
  },
  20: {
    'Clínica Médica': 'Revisão geral – Simulados',
    'Clínica Cirúrgica': 'Revisão geral – Simulados',
    'Pediatria': 'Revisão geral – Simulados',
    'Ginecologia': 'Revisão geral – Simulados',
    'Obstetrícia': 'Revisão geral – Simulados',
    'Medicina Preventiva': 'Revisão geral – Simulados',
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
    return await initializePlan(userId)
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
