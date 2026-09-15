import type { CSSProperties, ReactNode } from "react";
import type { CvData, CvTemplate } from "@/lib/cv";

type Props = {
  data: CvData;
  template: CvTemplate;
  id?: string;
};

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

const gold = "#A58C62";
const goldDark = "#8D754D";
const goldLight = "#B9A47F";

function Section({
  title,
  children,
  color = gold,
  dark = false,
}: {
  title: string;
  children: ReactNode;
  color?: string;
  dark?: boolean;
}) {
  return (
    <section style={{ marginBottom: 24 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.1,
          fontWeight: 800,
          letterSpacing: "0.04em",
          color: dark ? "#fff" : color,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {title.toUpperCase()}
      </h2>

      <div
        style={{
          width: "100%",
          height: 1.5,
          marginTop: 8,
          marginBottom: 12,
          background: dark
            ? "rgba(255,255,255,.35)"
            : color,
        }}
      />

      {children}
    </section>
  );
}

function Contact({
  data,
  dark = false,
  compact = false,
}: {
  data: CvData;
  dark?: boolean;
  compact?: boolean;
}) {
  const color = dark ? "rgba(255,255,255,.78)" : goldLight;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? 6 : 9,
        fontSize: compact ? 8.5 : 10,
        color,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {data.phone && (
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <span
            style={{
              width: 17,
              height: 17,
              borderRadius: "50%",
              background: dark ? "#fff" : goldDark,
              color: dark ? "#172033" : "#fff",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 8,
              fontWeight: 800,
            }}
          >
            ☎
          </span>
          <span>{data.phone}</span>
        </div>
      )}

      {data.email && (
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <span
            style={{
              width: 17,
              height: 17,
              borderRadius: "50%",
              background: dark ? "#fff" : goldDark,
              color: dark ? "#172033" : "#fff",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 8,
              fontWeight: 800,
            }}
          >
            ✉
          </span>
          <span>{data.email}</span>
        </div>
      )}

      {data.location && (
        <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
          <span
            style={{
              width: 17,
              height: 17,
              borderRadius: "50%",
              background: dark ? "#fff" : goldDark,
              color: dark ? "#172033" : "#fff",
              display: "inline-flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 8,
              fontWeight: 800,
            }}
          >
            ●
          </span>
          <span>{data.location}</span>
        </div>
      )}
    </div>
  );
}

function WaveDecoration({
  position = "top",
  color = gold,
}: {
  position?: "top" | "bottom";
  color?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 260"
      style={{
        position: "absolute",
        pointerEvents: "none",
        zIndex: 0,
        width: 300,
        height: 245,
        right: position === "top" ? -25 : -35,
        top: position === "top" ? -18 : undefined,
        bottom: position === "bottom" ? -45 : undefined,
        opacity: 0.55,
        transform:
          position === "bottom"
            ? "rotate(180deg)"
            : "none",
      }}
    >
      {Array.from({ length: 13 }).map((_, i) => {
        const y = 22 + i * 15;

        return (
          <path
            key={i}
            d={`M55 ${y}
              C100 ${y - 10}
              125 ${y + 15}
              155 ${y + 28}
              C195 ${y + 45}
              220 ${y + 65}
              285 ${y + 70}`}
            fill="none"
            stroke={color}
            strokeWidth="1.2"
          />
        );
      })}
    </svg>
  );
}

function Experience({
  data,
  color = goldDark,
  arrow = true,
  timeline = false,
  dark = false,
}: {
  data: CvData;
  color?: string;
  arrow?: boolean;
  timeline?: boolean;
  dark?: boolean;
}) {
  const items = data.experiences.filter(
    (item) =>
      item.role ||
      item.company ||
      item.period ||
      item.description,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 13,
        position: "relative",
        paddingLeft: timeline ? 15 : 0,
        borderLeft: timeline
          ? `1.5px solid ${color}55`
          : undefined,
      }}
    >
      {items.map((item, index) => (
        <article
          key={index}
          style={{
            position: "relative",
            paddingLeft: arrow && !timeline ? 0 : 0,
          }}
        >
          {timeline && (
            <span
              style={{
                position: "absolute",
                left: -20,
                top: 4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
              }}
            />
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                arrow && !timeline
                  ? "13px 1fr auto"
                  : "1fr auto",
              gap: 3,
              alignItems: "baseline",
            }}
          >
            {arrow && !timeline && (
              <span
                style={{
                  color,
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                ➤
              </span>
            )}

            <strong
              style={{
                fontSize: 13,
                lineHeight: 1.15,
                color: dark ? "#fff" : color,
                fontFamily:
                  "Arial, Helvetica, sans-serif",
              }}
            >
              {item.role || "Função"}
            </strong>

            {item.period && (
              <span
                style={{
                  fontSize: 8.5,
                  color: dark
                    ? "rgba(255,255,255,.65)"
                    : gold,
                  whiteSpace: "nowrap",
                }}
              >
                {item.period}
              </span>
            )}
          </div>

          {item.company && (
            <div
              style={{
                marginTop: 3,
                marginLeft:
                  arrow && !timeline ? 16 : 0,
                fontSize: 8.5,
                fontWeight: 800,
                color: dark ? "#fff" : "#292929",
              }}
            >
              {item.company}
            </div>
          )}

          {item.description && (
            <p
              style={{
                margin:
                  arrow && !timeline
                    ? "4px 0 0 16px"
                    : "4px 0 0",
                fontSize: 9,
                lineHeight: 1.45,
                color: dark
                  ? "rgba(255,255,255,.72)"
                  : "#8F7959",
              }}
            >
              {item.description}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}

function Education({
  data,
  color = goldDark,
  dark = false,
}: {
  data: CvData;
  color?: string;
  dark?: boolean;
}) {
  const items = data.education.filter(
    (item) =>
      item.course ||
      item.school ||
      item.period,
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 9,
      }}
    >
      {items.map((item, index) => (
        <div key={index}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "baseline",
            }}
          >
            <strong
              style={{
                fontSize: 9.5,
                color: dark ? "#fff" : color,
              }}
            >
              {item.course || "Formação"}
            </strong>

            {item.period && (
              <span
                style={{
                  fontSize: 8,
                  color: dark
                    ? "rgba(255,255,255,.6)"
                    : gold,
                  whiteSpace: "nowrap",
                }}
              >
                {item.period}
              </span>
            )}
          </div>

          {item.school && (
            <p
              style={{
                margin: "2px 0 0",
                fontSize: 8.5,
                color: dark
                  ? "rgba(255,255,255,.62)"
                  : "#9C855F",
              }}
            >
              {item.school}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function Skills({
  data,
  color = goldDark,
  dark = false,
  bars = false,
}: {
  data: CvData;
  color?: string;
  dark?: boolean;
  bars?: boolean;
}) {
  const items = list(data.skills);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      {items.map((skill, index) => (
        <div key={`${skill}-${index}`}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 9,
              color: dark
                ? "rgba(255,255,255,.78)"
                : "#9B845E",
            }}
          >
            <span
              style={{
                color,
                fontSize: 8,
              }}
            >
              ➤
            </span>

            <span>{skill}</span>
          </div>

          {bars && (
            <div
              style={{
                marginTop: 3,
                marginLeft: 15,
                height: 3,
                background: dark
                  ? "rgba(255,255,255,.12)"
                  : `${color}18`,
                borderRadius: 4,
              }}
            >
              <div
                style={{
                  width: `${Math.max(
                    45,
                    94 - index * 8,
                  )}%`,
                  height: "100%",
                  background: color,
                  borderRadius: 4,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function Languages({
  data,
  color = goldDark,
  dark = false,
}: {
  data: CvData;
  color?: string;
  dark?: boolean;
}) {
  const items = list(data.languages);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      {items.map((language, index) => (
        <div
          key={`${language}-${index}`}
          style={{
            display: "flex",
            gap: 7,
            alignItems: "center",
            fontSize: 9,
            color: dark
              ? "rgba(255,255,255,.78)"
              : "#9B845E",
          }}
        >
          <span
            style={{
              color,
              fontSize: 8,
            }}
          >
            ➤
          </span>

          <span>{language}</span>
        </div>
      ))}
    </div>
  );
}

function Photo({
  data,
  size = 90,
  circle = false,
  accent = gold,
  dark = false,
}: {
  data: CvData;
  size?: number;
  circle?: boolean;
  accent?: string;
  dark?: boolean;
}) {
  const name = data.fullName || "CV";

  const style: CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    objectFit: "cover",
    borderRadius: circle ? "50%" : 8,
    border: `2px solid ${accent}`,
  };

  if (data.photo) {
    return (
      <img
        src={data.photo}
        alt=""
        style={style}
      />
    );
  }

  return (
    <div
      style={{
        ...style,
        display: "grid",
        placeItems: "center",
        background: dark
          ? "rgba(255,255,255,.08)"
          : `${accent}12`,
        color: accent,
        fontSize: size / 3,
        fontWeight: 800,
      }}
    >
      {initials(name)}
    </div>
  );
}

function BasePage({
  children,
  background = "#fff",
  id,
}: {
  children: ReactNode;
  background?: string;
  id?: string;
}) {
  return (
    <div
      id={id}
      className="moza-cv-page"
      style={{
        position: "relative",
        width: "100%",
        maxWidth: 794,
        minHeight: 1123,
        margin: "0 auto",
        overflow: "hidden",
        background,
        color: "#222",
        boxShadow:
          "0 8px 30px rgba(0,0,0,.08)",
        fontFamily:
          "Arial, Helvetica, sans-serif",
      }}
    >
      {children}

      <style>{`
        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .moza-cv-page {
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}

export function CvPreview({
  data,
  template,
  id,
}: Props) {
  const name =
    data.fullName || "O SEU NOME";

  const title =
    data.title || "Profissional";

  /*
   * ============================================================
   * MODELO 01
   * ELEGANTE GOLD
   *
   * Este é o modelo baseado diretamente no PDF enviado.
   * ============================================================
   */

  if (template.layout === "editorial") {
    return (
      <BasePage
        id={id}
        background="#FFFFFF"
      >
        <WaveDecoration position="top" />
        <WaveDecoration position="bottom" />

        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding:
              "76px 48px 48px",
          }}
        >
          <header
            style={{
              marginBottom: 48,
            }}
          >
            <h1
              style={{
                margin: "0 0 27px 55px",
                color: gold,
                fontSize: 19,
                fontWeight: 800,
                letterSpacing: ".02em",
              }}
            >
              {name}
            </h1>

            <div
              style={{
                width: "48%",
              }}
            >
              <h2
                style={{
                  margin: "0 0 20px",
                  color: gold,
                 
