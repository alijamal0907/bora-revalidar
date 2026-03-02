import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const { data, error } = await supabase.from("questoes").select("tema, subtema").limit(5000)
if (error) { console.error(error); process.exit(1) }

const mapa = {}
for (const q of data) {
  const t = q.tema || "(sem tema)"
  const s = q.subtema || "(sem subtema)"
  if (!mapa[t]) mapa[t] = {}
  if (!mapa[t][s]) mapa[t][s] = 0
  mapa[t][s]++
}

let totalGeral = 0
for (const tema of Object.keys(mapa).sort()) {
  let totalTema = 0
  const subtemas = mapa[tema]
  for (const s of Object.keys(subtemas)) totalTema += subtemas[s]
  console.log(`\n${tema} (${totalTema} questões)`)
  for (const sub of Object.keys(subtemas).sort()) {
    console.log(`  - ${sub}: ${subtemas[sub]}`)
  }
  totalGeral += totalTema
}
console.log(`\nTOTAL GERAL: ${totalGeral} questões`)
