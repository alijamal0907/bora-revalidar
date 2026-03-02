import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("=== DIAGNÓSTICO COMPLETO: TEMAS E SUBTEMAS DO BANCO ===\n");

// 1. Buscar todos os registros de tema + subtema
const { data, error } = await supabase
  .from("questoes")
  .select("id, tema, subtema")
  .limit(10000);

if (error) {
  console.error("Erro ao buscar questões:", error.message);
  process.exit(1);
}

console.log(`Total de questões no banco: ${data.length}\n`);

// 2. Agrupar por tema → subtema
const agrupado = {};
for (const q of data) {
  const tema = q.tema?.trim() || "(sem tema)";
  const subtema = q.subtema?.trim() || "(sem subtema)";
  if (!agrupado[tema]) agrupado[tema] = {};
  agrupado[tema][subtema] = (agrupado[tema][subtema] || 0) + 1;
}

// 3. Imprimir organizado
const temas = Object.keys(agrupado).sort();
for (const tema of temas) {
  const subtemas = agrupado[tema];
  const totalTema = Object.values(subtemas).reduce((a, b) => a + b, 0);
  console.log(`\n╔══ ${tema.toUpperCase()} [${totalTema} questões] ══`);
  const subtemasOrdenados = Object.entries(subtemas).sort((a, b) => b[1] - a[1]);
  for (const [subtema, count] of subtemasOrdenados) {
    console.log(`  [${count}] ${subtema}`);
  }
}

// 4. Resumo por tema
console.log("\n\n=== RESUMO POR TEMA ===");
for (const tema of temas) {
  const total = Object.values(agrupado[tema]).reduce((a, b) => a + b, 0);
  const numSubtemas = Object.keys(agrupado[tema]).length;
  console.log(`  ${tema}: ${total} questões | ${numSubtemas} subtemas`);
}
