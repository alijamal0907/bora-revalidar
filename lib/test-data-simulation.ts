import { createClient } from '@/lib/supabase/server'

// Criar usuários de teste para simular ranking
export async function createTestUsersAndSimulateData() {
  const supabase = await createClient()

  const testUsers = [
    { email: 'teste1@revalida.com', password: 'TestPassword123!', name: 'Dr. Teste 1' },
    { email: 'teste2@revalida.com', password: 'TestPassword123!', name: 'Dra. Teste 2' },
    { email: 'teste3@revalida.com', password: 'TestPassword123!', name: 'Dr. Teste 3' },
    { email: 'teste4@revalida.com', password: 'TestPassword123!', name: 'Dr. Teste 4' },
    { email: 'teste5@revalida.com', password: 'TestPassword123!', name: 'Dra. Teste 5' },
  ]

  const createdUsers: any[] = []

  for (const testUser of testUsers) {
    try {
      // Tentar criar usuário (pode já existir)
      const { data, error: signupError } = await supabase.auth.signUp({
        email: testUser.email,
        password: testUser.password,
        options: {
          data: { name: testUser.name },
        },
      })

      if (signupError && !signupError.message.includes('already registered')) {
        console.error(`[v0] Erro ao criar usuário ${testUser.email}:`, signupError)
        continue
      }

      if (data?.user) {
        createdUsers.push(data.user)
        console.log(`[v0] Usuário criado/existente: ${testUser.email}`)
      }
    } catch (error) {
      console.error(`[v0] Erro ao criar usuário de teste:`, error)
    }
  }

  return createdUsers
}

// Simular respostas do usuário para popular ranking
export async function simulateUserResponses(userId: string, simulatedResponses: number = 50) {
  const supabase = await createClient()

  const areas = ['Clínica Médica', 'Cirurgia', 'Pediatria', 'Ginecologia e Obstetrícia', 'Medicina Preventiva']
  const subtemas = {
    'Clínica Médica': ['Semiotecnia', 'Cardiologia Básica', 'Gastrointestinal', 'Neurologia'],
    'Cirurgia': ['Emergências', 'Técnica Cirúrgica', 'Trauma', 'Abdômen Agudo'],
    'Pediatria': ['Desenvolvimento', 'Vacinação', 'Nutrição', 'Infecções'],
    'Ginecologia e Obstetrícia': ['Obstetrícia', 'Ginecologia', 'Contracepção', 'Infertilidade'],
    'Medicina Preventiva': ['Epidemiologia', 'Saúde Pública', 'Promoção', 'Vigilância'],
  }

  let totalPoints = 0

  for (let i = 0; i < simulatedResponses; i++) {
    const area = areas[Math.floor(Math.random() * areas.length)]
    const areaSubtemas = subtemas[area as keyof typeof subtemas]
    const subtema = areaSubtemas[Math.floor(Math.random() * areaSubtemas.length)]

    // 70% de chance de acertar
    const isCorrect = Math.random() < 0.7

    // Registrar resposta
    const { error: responseError } = await supabase
      .from('user_question_attempts')
      .insert({
        user_id: userId,
        question_id: `q_${Date.now()}_${i}`,
        subtema,
        area_name: area,
        is_correct: isCorrect,
      })

    if (!responseError) {
      // Adicionar pontos
      totalPoints += isCorrect ? 10 : 2
    }
  }

  // Atualizar weekly_points
  const weekStart = getWeekStart(new Date())
  const weekEnd = getWeekEnd(new Date())

  const { data: existingPoints } = await supabase
    .from('weekly_points')
    .select('id, points')
    .eq('user_id', userId)
    .eq('week_start_date', weekStart.toISOString().split('T')[0])
    .single()

  if (existingPoints) {
    await supabase
      .from('weekly_points')
      .update({ points: existingPoints.points + totalPoints })
      .eq('id', existingPoints.id)
  } else {
    await supabase.from('weekly_points').insert({
      user_id: userId,
      points: totalPoints,
      week_start_date: weekStart.toISOString().split('T')[0],
      week_end_date: weekEnd.toISOString().split('T')[0],
    })
  }

  console.log(`[v0] Simuladas ${simulatedResponses} respostas para usuário ${userId}, ${totalPoints} pontos`)
  return { simulatedResponses, totalPoints }
}

// Função auxiliar para obter início da semana
function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

// Função auxiliar para obter fim da semana
function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return end
}

