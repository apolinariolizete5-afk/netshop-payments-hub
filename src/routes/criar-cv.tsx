import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  Crown,
  Download,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CvPreview, CvThumb } from "@/components/cv/CvPreview";

import {
  CV_TEMPLATES,
  EMPTY_CV,
  loadCv,
  previewData,
  saveCv,
  type CvData,
} from "@/lib/cv";

import { parseCvFile } from "@/lib/cv.functions";
import { useCvDownload } from "@/hooks/useCvDownload";

export const Route = createFileRoute("/criar-cv")({
  head: () => ({
    meta: [
      {
        title: "Criar CV profissional online | Moza Empregos",
      },
      {
        name: "description",
        content:
          "Crie o seu CV profissional em minutos com modelos premium, fotografia, preenchimento automático por IA e exportação em PDF.",
      },
      {
        property: "og:title",
        content: "Criador de CV | Moza Empregos",
      },
      {
        property: "og:description",
        content:
          "Modelos profissionais A4 com fotografia, IA e exportação em PDF.",
      },
      {
        property: "og:type",
        content: "website",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
  }),
  component: CriarCvPage,
});

const STEPS = [
  "Modelo",
  "Dados",
  "Experiência",
  "Formação",
  "Competências",
] as const;

const TEMPLATE_FILTERS = [
  "Todos",
  "Premium",
] as const;

type TemplateFilter = (typeof TEMPLATE_FILTERS)[number];

function templateCategory(
  templateId: string,
): string {
  const categories: Record<string, string> = {
    editorial: "Elegante",
    executive: "Executivo",
    corporate: "Corporativo",
    swiss: "Design",
    minimal: "Minimalista",
    timeline: "Carreira",
    creative: "Criativo",
    academic: "Académico",
    tech: "Tecnologia",
    portfolio: "Criativo",
    "first-job": "Primeiro emprego",
    finance: "Finanças",
    development: "ONG / Desenvolvimento",
    ats: "ATS / Recrutamento",
    mozambique: "Moçambique",
  };

  return categories[templateId] ?? "Profissional";
}

function CriarCvPage() {
  const [data, setData] = useState<CvData>(EMPTY_CV);
  const [step, setStep] = useState(0);

  const [aiState, setAiState] = useState<{
    loading: boolean;
    message: string;
  }>({
    loading: false,
    message: "",
  });

  const [templateFilter, setTemplateFilter] =
    useState<TemplateFilter>("Todos");

  const [templateSearch, setTemplateSearch] =
    useState("");

  const photoInput =
    useRef<HTMLInputElement>(null);

  const cvInput =
    useRef<HTMLInputElement>(null);

  const parse = useServerFn(parseCvFile);
  const pdf = useCvDownload();

  useEffect(() => {
    setData(loadCv());
  }, []);

  useEffect(() => {
    saveCv(data);
  }, [data]);

  const set = <K extends keyof CvData>(
    key: K,
    value: CvData[K],
  ) =>
    setData((prev) => ({
      ...prev,
      [key]: value,
    }));

  const template =
    CV_TEMPLATES.find(
      (t) => t.id === data.templateId,
    ) ?? CV_TEMPLATES[0]!;

  const preview = previewData(data);

  const visibleTemplates =
  CV_TEMPLATES.filter((tpl) => {
    const matchesFilter =
      templateFilter === "Todos" ||
      (templateFilter === "Premium" &&
        tpl.premium);
      const search =
        templateSearch.trim().toLowerCase();

      const matchesSearch =
        !search ||
        tpl.name.toLowerCase().includes(search) ||
        tpl.description
          .toLowerCase()
          .includes(search) ||
        templateCategory(tpl.id)
          .toLowerCase()
          .includes(search);

      return matchesFilter && matchesSearch;
    });

  async function onPhoto(file: File) {
    const dataUrl = await toDataUrl(file);
    set("photo", dataUrl);
  }

  async function onCvFile(file: File) {
    setAiState({
      loading: true,
      message: "A ler o seu CV...",
    });

    try {
      const dataUrl = await toDataUrl(file);
      const base64 =
        dataUrl.split(",")[1] ?? "";

      const result = (await parse({
        data: {
          base64,
          mimeType:
            file.type || "application/pdf",
          fileName: file.name,
        },
      })) as
        | { ok: true; cvJson: string }
        | { ok: false; error: string };

      if (!result.ok) {
        setAiState({
          loading: false,
          message: result.error,
        });
        return;
      }

      const cv = JSON.parse(
        result.cvJson,
      ) as Partial<CvData>;

      setData((prev) => ({
        ...prev,

        fullName:
          str(cv.fullName) ||
          prev.fullName,

        title:
          str(cv.title) ||
          prev.title,

        email:
          str(cv.email) ||
          prev.email,

        phone:
          str(cv.phone) ||
          prev.phone,

        location:
          str(cv.location) ||
          prev.location,

        summary:
          str(cv.summary) ||
          prev.summary,

        skills:
          str(cv.skills) ||
          prev.skills,

        languages:
          str(cv.languages) ||
          prev.languages,

        experiences:
          Array.isArray(cv.experiences) &&
          cv.experiences.length
            ? cv.experiences.map((e) => ({
                role: str(e?.role),
                company: str(e?.company),
                period: str(e?.period),
                description: str(
                  e?.description,
                ),
              }))
            : prev.experiences,

        education:
          Array.isArray(cv.education) &&
          cv.education.length
            ? cv.education.map((e) => ({
                course: str(e?.course),
                school: str(e?.school),
                period: str(e?.period),
              }))
            : prev.education,
      }));

      setAiState({
        loading: false,
        message:
          "Formulários preenchidos. Reveja e ajuste o que precisar.",
      });
    } catch {
      setAiState({
        loading: false,
        message:
          "Falha ao ler o ficheiro. Tente novamente.",
      });
    }
  }

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-[28px] bg-primary px-5 py-7 text-primary-foreground shadow-sm print:hidden sm:px-7">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] opacity-80">
            <Sparkles className="h-4 w-4" />
            Moza Empregos
          </div>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Crie um CV que se destaca.
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 opacity-90 sm:text-base">
            Escolha um modelo profissional, preencha
            os seus dados e descarregue um CV pronto
            para candidaturas.
          </p>
        </div>

        <div
          aria-hidden
          className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10"
        />

        <div
          aria-hidden
          className="absolute -bottom-24 right-20 h-48 w-48 rounded-full bg-black/10"
        />
      </section>

      <div className="mt-5 print:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">
              O seu CV
            </p>

            <p className="text-xs text-muted-foreground">
              Complete os passos abaixo.
            </p>
          </div>

          <div className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary sm:block">
            Passo {step + 1} de {STEPS.length}
          </div>
        </div>

        <nav className="no-scrollbar mt-3 -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {STEPS.map((label, index) => {
            const active = index === step;
            const completed = index < step;

            return (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                aria-current={
                  active ? "step" : undefined
                }
                className={[
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition-all",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : completed
                      ? "border-primary/20 bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30",
                ].join(" ")}
              >
                {completed ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <span>{index + 1}</span>
                )}

                {label}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="print:hidden">
          <div className="mb-4 overflow-hidden rounded-[24px] border border-primary/15 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-bold">
                  Já tem um CV?
                </p>

                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Envie o seu CV antigo em PDF ou
                  uma fotografia legível. A IA tenta
                  preencher os formulários
                  automaticamente.
                </p>
              </div>
            </div>

            <input
              ref={cvInput}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                const file =
                  e.target.files?.[0];

                if (file) {
                  void onCvFile(file);
                }

                e.target.value = "";
              }}
            />

            <Button
              variant="outline"
              className="mt-4 w-full gap-2 bg-background sm:w-auto"
              disabled={aiState.loading}
              onClick={() =>
                cvInput.current?.click()
              }
            >
              {aiState.loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}

              {aiState.loading
                ? "A analisar..."
                : "Carregar CV antigo"}
            </Button>

            {aiState.message && (
              <p
                className="mt-2 text-xs text-muted-foreground"
                role="status"
              >
                {aiState.message}
              </p>
            )}
          </div>

          <div className="rounded-[26px] border border-border bg-card p-4 shadow-sm sm:p-5">
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2 flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
                  {data.photo ? (
                    <img
                      src={data.photo}
                      alt="Fotografia"
                      className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/15"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <UserRound className="h-7 w-7 text-muted-foreground" />
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      Fotografia
                    </p>

                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Use uma foto de rosto, fundo
                      simples e roupa formal.
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <input
                        ref={photoInput}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file =
                            e.target.files?.[0];

                          if (file) {
                            void onPhoto(file);
                          }

                          e.target.value = "";
                        }}
                      />

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          photoInput.current?.click()
                        }
                      >
                        Carregar foto
                      </Button>

                      {data.photo && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            set("photo", "")
                          }
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Field
                  label="Nome completo"
                  placeholder="Ex.: Ana Macuácua"
                  hint="Escreva o nome como aparece no BI."
                  value={data.fullName}
                  onChange={(v) =>
                    set("fullName", v)
                  }
                />

                <Field
                  label="Cargo pretendido"
                  placeholder="Ex.: Gestora de Operações"
                  hint="A função que procura, não a atual."
                  value={data.title}
                  onChange={(v) =>
                    set("title", v)
                  }
                />

                <Field
                  label="Email"
                  placeholder="Ex.: ana.macuacua@email.com"
                  value={data.email}
                  onChange={(v) =>
                    set("email", v)
                  }
                  type="email"
                />

                <Field
                  label="Telefone"
                  placeholder="Ex.: +258 84 000 0000"
                  value={data.phone}
                  onChange={(v) =>
                    set("phone", v)
                  }
                />

                <Field
                  label="Localização"
                  placeholder="Ex.: Maputo, Moçambique"
                  value={data.location}
                  onChange={(v) =>
                    set("location", v)
                  }
                />

                <div className="sm:col-span-2">
                  <Label htmlFor="summary">
                    Resumo profissional
                  </Label>

                  <Textarea
                    id="summary"
                    rows={4}
                    placeholder="Ex.: Profissional com 6 anos de experiência em operações, focada em resultados e liderança de equipas."
                    value={data.summary}
                    onChange={(e) =>
                      set(
                        "summary",
                        e.target.value,
                      )
                    }
                    className="mt-1"
                  />

                  <p className="mt-1 text-xs text-muted-foreground">
                    3 a 4 linhas: anos de
                    experiência, área e um resultado
                    concreto.
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {data.experiences.map(
                  (exp, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-bold">
                          Experiência {index + 1}
                        </p>

                        {data.experiences.length >
                          1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-destructive"
                            onClick={() =>
                              removeItem(
                                setData,
                                "experiences",
                                index,
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Cargo"
                          placeholder="Ex.: Assistente Administrativa"
                          value={exp.role}
                          onChange={(v) =>
                            updateItem(
                              setData,
                              "experiences",
                              index,
                              { role: v },
                            )
                          }
                        />

                        <Field
                          label="Empresa"
                          placeholder="Ex.: Grupo Zambeze"
                          value={exp.company}
                          onChange={(v) =>
                            updateItem(
                              setData,
                              "experiences",
                              index,
                              { company: v },
                            )
                          }
                        />

                        <Field
                          label="Período"
                          placeholder="Ex.: Jan 2022 — Atual"
                          value={exp.period}
                          onChange={(v) =>
                            updateItem(
                              setData,
                              "experiences",
                              index,
                              { period: v },
                            )
                          }
                        />
                      </div>

                      <Label className="mt-4 block">
                        Descrição
                      </Label>

                      <Textarea
                        rows={3}
                        className="mt-1"
                        placeholder="Ex.: Coordenei uma equipa de 12 pessoas e reduzi em 18% os custos logísticos."
                        value={exp.description}
                        onChange={(e) =>
                          updateItem(
                            setData,
                            "experiences",
                            index,
                            {
                              description:
                                e.target.value,
                            },
                          )
                        }
                      />

                      <p className="mt-1 text-xs text-muted-foreground">
                        Comece por um verbo de ação e
                        inclua números sempre que
                        possível.
                      </p>
                    </div>
                  ),
                )}

                <Button
                  variant="outline"
                  className="w-full gap-1 sm:w-auto"
                  onClick={() =>
                    setData((p) => ({
                      ...p,
                      experiences: [
                        ...p.experiences,
                        {
                          role: "",
                          company: "",
                          period: "",
                          description: "",
                        },
                      ],
                    }))
                  }
                >
                  <Plus className="h-4 w-4" />
                  Adicionar experiência
                </Button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                {data.education.map(
                  (edu, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border bg-background p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-bold">
                          Formação {index + 1}
                        </p>

                        {data.education.length >
                          1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-destructive"
                            onClick={() =>
                              removeItem(
                                setData,
                                "education",
                                index,
                              )
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field
                          label="Curso"
                          placeholder="Ex.: Licenciatura em Gestão"
                          value={edu.course}
                          onChange={(v) =>
                            updateItem(
                              setData,
                              "education",
                              index,
                              { course: v },
                            )
                          }
                        />

                        <Field
                          label="Instituição"
                          placeholder="Ex.: Universidade Eduardo Mondlane"
                          value={edu.school}
                          onChange={(v) =>
                            updateItem(
                              setData,
                              "education",
                              index,
                              { school: v },
                            )
                          }
                        />

                        <Field
                          label="Período"
                          placeholder="Ex.: 2015 — 2019"
                          value={edu.period}
                          onChange={(v) =>
                            updateItem(
                              setData,
                              "education",
                              index,
                              { period: v },
                            )
                          }
                        />
                      </div>
                    </div>
                  ),
                )}

                <Button
                  variant="outline"
                  className="w-full gap-1 sm:w-auto"
                  onClick={() =>
                    setData((p) => ({
                      ...p,
                      education: [
                        ...p.education,
                        {
                          course: "",
                          school: "",
                          period: "",
                        },
                      ],
                    }))
                  }
                >
                  <Plus className="h-4 w-4" />
                  Adicionar formação
                </Button>
              </div>
            )}

            {step === 4 && (
              <div className="grid gap-5">
                <div>
                  <Label htmlFor="skills">
                    Competências
                  </Label>

                  <Textarea
                    id="skills"
                    rows={5}
                    className="mt-1"
                    placeholder="Ex.: Atendimento ao cliente, Excel avançado, Gestão de stock, Trabalho em equipa"
                    value={data.skills}
                    onChange={(e) =>
                      set(
                        "skills",
                        e.target.value,
                      )
                    }
                  />

                  <p className="mt-1 text-xs text-muted-foreground">
                    Separe por vírgulas ou escreva uma
                    por linha.
                  </p>
                </div>

                <div>
                  <Label htmlFor="languages">
                    Idiomas
                  </Label>

                  <Textarea
                    id="languages"
                    rows={4}
                    className="mt-1"
                    placeholder="Ex.: Português (nativo), Inglês (intermédio), Changana"
                    value={data.languages}
                    onChange={(e) =>
                      set(
                        "languages",
                        e.target.value,
                      )
                    }
                  />
                </div>
              </div>
            )}

            {step === 0 && (
              <div>
                <div className="mb-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-lg font-black tracking-tight">
                        Escolha o seu modelo
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        Todos os modelos usam o mesmo
                        conteúdo. Escolha apenas o
                        estilo que combina consigo.
                      </p>
                    </div>

                    <div className="text-xs font-semibold text-muted-foreground">
                      {visibleTemplates.length}{" "}
                      modelos
                    </div>
                  </div>

                  <div className="mt-4 relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      value={templateSearch}
                      onChange={(e) =>
                        setTemplateSearch(
                          e.target.value,
                        )
                      }
                      placeholder="Pesquisar modelo..."
                      className="h-11 rounded-xl pl-9"
                    />
                  </div>

                  <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-1">
                    {TEMPLATE_FILTERS.map(
                      (filter) => {
                        const active =
                          filter ===
                          templateFilter;

                        return (
                          <button
                            key={filter}
                            type="button"
                            onClick={() =>
                              setTemplateFilter(
                                filter,
                              )
                            }
                            className={[
                              "shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition-all",
                              active
                                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                                : "border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground",
                            ].join(" ")}
                          >
                            {filter}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>

                {visibleTemplates.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleTemplates.map(
                      (tpl) => {
                        const selected =
                          tpl.id ===
                          data.templateId;

                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() =>
                              set(
                                "templateId",
                                tpl.id,
                              )
                            }
                            aria-pressed={
                              selected
                            }
                            className={[
                              "group relative overflow-hidden rounded-2xl border bg-background p-2 text-left transition-all duration-200",
                              selected
                                ? "border-primary ring-2 ring-primary/25 shadow-lg"
                                : "border-border hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md",
                            ].join(" ")}
                          >
                            <div className="relative">
                              <CvThumb
                                data={preview}
                                template={tpl}
                                width={150}
                              />

                              {tpl.premium && (
                                <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-white backdrop-blur">
                                  <Crown className="h-2.5 w-2.5" />
                                  Premium
                                </span>
                              )}

                              {selected && (
                                <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                                  <Check className="h-4 w-4" />
                                </span>
                              )}
                            </div>

                            <div className="px-1 pb-1 pt-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black">
                                    {tpl.name}
                                  </p>

                                  <p className="mt-0.5 text-[10px] font-semibold text-primary">
                                    {templateCategory(
                                      tpl.id,
                                    )}
                                  </p>
                                </div>
                              </div>

                              <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-muted-foreground">
                                {tpl.description}
                              </p>

                              <p className="mt-2 text-[9px] font-semibold text-muted-foreground">
                                {tpl.premium
                                  ? "Modelo premium"
                                  : "Modelo gratuito"}
                              </p>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
                    <Search className="mx-auto h-7 w-7 text-muted-foreground" />

                    <p className="mt-3 text-sm font-bold">
                      Nenhum modelo encontrado
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Experimente outro nome ou
                      categoria.
                    </p>

                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setTemplateSearch("");
                        setTemplateFilter(
                          "Todos",
                        );
                      }}
                    >
                      Ver todos os modelos
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
              <Button
                variant="outline"
                disabled={step === 0}
                onClick={() =>
                  setStep((s) =>
                    Math.max(0, s - 1),
                  )
                }
              >
                Anterior
              </Button>

              {step < STEPS.length - 1 ? (
                <Button
                  onClick={() =>
                    setStep((s) =>
                      Math.min(
                        STEPS.length - 1,
                        s + 1,
                      ),
                    )
                  }
                >
                  Seguinte
                </Button>
              ) : (
                <Button
                  className="gap-1"
                  disabled={pdf.busy}
                  onClick={() =>
                    void pdf.download()
                  }
                >
                  {pdf.busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}

                  {pdf.paid
                    ? "Descarregar PDF"
                    : `Pagar e descarregar${
                        pdf.amount
                          ? ` · ${pdf.amount} MZN`
                          : ""
                      }`}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-2 flex items-center justify-between gap-3 print:hidden">
            <div>
              <p className="text-sm font-bold">
                Pré-visualização
              </p>

              <p className="text-xs text-muted-foreground">
                {template.name} ·{" "}
                {templateCategory(
                  template.id,
                )}
              </p>
            </div>

            {template.premium && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                <Crown className="h-3 w-3" />
                Premium
              </span>
            )}
          </div>

          <div className="relative overflow-hidden rounded-[24px] border border-border bg-white shadow-sm print:border-0">
            <div className="origin-top-left [zoom:0.44] sm:[zoom:0.72] lg:[zoom:1] print:[zoom:1]">
              <div id="cv-print-area" className="relative">
                <CvPreview
                  data={preview}
                  template={template}
                />

                {!pdf.paid ? (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 grid select-none place-items-center overflow-hidden"
                  >
                    <div className="-rotate-30 space-y-6 text-center">
                      {[0, 1, 2, 3, 4].map(
                        (i) => (
                          <p
                            key={i}
                            className="whitespace-nowrap text-3xl font-extrabold tracking-[0.3em] text-black/20 sm:text-4xl"
                          >
                            MOZA EMPREGOS · AMOSTRA
                          </p>
                        ),
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <Button
            variant="outline"
            className="mt-3 w-full gap-1 print:hidden"
            disabled={pdf.busy}
            onClick={() =>
              void pdf.download(data.phone, "mpesa")
            }
          >
            {pdf.busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}

            {pdf.paid
              ? "Descarregar PDF"
              : `Pagar e descarregar${
                  pdf.amount
                    ? ` · ${pdf.amount} MZN`
                    : ""
                }`}
          </Button>

          {!pdf.paid ? (
            <Button
              variant="ghost"
              className="mt-2 w-full print:hidden"
              disabled={pdf.busy}
              onClick={() => void pdf.recheck()}
            >
              Já paguei — verificar
            </Button>
          ) : null}

          {pdf.message ? (
            <p className="mt-2 text-center text-xs text-destructive print:hidden">
              {pdf.message}
            </p>
          ) : null}

          {!pdf.paid ? (
            <p className="mt-2 text-center text-xs text-muted-foreground print:hidden">
              Pagamento seguro por M-Pesa,
              e-Mola ou cartão.
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}

function str(value: unknown) {
  return typeof value === "string"
    ? value
    : "";
}

function toDataUrl(file: File) {
  return new Promise<string>(
    (resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () =>
        resolve(String(reader.result));

      reader.onerror = () =>
        reject(new Error("read error"));

      reader.readAsDataURL(file);
    },
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  const id = label
    .toLowerCase()
    .replace(/\s+/g, "-");

  return (
    <div>
      <Label htmlFor={id}>
        {label}
      </Label>

      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="mt-1"
      />

      {hint && (
        <p className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

function updateItem<
  K extends "experiences" | "education",
>(
  setData: React.Dispatch<
    React.SetStateAction<CvData>
  >,
  key: K,
  index: number,
  patch: Partial<CvData[K][number]>,
) {
  setData((prev) => ({
    ...prev,
    [key]: prev[key].map(
      (item, i) =>
        i === index
          ? {
              ...item,
              ...patch,
            }
          : item,
    ),
  }));
}

function removeItem(
  setData: React.Dispatch<
    React.SetStateAction<CvData>
  >,
  key: "experiences" | "education",
  index: number,
) {
  setData((prev) => ({
    ...prev,
    [key]: prev[key].filter(
      (_, i) => i !== index,
    ),
  }));
}
