import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

let totalCorrigido = 0;

async function mover({ de_tema, de_subtema, para_tema, para_subtema }) {
  const query = supabase
    .from("questoes")
    .update({ tema: para_tema, subtema: para_subtema });

  // Filtro exato por tema origem
  const q = de_tema
    ? query.eq("tema", de_tema).eq("subtema", de_subtema)
    : query.eq("subtema", de_subtema);

  const { data, error } = await q.select("id");

  if (error) {
    console.error(`  ERRO "${de_subtema}": ${error.message}`);
    return 0;
  }
  if (data?.length) {
    console.log(
      `  [${data.length}] "${de_subtema}" (${de_tema}) → "${para_subtema}" (${para_tema})`
    );
    totalCorrigido += data.length;
  }
  return data?.length ?? 0;
}

async function renomear({ tema, de_subtema, para_subtema }) {
  const { data, error } = await supabase
    .from("questoes")
    .update({ subtema: para_subtema })
    .eq("tema", tema)
    .eq("subtema", de_subtema)
    .select("id");

  if (error) {
    console.error(`  ERRO renomear "${de_subtema}": ${error.message}`);
    return 0;
  }
  if (data?.length) {
    console.log(
      `  [${data.length}] RENOMEAR "${de_subtema}" → "${para_subtema}" (${tema})`
    );
    totalCorrigido += data.length;
  }
  return data?.length ?? 0;
}

// ─────────────────────────────────────────────────────────────
console.log("\n=== 1. CLÍNICA MÉDICA — Correções ===");
// ─────────────────────────────────────────────────────────────

// Sepse pertence a Infectologia dentro de Clínica Médica
await renomear({
  tema: "Clínica Médica",
  de_subtema: "Sepse segundo definições atuais",
  para_subtema: "Infectologia",
});

// Oftalmologia em Clínica Médica não tem sentido — mover para Urgências Clínicas / Outros em Cirurgia
await mover({
  de_tema: "Clínica Médica",
  de_subtema: "oftalmologia – ceratite actínica / corpo estranho",
  para_tema: "Clínica Médica",
  para_subtema: "Urgências Clínicas / Outros",
});

// Urgências Clínicas / Outros em Clínica Médica — manter no tema mas padronizar nome
// (já existe em Cirurgia com mesmo nome — em Clínica Médica faz sentido manter)
// Nada a fazer aqui.

// ─────────────────────────────────────────────────────────────
console.log("\n=== 2. CIRURGIA — Correções ===");
// ─────────────────────────────────────────────────────────────

// Unificar "Trauma (ATLS)" com "Trauma / ATLS"
await renomear({
  tema: "Cirurgia",
  de_subtema: "Trauma (ATLS)",
  para_subtema: "Trauma / ATLS",
});

// Unificar subtemas de Feridas
await renomear({
  tema: "Cirurgia",
  de_subtema: "Feridas / técnica de sutura",
  para_subtema: "Feridas / Técnica Cirúrgica",
});
await renomear({
  tema: "Cirurgia",
  de_subtema: "Feridas / classificação",
  para_subtema: "Feridas / Técnica Cirúrgica",
});

// "Abdome Agudo / Cirurgia Digestiva" está correto, manter.

// ─────────────────────────────────────────────────────────────
console.log("\n=== 3. GINECOLOGIA E OBSTETRÍCIA — Correções ===");
// ─────────────────────────────────────────────────────────────

// "Clínica Geral / Intercorrências" não é subtema de Ginecologia — mover para "Ginecologia / Obstetrícia (intercorrências clínicas)"
await renomear({
  tema: "Ginecologia e Obstetrícia",
  de_subtema: "Clínica Geral / Intercorrências",
  para_subtema: "Ginecologia / Obstetrícia (intercorrências clínicas)",
});

// "Urgências Clínicas / Outros" em Ginecologia — mover para "Ginecologia / Obstetrícia (intercorrências clínicas)"
await renomear({
  tema: "Ginecologia e Obstetrícia",
  de_subtema: "Urgências Clínicas / Outros",
  para_subtema: "Ginecologia / Obstetrícia (intercorrências clínicas)",
});

// ─────────────────────────────────────────────────────────────
console.log("\n=== 4. MEDICINA PREVENTIVA — Consolidação de subtemas dispersos ===");
// ─────────────────────────────────────────────────────────────

// Subtemas unitários de Epidemiologia → "Epidemiologia"
const subtemasEpidemiologia = [
  "Doenças endêmicas / esquistossomose / controle",
  "Indicadores epidemiológicos",
  "Níveis de atenção e prevenção",
  "Níveis de atenção",
  "Educação em saúde; hesitação vacinal; abordagem centrada na pessoa",
];
for (const s of subtemasEpidemiologia) {
  await renomear({ tema: "Medicina Preventiva", de_subtema: s, para_subtema: "Epidemiologia" });
}

