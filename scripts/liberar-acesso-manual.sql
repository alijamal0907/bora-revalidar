-- Script para liberar acesso manual ao app Bora Revalidar
-- Execute este script no Supabase SQL Editor para adicionar emails sem pagamento

-- 1. Adicionar acesso para ali_jamal2002@hotmail.com
INSERT INTO assinaturas (email, nome, status, data_cadastro, data_pagamento, transaction_id)
VALUES (
  'ali_jamal2002@hotmail.com',
  'Ali Jamal',
  'ativo',
  NOW(),
  NOW(),
  'MANUAL_ACCESS_001'
)
ON CONFLICT (email) 
DO UPDATE SET 
  status = 'ativo',
  data_pagamento = NOW(),
  transaction_id = 'MANUAL_ACCESS_001';

-- 2. Para adicionar outros emails manualmente, use este template:
-- Descomente as linhas abaixo e substitua os valores

/*
INSERT INTO assinaturas (email, nome, status, data_cadastro, data_pagamento, transaction_id)
VALUES (
  'outro.email@exemplo.com',  -- Substitua pelo email do aluno
  'Nome do Aluno',            -- Substitua pelo nome
  'ativo',                    -- Status ativo = acesso liberado
  NOW(),                      -- Data de cadastro = agora
  NOW(),                      -- Data de pagamento = agora
  'MANUAL_ACCESS_002'         -- ID único para controle (incremente: 002, 003, etc.)
)
ON CONFLICT (email) 
DO UPDATE SET 
  status = 'ativo',
  data_pagamento = NOW();
*/

-- 3. Verificar assinaturas ativas:
SELECT email, nome, status, data_pagamento, transaction_id
FROM assinaturas
WHERE status = 'ativo'
ORDER BY data_pagamento DESC;
