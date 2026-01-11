-- ============================================
-- SCRIPT COMPLETO PARA PRODUÇÃO
-- Execute ESTE script no SQL Editor do Supabase de PRODUÇÃO
-- ============================================

-- 1. DELETAR TABELAS SE EXISTIREM (para começar do zero)
DROP TABLE IF EXISTS group_study_chat CASCADE;
DROP TABLE IF EXISTS group_study_answers CASCADE;
DROP TABLE IF EXISTS group_study_room_questions CASCADE;
DROP TABLE IF EXISTS group_study_participants CASCADE;
DROP TABLE IF EXISTS group_study_rooms CASCADE;

-- 2. CRIAR TABELAS

-- Tabela de salas
CREATE TABLE group_study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  host_user_id UUID NOT NULL,
  question_count INTEGER NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'finished')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de participantes
CREATE TABLE group_study_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_host BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  total_time_seconds INTEGER,
  UNIQUE(room_id, user_id)
);

-- Tabela de questões da sala
CREATE TABLE group_study_room_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  question_pk UUID NOT NULL,
  question_order INTEGER NOT NULL,
  UNIQUE(room_id, question_pk),
  UNIQUE(room_id, question_order)
);

-- Tabela de respostas
CREATE TABLE group_study_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  question_pk UUID NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(room_id, user_id, question_pk)
);

-- Tabela de chat
CREATE TABLE group_study_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX idx_group_study_rooms_room_code ON group_study_rooms(room_code);
CREATE INDEX idx_group_study_rooms_host ON group_study_rooms(host_user_id);
CREATE INDEX idx_group_study_participants_room ON group_study_participants(room_id);
CREATE INDEX idx_group_study_participants_user ON group_study_participants(user_id);
CREATE INDEX idx_group_study_room_questions_room ON group_study_room_questions(room_id);
CREATE INDEX idx_group_study_answers_room ON group_study_answers(room_id);
CREATE INDEX idx_group_study_answers_user ON group_study_answers(user_id);
CREATE INDEX idx_group_study_chat_room ON group_study_chat(room_id);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
ALTER TABLE group_study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_room_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_study_chat ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS RLS (permissões completas para usuários autenticados)

-- Políticas para group_study_rooms
CREATE POLICY "Usuários podem criar salas" ON group_study_rooms
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários podem ver salas abertas" ON group_study_rooms
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Host pode atualizar sua sala" ON group_study_rooms
  FOR UPDATE TO authenticated USING (auth.uid() = host_user_id);

CREATE POLICY "Host pode deletar sua sala" ON group_study_rooms
  FOR DELETE TO authenticated USING (auth.uid() = host_user_id);

-- Políticas para group_study_participants
CREATE POLICY "Usuários podem entrar em salas" ON group_study_participants
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuários podem ver participantes" ON group_study_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários podem atualizar sua participação" ON group_study_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Políticas para group_study_room_questions
CREATE POLICY "Host pode adicionar questões" ON group_study_room_questions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Participantes podem ver questões" ON group_study_room_questions
  FOR SELECT TO authenticated USING (true);

-- Políticas para group_study_answers
CREATE POLICY "Usuários podem salvar respostas" ON group_study_answers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver respostas" ON group_study_answers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuários podem atualizar suas respostas" ON group_study_answers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Políticas para group_study_chat
CREATE POLICY "Usuários podem enviar mensagens" ON group_study_chat
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Participantes podem ver mensagens" ON group_study_chat
  FOR SELECT TO authenticated USING (true);

-- 6. HABILITAR REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_room_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE group_study_chat;

-- 7. CRIAR TRIGGER PARA ATUALIZAR updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_group_study_rooms_updated_at
BEFORE UPDATE ON group_study_rooms
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- FIM DO SCRIPT
-- Verifique se todas as queries foram executadas com sucesso!
