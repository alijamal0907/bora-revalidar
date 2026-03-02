import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("=== Inspecionando questões de Ginecologia/Obstetrícia em Clínica Médica ===\n");

// Primeiro, listar tudo que existe em Clínica Médica com subtema contendo ginecologia/obstetrícia
const { data: todos, error: errTodos } = await supabase
  .from("questoes")
  .select("id, subtema")
  .eq("tema", "Clínica Médica")
  .or(
    "subtema.ilike.%ginecologia%,subtema.ilike.%obstetrícia%,subtema.ilike.%obstetricia%,subtema.ilike.%intercorrências clínicas%,subtema.ilike.%intercorrencias%"
  );

if (errTodos) {
  console.error("Erro ao inspecionar:", errTodos.message);
  process.exit(1);
}

console.log(`Questões encontradas com filtro amplo: ${todos?.length ?? 0}`);
const contagem = {};
for (const r of todos ?? []) {
  const s = r.subtema?.trim() || "(sem subtema)";
  contagem[s] = (contagem[s] || 0) + 1;
}
for (const [s, q] of Object.entries(contagem).sort((a, b) => b[1] - a[1])) {
  console.log(`  [${q}] "${s}"`);
}

console.log("\n=== Movendo questões para Ginecologia e Obstetrícia ===\n");

// Mover todas as questões cujo subtema seja "Ginecologia/Obstetrícia (intercorrências clínicas)"
// ou variações encontradas no banco (usando ilike para tolerar diferenças de acento/capitalização)
const { data: movidas, error: errMover } = await supabase
  .from("questoes")
  .update({ tema: "Ginecologia e Obstetrícia" })
  .eq("tema", "Clínica Médica")
  .ilike("subtema", "%ginecologia%obstetrícia%intercorrências%")
  .select("id, subtema");

if (errMover) {
  console.error("Erro ao mover questões (padrão 1):", errMover.message);
} else {
  console.log(`[${movidas?.length ?? 0}] questões movidas via padrão "ginecologia%obstetrícia%intercorrências"`);
  for (const q of movidas ?? []) {
    console.log(`  id=${q.id} subtema="${q.subtema}"`);
  }
}

// Tentativa adicional sem acento para cobrir variações no banco
const { data: movidas2, error: errMover2 } = await supabase
  .from("questoes")
  .update({ tema: "Ginecologia e Obstetrícia" })
  .eq("tema", "Clínica Médica")
  .ilike("subtema", "%ginecologia%obstetricia%intercorrencias%")
  .select("id, subtema");

if (errMover2) {
  console.error("Erro ao mover questões (padrão 2):", errMover2.message);
} else if (movidas2?.length) {
  console.log(`[${movidas2.length}] questões movidas via padrão sem acento`);
  for (const q of movidas2) {
    console.log(`  id=${q.id} subtema="${q.subtema}"`);
  }
}

const totalMovido = (movidas?.length ?? 0) + (movidas2?.length ?? 0);
console.log(`\nTotal movido: ${totalMovido} questões`);

// Relatório final
console.log("\n=== Relatório final ===");

const temas = ["Clínica Médica", "Ginecologia e Obstetrícia"];
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
    if (s.toLowerCase().includes("ginecol") || s.toLowerCase().includes("obstetr") || s.toLowerCase().includes("intercorr")) {
      console.log(`  [${q}] ${s}  <-- movida`);
    } else {
      console.log(`  [${q}] ${s}`);
    }
  }
}
