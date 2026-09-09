import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NETSHOP_API = "https://www.netshop.co.mz/api/v1";

type PaymentMethod = "mpesa" | "mkesh" | "card";

function getWalletId(
  method: PaymentMethod,
  walletId?: string,
): string {
  const wallet1 = process.env["NETSHOP_WALLET_ID_1"];
  const wallet2 = process.env["NETSHOP_WALLET_ID_2"];

  // Permite um Wallet ID explicitamente fornecido apenas
  // se ele corresponder a um dos wallets configurados.
  if (walletId && (walletId === wallet1 || walletId === wallet2)) {
    return walletId;
  }

  // Cada método usa o Wallet ID correspondente.
  if (method === "mpesa") {
    return wallet1 || "";
  }

  if (method === "mkesh") {
    return wallet2 || "";
  }

  // Card: usa o primeiro wallet configurado.
  return wallet1 || wallet2 || "";
}

/**
 * Normaliza o número moçambicano para o formato 8XXXXXXXX.
 */
function normalizeMsisdn(raw: string): string | null {
  let n = (raw || "").replace(/\D/g, "");

  if (n.startsWith("00")) {
    n = n.slice(2);
  }

  if (n.startsWith("258")) {
    n = n.slice(3);
  }

  if (n.length === 9 && n.startsWith("8")) {
    return n;
  }

  return null;
}

/**
 * Métodos móveis disponíveis na conta NetShop.
 *
 * M-Pesa: 84 / 85
 * mKesh: 82 / 83
 */
const METHOD_PREFIXES: Record<string, string[]> = {
  mpesa: ["84", "85"],
  mkesh: ["82", "83"],
};

/**
 * Preço do download do CV em MZN.
 */
export const getCvPrice = createServerFn({
  method: "GET",
}).handler(async () => {
  const { createPublicServerClient } = await import(
    "@/lib/supabase-public.server"
  );

  const supabase = createPublicServerClient();

  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "cv_price_mzn")
    .maybeSingle();

  const price = Number(data?.value ?? 150);

  return {
    price:
      Number.isFinite(price) && price > 0
        ? price
        : 150,
  };
});

/**
 * Verifica se o utilizador atual possui uma compra paga.
 */
export const getCvAccess = createServerFn({
  method: "GET",
})
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("cv_purchases")
      .select("id")
      .eq("user_id", context.userId)
      .eq("status", "paid")
      .limit(1);

    if (error) {
      console.error(
        "Erro ao verificar acesso ao CV:",
        error,
      );

      return {
        paid: false,
      };
    }

    return {
      paid: (data?.length ?? 0) > 0,
    };
  });

/**
 * Cria uma cobrança através da NetShop.
 *
 * Métodos suportados:
 * - mpesa
 * - mkesh
 * - card
 */
