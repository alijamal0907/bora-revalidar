-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view own device sessions" ON user_devices;
DROP POLICY IF EXISTS "Users can insert own device sessions" ON user_devices;
DROP POLICY IF EXISTS "Users can update own device sessions" ON user_devices;

-- Habilitar RLS na tabela
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Política para permitir usuários visualizarem suas próprias sessões
CREATE POLICY "Users can view own device sessions"
ON user_devices FOR SELECT
USING (auth.uid() = user_id);

-- Política para permitir usuários inserirem suas próprias sessões
CREATE POLICY "Users can insert own device sessions"
ON user_devices FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política para permitir usuários atualizarem suas próprias sessões
CREATE POLICY "Users can update own device sessions"
ON user_devices FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
