import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createTestUsersAndSimulateData,
  simulateUserResponses,
  calculateWeakTopics,
  completeModuleAndUpdatePoints,
} from '@/lib/test-data-simulation'
import { initializeUserStudyPlan } from '@/lib/study-plan-complete'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, responseCount = 30 } = body

    const supabase = await createClient()

    // Verificar autenticação (opcional, para segurança)
    const { data: authUser } = await supabase.auth.getUser()
    if (!authUser.user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    switch (action) {
      case 'create-users': {
        try {
          const { data: users } = await supabase.auth.admin.listUsers()

          // Verificar se os usuários de teste já existem
          const testEmails = [
            'teste1@revalida.com',
            'teste2@revalida.com',
            'teste3@revalida.com',
            'teste4@revalida.com',
            'teste5@revalida.com',
          ]

          const existingTestUsers = users?.users.filter((u) => testEmails.includes(u.email!)) || []
          const userIds = existingTestUsers.map((u) => u.id)

          // Criar usuários que não existem
          for (const email of testEmails) {
            if (!existingTestUsers.some((u) => u.email === email)) {
              try {
                const { data: newUser } = await supabase.auth.admin.createUser({
                  email,
                  password: 'TestPassword123!',
                  email_confirm: true,
                  user_metadata: { name: email.split('@')[0] },
                })

                if (newUser?.user) {
                  userIds.push(newUser.user.id)

                  // Inicializar plano de estudo para o novo usuário
                  await initializeUserStudyPlan(newUser.user.id)
                }
              } catch (error) {
                console.error(`[v0] Erro ao criar usuário ${email}:`, error)
              }
            }
          }

          return NextResponse.json({
            success: true,
            userIds,
            message: `${userIds.length} usuários de teste prontos`,
          })
        } catch (error) {
          console.error('[v0] Erro ao criar usuários:', error)
          return NextResponse.json(
            { error: 'Erro ao criar usuários de teste' },
            { status: 500 }
          )
        }
      }

      case 'simulate-responses': {
        if (!userId) {
          return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
        }

        try {
          const result = await simulateUserResponses(userId, responseCount)
          return NextResponse.json({
            success: true,
            ...result,
            message: `${result.simulatedResponses} respostas simuladas`,
          })
        } catch (error) {
          console.error('[v0] Erro ao simular respostas:', error)
          return NextResponse.json(
            { error: 'Erro ao simular respostas' },
            { status: 500 }
          )
        }
      }

      case 'complete-modules': {
        if (!userId) {
          return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
        }

        try {
          const areas = [
            'Clínica Médica',
            'Cirurgia',
            'Pediatria',
            'Ginecologia e Obstetrícia',
            'Medicina Preventiva',
          ]

          // Completar 2-3 módulos aleatórios da semana 1-3
          const completedModules = []
          for (let week = 1; week <= 3; week++) {
            for (let areaIdx = 0; areaIdx < 2; areaIdx++) {
              const randomAreaIdx = Math.floor(Math.random() * areas.length)
              const area = areas[randomAreaIdx]
              const success = await completeModuleAndUpdatePoints(userId, week, area)
              if (success) {
                completedModules.push({ week, area })
              }
            }
          }

          return NextResponse.json({
            success: true,
            completedModules,
            message: `${completedModules.length} módulos completados`,
          })
        } catch (error) {
          console.error('[v0] Erro ao completar módulos:', error)
          return NextResponse.json(
            { error: 'Erro ao completar módulos' },
            { status: 500 }
          )
        }
      }

      case 'calculate-weak-topics': {
        if (!userId) {
          return NextResponse.json({ error: 'userId é obrigatório' }, { status: 400 })
        }

        try {
          const weakTopics = await calculateWeakTopics(userId)
          return NextResponse.json({
            success: true,
            weakTopics,
            message: `${weakTopics.length} temas fracos identificados`,
          })
        } catch (error) {
          console.error('[v0] Erro ao calcular temas fracos:', error)
          return NextResponse.json(
            { error: 'Erro ao calcular temas fracos' },
            { status: 500 }
          )
        }
      }

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('[v0] Erro na API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
