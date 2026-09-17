import type { CSSProperties, ReactNode } from "react";
import type { CvData, CvTemplate } from "@/lib/cv";

type Props = {
  data: CvData;
  template: CvTemplate;
  id?: string;
};

const gold = "#A58C62";
const blue = "#315A7A";
const gray = "#555555";

const page: CSSProperties = {
  width: "210mm",
  minHeight: "297mm",
  background: "#fff",
  color: "#222",
  boxSizing: "border-box",
  overflow: "hidden",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const sectionTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: 1.5,
  marginBottom: 8,
  textTransform: "uppercase",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 18 }}>
      <div style={sectionTitle}>{title}</div>
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
  if (!src) return null;

  return (
    <img
      src={src}
      alt=""
      style={{
        width: 100,
        height: 100,
        objectFit: "cover",
        borderRadius: circle ? "50%" : 4,
        display: "block",
      }}
    />
  );
}

function Contact({ data }: { data: CvData }) {
  return (
    <div style={{ fontSize: 10.5, lineHeight: 1.7 }}>
      {data.phone && <div>{data.phone}</div>}
      {data.email && <div>{data.email}</div>}
      {data.address && <div>{data.address}</div>}
      {data.website && <div>{data.website}</div>}
    </div>
  );
}

function Experience({
  data,
}: {
  data: CvData;
}) {
  const items = data.experience ?? [];

  return (
    <div>
      {items.map((item, index) => (
        <div key={index} style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <strong style={{ fontSize: 11.5 }}>
              {item.position || "Cargo"}
            </strong>

            <span style={{ fontSize: 9.5, whiteSpace: "nowrap" }}>
              {item.startDate || ""}
              {item.startDate || item.endDate ? " - " : ""}
              {item.endDate || ""}
            </span>
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

          {item.description && (
            <div
              style={{
                fontSize: 10,
                lineHeight: 1.55,
                marginTop: 5,
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
}: {
  data: CvData;
}) {
  const items = data.education ?? [];

  return (
    <div>
      {items.map((item, index) => (
        <div key={index} style={{ marginBottom: 12 }}>
          <strong style={{ fontSize: 11 }}>
            {item.degree || "Formação"}
          </strong>

          {item.school && (
            <div style={{ fontSize: 10, marginTop: 2 }}>
              {item.school}
            </div>
          )}

          {(item.startDate || item.endDate) && (
            <div style={{ fontSize: 9.5, marginTop: 2 }}>
              {item.startDate || ""}
              {item.startDate || item.endDate ? " - " : ""}
              {item.endDate || ""}
            </div>
          )}

          {item.description && (
            <div
              style={{
                fontSize: 9.5,
                lineHeight: 1.45,
                marginTop: 4,
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

function Skills({
  data,
}: {
  data: CvData;
}) {
  const skills = data.skills ?? [];

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
          key={index}
          style={{
            fontSize: 9.5,
            padding: "4px 7px",
            border: "1px solid #ccc",
            borderRadius: 3,
          }}
        >
          {typeof skill === "string" ? skill : skill.name}
        </span>
      ))}
    </div>
  );
}

function Languages({
  data,
}: {
  data: CvData;
}) {
  const languages = data.languages ?? [];

  return (
    <div>
      {languages.map((language, index) => (
        <div
          key={index}
          style={{
            fontSize: 10,
            marginBottom: 5,
          }}
        >
          {typeof language === "string"
            ? language
            : `${language.language || ""}${language.level ? ` - ${language.level}` : ""}`}
        </div>
      ))}
    </div>
  );
}

function BasePage({
  id,
  children,
  background = "#fff",
}: {
  id?: string;
  children: ReactNode;
  background?: string;
}) {
  return (
    <div
      id={id}
      style={{
        ...page,
        background,
      }}
    >
      {children}
    </div>
  );
}

function EditorialTemplate({
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
          padding: "18mm 17mm",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "65mm 1fr",
            minHeight: "260mm",
            gap: 10,
          }}
        >
          <aside
            style={{
              background: "#555",
              color: "#fff",
              padding: "16mm 9mm",
            }}
          >
            <Photo src={data.photo} />

            <div
              style={{
                marginTop: 18,
                fontSize: 9,
                letterSpacing: 1.5,
              }}
            >
              CONTATO
            </div>

            <div style={{ marginTop: 8 }}>
              <Contact data={data} />
            </div>

            <div style={{ marginTop: 25 }}>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: 1.5,
                  marginBottom: 8,
                }}
              >
                HABILIDADES
              </div>

              <Skills data={data} />
            </div>

            <div style={{ marginTop: 25 }}>
              <div
                style={{
                  fontSize: 9,
                  letterSpacing: 1.5,
                  marginBottom: 8,
                }}
              >
                IDIOMAS
              </div>

              <Languages data={data} />
            </div>
          </aside>

          <main style={{ padding: "5mm 7mm" }}>
            <h1
              style={{
                fontSize: 29,
                lineHeight: 1,
                margin: 0,
                textTransform: "uppercase",
                letterSpacing: 1,
                fontWeight: 800,
              }}
            >
              {data.fullName || "O SEU NOME"}
            </h1>

            <div
              style={{
                marginTop: 7,
                fontSize: 12,
                color: gray,
                letterSpacing: 1.5,
              }}
            >
              {data.title || "PROFISSIONAL"}
            </div>

            {data.summary && (
              <div
                style={{
                  marginTop: 20,
                  fontSize: 10.5,
                  lineHeight: 1.65,
                  whiteSpace: "pre-line",
                }}
              >
                {data.summary}
              </div>
            )}

            <div style={{ marginTop: 25 }}>
              <Section title="Experiência Profissional">
                <Experience data={data} />
              </Section>

              <Section title="Formação Académica">
                <Education data={data} />
              </Section>
            </div>
          </main>
        </div>
      </div>
    </BasePage>
  );
}

function CorporateTemplate({
  data,
  id,
}: {
  data: CvData;
  id?: string;
}) {
  return (
    <BasePage id={id}>
      <div style={{ padding: "15mm 16mm" }}>
        <header
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            borderBottom: `3px solid ${blue}`,
            paddingBottom: 14,
          }}
        >
          <Photo src={data.photo} circle />

          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 27,
                textTransform: "uppercase",
                color: blue,
              }}
            >
              {data.fullName || "O SEU NOME"}
            </h1>

            <div
              style={{
                marginTop: 6,
                fontSize: 12,
                letterSpacing: 1,
              }}
            >
              {data.title || "PROFISSIONAL"}
            </div>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "62mm 1fr",
            gap: 14,
            marginTop: 18,
          }}
        >
          <aside
            style={{
              background: "#f1f3f5",
              padding: 12,
            }}
          >
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
              <Section title="Perfil Profissional">
                <div
                  style={{
                    fontSize: 10.5,
                    lineHeight: 1.6,
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
      </div>
    </BasePage>
  );
}

function MinimalTemplate({
  data,
  id,
}: {
  data: CvData;
  id?: string;
}) {
  return (
    <BasePage id={id}>
      <div style={{ padding: "17mm 18mm" }}>
        <header
          style={{
            borderBottom: "1px solid #222",
            paddingBottom: 12,
            marginBottom: 18,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: 30,
              letterSpacing: 4,
              fontWeight: 400,
            }}
          >
            {data.fullName || "O SEU NOME"}
          </h1>

          <div
            style={{
              marginTop: 8,
              fontSize: 10,
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            {data.title || "PROFISSIONAL"}
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "55mm 1fr",
            gap: 15,
          }}
        >
          <aside>
            <Photo src={data.photo} />

            <div style={{ marginTop: 18 }}>
              <Section title="Contacto">
                <Contact data={data} />
              </Section>

              <Section title="Habilidades">
                <Skills data={data} />
              </Section>

              <Section title="Idiomas">
                <Languages data={data} />
              </Section>
            </div>
          </aside>

          <main>
            {data.summary && (
              <Section title="Resumo Profissional">
                <div
                  style={{
                    fontSize: 10.5,
                    lineHeight: 1.6,
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
            </Section>
          </main>
        </div>
      </div>
    </BasePage>
  );
}

function ExecutiveTemplate({
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
          gridTemplateColumns: "65mm 1fr",
          minHeight: "297mm",
        }}
      >
        <aside
          style={{
            background: "#171717",
            color: "#fff",
            padding: "18mm 9mm",
          }}
        >
          <Photo src={data.photo} circle />

          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 23,
              lineHeight: 1.15,
              marginTop: 18,
              marginBottom: 5,
            }}
          >
            {data.fullName || "O SEU NOME"}
          </h1>

          <div
            style={{
              color: gold,
              fontSize: 10,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            {data.title || "PROFISSIONAL"}
          </div>

          <div style={{ marginTop: 28 }}>
            <div
              style={{
                color: gold,
                fontSize: 9,
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              CONTACTO
            </div>

            <Contact data={data} />
          </div>

          <div style={{ marginTop: 28 }}>
            <div
              style={{
                color: gold,
                fontSize: 9,
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              HABILIDADES
            </div>

            <Skills data={data} />
          </div>

          <div style={{ marginTop: 28 }}>
            <div
              style={{
                color: gold,
                fontSize: 9,
                letterSpacing: 1.5,
                marginBottom: 8,
              }}
            >
              IDIOMAS
            </div>

            <Languages data={data} />
          </div>
        </aside>

        <main style={{ padding: "18mm 12mm" }}>
          {data.summary && (
            <Section title="Perfil Profissional">
              <div
                style={{
                  fontSize: 10.5,
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

function TemplateFour({
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
            minHeight: 120,
          }}
        >
          <div
            style={{
              background: "#EEEAE3",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 12,
            }}
          >
            <Photo src={data.photo} circle />
          </div>

          <div
            style={{
              background: "#5D7485",
              color: "#fff",
              padding: "18mm 10mm",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 26,
                textTransform: "uppercase",
              }}
            >
              {data.fullName || "O SEU NOME"}
            </h1>

            <div
              style={{
                marginTop: 7,
                fontSize: 11,
                letterSpacing: 1.5,
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
              background: "#EEEAE3",
              padding: "12mm 8mm",
            }}
          >
            <Section title="Contacto">
              <Contact data={data} />
            </Section>

            <Section title="Interesses">
              <Skills data={data} />
            </Section>

            <Section title="Idiomas">
              <Languages data={data} />
            </Section>
          </aside>

          <main style={{ padding: "12mm 10mm" }}>
            {data.summary && (
              <Section title="Sobre Mim">
                <div
                  style={{
                    fontSize: 10.5,
                    lineHeight: 1.6,
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

            <Section title="Percurso Académico">
              <Education data={data} />
            </Section>

            <Section title="Habilidades">
              <Skills data={data} />
            </Section>
          </main>
        </div>
      </div>
    </BasePage>
  );
}

export function CvPreview({
  data,
  template,
  id,
}: Props) {
  switch (template.id) {
    case "template-01":
      return <EditorialTemplate data={data} id={id} />;

    case "template-02":
      return <CorporateTemplate data={data} id={id} />;

    case "template-03":
      return <MinimalTemplate data={data} id={id} />;

    case "template-04":
      return <TemplateFour data={data} id={id} />;

    case "template-05":
      return <ExecutiveTemplate data={data} id={id} />;

    default:
      return <EditorialTemplate data={data} id={id} />;
  }
            }
