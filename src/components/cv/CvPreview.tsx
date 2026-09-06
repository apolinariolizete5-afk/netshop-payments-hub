export type CvData = {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  province: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
};

export const EMPTY_CV: CvData = {
  fullName: "",
  headline: "",
  email: "",
  phone: "",
  province: "",
  summary: "",
  experience: "",
  education: "",
  skills: "",
  languages: "",
};

export function CvPreview({
  data,
  template,
  watermark,
}: {
  data: CvData;
  template: string;
  watermark: boolean;
}) {
  const accent = template === "clássico" ? "border-foreground" : "border-primary";

  return (
    <div id="cv-print" className="relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm">
      {watermark && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
        >
          <span className="rotate-[-24deg] select-none font-display text-4xl font-bold uppercase tracking-widest text-foreground/10">
            Moza Empregos · pré-visualização
          </span>
        </div>
      )}

      <header className={`border-b-2 pb-3 ${accent}`}>
        <h2 className="font-display text-2xl font-bold">{data.fullName || "O seu nome"}</h2>
        <p className="text-sm text-primary">{data.headline || "Profissão / área"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {[data.email, data.phone, data.province].filter(Boolean).join(" · ")}
        </p>
      </header>

      <Section title="Perfil" body={data.summary} />
      <Section title="Experiência profissional" body={data.experience} />
      <Section title="Formação académica" body={data.education} />
      <Section title="Competências" body={data.skills} />
      <Section title="Idiomas" body={data.languages} />
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  if (!body.trim()) return null;
  return (
    <section className="mt-4">
      <h3 className="font-display text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed">{body}</p>
    </section>
  );
}
