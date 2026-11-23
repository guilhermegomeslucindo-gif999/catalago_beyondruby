import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { SUPABASE_KEY, SUPABASE_URL } from "./config";
export { FUNCOES, SUPABASE_KEY, SUPABASE_URL } from "./config";

// Cliente para leitura pública no servidor (sem sessão).
export function supabasePublico(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Cliente do navegador (usado no painel, com login).
let navegador: SupabaseClient | null = null;
export function supabaseNavegador(): SupabaseClient {
  if (!navegador) {
    navegador = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: "br-painel" },
    });
  }
  return navegador;
}
