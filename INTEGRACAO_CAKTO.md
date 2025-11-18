# Integração com Plataforma Cakto - Bora Revalidar

## Visão Geral

O Bora Revalidar usa um sistema de validação de assinaturas baseado em e-mail para controlar o acesso ao aplicativo. Apenas usuários que realizaram o pagamento na plataforma Cakto podem se cadastrar e usar o app.

## Fluxo de Pagamento e Acesso

### 1. Pagamento na Cakto
O cliente realiza o pagamento do produto "Bora Revalidar" na plataforma Cakto.

### 2. Webhook da Cakto (Automação)
Após confirmação do pagamento, a Cakto envia um webhook para sua API com os dados:
- Email do comprador
- Nome do comprador
- ID da transação
- Status do pagamento

### 3. Endpoint de Webhook (Criar)

Você precisa criar um endpoint na sua API para receber os webhooks da Cakto:

**Endpoint:** `POST /api/cakto/webhook`

\`\`\`typescript
// app/api/cakto/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createSubscriptionFromCakto } from '@/lib/storage-supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar webhook da Cakto (use a chave secreta fornecida pela Cakto)
    const caktoSecret = process.env.CAKTO_WEBHOOK_SECRET
    const signature = request.headers.get('x-cakto-signature')
    
    // TODO: Implementar validação de assinatura
    
    // Extrair dados do pagamento
    const { email, nome, transaction_id, status } = body
    
    if (status !== 'approved' && status !== 'paid') {
      return NextResponse.json({ error: 'Payment not approved' }, { status: 400 })
    }
    
    // Criar/ativar assinatura no Supabase
    const result = await createSubscriptionFromCakto(email, nome, transaction_id)
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }
    
    // TODO: Enviar email de boas-vindas com link para download
    
    return NextResponse.json({ success: true, message: result.message })
  } catch (error) {
    console.error('[v0] Webhook error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
\`\`\`

### 4. Cadastro do Usuário

Após o pagamento ser processado e a assinatura criada:

1. O cliente recebe um email com instruções e link para o app
2. Cliente acessa o app e clica em "Criar Conta"
3. Sistema valida se o email existe na tabela `assinaturas` com status `ativo`
4. Se válido, permite criação da conta
5. Se inválido, exibe mensagem: "Assinatura não encontrada. Realize o pagamento na plataforma Cakto."

### 5. Controle de Dispositivos

Quando o usuário faz login:
- O sistema registra o dispositivo atual
- Se houver outra sessão ativa em outro dispositivo, ela é encerrada automaticamente
- O usuário no primeiro dispositivo verá: "Sua sessão foi encerrada porque você fez login em outro dispositivo"
- Apenas 1 dispositivo pode estar ativo por vez

## Estrutura de Banco de Dados

### Tabela: assinaturas

\`\`\`sql
CREATE TABLE assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  nome VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'ativo', 'cancelado'
  data_cadastro TIMESTAMP DEFAULT NOW(),
  data_pagamento TIMESTAMP,
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_assinaturas_email ON assinaturas(email);
CREATE INDEX idx_assinaturas_status ON assinaturas(status);
\`\`\`

### Tabela: user_devices

\`\`\`sql
CREATE TABLE user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  user_agent TEXT,
  platform VARCHAR(100),
  active BOOLEAN DEFAULT true,
  last_active TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_active ON user_devices(active);
CREATE INDEX idx_user_devices_device_id ON user_devices(device_id);
\`\`\`

## Configuração da Cakto

1. **Webhook URL**: Configure na Cakto para apontar para: `https://seu-dominio.com/api/cakto/webhook`

2. **Eventos**: Ative o webhook para o evento `payment.approved`

3. **Segurança**: Guarde a chave secreta fornecida pela Cakto em `CAKTO_WEBHOOK_SECRET`

## Email de Boas-Vindas (Opcional)

Após pagamento confirmado, você pode enviar um email automático com:

\`\`\`
Assunto: Bem-vindo ao Bora Revalidar! 🎉

Olá [NOME],

Seu pagamento foi confirmado com sucesso!

Acesse o app agora: https://seu-app.vercel.app

Suas credenciais:
- Email: [EMAIL]
- Crie sua senha no primeiro acesso

Importante:
- Você pode usar o app em apenas 1 dispositivo por vez
- Fazer login em outro dispositivo encerrará a sessão anterior

Bons estudos!
Equipe Bora Revalidar
\`\`\`

## Testando a Integração

### 1. Teste Manual (Desenvolvimento)

\`\`\`typescript
// Criar assinatura teste
import { createSubscriptionFromCakto } from '@/lib/storage-supabase'

await createSubscriptionFromCakto(
  'teste@email.com',
  'João Teste',
  'test-transaction-123'
)
\`\`\`

### 2. Teste de Webhook

Use ferramentas como Postman ou Insomnia para simular o webhook da Cakto:

\`\`\`bash
POST https://seu-app.vercel.app/api/cakto/webhook
Content-Type: application/json

{
  "email": "cliente@email.com",
  "nome": "João Silva",
  "transaction_id": "cakto_12345",
  "status": "approved"
}
\`\`\`

## Monitoramento

Monitore logs no Supabase e Vercel para:
- Webhooks recebidos
- Assinaturas criadas
- Dispositivos registrados
- Sessões encerradas

## Suporte

Em caso de problemas:
1. Verifique se o webhook está configurado corretamente na Cakto
2. Valide se as variáveis de ambiente estão configuradas
3. Confira os logs do Supabase e Vercel
4. Teste a validação de assinatura manualmente
