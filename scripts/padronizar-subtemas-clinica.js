import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapa de padronização: subtema bruto → subtema padronizado
// Para o tema: Clínica Médica
const MAPA = {
  "Cardiologia": [
    "cardiologia","Cardiologia / Infarto agudo do miocárdio","Insuficiência cardíaca",
    "Hipertensão arterial","Crise hipertensiva x reação ansiosa (pseudo-urgência)",
    "Estenose aórtica grave sintomática","Trombose venosa profunda; diagnóstico com USG Doppler",
    "Distúrbios ácido-básicos","Distúrbios ácido-base",
  ],
  "Pneumologia": [
    "Asma aguda / crise moderada-grave",
    "Pneumonia adquirida na comunidade / derrame pleural parapneumônico",
    "TB pulmonar pós-primária; cavitação em ápice, sintomas B",
    "Pneumonia atípica","Pneumologia / Tuberculose pulmonar pós-primária",
    "Pneumologia / Exposição ocupacional ao amianto",
    "Trauma torácico / complicação da intubação",
  ],
  "Infectologia": [
    "Infectologia / Coinfecção HIV-Tuberculose","HIV/AIDS e tuberculose / coinfecção",
    "HIV/TB","Tuberculose em paciente com HIV",
    "Tuberculose pulmonar; manejo após teste rápido molecular",
    "Meningite tuberculosa","Sífilis primária: diagnóstico e tratamento",
    "Infecções virais emergentes; artrite crônica pós-chikungunya","Doenças virais",
    "Nefrologia / Infectologia / Infecção urinária baixa",
  ],
  "Gastroenterologia": [
    "gastroenterologia","doenças das vias biliares – colangite aguda",
    "Hepatologia / Ascite / PBE","Pancreatite crônica",
    "Doenças colestáticas (colangite esclerosante primária)","Abdome agudo vascular",
  ],
  "Endocrinologia": [
    "Endocrinologia / Nódulo tireoidiano",
    "Glicemia de jejum alterada em gestante – DM gestacional",
    "Insuficiência ovariana / diagnóstico hormonal","Doença de Parkinson",
  ],
  "Nefrologia": [
    "Doenças glomerulares","Síndrome nefrótica",
    "Doença renal crônica avançada e indicação de diálise","Nefrologia / IRA por rabdomiólise",
  ],
  "Neurologia": [
    "Neurologia / cefaleia","Cefaleia primária","Traumatismo cranioencefálico",
    "Transtornos de ansiedade / ataque de pânico","Transtornos de ansiedade",
    "Neurologia / Hipertensão Intracraniana","Efeitos extrapiramidais",
    "Síndrome da cauda equina","Lombociatalgia aguda sem déficit neurológico grave",
    "Lombalgia mecânico-postural",
  ],
  "Reumatologia": [
    "reumatologia","Doenças reumatológicas","Artrite reumatoide",
    "Fibromialgia – manejo medicamentoso de manutenção",
    "Reumatologia / esclerose sistêmica – acometimento esofágico",
  ],
  "Oncologia / Hematologia": [
    "Oncologia / câncer de próstata / estadiamento","Hematologia / anemias hemolíticas",
    "Câncer de próstata e escore de Gleason","Oncologia / câncer colorretal",
    "Hemoglobinopatias","Onco-hematologia / Neutropenia febril","Mieloma múltiplo","Oncologia",
  ],
  "Psiquiatria": [
    "Transtornos alimentares","Bioética",
    "Delirium pós-operatório; sepse pulmonar em idoso","Políticas Públicas de Saúde",
  ],
  "Ginecologia / Obstetrícia": [
    "Rastreamento de câncer de colo uterino / HSIL","pré-natal","Pré-natal",
    "Aleitamento materno","Trabalho de parto pré-termo / Fatores de risco",
    "Puerpério / Mastite","Prevenção de parto prematuro","Dequitação placentária",
    "Sífilis na gestação; acompanhamento com VDRL seriado",
    "Infecções na gestação (toxoplasmose)","Gravidez ectópica / tratamento",
    "Hemorragia pós-parto e manejo medicamentoso","Descolamento prematuro de placenta",
    "Candidíase vaginal recorrente na gestação; terapêutica tópica prolongada",
    "Planejamento familiar / critérios de elegibilidade OMS","Obstetrícia",
    "Doença inflamatória cervical","Medicina legal obstétrica","Cisto ovariano funcional",
    "Doenças benignas da mama","Contracepção","Planejamento Familiar","Infecções Ginecológicas",
  ],
  "Urgências Pediátricas": [
    "Urgências Pediátricas","Emergências pediátricas",
    "Estenose hipertrófica de piloro","Puberdade e desenvolvimento sexual",
  ],
};

const TEMA = "Clínica Médica";

async function main() {
  let total = 0;
  for (const [subtemaFinal, brutos] of Object.entries(MAPA)) {
    for (const bruto of brutos) {
      const { data, error } = await supabase
        .from("questoes")
        .update({ subtema: subtemaFinal })
        .eq("tema", TEMA)
        .eq("subtema", bruto)
        .select("id");
      if (error) { console.error(`ERRO: ${bruto} → ${error.message}`); continue; }
      if (data?.length) { console.log(`[${data.length}] "${bruto}" → "${subtemaFinal}"`); total += data.length; }
    }
  }
  console.log(`\nTotal atualizado em ${TEMA}: ${total}`);
  const { data: rel } = await supabase.from("questoes").select("subtema").eq("tema", TEMA);
  const cont = {};
  for (const r of rel) { const s = r.subtema || "(sem subtema)"; cont[s] = (cont[s]||0)+1; }
  console.log(`\n=== ${TEMA} — ${rel.length} questoes ===`);
  for (const [s,q] of Object.entries(cont).sort((a,b)=>b[1]-a[1])) console.log(`  [${q}] ${s}`);
}
main();
