import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ParseInput = {
  mimeType: string;
  fileName: string;
  base64: string;
};

type GeminiModel = {
  name?: string;
  baseModelId?: string;
  supportedGenerationMethods?: string[];
};

type GeminiModelsResponse = {
  models?: GeminiModel[];
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

type GeminiCallResult = {
  response: Response;
  text: string;
  json: GeminiResponse | null;
};

const MODEL_LIST_TIMEOUT = 8000;
const REQUEST_TIMEOUT = 18000;
const MAX_RETRIES_PER_MODEL = 1;
const RETRY_DELAY_MS = 700;

/**
 * Pequeno atraso usado apenas para erros temporários.
 * Não deixa o utilizador preso durante minutos.
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch com timeout.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT
) {
  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Obtém os modelos Gemini disponíveis para a API key.
 */
async function getAvailableModels(apiKey: string): Promise<string[]> {
  try {
    const response = await fetchWithTimeout(
      "https://generativelanguage.googleapis.com/v1beta/models",
      {
        method: "GET",
        headers: {
          "x-goog-api-key": apiKey,
        },
      },
      MODEL_LIST_TIMEOUT
    );

    const text = await response.text();

    if (!response.ok) {
      console.error(
        "Gemini models.list failed:",
        response.status,
        text
      );

      return [];
    }

    try {
      const data = JSON.parse(text) as GeminiModelsResponse;

      return (data.models ?? [])
        .filter((model) =>
          model.supportedGenerationMethods?.includes(
            "generateContent"
          )
        )
        .map((model) => model.name ?? "")
        .filter(Boolean);
    } catch (error) {
      console.error(
        "Gemini models.list JSON error:",
        error
      );

      return [];
    }
  } catch (error) {
    console.error(
      "Gemini models.list request error:",
      error
    );

    return [];
  }
}

/**
 * Ordem de preferência dos modelos.
 *
 * A função NÃO assume que todos existem.
 * Primeiro verifica quais estão realmente disponíveis
 * para a API key atual.
 */
function sortModels(models: string[]): string[] {
  const preferred = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ];

  const normalizedModels = models.filter(Boolean);

  const result: string[] = [];

  /**
   * Adiciona um modelo somente uma vez.
   */
  const addUnique = (model: string) => {
    if (!result.includes(model)) {
      result.push(model);
    }
  };

  /**
   * Primeiro os modelos da lista preferida.
   */
  for (const preferredModel of preferred) {
    const matches = normalizedModels.filter((model) =>
      model.toLowerCase().includes(
        preferredModel.toLowerCase()
      )
    );

    for (const match of matches) {
      addUnique(match);
    }
  }

  /**
   * Depois qualquer outro modelo Flash disponível.
   */
  for (const model of normalizedModels) {
    if (model.toLowerCase().includes("flash")) {
      addUnique(model);
    }
  }

  /**
   * Por último, outros modelos compatíveis.
   *
   * Isso evita falhar completamente caso a API key
   * tenha apenas um modelo diferente dos conhecidos.
   */
  for (const model of normalizedModels) {
    addUnique(model);
  }

  return result;
}

/**
 * Chamada individual ao Gemini.
 */
