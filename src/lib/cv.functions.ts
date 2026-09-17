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
    const apiKey = process.env["GEMINI_API_KEY"];

    if (!apiKey) {
      console.error(
        "GEMINI_API_KEY não configurada no servidor."
      );

      return {
        ok: false as const,
        error: "IA não configurada.",
      };
    }

    const isImage = data.mimeType.startsWith("image/");

    const isPdf =
      data.mimeType === "application/pdf" ||
      data.fileName.toLowerCase().endsWith(".pdf");

    if (!isImage && !isPdf) {
      return {
        ok: false as const,
        error:
          "Formato não suportado. Envie o CV em PDF ou uma fotografia legível (JPG/PNG).",
      };
    }

    /**
     * Prompt mais rígido para reduzir respostas fora
     * do formato esperado.
     */
    const instruction =
      "Analisa este currículo cuidadosamente e extrai apenas " +
      "as informações que realmente aparecem no documento. " +
      "Devolve APENAS um objecto JSON válido. " +
      "Não escrevas Markdown. " +
      "Não uses blocos ```json. " +
      "Não escrevas explicações antes ou depois do JSON. " +
      "Usa exactamente esta estrutura: " +
      "{ " +
      '"fullName": "", ' +
      '"title": "", ' +
      '"email": "", ' +
      '"phone": "", ' +
      '"location": "", ' +
      '"summary": "", ' +
      '"experiences": [{"role": "", "company": "", "period": "", "description": ""}], ' +
      '"education": [{"course": "", "school": "", "period": ""}], ' +
      '"skills": "", ' +
      '"languages": "" ' +
      "}. " +
      "Usa português. " +
      "Se uma informação não existir no currículo, deixa " +
      "o campo vazio. " +
      "Não inventes nomes, empresas, datas, cursos, " +
      "competências ou outras informações. " +
      "Mantém datas e nomes exactamente como aparecem " +
      "quando forem legíveis.";

    const parts: Array<Record<string, unknown>> = [
      {
        text: instruction,
      },
    ];

    /**
     * Envia a imagem ou PDF directamente para o Gemini.
     */
    if (isImage) {
      parts.push({
        inline_data: {
          mime_type: data.mimeType,
          data: data.base64,
        },
      });
    } else {
      parts.push({
        inline_data: {
          mime_type: "application/pdf",
          data: data.base64,
        },
      });
    }

    /**
     * Descobre os modelos disponíveis para esta API key.
     */
    const availableModels =
      await getAvailableModels(apiKey);

    console.log(
      "Gemini models disponíveis:",
      availableModels
    );

    if (availableModels.length === 0) {
      return {
        ok: false as const,
        error:
          "A IA está temporariamente indisponível. Tente novamente.",
      };
    }

    /**
     * Ordena os modelos por preferência.
     */
    const modelsToTry = sortModels(
      availableModels
    );

    console.log(
      "Gemini modelos que serão tentados:",
      modelsToTry
    );

    /**
     * Guarda o último erro apenas nos logs.
     * Nunca é mostrado directamente ao utilizador.
     */
    let lastStatus: number | null = null;

    /**
     * Tenta os modelos sequencialmente.
     *
     * Exemplo:
     *
     * Gemini 3.8 → 503
     * Gemini 3.7 → 503
     * Gemini 3.6 → sucesso
     *
     * O utilizador recebe apenas o resultado final.
     */
    for (
      let modelIndex = 0;
      modelIndex < modelsToTry.length;
      modelIndex++
    ) {
      const model = modelsToTry[modelIndex];

      console.log(
        `Gemini tentativa ${modelIndex + 1}/${modelsToTry.length}:`,
        model
      );

      for (
        let retry = 0;
        retry <= MAX_RETRIES_PER_MODEL;
        retry++
      ) {
        try {
          /**
           * Retry curto somente quando o erro é temporário.
           */
          if (retry > 0) {
            await sleep(
              RETRY_DELAY_MS * retry
            );

            console.log(
              "Gemini retry:",
              model,
              retry
            );
          }

          const result = await callGemini(
            apiKey,
            model,
            parts
          );

          lastStatus = result.response.status;

          console.log(
            "Gemini status:",
            result.response.status,
            "modelo:",
            model
          );

          /**
           * Chave inválida ou sem autorização.
           * Não adianta tentar outros modelos.
           */
          if (
            result.response.status === 401 ||
            result.response.status === 403
          ) {
            console.error(
              "Gemini autorização falhou:",
              result.response.status,
              result.text
            );

            return {
              ok: false as const,
              error:
                "A IA não está disponível neste momento.",
            };
          }

          /**
           * Pedido inválido.
           * Outro modelo provavelmente receberia
           * exactamente o mesmo pedido inválido.
           */
          if (result.response.status === 400) {
            console.error(
              "Gemini request inválido:",
              result.text
            );

            return {
              ok: false as const,
              error:
                "Não foi possível processar este ficheiro. Tente outro PDF ou uma fotografia mais nítida.",
            };
          }

          /**
           * Erros temporários.
           *
           * Se ainda houver retry, repete.
           * Depois passa imediatamente para outro modelo.
           */
          if (
            !result.response.ok &&
            isTemporaryError(
              result.response.status
            )
          ) {
            console.warn(
              "Gemini temporariamente indisponível:",
              result.response.status,
              "modelo:",
              model
            );

            continue;
          }

          /**
           * Outros erros HTTP.
           * Tenta outro modelo, mas sem ficar preso
           * repetindo indefinidamente.
           */
          if (!result.response.ok) {
            console.error(
              "Gemini CV parse failed:",
              result.response.status,
              result.text
            );

            break;
          }

          /**
           * Extrai o texto da resposta.
           */
          const raw =
            result.json?.candidates?.[0]?.content?.parts
              ?.map((part) => part.text ?? "")
              .join("") ?? "";

          if (!raw) {
            console.warn(
              "Gemini não devolveu conteúdo:",
              model
            );

            /**
             * Se a resposta foi 200 mas vazia,
             * tenta outro modelo.
             */
            break;
          }

          /**
           * Converte a resposta para JSON.
           */
          const parsed = parseGeminiJson(raw);

          if (!parsed) {
            console.warn(
              "Gemini devolveu JSON inválido:",
              model
            );

            /**
             * Uma segunda tentativa neste mesmo modelo
             * pode resolver uma resposta malformada.
             */
            if (retry < MAX_RETRIES_PER_MODEL) {
              continue;
            }

            break;
          }

          /**
           * Normaliza os campos para garantir compatibilidade
           * com o editor de CV.
           */
          const normalized =
            normalizeCvJson(parsed);

          if (!normalized) {
            console.warn(
              "Gemini JSON incompatível:",
              model
            );

            break;
          }

          console.log(
            "Gemini CV parse concluído com sucesso:",
            model
          );

          return {
            ok: true as const,
            cvJson: JSON.stringify(
              normalized
            ),
          };
        } catch (error) {
          console.error(
            "Gemini request error:",
            model,
            error
          );

          /**
           * Timeout ou erro de rede:
           * tenta o próximo modelo.
           */
          if (
            error instanceof Error &&
            error.name === "AbortError"
          ) {
            console.warn(
              "Gemini timeout:",
              model
            );

            break;
          }

          /**
           * Não deixa uma falha de rede interromper
           * toda a cadeia de fallback.
           */
          break;
        }
      }
    }

    console.error(
      "Todos os modelos Gemini falharam.",
      "Último status:",
      lastStatus
    );

    /**
     * Mensagem limpa para o utilizador.
     * Os detalhes ficam apenas nos logs do Render.
     */
    return {
      ok: false as const,
      error:
        "A IA está temporariamente indisponível. Tente novamente.",
    };
  });
