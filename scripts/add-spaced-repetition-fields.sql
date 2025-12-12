-- Adiciona campos para suporte a repetição espaçada na tabela flashcard_history
ALTER TABLE public.flashcard_history
ADD COLUMN IF NOT EXISTS next_review_date timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS ease_factor numeric DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS interval_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS repetitions integer DEFAULT 0;

-- Índice para melhorar performance das queries de próxima revisão
CREATE INDEX IF NOT EXISTS idx_flashcard_history_next_review 
ON public.flashcard_history(user_id, next_review_date);

-- Índice para melhorar performance das queries por flashcard
CREATE INDEX IF NOT EXISTS idx_flashcard_history_flashcard 
ON public.flashcard_history(user_id, flashcard_id, answered_at DESC);
