import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const NETSHOP_API = "https://www.netshop.co.mz/api/v1";

type PaymentMethod = "mpesa" | "mkesh" | "card";

/**
 * Seleciona o Wallet ID da NetShop.
 *
 * M-Pesa -> NETSHOP_WALLET_ID_1
 * mKesh  -> NETSHOP_WALLET_ID_2
 * Card   -> primeiro Wallet disponível
 */
function getWalletId(
  method: PaymentMethod,
  walletId?: string,
): string {
  const wallet1 =
    process.env["NETSHOP_WALLET_ID_1"]?.trim();

  const wallet2 =
    process.env["NETSHOP_WALLET_ID_2"]?.trim();

  if (
    walletId &&
    (walletId === wallet1 || walletId === wallet2)
  ) {
    return walletId;
  }

  if (method === "mpesa") {
    return wallet1 || "";
  }

  if (method === "mkesh") {
    return wallet2 || "";
  }

  return wallet1 || wallet2 || "";
}

/**
 * Normaliza número moçambicano.
 *
 * Aceita:
 * 841234567
 * +258841234567
 * 258841234567
 * 00258841234567
 *
 * Retorna:
 * 841234567
 */
function normalizeMsisdn(
  raw: string,
): string | null {
  let n = (raw || "").replace(/\D/g, "");

  if (n.startsWith("00")) {
    n = n.slice(2);
  }

  if (n.startsWith("258")) {
    n = n.slice(3);
  }

  if (
    n.length === 9 &&
    n.startsWith("8")
  ) {
    return n;
  }

  return null;
}

/**
 * Prefixos das carteiras móveis.
 */
const METHOD_PREFIXES: Record<
  string,
  string[]
> = {
  mpesa: ["84", "85"],
  mkesh: ["82", "83"],
};

/**
 * Obtém o preço do CV.
 *
 * O preço vem da tabela app_settings,
 * usando a chave cv_price_mzn.
 *
 * Se não existir, usa 150 MZN.
 */
export const getCvPrice = createServerFn({
  method: "GET",
}).handler(async () => {
  const {
    createPublicServerClient,
  } = await import(
    "@/lib/supabase-public.server"
  );

  const supabase =
    createPublicServerClient();

  const { data } =
    await supabase
      .from("app_settings")
      .select("value")
      .eq(
        "key",
        "cv_price_mzn",
      )
      .maybeSingle();

  const price = Number(
    data?.value ?? 150,
  );

  return {
    price:
      Number.isFinite(price) &&
      price > 0
        ? price
        : 150,
  };
});

/**
 * Verifica se o utilizador pode baixar o CV.
 *
 * Existem duas formas de liberar:
 *
 * 1. Conta de teste:
 *    O email da conta deve ser igual ao valor
 *    de CV_TEST_ADMIN_EMAIL configurado no Render.
 *
 * 2. Utilizador normal:
 *    Deve existir uma compra do próprio utilizador
 *    com status "paid".
 */
export const getCvAccess = createServerFn({
  method: "GET",
})
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    /*
     * =====================================================
     * 1. CONTA DE TESTE
     * =====================================================
     */

    const testAdminEmail =
      process.env["CV_TEST_ADMIN_EMAIL"]
        ?.trim()
        .toLowerCase();

    if (testAdminEmail) {
      try {
        /*
         * IMPORTANTE:
         * usamos supabaseAdmin porque auth.admin
         * precisa de privilégios administrativos.
         */
        const {
          supabaseAdmin,
        } = await import(
          "@/integrations/supabase/client.server"
        );

        const {
          data: { user },
          error: userError,
        } =
          await supabaseAdmin.auth.admin.getUserById(
            context.userId,
          );

        if (userError) {
          console.error(
            "Erro ao obter utilizador para teste:",
            userError,
          );
        } else if (user?.email) {
          const loggedUserEmail =
            user.email
              .trim()
              .toLowerCase();

          /*
           * Se o email da conta for exatamente
           * o email definido no Render,
           * libera o download sem pagamento.
           */
          if (
            loggedUserEmail ===
            testAdminEmail
          ) {
            console.log(
              "CV TEST ADMIN autorizado:",
              loggedUserEmail,
            );

            return {
              paid: true,
            };
          }
        }
      } catch (error) {
        console.error(
          "Erro ao verificar CV_TEST_ADMIN_EMAIL:",
          error,
        );
      }
    }

    /*
     * =====================================================
     * 2. UTILIZADOR NORMAL
     * =====================================================
     *
     * Procura uma compra paga pertencente
     * ao utilizador autenticado.
     */

    const {
      data,
      error,
    } = await context.supabase
      .from("cv_purchases")
      .select("id")
      .eq(
        "user_id",
        context.userId,
      )
      .eq(
        "status",
        "paid",
      )
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
      paid:
        (data?.length ?? 0) > 0,
    };
  });

