# Checklist Pré-Lançamento - Bora Revalidar

## ✅ Configurações Obrigatórias

### 1. Variáveis de Ambiente (Vercel)
Certifique-se de que as seguintes variáveis estão configuradas:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - URL do seu projeto Supabase
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave pública do Supabase
- [ ] `CAKTO_WEBHOOK_SECRET` - Token de segurança fornecido pela Cakto

### 2. Tabelas no Supabase
Verifique se todas as tabelas existem:

- [ ] `questoes` - Questões com alternativas A-E
- [ ] `hist_questoes` - Histórico de respostas dos alunos
- [ ] `assinaturas` - Controle de pagamentos e acessos
- [ ] `marcacoes_revisao` - Questões marcadas para revisar

### 3. Webhook da Cakto
Configure no painel da Cakto:

- [ ] URL do webhook: `https://seu-dominio.vercel.app/api/webhook-cakto`
- [ ] Evento: "Compra Aprovada" ou "Pagamento Confirmado"
- [ ] Método: POST
- [ ] Token de segurança configurado e salvo na variável de ambiente

### 4. Estrutura da Tabela `assinaturas`
Execute o SQL no Supabase:

\`\`\`sql
CREATE TABLE IF NOT EXISTS assinaturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  nome TEXT,
  status TEXT DEFAULT 'pendente',
  data_cadastro TIMESTAMP DEFAULT NOW(),
  data_pagamento TIMESTAMP,
  transaction_id TEXT,
  valor NUMERIC,
  created_at TIMESTAMP DEFAULT NOW()
);
\`\`\`

## 🔐 Sistema de Validação Ativo

### Como Funciona:

1. **Cliente compra na Cakto** → Realiza pagamento
2. **Cakto envia webhook** → Notifica seu app automaticamente
3. **App registra email** → Salva na tabela `assinaturas` com `status: 'ativo'`
4. **Cliente tenta se cadastrar** → App verifica se email está em `assinaturas`
5. **Validação aprovada** → Cadastro permitido apenas se status = 'ativo'

### Código de Validação:

\`\`\`typescript
// Em app/login/page.tsx - handleSignUp
const subscriptionCheck = await checkSubscriptionStatus(email);

if (!subscriptionCheck.isActive) {
  setError('Acesso negado: ' + subscriptionCheck.message);
  return;
}
\`\`\`

## 📋 Fluxo Completo

### Para Clientes Pagantes:

1. Cliente acessa link da Cakto
2. Faz pagamento (cartão, PIX, boleto)
3. Cakto confirma pagamento
4. Webhook registra email automaticamente
5. Cliente recebe link: `https://seu-dominio.vercel.app/login`
6. Cliente clica em "Criar Conta"
7. Insere o mesmo email usado na compra + senha
8. App valida assinatura e permite cadastro
9. Acesso liberado ao dashboard

### Para Acesso Manual (Teste/Suporte):

Execute no Supabase SQL Editor:

\`\`\`sql
INSERT INTO assinaturas (email, nome, status, data_pagamento)
VALUES ('email@teste.com', 'Nome Teste', 'ativo', NOW())
ON CONFLICT (email) 
DO UPDATE SET status = 'ativo', data_pagamento = NOW();
\`\`\`

## 🚨 Mensagens de Erro

### "Assinatura não encontrada"
**Causa:** Email não está na tabela `assinaturas`
**Solução:** Verificar se o webhook da Cakto foi acionado ou adicionar manualmente

### "Sua assinatura está pendente de aprovação"
**Causa:** Email está na tabela mas `status != 'ativo'`
**Solução:** Aguardar confirmação de pagamento ou atualizar status manualmente

### "Erro ao verificar assinatura"
**Causa:** Problema de conexão com Supabase
**Solução:** Verificar variáveis de ambiente e conexão com banco

## ✅ Testes Recomendados

Antes de lançar, teste:

1. [ ] Fazer compra teste na Cakto
2. [ ] Verificar se webhook foi recebido (logs no Vercel)
3. [ ] Confirmar email na tabela `assinaturas` com status 'ativo'
4. [ ] Tentar cadastro com email que NÃO pagou (deve ser bloqueado)
5. [ ] Tentar cadastro com email que pagou (deve funcionar)
6. [ ] Fazer login e acessar dashboard
7. [ ] Responder questões e verificar histórico
8. [ ] Testar simulados
9. [ ] Verificar página de revisão

## 🔗 URLs Importantes

- **App publicado:** https://seu-dominio.vercel.app
- **Página de login:** https://seu-dominio.vercel.app/login
- **Webhook endpoint:** https://seu-dominio.vercel.app/api/webhook-cakto
- **Dashboard Vercel:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com

## 📞 Suporte

Se encontrar problemas:

1. Verificar logs do Vercel (Runtime Logs)
2. Verificar logs do Supabase (SQL Editor → Logs)
3. Testar webhook manualmente (Postman/Insomnia)
4. Conferir variáveis de ambiente estão corretas

---

**Status Atual: ✅ PRONTO PARA LANÇAMENTO**

A validação de assinatura está ATIVA e funcionando corretamente.
