import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Verificar status das tabelas
    const tables = ['user_progress', 'review_schedule', 'user_question_attempts', 'weekly_points', 'weak_topics']
    const status: Record<string, boolean> = {}

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('id').limit(1)

        // Se erro contem "does not exist", tabela nao existe
        if (error && (error.code === '42P01' || error.message?.includes('does not exist'))) {
          status[table] = false
        } else {
          status[table] = true
        }
      } catch {
        status[table] = false
      }
    }

    const allExist = Object.values(status).every((v) => v)

    return NextResponse.json({
      success: true,
      allTablesExist: allExist,
      tables: status,
      message: allExist
        ? 'Todas as tabelas de gamificacao estao configuradas!'
        : 'Algumas tabelas ainda precisam ser criadas. Execute o script SQL no Supabase Dashboard.',
    })
  } catch (error: any) {
    console.error('[setup-gamification] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Erro ao verificar tabelas',
        tables: {
          user_progress: false,
          review_schedule: false,
          user_question_attempts: false,
          weekly_points: false,
          weak_topics: false,
        },
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  // Retornar instrucoes para setup manual
  return NextResponse.json({
    success: true,
    message: 'Para criar as tabelas, execute o SQL no Supabase Dashboard',
    instructions: `
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Va para SQL Editor no menu lateral
4. Clique em "New Query"
5. Cole o conteudo do arquivo: scripts/create-gamification-tables.sql
6. Clique em "Run" para executar
7. Volte para /admin/setup-gamification e clique em "Verificar Tabelas"

As tabelas que serao criadas:
- user_progress: Plano de 20 semanas
- review_schedule: Spaced repetition
- user_question_attempts: Historico de respostas
- weekly_points: Ranking semanal
- weak_topics: Pontos fracos
    `,
  })
}
