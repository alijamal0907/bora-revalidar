# INSTRUÇÕES FINAIS URGENTES - ESTUDO EM GRUPO

## O PROBLEMA

Quando você cria uma sala no preview, funciona perfeitamente. Mas quando outro dispositivo tenta:
1. **Criar uma sala** → Volta para a página de estudo em grupo
2. **Entrar em uma sala** → Volta para a página de estudo em grupo

**CAUSA:** As políticas RLS (Row Level Security) do Supabase estão bloqueando o acesso às tabelas em produção.

## SOLUÇÃO DEFINITIVA

### PASSO 1: Execute o SQL no Supabase (URGENTE)

1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto de PRODUÇÃO (não o de desenvolvimento)
3. Vá em **SQL Editor** (menu lateral esquerdo)
4. Clique em **New Query**
5. Cole TODO o conteúdo do arquivo `scripts/SOLUCAO_FINAL_RLS_COMPLETA.sql`
6. Clique em **RUN** (ou pressione Ctrl+Enter)
7. **AGUARDE** até aparecer "Success. No rows returned"

### PASSO 2: Faça o Deploy

1. No v0, clique em **"Publish"** no canto superior direito
2. Aguarde o deploy finalizar (geralmente 1-2 minutos)
3. Acesse a URL de produção do seu app

### PASSO 3: Teste em Outro Dispositivo

1. **Limpe o cache do navegador** em TODOS os dispositivos:
   - Chrome: Ctrl+Shift+Delete → Selecione "Cached images and files" → Clear data
   - Safari (iOS): Settings → Safari → Clear History and Website Data
   
2. **Teste criar uma sala:**
   - Vá em "Estudo em Grupo"
   - Escolha quantidade de questões (25, 50, 75 ou 100)
   - Clique em "Criar Sala"
   - **Deve abrir a página da sala com o código**

3. **Teste entrar em uma sala:**
   - Em outro dispositivo, vá em "Estudo em Grupo"
   - Clique em "Entrar em uma Sala"
   - Digite o código da sala
   - Clique em "Entrar"
   - **Deve abrir a página da sala e aparecer na lista de participantes**

### PASSO 4: Verifique os Logs

1. Abra o Console do navegador (F12)
2. Vá na aba **Console**
3. Procure por mensagens com `[v0]`
4. **Se aparecer "ERRO ao buscar sala"** → O RLS ainda está bloqueando
5. **Se aparecer "Sala encontrada com sucesso"** → Funcionando!

## SE AINDA NÃO FUNCIONAR

Execute este comando adicional no SQL Editor:

```sql
-- Garante que as tabelas existem e são acessíveis
GRANT ALL ON group_study_rooms TO authenticated;
GRANT ALL ON group_study_participants TO authenticated;
GRANT ALL ON group_study_room_questions TO authenticated;
GRANT ALL ON group_study_chat TO authenticated;
GRANT ALL ON group_study_answers TO authenticated;
```

## DIAGNÓSTICO RÁPIDO

Na página "Estudo em Grupo", clique no botão **"Diagnóstico"** (se disponível) para verificar:
- ✅ Usuário autenticado
- ✅ Tabelas existem
- ✅ Pode criar sala
- ✅ Pode entrar em sala

## CONTATO URGENTE

Se após TODOS esses passos ainda não funcionar, me envie:
1. Screenshots dos logs do console (F12 → Console)
2. Screenshot do erro no SQL Editor (se houver)
3. Qual dispositivo/navegador está testando
