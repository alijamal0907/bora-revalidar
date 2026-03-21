# 🎯 Sistema de Revisão Inteligente Combinada - README

## 📋 Resumo

Sistema completo de revisão inteligente que combina **questões** e **flashcards** em uma única sessão otimizada utilizando o algoritmo **SM-2 (SuperMemo)** para espaçamento inteligente.

### ✨ Principais Características

- ⚡ **Revisão Combinada**: Questões e flashcards intercalados
- 🧠 **Algoritmo SM-2**: Espaçamento inteligente baseado em ciência
- 📊 **Adaptativo**: Prioriza itens mais difíceis
- 🔄 **Sem Configuração**: Funciona com ou sem tabela de agendamento
- 📱 **Interface Unificada**: Uma experiência para questões e flashcards
- 📈 **Estatísticas**: Acompanhamento de desempenho em tempo real

## 🚀 Como Usar

### Acesso Rápido

```
1. Dashboard → "Revisão Inteligente"
2. Clique em "Iniciar Revisão Combinada"
3. Complete a sessão
4. Veja seu desempenho
```

### Modos Disponíveis

| Modo | Descrição | Ideal Para |
|------|-----------|-----------|
| 🌟 **Revisão Combinada** | Questões + Flashcards | Aprendizado eficiente |
| ❌ **Questões Erradas** | Apenas questões | Foco em fraquezas |
| 📚 **Flashcards Errados** | Apenas flashcards | Revisão de vocabulário |

## 📁 Estrutura de Arquivos

```
docs/
├── SMART_REVIEW_SYSTEM.md      # Visão geral do sistema
├── TECHNICAL_DETAILS.md        # Documentação técnica
├── USER_GUIDE.md               # Guia do usuário
└── COMPLETION_SUMMARY.md       # Resumo de implementação

components/
├── combined-review-mode.tsx    # Componente principal de revisão
├── smart-review-section.tsx    # Widget de revisão na dashboard
├── flashcard-study-mode.tsx    # Modo de estudo de flashcards
└── question-study-mode.tsx     # Modo de estudo de questões

app/
└── review/
    └── page.tsx               # Página principal de revisão

lib/
├── spaced-repetition-v2.ts    # Lógica SM-2
├── flashcards-storage.ts      # Operações com flashcards
├── storage-supabase.ts        # Operações gerais
└── smart-flashcards-v3.tsx    # Geração de conteúdo inteligente
```

## 🔧 Componentes Principais

### 1. **Combined Review Mode** 
Componente React que gerencia a sessão de revisão:
- Carrega conteúdo enriquecido
- Alterna entre flashcards e questões
- Registra respostas
- Mostra feedback em tempo real

### 2. **Spaced Repetition System**
Lógica de SM-2 que:
- Calcula próximas datas de revisão
- Ajusta fatores de facilidade
- Intercala conteúdo

### 3. **Smart Review Section**
Widget na dashboard que:
- Mostra itens vencidos
- Enriquece com conteúdo
- Oferece acesso rápido à revisão

## 📊 Fluxo de Dados

```mermaid
graph TD
    A[User.id] -->|getDueReviewItems| B[review_schedule]
    B -->|Fallback| C[flashcard_history + hist_questoes]
    C --> D[ReviewItem[]]
    D --> E[CombinedReviewMode]
    E --> F{Flashcard ou Questão?}
    F -->|Flashcard| G[Load from flashcards]
    F -->|Questão| H[Load from questoes]
    G --> I[EnrichedItem]
    H --> I
    I --> J[Display to User]
    J --> K[User Responds]
    K --> L[recordReviewResult]
    L --> M[Update review_schedule]
    M --> N[Next Session]
```

## 🎯 Algoritmo SM-2

O sistema utiliza a fórmula do SuperMemo para calcular:

1. **Novo Ease Factor (EF)**
   ```
   EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
   ```

2. **Próximo Intervalo**
   ```
   Acertou (q ≥ 3): interval = interval_anterior * EF'
   Errou (q < 3): interval = 1 dia
   ```

3. **Qualidade (q)**
   - 0-2: Incorreto
   - 3: Difícil mas correto
   - 4: Correto
   - 5: Perfeito

## 🔄 Casos de Uso

### Caso 1: Primeiro Acesso
```
1. Usuário clica "Revisão Inteligente"
2. Sistema busca de flashcard_history e hist_questoes
3. Encontra 8 flashcards errados + 4 questões erradas
4. Intercala e ordena por dificuldade
5. Apresenta 12 itens para revisão
```

