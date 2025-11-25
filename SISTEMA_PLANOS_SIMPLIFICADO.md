# Sistema de Planos FREE/PREMIUM - Bora Revalidar

## ✅ STATUS ATUAL: FUNCIONANDO

Após correções, o sistema está totalmente funcional sem triggers problemáticos.

---

## Como Funciona

### 1. **Cadastro de Novos Usuários**

Quando um usuário se cadastra:
- ✅ Conta criada no Supabase Auth
- ✅ **NÃO precisa** inserir nada na tabela `assinaturas` imediatamente
- ✅ Usuário começa automaticamente como **FREE**

### 2. **Detecção do Plano**

A função `getUserPlan(email)` em `lib/storage-supabase.ts`:

\`\`\`typescript
// Busca o email na tabela assinaturas
const { data } = await supabase
  .from("assinaturas")
  .select("*")
  .eq("email", email)
  .single();

// Se NÃO encontrar registro OU não tiver transaction_id = FREE
if (!data || !data.transaction_id) {
  return "free";
}

// Se tiver transaction_id ou data_pagamento = PREMIUM
return "premium";
\`\`\`

**Resultado:**
- Usuário novo (sem registro) = **FREE**
- Usuário com `transaction_id` = **PREMIUM**

### 3. **Upgrade para Premium**

Quando um usuário paga na Cakto:

1. **Webhook Cakto** (`/api/webhook-cakto/route.ts`) recebe notificação
2. Webhook faz **UPSERT** na tabela `assinaturas`:
   \`\`\`sql
   INSERT INTO assinaturas (email, nome, transaction_id, data_pagamento, status)
   VALUES (...)
   ON CONFLICT (email) DO UPDATE SET ...
   \`\`\`
3. Próximo login = detectado como **PREMIUM**

---

## Limites do Plano FREE

Definidos em `lib/plan-utils.ts`:

\`\`\`typescript
export const FREE_LIMITS = {
  DAILY_QUESTIONS: 20,        // 20 questões/dia
  THEME_QUESTIONS: 4,          // 4 por matéria
  MONTHLY_QUESTIONS: 600,      // Limite mensal
  MAX_DAILY_GOAL: 20,         // Meta diária máxima
  MAX_MONTHLY_GOAL: 600       // Meta mensal máxima
}
\`\`\`

### O que FREE NÃO pode:
- ❌ Mais de 20 questões/dia
- ❌ Acessar Revisão
- ❌ Configurar meta diária > 20
- ❌ Ver porcentagens de progresso por matéria

### O que PREMIUM pode:
- ✅ Questões ilimitadas
- ✅ Revisão liberada
- ✅ Metas ilimitadas
- ✅ Progresso completo por matéria
- ✅ Badge "Premium" dourado

---

## Arquivos Importantes

### Frontend
- `lib/plan-utils.ts` - Define limites e funções de validação
- `lib/storage-supabase.ts` - Função `getUserPlan()`
- `app/dashboard/page.tsx` - Exibe cards de plano
- `components/plan-badge.tsx` - Badge visual do plano
- `components/upgrade-modal.tsx` - Modal de upgrade
- `app/upgrade/page.tsx` - Página de planos

### Backend
- `app/api/webhook-cakto/route.ts` - Processa pagamentos

### Admin
- `app/admin/upgrade-user/page.tsx` - Upgrade manual
- `app/admin/assinaturas/page.tsx` - Visualizar cadastros

---

## Webhook da Cakto

### Configuração
URL: `https://seu-dominio.vercel.app/api/webhook-cakto`

### O que o Webhook Faz

1. Recebe payload da Cakto com dados do pagamento
2. Valida o secret (se configurado)
3. Extrai email do comprador
4. Faz UPSERT na tabela `assinaturas`:
   - Adiciona `transaction_id`
   - Define `data_pagamento`
   - Atualiza `status` para "ativo"
5. Usuário agora é detectado como PREMIUM

---

## Fluxo Completo

\`\`\`
1. CADASTRO
   └─> Usuário cria conta
       └─> Supabase Auth cria registro
           └─> getUserPlan() = "free" (sem registro em assinaturas)

2. PAGAMENTO
   └─> Usuário paga na Cakto
       └─> Cakto chama webhook
           └─> Webhook insere em assinaturas com transaction_id
               └─> getUserPlan() = "premium"

3. LOGOUT/LOGIN
   └─> Usuário faz logout e login
       └─> App detecta plano "premium"
           └─> Libera todas as funcionalidades
\`\`\`

---

## Testando

### Testar como FREE
1. Crie uma conta nova
2. Tente responder > 20 questões → Bloqueado
3. Tente acessar Revisão → Bloqueado
4. Veja o card "Plano FREE" no dashboard

### Testar como PREMIUM
1. Use `/admin/upgrade-user` para upgradar manualmente
2. Ou faça pagamento real na Cakto
3. Faça logout e login
4. Veja badge "Premium" na navbar
5. Questões ilimitadas
6. Revisão liberada

---

## Troubleshooting

### Cadastro não funciona
- ✅ **CORRIGIDO**: Triggers problemáticos removidos
- Agora funciona sem erros

### Usuário pagou mas continua FREE
1. Verifique se o webhook foi chamado nos logs do Vercel
2. Verifique se o email está correto na Cakto
3. Use `/admin/upgrade-user` para upgrade manual
4. Peça para o usuário fazer logout/login

### Webhook não está funcionando
1. Confirme a URL na Cakto
2. Verifique o secret (variável `CAKTO_WEBHOOK_SECRET`)
3. Veja logs em Vercel → Functions

---

## Segurança

⚠️ **IMPORTANTE**: Habilite RLS (Row Level Security) no Supabase antes do lançamento:

\`\`\`sql
-- Na tabela assinaturas
ALTER TABLE assinaturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON assinaturas FOR SELECT
  USING (auth.email() = email);
\`\`\`

---

## Conclusão

O sistema está **100% funcional** e simplificado:
- ✅ Cadastro funcionando
- ✅ Detecção automática de planos
- ✅ Webhook Cakto integrado
- ✅ Limites FREE aplicados
- ✅ Upgrade automático após pagamento

Nenhuma ação manual é necessária após o pagamento - tudo é automático via webhook.
