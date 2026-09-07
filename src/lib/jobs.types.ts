export type JobType =
  | "tempo_inteiro"
  | "meio_periodo"
  | "contrato"
  | "estagio"
  | "temporario"
  | "freelance";

export type ExperienceLevel = "estagiario" | "junior" | "intermedio" | "senior" | "gestor";

export const JOB_TYPE_LABELS: Record<JobType, string> = {
  tempo_inteiro: "Tempo inteiro",
  meio_periodo: "Meio período",
  contrato: "Contrato",
  estagio: "Estágio",
  temporario: "Temporário",
  freelance: "Freelance",
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  estagiario: "Estagiário",
  junior: "Júnior",
  intermedio: "Intermédio",
  senior: "Sénior",
  gestor: "Gestor",
};

export const DATE_FILTERS = [
  { value: "any", label: "Qualquer data" },
  { value: "1", label: "Últimas 24h" },
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
] as const;

export interface JobListItem {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  company_slug: string | null;
  company_logo: string | null;
  location: string;
  category: string;
  job_type: JobType;
  experience_level: ExperienceLevel;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  summary: string;
  is_featured: boolean;
  image_url: string | null;
  published_at: string;
}

export interface JobDetail extends JobListItem {
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  how_to_apply: string | null;
  apply_url: string | null;
  apply_email: string | null;
  expires_at: string | null;
  image_url: string | null;
  company_description: string | null;
  company_website: string | null;
}

export interface CompanyListItem {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  location: string | null;
  industry: string | null;
  description: string | null;
  verified: boolean;
  open_jobs: number;
}

export interface JobFiltersInput {
  q?: string;
  location?: string;
  category?: string;
  type?: string;
  experience?: string;
  days?: string;
  page?: number;
  limit?: number;
}

export function formatSalary(job: {
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
}): string | null {
  const fmt = (value: number) => new Intl.NumberFormat("pt-MZ").format(value);
  if (job.salary_min && job.salary_max) {
    return `${fmt(job.salary_min)} – ${fmt(job.salary_max)} ${job.salary_currency}`;
  }
  if (job.salary_min) return `Desde ${fmt(job.salary_min)} ${job.salary_currency}`;
  if (job.salary_max) return `Até ${fmt(job.salary_max)} ${job.salary_currency}`;
  return null;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const day = 86_400_000;
  const days = Math.floor(diff / day);
  if (days <= 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 30) return `Há ${days} dias`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Há ${months} ${months === 1 ? "mês" : "meses"}`;
  return new Date(iso).toLocaleDateString("pt-MZ");
}
