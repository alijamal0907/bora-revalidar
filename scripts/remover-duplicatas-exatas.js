import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function main() {
  let all = []
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from("questoes").select("pk, enunciado, tema, subtema").range(from, from + 499)
    if (error || !data || data.length === 0) break
    all = all.concat(data)
    if (data.length < 500) break
    from += 500
  }
  console.log(`Total questões: ${all.length}`)

  const vistos = {}
  const pksParaRemover = []
  for (const q of all) {
    if (!q.pk || !q.enunciado) continue
    const chave = `${(q.enunciado || "").trim().substring(0, 200)}||${q.tema}||${q.subtema}`
    if (vistos[chave]) {
      pksParaRemover.push(q.pk)
      console.log(`  Duplicata: pk=${q.pk} [${q.tema} > ${q.subtema}] "${q.enunciado.substring(0, 60)}..."`)
    } else {
      vistos[chave] = true
    }
  }

  console.log(`\nDuplicatas encontradas: ${pksParaRemover.length}`)

  let ok = 0, err = 0
  for (const pk of pksParaRemover) {
    const { error } = await supabase.from("questoes").delete().eq("pk", pk)
    if (error) { console.error(`ERRO ao remover ${pk}:`, error.message); err++ }
    else { console.log(`  Removida: ${pk}`); ok++ }
  }

  console.log(`\nRemovidas: ${ok} | Erros: ${err}`)
}

main().catch(console.error)
