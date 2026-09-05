import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Job = Tables<"jobs">;

export type JobFilters = {
  search?: string;
  category?: string;
  province?: string;
  employmentType?: string;
  limit?: number;
  featured?: boolean;
};

export async function fetchJobs(filters: JobFilters = {}): Promise<Job[]> {
  let query = supabase
    .from("jobs")
    .select("*")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  if (filters.featured) query = query.eq("is_featured", true);
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.province) query = query.eq("province", filters.province);
  if (filters.employmentType) query = query.eq("employment_type", filters.employmentType);
  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`title.ilike.${term},company.ilike.${term},description.ilike.${term}`);
  }
  if (filters.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchJobBySlug(slug: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
