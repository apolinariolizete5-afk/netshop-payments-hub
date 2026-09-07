import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { Building2, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { listCompanies } from "@/lib/jobs.functions";

const companiesQuery = queryOptions({
  queryKey: ["companies", "all"],
  queryFn: () => listCompanies({ data: { limit: 100 } }),
});

export const Route = createFileRoute("/empresas/")({
  head: () => ({
    meta: [
      { title: "Empresas que contratam em Moçambique | Moza Empregos" },
      {
        name: "description",
        content:
          "Conheça as empresas que estão a contratar em Moçambique e veja todas as vagas abertas de cada uma.",
      },
      { property: "og:title", content: "Empresas que contratam em Moçambique" },
      {
        property: "og:description",
        content: "Explore empresas e as suas vagas abertas no Moza Empregos.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(companiesQuery),
  errorComponent: ({ error }) => (
    <AppShell>
      <p role="alert" className="py-12 text-center text-sm text-muted-foreground">
        Não foi possível carregar as empresas. {error.message}
      </p>
    </AppShell>
  ),
  component: EmpresasPage,
});

function EmpresasPage() {
  const { data: companies } = useSuspenseQuery(companiesQuery);

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold">Empresas</h1>
      <p className="text-sm text-muted-foreground">
        {companies.length} empresa{companies.length === 1 ? "" : "s"} no Moza Empregos
      </p>

      {companies.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
          Ainda não há empresas registadas.
        </p>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Link
              key={company.id}
              to="/empresas/$slug"
              params={{ slug: company.slug }}
              className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-[var(--shadow-card)]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-primary">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={`Logótipo de ${company.name}`}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Building2 className="h-5 w-5" aria-hidden />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate text-sm font-bold">
                    {company.name}
                    {company.verified && (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" aria-label="Verificada" />
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {company.industry ?? "Empresa"} · {company.open_jobs} vaga
                    {company.open_jobs === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              {company.description && (
                <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                  {company.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
