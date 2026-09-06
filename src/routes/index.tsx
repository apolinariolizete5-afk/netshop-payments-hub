import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, FileText, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { JobCard } from "@/components/JobCard";
import { fetchJobs } from "@/lib/jobs";
import { CATEGORIES } from "@/lib/constants";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Moza Empregos — Vagas em Moçambique e criação de CV" },
      {
        name: "description",
        content:
          "Encontre vagas de emprego em todas as províncias de Moçambique e crie um CV profissional em minutos. Pagamento por M-Pesa, e-Mola, mKesh ou cartão.",
      },
      { property: "og:title", content: "Moza Empregos — Vagas em Moçambique e criação de CV" },
      {
        property: "og:description",
        content: "Vagas actualizadas em Moçambique e um criador de CV profissional.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  const recent = useQuery({ queryKey: ["jobs", "recent"], queryFn: () => fetchJobs({ limit: 6 }) });
  const featured = useQuery({
    queryKey: ["jobs", "featured"],
    queryFn: () => fetchJobs({ featured: true, limit: 4 }),
  });

  return (
    <AppShell>
      <section className="overflow-hidden rounded-3xl bg-primary px-5 py-8 text-primary-foreground md:px-10 md:py-12">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-semibold">
          <Sparkles className="h-3.5 w-3.5" /> Feito em Moçambique
        </p>
        <h1 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-tight md:text-5xl">
          O emprego certo e o CV que abre portas
        </h1>
        <p className="mt-3 max-w-xl text-sm opacity-90 md:text-base">
          Vagas de todas as províncias num só lugar, e um criador de CV profissional pronto a
          descarregar.
        </p>

        <form
          className="mt-6 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ to: "/pesquisar", search: { q: term } });
          }}
        >
          <div className="flex flex-1 items-center gap-2 rounded-xl bg-background px-3 py-3 text-foreground">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Cargo, empresa ou palavra-chave"
              className="w-full bg-transparent text-sm outline-none"
              aria-label="Pesquisar vagas"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground"
          >
            Pesquisar
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Categorias</h2>
        <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c}
              to="/vagas"
              search={{ categoria: c }}
              className="snap-start whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
            >
              {c}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">Crie o seu CV profissional</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Preencha os seus dados, escolha um modelo e descarregue. Pagamento único por M-Pesa,
              e-Mola, mKesh ou cartão.
            </p>
            <Link
              to="/criar-cv"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              Começar agora <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <JobSection title="Vagas recentes" jobs={recent.data} loading={recent.isLoading} />
      <JobSection title="Vagas recomendadas" jobs={featured.data} loading={featured.isLoading} />

      <div className="mt-6 text-center">
        <Link
          to="/vagas"
          className="inline-flex items-center gap-1.5 rounded-xl border border-border px-5 py-2.5 text-sm font-semibold hover:border-primary hover:text-primary"
        >
          Ver todas as vagas <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AppShell>
  );
}

function JobSection({
  title,
  jobs,
  loading,
}: {
  title: string;
  jobs: Awaited<ReturnType<typeof fetchJobs>> | undefined;
  loading: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {loading ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {(jobs ?? []).map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
}
