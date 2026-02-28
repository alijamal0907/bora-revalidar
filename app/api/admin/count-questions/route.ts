import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabase
    .from('questoes')
    .select('tema')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    const tema = row.tema || '(sem tema)'
    counts[tema] = (counts[tema] || 0) + 1
  }

  const sorted = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([tema, total]) => ({ tema, total }))

  const totalGeral = sorted.reduce((acc, { total }) => acc + total, 0)

  return NextResponse.json({ totalGeral, porTema: sorted })
}
