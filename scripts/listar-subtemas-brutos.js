import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const temas = [
  "Clínica Médica",
  "Ginecologia e Obstetrícia",
  "Pediatria",
  "Medicina Preventiva",
  "Cirurgia",
];

for (const tema of temas) {
  const { data, error } = await supabase
    .from("questoes")
    .select("subtema")
    .eq("tema", tema);

  if (error) {
    console.error(`Erro em ${tema}:`, error.message);
    continue;
  }

  const contagem = {};
  for (const row of data) {
    const s = row.subtema || "(sem subtema)";
    contagem[s] = (contagem[s] || 0) + 1;
  }

  const ordenado = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  console.log(`\n=== ${tema} (${data.length} questoes) ===`);
  for (const [sub, qtd] of ordenado) {
    console.log(`  [${qtd}] ${sub}`);
  }
}
