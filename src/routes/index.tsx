import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  FileText,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { JobCard } from "@/components/jobs/JobCard";
import { JobSearchBar } from "@/components/jobs/JobSearchBar";
import { Button } from "@/components/ui/button";
import { listCategoriesWithCounts, listCompanies, listJobs } from "@/lib/jobs.functions";

const recentJobsQuery = queryOptions({
  queryKey: ["jobs", "recent"],
  queryFn: () => listJobs({ data: { limit: 6 } }),
});
const featuredJobsQuery = queryOptions({
  queryKey: ["jobs", "featured"],
  queryFn: () => listJobs({ data: { limit: 4, page: 1 } }),
});
const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: () => listCategoriesWithCounts(),
});
const companiesQuery = queryOptions({
  queryKey: ["companies", "home"],
  queryFn: () => listCompanies({ data: { limit: 8 } }),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moza Empregos — Vagas em Moçambique e Criador de CV" },
      {
        name: "description",
        content:
          "Encontre vagas de emprego em Moçambique, candidate-se e crie um CV profissional. Pesquisa por localização, categoria e tipo de emprego.",
      },
      { property: "og:title", content: "Moza Empregos — Vagas e Criador de CV" },
      {
        property: "og:description",
        content:
          "Plataforma moçambicana de empregos: pesquise vagas, guarde as suas favoritas e construa o seu CV.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(recentJobsQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
      context.queryClient.ensureQueryData(companiesQuery),
      context.queryClient.ensureQueryData(featuredJobsQuery),
    ]);
  },
  errorComponent: ({ error }) => (
    <AppShell>
      <p role="alert" className="py-12 text-center text-sm text-muted-foreground">
        Não foi possível carregar as vagas. {error.message}
      </p>
    </AppShell>
  ),
  component: Index,
});

function Section({
  title,
  action,
  children,
  icon,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <h2 className="flex min-w-0 items-center gap-2 truncate text-lg font-extrabold">
          {icon}
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Index() {
  const navigate = useNavigate();
  const { data: recent } = useSuspenseQuery(recentJobsQuery);
  const { data: featured } = useSuspenseQuery(featuredJobsQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const { data: companies } = useSuspenseQuery(companiesQuery);

  const recommended = featured.jobs.filter((job) => job.is_featured);
  const hasJobs = recent.total > 0;

  return (
    <AppShell>
      {/* Hero + pesquisa */}
      <section className="rounded-3xl bg-primary px-5 py-7 text-primary-foreground">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
          Emprego em Moçambique
        </p>
        <h1 className="mt-2 max-w-lg text-2xl font-extrabold leading-tight sm:text-3xl">
          A sua próxima oportunidade começa aqui.
        </h1>
        <p className="mt-2 max-w-lg text-sm opacity-90">
          Pesquise vagas reais, guarde as suas favoritas e construa um CV profissional em minutos.
        </p>
        <div className="mt-5 rounded-2xl bg-card p-2">
          <JobSearchBar
            onSubmit={(term) => navigate({ to: "/vagas", search: term ? { q: term } : {} })}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-primary-foreground/15 px-3 py-1">
            {recent.total} vagas publicadas
          </span>
          <span className="rounded-full bg-primary-foreground/15 px-3 py-1">
            {companies.length} empresas
          </span>
        </div>
      </section>

      {/* Categorias */}
      <Section
        title="Categorias"
        icon={<TrendingUp className="h-5 w-5 text-primary" aria-hidden />}
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/vagas">Ver todas</Link>
          </Button>
        }
      >
        {categories.length === 0 ? (
          <EmptyHint text="As categorias aparecem assim que existirem vagas publicadas." />
        ) : (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {categories.map(({ category, count }) => (
              <Link
                key={category}
                to="/vagas"
                search={{ category }}
                className="shrink-0 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {category}
                <span className="ml-2 text-xs text-muted-foreground">{count}</span>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Vagas recentes */}
      <Section
        title="Vagas recentes"
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/vagas" className="gap-1">
              Ver todas <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      >
        {hasJobs ? (
          <div className="grid gap-3 md:grid-cols-2">
            {recent.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <EmptyHint text="Ainda não há vagas publicadas. Volte em breve." />
        )}
      </Section>

      {/* Recomendadas */}
      {recommended.length > 0 && (
        <Section
          title="Vagas recomendadas"
          icon={<Sparkles className="h-5 w-5 text-accent" aria-hidden />}
        >
          <div className="grid gap-3 md:grid-cols-2">
            {recommended.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </Section>
      )}

      {/* Empresas */}
      <Section
        title="Empresas"
        icon={<Building2 className="h-5 w-5 text-primary" aria-hidden />}
        action={
          <Button variant="ghost" size="sm" asChild>
            <Link to="/empresas">Ver todas</Link>
          </Button>
        }
      >
        {companies.length === 0 ? (
          <EmptyHint text="As empresas aparecem aqui assim que forem registadas." />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {companies.map((company) => (
              <Link
                key={company.id}
                to="/empresas/$slug"
                params={{ slug: company.slug }}
                className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-[var(--shadow-card)]"
              >
                <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-primary-soft text-primary">
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
                <p className="mt-3 truncate text-sm font-bold">{company.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {company.open_jobs} vaga{company.open_jobs === 1 ? "" : "s"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* Criador de CV */}
      <section className="mt-8 overflow-hidden rounded-3xl border border-border bg-surface p-5">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <FileText className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="mt-3 text-lg font-extrabold">Criador de CV Moza Empregos</h2>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Modelos profissionais em formato A4, edição passo a passo no telemóvel e exportação para
          PDF e Word.
        </p>
        <Button asChild className="mt-4">
          <Link to="/criar-cv" className="gap-1">
            Conhecer o Criador de CV <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    </AppShell>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
      {text}
    </p>
  );
}
