# Guia: Como Liberar Acessos Manualmente (Sem Pagamento na Cakto)

## Método 1: Via SQL no Supabase (Recomendado)

### Passo 1: Acesse o Supabase
1. Entre em https://supabase.com
2. Faça login e selecione seu projeto
3. No menu lateral, clique em **SQL Editor**

### Passo 2: Execute o Script
1. Copie o código do arquivo `scripts/liberar-acesso-manual.sql`
2. Cole no SQL Editor
3. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Verificar
Execute esta query para confirmar:
\`\`\`sql
SELECT * FROM assinaturas WHERE email = 'ali_jamal2002@hotmail.com';
\`\`\`

Deve retornar:
- **status:** 'ativo'
- **data_pagamento:** data atual
- **transaction_id:** 'MANUAL_ACCESS_001'

---

## Método 2: Via Interface do Supabase (Mais Fácil)

### Passo 1: Acessar a Tabela
1. Entre no painel Supabase
2. Clique em **Table Editor** no menu lateral
3. Selecione a tabela **assinaturas**

### Passo 2: Adicionar Novo Registro
1. Clique no botão **Insert** → **Insert row**
2. Preencha os campos:
   - **email:** `ali_jamal2002@hotmail.com`
   - **nome:** `Ali Jamal`
   - **status:** `ativo`
   - **data_cadastro:** Use o botão "Now" ou digite a data atual
   - **data_pagamento:** Use o botão "Now"
   - **transaction_id:** `MANUAL_ACCESS_001`
3. Clique em **Save**

### Passo 3: Para Adicionar Outros Emails
Repita o processo acima com os seguintes valores:
- **email:** Email do aluno que você quer liberar
- **nome:** Nome do aluno
- **status:** `ativo` (sempre!)
- **transaction_id:** Use `MANUAL_ACCESS_002`, `MANUAL_ACCESS_003`, etc.

---

## Método 3: Via API (Para Automação)

Se você quiser criar um painel admin para liberar acessos, pode usar esta função:

\`\`\`javascript
// Exemplo de como usar a função existente
import { createSubscriptionFromCakto } from '@/lib/storage-supabase'

// Liberar acesso para um email
const result = await createSubscriptionFromCakto(
  'ali_jamal2002@hotmail.com',
  'Ali Jamal',
  'MANUAL_ACCESS_001'
)

console.log(result.message) // "Assinatura criada com sucesso"
\`\`\`

---

## Como o Aluno Acessa Depois?

### 1. Email Liberado
Assim que você adicionar o email na tabela `assinaturas` com status `ativo`, o aluno pode:

### 2. Cadastrar no App
1. Acessar: `https://seu-dominio.vercel.app/login`
2. Clicar em **"Criar Conta"**
3. Preencher:
   - **Email:** Exatamente o email que você liberou
   - **Senha:** Qualquer senha (mínimo 6 caracteres)
4. Clicar em **"Criar Conta"**

### 3. Validação Automática
O app vai:
- Verificar se o email está na tabela `assinaturas`
- Confirmar que o status é `ativo`
- Liberar acesso ao dashboard automaticamente

---

## Gerenciar Acessos

### Ver Todos os Acessos Ativos
\`\`\`sql
SELECT 
  email, 
  nome, 
  data_pagamento, 
  transaction_id,
  created_at
FROM assinaturas
WHERE status = 'ativo'
ORDER BY data_pagamento DESC;
\`\`\`

### Revogar Acesso de um Aluno
\`\`\`sql
UPDATE assinaturas
SET status = 'cancelado'
WHERE email = 'email.do.aluno@exemplo.com';
\`\`\`

### Reativar Acesso
\`\`\`sql
UPDATE assinaturas
SET status = 'ativo', data_pagamento = NOW()
WHERE email = 'email.do.aluno@exemplo.com';
\`\`\`

### Remover Completamente
\`\`\`sql
DELETE FROM assinaturas
WHERE email = 'email.do.aluno@exemplo.com';
\`\`\`

---

## Notas Importantes

1. **Case-Insensitive:** O app normaliza emails para minúsculas, então `Ali@Email.com` e `ali@email.com` são tratados como o mesmo.

2. **Único Dispositivo:** O sistema só permite login ativo em um dispositivo por vez. Ao fazer login em outro aparelho, a sessão anterior é encerrada automaticamente.

3. **Transaction ID:** Use sempre um ID único para cada acesso manual (MANUAL_ACCESS_001, 002, 003...). Isso ajuda a rastrear acessos que não vieram da Cakto.

4. **Webhook Cakto:** Quando alguém pagar pela Cakto, o sistema adiciona automaticamente. Não precisa fazer nada manual para pagamentos reais.

---

## Resumo Rápido

**Para liberar o email ali_jamal2002@hotmail.com:**
1. Abra o Supabase SQL Editor
2. Execute:
   \`\`\`sql
   INSERT INTO assinaturas (email, nome, status, data_pagamento, transaction_id)
   VALUES ('ali_jamal2002@hotmail.com', 'Ali Jamal', 'ativo', NOW(), 'MANUAL_ACCESS_001')
   ON CONFLICT (email) DO UPDATE SET status = 'ativo';
   \`\`\`
3. Pronto! O aluno pode se cadastrar agora.

**Para liberar outros emails:**
- Repita o comando acima mudando o email, nome e incrementando o transaction_id
