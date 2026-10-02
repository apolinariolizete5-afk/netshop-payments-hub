export type CvExperience = {
  role: string;
  company: string;
  period: string;
  description: string;
};

export type CvEducation = {
  course: string;
  school: string;
  period: string;
};

export type CvCustomSection = {
  id: string;
  title: string;
  content: string;
};

export type CvLayout =
  | "editorial"
  | "executive"
  | "corporate"
  | "swiss"
  | "minimal"
  | "timeline"
  | "creative"
  | "academic"
  | "tech"
  | "portfolio"
  | "first-job"
  | "finance"
  | "development"
  | "ats"
  | "mozambique";

export type CvTemplate = {
  id: string;
  name: string;
  description: string;
  layout: CvLayout;
  accent: string;
  surface: string;
  photoShape: "circle" | "square" | "none";
  font: "sans" | "serif" | "display";
  premium: boolean;
};

export type CvData = {
  fullName: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  photo: string;
  summary: string;
  experiences: CvExperience[];
  education: CvEducation[];
  customSections: CvCustomSection[];
  skills: string;
  languages: string;
  templateId: string;
};

export const EMPTY_CV: CvData = {
  fullName: "",
  title: "",
  email: "",
  phone: "",
  location: "",
  photo: "",
  summary: "",
  experiences: [
    {
      role: "",
      company: "",
      period: "",
      description: "",
    },
  ],
  education: [
    {
      course: "",
      school: "",
      period: "",
    },
  ],
  customSections: [],
  skills: "",
  languages: "",
  templateId: "editorial",
};

export const SAMPLE_CV: CvData = {
  fullName: "Ana Macuácua",
  title: "Gestora de Operações",
  email: "ana.macuacua@email.com",
  phone: "+258 84 123 4567",
  location: "Maputo, Moçambique",
  photo: "",
  summary:
    "Profissional de operações com experiência em gestão administrativa, coordenação de equipas e melhoria de processos. Orientada para resultados, organização e qualidade operacional.",
  experiences: [
    {
      role: "Gestora de Operações",
      company: "Empresa Exemplo",
      period: "2022 — Presente",
      description:
        "Coordenação das operações diárias, acompanhamento de equipas, controlo de processos e implementação de melhorias para aumentar a eficiência.",
    },
    {
      role: "Coordenadora Administrativa",
      company: "Grupo Empresarial",
      period: "2019 — 2022",
      description:
        "Gestão administrativa, relacionamento com fornecedores, organização documental e apoio à gestão financeira.",
    },
    {
      role: "Assistente Administrativa",
      company: "Serviços & Consultoria",
      period: "2017 — 2019",
      description:
        "Apoio administrativo, atendimento ao cliente, preparação de relatórios e organização de documentação.",
    },
  ],
  education: [
    {
      course: "Licenciatura em Gestão",
      school: "Universidade Eduardo Mondlane",
      period: "2014 — 2018",
    },
    {
      course: "Gestão Empresarial",
      school: "Instituto Superior de Administração",
      period: "2019",
    },
  ],
  customSections: [],
  skills:
    "Gestão de operações, Liderança, Excel, Gestão administrativa, Comunicação, Planeamento",
  languages: "Português — Nativo, Inglês — Intermédio",
  templateId: "editorial",
};

/*
|--------------------------------------------------------------------------
| 15 MODELOS PREMIUM
|--------------------------------------------------------------------------
|
| Cada modelo tem uma linguagem visual própria.
|
| 01 Editorial       — revista / alto padrão
| 02 Executive       — executivo premium
| 03 Corporate       — multinacional
| 04 Swiss           — design suíço
| 05 Minimal         — ultra clean
| 06 Timeline        — carreira cronológica
| 07 Creative        — criativo
| 08 Academic        — académico
| 09 Technology      — tecnologia
| 10 Portfolio       — portfólio
| 11 First Job       — primeiro emprego
| 12 Finance         — finanças
| 13 Development     — ONG / desenvolvimento
| 14 ATS              — recrutamento
| 15 Mozambique      — identidade moçambicana
|
|--------------------------------------------------------------------------
*/

