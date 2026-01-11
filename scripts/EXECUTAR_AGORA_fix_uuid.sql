-- IMPORTANTE: Execute este SQL no Supabase Dashboard
-- SQL Editor -> New Query -> Cole este código -> Run

-- 1. Primeiro, limpar dados existentes (se houver)
DELETE FROM group_study_room_questions;
DELETE FROM group_study_answers;

-- 2. Alterar tipo da coluna question_pk para UUID na tabela group_study_room_questions
ALTER TABLE group_study_room_questions 
  ALTER COLUMN question_pk TYPE UUID USING question_pk::text::uuid;

-- 3. Alterar tipo da coluna question_pk para UUID na tabela group_study_answers  
ALTER TABLE group_study_answers 
  ALTER COLUMN question_pk TYPE UUID USING question_pk::text::uuid;

-- Verificar se funcionou
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'group_study_room_questions' 
  AND column_name = 'question_pk';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'group_study_answers' 
  AND column_name = 'question_pk';

-- Deve mostrar: question_pk | uuid
