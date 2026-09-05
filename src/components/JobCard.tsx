import { Link } from "@tanstack/react-router";
import { Banknote, Building2, Clock, MapPin } from "lucide-react";
import type { Job } from "@/lib/jobs";

export function JobCard({ job }: { job: Job }) {
  return (
    <Link
      to="/vagas/$slug"
      params={{ slug: job.slug }}
      className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-semibold leading-snug group-hover:text-primary">
            {job.title}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            {job.company}
          </p>
        </div>
        {job.is_featured && (
          <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground">
            Destaque
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
          <MapPin className="h-3 w-3" />
          {job.province}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
          <Clock className="h-3 w-3" />
          {job.employment_type}
        </span>
        {job.salary_range && (
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
            <Banknote className="h-3 w-3" />
            {job.salary_range}
          </span>
        )}
      </div>
    </Link>
  );
}
