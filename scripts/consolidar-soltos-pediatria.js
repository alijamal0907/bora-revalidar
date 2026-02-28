import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function toSlug(text) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s-]/g,"").trim().replace(/\s+/g,"-").replace(/-+/g,"-");
}

// Buscar subtemas únicos sem slug
const { data, error } = await supabase.from("questoes").select("subtema").is("subtema_slug", null).not("subtema", "is", null);
if (error) { console.error(error.message); process.exit(1); }

const subtemas = [...new Set(data.map(r => r.subtema.trim()))];
console.log(`Subtemas unicos sem slug: ${subtemas.length}`);

let totalAtualizado = 0;
for (const subtema of subtemas) {
  const slug = toSlug(subtema);
  // Atualizar pelo valor do subtema (não pelo id)
  const { data: updated, error: err } = await supabase
    .from("questoes")
    .update({ subtema_slug: slug })
    .eq("subtema", subtema)
    .is("subtema_slug", null)
    .select("id");
  if (err) { console.error(`ERRO "${subtema}": ${err.message}`); continue; }
  const count = updated?.length || 0;
  console.log(`[${count}] "${subtema}" -> "${slug}"`);
  totalAtualizado += count;
}

console.log(`\nTotal atualizado: ${totalAtualizado}`);
const { data: check } = await supabase.from("questoes").select("subtema_slug").is("subtema_slug", null).not("subtema", "is", null);
console.log(`Ainda sem slug (com subtema preenchido): ${check?.length || 0}`);


