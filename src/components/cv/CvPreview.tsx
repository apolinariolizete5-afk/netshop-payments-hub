import type { CSSProperties, ReactNode } from "react";
import type { CvData, CvTemplate } from "@/lib/cv";

type Props = {
  data: CvData;
  template: CvTemplate;
  id?: string;
};

const GOLD = "#A58C62";
const BLUE = "#315A7A";
const DARK = "#252525";
const LIGHT = "#F1F1EF";
const CREAM = "#EEEAE3";

const PAGE: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  background: "#FFFFFF",
  color: "#222222",
  boxSizing: "border-box",
  overflow: "hidden",
  fontFamily: "Arial, Helvetica, sans-serif",
};

function Section({
  title,
  children,
  color = DARK,
}: {
  title: string;
  children: ReactNode;
  color?: string;
}) {
  return (
    <section style={{ marginBottom: 20 }}>
      <h2
        style={{
          margin: "0 0 9px",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 1.4,
          textTransform: "uppercase",
          color,
        }}
      >
        {title}
      </h2>

      {children}
    </section>
  );
}

function Photo({
  src,
  circle = false,
}: {
  src?: string;
  circle?: boolean;
}) {
  if (!src) {
    return (
      <div
        style={{
          width: 92,
          height: 92,
          borderRadius: circle ? "50%" : 4,
          background: "#E5E5E5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#999999",
          fontSize: 9,
        }}
      >
        FOTO
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      draggable={false}
      style={{
        width: 92,
        height: 92,
        objectFit: "cover",
        borderRadius: circle ? "50%" : 4,
        display: "block",
      }}
    />
  );
}

function Contact({
  data,
  light = false,
}: {
  data: CvData;
  light?: boolean;
}) {
  return (
    <div
      style={{
        color: light ? "#FFFFFF" : "#333333",
        fontSize: 10,
        lineHeight: 1.7,
        wordBreak: "break-word",
      }}
    >
      {data.phone && <div>{data.phone}</div>}
      {data.email && <div>{data.email}</div>}
      {data.location && <div>{data.location}</div>}
    </div>
  );
}

function Skills({
  data,
  light = false,
}: {
  data: CvData;
  light?: boolean;
}) {
  if (!data.skills?.trim()) return null;

  const skills = data.skills
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 6,
      }}
    >
      {skills.map((skill, index) => (
        <span
          key={`${skill}-${index}`}
          style={{
            fontSize: 9.5,
            lineHeight: 1.3,
            padding: "4px 7px",
            border: light
              ? "1px solid rgba(255,255,255,0.35)"
              : "1px solid #D0D0D0",
            borderRadius: 3,
            color: light ? "#FFFFFF" : "#333333",
          }}
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

function Languages({
  data,
  light = false,
}: {
  data: CvData;
  light?: boolean;
}) {
  if (!data.languages?.trim()) return null;

  const languages = data.languages
    .split(/[,\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <div
      style={{
        color: light ? "#FFFFFF" : "#333333",
        fontSize: 10,
        lineHeight: 1.65,
      }}
    >
      {languages.map((language, index) => (
        <div key={`${language}-${index}`}>{language}</div>
      ))}
    </div>
  );
}

function Experience({
  data,
  light = false,
  accent = DARK,
}: {
  data: CvData;
  light?: boolean;
  accent?: string;
}) {
  const experiences = data.experiences ?? [];

  return (
    <div>
      {experiences.map((item, index) => (
        <div
          key={index}
          style={{
            marginBottom: 16,
            color: light ? "#FFFFFF" : "#222222",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11.5,
                  fontWeight: 700,
                  color: light ? "#FFFFFF" : accent,
                }}
              >
                {item.role || "Cargo profissional"}
              </div>

              {item.company && (
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    marginTop: 2,
                  }}
                >
                  {item.company}
                </div>
              )}
            </div>

            {item.period && (
              <div
                style={{
                  fontSize: 9,
                  whiteSpace: "nowrap",
                  opacity: 0.8,
                }}
              >
                {item.period}
              </div>
            )}
          </div>

          {item.description && (
            <div
              style={{
                marginTop: 5,
                fontSize: 9.8,
                lineHeight: 1.55,
                whiteSpace: "pre-line",
              }}
            >
              {item.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Education({
  data,
  light = false,
  accent = DARK,
}: {
  data: CvData;
  light?: boolean;
  accent?: string;
}) {
  const education = data.education ?? [];

  return (
    <div>
      {education.map((item, index) => (
        <div
          key={index}
          style={{
            marginBottom: 13,
            color: light ? "#FFFFFF" : "#222222",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: light ? "#FFFFFF" : accent,
            }}
          >
            {item.course || "Formação académica"}
          </div>

          {item.school && (
            <div
              style={{
                fontSize: 10,
                marginTop: 2,
              }}
            >
              {item.school}
            </div>
          )}

          {item.period && (
            <div
              style={{
                fontSize: 9,
                marginTop: 2,
                opacity: 0.8,
              }}
            >
              {item.period}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BasePage({
  id,
  children,
}: {
  id?: string;
  children: ReactNode;
}) {
  return (
    <div id={id} style={PAGE}>
      {children}
    </div>
  );
}

function CustomSections({
  data,
  accent = DARK,
}: {
  data: CvData;
  accent?: string;
}) {
  const sections = data.customSections?.filter(
    (section) => section.title.trim() || section.content.trim(),
  ) ?? [];

  if (!sections.length) return null;

  return (
    <>
      {sections.map((section) => (
        <Section key={section.id} title={section.title || "Secção adicional"} color={accent}>
          <div
            style={{
              fontSize: 10.2,
              lineHeight: 1.65,
              whiteSpace: "pre-line",
            }}
          >
            {section.content}
          </div>
        </Section>
      ))}
    </>
  );
}

/* =========================================================
   MODELO 01
   ========================================================= */

function Template01({
  data,
  id,
}: {
  data: CvData;
  id?: string;
}) {
  return (
    <BasePage id={id}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "63mm 1fr",
          minHeight: "297mm",
        }}
      >
        <aside
          style={{
            background: "#555555",
            color: "#FFFFFF",
            padding: "17mm 9mm",
          }}
        >
          <Photo src={data.photo} />

          <div style={{ marginTop: 25 }}>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 1.5,
                marginBottom: 8,
                fontWeight: 700,
              }}
            >
              CONTACTO
            </div>

            <Contact data={data} light />
          </div>

          <div style={{ marginTop: 25 }}>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 1.5,
                marginBottom: 8,
                fontWeight: 700,
              }}
            >
              HABILIDADES
            </div>

            <Skills data={data} light />
          </div>

          <div style={{ marginTop: 25 }}>
            <div
              style={{
                fontSize: 9,
                letterSpacing: 1.5,
                marginBottom: 8,
                fontWeight: 700,
              }}
            >
              IDIOMAS
            </div>

            <Languages data={data} light />
          </div>
        </aside>

        <main
          style={{
            padding: "18mm 10mm",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              lineHeight: 1.05,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {data.fullName || "O SEU NOME"}
          </h1>

          <div
            style={{
              marginTop: 7,
              fontSize: 11,
              letterSpacing: 1.6,
              color: "#555555",
              textTransform: "uppercase",
            }}
          >
            {data.title || "PROFISSIONAL"}
          </div>

          <div
            style={{
              width: 45,
              height: 3,
              background: "#555555",
              margin: "18px 0 22px",
            }}
          />

          {data.summary && (
            <Section title="Perfil Profissional">
              <div
                style={{
                  fontSize: 10.2,
                  lineHeight: 1.65,
                  whiteSpace: "pre-line",
                }}
              >
                {data.summary}
              </div>
            </Section>
          )}

          <Section title="Experiência Profissional">
            <Experience data={data} />
          </Section>

          <Section title="Formação Académica">
            <Education data={data} />
          </Section>
        </main>
      </div>
    </BasePage>
  );
}

/* =========================================================
   MODELO 02
   ========================================================= */

function Template02({
  data,
  id,
}: {
  data: CvData;
  id?: string;
}) {
  return (
    <BasePage id={id}>
      <div style={{ padding: "15mm" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            padding: "13mm",
            background: BLUE,
            color: "#FFFFFF",
          }}
        >
          <Photo src={data.photo} circle />

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                lineHeight: 1.1,
                textTransform: "uppercase",
              }}
            >
              {data.fullName || "O SEU NOME"}
            </h1>

            <div
              style={{
                marginTop: 7,
                fontSize: 11,
                letterSpacing: 1.3,
              }}
            >
              {data.title || "PROFISSIONAL"}
            </div>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "59mm 1fr",
            gap: 13,
            marginTop: 15,
          }}
        >
          <aside
            style={{
              background: LIGHT,
              padding: 12,
            }}
          >
            <Section title="Contacto" color={BLUE}>
              <Contact data={data} />
            </Section>

            <Section title="Competências" color={BLUE}>
              <Skills data={data} />
            </Section>

            <Section title="Idiomas" color={BLUE}>
              <Languages data={data} />
            </Section>
          </aside>

          <main>
            {data.summary && (
              <Section title="Perfil Profissional" color={BLUE}>
                <div
                  style={{
                    fontSize: 10.2,
                    lineHeight: 1.65,
                    whiteSpace: "pre-line",
                  }}
                >
                  {data.summary}
                </div>
              </Section>
            )}

            <Section
              title="Experiência Profissional"
              color={BLUE}
            >
              <Experience data={data} accent={BLUE} />
            </Section>

            <Section title="Formação Académica" color={BLUE}>
              <Education data={data} accent={BLUE} />
            </Section>
          </main>
        </div>
      </div>
    </BasePage>
  );
}

/* =========================================================
   MODELO 03
   ========================================================= */

function Template03({
  data,
  id,
}: {
  data: CvData;
  id?: string;
}) {
  return (
    <BasePage id={id}>
      <div
        style={{
          padding: "18mm",
          fontFamily: "Georgia, Times New Roman, serif",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 18,
            borderBottom: "1px solid #333333",
            paddingBottom: 13,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 29,
                fontWeight: 400,
                letterSpacing: 2,
                textTransform: "uppercase",
              }}
            >
              {data.fullName || "O SEU NOME"}
            </h1>

            <div
              style={{
                marginTop: 7,
                fontSize: 10,
                letterSpacing: 2.5,
                textTransform: "uppercase",
              }}
            >
              {data.title || "PROFISSIONAL"}
            </div>
          </div>

          <Photo src={data.photo} />
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "52mm 1fr",
            gap: 16,
            marginTop: 18,
          }}
        >
          <aside>
            <Section title="Contacto">
              <Contact data={data} />
            </Section>

            <Section title="Habilidades">
              <Skills data={data} />
            </Section>

            <Section title="Idiomas">
              <Languages data={data} />
            </Section>
          </aside>

          <main>
            {data.summary && (
              <Section title="Resumo Profissional">
                <div
                  style={{
                    fontFamily: "Arial, Helvetica, sans-serif",
                    fontSize: 10.2,
                    lineHeight: 1.65,
                    whiteSpace: "pre-line",
                  }}
                >
                  {data.summary}
                </div>
              </Section>
            )}

            <Section title="Experiência Profissional">
              <Experience data={data} />
            </Section>

            <Section title="Formação">
              <Education data={data} />
              <CustomSections data={data} accent={DARK} />
            </Section>
          </main>
        </div>
      </div>
    </BasePage>
  );
}

/* =========================================================
   MODELO 04
   ========================================================= */

function Template04({
  data,
  id,
}: {
  data: CvData;
  id?: string;
}) {
  return (
    <BasePage id={id}>
      <div style={{ padding: "15mm" }}>
        <header
          style={{
            display: "grid",
            gridTemplateColumns: "58mm 1fr",
            minHeight: 115,
          }}
        >
          <div
            style={{
              background: CREAM,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Photo src={data.photo} circle />
          </div>

          <div
            style={{
              background: "#5D7485",
              color: "#FFFFFF",
              padding: "15mm 10mm",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 25,
                lineHeight: 1.1,
                textTransform: "uppercase",
              }}
            >
              {data.fullName || "O SEU NOME"}
            </h1>

            <div
              style={{
                marginTop: 7,
                fontSize: 10.5,
                letterSpacing: 1.3,
              }}
            >
              {data.title || "PROFISSIONAL"}
            </div>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "58mm 1fr",
          }}
        >
          <aside
            style={{
              background: CREAM,
              padding: "12mm 8mm",
            }}
          >
            <Section title="Contacto" color="#5D7485">
              <Contact data={data} />
            </Section>

            <Section title="Competências" color="#5D7485">
              <Skills data={data} />
            </Section>

            <Section title="Idiomas" color="#5D7485">
              <Languages data={data} />
            </Section>
          </aside>

          <main style={{ padding: "12mm 10mm" }}>
            {data.summary && (
              <Section title="Sobre Mim" color="#5D7485">
                <div
                  style={{
                    fontSize: 10.2,
                    lineHeight: 1.65,
                    whiteSpace: "pre-line",
                  }}
                >
                  {data.summary}
                </div>
              </Section>
            )}

            <Section
              title="Experiência Profissional"
              color="#5D7485"
            >
              <Experience
                data={data}
                accent="#5D7485"
              />
            </Section>

            <Section
              title="Percurso Académico"
              color="#5D7485"
            >
              <Education
                data={data}
                accent="#5D7485"
              />
            </Section>
          </main>
        </div>
      </div>
    </BasePage>
  );
}

/* =========================================================
   MODELO 05
   ========================================================= */

function Template05({
  data,
  id,
}: {
  data: CvData;
  id?: string;
}) {
  return (
    <BasePage id={id}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "64mm 1fr",
          minHeight: "297mm",
        }}
      >
        <aside
          style={{
            background: "#171717",
            color: "#FFFFFF",
            padding: "18mm 9mm",
          }}
        >
          <Photo src={data.photo} circle />

          <h1
            style={{
              margin: "18px 0 5px",
              fontFamily: "Georgia, Times New Roman, serif",
              fontSize: 23,
              lineHeight: 1.15,
            }}
          >
            {data.fullName || "O SEU NOME"}
          </h1>

          <div
            style={{
              color: GOLD,
              fontSize: 9.5,
              letterSpacing: 1.4,
              textTransform: "uppercase",
            }}
          >
            {data.title || "PROFISSIONAL"}
          </div>

          <div
            style={{
              width: 35,
              height: 2,
              background: GOLD,
              margin: "17px 0 23px",
            }}
          />

          <Section title="Contacto" color={GOLD}>
            <Contact data={data} light />
          </Section>

          <Section title="Competências" color={GOLD}>
            <Skills data={data} light />
          </Section>

          <Section title="Idiomas" color={GOLD}>
            <Languages data={data} light />
          </Section>
        </aside>

        <main
          style={{
            padding: "18mm 12mm",
          }}
        >
          {data.summary && (
            <Section
              title="Perfil Profissional"
              color={GOLD}
            >
              <div
                style={{
                  fontSize: 10.2,
                  lineHeight: 1.65,
                  whiteSpace: "pre-line",
                }}
              >
                {data.summary}
              </div>
            </Section>
          )}

          <Section
            title="Experiência Profissional"
            color={GOLD}
          >
            <Experience
              data={data}
              accent={GOLD}
            />
          </Section>

          <Section
            title="Formação Académica"
            color={GOLD}
          >
            <Education
              data={data}
              accent={GOLD}
            />
          </Section>
        </main>
      </div>
    </BasePage>
  );
}


/* =========================================================
   MODELO 06
   ========================================================= */

function Template06({
  data,
  id,
}: {
  data: CvData;
  id?: string;
}) {
  const accent = "#4F46E5";

  return (
    <BasePage id={id}>
      <div style={{ padding: "15mm 16mm" }}>
        <header
          style={{
            display: "grid",
            gridTemplateColumns: "30mm 1fr",
            gap: 10,
            alignItems: "center",
            paddingBottom: "9mm",
            borderBottom: `3px solid ${accent}`,
          }}
        >
          <Photo src={data.photo} circle />

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 25,
                lineHeight: 1.08,
                color: "#171717",
              }}
            >
              {data.fullName || "O SEU NOME"}
            </h1>
            <div
              style={{
                marginTop: 6,
                color: accent,
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 1.1,
                textTransform: "uppercase",
              }}
            >
              {data.title || "PROFISSIONAL"}
            </div>
            <div style={{ marginTop: 7 }}>
              <Contact data={data} />
            </div>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 55mm",
            gap: "11mm",
            marginTop: "10mm",
          }}
        >
          <main>
            {data.summary && (
              <Section title="Perfil" color={accent}>
                <div
                  style={{
                    fontSize: 10.2,
                    lineHeight: 1.65,
                    whiteSpace: "pre-line",
                  }}
                >
                  {data.summary}
                </div>
              </Section>
            )}

            <Section title="Experiência Profissional" color={accent}>
              <Experience data={data} accent={accent} />
            </Section>

            <Section title="Formação Académica" color={accent}>
              <Education data={data} accent={accent} />
            </Section>

            <CustomSections data={data} accent={accent} />
          </main>

          <aside
            style={{
              borderLeft: `1px solid ${accent}30`,
              paddingLeft: "8mm",
            }}
          >
            <Section title="Competências" color={accent}>
              <Skills data={data} />
            </Section>

            <Section title="Idiomas" color={accent}>
              <Languages data={data} />
            </Section>
          </aside>
        </div>
      </div>
    </BasePage>
  );
}


/* =========================================================
   MODELO 07 — EXECUTIVE GOLD
   ========================================================= */
function Template07({ data, id }: { data: CvData; id?: string }) {
  const gold = "#B08A45";
  return (
    <BasePage id={id}>
      <div style={{ display: "grid", gridTemplateColumns: "66mm 1fr", minHeight: "297mm" }}>
        <aside style={{ background: "#111111", color: "#FFFFFF", padding: "15mm 9mm" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ border: "2px solid " + gold, borderRadius: "50%", padding: 3 }}><Photo src={data.photo} circle /></div>
          </div>
          <div style={{ marginTop: 22 }}>
            <Section title="Contacto" color={gold}><Contact data={data} light /></Section>
            <Section title="Competências principais" color={gold}><Skills data={data} light /></Section>
            <Section title="Idiomas" color={gold}><Languages data={data} light /></Section>
            <CustomSections data={data} accent={gold} />
          </div>
        </aside>
        <main style={{ padding: "16mm 12mm" }}>
          <h1 style={{ margin: 0, fontFamily: "Georgia, Times New Roman, serif", fontSize: 27, lineHeight: 1.05, color: gold, letterSpacing: 1 }}>{data.fullName || "O SEU NOME"}</h1>
          <div style={{ marginTop: 7, fontSize: 10, letterSpacing: 2.2, textTransform: "uppercase", color: "#333333" }}>{data.title || "CONSULTOR ESTRATÉGICO | EXECUTIVO SÉNIOR"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, margin: "15px 0 20px" }}><div style={{ height: 1, background: gold }} /><div style={{ height: 1, background: gold }} /></div>
          {data.summary && <Section title="Perfil Executivo" color={gold}><div style={{ fontSize: 10.2, lineHeight: 1.65, whiteSpace: "pre-line" }}>{data.summary}</div></Section>}
          <Section title="Principais resultados" color={gold}><Experience data={data} accent={gold} /></Section>
          <Section title="Formação Académica" color={gold}><Education data={data} accent={gold} /></Section>
        </main>
      </div>
    </BasePage>
  );
}

