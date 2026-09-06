import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { JobCard } from "@/components/JobCard";
import { fetchJobs } from "@/lib/jobs";

type SearchParams = { q?: string | undefined };

export const Route = createFileRoute("/pesquisar")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search["q"] === "string" && search["q"] ? search["q"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Pesquisar vagas em Moçambique | Moza Empregos" },
      {
        name: "description",
        content:
          "Pesquise vagas de emprego por cargo, empresa ou palavra-chave em todas as províncias de Moçambique.",
      },
      { property: "og:title", content: "Pesquisar vagas | Moza Empregos" },
      { property: "og:description", content: "Encontre a vaga certa por cargo ou empresa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PesquisarPage,
});

function PesquisarPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/pesquisar" });
  const [term, setTerm] = useState(q ?? "");

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["jobs", "search", q],
    enabled: Boolean(q),
    queryFn: () => fetchJobs({ search: q! }),
  });

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">Pesquisar</h1>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ search: { q: term || undefined } });
        }}
      >
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Ex.: contabilidade, enfermeiro, Maputo"
            className="w-full bg-transparent text-sm outline-none"
            aria-label="Termo de pesquisa"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Ir
        </button>
      </form>

      {!q && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Escreva um cargo, empresa ou palavra-chave para começar.
        </p>
      )}

      {q && (
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {isLoading || isFetching
            ? [0, 1, 2].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)
            : (data ?? []).map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {q && !isFetching && (data?.length ?? 0) === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Sem resultados para "{q}".
        </p>
      )}
    </AppShell>
  );
}
