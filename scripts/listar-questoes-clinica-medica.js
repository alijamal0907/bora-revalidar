import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase
  .from("questoes")
  .select("pk, id, tema, subtema, enunciado")
  .eq("tema", "Clínica Médica")
  .order("subtema")
  .limit(1000)

if (error) { console.error(error); process.exit(1) }

// Agrupar por subtema e imprimir enunciado resumido
const grupos = {}
for (const q of data) {
  const sub = q.subtema || "(sem subtema)"
  if (!grupos[sub]) grupos[sub] = []
  grupos[sub].push({ pk: q.pk, id: q.id, enunciado: q.enunciado?.slice(0, 120) })
}

for (const [sub, qs] of Object.entries(grupos)) {
  console.log(`\n===== SUBTEMA: "${sub}" (${qs.length} questões) =====`)
  for (const q of qs) {
    console.log(`  [pk=${q.pk}] id=${q.id}: ${q.enunciado}`)
  }
}

console.log(`\nTOTAL: ${data.length} questões em Clínica Médica`)
