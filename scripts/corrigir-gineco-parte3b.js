import { createClient } from "@supabase/supabase-js"
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

const correcoes = [
  { pk: "662c8fb1-75b6-44a3-8a6e-c0ac4d7c1618", tema: "Pediatria", subtema: "Infectologia Pediátrica" },
  { pk: "fc611f8b-6848-4a64-9c65-bd448a2e5e78", tema: "Cirurgia", subtema: "Urologia / Proctologia" },
  { pk: "93e7a3a6-10dc-49c2-9f1d-0f5f22739f5d", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "a6a6ae58-4583-4f56-a500-e7bf8fc78709", tema: "Pediatria", subtema: "Urgências Pediátricas" },
  { pk: "c4a08dc9-6f66-46b6-b4d4-a462fa874195", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "c6f8180f-ac1c-40d5-a820-30690e79652d", tema: "Pediatria", subtema: "Pneumologia Pediátrica" },
  { pk: "48e78e0d-a8c0-4660-9caf-e605dee2a6eb", tema: "Clínica Médica", subtema: "Reumatologia" },
  { pk: "308d6051-1ce2-4d5d-8890-3bbca2fd2f87", tema: "Pediatria", subtema: "Urgências Pediátricas" },
  { pk: "5c00af9e-9a47-4ba6-ac62-67e813021483", tema: "Pediatria", subtema: "Hematologia / Oncologia Pediátrica" },
  { pk: "79673b04-6c8e-4436-9916-43459977b471", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "c32d9b55-8c13-4fba-aa66-8e8163d3f314", tema: "Clínica Médica", subtema: "Gastroenterologia" },
  { pk: "802724c9-f922-4d3e-bebd-3495a4248ca5", tema: "Pediatria", subtema: "Ortopedia / Cirurgia Pediátrica" },
  { pk: "9b6fface-222d-4127-b687-0f8c3e572074", tema: "Pediatria", subtema: "Pneumologia Pediátrica" },
  { pk: "91324109-37f8-4bf4-8999-15c32b2ea315", tema: "Clínica Médica", subtema: "Endocrinologia" },
  { pk: "74882728-141c-4584-9973-a55e83de2098", tema: "Clínica Médica", subtema: "Dermatologia" },
  // Pré-natal e Obstetrícia → outros temas
  { pk: "973f68b6-8fb3-4923-b48a-489d51d11239", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "aece9216-4f01-4d5f-a1b7-69b75ac1351e", tema: "Clínica Médica", subtema: "Endocrinologia" },
  { pk: "e05a8351-ea8f-4818-ac40-5035c7633576", tema: "Medicina Preventiva", subtema: "Epidemiologia" },
  { pk: "3da4ac9e-c495-451b-b332-9296a7af347e", tema: "Clínica Médica", subtema: "Pneumologia" },
  { pk: "e5c48155-494a-4812-9d43-727783586c9c", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "57a15173-4774-4261-b986-d1ea67f70b97", tema: "Clínica Médica", subtema: "Nefrologia / Urologia" },
  { pk: "490132ac-b91f-46e6-b51c-fb6c5c758182", tema: "Pediatria", subtema: "Crescimento e Desenvolvimento" },
  { pk: "f55bbf9c-ed53-4da7-84c8-141e3f4424f5", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "b0c9a7aa-1cd4-48e1-a43a-cd5fe5e75d1f", tema: "Clínica Médica", subtema: "Endocrinologia" },
  { pk: "7382be86-4fb0-4fa0-91e3-1b91e90524fc", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "f2e9c2b8-569a-4324-8701-1320a135e548", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "41227657-aedb-4fb5-97ea-70a1f6e76c2b", tema: "Clínica Médica", subtema: "Endocrinologia" },
  { pk: "7f8465a5-1b6e-410f-ae3f-1a7055500b82", tema: "Medicina Preventiva", subtema: "Epidemiologia" },
  { pk: "9180e1c3-f902-41d7-ae8e-b54f756dc543", tema: "Clínica Médica", subtema: "Infectologia" },
  { pk: "af93c98b-bdb3-401e-8c3c-c9c35865d4b8", tema: "Clínica Médica", subtema: "Neurologia" },
  { pk: "9bf8bc33-baa3-4883-9ec3-d92f4aa06784", tema: "Pediatria", subtema: "Infectologia Pediátrica" },
  { pk: "c0074043-0f40-4294-b0a0-1ea84b0399bb", tema: "Pediatria", subtema: "Infectologia Pediátrica" },
  { pk: "b80a8623-8882-45a7-a3be-579c6e64d719", tema: "Clínica Médica", subtema: "Geriatria" },
  { pk: "64997410-fa9b-48b1-a01e-b03be77c65cf", tema: "Clínica Médica", subtema: "Nefrologia / Urologia" },
  { pk: "d2150cd9-006f-4294-8eaa-52f1e220276a", tema: "Cirurgia", subtema: "Abdome Agudo / Cirurgia Digestiva" },
  { pk: "2eaff0bd-f05f-4e75-9332-68f7ec15f9e4", tema: "Clínica Médica", subtema: "Endocrinologia" },
  { pk: "00e345bd-f047-495e-8204-6dbf96a9d6ca", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "e32420b2-4977-4496-9ffe-7450083dcff6", tema: "Cirurgia", subtema: "Trauma / ATLS" },
  { pk: "9474763e-114c-4a98-b457-050c12977e59", tema: "Pediatria", subtema: "Urgências Pediátricas" },
  { pk: "d81c9fe7-7237-4ac5-874e-0b9a0d5858f9", tema: "Clínica Médica", subtema: "Infectologia" },
  { pk: "d3a3fd11-0c4c-4f3e-850a-013956b887c8", tema: "Medicina Preventiva", subtema: "Políticas Públicas de Saúde" },
  { pk: "e594c2f5-2a61-461d-8ffc-b036b821db7f", tema: "Clínica Médica", subtema: "Clínica Geral" },
  { pk: "b5586730-0cb2-48bf-a2fd-9a5c2e034e82", tema: "Clínica Médica", subtema: "Nefrologia / Urologia" },
  { pk: "c754876a-a214-4512-aee3-21b45e92045c", tema: "Medicina Preventiva", subtema: "Políticas Públicas de Saúde" },
  { pk: "5b4781a8-5aee-40fa-94ce-27ea06dd918f", tema: "Medicina Preventiva", subtema: "APS / Medicina de Família" },
  { pk: "dc1bc46e-cc88-4afe-96ae-bc203c4b7d6a", tema: "Clínica Médica", subtema: "Cardiologia" },
  { pk: "53e854fe-739f-46be-bbe9-522071cee05c", tema: "Pediatria", subtema: "Endocrinologia / Adolescência" },
  { pk: "d658118d-9c9c-48a1-a723-4775bf05ac16", tema: "Pediatria", subtema: "Neonatologia" },
]

let ok = 0, err = 0
for (const c of correcoes) {
  const { error } = await supabase.from("questoes").update({ tema: c.tema, subtema: c.subtema }).eq("pk", c.pk)
  if (error) { console.error(`ERRO pk=${c.pk}:`, error.message); err++ }
  else { ok++ }
}
console.log(`Parte 3b: ${ok} corrigidas, ${err} erros`)
