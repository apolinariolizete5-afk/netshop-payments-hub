import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Building2, Clock, MapPin, Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/AppShell";
import { fetchJobBySlug } from "@/lib/jobs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/vagas/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Vaga: ${params.slug.replace(/-/g, " ")} | Moza Empregos` },
      {
        name: "description",
        content:
          "Detalhes da vaga, requisitos e candidatura online no Moza Empregos, o portal de empregos de Moçambique.",
      },
      { property: "og:title", content: "Vaga de emprego | Moza Empregos" },
      {
        property: "og:description",
        content: "Veja os requisitos e candidate-se directamente pela app.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobDetail,
});

function JobDetail() {
  const { slug } = Route.useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  const { data: job, isLoading } = useQuery({
    queryKey: ["job", slug],
    queryFn: () => fetchJobBySlug(slug),
  });

  const { data: application } = useQuery({
    queryKey: ["application", job?.id, user?.id],
    enabled: Boolean(job?.id && user?.id),
    queryFn: async () => {
      const { data } = await supabase
        .from("applications")
        .select("id, status")
        .eq("job_id", job!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const apply = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("applications")
        .insert({ job_id: job!.id, user_id: user!.id, message: message || null });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Candidatura enviada!");
      queryClient.invalidateQueries({ queryKey: ["application"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </AppShell>
    );
  }

  if (!job) {
    return (
      <AppShell>
        <p className="py-16 text-center text-muted-foreground">Vaga não encontrada.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Link
        to="/vagas"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar às vagas
      </Link>

      <article className="mt-4 rounded-2xl border border-border bg-card p-5">
        <h1 className="font-display text-2xl font-bold leading-tight">{job.title}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" /> {job.company}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <MapPin className="h-3 w-3" /> {job.province}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
            <Clock className="h-3 w-3" /> {job.employment_type}
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
            {job.category}
          </span>
          {job.salary_range && (
            <span className="rounded-full bg-accent px-2.5 py-1 font-semibold text-accent-foreground">
              {job.salary_range}
            </span>
          )}
        </div>

        <section className="mt-6">
          <h2 className="font-display text-base font-semibold">Descrição</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {job.description}
          </p>
        </section>

        {job.requirements && (
          <section className="mt-5">
            <h2 className="font-display text-base font-semibold">Requisitos</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
              {job.requirements}
            </p>
          </section>
        )}
      </article>

      <section className="mt-5 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-base font-semibold">Candidatar-me</h2>
        {!user ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <Link to="/auth" className="font-semibold text-primary">
              Entre na sua conta
            </Link>{" "}
            para se candidatar a esta vaga.
          </p>
        ) : application ? (
          <p className="mt-2 text-sm text-success">
            Já enviou a sua candidatura a esta vaga ({application.status}).
          </p>
        ) : (
          <>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Escreva uma breve mensagem de apresentação (opcional)"
              className="mt-3 w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={() => apply.mutate()}
              disabled={apply.isPending}
              className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {apply.isPending ? "A enviar..." : "Enviar candidatura"}
            </button>
          </>
        )}
        {(job.apply_email || job.apply_url) && (
          <p className="mt-3 text-xs text-muted-foreground">
            Também pode candidatar-se directamente:{" "}
            {job.apply_email ?? ""}
            {job.apply_url ? ` ${job.apply_url}` : ""}
          </p>
        )}
      </section>
    </AppShell>
  );
}
