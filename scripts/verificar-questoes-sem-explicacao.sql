-- Script para verificar quantas questões não têm explicação
-- Execute no Supabase SQL Editor

-- 1. Contagem geral
SELECT 
  COUNT(*) as total_questoes,
  COUNT(explicacao) as com_explicacao,
  COUNT(*) - COUNT(explicacao) as sem_explicacao,
  ROUND((COUNT(explicacao)::numeric / COUNT(*)::numeric) * 100, 2) as porcentagem_completa
FROM questoes;

-- 2. Distribuição por tema (questões sem explicação)
SELECT 
  tema,
  COUNT(*) as questoes_sem_explicacao
FROM questoes
WHERE explicacao IS NULL
GROUP BY tema
ORDER BY questoes_sem_explicacao DESC;

-- 3. Listar IDs das primeiras 20 questões sem explicação
SELECT id, LEFT(questao, 80) as questao_preview, tema, correta
FROM questoes
WHERE explicacao IS NULL
ORDER BY id
LIMIT 20;

-- 4. Verificar tamanho das explicações existentes (para garantir qualidade)
SELECT 
  AVG(LENGTH(explicacao)) as tamanho_medio,
  MIN(LENGTH(explicacao)) as tamanho_minimo,
  MAX(LENGTH(explicacao)) as tamanho_maximo
FROM questoes
WHERE explicacao IS NOT NULL;
