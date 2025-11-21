"use server"

import { getSupabaseUser } from "@/lib/auth-supabase"
import { setUserGoals } from "@/lib/storage-supabase"

export async function saveUserGoals(dailyGoal: number, monthlyGoal: number) {
  try {
    const user = await getSupabaseUser()

    if (!user) {
      return { success: false, error: "Usuário não autenticado" }
    }

    await setUserGoals(user.id, dailyGoal, monthlyGoal)

    return { success: true }
  } catch (error) {
    console.error("Erro ao salvar metas:", error)
    return { success: false, error: "Erro ao salvar metas" }
  }
}
