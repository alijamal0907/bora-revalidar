-- ============================================
-- ÍNDICES DE PERFORMANCE PARA PRODUÇÃO
-- Execute este script no Supabase SQL Editor
-- ============================================

-- Índice para otimizar busca de histórico por usuário e data
CREATE INDEX IF NOT EXISTS idx_hist_questoes_user_data 
ON hist_questoes(user_id, data_resposta DESC);

-- Índice para otimizar contagem de questões por usuário no mês atual
CREATE INDEX IF NOT EXISTS idx_hist_questoes_user_month 
ON hist_questoes(user_id, data_resposta) 
WHERE data_resposta >= date_trunc('month', CURRENT_DATE);

-- Índice para otimizar busca de marcações por usuário
CREATE INDEX IF NOT EXISTS idx_marcacoes_user 
ON marcacoes_revisao(user_id, data_marcacao DESC);

-- Índice para otimizar busca de metas por usuário
CREATE INDEX IF NOT EXISTS idx_user_goals_user 
ON user_goals(user_id);

-- Índice para otimizar busca de progresso diário
CREATE INDEX IF NOT EXISTS idx_daily_progress_user_date 
ON daily_missions_progress(user_id, date DESC);

-- Índice para otimizar busca de assinaturas por email
CREATE INDEX IF NOT EXISTS idx_assinaturas_email 
ON assinaturas(email);

-- Índice para otimizar busca de dispositivos por email
CREATE INDEX IF NOT EXISTS idx_user_devices_email 
ON user_devices(email);

-- Índice para otimizar busca de questões por tema
CREATE INDEX IF NOT EXISTS idx_questoes_tema 
ON questoes(tema);

-- Índice composto para questões por tema e dificuldade
CREATE INDEX IF NOT EXISTS idx_questoes_tema_dificuldade 
ON questoes(tema, nivel_dificuldade);

-- Verificar índices criados
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Estatísticas de uso dos índices (executar após alguns dias de uso)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as number_of_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
