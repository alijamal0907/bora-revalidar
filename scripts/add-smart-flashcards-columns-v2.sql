-- Migração para Flashcards Inteligentes v2
-- Adiciona colunas para alternativa tendenciosa e comentário explicativo

-- Adicionar coluna para alternativa tendenciosa (resposta errada plausível)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcards' AND column_name = 'alternativa_tendenciosa') THEN
    ALTER TABLE flashcards ADD COLUMN alternativa_tendenciosa TEXT;
  END IF;
END $$;

-- Adicionar coluna para comentário explicativo
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flashcards' AND column_name = 'comentario_explicativo') THEN
    ALTER TABLE flashcards ADD COLUMN comentario_explicativo TEXT;
  END IF;
END $$;

-- Criar tabela para armazenar o status de aprendizado por usuário
CREATE TABLE IF NOT EXISTS flashcard_learning_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  flashcard_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'novo',
  wrong_count INTEGER DEFAULT 0,
  correct_count INTEGER DEFAULT 0,
  last_wrong_at TIMESTAMPTZ,
  last_correct_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, flashcard_id)
);

-- Criar índices para a tabela de status de aprendizado
CREATE INDEX IF NOT EXISTS idx_learning_status_user ON flashcard_learning_status(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_status_flashcard ON flashcard_learning_status(flashcard_id);
CREATE INDEX IF NOT EXISTS idx_learning_status_next_review ON flashcard_learning_status(user_id, next_review_at);

-- RLS para flashcard_learning_status
ALTER TABLE flashcard_learning_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "users_select_own_status" ON flashcard_learning_status;
DROP POLICY IF EXISTS "users_insert_own_status" ON flashcard_learning_status;
DROP POLICY IF EXISTS "users_update_own_status" ON flashcard_learning_status;
DROP POLICY IF EXISTS "users_delete_own_status" ON flashcard_learning_status;

CREATE POLICY "users_select_own_status" ON flashcard_learning_status FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "users_insert_own_status" ON flashcard_learning_status FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_update_own_status" ON flashcard_learning_status FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "users_delete_own_status" ON flashcard_learning_status FOR DELETE TO authenticated USING (user_id = auth.uid());
