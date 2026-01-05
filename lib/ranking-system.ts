import { getSupabaseClient } from "./supabase/client"

// Tipos
export interface UserStats {
  taxaAcertoGeral: number
  taxaAcertoQuestoes: number
  taxaAcertoSimulados: number
  taxaAcertoFlashcards: number
  diasConsecutivos: number
  questoesRespondidas: number
  questoesCorretas: number
  simuladosRealizados: number
  flashcardsEstudados: number
  tempoMedioPorQuestao: number
  evolucao7dias: number
  evolucao30dias: number
  desempenhoPorMateria: Array<{
    materia: string
    total: number
    corretas: number
    taxa: number
    evolucao: "subiu" | "desceu" | "manteve"
  }>
}

export interface Meta {
  id: string
  tipo: "semanal" | "diaria"
  categoria: string
  descricao: string
  metaValor: number
  progressoAtual: number
  completada: boolean
  dataFim: string
  materia?: string
}

export interface Badge {
  id: string
  badgeId: string
  badgeNome: string
  badgeDescricao: string
  badgeIcone: string
  desbloqueado: boolean
  dataDesbloqueio?: string
}

export interface Notification {
  id: string
  tipo: "lembrete" | "progresso" | "alerta" | "incentivo"
  titulo: string
  mensagem: string
  lida: boolean
  dataCriacao: string
}

// ==============================
// CÁLCULO DE ESTATÍSTICAS
// ==============================

export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = getSupabaseClient()

  try {
    // Buscar dados de questões
    const { data: histQuestoes } = await supabase.from("hist_questoes").select("*").eq("user_id", userId)

    // Buscar dados de simulados
    const { data: simulados } = await supabase.from("simulados_realizados").select("*").eq("user_id", userId)

    // Buscar dados de flashcards
    const { data: flashcardHistory } = await supabase.from("flashcard_history").select("*").eq("user_id", userId)

    const questoes = histQuestoes || []
    const sims = simulados || []
    const flashcards = flashcardHistory || []

    // Calcular estatísticas gerais
    const questoesCorretas = questoes.filter((q) => q.correta).length
    const questoesTotal = questoes.length
    const taxaQuestoes = questoesTotal > 0 ? (questoesCorretas / questoesTotal) * 100 : 0

    const simuladosCorretas = sims.reduce((acc, s) => acc + (s.acertos || 0), 0)
    const simuladosTotal = sims.reduce((acc, s) => acc + (s.total_questoes || 0), 0)
    const taxaSimulados = simuladosTotal > 0 ? (simuladosCorretas / simuladosTotal) * 100 : 0

    const flashcardsCorretos = flashcards.filter((f) => f.correct).length
    const flashcardsTotal = flashcards.length
    const taxaFlashcards = flashcardsTotal > 0 ? (flashcardsCorretos / flashcardsTotal) * 100 : 0

    const totalAcertos = questoesCorretas + simuladosCorretas + flashcardsCorretos
    const totalTentativas = questoesTotal + simuladosTotal + flashcardsTotal
    const taxaGeral = totalTentativas > 0 ? (totalAcertos / totalTentativas) * 100 : 0

    // Calcular dias consecutivos
    const diasConsecutivos = calcularDiasConsecutivos(questoes, sims, flashcards)

    // Calcular tempo médio por questão
    const tempoTotal = sims.reduce((acc, s) => acc + (s.tempo_total || 0), 0)
    const questoesSimulados = sims.reduce((acc, s) => acc + (s.total_questoes || 0), 0)
    const tempoMedio = questoesSimulados > 0 ? tempoTotal / questoesSimulados : 0

    // Calcular evolução 7 e 30 dias
    const evolucao7 = calcularEvolucao(questoes, 7)
    const evolucao30 = calcularEvolucao(questoes, 30)

    // Desempenho por matéria
    const desempenhoPorMateria = await calcularDesempenhoPorMateria(userId, questoes)

    return {
      taxaAcertoGeral: Math.round(taxaGeral),
      taxaAcertoQuestoes: Math.round(taxaQuestoes),
      taxaAcertoSimulados: Math.round(taxaSimulados),
      taxaAcertoFlashcards: Math.round(taxaFlashcards),
      diasConsecutivos,
      questoesRespondidas: questoesTotal,
      questoesCorretas,
      simuladosRealizados: sims.length,
      flashcardsEstudados: flashcardsTotal,
      tempoMedioPorQuestao: Math.round(tempoMedio),
      evolucao7dias: evolucao7,
      evolucao30dias: evolucao30,
      desempenhoPorMateria,
    }
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error)
    throw error
  }
}

