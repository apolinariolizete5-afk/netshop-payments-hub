import { createServerFn } from "@tanstack/react-start";
import type {
  CompanyListItem,
  JobDetail,
  JobFiltersInput,
  JobListItem,
} from "./jobs.types";

interface JobRow {
  id: string;
  slug: string;
  title: string;
  company_name: string;
  location: string;
  category: string;
  job_type: JobListItem["job_type"];
  experience_level: JobListItem["experience_level"];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  summary: string;
  is_featured: boolean;
  image_url?: string | null;
  published_at: string;
  companies?: { slug: string; logo_url: string | null; description?: string | null; website?: string | null } | null;
}

function toListItem(row: JobRow): JobListItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    company_name: row.company_name,
    company_slug: row.companies?.slug ?? null,
    company_logo: row.companies?.logo_url ?? null,
    location: row.location,
    category: row.category,
    job_type: row.job_type,
    experience_level: row.experience_level,
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    salary_currency: row.salary_currency,
    summary: row.summary,
    is_featured: row.is_featured,
    image_url: row.image_url ?? null,
    published_at: row.published_at,
  };
}

const LIST_COLUMNS =
  "id, slug, title, company_name, location, category, job_type, experience_level, salary_min, salary_max, salary_currency, summary, is_featured, image_url, published_at, companies(slug, logo_url)";

export const listJobs = createServerFn({ method: "GET" })
  .inputValidator((input: JobFiltersInput | undefined) => input ?? {})
  .handler(async ({ data }): Promise<{ jobs: JobListItem[]; total: number }> => {
    const { getPublicSupabase } = await import("./supabase-public.server");
    const supabase = getPublicSupabase();
    const limit = Math.min(data.limit ?? 20, 50);
    const page = Math.max(data.page ?? 1, 1);
    const from = (page - 1) * limit;

    let query = supabase
      .from("jobs")
      .select(LIST_COLUMNS, { count: "exact" })
      .eq("status", "publicada");

    if (data.q?.trim()) {
      const term = data.q.trim().replace(/[,%]/g, " ");
      query = query.or(
        `title.ilike.%${term}%,company_name.ilike.%${term}%,summary.ilike.%${term}%,category.ilike.%${term}%`,
      );
    }
    if (data.location) query = query.eq("location", data.location);
    if (data.category) query = query.eq("category", data.category);
    if (data.type) query = query.eq("job_type", data.type as JobListItem["job_type"]);
    if (data.experience)
      query = query.eq("experience_level", data.experience as JobListItem["experience_level"]);
    if (data.days && data.days !== "any") {
      const since = new Date(Date.now() - Number(data.days) * 86_400_000).toISOString();
      query = query.gte("published_at", since);
    }

    const { data: rows, error, count } = await query
      .order("is_featured", { ascending: false })
      .order("published_at", { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw new Error(error.message);
    return { jobs: ((rows ?? []) as unknown as JobRow[]).map(toListItem), total: count ?? 0 };
  });

export const getJobBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }): Promise<JobDetail | null> => {
    const { getPublicSupabase } = await import("./supabase-public.server");
    const supabase = getPublicSupabase();
    const { data: row, error } = await supabase
      .from("jobs")
      .select(
        "id, slug, title, company_name, location, category, job_type, experience_level, salary_min, salary_max, salary_currency, summary, description, responsibilities, requirements, benefits, how_to_apply, apply_url, apply_email, expires_at, image_url, is_featured, published_at, companies(slug, logo_url, description, website)",
      )
      .eq("status", "publicada")
      .eq("slug", data.slug)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!row) return null;
    const typed = row as unknown as JobRow & {
      description: string;
      responsibilities: string[];
      requirements: string[];
      benefits: string[];
      how_to_apply: string | null;
      apply_url: string | null;
      apply_email: string | null;
      expires_at: string | null;
      image_url: string | null;
    };
    return {
      ...toListItem(typed),
      description: typed.description,
      responsibilities: typed.responsibilities ?? [],
      requirements: typed.requirements ?? [],
      benefits: typed.benefits ?? [],
      how_to_apply: typed.how_to_apply,
      apply_url: typed.apply_url,
      apply_email: typed.apply_email,
      expires_at: typed.expires_at,
      image_url: typed.image_url ?? null,
      company_description: typed.companies?.description ?? null,
      company_website: typed.companies?.website ?? null,
    };
  });

export const listFacets = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ locations: string[]; categories: string[] }> => {
    const { getPublicSupabase } = await import("./supabase-public.server");
    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from("jobs")
      .select("location, category")
      .eq("status", "publicada")
      .limit(1000);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as { location: string; category: string }[];
    const locations = [...new Set(rows.map((r) => r.location))].sort((a, b) =>
      a.localeCompare(b, "pt"),
    );
    const categories = [...new Set(rows.map((r) => r.category))].sort((a, b) =>
      a.localeCompare(b, "pt"),
    );
    return { locations, categories };
  },
);

export const listCategoriesWithCounts = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ category: string; count: number }[]> => {
    const { getPublicSupabase } = await import("./supabase-public.server");
    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from("jobs")
      .select("category")
      .eq("status", "publicada")
      .limit(1000);
    if (error) throw new Error(error.message);
    const counts = new Map<string, number>();
    for (const row of (data ?? []) as { category: string }[]) {
      counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  },
);

export const listCompanies = createServerFn({ method: "GET" })
  .inputValidator((input: { limit?: number } | undefined) => input ?? {})
  .handler(async ({ data }): Promise<CompanyListItem[]> => {
    const { getPublicSupabase } = await import("./supabase-public.server");
    const supabase = getPublicSupabase();
    const { data: companies, error } = await supabase
      .from("companies")
      .select("id, slug, name, logo_url, location, industry, description, verified")
      .order("name")
      .limit(data.limit ?? 50);
    if (error) throw new Error(error.message);

    const { data: jobs } = await supabase
      .from("jobs")
      .select("company_id")
      .eq("status", "publicada")
      .limit(1000);
    const counts = new Map<string, number>();
    for (const row of (jobs ?? []) as { company_id: string | null }[]) {
      if (row.company_id) counts.set(row.company_id, (counts.get(row.company_id) ?? 0) + 1);
    }
    return ((companies ?? []) as Omit<CompanyListItem, "open_jobs">[]).map((c) => ({
      ...c,
      open_jobs: counts.get(c.id) ?? 0,
    }));
  });

export const getCompanyBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => input)
  .handler(
    async ({ data }): Promise<{ company: CompanyListItem; jobs: JobListItem[] } | null> => {
      const { getPublicSupabase } = await import("./supabase-public.server");
      const supabase = getPublicSupabase();
      const { data: company, error } = await supabase
        .from("companies")
        .select("id, slug, name, logo_url, location, industry, description, verified")
        .eq("slug", data.slug)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!company) return null;

      const { data: rows } = await supabase
        .from("jobs")
        .select(LIST_COLUMNS)
        .eq("status", "publicada")
        .eq("company_id", company.id)
        .order("published_at", { ascending: false });

      const jobs = ((rows ?? []) as unknown as JobRow[]).map(toListItem);
      return {
        company: { ...(company as Omit<CompanyListItem, "open_jobs">), open_jobs: jobs.length },
        jobs,
      };
    },
  );

export const registerJobView = createServerFn({ method: "POST" })
  .inputValidator((input: { slug: string }) => input)
  .handler(async ({ data }) => {
    const { getPublicSupabase } = await import("./supabase-public.server");
    await getPublicSupabase().rpc("increment_job_view", { _slug: data.slug });
    return { ok: true };
  });
