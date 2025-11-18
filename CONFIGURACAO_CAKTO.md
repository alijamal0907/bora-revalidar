# Configuração da Integração Cakto

## Passo a Passo Completo

### 1. Configurar Variáveis de Ambiente no Vercel

Acesse o painel do Vercel e adicione:

\`\`\`
CAKTO_WEBHOOK_SECRET=seu_token_secreto_da_cakto
\`\`\`

Para obter esse token:
- Entre na Cakto → Configurações → Webhooks
- Copie o "Secret Key" ou "Token de Segurança"

### 2. Configurar Webhook na Cakto

1. Acesse: https://app.cakto.com.br
2. Vá em: **Produtos** → Selecione "Bora Revalidar" → **Integrações**
3. Clique em **Webhooks** → **Adicionar Novo Webhook**
4. Configure:
   - **URL:** `https://seu-app.vercel.app/api/webhook-cakto`
   - **Eventos:** Selecione "Pagamento Aprovado" / "Compra Confirmada"
   - **Método:** POST
   - **Status:** Ativo
5. Salve e teste o webhook

### 3. Testar a Integração

#### Teste Manual (Recomendado):

Use uma ferramenta como Postman ou cURL:

\`\`\`bash
curl -X POST https://seu-app.vercel.app/api/webhook-cakto \
  -H "Content-Type: application/json" \
  -H "x-cakto-signature: seu_token_secreto_da_cakto" \
  -d '{
    "data": {
      "email": "teste@exemplo.com",
      "nome": "João Teste",
      "status": "approved",
      "transaction_id": "TESTE123",
      "product_id": "bora-revalidar",
      "valor": 97.00
    }
  }'
\`\`\`

#### Verificar se funcionou:

1. Acesse o Supabase
2. Vá na tabela `assinaturas`
3. Verifique se apareceu o registro com:
   - Email: teste@exemplo.com
   - Status: ativo
   - Data de pagamento preenchida

### 4. Estrutura da Tabela `assinaturas` no Supabase

Execute este SQL no Supabase (caso ainda não tenha criado):

\`\`\`sql
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  nome VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pendente', -- 'pendente', 'ativo', 'cancelado'
  data_cadastro TIMESTAMP DEFAULT NOW(),
  data_pagamento TIMESTAMP,
  transaction_id VARCHAR(255),
  valor DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para buscas rápidas por email
CREATE INDEX IF NOT EXISTS idx_assinaturas_email ON assinaturas(email);

-- Índice para buscas por status
CREATE INDEX IF NOT EXISTS idx_assinaturas_status ON assinaturas(status);
\`\`\`

### 5. Fluxo Após Pagamento

\`\`\`
1. Cliente compra na Cakto
   ↓
2. Cakto processa pagamento
   ↓
3. Pagamento aprovado → Cakto envia webhook
   ↓
4. Seu app recebe em /api/webhook-cakto
   ↓
5. App valida token de segurança
   ↓
6. App salva/atualiza registro em `assinaturas` com status "ativo"
   ↓
7. (Opcional) App envia email de boas-vindas
   ↓
8. Cliente acessa o app e faz cadastro
   ↓
9. App valida se o email está em `assinaturas` com status "ativo"
   ↓
10. Acesso liberado! ✅
\`\`\`

### 6. Emails de Boas-Vindas (Opcional mas Recomendado)

Para enviar emails automaticamente após pagamento:

1. Crie conta no Resend: https://resend.com
2. Adicione variável de ambiente: `RESEND_API_KEY`
3. Descomente o código em `lib/email-utils.ts`
4. Personalize o template do email

### 7. Monitoramento

Para ver os webhooks chegando:

1. **Logs do Vercel:**
   - Acesse: Vercel Dashboard → Seu Projeto → Logs
   - Filtre por `/api/webhook-cakto`

2. **Logs da Cakto:**
   - Acesse: Cakto → Webhooks → Histórico
   - Veja status de cada tentativa (200 OK = sucesso)

### 8. Troubleshooting

**Webhook não está chegando?**
- Verifique se a URL está correta
- Certifique-se que o app está no ar (não em localhost)
- Confira se selecionou os eventos corretos na Cakto

**Erro 401 (Token inválido)?**
- Confira se `CAKTO_WEBHOOK_SECRET` está configurado no Vercel
- Verifique se o token é o mesmo da Cakto

**Assinatura não aparece no banco?**
- Verifique os logs do Vercel para ver o erro exato
- Confira se a tabela `assinaturas` existe no Supabase
- Teste a query manualmente no Supabase

### 9. Segurança

- ✅ Sempre valide o token do webhook
- ✅ Use HTTPS (Vercel já fornece)
- ✅ Registre tentativas de acesso não autorizado
- ✅ Não exponha tokens em logs ou frontend

### 10. Próximos Passos

Depois da integração funcionando:

1. Configure email de boas-vindas (Resend)
2. Adicione página de "Obrigado pela compra" na Cakto
3. Teste com uma compra real (valor pequeno)
4. Configure notificações para você quando houver nova venda
5. Implemente dashboard admin para gerenciar assinaturas
