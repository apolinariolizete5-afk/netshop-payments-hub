import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NETSHOP_API = "https://www.netshop.co.mz/api/v1";

type PaymentMethod = "mpesa" | "emola" | "mkesh" | "card";

function getWalletId(walletId?: string): string {
  const wallet1 = process.env["NETSHOP_WALLET_ID_1"];
  const wallet2 = process.env["NETSHOP_WALLET_ID_2"];

  if (walletId && walletId === wallet1) {
    return wallet1;
  }

  if (walletId && walletId === wallet2) {
    return wallet2;
  }

  // Wallet 1 é o padrão quando nenhum é especificado.
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

const METHOD_PREFIXES: Record<string, string[]> = {
  mpesa: ["84", "85"],
  emola: ["86", "87"],
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
    price: Number.isFinite(price) && price > 0 ? price : 150,
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
      console.error("Erro ao verificar acesso ao CV:", error);

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
 * mpesa
 * emola
 * mkesh
 * card
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
    }) => data
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

    const walletId = getWalletId(data.walletId);

    if (!walletId) {
      return {
        ok: false as const,
        error: "Nenhum Wallet ID da NetShop foi configurado.",
      };
    }

    if (!data.returnUrl) {
      return {
        ok: false as const,
        error: "URL de retorno inválida.",
      };
    }

    let msisdn: string | null = null;

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

      const allowed = METHOD_PREFIXES[data.method] ?? [];

      if (
        allowed.length &&
        !allowed.some((p) => msisdn!.startsWith(p))
      ) {
        return {
          ok: false as const,
          error:
            `Número não compatível: ${
              data.method === "mpesa"
                ? "M-Pesa aceita 84 ou 85"
                : data.method === "emola"
                  ? "e-Mola aceita 86 ou 87"
                  : "mKesh aceita 82 ou 83"
            }.`,
        };
      }
    }

    const { data: setting } = await context.supabase
      .from("app_settings")
      .select("value")
      .eq("key", "cv_price_mzn")
      .maybeSingle();

    const amount = Number(setting?.value ?? 150);

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        ok: false as const,
        error: "Preço do CV inválido.",
      };
    }

    const reference =
      `CV-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        .toUpperCase();

    const { error: purchaseError } = await context.supabase
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
        purchaseError
      );

      return {
        ok: false as const,
        error: "Não foi possível criar o pedido de pagamento.",
      };
    }

    const chargeBody: Record<string, unknown> = {
      amount,
      currency: "MZN",
      method: data.method,
      reference,
      description: "Download de CV - Moza Empregos",
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
      /**
       * Timeout de segurança:
       * evita que a Server Function fique pendurada
       * indefinidamente caso a NetShop não responda.
       */
      const controller = new AbortController();

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
              "Content-Type": "application/json",
              Accept: "application/json",
            },

            body: JSON.stringify(chargeBody),

            signal: controller.signal,
          }
        );
      } finally {
        clearTimeout(timeout);
      }

      const json = (await response
        .json()
        .catch(() => null)) as
        | {
            id?: string;
            status?: string;
            message?: string;
            error?: string;
            checkout?: {
              hosted_url?: string;
            };
          }
        | null;

      if (!response.ok) {
        console.error(
          "NetShop recusou a cobrança:",
          response.status,
          json
        );

        await context.supabase
          .from("cv_purchases")
          .update({
            status: "failed",
          })
          .eq("reference", reference);

        return {
          ok: false as const,
          error:
            json?.message ||
            json?.error ||
            `NetShop recusou o pagamento (${response.status}).`,
        };
      }

      const chargeId = json?.id ?? null;

      const chargeStatus =
        json?.status ?? "pending";

      await context.supabase
        .from("cv_purchases")
        .update({
          provider_id: chargeId,
          method: data.method,
        })
        .eq("reference", reference);

      return {
        ok: true as const,
        reference,
        chargeId,
        status: chargeStatus,
        checkoutUrl:
          json?.checkout?.hosted_url ?? null,
      };
    } catch (error) {
      console.error(
        "Erro de comunicação com NetShop:",
        error
      );

      await context.supabase
        .from("cv_purchases")
        .update({
          status: "failed",
        })
        .eq("reference", reference);

      return {
        ok: false as const,
        error:
          "Não foi possível comunicar com o serviço de pagamentos.",
      };
    }
  });
