import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const correcoes = [
  // "Cirurgia" genérico
  { pk: '32eef345-5abf-41fb-8a51-e17b07912298', tema: 'Cirurgia', subtema: 'Trauma / ATLS' },
  { pk: '338d91ac-0fa7-460e-9878-a23515c3e8bc', tema: 'Cirurgia', subtema: 'Feridas / Técnica Cirúrgica' },
  // "Cirurgia do Abdome"
  { pk: '525b6b07-10da-4d6d-bfe0-a165b4e72aa9', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  // "Oncologia Cirúrgica" erros
  { pk: 'f123a628-d2cd-4cec-8f00-793b5e696e84', tema: 'Ginecologia e Obstetrícia', subtema: 'Ginecologia Geral' },
  { pk: 'a437a28a-0ee1-4d45-8f14-d9101d4f6eb9', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: '9a92eea4-d250-4b01-88a7-016c17a5c8e3', tema: 'Clínica Médica', subtema: 'Pneumologia' },
  { pk: 'b7f37ddf-03d3-4058-8bb5-ceb733996d5c', tema: 'Clínica Médica', subtema: 'Neurologia' },
  { pk: '4333565c-2d41-4307-b18f-961c7ee38c09', tema: 'Clínica Médica', subtema: 'Oncologia / Cuidados Paliativos' },
  { pk: '395aec6e-c66b-496c-a9ff-7eeac952d19b', tema: 'Pediatria', subtema: 'Saúde da Criança' },
  // "Pós-operatório" erros
  { pk: 'ba2b7d2f-fd81-4c49-acdc-298ebc943267', tema: 'Clínica Médica', subtema: 'Cardiologia' },
  { pk: '11332531-b926-4a7c-83ef-615dad3b344d', tema: 'Clínica Médica', subtema: 'Endocrinologia' },
  { pk: '8fec2a18-3823-4d5d-a09a-52155248ea4c', tema: 'Clínica Médica', subtema: 'Neurologia' },
  { pk: '1960fc7c-a0bf-4cc6-9fe1-9e682c7d0346', tema: 'Cirurgia', subtema: 'Feridas / Técnica Cirúrgica' },
  { pk: 'c22f0d5e-4d8f-44a8-afe2-23c1bf40c2ec', tema: 'Cirurgia', subtema: 'Feridas / Técnica Cirúrgica' },
  { pk: '299f4f55-a5f3-4a4e-a313-e386c3a18e09', tema: 'Medicina Preventiva', subtema: 'Imunizações e Vigilância Epidemiológica' },
  { pk: '1866d6dc-145f-432b-a170-3281a0300c23', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: '3fd23eaf-f991-41d0-9f3f-0faada170209', tema: 'Cirurgia', subtema: 'Feridas / Técnica Cirúrgica' },
  { pk: 'fbae5930-8743-423c-ba1b-2377fd7010b1', tema: 'Clínica Médica', subtema: 'Reumatologia' },
  { pk: 'c947d2fa-3698-4774-a88a-e69af6fdacde', tema: 'Clínica Médica', subtema: 'Infectologia' },
  { pk: '25538223-f071-4b1f-97ca-a81ea2b7b7c9', tema: 'Clínica Médica', subtema: 'Reumatologia' },
  // "Trauma / ATLS" erros
  { pk: '667868ec-d0f2-47ad-9b62-deb4766405de', tema: 'Clínica Médica', subtema: 'Cardiologia' },
  { pk: 'cddca0dd-2e75-43ed-9aa7-31bec2996657', tema: 'Pediatria', subtema: 'Infectologia Pediátrica' },
  { pk: '2ec67948-c671-445e-97be-46c539801483', tema: 'Pediatria', subtema: 'Infectologia Pediátrica' },
  { pk: 'df9de829-b2f8-4768-a8ed-70df431197ce', tema: 'Clínica Médica', subtema: 'Infectologia' },
  { pk: 'f8b9f79a-9ac4-4c31-a979-b85e1e3aac6d', tema: 'Clínica Médica', subtema: 'Infectologia' },
  { pk: 'aa03118e-5bb7-496d-8e23-1274eca0e207', tema: 'Cirurgia', subtema: 'Ortopedia e Traumatologia' },
  { pk: '71a4b175-11e8-45c6-afe7-883bf50b2203', tema: 'Clínica Médica', subtema: 'Hematologia' },
  { pk: '467bbdef-94b5-460c-a0a7-e0e8d9e34f26', tema: 'Pediatria', subtema: 'Urgências Pediátricas' },
  { pk: 'ee98b194-9ea7-4001-ae90-eca175521e5d', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: 'a7ad3daa-ec87-4e66-a3ee-70a6bbdb108d', tema: 'Medicina Preventiva', subtema: 'Atenção Primária à Saúde (APS)' },
  { pk: 'c729d83c-8605-403e-80ee-e205e95198ea', tema: 'Clínica Médica', subtema: 'Nefrologia' },
  { pk: 'b8451adb-a21f-45df-a120-da3e834efdbd', tema: 'Medicina Preventiva', subtema: 'Imunizações e Vigilância Epidemiológica' },
  { pk: '5218ef2e-9eb2-4885-9349-adcbbd17c345', tema: 'Cirurgia', subtema: 'Feridas / Técnica Cirúrgica' },
  { pk: 'e25cd380-9c47-47c8-890b-d9a2c965dbfc', tema: 'Medicina Preventiva', subtema: 'Imunizações e Vigilância Epidemiológica' },
  { pk: '8efac8b4-cebf-420e-9ca7-ec32f83b4544', tema: 'Medicina Preventiva', subtema: 'Políticas Públicas de Saúde' },
  { pk: 'd3b31a60-1843-454e-b223-231b57a8caa1', tema: 'Clínica Médica', subtema: 'Cardiologia' },
  { pk: '6f153177-9c0c-42e1-853a-4261bdcfa543', tema: 'Clínica Médica', subtema: 'Cardiologia' },
  { pk: 'f83d5524-2ec0-4a2c-b875-6bc0c3ef3acb', tema: 'Clínica Médica', subtema: 'Nefrologia' },
  { pk: 'a64632a2-31cc-4a03-ad9e-14390e7a6584', tema: 'Medicina Preventiva', subtema: 'Políticas Públicas de Saúde' },
  { pk: 'bbb24e4b-7c4b-4cb6-a32e-0199b45c5da7', tema: 'Medicina Preventiva', subtema: 'Atenção Primária à Saúde (APS)' },
  { pk: '3d355a27-7ca1-4a5c-8204-10a65ae486d3', tema: 'Clínica Médica', subtema: 'Reumatologia' },
  { pk: '28622cb4-f8ef-4685-a72e-b43c852ff01f', tema: 'Medicina Preventiva', subtema: 'Políticas Públicas de Saúde' },
  { pk: 'f10ac9a3-0a30-4a05-bf35-e5e94a8a1d55', tema: 'Clínica Médica', subtema: 'Cardiologia' },
  { pk: '0ac8e8e2-f8d2-4efc-b143-d32c99f0ff32', tema: 'Clínica Médica', subtema: 'Psiquiatria' },
  { pk: '30e69dfa-a528-49d1-9559-ef3d4ca52fb1', tema: 'Pediatria', subtema: 'Urgências Pediátricas' },
  { pk: '587b7993-648b-4b90-b2f0-ac7a9e545a51', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: '02e538e0-0c8a-45e8-9110-e25ec6b415da', tema: 'Cirurgia', subtema: 'Trauma / ATLS' },
  { pk: 'e03f7340-b790-4c8a-ae66-66a17ff37cde', tema: 'Cirurgia', subtema: 'Abdome Agudo / Cirurgia Digestiva' },
  { pk: 'efdc90ef-4a5e-43a9-9e1d-466c55de79da', tema: 'Pediatria', subtema: 'Saúde da Criança' },
  { pk: '02bb9704-c736-465e-8b3d-6a7f5fdbc6fc', tema: 'Pediatria', subtema: 'Urgências Pediátricas' },
  { pk: 'f9a89fb0-92d2-418e-b029-77964b593796', tema: 'Clínica Médica', subtema: 'Infectologia' },
  { pk: '9239f8cf-070e-48e4-be70-8284e0ebef07', tema: 'Clínica Médica', subtema: 'Cardiologia' },
]

console.log(`Parte 1: ${correcoes.length} correções`)
let s = 0, e = 0
for (const c of correcoes) {
  const { error } = await supabase.from('questoes').update({ tema: c.tema, subtema: c.subtema }).eq('pk', c.pk)
  if (error) { console.error(`ERRO pk=${c.pk}: ${error.message}`); e++ } else s++
}
console.log(`Resultado parte 1: ${s} OK, ${e} erros`)
