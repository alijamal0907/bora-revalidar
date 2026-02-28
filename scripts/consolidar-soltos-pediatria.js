import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Buscar todos os registros soltos em Pediatria com id
const { data } = await supabase.from("questoes").select("id, subtema").eq("tema", "Pediatria");

// Mapeamento: subtema bruto → { tema correto, subtema padrao }
const MAPA = {
  // Permanecem em Pediatria mas com subtema ajustado
  "Infectologia / Vigilância Epidemiológica": { tema: "Pediatria", subtema: "Infectologia Pediátrica" },
  "Atenção Primária à Saúde (APS)":           { tema: "Pediatria", subtema: "Crescimento e Desenvolvimento" },
  "Tabagismo – Tratamento":                   { tema: "Pediatria", subtema: "Psiquiatria / Comportamento" },
  "Violência sexual e profilaxia de hepatite B": { tema: "Pediatria", subtema: "Infectologia Pediátrica" },
  "Cardiopatias congênitas cianóticas / TGA": { tema: "Pediatria", subtema: "Neonatologia" },
  "Cirurgia pediátrica / hérnia inguinal":    { tema: "Pediatria", subtema: "Ortopedia / Cirurgia Pediátrica" },
  "Abdome Agudo / Cirurgia Digestiva":        { tema: "Pediatria", subtema: "Ortopedia / Cirurgia Pediátrica" },
  "Endocrinologia / Cetoacidose diabética / Edema cerebral": { tema: "Pediatria", subtema: "Urgências Pediátricas" },
  // Sem subtema definido
  "(sem subtema)": { tema: "Pediatria", subtema: "Crescimento e Desenvolvimento" },

  // Pertencem a outros temas — corrigir tema também
  "Cirurgia bariátrica / Síndrome de dumping":        { tema: "Cirurgia", subtema: "Pós-operatório / Complicações Cirúrgicas" },
  "Trauma hepático":                                  { tema: "Cirurgia", subtema: "Trauma / ATLS" },
  "Abscesso anorretal; drenagem cirúrgica":           { tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  "Trauma":                                           { tema: "Cirurgia", subtema: "Trauma / ATLS" },
  "Ética médica / comunicação de más notícias":       { tema: "Medicina Preventiva", subtema: "Políticas Públicas de Saúde" },
  "Rastreamento do câncer do colo uterino":           { tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" },
  "Climatério / Terapia hormonal":                    { tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" },
  "Hiperglicemia na gestação precoce; DM prévio diagnosticado na gestação": { tema: "Ginecologia e Obstetrícia", subtema: "Pré-natal e Obstetrícia" },
  "ASC-US em citologia – conduta":                    { tema: "Ginecologia e Obstetrícia", subtema: "IST / Infecções Ginecológicas" },
  "Tumor de testículo":                               { tema: "Clínica Médica", subtema: "Oncologia / Hematologia" },
  "Urologia / Câncer de Pênis":                       { tema: "Clínica Médica", subtema: "Oncologia / Hematologia" },
  "Síndrome do intestino irritável":                  { tema: "Clínica Médica", subtema: "Gastroenterologia" },
};

let total = 0;
for (const row of data) {
  const s = row.subtema?.trim() || "(sem subtema)";
  const destino = MAPA[s];
  if (!destino) continue;
  const { data: updated, error } = await supabase
    .from("questoes")
    .update({ tema: destino.tema, subtema: destino.subtema })
    .eq("id", row.id)
    .select("id");
  if (error) { console.error(`ERRO id=${row.id}: ${error.message}`); continue; }
  if (updated?.length) {
    console.log(`[OK] "${s}" → tema: "${destino.tema}" | subtema: "${destino.subtema}"`);
    total++;
  }
}
console.log(`\nTotal corrigido: ${total} registros`);

// Resumo final de Pediatria
const { data: rel } = await supabase.from("questoes").select("subtema").eq("tema", "Pediatria");
const cont = {};
for (const r of rel) { const s = r.subtema?.trim() || "(sem subtema)"; cont[s] = (cont[s]||0)+1; }
console.log(`\n=== PEDIATRIA FINAL — ${rel.length} questoes ===`);
for (const [s,q] of Object.entries(cont).sort((a,b)=>b[1]-a[1])) console.log(`  [${q}] ${s}`);
