# 🚀 DEPLOY - Sistema de Estudo em Grupo

## PASSO 1: Executar Scripts SQL no Supabase

Acesse o Supabase Dashboard em https://supabase.com/dashboard e execute os seguintes scripts **NA ORDEM**:

### Script 1: Criar Tabelas
Execute o arquivo `scripts/create-group-study-system.sql` no SQL Editor.

### Script 2: Alterar tipos para UUID
Execute o arquivo `scripts/EXECUTAR_AGORA_fix_uuid.sql` no SQL Editor.

### Script 3: Verificar se tudo funcionou
Execute esta query para verificar:

```sql
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN (
  'group_study_rooms',
  'group_study_participants', 
  'group_study_room_questions',
  'group_study_answers',
  'group_study_chat'
)
ORDER BY table_name, ordinal_position;
```

Você deve ver:
- `group_study_rooms.question_pk` como UUID
- `group_study_answers.question_pk` como UUID
- Todas as outras tabelas criadas

### Script 4: Habilitar Realtime
Execute no SQL Editor:

```sql
-- Habilitar realtime para as tabelas de estudo em grupo
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_answers;

-- Verificar se foi habilitado
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename LIKE 'group_study%';
```

## PASSO 2: Deploy do Código

### Opção A: Via v0 (Recomendado)
1. Abra o v0 em https://v0.dev
2. Clique no botão **"Publish"** no canto superior direito
3. Aguarde o deploy completar (2-3 minutos)
4. Verifique se a URL de produção está atualizada

### Opção B: Via GitHub + Vercel
1. Baixe o código do v0 (botão "Download ZIP")
2. Faça commit no seu repositório GitHub
3. O Vercel vai fazer o deploy automaticamente
4. Aguarde a build completar

## PASSO 3: Verificar Funcionamento

Após o deploy, teste:

1. ✅ Acessar `/grupo` no site de produção
2. ✅ Criar uma sala de estudo em grupo
3. ✅ Ver o código da sala e copiar
4. ✅ Outro usuário conseguir entrar com o código
5. ✅ Lista de participantes atualizar em tempo real
6. ✅ Chat funcionar entre participantes
7. ✅ Host conseguir clicar em "Iniciar Simulado"
8. ✅ Questões aparecerem para todos simultaneamente
9. ✅ Responder e avançar para próxima questão
10. ✅ Ver resultado final com ranking

## PASSO 4: Se algo não funcionar

### Problema: Tabelas não existem
**Erro**: `relation "group_study_rooms" does not exist`
**Solução**: Execute o Script 1 novamente no SQL Editor

### Problema: Erro de tipo UUID
**Erro**: `invalid input syntax for type uuid`
**Solução**: Execute o Script 2 no SQL Editor

### Problema: Realtime não atualiza
**Erro**: Participantes/chat não aparecem em tempo real
**Solução**: Execute o Script 4 no SQL Editor

### Problema: Host não consegue iniciar
**Erro**: Botão "Iniciar Simulado" não aparece
**Solução**: Limpe o cache do navegador (Ctrl+Shift+R) e recarregue a página

## RESUMO

- ✅ Execute os 4 scripts SQL no Supabase
- ✅ Faça o deploy do código via v0 ou GitHub
- ✅ Teste a funcionalidade completa
- ✅ Se tiver problemas, siga o guia de troubleshooting acima

**IMPORTANTE**: Execute TODOS os scripts SQL ANTES de fazer o deploy do código!
