import { supabase } from './supabase'
import { StudyCard, ReviewResult } from './spaced-repetition'

export async function getQuestoesAsCards(usuarioId: string): Promise<StudyCard[]> {
  try {
    const { data: questoes, error } = await supabase
      .from('questoes')
      .select('*')
      .limit(100)

    if (error) {
      console.error('[v0] Error fetching questoes:', error)
      return []
    }

    if (!questoes) return []

    return questoes.map((q: any) => {
      const dificuldadeStr = String(q.dificuldade || 'medium').toLowerCase()
      return {
        id: q.id,
        question: q.enunciado || q.question || '',
        answer: q.resposta || q.answer || '',
        category: q.categoria || q.category || 'General',
        difficulty: ['facil', 'facile', 'fácil', 'easy', 'low'].includes(dificuldadeStr) 
          ? 'easy' 
          : ['dificil', 'difícil', 'hard', 'high'].includes(dificuldadeStr) 
            ? 'hard' 
            : 'medium',
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReview: Date.now(),
        lastReviewed: null,
      }
    })
  } catch (error) {
    console.error('[v0] Error in getQuestoesAsCards:', error)
    return []
  }
}

export async function saveReviewToHistory(
  usuarioId: string,
  cardId: string,
  quality: number,
  timestamp: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('hist_questoes')
      .insert([
        {
          questao_id: cardId,
          qualidade: quality,
          data_revisao: new Date(timestamp).toISOString(),
          // usuario_id and user_id removed - let Supabase handle via RLS or triggers
        },
      ])

    if (error) {
      console.error('[v0] Error saving review to history:', error)
      throw error
    }

    console.log('[v0] Review saved successfully')
  } catch (error) {
    console.error('[v0] Error in saveReviewToHistory:', error)
    throw error
  }
}

export async function getMarcacoesRevisaoData(usuarioId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('marcacoes_revisao')
      .select('*')
      .eq('usuario_id', usuarioId)

    if (error) {
      console.error('[v0] Error fetching marcacoes_revisao:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('[v0] Error in getMarcacoesRevisaoData:', error)
    return []
  }
}

export async function getHistoricoQuestoes(usuarioId: string): Promise<ReviewResult[]> {
  try {
    const { data: historico, error } = await supabase
      .from('hist_questoes')
      .select('*')

    if (error) {
      console.error('[v0] Error fetching historico:', error)
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
    console.error('[v0] Error in getHistoricoQuestoes:', error)
    return []
  }
}

export async function initializeCardsFromSupabase(usuarioId: string): Promise<StudyCard[]> {
  return await getQuestoesAsCards(usuarioId)
}

export async function markForLaterReview(
  usuarioId: string,
  cardId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('marcacoes_revisao')
      .insert([
        {
          questao_id: cardId,
          data_marcacao: new Date().toISOString(),
          status: 'marked',
        },
      ])

    if (error) {
      console.error('[v0] Error marking for later review:', error)
      throw error
    }
  } catch (error) {
    console.error('[v0] Error in markForLaterReview:', error)
    throw error
  }
}

export async function unmarkForLaterReview(cardId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('marcacoes_revisao')
      .delete()
      .eq('questao_id', cardId)

    if (error) {
      console.error('[v0] Error unmarking question:', error)
      throw error
    }
  } catch (error) {
    console.error('[v0] Error in unmarkForLaterReview:', error)
    throw error
  }
}

export async function getUniqueThemes(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('questoes')
      .select('tema')
      .limit(1000)

    if (error) {
      console.error('[v0] Error fetching themes:', error)
      return []
    }

    if (!data || data.length === 0) return []

    const themes = new Set<string>()
    data.forEach((q: any) => {
      if (q.tema && typeof q.tema === 'string') {
        // Normalizar: trim e lowercase
        const normalized = q.tema.trim().toLowerCase()
        if (normalized) {
          themes.add(normalized)
        }
      }
    })

    const sortedThemes = Array.from(themes).sort()
    console.log('[v0] Unique themes found:', sortedThemes)
    return sortedThemes
  } catch (error) {
    console.error('[v0] Error in getUniqueThemes:', error)
    return []
  }
}

export async function getQuestoesAsCardsByTheme(
  usuarioId: string,
  tema?: string
): Promise<StudyCard[]> {
  try {
    let query = supabase.from('questoes').select('*')

    if (tema) {
      query = query.eq('tema', tema)
    }

    const { data: questoes, error } = await query.limit(500)

    if (error) {
      console.error('[v0] Error fetching questoes by theme:', error)
      return []
    }

    if (!questoes || questoes.length === 0) return []

    return questoes.map((q: any) => {
      const dificuldadeStr = String(q.dificuldade || 'medium').toLowerCase()

      return {
        id: q.id,
        question: q.enunciado || q.question || '',
        answer: q.resposta || q.answer || '',
        category: q.tema || 'Geral',
        difficulty: ['facil', 'facile', 'fácil', 'easy', 'low'].includes(dificuldadeStr)
          ? 'easy'
          : ['dificil', 'difícil', 'hard', 'high'].includes(dificuldadeStr)
            ? 'hard'
            : 'medium',
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReview: Date.now(),
        lastReviewed: null,
      }
    })
  } catch (error) {
    console.error('[v0] Error in getQuestoesAsCardsByTheme:', error)
    return []
  }
}