/* =========================================================
   MODELO 08 — WAVE BLUE
   ========================================================= */
function Template08({ data, id }: { data: CvData; id?: string }) {
  const blue = "#315A7A";
  const cyan = "#55B5D8";
  return (
    <BasePage id={id}>
      <div style={{ position: "relative", minHeight: "297mm", overflow: "hidden" }}>
        <div style={{ height: "43mm", background: blue, borderBottomLeftRadius: "50% 22%", borderBottomRightRadius: "50% 22%", position: "absolute", top: 0, left: "-8%", right: "-8%" }}><div style={{ height: 3, background: cyan, position: "absolute", left: "7%", right: "7%", bottom: 2 }} /></div>
        <div style={{ position: "relative", padding: "20mm 13mm 25mm" }}>
          <div style={{ display: "grid", gridTemplateColumns: "62mm 1fr", gap: "10mm", alignItems: "center" }}>
            <div style={{ display: "flex", justifyContent: "center", paddingTop: "8mm" }}><div style={{ border: "5px solid " + blue, borderRadius: "50%", padding: 3, background: "#FFFFFF" }}><Photo src={data.photo} circle /></div></div>
            <div style={{ paddingTop: "7mm" }}>
              <h1 style={{ margin: 0, fontSize: 27, lineHeight: 1, color: blue, fontWeight: 800, letterSpacing: .4 }}>{data.fullName || "O SEU NOME"}</h1>
              <div style={{ marginTop: 7, color: cyan, fontSize: 11, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>{data.title || "ENGENHEIRO DE SOFTWARE"}</div>
              <div style={{ marginTop: 12 }}><Contact data={data} /></div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "62mm 1fr", gap: "10mm", marginTop: "15mm" }}>
            <aside style={{ background: "#EEF1F4", borderRadius: "0 28px 28px 0", padding: "10mm 8mm" }}>
              <Section title="Habilidades" color={blue}><Skills data={data} /></Section>
              <Section title="Idiomas" color={blue}><Languages data={data} /></Section>
              <CustomSections data={data} accent={blue} />
            </aside>
            <main>
              {data.summary && <Section title="Perfil Profissional" color={blue}><div style={{ fontSize: 10.2, lineHeight: 1.65, whiteSpace: "pre-line" }}>{data.summary}</div></Section>}
              <Section title="Experiência Profissional" color={blue}><Experience data={data} accent={blue} /></Section>
              <Section title="Formação Académica" color={blue}><Education data={data} accent={blue} /></Section>
            </main>
          </div>
        </div>
        <div style={{ height: "27mm", background: blue, borderTopLeftRadius: "50% 28%", borderTopRightRadius: "50% 28%", position: "absolute", bottom: "-8mm", left: "-8%", right: "-8%" }}><div style={{ height: 3, background: cyan, position: "absolute", left: "7%", right: "7%", top: 2 }} /></div>
      </div>
    </BasePage>
  );
}

