# Exemplos de Integração - Sistema Gamificado

## Exemplo 1: Integrar ao Study Page

Quando o usuário responde uma questão, registrar na gamificação:

```typescript
// app/study/page.tsx

import { recordQuestionAttempt } from '@/lib/gamification'
import { updateWeakTopicAfterAnswer, recordReviewResult } from '@/lib/spaced-repetition-v2'

// Após confirmar resposta
const handleConfirmAnswer = async () => {
  const isCorrect = selectedAnswer === correctLetter
  
  // Salvar resposta (já existe)
  await saveQuizAnswer(userId, currentQuestion.id, selectedAnswer, isCorrect, "estudo")
  
  // NOVO: Registrar na gamificação
  await recordQuestionAttempt(
    userId,
    currentQuestion.id,
    currentQuestion.subtema,
    currentQuestion.tema || "Desconhecido",
    isCorrect
  )
  
  // NOVO: Atualizar ponto fraco
  await updateWeakTopicAfterAnswer(
    userId,
    currentQuestion.subtema,
    currentQuestion.tema,
    isCorrect
  )
  
  // NOVO: Registrar no spaced repetition (qualidade 0-5)
  const quality = isCorrect ? 4 : 1
  await recordReviewResult(
    userId,
    currentQuestion.id,
    'questao',
    isCorrect,
    quality
  )
  
  // Continuar lógica normal...
}
```

## Exemplo 2: Integrar ao Flashcards Page

Similar ao Study, mas com `content_type: 'flashcard'`:

```typescript
// app/flashcards/page.tsx

import { recordReviewResult } from '@/lib/spaced-repetition-v2'

const handleFlashcardAnswer = async (cardId: string, correct: boolean) => {
  // Registrar no spaced repetition
  const quality = correct ? 5 : 0 // 0 = completo esquecimento, 5 = perfeito
  
  await recordReviewResult(
    userId,
    cardId,
    'flashcard',
    correct,
    quality
  )
  
  // Gamification points
  const points = correct ? 5 : 1 // Menos pontos que questão
  await addWeeklyPoints(userId, points)
}
```

## Exemplo 3: Marcar Módulo como Completo

```typescript
// app/estudo-gamificado/page.tsx

const handleCompleteModule = async (week: number, area: string) => {
  // Verificar se todos os flashcards/questões foram feitos
  const questoes = await getQuestionsByTemaAndArea(area)
  const userAnswers = await getUserAnswersByArea(userId, area)
  
  // Só permitir marcar se respondeu mínimo de questões
  if (userAnswers.length >= questoes.length * 0.7) { // 70% feito
    await completeModule(userId, week, area)
    
    // Toast de sucesso
    toast.success(`Módulo ${area} concluído! +50 pontos`)
  } else {
    toast.error("Complete mais questões antes de marcar como concluído")
  }
}
```

## Exemplo 4: Exibir Alert de Pontos Fracos

```typescript
// Após responder questão errada

import { getUserWeakTopics } from '@/lib/gamification'

const handleIncorrectAnswer = async () => {
  const weakTopics = await getUserWeakTopics(userId, 1) // Top 1
  
  if (weakTopics.length > 0) {
    const topic = weakTopics[0]
    
    if (topic.error_rate > 0.6) {
      toast.warning(
        `Aviso: Taxa de erro alta em "${topic.subtema}" (${Math.round(topic.error_rate * 100)}%)`
      )
    }
  }
}
```

## Exemplo 5: Adicionar Recomendações na Página de Review

```typescript
// app/review/page.tsx

import { getReviewRecommendations } from '@/lib/spaced-repetition-v2'

export default function ReviewPage() {
  const [recommendations, setRecommendations] = useState([])
  
  useEffect(() => {
    const loadRecs = async () => {
      const recs = await getReviewRecommendations(userId, 3)
      setRecommendations(recs)
    }
    loadRecs()
  }, [])
  
  return (
    <div>
      {recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-900">Recomendações de Foco</h3>
          {recommendations.map(rec => (
            <div key={rec.subtema} className="mt-2 text-sm text-yellow-800">
              <p>
                {rec.subtema} 
                <span className="ml-2 text-xs font-bold">
                  {rec.priority === 'high' ? '🔴 URGENTE' : '🟡 IMPORTANTE'}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## Exemplo 6: API Route para Dashboard (Futuro)

```typescript
// app/api/user/stats/route.ts

import { getReviewStats } from '@/lib/spaced-repetition-v2'
import { getUserWeakTopics, getUserCurrentWeek } from '@/lib/gamification'

