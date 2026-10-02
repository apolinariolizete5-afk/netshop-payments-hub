import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Download,
  Expand,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  X,
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
      { title: "Criar CV profissional online | Moza Empregos" },
      {
        name: "description",
        content:
          "Escolha um modelo, responda a perguntas simples e crie o seu CV profissional em poucos minutos.",
      },
      { property: "og:title", content: "Criador de CV | Moza Empregos" },
      {
        property: "og:description",
        content:
          "Escolha um modelo profissional e crie o seu CV de forma simples.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CriarCvPage,
});

const STEPS = [
  "Modelo",
  "Informações",
  "Experiência",
  "Formação",
  "Finalizar",
] as const;

function templateCategory(templateId: string) {
  const categories: Record<string, string> = {
    "template-01": "Elegante",
    "template-02": "Executivo",
    "template-03": "Corporativo",
    "template-04": "Design",
    "template-05": "Minimalista",
    "template-06": "Carreira",
    "template-07": "Executivo Premium",
    "template-08": "Corporativo",
    "template-09": "Primeiro emprego",
    "template-10": "Académico",
    "template-11": "Criativo",
  };

  return categories[templateId] ?? "Profissional";
}

function CriarCvPage() {
  const [data, setData] = useState<CvData>(EMPTY_CV);
  const [step, setStep] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [zoomTemplate, setZoomTemplate] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "mkesh">("mpesa");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);

  const [aiState, setAiState] = useState({
    loading: false,
    message: "",
  });

  const photoInput = useRef<HTMLInputElement>(null);
  const cvInput = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  const parse = useServerFn(parseCvFile);
  const pdf = useCvDownload();

  useEffect(() => {
    setData(loadCv());
  }, []);

  useEffect(() => {
    saveCv(data);
  }, [data]);

  useEffect(() => {
    const selectedIndex = CV_TEMPLATES.findIndex(
      (item) => item.id === data.templateId,
    );
    if (selectedIndex >= 0) setGalleryIndex(selectedIndex);
  }, [data.templateId]);

  const template =
    CV_TEMPLATES.find((item) => item.id === data.templateId) ??
    CV_TEMPLATES[0]!;

  const preview = previewData(data);

  function set<K extends keyof CvData>(key: K, value: CvData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function chooseTemplate(id: string) {
    set("templateId", id);
  }

  function scrollGallery(direction: number) {
    const next = Math.min(
      Math.max(galleryIndex + direction, 0),
      CV_TEMPLATES.length - 1,
    );
    setGalleryIndex(next);
    chooseTemplate(CV_TEMPLATES[next]!.id);
    galleryRef.current?.children[next]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }

  function openPayment() {
    if (pdf.paid) {
      void pdf.download(data.phone);
      return;
    }
    setPaymentPhone(data.phone || "");
    setPaymentMethod("mpesa");
    setPaymentOpen(true);
  }

  async function onPhoto(file: File) {
    set("photo", await toDataUrl(file));
  }

  async function onCvFile(file: File) {
    setAiState({ loading: true, message: "A ler o seu CV..." });

    try {
      const dataUrl = await toDataUrl(file);
      const base64 = dataUrl.split(",")[1] ?? "";

      const result = (await parse({
        data: {
          base64,
          mimeType: file.type || "application/pdf",
          fileName: file.name,
        },
      })) as
        | { ok: true; cvJson: string }
        | { ok: false; error: string };

      if (!result.ok) {
        setAiState({ loading: false, message: result.error });
        return;
      }

      const cv = JSON.parse(result.cvJson) as Partial<CvData>;

      setData((prev) => ({
        ...prev,
        fullName: str(cv.fullName) || prev.fullName,
        title: str(cv.title) || prev.title,
        email: str(cv.email) || prev.email,
        phone: str(cv.phone) || prev.phone,
        location: str(cv.location) || prev.location,
        summary: str(cv.summary) || prev.summary,
        skills: str(cv.skills) || prev.skills,
        languages: str(cv.languages) || prev.languages,
        experiences:
          Array.isArray(cv.experiences) && cv.experiences.length
            ? cv.experiences.map((e) => ({
                role: str(e?.role),
                company: str(e?.company),
                period: str(e?.period),
                description: str(e?.description),
              }))
            : prev.experiences,
        education:
          Array.isArray(cv.education) && cv.education.length
            ? cv.education.map((e) => ({
                course: str(e?.course),
                school: str(e?.school),
                period: str(e?.period),
              }))
            : prev.education,
      }));

      setAiState({
        loading: false,
        message: "Preenchimento concluído. Reveja os dados antes de continuar.",
      });
    } catch {
      setAiState({
        loading: false,
        message: "Falha ao ler o ficheiro. Tente novamente.",
      });
    }
  }

  return (
    <AppShell>
      <main className="mx-auto w-full max-w-7xl px-1 pb-10 print:px-0">
        <section className="relative overflow-hidden rounded-[28px] bg-primary px-5 py-7 text-primary-foreground shadow-sm print:hidden sm:px-8 sm:py-8">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] opacity-80">
              <Sparkles className="h-4 w-4" />
              Moza Empregos
            </div>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Crie o seu CV sem complicação.
            </h1>
            <p className="mt-2 text-sm leading-6 opacity-90 sm:text-base">
              Escolha um modelo, responda a perguntas simples e veja o seu CV a ganhar forma.
            </p>
          </div>
          <div aria-hidden className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10" />
          <div aria-hidden className="absolute -bottom-24 right-20 h-48 w-48 rounded-full bg-black/10" />
        </section>

        <div className="mt-5 print:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold">{STEPS[step]}</p>
              <p className="text-xs text-muted-foreground">
                {step === 0
                  ? "Primeiro escolha o visual do seu CV."
                  : "Pode voltar e alterar qualquer informação."}
              </p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={[
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-bold transition",
                  index === step
                    ? "border-primary bg-primary text-primary-foreground"
                    : index < step
                      ? "border-primary/20 bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground",
                ].join(" ")}
              >
                {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
                {label}
              </button>
            ))}
          </div>
        </div>

        {step === 0 ? (
          <section className="mt-5 rounded-[28px] border border-border bg-card p-4 shadow-sm sm:p-6 print:hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xl font-black tracking-tight sm:text-2xl">
                  Escolha o seu modelo
                </p>
                <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
                  Deslize para os lados, amplie um modelo e escolha o que mais gosta.
                </p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {galleryIndex + 1} de {CV_TEMPLATES.length}
              </span>
            </div>

            <div className="relative mt-5">
              <button
                type="button"
                onClick={() => scrollGallery(-1)}
                disabled={galleryIndex === 0}
                aria-label="Modelo anterior"
                className="absolute left-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 shadow-md disabled:opacity-30 sm:flex"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div
                ref={galleryRef}
                onScroll={(event) => {
                  const element = event.currentTarget;
                  const children = Array.from(element.children) as HTMLElement[];
                  if (!children.length) return;
                  const center = element.scrollLeft + element.clientWidth / 2;
                  let closest = 0;
                  let distance = Number.POSITIVE_INFINITY;
                  children.forEach((child, index) => {
                    const childCenter = child.offsetLeft + child.offsetWidth / 2;
                    const d = Math.abs(childCenter - center);
                    if (d < distance) {
                      distance = d;
                      closest = index;
                    }
                  });
                  if (closest !== galleryIndex) {
                    setGalleryIndex(closest);
                    chooseTemplate(CV_TEMPLATES[closest]!.id);
                  }
                }}
                className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 py-2 sm:px-10"
              >
                {CV_TEMPLATES.map((tpl) => {
                  const selected = tpl.id === data.templateId;
                  return (
                    <article
                      key={tpl.id}
                      className={[
                        "group w-[78vw] max-w-[330px] shrink-0 snap-center rounded-3xl border bg-background p-2 transition sm:w-[31%]",
                        selected
                          ? "border-primary ring-2 ring-primary/20 shadow-lg"
                          : "border-border hover:border-primary/40 hover:shadow-md",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          chooseTemplate(tpl.id);
                          setGalleryIndex(CV_TEMPLATES.findIndex((x) => x.id === tpl.id));
                        }}
                        className="block w-full text-left"
                        aria-pressed={selected}
                      >
                        <div className="relative overflow-hidden rounded-2xl bg-muted">
                          <CvThumb data={preview} template={tpl} width={330} />
                          {tpl.premium ? (
                            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-white backdrop-blur">
                              <Crown className="h-3 w-3" />
                              Premium
                            </span>
                          ) : null}
                          {selected ? (
                            <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
                              <Check className="h-4 w-4" />
                            </span>
                          ) : null}
                        </div>
                        <div className="px-2 pb-2 pt-3">
                          <p className="text-base font-black">{tpl.name}</p>
                          <p className="mt-0.5 text-xs font-bold text-primary">
                            {templateCategory(tpl.id)}
                          </p>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                            {tpl.description}
                          </p>
                        </div>
                      </button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mx-2 mb-2 w-[calc(100%-1rem)] gap-1.5"
                        onClick={() => setZoomTemplate(tpl.id)}
                      >
                        <Expand className="h-3.5 w-3.5" />
                        Ampliar
                      </Button>
                    </article>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => scrollGallery(1)}
                disabled={galleryIndex === CV_TEMPLATES.length - 1}
                aria-label="Próximo modelo"
                className="absolute right-1 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background/95 shadow-md disabled:opacity-30 sm:flex"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 flex items-center justify-center gap-1.5">
              {CV_TEMPLATES.map((tpl, index) => (
                <button
                  key={tpl.id}
                  type="button"
                  aria-label={"Ir para " + tpl.name}
                  onClick={() => {
                    chooseTemplate(tpl.id);
                    setGalleryIndex(index);
                    galleryRef.current?.children[index]?.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                      inline: "center",
                    });
                  }}
                  className={[
                    "h-1.5 rounded-full transition-all",
                    index === galleryIndex ? "w-7 bg-primary" : "w-1.5 bg-muted-foreground/30",
                  ].join(" ")}
                />
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Button
                size="lg"
                className="h-12 rounded-2xl px-7 text-sm font-black"
                onClick={() => setStep(1)}
              >
                Usar este modelo
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>

            <div className="mt-5 rounded-2xl border border-dashed border-border bg-muted/30 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-black">Já tem um CV?</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Envie PDF ou imagem e podemos preencher os campos para si. Depois reveja tudo antes de continuar.
                    </p>
                  </div>
                </div>
                <input
                  ref={cvInput}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void onCvFile(file);
                    event.target.value = "";
                  }}
                />
                <Button
                  variant="outline"
                  disabled={aiState.loading}
                  onClick={() => cvInput.current?.click()}
                  className="shrink-0 gap-2"
                >
                  {aiState.loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {aiState.loading ? "A analisar..." : "Carregar CV antigo"}
                </Button>
              </div>
              {aiState.message ? (
                <p className="mt-3 text-xs text-muted-foreground" role="status">
                  {aiState.message}
                </p>
              ) : null}
            </div>
          </section>
        ) : (
          <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(390px,1.1fr)]">
            <div className="min-w-0 print:hidden">
              <div className="rounded-[28px] border border-border bg-card p-5 shadow-sm sm:p-6">
                {step === 1 ? (
                  <BasicInfo
                    data={data}
                    setData={setData}
                    photoInput={photoInput}
                    onPhoto={onPhoto}
                  />
                ) : null}

                {step === 2 ? (
                  <ExperienceStep data={data} setData={setData} />
                ) : null}

                {step === 3 ? (
                  <EducationStep data={data} setData={setData} />
                ) : null}

                {step === 4 ? (
                  <FinalStep data={data} setData={setData} />
                ) : null}

                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    variant="outline"
                    onClick={() => setStep((value) => Math.max(0, value - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Voltar
                  </Button>

                  {step < STEPS.length - 1 ? (
                    <Button
                      className="h-11 rounded-xl px-6"
                      onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}
                    >
                      Continuar
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      className="h-11 rounded-xl px-6 gap-1.5"
                      disabled={pdf.busy}
                      onClick={openPayment}
                    >
                      {pdf.busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {pdf.paid
                        ? "Descarregar PDF"
                        : "Pagar e descarregar" + (pdf.amount ? " · " + pdf.amount + " MZN" : "")}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="mb-2 flex items-center justify-between print:hidden">
                <div>
                  <p className="text-sm font-black">Pré-visualização</p>
                  <p className="text-xs text-muted-foreground">
                    {template.name} · {templateCategory(template.id)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setMobilePreviewOpen((value) => !value)}
                >
                  {mobilePreviewOpen ? "Fechar CV" : "Ver CV"}
                </Button>
              </div>

              <div
                className={[
                  "overflow-hidden rounded-[24px] border border-border bg-white shadow-sm print:block",
                  mobilePreviewOpen ? "block" : "hidden lg:block",
                ].join(" ")}
              >
                <div className="origin-top-left [zoom:0.42] sm:[zoom:0.58] lg:[zoom:0.9] xl:[zoom:1] print:[zoom:1]">
                  <div id="cv-print-area" className="relative">
                    <CvPreview data={preview} template={template} />
                    {!pdf.paid ? (
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 grid select-none place-items-center overflow-hidden"
                      >
                        <div className="-rotate-30 space-y-6 text-center">
                          {[0, 1, 2, 3, 4].map((index) => (
                            <p
                              key={index}
                              className="whitespace-nowrap text-3xl font-extrabold tracking-[0.3em] text-black/20 sm:text-4xl"
                            >
                              MOZA EMPREGOS · AMOSTRA
                            </p>
                          ))}
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
                onClick={openPayment}
              >
                {pdf.busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {pdf.paid
                  ? "Descarregar PDF"
                  : "Pagar e descarregar" + (pdf.amount ? " · " + pdf.amount + " MZN" : "")}
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
                <p className="mt-2 text-center text-xs text-destructive print:hidden">{pdf.message}</p>
              ) : null}

              {!pdf.paid ? (
                <p className="mt-2 text-center text-xs text-muted-foreground print:hidden">
                  Pagamento seguro por M-Pesa, mKesh ou cartão.
                </p>
              ) : null}
            </div>
          </section>
        )}

        {zoomTemplate ? (
          <TemplateZoom
            templateId={zoomTemplate}
            data={preview}
            onClose={() => setZoomTemplate(null)}
            onChoose={(id) => {
              chooseTemplate(id);
              setGalleryIndex(CV_TEMPLATES.findIndex((item) => item.id === id));
              setZoomTemplate(null);
            }}
          />
        ) : null}

        {paymentOpen && !pdf.paid ? (
          <PaymentDialog
            amount={pdf.amount ?? 150}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            paymentPhone={paymentPhone}
            setPaymentPhone={setPaymentPhone}
            busy={pdf.busy}
            message={pdf.message}
            onClose={() => setPaymentOpen(false)}
            onPay={async () => {
              await pdf.download(paymentPhone, paymentMethod);
              if (pdf.paid) setPaymentOpen(false);
            }}
          />
        ) : null}
      </main>
    </AppShell>
  );
}

function BasicInfo({
  data,
  setData,
  photoInput,
  onPhoto,
}: {
  data: CvData;
  setData: Dispatch<SetStateAction<CvData>>;
  photoInput: React.RefObject<HTMLInputElement | null>;
  onPhoto: (file: File) => Promise<void>;
}) {
  return (
    <div>
      <StepTitle
        eyebrow="Passo 1"
        title="Vamos começar pelo básico"
        description="Só precisamos destas informações para montar a primeira versão."
      />

      <div className="mt-6 space-y-4">
        <Field
          label="Nome completo"
          placeholder="Ex.: Ana Macuácua"
          value={data.fullName}
          onChange={(value) => setData((prev) => ({ ...prev, fullName: value }))}
        />

        <Field
          label="Cargo ou profissão"
          placeholder="Ex.: Assistente Administrativa"
          value={data.title}
          onChange={(value) => setData((prev) => ({ ...prev, title: value }))}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Telefone"
            placeholder="Ex.: +258 84 000 0000"
            value={data.phone}
            onChange={(value) => setData((prev) => ({ ...prev, phone: value }))}
          />
          <Field
            label="Email"
            type="email"
            placeholder="Ex.: nome@email.com"
            value={data.email}
            onChange={(value) => setData((prev) => ({ ...prev, email: value }))}
          />
        </div>

        <Field
          label="Cidade"
          placeholder="Ex.: Maputo, Moçambique"
          value={data.location}
          onChange={(value) => setData((prev) => ({ ...prev, location: value }))}
        />

        <div className="rounded-2xl border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-4">
            {data.photo ? (
              <img
                src={data.photo}
                alt="Fotografia do CV"
                className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/15"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted">
                <UserRound className="h-7 w-7 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">Fotografia</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Opcional. Pode adicionar agora ou deixar para depois.
              </p>
            </div>
            <input
              ref={photoInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void onPhoto(file);
                event.target.value = "";
              }}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" onClick={() => photoInput.current?.click()}>
              {data.photo ? "Trocar foto" : "Adicionar foto"}
            </Button>
            {data.photo ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setData((prev) => ({ ...prev, photo: "" }))}
              >
                Remover
              </Button>
            ) : null}
          </div>
        </div>

        <div>
          <Label htmlFor="cv-summary">Resumo profissional <span className="font-normal text-muted-foreground">(opcional)</span></Label>
          <Textarea
            id="cv-summary"
            rows={4}
            className="mt-1"
            placeholder="Conte em 2 ou 3 frases quem é profissionalmente e o que procura."
            value={data.summary}
            onChange={(event) => setData((prev) => ({ ...prev, summary: event.target.value }))}
          />
        </div>
      </div>
    </div>
  );
}

function ExperienceStep({
  data,
  setData,
}: {
  data: CvData;
  setData: Dispatch<SetStateAction<CvData>>;
}) {
  const [started, setStarted] = useState(data.experiences.length > 0);

  useEffect(() => {
    if (data.experiences.length > 0) setStarted(true);
  }, [data.experiences.length]);

  function startExperience() {
    setStarted(true);
    if (!data.experiences.length) {
      setData((prev) => ({
        ...prev,
        experiences: [{ role: "", company: "", period: "", description: "" }],
      }));
    }
  }

  function skipExperience() {
    setStarted(false);
    setData((prev) => ({ ...prev, experiences: [] }));
  }

  return (
    <div>
      <StepTitle
        eyebrow="Passo 2"
        title="Tem experiência profissional?"
        description="Adicione uma ou quantas experiências quiser. Se ainda não trabalhou, pode saltar."
      />

      {!started ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ChoiceCard
            title="Sim, tenho experiência"
            description="Adicionar trabalho, estágio ou experiência relevante."
            onClick={startExperience}
          />
          <ChoiceCard
            title="Ainda não"
            description="Continuar sem experiência profissional."
            onClick={skipExperience}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.experiences.map((item, index) => (
            <div key={index} className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-black">Experiência {index + 1}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-destructive"
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      experiences: prev.experiences.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Cargo"
                  placeholder="Ex.: Assistente Administrativa"
                  value={item.role}
                  onChange={(value) =>
                    updateExperience(setData, index, { role: value })
                  }
                />
                <Field
                  label="Empresa"
                  placeholder="Ex.: Empresa ABC"
                  value={item.company}
                  onChange={(value) =>
                    updateExperience(setData, index, { company: value })
                  }
                />
                <Field
                  label="Período"
                  placeholder="Ex.: 2022 — Atual"
                  value={item.period}
                  onChange={(value) =>
                    updateExperience(setData, index, { period: value })
                  }
                />
                <div className="sm:col-span-2">
                  <Label>O que fazia? <span className="font-normal text-muted-foreground">(opcional)</span></Label>
                  <Textarea
                    rows={3}
                    className="mt-1"
                    placeholder="Ex.: Atendimento ao cliente, organização de documentos e apoio à equipa."
                    value={item.description}
                    onChange={(event) =>
                      updateExperience(setData, index, { description: event.target.value })
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full gap-1.5 sm:w-auto"
            onClick={() =>
              setData((prev) => ({
                ...prev,
                experiences: [
                  ...prev.experiences,
                  { role: "", company: "", period: "", description: "" },
                ],
              }))
            }
          >
            <Plus className="h-4 w-4" />
            Adicionar outra experiência
          </Button>
        </div>
      )}
    </div>
  );
}

function EducationStep({
  data,
  setData,
}: {
  data: CvData;
  setData: Dispatch<SetStateAction<CvData>>;
}) {
  const [started, setStarted] = useState(data.education.length > 0);

  useEffect(() => {
    if (data.education.length > 0) setStarted(true);
  }, [data.education.length]);

  function startEducation() {
    setStarted(true);
    if (!data.education.length) {
      setData((prev) => ({
        ...prev,
        education: [{ course: "", school: "", period: "" }],
      }));
    }
  }

  function skipEducation() {
    setStarted(false);
    setData((prev) => ({ ...prev, education: [] }));
  }

  return (
    <div>
      <StepTitle
        eyebrow="Passo 3"
        title="Onde estudou?"
        description="Adicione a sua formação. Pode adicionar mais de uma."
      />

      {!started ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ChoiceCard
            title="Adicionar formação"
            description="Curso, instituição e período."
            onClick={startEducation}
          />
          <ChoiceCard
            title="Deixar para depois"
            description="Continuar sem formação por agora."
            onClick={skipEducation}
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {data.education.map((item, index) => (
            <div key={index} className="rounded-2xl border border-border bg-muted/20 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-black">Formação {index + 1}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-destructive"
                  onClick={() =>
                    setData((prev) => ({
                      ...prev,
                      education: prev.education.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                  Remover
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Curso"
                  placeholder="Ex.: Licenciatura em Gestão"
                  value={item.course}
                  onChange={(value) =>
                    updateEducation(setData, index, { course: value })
                  }
                />
                <Field
                  label="Instituição"
                  placeholder="Ex.: Universidade Eduardo Mondlane"
                  value={item.school}
                  onChange={(value) =>
                    updateEducation(setData, index, { school: value })
                  }
                />
                <Field
                  label="Período"
                  placeholder="Ex.: 2020 — 2024"
                  value={item.period}
                  onChange={(value) =>
                    updateEducation(setData, index, { period: value })
                  }
                />
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            className="w-full gap-1.5 sm:w-auto"
            onClick={() =>
              setData((prev) => ({
                ...prev,
                education: [
                  ...prev.education,
                  { course: "", school: "", period: "" },
                ],
              }))
            }
          >
            <Plus className="h-4 w-4" />
            Adicionar outra formação
          </Button>
        </div>
      )}
    </div>
  );
}

function FinalStep({
  data,
  setData,
}: {
  data: CvData;
  setData: Dispatch<SetStateAction<CvData>>;
}) {
  return (
    <div>
      <StepTitle
        eyebrow="Passo 4"
        title="Só falta o essencial"
        description="Adicione competências e idiomas. O resto é opcional."
      />

      <div className="mt-6 space-y-5">
        <div>
          <Label htmlFor="cv-skills">Competências</Label>
          <Textarea
            id="cv-skills"
            rows={4}
            className="mt-1"
            placeholder="Ex.: Atendimento ao cliente, Excel, Comunicação, Trabalho em equipa"
            value={data.skills}
            onChange={(event) => setData((prev) => ({ ...prev, skills: event.target.value }))}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Separe por vírgulas ou escreva uma por linha.
          </p>
        </div>

        <div>
          <Label htmlFor="cv-languages">Idiomas</Label>
          <Textarea
            id="cv-languages"
            rows={3}
            className="mt-1"
            placeholder="Ex.: Português — Nativo, Inglês — Intermédio"
            value={data.languages}
            onChange={(event) => setData((prev) => ({ ...prev, languages: event.target.value }))}
          />
        </div>

        <div className="rounded-2xl border border-dashed border-border p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-black">Quer acrescentar alguma coisa?</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Certificações, projectos, voluntariado, prémios ou qualquer outra secção.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="gap-1"
              onClick={() =>
                setData((prev) => ({
                  ...prev,
                  customSections: [
                    ...prev.customSections,
                    {
                      id: "custom-" + Date.now() + "-" + prev.customSections.length,
                      title: "",
                      content: "",
                    },
                  ],
                }))
              }
            >
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </div>

          {data.customSections.length ? (
            <div className="mt-4 space-y-3">
              {data.customSections.map((section, index) => (
                <div key={section.id} className="rounded-xl border border-border bg-background p-3">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Field
                      label="Nome da secção"
                      placeholder="Ex.: Certificações"
                      value={section.title}
                      onChange={(value) =>
                        setData((prev) => ({
                          ...prev,
                          customSections: prev.customSections.map((item, i) =>
                            i === index ? { ...item, title: value } : item,
                          ),
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-5 gap-1 text-destructive"
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          customSections: prev.customSections.filter((_, i) => i !== index),
                        }))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                  <div className="mt-3">
                    <Label>Conteúdo</Label>
                    <Textarea
                      rows={4}
                      className="mt-1"
                      placeholder="Escreva a informação desta secção..."
                      value={section.content}
                      onChange={(event) =>
                        setData((prev) => ({
                          ...prev,
                          customSections: prev.customSections.map((item, i) =>
                            i === index ? { ...item, content: event.target.value } : item,
                          ),
                        }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function StepTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-black tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function ChoiceCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border border-border bg-background p-5 text-left transition hover:border-primary/50 hover:shadow-md"
    >
      <p className="font-black">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </button>
  );
}

function TemplateZoom({
  templateId,
  data,
  onClose,
  onChoose,
}: {
  templateId: string;
  data: CvData;
  onClose: () => void;
  onChoose: (id: string) => void;
}) {
  const template =
    CV_TEMPLATES.find((item) => item.id === templateId) ?? CV_TEMPLATES[0]!;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Pré-visualização do modelo"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex h-[96vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-background shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="font-black">{template.name}</p>
            <p className="text-xs text-muted-foreground">{templateCategory(template.id)}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onChoose(template.id)}
              className="hidden sm:inline-flex"
            >
              Escolher este modelo
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-4 sm:p-8">
          <div className="mx-auto w-fit origin-top scale-[0.52] sm:scale-[0.7] md:scale-[0.82] lg:scale-100">
            <CvPreview data={data} template={template} />
          </div>
        </div>

        <div className="shrink-0 border-t border-border p-3 sm:hidden">
          <Button className="w-full" onClick={() => onChoose(template.id)}>
            Escolher este modelo
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentDialog({
  amount,
  paymentMethod,
  setPaymentMethod,
  paymentPhone,
  setPaymentPhone,
  busy,
  message,
  onClose,
  onPay,
}: {
  amount: number;
  paymentMethod: "mpesa" | "mkesh";
  setPaymentMethod: (value: "mpesa" | "mkesh") => void;
  paymentPhone: string;
  setPaymentPhone: (value: string) => void;
  busy: boolean;
  message: string;
  onClose: () => void;
  onPay: () => Promise<void>;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-2xl" role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black">Pagar e descarregar</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Escolha o método e o número que vai usar para pagar.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-primary/5 p-4 text-center">
          <p className="text-xs font-semibold text-muted-foreground">Valor a pagar</p>
          <p className="mt-1 text-2xl font-black text-primary">{amount} MZN</p>
        </div>

        <div className="mt-5">
          <Label>Método de pagamento</Label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            {(["mpesa", "mkesh"] as const).map((method) => (
              <button
                key={method}
                type="button"
                onClick={() => setPaymentMethod(method)}
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  paymentMethod === method
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40",
                ].join(" ")}
              >
                <p className="font-black">{method === "mpesa" ? "M-Pesa" : "mKesh"}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {method === "mpesa" ? "84 ou 85" : "82 ou 83"}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <Label htmlFor="payment-phone">Número de telemóvel</Label>
          <Input
            id="payment-phone"
            type="tel"
            placeholder="Ex.: 84 000 0000"
            value={paymentPhone}
            onChange={(event) => setPaymentPhone(event.target.value)}
            className="mt-1 h-11 rounded-xl"
          />
        </div>

        {message ? <p className="mt-3 text-xs text-destructive">{message}</p> : null}

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" disabled={busy} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            className="flex-1"
            disabled={busy || !paymentPhone.trim()}
            onClick={() => void onPay()}
          >
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {busy ? "A processar..." : "Pagar " + amount + " MZN"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  const id = "field-" + label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-11 rounded-xl"
      />
    </div>
  );
}

function updateExperience(
  setData: Dispatch<SetStateAction<CvData>>,
  index: number,
  patch: Partial<CvData["experiences"][number]>,
) {
  setData((prev) => ({
    ...prev,
    experiences: prev.experiences.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    ),
  }));
}

function updateEducation(
  setData: Dispatch<SetStateAction<CvData>>,
  index: number,
  patch: Partial<CvData["education"][number]>,
) {
  setData((prev) => ({
    ...prev,
    education: prev.education.map((item, i) =>
      i === index ? { ...item, ...patch } : item,
    ),
  }));
}

function str(value: unknown) {
  return typeof value === "string" ? value : "";
}

function toDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("read error"));
    reader.readAsDataURL(file);
  });
}
