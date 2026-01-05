-- Tabela de metas do usuário
CREATE TABLE IF NOT EXISTS public.user_metas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'semanal', 'diaria'
  categoria text NOT NULL, -- 'questoes', 'simulados', 'flashcards', 'materia'
  descricao text NOT NULL,
  meta_valor integer NOT NULL, -- valor da meta
  progresso_atual integer DEFAULT 0,
  completada boolean DEFAULT false,
  data_inicio timestamp with time zone DEFAULT now(),
  data_fim timestamp with time zone,
  materia text, -- se for meta específica de matéria
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Tabela de badges/conquistas
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id text NOT NULL, -- identificador único do badge
  badge_nome text NOT NULL,
  badge_descricao text NOT NULL,
  badge_icone text NOT NULL, -- emoji ou nome do ícone
  desbloqueado boolean DEFAULT false,
  data_desbloqueio timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela de notificações do usuário
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo text NOT NULL, -- 'lembrete', 'progresso', 'alerta', 'incentivo'
  titulo text NOT NULL,
  mensagem text NOT NULL,
  lida boolean DEFAULT false,
  data_criacao timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now()
);

-- Tabela de estatísticas diárias do usuário (cache)
CREATE TABLE IF NOT EXISTS public.user_daily_stats (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data date NOT NULL,
  questoes_respondidas integer DEFAULT 0,
  questoes_corretas integer DEFAULT 0,
  flashcards_estudados integer DEFAULT 0,
  simulados_realizados integer DEFAULT 0,
  tempo_total_estudo integer DEFAULT 0, -- em segundos
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, data)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_metas_user_id ON public.user_metas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_metas_completada ON public.user_metas(completada);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_desbloqueado ON public.user_badges(desbloqueado);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notifications_lida ON public.user_notifications(lida);
CREATE INDEX IF NOT EXISTS idx_user_daily_stats_user_id ON public.user_daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_daily_stats_data ON public.user_daily_stats(data);

-- RLS Policies
ALTER TABLE public.user_metas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para user_metas
CREATE POLICY "Users can view own metas" ON public.user_metas
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metas" ON public.user_metas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own metas" ON public.user_metas
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para user_badges
CREATE POLICY "Users can view own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges" ON public.user_badges
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own badges" ON public.user_badges
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para user_notifications
CREATE POLICY "Users can view own notifications" ON public.user_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications" ON public.user_notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para user_daily_stats
CREATE POLICY "Users can view own daily stats" ON public.user_daily_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily stats" ON public.user_daily_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily stats" ON public.user_daily_stats
  FOR UPDATE USING (auth.uid() = user_id);
