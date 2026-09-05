import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CV_PRICE_MZN } from "@/lib/constants";

const methodSchema = z.enum(["mpesa", "emola", "mkesh", "card"]);

function normalizeMsisdn(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("258")) return `+${digits}`;
  if (digits.length === 9) return `+258${digits}`;
  return `+${digits}`;
}

function originFromRequest() {
  try {
    const req = getRequest();
    return new URL(req.url).origin;
  } catch {
    return "";
  }
}

/** Estado do acesso ao download do CV do utilizador autenticado. */
export const getCvAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { cvId?: string | null }) => data ?? {})
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("purchases")
      .select("id, status, reference, method, created_at")
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    return { paid: (data?.length ?? 0) > 0, price: CV_PRICE_MZN };
  });

/** Cria uma cobrança NetShop para o download do CV. */
export const startCvPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        cvId: z.string().uuid().nullable().optional(),
        method: methodSchema,
        msisdn: z.string().min(9).max(20).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { createCharge, hasNetshopCredentials } = await import("@/lib/netshop.server");
    if (!hasNetshopCredentials()) {
      return {
        ok: false as const,
        message:
          "Os pagamentos ainda não estão configurados. Falta guardar a chave da API e o Wallet ID da NetShop.",
      };
    }
    if (data.method !== "card" && !data.msisdn) {
      return { ok: false as const, message: "Indique o número de telemóvel da carteira." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const reference = `CV-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 6)
      .toUpperCase()}`;
    const msisdn = data.msisdn ? normalizeMsisdn(data.msisdn) : undefined;

    const { error: insertError } = await supabaseAdmin.from("purchases").insert({
      user_id: context.userId,
      cv_id: data.cvId ?? null,
      reference,
      method: data.method,
      msisdn: msisdn ?? null,
      amount: CV_PRICE_MZN,
      status: "pending",
    });
    if (insertError) throw new Error(insertError.message);

    const origin = originFromRequest();
    let result;
    try {
      result = await createCharge({
        amount: CV_PRICE_MZN,
        method: data.method,
        msisdn,
        reference,
        idempotencyKey: reference,
        customerEmail: (context.claims as { email?: string })?.email,
        returnUrl: origin ? `${origin}/criar-cv?ref=${reference}` : undefined,
        metadata: { reference, product: "cv_download" },
      });
    } catch (err) {
      await supabaseAdmin
        .from("purchases")
        .update({ status: "failed", provider_payload: { error: String(err) } })
        .eq("reference", reference);
      return { ok: false as const, message: "Não foi possível contactar a NetShop. Tente de novo." };
    }

    const charge = result.charge;
    const status = result.ok ? (charge.status ?? "pending") : "failed";

    await supabaseAdmin
      .from("purchases")
      .update({
        charge_id: typeof charge.id === "string" ? charge.id : null,
        status: status === "paid" ? "paid" : status === "failed" ? "failed" : "pending",
        paid_at: status === "paid" ? new Date().toISOString() : null,
        provider_payload: charge as never,
      })
      .eq("reference", reference);

    if (!result.ok) {
      const message =
        (typeof charge["message"] === "string" && charge["message"]) ||
        (typeof charge["error"] === "string" && charge["error"]) ||
        "A NetShop recusou o pagamento. Verifique os dados e tente de novo.";
      return { ok: false as const, message };
    }

    return {
      ok: true as const,
      reference,
      chargeId: typeof charge.id === "string" ? charge.id : null,
      status,
      hostedUrl: charge.checkout?.hosted_url ?? null,
    };
  });

/** Reverifica o estado de uma cobrança na NetShop (fonte de verdade). */
export const checkCvPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ reference: z.string().min(3) }).parse(data))
  .handler(async ({ data, context }) => {
    const { getCharge, hasNetshopCredentials } = await import("@/lib/netshop.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: purchase } = await supabaseAdmin
      .from("purchases")
      .select("*")
      .eq("reference", data.reference)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (!purchase) return { ok: false as const, status: "unknown", message: "Pagamento não encontrado." };
    if (purchase.status === "paid") return { ok: true as const, status: "paid" };
    if (!hasNetshopCredentials()) {
      return { ok: false as const, status: purchase.status, message: "Pagamentos não configurados." };
    }

    const lookup = purchase.charge_id || purchase.reference;
    const result = await getCharge(lookup);
    const charge = result.charge;
    const remoteStatus = charge.status ?? "pending";

    if (remoteStatus === "paid") {
      const amountOk =
        typeof charge.amount !== "number" || Number(charge.amount) >= Number(purchase.amount);
      if (!amountOk) {
        return {
          ok: false as const,
          status: "failed",
          message: "O valor pago não corresponde ao preço. Contacte o suporte.",
        };
      }
      await supabaseAdmin
        .from("purchases")
        .update({
          status: "paid",
          paid_at: new Date().toISOString(),
          charge_id: typeof charge.id === "string" ? charge.id : purchase.charge_id,
          provider_payload: charge as never,
        })
        .eq("reference", purchase.reference)
        .neq("status", "paid");
      return { ok: true as const, status: "paid" };
    }

    if (remoteStatus === "failed") {
      await supabaseAdmin
        .from("purchases")
        .update({ status: "failed", provider_payload: charge as never })
        .eq("reference", purchase.reference)
        .neq("status", "paid");
      return {
        ok: false as const,
        status: "failed",
        message:
          (typeof charge.failed_reason === "string" && charge.failed_reason) ||
          "O pagamento não foi concluído.",
      };
    }

    return { ok: false as const, status: "pending" };
  });