/* =========================================================
   MODELO 09 — BOLD START
   ========================================================= */
function Template09({ data, id }: { data: CvData; id?: string }) {
  const gray = "#505050";
  return (
    <BasePage id={id}>
      <div style={{ display: "grid", gridTemplateColumns: "74mm 1fr", minHeight: "297mm" }}>
        <aside style={{ background: gray, color: "#FFFFFF", padding: "12mm 10mm" }}>
          <Photo src={data.photo} />
          {data.summary && <div style={{ marginTop: 18 }}><Section title="Sobre mim" color="#FFFFFF"><div style={{ fontSize: 10.3, lineHeight: 1.65, whiteSpace: "pre-line" }}>{data.summary}</div></Section></div>}
          <Section title="Interesses pessoais" color="#FFFFFF"><Skills data={{ ...data, skills: data.skills || "Desenvolvimento profissional, Inovação e tecnologia, Trabalho em equipa e colaboração" }} light /></Section>
          <Section title="Idiomas" color="#FFFFFF"><Languages data={data} light /></Section>
          <Section title="Contacto" color="#FFFFFF"><Contact data={data} light /></Section>
        </aside>
        <main style={{ padding: "16mm 11mm" }}>
          <h1 style={{ margin: 0, fontFamily: "Arial Narrow, Impact, sans-serif", fontSize: 34, lineHeight: .98, letterSpacing: -.5, textTransform: "uppercase", color: "#333333" }}>{data.fullName || "O SEU NOME"}</h1>
          <div style={{ marginTop: 10, fontSize: 13, color: "#555555" }}>{data.title || "Estagiário Administrativo"}</div>
          <div style={{ width: 55, height: 3, background: gray, margin: "16px 0 22px" }} />
          <Section title="Formação Académica" color={gray}><Education data={data} accent={gray} /></Section>
          <Section title="Experiência Profissional" color={gray}><Experience data={data} accent={gray} /></Section>
          <Section title="Habilidades" color={gray}><Skills data={data} /></Section>
          <CustomSections data={data} accent={gray} />
        </main>
      </div>
    </BasePage>
  );
}

