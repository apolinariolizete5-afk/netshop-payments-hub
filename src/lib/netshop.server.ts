const BASE_URL = "https://www.netshop.co.mz/api/v1";
const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export type NetshopCharge = {
  id?: string;
  status?: "paid" | "pending" | "failed";
  amount?: number;
  currency?: string;
  method?: string;
  reference?: string;
  failed_reason?: string | null;
  checkout?: { hosted_url?: string; type?: string; order_id?: string };
  [key: string]: unknown;
};

function credentials() {
  const apiKey = process.env["NETSHOP_API_KEY"];
  const walletId =
    process.env["NETSHOP_WALLET_ID"] ??
    process.env["NETSHOP_WALLET_ID_1"];

  if (!apiKey || !walletId) {
    throw new Error(
      "Pagamentos indisponíveis: faltam as credenciais NetShop (API Key e Wallet ID).",
    );
  }

  return { apiKey, walletId };
}

function headers(extra?: Record<string, string>) {
  const { apiKey, walletId } = credentials();

  return {
    Authorization: `Bearer ${apiKey}`,
    "X-Wallet-ID": walletId,
    "Content-Type": "application/json",
    ...extra,
  };
}

export function hasNetshopCredentials() {
  return Boolean(
    process.env["NETSHOP_API_KEY"] &&
      (process.env["NETSHOP_WALLET_ID"] ??
        process.env["NETSHOP_WALLET_ID_1"]),
  );
}

async function parse(res: Response): Promise<NetshopCharge> {
  const text = await res.text();

  try {
    return JSON.parse(text) as NetshopCharge;
  } catch {
    return { raw: text } as NetshopCharge;
  }
}

export async function ping(): Promise<{ ok: boolean; body: unknown }> {
  const res = await fetchWithTimeout(`${BASE_URL}/ping`, {
    headers: headers(),
  });

  return { ok: res.ok, body: await parse(res) };
}

export async function createCharge(input: {
  amount: number;
  method: string;
  msisdn?: string | undefined;
  reference: string;
  returnUrl?: string | undefined;
  customerEmail?: string | undefined;
  metadata?: Record<string, unknown> | undefined;
  idempotencyKey: string;
}): Promise<{ ok: boolean; status: number; charge: NetshopCharge }> {
  const body: Record<string, unknown> = {
    amount: input.amount,
    currency: "MZN",
    method: input.method,
    reference: input.reference,
    metadata: input.metadata ?? {},
  };

  if (input.msisdn) body["msisdn"] = input.msisdn;
  if (input.returnUrl) body["return_url"] = input.returnUrl;
  if (input.customerEmail) body["customer_email"] = input.customerEmail;

  const res = await fetchWithTimeout(`${BASE_URL}/charges`, {
    method: "POST",
    headers: headers({ "Idempotency-Key": input.idempotencyKey }),
    body: JSON.stringify(body),
  });

  return {
    ok: res.ok,
    status: res.status,
    charge: await parse(res),
  };
}

export async function getCharge(
  idOrReference: string,
): Promise<{ ok: boolean; status: number; charge: NetshopCharge }> {
  const res = await fetchWithTimeout(
    `${BASE_URL}/charges/${encodeURIComponent(idOrReference)}`,
    {
      headers: headers(),
    },
  );

  return {
    ok: res.ok,
    status: res.status,
    charge: await parse(res),
  };
    }
