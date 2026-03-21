# Documentação Técnica - Revisão Inteligente

## Arquitetura do Sistema

### Componentes Principais

#### 1. **Página de Revisão** (`app/review/page.tsx`)
- Orquestrador central
- Gerencia 4 estados: `none`, `combined`, `questions`, `flashcards`
- Carrega dados de três fontes:
  - `getWrongAnswers()` - Questões erradas
  - `getWrongFlashcards()` - Flashcards errados
  - `getDueReviewItems()` - Itens vencidos para revisão

**Estado:**
```typescript
const [activeReviewMode, setActiveReviewMode] = useState<"none" | "questions" | "flashcards" | "combined">("none")
const [dueItems, setDueItems] = useState<ReviewItem[]>([])
```

#### 2. **Componente Combined Review** (`components/combined-review-mode.tsx`)
- Componente principal de revisão
- Responsável por:
  - Carregar e enriquecer conteúdo
  - Gerenciar estado da sessão
  - Registrar resultados
  - Exibir feedback

**Props:**
```typescript
interface CombinedReviewModeProps {
  userId: string
  dueItems: ReviewItem[]
  onComplete: () => void
  onBack: () => void
}
```

#### 3. **Sistema de Spaced Repetition** (`lib/spaced-repetition-v2.ts`)
- `getDueReviewItems(userId)` - Busca itens vencidos
- `getReviewStats(userId)` - Calcula estatísticas
- `recordReviewResult()` - Registra resultado e atualiza agenda

### Fluxo de Dados

```
┌────────────────────────────────────────────┐
│  Review Page Load                          │
└────────────┬───────────────────────────────┘
             │
             ├─→ getWrongAnswers(userId)
             ├─→ getWrongFlashcards(userId)  
             └─→ getDueReviewItems(userId)
                   │
                   ├─→ review_schedule (PRIMARY)
                   │   └─→ Fetch flashcards + questoes
                   │
                   └─→ Fallback (NO review_schedule)
                       ├─→ flashcard_history
                       └─→ hist_questoes
             │
             ↓
    ┌──────────────────────┐
    │  Display Tabs        │
    ├──────────────────────┤
    │ [Combined] [Q's] [FC]│
    └──────────────────────┘
             │
             ↓
    ┌──────────────────────┐
    │ User Selects Tab     │
    └──────────────────────┘
             │
          ┌──┴──┬──────────┬─────────┐
          │     │          │         │
          ↓     ↓          ↓         ↓
       Combined Questions Flashcards
```

## Implementação de getDueReviewItems

### Fluxo Completo

```typescript
export async function getDueReviewItems(userId: string): Promise<ReviewItem[]> {
  // 1. Tentar buscar de review_schedule
  if (hasReviewSchedule) {
    const items = await supabase.from('review_schedule').select(...)
    if (items.length > 0) return items
  }
  
  // 2. Fallback: Buscar flashcards errados
  const flashcards = await supabase
    .from('flashcard_history')
    .select('flashcard_id, correct, answered_at')
  
  // 3. Fallback: Buscar questões erradas
  const questions = await supabase
    .from('hist_questoes')
    .select('questao_id, correta, created_at')
  
  // 4. Combinar e intercalar
  const allItems = [...flashcards, ...questions]
  return interleavedItems.sort((a, b) => a.ease_factor - b.ease_factor)
}
```

### Intercalação de Tipos

```typescript
// Separa por tipo
const flashcards = allDueItems.filter(i => i.content_type === 'flashcard')
const questoes = allDueItems.filter(i => i.content_type === 'questao')

// Intercala
const interleavedItems = []
for (let i = 0; i < Math.max(flashcards.length, questoes.length); i++) {
  if (i < flashcards.length) interleavedItems.push(flashcards[i])
  if (i < questoes.length) interleavedItems.push(questoes[i])
}
```

## Enriquecimento de Conteúdo

### Em CombinedReviewMode

```typescript
// 1. Separar IDs por tipo
const flashcardIds = dueItems.filter(i => i.content_type === 'flashcard').map(i => i.content_id)
const questionIds = dueItems.filter(i => i.content_type === 'questao').map(i => i.content_id)

// 2. Buscar conteúdo
const flashcards = await supabase.from('flashcards').select(...).in('id', flashcardIds)
const questions = await supabase.from('questoes').select(...).in('id', questionIds)

// 3. Mapear para busca rápida
const flashcardsMap = new Map(flashcards.map(f => [f.id, f]))
const questionsMap = new Map(questions.map(q => [q.id, q]))

// 4. Enriquecer cada item
for (const item of dueItems) {
  if (item.content_type === 'flashcard') {
    enriched = { ...item, ...flashcardsMap.get(item.content_id) }
  } else {
    enriched = { ...item, ...questionsMap.get(item.content_id) }
  }
}
```

## Algoritmo SM-2

### Implementação

