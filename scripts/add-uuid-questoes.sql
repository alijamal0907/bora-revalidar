-- Passo 1: Adicionar coluna uuid como identificador único real
-- Verificar se já existe antes de adicionar
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'questoes' AND column_name = 'uuid'
  ) THEN
    ALTER TABLE questoes ADD COLUMN uuid UUID DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Passo 2: Preencher uuid para linhas que ainda não têm (caso a coluna já existia mas estava vazia)
UPDATE questoes SET uuid = gen_random_uuid() WHERE uuid IS NULL;

-- Passo 3: Tornar uuid NOT NULL
ALTER TABLE questoes ALTER COLUMN uuid SET NOT NULL;

-- Passo 4: Adicionar índice único no uuid (se não existir)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'questoes' AND indexname = 'questoes_uuid_unique'
  ) THEN
    CREATE UNIQUE INDEX questoes_uuid_unique ON questoes(uuid);
  END IF;
END $$;

-- Verificar resultado
SELECT COUNT(*) as total_questoes, COUNT(uuid) as com_uuid, COUNT(DISTINCT uuid) as uuids_unicos FROM questoes;
