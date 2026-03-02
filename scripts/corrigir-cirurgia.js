import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Mapeamento completo: pk → { tema, subtema } corretos
// Baseado na análise clínica de cada enunciado
const correcoes = [

  // ── SUBTEMA "Cirurgia" (genérico) → reclassificar ──────────────────────────
  // Queimadura elétrica → Trauma / ATLS
  { pk: '32eef345-5abf-41fb-8a51-e17b07912298', tema: 'Cirurgia', subtema: 'Trauma / ATLS' },
  // Anestesia local em criança → Pós-operatório / Complicações Cirúrgicas (técnica anestésica)
  { pk: '338d91ac-0fa7-460e-9878-a23515c3e8bc', tema: 'Cirurgia', subtema: 'Feridas / Técnica Cirúrgica' },

  // ── SUBTEMA "Cirurgia do Abdome" → Abdome Agudo / Cirurgia Digestiva ────────
  // Hérnia incisional → Abdome Agudo / Cirurgia Digestiva
  { pk: '525b6b07-10da-4d6d-bfe0-a165b4e72aa9', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },

  // ── SUBTEMA "Oncologia Cirúrgica" → erros ──────────────────────────────────
  // LSIL no Papanicolaou → Ginecologia e Obstetrícia > Ginecologia Geral
  { pk: 'f123a628-d2cd-4cec-8f00-793b5e696e84', tema: 'Ginecologia e Obstetrícia', subtema: 'Ginecologia Geral' },
  // Doença diverticular + gastrectomia prévia CA gástrico → Abdome Agudo / Cirurgia Digestiva
  { pk: 'a437a28a-0ee1-4d45-8f14-d9101d4f6eb9', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // Tabagista, escarro purulento, hemoptise → Clínica Médica > Pneumologia
  { pk: '9a92eea4-d250-4b01-88a7-016c17a5c8e3', tema: 'Clínica Médica', subtema: 'Pneumologia' },
  // Retardo mental, intoxicação colinérgica (fasciculações, incontinência) → Clínica Médica > Neurologia
  { pk: 'b7f37ddf-03d3-4058-8bb5-ceb733996d5c', tema: 'Clínica Médica', subtema: 'Neurologia' },
  // Cuidados paliativos CA próstata metastático → Clínica Médica > Oncologia / Cuidados Paliativos
  { pk: '4333565c-2d41-4307-b18f-961c7ee38c09', tema: 'Clínica Médica', subtema: 'Oncologia / Cuidados Paliativos' },
  // Pré-escolar 3 anos, manchas na conjuntiva (manchas de Bitot) → Pediatria > Saúde da Criança
  { pk: '395aec6e-c66b-496c-a9ff-7eeac952d19b', tema: 'Pediatria', subtema: 'Saúde da Criança' },

  // ── SUBTEMA "Pós-operatório / Complicações Cirúrgicas" → erros ─────────────
  // Hipertensão com estado confusional → Clínica Médica > Cardiologia
  { pk: 'ba2b7d2f-fd81-4c49-acdc-298ebc943267', tema: 'Clínica Médica', subtema: 'Cardiologia' },
  // Tremor, irritabilidade, perda de peso, aumento cervical, exoftalmo → Clínica Médica > Endocrinologia
  { pk: '11332531-b926-4a7c-83ef-615dad3b344d', tema: 'Clínica Médica', subtema: 'Endocrinologia' },
  // Tremor de repouso, dificuldade de levantar, Parkinson → Clínica Médica > Neurologia
  { pk: '8fec2a18-3823-4d5d-a09a-52155248ea4c', tema: 'Clínica Médica', subtema: 'Neurologia' },
  // Onicocriptose → Feridas / Técnica Cirúrgica
  { pk: '1960fc7c-a0bf-4cc6-9fe1-9e682c7d0346', tema: 'Cirurgia', subtema: 'Feridas / Técnica Cirúrgica' },
  // Retirada de pontos → Feridas / Técnica Cirúrgica
  { pk: 'c22f0d5e-4d8f-44a8-afe2-23c1bf40c2ec', tema: 'Cirurgia', subtema: 'Feridas / Técnica Cirúrgica' },
  // Quimioprofilaxia malária → Medicina Preventiva > Imunizações e Vigilância Epidemiológica
  { pk: '299f4f55-a5f3-4a4e-a313-e386c3a18e09', tema: 'Medicina Preventiva', subtema: 'Imunizações e Vigilância Epidemiológica' },
  // Hérnia incisional suprapúbica pós-nefrectomia → Abdome Agudo / Cirurgia Digestiva
  { pk: '1866d6dc-145f-432b-a170-3281a0300c23', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // Anestesia local criança (duplicata) → Feridas / Técnica Cirúrgica
  { pk: '3fd23eaf-f991-41d0-9f3f-0faada170209', tema: 'Cirurgia', subtema: 'Feridas / Técnica Cirúrgica' },
  // Dor lombar noturna, imunossuprimido, perda de peso → Clínica Médica > Reumatologia / Ortopedia
  { pk: 'fbae5930-8743-423c-ba1b-2377fd7010b1', tema: 'Clínica Médica', subtema: 'Reumatologia' },
  // Lesão verrucosa em glande → Clínica Médica > Infectologia (HPV peniano)
  { pk: 'c947d2fa-3698-4774-a88a-e69af6fdacde', tema: 'Clínica Médica', subtema: 'Infectologia' },
  // Dores generalizadas, dificuldade de dormir, sem medicação → Clínica Médica > Reumatologia (fibromialgia)
  { pk: '25538223-f071-4b1f-97ca-a81ea2b7b7c9', tema: 'Clínica Médica', subtema: 'Reumatologia' },

  // ── SUBTEMA "Trauma / ATLS" → erros ────────────────────────────────────────
  // Dispneia aos esforços, comunicação interventricular → Clínica Médica > Cardiologia
  { pk: '667868ec-d0f2-47ad-9b62-deb4766405de', tema: 'Clínica Médica', subtema: 'Cardiologia' },
  // Dengue em escolar 7 anos → Pediatria > Infectologia Pediátrica
  { pk: 'cddca0dd-2e75-43ed-9aa7-31bec2996657', tema: 'Pediatria', subtema: 'Infectologia Pediátrica' },
  // Dengue em escolar 7 anos (duplicata) → Pediatria > Infectologia Pediátrica
  { pk: '2ec67948-c671-445e-97be-46c539801483', tema: 'Pediatria', subtema: 'Infectologia Pediátrica' },
  // Sepse de origem pulmonar em UTI → Clínica Médica > Infectologia
  { pk: 'df9de829-b2f8-4768-a8ed-70df431197ce', tema: 'Clínica Médica', subtema: 'Infectologia' },
  // Criador de porcos, lesões nos pés (leptospirose/larva migrans) → Clínica Médica > Infectologia
  { pk: 'f8b9f79a-9ac4-4c31-a979-b85e1e3aac6d', tema: 'Clínica Médica', subtema: 'Infectologia' },
  // Entorse de tornozelo → Ortopedia e Traumatologia
  { pk: 'aa03118e-5bb7-496d-8e23-1274eca0e207', tema: 'Cirurgia', subtema: 'Ortopedia e Traumatologia' },
  // Anemia macrocítica + leucopenia + plaquetopenia (anemia megaloblástica) → Clínica Médica > Hematologia
  { pk: '71a4b175-11e8-45c6-afe7-883bf50b2203', tema: 'Clínica Médica', subtema: 'Hematologia' },
  // Colapso súbito pré-escolar cianótico → Pediatria > Urgências Pediátricas
  { pk: '467bbdef-94b5-460c-a0a7-e0e8d9e34f26', tema: 'Pediatria', subtema: 'Urgências Pediátricas' },
  // Colangite grave hipotensão → Abdome Agudo / Cirurgia Digestiva
  { pk: 'ee98b194-9ea7-4001-ae90-eca175521e5d', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // Gestão municipal de saúde, APS, saúde da família → Medicina Preventiva > Atenção Primária à Saúde (APS)
  { pk: 'a7ad3daa-ec87-4e66-a3ee-70a6bbdb108d', tema: 'Medicina Preventiva', subtema: 'Atenção Primária à Saúde (APS)' },
  // Pielonefrite com nefrolitíase → Clínica Médica > Nefrologia / Urologia
  { pk: 'c729d83c-8605-403e-80ee-e205e95198ea', tema: 'Clínica Médica', subtema: 'Nefrologia' },
  // Comunidade ribeirinha + barragem = esquistossomose → Medicina Preventiva > Imunizações e Vigilância Epidemiológica
  { pk: 'b8451adb-a21f-45df-a120-da3e834efdbd', tema: 'Medicina Preventiva', subtema: 'Imunizações e Vigilância Epidemiológica' },
  // Ferimento corte em quirodáctilo (tendão flexor?) → Feridas / Técnica Cirúrgica
  { pk: '5218ef2e-9eb2-4885-9349-adcbbd17c345', tema: 'Cirurgia', subtema: 'Feridas / Técnica Cirúrgica' },
  // Comunidade ribeirinha (duplicata) → Medicina Preventiva > Imunizações
  { pk: 'e25cd380-9c47-47c8-890b-d9a2c965dbfc', tema: 'Medicina Preventiva', subtema: 'Imunizações e Vigilância Epidemiológica' },
  // TCE leve → Trauma / ATLS (já correto) → manter; mulher bateu cabeça → Trauma / ATLS OK
  // Ostomizados, bolsas de colostomia, gestão SUS → Medicina Preventiva > Políticas Públicas de Saúde
  { pk: '8efac8b4-cebf-420e-9ca7-ec32f83b4544', tema: 'Medicina Preventiva', subtema: 'Políticas Públicas de Saúde' },
  // TVP (trombose venosa profunda) politraumatizado acamado → Clínica Médica > Cardiologia
  { pk: 'd3b31a60-1843-454e-b223-231b57a8caa1', tema: 'Clínica Médica', subtema: 'Cardiologia' },
  // Dor torácica + dispneia + alteração de consciência → Clínica Médica > Cardiologia
  { pk: '6f153177-9c0c-42e1-853a-4261bdcfa543', tema: 'Clínica Médica', subtema: 'Cardiologia' },
  // Dor lombar esquerda, idoso, trabalhador rural (cólica nefrética ou CA rim) → Clínica Médica > Nefrologia
  { pk: 'f83d5524-2ec0-4a2c-b875-6bc0c3ef3acb', tema: 'Clínica Médica', subtema: 'Nefrologia' },
  // Rastreamento CA mama, mamografia, INCA → Medicina Preventiva > Políticas Públicas de Saúde
  { pk: 'a64632a2-31cc-4a03-ad9e-14390e7a6584', tema: 'Medicina Preventiva', subtema: 'Políticas Públicas de Saúde' },
  // Obeso, tabagista, hipertenso 6 anos, mudança estilo de vida → Medicina Preventiva > Atenção Primária à Saúde (APS)
  { pk: 'bbb24e4b-7c4b-4cb6-a32e-0199b45c5da7', tema: 'Medicina Preventiva', subtema: 'Atenção Primária à Saúde (APS)' },
  // Lombalgia inflamatória crônica, HLA-B27 (espondilite anquilosante) → Clínica Médica > Reumatologia
  { pk: '3d355a27-7ca1-4a5c-8204-10a65ae486d3', tema: 'Clínica Médica', subtema: 'Reumatologia' },
  // Lei 8142/1990 SUS → Medicina Preventiva > Políticas Públicas de Saúde
  { pk: '28622cb4-f8ef-4685-a72e-b43c852ff01f', tema: 'Medicina Preventiva', subtema: 'Políticas Públicas de Saúde' },
  // TVP em membro inferior proximal (coxa) → Clínica Médica > Cardiologia
  { pk: 'f10ac9a3-0a30-4a05-bf35-e5e94a8a1d55', tema: 'Clínica Médica', subtema: 'Cardiologia' },
  // Depressão + sertralina (psiquiatria) → Clínica Médica > Psiquiatria
  { pk: '0ac8e8e2-f8d2-4efc-b143-d32c99f0ff32', tema: 'Clínica Médica', subtema: 'Psiquiatria' },
  // Menino 2 anos, ingestão de desinfetante → Pediatria > Urgências Pediátricas
  { pk: '30e69dfa-a528-49d1-9559-ef3d4ca52fb1', tema: 'Pediatria', subtema: 'Urgências Pediátricas' },
  // Hérnia inguinal irredutível, obstrução → Abdome Agudo / Cirurgia Digestiva
  { pk: '587b7993-648b-4b90-b2f0-ac7a9e545a51', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // Choque elétrico → Trauma / ATLS
  { pk: '02e538e0-0c8a-45e8-9110-e25ec6b415da', tema: 'Cirurgia', subtema: 'Trauma / ATLS' },
  // Dor abdominal irradiando para dorso + emagrecimento → Abdome Agudo / Cirurgia Digestiva (aneurisma aorta ou CA pâncreas)
  { pk: 'e03f7340-b790-4c8a-ae66-66a17ff37cde', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // TDAH em escolar → Pediatria > Saúde da Criança
  { pk: 'efdc90ef-4a5e-43a9-9e1d-466c55de79da', tema: 'Pediatria', subtema: 'Saúde da Criança' },
  // Menino 5 anos com febre, náusea, vômito → Pediatria > Urgências Pediátricas
  { pk: '02bb9704-c736-465e-8b3d-6a7f5fdbc6fc', tema: 'Pediatria', subtema: 'Urgências Pediátricas' },
  // Idoso acamado, demência avançada, rebaixamento e febre = sepse → Clínica Médica > Infectologia
  { pk: 'f9a89fb0-92d2-418e-b029-77964b593796', tema: 'Clínica Médica', subtema: 'Infectologia' },
  // Palpitações, taquicardia paroxística → Clínica Médica > Cardiologia
  { pk: '9239f8cf-070e-48e4-be70-8284e0ebef07', tema: 'Clínica Médica', subtema: 'Cardiologia' },

  // ── SUBTEMA "Urgências Clínicas / Outros" → reclassificar ──────────────────
  // Lombalgia adolescente 15 anos → Clínica Médica > Reumatologia
  { pk: 'e191f539-ae72-4aea-a2ad-c715dc343213', tema: 'Clínica Médica', subtema: 'Reumatologia' },
  // SIADH, CA pulmão pequenas células, Na 108 → Clínica Médica > Pneumologia
  { pk: '3a6db966-0847-44e5-9d33-25e603651c8c', tema: 'Clínica Médica', subtema: 'Pneumologia' },
  // Queimadura regra dos 9 → Trauma / ATLS
  { pk: 'dee71021-cfbd-48fa-bbb4-10bfe632d155', tema: 'Cirurgia', subtema: 'Trauma / ATLS' },
  // Úlcera péptica Forrest Ia, hematêmese, ressangramento → Abdome Agudo / Cirurgia Digestiva
  { pk: 'e018e2e8-9fea-446f-8162-32cfcf268958', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // Hematêmese + melena, úlcera péptica → Abdome Agudo / Cirurgia Digestiva
  { pk: 'd4a8ff43-d15c-45a2-b0e7-0937925a1c0c', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // Sangramento nas fezes + alteração hábito intestinal (CA colorretal) → Oncologia Cirúrgica
  { pk: 'fbacc46b-d922-43f6-8774-805fef7dc105', tema: 'Cirurgia', subtema: 'Oncologia Cirúrgica' },
  // Anemia falciforme, politransfundido, crise álgica, escolar 9 anos → Pediatria > Hematologia Pediátrica
  { pk: '86825439-6ff2-48f0-8f06-b045fd20b30e', tema: 'Pediatria', subtema: 'Hematologia Pediátrica' },
  // Dor em fossa ilíaca direita mulher 20 anos → Abdome Agudo / Cirurgia Digestiva (apendicite)
  { pk: '592a93cc-0f54-40c6-8ec1-ca6b6f58885d', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // Trauma abdominal, escoriações → Trauma / ATLS
  { pk: 'de348ad0-4d37-4def-ab3a-60eb98956017', tema: 'Cirurgia', subtema: 'Trauma / ATLS' },
  // Violência doméstica, feridas recentes → Medicina Preventiva > Atenção Primária à Saúde (APS)
  { pk: 'de439195-4fe0-4ba4-9803-bea8cfab3662', tema: 'Medicina Preventiva', subtema: 'Atenção Primária à Saúde (APS)' },
  // Queimadura 3º grau MS+MI adulto → Trauma / ATLS
  { pk: '372315eb-ea51-4f5b-bc5a-0860d0a01997', tema: 'Cirurgia', subtema: 'Trauma / ATLS' },
  // Menino 6 anos, diarreia, sem esgoto → Pediatria > Infectologia Pediátrica
  { pk: 'c8766b14-5ef3-4536-8fea-866c707e1fa1', tema: 'Pediatria', subtema: 'Infectologia Pediátrica' },
  // Colelitíase, colangite, dor HD + febre + icterícia → Abdome Agudo / Cirurgia Digestiva
  { pk: '8c89cef8-e9cc-436d-8101-3df9837119b6', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // Mulher 68 anos tabagista, CA pulmão, referenciada para cirurgia → Oncologia Cirúrgica
  { pk: '16ad3658-1bfb-4887-aff5-c22cce233f4e', tema: 'Cirurgia', subtema: 'Oncologia Cirúrgica' },
  // DRGE, IBP, esôfago de Barret → Abdome Agudo / Cirurgia Digestiva
  { pk: '0c1fd427-b605-494a-94a7-f6eee93b36e3', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // Hematêmese + melena → Abdome Agudo / Cirurgia Digestiva
  { pk: 'c4115abe-bf02-4754-b51a-90386dfdf476', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // Paracetamol em criança → Pediatria > Urgências Pediátricas
  { pk: '483ab47a-a004-4c34-999d-296915b979ff', tema: 'Pediatria', subtema: 'Urgências Pediátricas' },
  // Nódulo tireoidiano PAAF Bethesda IV → Clínica Médica > Endocrinologia
  { pk: '95ba0c67-4cbb-42ca-a138-8c2a1e8a20c7', tema: 'Clínica Médica', subtema: 'Endocrinologia' },
  // Abscesso perianal, fístula anal → Abdome Agudo / Cirurgia Digestiva
  { pk: 'c8c398fc-4da3-4b43-935a-69608dd58db5', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // Trauma pélvico com choque hemorrágico → Trauma / ATLS
  { pk: 'ea59ca3c-c209-4f14-adbb-c55831870534', tema: 'Cirurgia', subtema: 'Trauma / ATLS' },
  // Dor nos braços e costas, mulher 45 anos → Clínica Médica > Reumatologia
  { pk: '025f6d70-2147-4521-a09c-9683cf3de80f', tema: 'Clínica Médica', subtema: 'Reumatologia' },
  // Sertralina + ansiedade → Clínica Médica > Psiquiatria
  { pk: '08b47c68-4ccf-4324-9bbb-e4d668805e96', tema: 'Clínica Médica', subtema: 'Psiquiatria' },
  // Menino 12 meses, febre 6 dias, exantema (Kawasaki) → Pediatria > Urgências Pediátricas
  { pk: 'a5b4f2dc-ab3e-4092-bc24-a02fe0a27fa7', tema: 'Pediatria', subtema: 'Urgências Pediátricas' },
  // Mamografia BI-RADS 0 → Medicina Preventiva > Políticas Públicas de Saúde
  { pk: 'cef0af39-417d-4d9a-82a5-9ad9cd52bac8', tema: 'Medicina Preventiva', subtema: 'Políticas Públicas de Saúde' },
  // Pneumonia em jovem → Clínica Médica > Pneumologia
  { pk: 'ac688257-7bf7-4a7b-8b2f-3b8b5a3df284', tema: 'Clínica Médica', subtema: 'Pneumologia' },
  // Inquéritos populacionais de saúde → Medicina Preventiva > Epidemiologia
  { pk: '106aed5b-e191-4f96-a85f-8cc0e9f0b77c', tema: 'Medicina Preventiva', subtema: 'Epidemiologia' },
  // DIU de cobre → Ginecologia e Obstetrícia > Ginecologia Geral
  { pk: '6439d2e4-cab1-4360-9898-519135ae40bc', tema: 'Ginecologia e Obstetrícia', subtema: 'Ginecologia Geral' },
  // CA pulmão pequenas células, SIADH → Clínica Médica > Pneumologia
  { pk: '0e4189e7-5fdf-44cd-a143-7744f7c24e8a', tema: 'Clínica Médica', subtema: 'Pneumologia' },
  // Icterícia obstrutiva, CA pâncreas → Abdome Agudo / Cirurgia Digestiva
  { pk: 'd7cfa496-c298-4235-8199-ba0f4089d189', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // Violência sexual, contracepção de emergência → Ginecologia e Obstetrícia > Ginecologia Geral
  { pk: 'ca8844e3-5c75-4d77-86f2-b37693b7abd8', tema: 'Ginecologia e Obstetrícia', subtema: 'Ginecologia Geral' },
  // SARA pós-trauma → Clínica Médica > Pneumologia
  { pk: '351d61dd-c1c1-47d5-a52b-f73d8872381d', tema: 'Clínica Médica', subtema: 'Pneumologia' },
  // Hipertensão, trabalhador construção civil, dores musculares → Clínica Médica > Cardiologia
  { pk: '88d4be3c-2a6f-4202-a51a-753567f83bc5', tema: 'Clínica Médica', subtema: 'Cardiologia' },

  // ── SUBTEMA "Urologia" ─────────────────────────────────────────────────────
  // Aumento indolor do saco escrotal → tumor testicular → Oncologia Cirúrgica
  { pk: 'b897ffb0-9405-4fb3-ac67-1123a3862a56', tema: 'Cirurgia', subtema: 'Oncologia Cirúrgica' },
]

console.log(`Total de correções mapeadas: ${correcoes.length}`)

let sucesso = 0
let erros = 0

for (const c of correcoes) {
  const { error } = await supabase
    .from('questoes')
    .update({ tema: c.tema, subtema: c.subtema })
    .eq('pk', c.pk)

  if (error) {
    console.error(`ERRO pk=${c.pk}: ${error.message}`)
    erros++
  } else {
    sucesso++
  }
}

console.log(`\nResultado: ${sucesso} corrigidas, ${erros} erros`)
