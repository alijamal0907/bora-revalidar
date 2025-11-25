"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function saveUserGoals(dailyGoal: number, monthlyGoal: number) {
  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // Ignore cookie errors in server actions
            }
          },
        },
      },
    )

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
      console.error("Error saving goals:", error)
      return { success: false, error: "Erro ao salvar metas. Verifique sua conexão." }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Exception in saveUserGoals:", error)
    return { success: false, error: "Erro ao salvar metas. Tente novamente." }
  }
}
