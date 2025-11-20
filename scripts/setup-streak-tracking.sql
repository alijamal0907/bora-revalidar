-- Criar tabela user_devices para rastreamento de login
CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_info TEXT,
  ip_address TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_last_active ON user_devices(last_active);

-- RLS Policies
ALTER TABLE user_devices ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios dispositivos
CREATE POLICY "Usuários podem ver seus próprios dispositivos"
  ON user_devices FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir seus próprios dispositivos
CREATE POLICY "Usuários podem inserir seus próprios dispositivos"
  ON user_devices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seus próprios dispositivos
CREATE POLICY "Usuários podem atualizar seus próprios dispositivos"
  ON user_devices FOR UPDATE
  USING (auth.uid() = user_id);
