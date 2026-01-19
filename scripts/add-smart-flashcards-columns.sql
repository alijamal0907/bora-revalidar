-- Migração para Flashcards Inteligentes
-- Adiciona colunas para alternativa tendenciosa, comentário explicativo e status de aprendizado

-- Adicionar coluna para alternativa tendenciosa (resposta errada plausível)
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS alternativa_tendenciosa TEXT;

-- Adicionar coluna para comentário explicativo (exibido quando o usuário erra)
ALTER TABLE flashcards 
ADD COLUMN IF NOT EXISTS comentario_explicativo TEXT;

-- Adicionar coluna para status de aprendizado do usuário
-- Esta coluna será gerenciada por usuário na tabela de histórico
-- Mas aqui podemos ter um status global do flashcard

-- Criar índice para buscar flashcards que precisam de geração de conteúdo
CREATE INDEX IF NOT EXISTS idx_flashcards_needs_generation 
ON flashcards(id) 
WHERE alternativa_tendenciosa IS NULL OR comentario_explicativo IS NULL;

-- Criar tabela para armazenar o status de aprendizado por usuário
CREATE TABLE IF NOT EXISTS flashcard_learning_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'errou', 'consolidado')),
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
CREATE INDEX IF NOT EXISTS idx_learning_status_status ON flashcard_learning_status(user_id, status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_learning_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_flashcard_learning_status_updated_at ON flashcard_learning_status;
CREATE TRIGGER update_flashcard_learning_status_updated_at 
BEFORE UPDATE ON flashcard_learning_status
FOR EACH ROW EXECUTE FUNCTION update_learning_status_updated_at();

-- RLS para flashcard_learning_status
ALTER TABLE flashcard_learning_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios_podem_ver_seu_proprio_status"
ON flashcard_learning_status FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Usuarios_podem_criar_seu_proprio_status"
ON flashcard_learning_status FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios_podem_atualizar_seu_proprio_status"
ON flashcard_learning_status FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios_podem_deletar_seu_proprio_status"
ON flashcard_learning_status FOR DELETE
TO authenticated
USING (user_id = auth.uid());

COMMENT ON TABLE flashcard_learning_status IS 'Status de aprendizado de flashcards por usuário';
COMMENT ON COLUMN flashcard_learning_status.status IS 'Status: novo (nunca estudado), errou (precisa revisar), consolidado (já domina)';
COMMENT ON COLUMN flashcard_learning_status.next_review_at IS 'Próxima data para revisão baseada em repetição espaçada';
