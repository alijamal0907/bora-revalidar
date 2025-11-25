import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

// Webhook da Cakto para registrar assinaturas após pagamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log("[v0] ========== WEBHOOK CAKTO ==========")
    console.log("[v0] Headers:", Object.fromEntries(request.headers.entries()))
    console.log("[v0] Body completo:", JSON.stringify(body, null, 2))

    const caktoToken =
      request.headers.get("x-cakto-signature") ||
      request.headers.get("x-webhook-signature") ||
      request.headers.get("authorization")?.replace("Bearer ", "")
    const expectedToken = process.env.CAKTO_WEBHOOK_SECRET

    // Se o token está configurado E foi enviado, valida
    // Se não está configurado, aceita qualquer requisição (modo desenvolvimento)
    if (expectedToken && caktoToken && caktoToken !== expectedToken) {
      console.error("[v0] Token inválido do webhook Cakto")
      console.error("[v0] Token recebido:", caktoToken)
      console.error("[v0] Token esperado:", expectedToken)
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    if (expectedToken && !caktoToken) {
      console.warn("[v0] ⚠️ Token não enviado pela Cakto, mas esperado")
    }

    if (!expectedToken) {
      console.warn("[v0] ⚠️ CAKTO_WEBHOOK_SECRET não configurado - aceitando qualquer webhook")
    }

    const data = body.data || body.payment || body

    const email = data.email || data.customer_email || data.buyer_email
    const nome = data.nome || data.name || data.customer_name || data.buyer_name
    const status = data.status || data.payment_status || data.state
    const transaction_id = data.transaction_id || data.id || data.payment_id
    const valor = data.valor || data.amount || data.price

    console.log("[v0] Dados extraídos:")
    console.log("[v0] - Email:", email)
    console.log("[v0] - Nome:", nome)
    console.log("[v0] - Status:", status)
    console.log("[v0] - Transaction ID:", transaction_id)
    console.log("[v0] - Valor:", valor)

    if (!email || !email.includes("@")) {
      console.error("[v0] Email inválido ou ausente:", email)
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    const statusAprovados = ["approved", "completed", "paid", "success", "ativo", "active"]
    const statusLowerCase = status?.toLowerCase() || ""

    if (!statusAprovados.includes(statusLowerCase)) {
      console.log("[v0] Pagamento ainda não aprovado. Status:", status)
      return NextResponse.json({
        message: "Pagamento pendente",
        status: status,
      })
    }

    console.log("[v0] Pagamento APROVADO! Atualizando para PREMIUM...")

    // Verifica se já existe assinatura para este email
    const { data: existente } = await supabase.from("assinaturas").select("*").eq("email", email).single()

    if (existente) {
      const { error: updateError } = await supabase
        .from("assinaturas")
        .update({
          status: "ativo",
          plano: "premium",
          data_pagamento: new Date().toISOString(),
          transaction_id: transaction_id || `cakto_${Date.now()}`,
          valor: valor || 0,
        })
        .eq("email", email)

      if (updateError) {
        console.error("[v0] Erro ao atualizar assinatura:", updateError)
        return NextResponse.json({ error: "Erro ao atualizar assinatura" }, { status: 500 })
      }

      console.log("[v0] ✅ Assinatura atualizada para PREMIUM:", email)
    } else {
      const { error: insertError } = await supabase.from("assinaturas").insert({
        email,
        nome: nome || email.split("@")[0],
        status: "ativo",
        plano: "premium",
        data_cadastro: new Date().toISOString(),
        data_pagamento: new Date().toISOString(),
        transaction_id: transaction_id || `cakto_${Date.now()}`,
        valor: valor || 0,
      })

      if (insertError) {
        console.error("[v0] Erro ao criar assinatura:", insertError)
        return NextResponse.json({ error: "Erro ao criar assinatura" }, { status: 500 })
      }

      console.log("[v0] ✅ Nova assinatura PREMIUM criada:", email)
    }

    console.log("[v0] ========== FIM WEBHOOK CAKTO ==========")

    return NextResponse.json({
      success: true,
      message: "Assinatura Premium registrada com sucesso",
      email: email,
      plano: "premium",
    })
  } catch (error) {
    console.error("[v0] ❌ Erro no webhook Cakto:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
