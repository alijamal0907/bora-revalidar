import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const MAPA = {
  "Trauma / ATLS": ["trauma","Trauma torácico","Trauma de mão","Trauma cranioencefálico","Trauma raquimedular cervical","Trauma hepático","Trauma urológico","Trauma de uretra","Trauma hepático contuso; manejo não operatório em paciente estável","Trauma e Reanimação","Queimaduras","queimaduras","Queimaduras / critério de encaminhamento","Lesão ocular por flash de solda; conduta inicial com irrigação","Embolia gasosa / acesso venoso central","Acesso venoso profundo; punção arterial inadvertida; conduta imediata","Ortopedia / Entorse de tornozelo","Corpo estranho perfurante em partes moles (anzol)","Escoliose / Avaliação inicial","Lombalgia recorrente em adolescente; anemia falciforme; vértebra em H","Lombalgia","Síndrome da cauda equina","Déficit em extensão de joelho após trauma – nível medular"],
  "Pós-operatório / Complicações Cirúrgicas": ["Complicações pós-bariátrica","infecção de ferida","Infecção de ferida","Feridas / técnica de sutura","Feridas / classificação","Distúrbios Hidroeletrolíticos","Distúrbios eletrolíticos / Hipocalcemia","Febre no 1º dia pós-operatório","Delirium pós-operatório; sepse pulmonar em idoso","Segurança cirúrgica","Antibioticoprofilaxia Cirúrgica","Cirurgia ginecológica / antibioticoprofilaxia","Profilaxia antibiótica em histerectomia; cirurgia limpa-contaminada","Cirurgia ambulatorial / Cantoplastia por unha encravada","Tratamento cirúrgico da unha encravada (onicocriptose)","Pós-operatório Cirúrgico"],
  "Abdome Agudo / Cirurgia Digestiva": ["abdome agudo","Abdome agudo obstrutivo; hérnia femoral encarcerada","Hérnias","Hérnia umbilical / antibioticoprofilaxia","Cirurgia pediátrica; hérnia inguinal indireta; correção eletiva precoce","Gastroenterologia","Gastroenterologia – Hemorragia digestiva alta","Hemorragia digestiva alta","Hemorragia digestiva alta por úlcera péptica","Sepse biliar","Pielonefrite obstrutiva / Sepse","Fístula perianal","doenças anorretais – fístula perianal","Abscesso perianal em diabético","Abscesso anorretal; drenagem cirúrgica","Coloproctologia","Cirurgia do aparelho digestivo / Câncer de pâncreas","Icterícia obstrutiva / neoplasia de cabeça de pâncreas","Icterícia colestática","Diverticulite complicada","Doença diverticular – diverticulite aguda complicada (TC)","Abdome Agudo"],
  "Oncologia Cirúrgica": ["Urologia oncológica","Linfoma de Hodgkin / diagnóstico","Câncer colorretal / investigação","nódulo de tireoide – Bethesda IV","Mastologia / Rastreamento do câncer de mama","Neoplasia pulmonar; pneumonia pós-obstrutiva; derrame pleural","Oncologia Ginecológica / Colo Uterino"],
  "Urgências Clínicas / Outros": ["Urgências Clínicas","Hepatologia – hepatite B aguda","Dengue","Dengue / classificação de gravidade","Epidemiologia","Vigilância Epidemiológica","Violência e Vulnerabilidades","Violência interpessoal","Violência sexual – conduta","Endocrinologia","Endocrinologia / Hipertireoidismo","Pneumologia","Pneumologia Pediátrica","Pneumonia bacteriana / derrame pleural","Intoxicações pediátricas","Intoxicação exógena / ingestão de desinfetante","Toxicologia / Intoxicação por organofosforados","Malária","Infectologia","Infectologia Pediátrica","Hematologia","Sangramento uterino anormal e investigação endometrial","Puberdade e ciclo menstrual","Pré-natal","Infecções na gestação","Restrição de crescimento fetal; doppler alterado; indicação de interrupção","DPPNI e pré-eclâmpsia grave","Sífilis na gestação; tratamento com penicilina G benzatina","Fórceps – requisitos","Neonatologia","Crescimento e Desenvolvimento","Suporte avançado de vida em pediatria","Desidratação infantil / Terapia de reidratação venosa","Acidente vascular cerebral isquêmico agudo; trombólise venosa","IAM inferior com infarto de ventrículo direito; uso inadequado de nitrato","Crise hipertensiva com encefalopatia – manejo imediato","Migrânea com aura","DIU de cobre","Síndrome dolorosa crônica; fibromialgia","Cirurgia bariátrica / Indicações","HIV em mulher jovem; dupla proteção com método hormonal + preservativo","Doenças Reumáticas / Vasculites (Kawasaki)","TDAH","Saúde Mental na APS","Terapia Intensiva","Atenção Primária à Saúde (APS)","Oftalmologia / Trauma ocular por luz ultravioleta","Genética – Síndrome de Down","Rastreamento de câncer de mama / Baixo risco","Rastreamento de câncer colorretal","Climatério e Terapia Hormonal","Neurologia","Cuidados paliativos e analgesia","Urgências Pediátricas"],
};

const TEMA = "Cirurgia";

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
