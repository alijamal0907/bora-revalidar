-- Tabela para armazenar metas diárias e mensais dos usuários
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  daily_questions_goal INTEGER NOT NULL DEFAULT 10,
  monthly_questions_goal INTEGER NOT NULL DEFAULT 300,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Índice para buscar metas por usuário
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);

-- RLS policies
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias metas
CREATE POLICY "Users can view own goals" ON user_goals
  FOR SELECT USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias metas
CREATE POLICY "Users can insert own goals" ON user_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias metas
CREATE POLICY "Users can update own goals" ON user_goals
  FOR UPDATE USING (auth.uid() = user_id);
