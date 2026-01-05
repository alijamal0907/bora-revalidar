import { getSupabaseClient } from "./supabase/client"

export interface DailyGoal {
  id: string
  name: string
  description: string
  target: number
  current: number
  completed: boolean
  icon: string
  category: "questoes" | "simulados" | "flashcards" | "temas"
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  progress: number
  target: number
  category: string
}

// Metas diárias pré-definidas
const DAILY_GOALS_TEMPLATE = [
  {
    name: "Resolver 20 questões hoje",
    description: "Complete 20 questões de qualquer matéria",
    target: 20,
    icon: "📝",
    category: "questoes" as const,
  },
  {
    name: "Fazer pelo menos 1 simulado hoje",
    description: "Complete um simulado completo",
    target: 1,
    icon: "🎯",
    category: "simulados" as const,
  },
  {
    name: "Revisar 15 flashcards",
    description: "Estude pelo menos 15 flashcards hoje",
    target: 15,
    icon: "🧠",
    category: "flashcards" as const,
  },
  {
    name: "Revisar flashcards de 3 temas diferentes",
    description: "Diversifique seu estudo em diferentes temas",
    target: 3,
    icon: "🎨",
    category: "temas" as const,
  },
]

// Conquistas disponíveis
const ACHIEVEMENTS_TEMPLATE = [
  {
    id: "first_20_questions",
    name: "Primeiros 20 estudos do dia",
    description: "Complete 20 questões em um único dia",
    icon: "⭐",
    target: 20,
    category: "daily",
    checkCriteria: async (userId: string) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from("hist_questoes")
        .select("questao_id")
        .eq("user_id", userId)
        .gte("created_at", today.toISOString())
      return data?.length || 0
    },
  },
  {
    id: "first_simulation",
    name: "Primeiro Simulado Concluído",
    description: "Complete seu primeiro simulado completo",
    icon: "🎓",
    target: 1,
    category: "simulation",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data } = await supabase.from("simulados_realizados").select("id").eq("user_id", userId)
      return data?.length || 0
    },
  },
  {
    id: "week_streak",
    name: "Sequência de 7 Dias",
    description: "Estude por 7 dias consecutivos",
    icon: "🔥",
    target: 7,
    category: "streak",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data: questoes } = await supabase
        .from("hist_questoes")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (!questoes || questoes.length === 0) return 0

      const dates = Array.from(new Set(questoes.map((q) => new Date(q.created_at).toISOString().split("T")[0]))).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
      )

      let streak = 1
      for (let i = 1; i < dates.length; i++) {
        const diff = Math.floor(
          (new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / (1000 * 60 * 60 * 24),
        )
        if (diff === 1) {
          streak++
        } else {
          break
        }
      }
      return streak
    },
  },
  {
    id: "flashcard_themes",
    name: "Diversidade de Temas",
    description: "Estude flashcards de 3 temas diferentes no mesmo dia",
    icon: "🌈",
    target: 3,
    category: "flashcard",
    checkCriteria: async (userId: string) => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from("flashcard_history")
        .select("tema")
        .eq("user_id", userId)
        .gte("answered_at", today.toISOString())

      const uniqueThemes = new Set(data?.map((d) => d.tema).filter(Boolean))
      return uniqueThemes.size
    },
  },
  {
    id: "questions_100",
    name: "Centenário",
    description: "Responda 100 questões no total",
    icon: "💯",
    target: 100,
    category: "total",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data } = await supabase.from("hist_questoes").select("id").eq("user_id", userId)
      return data?.length || 0
    },
  },
  {
    id: "questions_500",
    name: "Mestre das Questões",
    description: "Responda 500 questões no total",
    icon: "🏅",
    target: 500,
    category: "total",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data } = await supabase.from("hist_questoes").select("id").eq("user_id", userId)
      return data?.length || 0
    },
  },
  {
    id: "questions_1000",
    name: "Campeão Revalida",
    description: "Responda 1000 questões no total",
    icon: "👑",
    target: 1000,
    category: "total",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data } = await supabase.from("hist_questoes").select("id").eq("user_id", userId)
      return data?.length || 0
    },
  },
  {
    id: "flashcards_50",
    name: "Flashcard Expert",
    description: "Acerte 50 flashcards no total",
    icon: "🎯",
    target: 50,
    category: "flashcard",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data } = await supabase.from("flashcard_history").select("id").eq("user_id", userId).eq("correct", true)
      return data?.length || 0
    },
  },
  {
    id: "flashcards_200",
    name: "Mestre dos Flashcards",
    description: "Acerte 200 flashcards no total",
    icon: "🧠",
    target: 200,
    category: "flashcard",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data } = await supabase.from("flashcard_history").select("id").eq("user_id", userId).eq("correct", true)
      return data?.length || 0
    },
  },
  {
    id: "simulation_5",
    name: "Simulador",
    description: "Complete 5 simulados",
    icon: "📊",
    target: 5,
    category: "simulation",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data } = await supabase.from("simulados_realizados").select("id").eq("user_id", userId)
      return data?.length || 0
    },
  },
  {
    id: "simulation_70_percent",
    name: "Aprovação Garantida",
    description: "Consiga 70% ou mais em um simulado",
    icon: "🌟",
    target: 1,
    category: "simulation",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data } = await supabase
        .from("simulados_realizados")
        .select("percentual")
        .eq("user_id", userId)
        .gte("percentual", 70)
      return data?.length || 0
    },
  },
  {
    id: "month_streak",
    name: "Dedicação Total",
    description: "Estude por 30 dias consecutivos",
    icon: "💎",
    target: 30,
    category: "streak",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data: questoes } = await supabase
        .from("hist_questoes")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (!questoes || questoes.length === 0) return 0

      const dates = Array.from(new Set(questoes.map((q) => new Date(q.created_at).toISOString().split("T")[0]))).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime(),
      )

      let streak = 1
      for (let i = 1; i < dates.length; i++) {
        const diff = Math.floor(
          (new Date(dates[i - 1]).getTime() - new Date(dates[i]).getTime()) / (1000 * 60 * 60 * 24),
        )
        if (diff === 1) {
          streak++
        } else {
          break
        }
      }
      return streak
    },
  },
  {
    id: "perfect_score",
    name: "Perfeição",
    description: "Acerte 10 questões seguidas sem errar",
    icon: "✨",
    target: 10,
    category: "streak",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data: questoes } = await supabase
        .from("hist_questoes")
        .select("correta")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50)

      if (!questoes || questoes.length === 0) return 0

      let maxStreak = 0
      let currentStreak = 0

      for (const q of questoes) {
        if (q.correta) {
          currentStreak++
          maxStreak = Math.max(maxStreak, currentStreak)
        } else {
          currentStreak = 0
        }
      }

      return maxStreak
    },
  },
  {
    id: "all_themes",
    name: "Polivalente",
    description: "Estude todas as 5 matérias principais do Revalida",
    icon: "🎨",
    target: 5,
    category: "diversity",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data } = await supabase.from("hist_questoes").select("materia").eq("user_id", userId)

      const uniqueMaterias = new Set(data?.map((d) => d.materia).filter(Boolean))
      return uniqueMaterias.size
    },
  },
  {
    id: "early_bird",
    name: "Madrugador",
    description: "Estude antes das 8h da manhã por 3 dias",
    icon: "🌅",
    target: 3,
    category: "special",
    checkCriteria: async (userId: string) => {
      const supabase = getSupabaseClient()
      const { data: questoes } = await supabase.from("hist_questoes").select("created_at").eq("user_id", userId)

      if (!questoes) return 0

      const earlyMorningDays = new Set(
        questoes
          .filter((q) => {
            const hour = new Date(q.created_at).getHours()
            return hour >= 5 && hour < 8
          })
          .map((q) => new Date(q.created_at).toISOString().split("T")[0]),
      )

      return earlyMorningDays.size
    },
  },
]

