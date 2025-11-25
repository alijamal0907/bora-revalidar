import { supabase } from "./supabase"
import type { StudyCard, ReviewResult } from "./spaced-repetition"

export async function getQuestoesAsCards(usuarioId: string): Promise<StudyCard[]> {
  try {
    const { data: questoes, error } = await supabase.from("questoes").select("*").limit(2000)

    if (error) {
      console.error("[v0] Error fetching questoes:", error)
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
    console.error("[v0] Error in getQuestoesAsCards:", error)
    return []
  }
}

export async function saveReviewToHistory(
  usuarioId: string,
  cardId: string,
  quality: number,
  timestamp: number,
): Promise<void> {
  try {
    const { error } = await supabase.from("hist_questoes").insert([
      {
        questao_id: cardId,
        qualidade: quality,
        data_revisao: new Date(timestamp).toISOString(),
        // usuario_id and user_id removed - let Supabase handle via RLS or triggers
      },
    ])

    if (error) {
      console.error("[v0] Error saving review to history:", error)
      throw error
    }

    console.log("[v0] Review saved successfully")
  } catch (error) {
    console.error("[v0] Error in saveReviewToHistory:", error)
    throw error
  }
}

export async function getMarcacoesRevisaoData(usuarioId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase.from("marcacoes_revisao").select("*").eq("usuario_id", usuarioId)

    if (error) {
      console.error("[v0] Error fetching marcacoes_revisao:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("[v0] Error in getMarcacoesRevisaoData:", error)
    return []
  }
}

export async function getHistoricoQuestoes(usuarioId: string): Promise<ReviewResult[]> {
  try {
    const { data: historico, error } = await supabase.from("hist_questoes").select("*")

    if (error) {
      console.error("[v0] Error fetching historico:", error)
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
    console.error("[v0] Error in getHistoricoQuestoes:", error)
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
      console.error("[v0] Error marking for later review:", error)
      throw error
    }
  } catch (error) {
    console.error("[v0] Error in markForLaterReview:", error)
    throw error
  }
}

export async function unmarkForLaterReview(cardId: string): Promise<void> {
  try {
    const { error } = await supabase.from("marcacoes_revisao").delete().eq("questao_id", cardId)

    if (error) {
      console.error("[v0] Error unmarking question:", error)
      throw error
    }
  } catch (error) {
    console.error("[v0] Error in unmarkForLaterReview:", error)
    throw error
  }
}

export async function getUniqueThemes(): Promise<string[]> {
  try {
    const { data, error } = await supabase.from("questoes").select("tema").limit(2000)

    if (error) {
      console.error("[v0] Error fetching themes:", error)
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
    console.log("[v0] Unique themes found:", sortedThemes)
    return sortedThemes
  } catch (error) {
    console.error("[v0] Error in getUniqueThemes:", error)
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
      console.error("[v0] Error fetching questoes by theme:", error)
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
    console.error("[v0] Error in getQuestoesAsCardsByTheme:", error)
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
      console.error("[v0] Error fetching questoes by themes:", error)
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
    console.error("[v0] Error in getQuestoesAsCardsByMultipleThemes:", error)
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
    console.error("[v0] Cannot save answer: questaoId is null or undefined")
    throw new Error("questaoId is required")
  }

  try {
    const { error } = await supabase.from("hist_questoes").insert([
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
      console.error("[v0] Error saving quiz answer:", error)
      throw error
    }
  } catch (error) {
    console.error("[v0] Error in saveQuizAnswer:", error)
    throw error
  }
}

export async function getWrongAnswers(userId: string): Promise<any[]> {
  try {
    const { data: historico, error: histError } = await supabase
      .from("hist_questoes")
      .select("*")
      .eq("correta", false)
      .order("created_at", { ascending: false })
      .limit(1000) // Increased limit from 100 to 1000 to capture more wrong answers

    if (histError) {
      console.error("[v0] Error fetching wrong answers from hist:", histError)
      return []
    }

    if (!historico || historico.length === 0) return []

    const questaoIds = [...new Set(historico.map((h) => h.questao_id))]

    const { data: questoes, error: questError } = await supabase.from("questoes").select("*").in("id", questaoIds)

    if (questError) {
      console.error("[v0] Error fetching questoes:", questError)
      return []
    }

    return (questoes || []).map((q: any) => ({
      ...q,
      wrongCount: historico.filter((h: any) => h.questao_id === q.id).length,
    }))
  } catch (error) {
    console.error("[v0] Error in getWrongAnswers:", error)
    return []
  }
}

export async function getProgressByTheme(userId: string): Promise<any[]> {
  try {
    const { data: historico, error: histError } = await supabase.from("hist_questoes").select("*").eq("user_id", userId)

    if (histError) {
      console.error("[v0] Error fetching historico:", histError)
      return []
    }

    if (!historico || historico.length === 0) {
      return []
    }

    const { data: questoes, error: questError } = await supabase.from("questoes").select("*").limit(2000)

    if (questError) {
      console.error("[v0] Error fetching questoes:", questError)
      return []
    }

    if (!questoes || questoes.length === 0) {
      return []
    }

    const themeMap: { [key: string]: { total: number; correct: number; wrong: number } } = {}

    historico.forEach((h: any) => {
      const questao = questoes.find((q: any) => q.id === h.questao_id)
      if (questao && questao.tema) {
        const theme = questao.tema

        if (!themeMap[theme]) {
          themeMap[theme] = { total: 0, correct: 0, wrong: 0 }
        }

        themeMap[theme].total++
        if (h.correta) {
          themeMap[theme].correct++
        } else {
          themeMap[theme].wrong++
        }
      }
    })

    const result = Object.entries(themeMap).map(([theme, stats]) => ({
      theme,
      total: stats.total,
      correct: stats.correct,
      wrong: stats.wrong,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }))

    return result
  } catch (error) {
    console.error("[v0] Error in getProgressByTheme:", error)
    return []
  }
}

export async function getQuestoesWithAlternatives(usuarioId: string, temas?: string[], limit = 2000): Promise<any[]> {
  try {
    const { data: allQuestoes, error: fetchError } = await supabase.from("questoes").select("*").limit(limit)

    if (fetchError) {
      console.error("[v0] Error fetching questoes with alternatives:", fetchError)
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
    console.error("[v0] Error in getQuestoesWithAlternatives:", error)
    return []
  }
}

export async function checkSubscriptionStatus(email: string): Promise<{
  isActive: boolean
  message: string
  subscription?: any
}> {
  try {
    const { data, error } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (error || !data) {
      return {
        isActive: false,
        message: "Assinatura não encontrada. Realize o pagamento na plataforma Cakto para ter acesso.",
      }
    }

    if (data.status !== "ativo" && data.status !== "active") {
      return {
        isActive: false,
        message: "Sua assinatura está pendente de aprovação. Aguarde a confirmação do pagamento.",
      }
    }

    return {
      isActive: true,
      message: "Assinatura ativa",
      subscription: data,
    }
  } catch (error) {
    console.error("[v0] Error checking subscription:", error)
    return {
      isActive: false,
      message: "Erro ao verificar assinatura",
    }
  }
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

    // Verificar se já existe uma sessão para este dispositivo
    const { data: existingDevice, error: checkError } = await supabase
      .from("user_devices")
      .select("*")
      .eq("user_id", userId)
      .eq("device_id", deviceInfo.deviceId)
      .single()

    if (existingDevice) {
      // Atualizar last_active
      const { error: updateError } = await supabase
        .from("user_devices")
        .update({
          last_active: now.toISOString(),
          user_agent: deviceInfo.userAgent,
          platform: deviceInfo.platform,
        })
        .eq("id", existingDevice.id)

      if (updateError) {
        console.error("[v0] Error updating device session:", updateError)
        return { success: false, message: "Erro ao atualizar sessão" }
      }

      return { success: true, message: "Sessão atualizada" }
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
      console.error("[v0] Error creating device session:", insertError)
      return { success: false, message: "Erro ao criar sessão" }
    }

    return { success: true, message: "Sessão criada com sucesso" }
  } catch (error) {
    console.error("[v0] Error in registerDeviceSession:", error)
    return { success: false, message: "Erro ao processar sessão" }
  }
}

export async function checkDeviceSession(userId: string, deviceId: string): Promise<boolean> {
  console.log("[v0] Device session check disabled, returning true")
  return true
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
        console.error("[v0] Error updating subscription:", updateError)
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
      console.error("[v0] Error creating subscription:", insertError)
      return { success: false, message: "Erro ao criar assinatura" }
    }

    return { success: true, message: "Assinatura criada com sucesso" }
  } catch (error) {
    console.error("[v0] Error in createSubscriptionFromCakto:", error)
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
    console.error("[v0] Error calculating streak:", error)
    return 0
  }
}

export async function getUserGoals(userId: string) {
  const { data, error } = await supabase.from("user_goals").select("*").eq("user_id", userId).single()

  if (error && error.code !== "PGRST116") {
    console.error("[v0] Erro ao buscar metas:", error)
    return null
  }

  return data
}

export async function getDailyProgress(userId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from("hist_questoes")
    .select("questao_id")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString())

  if (error) {
    console.error("[v0] Erro ao buscar progresso diário:", error)
    return 0
  }

  const uniqueQuestions = new Set(data?.map((item) => item.questao_id) || [])
  return uniqueQuestions.size
}

export async function getMonthlyProgress(userId: string) {
  const firstDayOfMonth = new Date()
  firstDayOfMonth.setDate(1)
  firstDayOfMonth.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from("hist_questoes")
    .select("questao_id")
    .eq("user_id", userId)
    .gte("created_at", firstDayOfMonth.toISOString())

  if (error) {
    console.error("[v0] Erro ao buscar progresso mensal:", error)
    return 0
  }

  const uniqueQuestions = new Set(data?.map((item) => item.questao_id) || [])
  return uniqueQuestions.size
}

export async function getUserPlan(email: string): Promise<"free" | "premium"> {
  try {
    const { data, error } = await supabase
      .from("assinaturas")
      .select("plano, status, transaction_id, data_pagamento")
      .eq("email", email.toLowerCase().trim())
      .single()

    if (error || !data) {
      console.log("[v0] No subscription found for", email, "- defaulting to free")
      return "free"
    }

    if (data.plano === "premium" || data.transaction_id || data.data_pagamento) {
      return "premium"
    }

    return "free"
  } catch (error) {
    console.error("[v0] Error getting user plan:", error)
    return "free"
  }
}

export async function getDailyQuestionCount(userId: string): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from("hist_questoes")
      .select("id")
      .eq("user_id", userId)
      .gte("created_at", today.toISOString())

    if (error) {
      console.error("[v0] Error counting daily questions:", error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error("[v0] Error in getDailyQuestionCount:", error)
    return 0
  }
}

export async function getDailyQuestionCountByTheme(userId: string, theme: string): Promise<number> {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data: histData, error: histError } = await supabase
      .from("hist_questoes")
      .select("questao_id")
      .eq("user_id", userId)
      .gte("created_at", today.toISOString())

    if (histError || !histData || histData.length === 0) {
      return 0
    }

    const questaoIds = histData.map((h) => h.questao_id)

    const { data: questoesData, error: questoesError } = await supabase
      .from("questoes")
      .select("id, tema")
      .in("id", questaoIds)

    if (questoesError || !questoesData) {
      return 0
    }

    const normalizedTheme = theme.toLowerCase().trim()
    const count = questoesData.filter((q) => q.tema?.toLowerCase().trim() === normalizedTheme).length

    return count
  } catch (error) {
    console.error("[v0] Error in getDailyQuestionCountByTheme:", error)
    return 0
  }
}
