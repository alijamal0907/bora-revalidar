import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const AREA_TEMAS: Record<string, string[]> = {
  'Clínica Médica': ['Clínica Médica', 'clinica medica', 'Clinica Medica'],
  'Clínica Cirúrgica': ['Clínica Cirúrgica', 'clinica cirurgica', 'Cirurgia', 'Clínica Cirurgica'],
  'Pediatria': ['Pediatria', 'pediatria'],
  'Ginecologia e Obstetrícia': [
    'Ginecologia e Obstetrícia',
    'Ginecologia e obstetrícia',
    'ginecologia e obstetricia',
    'Ginecologia',
    'Obstetrícia',
    'obstetricia',
  ],
  'Medicina Preventiva': ['Medicina Preventiva', 'medicina preventiva', 'Saúde Coletiva', 'saude coletiva'],
}

export async function GET() {
  try {
    const supabase = await createClient()

    // Busca todos os subtemas distintos e não-nulos do banco
    const { data, error } = await supabase
      .from('questoes')
      .select('tema, subtema')
      .not('subtema', 'is', null)
      .not('subtema', 'eq', '')
      .limit(10000)

    if (error) {
      console.error('[plano-subtemas] Erro ao buscar subtemas:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Agrupar subtemas por área (normalizando o campo tema para as áreas do plano)
    const byArea: Record<string, Set<string>> = {
      'Clínica Médica': new Set(),
      'Clínica Cirúrgica': new Set(),
      'Pediatria': new Set(),
      'Ginecologia e Obstetrícia': new Set(),
      'Medicina Preventiva': new Set(),
    }

    for (const row of data || []) {
      if (!row.subtema || !row.tema) continue
      // Descobre qual área do plano corresponde ao tema do banco
      for (const [area, temas] of Object.entries(AREA_TEMAS)) {
        if (temas.some((t) => t.toLowerCase() === row.tema.toLowerCase())) {
          byArea[area].add(row.subtema)
          break
        }
      }
    }

    // Converter para arrays e retornar
    const result: Record<string, string[]> = {}
    for (const [area, subtemas] of Object.entries(byArea)) {
      result[area] = Array.from(subtemas).sort()
    }

    return NextResponse.json({ subtemas: result })
  } catch (err: any) {
    console.error('[plano-subtemas] Exceção:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
