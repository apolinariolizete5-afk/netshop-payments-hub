import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { JobCard, JobCardSkeleton } from "@/components/jobs/JobCard";
import { JobSearchBar } from "@/components/jobs/JobSearchBar";
import { listCategoriesWithCounts, listFacets, listJobs } from "@/lib/jobs.functions";

export const Route = createFileRoute("/pesquisar")({
  head: () => ({
    meta: [
      { title: "Pesquisar vagas | Moza Empregos" },
      {
        name: "description",
        content:
          "Pesquise vagas por cargo, empresa, categoria ou cidade em Moçambique no Moza Empregos.",
      },
      { property: "og:title", content: "Pesquisar vagas | Moza Empregos" },
      {
        property: "og:description",
        content: "Encontre rapidamente a vaga certa por cargo, empresa ou cidade.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" && search["q"] ? { q: search["q"] } : {},
  component: PesquisarPage,
});

function PesquisarPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/pesquisar" });

  const results = useQuery({
    queryKey: ["search", q],
    enabled: !!q,
    queryFn: () => listJobs({ data: { q: q as string, limit: 20 } }),
  });

  const facets = useQuery({ queryKey: ["facets"], queryFn: () => listFacets() });
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () => listCategoriesWithCounts(),
  });

  return (
    <AppShell>
      <h1 className="mb-3 text-2xl font-extrabold">Pesquisar</h1>
      <JobSearchBar
        autoFocus
        defaultValue={q ?? ""}
        onSubmit={(term) => navigate({ search: term ? { q: term } : {} })}
      />

      {!q && (
        <div className="mt-6 space-y-6">
          <div>
            <h2 className="flex items-center gap-2 text-base font-extrabold">
              <TrendingUp className="h-4 w-4 text-primary" aria-hidden /> Categorias populares
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(categories.data ?? []).slice(0, 12).map(({ category, count }) => (
                <Link
                  key={category}
                  to="/vagas"
                  search={{ category }}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
                >
                  {category} <span className="text-xs text-muted-foreground">{count}</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-base font-extrabold">Cidades</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(facets.data?.locations ?? []).slice(0, 12).map((location) => (
                <Link
                  key={location}
                  to="/vagas"
                  search={{ location }}
                  className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium hover:border-primary hover:text-primary"
                >
                  {location}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {q && (
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" aria-hidden />
            {results.isPending
              ? "A pesquisar..."
              : `${results.data?.total ?? 0} resultado(s) para "${q}"`}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {results.isPending &&
              Array.from({ length: 4 }).map((_, index) => <JobCardSkeleton key={index} />)}
            {results.data?.jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {results.data && results.data.jobs.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
              Nada encontrado. Tente outras palavras-chave.
            </p>
          )}
        </section>
      )}
    </AppShell>
  );
}
