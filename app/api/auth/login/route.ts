import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    console.log("[v0] Login attempt for:", email)
    console.log("[v0] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30))

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    console.log("[v0] Supabase client created:", !!supabase)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    console.log("[v0] Login response - error:", error?.message, "user:", data?.user?.email)

    if (error) {
      console.error("[v0] Auth error:", error)
      // Traduzir mensagens de erro comuns
      let errorMessage = error.message
      if (error.message === "Invalid login credentials") {
        errorMessage = "E-mail ou senha incorretos"
      } else if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Por favor, confirme seu e-mail antes de fazer login"
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "Não foi possível fazer login" },
        { status: 401 }
      )
    }

    console.log("[v0] Login successful for:", data.user.email)

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session,
    })
  } catch (error: any) {
    console.error("[v0] Login API error:", error.message)
    console.error("[v0] Full error:", error)
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
