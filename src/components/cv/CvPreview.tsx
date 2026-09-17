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

const pageStyle: CSSProperties = {
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
          color: "#999",
          fontSize: 9,
          textAlign: "center",
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
  const color = light ? "#FFFFFF" : "#333333";

  return (
    <div
      style={{
        color,
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
              ? "1px solid rgba(255,255,255,.35)"
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
  const items = data.experiences ?? [];

  if (!items.length) return null;

  return (
    <div>
      {items.map((item, index) => (
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
  const items = data.education ?? [];

  if (!items.length) return null;

  return (
    <div>
      {items.map((item, index) => (
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
  background = "#FFFFFF",
}: {
  id?: string;
  children: ReactNode;
  background?: string;
}) {
  return (
    <div
      id={id}
      style={{
        ...pageStyle,
        background,
      }}
    >
      {children}
    </div>
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
            <Section title="Sobre Mim">
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

            <Section title="Experiência Profissional" color={BLUE}>
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
          padding:
