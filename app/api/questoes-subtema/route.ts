import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Mapeamento completo: label do plano → variações aceitas no banco (coluna "tema")
const MATERIA_VARIATIONS: Record<string, string[]> = {
  "Clínica Médica":            ["Clínica Médica", "clinica medica", "Clinica Medica"],
  "Clínica Cirúrgica":         ["Cirurgia", "Clínica Cirúrgica", "clinica cirurgica", "Clínica Cirurgica"],
  "Cirurgia":                  ["Cirurgia", "Clínica Cirúrgica", "clinica cirurgica", "Clínica Cirurgica"],
  "Pediatria":                 ["Pediatria", "pediatria"],
  "Ginecologia e Obstetrícia": ["Ginecologia e Obstetrícia", "Ginecologia e obstetrícia", "ginecologia e obstetricia", "Ginecologia", "Obstetrícia"],
  "Medicina Preventiva":       ["Medicina Preventiva", "medicina preventiva", "Saúde Coletiva", "saude coletiva"],
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const area    = searchParams.get("area")
  const subtema = searchParams.get("subtema")
  const onlySubtemas = searchParams.get("only_subtemas") === "1"

  if (!area) return NextResponse.json({ error: "area obrigatório" }, { status: 400 })

  try {
    const supabase = await createClient()
    const variations = MATERIA_VARIATIONS[area] || [area]

    // Modo: listar apenas subtemas únicos (para o seletor)
    if (onlySubtemas) {
      const { data, error } = await supabase
        .from("questoes")
        .select("subtema")
        .in("tema", variations)
        .not("subtema", "is", null)
        .limit(5000)

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const unique = [...new Set(
        (data || []).map((r: any) => r.subtema?.trim()).filter(Boolean)
      )].sort((a, b) => a.localeCompare(b, "pt-BR"))

      return NextResponse.json({ subtemas: unique })
    }

    // Modo padrão: retornar questões
    let query = supabase
      .from("questoes")
      .select("*")
      .in("tema", variations)

    if (subtema) {
      query = query.eq("subtema", subtema.trim())
    }

    const { data, error } = await query.limit(5000)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const questoes = data || []

    // Fallback: se filtrou por subtema e não achou nada, retorna todos da área
    if (subtema && questoes.length === 0) {
      const { data: fallback } = await supabase
        .from("questoes")
        .select("*")
        .in("tema", variations)
        .limit(5000)
      return NextResponse.json({ questoes: fallback || [], fallback: true })
    }

    return NextResponse.json({ questoes, fallback: false })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
