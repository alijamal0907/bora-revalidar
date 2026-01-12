-- ============================================
-- FIX URGENTE: Permitir leitura de salas para todos
-- ============================================

-- Dropar políticas antigas que podem estar bloqueando
DROP POLICY IF EXISTS "Qualquer usuário pode ver salas abertas" ON group_study_rooms;
DROP POLICY IF EXISTS "Usuarios podem ver salas" ON group_study_rooms;
DROP POLICY IF EXISTS "select_group_study_rooms" ON group_study_rooms;

-- Criar política que permite TODOS os usuários autenticados verem TODAS as salas
CREATE POLICY "Todos podem ler todas as salas"
ON group_study_rooms
FOR SELECT
TO authenticated
USING (true); -- IMPORTANTE: true = sem restrição

-- Dropar políticas antigas de participantes
DROP POLICY IF EXISTS "Usuários podem ver participantes" ON group_study_participants;
DROP POLICY IF EXISTS "select_group_study_participants" ON group_study_participants;

-- Permitir todos verem todos os participantes
CREATE POLICY "Todos podem ler participantes"
ON group_study_participants
FOR SELECT
TO authenticated
USING (true);

-- Dropar políticas antigas de mensagens
DROP POLICY IF EXISTS "Usuários podem ver mensagens" ON group_study_messages;
DROP POLICY IF EXISTS "select_group_study_messages" ON group_study_messages;

-- Permitir todos verem todas as mensagens
CREATE POLICY "Todos podem ler mensagens"
ON group_study_messages
FOR SELECT
TO authenticated
USING (true);

-- Dropar políticas antigas de questões
DROP POLICY IF EXISTS "Usuários podem ver questões da sala" ON group_study_room_questions;
DROP POLICY IF EXISTS "select_group_study_room_questions" ON group_study_room_questions;

-- Permitir todos verem questões das salas
CREATE POLICY "Todos podem ler questões das salas"
ON group_study_room_questions
FOR SELECT
TO authenticated
USING (true);

-- Agora as políticas de INSERT (manter restritas)
-- Apenas o host pode criar salas
DROP POLICY IF EXISTS "insert_group_study_rooms" ON group_study_rooms;
CREATE POLICY "Criar salas"
ON group_study_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_user_id);

-- Qualquer um pode entrar como participante
DROP POLICY IF EXISTS "insert_group_study_participants" ON group_study_participants;
CREATE POLICY "Entrar como participante"
ON group_study_participants
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Participantes podem enviar mensagens
DROP POLICY IF EXISTS "insert_group_study_messages" ON group_study_messages;
CREATE POLICY "Enviar mensagens"
ON group_study_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM group_study_participants 
    WHERE room_id = group_study_messages.room_id 
    AND user_id = auth.uid()
  )
);

-- Host pode adicionar questões
DROP POLICY IF EXISTS "insert_group_study_room_questions" ON group_study_room_questions;
CREATE POLICY "Adicionar questões"
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

-- Permitir updates necessários
DROP POLICY IF EXISTS "update_group_study_rooms" ON group_study_rooms;
CREATE POLICY "Atualizar salas"
ON group_study_rooms
FOR UPDATE
TO authenticated
USING (
  host_user_id = auth.uid()
)
WITH CHECK (
  host_user_id = auth.uid()
);

-- Deletar salas (apenas host)
DROP POLICY IF EXISTS "delete_group_study_rooms" ON group_study_rooms;
CREATE POLICY "Deletar salas"
ON group_study_rooms
FOR DELETE
TO authenticated
USING (host_user_id = auth.uid());

-- Confirmar que tudo foi aplicado
SELECT 'RLS configurado com sucesso!' as status;
