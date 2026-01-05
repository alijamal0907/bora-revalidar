-- Tabela para armazenar os simulados realizados
CREATE TABLE IF NOT EXISTS public.simulados_realizados (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  quantidade_questoes INTEGER NOT NULL,
  acertos INTEGER NOT NULL DEFAULT 0,
  erros INTEGER NOT NULL DEFAULT 0,
  percentual DECIMAL(5,2) NOT NULL DEFAULT 0,
  tempo_total_segundos INTEGER NOT NULL DEFAULT 0,
  data_hora TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_simulados_user_id ON public.simulados_realizados(user_id);
CREATE INDEX IF NOT EXISTS idx_simulados_data_hora ON public.simulados_realizados(data_hora DESC);

-- Garantir que hist_questoes suporta origem 'simulado'
-- (a tabela já existe, apenas verificamos se aceita o campo origem)
