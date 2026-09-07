import type { CvData, CvTemplate } from "@/lib/cv";

function list(value: string) {
  return value
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function CvPreview({
  data,
  template,
  id,
}: {
  data: CvData;
  template: CvTemplate;
  id?: string;
}) {
  const accent = template.accent;
  const surface = template.surface;
  const serif = template.font === "serif";
  const display = template.font === "display";

  const name = data.fullName || "O seu nome";
  const title = data.title || "Profissional";
  const contacts = [data.email, data.phone, data.location].filter(Boolean);
  const skills = list(data.skills);
  const languages = list(data.languages);

  const experiences = data.experiences.filter(
    (e) => e.role || e.company || e.description,
  );

  const education = data.education.filter(
    (e) => e.course || e.school || e.period,
  );

  const bodyFont = serif
    ? "Georgia, 'Times New Roman', serif"
    : "Inter, Arial, sans-serif";

  const headingFont = display
    ? "Arial, Helvetica, sans-serif"
    : bodyFont;

  const Photo = ({
    size = 96,
    shape,
    ring,
  }: {
    size?: number;
    shape?: "circle" | "square" | "arch" | "none";
    ring?: string;
  }) => {
    const currentShape = shape ?? template.photoShape;

    if (currentShape === "none") {
      return null;
    }

    const borderRadius =
      currentShape === "circle"
        ? "9999px"
        : currentShape === "arch"
          ? `${size / 2}px ${size / 2}px 14px 14px`
          : "12px";

    const style: React.CSSProperties = {
      width: size,
      height: size,
      borderRadius,
      objectFit: "cover",
      flexShrink: 0,
      border: ring ? `3px solid ${ring}` : undefined,
    };

    if (data.photo) {
      return <img src={data.photo} alt={name} style={style} />;
    }

    return (
      <div
        aria-hidden
        style={{
          ...style,
          background: `${accent}18`,
          display: "grid",
          placeItems: "center",
        }}
      >
        <span
          style={{
            color: accent,
            fontSize: size / 3.3,
            fontWeight: 800,
          }}
        >
          {initials(name)}
        </span>
      </div>
    );
  };

  const SectionTitle = ({
    children,
    color = accent,
    number,
    light = false,
  }: {
    children: React.ReactNode;
    color?: string | undefined;
    number?: string | undefined;
    light?: boolean | undefined;
  }) => (
    <div className="flex items-center gap-2">
      {number && (
        <span
          className="text-[9px] font-bold tracking-widest"
          style={{ color }}
        >
          {number}
        </span>
      )}

      <h3
        className="text-[10px] font-bold uppercase tracking-[0.22em]"
        style={{
          color: light ? "rgba(255,255,255,.75)" : color,
          fontFamily: headingFont,
        }}
      >
        {children}
      </h3>
    </div>
  );

  const Line = ({
    color = accent,
  }: {
    color?: string | undefined;
  }) => (
    <div
      className="mt-2 h-px w-full"
      style={{ backgroundColor: `${color}35` }}
    />
  );

  const Summary = ({
    color = accent,
    number,
    light = false,
  }: {
    color?: string | undefined;
    number?: string | undefined;
    light?: boolean | undefined;
  }) =>
    data.summary ? (
      <section className="mt-5">
        <SectionTitle
          color={color}
          number={number}
          light={light}
        >
          Perfil
        </SectionTitle>

        <Line color={color} />

        <p
          className="mt-2 text-[10.5px] leading-[1.55]"
          style={{
            color: light
              ? "rgba(255,255,255,.75)"
              : "#404040",
          }}
        >
          {data.summary}
        </p>
      </section>
    ) : null;

  const ExperienceList = ({
    color = accent,
    timeline = false,
    light = false,
  }: {
    color?: string;
    timeline?: boolean;
    light?: boolean;
  }) =>
    experiences.length > 0 ? (
      <section className="mt-5">
        <SectionTitle
          color={color}
          light={light}
        >
          Experiência
        </SectionTitle>

        <Line color={color} />

        <div
          className={`mt-3 ${
            timeline
              ? "border-l pl-4"
              : "space-y-4"
          }`}
          style={
            timeline
              ? {
                  borderColor: `${color}45`,
                }
              : undefined
          }
        >
          {experiences.map((e, i) => (
            <div
              key={i}
              className={`relative ${
                timeline ? "mb-4" : ""
              }`}
            >
              {timeline && (
                <span
                  className="absolute -left-[20px] top-1 h-[8px] w-[8px] rounded-full"
                  style={{
                    backgroundColor: color,
                  }}
                />
              )}

              <div className="flex items-start justify-between gap-3">
                <p
                  className="text-[11.5px] font-bold"
                  style={{
                    color: light
                      ? "#ffffff"
                      : "#171717",
                  }}
                >
                  {e.role || "Função"}
                </p>

                {e.period && (
                  <span
                    className="whitespace-nowrap text-[8.5px]"
                    style={{
                      color: light
                        ? "rgba(255,255,255,.55)"
                        : "#737373",
                    }}
                  >
                    {e.period}
                  </span>
                )}
              </div>

              {e.company && (
                <p
                  className="mt-[2px] text-[9.5px] font-semibold"
                  style={{
                    color: light
                      ? color
                      : color,
                  }}
                >
                  {e.company}
                </p>
              )}

              {e.description && (
                <p
                  className="mt-1.5 text-[10px] leading-[1.5]"
                  style={{
                    color: light
                      ? "rgba(255,255,255,.68)"
                      : "#525252",
                  }}
                >
                  {e.description}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const EducationList = ({
    color = accent,
    light = false,
  }: {
    color?: string;
    light?: boolean;
  }) =>
    education.length > 0 ? (
      <section className="mt-5">
        <SectionTitle
          color={color}
          light={light}
        >
          Formação
        </SectionTitle>

        <Line color={color} />

        <div className="mt-3 space-y-3">
          {education.map((e, i) => (
            <div key={i}>
              <p
                className="text-[11px] font-bold"
                style={{
                  color: light
                    ? "#ffffff"
                    : "#171717",
                }}
              >
                {e.course || "Formação"}
              </p>

              <p
                className="mt-[2px] text-[9.5px]"
                style={{
                  color: light
                    ? "rgba(255,255,255,.62)"
                    : "#737373",
                }}
              >
                {[e.school, e.period]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const Skills = ({
    color = accent,
    bars = false,
    light = false,
  }: {
    color?: string;
    bars?: boolean;
    light?: boolean;
  }) =>
    skills.length > 0 ? (
      <section className="mt-5">
        <SectionTitle
          color={color}
          light={light}
        >
          Competências
        </SectionTitle>

        <Line color={color} />

        {bars ? (
          <div className="mt-3 space-y-2.5">
            {skills.map((skill, i) => (
              <div key={skill}>
                <div className="flex justify-between">
                  <span
                    className="text-[9px]"
                    style={{
                      color: light
                        ? "rgba(255,255,255,.8)"
                        : "#404040",
                    }}
                  >
                    {skill}
                  </span>
                </div>

                <div
                  className="mt-1 h-[3px] rounded-full"
                  style={{
                    backgroundColor: light
                      ? "rgba(255,255,255,.12)"
                      : `${color}18`,
                  }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(
                        45,
                        94 - i * 8,
                      )}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full px-2 py-1 text-[8.5px] font-medium"
                style={{
                  backgroundColor: light
                    ? "rgba(255,255,255,.1)"
                    : `${color}12`,
                  color: light
                    ? "rgba(255,255,255,.85)"
                    : color,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </section>
    ) : null;

  const Languages = ({
    color = accent,
    light = false,
  }: {
    color?: string;
    light?: boolean;
  }) =>
    languages.length > 0 ? (
      <section className="mt-5">
        <SectionTitle
          color={color}
          light={light}
        >
          Idiomas
        </SectionTitle>

        <Line color={color} />

        <div className="mt-3 space-y-1.5">
          {languages.map((language) => (
            <p
              key={language}
              className="text-[9.5px]"
              style={{
                color: light
                  ? "rgba(255,255,255,.75)"
                  : "#525252",
              }}
            >
              {language}
            </p>
          ))}
        </div>
      </section>
    ) : null;

  const ContactLine = ({
    light = false,
  }: {
    light?: boolean;
  }) =>
    contacts.length > 0 ? (
      <p
        className="text-[9px]"
        style={{
          color: light
            ? "rgba(255,255,255,.62)"
            : "#737373",
        }}
      >
        {contacts.join("   ·   ")}
      </p>
    ) : null;

  const Page = ({
    children,
    background = "#FFFFFF",
  }: {
    children: React.ReactNode;
    background?: string;
  }) => (
    <div
      id={id}
      className="mx-auto w-full max-w-[794px] overflow-hidden text-neutral-800 shadow-sm"
      style={{
        aspectRatio: "1 / 1.414",
        background,
        fontFamily: bodyFont,
      }}
    >
      {children}
    </div>
  );

  /*
  |--------------------------------------------------------------------------
  | 01 — EDITORIAL
  |--------------------------------------------------------------------------
  */

  if (template.layout === "editorial") {
    return Page({
      background: "#F7F5F0",
      children: (
        <div className="h-full px-10 py-9">
          <header className="grid grid-cols-[1fr_150px] gap-8">
            <div>
              <p
                className="text-[8px] font-bold uppercase tracking-[0.35em]"
                style={{ color: accent }}
              >
                CURRICULUM VITAE
              </p>

              <h1
                className="mt-4 text-[38px] font-normal leading-[0.95] tracking-[-0.04em]"
                style={{
                  fontFamily: "Georgia, serif",
                }}
              >
                {name}
              </h1>

              <p
                className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ color: accent }}
              >
                {title}
              </p>

              <div className="mt-4">
                <ContactLine />
              </div>
            </div>

            <div className="flex justify-end">
              <Photo
                size={132}
                shape="square"
              />
            </div>
          </header>

          <div
            className="mt-7 h-[2px] w-full"
            style={{ backgroundColor: accent }}
          />

          <div className="grid grid-cols-[1fr_220px] gap-10">
            <main>
              <Summary number="01" />
              <ExperienceList
                timeline
              />
              <EducationList />
            </main>

            <aside>
              <Skills
                bars
              />
              <Languages />
            </aside>
          </div>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 02 — EXECUTIVE
  |--------------------------------------------------------------------------
  */

  if (template.layout === "executive") {
    return Page({
      children: (
        <div className="h-full">
          <header
            className="px-10 py-8 text-white"
            style={{
              backgroundColor: surface,
            }}
          >
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-[8px] uppercase tracking-[0.4em] text-white/45">
                  EXECUTIVE PROFILE
                </p>

                <h1 className="mt-3 text-[31px] font-semibold tracking-[-0.03em]">
                  {name}
                </h1>

                <p
                  className="mt-1 text-[12px] font-medium"
                  style={{ color: accent }}
                >
                  {title}
                </p>
              </div>

              <Photo
                size={102}
                shape="circle"
                ring="rgba(255,255,255,.3)"
              />
            </div>

            <div className="mt-5 border-t border-white/10 pt-3">
              <ContactLine light />
            </div>
          </header>

          <div className="grid grid-cols-[1fr_205px] gap-8 px-9 py-5">
            <main>
              <Summary />
              <ExperienceList />
              <EducationList />
            </main>

            <aside
              className="rounded-xl p-4"
              style={{
                backgroundColor: `${accent}0D`,
              }}
            >
              <Skills bars />
              <Languages />
            </aside>
          </div>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 03 — CORPORATE
  |--------------------------------------------------------------------------
  */

  if (template.layout === "corporate") {
    return Page({
      children: (
        <div className="h-full px-9 py-8">
          <header className="border-b-2 pb-5">
            <div className="flex items-center gap-5">
              <Photo
                size={82}
                shape="circle"
              />

              <div className="flex-1">
                <h1 className="text-[28px] font-bold tracking-tight">
                  {name}
                </h1>

                <p
                  className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: accent }}
                >
                  {title}
                </p>

                <div className="mt-3">
                  <ContactLine />
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-[1fr_190px] gap-8">
            <main>
              <Summary />
              <ExperienceList />
              <EducationList />
            </main>

            <aside>
              <Skills />
              <Languages />
            </aside>
          </div>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 04 — SWISS
  |--------------------------------------------------------------------------
  */

  if (template.layout === "swiss") {
    return Page({
      children: (
        <div className="h-full px-10 py-9">
          <header className="grid grid-cols-[90px_1fr] gap-6">
            <div
              className="flex h-[80px] w-[80px] items-center justify-center text-[24px] font-bold text-white"
              style={{ backgroundColor: accent }}
            >
              {initials(name)}
            </div>

            <div>
              <h1 className="text-[35px] font-black leading-[0.9] tracking-[-0.06em]">
                {name}
              </h1>

              <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.25em]">
                {title}
              </p>

              <div className="mt-3">
                <ContactLine />
              </div>
            </div>
          </header>

          <div
            className="mt-7 h-[5px]"
            style={{ backgroundColor: accent }}
          />

          <div className="grid grid-cols-[165px_1fr] gap-8">
            <aside>
              <Skills bars />
              <Languages />
            </aside>

            <main>
              <Summary number="01" />
              <ExperienceList />
              <EducationList />
            </main>
          </div>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 05 — MINIMAL
  |--------------------------------------------------------------------------
  */

  if (template.layout === "minimal") {
    return Page({
      children: (
        <div className="h-full px-12 py-11">
          <header>
            <h1 className="text-[34px] font-light tracking-[-0.05em]">
              {name}
            </h1>

            <p
              className="mt-2 text-[10px] font-bold uppercase tracking-[0.35em]"
              style={{ color: accent }}
            >
              {title}
            </p>

            <div className="mt-3">
              <ContactLine />
            </div>
          </header>

          <div
            className="mt-7 h-px"
            style={{ backgroundColor: "#171717" }}
          />

          <main className="max-w-[650px]">
            <Summary />
            <ExperienceList />
            <EducationList />

            <div className="grid grid-cols-2 gap-8">
              <Skills />
              <Languages />
            </div>
          </main>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 06 — TIMELINE
  |--------------------------------------------------------------------------
  */

  if (template.layout === "timeline") {
    return Page({
      children: (
        <div className="h-full px-9 py-8">
          <header className="flex items-center gap-5">
            <Photo
              size={88}
              shape="circle"
              ring={accent}
            />

            <div>
              <h1 className="text-[28px] font-extrabold">
                {name}
              </h1>

              <p
                className="mt-1 text-[11px] font-semibold"
                style={{ color: accent }}
              >
                {title}
              </p>

              <div className="mt-2">
                <ContactLine />
              </div>
            </div>
          </header>

          <Summary />

          <section className="mt-6">
            <SectionTitle number="01">
              Percurso profissional
            </SectionTitle>

            <Line />

            <div
              className="mt-4 border-l-2 pl-5"
              style={{
                borderColor: `${accent}35`,
              }}
            >
              {experiences.map((e, i) => (
                <div
                  key={i}
                  className="relative mb-5"
                >
                  <span
                    className="absolute -left-[26px] top-1 h-[10px] w-[10px] rounded-full border-2 border-white"
                    style={{
                      backgroundColor: accent,
                    }}
                  />

                  <p className="text-[12px] font-bold">
                    {e.role}
                  </p>

                  <p
                    className="mt-[2px] text-[9.5px] font-semibold"
                    style={{ color: accent }}
                  >
                    {[e.company, e.period]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>

                  {e.description && (
                    <p className="mt-1 text-[10px] leading-[1.5] text-neutral-600">
                      {e.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-2 gap-8">
            <EducationList />
            <Skills />
          </div>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 07 — CREATIVE
  |--------------------------------------------------------------------------
  */

  if (template.layout === "creative") {
    return Page({
      background: "#FAF7FF",
      children: (
        <div className="relative h-full px-8 py-8">
          <div
            className="absolute right-0 top-0 h-[220px] w-[220px] rounded-bl-[100px]"
            style={{
              backgroundColor: `${accent}12`,
            }}
          />

          <header className="relative flex items-center gap-6">
            <Photo
              size={116}
              shape="square"
            />

            <div>
              <p
                className="text-[8px] font-bold uppercase tracking-[0.4em]"
                style={{ color: accent }}
              >
                CREATIVE PROFILE
              </p>

              <h1
                className="mt-2 text-[32px] font-black leading-[0.9]"
                style={{
                  fontFamily: headingFont,
                }}
              >
                {name}
              </h1>

              <p className="mt-3 text-[11px] font-semibold">
                {title}
              </p>

              <div className="mt-2">
                <ContactLine />
              </div>
            </div>
          </header>

          <div className="relative mt-7 grid grid-cols-[1fr_215px] gap-6">
            <main>
              <Summary number="01" />
              <ExperienceList />
              <EducationList />
            </main>

            <aside>
              <div
                className="rounded-2xl p-5"
                style={{
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Skills />
                <Languages />
              </div>
            </aside>
          </div>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 08 — ACADEMIC
  |--------------------------------------------------------------------------
  */

  if (template.layout === "academic") {
    return Page({
      children: (
        <div className="h-full px-10 py-9">
          <header className="border-b pb-5">
            <h1
              className="text-[30px] font-normal"
              style={{
                fontFamily: "Georgia, serif",
              }}
            >
              {name}
            </h1>

            <p className="mt-1 text-[12px]">
              {title}
            </p>

            <div className="mt-3">
              <ContactLine />
            </div>
          </header>

          <main>
            <Summary />
            <ExperienceList />
            <EducationList />

            <div className="grid grid-cols-2 gap-8">
              <Skills />
              <Languages />
            </div>
          </main>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 09 — TECHNOLOGY
  |--------------------------------------------------------------------------
  */

  if (template.layout === "tech") {
    return Page({
      background: "#F1F5F9",
      children: (
        <div className="h-full">
          <header
            className="px-8 py-7 text-white"
            style={{
              backgroundColor: "#0B1120",
            }}
          >
            <div className="flex items-center gap-5">
              <Photo
                size={92}
                shape="square"
                ring={accent}
              />

              <div>
                <p
                  className="text-[8px] font-bold tracking-[0.35em]"
                  style={{ color: accent }}
                >
                  /PROFILE
                </p>

                <h1 className="mt-2 text-[28px] font-bold">
                  {name}
                </h1>

                <p className="mt-1 text-[11px] text-white/60">
                  {title}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-white/10 pt-3">
              <ContactLine light />
            </div>
          </header>

          <div className="grid grid-cols-[1fr_205px] gap-6 px-8 py-5">
            <main>
              <Summary />

              <ExperienceList />

              <EducationList />
            </main>

            <aside
              className="rounded-xl p-4 text-white"
              style={{
                backgroundColor: "#0B1120",
              }}
            >
              <Skills
                bars
                light
                color={accent}
              />

              <Languages
                light
                color={accent}
              />
            </aside>
          </div>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 10 — PORTFOLIO
  |--------------------------------------------------------------------------
  */

  if (template.layout === "portfolio") {
    return Page({
      background: "#F5F3FF",
      children: (
        <div className="h-full px-7 py-7">
          <header className="rounded-[20px] bg-white p-6">
            <div className="flex items-center gap-5">
              <Photo
                size={104}
                shape="square"
              />

              <div>
                <p
                  className="text-[8px] font-bold uppercase tracking-[0.3em]"
                  style={{ color: accent }}
                >
                  PORTFOLIO / CV
                </p>

                <h1 className="mt-2 text-[29px] font-black tracking-tight">
                  {name}
                </h1>

                <p className="mt-1 text-[11px] font-semibold">
                  {title}
                </p>

                <div className="mt-2">
                  <ContactLine />
                </div>
              </div>
            </div>
          </header>

          <div className="mt-4 grid grid-cols-[1fr_205px] gap-4">
            <main className="space-y-4">
              {data.summary && (
                <div className="rounded-[18px] bg-white p-5">
                  <SectionTitle>
                    Sobre mim
                  </SectionTitle>

                  <p className="mt-3 text-[10px] leading-[1.6] text-neutral-600">
                    {data.summary}
                  </p>
                </div>
              )}

              <div className="rounded-[18px] bg-white p-5">
                <SectionTitle>
                  Experiência
                </SectionTitle>

                <div className="mt-4 space-y-4">
                  {experiences.map((e, i) => (
                    <div key={i}>
                      <div className="flex justify-between gap-3">
                        <p className="text-[11.5px] font-bold">
                          {e.role}
                        </p>

                        {e.period && (
                          <span
                            className="rounded-full px-2 py-1 text-[7.5px] font-semibold"
                            style={{
                              backgroundColor: `${accent}12`,
                              color: accent,
                            }}
                          >
                            {e.period}
                          </span>
                        )}
                      </div>

                      <p
                        className="mt-1 text-[9px] font-semibold"
                        style={{ color: accent }}
                      >
                        {e.company}
                      </p>

                      {e.description && (
                        <p className="mt-1.5 text-[9.5px] leading-[1.5] text-neutral-600">
                          {e.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[18px] bg-white p-5">
                <EducationList />
              </div>
            </main>

            <aside className="space-y-4">
              <div className="rounded-[18px] bg-white p-5">
                <Skills />
              </div>

              <div className="rounded-[18px] bg-white p-5">
                <Languages />
              </div>
            </aside>
          </div>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 11 — PRIMEIRO EMPREGO
  |--------------------------------------------------------------------------
  */

  if (template.layout === "first-job") {
    return Page({
      background: "#F8FAFC",
      children: (
        <div className="h-full">
          <header
            className="px-9 py-7"
            style={{
              backgroundColor: surface,
              borderBottom: `4px solid ${accent}`,
            }}
          >
            <div className="flex items-center gap-5">
              <Photo
                size={96}
                shape="circle"
              />

              <div>
                <p
                  className="text-[8px] font-bold uppercase tracking-[0.3em]"
                  style={{ color: accent }}
                >
                  PRIMEIRO PASSO
                </p>

                <h1 className="mt-2 text-[27px] font-extrabold">
                  {name}
                </h1>

                <p className="mt-1 text-[11px] font-semibold">
                  {title}
                </p>

                <div className="mt-2">
                  <ContactLine />
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-6 px-9 py-4">
            <main>
              <Summary />
              <EducationList />

              <Skills />
            </main>

            <aside>
              <ExperienceList />
              <Languages />
            </aside>
          </div>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 12 — FINANCE
  |--------------------------------------------------------------------------
  */

  if (template.layout === "finance") {
    return Page({
      background: "#F8FAFA",
      children: (
        <div className="h-full px-10 py-9">
          <header className="grid grid-cols-[1fr_80px] gap-5 border-b-2 pb-5">
            <div>
              <p
                className="text-[8px] font-bold uppercase tracking-[0.35em]"
                style={{ color: accent }}
              >
                PROFESSIONAL PROFILE
              </p>

              <h1
                className="mt-3 text-[31px] font-normal"
                style={{
                  fontFamily: "Georgia, serif",
                }}
              >
                {name}
              </h1>

              <p className="mt-1 text-[11px] font-semibold">
                {title}
              </p>

              <div className="mt-3">
                <ContactLine />
              </div>
            </div>

            <div
              className="flex h-[76px] w-[76px] items-center justify-center rounded-full text-[18px] font-bold text-white"
              style={{
                backgroundColor: accent,
              }}
            >
              {initials(name)}
            </div>
          </header>

          <div className="grid grid-cols-[1fr_190px] gap-8">
            <main>
              <Summary />
              <ExperienceList />
              <EducationList />
            </main>

            <aside>
              <Skills bars color={accent} />
              <Languages color={accent} />
            </aside>
          </div>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 13 — DEVELOPMENT / ONG
  |--------------------------------------------------------------------------
  */

  if (template.layout === "development") {
    return Page({
      background: "#F6FAF7",
      children: (
        <div className="h-full">
          <header
            className="px-9 py-7 text-white"
            style={{
              backgroundColor: "#14532D",
            }}
          >
            <div className="flex items-center gap-5">
              <Photo
                size={94}
                shape="circle"
                ring="rgba(255,255,255,.35)"
              />

              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.35em] text-white/50">
                  DEVELOPMENT · IMPACT
                </p>

                <h1 className="mt-2 text-[27px] font-bold">
                  {name}
                </h1>

                <p
                  className="mt-1 text-[11px]"
                  style={{ color: "#86EFAC" }}
                >
                  {title}
                </p>

                <div className="mt-2">
                  <ContactLine light />
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-[1fr_205px] gap-7 px-9 py-4">
            <main>
              <Summary />

              <ExperienceList
                timeline
                color={accent}
              />

              <EducationList />
            </main>

            <aside>
              <Skills />
              <Languages />

              <section className="mt-6">
                <SectionTitle>
                  Áreas de interesse
                </SectionTitle>

                <Line />

                <p className="mt-3 text-[9.5px] leading-[1.6] text-neutral-600">
                  Desenvolvimento sustentável · Gestão de projectos ·
                  Impacto social · Comunidades · Parcerias
                </p>
              </section>
            </aside>
          </div>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 14 — ATS PRO
  |--------------------------------------------------------------------------
  */

  if (template.layout === "ats") {
    return Page({
      children: (
        <div className="h-full px-10 py-9">
          <header
            className="border-b-2 pb-5"
            style={{ borderColor: "#111827" }}
          >
            <h1 className="text-[28px] font-bold uppercase tracking-tight">
              {name}
            </h1>

            <p className="mt-1 text-[12px] font-semibold">
              {title}
            </p>

            <div className="mt-2">
              <ContactLine />
            </div>
          </header>

          <main>
            <Summary />

            <ExperienceList />

            <EducationList />

            {skills.length > 0 && (
              <section className="mt-5">
                <SectionTitle color="#111827">
                  Competências
                </SectionTitle>

                <Line color="#111827" />

                <p className="mt-2 text-[10px] leading-[1.6] text-neutral-700">
                  {skills.join(" • ")}
                </p>
              </section>
            )}

            {languages.length > 0 && (
              <section className="mt-5">
                <SectionTitle color="#111827">
                  Idiomas
                </SectionTitle>

                <Line color="#111827" />

                <p className="mt-2 text-[10px] leading-[1.6] text-neutral-700">
                  {languages.join(" • ")}
                </p>
              </section>
            )}
          </main>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 15 — MOÇAMBIQUE
  |--------------------------------------------------------------------------
  */

  if (template.layout === "mozambique") {
    return Page({
      background: "#FAFAF8",
      children: (
        <div className="h-full">
          <div className="flex h-[5px] w-full">
            <div
              className="w-1/3"
              style={{
                backgroundColor: "#F2C94C",
              }}
            />

            <div
              className="w-1/3"
              style={{
                backgroundColor: "#007A3D",
              }}
            />

            <div
              className="w-1/3"
              style={{
                backgroundColor: "#CE1126",
              }}
            />
          </div>

          <header className="px-9 py-7">
            <div className="flex items-center gap-5">
              <Photo
                size={98}
                shape="circle"
                ring={accent}
              />

              <div>
                <p
                  className="text-[8px] font-bold uppercase tracking-[0.4em]"
                  style={{ color: accent }}
                >
                  MOÇAMBIQUE · PROFISSIONAL
                </p>

                <h1 className="mt-2 text-[29px] font-extrabold">
                  {name}
                </h1>

                <p className="mt-1 text-[11px] font-semibold text-neutral-600">
                  {title}
                </p>

                <div className="mt-2">
                  <ContactLine />
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-[1fr_205px] gap-7 px-9 py-3">
            <main>
              <Summary />
              <ExperienceList />
              <EducationList />
            </main>

            <aside>
              <Skills />
              <Languages />

              <section className="mt-6">
                <SectionTitle>
                  Localização
                </SectionTitle>

                <Line />

                <p className="mt-3 text-[9.5px] text-neutral-600">
                  {data.location || "Moçambique"}
                </p>
              </section>
            </aside>
          </div>
        </div>
      ),
    });
  }

  /*
  |--------------------------------------------------------------------------
  | FALLBACK
  |--------------------------------------------------------------------------
  */

  return Page({
    children: (
      <div className="h-full px-10 py-9">
        <header className="border-b pb-5">
          <h1 className="text-[30px] font-bold">
            {name}
          </h1>

          <p
            className="mt-1 text-[11px] font-semibold"
            style={{ color: accent }}
          >
            {title}
          </p>

          <div className="mt-2">
            <ContactLine />
          </div>
        </header>

        <Summary />
        <ExperienceList />
        <EducationList />
        <Skills />
        <Languages />
      </div>
    ),
  });
}

/**
 * Miniatura A4 usada na galeria de modelos.
 */
export function CvThumb({
  data,
  template,
  width = 180,
}: {
  data: CvData;
  template: CvTemplate;
  width?: number;
}) {
  const scale = width / 794;

  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-white"
      style={{
        width,
        height: width * 1.414,
      }}
    >
      <div
        style={{
          width: 794,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <CvPreview
          data={data}
          template={template}
        />
      </div>
    </div>
  );
                 }
