-- ========================================
-- SCRIPT FINAL DE DEPLOY PARA PRODUÇÃO
-- Execute este script COMPLETO no Supabase de PRODUÇÃO
-- ========================================

-- Passo 1: Deletar tabelas antigas (se existirem)
DROP TABLE IF EXISTS group_study_answers CASCADE;
DROP TABLE IF EXISTS group_study_room_questions CASCADE;
DROP TABLE IF EXISTS group_study_chat CASCADE;
DROP TABLE IF EXISTS group_study_participants CASCADE;
DROP TABLE IF EXISTS group_study_rooms CASCADE;

-- Passo 2: Criar tabelas com estrutura correta
CREATE TABLE group_study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT NOT NULL UNIQUE,
  host_user_id UUID NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'finished')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE group_study_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE group_study_room_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  question_pk UUID NOT NULL,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, question_pk),
  UNIQUE(room_id, question_order)
);

CREATE TABLE group_study_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE group_study_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question_pk UUID NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, user_id, question_pk)
);

-- Passo 3: Criar índices para performance
CREATE INDEX idx_group_rooms_status ON group_study_rooms(status);
CREATE INDEX idx_group_rooms_code ON group_study_rooms(room_code);
CREATE INDEX idx_group_participants_room ON group_study_participants(room_id);
CREATE INDEX idx_group_participants_user ON group_study_participants(user_id);
CREATE INDEX idx_group_questions_room ON group_study_room_questions(room_id);
CREATE INDEX idx_group_chat_room ON group_study_chat(room_id);
CREATE INDEX idx_group_answers_room ON group_study_answers(room_id);
CREATE INDEX idx_group_answers_user ON group_study_answers(user_id);

-- Passo 4: HABILITAR RLS em todas as tabelas
ALTER TABLE group_study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_room_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_answers ENABLE ROW LEVEL SECURITY;

-- Passo 5: Criar políticas RLS PERMISSIVAS (permitir tudo para usuários autenticados)
-- ROOMS
CREATE POLICY "Permitir leitura de salas" ON group_study_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir criação de salas" ON group_study_rooms FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de salas" ON group_study_rooms FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Permitir deletar salas" ON group_study_rooms FOR DELETE TO authenticated USING (true);

-- PARTICIPANTS
CREATE POLICY "Permitir leitura de participantes" ON group_study_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir criação de participantes" ON group_study_participants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de participantes" ON group_study_participants FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Permitir deletar participantes" ON group_study_participants FOR DELETE TO authenticated USING (true);

-- QUESTIONS
CREATE POLICY "Permitir leitura de questões" ON group_study_room_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir criação de questões" ON group_study_room_questions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de questões" ON group_study_room_questions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Permitir deletar questões" ON group_study_room_questions FOR DELETE TO authenticated USING (true);

-- CHAT
CREATE POLICY "Permitir leitura de chat" ON group_study_chat FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir criação de mensagens" ON group_study_chat FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de mensagens" ON group_study_chat FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Permitir deletar mensagens" ON group_study_chat FOR DELETE TO authenticated USING (true);

-- ANSWERS
CREATE POLICY "Permitir leitura de respostas" ON group_study_answers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Permitir criação de respostas" ON group_study_answers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir atualização de respostas" ON group_study_answers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Permitir deletar respostas" ON group_study_answers FOR DELETE TO authenticated USING (true);

-- Passo 6: HABILITAR REALTIME em todas as tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_room_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_chat;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_answers;

-- Passo 7: Conceder permissões
GRANT ALL ON group_study_rooms TO authenticated;
GRANT ALL ON group_study_participants TO authenticated;
GRANT ALL ON group_study_room_questions TO authenticated;
GRANT ALL ON group_study_chat TO authenticated;
GRANT ALL ON group_study_answers TO authenticated;

-- FIM DO SCRIPT
-- Verifique se todas as tabelas foram criadas com: SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE 'group_study%';
