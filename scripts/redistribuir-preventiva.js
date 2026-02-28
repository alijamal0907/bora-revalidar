import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Busca todos de Medicina Preventiva
const { data: todos } = await supabase.from("questoes").select("id, subtema").eq("tema", "Medicina Preventiva");

function classificar(s) {
  if (!s) return null;
  const sub = s.toLowerCase();

  // GINECOLOGIA
  if (/gest|parto|pré-natal|pre-natal|obstetr|puerpér|puerpério|hemorragia obst|matern|eclâmpsia|eclampsia|placenta|leopold|laqueadura|infertil|mioma|sangramento.*menopausa|menopausa|pelvi|dip|inflamatória pélvica|planejamento famil|ginecol|mama.*rastrea|rastrea.*mama|inca.*mama|ncer de mama|bariátrica.*conc|vacinação.*gest|influenza.*dTpa|sífilis.*gestante|rh-|ectópica|itu.*mulher|cistite.*mulher/.test(sub))
    return { tema: "Ginecologia e Obstetrícia", subtema: sub.includes("gest") || sub.includes("parto") || sub.includes("obstetr") || sub.includes("natal") || sub.includes("eclampsia") || sub.includes("ecl") || sub.includes("placenta") || sub.includes("leopold") || sub.includes("bariátrica") || sub.includes("vacinação") || sub.includes("sífilis.*gestante") || sub.includes("ectópica") ? "Pré-natal e Obstetrícia" : sub.includes("inflamatória pélvica") || sub.includes("infect") || sub.includes("itu") || sub.includes("cistite") ? "IST / Infecções Ginecológicas" : sub.includes("mama") ? "Oncologia Ginecológica" : "Ginecologia Geral" };

  // CIRURGIA
  if (/trauma|queimad|atls|reanimaç|colecist|abdome agudo|cirurgia digest|antibioticoprofilax.*cir|pós-operat|febre.*pós-operat|febre.*pós operat|complicaç.*pós-operat|derrame pleural.*radiolog|lesão de via biliar/.test(sub))
    return { tema: "Cirurgia", subtema: /trauma|queimad|atls|reanimaç/.test(sub) ? "Trauma / ATLS" : /antibioticoprofilax|pós-operat|febre.*pós|complicaç.*pós/.test(sub) ? "Pós-operatório / Complicações Cirúrgicas" : "Abdome Agudo / Cirurgia Digestiva" };

  // PEDIATRIA
  if (/pediátr|pediátr|infanc|infância|neonat|criança|lactente|escolar|adolesc|vacinação.*criança|criança.*vacin|imunossuprimid.*criança|calendário vacinal|sarampo.*vacin|ortopedia infec|febre.*infânc/.test(sub))
    return { tema: "Pediatria", subtema: /neonat/.test(sub) ? "Neonatologia" : /infect|itu.*infância|febre.*infânc/.test(sub) ? "Infectologia Pediátrica" : /vacin|imuniz|calendário/.test(sub) ? "Imunizações" : /hemato/.test(sub) ? "Hematologia / Oncologia Pediátrica" : /ortopedia/.test(sub) ? "Ortopedia / Cirurgia Pediátrica" : /adolesc/.test(sub) ? "Endocrinologia / Adolescência" : "Crescimento e Desenvolvimento" };

  // CLÍNICA MÉDICA
  if (/infectolog|hiv|tuberculos|dengue|arbovir|hepatite viral|coinfecç|gastroenterol|refluxo|colite|chagas|disfagia|pneumolog|nefrolog|renal crôn|hemodiáli|endocrinol|diabetes.*gest|hipotireoid|depress.*hipotire|cardiolog|hipertens.*encef|avc|tromboemb|tvp|trombofil|hematolog|púrpura tromboc|psiquiatr|saúde mental|uso de álcool|neurolog|epidemiolog|derrame pleural/.test(sub))
    return { tema: "Clínica Médica", subtema: /infectolog|hiv|tuberculos|dengue|arbovir|hepatite|coinfecç/.test(sub) ? "Infectologia" : /gastroenterol|refluxo|colite|chagas|disfagia/.test(sub) ? "Gastroenterologia" : /pneumolog/.test(sub) ? "Pneumologia" : /nefrolog|renal crôn|hemodiáli/.test(sub) ? "Nefrologia" : /endocrinol|hipotireoid/.test(sub) ? "Endocrinologia" : /cardiolog|hipertens.*encef|tromboemb|tvp/.test(sub) ? "Cardiologia" : /hemato|púrpura/.test(sub) ? "Oncologia / Hematologia" : /psiquiatr|saúde mental|álcool/.test(sub) ? "Psiquiatria" : /neurolog|avc/.test(sub) ? "Neurologia" : /trombofil/.test(sub) ? "Oncologia / Hematologia" : "Epidemiologia" };

  return null;
}

let total = 0;
const resumo = {};
const updates = [];

for (const row of todos) {
  const result = classificar(row.subtema);
  if (result) updates.push({ id: row.id, ...result });
}

// Agrupa por tema+subtema e faz update em batch por grupo
const grupos = {};
for (const u of updates) {
  const key = `${u.tema}||${u.subtema}`;
  if (!grupos[key]) grupos[key] = { tema: u.tema, subtema: u.subtema, ids: [] };
  grupos[key].ids.push(u.id);
}

for (const { tema, subtema, ids } of Object.values(grupos)) {
  const { data, error } = await supabase.from("questoes").update({ tema, subtema }).in("id", ids).select("id");
  if (error) { console.error(`ERRO [${subtema}]: ${error.message}`); continue; }
  console.log(`[${data?.length}] → ${tema} / ${subtema}`);
  total += data?.length || 0;
  resumo[tema] = (resumo[tema] || 0) + (data?.length || 0);
}

console.log(`\n=== TOTAL MOVIDO: ${total} ===`);
for (const [t, q] of Object.entries(resumo)) console.log(`  ${t}: +${q}`);

const { data: prev } = await supabase.from("questoes").select("subtema").eq("tema", "Medicina Preventiva");
const cp = {};
for (const r of prev) { const s = r.subtema?.trim() || "(sem subtema)"; cp[s] = (cp[s]||0)+1; }
console.log(`\n=== Medicina Preventiva restante: ${prev.length} ===`);
for (const [s,q] of Object.entries(cp).sort((a,b)=>b[1]-a[1])) console.log(`  [${q}] ${s}`);
