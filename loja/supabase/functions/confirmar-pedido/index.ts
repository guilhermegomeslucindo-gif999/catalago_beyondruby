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
      .select("numero,status,cliente_nome,entrega_tipo,entrega_regiao,subtotal,frete,total,cupom,desconto,credito_usado,checkout_url,ip_receipt_url,criado_em,presente,bilhete,bilhete_valor,pedido_itens(nome,preco,quantidade)")
      .eq("id", id).single();
    // cashback que este pedido gerou (ou vai gerar, se ainda não foi pago)
    const { data: crs } = await db.from("creditos").select("valor,status,expira_em").eq("pedido_origem", id).neq("status", "cancelado");
    let cashback: { valor: number; status: string; expira_em: string | null } | null = crs && crs.length
      ? { valor: crs.reduce((s, c) => s + Number(c.valor), 0), status: crs.some((c) => c.status === "pendente") ? "pendente" : "disponivel", expira_em: crs[0].expira_em }
      : null;
    if (!cashback && v!.status === "aguardando_pagamento" && !v!.cupom) {
      const { data: cc } = await db.from("configuracoes").select("valor").eq("chave", "clube").single();
      const pct = cc?.valor?.ativo ? Number(cc.valor.cashback_pct ?? 0) : 0;
      const val = Math.round((Number(v!.subtotal) - Number(v!.desconto) - Number(v!.credito_usado)) * pct) / 100;
      if (val > 0) cashback = { valor: val, status: "previsto", expira_em: null };
    }
    return json({
      numero: v!.numero, status: v!.status, primeiro_nome: v!.cliente_nome.split(" ")[0],
      entrega_tipo: v!.entrega_tipo, entrega_regiao: v!.entrega_regiao,
      subtotal: v!.subtotal, frete: v!.frete, total: v!.total,
      cupom: v!.cupom, desconto: v!.desconto, credito_usado: v!.credito_usado, cashback,
      presente: v!.presente, bilhete: v!.bilhete, bilhete_valor: v!.bilhete_valor,
      pagar_url: v!.status === "aguardando_pagamento" ? v!.checkout_url : null,
      comprovante: v!.ip_receipt_url, criado_em: v!.criado_em, itens: v!.pedido_itens,
    });
  } catch (e) {
    console.error("confirmar-pedido erro", e);
    return json({ erro: "Não foi possível carregar o pedido." }, 500);
  }
});
