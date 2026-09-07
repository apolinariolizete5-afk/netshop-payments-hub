import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface AdminJobInput {
  id?: string;
  title: string;
  slug: string;
  company_name: string;
  location: string;
  category: string;
  job_type: string;
  experience_level: string;
  summary: string;
  description: string;
  image_url: string;
  status: string;
  is_featured: boolean;
  salary_min: number | null;
  salary_max: number | null;
  apply_email: string;
  apply_url: string;
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase.rpc("has_role", {
    _user_id: ctx.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const amIAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<boolean> => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return Boolean(data);
  });

export const adminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const sb = context.supabase;
    const [jobs, published, users, apps, saved, purchases, top] = await Promise.all([
      sb.from("jobs").select("id", { count: "exact", head: true }),
      sb.from("jobs").select("id", { count: "exact", head: true }).eq("status", "publicada"),
      sb.from("profiles").select("id", { count: "exact", head: true }),
      sb.from("applications").select("id", { count: "exact", head: true }),
      sb.from("saved_jobs").select("id", { count: "exact", head: true }),
      sb.from("cv_purchases").select("id", { count: "exact", head: true }).eq("status", "paid"),
      sb.from("jobs").select("title, slug, views_count").order("views_count", { ascending: false }).limit(8),
    ]);
    const { data: allViews } = await sb.from("jobs").select("views_count");
    const totalViews = ((allViews ?? []) as { views_count: number }[]).reduce(
      (sum, row) => sum + (row.views_count ?? 0),
      0,
    );
    return {
      jobs: jobs.count ?? 0,
      published: published.count ?? 0,
      users: users.count ?? 0,
      applications: apps.count ?? 0,
      saved: saved.count ?? 0,
      purchases: purchases.count ?? 0,
      totalViews,
      topJobs: (top.data ?? []) as { title: string; slug: string; views_count: number }[],
    };
  });

export const adminListJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { data, error } = await context.supabase
      .from("jobs")
      .select(
        "id, slug, title, company_name, location, category, job_type, experience_level, summary, description, image_url, status, is_featured, salary_min, salary_max, apply_email, apply_url, views_count, published_at",
      )
      .order("published_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminSaveJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: AdminJobInput) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const stamp = Date.now().toString(36);
    const fallbackSlug = (data.title || "vaga")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    let slug = data.slug?.trim() || `${fallbackSlug}-${stamp}`;
    const { data: clash } = await context.supabase
      .from("jobs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (clash && (clash as { id: string }).id !== data.id) {
      slug = `${slug}-${stamp}`;
    }
    const row = {
      title: data.title?.trim() || "Vaga sem título",
      slug,
      company_name: data.company_name?.trim() || "Empresa confidencial",
      location: data.location?.trim() || "Moçambique",
      category: data.category?.trim() || "Geral",
      job_type: data.job_type || "tempo_inteiro",
      experience_level: data.experience_level || "junior",
      summary: data.summary?.trim() || "Consulte os detalhes desta vaga.",
      description: data.description?.trim() || "Sem descrição detalhada.",
      image_url: data.image_url || null,
      status: data.status || "publicada",
      is_featured: data.is_featured,
      salary_min: data.salary_min,
      salary_max: data.salary_max,
      apply_email: data.apply_email || null,
      apply_url: data.apply_url || null,
      created_by: context.userId,
    } as never;
    const query = data.id
      ? context.supabase.from("jobs").update(row).eq("id", data.id)
      : context.supabase.from("jobs").insert(row);
    const { error } = await query;
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { error } = await context.supabase.from("jobs").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const [profiles, roles] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id, full_name, headline, phone, location, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      context.supabase.from("user_roles").select("user_id, role"),
    ]);
    const roleMap = new Map<string, string[]>();
    for (const r of (roles.data ?? []) as { user_id: string; role: string }[]) {
      roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role]);
    }
    return ((profiles.data ?? []) as any[]).map((p) => ({
      ...p,
      roles: roleMap.get(p.id) ?? [],
    })) as {
      id: string;
      full_name: string | null;
      headline: string | null;
      phone: string | null;
      location: string | null;
      created_at: string;
      roles: string[];
    }[];
  });

export const adminSetRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; role: string; grant: boolean }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    if (data.grant) {
      const { error } = await context.supabase
        .from("user_roles")
        .upsert({ user_id: data.userId, role: data.role } as never, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role as never);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    if (data.userId === context.userId) throw new Error("Não pode eliminar a sua própria conta.");
    await context.supabase.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await context.supabase.from("profiles").delete().eq("id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
