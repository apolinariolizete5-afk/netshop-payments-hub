import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  Globe,
  MapPin,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { SaveJobButton } from "@/components/jobs/SaveJobButton";
import { RichText } from "@/components/RichText";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/useSession";
import { getJobBySlug, registerJobView } from "@/lib/jobs.functions";
import { SUPPORT_EMAIL, WHATSAPP_CHANNEL_URL } from "@/lib/site";
import {
  EXPERIENCE_LABELS,
  JOB_TYPE_LABELS,
  formatSalary,
  timeAgo,
  type JobDetail,
} from "@/lib/jobs.types";

const jobQuery = (slug: string) =>
  queryOptions({
    queryKey: ["job", slug],
    queryFn: () => getJobBySlug({ data: { slug } }),
  });

export const Route = createFileRoute("/vagas/$slug")({
  loader: async ({ context, params }) => {
    const job = await context.queryClient.ensureQueryData(jobQuery(params.slug));
    if (!job) throw notFound();
    return { title: job.title, company: job.company_name, summary: job.summary };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Vaga indisponível | Moza Empregos" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.title} — ${loaderData.company} | Moza Empregos`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.summary.slice(0, 155) },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.summary.slice(0, 155) },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <AppShell>
      <p role="alert" className="py-12 text-center text-sm text-muted-foreground">
        Não foi possível carregar esta vaga. {error.message}
      </p>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="py-12 text-center">
        <h1 className="text-xl font-extrabold">Vaga não encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta vaga pode ter sido fechada ou removida.
        </p>
        <Button asChild className="mt-4">
          <Link to="/vagas">Ver todas as vagas</Link>
        </Button>
      </div>
    </AppShell>
  ),
  component: VagaPage,
});

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-6">
      <h2 className="text-base font-extrabold">{title}</h2>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ApplyDialog({ job }: { job: JobDetail }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", cover_message: "" });

  const { data: existing } = useQuery({
    queryKey: ["application", job.id, user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("id, status")
        .eq("job_id", job.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const apply = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Precisa de entrar na sua conta.");
      const { error } = await supabase.from("applications").insert({
        job_id: job.id,
        user_id: user.id,
        full_name: form.full_name || null,
        email: form.email || user.email || null,
        phone: form.phone || null,
        cover_message: form.cover_message || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setOpen(false);
      toast.success("Candidatura registada! A abrir a app de email...");
      const to = job.apply_email || SUPPORT_EMAIL;
      const subject = `Candidatura: ${job.title} — ${job.company_name}`;
      const body = [
        `Nome: ${form.full_name || user?.email || ""}`,
        `Email: ${form.email || user?.email || ""}`,
        `Telefone: ${form.phone || "—"}`,
        "",
        form.cover_message || "",
        "",
        "Enviado através do Moza Empregos.",
      ].join("\n");
      window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (job.apply_url) {
    return (
      <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
        <a href={job.apply_url} target="_blank" rel="noopener noreferrer">
          Candidatar-se <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
    );
  }

  if (!user) {
    return (
      <Button size="lg" className="w-full sm:w-auto" onClick={() => navigate({ to: "/auth" })}>
        Entrar para se candidatar
      </Button>
    );
  }

  if (existing) {
    return (
      <Button size="lg" variant="secondary" disabled className="w-full sm:w-auto">
        Candidatura enviada
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          Candidatar-se
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Candidatar-se a {job.title}</DialogTitle>
          <DialogDescription>{job.company_name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              value={form.full_name}
              onChange={(event) => setForm({ ...form, full_name: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder={user.email ?? ""}
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              inputMode="tel"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cover_message">Mensagem</Label>
            <Textarea
              id="cover_message"
              rows={4}
              placeholder="Porque é o candidato ideal para esta vaga?"
              value={form.cover_message}
              onChange={(event) => setForm({ ...form, cover_message: event.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => apply.mutate()} disabled={apply.isPending}>
            {apply.isPending ? "A enviar..." : "Enviar candidatura"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VagaPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(jobQuery(slug));
  const job = data as JobDetail;
  const salary = formatSalary(job);

  useEffect(() => {
    void registerJobView({ data: { slug } }).catch(() => {});
  }, [slug]);

  return (
    <AppShell>
      <Link
        to="/vagas"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar às vagas
      </Link>

      <article className="mt-4">
        {job.image_url ? (
          <img
            src={job.image_url}
            alt={`Imagem da vaga ${job.title}`}
            loading="lazy"
            className="mb-4 h-44 w-full rounded-3xl object-cover sm:h-60"
          />
        ) : null}
        <header className="rounded-3xl border border-border bg-card p-5">

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary-soft text-primary">
                {job.company_logo ? (
                  <img
                    src={job.company_logo}
                    alt={`Logótipo de ${job.company_name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2 className="h-6 w-6" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold leading-tight sm:text-2xl">{job.title}</h1>
                {job.company_slug ? (
                  <Link
                    to="/empresas/$slug"
                    params={{ slug: job.company_slug }}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    {job.company_name}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">{job.company_name}</p>
                )}
              </div>
            </div>
            <SaveJobButton jobId={job.id} />
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Meta icon={<MapPin className="h-4 w-4" />} label="Local" value={job.location} />
            <Meta
              icon={<Briefcase className="h-4 w-4" />}
              label="Tipo"
              value={JOB_TYPE_LABELS[job.job_type]}
            />
            <Meta
              icon={<Wallet className="h-4 w-4" />}
              label="Salário"
              value={salary ?? "A combinar"}
            />
            <Meta
              icon={<CalendarDays className="h-4 w-4" />}
              label="Publicada"
              value={timeAgo(job.published_at)}
            />
          </dl>

          <div className="mt-4 flex flex-wrap gap-1.5">
            <Badge variant="secondary">{job.category}</Badge>
            <Badge variant="outline">{EXPERIENCE_LABELS[job.experience_level]}</Badge>
            {job.is_featured && (
              <Badge className="bg-accent text-accent-foreground hover:bg-accent">Destaque</Badge>
            )}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
            <ApplyDialog job={job} />
            <SaveJobButton jobId={job.id} variant="full" className="w-full sm:w-auto" />
          </div>
        </header>

        <section className="mt-6">
          <h2 className="text-base font-extrabold">Descrição da vaga</h2>
          <RichText
            text={job.description}
            className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground"
          />

        </section>

        <List title="Responsabilidades" items={job.responsibilities} />
        <List title="Requisitos" items={job.requirements} />
        <List title="Benefícios" items={job.benefits} />

        {(job.how_to_apply || job.apply_email) && (
          <section className="mt-6 rounded-2xl border border-border bg-surface p-4">
            <h2 className="text-base font-extrabold">Como candidatar-se</h2>
            {job.how_to_apply && (
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {job.how_to_apply}
              </p>
            )}
            {job.apply_email && (
              <a
                href={`mailto:${job.apply_email}`}
                className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
              >
                {job.apply_email}
              </a>
            )}
          </section>
        )}

        {job.company_description && (
          <section className="mt-6">
            <h2 className="text-base font-extrabold">Sobre {job.company_name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{job.company_description}</p>
            {job.company_website && (
              <a
                href={job.company_website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <Globe className="h-4 w-4" /> Website
              </a>
            )}
          </section>
        )}
        <section className="mt-8 rounded-3xl border border-accent/30 bg-accent-soft/60 p-5">
          <h2 className="text-base font-extrabold">
            Talvez a sua candidatura seja rejeitada por causa do CV
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Mais de 70% dos CVs são recusados na primeira leitura. Crie em minutos um CV profissional
            com modelos premium e aumente as suas hipóteses nesta vaga.
          </p>
          <Button asChild className="mt-3">
            <Link to="/criar-cv">Criar o meu CV agora</Link>
          </Button>
        </section>

        <section className="mt-4 rounded-3xl border border-border bg-card p-5">
          <h2 className="text-base font-extrabold">Receba vagas no WhatsApp</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Entre no nosso canal e seja o primeiro a saber das novas vagas em Moçambique.
          </p>
          <Button asChild variant="outline" className="mt-3">
            <a href={WHATSAPP_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
              Entrar no canal de WhatsApp
            </a>
          </Button>
        </section>
      </article>
    </AppShell>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="truncate text-sm font-semibold">{value}</dd>
    </div>
  );
}
