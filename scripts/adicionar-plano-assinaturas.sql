-- Adiciona coluna de plano à tabela assinaturas
ALTER TABLE assinaturas 
ADD COLUMN IF NOT EXISTS plano TEXT DEFAULT 'free' CHECK (plano IN ('free', 'premium'));

-- Atualiza registros existentes com status ativo para premium
UPDATE assinaturas 
SET plano = 'premium' 
WHERE status = 'ativo' AND plano IS NULL;

-- Atualiza registros pendentes para free
UPDATE assinaturas 
SET plano = 'free' 
WHERE status != 'ativo' AND (plano IS NULL OR plano != 'premium');

-- Permite que novos usuários se cadastrem como free por padrão
-- A webhook da Cakto deve atualizar o plano para 'premium' após pagamento

-- Index para busca rápida por plano
CREATE INDEX IF NOT EXISTS idx_assinaturas_plano ON assinaturas(plano);

COMMENT ON COLUMN assinaturas.plano IS 'Plano do usuário: free (padrão) ou premium (após pagamento)';
