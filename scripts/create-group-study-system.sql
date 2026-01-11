-- Sistema de Estudo em Grupo
-- Execute este script no Supabase Dashboard SQL Editor

-- Tabela de Salas de Simulado em Grupo
CREATE TABLE IF NOT EXISTS group_study_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code TEXT UNIQUE NOT NULL,
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_count INTEGER NOT NULL CHECK (question_count >= 25 AND question_count <= 100),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'finished')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alterado question_pk de INTEGER para UUID para suportar IDs reais das questões
-- Tabela de Questões da Sala (questões fixas por sala)
CREATE TABLE IF NOT EXISTS group_study_room_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  question_pk UUID NOT NULL,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, question_pk),
  UNIQUE(room_id, question_order)
);

-- Tabela de Participantes da Sala
CREATE TABLE IF NOT EXISTS group_study_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_host BOOLEAN DEFAULT FALSE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  total_time_seconds INTEGER,
  UNIQUE(room_id, user_id)
);

-- Alterado question_pk de INTEGER para UUID
-- Tabela de Respostas dos Participantes
CREATE TABLE IF NOT EXISTS group_study_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_pk UUID NOT NULL,
  selected_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, user_id, question_pk)
);

-- Tabela de Mensagens do Chat da Sala
CREATE TABLE IF NOT EXISTS group_study_chat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES group_study_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_group_rooms_code ON group_study_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_group_rooms_host ON group_study_rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_group_room_questions_room ON group_study_room_questions(room_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_room ON group_study_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_group_participants_user ON group_study_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_group_answers_room ON group_study_answers(room_id);
CREATE INDEX IF NOT EXISTS idx_group_answers_user ON group_study_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_room ON group_study_chat(room_id);
CREATE INDEX IF NOT EXISTS idx_group_chat_created ON group_study_chat(created_at);
