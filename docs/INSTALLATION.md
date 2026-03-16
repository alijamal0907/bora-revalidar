# Instalação e Configuração - Sistema Gamificado

## Pré-requisitos

- Node.js 18+
- npm/yarn/pnpm
- Supabase account configurado
- Variáveis de ambiente do Supabase

## Passo 1: Criar as Tabelas no Banco

Há duas formas de executar o script SQL:

### Opção A: Via Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Vá para SQL Editor
3. Copie o conteúdo de `scripts/create-gamification-tables.sql`
4. Cole e execute (Run)

### Opção B: Via Node.js Script (futuro)

```bash
# Após configuração do setup-gamification.ts
npm run setup:gamification
```

## Passo 2: Verificar Instalação

Execute no Supabase SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('user_progress', 'review_schedule', 'user_question_attempts', 'weekly_points', 'weak_topics');

-- Deve retornar 5 tabelas
```

## Passo 3: Deploy do Código

1. Commit e push do código para seu repositório
2. Deploy automático via Vercel
3. Ou build local e deploy manual

## Passo 4: Testar

### No Dashboard

1. Login no app
2. Clique em "Plano Gamificado"
3. Deve exibir 20 semanas com 5 módulos cada
4. Clique em "Ranking" para ver posição
5. Clique em "Pontos Fracos" (vazio inicialmente)

### Criar Dados de Teste

```typescript
// No console do navegador, com usuário logado:
import { initializeStudyPlan } from '@/lib/gamification'
import { getSupabaseUser } from '@/lib/auth-supabase'

const user = await getSupabaseUser()
await initializeStudyPlan(user.id)
```

## Estrutura de Arquivos Criados

```
projeto/
├── app/
│   ├── estudo-gamificado/
│   │   └── page.tsx              # Plano de 20 semanas
│   ├── ranking-semanal/
│   │   └── page.tsx              # Ranking semanal
│   ├── pontos-fracos/
│   │   └── page.tsx              # Detecção de fracos
│   └── dashboard/
│       └── page.tsx              # MODIFICADO: adicionado cards novos
│
├── components/
│   └── smart-review-section.tsx  # Seção de revisão inteligente
│
├── lib/
│   ├── gamification.ts           # Funções principais
│   └── spaced-repetition-v2.ts   # SM-2 melhorado
│
├── scripts/
│   └── create-gamification-tables.sql  # SQL de criação
│
└── docs/
    └── GAMIFICATION_SYSTEM.md    # Documentação completa
```

## Endpoints Utilizados

Todos utilizam Server Actions. Nenhum endpoint REST novo foi adicionado.

### Funções Disponíveis

```typescript
// gamification.ts
- initializeStudyPlan()
- getUserProgress()
- getUserCurrentWeek()
- completeModule()
- addWeeklyPoints()
- getUserWeakTopics()
- getWeeklyRanking()
- getUserRankingPosition()
- recordQuestionAttempt()

// spaced-repetition-v2.ts
- getDueReviewItems()
- recordReviewResult()
- getReviewStats()
- getNextReviewDate()
- resetReviewSchedule()
- getReviewRecommendations()
```

## Configuração Recomendada

### Environment Variables (já existentes)

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
POSTGRES_URL=...
```

### Nenhuma nova variável necessária!

## Próximos Passos (Opcional)

### 1. Integrar ao Study Page

Quando usuário completa questão:

```typescript
import { recordQuestionAttempt, updateWeakTopicAfterAnswer } from '@/lib/gamification'
import { recordReviewResult } from '@/lib/spaced-repetition-v2'

// Após resposta
await recordQuestionAttempt(
  userId,
  questionId,
  subtema,
  areaName,
  isCorrect
)

// Atualizar ponto fraco
await updateWeakTopicAfterAnswer(
  userId,
  subtema,
  areaName,
  isCorrect
)

// Spaced repetition
await recordReviewResult(
  userId,
  questionId,
  'questao',
  isCorrect,
  quality // 0-5
)
```

### 2. Integrar ao Flashcards Page

Mesmo fluxo, mas com `content_type: 'flashcard'`

### 3. Adicionar Notificações

Quando itens estão vencidos para revisão:
- Email notification
- Push notification
- In-app toast

### 4. Analytics

Track:
- Taxa de conclusão por semana
- Média de tempo por módulo
- Correlação entre ranking e desempenho

## Troubleshooting

### "Table not found" ao acessar página

**Solução**: Executar SQL de criação novamente ou verificar se está acessando o banco correto.

### Plano não inicializa

**Verificar**:
```sql
SELECT COUNT(*) FROM user_progress WHERE user_id = 'seu-uuid';
```

**Se vazio**: Chamar `initializeStudyPlan(userId)` manualmente

### RLS bloqueando acesso

**Verificar**: `ALTER TABLE X ENABLE ROW LEVEL SECURITY;`

**Adicionar policy faltante** se necessário

### Pontos não aparecem no ranking

**Verificar**:
```sql
SELECT * FROM weekly_points 
WHERE user_id = 'seu-uuid' 
AND week_start_date = CURRENT_DATE - (CURRENT_DATE - DATE_TRUNC('week', CURRENT_DATE)::date);
```

### Semana atual errada

**Reset manual**:
```sql
DELETE FROM user_progress WHERE user_id = 'seu-uuid';
```

Depois chamar `initializeStudyPlan(userId)` novamente.

## Performance

### Otimizações Implementadas

- Índices em todas as queries principais
- RLS para isolamento de dados
- Lazy loading de componentes
- Memoization no cliente

### Monitoramento

- Log de todas as operações com `[v0]` prefix
- Usar browser DevTools > Console para debug
- Supabase Dashboard para SQL queries

## Suporte

Para problemas:

1. Verificar console do navegador (F12)
2. Verificar Supabase logs
3. Abrir GitHub issue
4. Verificar docs em `docs/GAMIFICATION_SYSTEM.md`

## Checklist Final

- [ ] Tabelas criadas no Supabase
- [ ] Código deployado
- [ ] Dashboard acessível
- [ ] Plano carrega sem erro
- [ ] Ranking mostra usuários
- [ ] Pontos fracos mostra (vazio ou com dados)
- [ ] SmartReviewSection exibe no dashboard

Pronto! Sistema gamificado operacional.
