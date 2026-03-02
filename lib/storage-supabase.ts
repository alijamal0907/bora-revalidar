import { createClient } from "@/lib/supabase/client"
import type { StudyCard, ReviewResult } from "./spaced-repetition"

function getSupabaseClient() {
  return createClient()
}

const supabase = getSupabaseClient()

export async function getQuestoesAsCards(usuarioId: string): Promise<StudyCard[]> {
  try {
    const { data: questoes, error } = await supabase.from("questoes").select("*").limit(2000)

    if (error) {
      console.error("Error fetching questoes:", error)
      return []
    }

    if (!questoes) return []

    return questoes.map((q: any) => {
      const dificuldadeStr = String(q.dificuldade || "medium").toLowerCase()
      return {
        id: q.id,
        question: q.enunciado || q.question || "",
        answer: q.resposta || q.answer || "",
        category: q.categoria || q.category || "General",
        difficulty: ["facil", "facile", "fácil", "easy", "low"].includes(dificuldadeStr)
          ? "easy"
          : ["dificil", "difícil", "hard", "high"].includes(dificuldadeStr)
            ? "hard"
            : "medium",
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReview: Date.now(),
        lastReviewed: null,
      }
    })
  } catch (error) {
    console.error("Error in getQuestoesAsCards:", error)
    return []
  }
}

export async function saveReviewToHistory(
  usuarioId: string,
  questaoId: string | number,
  correta: boolean,
  alternativaSelecionada: string,
): Promise<void> {
  try {
    const { error } = await supabase.from("historico_questoes").insert({
      usuario_id: usuarioId,
      questao_id: questaoId,
      correta,
      alternativa_selecionada: alternativaSelecionada,
      data_resposta: new Date().toISOString(),
    })

    if (error) {
      throw error
    }
  } catch (error) {
    throw error
  }
}

export async function getMarcacoesRevisaoData(usuarioId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase.from("marcacoes_revisao").select("*").eq("usuario_id", usuarioId)

    if (error) {
      console.error("Error fetching marcacoes_revisao:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getMarcacoesRevisaoData:", error)
    return []
  }
}

export async function getHistoricoQuestoes(usuarioId: string): Promise<ReviewResult[]> {
  try {
    const { data: historico, error } = await supabase.from("hist_questoes").select("*")

    if (error) {
      console.error("Error fetching historico:", error)
      return []
    }

    if (!historico) return []

    // Map to ReviewResult format
    return historico.map((h: any) => ({
      cardId: h.questao_id,
      quality: h.qualidade || 0,
      timestamp: new Date(h.data_revisao).getTime(),
    }))
  } catch (error) {
    console.error("Error in getHistoricoQuestoes:", error)
    return []
  }
}

export async function initializeCardsFromSupabase(usuarioId: string): Promise<StudyCard[]> {
  return await getQuestoesAsCards(usuarioId)
}

export async function markForLaterReview(usuarioId: string, cardId: string): Promise<void> {
  try {
    const { error } = await supabase.from("marcacoes_revisao").insert([
      {
        questao_id: cardId,
        data_marcacao: new Date().toISOString(),
        status: "marked",
      },
    ])

    if (error) {
      console.error("Error marking for later review:", error)
      throw error
    }
  } catch (error) {
    console.error("Error in markForLaterReview:", error)
    throw error
  }
}

export async function unmarkForLaterReview(cardId: string): Promise<void> {
  try {
    const { error } = await supabase.from("marcacoes_revisao").delete().eq("questao_id", cardId)

    if (error) {
      console.error("Error unmarking question:", error)
      throw error
    }
  } catch (error) {
    console.error("Error in unmarkForLaterReview:", error)
    throw error
  }
}

export async function getUniqueThemes(materia: string): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("questoes").select("tema").limit(2000)

    if (error) {
      return []
    }

    if (!data || data.length === 0) return []

    const themes = new Set<string>()
    data.forEach((q: any) => {
      if (q.tema && typeof q.tema === "string") {
        // Normalizar: trim e lowercase
        const normalized = q.tema.trim().toLowerCase()
        if (normalized) {
          themes.add(normalized)
        }
      }
    })

    const sortedThemes = Array.from(themes).sort()
    return sortedThemes
  } catch (error) {
    return []
  }
}

