-- Habilitar Realtime para todas as tabelas de estudo em grupo

-- Adicionar tabelas à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_room_questions;

-- Verificar se foi habilitado corretamente
SELECT 
  schemaname, 
  tablename,
  'Realtime enabled' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
AND tablename LIKE 'group_study%'
ORDER BY tablename;

-- Se a query acima retornar 5 linhas, o realtime está habilitado!