// ============================
// METAS DIÁRIAS
// ============================

export async function getTodayGoals(userId: string): Promise<DailyGoal[]> {
  const supabase = getSupabaseClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Buscar progresso de questões
  const { data: questoesHoje } = await supabase
    .from("hist_questoes")
    .select("questao_id")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString())

  const questoesCount = new Set(questoesHoje?.map((q) => q.questao_id) || []).size

  // Buscar progresso de simulados
  const { data: simuladosHoje } = await supabase
    .from("simulados_realizados")
    .select("id")
    .eq("user_id", userId)
    .gte("created_at", today.toISOString())

  const simuladosCount = simuladosHoje?.length || 0

  // Buscar progresso de flashcards
  const { data: flashcardsHoje } = await supabase
    .from("flashcard_history")
    .select("flashcard_id, tema")
    .eq("user_id", userId)
    .gte("answered_at", today.toISOString())

  const flashcardsCount = flashcardsHoje?.length || 0
  const temasUnicos = new Set(flashcardsHoje?.map((f) => f.tema).filter(Boolean)).size

  // Mapear metas com progresso atual
  const goals: DailyGoal[] = DAILY_GOALS_TEMPLATE.map((template, index) => {
    let current = 0

    if (template.category === "questoes") {
      current = questoesCount
    } else if (template.category === "simulados") {
      current = simuladosCount
    } else if (template.category === "flashcards") {
      current = flashcardsCount
    } else if (template.category === "temas") {
      current = temasUnicos
    }

    return {
      id: `goal_${template.category}_${index}`,
      name: template.name,
      description: template.description,
      target: template.target,
      current,
      completed: current >= template.target,
      icon: template.icon,
      category: template.category,
    }
  })

  return goals
}

