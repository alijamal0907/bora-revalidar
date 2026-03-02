import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const correcoes = [
  // === CRESCIMENTO E DESENVOLVIMENTO → outros temas ===
  // Epidemiologia (risco relativo, estudo observacional)
  { pk: "00704cc6-0b4a-49e7-acf0-3ce10389ef2e", tema: "Medicina Preventiva", subtema: "Epidemiologia" },
  // Clínica Médica - Endocrinologia (punção jugular, NPH)
  { pk: "e15f7e5b-c01b-4041-85db-5c5ad7ff0840", tema: "Clínica Médica", subtema: "Endocrinologia" },
  // Clínica Médica - Endocrinologia (DM tipo 1, mulher 21 anos)
  { pk: "de571f39-ea7c-49b4-86d2-4f4070b9656c", tema: "Clínica Médica", subtema: "Endocrinologia" },
  // Medicina Preventiva - Epidemiologia (teste DNA leprae, sensibilidade)
  { pk: "5cd43730-a4db-4da0-9386-3241a99b34fe", tema: "Medicina Preventiva", subtema: "Epidemiologia" },
  // Cirurgia - Abdome (dor anal, plicoma sentinela, fissura anal)
  { pk: "56f332d6-456c-4092-aa25-9ece92536f4e", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Medicina Preventiva - APS (reunião ESF, médico de família)
  { pk: "7e27925a-1830-4bea-9207-f554de572f61", tema: "Medicina Preventiva", subtema: "APS / Saúde da Família" },
  // Ginecologia - vesicorrafia, fístula vésico-vaginal
  { pk: "c45d22e6-53ae-411d-9bd7-dc95462df06a", tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" },
  // Clínica Médica - Pneumologia (carcinicultura, cal, sintomas respiratórios)
  { pk: "43a4b79a-8d05-4ee4-af7b-41e4e0942d18", tema: "Clínica Médica", subtema: "Pneumologia" },
  // Medicina Preventiva - APS (médico domiciliar, paciente 69 anos, hemiplegia)
  { pk: "cb1c5b43-7716-4b7b-959b-9978342b1e98", tema: "Medicina Preventiva", subtema: "APS / Saúde da Família" },
  // Cirurgia - Trauma (mulher 35 anos, acidente automobilístico)
  { pk: "d18a42b0-b5cf-4d9e-b215-2e6bde64fd95", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  // Clínica Médica - Oftalmologia (edema pálpebra, chalázio)
  { pk: "c565ece4-27e1-4e1b-839f-b9fc8f0da0f8", tema: "Clínica Médica", subtema: "Oftalmologia" },
  // Clínica Médica - Reumatologia (dor lombar irradiada, homem 36 anos)
  { pk: "935ad575-f054-4c3b-86bc-80ef46ce2cf4", tema: "Clínica Médica", subtema: "Reumatologia / Ortopedia" },
  // Cirurgia - Abdome (homem 69 anos, politrauma, fissura anal)
  { pk: "34dcf3e3-9315-4cfa-bc46-c8503ad4d8e0", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Cirurgia - Abdome (sangramento anal, 35 anos, indolor)
  { pk: "251e09ca-1264-4bff-bda1-53b116f84b75", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Medicina Preventiva - Políticas Públicas (PNPIC)
  { pk: "ed42dd34-7dfe-4a11-a192-fd65c58a4c4e", tema: "Medicina Preventiva", subtema: "Políticas Públicas de Saúde" },
  // Cirurgia - Trauma (acidente trânsito, colisão frontal, jovem 20 anos)
  { pk: "c69cad31-36ac-4367-8e40-997e9b465362", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  // Cirurgia - Abdome (adolescente 18 anos, pós-bariátrica, síndrome de dumping)
  { pk: "f69fb193-8e08-4e45-bfa6-776e7da52525", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Medicina Preventiva - APS (mulher 35 anos, profissional do sexo, COVID, ansiedade)
  { pk: "2c4ce480-fadc-495a-9f2b-34d3ac627b22", tema: "Medicina Preventiva", subtema: "APS / Saúde da Família" },
  // Cirurgia - Trauma (homem 30 anos, queimadura, churrasqueira)
  { pk: "a18f1b91-cc96-4142-a094-b378c6d2172f", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  // Medicina Preventiva - Ética Médica (internação involuntária)
  { pk: "a340f1ab-610a-41f5-8cfd-d53dc1f3271d", tema: "Medicina Preventiva", subtema: "Ética Médica / Bioética" },

  // === ENDOCRINOLOGIA / ADOLESCÊNCIA → outros temas/subtemas ===
  // Pediatria - Crescimento e Desenvolvimento (lactente 6 meses, puericultura)
  { pk: "fef0eecb-04df-48b5-90bc-bfc319552e1f", tema: "Pediatria", subtema: "Crescimento e Desenvolvimento" },
  // Pediatria - Neonatologia (RN 27 dias, primeira consulta)
  { pk: "f553576c-4cf5-4271-8251-e986ffba5af3", tema: "Pediatria", subtema: "Neonatologia" },
  // Pediatria - Hematologia Pediátrica (menino 5 anos, púrpura, manchas arroxeadas)
  { pk: "4add863a-c6f6-49a9-a2be-db0b330e3412", tema: "Pediatria", subtema: "Hematologia Pediátrica" },
  // Cirurgia - Trauma (politraumatismo, 25 anos)
  { pk: "aeb78ecc-3adf-452e-8503-6488f5178108", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  // Clínica Médica - Cardiologia (mulher 45 anos, edema MMII vespertino)
  { pk: "acb3168d-c3cf-4eaf-b32f-6898a9ce1b4c", tema: "Clínica Médica", subtema: "Cardiologia" },
  // Ginecologia - DIU
  { pk: "46f752a9-d37d-4204-a6db-5effb00a76ff", tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" },
  // Pediatria - Infectologia Pediátrica (pré-escolar 3 anos, edema, oligúria - síndrome nefrótica)
  { pk: "c99e6828-f73c-46bb-a4d9-52e69de18721", tema: "Pediatria", subtema: "Infectologia Pediátrica" },
  // Clínica Médica - Geriatria (mulher 86 anos, quedas, polifarmácia)
  { pk: "64df0d98-ea93-4586-94b5-079b3a0f3c57", tema: "Clínica Médica", subtema: "Geriatria" },
  // Clínica Médica - Reumatologia (mulher 52 anos, dores musculoesqueléticas crônicas)
  { pk: "eb6dabd3-2999-402e-bbce-3347a94a88da", tema: "Clínica Médica", subtema: "Reumatologia / Ortopedia" },
  // Clínica Médica - Pneumologia (paciente 54 anos, tosse, astenia)
  { pk: "64a4b96a-9255-4fe1-8236-0de4a4036e29", tema: "Clínica Médica", subtema: "Pneumologia" },
  // Ginecologia - caroço na mama
  { pk: "6e17a491-3499-41bb-acde-c8c45aa38ab6", tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" },
  // Pediatria - Infectologia Pediátrica (mãe, dois filhos, pré-escolares, 10 dias)
  { pk: "4502034f-cac9-4b4f-a93c-d27daf59f1d7", tema: "Pediatria", subtema: "Infectologia Pediátrica" },
  // Ginecologia - pós-op histerectomia, fístula
  { pk: "ec71efdd-7757-4e57-8a7b-176a484f1b23", tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" },
  // Cirurgia - Abdome (paciente 72 anos, tabagista, icterícia, tumor pâncreas)
  { pk: "8530bb50-29e8-4d13-b3cc-244a13bb2c03", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  // Ginecologia - prolapso uterino
  { pk: "92d7f49b-b21d-4a4c-ad1b-531f525c6384", tema: "Ginecologia e Obstetrícia", subtema: "Ginecologia Geral" },
]

let ok = 0, erros = 0
for (const c of correcoes) {
  const { error } = await supabase.from("questoes").update({ tema: c.tema, subtema: c.subtema }).eq("pk", c.pk)
  if (error) { console.error(`ERRO [${c.pk}]:`, error.message); erros++ }
  else ok++
}

console.log(`\nParte 1 concluída: ${ok} corrigidas, ${erros} erros`)
