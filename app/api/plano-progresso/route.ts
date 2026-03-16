import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/plano-progresso?userId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')

  if (!userId) return NextResponse.json({ error: 'userId obrigatório' }, { status: 400 })

  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .order('week_number', { ascending: true })

    if (error) {
      if (error.code === '42P01') return NextResponse.json({ data: [] })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/plano-progresso — inicializar plano ou marcar módulo concluído
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const supabase = await createClient()

    // Ação: marcar módulo como concluído
    if (body.action === 'complete') {
      const { userId, week, area } = body
      if (!userId || !week || !area)
        return NextResponse.json({ error: 'userId, week e area obrigatórios' }, { status: 400 })

      const { error } = await supabase
        .from('user_progress')
        .update({
          status_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('week_number', week)
        .eq('area_name', area)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Ação: inicializar plano com subtemas reais do banco
    if (body.action === 'initialize') {
      const { userId, records } = body
      if (!userId || !records?.length)
        return NextResponse.json({ error: 'userId e records obrigatórios' }, { status: 400 })

      // Verificar se já existe com as áreas corretas
      const { data: existing } = await supabase
        .from('user_progress')
        .select('id, area_name')
        .eq('user_id', userId)
        .limit(20)

      if (existing && existing.length > 0) {
        // Verificar se o progresso existente usa as áreas novas (com "Ginecologia e Obstetrícia")
        const hasNewAreas = existing.some(
          (r: any) => r.area_name === 'Ginecologia e Obstetrícia'
        )
        if (hasNewAreas) {
          return NextResponse.json({ success: true, skipped: true })
        }
        // Progresso antigo detectado — deletar e recriar com os subtemas corretos
        await supabase.from('user_progress').delete().eq('user_id', userId)
      }

      const { error } = await supabase.from('user_progress').insert(records)
      if (error && error.code !== '42P01')
        return NextResponse.json({ error: error.message }, { status: 500 })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Ação não reconhecida' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
