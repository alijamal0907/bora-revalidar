-- Criar funções RPC para buscar flashcards sem depender do cache de schema

-- Função para buscar flashcards por matéria e tema
CREATE OR REPLACE FUNCTION get_flashcards_by_materia_tema(p_materia text, p_tema text)
RETURNS TABLE (
  id uuid,
  materia text,
  tema text,
  frente text,
  verso text,
  created_at timestamptz,
  updated_at timestamptz,
  is_global boolean,
  user_id uuid
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, materia, tema, frente, verso, created_at, updated_at, is_global, user_id
  FROM flashcards
  WHERE materia = p_materia 
    AND tema = p_tema 
    AND is_global = true
  ORDER BY created_at ASC;
$$;

-- Função para buscar flashcards por matéria
CREATE OR REPLACE FUNCTION get_flashcards_by_materia(p_materia text)
RETURNS TABLE (
  id uuid,
  materia text,
  tema text,
  frente text,
  verso text,
  created_at timestamptz,
  updated_at timestamptz,
  is_global boolean,
  user_id uuid
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, materia, tema, frente, verso, created_at, updated_at, is_global, user_id
  FROM flashcards
  WHERE materia = p_materia 
    AND is_global = true
  ORDER BY tema ASC, created_at ASC;
$$;

-- Função para buscar todos os flashcards
CREATE OR REPLACE FUNCTION get_all_flashcards()
RETURNS TABLE (
  id uuid,
  materia text,
  tema text,
  frente text,
  verso text,
  created_at timestamptz,
  updated_at timestamptz,
  is_global boolean,
  user_id uuid
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, materia, tema, frente, verso, created_at, updated_at, is_global, user_id
  FROM flashcards
  WHERE is_global = true
  ORDER BY materia ASC, tema ASC, created_at ASC;
$$;