/* =========================================================
   MODELO 10 — CLASSIC PROFILE
   ========================================================= */
function Template10({ data, id }: { data: CvData; id?: string }) {
  const side = "#D8D8D8";
  return (
    <BasePage id={id}>
      <div style={{ display: "grid", gridTemplateColumns: "78mm 1fr", minHeight: "297mm" }}>
        <aside style={{ background: side, padding: "16mm 12mm" }}>
          <Photo src={data.photo} />
          <div style={{ height: 1, background: "#222222", margin: "18mm 0 9mm" }} />
          <Section title="Sobre mim"><div style={{ fontFamily: "Georgia, Times New Roman, serif", fontSize: 10.2, lineHeight: 1.75, whiteSpace: "pre-line" }}>{data.summary || "Apresente aqui um resumo profissional curto e objetivo."}</div></Section>
          <Section title="Contacto"><Contact data={data} /></Section>
          <Section title="Competências"><Skills data={data} /></Section>
          <Section title="Idiomas"><Languages data={data} /></Section>
        </aside>
        <main style={{ padding: "18mm 11mm" }}>
          <h1 style={{ margin: 0, fontFamily: "Georgia, Times New Roman, serif", fontSize: 27, lineHeight: 1.05, letterSpacing: 1.2, textTransform: "uppercase" }}>{data.fullName || "O SEU NOME"}</h1>
          <div style={{ marginTop: 8, fontFamily: "Georgia, Times New Roman, serif", fontSize: 13, fontStyle: "italic", color: "#555555" }}>{data.title || "Estudante"}</div>
          <div style={{ marginTop: 24 }}>
            <Section title="Experiência de Trabalho"><Experience data={data} /></Section>
            <Section title="Estudos"><Education data={data} /></Section>
            <CustomSections data={data} />
          </div>
        </main>
      </div>
    </BasePage>
  );
}

