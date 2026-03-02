import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  // 1. Buscar um único registro para ver todas as colunas
  const { data: sample, error: e0 } = await supabase
    .from("questoes")
    .select("*")
    .limit(1)

  if (e0) { console.error("Erro:", e0.message); process.exit(1) }

  console.log("=== COLUNAS DA TABELA questoes ===")
  console.log(Object.keys(sample[0] || {}).join(", "))
  console.log("\n=== EXEMPLO DE REGISTRO COMPLETO ===")
  const ex = sample[0]
  for (const [k, v] of Object.entries(ex)) {
    const val = typeof v === "string" ? v.substring(0, 80) : v
    console.log(`  ${k}: ${val}`)
  }

  // 2. Verificar total
  const { count } = await supabase
    .from("questoes")
    .select("*", { count: "exact", head: true })
  console.log(`\nTotal de questões: ${count}`)

  // 3. Buscar TODAS as questões para analisar duplicatas
  let all = []
  let from = 0
  const pageSize = 1000
  while (true) {
    const { data, error } = await supabase
      .from("questoes")
      .select("id, tema, subtema, enunciado")
      .range(from, from + pageSize - 1)
    if (error || !data || data.length === 0) break
    all = all.concat(data)
    if (data.length < pageSize) break
    from += pageSize
  }

  console.log(`\nRegistros lidos: ${all.length}`)

  // 4. Identificar duplicatas de enunciado (mesmo texto em subtemas diferentes)
  const enunciadoMap = {}
  for (const q of all) {
    const key = (q.enunciado || "").trim().substring(0, 120)
    if (!enunciadoMap[key]) enunciadoMap[key] = []
    enunciadoMap[key].push({ id: q.id, tema: q.tema, subtema: q.subtema })
  }

  const enunciadoDups = Object.entries(enunciadoMap)
    .filter(([, registros]) => registros.length > 1)

  console.log(`\n=== ENUNCIADOS DUPLICADOS (mesmo texto em locais diferentes): ${enunciadoDups.length} ===`)
  for (const [enunc, registros] of enunciadoDups.slice(0, 15)) {
    console.log(`\n  Enunciado: "${enunc.substring(0, 80)}..."`)
    for (const r of registros) {
      console.log(`    ID=${r.id} → ${r.tema} > ${r.subtema}`)
    }
  }

  // 5. Verificar questões claramente fora do subtema (por palavras-chave)
  console.log("\n=== QUESTÕES SUSPEITAS: PEDIÁTRICO em subtema adulto ===")
  const pediatrico = all.filter(q =>
    (q.tema !== "Pediatria") &&
    /(recém-nascido|lactente|neonato|puericultura|criança de \d+ (ano|mes)|neonatal)/i.test(q.enunciado || "")
  ).slice(0, 10)
  for (const q of pediatrico) {
    console.log(`  ID=${q.id} [${q.tema} > ${q.subtema}]`)
    console.log(`  ${(q.enunciado || "").substring(0, 100)}...`)
  }

  // 6. Verificar questões com "gestante/gravidez" fora de Ginecologia
  console.log("\n=== QUESTÕES SUSPEITAS: OBSTETRÍCIA fora de Ginecologia ===")
  const obst = all.filter(q =>
    (q.tema !== "Ginecologia e Obstetrícia") &&
    /(gestante|gestação|obstétric|pré-natal|grávida|parturiente)/i.test(q.enunciado || "")
  ).slice(0, 10)
  for (const q of obst) {
    console.log(`  ID=${q.id} [${q.tema} > ${q.subtema}]`)
    console.log(`  ${(q.enunciado || "").substring(0, 100)}...`)
  }
}

main().catch(console.error)
