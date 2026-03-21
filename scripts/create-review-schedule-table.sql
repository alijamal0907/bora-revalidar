-- Tabela para agendamento de revisão inteligente (SM-2)
-- Armazena o próximo horário de revisão para cada item de estudo

CREATE TABLE IF NOT EXISTS public.review_schedule (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('questao', 'flashcard')),
  content_id text NOT NULL,
  last_seen timestamp with time zone DEFAULT now(),
  next_review timestamp with time zone DEFAULT now(),
  interval_days integer DEFAULT 1,
  ease_factor numeric DEFAULT 2.5,
  review_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Constraint única para evitar duplicatas
  CONSTRAINT unique_user_content UNIQUE (user_id, content_type, content_id)
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_review_schedule_user_due 
ON public.review_schedule(user_id, next_review);

CREATE INDEX IF NOT EXISTS idx_review_schedule_content 
ON public.review_schedule(content_type, content_id);

CREATE INDEX IF NOT EXISTS idx_review_schedule_user_type 
ON public.review_schedule(user_id, content_type);

-- Habilitar RLS
ALTER TABLE public.review_schedule ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "review_schedule_select" ON public.review_schedule;
CREATE POLICY "review_schedule_select" ON public.review_schedule
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_schedule_insert" ON public.review_schedule;
CREATE POLICY "review_schedule_insert" ON public.review_schedule
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_schedule_update" ON public.review_schedule;
CREATE POLICY "review_schedule_update" ON public.review_schedule
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "review_schedule_delete" ON public.review_schedule;
CREATE POLICY "review_schedule_delete" ON public.review_schedule
  FOR DELETE USING (auth.uid() = user_id);

-- Função para atualizar o updated_at automaticamente
CREATE OR REPLACE FUNCTION update_review_schedule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS trigger_review_schedule_updated_at ON public.review_schedule;
CREATE TRIGGER trigger_review_schedule_updated_at
  BEFORE UPDATE ON public.review_schedule
  FOR EACH ROW
  EXECUTE FUNCTION update_review_schedule_updated_at();
