# Sistema Gamificado de Estudo - Bora Revalidar

## Visão Geral

Este documento descreve a implementação completa do sistema gamificado de estudo para preparação do exame Revalida. O sistema integra um plano de 20 semanas, detecção automática de pontos fracos, ranking semanal e um sistema inteligente de repetição espaçada.

## Arquitetura

### Banco de Dados

#### Tabelas Principais

1. **user_progress**
   - Rastreia o progresso do usuário nas 20 semanas
   - Armazena qual módulo foi concluído e quando
   - Permite desbloquear semanas progressivamente

2. **review_schedule**
   - Implementa o algoritmo SM-2 de espaçamento
   - Agenda automaticamente próximas revisões
   - Otimiza intervalo de revisão baseado no desempenho

3. **user_question_attempts**
   - Registra cada resposta do usuário
   - Usa dados para detectar temas fracos
   - Alimenta o sistema de análise

4. **weekly_points**
   - Acumula pontos semanalmente
   - Base para o sistema de ranking
   - Redefine a cada segunda-feira

5. **weak_topics**
   - Identifica automaticamente pontos fracos
   - Calcula taxa de erro por subtema
   - Prioriza áreas para revisão

### Funções Principais

```sql
-- Obter semana atual do usuário
get_user_current_week(user_id)

-- Gerar progresso inicial
initialize_user_study_plan(user_id)
```

## Componentes Frontend

### Páginas

1. **Plano de Aprovação** (`/estudo-gamificado`)
   - Trilha visual de 20 semanas
   - 5 módulos por semana (5 áreas médicas)
   - Status: Completo, Em Progresso, Bloqueado
   - Ações: Resolver Questões, Revisar Flashcards, Marcar como Completo

2. **Ranking Semanal** (`/ranking-semanal`)
   - Top 3 em destaque (pódio)
   - Ranking completo do usuário
   - Posição pessoal e pontuação
   - Regras de pontuação transparentes

3. **Pontos Fracos** (`/pontos-fracos`)
   - Lista de tópicos com maior taxa de erro
   - Classificação por prioridade (Crítico, Alto, Médio)
   - Links diretos para estudo direcionado
   - Progressão visual de melhoria

### Componentes

1. **SmartReviewSection**
   - Exibe itens vencidos para revisão
   - Mostra estatísticas do spaced repetition
   - Integrado ao dashboard principal

## Biblioteca (lib)

### gamification.ts

```typescript
// Inicializar plano para novo usuário
initializeStudyPlan(userId: string)

// Obter progresso completo
getUserProgress(userId: string): UserProgress[]

// Obter semana atual
getUserCurrentWeek(userId: string): number

// Marcar módulo como concluído
completeModule(userId: string, week: number, area: string)

// Adicionar pontos semanais
addWeeklyPoints(userId: string, points: number)

// Obter temas fracos
getUserWeakTopics(userId: string): WeakTopic[]

// Ranking
getWeeklyRanking(limit: number)
getUserRankingPosition(userId: string)
```

### spaced-repetition-v2.ts

```typescript
// Sistema SM-2 melhorado com intervalos customizados
recordReviewResult(
  userId: string,
  contentId: string,
  contentType: 'questao' | 'flashcard',
  isCorrect: boolean,
  quality: number // 0-5
)

// Itens vencidos
getDueReviewItems(userId: string): ReviewItem[]

// Estatísticas
getReviewStats(userId: string)

// Recomendações
getReviewRecommendations(userId: string)
```

## Sistema de Pontuação

### Pontos Ganhos

| Ação | Pontos |
|------|--------|
| Questão Correta | +10 |
| Questão Errada | +2 |
| Módulo Completo | +50 |
| Sessão Flashcards | +5 |

### Ranking

- Atualiza em tempo real
- Reseta semanalmente (segunda-feira 00:00)
- Top 10 exibido com medalhas (🥇🥈🥉)
- Cada usuário vê sua posição