### Caso 2: Revisão Contínua
```
1. Próximo dia, usuário volta
2. Sistema busca de review_schedule (itens vencidos)
3. Encontra 5 itens vencidos
4. Usuário completa sessão
5. Todos recebem novo intervalo
```

### Caso 3: Aprendizado Progressivo
```
Dia 1: Aprende 10 novos flashcards
Dia 2: Revisa os 10 (1 dia depois)
Dia 5: Revisa os 10 (3 dias depois)
Dia 12: Revisa os 10 (1 semana depois)
...padrão continua com crescimento
```

## 📈 Benefícios

✅ **Mais Eficiente** - Foca em conteúdo que precisa
✅ **Baseado em Ciência** - Algoritmo SM-2 comprovado
✅ **Flexível** - Funciona com dados existentes
✅ **Visível** - Progresso em tempo real
✅ **Motivador** - Estatísticas e achievements
✅ **Escalável** - Suporta milhares de itens

## 🛠️ Integração Técnica

### Requisitos
- Supabase ou outro banco PostgreSQL
- React 18+
- Next.js 14+
- Tailwind CSS

### Tabelas Necessárias
```sql
-- Obrigatório
flashcards (id, frente, verso, alternativa_tendenciosa, materia, tema)
questoes (id, enunciado, alternativas, resposta_correta, tema, explicacao)

-- Recomendado
review_schedule (user_id, content_id, content_type, next_review, ease_factor, interval_days)

-- Fallback
flashcard_history (user_id, flashcard_id, correct, answered_at)
hist_questoes (user_id, questao_id, correta, created_at)
```

### Importações

```typescript
// Usar revisão combinada
import { CombinedReviewMode } from '@/components/combined-review-mode'
import { getDueReviewItems, recordReviewResult } from '@/lib/spaced-repetition-v2'

// Usar na dashboard
import { SmartReviewSection } from '@/components/smart-review-section'
```

## 🧪 Testando o Sistema

### Teste Manual
1. Acesse `/review`
2. Clique em "Revisão Inteligente Combinada"
3. Complete 3-5 itens
4. Veja o feedback de acerto/erro
5. Volte e veja novo progresso

### Verificar Dados
```sql
-- Ver itens vencidos
SELECT * FROM review_schedule 
WHERE user_id = 'YOUR_ID' 
AND next_review <= NOW();

-- Ver histórico
SELECT * FROM flashcard_history 
WHERE user_id = 'YOUR_ID' 
ORDER BY answered_at DESC 
LIMIT 10;
```

## 🐛 Troubleshooting

### Problema: Nenhum item aparece
**Solução:**
1. Verifique se há itens em `flashcard_history`
2. Verifique se há itens em `hist_questoes`
3. Confira se `user_id` está correto
4. Veja logs no console

### Problema: Conteúdo não enriquecido
**Solução:**
1. Verifique se `flashcards` table existe
2. Verifique se `questoes` table existe
3. Confirme IDs existem nas tabelas

### Problema: Dados não sendo salvos
**Solução:**
1. Confira permissões RLS
2. Verifique se `review_schedule` existe
3. Veja erro exato no console

## 📚 Documentação Completa

- 📖 [**USER_GUIDE.md**](./USER_GUIDE.md) - Como usar
- 🔧 [**TECHNICAL_DETAILS.md**](./TECHNICAL_DETAILS.md) - Detalhes técnicos
- 🧠 [**SMART_REVIEW_SYSTEM.md**](./SMART_REVIEW_SYSTEM.md) - Visão geral do sistema
- ✅ [**COMPLETION_SUMMARY.md**](./COMPLETION_SUMMARY.md) - Resumo da implementação

## 🚀 Próximas Melhorias

- [ ] Gráficos de desempenho ao longo do tempo
- [ ] Filtros por tema/matéria durante revisão
- [ ] Modo "Quick Review" (30 seg por item)
- [ ] Integração com Anki
- [ ] Análise de padrões de erro
- [ ] Notificações de revisão pendente

## 📞 Suporte

Se encontrar problemas:
1. Verifique a documentação
2. Procure pelos TODOs/FIXMEs no código
3. Veja os logs do console
4. Confira as estatísticas no banco de dados

## 📄 Licença

Código fechado - Uso interno apenas

---

**Última atualização:** 2024
**Status:** ✅ Completo e Funcional
