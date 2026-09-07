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
    id: "editorial",
    name: "Editorial",
    description:
      "Visual sofisticado inspirado em revistas e portfolios profissionais.",
    layout: "editorial",
    accent: "#111827",
    surface: "#F8F7F4",
    photoShape: "square",
    font: "serif",
    premium: true,
  },

  {
    id: "executive",
    name: "Executive",
    description:
      "Elegante e poderoso para gestores, directores e profissionais sénior.",
    layout: "executive",
    accent: "#172033",
    surface: "#F5F6F8",
    photoShape: "circle",
    font: "sans",
    premium: true,
  },

  {
    id: "corporate",
    name: "Corporate",
    description:
      "Estrutura internacional para bancos, empresas e grandes organizações.",
    layout: "corporate",
    accent: "#1E3A5F",
    surface: "#FFFFFF",
    photoShape: "circle",
    font: "sans",
    premium: true,
  },

  {
    id: "swiss",
    name: "Swiss",
    description:
      "Design suíço com grid rigoroso, tipografia forte e máximo equilíbrio.",
    layout: "swiss",
    accent: "#111111",
    surface: "#FFFFFF",
    photoShape: "none",
    font: "sans",
    premium: true,
  },

  {
    id: "minimal",
    name: "Minimal",
    description:
      "Minimalismo premium com muito espaço e leitura extremamente limpa.",
    layout: "minimal",
    accent: "#18181B",
    surface: "#FFFFFF",
    photoShape: "none",
    font: "sans",
    premium: true,
  },

  {
    id: "timeline",
    name: "Timeline",
    description:
      "Apresenta a evolução da carreira através de uma linha cronológica.",
    layout: "timeline",
    accent: "#4F46E5",
    surface: "#FFFFFF",
    photoShape: "circle",
    font: "sans",
    premium: true,
  },

  {
    id: "creative",
    name: "Creative",
    description:
      "Composição ousada para marketing, comunicação, design e áreas criativas.",
    layout: "creative",
    accent: "#7C3AED",
    surface: "#FAF5FF",
    photoShape: "square",
    font: "display",
    premium: true,
  },

  {
    id: "academic",
    name: "Academic",
    description:
      "Estrutura formal para investigadores, professores e profissionais académicos.",
    layout: "academic",
    accent: "#374151",
    surface: "#FFFFFF",
    photoShape: "none",
    font: "serif",
    premium: true,
  },

  {
    id: "tech",
    name: "Technology",
    description:
      "Visual moderno inspirado em produtos digitais e empresas de tecnologia.",
    layout: "tech",
    accent: "#06B6D4",
    surface: "#0B1120",
    photoShape: "square",
    font: "sans",
    premium: true,
  },

  {
    id: "portfolio",
    name: "Portfolio",
    description:
      "CV visual para profissionais que precisam destacar projectos e competências.",
    layout: "portfolio",
    accent: "#8B5CF6",
    surface: "#F5F3FF",
    photoShape: "square",
    font: "display",
    premium: true,
  },

  {
    id: "first-job",
    name: "Primeiro Emprego",
    description:
      "Pensado para estudantes, recém-formados e candidatos sem muita experiência.",
    layout: "first-job",
    accent: "#2563EB",
    surface: "#EFF6FF",
    photoShape: "circle",
    font: "sans",
    premium: true,
  },

  {
    id: "finance",
    name: "Finance",
    description:
      "Sério, preciso e elegante para banca, contabilidade e finanças.",
    layout: "finance",
    accent: "#0F3D3E",
    surface: "#F7FAFA",
    photoShape: "none",
    font: "serif",
    premium: true,
  },

  {
    id: "development",
    name: "Development",
    description:
      "Estrutura profissional para ONG, desenvolvimento, projectos e organizações internacionais.",
    layout: "development",
    accent: "#166534",
    surface: "#F0FDF4",
    photoShape: "circle",
    font: "sans",
    premium: true,
  },

  {
    id: "ats",
    name: "ATS Pro",
    description:
      "Optimizado para sistemas automáticos de recrutamento e leitura de CVs.",
    layout: "ats",
    accent: "#111827",
    surface: "#FFFFFF",
    photoShape: "none",
    font: "sans",
    premium: true,
  },

  {
    id: "mozambique",
    name: "Moçambique",
    description:
      "Design premium inspirado na identidade visual e profissional de Moçambique.",
    layout: "mozambique",
    accent: "#006B3C",
    surface: "#F7F7F5",
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
    return { ...SAMPLE_CV };
  }

  const text = (value: string | undefined, fallback: string) =>
    value && value.trim() ? value : fallback;

  return {
    ...data,
    fullName: text(data.fullName, SAMPLE_CV.fullName),
    title: text(data.title, SAMPLE_CV.title),
    summary: text(data.summary, SAMPLE_CV.summary),
    email: text(data.email, SAMPLE_CV.email),
    phone: text(data.phone, SAMPLE_CV.phone),
    location: text(data.location, SAMPLE_CV.location),
    photo: data.photo || SAMPLE_CV.photo,
    experiences: data.experiences?.some((e) => e.role || e.company)
      ? data.experiences
      : SAMPLE_CV.experiences,
    education: data.education?.some((e) => e.course || e.school)
      ? data.education
      : SAMPLE_CV.education,
    skills: data.skills?.length ? data.skills : SAMPLE_CV.skills,
    languages: data.languages?.length ? data.languages : SAMPLE_CV.languages,
  };
}
