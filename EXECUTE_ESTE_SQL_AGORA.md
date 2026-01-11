# 🚨 AÇÃO URGENTE NECESSÁRIA

O simulado em grupo não está funcionando porque as colunas do banco de dados estão com tipo errado.

## Como Corrigir (2 minutos):

1. **Abra o Supabase Dashboard**: https://supabase.com/dashboard
2. **Selecione seu projeto**: "Bora Revalidar app"
3. **Vá para SQL Editor** (menu lateral esquerdo)
4. **Clique em "+ New Query"**
5. **Copie TODO o conteúdo** do arquivo `scripts/EXECUTAR_AGORA_fix_uuid.sql`
6. **Cole no editor** e clique em **"Run"**

## O que isso faz:

- Converte `question_pk` de INTEGER para UUID nas tabelas:
  - `group_study_room_questions`
  - `group_study_answers`

## Depois de executar:

✅ O simulado em grupo funcionará perfeitamente
✅ As questões serão salvas corretamente
✅ Todos os participantes verão as mesmas questões

**Tempo estimado: 2 minutos**
