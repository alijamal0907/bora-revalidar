import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Mapeamento: valor bruto (lowercase sem acento) → subtema padronizado
// Organizado por tema para evitar conflitos

const MAPA_SUBTEMAS = {
  // ─── CLÍNICA MÉDICA ───────────────────────────────────────────────────────
  "Clínica Médica": {
    "Cardiologia": [
      "cardiologia", "Cardiologia", "Cardiologia / Infarto agudo do miocárdio",
      "Insuficiência cardíaca", "Hipertensão arterial", "Crise hipertensiva x reação ansiosa (pseudo-urgência)",
      "Estenose aórtica grave sintomática", "Trombose venosa profunda; diagnóstico com USG Doppler",
      "Distúrbios ácido-básicos", "Distúrbios ácido-base",
    ],
    "Pneumologia": [
      "Pneumologia", "Asma aguda / crise moderada-grave", "Pneumonia adquirida na comunidade / derrame pleural parapneumônico",
      "TB pulmonar pós-primária; cavitação em ápice, sintomas B", "Pneumonia atípica",
      "Pneumologia / Tuberculose pulmonar pós-primária", "Pneumologia / Exposição ocupacional ao amianto",
      "Trauma torácico / complicação da intubação",
    ],
    "Infectologia": [
      "Infectologia", "Infectologia / Coinfecção HIV-Tuberculose", "HIV/AIDS e tuberculose / coinfecção",
      "HIV/TB", "Tuberculose em paciente com HIV", "Tuberculose pulmonar; manejo após teste rápido molecular",
      "Meningite tuberculosa", "Sífilis primária: diagnóstico e tratamento",
      "Infecções virais emergentes; artrite crônica pós-chikungunya", "Doenças virais",
      "Nefrologia / Infectologia / Infecção urinária baixa",
    ],
    "Gastroenterologia": [
      "Gastroenterologia", "gastroenterologia", "doenças das vias biliares – colangite aguda",
      "Hepatologia / Ascite / PBE", "Pancreatite crônica", "Doenças colestáticas (colangite esclerosante primária)",
      "Abdome agudo vascular",
    ],
    "Endocrinologia": [
      "Endocrinologia", "Endocrinologia / Nódulo tireoidiano", "Glicemia de jejum alterada em gestante – DM gestacional",
      "Insuficiência ovariana / diagnóstico hormonal", "Doença de Parkinson",
    ],
    "Nefrologia": [
      "Nefrologia", "Doenças glomerulares", "Síndrome nefrótica", "Doença renal crônica avançada e indicação de diálise",
      "Nefrologia / IRA por rabdomiólise",
    ],
    "Neurologia": [
      "Neurologia", "Neurologia / cefaleia", "Cefaleia primária", "Traumatismo cranioencefálico",
      "Transtornos de ansiedade / ataque de pânico", "Transtornos de ansiedade", "Neurologia / Hipertensão Intracraniana",
      "Efeitos extrapiramidais", "Síndrome da cauda equina", "Lombociatalgia aguda sem déficit neurológico grave",
      "Lombalgia mecânico-postural",
    ],
    "Reumatologia": [
      "reumatologia", "Reumatologia", "Doenças reumatológicas", "Artrite reumatoide",
      "Fibromialgia – manejo medicamentoso de manutenção", "Reumatologia / esclerose sistêmica – acometimento esofágico",
    ],
    "Oncologia / Hematologia": [
      "Oncologia / câncer de próstata / estadiamento", "Hematologia / anemias hemolíticas",
      "Câncer de próstata e escore de Gleason", "Oncologia / câncer colorretal", "Hemoglobinopatias",
      "Onco-hematologia / Neutropenia febril", "Mieloma múltiplo", "Oncologia",
    ],
    "Ginecologia / Obstetrícia (intercorrências clínicas)": [
      "Insuficiência ovariana / diagnóstico hormonal", "Rastreamento de câncer de colo uterino / HSIL",
      "pré-natal", "Pré-natal", "Aleitamento materno", "Trabalho de parto pré-termo / Fatores de risco",
      "Puerpério / Mastite", "Prevenção de parto prematuro", "Dequitação placentária",
      "Sífilis na gestação; acompanhamento com VDRL seriado", "Infecções na gestação (toxoplasmose)",
      "Gravidez ectópica / tratamento", "Hemorragia pós-parto e manejo medicamentoso",
      "Descolamento prematuro de placenta", "Candidíase vaginal recorrente na gestação; terapêutica tópica prolongada",
      "Planejamento familiar / critérios de elegibilidade OMS", "Obstetrícia",
      "Doença inflamatória cervical", "Medicina legal obstétrica",
      "Cisto ovariano funcional", "Doenças benignas da mama", "Contracepção", "Planejamento Familiar",
      "Infecções Ginecológicas",
    ],
    "Psiquiatria": [
      "Psiquiatria", "Transtornos alimentares", "Bioética",
      "Delirium pós-operatório; sepse pulmonar em idoso", "Políticas Públicas de Saúde",
    ],
    "Pediatria / Emergências": [
      "Urgências Pediátricas", "Emergências pediátricas", "Estenose hipertrófica de piloro",
      "Puberdade e desenvolvimento sexual",
    ],
  },

  // ─── GINECOLOGIA E OBSTETRÍCIA ────────────────────────────────────────────
  "Ginecologia e Obstetrícia": {
    "Pré-natal e Obstetrícia": [
      "Pré-natal", "pré-natal", "Sangramento no primeiro trimestre", "Isoimunização Rh e profilaxia com imunoglobulina anti-D",
      "Diabetes gestacional", "Hipertensão na gestação / pré-natal", "Atenção pré-natal / calendário de consultas",
      "sífilis gestacional – falha terapêutica", "Sífilis na gestação", "Toxoplasmose na gestação",
      "Infecção por COVID-19 na gestação e isolamento", "Gestação inicial e isoimunização",
      "Hiperglicemia na gestação precoce; DM prévio diagnosticado na gestação",
      "HIV na gestação / Indicação de cesariana", "Obstetrícia / HIV na gestação / Indicação de cesariana",
      "Gestação ectópica", "Dor pélvica aguda / gestação ectópica",
      "Abortamento", "Infertilidade / Avaliação inicial do casal",
      "Pré-natal de baixo risco; exames laboratoriais do 1º trimestre",
      "Gestação / Infecção urinária", "infecção urinária na gestação",
      "Obstetrícia / Infecções sexualmente transmissíveis na gestação", "Obstetrícia",
    ],
    "Ginecologia Geral": [
      "Endometriose", "Endometriose em adolescente com dismenorreia secundária",
      "Amenorreia primária", "sangramento uterino anormal na adolescência – exclusão de gravidez",
      "Ginecologia / Sangramento uterino anormal na adolescência", "Doença inflamatória pélvica aguda",
      "Ginecologia / vaginite por Trichomonas", "Sangramento uterino anormal e investigação endometrial",
      "Distúrbios menstruais na adolescência", "Sangramento uterino anormal agudo",
      "Planejamento familiar e enxaqueca com aura", "Planejamento reprodutivo / HIV e contracepção",
      "Planejamento familiar / interação medicamentosa (anticonvulsivante)",
    ],
    "IST / Infecções Ginecológicas": [
      "IST / sífilis / manejo em contato sexual", "infecção urinária na gestação",
      "Doença inflamatória pélvica aguda", "Rastreamento do câncer de colo uterino / conduta frente a LSIL",
      "Rastreamento de câncer de colo / lesão de alto grau", "Rastreamento do câncer de colo uterino com achado de ASC-US",
    ],
    "Oncologia Ginecológica": [
      "Oncoginecologia / tumor de ovário", "Nódulo mamário em mulher jovem",
      "Rastreamento do câncer de colo uterino com achado de ASC-US",
      "Oncologia Ginecológica", "Dermatologia oncológica",
    ],
    "Endocrinologia Reprodutiva": [
      "Endocrinologia Ginecológica", "Endocrinologia / hiperparatiroidismo primário", "Endocrinologia",
      "Doença autoimune – lúpus",
    ],
    "Clínica Geral / Intercorrências": [
      "Gastroenterologia", "Dermatologia oncológica",
    ],
  },

  // ─── PEDIATRIA ────────────────────────────────────────────────────────────
  "Pediatria": {
    "Neonatologia": [
      "Neonatologia", "Icterícia neonatal; hiperbilirrubinemia precoce; indicação de fototerapia",
      "Icterícia neonatal grave / Exsanguineotransfusão", "Icterícia neonatal",
      "Hipoglicemia neonatal", "Reanimação neonatal em prematuro tardio; contato pele a pele e aquecimento",
      "Reanimação neonatal", "Sífilis congênita; investigação completa e início de tratamento",
      "Dermatoses neonatais; eritema tóxico neonatal", "Desconforto respiratório em RN tardio pré-termo",
      "Doença respiratória do recém-nascido; fatores de risco",
    ],
    "Crescimento e Desenvolvimento": [
      "Crescimento e Desenvolvimento", "Nutrição / crescimento infantil",
      "Puericultura; alimentação complementar; aleitamento materno",
      "Baixa estatura; padrão familiar; avaliação de crescimento",
      "Síndrome de Down", "Síndrome de Turner / puberdade / dermatite de contato",
      "Desenvolvimento infantil / Transtorno do espectro autista",
      "Neurodesenvolvimento / Transtorno do Espectro Autista",
      "Transtornos de Aprendizagem", "Puberdade normal; orientação em amenorreia fisiológica inicial",
      "Puberdade e desenvolvimento sexual",
    ],
    "Infectologia Pediátrica": [
      "Infectologia Pediátrica", "RN de 25 dias com ITU febril – conduta",
      "Convulsão febril; acompanhamento longitudinal na APS", "Convulsão febril",
      "Mononucleose infecciosa associada à síndrome de Guillain-Barré",
      "Parotidite infecciosa / complicações abdominais", "Doenças exantemáticas / Doença de Kawasaki",
      "Larva migrans em pré-escolares", "Parasitose intestinal – Trichuris trichiura",
      "Febre reumática aguda", "Pneumonia comunitária pediátrica",
      "Pneumonia com derrame pleural; necessidade de toracocentese", "Derrame pleural / empiema",
      "Derrame pleural", "Sepse pediátrica", "Sepse",
      "Infecção urinária / diagnóstico", "Infecção urinária recorrente – cicatriz renal (DMSA)",
      "Infecção do trato urinário na infância",
    ],
    "Imunizações": [
      "Imunizações", "imunizações – varicela/tetraviral",
      "Imunizações / Calendário vacinal aos 15-18 meses",
      "Calendário vacinal 15-18 meses; tríplice viral + varicela (tetraviral) em atraso",
      "Calendário vacinal infantil / 6 meses",
      "Calendário vacinal infantil; esquema de sarampo após dose precoce",
      "Calendário vacinal",
    ],
    "Urgências Pediátricas": [
      "Urgências Pediátricas", "Urgências Clínicas", "Estado de mal epiléptico em criança",
      "Neurologia pediátrica / estado de mal epiléptico",
      "Status epilepticus em criança; escalonamento terapêutico",
      "Queimaduras", "Queimadura – regra dos 9", "Intoxicações",
      "Intoxicações medicamentosas na infância; efeito anticolinérgico de anti-histamínico",
      "Suporte avançado de vida em pediatria", "Desidratação / IRA pré-renal",
      "Desidratação infantil / Terapia de reidratação venosa",
    ],
    "Gastroenterologia Pediátrica": [
      "Gastroenterologia Pediátrica", "Constipação / Doença de Hirschsprung",
      "Gastroenterologia / Obstrução intestinal por ascaridíase", "Gastroenterologia",
    ],
    "Hematologia / Oncologia Pediátrica": [
      "Hematologia pediátrica / Anemia falciforme", "Anemia carencial",
      "Oncologia pediátrica / Tumor de Wilms", "Oncologia pediátrica; neuroblastoma",
      "Púrpura trombocitopênica imune na infância; conduta expectante inicial",
      "Púrpura trombocitopênica imune", "Hematologia pediátrica", "Oncologia",
    ],
    "Ortopedia / Cirurgia Pediátrica": [
      "Ortopedia pediátrica / epifisiólise", "artrite séptica em criança",
      "Artrite séptica em criança; imagem e punção articular",
      "Politrauma com febre e dor em quadril – suspeita de artrite séptica",
      "Cirurgia pediátrica; hérnia inguinal indireta; correção eletiva precoce",
      "Cirurgia pediátrica / hérnia inguinal", "Abdome Agudo",
    ],
    "Pneumologia Pediátrica": [
      "asma – classificação de controle e tratamento de manutenção", "Asma / crise e manutenção",
    ],
    "Neurologia Pediátrica": [
      "Neurologia", "Síndrome de Wernicke", "Fraqueza em MMII – investigação",
      "Hipertensão intracraniana",
    ],
    "Endocrinologia Ginecológica / Adolescência": [
      "Endocrinologia Ginecológica", "Planejamento Familiar", "Planejamento Familiar / DIU",
      "Síndrome nefrótica na infância; corticoterapia", "Nefrologia",
      "Sangramento uterino disfuncional na adolescência; ciclos anovulatórios",
      "Distúrbios de diferenciação sexual", "Amenorreia primária / agenesia mülleriana (síndrome de MRKH)",
      "Endocrinologia Reprodutiva / SOP",
    ],
    "Psiquiatria / Comportamento": [
      "Psiquiatria", "Transtornos do comportamento", "Uso crônico de benzodiazepínicos",
      "Geriatria",
    ],
    "Outros Pediátricos": [
      "Maus-tratos na infância / síndrome do bebê sacudido",
      "Violência sexual e profilaxia de hepatite B",
      "Cardiopatias congênitas cianóticas / TGA",
      "Oncologia urológica; tumor de testículo", "Tumor de testículo",
      "Manchas espumosas na conjuntiva – xeroftalmia", "Lesão ocular química",
      "Síndrome geniturinária da menopausa / atrofia vaginal",
      "Climatério / Terapia hormonal", "Mioma uterino / leiomioma",
      "Violência sexual – profilaxia de IST não virais",
      "Abortamento em evolução – manejo", "Herpes genital na gestação; tratamento e profilaxia no fim da gestação",
      "Pré-natal de alto risco", "Dermatologia / Hanseníase",
      "Oncologia Ginecológica / Tumor de Ovário", "ASC-US em citologia – conduta",
      "Pré-eclâmpsia sem sinais de gravidade – conduta inicial",
      "Rotura prematura de membranas a termo",
      "Pré-eclâmpsia; critérios de gravidade e internação",
      "Hemorragia pós-parto / Ácido tranexâmico", "Hemorragia pós-parto",
      "Câncer de mama; estadiamento linfonodal; prognóstico",
      "TCE leve conduta", "Nódulo tireoidiano suspeito em jovem; US + PAAF",
      "Calendário vacinal 15-18 meses; tríplice viral + varicela (tetraviral) em atraso",
      "Sífilis congênita", "Nódulo renal", "Diverticulite complicada",
      "Infecção urinária / diagnóstico", "Oncologia",
      "Reumatologia / Vasculites", "Derrame pleural",
      "Trauma urológico / Fratura de pelve",
      "Gestação / Infecção urinária",
      "Pós-operatório Cirúrgico", "Icterícia neonatal",
      "Abscesso anorretal; drenagem cirúrgica",
      "Síndrome do intestino irritável",
      "Ética médica / comunicação de más notícias",
      "Urologia / Câncer de Pênis",
      "Distúrbios ácido-base / gasometria",
      "Hiperglicemia na gestação precoce; DM prévio diagnosticado na gestação",
      "Complicações do Diabetes",
      "Políticas Públicas de Saúde", "Terapia Intensiva",
      "Indicadores epidemiológicos",
      "(sem subtema)",
    ],
  },

  // ─── MEDICINA PREVENTIVA ──────────────────────────────────────────────────
  "Medicina Preventiva": {
    "Atenção Primária à Saúde (APS)": [
      "Atenção Primária à Saúde (APS)", "Atenção primária / rolha de cerume",
      "Atenção primária / PNAB / territorialização", "Territorialização APS",
      "Territorialização e organização da APS", "Atenção Primária / Territorialização",
      "Organização da APS", "APS e saúde suplementar", "Saúde suplementar / APS",
      "Atenção básica / Saúde da criança / ACS",
      "Atenção primária; projeto terapêutico singular; adesão ao tratamento",
      "Gestão em saúde / Planejamento na APS",
      "Promoção da saúde / Entrevista motivacional",
      "Saúde do trabalhador APS", "Saúde do adolescente / Ética e confidencialidade",
      "Saúde da população LGBTQIA+ / políticas públicas",
      "Atenção primária / competência cultural",
      "Controle social em saúde; participação comunitária na ESF",
      "Saúde coletiva / ESF / COVID-19",
      "saúde mental na APS e projeto terapêutico singular",
      "Saúde Mental na APS", "luto e manejo de benzodiazepínicos na APS",
      "Insônia / práticas integrativas", "PNPIC",
      "Políticas de saúde / PICS",
    ],
    "Políticas Públicas de Saúde": [
      "Políticas Públicas de Saúde", "Níveis de atenção e prevenção", "Níveis de atenção",
      "Controle social / participação social", "Conselhos de saúde / controle social",
      "Conselho municipal de saúde e pacientes ostomizados",
      "Lei 8.142 / Transferências", "Princípios doutrinários do SUS – equidade",
      "Controle social em saúde; participação comunitária na ESF",
      "Saúde indígena", "Saúde indígena; intervenção comunitária; alcoolismo",
      "Saúde indígena / organização do subsistema",
      "Saúde da população LGBTQIA+ / políticas públicas",
      "Educação popular em saúde; adolescentes; violência",
      "Planejamento reprodutivo; direitos sexuais e reprodutivos na APS",
      "Determinantes sociais de saúde / diarreia infantil",
    ],
    "Epidemiologia": [
      "Epidemiologia", "Epidemiologia – mortalidade proporcional e causas externas",
      "Rastreamento em atenção primária", "Rastreamento", "Rastreamento e decisão compartilhada",
      "Rastreamento de câncer de mama", "Rastreamento / Câncer de Mama",
      "Rastreamento do câncer do colo uterino", "Rastreamento de câncer colorretal em adultos assintomáticos",
      "Rastreamento de câncer colorretal", "Rastreamento – câncer de próstata em idoso",
      "Mortalidade materna; classificação de causa indireta",
      "Saúde da criança / Mortalidade infantil",
      "Indicadores epidemiológicos", "Epidemiologia / Testes Diagnósticos",
    ],
    "Infectologia / Vigilância Epidemiológica": [
      "Infectologia", "Infectologia Pediátrica", "Vigilância Epidemiológica",
      "Tuberculose", "Tuberculose / Tratamento diretamente observado",
      "HIV e IST", "Coinfecção HIV/tuberculose",
      "Arboviroses; suspeita de dengue; manejo e notificação",
      "Doenças transmitidas por vetores / Chikungunya",
      "Doenças Infecciosas / Dengue", "Dengue e arboviroses",
      "Dengue – prova do laço", "Doenças infecciosas – Arboviroses",
      "Malária – diagnóstico e conduta", "Febre amarela / vigilância e prevenção",
      "Cólera – vigilância", "Esquistossomose hepatoesplênica",
      "Doenças endêmicas / esquistossomose / controle",
      "Colonização por germes multirresistentes; precaução de contato",
      "Morador de rua com tosse e cefaleia – investigação de tuberculose",
      "Morador de rua com tosse – prioridade BAAR",
      "HIV com TB pulmonar; TRM-TB + cultura + TSA",
      "Micoses subcutâneas; esporotricose linfocutânea",
      "Impetigo bolhoso", "Tinea corporis com zoonose; confirmação micológica e terbinafina sistêmica",
      "Biossegurança na COVID-19; EPIs para procedimentos geradores de aerossol",
      "COVID-19 / EPIs", "COVID-19",
      "Protocolo de manejo da COVID-19 / Fast-track síndrome gripal",
      "Saúde coletiva / ESF / COVID-19",
    ],
    "Saúde da Mulher / Pré-natal": [
      "Pré-natal", "saúde da mulher",
      "Toxoplasmose na gestação", "Infecções congênitas",
      "Distúrbios Tireoidianos na Gestação",
      "Imunizações / Vacinação na gestação (influenza e dTpa)",
      "PA 150×100 + proteinúria 350 mg/24h – pré-eclâmpsia",
      "Gestação de alto risco / prevenção de pré-eclâmpsia",
      "Gestação de alto risco; trombofilia hereditária; anticoagulação plena",
      "Gestação após cirurgia bariátrica; intervalo entre cirurgia e concepção",
      "Gestante; vacina influenza anual e dTpa a cada gestação",
      "Hipertensão na Gestação", "Hipertensão na gestação / Pré-eclâmpsia",
      "Depressão pós-parto", "Hemorragia pós-parto / atonia uterina", "Hemorragia pós-parto",
      "Hemorragias Obstétricas", "Infecção puerperal pós-cesariana",
      "Sangramento pós-menopausa", "Sangramento pós-menopausa / pólipo endocervical",
      "Sangramento uterino pós-menopausa", "Climatério – terapia hormonal",
      "Dor pélvica crônica e hematoquezia cíclica – endometriose profunda",
      "Massa anexial complexa; critérios de risco para malignidade",
      "Rastreamento do câncer de colo uterino; AGC; conduta",
      "Oncologia Ginecológica", "Doença Inflamatória Pélvica",
      "Tricomoníase vaginal; diagnóstico em exame a fresco",
      "Sífilis gestacional / sífilis secundária",
      "Infecções na gestação; sorologia para toxoplasmose; infecção pregressa",
      "Doenças exantemáticas na gestação",
      "Infertilidade após laqueadura; investigar casal antes de recanalização",
      "Planejamento reprodutivo; contracepção de emergência; ética médica",
      "Prevenção de parto prematuro; progesterona em gestante com história prévia",
      "HIV na gestação com carga viral detectável; cesárea eletiva + AZT EV",
      "Diabetes gestacional (TOTG)", "Diabetes mellitus gestacional; manejo na APS e encaminhamento",
      "Glicemia alterada na gestação – diabetes gestacional",
      "Gestação a termo – cardiotocografia reativa e conduta",
      "Leopold – apresentação fetal", "Gestação prolongada", "Gestação prolongada e bem-estar fetal",
      "Avaliação da dinâmica uterina no trabalho de parto", "Rotura prematura de membranas a termo",
      "Pré-natal / Infecção Perinatal", "Restrição de crescimento fetal; doppler alterado; indicação de interrupção",
      "Obstetrícia / Parto Vaginal", "Obstetrícia",
      "Hiperglicemia na gestação precoce; DM prévio diagnosticado na gestação",
      "Miomas uterinos", "Contracepção em doenças trombóticas",
      "Planejamento Familiar", "Dispareunia; causas orgânicas e psicossociais",
    ],
    "Saúde da Criança / Pediatria": [
      "Urgências Pediátricas", "Febre na infância",
      "Triagem neonatal para cardiopatias congênitas", "Neonatologia",
      "Reanimação neonatal", "Reanimação neonatal em prematuro tardio; contato pele a pele e aquecimento",
      "Dermatoses benignas do recém-nascido", "Dermatoses neonatais; eritema tóxico neonatal",
      "Desconforto respiratório em RN tardio pré-termo",
      "Teste do coraçãozinho; diferença >3% entre pré e pós-ductal é alterada",
      "Triagem neonatal; teste do coraçãozinho; interpretação da oximetria",
      "Massa abdominal em lactente; tumor de Wilms", "CAD em criança; edema cerebral tratado com manitol",
      "Endocrinologia / Cetoacidose diabética",
      "Avaliação nutricional infantil; escore-z peso para idade",
      "Desenvolvimento infantil", "Imunizações / Recusa vacinal e ECA",
      "Imunizações / Esquema de vacinação em atraso", "Imunizações / Meningite meningocócica",
      "Criança imunossuprimida – calendário vacinal",
      "Calendário vacinal infantil; esquema de sarampo após dose precoce",
      "Calendário vacinal infantil / 6 meses", "Calendário vacinal",
      "Violência contra crianças e adolescentes", "Violência sexual infantil",
      "Maus-tratos na infância / síndrome do bebê sacudido",
      "RN febril de 25 dias com bacteriúria – ITU febril",
      "Infecção do trato urinário na infância",
      "Saúde do Adolescente", "Educação em saúde; hesitação vacinal; abordagem centrada na pessoa",
      "Doenças Respiratórias / Bronquiolite", "Laringite estridulosa / crupe viral",
      "Suboclusão intestinal por Ascaris; SNG + óleo mineral",
      "Constipação intestinal funcional", "Constipação",
      "Desidratação e diarreia aguda", "Diarreia crônica com muco e sangue – doença inflamatória intestinal",
      "Estenose hipertrófica de piloro", "Estenose hipertrófica de piloro; confirmação ultrassonográfica",
      "Cirurgia pediátrica – cisto do ducto tireoglosso",
      "Hematologia pediátrica", "Risco de traço falciforme em RN",
      "Sífilis congênita",
    ],
    "Saúde Mental": [
      "Saúde Mental na APS", "Saúde mental", "Saúde mental e legislação",
      "Transtornos Depressivos e Ansiosos", "Psiquiatria / Transtorno de ansiedade generalizada",
      "Transtornos Relacionados ao Álcool", "Uso de álcool – AUDIT 22",
      "Estratégia efetiva para cessação do tabagismo na UBS",
      "Tabagismo – Tratamento", "Saúde do idoso / Sobrecarga do cuidador",
      "Saúde do idoso – sobrecarga do cuidador (Escala de Zarit)",
      "Bioética / Saúde da Pessoa Idosa",
    ],
    "Gastroenterologia": [
      "Gastroenterologia", "Colelitíase sintomática / colecistectomia eletiva",
      "Abdome agudo / pancreatite", "Doenças anorretais", "Fissura anal",
      "Doença colorretal", "Doenças inflamatórias intestinais; retocolite ulcerativa; corticoterapia inicial",
      "Doença inflamatória intestinal – retocolite ulcerativa",
      "Dor em FIE e diarreia sanguinolenta – retocolite ulcerativa",
      "Gastroenterologia / Doença Inflamatória Intestinal",
      "Gastroenterologia / Síndrome do intestino irritável",
      "Gastroenterologia / Doença do refluxo gastroesofágico",
      "Hepatite viral aguda", "Hepatite aguda viral; pródromos sistêmicos e fase ictérica",
      "Isquemia mesentérica aguda / Diagnóstico",
      "Icterícia obstrutiva; tumor de cabeça de pâncreas",
      "Icterícia colestática + dor em barra + perda de peso; neoplasia de pâncreas",
      "Câncer de esôfago cervical avançado / cuidado paliativo",
      "Câncer de esôfago avançado; paliação da disfagia com prótese",
      "Disfagia crônica / Doença de Chagas",
      "Gastroenterologia / Vias Biliares",
      "Rastreamento de câncer colorretal em adultos assintomáticos",
      "Rastreamento de câncer colorretal",
      "Coloproctologia – câncer colorretal esporádico",
    ],
    "Hematologia": [
      "Hematologia", "Trombofilias", "Doença tromboembólica venosa – TVP de MMII",
      "Hematologia – anemia megaloblástica por deficiência de B12 (anemia perniciosa)",
      "Anemia carencial",
    ],
    "Pneumologia": [
      "Pneumologia", "DPOC",
      "Pneumologia / Tuberculose", "Pneumologia / Nódulo Pulmonar Solitário",
      "Nódulo pulmonar sólido 18 mm", "Asbestose em trabalhador da construção civil",
      "PCR em DPOC – pneumotórax hipertensivo durante RCP",
      "Pneumonia atípica", "Neoplasia pulmonar; pneumonia pós-obstrutiva; derrame pleural",
      "Derrame pleural; achados radiológicos",
    ],
    "Endocrinologia": [
      "Endocrinologia", "Diabetes mellitus tipo 2", "Diabetes mellitus tipo 1 / seguimento crônico",
      "Diabetes tipo 1 / Nefropatia incipiente",
      "Nódulo tireoidiano de baixo risco; acompanhamento clínico/imagem",
      "Hipotireoidismo subclínico", "Doença de Graves",
      "Depressão x hipotireoidismo – diagnóstico diferencial",
      "Transtornos do movimento; doença de Parkinson", "Emergências Endócrinas",
    ],
    "Cardiologia": [
      "Cardiologia", "Cardiologia / Crises Hipertensivas",
      "Cardiologia / Cardiopatias Congênitas",
      "Hipertensão arterial sistêmica; doença renal crônica; IECA/BRA",
      "Neurologia – AVC isquêmico agudo (trombólise)", "AVC isquêmico",
      "Prevenção secundária pós-AVC", "Emergência hipertensiva / dor torácica",
      "Crise hipertensiva grave com encefalopatia – manejo imediato",
      "Arritmias cardíacas", "Suporte Básico de Vida",
    ],
    "Saúde do Idoso": [
      "Saúde do idoso / IVCF-20", "Saúde do idoso / Sobrecarga do cuidador",
      "Saúde do idoso – sobrecarga do cuidador (Escala de Zarit)",
      "Bioética / Saúde da Pessoa Idosa", "Geriatria",
    ],
    "Nefrologia": [
      "Nefrologia", "Pielonefrite complicada",
      "Infecção do trato urinário", "ITU baixa não complicada em mulher jovem; cistite aguda",
      "Nefrologia / Síndrome nefrótica lúpica",
      "Nefrologia / peritonite associada à diálise peritoneal",
      "Doença renal crônica; complicações iniciais da hemodiálise",
    ],
    "Reumatologia": [
      "Reumatologia", "Reumatologia / Artrite gotosa x séptica",
      "Espondiloartrites", "Dor lombar / Sinais de alarme neurológicos",
      "Radiculopatia – ciatalgia", "Entorse de tornozelo sem critérios de Ottawa; imobilização + AINE",
      "Déficit em extensão de joelho após trauma – nível medular",
      "Déficit motor em MI – identificação de nível L3", "Ortopedia infecciosa",
      "Artrite séptica", "Infecção Osteoarticular",
    ],
    "Ética Médica": [
      "Ética / prontuário médico / responsabilidade", "Ética e sigilo médico",
      "Ética médica / sigilo em aplicativos",
      "Ética médica; sigilo profissional; discussão de casos em grupos eletrônicos",
      "Ética médica; sigilo e proteção em situação de risco para adolescente",
      "Atestado de óbito – causa básica e contribuintes",
      "Violência contra a mulher / notificação", "Violência e Vulnerabilidades",
    ],
    "Urgências / Trauma": [
      "Urgências Clínicas", "Urgências Pediátricas",
      "Emergências – acidentes por animais peçonhentos (crotálico)",
      "Choque obstrutivo e monitorização hemodinâmica",
      "Trauma torácico", "Trauma Torácico",
      "Trauma (ATLS)", "Trauma e Reanimação",
      "Sepse / pneumonia aspirativa / suporte hemodinâmico",
      "Intoxicação por agrotóxicos", "Saúde ambiental em áreas ribeirinhas; acidentes com arraias em águas rasas",
      "Saúde ambiental / intoxicação por mercúrio", "Saúde ambiental / agravos por animais aquáticos",
      "Queimadura elétrica de alta voltagem; conduta inicial e encaminhamento",
      "Tungíase", "Trauma Ocular Químico", "Queimadura química ocular",
    ],
    "Dermatologia": [
      "Alergia e Imunologia / Reações a Drogas", "Reações cutâneas graves a fármacos; farmacodermia",
      "Dermatite de contato ocupacional; látex; mãos", "Alergia medicamentosa / Urticária",
      "Dermatologia / Atopia", "Unidade de saúde", "Unha encravada; técnica de cantoplastia com tentacânula",
    ],
    "Segurança do Paciente": [
      "Segurança do Paciente", "Segurança cirúrgica", "Antibioticoprofilaxia Cirúrgica",
      "Cirurgia Hepatobiliar", "Hérnias da parede abdominal / Pré-operatório",
      "Febre no 1º dia pós-operatório",
      "Complicações pós-operatórias / abscesso intra-abdominal",
      "Complicações pós-operatórias / Infecção intra-abdominal",
    ],
    "Outros": [
      "Oftalmologia; calázio", "Oftalmologia / calázio",
      "Alergia e Imunologia / Reações a Drogas",
      "Adesão ao tratamento / projeto terapêutico",
      "Deficiência intelectual / Síndrome genética",
      "Genética / Síndromes Congênitas", "Neurologia",
      "Urologia", "Urologia pediátrica", "Urologia / Neoplasias",
      "Urologia; hematúria macroscópica; neoplasia de bexiga",
      "Tumores ósseos", "Neoplasias ósseas – Osteossarcoma",
      "Doenças virais", "Emergências metabólicas",
      "Vacinas em adultos e idosos", "(sem subtema)",
    ],
  },

  // ─── CIRURGIA ─────────────────────────────────────────────────────────────
  "Cirurgia": {
    "Trauma / ATLS": [
      "Trauma (ATLS)", "trauma", "Trauma torácico", "Trauma de mão",
      "Trauma cranioencefálico", "Trauma raquimedular cervical", "Trauma hepático",
      "Trauma urológico", "Trauma de uretra",
      "Trauma hepático contuso; manejo não operatório em paciente estável",
      "Trauma e Reanimação", "Queimaduras", "queimaduras",
      "Queimaduras / critério de encaminhamento",
      "Lesão ocular por flash de solda; conduta inicial com irrigação",
      "Embolia gasosa / acesso venoso central",
      "Acesso venoso profundo; punção arterial inadvertida; conduta imediata",
      "Ortopedia / Entorse de tornozelo",
      "Corpo estranho perfurante em partes moles (anzol)",
      "Escoliose / Avaliação inicial",
      "Lombalgia recorrente em adolescente; anemia falciforme; vértebra em H",
      "Lombalgia", "Síndrome da cauda equina",
      "Déficit em extensão de joelho após trauma – nível medular",
    ],
    "Pós-operatório / Complicações Cirúrgicas": [
      "Pós-operatório Cirúrgico", "Complicações pós-bariátrica",
      "infecção de ferida", "Infecção de ferida",
      "Feridas / técnica de sutura", "Feridas / classificação",
      "Distúrbios Hidroeletrolíticos", "Distúrbios eletrolíticos / Hipocalcemia",
      "Febre no 1º dia pós-operatório", "Delirium pós-operatório; sepse pulmonar em idoso",
      "Segurança cirúrgica", "Antibioticoprofilaxia Cirúrgica",
      "Cirurgia ginecológica / antibioticoprofilaxia",
      "Profilaxia antibiótica em histerectomia; cirurgia limpa-contaminada",
      "Cirurgia ambulatorial / Cantoplastia por unha encravada",
      "Tratamento cirúrgico da unha encravada (onicocriptose)",
    ],
    "Abdome Agudo / Cirurgia Digestiva": [
      "Abdome Agudo", "abdome agudo",
      "Abdome agudo obstrutivo; hérnia femoral encarcerada",
      "Hérnias", "Hérnia umbilical / antibioticoprofilaxia",
      "Cirurgia pediátrica; hérnia inguinal indireta; correção eletiva precoce",
      "Gastroenterologia", "Gastroenterologia – Hemorragia digestiva alta",
      "Hemorragia digestiva alta", "Hemorragia digestiva alta por úlcera péptica",
      "Sepse biliar", "Pielonefrite obstrutiva / Sepse",
      "Fístula perianal", "doenças anorretais – fístula perianal",
      "Abscesso perianal em diabético", "Abscesso anorretal; drenagem cirúrgica",
      "Coloproctologia", "Cirurgia do aparelho digestivo / Câncer de pâncreas",
      "Icterícia obstrutiva / neoplasia de cabeça de pâncreas",
      "Icterícia colestática",
      "Diverticulite complicada", "Doença diverticular – diverticulite aguda complicada (TC)",
    ],
    "Oncologia Cirúrgica": [
      "Urologia oncológica", "Linfoma de Hodgkin / diagnóstico",
      "Câncer colorretal / investigação", "nódulo de tireoide – Bethesda IV",
      "Mastologia / Rastreamento do câncer de mama",
      "Neoplasia pulmonar; pneumonia pós-obstrutiva; derrame pleural",
      "Oncologia Ginecológica / Colo Uterino",
    ],
    "Urgências Clínicas / Outros": [
      "Urgências Clínicas",
      "Hepatologia – hepatite B aguda",
      "Dengue", "Dengue / classificação de gravidade",
      "Epidemiologia", "Vigilância Epidemiológica",
      "Violência e Vulnerabilidades", "Violência interpessoal", "Violência sexual – conduta",
      "Endocrinologia", "Endocrinologia / Hipertireoidismo",
      "Pneumologia", "Pneumologia Pediátrica",
      "Pneumonia bacteriana / derrame pleural",
      "Intoxicações pediátricas", "Intoxicação exógena / ingestão de desinfetante",
      "Toxicologia / Intoxicação por organofosforados",
      "Malária",
      "Infectologia", "Infectologia Pediátrica",
      "Hematologia", "Sangramento uterino anormal e investigação endometrial",
      "Puberdade e ciclo menstrual",
      "Pré-natal", "Infecções na gestação", "Infecções na gestação / infecção urinária na gestação",
      "Restrição de crescimento fetal; doppler alterado; indicação de interrupção",
      "DPPNI e pré-eclâmpsia grave", "Sífilis na gestação; tratamento com penicilina G benzatina",
      "Fórceps – requisitos", "Neonatologia",
      "Crescimento e Desenvolvimento",
      "Suporte avançado de vida em pediatria",
      "Desidratação infantil / Terapia de reidratação venosa",
      "Acidente vascular cerebral isquêmico agudo; trombólise venosa",
      "IAM inferior com infarto de ventrículo direito; uso inadequado de nitrato",
      "Crise hipertensiva com encefalopatia – manejo imediato",
      "Migrânea com aura", "DIU de cobre",
      "Síndrome dolorosa crônica; fibromialgia",
      "Cirurgia bariátrica / Indicações",
      "HIV em mulher jovem; dupla proteção com método hormonal + preservativo",
      "Doenças Reumáticas / Vasculites (Kawasaki)",
      "TDAH", "Saúde Mental na APS", "Terapia Intensiva",
      "Atenção Primária à Saúde (APS)",
      "Oftalmologia / Trauma ocular por luz ultravioleta",
      "Genética – Síndrome de Down",
      "Rastreamento de câncer de mama / Baixo risco",
      "Rastreamento de câncer colorretal", "Climatério e Terapia Hormonal",
      "Neurologia",
      "Cuidados paliativos e analgesia",
      "Urgências Pediátricas",
      "(sem subtema)",
    ],
  },
};

