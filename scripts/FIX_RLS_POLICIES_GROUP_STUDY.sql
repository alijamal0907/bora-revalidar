-- =====================================================
-- POLÍTICAS RLS PARA ESTUDO EM GRUPO
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- 1. TABELA: group_study_rooms
-- Permitir que usuários autenticados criem, vejam e atualizem salas

ALTER TABLE group_study_rooms ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Permitir criar sala" ON group_study_rooms;
DROP POLICY IF EXISTS "Permitir ler sala" ON group_study_rooms;
DROP POLICY IF EXISTS "Permitir atualizar sala" ON group_study_rooms;
DROP POLICY IF EXISTS "Permitir deletar sala" ON group_study_rooms;

-- Criar: qualquer usuário autenticado pode criar uma sala
CREATE POLICY "Permitir criar sala" 
ON group_study_rooms 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Ler: qualquer usuário autenticado pode ver qualquer sala (necessário para entrar com código)
CREATE POLICY "Permitir ler sala" 
ON group_study_rooms 
FOR SELECT 
TO authenticated 
USING (true);

-- Atualizar: apenas o host pode atualizar a sala
CREATE POLICY "Permitir atualizar sala" 
ON group_study_rooms 
FOR UPDATE 
TO authenticated 
USING (host_user_id = auth.uid());

-- Deletar: apenas o host pode deletar a sala
CREATE POLICY "Permitir deletar sala" 
ON group_study_rooms 
FOR DELETE 
TO authenticated 
USING (host_user_id = auth.uid());

-- =====================================================
-- 2. TABELA: group_study_participants
-- Permitir gerenciar participantes

ALTER TABLE group_study_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir adicionar participante" ON group_study_participants;
DROP POLICY IF EXISTS "Permitir ler participantes" ON group_study_participants;
DROP POLICY IF EXISTS "Permitir atualizar participante" ON group_study_participants;
DROP POLICY IF EXISTS "Permitir remover participante" ON group_study_participants;

-- Criar: usuário pode se adicionar como participante
CREATE POLICY "Permitir adicionar participante" 
ON group_study_participants 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Ler: pode ver participantes de qualquer sala
CREATE POLICY "Permitir ler participantes" 
ON group_study_participants 
FOR SELECT 
TO authenticated 
USING (true);

-- Atualizar: usuário pode atualizar seus próprios dados
CREATE POLICY "Permitir atualizar participante" 
ON group_study_participants 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- Deletar: usuário pode se remover OU o host pode remover qualquer um
CREATE POLICY "Permitir remover participante" 
ON group_study_participants 
FOR DELETE 
TO authenticated 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM group_study_rooms 
    WHERE id = group_study_participants.room_id 
    AND host_user_id = auth.uid()
  )
);

-- =====================================================
-- 3. TABELA: group_study_room_questions
-- Permitir gerenciar questões da sala

ALTER TABLE group_study_room_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir criar questão da sala" ON group_study_room_questions;
DROP POLICY IF EXISTS "Permitir ler questões da sala" ON group_study_room_questions;
DROP POLICY IF EXISTS "Permitir deletar questões da sala" ON group_study_room_questions;

-- Criar: apenas o host pode adicionar questões
CREATE POLICY "Permitir criar questão da sala" 
ON group_study_room_questions 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM group_study_rooms 
    WHERE id = group_study_room_questions.room_id 
    AND host_user_id = auth.uid()
  )
);

-- Ler: participantes podem ver questões de sua sala
CREATE POLICY "Permitir ler questões da sala" 
ON group_study_room_questions 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM group_study_participants 
    WHERE room_id = group_study_room_questions.room_id 
    AND user_id = auth.uid()
  )
);

-- Deletar: apenas o host pode deletar questões
CREATE POLICY "Permitir deletar questões da sala" 
ON group_study_room_questions 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM group_study_rooms 
    WHERE id = group_study_room_questions.room_id 
    AND host_user_id = auth.uid()
  )
);

-- =====================================================
-- 4. TABELA: group_study_answers
-- Permitir gerenciar respostas dos participantes

ALTER TABLE group_study_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir criar resposta" ON group_study_answers;
DROP POLICY IF EXISTS "Permitir ler respostas" ON group_study_answers;
DROP POLICY IF EXISTS "Permitir atualizar resposta" ON group_study_answers;

-- Criar: usuário pode salvar suas próprias respostas
CREATE POLICY "Permitir criar resposta" 
ON group_study_answers 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());

-- Ler: participantes podem ver todas as respostas da sala
CREATE POLICY "Permitir ler respostas" 
ON group_study_answers 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM group_study_participants 
    WHERE room_id = group_study_answers.room_id 
    AND user_id = auth.uid()
  )
);

-- Atualizar: usuário pode atualizar suas próprias respostas
CREATE POLICY "Permitir atualizar resposta" 
ON group_study_answers 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid());

-- =====================================================
-- 5. TABELA: group_study_chat
-- Permitir gerenciar mensagens do chat

ALTER TABLE group_study_chat ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir enviar mensagem" ON group_study_chat;
DROP POLICY IF EXISTS "Permitir ler mensagens" ON group_study_chat;

-- Criar: participantes podem enviar mensagens
CREATE POLICY "Permitir enviar mensagem" 
ON group_study_chat 
FOR INSERT 
TO authenticated 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM group_study_participants 
    WHERE room_id = group_study_chat.room_id 
    AND user_id = auth.uid()
  )
);

-- Ler: participantes podem ver mensagens da sala
CREATE POLICY "Permitir ler mensagens" 
ON group_study_chat 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM group_study_participants 
    WHERE room_id = group_study_chat.room_id 
    AND user_id = auth.uid()
  )
);

-- =====================================================
-- VERIFICAÇÃO: Mostrar todas as políticas criadas
-- =====================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN (
  'group_study_rooms',
  'group_study_participants', 
  'group_study_room_questions',
  'group_study_answers',
  'group_study_chat'
)
ORDER BY tablename, policyname;
