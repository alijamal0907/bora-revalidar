import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEMAS = [
  "Medicina Preventiva",
  "Pediatria",
  "Cirurgia",
  "Clínica Médica",
  "Ginecologia e Obstetrícia",
];

const { data, error } = await supabase
  .from("questoes")
  .select("tema, subtema");

if (error) {
  console.error("Erro:", error.message);
  process.exit(1);
}

for (const tema of TEMAS) {
  const questoesTema = data.filter((q) => q.tema === tema);
  const subtemas = {};

  for (const q of questoesTema) {
    const sub = q.subtema?.trim() || "(sem subtema)";
    subtemas[sub] = (subtemas[sub] || 0) + 1;
  }

  const ordenado = Object.entries(subtemas).sort((a, b) => b[1] - a[1]);
  console.log(`\n==============================`);
  console.log(`${tema.toUpperCase()} — ${questoesTema.length} questoes`);
  console.log(`==============================`);
  for (const [sub, qtd] of ordenado) {
    console.log(`  ${sub}: ${qtd}`);
  }
}

console.log(`\nTOTAL GERAL: ${data.filter(q => TEMAS.includes(q.tema)).length} questoes`);
