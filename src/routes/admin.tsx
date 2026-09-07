import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bold, Link2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/ImageUpload";
import { useSession } from "@/hooks/useSession";
import { EXPERIENCE_LABELS, JOB_TYPE_LABELS } from "@/lib/jobs.types";
import {
  adminDeleteJob,
  adminDeleteUser,
  adminListJobs,
  adminListUsers,
  adminOverview,
  adminSaveJob,
  adminSetRole,
  amIAdmin,
  type AdminJobInput,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel de administração | Moza Empregos" },
      {
        name: "description",
        content: "Área reservada para gerir vagas, utilizadores e estatísticas do Moza Empregos.",
      },
      { property: "og:title", content: "Painel de administração | Moza Empregos" },
      { property: "og:description", content: "Gestão de vagas, utilizadores e visualizações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminPage,
});

const TABS = ["Visão geral", "Vagas", "Visualizações", "Utilizadores"] as const;

const EMPTY_JOB: AdminJobInput = {
  title: "",
  slug: "",
  company_name: "",
  location: "Maputo",
  category: "Administração",
  job_type: "tempo_inteiro",
  experience_level: "junior",
  summary: "",
  description: "",
  image_url: "",
  status: "publicada",
  is_featured: false,
  salary_min: null,
  salary_max: null,
  apply_email: "",
  apply_url: "",
};

