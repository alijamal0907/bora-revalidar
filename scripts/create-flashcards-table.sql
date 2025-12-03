-- Tabela de Flashcards para o Bora Revalidar
-- Esta tabela armazena os flashcards globais do app

CREATE TABLE IF NOT EXISTS flashcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  materia text NOT NULL,
  tema text NOT NULL,
  frente text NOT NULL,
  verso text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_global boolean DEFAULT true,
  user_id uuid NULL,
  
  -- Índices para melhorar performance das consultas
  CONSTRAINT flashcards_materia_check CHECK (materia IN (
    'Clínica Médica',
    'Cirurgia',
    'Ginecologia e Obstetrícia',
    'Pediatria',
    'Medicina Preventiva e Social'
  ))
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_flashcards_materia ON flashcards(materia);
CREATE INDEX IF NOT EXISTS idx_flashcards_tema ON flashcards(tema);
CREATE INDEX IF NOT EXISTS idx_flashcards_is_global ON flashcards(is_global);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_id ON flashcards(user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_flashcards_updated_at BEFORE UPDATE ON flashcards
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) - Permitir leitura de flashcards globais para usuários autenticados
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios_autenticados_podem_ler_flashcards_globais"
ON flashcards FOR SELECT
TO authenticated
USING (is_global = true OR user_id = auth.uid());

-- Política para inserção (futuramente, quando permitir flashcards personalizados)
CREATE POLICY "Usuarios_podem_criar_flashcards_proprios"
ON flashcards FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Política para atualização
CREATE POLICY "Usuarios_podem_atualizar_flashcards_proprios"
ON flashcards FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Política para exclusão
CREATE POLICY "Usuarios_podem_deletar_flashcards_proprios"
ON flashcards FOR DELETE
TO authenticated
USING (user_id = auth.uid());

COMMENT ON TABLE flashcards IS 'Tabela de flashcards para estudo com repetição espaçada';
COMMENT ON COLUMN flashcards.materia IS 'Matéria do Revalida (Clínica Médica, Cirurgia, etc.)';
COMMENT ON COLUMN flashcards.tema IS 'Tema específico dentro da matéria';
COMMENT ON COLUMN flashcards.frente IS 'Pergunta/gatilho do flashcard';
COMMENT ON COLUMN flashcards.verso IS 'Resposta/explicação do flashcard';
COMMENT ON COLUMN flashcards.is_global IS 'Se true, é um flashcard global do app; se false, é personalizado do usuário';
COMMENT ON COLUMN flashcards.user_id IS 'ID do usuário que criou (apenas para flashcards personalizados)';
