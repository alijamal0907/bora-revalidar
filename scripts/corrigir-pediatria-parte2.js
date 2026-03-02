import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const correcoes = [
  // === HEMATOLOGIA / ONCOLOGIA PEDIÁTRICA → outros temas ===
  // Cirurgia - Oncologia (homem 31 anos, tumor testicular)
  { pk: "7c1f78fc-0f6e-46f3-b30f-78a8d943d073", tema: "Cirurgia", subtema: "Oncologia Cirúrgica" },
  // Clínica Médica - Reumatologia (mulher 46 anos, fibromialgia)
  { pk: "cbc52832-3a27-4e2d-bd3f-a621cb2f0201", tema: "Clínica Médica", subtema: "Reumatologia / Ortopedia" },
  // Clínica Médica - Infectologia (homem 52 anos, febre, leishmaniose)
  { pk: "af2da55a-7afb-4ebd-8e13-0107c40b1429", tema: "Clínica Médica", subtema: "Infectologia" },
  // Clínica Médica - Hematologia (homem 65 anos, lesões, baço, linfoma)
  { pk: "50f78a6e-5840-4bcb-aa74-41e99198de7e", tema: "Clínica Médica", subtema: "Hematologia" },
  // Cirurgia - Trauma (TCE leve)
  { pk: "e355de4c-38a1-46f8-8fd7-8bfd0cae72fb", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  // Medicina Preventiva - APS (rastreamento câncer próstata)
  { pk: "92473b5b-50ef-401c-b32f-747c24d44445", tema: "Medicina Preventiva", subtema: "APS / Saúde da Família" },
  // Cirurgia - Abdome (diverticulite complicada, abscesso)
  { pk: "ebe264cd-5181-4d34-b863-9d42271cfe81", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Clínica Médica - Pneumologia (tosse produtiva, expectoração verde)
  { pk: "a8beed6a-8604-44ec-a85f-b4a20c056d31", tema: "Clínica Médica", subtema: "Pneumologia" },
  // Ginecologia - pré-natal (primigesta 28 anos, COVID grave, óbito materno)
  { pk: "d43dca98-7e3d-42c3-9b10-2af333c7fb79", tema: "Ginecologia e Obstetrícia", subtema: "Pré-natal e Obstetrícia" },

  // === INFECTOLOGIA PEDIÁTRICA → outros temas ===
  // Clínica Médica - Infectologia (homem 23 anos, dengue)
  { pk: "a086eefb-aa14-413e-921b-b7764a33e486", tema: "Clínica Médica", subtema: "Infectologia" },
  // Ginecologia - pré-natal (primigesta 16 anos, RPM)
  { pk: "060380a0-229b-4fe8-a216-9cc0967f38e1", tema: "Ginecologia e Obstetrícia", subtema: "Pré-natal e Obstetrícia" },
  // Medicina Preventiva - APS (gestor, APS, transição modelo)
  { pk: "00066772-5753-4018-a3ac-e2e0d47e6067", tema: "Medicina Preventiva", subtema: "APS / Saúde da Família" },
  // Clínica Médica - Infectologia (transplantado renal, Legionella)
  { pk: "3bc05a25-eded-4e53-81a7-7b42ff8ae7be", tema: "Clínica Médica", subtema: "Infectologia" },

  // === NEONATOLOGIA → outros temas ===
  // Medicina Preventiva - APS (médico família, UBS, primeira semana)
  { pk: "3b5f4b53-e516-4d31-bda4-3226f16d73cf", tema: "Medicina Preventiva", subtema: "APS / Saúde da Família" },

  // === NEUROLOGIA PEDIÁTRICA → outros subtemas ===
  // Pediatria - Ortopedia (adolescente 13 anos, escoliose)
  { pk: "058594ae-04f2-4a57-8f0c-f99c9084efdc", tema: "Pediatria", subtema: "Ortopedia / Cirurgia Pediátrica" },
  // Pediatria - Imunizações (lactente 6 meses, sem BCG)
  { pk: "f3952e69-94e6-47b7-bbaa-a238068927ab", tema: "Pediatria", subtema: "Imunizações" },
  // Pediatria - Pneumologia Pediátrica (lactente 5 meses, rinorreia, bronquiolite)
  { pk: "90561456-4b71-4107-830c-e83d4e0e3798", tema: "Pediatria", subtema: "Pneumologia Pediátrica" },
  // Clínica Médica - Geriatria (paciente 74 anos, HAS, DM2, ILPI)
  { pk: "d5125715-94d4-42ac-b992-3adfe2985b2a", tema: "Clínica Médica", subtema: "Geriatria" },

  // === ORTOPEDIA / CIRURGIA PEDIÁTRICA → outros temas ===
  // Cirurgia - Abdome (paciente 60 anos, dor abdominal moderada)
  { pk: "1122029e-6993-4913-b307-1803e4881f79", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Clínica Médica - Pneumologia (homem 65 anos, dispneia, pneumonia)
  { pk: "dfbd5910-d760-4601-9d66-4bbd7280f5e4", tema: "Clínica Médica", subtema: "Pneumologia" },
  // Cirurgia - Abdome (abscesso periretal, homem diabético)
  { pk: "cc46678c-cd71-4347-b560-ca90691068ea", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Clínica Médica - Oftalmologia (pintor, cal nos olhos)
  { pk: "9e98bb81-0100-4336-9050-e382192ffe18", tema: "Clínica Médica", subtema: "Oftalmologia" },
  // Pediatria - Infectologia Pediátrica (dois filhos pré-escolares - duplicata)
  { pk: "8f4f457b-0123-4c19-aa89-6b20200c9609", tema: "Pediatria", subtema: "Infectologia Pediátrica" },
  // Medicina Preventiva - Políticas Públicas (PNAISP, sistema prisional)
  { pk: "07bea5d4-089a-4d1b-8d8c-5dcb0283397a", tema: "Medicina Preventiva", subtema: "Políticas Públicas de Saúde" },
  // Clínica Médica - Infectologia (usuário drogas, hepatite aguda)
  { pk: "70b1ee22-f12a-410a-86d7-8bb4b57e6441", tema: "Clínica Médica", subtema: "Infectologia" },
  // Cirurgia - Abdome (colonoscopia, pólipos)
  { pk: "0103f31f-69d6-414c-bd10-acf359bdc397", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Cirurgia - Abdome (pós-op gastroduodenopancreatectomia)
  { pk: "100d3b73-ed92-4739-95d2-891e2f7c01f3", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Cirurgia - Abdome (colecistectomia laparoscópica)
  { pk: "6bae6135-ed99-43a1-9d07-a4b1025720ed", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Clínica Médica - Neurologia (cefaleia unilateral pulsátil, migrânea)
  { pk: "473e529b-0ae9-45da-bea6-fcde468dddea", tema: "Clínica Médica", subtema: "Neurologia" },
  // Clínica Médica - Pneumologia (derrame pleural, 58 anos)
  { pk: "fb607126-fd83-42c2-b2ee-7801bc46cb41", tema: "Clínica Médica", subtema: "Pneumologia" },
  // Clínica Médica - Nefrologia/Urologia (mulher 25 anos, ITU)
  { pk: "01e5d1fc-dea7-422a-9131-cd1c167e6470", tema: "Clínica Médica", subtema: "Nefrologia / Urologia" },
  // Clínica Médica - Neurologia (Parkinson, 65 anos)
  { pk: "30cdde89-d8be-4a54-a031-b1a0140c2d0d", tema: "Clínica Médica", subtema: "Neurologia" },
  // Cirurgia - Trauma (atropelamento, homem 28 anos)
  { pk: "65522e06-5611-48d0-801e-218d0b393701", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  // Cirurgia - Abdome (apendicite, dor FID)
  { pk: "ea233f41-8268-40da-9697-97ebc7667bb3", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Clínica Médica - Endocrinologia (DM1, úlcera plantar)
  { pk: "1a4f6ee6-df52-4752-8c8d-0d335555aa91", tema: "Clínica Médica", subtema: "Endocrinologia" },
  // Clínica Médica - Endocrinologia (nódulo no pescoço, tireóide)
  { pk: "1b991efb-c110-44f0-88e8-91c28e4ade14", tema: "Clínica Médica", subtema: "Endocrinologia" },
  // Clínica Médica - Nefrologia/Urologia (homem 72 anos, dor lombar)
  { pk: "58e110e1-3b4d-4467-9e48-34eddd693e34", tema: "Clínica Médica", subtema: "Nefrologia / Urologia" },
  // Clínica Médica - Pneumologia (DPOC, FA, 68 anos)
  { pk: "8ded2af0-1577-4e79-a99d-e8dc561546e4", tema: "Clínica Médica", subtema: "Pneumologia" },
  // Cirurgia - Abdome (fístula perianal)
  { pk: "5bdd3f20-efaf-486a-89b4-22abe410aa16", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Cirurgia - Abdome (diverticulite, homem 55 anos)
  { pk: "326c9b7e-abf4-4313-819e-2034fb997d63", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },

  // === URGÊNCIAS PEDIÁTRICAS → outros temas ===
  // Clínica Médica - Neurologia (mulher 37 anos, rebaixamento consciência)
  { pk: "e1717d7a-12c1-4a5c-8605-4919cce0cd9c", tema: "Clínica Médica", subtema: "Neurologia" },
  // Cirurgia - Abdome (isquemia mesentérica, 63 anos UTI)
  { pk: "c0ea3205-12da-4710-9ed7-db8f09f178c4", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Clínica Médica - Hematologia (anemia, fadiga, 64 anos)
  { pk: "c94bed45-af25-4380-82c5-fdf74ba37eff", tema: "Clínica Médica", subtema: "Hematologia" },
  // Clínica Médica - Infectologia (lesão vulvar, sífilis)
  { pk: "8f410b72-f0fa-4a90-82a6-1c179d098b09", tema: "Clínica Médica", subtema: "Infectologia" },
  // Cirurgia - Trauma (mulher 26 anos, atropelamento)
  { pk: "1823dfc8-9d37-4442-81bd-ff3c0dc87940", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  // Clínica Médica - Infectologia (48 anos, tosse 2 meses, tuberculose)
  { pk: "68060117-f233-4bcb-9728-dcb44e7a0690", tema: "Clínica Médica", subtema: "Infectologia" },
  // Clínica Médica - Pneumologia (DPOC, 59 anos)
  { pk: "ab02958c-6ffb-4ac7-b0fb-d612db11ba5f", tema: "Clínica Médica", subtema: "Pneumologia" },
  // Clínica Médica - Oncologia/Hematologia (câncer próstata, TVP)
  { pk: "ddb459ad-b2a9-4087-8e4b-e0605a32fbba", tema: "Clínica Médica", subtema: "Oncologia / Hematologia" },
  // Clínica Médica - Infectologia (homem 24 anos, tosse, febre)
  { pk: "cec7e448-40ee-4803-b823-ada8aad6d71f", tema: "Clínica Médica", subtema: "Infectologia" },

  // === PSIQUIATRIA / COMPORTAMENTO → outros temas ===
  // Ginecologia - SOP, sangramento genital adolescente
  { pk: "a0981aa2-dead-4f17-a8fd-0eee47b9883c", tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" },
  // Clínica Médica - Cardiologia (83 anos, IAM, cardiopata)
  { pk: "38f28f1d-55fc-4bb5-ae57-47f1680ae513", tema: "Clínica Médica", subtema: "Cardiologia" },
  // Clínica Médica - Psiquiatria (diazepam 25 anos, dependência)
  { pk: "27f3eb45-a754-4b3b-8788-fccdf38aad01", tema: "Clínica Médica", subtema: "Psiquiatria" },
  // Pediatria - Neonatologia (RN 38 sem, icterícia neonatal)
  { pk: "e1ca8a6b-406a-477a-8110-6c8bbba90489", tema: "Pediatria", subtema: "Neonatologia" },
]

let ok = 0, erros = 0
for (const c of correcoes) {
  const { error } = await supabase.from("questoes").update({ tema: c.tema, subtema: c.subtema }).eq("pk", c.pk)
  if (error) { console.error(`ERRO [${c.pk}]:`, error.message); erros++ }
  else ok++
}

console.log(`\nParte 2 concluída: ${ok} corrigidas, ${erros} erros`)
