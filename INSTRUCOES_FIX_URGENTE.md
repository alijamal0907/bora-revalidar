# FIX URGENTE - Permitir Acesso às Salas

## Problema Identificado

O sistema funciona no preview mas não em outros dispositivos porque **as políticas RLS (Row Level Security) do Supabase estão impedindo usuários de ler salas criadas por outros**.

### Sintoma
- Cria sala no preview ✅
- Tenta entrar em outro dispositivo ❌
- Volta para tela inicial
- No preview aparece que o usuário entrou, mas no dispositivo dele não

### Causa
Linha 90-98 do `app/grupo/[roomId]/page.tsx` verifica se a sala existe. Se não conseguir ler (devido a RLS), redireciona para `/grupo`.

## Solução

Execute o script `FIX_URGENTE_RLS_LEITURA.sql` no SQL Editor do Supabase:

### Passo 1: Acesse o Supabase Dashboard
1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. Clique em "SQL Editor" no menu lateral

### Passo 2: Execute o Script
1. Cole TODO o conteúdo do arquivo `scripts/FIX_URGENTE_RLS_LEITURA.sql`
2. Clique em "Run" (executar)
3. Aguarde a mensagem "RLS configurado com sucesso!"

### Passo 3: Teste
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Em um dispositivo, crie uma sala
3. Em outro dispositivo, entre com o código
4. DEVE FUNCIONAR ✅

## O que o Script Faz

**Permissões de LEITURA (SELECT) - Agora Liberadas:**
- ✅ Todos usuários autenticados podem ler TODAS as salas
- ✅ Todos usuários autenticados podem ler TODOS os participantes
- ✅ Todos usuários autenticados podem ler TODAS as mensagens
- ✅ Todos usuários autenticados podem ler TODAS as questões

**Permissões de ESCRITA (INSERT/UPDATE/DELETE) - Restritas:**
- ✅ Apenas o host pode criar salas
- ✅ Qualquer um pode entrar como participante
- ✅ Apenas participantes podem enviar mensagens
- ✅ Apenas o host pode adicionar questões e atualizar/deletar a sala

## Após Executar

NÃO PRECISA fazer novo deploy! As mudanças no RLS são no banco de dados, não no código.

Teste imediatamente em diferentes dispositivos.
