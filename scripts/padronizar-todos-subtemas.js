import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Busca todos os ids+subtemas por tema de uma vez
const { data, error } = await supabase
  .from("questoes")
  .select("id, tema, subtema");

if (error) { console.error("Erro:", error.message); process.exit(1); }

function norm(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

// Mapa: subtema_bruto_exato -> subtema_padrao, por tema
const MAPA_CLINICA = {
  "Cardiologia": ["cardiologia","Cardiologia / Infarto agudo do miocárdio","Insuficiência cardíaca","Hipertensão arterial","Crise hipertensiva x reação ansiosa (pseudo-urgência)","Estenose aórtica grave sintomática","Trombose venosa profunda; diagnóstico com USG Doppler","Distúrbios ácido-básicos","Distúrbios ácido-base"],
  "Pneumologia": ["Asma aguda / crise moderada-grave","Pneumonia adquirida na comunidade / derrame pleural parapneumônico","TB pulmonar pós-primária; cavitação em ápice, sintomas B","Pneumonia atípica","Pneumologia / Tuberculose pulmonar pós-primária","Pneumologia / Exposição ocupacional ao amianto","Trauma torácico / complicação da intubação"],
  "Infectologia": ["Infectologia / Coinfecção HIV-Tuberculose","HIV/AIDS e tuberculose / coinfecção","HIV/TB","Tuberculose em paciente com HIV","Tuberculose pulmonar; manejo após teste rápido molecular","Meningite tuberculosa","Sífilis primária: diagnóstico e tratamento","Infecções virais emergentes; artrite crônica pós-chikungunya","Doenças virais","Nefrologia / Infectologia / Infecção urinária baixa"],
  "Gastroenterologia": ["gastroenterologia","doenças das vias biliares – colangite aguda","Hepatologia / Ascite / PBE","Pancreatite crônica","Doenças colestáticas (colangite esclerosante primária)","Abdome agudo vascular"],
  "Endocrinologia": ["Endocrinologia / Nódulo tireoidiano","Glicemia de jejum alterada em gestante – DM gestacional","Insuficiência ovariana / diagnóstico hormonal","Doença de Parkinson"],
  "Nefrologia": ["Doenças glomerulares","Síndrome nefrótica","Doença renal crônica avançada e indicação de diálise","Nefrologia / IRA por rabdomiólise"],
  "Neurologia": ["Neurologia / cefaleia","Cefaleia primária","Traumatismo cranioencefálico","Transtornos de ansiedade / ataque de pânico","Transtornos de ansiedade","Neurologia / Hipertensão Intracraniana","Efeitos extrapiramidais","Síndrome da cauda equina","Lombociatalgia aguda sem déficit neurológico grave","Lombalgia mecânico-postural"],
  "Reumatologia": ["reumatologia","Doenças reumatológicas","Artrite reumatoide","Fibromialgia – manejo medicamentoso de manutenção","Reumatologia / esclerose sistêmica – acometimento esofágico"],
  "Oncologia / Hematologia": ["Oncologia / câncer de próstata / estadiamento","Hematologia / anemias hemolíticas","Câncer de próstata e escore de Gleason","Oncologia / câncer colorretal","Hemoglobinopatias","Onco-hematologia / Neutropenia febril","Mieloma múltiplo","Oncologia"],
  "Psiquiatria": ["Transtornos alimentares","Bioética","Delirium pós-operatório; sepse pulmonar em idoso","Políticas Públicas de Saúde"],
  "Ginecologia / Obstetrícia": ["Rastreamento de câncer de colo uterino / HSIL","pré-natal","Pré-natal","Aleitamento materno","Trabalho de parto pré-termo / Fatores de risco","Puerpério / Mastite","Prevenção de parto prematuro","Dequitação placentária","Sífilis na gestação; acompanhamento com VDRL seriado","Infecções na gestação (toxoplasmose)","Gravidez ectópica / tratamento","Hemorragia pós-parto e manejo medicamentoso","Descolamento prematuro de placenta","Candidíase vaginal recorrente na gestação; terapêutica tópica prolongada","Planejamento familiar / critérios de elegibilidade OMS","Obstetrícia","Doença inflamatória cervical","Medicina legal obstétrica","Cisto ovariano funcional","Doenças benignas da mama","Contracepção","Planejamento Familiar","Infecções Ginecológicas"],
  "Urgências Pediátricas": ["Urgências Pediátricas","Emergências pediátricas","Estenose hipertrófica de piloro","Puberdade e desenvolvimento sexual"],
};

const MAPA_GO = {
  "Pré-natal e Obstetrícia": ["pré-natal","Sangramento no primeiro trimestre","Isoimunização Rh e profilaxia com imunoglobulina anti-D","Diabetes gestacional","Hipertensão na gestação / pré-natal","Atenção pré-natal / calendário de consultas","sífilis gestacional – falha terapêutica","Sífilis na gestação","Infecção por COVID-19 na gestação e isolamento","Gestação inicial e isoimunização","Hiperglicemia na gestação precoce; DM prévio diagnosticado na gestação","Obstetrícia / HIV na gestação / Indicação de cesariana","Gestação ectópica","Dor pélvica aguda / gestação ectópica","Abortamento","Infertilidade / Avaliação inicial do casal","Pré-natal de baixo risco; exames laboratoriais do 1º trimestre","Gestação / Infecção urinária","infecção urinária na gestação","Obstetrícia / Infecções sexualmente transmissíveis na gestação","Obstetrícia"],
  "Ginecologia Geral": ["Endometriose","Endometriose em adolescente com dismenorreia secundária","Amenorreia primária","sangramento uterino anormal na adolescência – exclusão de gravidez","Ginecologia / Sangramento uterino anormal na adolescência","Doença inflamatória pélvica aguda","Ginecologia / vaginite por Trichomonas","Sangramento uterino anormal e investigação endometrial","Distúrbios menstruais na adolescência","Sangramento uterino anormal agudo","Planejamento familiar e enxaqueca com aura","Planejamento reprodutivo / HIV e contracepção","Planejamento familiar / interação medicamentosa (anticonvulsivante)"],
  "IST / Infecções Ginecológicas": ["IST / sífilis / manejo em contato sexual","Rastreamento do câncer de colo uterino / conduta frente a LSIL","Rastreamento de câncer de colo / lesão de alto grau","Rastreamento do câncer de colo uterino com achado de ASC-US"],
  "Oncologia Ginecológica": ["Oncoginecologia / tumor de ovário","Nódulo mamário em mulher jovem","Oncologia Ginecológica"],
  "Endocrinologia Reprodutiva": ["Endocrinologia Ginecológica","Endocrinologia / hiperparatiroidismo primário","Endocrinologia","Doença autoimune – lúpus"],
  "Clínica Geral / Intercorrências": ["Gastroenterologia","Dermatologia oncológica"],
};

const MAPA_PEDIATRIA = {
  "Neonatologia": ["Icterícia neonatal; hiperbilirrubinemia precoce; indicação de fototerapia","Icterícia neonatal grave / Exsanguineotransfusão","Icterícia neonatal","Hipoglicemia neonatal","Reanimação neonatal em prematuro tardio; contato pele a pele e aquecimento","Reanimação neonatal","Sífilis congênita; investigação completa e início de tratamento","Dermatoses neonatais; eritema tóxico neonatal","Desconforto respiratório em RN tardio pré-termo","Doença respiratória do recém-nascido; fatores de risco"],
  "Crescimento e Desenvolvimento": ["Nutrição / crescimento infantil","Puericultura; alimentação complementar; aleitamento materno","Baixa estatura; padrão familiar; avaliação de crescimento","Síndrome de Down","Síndrome de Turner / puberdade / dermatite de contato","Desenvolvimento infantil / Transtorno do espectro autista","Neurodesenvolvimento / Transtorno do Espectro Autista","Transtornos de Aprendizagem","Puberdade normal; orientação em amenorreia fisiológica inicial","Puberdade e desenvolvimento sexual"],
  "Infectologia Pediátrica": ["RN de 25 dias com ITU febril – conduta","Convulsão febril; acompanhamento longitudinal na APS","Convulsão febril","Mononucleose infecciosa associada à síndrome de Guillain-Barré","Parotidite infecciosa / complicações abdominais","Doenças exantemáticas / Doença de Kawasaki","Larva migrans em pré-escolares","Parasitose intestinal – Trichuris trichiura","Febre reumática aguda","Pneumonia comunitária pediátrica","Pneumonia com derrame pleural; necessidade de toracocentese","Derrame pleural / empiema","Derrame pleural","Sepse pediátrica","Sepse","Infecção urinária / diagnóstico","Infecção urinária recorrente – cicatriz renal (DMSA)","Infecção do trato urinário na infância"],
  "Imunizações": ["imunizações – varicela/tetraviral","Imunizações / Calendário vacinal aos 15-18 meses","Calendário vacinal 15-18 meses; tríplice viral + varicela (tetraviral) em atraso","Calendário vacinal infantil / 6 meses","Calendário vacinal infantil; esquema de sarampo após dose precoce","Calendário vacinal"],
  "Urgências Pediátricas": ["Urgências Clínicas","Estado de mal epiléptico em criança","Neurologia pediátrica / estado de mal epiléptico","Status epilepticus em criança; escalonamento terapêutico","Queimaduras","Queimadura – regra dos 9","Intoxicações","Intoxicações medicamentosas na infância; efeito anticolinérgico de anti-histamínico","Suporte avançado de vida em pediatria","Desidratação / IRA pré-renal","Desidratação infantil / Terapia de reidratação venosa"],
  "Gastroenterologia Pediátrica": ["Constipação / Doença de Hirschsprung","Gastroenterologia / Obstrução intestinal por ascaridíase","Gastroenterologia"],
  "Hematologia / Oncologia Pediátrica": ["Hematologia pediátrica / Anemia falciforme","Anemia carencial","Oncologia pediátrica / Tumor de Wilms","Oncologia pediátrica; neuroblastoma","Púrpura trombocitopênica imune na infância; conduta expectante inicial","Púrpura trombocitopênica imune","Hematologia pediátrica","Oncologia"],
  "Ortopedia / Cirurgia Pediátrica": ["Ortopedia pediátrica / epifisiólise","artrite séptica em criança","Artrite séptica em criança; imagem e punção articular","Politrauma com febre e dor em quadril – suspeita de artrite séptica","Cirurgia pediátrica; hérnia inguinal indireta; correção eletiva precoce","Cirurgia pediátrica / hérnia inguinal","Abdome Agudo"],
  "Pneumologia Pediátrica": ["asma – classificação de controle e tratamento de manutenção","Asma / crise e manutenção"],
  "Neurologia Pediátrica": ["Síndrome de Wernicke","Fraqueza em MMII – investigação","Hipertensão intracraniana","Neurologia"],
  "Endocrinologia / Adolescência": ["Endocrinologia Ginecológica","Planejamento Familiar","Planejamento Familiar / DIU","Síndrome nefrótica na infância; corticoterapia","Nefrologia","Sangramento uterino disfuncional na adolescência; ciclos anovulatórios","Distúrbios de diferenciação sexual","Amenorreia primária / agenesia mülleriana (síndrome de MRKH)","Endocrinologia Reprodutiva / SOP"],
  "Psiquiatria / Comportamento": ["Transtornos do comportamento","Uso crônico de benzodiazepínicos","Geriatria"],
};

const MAPA_CIRURGIA = {
  "Trauma / ATLS": ["trauma","Trauma torácico","Trauma de mão","Trauma cranioencefálico","Trauma raquimedular cervical","Trauma hepático","Trauma urológico","Trauma de uretra","Trauma hepático contuso; manejo não operatório em paciente estável","Trauma e Reanimação","Queimaduras","queimaduras","Queimaduras / critério de encaminhamento","Lesão ocular por flash de solda; conduta inicial com irrigação","Embolia gasosa / acesso venoso central","Acesso venoso profundo; punção arterial inadvertida; conduta imediata","Ortopedia / Entorse de tornozelo","Corpo estranho perfurante em partes moles (anzol)","Escoliose / Avaliação inicial","Lombalgia recorrente em adolescente; anemia falciforme; vértebra em H","Lombalgia","Síndrome da cauda equina","Déficit em extensão de joelho após trauma – nível medular"],
  "Pós-operatório / Complicações Cirúrgicas": ["Complicações pós-bariátrica","infecção de ferida","Infecção de ferida","Feridas / técnica de sutura","Feridas / classificação","Distúrbios Hidroeletrolíticos","Distúrbios eletrolíticos / Hipocalcemia","Febre no 1º dia pós-operatório","Delirium pós-operatório; sepse pulmonar em idoso","Segurança cirúrgica","Antibioticoprofilaxia Cirúrgica","Cirurgia ginecológica / antibioticoprofilaxia","Profilaxia antibiótica em histerectomia; cirurgia limpa-contaminada","Cirurgia ambulatorial / Cantoplastia por unha encravada","Tratamento cirúrgico da unha encravada (onicocriptose)","Pós-operatório Cirúrgico"],
  "Abdome Agudo / Cirurgia Digestiva": ["abdome agudo","Abdome agudo obstrutivo; hérnia femoral encarcerada","Hérnias","Hérnia umbilical / antibioticoprofilaxia","Cirurgia pediátrica; hérnia inguinal indireta; correção eletiva precoce","Gastroenterologia","Gastroenterologia – Hemorragia digestiva alta","Hemorragia digestiva alta","Hemorragia digestiva alta por úlcera péptica","Sepse biliar","Pielonefrite obstrutiva / Sepse","Fístula perianal","doenças anorretais – fístula perianal","Abscesso perianal em diabético","Abscesso anorretal; drenagem cirúrgica","Coloproctologia","Cirurgia do aparelho digestivo / Câncer de pâncreas","Icterícia obstrutiva / neoplasia de cabeça de pâncreas","Icterícia colestática","Diverticulite complicada","Doença diverticular – diverticulite aguda complicada (TC)","Abdome Agudo"],
  "Oncologia Cirúrgica": ["Urologia oncológica","Linfoma de Hodgkin / diagnóstico","Câncer colorretal / investigação","nódulo de tireoide – Bethesda IV","Mastologia / Rastreamento do câncer de mama","Neoplasia pulmonar; pneumonia pós-obstrutiva; derrame pleural","Oncologia Ginecológica / Colo Uterino"],
};

// Constroi lookup: tema -> { subtema_bruto: subtema_padrao }
function buildLookup(mapa) {
  const lookup = {};
  for (const [padrao, brutos] of Object.entries(mapa)) {
    for (const b of brutos) lookup[b] = padrao;
  }
  return lookup;
}

const LOOKUPS = {
  "Clínica Médica": buildLookup(MAPA_CLINICA),
  "Ginecologia e Obstetrícia": buildLookup(MAPA_GO),
  "Pediatria": buildLookup(MAPA_PEDIATRIA),
  "Cirurgia": buildLookup(MAPA_CIRURGIA),
};

// Agrupa ids por (tema, novoSubtema) para fazer updates em batch
const batches = {};
for (const row of data) {
  if (!row.id || !row.subtema || !LOOKUPS[row.tema]) continue;
  const novo = LOOKUPS[row.tema][row.subtema];
  if (!novo || novo === row.subtema) continue;
  const key = `${row.tema}|||${novo}`;
  if (!batches[key]) batches[key] = [];
  batches[key].push(row.id);
}

let totalAtualizado = 0;
for (const [key, ids] of Object.entries(batches)) {
  const [tema, novoSub] = key.split("|||");
  const { error: upErr, count } = await supabase
    .from("questoes")
    .update({ subtema: novoSub })
    .in("id", ids)
    .select("id", { count: "exact", head: true });
  if (upErr) { console.error(`ERRO [${tema}] → ${novoSub}: ${upErr.message}`); continue; }
  console.log(`[${ids.length}] ${tema} → "${novoSub}"`);
  totalAtualizado += ids.length;
}

console.log(`\n=== TOTAL ATUALIZADO: ${totalAtualizado} ===`);

// Relatorio final
const { data: final } = await supabase.from("questoes").select("tema, subtema");
const TEMAS = ["Clínica Médica","Ginecologia e Obstetrícia","Pediatria","Cirurgia","Medicina Preventiva"];
for (const tema of TEMAS) {
  const rows = final.filter(q => q.tema === tema);
  const cont = {};
  for (const q of rows) { const s = q.subtema?.trim() || "(sem subtema)"; cont[s] = (cont[s]||0)+1; }
  console.log(`\n====== ${tema} — ${rows.length} questoes ======`);
  for (const [s, qtd] of Object.entries(cont).sort((a,b)=>b[1]-a[1])) console.log(`  [${qtd}] ${s}`);
}
