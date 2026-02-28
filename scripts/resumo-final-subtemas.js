import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data, error } = await supabase.from("questoes").select("subtema, subtema_slug").limit(2000);
if (error) { console.error(error.message); process.exit(1); }

let comSlug = 0, semSlug = 0;
const slugsVazios = new Set();
for (const r of data) {
  if (r.subtema_slug) comSlug++;
  else { semSlug++; if (r.subtema) slugsVazios.add(r.subtema); }
}
console.log(`Com subtema_slug: ${comSlug}`);
console.log(`Sem subtema_slug: ${semSlug}`);
console.log(`\nSubtemas sem slug (${slugsVazios.size} unicos):`);
for (const s of [...slugsVazios].sort()) console.log(`  "${s}"`);

