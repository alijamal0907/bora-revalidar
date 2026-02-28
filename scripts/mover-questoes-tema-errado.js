import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// 1) Mover "Ginecologia / Obstetrícia" de Clínica Médica → Ginecologia e Obstetrícia
const { data: goData, error: goError } = await supabase
  .from("questoes")
  .update({ tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" })
  .eq("tema", "Clínica Médica")
  .eq("subtema", "Ginecologia / Obstetrícia")
  .select("id");

if (goError) console.error("ERRO GO:", goError.message);
else console.log(`[${goData?.length ?? 0}] Clínica Médica + "Ginecologia / Obstetrícia" → "Ginecologia e Obstetrícia"`);

// 2) Mover "Urgências Pediátricas" de Clínica Médica → Pediatria
const { data: pedData, error: pedError } = await supabase
  .from("questoes")
  .update({ tema: "Pediatria", subtema: "Urgências Pediátricas" })
  .eq("tema", "Clínica Médica")
  .eq("subtema", "Urgências Pediátricas")
  .select("id");

if (pedError) console.error("ERRO Pediatria:", pedError.message);
else console.log(`[${pedData?.length ?? 0}] Clínica Médica + "Urgências Pediátricas" → "Pediatria"`);

// Relatório final dos 5 temas
const temas = ["Clínica Médica", "Ginecologia e Obstetrícia", "Pediatria", "Medicina Preventiva", "Cirurgia"];
for (const tema of temas) {
  const { data } = await supabase.from("questoes").select("subtema").eq("tema", tema);
  const cont = {};
  for (const r of data) { const s = r.subtema?.trim() || "(sem subtema)"; cont[s] = (cont[s]||0)+1; }
  const total = data.length;
  console.log(`\n=== ${tema} — ${total} questoes ===`);
  for (const [s,q] of Object.entries(cont).sort((a,b)=>b[1]-a[1])) console.log(`  [${q}] ${s}`);
}