export async function getQuestoesAsCardsByMultipleThemes(
  usuarioId: string,
  temas?: string[]
): Promise<StudyCard[]> {
  try {
    let query = supabase.from('questoes').select('*')

    if (temas && temas.length > 0) {
      query = query.in('tema', temas)
    }

    const { data: questoes, error } = await query.limit(500)

    if (error) {
      console.error('[v0] Error fetching questoes by themes:', error)
      return []
    }

    if (!questoes || questoes.length === 0) return []

    return questoes.map((q: any) => {
      const dificuldadeStr = String(q.dificuldade || 'medium').toLowerCase()

      return {
        id: q.id,
        question: q.enunciado || q.question || '',
        answer: q.resposta || q.answer || '',
        category: q.tema || 'Geral',
        difficulty: ['facil', 'facile', 'fácil', 'easy', 'low'].includes(dificuldadeStr)
          ? 'easy'
          : ['dificil', 'difícil', 'hard', 'high'].includes(dificuldadeStr)
            ? 'hard'
            : 'medium',
        repetitions: 0,
        easeFactor: 2.5,
        interval: 1,
        nextReview: Date.now(),
        lastReviewed: null,
      }
    })
  } catch (error) {
    console.error('[v0] Error in getQuestoesAsCardsByMultipleThemes:', error)
    return []
  }
}

export async function saveQuizAnswer(
  userId: string,
  questaoId: string,
  resposta: string,
  correta: boolean,
  origem: 'estudo' | 'simulado'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('hist_questoes')
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
      console.error('[v0] Error saving quiz answer:', error)
      throw error
    }
  } catch (error) {
    console.error('[v0] Error in saveQuizAnswer:', error)
    throw error
  }
}

export async function getWrongAnswers(userId: string): Promise<any[]> {
  try {
    const { data: historico, error: histError } = await supabase
      .from('hist_questoes')
      .select('*')
      .eq('correta', false)
      .order('created_at', { ascending: false })
      .limit(100)

    if (histError) {
      console.error('[v0] Error fetching wrong answers from hist:', histError)
      return []
    }

    if (!historico || historico.length === 0) return []

    const questaoIds = [...new Set(historico.map(h => h.questao_id))]
    
    const { data: questoes, error: questError } = await supabase
      .from('questoes')
      .select('*')
      .in('id', questaoIds)

    if (questError) {
      console.error('[v0] Error fetching questoes:', questError)
      return []
    }

    return (questoes || []).map((q: any) => ({
      ...q,
      wrongCount: historico.filter((h: any) => h.questao_id === q.id).length,
    }))
  } catch (error) {
    console.error('[v0] Error in getWrongAnswers:', error)
    return []
  }
}