// ============================
// CONQUISTAS
// ============================

export async function getAllAchievements(userId: string): Promise<Achievement[]> {
  const supabase = getSupabaseClient()

  // Buscar conquistas já desbloqueadas
  const { data: unlockedAchievements } = await supabase.from("user_achievements").select("*").eq("user_id", userId)

  const unlockedIds = new Set(unlockedAchievements?.map((a) => a.achievement_id) || [])

  // Verificar progresso de todas as conquistas
  const achievements: Achievement[] = []

  for (const template of ACHIEVEMENTS_TEMPLATE) {
    const progress = await template.checkCriteria(userId)
    const unlocked = unlockedIds.has(template.id)
    const achievementData = unlockedAchievements?.find((a) => a.achievement_id === template.id)

    achievements.push({
      id: template.id,
      name: template.name,
      description: template.description,
      icon: template.icon,
      unlocked,
      unlockedAt: achievementData?.unlocked_at,
      progress: Math.min(progress, template.target),
      target: template.target,
      category: template.category,
    })
  }

  return achievements
}

export async function checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
  const supabase = getSupabaseClient()
  const newlyUnlocked: Achievement[] = []

  for (const template of ACHIEVEMENTS_TEMPLATE) {
    // Verificar se já está desbloqueada
    const { data: existing } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_id", template.id)
      .single()

    if (existing) continue

    // Verificar critério
    const progress = await template.checkCriteria(userId)

    if (progress >= template.target) {
      // Desbloquear conquista
      const { data: newAchievement } = await supabase
        .from("user_achievements")
        .insert({
          user_id: userId,
          achievement_id: template.id,
          name: template.name,
          description: template.description,
          icon: template.icon,
          unlocked_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (newAchievement) {
        newlyUnlocked.push({
          id: template.id,
          name: template.name,
          description: template.description,
          icon: template.icon,
          unlocked: true,
          unlockedAt: newAchievement.unlocked_at,
          progress: template.target,
          target: template.target,
          category: template.category,
        })
      }
    }
  }

  return newlyUnlocked
}

export const MOTIVATIONAL_MESSAGES = [
  "Você está cada vez mais perto do seu objetivo! 🎯",
  "Parabéns! Sua Revalidação está logo aí! 🏆",
  "Continue assim! Cada conquista te aproxima da aprovação! 💪",
  "Excelente! Você está no caminho certo para a Revalidação! ✨",
  "Seu esforço está valendo a pena! A Revalidação te espera! 🌟",
  "Incrível! Mais uma etapa vencida rumo à sua aprovação! 🎓",
  "Parabéns! Você está construindo seu sucesso na Revalidação! 🚀",
  "Continue firme! Cada passo te aproxima do seu sonho! 💫",
]

export function getRandomMotivationalMessage(): string {
  return MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]
}

export async function unlockAchievement(userId: string, achievementId: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  try {
    // Verificar se já está desbloqueada
    const { data: existing } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("achievement_id", achievementId)
      .maybeSingle()

    if (existing) {
      return false
    }

    // Encontrar template da conquista
    const template = ACHIEVEMENTS_TEMPLATE.find((t) => t.id === achievementId)

    if (!template) {
      return false
    }

    // Desbloquear
    const { error } = await supabase.from("user_achievements").insert({
      user_id: userId,
      achievement_id: achievementId,
      name: template.name,
      description: template.description,
      icon: template.icon,
      unlocked_at: new Date().toISOString(),
    })

    if (error) {
      console.warn(
        "[v0] Tabela user_achievements não existe. Execute o script SQL: scripts/create-daily-goals-tables.sql",
      )
      return true
    }

    return true
  } catch (error) {
    console.warn("[v0] Erro ao acessar conquistas:", error)
    return true
  }
}
