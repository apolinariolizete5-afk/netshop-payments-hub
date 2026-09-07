import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, CheckCircle2, Globe, MapPin } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { JobCard } from "@/components/jobs/JobCard";
import { Button } from "@/components/ui/button";
import { getCompanyBySlug } from "@/lib/jobs.functions";

const companyQuery = (slug: string) =>
  queryOptions({
    queryKey: ["company", slug],
    queryFn: () => getCompanyBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/empresas/$slug")({
  loader: async ({ context, params }) => {
    const result = await context.queryClient.ensureQueryData(companyQuery(params.slug));
    if (!result) throw notFound();
    return { name: result.company.name, description: result.company.description };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Empresa indisponível | Moza Empregos" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const title = `${loaderData.name} — vagas abertas | Moza Empregos`;
    const description =
      loaderData.description?.slice(0, 155) ??
      `Veja as vagas abertas em ${loaderData.name} no Moza Empregos.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <AppShell>
      <p role="alert" className="py-12 text-center text-sm text-muted-foreground">
        Não foi possível carregar esta empresa. {error.message}
      </p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="py-12 text-center">
        <h1 className="text-xl font-extrabold">Empresa não encontrada</h1>
        <Button asChild className="mt-4">
          <Link to="/empresas">Ver empresas</Link>
        </Button>
      </div>
    </AppShell>
  ),
  component: EmpresaPage,
});

function EmpresaPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(companyQuery(slug));
  const company = data!.company;
  const jobs = data!.jobs;

  return (
    <AppShell>
      <Link
        to="/empresas"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar às empresas
      </Link>

      <header className="mt-4 rounded-3xl border border-border bg-card p-5">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary-soft text-primary">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={`Logótipo de ${company.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-6 w-6" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <h1 className="flex items-center gap-1 truncate text-xl font-extrabold sm:text-2xl">
              {company.name}
              {company.verified && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" aria-label="Verificada" />
              )}
            </h1>
            <p className="truncate text-sm text-muted-foreground">
              {company.industry ?? "Empresa"}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {company.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden /> {company.location}
            </span>
          )}
          <span>
            {jobs.length} vaga{jobs.length === 1 ? "" : "s"} aberta{jobs.length === 1 ? "" : "s"}
          </span>
        </div>

        {company.description && (
          <p className="mt-3 text-sm text-muted-foreground">{company.description}</p>
        )}
      </header>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-extrabold">Vagas abertas</h2>
        {jobs.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
            Esta empresa não tem vagas abertas neste momento.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
