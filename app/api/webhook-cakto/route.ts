import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Webhook da Cakto para registrar assinaturas após pagamento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('[v0] Webhook recebido da Cakto:', body)
    
    // Valida o token de segurança da Cakto
    const caktoToken = request.headers.get('x-cakto-signature')
    const expectedToken = process.env.CAKTO_WEBHOOK_SECRET
    
    if (caktoToken !== expectedToken) {
      console.error('[v0] Token inválido do webhook Cakto')
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }
    
    // Extrai dados do comprador
    // Nota: Os campos podem variar dependendo da Cakto
    // Verifique a documentação da Cakto para os nomes exatos
    const {
      email,
      nome,
      status, // "approved", "completed", etc.
      transaction_id,
      product_id,
      valor,
    } = body.data || body
    
    // Só processa se o pagamento foi aprovado
    if (status !== 'approved' && status !== 'completed') {
      console.log('[v0] Pagamento ainda não aprovado:', status)
      return NextResponse.json({ 
        message: 'Pagamento pendente' 
      })
    }
    
    // Verifica se já existe assinatura para este email
    const { data: existente } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('email', email)
      .single()
    
    if (existente) {
      // Atualiza assinatura existente
      const { error: updateError } = await supabase
        .from('assinaturas')
        .update({
          status: 'ativo',
          data_pagamento: new Date().toISOString(),
          transaction_id,
          valor,
        })
        .eq('email', email)
      
      if (updateError) {
        console.error('[v0] Erro ao atualizar assinatura:', updateError)
        return NextResponse.json(
          { error: 'Erro ao atualizar assinatura' },
          { status: 500 }
        )
      }
      
      console.log('[v0] Assinatura atualizada:', email)
    } else {
      // Cria nova assinatura
      const { error: insertError } = await supabase
        .from('assinaturas')
        .insert({
          email,
          nome: nome || email.split('@')[0],
          status: 'ativo',
          data_cadastro: new Date().toISOString(),
          data_pagamento: new Date().toISOString(),
          transaction_id,
          valor,
        })
      
      if (insertError) {
        console.error('[v0] Erro ao criar assinatura:', insertError)
        return NextResponse.json(
          { error: 'Erro ao criar assinatura' },
          { status: 500 }
        )
      }
      
      console.log('[v0] Nova assinatura criada:', email)
    }
    
    // TODO: Enviar email de boas-vindas com link de acesso
    // Você pode usar Resend, SendGrid, ou outro serviço de email
    
    return NextResponse.json({ 
      success: true,
      message: 'Assinatura registrada com sucesso' 
    })
    
  } catch (error) {
    console.error('[v0] Erro no webhook Cakto:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