export async function getProgressByTheme(userId: string): Promise<any[]> {
  try {
    const { data: historico, error: histError } = await supabase
      .from('hist_questoes')
      .select('*')

    if (histError) {
      console.error('[v0] Error fetching historico:', histError)
      return []
    }

    const { data: questoes, error: questError } = await supabase
      .from('questoes')
      .select('*')

    if (questError) {
      console.error('[v0] Error fetching questoes:', questError)
      return []
    }

    if (!historico || !questoes) return []

    const themeMap: { [key: string]: { total: number; correct: number; wrong: number } } = {}

    historico.forEach((h: any) => {
      const questao = questoes.find((q: any) => q.id === h.questao_id)
      if (questao) {
        const theme = questao.tema || 'Sem Tema'

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

    return Object.entries(themeMap).map(([theme, stats]) => ({
      theme,
      total: stats.total,
      correct: stats.correct,
      wrong: stats.wrong,
      percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
    }))
  } catch (error) {
    console.error('[v0] Error in getProgressByTheme:', error)
    return []
  }
}

export async function getQuestoesWithAlternatives(
  usuarioId: string,
  temas?: string[],
  limit: number = 500
): Promise<any[]> {
  try {
    console.log('[v0] getQuestoesWithAlternatives called with temas:', temas)
    
    // Buscar todas as questões primeiro
    const { data: allQuestoes, error: fetchError } = await supabase
      .from('questoes')
      .select('*')
      .limit(limit)
    
    if (fetchError) {
      console.error('[v0] Error fetching questoes with alternatives:', fetchError)
      return []
    }

    console.log('[v0] Total questions fetched from database:', allQuestoes?.length)

    if (!allQuestoes || allQuestoes.length === 0) {
      console.log('[v0] No questions found in database')
      return []
    }

    // Se nenhum tema foi selecionado, retornar todas
    if (!temas || temas.length === 0) {
      console.log('[v0] No theme filter, returning all questions')
      return allQuestoes
    }

    // Normalizar temas selecionados
    const normalizedTemas = temas.map(t => t.trim().toLowerCase())
    console.log('[v0] Normalized theme filters:', normalizedTemas)

    // Filtrar por tema normalizado
    const filtered = allQuestoes.filter((q: any) => {
      const questaoTema = String(q.tema || '').trim().toLowerCase()
      const matches = normalizedTemas.includes(questaoTema)
      
      if (!matches && questaoTema) {
        console.log('[v0] Question tema not matching:', questaoTema, 'Looking for:', normalizedTemas)
      }
      
      return matches
    })

    console.log('[v0] Questions after theme filter:', filtered.length)
    console.log('[v0] Sample filtered question themes:', filtered.slice(0, 3).map(q => q.tema))
    
    return filtered
  } catch (error) {
    console.error('[v0] Error in getQuestoesWithAlternatives:', error)
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
      .from('assinaturas')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (error || !data) {
      return {
        isActive: false,
        message: 'Assinatura não encontrada. Realize o pagamento na plataforma Cakto para ter acesso.',
      }
    }

    if (data.status !== 'ativo' && data.status !== 'active') {
      return {
        isActive: false,
        message: 'Sua assinatura está pendente de aprovação. Aguarde a confirmação do pagamento.',
      }
    }

    return {
      isActive: true,
      message: 'Assinatura ativa',
      subscription: data,
    }
  } catch (error) {
    console.error('[v0] Error checking subscription:', error)
    return {
      isActive: false,
      message: 'Erro ao verificar assinatura',
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
  }
): Promise<{ success: boolean; message: string }> {
  try {
    // Verificar se já existe sessão ativa em outro dispositivo
    const { data: existingSessions, error: fetchError } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('active', true)

    if (fetchError) {
      console.error('[v0] Error fetching existing sessions:', fetchError)
    }

    // Se há sessões ativas em outros dispositivos, desativa-las
    if (existingSessions && existingSessions.length > 0) {
      const { error: deactivateError } = await supabase
        .from('user_devices')
        .update({ active: false, ended_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('active', true)

      if (deactivateError) {
        console.error('[v0] Error deactivating old sessions:', deactivateError)
      } else {
        console.log('[v0] Deactivated sessions on other devices')
      }
    }

    // Registrar nova sessão do dispositivo atual
    const { error: insertError } = await supabase
      .from('user_devices')
      .insert([
        {
          user_id: userId,
          email: email,
          device_id: deviceInfo.deviceId,
          user_agent: deviceInfo.userAgent,
          platform: deviceInfo.platform,
          active: true,
          last_active: new Date().toISOString(),
          started_at: new Date().toISOString(),
        },
      ])

    if (insertError) {
      console.error('[v0] Error registering device session:', insertError)
      return {
        success: false,
        message: 'Erro ao registrar dispositivo',
      }
    }

    return {
      success: true,
      message: 'Dispositivo registrado com sucesso',
    }
  } catch (error) {
    console.error('[v0] Error in registerDeviceSession:', error)
    return {
      success: false,
      message: 'Erro ao gerenciar sessão',
    }
  }
}

export async function checkDeviceSession(userId: string, deviceId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_devices')
      .select('*')
      .eq('user_id', userId)
      .eq('device_id', deviceId)
      .eq('active', true)
      .single()

    if (error || !data) {
      console.log('[v0] No active session found for this device')
      return false
    }

    // Atualizar last_active
    await supabase
      .from('user_devices')
      .update({ last_active: new Date().toISOString() })
      .eq('id', data.id)

    return true
  } catch (error) {
    console.error('[v0] Error checking device session:', error)
    return false
  }
}

export async function createSubscriptionFromCakto(
  email: string,
  nome: string,
  transactionId?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const { data: existing, error: checkError } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      // Atualizar para ativo se já existe
      const { error: updateError } = await supabase
        .from('assinaturas')
        .update({
          status: 'ativo',
          data_pagamento: new Date().toISOString(),
          transaction_id: transactionId,
        })
        .eq('email', email.toLowerCase().trim())

      if (updateError) {
        console.error('[v0] Error updating subscription:', updateError)
        return { success: false, message: 'Erro ao atualizar assinatura' }
      }

      return { success: true, message: 'Assinatura ativada com sucesso' }
    }

    // Criar nova assinatura
    const { error: insertError } = await supabase
      .from('assinaturas')
      .insert([
        {
          email: email.toLowerCase().trim(),
          nome: nome || email.split('@')[0],
          status: 'ativo',
          data_cadastro: new Date().toISOString(),
          data_pagamento: new Date().toISOString(),
          transaction_id: transactionId,
        },
      ])

    if (insertError) {
      console.error('[v0] Error creating subscription:', insertError)
      return { success: false, message: 'Erro ao criar assinatura' }
    }

    return { success: true, message: 'Assinatura criada com sucesso' }
  } catch (error) {
    console.error('[v0] Error in createSubscriptionFromCakto:', error)
    return { success: false, message: 'Erro ao processar assinatura' }
  }
}
