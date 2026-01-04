import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const caktoSecret = body.secret || request.headers.get("x-cakto-secret")
    const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET

    if (expectedSecret && caktoSecret !== expectedSecret) {
      console.error("Secret inválido")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const eventType = body.event
    const email = body.data?.customer?.email?.toLowerCase()
    const transactionId = body.data?.id || body.data?.transaction_id

    if (!email || !eventType) {
      console.error("Dados inválidos")
      return NextResponse.json({ error: "Invalid data" }, { status: 200 })
    }

    const eventosAceitos = ["purchase_approved", "subscription_payment_approved", "payment_approved"]

    if (!eventosAceitos.includes(eventType)) {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 })
    }

    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Env vars missing")
      return NextResponse.json({ error: "Config error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    })

    const updateData = {
      email,
      nome: body.data?.customer?.name || email.split("@")[0],
      plano: "premium",
      status: "ativo",
      data_pagamento: new Date().toISOString(),
      ...(transactionId && { transaction_id: transactionId }),
    }

    const { error } = await supabase.from("assinaturas").upsert(updateData, { onConflict: "email" })

    if (error) {
      console.error("Erro Supabase:", error.message)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    console.log("✅ Premium ativado:", email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro no webhook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