/**
 * Cria um pagamento na NetShop.
 */
export const createCvPayment =
  createServerFn({
    method: "POST",
  })
    .middleware([
      requireSupabaseAuth,
    ])
    .inputValidator(
      (data: {
        returnUrl: string;
        method: PaymentMethod;
        msisdn?: string;
        walletId?: string;
      }) => data,
    )
    .handler(
      async ({
        data,
        context,
      }) => {
        /*
         * =====================================================
         * API KEY
         * =====================================================
         */

        const apiKey =
          process.env[
            "NETSHOP_API_KEY"
          ]?.trim();

        if (!apiKey) {
          return {
            ok: false as const,
            error:
              "Pagamentos não configurados. NETSHOP_API_KEY não encontrada.",
          };
        }

        /*
         * =====================================================
         * WALLET ID
         * =====================================================
         */

        const walletId =
          getWalletId(
            data.method,
            data.walletId,
          );

        if (!walletId) {
          return {
            ok: false as const,
            error:
              "Nenhum Wallet ID da NetShop foi configurado.",
          };
        }

        /*
         * =====================================================
         * URL DE RETORNO
         * =====================================================
         */

        if (!data.returnUrl) {
          return {
            ok: false as const,
            error:
              "URL de retorno inválida.",
          };
        }

        /*
         * =====================================================
         * MÉTODO DE PAGAMENTO
         * =====================================================
         */

        if (
          data.method !== "mpesa" &&
          data.method !== "mkesh" &&
          data.method !== "card"
        ) {
          return {
            ok: false as const,
            error:
              "Método de pagamento inválido.",
          };
        }

        /*
         * =====================================================
         * NÚMERO DE TELEFONE
         * =====================================================
         */

        let msisdn:
          | string
          | null = null;

        if (
          data.method !== "card"
        ) {
          if (!data.msisdn) {
            return {
              ok: false as const,
              error:
                "O número de telefone é obrigatório para este método de pagamento.",
            };
          }

          msisdn =
            normalizeMsisdn(
              data.msisdn,
            );

          if (!msisdn) {
            return {
              ok: false as const,
              error:
                "Número inválido. Use o formato 8XXXXXXXX (9 dígitos).",
            };
          }

          /*
           * Confirma compatibilidade
           * entre número e carteira.
           */

          const allowed =
            METHOD_PREFIXES[
              data.method
            ] ?? [];

          if (
            allowed.length > 0 &&
            !allowed.some(
              (prefix) =>
                msisdn!.startsWith(
                  prefix,
                ),
            )
          ) {
            const errorMessage =
              data.method ===
              "mpesa"
                ? "M-Pesa aceita números 84 ou 85."
                : "mKesh aceita números 82 ou 83.";

            return {
              ok: false as const,
              error:
                `Número não compatível: ${errorMessage}`,
            };
          }
        }

        /*
         * =====================================================
         * PREÇO DO CV
         * =====================================================
         */

        const {
          data: setting,
        } =
          await context.supabase
            .from("app_settings")
            .select("value")
            .eq(
              "key",
              "cv_price_mzn",
            )
            .maybeSingle();

        const amount = Number(
          setting?.value ?? 150,
        );

        if (
          !Number.isFinite(
            amount,
          ) ||
          amount <= 0
        ) {
          return {
            ok: false as const,
            error:
              "Preço do CV inválido.",
          };
        }

        /*
         * =====================================================
         * REFERÊNCIA ÚNICA
         * =====================================================
         */

        const reference =
          `CV-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 8)}`
            .toUpperCase();

        /*
         * =====================================================
         * CRIA COMPRA PENDENTE
         * =====================================================
         */

        const {
          error: purchaseError,
        } =
          await context.supabase
            .from(
              "cv_purchases",
            )
            .insert({
              user_id:
                context.userId,

              reference,

              amount,

              status:
                "pending",

              method:
                data.method,
            });

        if (
          purchaseError
        ) {
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
         * =====================================================
         * DADOS DA COBRANÇA NETSHOP
         * =====================================================
         */

        const chargeBody: Record<
          string,
          unknown
        > = {
          amount,

          currency:
            "MZN",

          method:
            data.method,

          reference,

          description:
            "Download de CV - Moza Empregos",

          return_url:
            data.returnUrl,

          metadata: {
            product:
              "cv_download",

            user_id:
              context.userId,
          },
        };

        /*
         * Adiciona MSISDN para
         * pagamentos móveis.
         */

        if (
          data.method !==
          "card"
        ) {
          chargeBody[
            "msisdn"
          ] =
            data.method ===
            "mkesh"
              ? `+258${msisdn}`
              : msisdn;
        }

        /*
         * =====================================================
         * ENVIA COBRANÇA PARA NETSHOP
         * =====================================================
         */

        try {
          const controller =
            new AbortController();

          const timeout =
            setTimeout(
              () => {
                controller.abort();
              },
              15000,
            );

          let response: Response;

          try {
            response =
              await fetch(
                `${NETSHOP_API}/charges`,
                {
                  method:
                    "POST",

                  headers: {
                    Authorization:
                      `Bearer ${apiKey}`,

                    "X-Wallet-ID":
                      walletId,

                    "Idempotency-Key":
                      reference,

                    "Content-Type":
                      "application/json",

                    Accept:
                      "application/json",
                  },

                  body:
                    JSON.stringify(
                      chargeBody,
                    ),

                  signal:
                    controller.signal,
                },
              );
          } finally {
            clearTimeout(
              timeout,
            );
          }

          /*
           * =====================================================
           * RESPOSTA NETSHOP
           * =====================================================
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
            json =
              responseText
                ? JSON.parse(
                    responseText,
                  )
                : null;
          } catch {
            json = null;
          }

          console.error(
            "NetShop resposta:",
            {
              status:
                response.status,

              statusText:
                response.statusText,

              body:
                json ??
                responseText,
            },
          );

          /*
           * =====================================================
           * PAGAMENTO RECUSADO
           * =====================================================
           */

          if (
            !response.ok
          ) {
            console.error(
              "NetShop recusou a cobrança:",
              {
                httpStatus:
                  response.status,

                statusText:
                  response.statusText,

                response:
                  json ??
                  responseText,

                reference,

                method:
                  data.method,

                msisdn:
                  data.method !==
                  "card"
                    ? msisdn
                    : undefined,
              },
            );

            await context.supabase
              .from(
                "cv_purchases",
              )
              .update({
                status:
                  "failed",
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

          /*
           * =====================================================
           * PAGAMENTO CRIADO
           * =====================================================
           */

          const chargeId =
            json?.id ??
            null;

          const chargeStatus =
            json?.status ??
            "pending";

          /*
           * Guarda o ID da cobrança.
           */

          await context.supabase
            .from(
              "cv_purchases",
            )
            .update({
              provider_id:
                chargeId,

              method:
                data.method,
            })
            .eq(
              "reference",
              reference,
            );

          /*
           * =====================================================
           * DEVOLVE RESULTADO AO FRONTEND
           * =====================================================
           */

          return {
            ok: true as const,

            reference,

            chargeId,

            status:
              chargeStatus,

            checkoutUrl:
              json?.checkout
                ?.hosted_url ??
              null,
          };
        } catch (error) {
          console.error(
            "Erro de comunicação com NetShop:",
            error,
          );

          /*
           * Marca compra como falhada
           * quando não conseguimos comunicar
           * com a NetShop.
           */

          await context.supabase
            .from(
              "cv_purchases",
            )
            .update({
              status:
                "failed",
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
      },
    );
