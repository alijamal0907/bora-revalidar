-- Script para adicionar coluna de explicação na tabela questoes
-- Executar no Supabase SQL Editor

ALTER TABLE public.questoes
ADD COLUMN IF NOT EXISTS explicacao text;

-- Comentário da coluna
COMMENT ON COLUMN public.questoes.explicacao IS 'Justificativa/explicação da resposta correta da questão';
