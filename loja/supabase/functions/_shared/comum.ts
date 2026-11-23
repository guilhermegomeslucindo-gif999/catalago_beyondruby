// Código compartilhado pelas funções da loja (checkout, confirmação e aviso da InfinitePay).
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.49.4";

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

export function admin(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
}

export const IP_API = "https://api.checkout.infinitepay.io";

export async function handleInfinitePay(db: SupabaseClient): Promise<string> {
  const { data } = await db.from("configuracoes").select("valor").eq("chave", "loja").single();
  const h = (data?.valor?.infinitepay_handle ?? "").toString().replace(/^\$/, "").trim();
  if (!h) throw new Error("InfiniteTag não configurada");
  return h;
}

type Checagem = { paid: boolean; amount?: number; paid_amount?: number; installments?: number; capture_method?: string };

// Consulta a InfinitePay para saber se o pedido foi pago de verdade.
// O aviso (webhook) da InfinitePay não é assinado, então nunca confiamos só nele.
export async function checarPagamento(
  handle: string, pedidoId: string, transactionNsu?: string | null, slug?: string | null,
): Promise<Checagem | null> {
  const corpo: Record<string, string> = { handle, order_nsu: pedidoId };
  if (transactionNsu) corpo.transaction_nsu = transactionNsu;
  if (slug) corpo.slug = slug;
  const r = await fetch(`${IP_API}/payment_check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  });
  if (!r.ok) return null;
  const d = await r.json().catch(() => null);
  if (!d || d.success === false) return null;
  return d as Checagem;
}

// Confirma o pagamento de um pedido: consulta a InfinitePay e, se pago com o valor certo,
// marca o pedido como pago (uma única vez) e baixa o estoque.
export async function confirmarPedido(
  db: SupabaseClient, pedidoId: string,
  extra: { transaction_nsu?: string | null; slug?: string | null; receipt_url?: string | null; capture_method?: string | null },
): Promise<{ pago: boolean; motivo?: string }> {
  const { data: pedido } = await db.from("pedidos")
    .select("id,total,status,ip_transaction_nsu,ip_slug").eq("id", pedidoId).single();
  if (!pedido) return { pago: false, motivo: "pedido não encontrado" };
  if (pedido.status !== "aguardando_pagamento") return { pago: pedido.status !== "cancelado" };

  const handle = await handleInfinitePay(db);
  const tnsu = extra.transaction_nsu ?? pedido.ip_transaction_nsu;
  const slug = extra.slug ?? pedido.ip_slug;
  const c = await checarPagamento(handle, pedido.id, tnsu, slug);
  if (!c || c.paid !== true) return { pago: false, motivo: "pagamento não confirmado" };

  const centavos = Math.round(Number(pedido.total) * 100);
  const valor = typeof c.amount === "number" ? c.amount : (typeof c.paid_amount === "number" ? c.paid_amount : null);
  if (valor !== null && valor < centavos) return { pago: false, motivo: "valor pago menor que o total" };

  const { error } = await db.rpc("confirmar_pagamento", {
    p_pedido: pedido.id,
    p_slug: slug ?? null,
    p_transaction_nsu: tnsu ?? null,
    p_capture_method: c.capture_method ?? extra.capture_method ?? null,
    p_receipt_url: extra.receipt_url ?? null,
    p_valor_pago: typeof c.paid_amount === "number" ? c.paid_amount / 100 : null,
    p_parcelas: typeof c.installments === "number" ? c.installments : null,
  });
  if (error) return { pago: false, motivo: error.message };
  return { pago: true };
}
