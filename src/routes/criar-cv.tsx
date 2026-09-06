import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Loader2, Lock, Save } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { CvPreview, EMPTY_CV, type CvData } from "@/components/cv/CvPreview";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CV_PRICE_MZN, PAYMENT_METHODS, PROVINCES, type PaymentMethod } from "@/lib/constants";
import { checkCvPayment, getCvAccess, startCvPayment } from "@/lib/payments.functions";

const TEMPLATES = ["moderno", "clássico"] as const;

export const Route = createFileRoute("/criar-cv")({
  head: () => ({
    meta: [
      { title: "Criar CV profissional online | Moza Empregos" },
      {
        name: "description",
        content:
          "Crie um CV profissional em português, pré-visualize gratuitamente e descarregue após o pagamento por M-Pesa, e-Mola, mKesh ou cartão.",
      },
      { property: "og:title", content: "Criar CV profissional online | Moza Empregos" },
      {
        property: "og:description",
        content: "Modelos prontos, em minutos, pensados para o mercado moçambicano.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CriarCv,
});

function CriarCv() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<CvData>(EMPTY_CV);
  const [template, setTemplate] = useState<string>("moderno");
  const [cvId, setCvId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const access = useServerFn(getCvAccess);
  const start = useServerFn(startCvPayment);
  const check = useServerFn(checkCvPayment);

  const accessQuery = useQuery({
    queryKey: ["cv-access", user?.id],
    enabled: Boolean(user),
    queryFn: () => access({ data: {} }),
  });
  const paid = accessQuery.data?.paid ?? false;

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data: rows } = await supabase
        .from("cvs")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1);
      const row = rows?.[0];
      if (row) {
        setCvId(row.id);
        setTemplate(row.template);
        setData({ ...EMPTY_CV, ...((row.data as Partial<CvData>) ?? {}) });
      }
    })();
  }, [user]);

  const set = (key: keyof CvData) => (v: string) => setData((d) => ({ ...d, [key]: v }));

  async function save() {
    if (!user) return;
    setSaving(true);
    try {
      if (cvId) {
        const { error } = await supabase
          .from("cvs")
          .update({ data: data as never, template })
          .eq("id", cvId);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase
          .from("cvs")
          .insert({ user_id: user.id, data: data as never, template })
          .select("id")
          .single();
        if (error) throw error;
        setCvId(created.id);
      }
      toast.success("CV guardado.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível guardar.");
    } finally {
      setSaving(false);
    }
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
          <h1 className="font-display text-xl font-bold">Criar o meu CV</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre na sua conta para criar, guardar e descarregar o seu CV.
          </p>
          <Link
            to="/auth"
            className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Entrar / Criar conta
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Criar o meu CV</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha, pré-visualize e descarregue por {CV_PRICE_MZN} MZN.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-primary disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "A guardar..." : "Guardar"}
        </button>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="flex gap-2">
            {TEMPLATES.map((t) => (
              <button
                key={t}
                onClick={() => setTemplate(t)}
                className={`rounded-xl border px-4 py-2 text-sm font-medium capitalize ${
                  template === t ? "border-primary bg-secondary text-secondary-foreground" : "border-border"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <Input label="Nome completo" value={data.fullName} onChange={set("fullName")} />
          <Input label="Profissão / área" value={data.headline} onChange={set("headline")} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Email" value={data.email} onChange={set("email")} />
            <Input label="Telemóvel" value={data.phone} onChange={set("phone")} />
          </div>
          <label className="block text-xs font-medium text-muted-foreground">
            Província
            <select
              value={data.province}
              onChange={(e) => set("province")(e.target.value)}
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
          <Area label="Perfil profissional" value={data.summary} onChange={set("summary")} />
          <Area label="Experiência profissional" value={data.experience} onChange={set("experience")} />
          <Area label="Formação académica" value={data.education} onChange={set("education")} />
          <Area label="Competências" value={data.skills} onChange={set("skills")} />
          <Area label="Idiomas" value={data.languages} onChange={set("languages")} />
        </div>

        <div className="space-y-4">
          <CvPreview data={data} template={template} watermark={!paid} />
          {paid ? (
            <button
              onClick={() => window.print()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-success px-5 py-3 text-sm font-semibold text-success-foreground"
            >
              <Download className="h-4 w-4" /> Descarregar CV (PDF)
            </button>
          ) : (
            <PaymentPanel
              cvId={cvId}
              onPaid={() => {
                void accessQuery.refetch();
                toast.success("Pagamento confirmado! Já pode descarregar o CV.");
              }}
              start={start}
              check={check}
              onNeedSave={save}
              navigateHome={() => navigate({ to: "/" })}
            />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function PaymentPanel({
  cvId,
  onPaid,
  start,
  check,
  onNeedSave,
}: {
  cvId: string | null;
  onPaid: () => void;
  start: ReturnType<typeof useServerFn<typeof startCvPayment>>;
  check: ReturnType<typeof useServerFn<typeof checkCvPayment>>;
  onNeedSave: () => Promise<void>;
  navigateHome: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("mpesa");
  const [msisdn, setMsisdn] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const methodInfo = useMemo(() => PAYMENT_METHODS.find((m) => m.value === method)!, [method]);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  function pollFrom(ref: string) {
    let tries = 0;
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(async () => {
      tries += 1;
      const res = await check({ data: { reference: ref } });
      if (res.status === "paid") {
        if (timer.current) clearInterval(timer.current);
        setBusy(false);
        onPaid();
        return;
      }
      if (res.status === "failed" || tries > 40) {
        if (timer.current) clearInterval(timer.current);
        setBusy(false);
        setStatus(("message" in res && res.message) || "O pagamento não foi concluído.");
      }
    }, 5000);
  }

  async function pay() {
    setBusy(true);
    setStatus("A iniciar pagamento...");
    try {
      await onNeedSave();
      const res = await start({ data: { cvId, method, msisdn: msisdn || undefined } });
      if (!res.ok) {
        setBusy(false);
        setStatus(res.message);
        toast.error(res.message);
        return;
      }
      setReference(res.reference);
      if (res.hostedUrl) {
        window.open(res.hostedUrl, "_blank", "noopener");
        setStatus("Conclua o pagamento na página segura da NetShop. Estamos a confirmar...");
      } else {
        setStatus("Confirme o pagamento no seu telemóvel. Estamos a confirmar...");
      }
      pollFrom(res.reference);
    } catch (err) {
      setBusy(false);
      setStatus(err instanceof Error ? err.message : "Erro inesperado.");
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-display text-base font-semibold">
        <Lock className="h-4 w-4" /> Descarregar sem marca de água — {CV_PRICE_MZN} MZN
      </h2>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            key={m.value}
            onClick={() => setMethod(m.value)}
            className={`rounded-xl border px-3 py-2.5 text-left text-sm font-medium ${
              method === m.value ? "border-primary bg-secondary text-secondary-foreground" : "border-border"
            }`}
          >
            {m.label}
            <span className="block text-[11px] font-normal text-muted-foreground">{m.hint}</span>
          </button>
        ))}
      </div>

      {method !== "card" && (
        <label className="mt-3 block text-xs font-medium text-muted-foreground">
          Número {methodInfo.label}
          <input
            value={msisdn}
            onChange={(e) => setMsisdn(e.target.value)}
            inputMode="tel"
            placeholder="84 123 4567"
            className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
      )}

      <button
        onClick={pay}
        disabled={busy}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {busy ? "A aguardar confirmação..." : `Pagar ${CV_PRICE_MZN} MZN`}
      </button>

      {status && <p className="mt-3 text-xs text-muted-foreground">{status}</p>}
      {reference && (
        <p className="mt-1 text-[11px] text-muted-foreground">Referência: {reference}</p>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs font-medium text-muted-foreground">
      {label}
      <textarea
        value={value}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary"
      />
    </label>
  );
}
