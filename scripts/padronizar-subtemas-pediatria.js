import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MAPA = {
  "Neonatologia": [
    "Icterícia neonatal; hiperbilirrubinemia precoce; indicação de fototerapia",
    "Icterícia neonatal grave / Exsanguineotransfusão","Icterícia neonatal",
    "Hipoglicemia neonatal",
    "Reanimação neonatal em prematuro tardio; contato pele a pele e aquecimento",
    "Reanimação neonatal","Sífilis congênita; investigação completa e início de tratamento",
    "Dermatoses neonatais; eritema tóxico neonatal",
    "Desconforto respiratório em RN tardio pré-termo",
    "Doença respiratória do recém-nascido; fatores de risco",
  ],
  "Crescimento e Desenvolvimento": [
    "Nutrição / crescimento infantil","Puericultura; alimentação complementar; aleitamento materno",
    "Baixa estatura; padrão familiar; avaliação de crescimento",
    "Síndrome de Down","Síndrome de Turner / puberdade / dermatite de contato",
    "Desenvolvimento infantil / Transtorno do espectro autista",
    "Neurodesenvolvimento / Transtorno do Espectro Autista",
    "Transtornos de Aprendizagem",
    "Puberdade normal; orientação em amenorreia fisiológica inicial",
    "Puberdade e desenvolvimento sexual",
  ],
  "Infectologia Pediátrica": [
    "RN de 25 dias com ITU febril – conduta",
    "Convulsão febril; acompanhamento longitudinal na APS","Convulsão febril",
    "Mononucleose infecciosa associada à síndrome de Guillain-Barré",
    "Parotidite infecciosa / complicações abdominais",
    "Doenças exantemáticas / Doença de Kawasaki","Larva migrans em pré-escolares",
    "Parasitose intestinal – Trichuris trichiura","Febre reumática aguda",
    "Pneumonia comunitária pediátrica",
    "Pneumonia com derrame pleural; necessidade de toracocentese",
    "Derrame pleural / empiema","Derrame pleural","Sepse pediátrica","Sepse",
    "Infecção urinária / diagnóstico",
    "Infecção urinária recorrente – cicatriz renal (DMSA)","Infecção do trato urinário na infância",
  ],
  "Imunizações": [
    "imunizações – varicela/tetraviral","Imunizações / Calendário vacinal aos 15-18 meses",
    "Calendário vacinal 15-18 meses; tríplice viral + varicela (tetraviral) em atraso",
    "Calendário vacinal infantil / 6 meses",
    "Calendário vacinal infantil; esquema de sarampo após dose precoce","Calendário vacinal",
  ],
  "Urgências Pediátricas": [
    "Urgências Clínicas","Estado de mal epiléptico em criança",
    "Neurologia pediátrica / estado de mal epiléptico",
    "Status epilepticus em criança; escalonamento terapêutico",
    "Queimaduras","Queimadura – regra dos 9","Intoxicações",
    "Intoxicações medicamentosas na infância; efeito anticolinérgico de anti-histamínico",
    "Suporte avançado de vida em pediatria","Desidratação / IRA pré-renal",
    "Desidratação infantil / Terapia de reidratação venosa",
  ],
  "Gastroenterologia Pediátrica": [
    "Constipação / Doença de Hirschsprung",
    "Gastroenterologia / Obstrução intestinal por ascaridíase","Gastroenterologia",
  ],
  "Hematologia / Oncologia Pediátrica": [
    "Hematologia pediátrica / Anemia falciforme","Anemia carencial",
    "Oncologia pediátrica / Tumor de Wilms","Oncologia pediátrica; neuroblastoma",
    "Púrpura trombocitopênica imune na infância; conduta expectante inicial",
    "Púrpura trombocitopênica imune","Hematologia pediátrica","Oncologia",
  ],
  "Ortopedia / Cirurgia Pediátrica": [
    "Ortopedia pediátrica / epifisiólise","artrite séptica em criança",
    "Artrite séptica em criança; imagem e punção articular",
    "Politrauma com febre e dor em quadril – suspeita de artrite séptica",
    "Cirurgia pediátrica; hérnia inguinal indireta; correção eletiva precoce",
    "Cirurgia pediátrica / hérnia inguinal","Abdome Agudo",
  ],
  "Pneumologia Pediátrica": [
    "asma – classificação de controle e tratamento de manutenção","Asma / crise e manutenção",
  ],
  "Neurologia Pediátrica": [
    "Síndrome de Wernicke","Fraqueza em MMII – investigação","Hipertensão intracraniana","Neurologia",
  ],
  "Endocrinologia / Adolescência": [
    "Endocrinologia Ginecológica","Planejamento Familiar","Planejamento Familiar / DIU",
    "Síndrome nefrótica na infância; corticoterapia","Nefrologia",
    "Sangramento uterino disfuncional na adolescência; ciclos anovulatórios",
    "Distúrbios de diferenciação sexual",
    "Amenorreia primária / agenesia mülleriana (síndrome de MRKH)",
    "Endocrinologia Reprodutiva / SOP",
  ],
  "Psiquiatria / Comportamento": [
    "Transtornos do comportamento","Uso crônico de benzodiazepínicos","Geriatria",
  ],
};

const TEMA = "Pediatria";

async function main() {
  let total = 0;
  for (const [sf, brutos] of Object.entries(MAPA)) {
    for (const b of brutos) {
      const { data, error } = await supabase.from("questoes").update({ subtema: sf }).eq("tema", TEMA).eq("subtema", b).select("id");
      if (error) { console.error(`ERRO: ${b} → ${error.message}`); continue; }
      if (data?.length) { console.log(`[${data.length}] "${b}" → "${sf}"`); total += data.length; }
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
