// Endereço e chave PÚBLICOS do projeto (feitos para ficar no navegador).
// Toda a proteção dos dados fica nas regras de segurança (RLS) do banco.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ebefttkxllmtyeysadzc.supabase.co";
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || "sb_publishable_eSgM3vzTu-CeN5z5vicvKw_TPSV8Bts";
export const FUNCOES = `${SUPABASE_URL}/functions/v1`;
