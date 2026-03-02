import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase
  .from("questoes")
  .select("pk, id, tema, subtema, enunciado")
  .eq("tema", "Pediatria")
  .order("subtema")
  .limit(500)

if (error) { console.error(error); process.exit(1) }

console.log(`Total questões Pediatria: ${data.length}\n`)

let currentSubtema = ""
for (const q of data) {
  if (q.subtema !== currentSubtema) {
    currentSubtema = q.subtema
    console.log(`\n===== SUBTEMA: ${q.subtema} =====`)
  }
  const enunciado = (q.enunciado || "").replace(/\s+/g, " ").substring(0, 160)
  console.log(`  [${q.pk}] id=${q.id} | ${enunciado}`)
}