async function padronizarSubtemas() {
  let totalAtualizados = 0;

  for (const [tema, categorias] of Object.entries(MAPA_SUBTEMAS)) {
    console.log(`\nProcessando tema: ${tema}`);

    for (const [subtemaFinal, valoresBrutos] of Object.entries(categorias)) {
      for (const valorBruto of valoresBrutos) {
        if (valorBruto === subtemaFinal) continue; // já está correto

        const { data, error } = await supabase
          .from("questoes")
          .update({ subtema: subtemaFinal })
          .eq("tema", tema)
          .eq("subtema", valorBruto)
          .select("id");

        if (error) {
          console.error(`  ERRO ao atualizar "${valorBruto}" → "${subtemaFinal}": ${error.message}`);
        } else if (data && data.length > 0) {
          console.log(`  [${data.length}] "${valorBruto}" → "${subtemaFinal}"`);
          totalAtualizados += data.length;
        }
      }
    }
  }

  console.log(`\n=== TOTAL DE REGISTROS ATUALIZADOS: ${totalAtualizados} ===\n`);

  // Relatório final por tema e subtema
  for (const tema of Object.keys(MAPA_SUBTEMAS)) {
    const { data, error } = await supabase
      .from("questoes")
      .select("subtema")
      .eq("tema", tema);

    if (error) { console.error(error.message); continue; }

    const cont = {};
    for (const row of data) {
      const s = row.subtema || "(sem subtema)";
      cont[s] = (cont[s] || 0) + 1;
    }

    const ord = Object.entries(cont).sort((a, b) => b[1] - a[1]);
    console.log(`\n=== ${tema} — ${data.length} questoes ===`);
    for (const [s, q] of ord) {
      console.log(`  [${q}] ${s}`);
    }
  }
}

padronizarSubtemas();
