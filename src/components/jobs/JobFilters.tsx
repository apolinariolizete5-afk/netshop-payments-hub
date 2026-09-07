import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DATE_FILTERS,
  EXPERIENCE_LABELS,
  JOB_TYPE_LABELS,
  type ExperienceLevel,
  type JobType,
} from "@/lib/jobs.types";

export interface FiltersValue {
  location: string;
  category: string;
  type: string;
  experience: string;
  days: string;
}

const ALL = "todos";

function FilterFields({
  value,
  onChange,
  locations,
  categories,
}: {
  value: FiltersValue;
  onChange: (patch: Partial<FiltersValue>) => void;
  locations: string[];
  categories: string[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Field label="Localização">
        <Select
          value={value.location || ALL}
          onValueChange={(v) => onChange({ location: v === ALL ? "" : v })}
        >
          <SelectTrigger aria-label="Localização">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as localizações</SelectItem>
            {locations.map((l) => (
              <SelectItem key={l} value={l}>
                {l}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Categoria">
        <Select
          value={value.category || ALL}
          onValueChange={(v) => onChange({ category: v === ALL ? "" : v })}
        >
          <SelectTrigger aria-label="Categoria">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas as categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Tipo de emprego">
        <Select
          value={value.type || ALL}
          onValueChange={(v) => onChange({ type: v === ALL ? "" : v })}
        >
          <SelectTrigger aria-label="Tipo de emprego">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos os tipos</SelectItem>
            {(Object.keys(JOB_TYPE_LABELS) as JobType[]).map((t) => (
              <SelectItem key={t} value={t}>
                {JOB_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Experiência">
        <Select
          value={value.experience || ALL}
          onValueChange={(v) => onChange({ experience: v === ALL ? "" : v })}
        >
          <SelectTrigger aria-label="Experiência">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Qualquer experiência</SelectItem>
            {(Object.keys(EXPERIENCE_LABELS) as ExperienceLevel[]).map((e) => (
              <SelectItem key={e} value={e}>
                {EXPERIENCE_LABELS[e]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Data">
        <Select value={value.days || "any"} onValueChange={(v) => onChange({ days: v })}>
          <SelectTrigger aria-label="Data de publicação">
            <SelectValue placeholder="Qualquer data" />
          </SelectTrigger>
          <SelectContent>
            {DATE_FILTERS.map((d) => (
              <SelectItem key={d.value} value={d.value}>
                {d.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

export function JobFilters({
  value,
  onChange,
  onClear,
  locations,
  categories,
  activeCount,
}: {
  value: FiltersValue;
  onChange: (patch: Partial<FiltersValue>) => void;
  onClear: () => void;
  locations: string[];
  categories: string[];
  activeCount: number;
}) {
  return (
    <>
      {/* Mobile: filtros em painel */}
      <div className="flex items-center gap-2 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
                  {activeCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
            <SheetHeader className="px-0">
              <SheetTitle>Filtrar vagas</SheetTitle>
            </SheetHeader>
            <div className="pb-8">
              <FilterFields
                value={value}
                onChange={onChange}
                locations={locations}
                categories={categories}
              />
            </div>
          </SheetContent>
        </Sheet>
        {activeCount > 0 && (
          <Button variant="ghost" className="gap-1" onClick={onClear}>
            <X className="h-4 w-4" /> Limpar
          </Button>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden lg:block">
        <FilterFields
          value={value}
          onChange={onChange}
          locations={locations}
          categories={categories}
        />
        {activeCount > 0 && (
          <Button variant="ghost" className="mt-3 gap-1" onClick={onClear}>
            <X className="h-4 w-4" /> Limpar filtros
          </Button>
        )}
      </div>
    </>
  );
}
