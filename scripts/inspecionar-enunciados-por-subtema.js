import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function inspecionarAmostra() {
  // Buscar todos os temas/subtemas distintos com contagem
  const { data: distribuicao, error: errDist } = await supabase
    .from("questoes")
    .select("tema, subtema, id, enunciado")
    .limit(5000)

  if (errDist) {
    console.error("Erro ao buscar questoes:", errDist)
    return
  }

  // Agrupar por tema/subtema
  const grupos = {}
  for (const q of distribuicao) {
    const key = `${q.tema} ||| ${q.subtema}`
    if (!grupos[key]) grupos[key] = []
    grupos[key].push(q)
  }

  // Para cada grupo, imprimir as colunas e 3 amostras de enunciado
  const temaOrdem = {}
  for (const [key, questoes] of Object.entries(grupos)) {
    const [tema, subtema] = key.split(" ||| ")
    if (!temaOrdem[tema]) temaOrdem[tema] = []
    temaOrdem[tema].push({ subtema, questoes })
  }

  for (const [tema, subtemas] of Object.entries(temaOrdem)) {
    console.log(`\n========== TEMA: ${tema} ==========`)
    for (const { subtema, questoes } of subtemas) {
      console.log(`\n  --- Subtema: ${subtema} (${questoes.length} questões) ---`)
      // Imprimir primeiras 2 amostras de enunciado (truncadas em 200 chars)
      questoes.slice(0, 2).forEach((q, i) => {
        const enunciado = (q.enunciado || "").replace(/\n/g, " ").substring(0, 200)
        console.log(`    [${i + 1}] ID:${q.id} | ${enunciado}...`)
      })
    }
  }

  console.log("\n\n=== RESUMO TOTAL ===")
  console.log(`Total de questões: ${distribuicao.length}`)
  console.log(`Total de combinações tema/subtema: ${Object.keys(grupos).length}`)
}

inspecionarAmostra()
