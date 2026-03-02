import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function main() {
  // Checar se o id é realmente único ou se há duplicatas
  console.log("=== VERIFICANDO DUPLICATAS DE ID ===\n")

  // Buscar todos os registros e ver estrutura completa de um exemplo
  const { data: sample, error: e0 } = await supabase
    .from("questoes")
    .select("*")
    .limit(3)

  if (e0) { console.error("Erro:", e0); process.exit(1) }
  console.log("Colunas disponíveis:", Object.keys(sample[0] || {}))
  console.log("\nExemplo de registro completo:")
  console.log(JSON.stringify(sample[0], null, 2))

  // Verificar se há IDs numéricos duplicados
  const { data: allIds, error: e1 } = await supabase
    .from("questoes")
    .select("id, tema, subtema, enunciado")
    .not("id", "is", null)
    .limit(2000)

  if (e1) { console.error("Erro ids:", e1); process.exit(1) }

  // Identificar IDs que aparecem em múltiplos registros
  const idMap = {}
  for (const q of allIds) {
    const key = String(q.id)
    if (!idMap[key]) idMap[key] = []
    idMap[key].push({ tema: q.tema, subtema: q.subtema, enunciado: (q.enunciado || "").substring(0, 80) })
  }

  const duplicados = Object.entries(idMap).filter(([, registros]) => registros.length > 1)
  console.log(`\nTotal de IDs únicos: ${Object.keys(idMap).length}`)
  console.log(`IDs com duplicatas: ${duplicados.length}`)

  if (duplicados.length > 0) {
    console.log("\nExemplos de IDs duplicados:")
    for (const [id, registros] of duplicados.slice(0, 10)) {
      console.log(`\n  ID="${id}" aparece ${registros.length} vezes:`)
      for (const r of registros) {
        console.log(`    [${r.tema} > ${r.subtema}] ${r.enunciado}...`)
      }
    }
  }

  // Verificar se tem coluna uuid
  console.log("\n=== VERIFICANDO CAMPO UUID ===")
  const { data: uuidSample, error: e2 } = await supabase
    .from("questoes")
    .select("*")
    .limit(5)

  if (!e2 && uuidSample) {
    const colunas = Object.keys(uuidSample[0] || {})
    const possivelUuid = colunas.filter(c => c.toLowerCase().includes("uuid") || c === "uuid" || c === "id_uuid")
    console.log("Possíveis colunas UUID:", possivelUuid)
    console.log("Todas as colunas:", colunas)
  }
}

main().catch(console.error)