function calcularDiasConsecutivos(questoes: any[], simulados: any[], flashcards: any[]): number {
  const todasDatas = [
    ...questoes.map((q) => q.answered_at || q.created_at),
    ...simulados.map((s) => s.created_at),
    ...flashcards.map((f) => f.answered_at || f.created_at),
  ]

  if (todasDatas.length === 0) return 0

  const datasUnicas = Array.from(new Set(todasDatas.map((d) => new Date(d).toISOString().split("T")[0]))).sort()

  let consecutivos = 1
  let maxConsecutivos = 1

  for (let i = 1; i < datasUnicas.length; i++) {
    const dataAtual = new Date(datasUnicas[i])
    const dataAnterior = new Date(datasUnicas[i - 1])
    const diffDias = Math.floor((dataAtual.getTime() - dataAnterior.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDias === 1) {
      consecutivos++
      maxConsecutivos = Math.max(maxConsecutivos, consecutivos)
    } else {
      consecutivos = 1
    }
  }

  return maxConsecutivos
}

function calcularEvolucao(questoes: any[], dias: number): number {
  const dataLimite = new Date()
  dataLimite.setDate(dataLimite.getDate() - dias)

  const questoesRecentes = questoes.filter((q) => new Date(q.answered_at || q.created_at) >= dataLimite)

  if (questoesRecentes.length === 0) return 0

  const corretas = questoesRecentes.filter((q) => q.correta).length
  const taxa = (corretas / questoesRecentes.length) * 100

  return Math.round(taxa)
}

async function calcularDesempenhoPorMateria(userId: string, questoes: any[]) {
  const supabase = getSupabaseClient()

  const { data: todasQuestoes } = await supabase.from("questoes").select("id, materia")

  if (!todasQuestoes) return []

  const materiaMap: { [key: string]: { total: number; corretas: number } } = {}

  questoes.forEach((h) => {
    const questao = todasQuestoes.find((q) => q.id === h.questao_id)
    if (questao && questao.materia) {
      const materia = questao.materia

      if (!materiaMap[materia]) {
        materiaMap[materia] = { total: 0, corretas: 0 }
      }

      materiaMap[materia].total++
      if (h.correta) {
        materiaMap[materia].corretas++
      }
    }
  })

  const resultado = Object.entries(materiaMap)
    .map(([materia, stats]) => ({
      materia,
      total: stats.total,
      corretas: stats.corretas,
      taxa: stats.total > 0 ? Math.round((stats.corretas / stats.total) * 100) : 0,
      evolucao: "manteve" as "subiu" | "desceu" | "manteve",
    }))
    .sort((a, b) => b.taxa - a.taxa)
    .slice(0, 5)

  return resultado
}

// ==============================
// METAS AUTOMÁTICAS
// ==============================

export async function gerarMetasAutomaticas(userId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const stats = await getUserStats(userId)

  const metasSugeridas: Array<Omit<Meta, "id">> = []

  // Meta 1: Melhorar matéria mais fraca
  if (stats.desempenhoPorMateria.length > 0) {
    const materiaFraca = stats.desempenhoPorMateria[stats.desempenhoPorMateria.length - 1]
    if (materiaFraca.taxa < 70) {
      metasSugeridas.push({
        tipo: "semanal",
        categoria: "materia",
        descricao: `Aumentar taxa de acerto em ${materiaFraca.materia} para 70%`,
        metaValor: 70,
        progressoAtual: materiaFraca.taxa,
        completada: false,
        dataFim: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        materia: materiaFraca.materia,
      })
    }
  }

  // Meta 2: Revisar flashcards
  if (stats.taxaAcertoFlashcards < 80) {
    metasSugeridas.push({
      tipo: "diaria",
      categoria: "flashcards",
      descricao: "Revisar 15 flashcards hoje",
      metaValor: 15,
      progressoAtual: 0,
      completada: false,
      dataFim: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
  }

  // Meta 3: Questões diárias
  metasSugeridas.push({
    tipo: "diaria",
    categoria: "questoes",
    descricao: "Responder 20 questões hoje",
    metaValor: 20,
    progressoAtual: 0,
    completada: false,
    dataFim: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  })

  // Inserir metas no banco
  for (const meta of metasSugeridas) {
    await supabase.from("user_metas").insert({
      user_id: userId,
      tipo: meta.tipo,
      categoria: meta.categoria,
      descricao: meta.descricao,
      meta_valor: meta.metaValor,
      progresso_atual: meta.progressoAtual,
      completada: meta.completada,
      data_fim: meta.dataFim,
      materia: meta.materia,
    })
  }
}

export async function getMetasUsuario(userId: string): Promise<Meta[]> {
  const supabase = getSupabaseClient()

  const { data } = await supabase
    .from("user_metas")
    .select("*")
    .eq("user_id", userId)
    .eq("completada", false)
    .order("created_at", { ascending: false })

  if (!data) return []

  return data.map((m) => ({
    id: m.id,
    tipo: m.tipo,
    categoria: m.categoria,
    descricao: m.descricao,
    metaValor: m.meta_valor,
    progressoAtual: m.progresso_atual,
    completada: m.completada,
    dataFim: m.data_fim,
    materia: m.materia,
  }))
}

export async function atualizarProgressoMeta(metaId: string, novoProgresso: number): Promise<void> {
  const supabase = getSupabaseClient()

  const { data: meta } = await supabase.from("user_metas").select("*").eq("id", metaId).single()

  if (!meta) return

  const completada = novoProgresso >= meta.meta_valor

  await supabase
    .from("user_metas")
    .update({
      progresso_atual: novoProgresso,
      completada,
      updated_at: new Date().toISOString(),
    })
    .eq("id", metaId)
}

// ==============================
// SISTEMA DE BADGES
// ==============================

const BADGES_DISPONIVEIS = [
  {
    badgeId: "primeiros_100_acertos",
    badgeNome: "Primeiros 100 Acertos",
    badgeDescricao: "Acerte 100 questões",
    badgeIcone: "🎯",
    criterio: (stats: UserStats) => stats.questoesCorretas >= 100,
  },
  {
    badgeId: "7_dias_consecutivos",
    badgeNome: "7 Dias Seguidos",
    badgeDescricao: "Estude por 7 dias consecutivos",
    badgeIcone: "🔥",
    criterio: (stats: UserStats) => stats.diasConsecutivos >= 7,
  },
  {
    badgeId: "primeiro_simulado_70",
    badgeNome: "Simulado de Ouro",
    badgeDescricao: "Primeiro simulado acima de 70%",
    badgeIcone: "🏆",
    criterio: (stats: UserStats) => stats.taxaAcertoSimulados >= 70,
  },
  {
    badgeId: "mestre_flashcards",
    badgeNome: "Mestre dos Flashcards",
    badgeDescricao: "Taxa de acerto em flashcards acima de 85%",
    badgeIcone: "🧠",
    criterio: (stats: UserStats) => stats.taxaAcertoFlashcards >= 85,
  },
  {
    badgeId: "questoes_500",
    badgeNome: "500 Questões",
    badgeDescricao: "Responda 500 questões",
    badgeIcone: "⭐",
    criterio: (stats: UserStats) => stats.questoesRespondidas >= 500,
  },
]

export async function verificarEDesbloquearBadges(userId: string): Promise<Badge[]> {
  const supabase = getSupabaseClient()
  const stats = await getUserStats(userId)

  const { data: badgesExistentes } = await supabase.from("user_badges").select("*").eq("user_id", userId)

  const badgesDesbloqueados: Badge[] = []

  for (const badge of BADGES_DISPONIVEIS) {
    const jaExiste = badgesExistentes?.find((b) => b.badge_id === badge.badgeId)

    if (!jaExiste && badge.criterio(stats)) {
      const { data: novoBadge } = await supabase
        .from("user_badges")
        .insert({
          user_id: userId,
          badge_id: badge.badgeId,
          badge_nome: badge.badgeNome,
          badge_descricao: badge.badgeDescricao,
          badge_icone: badge.badgeIcone,
          desbloqueado: true,
          data_desbloqueio: new Date().toISOString(),
        })
        .select()
        .single()

      if (novoBadge) {
        badgesDesbloqueados.push({
          id: novoBadge.id,
          badgeId: novoBadge.badge_id,
          badgeNome: novoBadge.badge_nome,
          badgeDescricao: novoBadge.badge_descricao,
          badgeIcone: novoBadge.badge_icone,
          desbloqueado: true,
          dataDesbloqueio: novoBadge.data_desbloqueio,
        })
      }
    }
  }

  return badgesDesbloqueados
}

export async function getBadgesUsuario(userId: string): Promise<Badge[]> {
  const supabase = getSupabaseClient()

  const { data } = await supabase
    .from("user_badges")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (!data) return []

  return data.map((b) => ({
    id: b.id,
    badgeId: b.badge_id,
    badgeNome: b.badge_nome,
    badgeDescricao: b.badge_descricao,
    badgeIcone: b.badge_icone,
    desbloqueado: b.desbloqueado,
    dataDesbloqueio: b.data_desbloqueio,
  }))
}

// ==============================
// NOTIFICAÇÕES INTELIGENTES
// ==============================

export async function gerarNotificacoesInteligentes(userId: string): Promise<void> {
  const supabase = getSupabaseClient()
  const stats = await getUserStats(userId)

  const notificacoes: Array<Omit<Notification, "id">> = []

  // Verificar se não estudou recentemente
  const { data: ultimaAtividade } = await supabase
    .from("hist_questoes")
    .select("answered_at")
    .eq("user_id", userId)
    .order("answered_at", { ascending: false })
    .limit(1)
    .single()

  if (ultimaAtividade) {
    const diasSemEstudar = Math.floor(
      (Date.now() - new Date(ultimaAtividade.answered_at).getTime()) / (1000 * 60 * 60 * 24),
    )

    if (diasSemEstudar >= 2) {
      notificacoes.push({
        tipo: "lembrete",
        titulo: "Sentimos sua falta!",
        mensagem: `Você está há ${diasSemEstudar} dias sem estudar. Que tal revisar algumas questões?`,
        lida: false,
        dataCriacao: new Date().toISOString(),
      })
    }
  }

  // Notificação de progresso
  if (stats.evolucao7dias > stats.evolucao30dias) {
    notificacoes.push({
      tipo: "progresso",
      titulo: "Parabéns! Você está evoluindo!",
      mensagem: `Sua taxa de acerto aumentou ${stats.evolucao7dias - stats.evolucao30dias}% nos últimos 7 dias!`,
      lida: false,
      dataCriacao: new Date().toISOString(),
    })
  }

  // Alerta de queda de desempenho
  if (stats.evolucao7dias < stats.evolucao30dias - 10) {
    notificacoes.push({
      tipo: "alerta",
      titulo: "Atenção ao desempenho",
      mensagem: "Sua taxa de acerto caiu nos últimos dias. Vamos reforçar os estudos?",
      lida: false,
      dataCriacao: new Date().toISOString(),
    })
  }

  // Incentivo para meta
  const metas = await getMetasUsuario(userId)
  const metasPendentes = metas.filter((m) => !m.completada)

  if (metasPendentes.length > 0) {
    const metaProxima = metasPendentes[0]
    const faltam = metaProxima.metaValor - metaProxima.progressoAtual

    if (faltam <= 5 && faltam > 0) {
      notificacoes.push({
        tipo: "incentivo",
        titulo: "Quase lá!",
        mensagem: `Faltam apenas ${faltam} para completar sua meta: ${metaProxima.descricao}`,
        lida: false,
        dataCriacao: new Date().toISOString(),
      })
    }
  }

  // Inserir notificações
  for (const notif of notificacoes) {
    await supabase.from("user_notifications").insert({
      user_id: userId,
      tipo: notif.tipo,
      titulo: notif.titulo,
      mensagem: notif.mensagem,
      lida: notif.lida,
      data_criacao: notif.dataCriacao,
    })
  }
}

export async function getNotificacoesUsuario(userId: string): Promise<Notification[]> {
  const supabase = getSupabaseClient()

  const { data } = await supabase
    .from("user_notifications")
    .select("*")
    .eq("user_id", userId)
    .order("data_criacao", { ascending: false })
    .limit(20)

  if (!data) return []

  return data.map((n) => ({
    id: n.id,
    tipo: n.tipo,
    titulo: n.titulo,
    mensagem: n.mensagem,
    lida: n.lida,
    dataCriacao: n.data_criacao,
  }))
}

export async function marcarNotificacaoComoLida(notificationId: string): Promise<void> {
  const supabase = getSupabaseClient()

  await supabase.from("user_notifications").update({ lida: true }).eq("id", notificationId)
}
