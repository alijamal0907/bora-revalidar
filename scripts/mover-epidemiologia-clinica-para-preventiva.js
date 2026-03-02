import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Subtemas que são de Epidemiologia e estão incorretamente em Clínica Médica
// (baseado nos padrões mapeados no padronizar-subtemas-preventiva.js)
const SUBTEMAS_EPIDEMIOLOGIA = [
  "Epidemiologia",
  "Epidemiologia – mortalidade proporcional e causas externas",
  "Rastreamento em atenção primária",
  "Rastreamento",
  "Rastreamento e decisão compartilhada",
  "Rastreamento de câncer de mama",
  "Rastreamento / Câncer de Mama",
  "Rastreamento do câncer do colo uterino",
  "Rastreamento de câncer colorretal em adultos assintomáticos",
  "Rastreamento de câncer colorretal",
  "Rastreamento – câncer de próstata em idoso",
  "Mortalidade materna; classificação de causa indireta",
  "Saúde da criança / Mortalidade infantil",
  "Indicadores epidemiológicos",
  "Epidemiologia / Testes Diagnósticos",
];

console.log("=== Inspecionando questões de Epidemiologia em Clínica Médica ===\n");

// Primeiro, listar tudo que existe em Clínica Médica com subtema contendo "epidemiologia" ou "rastreamento"
const { data: todos, error: errTodos } = await supabase
  .from("questoes")
  .select("id, subtema")
  .eq("tema", "Clínica Médica")
  .or(
    "subtema.ilike.%epidemiologia%,subtema.ilike.%rastreamento%,subtema.ilike.%mortalidade%,subtema.ilike.%indicadores%"
  );

if (errTodos) {
  console.error("Erro ao inspecionar:", errTodos.message);
} else {
  console.log(`Questões encontradas com filtro amplo: ${todos?.length ?? 0}`);
  const cont = {};
  for (const r of todos ?? []) {
    const s = r.subtema?.trim() || "(sem subtema)";
    cont[s] = (cont[s] || 0) + 1;
  }
  for (const [s, q] of Object.entries(cont).sort((a, b) => b[1] - a[1])) {
    console.log(`  [${q}] "${s}"`);
  }
}

console.log("\n=== Movendo questões para Medicina Preventiva / Epidemiologia ===\n");

let totalMovido = 0;

for (const subtema of SUBTEMAS_EPIDEMIOLOGIA) {
  const { data, error } = await supabase
    .from("questoes")
    .update({ tema: "Medicina Preventiva", subtema: "Epidemiologia" })
    .eq("tema", "Clínica Médica")
    .eq("subtema", subtema)
    .select("id");

  if (error) {
    console.error(`ERRO ao mover "${subtema}": ${error.message}`);
    continue;
  }
  if (data?.length) {
    console.log(`[${data.length}] "${subtema}" → Medicina Preventiva / Epidemiologia`);
    totalMovido += data.length;
  }
}

console.log(`\nTotal movido: ${totalMovido} questões`);

// Relatório final
console.log("\n=== Relatório final ===");

const temas = ["Clínica Médica", "Medicina Preventiva"];
for (const tema of temas) {
  const { data: rel } = await supabase
    .from("questoes")
    .select("subtema")
    .eq("tema", tema);

  const cont = {};
  for (const r of rel ?? []) {
    const s = r.subtema?.trim() || "(sem subtema)";
    cont[s] = (cont[s] || 0) + 1;
  }
  console.log(`\n--- ${tema} — ${rel?.length ?? 0} questões ---`);
  for (const [s, q] of Object.entries(cont).sort((a, b) => b[1] - a[1])) {
    console.log(`  [${q}] ${s}`);
  }
}
