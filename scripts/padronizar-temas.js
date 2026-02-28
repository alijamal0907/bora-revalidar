import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapeamento: valor bruto -> tema padronizado
const MAPA_TEMAS = {
  // Clínica Médica
  "Clínica Médica": "Clínica Médica",
  "Clínica médica": "Clínica Médica",
  "clinica medica": "Clínica Médica",
  "Clínica Médica / Endocrinologia": "Clínica Médica",
  "Clínica Médica / Nefrologia": "Clínica Médica",
  "Clínica Médica / Oftalmologia": "Clínica Médica",
  "Clínica Médica / Oncologia": "Clínica Médica",
  "Clínica Médica / Urologia": "Clínica Médica",
  "Clínica médica / Cardiologia": "Clínica Médica",
  "Clínica médica / Gastroenterologia": "Clínica Médica",
  "Clínica médica / Pneumologia": "Clínica Médica",
  "Clínica médica / Pós-operatório": "Clínica Médica",
  "Endocrinologia": "Clínica Médica",
  "Gastroenterologia": "Clínica Médica",
  "Infectologia": "Clínica Médica",
  "Infectologia / APS": "Clínica Médica",
  "Infectologia / Gastroenterologia": "Clínica Médica",
  "Infectologia / Saúde pública": "Clínica Médica",
  "Neurologia": "Clínica Médica",
  "Neurologia / Geriatria": "Clínica Médica",
  "Neurologia / Ortopedia": "Clínica Médica",
  "Neurologia / Trauma": "Clínica Médica",
  "Pneumologia": "Clínica Médica",
  "Pneumologia / Medicina do trabalho": "Clínica Médica",
  "Psiquiatria": "Clínica Médica",
  "Psiquiatria / APS": "Clínica Médica",
  "Psiquiatria / Clínica médica": "Clínica Médica",
  "Reumatologia / APS": "Clínica Médica",
  "Reumatologia / Medicina de família": "Clínica Médica",
  "Urologia": "Clínica Médica",
  "Urologia / Oncologia": "Clínica Médica",
  "Dermatologia / Infectologia": "Clínica Médica",
  "Emergência / Cardiologia": "Clínica Médica",
  "Emergência / Clínica médica": "Clínica Médica",
  "Emergência / Pneumologia": "Clínica Médica",
  "Oftalmologia": "Clínica Médica",
  "Saúde mental": "Clínica Médica",

  // Cirurgia
  "Cirurgia": "Cirurgia",
  "Cirurgia ": "Cirurgia",
  "cirurgia": "Cirurgia",
  "cirurgia ": "Cirurgia",
  "Cirurgia / Proctologia": "Cirurgia",
  "Cirurgia / Trauma": "Cirurgia",
  "Cirurgia / Vascular": "Cirurgia",
  "Cirurgia Geral": "Cirurgia",
  "Clínica Cirúrgica": "Cirurgia",
  "Clínica Cirúrgica / Vascular": "Cirurgia",
  "Ortopedia": "Cirurgia",
  "Ortopedia / Infectologia": "Cirurgia",
  "Ortopedia / Trauma": "Cirurgia",
  "Trauma / Ortopedia": "Cirurgia",
  "Trauma / Urologia": "Cirurgia",

  // Ginecologia e Obstetrícia
  "Ginecologia e Obstetrícia": "Ginecologia e Obstetrícia",
  "Ginecologia e Obstetricia": "Ginecologia e Obstetrícia",
  "Ginecologia e obstetrícia": "Ginecologia e Obstetrícia",
  "ginecologia e obstetricia": "Ginecologia e Obstetrícia",
  "ginecologia e obstetrícia": "Ginecologia e Obstetrícia",
  "Ginecologia": "Ginecologia e Obstetrícia",
  "Ginecologia / Mastologia": "Ginecologia e Obstetrícia",
  "Ginecologia / Obstetrícia": "Ginecologia e Obstetrícia",
  "Ginecologia / Oncologia": "Ginecologia e Obstetrícia",
  "Ginecologia/Medicina Preventiva": "Ginecologia e Obstetrícia",
  "Obstetrícia": "Ginecologia e Obstetrícia",
  "Obstetrícia / Endocrinologia": "Ginecologia e Obstetrícia",
  "Obstetrícia / Hipertensão gestacional": "Ginecologia e Obstetrícia",
  "Obstetrícia / Hipertensão na gestação": "Ginecologia e Obstetrícia",
  "Obstetrícia / Pré-natal": "Ginecologia e Obstetrícia",
  "Dermatologia / Pediatria": "Ginecologia e Obstetrícia",

  // Medicina Preventiva
  "Medicina Preventiva": "Medicina Preventiva",
  "Medicina preventiva": "Medicina Preventiva",
  "medicina preventiva": "Medicina Preventiva",
  "medicna preventiva": "Medicina Preventiva",
  "Medicina Preventiva e Social": "Medicina Preventiva",
  "Medicina de Família e Comunidade": "Medicina Preventiva",
  "Medicina de família / Geriatria": "Medicina Preventiva",
  "Imunizações": "Medicina Preventiva",
  "SUS / Saúde coletiva": "Medicina Preventiva",
  "Saúde Coletiva / APS": "Medicina Preventiva",
  "Saúde Coletiva / SUS": "Medicina Preventiva",
  "Saúde coletiva / Clínica médica": "Medicina Preventiva",
  "Saúde coletiva / Gestão": "Medicina Preventiva",
  "Saúde coletiva / Tabagismo": "Medicina Preventiva",

  // Pediatria
  "Pediatria": "Pediatria",
  "pediatria": "Pediatria",
  "pediatria ": "Pediatria",
  "Pediatria / Cirurgia pediátrica": "Pediatria",
  "Pediatria / Genética": "Pediatria",
  "Pediatria / Hematologia": "Pediatria",
  "Pediatria / Infectologia": "Pediatria",
  "Pediatria / Neonatologia": "Pediatria",
  "Pediatria / Nutrologia": "Pediatria",
  "Neonatologia": "Pediatria",
  "Neonatologia / Infectologia": "Pediatria",
  "Infectologia / Adolescência": "Pediatria",
};