export const createCvPayment = createServerFn({
  method: "POST",
})
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      returnUrl: string;
      method: PaymentMethod;
      msisdn?: string;
      walletId?: string;
    }) => data,
  )
  .handler(async ({ data, context }) => {
    const apiKey = process.env["NETSHOP_API_KEY"];

    if (!apiKey) {
      return {
        ok: false as const,
        error:
          "Pagamentos não configurados. NETSHOP_API_KEY não encontrada.",
      };
    }

    const walletId = getWalletId(data.method, data.walletId);

    if (!walletId) {
      return {
        ok: false as const,
        error:
          "Nenhum Wallet ID da NetShop foi configurado.",
      };
    }

    if (!data.returnUrl) {
      return {
        ok: false as const,
        error: "URL de retorno inválida.",
      };
    }

    let msisdn: string | null = null;

    /*
     * Pagamentos móveis precisam de um número.
     */
    if (data.method !== "card") {
      if (!data.msisdn) {
        return {
          ok: false as const,
          error:
            "O número de telefone é obrigatório para este método de pagamento.",
        };
      }

      msisdn = normalizeMsisdn(data.msisdn);

      if (!msisdn) {
        return {
          ok: false as const,
          error:
            "Número inválido. Use o formato 8XXXXXXXX (9 dígitos).",
        };
      }

      /*
       * Verifica se o prefixo corresponde ao método escolhido.
       */
      const allowed =
        METHOD_PREFIXES[data.method] ?? [];

      if (
        allowed.length > 0 &&
        !allowed.some((prefix) =>
          msisdn!.startsWith(prefix),
        )
      ) {
        const errorMessage =
          data.method === "mpesa"
            ? "M-Pesa aceita números 84 ou 85."
            : "mKesh aceita números 82 ou 83.";

        return {
          ok: false as const,
          error: `Número não compatível: ${errorMessage}`,
        };
      }
    }

    /*
     * Obtém o preço configurado.
     */
    const { data: setting } =
      await context.supabase
        .from("app_settings")
        .select("value")
        .eq("key", "cv_price_mzn")
        .maybeSingle();

    const amount = Number(
      setting?.value ?? 150,
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return {
        ok: false as const,
        error: "Preço do CV inválido.",
      };
    }

    /*
     * Cria uma referência única para o pagamento.
     */
    const reference =
      `CV-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`
        .toUpperCase();

    /*
     * Regista a compra como pendente.
     */
    const { error: purchaseError } =
      await context.supabase
        .from("cv_purchases")
        .insert({
          user_id: context.userId,
          reference,
          amount,
          status: "pending",
          method: data.method,
        });

    if (purchaseError) {
      console.error(
        "Erro ao criar compra:",
        purchaseError,
      );

      return {
        ok: false as const,
        error:
          "Não foi possível criar o pedido de pagamento.",
      };
    }

    /*
     * Corpo enviado para a NetShop.
     */
    const chargeBody: Record<string, unknown> = {
      amount,
      currency: "MZN",
      method: data.method,
      reference,
      description:
        "Download de CV - Moza Empregos",
      return_url: data.returnUrl,
      metadata: {
        product: "cv_download",
        user_id: context.userId,
      },
    };

    if (data.method !== "card") {
      chargeBody["msisdn"] = msisdn;
    }

    try {
      /*
       * Timeout de segurança:
       * evita que a Server Function fique pendurada
       * indefinidamente caso a NetShop não responda.
       */
      const controller =
        new AbortController();

      const timeout = setTimeout(() => {
        controller.abort();
      }, 15000);

      let response: Response;

      try {
        response = await fetch(
          `${NETSHOP_API}/charges`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "X-Wallet-ID": walletId,
              "Idempotency-Key": reference,
              "Content-Type":
                "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(
              chargeBody,
            ),
            signal: controller.signal,
          },
        );
      } finally {
        clearTimeout(timeout);
      }

      /*
       * Lê a resposta da NetShop com segurança.
       *
       * Guardamos tanto o JSON como texto bruto,
       * porque alguns erros podem não vir em JSON.
       */
      const responseText =
        await response.text();

      let json:
        | {
            id?: string;
            status?: string;
            amount?: number;
            currency?: string;
            method?: string;
            fee?: number;
            net?: number;
            reference?: string;
            message?: string;
            error?: string;
            code?: string;
            reason?: string;
            details?: unknown;
            provider?: unknown;
            checkout?: {
              hosted_url?: string;
            };
          }
        | null = null;

      try {
        json = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        json = null;
      }

      /*
       * Log detalhado da resposta da NetShop.
       *
       * NÃO imprimimos API key nem Wallet ID.
       */
      console.error(
        "NetShop resposta:",
        {
          status: response.status,
          statusText: response.statusText,
          body: json ?? responseText,
        },
      );

      /*
       * NetShop recusou a cobrança.
       */
      if (!response.ok) {
        console.error(
          "NetShop recusou a cobrança:",
          {
            httpStatus: response.status,
            statusText: response.statusText,
            response: json ?? responseText,
            reference,
            method: data.method,
            msisdn:
              data.method !== "card"
                ? msisdn
                : undefined,
          },
        );

        await context.supabase
          .from("cv_purchases")
          .update({
            status: "failed",
          })
          .eq(
            "reference",
            reference,
          );

        const detailedError =
          json?.message ||
          json?.error ||
          json?.reason ||
          json?.code;

        return {
          ok: false as const,
          error:
            detailedError ||
            `NetShop recusou o pagamento (${response.status}).`,
        };
      }

      const chargeId =
        json?.id ?? null;

      const chargeStatus =
        json?.status ?? "pending";

      /*
       * Guarda o ID da cobrança da NetShop.
       */
      await context.supabase
        .from("cv_purchases")
        .update({
          provider_id: chargeId,
          method: data.method,
        })
        .eq(
          "reference",
          reference,
        );

      return {
        ok: true as const,
        reference,
        chargeId,
        status: chargeStatus,
        checkoutUrl:
          json?.checkout?.hosted_url ??
          null,
      };
    } catch (error) {
      console.error(
        "Erro de comunicação com NetShop:",
        error,
      );

      await context.supabase
        .from("cv_purchases")
        .update({
          status: "failed",
        })
        .eq(
          "reference",
          reference,
        );

      return {
        ok: false as const,
        error:
          "Não foi possível comunicar com o serviço de pagamentos.",
      };
    }
  });
