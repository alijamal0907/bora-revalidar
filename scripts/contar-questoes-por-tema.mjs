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

  // Buscar todos os registros com materia e tema
  const { data, error: err2 } = await supabase
    .from("questoes")
    .select("materia, tema");

  if (err2) {
    console.error("[v0] Erro ao buscar dados:", err2.message);
    process.exit(1);
  }

  // Agrupa por materia > tema
  const agrupado = {};
  for (const row of data) {
    const mat = row.materia || "(sem materia)";
    const tema = row.tema || "(sem tema)";
    if (!agrupado[mat]) agrupado[mat] = {};
    if (!agrupado[mat][tema]) agrupado[mat][tema] = 0;
    agrupado[mat][tema]++;
  }

  let totalCheck = 0;
  for (const [mat, temas] of Object.entries(agrupado).sort()) {
    const subtotal = Object.values(temas).reduce((a, b) => a + b, 0);
    totalCheck += subtotal;
    console.log(`\n📚 ${mat} — ${subtotal} questoes`);
    for (const [tema, qtd] of Object.entries(temas).sort((a, b) => b[1] - a[1])) {
      console.log(`   • ${tema}: ${qtd}`);
    }
  }
  console.log(`\n=== TOTAL VERIFICADO: ${totalCheck} ===`);
}

main();
