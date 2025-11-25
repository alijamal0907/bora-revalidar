import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("[v0] Webhook Cakto recebido:", body.event)

    const caktoSecret = body.secret
    const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET

    if (expectedSecret && caktoSecret !== expectedSecret) {
      console.error("[v0] Secret inválido")
      return NextResponse.json({ error: "Unauthorized" }, { status: 200 })
    }

    const email = body.data?.customer?.email
    const eventType = body.event

    if (!email || !eventType) {
      console.error("[v0] Dados inválidos")
      return NextResponse.json({ error: "Invalid data" }, { status: 200 })
    }

    const eventosAceitos = ["purchase_approved", "subscription_payment_approved", "payment_approved"]
    if (!eventosAceitos.includes(eventType)) {
      console.log("[v0] Evento ignorado:", eventType)
      return NextResponse.json({ message: "Event ignored" }, { status: 200 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("[v0] Env vars missing")
      return NextResponse.json({ error: "Config error" }, { status: 200 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    const { error } = await supabase.from("assinaturas").upsert(
      {
        email,
        nome: body.data?.customer?.name || email.split("@")[0],
        plano: "premium",
        status: "ativo",
        data_pagamento: new Date().toISOString(),
      },
      { onConflict: "email" },
    )

    if (error) {
      console.error("[v0] Erro DB:", error.message)
      return NextResponse.json({ error: "Database error" }, { status: 200 })
    }

    console.log("[v0] ✅ Premium ativado:", email)
    return NextResponse.json({ success: true, email })
  } catch (error: any) {
    console.error("[v0] Erro webhook:", error?.message || error)
    return NextResponse.json({ error: "Internal error" }, { status: 200 })
  }
}