```typescript
export async function recordReviewResult(
  userId: string,
  contentId: string,
  contentType: 'questao' | 'flashcard',
  isCorrect: boolean,
  quality: number // 0-5
): Promise<void> {
  // 1. Buscar item atual
  const current = await supabase
    .from('review_schedule')
    .select('*')
    .eq('content_id', contentId)
    .single()

  // 2. Calcular novo ease_factor (SM-2)
  const EF = current.ease_factor || 2.5
  const EF_new = Math.max(1.3, EF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)))

  // 3. Calcular novo intervalo
  if (quality < 3) {
    interval = 1
    repetitions = 0
  } else {
    if (repetitions === 0) interval = 1
    else if (repetitions === 1) interval = 3
    else interval = Math.round(interval * EF_new)
    repetitions++
  }

  // 4. Calcular próxima data de revisão
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  // 5. Atualizar ou criar registro
  await supabase.from('review_schedule').upsert({
    user_id: userId,
    content_id: contentId,
    content_type: contentType,
    interval_days: interval,
    ease_factor: EF_new,
    next_review: nextReview.toISOString(),
    review_count: (current?.review_count || 0) + 1
  })
}
```

### Qualidade de Resposta

| Qualidade | Descrição | Ação |
|-----------|-----------|------|
| 0-2 | Resposta completamente errada | Intervalo = 1 dia |
| 3 | Resposta com muita dificuldade | Intervalo = 1 dia |
| 4 | Resposta correta | Intervalo × EF |
| 5 | Resposta perfeita | Intervalo × EF + bonus |

## Interface - Estados Visuais

### Flashcard Frente
```
┌─────────────────────────┐
│ Clique para ver resposta │
│                         │
│   Pergunta do Flashcard │
│                         │
│  (Click to reveal)      │
└─────────────────────────┘
```

### Flashcard Verso (Revelado)
```
┌─────────────────────────┐
│   Resposta correta      │
│                         │
│  Verso do flashcard     │
│                         │
└─────────────────────────┘
[ Errei ]  [ Acertei ]
```

### Questão
```
┌─────────────────────────┐
│ Enunciado da questão    │
│ com a pergunta          │
└─────────────────────────┘

┌ A) Primeira alternativa
├ B) Segunda alternativa
├ C) Terceira alternativa ← Selecionada
├ D) Quarta alternativa
└ E) Quinta alternativa

[Confirmar Resposta]
```

### Feedback - Acerto
```
┌─────────────────────────┐
│ ✓ Correto!              │
│ Você respondeu correto  │
└─────────────────────────┘
```

### Feedback - Erro
```
┌─────────────────────────┐
│ ✗ Incorreto             │
│ Resposta: C) Alternativa│
│                         │
│ Explicação:             │
│ Lorem ipsum dolor...    │
└─────────────────────────┘
```

## Tratamento de Erros

### Erros Esperados

1. **Conteúdo não encontrado**
   ```typescript
   if (!flashcard && !question) {
     console.warn(`Conteúdo ${contentId} não encontrado`)
     // Skip item
   }
   ```

2. **Usuário não autenticado**
   ```typescript
   if (!userId) {
     router.push('/login')
   }
   ```

3. **Banco de dados indisponível**
   ```typescript
   try {
     // query
   } catch (error) {
     console.error('Erro ao buscar dados:', error)
     return fallbackData
   }
   ```

## Performance

### Otimizações

1. **Busca em paralelo**
   ```typescript
   const [flashcards, questions] = await Promise.all([
     supabase.from('flashcards').select(...),
     supabase.from('questoes').select(...)
   ])
   ```

2. **Mapeamento com Map**
   ```typescript
   // Em vez de filter O(n²), usar Map O(1)
   const map = new Map(data.map(item => [item.id, item]))
   ```

3. **Limitação de itens**
   ```typescript
   // Máximo 20 itens por sessão
   return interleavedItems.slice(0, 20)
   ```

## Testes Recomendados

```typescript
// Test: Enriquecimento de conteúdo
test('enriches due items with flashcard content', async () => {
  const dueItems = [...] // 2 flashcards, 2 questions
  const enriched = await loadAndEnrichContent(dueItems)
  expect(enriched[0].frente).toBeDefined()
  expect(enriched[1].enunciado).toBeDefined()
})

// Test: Intercalação
test('interleaves flashcards and questions', () => {
  const items = [fc1, fc2, fc3, q1, q2]
  const interleaved = interleavedItems(items)
  expect(interleaved[0].content_type).toBe('flashcard')
  expect(interleaved[1].content_type).toBe('questao')
})

// Test: SM-2 calculation
test('calculates next review date correctly', () => {
  const result = calculateNextReview(3.5, 4) // EF=3.5, quality=4
  expect(result.interval_days).toBeGreaterThan(0)
  expect(result.ease_factor).toBeGreaterThan(3.5)
})
```

## Logs de Debug

```typescript
// Ativar logs com [v0] prefix
console.log('[v0] Due items loaded:', dueItems.length)
console.log('[v0] Enriched items:', enrichedItems.map(i => i.content_id))
console.log('[v0] Current item:', currentItem)
console.log('[v0] Result recorded:', { isCorrect, quality })
```

## Referências

- **SM-2**: https://supermemo.com/en/archives1990-2015/article/20424
- **Spaced Repetition**: https://en.wikipedia.org/wiki/Spaced_repetition
- **Implementation**: Various learning apps (Anki, Quizlet, SuperMemo)