export async function getQuestoesAsCardsByTheme(usuarioId: string, tema?: string): Promise<StudyCard[]> {
  try {
    let query = supabase.from("questoes").select("*")

    if (tema) {
      query = query.eq("tema", tema)
    }

    const { data: questoes, error } = await query.limit(2000)

    if (error) {
      console.error("Error fetching questoes by theme:", error)
      return []
    }

    if (!questoes || questoes.length === 0) return []

    return questoes.map((q: any) => {
      const dificuldadeStr = String(q.dificuldade || "medium").toLowerCase()

      return {
        id: q.id,
        question: q.enunciado || q.question || "",
        answer: q.resposta || q.answer || "",
        category: q.tema || "Geral",
        difficulty: ["facil", "facile", "fácil", "easy", "low"].includes(dificuldadeStr)
          ? "easy"
          : ["dificil", "difícil", "hard", "high"].includes(dificuldadeStr)
            ? "hard"
            : "medium",
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReview: Date.now(),
        lastReviewed: null,
      }
    })
  } catch (error) {
    console.error("Error in getQuestoesAsCardsByTheme:", error)
    return []
  }
}

export async function getQuestoesAsCardsByMultipleThemes(usuarioId: string, temas?: string[]): Promise<StudyCard[]> {
  try {
    let query = supabase.from("questoes").select("*")

    if (temas && temas.length > 0) {
      query = query.in("tema", temas)
    }

    const { data: questoes, error } = await query.limit(2000)

    if (error) {
      console.error("Error fetching questoes by themes:", error)
      return []
    }

    if (!questoes || questoes.length === 0) return []

    return questoes.map((q: any) => {
      const dificuldadeStr = String(q.dificuldade || "medium").toLowerCase()

      return {
        id: q.id,
        question: q.enunciado || q.question || "",
        answer: q.resposta || q.answer || "",
        category: q.tema || "Geral",
        difficulty: ["facil", "facile", "fácil", "easy", "low"].includes(dificuldadeStr)
          ? "easy"
          : ["dificil", "difícil", "hard", "high"].includes(dificuldadeStr)
            ? "hard"
            : "medium",
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReview: Date.now(),
        lastReviewed: null,
      }
    })
  } catch (error) {
    console.error("Error in getQuestoesAsCardsByMultipleThemes:", error)
    return []
  }
}

export async function saveQuizAnswer(
  userId: string,
  questaoId: string,
  resposta: string,
  correta: boolean,
  origem: "estudo" | "simulado",
): Promise<void> {
  if (!questaoId) {
    console.error("Cannot save answer: questaoId is null or undefined")
    throw new Error("questaoId is required")
  }

  try {
    const { error } = await getSupabaseClient()
      .from("hist_questoes")
      .insert([
        {
          user_id: userId,
          questao_id: questaoId,
          resposta,
          correta,
          origem,
          created_at: new Date().toISOString(),
        },
      ])

    if (error) {
      console.error("Error saving quiz answer:", error)
      throw error
    }
  } catch (error) {
    console.error("Error in saveQuizAnswer:", error)
    throw error
  }
}

export async function getWrongAnswers(userId: string): Promise<any[]> {
  try {
    const { data: historico, error: histError } = await getSupabaseClient()
      .from("hist_questoes")
      .select("*")
      .eq("user_id", userId)
      .eq("correta", false)
      .order("created_at", { ascending: false })
      .limit(1000)

    if (histError) {
      console.error("Error fetching wrong answers from hist:", histError)
      return []
    }

    if (!historico || historico.length === 0) return []

    const questaoIds = [...new Set(historico.map((h) => h.questao_id))]

    const { data: questoes, error: questError } = await getSupabaseClient()
      .from("questoes")
      .select("*")
      .in("id", questaoIds)

    if (questError) {
      console.error("Error fetching questoes:", questError)
      return []
    }

    return (questoes || []).map((q: any) => ({
      ...q,
      questao: q.enunciado || q.questao,
      alternativas: {
        A: q.alternativaA || q.alternativaa || "",
        B: q.alternativaB || q.alternativab || "",
        C: q.alternativaC || q.alternativac || "",
        D: q.alternativaD || q.alternativad || "",
      },
      resposta_correta: (q.correta || q.resposta_correta || "").toUpperCase(),
      explicacao: q.explicacao || null, // Incluindo campo explicacao
      wrongCount: historico.filter((h: any) => h.questao_id === q.id).length,
    }))
  } catch (error) {
    console.error("Error in getWrongAnswers:", error)
    return []
  }
}

