import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Correções identificadas por análise clínica de cada enunciado:
// Formato: { pk, novoSubtema, motivo }
const correcoes = [

  // ===== CARDIOLOGIA → subtemas corretos =====
  // "Hb Glicosilada 6, portador de diabetes..." → Endocrinologia (DM + HAS sem cardiopatia)
  { pk: "90179bd6-4c34-4f11-b75e-fbce26cb7657", novoSubtema: "Endocrinologia" },
  // "úlcera de membro inferior, fumante e obesa" → foco vascular/dermatológico, não cardíaco puro → Reumatologia/Outros, mas contexto de doença arterial periférica → manter se houver contexto HAS/cardio, REVISAR: enunciado menciona úlcera de MI em obesa fumante → Angiologia/DAP → Reumatologia
  // "adenocarcinoma ductal infiltrante de mama, 72 anos" → Oncologia / Hematologia
  { pk: "0c96128f-c2f0-4a76-ac9c-c187ce5dc664", novoSubtema: "Oncologia / Hematologia" },

  // ===== ENDOCRINOLOGIA → subtemas corretos =====
  // "criança de 5 anos, procedimento cirúrgico de pele, agentes anestésicos" → Pediatria/cirurgia → Cirurgia (pediátrica)
  { pk: "338d91ac-0fa7-460e-9878-a23515c3e8bc", novoSubtema: "Cirurgia", novoTema: "Cirurgia" },
  // "tosse seca >3 semanas, febre vespertina, dispneia, tabagista" → Tuberculose → Infectologia
  { pk: "0ac9abb4-a273-4c66-8738-0b181175d411", novoSubtema: "Infectologia" },
  // "queimadura elétrica em perna, urina escura" → Cirurgia / Queimaduras
  { pk: "32eef345-5abf-41fb-8a51-e17b07912298", novoSubtema: "Cirurgia", novoTema: "Cirurgia" },
  // "Bradicinesia, tremor de repouso, rigidez, marcha em pequenos passos" → Doença de Parkinson → Neurologia
  { pk: "9f1ebc30-3f81-429b-99e2-48b8f719f922", novoSubtema: "Neurologia" },

  // ===== GASTROENTEROLOGIA → subtemas corretos =====
  // "gestor municipal, tabagismo entre adolescentes" → Medicina Preventiva / Políticas Públicas
  { pk: "1d43a95f-69dd-4065-82a7-193716f3a967", novoSubtema: "Políticas Públicas de Saúde", novoTema: "Medicina Preventiva" },
  // "HPV, imunização e diagnóstico" → Medicina Preventiva / Imunizações
  { pk: "b59359c7-8134-439f-bb79-cde670d1b0a9", novoSubtema: "Imunizações e Calendário Vacinal", novoTema: "Medicina Preventiva" },
  // "dor abdominal súbita, paciente 65 anos" → pode ser gastro, mas contexto de urgência → manter Gastro pois é abdome agudo
  // "atleta, dor progressiva em tíbia, febre, tumoração → tumor ósseo (osteossarcoma)" → Oncologia / Hematologia
  { pk: "d228bab8-3790-44d6-bc2d-b58c58b81d88", novoSubtema: "Oncologia / Hematologia" },
  // "idosa 75 anos, caroço no pescoço" → neoplasia? → sem contexto GI claro → Oncologia/Hematologia
  { pk: "2094e70e-8228-4b6f-b24c-73b731bad1d5", novoSubtema: "Oncologia / Hematologia" },
  // "médica identifica alta incidência de tabagismo na comunidade" → Medicina Preventiva / APS
  { pk: "889e4f2e-7a6f-4174-a1ce-ea07bf26d8fe", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },
  // "médico PSF, alergia (provavelmente rinite/dermatite)" → APS → Medicina Preventiva
  { pk: "a2a62ada-143b-4e5a-9d52-4a50778f4151", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },
  // "menino 10 anos, anemia falciforme, febre alta" → Pediatria / Hematologia
  { pk: "114b7337-3665-4d91-a4c1-515d15065cf4", novoSubtema: "Hematologia Pediátrica", novoTema: "Pediatria" },
  // "nulípara 30 anos, citológico de colo" → Ginecologia / Prevenção
  { pk: "5f8178d5-0c7a-44a8-8627-8d124d49bbc8", novoSubtema: "Ginecologia Geral / Prevenção", novoTema: "Ginecologia e Obstetrícia" },
  // "homem 78 anos acamado, hemiplegia, visita domiciliar" → APS / Saúde do Idoso
  { pk: "f47d1fc2-2c14-44c7-8e48-8c636d55e3a8", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },
  // "reunião USF, cinco equipes" → APS / Gestão
  { pk: "77e61648-f35f-425d-a4f2-0f736caf8d1e", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },
  // "hipotireoidismo, acompanhamento endocrinologista" → Endocrinologia
  { pk: "5332d243-1610-450e-881e-ec6bd4f01047", novoSubtema: "Endocrinologia" },
  // "atleta 21 anos, dor progressiva em MI, febre, tumor em tíbia" → Oncologia (osteossarcoma)
  { pk: "ce4f05ab-8b75-4650-a63d-485591f529e5", novoSubtema: "Oncologia / Hematologia" },
  // "equipe multiprofissional, grupo de mensagens eletrônicas" → APS / Gestão
  { pk: "a197243a-35f4-4652-997f-bafaaa09331b", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },

  // ===== INFECTOLOGIA → subtemas corretos =====
  // "APS dúvida sobre território e atendimento de não cadastrado" → Medicina Preventiva / APS
  { pk: "cd5888d3-e572-4d3a-9745-b2f9be13ff0b", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },
  // "menino 11 anos, febre, claudicação de MI direito" → Pediatria (osteomielite/artrite séptica)
  { pk: "e2c89563-40e0-4aa0-8013-7d28423ff4e5", novoSubtema: "Infectologia Pediátrica", novoTema: "Pediatria" },
  // "equipe de saúde indígena, antibióticos e anti-inflamatórios" → Medicina Preventiva / APS
  { pk: "793c2f55-0579-482b-a40b-a53196013c1d", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },
  // "puérpera 40 anos, insuficiência respiratória aguda após cesárea" → Ginecologia e Obstetrícia
  { pk: "69c26860-0df5-47e4-b4e9-7c8d7c0cfeff", novoSubtema: "Pré-natal e Obstetrícia", novoTema: "Ginecologia e Obstetrícia" },
  // "paciente hérnia incisional, cicatriz mediana" → Cirurgia / Parede Abdominal
  { pk: "525b6b07-10da-4d6d-bfe0-a165b4e72aa9", novoSubtema: "Cirurgia do Abdome", novoTema: "Cirurgia" },
  // "homem 72 anos, resgatado de quarto" → Urgências / Intoxicação? → Urgências Clínicas / Outros
  { pk: "91a1a0f7-5010-45fb-bfeb-de39df4b0859", novoSubtema: "Urgências Clínicas / Outros" },
  // "homem 19 anos, aumento indolor do saco escrotal" → Cirurgia / Urologia (hidrocele/varicocele/tumor testicular)
  { pk: "b897ffb0-9405-4fb3-ac67-1123a3862a56", novoSubtema: "Urologia", novoTema: "Cirurgia" },
  // "suspeita de violência infantil, hematomas" → Pediatria / Saúde da Criança
  { pk: "112b34ff-6a7f-4bcf-ad1a-0fa28f815bc4", novoSubtema: "Saúde da Criança e Adolescente", novoTema: "Pediatria" },
  // "trauma com sangue na sonda + dor suprapúbica" → Cirurgia / Trauma
  { pk: "c6e9a6f2-31eb-4b8f-8088-e13486813419", novoSubtema: "Trauma / ATLS", novoTema: "Cirurgia" },
  // "RN 25 dias, febre, vômitos, piúria" → Pediatria / Neonatologia ou Infectologia Pediátrica
  { pk: "70530efb-0269-4323-825c-09d68ebe8407", novoSubtema: "Neonatologia", novoTema: "Pediatria" },
  // "mulher travesti, relação desprotegida, PEP" → Infectologia (DST/HIV/PEP) → manter em Infectologia? Sim, é IST → mas o enunciado menciona PrEP/PEP → Infectologia correto
  // "recém-nascida 10 dias, lesões na pele" → Neonatologia
  { pk: "73936016-e394-4f11-bdb8-d80b582060e6", novoSubtema: "Neonatologia", novoTema: "Pediatria" },
  // "criança 6 anos, febre contínua 40°C" → Pediatria / Infectologia Pediátrica
  { pk: "b3a72af8-7c08-4527-97d4-9df9a52e4a98", novoSubtema: "Infectologia Pediátrica", novoTema: "Pediatria" },
  // "paciente em situação de rua, Consultório na Rua" → Medicina Preventiva / APS
  { pk: "7cfb0056-c057-4f55-af66-b89f936b0cbb", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },
  // "paciente jovem 24 anos, tumoração com hiperemese → ovariana?" → Ginecologia
  { pk: "4c8d369b-2c40-45a5-9778-67d09f992106", novoSubtema: "Ginecologia Geral / Prevenção", novoTema: "Ginecologia e Obstetrícia" },
  // "homem 40 anos, perda de interesse e prazer → depressão" → Psiquiatria
  { pk: "cf83a621-660c-402d-9b6a-67460e32111d", novoSubtema: "Psiquiatria" },
  // "menino 6 anos, encaminhado pela escola" → Pediatria / Saúde da Criança
  { pk: "a38a76e0-d74b-4cac-939b-5abdc17b3f2c", novoSubtema: "Saúde da Criança e Adolescente", novoTema: "Pediatria" },
  // "reunião ESF, escala de sobrecarga de cuidadores de idosos" → Medicina Preventiva / APS / Saúde do Idoso
  { pk: "7b6d8f31-5424-4de3-963e-396847e12045", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },
  // "menino 7 anos, consulta de rotina, sem queixas" → Pediatria / Saúde da Criança
  { pk: "f5830458-d69c-4a60-9c33-296ced91e1cd", novoSubtema: "Saúde da Criança e Adolescente", novoTema: "Pediatria" },
  // "dor abdominal, mulher leva filha 6 anos → suspeita de abuso ou parasitose" → Pediatria
  { pk: "a0348c99-8f31-42ae-98df-8a19b69870ec", novoSubtema: "Saúde da Criança e Adolescente", novoTema: "Pediatria" },
  // "jovem 15 anos, quadro iniciado há..." → Pediatria / Adolescente
  { pk: "57e32780-cd56-4e4f-bcbf-d02e92bacce1", novoSubtema: "Saúde da Criança e Adolescente", novoTema: "Pediatria" },
  // "vulvovaginite, ginecologista" → Ginecologia
  { pk: "091f93d3-9562-421a-985e-8e805adf1181", novoSubtema: "Ginecologia Geral / Prevenção", novoTema: "Ginecologia e Obstetrícia" },
  // "paciente 35 anos, acidente automobilístico, dor abdominal → trauma abdominal" → Cirurgia / Trauma
  { pk: "f3e16b7f-7797-486e-97a0-b5b5622d71e0", novoSubtema: "Trauma / ATLS", novoTema: "Cirurgia" },
  // "COVID-19, guia de vigilância epidemiológica" → Medicina Preventiva / Epidemiologia
  { pk: "1517757c-a9e9-4e8d-bc7f-d1e1e83446b6", novoSubtema: "Epidemiologia", novoTema: "Medicina Preventiva" },
  // "politraumatismo, febre, dor súbita intensa" → trombose? → Cirurgia / Trauma
  { pk: "d3b31a60-1843-454e-b223-231b57a8caa1", novoSubtema: "Trauma / ATLS", novoTema: "Cirurgia" },
  // "politraumatizado, perda motora sensitiva completa MMII" → Cirurgia / Trauma (lesão medular)
  { pk: "858a86f3-d5da-457e-a7aa-44a3b60e4cbf", novoSubtema: "Trauma / ATLS", novoTema: "Cirurgia" },
  // "menino 11 anos, febre, tosse seca, infiltrado peribrônquico sem resposta à amoxicilina" → Pediatria (pneumonia atípica)
  { pk: "a5c535fc-8306-4036-a3ef-d23e026b19f8", novoSubtema: "Pneumologia Pediátrica", novoTema: "Pediatria" },
  // "mulher 70 anos, prurido vulvar crônico" → Ginecologia
  { pk: "88f6b741-b66b-4b68-997a-15bf7879c070", novoSubtema: "Ginecologia Geral / Prevenção", novoTema: "Ginecologia e Obstetrícia" },
  // "mulher 29 anos, dor em FIE, diarreia com muco e sangue → retocolite/Crohn" → Gastroenterologia
  { pk: "cd3e42fd-2790-4b1f-9a2e-1f494635ee6c", novoSubtema: "Gastroenterologia" },
  // "basquete feminino, salto, 19 anos → lesão ligamentar/ortopédica" → Cirurgia / Ortopedia
  { pk: "df2c368a-95fa-468b-91b8-5b75a6936548", novoSubtema: "Ortopedia e Traumatologia", novoTema: "Cirurgia" },
  // "escolar 8 anos, cansado e sonolento" → Pediatria
  { pk: "f55eb85f-14cf-4e5e-b176-e13fa82f05cc", novoSubtema: "Saúde da Criança e Adolescente", novoTema: "Pediatria" },
  // "reunião da equipe de saúde indígena" → Medicina Preventiva / APS
  { pk: "03e57953-58be-4974-93ce-4e9d9dcbbdc4", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },
  // "em visita domiciliar, homem 53 anos, ex-tabagista → rastreio DPOC/câncer" → Pneumologia
  { pk: "da4d9783-3f42-4b82-86f6-1881efbfc182", novoSubtema: "Pneumologia" },
  // "em atendimento ESF, mulher 32 anos, parda, mãe de dois" → APS
  { pk: "170fdb95-f861-4776-820e-18f6a66d0ff6", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },
  // "visita domiciliar, família de 6 pessoas" → APS
  { pk: "14ff6770-a71a-4073-afdf-10fe0b4dee93", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },
  // "secundigesta 28 anos, 35 semanas, obesa" → Obstetrícia
  { pk: "21fe8378-ba9e-412e-8850-0bf4e138fbe0", novoSubtema: "Pré-natal e Obstetrícia", novoTema: "Ginecologia e Obstetrícia" },
  // "reunião de equipe + líderes de organizações → comunidade" → APS
  { pk: "1996fa82-b8ac-4a66-a023-7c4a2c868f14", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },

  // ===== NEFROLOGIA → subtemas corretos =====
  // "paciente jovem vítima de acidente automobilístico, trauma grave" → Cirurgia / Trauma
  { pk: "f33fbb70-9ab7-4125-b7f3-c8812bbd9f08", novoSubtema: "Trauma / ATLS", novoTema: "Cirurgia" },
  // "mulher 72 anos, emagrecimento, dor abdominal irradiada para dorso, icterícia, massa palpável → neoplasia pancreática" → Oncologia
  { pk: "e17767d6-80c1-46d1-86e7-d868f28f4e57", novoSubtema: "Oncologia / Hematologia" },
  // "bradicinesia, 6 meses, lentidão de movimentos → Parkinson" → Neurologia
  { pk: "f7f766ea-99bb-451c-af76-906d8019cc15", novoSubtema: "Neurologia" },
  // "homem 50 anos, astenia, constipação com fezes em fita, edema de MMII" → Gastroenterologia (neoplasia colorretal?)
  { pk: "26f2321a-1b87-428a-900d-614e9aa2cc65", novoSubtema: "Gastroenterologia" },

  // ===== NEUROLOGIA → subtemas corretos =====
  // "homem 22 anos, transtorno de ansiedade, UPA" → Psiquiatria
  { pk: "5d254b25-c9a8-4f8b-9232-fd4409101535", novoSubtema: "Psiquiatria" },
  // "paciente com esquizofrenia, 20 anos, UPA, familiares" → Psiquiatria
  { pk: "24ecf13b-8335-4333-82e9-271d291acbc3", novoSubtema: "Psiquiatria" },
  // "mulher 30 anos, tonturas, tremores → hipertireoidismo / ansiedade?" → Endocrinologia
  { pk: "43f52e5a-ad28-4513-875c-1cdf5c7ced59", novoSubtema: "Endocrinologia" },

  // ===== ONCOLOGIA/HEMATOLOGIA → subtemas corretos =====
  // "menino 5 anos, aparecimento abrupto de manchas roxas → púrpura → leucemia/PTI" → Pediatria / Hematologia
  { pk: "d69759b0-3f98-4950-9d08-deacfd917ecf", novoSubtema: "Hematologia Pediátrica", novoTema: "Pediatria" },

  // ===== PNEUMOLOGIA → subtemas corretos =====
  // "criança 2 anos, pronto atendimento, tosse" → Pediatria / Pneumologia Pediátrica
  { pk: "06cf099d-aa95-434f-af9d-017972843fa7", novoSubtema: "Pneumologia Pediátrica", novoTema: "Pediatria" },
  // "mulher 48 anos, fogachos, insônia, amenorreia → menopausa" → Ginecologia / Climatério
  { pk: "323f0652-7ada-499c-9468-998aab807645", novoSubtema: "Ginecologia Geral / Prevenção", novoTema: "Ginecologia e Obstetrícia" },
  // "mulher 45 anos, solicitando clonazepam → ansiedade/benzodiazepínico" → Psiquiatria
  { pk: "87e0bbca-3d41-4dc0-828c-0cad38b408e7", novoSubtema: "Psiquiatria" },
  // "paciente 40 anos, várias queixas → somatização/hipocondria" → Psiquiatria
  { pk: "7d4741a4-f8d7-4d02-86f3-4570e6658fd7", novoSubtema: "Psiquiatria" },
  // "paciente multípara, tumoração cística no vestíbulo vaginal → cisto de Bartholin" → Ginecologia
  { pk: "35181b25-baaf-435b-a475-0be3df7aa5e7", novoSubtema: "Ginecologia Geral / Prevenção", novoTema: "Ginecologia e Obstetrícia" },

  // ===== PSIQUIATRIA → subtemas corretos =====
  // "PSA de 0,8, frequência de repetição → rastreio de câncer de próstata" → Oncologia / Hematologia
  { pk: "679147bf-727f-48a6-a00d-72e29b298564", novoSubtema: "Oncologia / Hematologia" },
  // "crise tireotóxica, 32 anos, UTI" → Endocrinologia
  { pk: "02a6ad7d-0e75-496b-9485-bebabdf588d1", novoSubtema: "Endocrinologia" },
  // "paciente 42 anos assintomático, UBS, primeira vez → rastreio/prevenção" → Medicina Preventiva / APS
  { pk: "012268f5-d328-4d7a-9dbd-e7e79a410110", novoSubtema: "Atenção Primária à Saúde (APS)", novoTema: "Medicina Preventiva" },

  // ===== URGÊNCIAS CLÍNICAS → subtemas corretos =====
  // "soldador 23 anos, dor ocular intensa, ceratite actínica" → Urgências Clínicas / Outros (oftalmológico) → manter aqui é razoável, mas poderia ir p/ Cirurgia/Oftalmologia
  // "mulher 40 anos, encaminhada para neurologia → cefaleia?" → Neurologia
  { pk: "9c5be439-1a7f-4ac4-b424-f3d10e07419f", novoSubtema: "Neurologia" },
]

console.log(`Total de correções a aplicar: ${correcoes.length}`)

let sucesso = 0
let erro = 0

for (const c of correcoes) {
  const update = { subtema: c.novoSubtema }
  if (c.novoTema) update.tema = c.novoTema

  const { error } = await supabase
    .from("questoes")
    .update(update)
    .eq("pk", c.pk)

  if (error) {
    console.error(`ERRO pk=${c.pk}: ${error.message}`)
    erro++
  } else {
    console.log(`OK pk=${c.pk} → tema=${c.novoTema || "(mantido)"} subtema=${c.novoSubtema}`)
    sucesso++
  }
}

console.log(`\n===== RESULTADO =====`)
console.log(`Sucesso: ${sucesso}`)
console.log(`Erros:   ${erro}`)
