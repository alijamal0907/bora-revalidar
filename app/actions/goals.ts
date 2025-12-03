"use server"

import { createClient } from "@/lib/supabase/server"

export async function saveUserGoals(dailyGoal: number, monthlyGoal: number) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
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
      return { success: false, error: "Erro ao salvar metas. Verifique sua conexão." }
    }

    return { success: true, data }
  } catch (error) {
    return { success: false, error: "Erro ao salvar metas. Tente novamente." }
  }
}
