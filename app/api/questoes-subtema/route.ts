import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const MATERIA_VARIATIONS: Record<string, string[]> = {
  "Clínica Médica":           ["Clínica Médica", "clinica medica", "Clinica Medica"],
  "Clínica Cirúrgica":        ["Clínica Cirúrgica", "clinica cirurgica", "Cirurgia", "Clínica Cirurgica"],
  "Pediatria":                ["Pediatria", "pediatria"],
  "Ginecologia e Obstetrícia":["Ginecologia e Obstetrícia", "Ginecologia e obstetrícia", "ginecologia e obstetricia", "Ginecologia", "Obstetrícia", "obstetricia"],
  "Medicina Preventiva":      ["Medicina Preventiva", "medicina preventiva", "Saúde Coletiva", "saude coletiva", "Medicina de Família"],
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const area    = searchParams.get("area")
  const subtema = searchParams.get("subtema")

  if (!area) return NextResponse.json({ error: "area obrigatório" }, { status: 400 })

  try {
    const supabase = await createClient()
    const variations = MATERIA_VARIATIONS[area] || [area]

    let query = supabase
      .from("questoes")
      .select("*")
      .in("tema", variations)

    if (subtema) {
      query = query.ilike("subtema", subtema.trim())
    }

    const { data, error } = await query.limit(5000)

    if (error) {
      console.error("[questoes-subtema] Erro:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const questoes = data || []

    // Se filtrou por subtema e não achou nada, retorna todos da área como fallback
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
    console.error("[questoes-subtema] Exceção:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