export const CV_TEMPLATES: CvTemplate[] = [
  {
    id: "template-01",
    name: "Modelo 1",
    description: "Modelo profissional com coluna lateral e apresentação clara da carreira.",
    layout: "editorial",
    accent: "#111827",
    surface: "#F8F7F4",
    photoShape: "square",
    font: "serif",
    premium: true,
  },
  {
    id: "template-02",
    name: "Modelo 2",
    description: "Modelo executivo com destaque visual para perfil e contactos.",
    layout: "executive",
    accent: "#172033",
    surface: "#F5F6F8",
    photoShape: "circle",
    font: "sans",
    premium: true,
  },
  {
    id: "template-03",
    name: "Modelo 3",
    description: "Modelo corporativo equilibrado para candidaturas profissionais.",
    layout: "corporate",
    accent: "#1E3A5F",
    surface: "#FFFFFF",
    photoShape: "circle",
    font: "sans",
    premium: true,
  },
  {
    id: "template-04",
    name: "Modelo 4",
    description: "Modelo visual com estrutura rigorosa e leitura rápida.",
    layout: "swiss",
    accent: "#5D7485",
    surface: "#EEEAE3",
    photoShape: "circle",
    font: "sans",
    premium: true,
  },
  {
    id: "template-05",
    name: "Modelo 5",
    description: "Modelo elegante de alto contraste para perfis profissionais.",
    layout: "minimal",
    accent: "#A58C62",
    surface: "#FFFFFF",
    photoShape: "circle",
    font: "serif",
    premium: true,
  },
  {
    id: "template-06",
    name: "Modelo 6",
    description: "Modelo cronológico para destacar a evolução da carreira.",
    layout: "timeline",
    accent: "#4F46E5",
    surface: "#FFFFFF",
    photoShape: "circle",
    font: "sans",
    premium: true,
  },
  {
    id: "template-07",
    name: "Executive Gold",
    description: "Executivo premium com coluna escura, detalhes dourados e hierarquia editorial.",
    layout: "creative",
    accent: "#B08A45",
    surface: "#FFFFFF",
    photoShape: "circle",
    font: "serif",
    premium: true,
  },
  {
    id: "template-08",
    name: "Wave Blue",
    description: "Design contemporâneo com ondas, azul corporativo e composição dinâmica.",
    layout: "corporate",
    accent: "#2F5878",
    surface: "#FFFFFF",
    photoShape: "circle",
    font: "sans",
    premium: true,
  },
  {
    id: "template-09",
    name: "Bold Start",
    description: "Modelo de alto impacto para primeiro emprego, estágio e perfis em início de carreira.",
    layout: "first-job",
    accent: "#4A4A4A",
    surface: "#FFFFFF",
    photoShape: "square",
    font: "display",
    premium: true,
  },
  {
    id: "template-10",
    name: "Classic Profile",
    description: "Visual clássico e editorial com coluna lateral cinza e tipografia elegante.",
    layout: "academic",
    accent: "#222222",
    surface: "#F1F1F1",
    photoShape: "square",
    font: "serif",
    premium: true,
  },
  {
    id: "template-11",
    name: "Slate Creative",
    description: "Portfólio moderno com fundo azul-ardósia e blocos de destaque em creme.",
    layout: "portfolio",
    accent: "#61788A",
    surface: "#61788A",
    photoShape: "circle",
    font: "sans",
    premium: true,
  },
];

export const CV_STORAGE_KEY = "moza-cv-draft";

export function loadCv(): CvData {
  if (typeof window === "undefined") {
    return EMPTY_CV;
  }

  try {
    const raw = window.localStorage.getItem(CV_STORAGE_KEY);

    if (!raw) {
      return EMPTY_CV;
    }

    const parsed = JSON.parse(raw) as Partial<CvData>;

    return {
      ...EMPTY_CV,
      ...parsed,
      experiences:
        parsed.experiences?.length
          ? parsed.experiences
          : EMPTY_CV.experiences,
      education:
        parsed.education?.length
          ? parsed.education
          : EMPTY_CV.education,
    };
  } catch {
    return EMPTY_CV;
  }
}

export function saveCv(data: CvData) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(CV_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignora erros de armazenamento local.
  }
}

export function previewData(data?: CvData): CvData {
  if (!data) {
    return { ...EMPTY_CV };
  }

  return {
    ...EMPTY_CV,
    ...data,
    experiences: data.experiences?.length ? data.experiences : [],
    education: data.education?.length ? data.education : [],
  };
}
