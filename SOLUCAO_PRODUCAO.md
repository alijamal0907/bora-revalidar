# SOLUÇÃO PARA O PROBLEMA DE PRODUÇÃO

## O Problema
A funcionalidade de Estudo em Grupo funciona no **preview do v0** mas NÃO funciona em **produção** (outros dispositivos).

## A Causa
As tabelas do banco de dados não existem no Supabase de produção. O preview usa um ambiente de desenvolvimento separado.

## A Solução - SIGA ESTES PASSOS:

### PASSO 1: Verificar qual Supabase está conectado
1. Entre no seu dashboard da Vercel: https://vercel.com
2. Vá no seu projeto "Bora Revalidar"
3. Clique em **Settings** → **Environment Variables**
4. Verifique os valores de:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Anote o ID do projeto (está na URL, ex: `abcdefgh123.supabase.co`)

### PASSO 2: Executar o SQL no Supabase CORRETO
1. Entre em https://supabase.com/dashboard
2. Selecione o projeto que está configurado na Vercel (mesmo ID do passo 1)
3. No menu lateral, clique em **SQL Editor**
4. Clique em **New Query**
5. Copie TODO o conteúdo do arquivo `scripts/PRODUCTION_create_all_group_study_tables.sql`
6. Cole no editor
7. Clique em **RUN** (ou pressione Ctrl+Enter)
8. Aguarde a mensagem de sucesso

### PASSO 3: Verificar se as tabelas foram criadas
1. No Supabase, vá em **Table Editor** (menu lateral)
2. Você deve ver as novas tabelas:
   - `group_study_rooms`
   - `group_study_participants`
   - `group_study_room_questions`
   - `group_study_answers`
   - `group_study_chat`

### PASSO 4: Limpar o cache e fazer novo deploy
1. No v0, clique em **Publish** novamente
2. Aguarde o deploy completar
3. Ou na Vercel, vá em **Deployments** → **Redeploy**

### PASSO 5: Testar em outro dispositivo
1. Abra o app em outro celular/computador
2. Faça login com seu email: ali_jamal2002@hotmail.com
3. Clique em "Estudo em Grupo"
4. Clique em "Criar Sala"
5. Selecione a quantidade de questões
6. Agora deve aparecer o código da sala E o botão "Iniciar Simulado"

## Verificação Rápida
Se ainda não funcionar, verifique:
- [ ] As tabelas existem no Supabase de PRODUÇÃO (não dev)
- [ ] O RLS está habilitado e as políticas criadas
- [ ] O Realtime está habilitado
- [ ] O deploy foi feito DEPOIS de criar as tabelas
- [ ] O cache do navegador foi limpo (Ctrl+Shift+R)

## Suporte
Se ainda tiver problemas, me envie:
1. Screenshot do Table Editor do Supabase mostrando as tabelas
2. Screenshot das Environment Variables da Vercel
3. O erro exato que aparece no console (F12 → Console)
