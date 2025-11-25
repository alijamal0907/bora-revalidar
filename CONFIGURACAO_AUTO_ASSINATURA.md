# Configuração de Auto-Registro na Tabela Assinaturas

## Objetivo

Garantir que todos os novos usuários que se cadastram no app sejam automaticamente adicionados na tabela `assinaturas` com o plano **FREE** por padrão.

## Implementação

Foram implementadas **duas camadas de segurança** para garantir que o registro seja criado:

### 1. Trigger no Banco de Dados (Recomendado)

**Arquivo:** `scripts/criar-trigger-auto-assinatura.sql`

Execute este script no SQL Editor do Supabase para criar:
- Uma **função** que insere automaticamente na tabela `assinaturas`
- Um **trigger** que executa após cada novo usuário ser criado no `auth.users`

**Vantagens:**
- Funciona independente do código da aplicação
- Garante consistência mesmo se o signup falhar parcialmente
- Executa automaticamente no banco de dados

### 2. Código da Aplicação (Fallback)

**Arquivo:** `lib/auth-supabase.ts`

A função `signUpSupabase` agora também adiciona o registro via código usando `upsert`:
- Se o trigger funcionar, o upsert não fará nada (pelo `ON CONFLICT`)
- Se o trigger falhar, o código garante que o registro seja criado

**Vantagens:**
- Funciona mesmo sem trigger configurado
- Compatível com ambientes de desenvolvimento local

## Como Configurar

### Passo 1: Executar o Script SQL

1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole e execute o conteúdo de `scripts/criar-trigger-auto-assinatura.sql`
4. Confirme que a função e o trigger foram criados com sucesso

### Passo 2: Testar

1. Crie uma nova conta no app
2. Verifique na tabela `assinaturas` se o registro foi criado
3. Confirme que o campo `plano` está como `'free'`

## Estrutura do Registro Criado

Quando um novo usuário se cadastra, o seguinte registro é criado na tabela `assinaturas`:

\`\`\`sql
{
  email: 'usuario@exemplo.com',
  nome: 'usuario',  -- Extraído do email
  status: 'ativo',
  plano: 'free',
  data_cadastro: NOW()
}
\`\`\`

## Upgrade para Premium

Quando o usuário pagar na Cakto, o webhook `/api/webhook-cakto` atualiza automaticamente:

\`\`\`sql
UPDATE assinaturas 
SET plano = 'premium' 
WHERE email = 'usuario@exemplo.com';
\`\`\`

## Verificação

Para verificar se está funcionando, execute no SQL Editor:

\`\`\`sql
SELECT email, plano, status, data_cadastro 
FROM assinaturas 
ORDER BY data_cadastro DESC 
LIMIT 10;
\`\`\`

Todos os novos usuários devem aparecer com `plano = 'free'`.
