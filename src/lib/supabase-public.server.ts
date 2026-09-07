import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Cliente Supabase para o servidor usando apenas a chave pública.
 * Não depende da service role key.
 */
export function createPublicServerClient() {
  const url = process.env["SUPABASE_URL"] ?? process.env["VITE_SUPABASE_URL"];

  const key =
    process.env["SUPABASE_PUBLISHABLE_KEY"] ??
    process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];

  if (!url || !key) {
    throw new Error("Configuração Supabase em falta (URL / chave pública).");
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

let _publicClient: ReturnType<typeof createPublicServerClient> | undefined;

/**
 * Devolve um cliente público único, reutilizado entre chamadas
 * (usado pela listagem de vagas e outras leituras públicas no servidor).
 */
export function getPublicSupabase() {
  if (!_publicClient) {
    _publicClient = createPublicServerClient();
  }
  return _publicClient;
}
