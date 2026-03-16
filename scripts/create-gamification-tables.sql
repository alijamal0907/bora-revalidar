-- ============================================
-- SISTEMA DE GAMIFICAÇÃO - BORA REVALIDAR
-- ============================================

-- 1. Tabela de Progresso do Usuário (Plano de 20 Semanas)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  area_name VARCHAR NOT NULL,
  subtopic_name VARCHAR NOT NULL,
  status_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, week_number, area_name),
  CHECK (week_number >= 1 AND week_number <= 20)
);

-- 2. Tabela de Agendamento de Revisão (Spaced Repetition)
CREATE TABLE IF NOT EXISTS review_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type VARCHAR NOT NULL CHECK (content_type IN ('questao', 'flashcard')),
  content_id VARCHAR NOT NULL,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
  next_review TIMESTAMP WITH TIME ZONE DEFAULT now(),
  interval_days INTEGER DEFAULT 1,
  ease_factor DECIMAL DEFAULT 2.5,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, content_type, content_id)
);

-- 3. Tabela de Registro de Respostas do Usuário
CREATE TABLE IF NOT EXISTS user_question_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id VARCHAR NOT NULL,
  subtema VARCHAR NOT NULL,
  area_name VARCHAR NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Tabela de Pontos Semanais (Ranking)
CREATE TABLE IF NOT EXISTS weekly_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  week_start_date DATE NOT NULL,
  week_end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, week_start_date)
);

-- 5. Tabela de Temas Fracos (Weak Topics)
CREATE TABLE IF NOT EXISTS weak_topics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subtema VARCHAR NOT NULL,
  area_name VARCHAR NOT NULL,
  error_rate DECIMAL NOT NULL,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, subtema)
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_user_progress_user_week ON user_progress(user_id, week_number);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(user_id, status_completed);
CREATE INDEX IF NOT EXISTS idx_review_schedule_user_next ON review_schedule(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON user_question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_subtema ON user_question_attempts(user_id, subtema);
CREATE INDEX IF NOT EXISTS idx_weekly_points_user_week ON weekly_points(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_weak_topics_user ON weak_topics(user_id, error_rate DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Ativar RLS em todas as tabelas
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE weak_topics ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: Usuários só podem ver seus próprios dados
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own review schedule"
  ON review_schedule FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own review schedule"
  ON review_schedule FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own review schedule"
  ON review_schedule FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own review schedule"
  ON review_schedule FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own question attempts"
  ON user_question_attempts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own question attempts"
  ON user_question_attempts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own weekly points"
  ON weekly_points FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own weekly points"
  ON weekly_points FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own weekly points"
  ON weekly_points FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can view their own weak topics"
  ON weak_topics FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own weak topics"
  ON weak_topics FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own weak topics"
  ON weak_topics FOR UPDATE
  USING (user_id = auth.uid());

-- ============================================
-- FUNÇÃO: Atualizar weak_topics automaticamente
-- ============================================

CREATE OR REPLACE FUNCTION update_weak_topics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO weak_topics (user_id, subtema, area_name, error_rate, total_attempts, correct_attempts, last_updated)
  VALUES (
    NEW.user_id,
    NEW.subtema,
    NEW.area_name,
    CASE WHEN NOT NEW.is_correct THEN 1 ELSE 0 END::DECIMAL,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    now()
  )
  ON CONFLICT (user_id, subtema) DO UPDATE SET
    total_attempts = weak_topics.total_attempts + 1,
    correct_attempts = weak_topics.correct_attempts + (CASE WHEN NEW.is_correct THEN 1 ELSE 0 END),
    error_rate = CAST(
      (weak_topics.total_attempts - weak_topics.correct_attempts - (CASE WHEN NOT NEW.is_correct THEN 0 ELSE 1 END)) 
      AS DECIMAL
    ) / (weak_topics.total_attempts + 1),
    last_updated = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar weak_topics
DROP TRIGGER IF NOT EXISTS update_weak_topics_trigger ON user_question_attempts;
CREATE TRIGGER update_weak_topics_trigger
AFTER INSERT ON user_question_attempts
FOR EACH ROW
EXECUTE FUNCTION update_weak_topics();

-- ============================================
-- FUNÇÃO: Calcular semana atual do usuário
-- ============================================

CREATE OR REPLACE FUNCTION get_user_current_week(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_week INTEGER;
BEGIN
  -- Buscar a semana mais alta onde todos os módulos foram concluídos
  SELECT COALESCE(MAX(week_number), 0) INTO current_week
  FROM user_progress
  WHERE user_id = p_user_id
    AND status_completed = TRUE
    AND week_number = (
      SELECT week_number 
      FROM user_progress 
      WHERE user_id = p_user_id 
      GROUP BY week_number 
      HAVING COUNT(*) = 5 AND COUNT(*) FILTER (WHERE status_completed = TRUE) = 5
      ORDER BY week_number DESC
      LIMIT 1
    );
  
  -- Se não houver semanas completas, retorna 1
  RETURN COALESCE(current_week, 0) + 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Obter semana atual (com risco)
-- ============================================

CREATE OR REPLACE FUNCTION get_user_progress_week(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  current_week INTEGER;
BEGIN
  -- Buscar a primeira semana que não está 100% completa
  SELECT COALESCE(MIN(week_number), 1) INTO current_week
  FROM user_progress
  WHERE user_id = p_user_id
    AND (
      status_completed = FALSE 
      OR (status_completed = TRUE AND week_number NOT IN (
        SELECT week_number 
        FROM user_progress 
        WHERE user_id = p_user_id 
        GROUP BY week_number 
        HAVING COUNT(*) = 5 AND COUNT(*) FILTER (WHERE status_completed = TRUE) = 5
      ))
    );
  
  RETURN COALESCE(current_week, 21);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNÇÃO: Gerar progresso semanal inicial
-- ============================================

CREATE OR REPLACE FUNCTION initialize_user_study_plan(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Verificar se já existe progresso para este usuário
  IF NOT EXISTS (SELECT 1 FROM user_progress WHERE user_id = p_user_id) THEN
    -- Inserir 100 registros (20 semanas × 5 áreas)
    INSERT INTO user_progress (user_id, week_number, area_name, subtopic_name, status_completed)
    SELECT 
      p_user_id,
      weeks.week_num,
      areas.area,
      CASE 
        WHEN weeks.week_num = 1 THEN
          CASE areas.area
            WHEN 'Clínica Médica' THEN 'Hipertensão arterial'
            WHEN 'Cirurgia' THEN 'Abdome agudo'
            WHEN 'Pediatria' THEN 'Puericultura'
            WHEN 'Ginecologia e Obstetrícia' THEN 'Pré-natal de baixo risco'
            WHEN 'Medicina Preventiva' THEN 'SUS princípios'
          END
        ELSE areas.area
      END,
      FALSE
    FROM (SELECT generate_series(1, 20) AS week_num) weeks
    CROSS JOIN (
      SELECT 'Clínica Médica' AS area
      UNION ALL SELECT 'Cirurgia'
      UNION ALL SELECT 'Pediatria'
      UNION ALL SELECT 'Ginecologia e Obstetrícia'
      UNION ALL SELECT 'Medicina Preventiva'
    ) areas;
  END IF;
END;
$$ LANGUAGE plpgsql;
