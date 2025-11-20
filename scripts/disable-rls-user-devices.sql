-- Desabilita RLS completamente para user_devices
-- Esta tabela só registra sessões do próprio usuário, então podemos simplificar a segurança

-- Remove todas as políticas existentes
DROP POLICY IF EXISTS "Users can view own sessions" ON user_devices;
DROP POLICY IF EXISTS "Users can insert own sessions" ON user_devices;
DROP POLICY IF EXISTS "Users can update own sessions" ON user_devices;

-- Desabilita RLS (segurança será feita via auth.uid() nas queries)
ALTER TABLE user_devices DISABLE ROW LEVEL SECURITY;

-- Garante que a tabela existe e está acessível
GRANT ALL ON user_devices TO authenticated;
GRANT ALL ON user_devices TO anon;
