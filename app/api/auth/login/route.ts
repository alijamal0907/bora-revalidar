import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
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

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