/* =========================================================
   MODELO 11 — SLATE CREATIVE
   ========================================================= */
function Template11({ data, id }: { data: CvData; id?: string }) {
  const slate = "#61788A";
  const cream = "#F7E8D6";
  return (
    <BasePage id={id}>
      <div style={{ display: "grid", gridTemplateColumns: "82mm 1fr", minHeight: "297mm", background: slate, color: "#FFFFFF" }}>
        <aside style={{ background: cream, color: slate, padding: "16mm 12mm" }}>
          <div style={{ display: "flex", justifyContent: "center" }}><Photo src={data.photo} circle /></div>
          <h1 style={{ margin: "17mm 0 6px", fontSize: 27, lineHeight: 1.05, textTransform: "uppercase", letterSpacing: 1 }}>{data.fullName || "O SEU NOME"}</h1>
          <div style={{ fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: "#778C9C" }}>{data.title || "PROFISSIONAL"}</div>
          <div style={{ width: 42, height: 3, background: slate, margin: "16px 0 20px" }} />
          {data.summary && <Section title="Perfil" color={slate}><div style={{ fontSize: 10.1, lineHeight: 1.65, whiteSpace: "pre-line" }}>{data.summary}</div></Section>}
          <Section title="Contacto" color={slate}><Contact data={data} /></Section>
          <Section title="Competências" color={slate}><Skills data={data} /></Section>
        </aside>
        <main style={{ padding: "15mm 12mm", background: slate }}>
          <div style={{ marginBottom: 18 }}><Contact data={data} light /></div>
          <Section title="Experiência Profissional" color={cream}><div style={{ background: cream, color: slate, padding: "7px 11px", fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 13 }}>Experiência profissional</div><Experience data={data} light accent={cream} /></Section>
          <Section title="Formação Académica" color={cream}><div style={{ background: cream, color: slate, padding: "7px 11px", fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 13 }}>Percurso académico</div><Education data={data} light accent={cream} /></Section>
          <Section title="Interesses principais" color={cream}><div style={{ background: cream, color: slate, padding: "7px 11px", fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 13 }}>Interesses principais</div><Skills data={{ ...data, skills: data.skills || "Jornalismo, Tecnologia, Arte, Música, História, Arquitetura" }} light /></Section>
          <CustomSections data={data} accent={cream} />
        </main>
      </div>
    </BasePage>
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

export function CvPreview({
  data,
  template,
  id,
}: Props) {
  switch (template.id) {
    case "template-01":
      return (
        <Template01
          data={data}
          id={id}
        />
      );

    case "template-02":
      return (
        <Template02
          data={data}
          id={id}
        />
      );

    case "template-03":
      return (
        <Template03
          data={data}
          id={id}
        />
      );

    case "template-04":
      return (
        <Template04
          data={data}
          id={id}
        />
      );

    case "template-05":
      return (
        <Template05
          data={data}
          id={id}
        />
      );

    case "template-06":
      return (
        <Template06
          data={data}
          id={id}
        />
      );

    case "template-07":
      return <Template07 data={data} id={id} />;

    case "template-08":
      return <Template08 data={data} id={id} />;

    case "template-09":
      return <Template09 data={data} id={id} />;

    case "template-10":
      return <Template10 data={data} id={id} />;

    case "template-11":
      return <Template11 data={data} id={id} />;

    default:
      return (
        <Template01
          data={data}
          id={id}
        />
      );
  }
}

/* =========================================================
   MINIATURA DOS MODELOS
   ========================================================= */

export function CvThumb({
  data,
  template,
  width = 150,
}: {
  data?: CvData;
  template: CvTemplate;
  width?: number;
}) {
  const preview: CvData = data ?? {
    fullName: "O SEU NOME",
    title: "PROFISSIONAL",
    email: "email@exemplo.com",
    phone: "+258 84 000 0000",
    location: "Maputo, Moçambique",
    photo: "",
    summary:
      "Profissional dedicado, organizado e orientado para resultados.",
    experiences: [
      {
        role: "Cargo profissional",
        company: "Empresa",
        period: "2024 - Atual",
        description:
          "Principais responsabilidades e resultados profissionais.",
      },
    ],
    education: [
      {
        course: "Formação académica",
        school: "Instituição de ensino",
        period: "2020 - 2023",
      },
    ],
    skills:
      "Comunicação, Trabalho em equipa, Organização",
    languages:
      "Português - Nativo, Inglês - Intermédio",
    templateId: template.id,
  };

  return (
    <div
      style={{
        width,
        aspectRatio: "210 / 297",
        overflow: "hidden",
        borderRadius: 10,
        background: "#FFFFFF",
        border: "1px solid #DDDDDD",
        position: "relative",
      }}
    >
      <div
        style={{
          width: "210mm",
          minHeight: "297mm",
          transform: `scale(${width / 794})`,
          transformOrigin: "top left",
          pointerEvents: "none",
        }}
      >
        <CvPreview
          data={preview}
          template={template}
        />
      </div>
    </div>
  );
}
