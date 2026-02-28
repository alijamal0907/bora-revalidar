-- Total geral de questões
SELECT COUNT(*) AS total_questoes FROM questoes;

-- Distribuição por tema (materia + tema)
SELECT
  materia,
  tema,
  COUNT(*) AS total
FROM questoes
GROUP BY materia, tema
ORDER BY materia ASC, total DESC;