const MATERIA_VARIATIONS: { [key: string]: string[] } = {
  "Clínica Médica": ["Clínica Médica", "clinica medica", "Clinica Medica"],
  "Clínica Cirúrgica": ["Clínica Cirúrgica", "clinica cirurgica", "Cirurgia"],
  Pediatria: ["Pediatria", "pediatria"],
  "Ginecologia e Obstetrícia": [
    "Ginecologia e Obstetrícia",
    "Ginecologia e obstetrícia",
    "ginecologia e obstetricia",
    "Ginecologia",
  ],
  "Medicina Preventiva": ["Medicina Preventiva", "medicina preventiva"],
}

export async function getStudyQuestions(materia: string | null, temas: string[] = []): Promise<any[]> {
  try {
    let query = getSupabaseClient().from("questoes").select("*")

    // Filtrar por matéria se especificada (busca nas variações de tema)
    if (materia && materia !== "Todas") {
      const variations = MATERIA_VARIATIONS[materia] || [materia]
      query = query.in("tema", variations)
    }

    // Filtrar por temas específicos se fornecidos (sobrescreve o filtro de matéria)
    if (temas && temas.length > 0) {
      query = query.in("tema", temas)
    }

    const { data: questoes, error } = await query.limit(2000)

    if (error) {
      console.error("Error fetching study questions:", error)
      return []
    }

    // Deduplicar por id para evitar questões repetidas caso haja variações de tema no banco
    const seen = new Set<string>()
    const unique = (questoes || []).filter((q: any) => {
      if (seen.has(q.id)) return false
      seen.add(q.id)
      return true
    })

    return unique
  } catch (error) {
    console.error("Error in getStudyQuestions:", error)
    return []
  }
}

/**
 * Busca os subtemas disponíveis para uma grande área (tema) específica
 * Feature: Sistema de seleção por Grande Área e Subtemas v1.0
 * @param tema - O tema/grande área selecionado (ex: "Clínica Médica")
 * @returns Array de objetos com subtema e subtema_slug
 */
export async function getSubtemasByTema(tema: string): Promise<Array<{ subtema: string; subtema_slug: string }>> {
  try {
    const variations = MATERIA_VARIATIONS[tema] || [tema]
    
    const { data, error } = await getSupabaseClient()
      .from("questoes")
      .select("subtema, subtema_slug")
      .in("tema", variations)
      .not("subtema", "is", null)
      .limit(2000)

    if (error) {
      console.error("Error fetching subtemas:", error)
      return []
    }

    if (!data || data.length === 0) return []

    // Deduplicar SEMPRE pelo texto normalizado do subtema (evita duplicatas por slug diferente mas texto igual)
    const uniqueSubtemas = new Map<string, { subtema: string; subtema_slug: string }>()

    const toSlug = (text: string) =>
      text
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")

    data.forEach((item: any) => {
      if (!item.subtema) return
      const subtemaText = item.subtema.trim()
      // Chave de deduplicação = sempre o slug gerado do texto (ignora variações de slug no banco)
      const dedupeKey = toSlug(subtemaText)
      if (!uniqueSubtemas.has(dedupeKey)) {
        uniqueSubtemas.set(dedupeKey, {
          subtema: subtemaText,
          // Usar sempre o dedupeKey como slug para garantir unicidade
          subtema_slug: dedupeKey,
        })
      }
    })

    return Array.from(uniqueSubtemas.values()).sort((a, b) =>
      a.subtema.localeCompare(b.subtema, "pt-BR")
    )
  } catch (error) {
    console.error("Error in getSubtemasByTema:", error)
    return []
  }
}