// Subtemas unitários de Ética / Bioética → "Ética Médica e Bioética"
const subtemasEtica = [
  "Ética / prontuário médico / responsabilidade",
  "Ética médica / sigilo em aplicativos",
  "Bioética / Saúde da Pessoa Idosa",
];
for (const s of subtemasEtica) {
  await renomear({ tema: "Medicina Preventiva", de_subtema: s, para_subtema: "Ética Médica e Bioética" });
}

// Subtemas unitários de Atenção Primária → "Atenção Primária à Saúde (APS)"
const subtemasAPS = [
  "Atenção Primária / Territorialização",
  "Estratégia efetiva para cessação do tabagismo na UBS",
  "Atenção primária / competência cultural",
  "Controle social em saúde; participação comunitária na ESF",
  "Conselhos de saúde / controle social",
];
for (const s of subtemasAPS) {
  await renomear({ tema: "Medicina Preventiva", de_subtema: s, para_subtema: "Atenção Primária à Saúde (APS)" });
}

// Subtemas unitários de Políticas Públicas → "Políticas Públicas de Saúde"
const subtemasPolíticas = [
  "Políticas de saúde / PICS",
];
for (const s of subtemasPolíticas) {
  await renomear({ tema: "Medicina Preventiva", de_subtema: s, para_subtema: "Políticas Públicas de Saúde" });
}

// Questão sem subtema em Medicina Preventiva → Políticas Públicas de Saúde (mais abrangente)
const { data: semSubtema, error: errST } = await supabase
  .from("questoes")
  .update({ subtema: "Políticas Públicas de Saúde" })
  .eq("tema", "Medicina Preventiva")
  .is("subtema", null)
  .select("id");
if (!errST && semSubtema?.length) {
  console.log(`  [${semSubtema.length}] (sem subtema) → "Políticas Públicas de Saúde" (Medicina Preventiva)`);
  totalCorrigido += semSubtema.length;
}

// ─────────────────────────────────────────────────────────────
console.log("\n=== 5. PEDIATRIA — Correções ===");
// ─────────────────────────────────────────────────────────────

// "Cardiopatias congênitas cianóticas / TGA" — pertence a Urgências Pediátricas ou Neonatologia
await renomear({
  tema: "Pediatria",
  de_subtema: "Cardiopatias congênitas cianóticas / TGA",
  para_subtema: "Urgências Pediátricas",
});

// "Cirurgia pediátrica / hérnia inguinal" — pertence a Ortopedia / Cirurgia Pediátrica
await renomear({
  tema: "Pediatria",
  de_subtema: "Cirurgia pediátrica / hérnia inguinal",
  para_subtema: "Ortopedia / Cirurgia Pediátrica",
});

// ─────────────────────────────────────────────────────────────
console.log("\n=== 6. QUESTÕES SEM TEMA — Corrigir ===");
// ─────────────────────────────────────────────────────────────

const { data: semTema } = await supabase
  .from("questoes")
  .select("id, tema, subtema")
  .is("tema", null);

if (semTema?.length) {
  console.log(`  ${semTema.length} questões sem tema encontradas:`);
  for (const q of semTema) {
    console.log(`    id=${q.id} | subtema="${q.subtema}"`);
  }
} else {
  // Tentar buscar tema vazio também
  const { data: temaVazio } = await supabase
    .from("questoes")
    .select("id, tema, subtema")
    .eq("tema", "");
  if (temaVazio?.length) {
    console.log(`  ${temaVazio.length} questões com tema vazio encontradas:`);
  }
}

// ─────────────────────────────────────────────────────────────
console.log(`\n\n=== TOTAL CORRIGIDO: ${totalCorrigido} questões ===`);
// ─────────────────────────────────────────────────────────────

// Relatório final
console.log("\n=== RELATÓRIO FINAL POR TEMA/SUBTEMA ===\n");
const { data: final } = await supabase
  .from("questoes")
  .select("tema, subtema")
  .limit(10000);

const agrupado = {};
for (const q of final ?? []) {
  const tema = q.tema?.trim() || "(sem tema)";
  const subtema = q.subtema?.trim() || "(sem subtema)";
  if (!agrupado[tema]) agrupado[tema] = {};
  agrupado[tema][subtema] = (agrupado[tema][subtema] || 0) + 1;
}

for (const tema of Object.keys(agrupado).sort()) {
  const subtemas = agrupado[tema];
  const total = Object.values(subtemas).reduce((a, b) => a + b, 0);
  console.log(`\n--- ${tema} [${total}] ---`);
  for (const [s, c] of Object.entries(subtemas).sort((a, b) => b[1] - a[1])) {
    console.log(`  [${c}] ${s}`);
  }
}
