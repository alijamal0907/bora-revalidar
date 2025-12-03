"use server"

import { createClient } from "@/lib/supabase/server"

export async function saveUserGoals(dailyGoal: number, monthlyGoal: number) {
  try {
    console.log("[v0] saveUserGoals called with:", { dailyGoal, monthlyGoal })

    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Auth check:", { user: user?.email, authError: authError?.message })

    if (authError || !user) {
      console.error("[v0] Auth failed:", authError)
      return { success: false, error: "Usuário não autenticado. Faça login novamente." }
    }

    const { data, error } = await supabase
      .from("user_goals")
      .upsert(
        {
          user_id: user.id,
          daily_questions_goal: dailyGoal,
          monthly_questions_goal: monthlyGoal,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        },
      )
      .select()
      .single()

    if (error) {
      console.error("[v0] Database error:", error)
      return { success: false, error: "Erro ao salvar metas. Verifique sua conexão." }
    }

    console.log("[v0] Goals saved successfully for user:", user.email)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Exception in saveUserGoals:", error)
    return { success: false, error: "Erro ao salvar metas. Tente novamente." }
  }
}
