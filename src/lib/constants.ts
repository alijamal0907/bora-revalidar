// Configurações globais do app

export const KIWI_CHECKOUT_URL = "https://pay.kiwify.com.br/mD6du8N";

export const LIMITES_FREE = {
  questoesDia: 30,
  cardsDia: 10,
  iaExplicacoesDia: 3,
  simuladosMes: 1,
};

export const TEMAS = [
  "Clínica Médica",
  "Ginecologia e Obstetrícia",
  "Pediatria",
  "Cirurgia",
  "Medicina Preventiva e Social",
  "Ética Médica",
];

export const DIFICULDADES = [
  { value: "todas", label: "Todas" },
  { value: "1", label: "Muito Fácil" },
  { value: "2", label: "Fácil" },
  { value: "3", label: "Média" },
  { value: "4", label: "Difícil" },
  { value: "5", label: "Muito Difícil" },
];

export const DURACOES_SIMULADO = [
  { value: 60, label: "60 minutos" },
  { value: 120, label: "120 minutos" },
  { value: 180, label: "180 minutos" },
];

export const QUANTIDADES_SIMULADO = [
  { value: 30, label: "30 questões" },
  { value: 50, label: "50 questões" },
  { value: 100, label: "100 questões" },
];

// Algoritmo SM-2 simplificado para flashcards
export const INTERVALOS_REVISAO = [1, 3, 7, 14, 30, 60];

// Cores da paleta
export const CORES = {
  fundoAzul: "#0D1B2A",
  fundoVerde: "#1B4332",
  dourado: "#C6A239",
  textoPrincipal: "#E6E6E6",
  textoSecundario: "#B7CBBF",
  erro: "#C44536",
  preto: "#0A0A0A",
};
