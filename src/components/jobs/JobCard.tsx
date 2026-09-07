import { Link } from "@tanstack/react-router";
import { Building2, CalendarDays, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SaveJobButton } from "./SaveJobButton";
import {
  EXPERIENCE_LABELS,
  JOB_TYPE_LABELS,
  formatSalary,
  timeAgo,
  type JobListItem,
} from "@/lib/jobs.types";

export function JobCard({ job }: { job: JobListItem }) {
  const salary = formatSalary(job);

  return (
    <article className="group relative rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-[var(--shadow-card)]">
      {job.image_url ? (
        <img
          src={job.image_url}
          alt={`Imagem da vaga ${job.title}`}
          loading="lazy"
          className="mb-3 h-32 w-full rounded-xl object-cover sm:h-40"
        />
      ) : null}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-primary-soft text-primary">
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={`Logótipo de ${job.company_name}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <Building2 className="h-5 w-5" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold leading-snug">
              <Link
                to="/vagas/$slug"
                params={{ slug: job.slug }}
                className="after:absolute after:inset-0 after:content-['']"
              >
                {job.title}
              </Link>
            </h3>
            <p className="truncate text-sm text-muted-foreground">{job.company_name}</p>
          </div>
        </div>
        <div className="relative z-10">
          <SaveJobButton jobId={job.id} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {job.location}
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          {timeAgo(job.published_at)}
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{job.summary}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge variant="secondary">{job.category}</Badge>
        <Badge variant="outline">{JOB_TYPE_LABELS[job.job_type]}</Badge>
        <Badge variant="outline">{EXPERIENCE_LABELS[job.experience_level]}</Badge>
        {salary && (
          <Badge className="bg-accent-soft text-accent-foreground hover:bg-accent-soft">
            {salary}
          </Badge>
        )}
      </div>

      <div className="mt-4">
        <Link
          to="/vagas/$slug"
          params={{ slug: job.slug }}
          className="relative z-10 inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-deep"
        >
          Ver vaga
        </Link>
      </div>
    </article>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border bg-card p-4">
      <div className="flex gap-3">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-5/6 rounded bg-muted" />
      </div>
    </div>
  );
}
