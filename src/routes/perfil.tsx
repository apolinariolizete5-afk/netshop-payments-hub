import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Bell, Bookmark, FileText, LogOut, Send, User } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { useApplications, useSavedJobs } from "@/hooks/useUserJobs";
import { timeAgo } from "@/lib/jobs.types";

export const Route = createFileRoute("/perfil")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "O meu perfil | Moza Empregos" },
      {
        name: "description",
        content: "Gira o seu perfil, vagas guardadas e candidaturas no Moza Empregos.",
      },
      { property: "og:title", content: "O meu perfil | Moza Empregos" },
      {
        property: "og:description",
        content: "Perfil, vagas guardadas e candidaturas.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PerfilPage,
});

const STATUS_LABELS: Record<string, string> = {
  enviada: "Enviada",
  em_analise: "Em análise",
  entrevista: "Entrevista",
  rejeitada: "Não selecionado",
  aceite: "Aceite",
};

function PerfilPage() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ full_name: "", headline: "", phone: "", location: "" });
  const [saving, setSaving] = useState(false);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, headline, phone, location")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const saved = useSavedJobs(user?.id);
  const applications = useApplications(user?.id);

  useEffect(() => {
    if (profile.data) {
      setForm({
        full_name: profile.data.full_name ?? "",
        headline: profile.data.headline ?? "",
        phone: profile.data.phone ?? "",
        location: profile.data.location ?? "",
      });
    }
  }, [profile.data]);

  if (!loading && !user) {
    return (
      <AppShell>
        <div className="py-16 text-center">
          <h1 className="text-xl font-extrabold">Entre na sua conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Precisa de uma conta para guardar vagas e candidatar-se.
          </p>
          <Button asChild className="mt-4">
            <Link to="/auth">Entrar ou criar conta</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        headline: form.headline || null,
        phone: form.phone || null,
        location: form.location || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Perfil atualizado");
    profile.refetch();
  };

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <User className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold">
              {form.full_name || "O meu perfil"}
            </h1>
            <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" aria-label="Terminar sessão" onClick={signOut}>
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" asChild className="justify-start gap-2">
          <Link to="/notificacoes">
            <Bell className="h-4 w-4" /> Notificações
          </Link>
        </Button>
        <Button variant="outline" asChild className="justify-start gap-2">
          <Link to="/criar-cv">
            <FileText className="h-4 w-4" /> Criar CV
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="dados" className="mt-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="guardadas">Guardadas</TabsTrigger>
          <TabsTrigger value="candidaturas">Candidaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-3">
          <Field id="full_name" label="Nome completo" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
          <Field id="headline" label="Título profissional" value={form.headline} onChange={(v) => setForm({ ...form, headline: v })} />
          <Field id="phone" label="Telefone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
          <Field id="location" label="Localização" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <Button onClick={saveProfile} disabled={saving}>
            {saving ? "A guardar..." : "Guardar alterações"}
          </Button>
        </TabsContent>

        <TabsContent value="guardadas">
          {(saved.data ?? []).length === 0 ? (
            <Empty icon={<Bookmark className="h-5 w-5" />} text="Ainda não guardou nenhuma vaga." />
          ) : (
            <ul className="space-y-2">
              {(saved.data ?? []).map((row) => {
                const job = row.jobs as unknown as {
                  slug: string;
                  title: string;
                  company_name: string;
                  location: string;
                } | null;
                if (!job) return null;
                return (
                  <li key={row.job_id} className="rounded-2xl border border-border bg-card p-4">
                    <Link
                      to="/vagas/$slug"
                      params={{ slug: job.slug }}
                      className="text-sm font-bold hover:underline"
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {job.company_name} · {job.location}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="candidaturas">
          {(applications.data ?? []).length === 0 ? (
            <Empty icon={<Send className="h-5 w-5" />} text="Ainda não enviou candidaturas." />
          ) : (
            <ul className="space-y-2">
              {(applications.data ?? []).map((row) => {
                const job = row.jobs as unknown as {
                  slug: string;
                  title: string;
                  company_name: string;
                } | null;
                return (
                  <li key={row.id} className="rounded-2xl border border-border bg-card p-4">
                    {job ? (
                      <Link
                        to="/vagas/$slug"
                        params={{ slug: job.slug }}
                        className="text-sm font-bold hover:underline"
                      >
                        {job.title}
                      </Link>
                    ) : (
                      <span className="text-sm font-bold">Vaga removida</span>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {job?.company_name} · {STATUS_LABELS[row.status] ?? row.status} ·{" "}
                      {timeAgo(row.created_at)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function Empty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
      <span className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-muted">
        {icon}
      </span>
      {text}
    </div>
  );
}
