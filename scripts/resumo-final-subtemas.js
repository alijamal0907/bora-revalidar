import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEMAS = ["Clínica Médica","Ginecologia e Obstetrícia","Pediatria","Medicina Preventiva","Cirurgia"];

const { data, error } = await supabase.from("questoes").select("tema, subtema");
if (error) { console.error("ERRO:", error.message); process.exit(1); }

let totalGeral = 0;
for (const tema of TEMAS) {
  const questoes = data.filter(r => r.tema === tema);
  totalGeral += questoes.length;
  const cont = {};
  for (const r of questoes) {
    const s = r.subtema?.trim() || "(sem subtema)";
    cont[s] = (cont[s] || 0) + 1;
  }
  console.log(`\n${"=".repeat(55)}`);
  console.log(`TEMA: ${tema} — ${questoes.length} questoes`);
  console.log(`${"=".repeat(55)}`);
  for (const [s, q] of Object.entries(cont).sort((a, b) => b[1] - a[1])) {
    console.log(`  [${String(q).padStart(3)}]  ${s}`);
  }
}

console.log(`\n${"=".repeat(55)}`);
console.log(`TOTAL GERAL: ${totalGeral} questoes`);
const semTema = data.filter(r => !TEMAS.includes(r.tema));
if (semTema.length) {
  console.log(`Fora dos 5 temas: ${semTema.length}`);
  const ct = {};
  for (const r of semTema) { const t = r.tema || "(null)"; ct[t] = (ct[t]||0)+1; }
  for (const [t,q] of Object.entries(ct)) console.log(`  [${q}] ${t}`);
}
