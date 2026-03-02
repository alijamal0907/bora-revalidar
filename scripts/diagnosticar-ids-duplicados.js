import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function diagnosticarIds() {
  // Buscar todas as questões com todos os campos relevantes
  const { data, error } = await supabase
    .from("questoes")
    .select("id, tema, subtema, enunciado")
    .limit(5000)

  if (error) {
    console.error("Erro:", error)
    return
  }

  console.log(`Total de registros: ${data.length}`)

  // Verificar IDs duplicados
  const idCount = {}
  for (const q of data) {
    const key = String(q.id)
    if (!idCount[key]) idCount[key] = []
    idCount[key].push(q)
  }

  const duplicados = Object.entries(idCount).filter(([id, qs]) => qs.length > 1)
  console.log(`\nIDs duplicados: ${duplicados.length}`)

  if (duplicados.length > 0) {
    console.log("\nPrimeiros 10 IDs com duplicatas:")
    duplicados.slice(0, 10).forEach(([id, qs]) => {
      console.log(`\nID: ${id} (${qs.length} ocorrências)`)
      qs.forEach((q, i) => {
        const enunciado = (q.enunciado || "").replace(/\n/g, " ").substring(0, 120)
        console.log(`  [${i+1}] ${q.tema} / ${q.subtema}: ${enunciado}...`)
      })
    })
  }

  // Verificar se existe campo único (row_id, uuid, etc.) — listar colunas da primeira linha
  if (data.length > 0) {
    console.log("\nColunas disponíveis na tabela:", Object.keys(data[0]))
  }

  // Verificar questões com id null
  const nullIds = data.filter(q => q.id === null || q.id === undefined || q.id === "null")
  console.log(`\nQuestões com ID nulo: ${nullIds.length}`)
  nullIds.slice(0, 5).forEach(q => {
    const enunciado = (q.enunciado || "").replace(/\n/g, " ").substring(0, 150)
    console.log(`  Tema: ${q.tema} | Subtema: ${q.subtema} | ${enunciado}...`)
  })
}

diagnosticarIds()
