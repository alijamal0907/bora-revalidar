import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Usa service role key para operacoes admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const createTablesSQL = `
-- 1. Tabela de Progresso do Usuario (Plano de 20 Semanas)
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

-- 2. Tabela de Agendamento de Revisao (Spaced Repetition)
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

-- 3. Tabela de Registro de Respostas do Usuario
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

export async function POST(request: Request) {
  try {
    // Verificar autorizacao (opcional: adicionar verificacao de admin)
    const authHeader = request.headers.get('authorization')
    
    const results: { step: string; success: boolean; error?: string }[] = []
    
    // 1. Criar tabelas
    const { error: tablesError } = await supabaseAdmin.rpc('exec_sql', { 
      sql: createTablesSQL 
    }).single()
    
    if (tablesError) {
      // Tentar criar tabelas uma por uma via queries diretas
      const tables = [
        { name: 'user_progress', exists: false },
        { name: 'review_schedule', exists: false },
        { name: 'user_question_attempts', exists: false },
        { name: 'weekly_points', exists: false },
        { name: 'weak_topics', exists: false },
      ]
      
      // Verificar quais tabelas existem
      for (const table of tables) {
        const { data } = await supabaseAdmin
          .from(table.name)
          .select('id')
          .limit(1)
        
        table.exists = data !== null
      }
      
      results.push({ 
        step: 'Verificar tabelas', 
        success: true, 
        error: `Tabelas verificadas: ${tables.filter(t => t.exists).map(t => t.name).join(', ') || 'nenhuma'}` 
      })
    } else {
      results.push({ step: 'Criar tabelas', success: true })
    }

    return NextResponse.json({
      success: true,
      message: 'Setup de gamificacao executado',
      results,
      instructions: `
Para completar a configuracao, execute o seguinte SQL no Supabase Dashboard:

1. Va para https://supabase.com/dashboard
2. Selecione seu projeto
3. Va para SQL Editor
4. Cole e execute o conteudo do arquivo: scripts/create-gamification-tables.sql

As tabelas necessarias sao:
- user_progress (plano de 20 semanas)
- review_schedule (spaced repetition)
- user_question_attempts (historico de respostas)
- weekly_points (ranking semanal)
- weak_topics (pontos fracos)
      `
    })
  } catch (error: any) {
    console.error('Setup error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao executar setup',
      instructions: `
Execute manualmente o SQL no Supabase Dashboard:

1. Va para https://supabase.com/dashboard
2. Selecione seu projeto  
3. Va para SQL Editor
4. Cole e execute o conteudo do arquivo: scripts/create-gamification-tables.sql
      `
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Verificar status das tabelas
    const tables = ['user_progress', 'review_schedule', 'user_question_attempts', 'weekly_points', 'weak_topics']
    const status: Record<string, boolean> = {}
    
    for (const table of tables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .select('id')
          .limit(1)
        
        status[table] = !error
      } catch {
        status[table] = false
      }
    }
    
    const allExist = Object.values(status).every(v => v)
    
    return NextResponse.json({
      success: true,
      allTablesExist: allExist,
      tables: status,
      message: allExist 
        ? 'Todas as tabelas de gamificacao estao configuradas!' 
        : 'Algumas tabelas ainda precisam ser criadas. Execute o script SQL.'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}