async function callGemini(
  apiKey: string,
  modelName: string,
  parts: Array<Record<string, unknown>>
): Promise<GeminiCallResult> {
  const cleanModelName = modelName.startsWith("models/")
    ? modelName.substring("models/".length)
    : modelName;

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${cleanModelName}:generateContent`;

  const response = await fetchWithTimeout(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    },
    REQUEST_TIMEOUT
  );

  const text = await response.text();

  let json: GeminiResponse | null = null;

  try {
    json = JSON.parse(text) as GeminiResponse;
  } catch {
    // Algumas respostas de erro podem não ser JSON.
  }

  return {
    response,
    text,
    json,
  };
}

/**
 * Determina se vale a pena tentar outro modelo.
 */
function isTemporaryError(status: number): boolean {
  return (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

/**
 * Extrai e valida o JSON devolvido pela IA.
 */
function parseGeminiJson(raw: string) {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  /**
   * Primeira tentativa:
   * resposta inteira como JSON.
   */
  try {
    return JSON.parse(cleaned);
  } catch {
    // Continua para o fallback.
  }

  /**
   * Segunda tentativa:
   * encontra o primeiro objecto JSON dentro da resposta.
   */
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (
    firstBrace === -1 ||
    lastBrace === -1 ||
    lastBrace <= firstBrace
  ) {
    return null;
  }

  const possibleJson = cleaned.slice(
    firstBrace,
    lastBrace + 1
  );

  try {
    return JSON.parse(possibleJson);
  } catch {
    return null;
  }
}

/**
 * Garante que o objecto devolvido tenha a estrutura
 * esperada pelo editor de CV.
 */
function normalizeCvJson(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return null;
  }

  const input = value as Record<string, unknown>;

  const experiences = Array.isArray(input.experiences)
    ? input.experiences.map((item) => {
        const experience =
          item && typeof item === "object"
            ? (item as Record<string, unknown>)
            : {};

        return {
          role:
            typeof experience.role === "string"
              ? experience.role
              : "",
          company:
            typeof experience.company === "string"
              ? experience.company
              : "",
          period:
            typeof experience.period === "string"
              ? experience.period
              : "",
          description:
            typeof experience.description === "string"
              ? experience.description
              : "",
        };
      })
    : [];

  const education = Array.isArray(input.education)
    ? input.education.map((item) => {
        const educationItem =
          item && typeof item === "object"
            ? (item as Record<string, unknown>)
            : {};

        return {
          course:
            typeof educationItem.course === "string"
              ? educationItem.course
              : "",
          school:
            typeof educationItem.school === "string"
              ? educationItem.school
              : "",
          period:
            typeof educationItem.period === "string"
              ? educationItem.period
              : "",
        };
      })
    : [];

  return {
    fullName:
      typeof input.fullName === "string"
        ? input.fullName
        : "",

    title:
      typeof input.title === "string"
        ? input.title
        : "",

    email:
      typeof input.email === "string"
        ? input.email
        : "",

    phone:
      typeof input.phone === "string"
        ? input.phone
        : "",

    location:
      typeof input.location === "string"
        ? input.location
        : "",

    summary:
      typeof input.summary === "string"
        ? input.summary
        : "",

    experiences,

    education,

    skills:
      typeof input.skills === "string"
        ? input.skills
        : "",

    languages:
      typeof input.languages === "string"
        ? input.languages
        : "",
  };
}

async function callOpenRouter(
  apiKey: string,
  instruction: string,
  data: ParseInput,
) {
  const fileData = "data:" + data.mimeType + ";base64," + data.base64;
  const content =
    data.mimeType === "application/pdf"
      ? [
          { type: "text", text: instruction },
          {
            type: "file",
            file: {
              filename: data.fileName || "cv.pdf",
              file_data: fileData,
            },
          },
        ]
      : [
          { type: "text", text: instruction },
          {
            type: "image_url",
            image_url: { url: fileData },
          },
        ];

  const response = await fetchWithTimeout(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
        "HTTP-Referer": "https://mozaemprego.onrender.com",
        "X-Title": "Moza Empregos CV",
      },
      body: JSON.stringify({
        model: "openrouter/auto-beta",
        messages: [{ role: "user", content }],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    },
    REQUEST_TIMEOUT,
  );

  const body = (await response.json().catch(() => null)) as
    | {
        choices?: Array<{
          message?: { content?: string | Array<{ text?: string }> };
        }>;
      }
    | null;

  const value = body?.choices?.[0]?.message?.content;
  const raw =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? value.map((part) => part.text ?? "").join("")
        : "";

  return { ok: response.ok, status: response.status, raw };
}

async function callGroq(
  apiKey: string,
  instruction: string,
  data: ParseInput,
) {
  if (!data.mimeType.startsWith("image/")) {
    return { ok: false, status: 415, raw: "" };
  }

  const response = await fetchWithTimeout(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.8-27b",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: instruction },
              {
                type: "image_url",
                image_url: {
                  url:
                    "data:" + data.mimeType + ";base64," + data.base64,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_completion_tokens: 2500,
      }),
    },
    REQUEST_TIMEOUT,
  );

  const body = (await response.json().catch(() => null)) as
    | {
        choices?: Array<{ message?: { content?: string } }>;
      }
    | null;

  return {
    ok: response.ok,
    status: response.status,
    raw: body?.choices?.[0]?.message?.content ?? "",
  };
}

async function tryProvider(
  name: string,
  call: () => Promise<{ ok: boolean; status: number; raw: string }>,
) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await call();
      console.log(
        "CV AI " + name + ": tentativa " + attempt + ", status " + result.status,
      );

      if (result.ok) {
        const normalized = normalizeCvJson(parseGeminiJson(result.raw));
        if (normalized) return normalized;
      }

      if (![408, 409, 425, 429, 500, 502, 503, 504].includes(result.status)) {
        break;
      }
    } catch (error) {
      console.error("CV AI " + name + " erro:", error);
    }

    if (attempt < 2) await sleep(450);
  }

  return null;
}

export const parseCvFile = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ParseInput) => {
    if (
      !data ||
      typeof data.base64 !== "string" ||
      !data.base64
    ) {
      throw new Error("Ficheiro inválido.");
    }

    return data;
  })
  .handler(async ({ data }) => {
    const instruction =
      "Analisa este currículo e extrai somente informação realmente presente. " +
      "Não inventes nomes, empresas, datas, cursos, competências ou idiomas. " +
      "Responde APENAS JSON válido, sem Markdown, em português. " +
      "Estrutura: " +
      JSON.stringify({
        fullName: "",
        title: "",
        email: "",
        phone: "",
        location: "",
        summary: "",
        experiences: [
          {
            role: "",
            company: "",
            period: "",
            description: "",
          },
        ],
        education: [
          { course: "", school: "", period: "" },
        ],
        skills: "",
        languages: "",
      });

    const geminiKey = process.env["GEMINI_API_KEY"];
    const openRouterKey = process.env["OPENROUTER_API_KEY"];
    const groqKey = process.env["GROQ_API_KEY"];

    const providers: Array<{
      name: string;
      key: string | undefined;
      run: (key: string) => Promise<ReturnType<typeof normalizeCvJson> | null>;
    }> = [
      {
        name: "Gemini",
        key: geminiKey,
        run: async (key) => {
          const models = await getAvailableModels(key);
          const model = sortModels(models)[0] ?? "gemini-3.8-flash";
          return tryProvider("Gemini", () => callGemini(key, model, [
            { text: instruction },
            {
              inline_data: {
                mime_type: data.mimeType,
                data: data.base64,
              },
            },
          ]));
        },
      },
      {
        name: "OpenRouter",
        key: openRouterKey,
        run: async (key) =>
          tryProvider("OpenRouter", () =>
            callOpenRouter(key, instruction, data),
          ),
      },
      {
        name: "Groq",
        key: groqKey,
        run: async (key) =>
          tryProvider("Groq", () =>
            callGroq(key, instruction, data),
          ),
      },
    ];

    const configured = providers.filter((provider) => Boolean(provider.key));

    if (!configured.length) {
      console.error(
        "Nenhuma IA configurada. Configure GEMINI_API_KEY, OPENROUTER_API_KEY ou GROQ_API_KEY.",
      );
      return {
        ok: false as const,
        error: "O preenchimento automático está temporariamente indisponível.",
      };
    }

    for (const provider of configured) {
      console.log("CV AI: a tentar " + provider.name + ".");

      const result = await provider.run(provider.key!);

      if (result) {
        console.log("CV AI: sucesso com " + provider.name + ".");
        return {
          ok: true as const,
          cvJson: JSON.stringify(result),
        };
      }

      console.warn(
        "CV AI: " + provider.name + " falhou; a passar para o próximo.",
      );
    }

    return {
      ok: false as const,
      error:
        "Não foi possível preencher o CV agora. Tente novamente em alguns segundos.",
    };
  });