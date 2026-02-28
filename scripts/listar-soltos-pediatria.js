import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const { data } = await supabase.from("questoes").select("id, subtema").eq("tema", "Pediatria");
const cont = {};
for (const r of data) {
  const s = r.subtema?.trim() || "(sem subtema)";
  if (!cont[s]) cont[s] = { qtd: 0, ids: [] };
  cont[s].qtd++;
  cont[s].ids.push(r.id);
}
const CATEGORIAS_PADRAO = ["Neonatologia","Crescimento e Desenvolvimento","Infectologia Pediátrica","Imunizações","Urgências Pediátricas","Gastroenterologia Pediátrica","Hematologia / Oncologia Pediátrica","Ortopedia / Cirurgia Pediátrica","Pneumologia Pediátrica","Neurologia Pediátrica","Endocrinologia / Adolescência","Psiquiatria / Comportamento"];
console.log("=== SUBTEMAS SOLTOS EM PEDIATRIA ===");
for (const [s, v] of Object.entries(cont).sort((a,b) => b[1].qtd - a[1].qtd)) {
  if (!CATEGORIAS_PADRAO.includes(s)) console.log(`  [${v.qtd}] "${s}"`);
}