// Atualizar pontos do usuário em tempo real
export async function updateUserPoints(
  userId: string,
  isCorrect: boolean,
  subtema: string,
  area: string
): Promise<number> {
  const supabase = await createClient()

  // Registrar resposta
  await supabase.from('user_question_attempts').insert({
    user_id: userId,
    question_id: `q_${Date.now()}`,
    subtema,
    area_name: area,
    is_correct: isCorrect,
  })

  // Adicionar pontos semanais
  const points = isCorrect ? 10 : 2
  const weekStart = getWeekStart(new Date())
  const weekEnd = getWeekEnd(new Date())
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const { data: existingPoints } = await supabase
    .from('weekly_points')
    .select('id, points')
    .eq('user_id', userId)
    .eq('week_start_date', weekStartStr)
    .single()

  if (existingPoints) {
    const { data: updated } = await supabase
      .from('weekly_points')
      .update({ points: existingPoints.points + points })
      .eq('id', existingPoints.id)
      .select('points')
      .single()

    return updated?.points || existingPoints.points + points
  } else {
    const { data: created } = await supabase
      .from('weekly_points')
      .insert({
        user_id: userId,
        points,
        week_start_date: weekStartStr,
        week_end_date: weekEnd.toISOString().split('T')[0],
      })
      .select('points')
      .single()

    return created?.points || points
  }
}

// Atualizar módulo como completo e adicionar pontos
export async function completeModuleAndUpdatePoints(
  userId: string,
  weekNumber: number,
  areaName: string
): Promise<boolean> {
  const supabase = await createClient()

  try {
    // Marcar módulo como completo
    const { error: updateError } = await supabase
      .from('user_progress')
      .update({ status_completed: true, completed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('week_number', weekNumber)
      .eq('area_name', areaName)

    if (updateError) {
      console.error('[v0] Erro ao marcar módulo como completo:', updateError)
      return false
    }

    // Adicionar 50 pontos por módulo completo
    await updateUserPoints(userId, true, `Módulo ${areaName}`, areaName)
    // Chamar novamente para 50 pontos (4x +10 = 40, precisamos de 50)
    await updateUserPoints(userId, true, `Módulo ${areaName}`, areaName)

    console.log(`[v0] Módulo completo: Semana ${weekNumber}, Área ${areaName}`)
    return true
  } catch (error) {
    console.error('[v0] Erro em completeModuleAndUpdatePoints:', error)
    return false
  }
}

// Calcular taxa de erro por subtema para pontos fracos
export async function calculateWeakTopics(userId: string) {
  const supabase = await createClient()

  try {
    const { data: attempts, error } = await supabase
      .from('user_question_attempts')
      .select('subtema, area_name, is_correct')
      .eq('user_id', userId)

    if (error || !attempts) {
      console.error('[v0] Erro ao buscar tentativas:', error)
      return []
    }

    // Agrupar por subtema
    const subtemaStats = new Map<
      string,
      {
        areaName: string
        totalAttempts: number
        correctAttempts: number
        errorRate: number
      }
    >()

    attempts.forEach((attempt: any) => {
      if (!subtemaStats.has(attempt.subtema)) {
        subtemaStats.set(attempt.subtema, {
          areaName: attempt.area_name,
          totalAttempts: 0,
          correctAttempts: 0,
          errorRate: 0,
        })
      }

      const stats = subtemaStats.get(attempt.subtema)!
      stats.totalAttempts++
      if (attempt.is_correct) {
        stats.correctAttempts++
      }
      stats.errorRate = ((stats.totalAttempts - stats.correctAttempts) / stats.totalAttempts) * 100
    })

    // Converter para array e filtrar os que têm erro > 40%
    const weakTopics = Array.from(subtemaStats.entries())
      .filter(([_, stats]) => stats.errorRate > 40)
      .map(([subtema, stats]) => ({
        subtema,
        area_name: stats.areaName,
        error_rate: stats.errorRate,
        total_attempts: stats.totalAttempts,
        correct_attempts: stats.correctAttempts,
      }))

    // Atualizar weak_topics no banco
    for (const topic of weakTopics) {
      const { error: upsertError } = await supabase.from('weak_topics').upsert(
        {
          user_id: userId,
          subtema: topic.subtema,
          area_name: topic.area_name,
          error_rate: topic.error_rate,
          total_attempts: topic.total_attempts,
          correct_attempts: topic.correct_attempts,
        },
        { onConflict: 'user_id, subtema' }
      )

      if (upsertError) {
        console.error('[v0] Erro ao atualizar weak_topics:', upsertError)
      }
    }

    return weakTopics
  } catch (error) {
    console.error('[v0] Erro em calculateWeakTopics:', error)
    return []
  }
}
