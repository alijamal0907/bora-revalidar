import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log("[v0] Signup API called for:", email)

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
              // Ignore errors in server components
            }
          },
        },
      },
    )

    const { data: existingSubscription } = await supabase
      .from("assinaturas")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single()

    console.log(
      "[v0] Existing subscription check:",
      existingSubscription ? `Found ${existingSubscription.plano}` : "Not found",
    )

    console.log("[v0] Creating user with Supabase Auth")

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${request.nextUrl.origin}/dashboard`,
      },
    })

    if (authError) {
      console.error("[v0] Auth error:", authError.message)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: "User creation failed" }, { status: 500 })
    }

    console.log("[v0] User created successfully:", authData.user.id)

    if (existingSubscription) {
      console.log("[v0] User already has subscription, skipping insert")

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

    // Se não existe assinatura, criar uma nova com plano free
    const newAssinatura = {
      email: email.toLowerCase().trim(),
      nome: email.split("@")[0],
      plano: "free",
      status: "ativo",
      data_cadastro: new Date().toISOString(),
    }

    console.log("[v0] Inserting into assinaturas:", newAssinatura)

    const { data: insertData, error: insertError } = await supabase
      .from("assinaturas")
      .insert(newAssinatura)
      .select()
      .single()

    if (insertError) {
      console.error("[v0] Error inserting into assinaturas:", insertError.message)
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

    console.log("[v0] User added to assinaturas successfully!")

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
    console.error("[v0] Fatal error in signup API:", error.message)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