async function main() {
  // 1. Buscar todos os registros
  const { data, error } = await supabase
    .from("questoes")
    .select("id, tema, subtema");

  if (error) {
    console.error("[v0] Erro ao buscar:", error.message);
    process.exit(1);
  }

  console.log(`\nTotal de registros encontrados: ${data.length}`);

  // 2. Identificar registros que precisam de atualização
  const atualizacoes = data.filter(
    (r) => r.tema && MAPA_TEMAS[r.tema] && MAPA_TEMAS[r.tema] !== r.tema
  );
  const semMapeamento = data.filter(
    (r) => r.tema && !MAPA_TEMAS[r.tema]
  );

  console.log(`Registros que serão atualizados: ${atualizacoes.length}`);
  console.log(`Registros sem mapeamento (serão ignorados): ${semMapeamento.length}`);
  if (semMapeamento.length > 0) {
    const uniqSem = [...new Set(semMapeamento.map((r) => r.tema))];
    console.log("Temas sem mapeamento:", uniqSem);
  }

  // 3. Executar updates agrupados por novo tema
  const grupos = {};
  for (const r of atualizacoes) {
    const novoTema = MAPA_TEMAS[r.tema];
    if (!grupos[novoTema]) grupos[novoTema] = [];
    grupos[novoTema].push(r.id);
  }

  for (const [novoTema, ids] of Object.entries(grupos)) {
    console.log(`\nAtualizando ${ids.length} registros -> "${novoTema}"...`);
    const { error: upErr } = await supabase
      .from("questoes")
      .update({ tema: novoTema })
      .in("id", ids);
    if (upErr) {
      console.error(`  ERRO ao atualizar para "${novoTema}": ${upErr.message}`);
    } else {
      console.log(`  OK - ${ids.length} registros atualizados.`);
    }
  }

  // 4. Contar resultado final por tema e subtema
  const { data: final, error: errFinal } = await supabase
    .from("questoes")
    .select("tema, subtema");

  if (errFinal) {
    console.error("[v0] Erro na consulta final:", errFinal.message);
    process.exit(1);
  }

  console.log("\n\n========== RESULTADO FINAL ==========");

  const temasPrincipais = [
    "Clínica Médica",
    "Ginecologia e Obstetrícia",
    "Pediatria",
    "Medicina Preventiva",
    "Cirurgia",
  ];

  let totalGeral = 0;

  for (const tema of temasPrincipais) {
    const questoesTema = final.filter((r) => r.tema === tema);
    totalGeral += questoesTema.length;
    console.log(`\n--- ${tema}: ${questoesTema.length} questões ---`);

    // Agrupar por subtema
    const subtemas = {};
    for (const r of questoesTema) {
      const sub = r.subtema || "(sem subtema)";
      if (!subtemas[sub]) subtemas[sub] = 0;
      subtemas[sub]++;
    }

    const subtemaOrdenado = Object.entries(subtemas).sort((a, b) => b[1] - a[1]);
    for (const [sub, qtd] of subtemaOrdenado) {
      console.log(`   ${sub}: ${qtd}`);
    }
  }

  // Verificar temas fora dos 5 principais
  const foraDosPrincipais = final.filter((r) => !temasPrincipais.includes(r.tema));
  console.log(`\n--- Outros / sem tema: ${foraDosPrincipais.length} questões ---`);
  const outrosTemas = {};
  for (const r of foraDosPrincipais) {
    const t = r.tema || "(null)";
    if (!outrosTemas[t]) outrosTemas[t] = 0;
    outrosTemas[t]++;
  }
  for (const [t, q] of Object.entries(outrosTemas).sort((a, b) => b[1] - a[1])) {
    console.log(`   "${t}": ${q}`);
  }

  console.log(`\n========== TOTAL NOS 5 TEMAS: ${totalGeral} ==========`);
  console.log(`========== TOTAL GERAL: ${final.length} ==========`);
}

main();
