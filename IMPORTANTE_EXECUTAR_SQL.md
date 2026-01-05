# ⚠️ IMPORTANTE: Scripts SQL Pendentes

## Status Atual
O sistema de conquistas está funcional na interface, mas **precisa das tabelas no banco de dados** para persistir os dados entre sessões.

## Scripts que PRECISAM ser executados no Supabase

### 1️⃣ PRIORIDADE MÁXIMA: Tabela de Conquistas
📁 Arquivo: `scripts/create-daily-goals-tables.sql`

Execute este script no **SQL Editor do Supabase Dashboard** para criar a tabela `user_achievements`:

```sql
-- Tabela de conquistas desbloqueadas pelos usuários
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at ON public.user_achievements(unlocked_at DESC);

-- RLS Policies
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver suas próprias conquistas"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Sistema pode inserir conquistas"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 2️⃣ Tabela de Simulados (se ainda não existir)
📁 Arquivo: `scripts/create-simulados-tables.sql`

### 3️⃣ Como Executar

1. Acesse o Supabase Dashboard: https://app.supabase.com
2. Selecione seu projeto: `wilcwwcfuryagkibosjb`
3. Vá em **SQL Editor** no menu lateral
4. Clique em **New Query**
5. Cole o script SQL
6. Clique em **Run** (ou pressione Ctrl+Enter)
7. Verifique se apareceu "Success. No rows returned"

### 4️⃣ Verificar se funcionou

Execute esta query no SQL Editor:

```sql
-- Verificar se a tabela foi criada
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_achievements'
ORDER BY ordinal_position;
```

Deve retornar 7 linhas com as colunas: id, user_id, achievement_id, name, description, icon, unlocked_at, created_at.

## O que acontece ANTES de executar o SQL?

✅ **O que FUNCIONA:**
- Interface de conquistas carrega normalmente
- Progresso em tempo real baseado nas ações do usuário
- Modal de comemoração aparece ao clicar em "Desbloquear Conquista"
- Mensagens motivacionais são exibidas

❌ **O que NÃO funciona:**
- Conquistas não são salvas permanentemente
- Ao recarregar a página, conquistas desbloqueadas são perdidas
- Aparece warning no console: "Tabela user_achievements não existe"

## Após executar o SQL

✅ **Tudo funcionará perfeitamente:**
- Conquistas desbloqueadas são salvas permanentemente
- Persistem entre sessões
- Sincronizam entre dispositivos
- Histórico completo de desbloqueios

---

**📌 Execute o script SQL o quanto antes para ter a experiência completa do sistema de conquistas!**