/**
 * Busca questões filtradas por tema e subtemas diretamente no banco.
 * O filtro de subtema é feito no banco usando ilike (case-insensitive + trim),
 * garantindo que todas as questões do subtema sejam retornadas independente de
 * variações de capitalização ou espaços nos dados.
 * @param tema - Grande área selecionada
 * @param subtemaTexts - Array de textos de subtemas selecionados (vazio = todos os subtemas)
 * @returns Array de questões
 */
export async function getQuestionsByTemaAndSubtemas(
  tema: string,
  subtemaTexts: string[] = []
): Promise<any[]> {
  try {
    const variations = MATERIA_VARIATIONS[tema] || [tema]

    let allResults: any[] = []

    if (subtemaTexts && subtemaTexts.length > 0) {
      // Filtrar diretamente no banco usando .in() com os textos exatos dos subtemas.
      // A getSubtemasByTema já normaliza os textos com .trim(), então os valores
      // em selectedSubtemas correspondem exatamente ao subtema.trim() do banco.
      // Usamos também as variantes com espaços para tolerância.
      const normalizedTexts = subtemaTexts.map((t) => t.trim())

      const { data, error } = await getSupabaseClient()
        .from("questoes")
        .select("*")
        .in("tema", variations)
        .in("subtema", normalizedTexts)
        .limit(5000)

      if (error) {
        console.error("Error fetching questions by subtema:", error)
        return []
      }

      allResults = data || []

      // Se retornou zero, tentar com ilike para tolerar espaços extras no banco
      if (allResults.length === 0) {
        const ilikePromises = normalizedTexts.map((subtemaText) =>
          getSupabaseClient()
            .from("questoes")
            .select("*")
            .in("tema", variations)
            .ilike("subtema", subtemaText)
            .limit(5000)
        )
        const results = await Promise.all(ilikePromises)
        for (const { data: d, error: e } of results) {
          if (!e && d) allResults.push(...d)
        }
      }
    } else {
      // Sem filtro de subtema — retornar todas as questões do tema
      const { data, error } = await getSupabaseClient()
        .from("questoes")
        .select("*")
        .in("tema", variations)
        .limit(2000)

      if (error) {
        console.error("Error fetching all questions for tema:", error)
        return []
      }
      allResults = data || []
    }

    // Deduplicar por id
    const seen = new Set<string>()
    return allResults.filter((q: any) => {
      if (seen.has(q.id)) return false
      seen.add(q.id)
      return true
    })
  } catch (error) {
    console.error("Error in getQuestionsByTemaAndSubtemas:", error)
    return []
  }
}

export async function getQuestoesWithAlternatives(usuarioId: string, temas?: string[], limit = 2000): Promise<any[]> {
  try {
    const { data: allQuestoes, error: fetchError } = await getSupabaseClient().from("questoes").select("*").limit(limit)

    if (fetchError) {
      console.error("Error fetching questoes with alternatives:", fetchError)
      return []
    }

    if (!allQuestoes || allQuestoes.length === 0) {
      return []
    }

    if (!temas || temas.length === 0) {
      return allQuestoes
    }

    const normalizedTemas = temas.map((t) => t.trim().toLowerCase())

    const filtered = allQuestoes.filter((q: any) => {
      const questaoTema = String(q.tema || "")
        .trim()
        .toLowerCase()
      return normalizedTemas.includes(questaoTema)
    })

    return filtered
  } catch (error) {
    console.error("Error in getQuestoesWithAlternatives:", error)
    return []
  }
}

export async function getUserPlan(email: string): Promise<"free" | "premium"> {
  try {
    const { data, error } = await supabase
      .from("assinaturas")
      .select("plano, status, transaction_id, data_pagamento")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (error || !data) {
      return "free"
    }

    if (data.plano === "premium" || data.transaction_id || data.data_pagamento) {
      return "premium"
    }

    return "free"
  } catch (error) {
    console.error("Error getting user plan:", error)
    return "free"
  }
}

