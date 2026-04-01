-- Adiciona coluna para armazenar filtros de área/subtema nas salas de estudo em grupo
-- Execute este script no Supabase SQL Editor

-- Adicionar coluna filter_selections à tabela group_study_rooms
ALTER TABLE group_study_rooms 
ADD COLUMN IF NOT EXISTS filter_selections TEXT;

-- Comentário para documentação
COMMENT ON COLUMN group_study_rooms.filter_selections IS 'JSON string com os filtros de área/subtema selecionados para o simulado';
