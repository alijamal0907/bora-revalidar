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

// Constantes - Areas mapeadas para corresponder aos nomes das materias no banco
const AREAS_MEDICAS = [
  'Clínica Médica',
  'Clínica Cirúrgica',
  'Pediatria',
  'Ginecologia',
  'Obstetrícia',
  'Medicina Preventiva',
]

// Mapeamento de area para materia do banco (para buscar questoes/flashcards)
export const AREA_TO_MATERIA: Record<string, string> = {
  'Clínica Médica': 'Clínica Médica',
  'Clínica Cirúrgica': 'Clínica Cirúrgica',
  'Pediatria': 'Pediatria',
  'Ginecologia': 'Ginecologia',
  'Obstetrícia': 'Obstetrícia',
  'Medicina Preventiva': 'Medicina Preventiva',
}

// Conteudo estruturado por semana com subtemas que existem no banco de dados
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
    'Medicina Preventiva': 'Epidemiologia básica (sensibilidade, especificidade, VPP/ VPN)',
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
    'Ginecologia': 'Câncer ginecológico (colo, ovário, endométrio, mama — especialmente rastreio)',
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
    'Clínica Médica': 'Emergências clínicas (sepses, choque, intoxicações)',
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
    'Ginecologia': 'Câncer ginecológico (colo, ovário, endométrio, mama — especialmente rastreio)',
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
    'Clínica Médica': 'Emergências clínicas (sepses, choque, intoxicações)',
    'Clínica Cirúrgica': 'Doenças anorretais (hemorroidas, fissuras, abscessos)',
    'Pediatria': 'Cardiopatias congênitas mais comuns',
    'Ginecologia': 'Infecções ginecológicas (vaginose, candidíase, DIP)',
    'Obstetrícia': 'Sofrimento fetal agudo / cardiotocografia',
    'Medicina Preventiva': 'Epidemiologia básica (sensibilidade, especificidade, VPP/ VPN)',
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
    'Clínica Médica': 'Revisão geral - Simulados',
    'Clínica Cirúrgica': 'Revisão geral - Simulados',
    'Pediatria': 'Revisão geral - Simulados',
    'Ginecologia': 'Revisão geral - Simulados',
    'Obstetrícia': 'Revisão geral - Simulados',
    'Medicina Preventiva': 'Revisão geral - Simulados',
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
