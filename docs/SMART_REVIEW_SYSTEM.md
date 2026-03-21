## Sistema de Revisão Inteligente Combinada

### Visão Geral
O sistema de revisão inteligente combina questões e flashcards em uma única sessão otimizada, utilizando o algoritmo SM-2 (SuperMemo) para espaçamento inteligente.

### Funcionalidades Principais

#### 1. **Revisão Combinada**
- Intercala questões e flashcards na mesma sessão
- Prioriza itens mais difíceis (com maior taxa de erro)
- Apresenta itens vencidos primeiro

#### 2. **Inteligência Adaptativa**
- Algoritmo SM-2 para cálculo de intervalo de revisão
- Fatores de facilidade dinâmicos baseados no desempenho
- Agendamento automático para próxima revisão

#### 3. **Interface Unificada**
- Card visual de flashcards com opções múltiplas
- Questões com alternativas selecionáveis
- Feedback em tempo real sobre acertos/erros
- Explicações para questões respondidas

#### 4. **Rastreamento de Desempenho**
- Estatísticas em tempo real (acertos/erros)
- Barra de progresso visual
- Taxa de aproveitamento percentual
- Resumo detalhado ao final da sessão

### Fluxo de Funcionamento

1. **Coleta de Dados**
   - Sistema busca itens vencidos de `review_schedule`
   - Fallback para `flashcard_history` e `hist_questoes`
   - Enriquece com conteúdo completo (frente/verso, enunciado, alternativas)

2. **Ordenação Inteligente**
   - Ordena por `ease_factor` (itens mais difíceis primeiro)
   - Intercala tipos de conteúdo para variedade
   - Máximo de 20 itens por sessão

3. **Apresentação**
   - Mostra tipo de conteúdo (Flashcard ou Questão)
   - Exibe tema/matéria relevante
   - Barra de progresso atualizada em tempo real

4. **Registro de Resultados**
   - Salva resultado via `recordReviewResult`
   - Atualiza `review_schedule` para próxima revisão
   - Calcula novo `interval_days` e `ease_factor`

5. **Conclusão**
   - Resumo com estatísticas finais
   - Opção de revisar novamente
   - Volta à visão geral

### Estrutura de Dados

#### ReviewItem
```typescript
interface ReviewItem {
  id: string
  user_id: string
  content_type: 'flashcard' | 'questao'
  content_id: string
  last_seen: string
  next_review: string
  interval_days: number
  ease_factor: number
  review_count: number
  created_at: string
  updated_at: string
}
```

#### EnrichedItem (CombinedReviewMode)
```typescript
interface EnrichedItem extends ReviewItem {
  // Flashcard fields
  frente?: string
  verso?: string
  alternativa_tendenciosa?: string
  materia?: string
  tema?: string
  // Question fields
  enunciado?: string
  alternativas?: Record<string, string>
  resposta_correta?: string
  explicacao?: string
  subtema?: string
}
```

### Algoritmo SM-2

O sistema utiliza a seguinte fórmula para cálculo do próximo intervalo:

```
EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))

Onde:
- EF' = novo fator de facilidade
- EF = fator anterior (padrão: 2.5)
- q = qualidade da resposta (0-5)

Intervalo = Intervalo Anterior * EF'
```

**Qualidade (q):**
- 0-2: Resposta incorreta
- 3: Resposta com dificuldade
- 4: Resposta correta
- 5: Resposta perfeita

### Recursos de Fallback

Se `review_schedule` estiver vazio, o sistema busca dados de:

1. **flashcard_history** - Histórico de respostas de flashcards
2. **hist_questoes** - Histórico de respostas de questões

Itens com taxa de erro > 30% ou não vistos há > 1 dia são marcados para revisão.

### Experiência do Usuário

#### Na Dashboard
- Card "Revisão Inteligente" mostra número de itens vencidos
- Botão direto para iniciar revisão

#### Na Página de Revisão
- Aba dedicada com 3 opções:
  1. Revisão Inteligente Combinada
  2. Questões Erradas (separadas por tema)
  3. Flashcards Errados (separados por matéria)

#### Durante a Sessão
- Indicador visual do tipo de conteúdo
- Progresso em tempo real
- Feedback visual de acerto/erro
- Explicações disponíveis para questões

### Integrações

- **Supabase**: Armazenamento de dados
- **spaced-repetition-v2.ts**: Lógica SM-2
- **combined-review-mode.tsx**: Interface unificada
- **review/page.tsx**: Orquestração da página

### Benefícios

✅ **Aprendizado mais eficiente** - Foca em conteúdo que precisa de revisão
✅ **Experiência unificada** - Questões e flashcards em uma sessão
✅ **Algoritmo científico** - SM-2 comprovado em pesquisas
✅ **Feedback em tempo real** - Progresso visível durante revisão
✅ **Dados robustos** - Funciona mesmo sem tabela de agendamento
