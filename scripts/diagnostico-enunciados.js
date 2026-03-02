import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  // Buscar todos os temas e subtemas únicos
  const { data: temaSubtema, error: e1 } = await supabase
    .from("questoes")
    .select("tema, subtema")
    .not("tema", "is", null)

  if (e1) { console.error("Erro:", e1); process.exit(1) }

  // Agrupar
  const mapa = {}
  for (const q of temaSubtema) {
    const t = (q.tema || "").trim()
    const s = (q.subtema || "SEM SUBTEMA").trim()
    if (!mapa[t]) mapa[t] = {}
    mapa[t][s] = (mapa[t][s] || 0) + 1
  }

  // Imprimir estrutura completa
  console.log("\n=== ESTRUTURA ATUAL: TEMAS E SUBTEMAS ===\n")
  let totalGeral = 0
  for (const tema of Object.keys(mapa).sort()) {
    const subtemas = mapa[tema]
    const totalTema = Object.values(subtemas).reduce((a, b) => a + b, 0)
    totalGeral += totalTema
    console.log(`\n[ ${tema} ] — ${totalTema} questões`)
    for (const [sub, cnt] of Object.entries(subtemas).sort((a, b) => b[1] - a[1])) {
      console.log(`   • ${sub}: ${cnt}`)
    }
  }
  console.log(`\n=== TOTAL GERAL: ${totalGeral} questões ===`)

  // Agora pegar uma amostra de 5 enunciados de cada subtema para verificar coerência
  console.log("\n\n=== AMOSTRAS DE ENUNCIADOS POR SUBTEMA ===\n")
  for (const tema of Object.keys(mapa).sort()) {
    for (const subtema of Object.keys(mapa[tema]).sort()) {
      const { data: amostra } = await supabase
        .from("questoes")
        .select("id, enunciado")
        .eq("tema", tema)
        .ilike("subtema", subtema)
        .limit(3)

      console.log(`\n--- ${tema} > ${subtema} ---`)
      for (const q of (amostra || [])) {
        const enunciado = (q.enunciado || "").substring(0, 150).replace(/\n/g, " ")
        console.log(`  [${q.id}] ${enunciado}...`)
      }
    }
  }
}

main().catch(console.error)
