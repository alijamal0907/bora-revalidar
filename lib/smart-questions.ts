import { createClient } from "@/lib/supabase/client"

interface Question {
  pk: string
  id: string
  enunciado: string
  alternativaA: string
  alternativaB: string
  alternativaC: string
  alternativaD: string
  correta: string
  tema: string
  explicacao?: string
  [key: string]: any
}

/**
 * Busca o histórico de respostas do usuário e classifica as questões por prioridade
 */
export async function getUserQuestionHistory(userId: string): Promise<{
  answeredCorrectly: Set<string>
  answeredWrong: Set<string>
  allAnswered: Set<string>
}> {
  const supabase = createClient()

  const { data: historico, error } = await supabase
    .from("hist_questoes")
    .select("questao_id, correta")
    .eq("user_id", userId)

  if (error) {
    console.error("Erro ao buscar histórico:", error)
    return {
      answeredCorrectly: new Set(),
      answeredWrong: new Set(),
      allAnswered: new Set(),
    }
  }

  const answeredCorrectly = new Set<string>()
  const answeredWrong = new Set<string>()
  const allAnswered = new Set<string>()

  const questionStats = new Map<string, { correct: number; wrong: number }>()

  for (const h of historico || []) {
    const qId = String(h.questao_id)
    allAnswered.add(qId)

    if (!questionStats.has(qId)) {
      questionStats.set(qId, { correct: 0, wrong: 0 })
    }

    const stats = questionStats.get(qId)!
    if (h.correta) {
      stats.correct++
    } else {
      stats.wrong++
    }
  }

  for (const [qId, stats] of questionStats) {
    if (stats.correct > 0) {
      answeredCorrectly.add(qId)
    } else if (stats.wrong > 0) {
      answeredWrong.add(qId)
    }
  }

  return { answeredCorrectly, answeredWrong, allAnswered }
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Busca questões com prioridade inteligente:
 * 1. Questões inéditas (nunca respondidas)
 * 2. Questões erradas (para revisão)
 * 3. Questões acertadas (última prioridade, só se necessário)
 */
export async function getSmartQuestions(
  userId: string,
  count: number,
  filters?: {
    tema?: string
    materia?: string
    dificuldade?: string
    excludeIds?: string[]
  },
): Promise<Question[]> {
  const supabase = createClient()

  const { answeredCorrectly, answeredWrong, allAnswered } = await getUserQuestionHistory(userId)

  let query = supabase.from("questoes").select("*")

  if (filters?.tema) {
    query = query.ilike("tema", `%${filters.tema}%`)
  }
  if (filters?.materia) {
    query = query.ilike("tema", `%${filters.materia}%`)
  }
  if (filters?.dificuldade) {
    query = query.eq("dificuldade", filters.dificuldade)
  }

  const { data: allQuestions, error } = await query.limit(5000)

  if (error || !allQuestions) {
    console.error("Erro ao buscar questões:", error)
    return []
  }

  const excludeSet = new Set(filters?.excludeIds || [])

  const unansweredQuestions: Question[] = []
  const wrongQuestions: Question[] = []
  const correctQuestions: Question[] = []

  for (const q of allQuestions) {
    const qId = String(q.pk || q.id)

    if (excludeSet.has(qId)) continue

    if (!allAnswered.has(qId)) {
      unansweredQuestions.push(q)
    } else if (answeredWrong.has(qId) && !answeredCorrectly.has(qId)) {
      wrongQuestions.push(q)
    } else if (answeredCorrectly.has(qId)) {
      correctQuestions.push(q)
    }
  }

  const shuffledUnanswered = shuffleArray(unansweredQuestions)
  const shuffledWrong = shuffleArray(wrongQuestions)
  const shuffledCorrect = shuffleArray(correctQuestions)

  const result: Question[] = []

  for (const q of shuffledUnanswered) {
    if (result.length >= count) break
    result.push(q)
  }

  if (result.length < count) {
    for (const q of shuffledWrong) {
      if (result.length >= count) break
      result.push(q)
    }
  }

  if (result.length < count) {
    for (const q of shuffledCorrect) {
      if (result.length >= count) break
      result.push(q)
    }
  }

  return shuffleArray(result)
}

/**
 * Busca questões para simulado garantindo que não haja repetição
 */
export async function getSimuladoQuestions(
  userId: string,
  count: number,
  filters?: {
    tema?: string
    materia?: string
    ano?: string
    banca?: string
  },
): Promise<Question[]> {
  return getSmartQuestions(userId, count, filters)
}

/**
 * Busca questões para estudo em grupo
 */
export async function getGroupStudyQuestions(
  participantIds: string[],
  count: number,
  filters?: {
    tema?: string
    materia?: string
  },
): Promise<Question[]> {
  const supabase = createClient()

  const { data: historico, error: histError } = await supabase
    .from("hist_questoes")
    .select("questao_id, correta")
    .in("user_id", participantIds)

  if (histError) {
    console.error("Erro ao buscar histórico do grupo:", histError)
  }

  const questionCorrectCount = new Map<string, number>()

  for (const h of historico || []) {
    const qId = String(h.questao_id)
    if (h.correta) {
      questionCorrectCount.set(qId, (questionCorrectCount.get(qId) || 0) + 1)
    }
  }

  let query = supabase.from("questoes").select("*")

  if (filters?.tema) {
    query = query.ilike("tema", `%${filters.tema}%`)
  }
  if (filters?.materia) {
    query = query.ilike("tema", `%${filters.materia}%`)
  }

  const { data: allQuestions, error } = await query.limit(5000)

  if (error || !allQuestions) {
    console.error("Erro ao buscar questões:", error)
    return []
  }

  const sortedQuestions = [...allQuestions].sort((a, b) => {
    const aId = String(a.pk || a.id)
    const bId = String(b.pk || b.id)
    const aCorrect = questionCorrectCount.get(aId) || 0
    const bCorrect = questionCorrectCount.get(bId) || 0
    return aCorrect - bCorrect
  })

  const topQuestions = sortedQuestions.slice(0, count * 3)
  return shuffleArray(topQuestions).slice(0, count)
}

/**
 * Verifica se o usuário já respondeu uma questão
 */
export async function hasUserAnsweredQuestion(userId: string, questionId: string): Promise<boolean> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("hist_questoes")
    .select("id")
    .eq("user_id", userId)
    .eq("questao_id", questionId)
    .limit(1)

  if (error) {
    console.error("Erro ao verificar resposta:", error)
    return false
  }

  return (data?.length || 0) > 0
}

/**
 * Obtém estatísticas de questões do usuário
 */
export async function getUserQuestionStats(userId: string): Promise<{
  total: number
  unanswered: number
  wrong: number
  correct: number
}> {
  const supabase = createClient()

  const { count: totalQuestions } = await supabase.from("questoes").select("*", { count: "exact", head: true })

  const { answeredCorrectly, answeredWrong, allAnswered } = await getUserQuestionHistory(userId)

  const total = totalQuestions || 0
  const correct = answeredCorrectly.size
  const wrong = answeredWrong.size - correct
  const unanswered = total - allAnswered.size

  return {
    total,
    unanswered: Math.max(0, unanswered),
    wrong: Math.max(0, wrong),
    correct,
  }
}