export async function getUserProfile(): Promise<{ id: string; email: string; plan: "free" | "premium" } | null> {
  try {
    const supabase = getSupabaseClient()

    // Buscar usuário autenticado
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("Error getting authenticated user:", authError)
      return null
    }

    // Buscar plano do usuário
    const plan = await getUserPlan(user.email || "")

    return {
      id: user.id,
      email: user.email || "",
      plan,
    }
  } catch (error) {
    console.error("Error in getUserProfile:", error)
    return null
  }
}

export function normalizeThemeToMateria(tema: string): string {
  if (!tema) return "Outros"

  const temaLower = tema.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim()

  // Clínica Cirúrgica / Cirurgia - VERIFICAR PRIMEIRO (antes de clínica médica)
  if (
    temaLower.includes("cirurgia") ||
    temaLower.includes("cirurgica") ||
    temaLower.includes("clinica cirurgica") ||
    temaLower.includes("urgencia") ||
    temaLower.includes("trauma") ||
    temaLower.includes("proctologia") ||
    temaLower.includes("vascular") ||
    temaLower.includes("cirurgia geral")
  ) {
    return "Clínica Cirúrgica"
  }

  // Pediatria
  if (
    temaLower.includes("pediatria") ||
    temaLower.includes("neonatologia") ||
    temaLower.includes("neonatal")
  ) {
    return "Pediatria"
  }

  // Ginecologia e Obstetrícia
  if (
    temaLower.includes("ginecologia") ||
    temaLower.includes("obstetricia") ||
    temaLower.includes("gineco") ||
    temaLower === "go"
  ) {
    return "Ginecologia e Obstetrícia"
  }

  // Medicina Preventiva
  if (
    temaLower.includes("medicina preventiva") ||
    temaLower.includes("preventiva") ||
    temaLower.includes("saude coletiva") ||
    temaLower.includes("epidemiologia") ||
    temaLower.includes("imunizacoes") ||
    temaLower.includes("imunizacao") ||
    temaLower.includes("medicina de familia") ||
    temaLower.includes("gestao") ||
    temaLower.includes("tabagismo") ||
    temaLower.includes("medicina social")
  ) {
    return "Medicina Preventiva"
  }

  // Clínica Médica - verificar por último (pega o resto das especialidades clínicas)
  if (
    temaLower.includes("clinica medica") ||
    temaLower.includes("clinica") ||
    temaLower.includes("gastroenterologia") ||
    temaLower.includes("pneumologia") ||
    temaLower.includes("neurologia") ||
    temaLower.includes("infectologia") ||
    temaLower.includes("dermatologia") ||
    temaLower.includes("cardiologia") ||
    temaLower.includes("emergencia") ||
    temaLower.includes("psiquiatria") ||
    temaLower.includes("oftalmologia") ||
    temaLower.includes("saude mental") ||
    temaLower.includes("endocrinologia") ||
    temaLower.includes("hematologia") ||
    temaLower.includes("reumatologia") ||
    temaLower.includes("nefrologia") ||
    temaLower.includes("oncologia")
  ) {
    return "Clínica Médica"
  }

  return "Outros"
}

export async function getProgressByTheme(userId: string): Promise<any[]> {
  try {
    const { data: historico, error: histError } = await supabase.from("hist_questoes").select("*").eq("user_id", userId)

    if (histError) {
      console.error("Error fetching historico:", histError)
      return []
    }

    if (!historico || historico.length === 0) {
      return []
    }

    const { data: questoes, error: questError } = await supabase.from("questoes").select("*").limit(2000)

    if (questError) {
      console.error("Error fetching questoes:", questError)
      return []
    }

    if (!questoes || questoes.length === 0) {
      return []
    }

    const mainMaterias = [
      "Pediatria",
      "Clínica Médica",
      "Ginecologia e Obstetrícia",
      "Medicina Preventiva",
      "Clínica Cirúrgica",
    ]

    const themeMap: { [key: string]: { total: number; correct: number; wrong: number } } = {}

    // Inicializar todas as matérias principais com zero
    mainMaterias.forEach((materia) => {
      themeMap[materia] = { total: 0, correct: 0, wrong: 0 }
    })

    historico.forEach((h: any) => {
      const questao = questoes.find((q: any) => q.id === h.questao_id)
      if (questao && questao.tema) {
        const normalizedTheme = normalizeThemeToMateria(questao.tema)

        // Só contabilizar se for uma das matérias principais
        if (mainMaterias.includes(normalizedTheme)) {
          themeMap[normalizedTheme].total++
          if (h.correta) {
            themeMap[normalizedTheme].correct++
          } else {
            themeMap[normalizedTheme].wrong++
          }
        }
      }
    })

    const result = mainMaterias.map((theme) => ({
      theme,
      total: themeMap[theme].total,
      correct: themeMap[theme].correct,
      wrong: themeMap[theme].wrong,
      percentage: themeMap[theme].total > 0 ? Math.round((themeMap[theme].correct / themeMap[theme].total) * 100) : 0,
    }))

    return result
  } catch (error) {
    console.error("Error in getProgressByTheme:", error)
    return []
  }
}