function AdminPage() {
  const { user, loading } = useSession();
  const checkAdmin = useServerFn(amIAdmin);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Visão geral");

  const admin = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: () => checkAdmin({}),
    enabled: Boolean(user),
  });

  if (loading || (user && admin.isLoading)) {
    return (
      <AppShell>
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <Gate
          title="Entrar no painel"
          text="Inicie sessão com a sua conta de administrador para gerir vagas e utilizadores."
        />
      </AppShell>
    );
  }

  if (!admin.data) {
    return (
      <AppShell>
        <Gate
          title="Acesso restrito"
          text="A sua conta não tem permissões de administrador."
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold">Painel de administração</h1>
      <nav className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium ${
              tab === t
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </nav>

      <div className="mt-5">
        {tab === "Visão geral" && <Overview />}
        {tab === "Vagas" && <JobsManager />}
        {tab === "Visualizações" && <ViewsPanel />}
        {tab === "Utilizadores" && <UsersManager />}
      </div>
    </AppShell>
  );
}

function Gate({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto mt-12 max-w-md rounded-3xl border border-border bg-card p-6 text-center">
      <h1 className="text-xl font-extrabold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{text}</p>
      <Button asChild className="mt-4">
        <Link to="/auth">Iniciar sessão</Link>
      </Button>
    </div>
  );
}

function Overview() {
  const fn = useServerFn(adminOverview);
  const { data, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => fn({}) });
  if (isLoading || !data) return <Loader2 className="h-5 w-5 animate-spin" />;
  const cards = [
    { label: "Vagas totais", value: data.jobs },
    { label: "Publicadas", value: data.published },
    { label: "Utilizadores", value: data.users },
    { label: "Candidaturas", value: data.applications },
    { label: "Vagas guardadas", value: data.saved },
    { label: "CVs pagos", value: data.purchases },
    { label: "Visualizações (top)", value: data.totalViews },
  ];
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-2xl font-extrabold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
      <h2 className="mt-6 text-base font-extrabold">Vagas mais vistas</h2>
      <ul className="mt-2 divide-y divide-border rounded-2xl border border-border bg-card">
        {data.topJobs.map((j) => (
          <li key={j.slug} className="flex items-center justify-between gap-3 p-3 text-sm">
            <span className="truncate">{j.title}</span>
            <span className="shrink-0 font-semibold">{j.views_count} vistas</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function JobsManager() {
  const qc = useQueryClient();
  const list = useServerFn(adminListJobs);
  const save = useServerFn(adminSaveJob);
  const remove = useServerFn(adminDeleteJob);
  const [form, setForm] = useState<AdminJobInput | null>(null);

  const jobs = useQuery({ queryKey: ["admin-jobs"], queryFn: () => list({}) });

  const saveMutation = useMutation({
    mutationFn: (input: AdminJobInput) => save({ data: input }),
    onSuccess: () => {
      toast.success("Vaga guardada");
      setForm(null);
      void qc.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Vaga eliminada");
      void qc.invalidateQueries({ queryKey: ["admin-jobs"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (form) {
    return (
      <JobForm
        value={form}
        busy={saveMutation.isPending}
        onCancel={() => setForm(null)}
        onSave={(v) => saveMutation.mutate(v)}
      />
    );
  }

  return (
    <div>
      <Button className="gap-1" onClick={() => setForm({ ...EMPTY_JOB })}>
        <Plus className="h-4 w-4" /> Nova vaga
      </Button>
      <ul className="mt-4 space-y-2">
        {(jobs.data ?? []).map((j: any) => (
          <li key={j.id} className="rounded-2xl border border-border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-semibold">{j.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {j.company_name} · {j.location} · {j.status} · {j.views_count ?? 0} vistas
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Editar"
                  onClick={() =>
                    setForm({
                      id: j.id,
                      title: j.title ?? "",
                      slug: j.slug ?? "",
                      company_name: j.company_name ?? "",
                      location: j.location ?? "",
                      category: j.category ?? "",
                      job_type: j.job_type ?? "tempo_inteiro",
                      experience_level: j.experience_level ?? "junior",
                      summary: j.summary ?? "",
                      description: j.description ?? "",
                      image_url: j.image_url ?? "",
                      status: j.status ?? "publicada",
                      is_featured: Boolean(j.is_featured),
                      salary_min: j.salary_min,
                      salary_max: j.salary_max,
                      apply_email: j.apply_email ?? "",
                      apply_url: j.apply_url ?? "",
                    })
                  }
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Eliminar"
                  className="text-destructive"
                  onClick={() => {
                    if (confirm(`Eliminar a vaga "${j.title}"?`)) deleteMutation.mutate(j.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function JobForm({
  value,
  busy,
  onSave,
  onCancel,
}: {
  value: AdminJobInput;
  busy: boolean;
  onSave: (v: AdminJobInput) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState<AdminJobInput>(value);
  const set = <K extends keyof AdminJobInput>(k: K, val: AdminJobInput[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  function wrap(kind: "bold" | "link") {
    const el = document.getElementById("job-description") as HTMLTextAreaElement | null;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = v.description.slice(start, end) || (kind === "bold" ? "texto" : "nome");
    const url = kind === "link" ? prompt("Endereço do link (https://...)") ?? "" : "";
    if (kind === "link" && !url) return;
    const insert = kind === "bold" ? `**${selected}**` : `[${selected}](${url})`;
    set("description", v.description.slice(0, start) + insert + v.description.slice(end));
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Text label="Título" value={v.title} onChange={(x) => {
          set("title", x);
          if (!v.id) set("slug", slugify(x));
        }} />
        <Text label="Slug (URL)" value={v.slug} onChange={(x) => set("slug", slugify(x))} />
        <Text label="Empresa" value={v.company_name} onChange={(x) => set("company_name", x)} />
        <Text label="Localização" value={v.location} onChange={(x) => set("location", x)} />
        <Text label="Categoria" value={v.category} onChange={(x) => set("category", x)} />
        <div className="sm:col-span-2">
          <Label>Imagem da vaga</Label>
          <div className="mt-1 space-y-2">
            <ImageUpload value={v.image_url} onChange={(x) => set("image_url", x)} />
            <Input
              placeholder="ou cole um endereço de imagem (https://...)"
              value={v.image_url}
              onChange={(e) => set("image_url", e.target.value)}
            />
          </div>
        </div>
        <Select
          label="Tipo"
          value={v.job_type}
          options={Object.entries(JOB_TYPE_LABELS)}
          onChange={(x) => set("job_type", x)}
        />
        <Select
          label="Experiência"
          value={v.experience_level}
          options={Object.entries(EXPERIENCE_LABELS)}
          onChange={(x) => set("experience_level", x)}
        />
        <Select
          label="Estado"
          value={v.status}
          options={[
            ["publicada", "Publicada"],
            ["rascunho", "Rascunho"],
            ["fechada", "Fechada"],
          ]}
          onChange={(x) => set("status", x)}
        />
        <Text
          label="Salário mínimo (MZN)"
          value={v.salary_min?.toString() ?? ""}
          onChange={(x) => set("salary_min", x ? Number(x) : null)}
        />
        <Text
          label="Salário máximo (MZN)"
          value={v.salary_max?.toString() ?? ""}
          onChange={(x) => set("salary_max", x ? Number(x) : null)}
        />
        <Text label="Email de candidatura" value={v.apply_email} onChange={(x) => set("apply_email", x)} />
        <Text label="Link de candidatura" value={v.apply_url} onChange={(x) => set("apply_url", x)} />
      </div>

      <div className="mt-3">
        <Label htmlFor="summary">Resumo</Label>
        <Textarea
          id="summary"
          rows={2}
          className="mt-1"
          value={v.summary}
          onChange={(e) => set("summary", e.target.value)}
        />
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="job-description">Descrição</Label>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" className="gap-1" onClick={() => wrap("bold")}>
              <Bold className="h-4 w-4" /> Negrito
            </Button>
            <Button size="sm" variant="outline" className="gap-1" onClick={() => wrap("link")}>
              <Link2 className="h-4 w-4" /> Link
            </Button>
          </div>
        </div>
        <Textarea
          id="job-description"
          rows={10}
          className="mt-1"
          value={v.description}
          onChange={(e) => set("description", e.target.value)}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Selecione o texto e use os botões: **negrito** e [nome](https://link).
        </p>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={v.is_featured}
          onChange={(e) => set("is_featured", e.target.checked)}
        />
        Vaga em destaque
      </label>

      <p className="mt-3 text-xs text-muted-foreground">
        Nenhum campo é obrigatório — pode guardar com os dados que tiver.
      </p>

      <div className="mt-4 flex gap-2">
        <Button disabled={busy} onClick={() => onSave(v)}>
          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null} Guardar
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function ViewsPanel() {
  const list = useServerFn(adminListJobs);
  const jobs = useQuery({ queryKey: ["admin-jobs"], queryFn: () => list({}) });
  const rows = [...((jobs.data ?? []) as any[])].sort(
    (a, b) => (b.views_count ?? 0) - (a.views_count ?? 0),
  );
  const total = rows.reduce((sum, r) => sum + (r.views_count ?? 0), 0);

  if (jobs.isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <div>
      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-2xl font-extrabold">{total}</p>
        <p className="text-xs text-muted-foreground">Visualizações totais em {rows.length} vagas</p>
      </div>
      <ul className="mt-4 divide-y divide-border rounded-2xl border border-border bg-card">
        {rows.map((j) => (
          <li key={j.id} className="p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{j.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {j.company_name} · {j.status}
                </p>
              </div>
              <span className="shrink-0 text-sm font-extrabold">{j.views_count ?? 0}</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${total ? Math.round(((j.views_count ?? 0) / total) * 100) : 0}%`,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function UsersManager() {
  const qc = useQueryClient();
  const list = useServerFn(adminListUsers);
  const setRole = useServerFn(adminSetRole);
  const del = useServerFn(adminDeleteUser);
  const users = useQuery({ queryKey: ["admin-users"], queryFn: () => list({}) });

  const roleMutation = useMutation({
    mutationFn: (input: { userId: string; role: string; grant: boolean }) => setRole({ data: input }),
    onSuccess: () => {
      toast.success("Permissões atualizadas");
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => del({ data: { userId } }),
    onSuccess: () => {
      toast.success("Utilizador eliminado");
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <ul className="space-y-2">
      {(users.data ?? []).map((u) => (
        <li key={u.id} className="rounded-2xl border border-border bg-card p-3">
          <p className="font-semibold">{u.full_name || "Sem nome"}</p>
          <p className="text-xs text-muted-foreground">
            {u.headline || "—"} · {u.location || "—"} · {u.phone || "sem telefone"}
          </p>
          <p className="mt-1 text-xs">Permissões: {u.roles.length ? u.roles.join(", ") : "user"}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(["admin", "employer"] as const).map((role) => {
              const has = u.roles.includes(role);
              return (
                <Button
                  key={role}
                  size="sm"
                  variant={has ? "secondary" : "outline"}
                  onClick={() => roleMutation.mutate({ userId: u.id, role, grant: !has })}
                >
                  {has ? `Remover ${role}` : `Tornar ${role}`}
                </Button>
              );
            })}
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive"
              onClick={() => {
                if (confirm("Eliminar definitivamente este utilizador?")) deleteMutation.mutate(u.id);
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Eliminar
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Text({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1" />
    </div>
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
  options: [string, string][];
  onChange: (v: string) => void;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        {options.map(([val, text]) => (
          <option key={val} value={val}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}

function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
