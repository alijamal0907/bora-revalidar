import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const correcoes = [
  { de: "Clínica médica",      para: "Clínica Médica" },
  { de: "Medicina preventiva", para: "Medicina Preventiva" },
  { de: "Clínica Cirúrgica",   para: "Cirurgia" },
];

let totalCorrigidos = 0;

for (const { de, para } of correcoes) {
  // Atualiza diretamente filtrando pelo valor exato do tema (sem usar id)
  const { error, count } = await supabase
    .from("questoes")
    .update({ tema: para })
    .eq("tema", de)
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error(`[v0] Erro ao atualizar "${de}":`, error.message);
    continue;
  }

  console.log(`[v0] "${de}" → "${para}": ${count ?? "?"} registro(s)`);
  totalCorrigidos += count ?? 0;
}

console.log(`\n=== TOTAL CORRIGIDO: ${totalCorrigidos} ===`);

// Contagem final
const { data: final } = await supabase.from("questoes").select("tema");
const contagem = {};
for (const r of final ?? []) {
  const t = r.tema || "(sem tema)";
  contagem[t] = (contagem[t] || 0) + 1;
}
console.log("\n=== CONTAGEM FINAL POR TEMA ===");
for (const [tema, qtd] of Object.entries(contagem).sort((a, b) => b[1] - a[1])) {
  console.log(`   ${tema}: ${qtd}`);
}
