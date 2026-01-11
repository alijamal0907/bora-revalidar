-- ========================================
-- EXECUTAR ESTE SQL URGENTEMENTE NO SUPABASE
-- ========================================
-- Este script corrige o erro "invalid input syntax for type integer"
-- que está impedindo o simulado em grupo de funcionar.
--
-- INSTRUÇÕES:
-- 1. Acesse o Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Selecione seu projeto
-- 3. Vá em "SQL Editor"
-- 4. Cole este código completo
-- 5. Clique em "Run" (ou pressione Cmd/Ctrl + Enter)
-- ========================================

-- Passo 1: Remover constraints existentes
ALTER TABLE group_study_room_questions 
  DROP CONSTRAINT IF EXISTS group_study_room_questions_room_id_question_pk_key;

-- Passo 2: Alterar tipo de question_pk de INTEGER para UUID
ALTER TABLE group_study_room_questions 
  ALTER COLUMN question_pk TYPE UUID USING question_pk::text::uuid;

-- Passo 3: Recriar constraint unique
ALTER TABLE group_study_room_questions 
  ADD CONSTRAINT group_study_room_questions_room_id_question_pk_key UNIQUE(room_id, question_pk);

-- Passo 4: Fazer o mesmo para a tabela de respostas
ALTER TABLE group_study_answers 
  DROP CONSTRAINT IF EXISTS group_study_answers_room_id_user_id_question_pk_key;

ALTER TABLE group_study_answers 
  ALTER COLUMN question_pk TYPE UUID USING question_pk::text::uuid;

ALTER TABLE group_study_answers 
  ADD CONSTRAINT group_study_answers_room_id_user_id_question_pk_key UNIQUE(room_id, user_id, question_pk);

-- ========================================
-- VERIFICAÇÃO (execute após o script acima)
-- ========================================
-- Execute este SELECT para confirmar que deu certo:
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name IN ('group_study_room_questions', 'group_study_answers') 
  AND column_name = 'question_pk';
  
-- O resultado deve mostrar data_type = 'uuid' para ambas as tabelas
