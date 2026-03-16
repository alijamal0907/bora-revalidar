import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  // Testar tabela questoes
  const { data: q1, error: e1, count: c1 } = await supabase
    .from("questoes")
    .select("id, tema, subtema", { count: "exact" })
    .limit(3)

  console.log("=== TABELA questoes ===")
  console.log("Erro:", e1?.message || "nenhum")
  console.log("Count:", c1)
  console.log("Sample:", JSON.stringify(q1, null, 2))

  // Testar tabela questions
  const { data: q2, error: e2, count: c2 } = await supabase
    .from("questions")
    .select("id, tema, subtema", { count: "exact" })
    .limit(3)

  console.log("\n=== TABELA questions ===")
  console.log("Erro:", e2?.message || "nenhum")
  console.log("Count:", c2)
  console.log("Sample:", JSON.stringify(q2, null, 2))

  // Testar tema exato "Cirurgia" na questoes
  const { data: cir, error: eCir } = await supabase
    .from("questoes")
    .select("id, tema, subtema")
    .eq("tema", "Cirurgia")
    .limit(5)

  console.log("\n=== questoes com tema=Cirurgia ===")
  console.log("Erro:", eCir?.message || "nenhum")
  console.log("Resultados:", JSON.stringify(cir, null, 2))

  // Listar TODOS temas distintos
  const { data: temas } = await supabase
    .from("questoes")
    .select("tema")
    .limit(2000)

  if (temas) {
    const distinct = [...new Set(temas.map((t) => t.tema))].sort()
    console.log("\n=== Temas distintos na tabela questoes ===")
    console.log(JSON.stringify(distinct, null, 2))
  }

  // Listar TODOS subtemas distintos por tema
  const { data: subs } = await supabase
    .from("questoes")
    .select("tema, subtema")
    .not("subtema", "is", null)
    .limit(5000)

  if (subs) {
    const byTema = {}
    subs.forEach((r) => {
      if (!byTema[r.tema]) byTema[r.tema] = new Set()
      byTema[r.tema].add(r.subtema)
    })
    console.log("\n=== Subtemas por tema ===")
    Object.entries(byTema).forEach(([t, s]) => {
      console.log(`\n${t}:`, [...s].sort())
    })
  }
}

main().catch(console.error)
