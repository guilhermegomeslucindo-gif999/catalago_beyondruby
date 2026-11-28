"use client";

// Favoritas e "vistas recentemente": ficam guardadas no próprio aparelho da cliente.
// As favoritas também são contadas (de forma anônima) para o ranking do painel.
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

const K_FAV = "br-favoritas";
const K_VISTAS = "br-vistas";
const K_VISITANTE = "br-visitante";
export const EVENTO_FAV = "br-favoritas-mudou";
const MAX_VISTAS = 12;

const ler = (k: string): string[] => {
  try { const v = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
};
const gravar = (k: string, v: string[]) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

function visitante() {
  try {
    let v = localStorage.getItem(K_VISITANTE);
    if (!v) { v = crypto.randomUUID(); localStorage.setItem(K_VISITANTE, v); }
    return v;
  } catch { return null; }
}

export const lerFavoritas = () => ler(K_FAV);
export const ehFavorita = (id: string) => ler(K_FAV).includes(id);

export function alternarFavorita(id: string): boolean {
  const lista = ler(K_FAV);
  const ativa = !lista.includes(id);
  gravar(K_FAV, ativa ? [id, ...lista] : lista.filter((x) => x !== id));
  window.dispatchEvent(new Event(EVENTO_FAV));
  const v = visitante();
  if (v) {
    fetch(`${SUPABASE_URL}/rest/v1/rpc/registrar_favorito`, {
      method: "POST", keepalive: true,
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_visitante: v, p_produto: id, p_ativo: ativa }),
    }).catch(() => {});
  }
  return ativa;
}

export const lerVistas = () => ler(K_VISTAS);
export function registrarVista(id: string) {
  gravar(K_VISTAS, [id, ...ler(K_VISTAS).filter((x) => x !== id)].slice(0, MAX_VISTAS));
}
