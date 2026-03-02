import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const { data, error } = await supabase
  .from("questoes")
  .select("pk, id, tema, subtema, enunciado")
  .eq("tema", "Ginecologia e Obstetrícia")
  .order("subtema")
  .limit(2000)

if (error) { console.error(error); process.exit(1) }

let current = ""
for (const q of data) {
  if (q.subtema !== current) {
    current = q.subtema
    console.log(`\n========== SUBTEMA: ${q.subtema} ==========`)
  }
  console.log(`  pk=${q.pk} | id=${q.id} | ${String(q.enunciado || "").slice(0, 120)}`)
}
console.log(`\nTOTAL: ${data.length} questões`)