export async function GET(request: Request) {
  const userId = await getCurrentUserId()
  
  const [reviewStats, weakTopics, currentWeek] = await Promise.all([
    getReviewStats(userId),
    getUserWeakTopics(userId, 5),
    getUserCurrentWeek(userId),
  ])
  
  return Response.json({
    review: reviewStats,
    weakTopics,
    currentWeek,
  })
}
```

## Exemplo 7: Agendamento Automático de Revisão

```typescript
// Cron job (usar Vercel Crons)

// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/send-review-reminders",
      "schedule": "0 8 * * *"  // 8 AM diariamente
    }
  ]
}

// app/api/cron/send-review-reminders/route.ts
import { getDueReviewItems } from '@/lib/spaced-repetition-v2'
import { getSupabaseUser } from '@/lib/auth-supabase'

export async function POST(request: Request) {
  // Buscar todos os usuários com itens vencidos
  const { data: allUsers } = await supabase.auth.admin.listUsers()
  
  for (const user of allUsers.users) {
    const dueItems = await getDueReviewItems(user.id)
    
    if (dueItems.length > 0) {
      // Enviar email
      await sendEmail({
        to: user.email,
        subject: `${dueItems.length} itens para revisar!`,
        template: 'review-reminder',
        data: { count: dueItems.length }
      })
    }
  }
  
  return Response.json({ success: true })
}
```

## Exemplo 8: Widget de Progresso Semanal

```typescript
// components/weekly-progress-widget.tsx

'use client'

import { useEffect, useState } from 'react'
import { getUserCurrentWeek, getUserProgress } from '@/lib/gamification'

export function WeeklyProgressWidget({ userId }: { userId: string }) {
  const [progress, setProgress] = useState({
    currentWeek: 1,
    completedModules: 0,
    totalModules: 100,
  })
  
  useEffect(() => {
    const load = async () => {
      const [week, allProgress] = await Promise.all([
        getUserCurrentWeek(userId),
        getUserProgress(userId),
      ])
      
      const completed = allProgress.filter(p => p.status_completed).length
      
      setProgress({
        currentWeek: week,
        completedModules: completed,
        totalModules: allProgress.length,
      })
    }
    
    load()
  }, [userId])
  
  const percentage = Math.round((progress.completedModules / progress.totalModules) * 100)
  
  return (
    <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg p-4">
      <p className="text-sm text-muted-foreground">Semana {progress.currentWeek}/20</p>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-2xl font-bold">{percentage}%</span>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        {progress.completedModules} de {progress.totalModules} módulos
      </p>
    </div>
  )
}
```

## Exemplo 9: Testing

```typescript
// __tests__/gamification.test.ts

import { completeModule, getUserCurrentWeek, getUserProgress } from '@/lib/gamification'

describe('Gamification System', () => {
  it('should complete a module', async () => {
    const userId = 'test-user'
    
    // Inicializar
    await initializeStudyPlan(userId)
    
    // Completar módulo
    await completeModule(userId, 1, 'Clínica Médica')
    
    // Verificar
    const progress = await getUserProgress(userId)
    const completed = progress.find(p => p.week_number === 1 && p.area_name === 'Clínica Médica')
    
    expect(completed?.status_completed).toBe(true)
  })
  
  it('should calculate current week', async () => {
    const week = await getUserCurrentWeek('test-user')
    expect(week).toBeGreaterThanOrEqual(1)
    expect(week).toBeLessThanOrEqual(21)
  })
})
```

## Exemplo 10: Exportar Dados do Usuário

```typescript
// lib/export-user-data.ts

export async function exportUserProgress(userId: string) {
  const [progress, weakTopics, ranking] = await Promise.all([
    getUserProgress(userId),
    getUserWeakTopics(userId),
    getUserRankingPosition(userId),
  ])
  
  return {
    exportDate: new Date().toISOString(),
    userId,
    progress,
    weakTopics,
    ranking,
    totalCompleted: progress.filter(p => p.status_completed).length,
    percentComplete: Math.round(
      (progress.filter(p => p.status_completed).length / progress.length) * 100
    ),
  }
}

// Usar em página
const handleExport = async () => {
  const data = await exportUserProgress(userId)
  
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `progress-${new Date().getTime()}.json`
  a.click()
}
```

## Dicas Importantes

1. **Sempre validar `user_id`** antes de operações
2. **Use try-catch** em todas as chamadas async
3. **Teste em dev** antes de prod
4. **Monitor logs** com `[v0]` prefix
5. **Backup** dados antes de migrations
6. **Rate limit** API calls em production

Pronto! Exemplos de integração completos.