export async function getDailyProgress(userId: string) {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from("hist_questoes")
      .select("questao_id")
      .eq("user_id", userId)
      .gte("created_at", today.toISOString())

    if (error) {
      console.error("Erro ao buscar progresso diário:", error)
      return 0
    }

    const uniqueQuestions = new Set(data?.map((item) => item.questao_id) || [])
    return uniqueQuestions.size
  } catch (error) {
    console.error("Erro ao buscar progresso diário:", error)
    return 0
  }
}

export const getDailyQuestionCount = getDailyProgress

export async function getMonthlyProgress(userId: string) {
  try {
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from("hist_questoes")
      .select("questao_id")
      .eq("user_id", userId)
      .gte("created_at", firstDayOfMonth.toISOString())

    if (error) {
      console.error("Erro ao buscar progresso mensal:", error)
      return 0
    }

    const uniqueQuestions = new Set(data?.map((item) => item.questao_id) || [])
    return uniqueQuestions.size
  } catch (error) {
    console.error("Erro ao buscar progresso mensal:", error)
    return 0
  }
}

export async function getUserGoals(userId: string) {
  const { data, error } = await supabase.from("user_goals").select("*").eq("user_id", userId).single()

  if (error && error.code !== "PGRST116") {
    console.error("Erro ao buscar metas:", error)
    return null
  }

  return data
}

export async function registerDeviceSession(
  userId: string,
  email: string,
  deviceInfo: {
    userAgent: string
    platform: string
    deviceId: string
  },
): Promise<{ success: boolean; message: string }> {
  try {
    const now = new Date()
    const supabase = getSupabaseClient()

    const { error: deactivateError } = await supabase
      .from("user_devices")
      .update({
        active: false,
        ended_at: now.toISOString(),
      })
      .eq("user_id", userId)
      .neq("device_id", deviceInfo.deviceId)

    if (deactivateError) {
      console.error("Error deactivating other sessions:", deactivateError)
    }

    // Verificar se já existe uma sessão para este dispositivo
    const { data: existingDevice, error: checkError } = await supabase
      .from("user_devices")
      .select("*")
      .eq("user_id", userId)
      .eq("device_id", deviceInfo.deviceId)
      .single()

    if (existingDevice) {
      // Atualizar e reativar a sessão deste dispositivo
      const { error: updateError } = await supabase
        .from("user_devices")
        .update({
          last_active: now.toISOString(),
          user_agent: deviceInfo.userAgent,
          platform: deviceInfo.platform,
          active: true, // Garantir que está ativo
          ended_at: null, // Limpar ended_at
        })
        .eq("id", existingDevice.id)

      if (updateError) {
        console.error("Error updating device session:", updateError)
        return { success: false, message: "Erro ao atualizar sessão" }
      }

      return { success: true, message: "Sessão atualizada - outras sessões foram encerradas" }
    }

    // Criar nova sessão se não existe
    const { error: insertError } = await supabase.from("user_devices").insert([
      {
        user_id: userId,
        email: email,
        device_id: deviceInfo.deviceId,
        user_agent: deviceInfo.userAgent,
        platform: deviceInfo.platform,
        active: true,
        last_active: now.toISOString(),
        started_at: now.toISOString(),
      },
    ])

    if (insertError) {
      console.error("Error creating device session:", insertError)
      return { success: false, message: "Erro ao criar sessão" }
    }

    return { success: true, message: "Sessão criada - outras sessões foram encerradas" }
  } catch (error) {
    console.error("Error in registerDeviceSession:", error)
    return { success: false, message: "Erro ao processar sessão" }
  }
}

