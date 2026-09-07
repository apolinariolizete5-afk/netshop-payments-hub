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

const REQUEST_TIMEOUT = 45000;

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

async function getAvailableModels(apiKey: string) {
  const response = await fetchWithTimeout(
    "https://generativelanguage.googleapis.com/v1beta/models",
    {
      method: "GET",
      headers: {
        "x-goog-api-key": apiKey,
      },
    },
    10000
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
        model.supportedGenerationMethods?.includes("generateContent")
      )
      .map((model) => model.name ?? "")
      .filter(Boolean);
  } catch {
    return [];
  }
}

function chooseModel(models: string[]) {
  /*
   * Prefer modelos Flash rápidos.
   * A ordem não é fixa: primeiro procuramos modelos
   * mais recentes que estejam efectivamente disponíveis
   * para esta API key.
   */

  const preferred = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ];

  for (const preferredModel of preferred) {
    const found = models.find((model) =>
      model.includes(preferredModel)
    );

    if (found) {
      return found;
    }
  }

  /*
   * Se nenhum modelo conhecido for encontrado,
   * procura qualquer modelo Flash que suporte
   * generateContent.
   */
  const flashModel = models.find((model) =>
    model.toLowerCase().includes("flash")
  );

  return flashModel ?? null;
}

async function callGemini(
  apiKey: string,
  modelName: string,
  parts: Array<Record<string, unknown>>
) {
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
    // Resposta não JSON
  }

  return {
    response,
    text,
    json,
  };
}

export const parseCvFile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: ParseInput) => {
    if (!data || typeof data.base64 !== "string" || !data.base64) {
      throw new Error("Ficheiro inválido.");
    }

    return data;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env["GEMINI_API_KEY"];

    if (!apiKey) {
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

    const instruction =
      "Analisa este currículo e devolve APENAS JSON válido. " +
      "Não escrevas explicações, Markdown ou texto fora do JSON. " +
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
      "Se uma informação não existir no currículo, deixa o campo vazio. " +
      "Não inventes informações.";

    const parts: Array<Record<string, unknown>> = [
      {
        text: instruction,
      },
    ];

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

    /*
     * 1. Descobre os modelos realmente disponíveis
     * para ESTA API KEY.
     */
    const availableModels = await getAvailableModels(apiKey);

    console.log(
      "Gemini models disponíveis:",
      availableModels
    );

    if (availableModels.length === 0) {
      return {
        ok: false as const,
        error:
          "Não foi possível obter os modelos disponíveis da Gemini.",
      };
    }

    /*
     * 2. Escolhe automaticamente um modelo compatível.
     */
    const selectedModel = chooseModel(availableModels);

    if (!selectedModel) {
      return {
        ok: false as const,
        error:
          "A sua Gemini API Key não possui um modelo compatível para este recurso.",
      };
    }

    console.log(
      "Gemini modelo seleccionado:",
      selectedModel
    );

    try {
      /*
       * 3. Apenas UMA chamada.
       *
       * Não fazemos três retries de 45 segundos.
       * Assim o utilizador nunca fica preso durante minutos.
       */
      const result = await callGemini(
        apiKey,
        selectedModel,
        parts
      );

      console.log(
        "Gemini status:",
        result.response.status
      );

      if (!result.response.ok) {
        console.error(
          "Gemini CV parse failed:",
          result.response.status,
          result.text
        );

        if (
          result.response.status === 401 ||
          result.response.status === 403
        ) {
          return {
            ok: false as const,
            error:
              "A chave da Gemini API é inválida ou não está autorizada.",
          };
        }

        if (result.response.status === 429) {
          return {
            ok: false as const,
            error:
              "A Gemini está temporariamente com limite de pedidos. Tente novamente mais tarde.",
          };
        }

        if (result.response.status === 503) {
          return {
            ok: false as const,
            error:
              "A Gemini está temporariamente ocupada. Tente novamente daqui a pouco.",
          };
        }

        if (result.response.status === 400) {
          return {
            ok: false as const,
            error:
              "A Gemini não conseguiu processar este ficheiro. Tente outro PDF ou uma fotografia mais nítida.",
          };
        }

        return {
          ok: false as const,
          error:
            "A Gemini não conseguiu processar o CV neste momento.",
        };
      }

      const raw =
        result.json?.candidates?.[0]?.content?.parts
          ?.map((part) => part.text ?? "")
          .join("") ?? "";

      if (!raw) {
        return {
          ok: false as const,
          error:
            "A IA não devolveu os dados do currículo.",
        };
      }

      const cleaned = raw
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();

      /*
       * Tenta interpretar a resposta directamente.
       */
      try {
        const parsed = JSON.parse(cleaned);

        return {
          ok: true as const,
          cvJson: JSON.stringify(parsed),
        };
      } catch {
        /*
         * Fallback para encontrar o JSON dentro da resposta.
         */
        const match = cleaned.match(/\{[\s\S]*\}/);

        if (!match) {
          return {
            ok: false as const,
            error:
              "A IA respondeu, mas não foi possível interpretar os dados do CV.",
          };
        }

        try {
          const parsed = JSON.parse(match[0]);

          return {
            ok: true as const,
            cvJson: JSON.stringify(parsed),
          };
        } catch {
          return {
            ok: false as const,
            error:
              "A IA respondeu com dados inválidos. Tente novamente.",
          };
        }
      }
    } catch (error) {
      console.error("Gemini request error:", error);

      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        return {
          ok: false as const,
          error:
            "A IA demorou demasiado a responder. Tente novamente.",
        };
      }

      return {
        ok: false as const,
        error:
          "Não foi possível contactar a Gemini. Tente novamente.",
      };
    }
  });
