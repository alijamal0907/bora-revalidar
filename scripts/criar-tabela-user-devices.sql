-- Script OPCIONAL para criar tabela user_devices
-- Execute este script no SQL Editor do Supabase APENAS se quiser habilitar
-- o controle de dispositivos único (1 dispositivo por usuário)

CREATE TABLE IF NOT EXISTS user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  device_id TEXT NOT NULL,
  user_agent TEXT,
  platform TEXT,
  active BOOLEAN DEFAULT true,
  last_active TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, device_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(active);
CREATE INDEX IF NOT EXISTS idx_user_devices_device_id ON user_devices(device_id);

-- Comentários
COMMENT ON TABLE user_devices IS 'Tabela para controlar sessões de dispositivos e permitir apenas 1 dispositivo ativo por usuário';
COMMENT ON COLUMN user_devices.device_id IS 'ID único gerado para cada dispositivo/navegador';
COMMENT ON COLUMN user_devices.active IS 'Indica se a sessão neste dispositivo está ativa';