export async function checkSessionActive(userId: string, deviceId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("user_devices")
      .select("active")
      .eq("user_id", userId)
      .eq("device_id", deviceId)
      .single()

    if (error || !data) {
      return false
    }

    return data.active === true
  } catch (error) {
    console.error("Error checking session:", error)
    return false
  }
}

export async function checkDeviceSession(userId: string, deviceId: string): Promise<boolean> {
  return await checkSessionActive(userId, deviceId)
}

export async function createSubscriptionFromCakto(
  email: string,
  nome: string,
  transactionId?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const { data: existing, error: checkError } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (existing) {
      // Atualizar para ativo se já existe
      const { error: updateError } = await supabase
        .from("assinaturas")
        .update({
          status: "ativo",
          data_pagamento: new Date().toISOString(),
          transaction_id: transactionId,
        })
        .eq("email", email.toLowerCase().trim())

      if (updateError) {
        console.error("Error updating subscription:", updateError)
        return { success: false, message: "Erro ao atualizar assinatura" }
      }

      return { success: true, message: "Assinatura ativada com sucesso" }
    }

    // Criar nova assinatura
    const { error: insertError } = await supabase.from("assinaturas").insert([
      {
        email: email.toLowerCase().trim(),
        nome: nome || email.split("@")[0],
        status: "ativo",
        data_cadastro: new Date().toISOString(),
        data_pagamento: new Date().toISOString(),
        transaction_id: transactionId,
      },
    ])

    if (insertError) {
      console.error("Error creating subscription:", insertError)
      return { success: false, message: "Erro ao criar assinatura" }
    }

    return { success: true, message: "Assinatura criada com sucesso" }
  } catch (error) {
    console.error("Error in createSubscriptionFromCakto:", error)
    return { success: false, message: "Erro ao processar assinatura" }
  }
}

export async function getUserStreak(userId: string): Promise<number> {
  try {
    const { data: sessions, error } = await supabase
      .from("user_devices")
      .select("last_active")
      .eq("user_id", userId)
      .order("last_active", { ascending: false })

    if (error || !sessions || sessions.length === 0) {
      return 0
    }

    const uniqueDates = new Set<string>()
    sessions.forEach((session) => {
      if (session.last_active) {
        const date = new Date(session.last_active)
        const dateString = date.toISOString().split("T")[0] // YYYY-MM-DD
        uniqueDates.add(dateString)
      }
    })

    const sortedDates = Array.from(uniqueDates).sort().reverse()

    if (sortedDates.length === 0) {
      return 0
    }

    const today = new Date().toISOString().split("T")[0]
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    const lastLogin = sortedDates[0]

    if (lastLogin !== today && lastLogin !== yesterday) {
      return 0
    }

    let streak = 0
    const currentDate = new Date(lastLogin)

    for (const dateStr of sortedDates) {
      const expectedDate = new Date(currentDate)
      expectedDate.setDate(expectedDate.getDate() - streak)
      const expectedDateStr = expectedDate.toISOString().split("T")[0]

      if (dateStr === expectedDateStr) {
        streak++
      } else {
        break
      }
    }

    return streak
  } catch (error) {
    console.error("Error calculating streak:", error)
    return 0
  }
}

export async function saveSimuladoResult(
  userId: string,
  quantidadeQuestoes: number,
  acertos: number,
  erros: number,
  percentual: number,
  tempoTotalSegundos: number,
): Promise<void> {
  try {
    const { error } = await getSupabaseClient()
      .from("simulados_realizados")
      .insert([
        {
          user_id: userId,
          quantidade_questoes: quantidadeQuestoes,
          acertos,
          erros,
          percentual: percentual.toFixed(2),
          tempo_total_segundos: tempoTotalSegundos,
          data_hora: new Date().toISOString(),
        },
      ])

    if (error) {
      console.error("Error saving simulado result:", error)
      throw error
    }
  } catch (error) {
    console.error("Error in saveSimuladoResult:", error)
    throw error
  }
}

