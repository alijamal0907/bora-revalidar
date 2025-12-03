import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email, secret } = await request.json()

    const webhookSecret = process.env.CAKTO_WEBHOOK_SECRET
    if (webhookSecret && secret !== webhookSecret) {
      return NextResponse.json({ error: "Invalid secret" }, { status: 401 })
    }

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing Supabase credentials")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { error: updateError } = await supabase.from("assinaturas").upsert(
      {
        email: email.toLowerCase().trim(),
        plano: "premium",
        status: "ativo",
        data_pagamento: new Date().toISOString(),
      },
      { onConflict: "email" },
    )

    if (updateError) {
      console.error("Error updating plan:", updateError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    console.log(`Successfully upgraded ${email} to premium`)
    return NextResponse.json({
      success: true,
      message: `User ${email} upgraded to premium`,
    })
  } catch (error) {
    console.error("Sync payment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
