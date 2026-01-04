import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // 🔐 validação do secret
    const receivedSecret = req.headers.get("x-cakto-secret")
    const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET

    if (!expectedSecret || receivedSecret !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = body.event
    const email = body?.data?.customer?.email

    if (!email || !event) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const allowedEvents = [
      "purchase_approved",
      "subscription_payment_approved",
      "payment_approved",
    ]

    if (!allowedEvents.includes(event)) {
      return NextResponse.json({ message: "Event ignored" })
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    // ✅ UPSERT MINIMALISTA (SEM QUEBRAR)
    const { error } = await supabase
      .from("assinaturas")
      .upsert(
        {
          email,
          plano: "premium",
          status: "ativo",
          data_pagamento: new Date().toISOString(),
        },
        { onConflict: "email" }
      )

    if (error) {
      console.error("SUPABASE ERROR:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("WEBHOOK ERROR:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
