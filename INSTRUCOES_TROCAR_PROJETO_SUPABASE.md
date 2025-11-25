# Instruções para Trocar o Projeto Supabase

## 1. Encontre suas credenciais do novo projeto

Acesse: https://supabase.com/dashboard/project/fmhzwcbjjdkcylohqfyy/settings/api

Você verá:
- **Project URL**: algo como `https://fmhzwcbjjdkcylohqfyy.supabase.co`
- **anon public**: uma chave longa começando com `eyJ...`
- **service_role**: outra chave longa (secreta!)

## 2. Atualize as variáveis de ambiente no Vercel

Vá em: Vercel Dashboard → Seu Projeto → Settings → Environment Variables

Atualize estas 3 variáveis:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://fmhzwcbjjdkcylohqfyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (cole a chave anon)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (cole a service role)
\`\`\`

## 3. Redeploy o app

Após atualizar as variáveis, faça um novo deploy para as mudanças terem efeito.

## 4. Execute os scripts SQL no novo projeto

No SQL Editor do novo projeto (https://supabase.com/dashboard/project/fmhzwcbjjdkcylohqfyy/sql/new), execute:

\`\`\`sql
-- Verificar se há triggers problemáticos
SELECT 
  tgname as trigger_name,
  proname as function_name  
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass;

-- Remover triggers problemáticos se existirem
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
\`\`\`

## 5. Teste o cadastro

Após fazer esses passos, teste criar um novo usuário. Deve funcionar sem erros!
