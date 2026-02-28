import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from("questoes")
    .select("tema, subtema");

  if (error) {
    console.error("[v0] Erro:", error.message);
    process.exit(1);
  }

  // Listar todos os valores únicos de tema
  const temasUnicos = [...new Set(data.map((r) => r.tema || "(null)"))].sort();
  console.log("\n=== VALORES ÚNICOS DE TEMA ===");
  for (const t of temasUnicos) {
    const count = data.filter((r) => (r.tema || "(null)") === t).length;
    console.log(`  "${t}": ${count}`);
  }

  // Listar todos os valores únicos de subtema
  const subtemasUnicos = [...new Set(data.map((r) => r.subtema || "(null)"))].sort();
  console.log("\n=== VALORES ÚNICOS DE SUBTEMA (amostra) ===");
  console.log(`Total de subtemas distintos: ${subtemasUnicos.length}`);
  for (const s of subtemasUnicos.slice(0, 80)) {
    const count = data.filter((r) => (r.subtema || "(null)") === s).length;
    console.log(`  "${s}": ${count}`);
  }
}

main();
