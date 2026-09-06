import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { PROVINCES } from "@/lib/constants";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "O meu perfil e candidaturas | Moza Empregos" },
      {
        name: "description",
        content:
          "Gira os seus dados pessoais, veja as candidaturas enviadas e o estado do seu CV no Moza Empregos.",
      },
      { property: "og:title", content: "O meu perfil | Moza Empregos" },
      { property: "og:description", content: "Dados pessoais e candidaturas num só lugar." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Perfil,
});

function Perfil() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, phone, province")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
        setProvince(data.province ?? "");
      }
    })();
  }, [user]);

  const applications = useQuery({
    queryKey: ["applications", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status, created_at, jobs(title, company, slug)")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
  });

  async function save() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName, phone, province });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Perfil actualizado.");
  }

  if (loading) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="mx-auto max-w-md rounded-2xl border border-border bg-card p-6 text-center">
          <h1 className="font-display text-xl font-bold">O meu perfil</h1>
          <p className="mt-2 text-sm text-muted-foreground">Entre para ver o seu perfil.</p>
          <Link
            to="/auth"
            className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Entrar
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">O meu perfil</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            navigate({ to: "/" });
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:border-destructive hover:text-destructive"
        >
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>

      <section className="mt-5 space-y-3 rounded-2xl border border-border bg-card p-5">
        <label className="block text-xs font-medium text-muted-foreground">
          Nome completo
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Telemóvel
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <label className="block text-xs font-medium text-muted-foreground">
          Província
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >
            <option value="">Seleccione</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {saving ? "A guardar..." : "Guardar alterações"}
        </button>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold">As minhas candidaturas</h2>
        <div className="mt-3 space-y-2">
          {(applications.data ?? []).map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
            >
              <div>
                <p className="text-sm font-semibold">{a.jobs?.title}</p>
                <p className="text-xs text-muted-foreground">{a.jobs?.company}</p>
              </div>
              <span className="rounded-full bg-muted px-3 py-1 text-xs">{a.status}</span>
            </div>
          ))}
          {!applications.isLoading && (applications.data?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground">Ainda não se candidatou a nenhuma vaga.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
