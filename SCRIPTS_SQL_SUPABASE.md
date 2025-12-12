# Scripts SQL para Rodar no Supabase

Execute estes scripts no **SQL Editor** do Supabase Dashboard na ordem apresentada.

---

## 1. Adicionar Campo de Explicação nas Questões

Este script adiciona a coluna `explicacao` na tabela `questoes` para armazenar justificativas das respostas.

\`\`\`sql
-- Adicionar coluna de explicação na tabela questoes
ALTER TABLE public.questoes
ADD COLUMN IF NOT EXISTS explicacao text;

-- Criar índice para melhorar performance em buscas
CREATE INDEX IF NOT EXISTS idx_questoes_explicacao 
ON public.questoes(id) 
WHERE explicacao IS NOT NULL;
\`\`\`

**Status:** ✅ Necessário - Usado na funcionalidade de justificativa

---

## 2. Verificar Estrutura da Tabela Questões

Para confirmar que a coluna foi adicionada corretamente:

\`\`\`sql
-- Ver estrutura da tabela questoes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'questoes'
ORDER BY ordinal_position;
\`\`\`

---

## 3. Verificar Estrutura da Tabela Flashcards

Para confirmar a estrutura atual dos flashcards:

\`\`\`sql
-- Ver estrutura da tabela flashcards
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'flashcards'
ORDER BY ordinal_position;
\`\`\`

---

## 4. Índices Recomendados para Performance

Com mais de 1600 flashcards, estes índices melhoram a performance:

\`\`\`sql
-- Índices para melhorar performance de consultas de flashcards
CREATE INDEX IF NOT EXISTS idx_flashcards_materia 
ON public.flashcards(materia);

CREATE INDEX IF NOT EXISTS idx_flashcards_tema 
ON public.flashcards(tema);

CREATE INDEX IF NOT EXISTS idx_flashcards_materia_tema 
ON public.flashcards(materia, tema);

CREATE INDEX IF NOT EXISTS idx_flashcards_is_global 
ON public.flashcards(is_global);

-- Índices para melhorar performance do histórico de flashcards
CREATE INDEX IF NOT EXISTS idx_flashcard_history_user_flashcard 
ON public.flashcard_history(user_id, flashcard_id);

CREATE INDEX IF NOT EXISTS idx_flashcard_history_answered_at 
ON public.flashcard_history(answered_at DESC);

CREATE INDEX IF NOT EXISTS idx_flashcard_history_correct 
ON public.flashcard_history(correct);
\`\`\`

**Status:** ✅ Recomendado - Melhora significativamente a performance

---

## 5. Estatísticas de Dados

Para verificar se tudo está funcionando:

\`\`\`sql
-- Contar total de questões
SELECT COUNT(*) as total_questoes FROM public.questoes;

-- Contar questões com explicação
SELECT 
  COUNT(*) as total,
  COUNT(explicacao) as com_explicacao,
  COUNT(*) - COUNT(explicacao) as sem_explicacao
FROM public.questoes;

-- Contar flashcards por matéria
SELECT materia, COUNT(*) as quantidade 
FROM public.flashcards 
GROUP BY materia 
ORDER BY quantidade DESC;

-- Contar flashcards por tema (top 10)
SELECT tema, COUNT(*) as quantidade 
FROM public.flashcards 
WHERE tema IS NOT NULL
GROUP BY tema 
ORDER BY quantidade DESC 
LIMIT 10;
\`\`\`

---

## 6. Limpar Dados de Teste (CUIDADO!)

⚠️ **ATENÇÃO:** Execute apenas se precisar limpar dados de teste

\`\`\`sql
-- Limpar histórico de flashcards de um usuário específico
-- DELETE FROM public.flashcard_history 
-- WHERE user_id = 'USER_ID_AQUI';

-- Limpar respostas de um usuário específico
-- DELETE FROM public.user_answers 
-- WHERE user_id = 'USER_ID_AQUI';
\`\`\`

---

## Ordem de Execução Recomendada

1. Execute o Script #1 (Adicionar explicação)
2. Execute o Script #2 (Verificar estrutura questoes)
3. Execute o Script #3 (Verificar estrutura flashcards)
4. Execute o Script #4 (Criar índices de performance)
5. Execute o Script #5 (Verificar estatísticas)

---

## Configurações Adicionais no Supabase Dashboard

### Email Templates para Recuperação de Senha (OTP)

1. Acesse: **Authentication** → **Email Templates** → **Magic Link**
2. Use este template:

\`\`\`html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
    .container { background-color: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; }
    .code { font-size: 32px; font-weight: bold; color: #C6A239; letter-spacing: 5px; text-align: center; padding: 20px; background-color: #0D1B2A; border-radius: 5px; margin: 20px 0; }
    .warning { color: #666; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Redefinir Senha - Bora Revalidar</h2>
    <p>Olá!</p>
    <p>Você solicitou a redefinição de senha. Use o código abaixo:</p>
    <div class="code">{{ .Token }}</div>
    <p>Este código expira em 1 hora.</p>
    <p class="warning">Se você não solicitou esta redefinição, ignore este email.</p>
  </div>
</body>
</html>
\`\`\`

### Redirect URLs para Recuperação de Senha

1. Acesse: **Authentication** → **URL Configuration**
2. Adicione em **Redirect URLs**:
   - `http://localhost:3000/reset-password` (desenvolvimento)
   - `https://seu-dominio.vercel.app/reset-password` (produção)

---

## Notas Importantes

- ✅ Todos os scripts são **idempotentes** (podem ser executados múltiplas vezes sem problemas)
- ✅ Os scripts usam `IF NOT EXISTS` para evitar erros se já existirem
- ✅ Backups são recomendados antes de executar scripts de produção
- ✅ Os índices melhoram a performance mas ocupam espaço de armazenamento

---

## Suporte

Se encontrar erros ao executar os scripts, verifique:
1. Permissões do usuário no Supabase
2. Se as tabelas existem no schema `public`
3. Logs de erro no SQL Editor do Supabase
