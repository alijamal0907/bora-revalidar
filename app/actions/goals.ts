"use server"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { setUserGoals } from "@/lib/storage-supabase"

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
              // Ignore
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
      console.error("[v0] Authentication error:", authError)
      return { success: false, error: "Usuário não autenticado" }
    }

    console.log("[v0] User authenticated:", user.id)

    await setUserGoals(user.id, dailyGoal, monthlyGoal)

    return { success: true }
  } catch (error) {
    console.error("[v0] Erro ao salvar metas:", error)
    return { success: false, error: "Erro ao salvar metas" }
  }
}
