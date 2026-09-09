export const CV_PRICE_MZN = 150;

export const PROVINCES = [
  "Maputo Cidade",
  "Maputo Província",
  "Gaza",
  "Inhambane",
  "Sofala",
  "Manica",
  "Tete",
  "Zambézia",
  "Nampula",
  "Cabo Delgado",
  "Niassa",
] as const;

export const CATEGORIES = [
  "Administração",
  "Agricultura",
  "Comércio e Vendas",
  "Contabilidade e Finanças",
  "Educação",
  "Engenharia e Indústria",
  "Saúde",
  "Tecnologias de Informação",
  "Transportes e Logística",
  "Turismo e Hotelaria",
] as const;

export const EMPLOYMENT_TYPES = ["Tempo inteiro", "Tempo parcial", "Turnos", "Contrato"] as const;

export const PAYMENT_METHODS = [
  { value: "mpesa", label: "M-Pesa", hint: "Confirma no telemóvel" },
  { value: "mkesh", label: "mKesh", hint: "Confirma no telemóvel" },
  { value: "card", label: "Cartão Visa/Mastercard", hint: "Página segura NetShop" },
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]["value"];
