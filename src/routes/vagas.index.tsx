import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { JobCard } from "@/components/JobCard";
import { fetchJobs } from "@/lib/jobs";
import { CATEGORIES, EMPLOYMENT_TYPES, PROVINCES } from "@/lib/constants";

type VagasSearch = { categoria?: string; provincia?: string; tipo?: string };

export const Route = createFileRoute("/vagas/")({
  validateSearch: (search: Record<string, unknown>): VagasSearch => ({
    categoria: typeof search["categoria"] === "string" ? search["categoria"] : undefined,
    provincia: typeof search["provincia"] === "string" ? search["provincia"] : undefined,
    tipo: typeof search["tipo"] === "string" ? search["tipo"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Vagas de emprego em Moçambique | Moza Empregos" },
      {
        name: "description",
        content:
          "Lista actualizada de vagas de emprego em Moçambique, com filtros por categoria, província e tipo de contrato.",
      },
      { property: "og:title", content: "Vagas de emprego em Moçambique | Moza Empregos" },
      {
        property: "og:description",
        content: "Filtre vagas por categoria, província e tipo de contrato.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VagasPage,
});

function VagasPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/vagas" });

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", "list", search],
    queryFn: () =>
      fetchJobs({
        ...(search.categoria ? { category: search.categoria } : {}),
        ...(search.provincia ? { province: search.provincia } : {}),
        ...(search.tipo ? { employmentType: search.tipo } : {}),
      }),
  });

  const setFilter = (key: keyof VagasSearch, value: string) =>
    navigate({ search: (prev) => ({ ...prev, [key]: value || undefined }) });

  return (
    <AppShell>
      <h1 className="font-display text-2xl font-bold">Vagas</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {isLoading ? "A carregar..." : `${data?.length ?? 0} vaga(s) encontrada(s)`}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Select
          label="Categoria"
          value={search.categoria ?? ""}
          options={[...CATEGORIES]}
          onChange={(v) => setFilter("categoria", v)}
        />
        <Select
          label="Província"
          value={search.provincia ?? ""}
          options={[...PROVINCES]}
          onChange={(v) => setFilter("provincia", v)}
        />
        <Select
          label="Tipo"
          value={search.tipo ?? ""}
          options={[...EMPLOYMENT_TYPES]}
          onChange={(v) => setFilter("tipo", v)}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {isLoading
          ? [0, 1, 2, 3].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />)
          : (data ?? []).map((job) => <JobCard key={job.id} job={job} />)}
      </div>

      {!isLoading && (data?.length ?? 0) === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Nenhuma vaga corresponde a estes filtros.
        </p>
      )}
    </AppShell>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
      >
        <option value="">Todas</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
