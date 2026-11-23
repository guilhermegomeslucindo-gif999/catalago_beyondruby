// Página "Pedido confirmado": devolve o resumo do pedido e, se ainda estiver aguardando,
// confere o pagamento direto com a InfinitePay.
import { admin, confirmarPedido, CORS, json } from "../_shared/comum.ts";

const so = (s: unknown) => (typeof s === "string" ? s.trim().slice(0, 200) : null);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "método não permitido" }, 405);
  try {
    const b = await req.json().catch(() => ({}));
    const id = so(b.pedido);
    const token = so(b.token);
    if (!id || !token || !/^[0-9a-f-]{36}$/i.test(id)) return json({ erro: "Pedido não encontrado." }, 404);

    const db = admin();
    const { data: p } = await db.from("pedidos").select("id,token,status").eq("id", id).single();
    if (!p || p.token !== token) return json({ erro: "Pedido não encontrado." }, 404);

    if (p.status === "aguardando_pagamento") {
      await confirmarPedido(db, id, {
        transaction_nsu: so(b.transaction_nsu), slug: so(b.slug),
        receipt_url: so(b.receipt_url), capture_method: so(b.capture_method),
      });
    }

    const { data: v } = await db.from("pedidos")
      .select("numero,status,cliente_nome,entrega_tipo,entrega_regiao,subtotal,frete,total,checkout_url,ip_receipt_url,criado_em,pedido_itens(nome,preco,quantidade)")
      .eq("id", id).single();
    return json({
      numero: v!.numero, status: v!.status, primeiro_nome: v!.cliente_nome.split(" ")[0],
      entrega_tipo: v!.entrega_tipo, entrega_regiao: v!.entrega_regiao,
      subtotal: v!.subtotal, frete: v!.frete, total: v!.total,
      pagar_url: v!.status === "aguardando_pagamento" ? v!.checkout_url : null,
      comprovante: v!.ip_receipt_url, criado_em: v!.criado_em, itens: v!.pedido_itens,
    });
  } catch (e) {
    console.error("confirmar-pedido erro", e);
    return json({ erro: "Não foi possível carregar o pedido." }, 500);
  }
});
