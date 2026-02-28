import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEMA = "Ginecologia e Obstetrícia";
const MAPA = {
  "Pré-natal e Obstetrícia": ["pré-natal","Sangramento no primeiro trimestre","Isoimunização Rh e profilaxia com imunoglobulina anti-D","Diabetes gestacional","Hipertensão na gestação / pré-natal","Atenção pré-natal / calendário de consultas","sífilis gestacional – falha terapêutica","Sífilis na gestação","Infecção por COVID-19 na gestação e isolamento","Gestação inicial e isoimunização","Hiperglicemia na gestação precoce; DM prévio diagnosticado na gestação","Obstetrícia / HIV na gestação / Indicação de cesariana","Gestação ectópica","Dor pélvica aguda / gestação ectópica","Abortamento","Infertilidade / Avaliação inicial do casal","Pré-natal de baixo risco; exames laboratoriais do 1º trimestre","Gestação / Infecção urinária","infecção urinária na gestação","Obstetrícia / Infecções sexualmente transmissíveis na gestação","Obstetrícia"],
  "Ginecologia Geral": ["Endometriose","Endometriose em adolescente com dismenorreia secundária","Amenorreia primária","sangramento uterino anormal na adolescência – exclusão de gravidez","Ginecologia / Sangramento uterino anormal na adolescência","Doença inflamatória pélvica aguda","Ginecologia / vaginite por Trichomonas","Sangramento uterino anormal e investigação endometrial","Distúrbios menstruais na adolescência","Sangramento uterino anormal agudo","Planejamento familiar e enxaqueca com aura","Planejamento reprodutivo / HIV e contracepção","Planejamento familiar / interação medicamentosa (anticonvulsivante)"],
  "IST / Infecções Ginecológicas": ["IST / sífilis / manejo em contato sexual","Rastreamento do câncer de colo uterino / conduta frente a LSIL","Rastreamento de câncer de colo / lesão de alto grau","Rastreamento do câncer de colo uterino com achado de ASC-US"],
  "Oncologia Ginecológica": ["Oncoginecologia / tumor de ovário","Nódulo mamário em mulher jovem","Oncologia Ginecológica"],
  "Endocrinologia Reprodutiva": ["Endocrinologia Ginecológica","Endocrinologia / hiperparatiroidismo primário","Endocrinologia","Doença autoimune – lúpus"],
  "Clínica Geral / Intercorrências": ["Gastroenterologia","Dermatologia oncológica"],
};

let total = 0;
for (const [sf, brutos] of Object.entries(MAPA)) {
  for (const b of brutos) {
    const { data, error } = await supabase.from("questoes").update({ subtema: sf }).eq("tema", TEMA).eq("subtema", b).select("id");
    if (error) { console.error(`ERRO: ${b} → ${error.message}`); continue; }
    if (data?.length) { console.log(`[${data.length}] "${b}" → "${sf}"`); total += data.length; }
  }
}
console.log(`\nTotal atualizado: ${total}`);

const { data: rel } = await supabase.from("questoes").select("subtema").eq("tema", TEMA);
const cont = {};
for (const r of rel) { const s = r.subtema?.trim() || "(sem subtema)"; cont[s] = (cont[s]||0)+1; }
console.log(`\n=== ${TEMA} — ${rel.length} questoes ===`);
for (const [s,q] of Object.entries(cont).sort((a,b)=>b[1]-a[1])) console.log(`  [${q}] ${s}`);
