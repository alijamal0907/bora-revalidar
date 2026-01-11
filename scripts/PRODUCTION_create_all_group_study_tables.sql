-- ============================================
-- SCRIPT DE PRODUÇÃO - ESTUDO EM GRUPO
-- Execute este script NO SUPABASE DE PRODUÇÃO
-- ============================================

-- 1. Criar tabela de salas
CREATE TABLE IF NOT EXISTS group_study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  host_user_id UUID NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'closed', 'finished')),
  question_count INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar tabela de participantes
CREATE TABLE IF NOT EXISTS group_study_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  is_host BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- 3. Criar tabela de questões da sala
CREATE TABLE IF NOT EXISTS group_study_room_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  question_pk UUID NOT NULL,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, question_pk),
  UNIQUE(room_id, question_order)
);

-- 4. Criar tabela de respostas
CREATE TABLE IF NOT EXISTS group_study_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question_pk UUID NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id, question_pk)
);

-- 5. Criar tabela de mensagens do chat
CREATE TABLE IF NOT EXISTS group_study_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_group_study_participants_room ON group_study_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_group_study_room_questions_room ON group_study_room_questions(room_id);
CREATE INDEX IF NOT EXISTS idx_group_study_answers_room ON group_study_answers(room_id);
CREATE INDEX IF NOT EXISTS idx_group_study_chat_room ON group_study_chat(room_id);

-- 7. Habilitar Row Level Security
ALTER TABLE group_study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_room_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_chat ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas RLS (permitir acesso a todos usuários autenticados)
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON group_study_rooms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON group_study_participants
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON group_study_room_questions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON group_study_answers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON group_study_chat
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. Habilitar Realtime para todas as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_room_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_chat;

-- ============================================
-- CONCLUÍDO!
-- ============================================
