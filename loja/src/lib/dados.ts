import { cache } from "react";
import { supabasePublico } from "./supabase";
import type { Categoria, ConfigFrete, ConfigHome, ConfigLoja, Produto } from "./tipos";

const CAMPOS = "id,slug,nome,categoria,tom,preco,descricao,detalhes,status,novidade,ordem,estoque,criado_em,produto_imagens(url,alt,ordem)";

function normalizar(p: Produto): Produto {
  return {
    ...p,
    preco: Number(p.preco),
    produto_imagens: [...(p.produto_imagens || [])].sort((a, b) => a.ordem - b.ordem),
    detalhes: Array.isArray(p.detalhes) ? p.detalhes : [],
  };
}

// Disponíveis primeiro, esgotadas no fim; dentro de cada grupo, a ordem definida no painel.
export function ordenarVitrine(lista: Produto[]) {
  return [...lista].sort((a, b) =>
    (a.status === "esgotado" ? 1 : 0) - (b.status === "esgotado" ? 1 : 0) || a.ordem - b.ordem || a.nome.localeCompare(b.nome));
}

export const getProdutos = cache(async (): Promise<Produto[]> => {
  const { data, error } = await supabasePublico().from("produtos").select(CAMPOS).neq("status", "oculto");
  if (error) throw error;
  return ordenarVitrine((data as unknown as Produto[]).map(normalizar));
});

export const getProduto = cache(async (slug: string): Promise<Produto | null> => {
  const { data } = await supabasePublico().from("produtos").select(CAMPOS).eq("slug", slug).neq("status", "oculto").maybeSingle();
  return data ? normalizar(data as unknown as Produto) : null;
});

export const getCategorias = cache(async (): Promise<Categoria[]> => {
  const { data, error } = await supabasePublico().from("categorias").select("*").order("ordem");
  if (error) throw error;
  return data as Categoria[];
});

export const getConfigs = cache(async () => {
  const { data, error } = await supabasePublico().from("configuracoes").select("chave,valor");
  if (error) throw error;
  const m = Object.fromEntries((data || []).map((r) => [r.chave, r.valor]));
  return { loja: m.loja as ConfigLoja, frete: m.frete as ConfigFrete, home: m.home as ConfigHome };
});

export const getMaisVendidas = cache(async (): Promise<string[]> => {
  const { data } = await supabasePublico().rpc("mais_vendidas", { p_limite: 12 });
  return ((data as { produto_id: string }[]) || []).map((r) => r.produto_id);
});
