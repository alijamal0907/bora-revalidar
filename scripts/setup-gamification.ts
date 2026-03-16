import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createGamificationTables() {
  console.log("Starting gamification tables creation...");

  const sqlStatements = [
    // 1. Create user_progress table
    `CREATE TABLE IF NOT EXISTS user_progress (
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
    )`,

    // 2. Create review_schedule table
    `CREATE TABLE IF NOT EXISTS review_schedule (
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
    )`,

    // 3. Create user_question_attempts table
    `CREATE TABLE IF NOT EXISTS user_question_attempts (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      question_id VARCHAR NOT NULL,
      subtema VARCHAR NOT NULL,
      area_name VARCHAR NOT NULL,
      is_correct BOOLEAN NOT NULL,
      answered_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    )`,

    // 4. Create weekly_points table
    `CREATE TABLE IF NOT EXISTS weekly_points (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      points INTEGER NOT NULL DEFAULT 0,
      week_start_date DATE NOT NULL,
      week_end_date DATE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      
      UNIQUE(user_id, week_start_date)
    )`,

    // 5. Create weak_topics table
    `CREATE TABLE IF NOT EXISTS weak_topics (
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
    )`,

    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_user_progress_user_week ON user_progress(user_id, week_number)`,
    `CREATE INDEX IF NOT EXISTS idx_user_progress_completed ON user_progress(user_id, status_completed)`,
    `CREATE INDEX IF NOT EXISTS idx_review_schedule_user_next ON review_schedule(user_id, next_review)`,
    `CREATE INDEX IF NOT EXISTS idx_question_attempts_user ON user_question_attempts(user_id)`,
    `CREATE INDEX IF NOT EXISTS idx_question_attempts_user_subtema ON user_question_attempts(user_id, subtema)`,
    `CREATE INDEX IF NOT EXISTS idx_weekly_points_user_week ON weekly_points(user_id, week_start_date)`,
    `CREATE INDEX IF NOT EXISTS idx_weak_topics_user ON weak_topics(user_id, error_rate DESC)`,

    // Enable RLS
    `ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE review_schedule ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE user_question_attempts ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE weekly_points ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE weak_topics ENABLE ROW LEVEL SECURITY`,
  ];

  for (const sql of sqlStatements) {
    try {
      const { error } = await supabase.rpc("exec", {
        sql_query: sql,
      });

      if (error) {
        console.error(`Error executing: ${sql.substring(0, 50)}...`, error);
      } else {
        console.log(`✓ Executed: ${sql.substring(0, 50)}...`);
      }
    } catch (err) {
      console.error(`Exception: ${sql.substring(0, 50)}...`, err);
    }
  }

  console.log("Gamification tables creation completed!");
}

createGamificationTables().catch(console.error);
