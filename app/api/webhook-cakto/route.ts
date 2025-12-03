import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const caktoSecret = body.secret
    const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET

    if (expectedSecret && caktoSecret !== expectedSecret) {
      console.error("Secret inválido")
      return NextResponse.json({ error: "Unauthorized" }, { status: 200 })
    }

    const email = body.data?.customer?.email
    const eventType = body.event
    const transactionId = body.data?.id || body.data?.transaction_id

    if (!email || !eventType) {
      console.error("Dados inválidos - email ou event faltando")
      return NextResponse.json({ error: "Invalid data" }, { status: 200 })
    }

    const eventosAceitos = ["purchase_approved", "subscription_payment_approved", "payment_approved"]
    if (!eventosAceitos.includes(eventType)) {
      return NextResponse.json({ message: "Event ignored" }, { status: 200 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Env vars missing")
      return NextResponse.json({ error: "Config error" }, { status: 200 })
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
      console.error("Erro ao atualizar assinatura:", error.message)
      return NextResponse.json({ error: "Database error" }, { status: 200 })
    }

    console.log("✅ Premium ativado com sucesso:", email)
    return NextResponse.json({ success: true, email, plano: "premium" })
  } catch (error: any) {
    console.error("Erro no webhook:", error?.message || error)
    return NextResponse.json({ error: "Internal error" }, { status: 200 })
  }
}
