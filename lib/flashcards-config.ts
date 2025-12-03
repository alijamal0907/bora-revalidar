// Configuração dos temas de flashcards por matéria

export const MATERIAS = [
  "Clínica Médica",
  "Clínica Cirúrgica",
  "Ginecologia",
  "Obstetrícia",
  "Pediatria",
  "Medicina Preventiva",
] as const

export type Materia = (typeof MATERIAS)[number]

export const TEMAS_POR_MATERIA: Record<Materia, string[]> = {
  "Clínica Médica": [
    "Doenças cardiovasculares (IAM, ICC, Arritmias, HAS)",
    "Diabetes e emergências metabólicas (CAD, EHH)",
    "Doenças pulmonares (asma, DPOC, TEP, pneumonia)",
    "Doenças gastrointestinais (DRGE, hepatites, pancreatite, hemorragia digestiva)",
    "Insuficiência renal aguda e crônica",
    "Distúrbios hidroeletrolíticos (hipo/hipernatremia, hipo/hipercalemia)",
    "Doenças infecciosas (HIV, sífilis, meningite, TB)",
    "Doenças hematológicas (anemias, púrpuras, leucemias)",
    "Reumatologia (AR, lupus, gota, espondiloartropatias)",
    "Emergências clínicas (sepses, choque, intoxicações)",
  ],
  "Clínica Cirúrgica": [
    "Abdômen agudo (apendicite, colecistite, obstrução, pancreatite)",
    "Trauma (ABCDE, TCE, trauma abdominal)",
    "Doenças vasculares (isquemia aguda, trombose, aneurisma de aorta)",
    "Hérnias (inguinal, femoral, encarceramento, estrangulamento)",
    "Infecções cirúrgicas",
    "Queimaduras (classificação e conduta inicial)",
    "Oncologia cirúrgica",
    "Doenças anorretais (hemorroidas, fissuras, abscessos)",
  ],
  Ginecologia: [
    "Anticoncepção (incluindo DIU, pílula, emergência e contraindicações)",
    "Climatério e reposição hormonal",
    "Infecções ginecológicas (vaginose, candidíase, DIP)",
    "Câncer ginecológico (colo, ovário, endométrio, mama — especialmente rastreio)",
    "Dor pélvica crônica e endometriose",
    "Miomas uterinos (tipos, sintomas, tratamento)",
    "Sangramento uterino anormal",
  ],
  Obstetrícia: [
    "Pré-natal de baixo e alto risco (consultas, exames, calendário vacinal)",
    "Infecções na gestação (sífilis, HIV, hepatites, toxoplasmose, Zika)",
    "Doença hipertensiva específica da gestação (PIG, eclâmpsia, pré-eclâmpsia)",
    "Trabalho de parto e condução",
    "Hemorragias do 1º e 2º/3º trimestre (DPP, placenta prévia, abortamento)",
    "Parto normal, fórcipe e cesárea – indicações",
    "Puerpério e complicações (hemorragia pós-parto, infecções)",
    "Sofrimento fetal agudo / cardiotocografia",
  ],
  Pediatria: [
    "Puericultura e curva de crescimento",
    "Vacinas (PNI) e contraindicações",
    "Doenças exantemáticas (sarampo, rubéola, roséola, varicela)",
    "IRA / Doenças respiratórias (asma, bronquiolite, pneumonia)",
    "Diarreia aguda e desidratação (Plano A/B/C)",
    "Meningites (viral, bacteriana)",
    "Doenças do período neonatal (icterícia, sepse, Apgar)",
    "Cardiopatias congênitas mais comuns",
    "Crises convulsivas / epilepsia pediátrica",
    "Desnutrição e obesidade",
  ],
  "Medicina Preventiva": [
    "Epidemiologia básica (sensibilidade, especificidade, VPP/ VPN)",
    "Estudos epidemiológicos (coorte, caso-controle, transversal)",
    "Rastreamento (câncer de colo, mama, próstata, DM, HAS)",
    "Políticas públicas de saúde (SUS)",
    "Vigilância sanitária, epidemiológica e ambiental",
    "Imunizações e calendário vacinal",
    "Indicadores de saúde (mortalidade, incidência, prevalência)",
    "Saúde da família e atenção primária",
    "Planejamento em saúde / gestão",
    "Bioestatística aplicada (IC, p-valor, testes estatísticos básicos)",
  ],
}

export const MATERIA_ICONS: Record<Materia, string> = {
  "Clínica Médica": "❤️",
  "Clínica Cirúrgica": "🔪",
  Ginecologia: "🩺",
  Obstetrícia: "👶",
  Pediatria: "🧒",
  "Medicina Preventiva": "🏥",
}

export const MATERIA_DESCRIPTIONS: Record<Materia, string> = {
  "Clínica Médica": "Doenças cardiovasculares, pulmonares, renais, infecciosas e mais",
  "Clínica Cirúrgica": "Abdômen agudo, trauma, vascular, hérnias e procedimentos cirúrgicos",
  Ginecologia: "Saúde da mulher, anticoncepção, DSTs, climatério e patologias ginecológicas",
  Obstetrícia: "Pré-natal, parto, puerpério, gestação de alto risco e complicações",
  Pediatria: "Puericultura, vacinas, doenças da infância e adolescência",
  "Medicina Preventiva": "Epidemiologia, SUS, políticas públicas e saúde coletiva",
}