export async function getSimuladoHistory(userId: string): Promise<any[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from("simulados_realizados")
      .select("*")
      .eq("user_id", userId)
      .order("data_hora", { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching simulado history:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getSimuladoHistory:", error)
    return []
  }
}

export async function getSimuladoRanking(userId: string): Promise<{
  userRank: number
  userBestScore: number
  topScores: any[]
}> {
  try {
    // Buscar melhor pontuação do usuário
    const { data: userBest, error: userError } = await getSupabaseClient()
      .from("simulados_realizados")
      .select("percentual")
      .eq("user_id", userId)
      .order("percentual", { ascending: false })
      .limit(1)
      .single()

    const userBestScore = userBest?.percentual || 0

    // Buscar top 10 melhores pontuações
    const { data: allScores, error: scoresError } = await getSupabaseClient()
      .from("simulados_realizados")
      .select("user_id, percentual, data_hora")
      .order("percentual", { ascending: false })
      .limit(100)

    if (scoresError) {
      console.error("Error fetching ranking:", scoresError)
      return { userRank: 0, userBestScore, topScores: [] }
    }

    // Agrupar por user_id e pegar apenas a melhor pontuação de cada
    const bestByUser = new Map<string, any>()
    allScores?.forEach((score: any) => {
      if (!bestByUser.has(score.user_id) || bestByUser.get(score.user_id).percentual < score.percentual) {
        bestByUser.set(score.user_id, score)
      }
    })

    const topScores = Array.from(bestByUser.values())
      .sort((a, b) => b.percentual - a.percentual)
      .slice(0, 10)
      .map((score, index) => ({
        rank: index + 1,
        userId: score.user_id,
        score: score.percentual,
        date: score.data_hora,
      }))

    // Encontrar rank do usuário
    const userRank =
      Array.from(bestByUser.values())
        .sort((a, b) => b.percentual - a.percentual)
        .findIndex((score) => score.user_id === userId) + 1

    return {
      userRank: userRank || 0,
      userBestScore,
      topScores,
    }
  } catch (error) {
    console.error("Error in getSimuladoRanking:", error)
    return { userRank: 0, userBestScore: 0, topScores: [] }
  }
}

export async function getTematasByMateria(materia: string): Promise<string[]> {
  try {
    // Se for "Todas", retornar todos os temas
    if (materia === "Todas") {
      return getUniqueThemes("")
    }

    // Buscar variações da matéria
    const variations = MATERIA_VARIATIONS[materia] || [materia]

    const { data, error } = await supabase.from("questoes").select("tema").in("tema", variations).limit(2000)

    if (error) {
      console.error("Error fetching temas by materia:", error)
      return []
    }

    if (!data || data.length === 0) return []

    const themes = new Set<string>()
    data.forEach((q: any) => {
      if (q.tema && typeof q.tema === "string") {
        const normalized = q.tema.trim()
        if (normalized) {
          themes.add(normalized)
        }
      }
    })

    return Array.from(themes).sort()
  } catch (error) {
    console.error("Error in getTematasByMateria:", error)
    return []
  }
}

export async function getCorrectlyAnsweredQuestions(userId: string): Promise<string[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from("hist_questoes")
      .select("questao_id")
      .eq("user_id", userId)
      .eq("correta", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching correct answers:", error)
      return []
    }

    // Retorna apenas IDs únicos de questões respondidas corretamente
    const uniqueIds = [...new Set(data?.map((item) => item.questao_id) || [])]
    return uniqueIds
  } catch (error) {
    console.error("Error in getCorrectlyAnsweredQuestions:", error)
    return []
  }
}

export async function getWrongQuestionIds(userId: string): Promise<string[]> {
  try {
    const { data, error } = await getSupabaseClient()
      .from("hist_questoes")
      .select("questao_id")
      .eq("user_id", userId)
      .eq("correta", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching wrong question IDs:", error)
      return []
    }

    // Retorna IDs únicos de questões erradas
    const uniqueIds = [...new Set(data?.map((item) => item.questao_id) || [])]
    return uniqueIds
  } catch (error) {
    console.error("Error in getWrongQuestionIds:", error)
    return []
  }
}
