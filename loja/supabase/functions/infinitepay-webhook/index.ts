// Aviso de pagamento enviado pela InfinitePay.
// O aviso não é assinado: só serve de gatilho. O pedido só vira "pago" depois que
// a própria InfinitePay confirma pelo payment_check (ver confirmarPedido).
import { admin, confirmarPedido, json } from "../_shared/comum.ts";

const so = (s: unknown) => (typeof s === "string" ? s.trim().slice(0, 200) : null);

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const b = await req.json().catch(() => null);
  const id = so(b?.order_nsu);
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return json({ ok: false, erro: "order_nsu inválido" }, 400);
  try {
    const r = await confirmarPedido(admin(), id, {
      transaction_nsu: so(b.transaction_nsu),
      slug: so(b.invoice_slug) ?? so(b.slug),
      receipt_url: so(b.receipt_url),
      capture_method: so(b.capture_method),
    });
    console.log("webhook", id, JSON.stringify(r));
    return json({ ok: true });
  } catch (e) {
    console.error("webhook erro", id, e);
    return json({ ok: false }, 400);
  }
});
