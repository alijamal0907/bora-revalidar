import pg from 'pg'

const { Pool } = pg

// Desabilitar verificacao SSL para conexao
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL
})

const createTablesSQL = `
-- 1. Tabela de Progresso do Usuario (Plano de 20 Semanas)
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
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

-- 2. Tabela de Agendamento de Revisao (Spaced Repetition)
CREATE TABLE IF NOT EXISTS review_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
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

-- 3. Tabela de Registro de Respostas do Usuario
CREATE TABLE IF NOT EXISTS user_question_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
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
  user_id UUID NOT NULL,
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
  user_id UUID NOT NULL,
  subtema VARCHAR NOT NULL,
  area_name VARCHAR NOT NULL,
  error_rate DECIMAL NOT NULL,
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(user_id, subtema)
);
`

const createIndexesSQL = `
CREATE INDEX IF NOT EXISTS idx_user_progress_user_week ON user_progress(user_id, week_number);
CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(user_id, status_completed);
CREATE INDEX IF NOT EXISTS idx_review_schedule_user_next ON review_schedule(user_id, next_review);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON user_question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_subtema ON user_question_attempts(user_id, subtema);
CREATE INDEX IF NOT EXISTS idx_weekly_points_user_week ON weekly_points(user_id, week_start_date);
CREATE INDEX IF NOT EXISTS idx_weak_topics_user ON weak_topics(user_id, error_rate DESC);
`

const enableRLSSQL = `
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_question_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE weak_topics ENABLE ROW LEVEL SECURITY;
`

async function main() {
  const client = await pool.connect()
  
  try {
    console.log('Conectado ao banco de dados...')
    
    // Criar tabelas
    console.log('Criando tabelas...')
    await client.query(createTablesSQL)
    console.log('Tabelas criadas com sucesso!')
    
    // Criar indices
    console.log('Criando indices...')
    await client.query(createIndexesSQL)
    console.log('Indices criados com sucesso!')
    
    // Habilitar RLS
    console.log('Habilitando RLS...')
    await client.query(enableRLSSQL)
    console.log('RLS habilitado com sucesso!')
    
    // Verificar tabelas
    const { rows } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_progress', 'review_schedule', 'user_question_attempts', 'weekly_points', 'weak_topics')
    `)
    
    console.log('Tabelas criadas:', rows.map(r => r.table_name).join(', '))
    console.log('Setup completo!')
    
  } catch (error) {
    console.error('Erro:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