## Algoritmo SM-2 (Spaced Repetition)

### Intervalos de Revisão

```
Erro 1ª vez:    1 dia
Erro 2ª vez:    3 dias
Sucesso:        7 dias
Sucesso:        15 dias
Sucesso:        30 dias
Sucesso:        60 dias
```

### Fator de Facilidade

- Começa em 2.5
- Aumenta com acertos (+0.1)
- Diminui com erros (até -0.08)
- Mínimo de 1.3

## Fluxo de Uso

### Novo Usuário

1. Login → Dashboard
2. Plano automático gerado (20 semanas × 5 áreas)
3. Semana 1 desbloqueada, resto bloqueado
4. Estuda questões/flashcards do módulo
5. Marca módulo como concluído
6. Próxima semana desbloqueia

### Sistema de Revisão

1. Usuário responde questão/flashcard
2. Resultado registrado em `user_question_attempts`
3. Ponto fraco atualizado automaticamente
4. Agendamento SM-2 criado/atualizado
5. Próxima revisão em X dias

### Ranking

1. Pontos acumulados em `weekly_points`
2. Ranking calculado por `week_start_date`
3. Reseta toda segunda-feira
4. Medalhas para top 3

## Integração com Sistema Existente

### Dashboard Atualizado

- 3 novos cards: Plano Gamificado, Ranking, Pontos Fracos
- Seção Smart Review mostrando itens vencidos
- Acesso rápido a todas as funcionalidades

### Modificações Mínimas

- Apenas adicionado imports e componentes novos
- Dashboard retrocompatível com funcionalidades antigas
- Sem breaking changes

## Segurança (RLS)

Todas as tabelas possuem Row Level Security:

```sql
-- Usuários veem apenas seus dados
CREATE POLICY "Users can view their own..."
  ON table_name FOR SELECT
  USING (user_id = auth.uid());
```

## Deployment

### Pré-requisitos

1. Supabase conectado
2. Variáveis de ambiente configuradas
3. Banco de dados iniciado

### Passos

1. Executar migration: `scripts/create-gamification-tables.sql`
2. Deploy do código
3. Usuários automáticamente recebem plano ao primeiro acesso

## Funcionalidades Futuras

- [ ] Badges e conquistas
- [ ] Sistema de multiplayer em tempo real
- [ ] Recomendações de IA
- [ ] Análise preditiva de desempenho
- [ ] Integração com calendar
- [ ] Notificações de revisão
- [ ] Exportar progresso
- [ ] Compartilhar placares

## Troubleshooting

### Plano não inicializa

- Verificar: `SELECT COUNT(*) FROM user_progress WHERE user_id = 'xxx'`
- Se vazio, chamar: `initialize_user_study_plan()` manualmente

### Pontos não aparecem

- Verificar: `SELECT * FROM weekly_points WHERE user_id = 'xxx'`
- Verificar data semanal está correta

### RLS Bloqueando

- Adicionar policies:
  ```sql
  ALTER TABLE tabela ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "..." ON tabela ...
  ```

## Métricas Chave

- **Taxa de Conclusão**: % de usuários que completam semanas
- **Engagement**: Revisitas por semana
- **Performance**: Taxa de acerto média
- **Retenção**: Usuários ativos após 1 mês
- **Ranking Participation**: % usando ranking

## Notas de Desenvolvimento

### Padrões

- Todas as funções server use `'use server'`
- Use `console.log("[v0] ...")` para debug
- Sempre treat `user_id` como UUID
- Validar entrada com `Math.max/min` para ranges

### Performance

- Índices criados para queries principais
- Limite de 100 para queries de ranking
- Memoize `getUserProgress` no cliente
- Atualizar weekly_points apenas 1x por ação

## Contato & Suporte

Para issues, refer to:
- GitHub: [projeto]
- Docs: [link]
- Discord: [servidor]
