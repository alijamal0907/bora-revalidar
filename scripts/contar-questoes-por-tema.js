import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // Total geral
  const { count: total, error: err1 } = await supabase
    .from("questoes")
    .select("*", { count: "exact", head: true });

  if (err1) {
    console.error("[v0] Erro ao contar total:", err1.message);
    process.exit(1);
  }
  console.log(`\n=== TOTAL GERAL DE QUESTOES: ${total} ===\n`);

  // Buscar todos os registros com apenas tema
  const { data, error: err2 } = await supabase
    .from("questoes")
    .select("tema");

  if (err2) {
    console.error("[v0] Erro ao buscar dados:", err2.message);
    process.exit(1);
  }

  // Agrupa por tema
  const agrupado = {};
  for (const row of data) {
    const tema = row.tema || "(sem tema)";
    if (!agrupado[tema]) agrupado[tema] = 0;
    agrupado[tema]++;
  }

  const ordenado = Object.entries(agrupado).sort((a, b) => b[1] - a[1]);
  let totalCheck = 0;
  for (const [tema, qtd] of ordenado) {
    totalCheck += qtd;
    console.log(`   ${tema}: ${qtd}`);
  }
  console.log(`\n=== TOTAL VERIFICADO: ${totalCheck} ===`);
}

main();
