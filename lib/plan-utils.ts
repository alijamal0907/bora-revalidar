export type UserPlan = "free" | "premium"

export interface PlanLimits {
  dailyQuestionsTotal: number // -1 = ilimitado
  dailyQuestionsPerTheme: number // -1 = ilimitado
  monthlyQuestions: number // -1 = ilimitado
  hasReview: boolean
  hasAdvancedStats: boolean
}

export const PLAN_LIMITS: Record<UserPlan, PlanLimits> = {
  free: {
    dailyQuestionsTotal: 15,
    dailyQuestionsPerTheme: 4,
    monthlyQuestions: 450,
    hasReview: false,
    hasAdvancedStats: false,
  },
  premium: {
    dailyQuestionsTotal: -1, // ilimitado
    dailyQuestionsPerTheme: -1, // ilimitado
    monthlyQuestions: -1, // ilimitado
    hasReview: true,
    hasAdvancedStats: true,
  },
}

export function getPlanLimits(plan: UserPlan): PlanLimits {
  return PLAN_LIMITS[plan]
}

export function canAccessReview(plan: UserPlan): boolean {
  return getPlanLimits(plan).hasReview
}

export function hasReachedDailyLimit(questionsToday: number, plan: UserPlan): boolean {
  const limits = getPlanLimits(plan)
  if (limits.dailyQuestionsTotal === -1) return false
  return questionsToday >= limits.dailyQuestionsTotal
}

export function hasReachedThemeLimit(questionsInThemeToday: number, plan: UserPlan): boolean {
  const limits = getPlanLimits(plan)
  if (limits.dailyQuestionsPerTheme === -1) return false
  return questionsInThemeToday >= limits.dailyQuestionsPerTheme
}

export function getRemainingQuestions(questionsToday: number, plan: UserPlan): number | "unlimited" {
  const limits = getPlanLimits(plan)
  if (limits.dailyQuestionsTotal === -1) return "unlimited"
  return Math.max(0, limits.dailyQuestionsTotal - questionsToday)
}

export const CAKTO_PAYMENT_URL = "https://wa.me/554588052041"
export const MERCADOPAGO_PAYMENT_URL = "https://wa.me/554588052041"

export const PAYMENT_URLS = {
  lifetime: "https://wa.me/554588052041", // PIX/Boleto - R$ 347,00
  installment: "https://wa.me/554588052041", // Cartão/Parcelado - R$ 347,00
}
