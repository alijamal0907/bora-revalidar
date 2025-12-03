import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: existingSubscription } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${request.nextUrl.origin}/dashboard`,
      },
    })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "User creation failed" }, { status: 500 })
    }

    if (existingSubscription) {
      return NextResponse.json(
        {
          user: {
            id: authData.user.id,
            email: authData.user.email,
          },
          subscription: existingSubscription,
          message: `Welcome! Your ${existingSubscription.plano} plan is already active.`,
        },
        { status: 200 },
      )
    }

    const newAssinatura = {
      email: email.toLowerCase().trim(),
      nome: email.split("@")[0],
      plano: "free",
      status: "ativo",
      data_cadastro: new Date().toISOString(),
    }

    const { data: insertData, error: insertError } = await supabase
      .from("assinaturas")
      .insert(newAssinatura)
      .select()
      .maybeSingle()

    if (insertError) {
      return NextResponse.json(
        {
          user: {
            id: authData.user.id,
            email: authData.user.email,
          },
          warning: `User created but subscription not saved: ${insertError.message}`,
        },
        { status: 200 },
      )
    }

    return NextResponse.json(
      {
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        subscription: insertData,
      },
      { status: 200 },
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
