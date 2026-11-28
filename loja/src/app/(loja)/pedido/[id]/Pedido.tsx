"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { IcCheck, IcZap } from "@/components/Icones";
import { apagarCupom, lerCupom } from "@/components/Clube";
import { useSacola } from "@/components/Sacola";
import { InfoRetirada } from "../../finalizar/Finalizar";
import { linkWhats, moeda } from "@/lib/formato";
import type { ConfigFrete } from "@/lib/tipos";
import { FUNCOES, SUPABASE_KEY } from "@/lib/config";

type Dados = {
  numero: number; status: string; primeiro_nome: string; entrega_tipo: string; entrega_regiao: string | null;
  subtotal: number; frete: number; total: number; pagar_url: string | null; comprovante: string | null;
  cupom: string | null; desconto: number; credito_usado: number;
  cashback: { valor: number; status: string; expira_em: string | null } | null;
  presente?: boolean; bilhete?: string | null; bilhete_valor?: number;
  itens: { nome: string; preco: number; quantidade: number }[];
};

const ENTREGA: Record<string, string> = { retirada: "Retirada em Vespasiano", uber: "Entrega via Uber", pac: "Correios PAC", sedex: "Correios SEDEX" };

export function Pedido({ id, whatsapp, frete }: { id: string; whatsapp: string; frete: ConfigFrete }) {
  const q = useSearchParams();
  const { limpar } = useSacola();
  const [d, setD] = useState<Dados | null>(null);
  const [erro, setErro] = useState("");
  const tentativas = useRef(0);

  useEffect(() => {
    let token = q.get("t") || "";
    if (!token) {
      try { const u = JSON.parse(localStorage.getItem("br-ultimo-pedido") || "{}"); if (u.id === id) token = u.token; } catch {}
    }
    let parar = false;
    async function carregar() {
      const r = await fetch(`${FUNCOES}/confirmar-pedido`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
        body: JSON.stringify({
          pedido: id, token,
          transaction_nsu: q.get("transaction_nsu"), slug: q.get("slug") || q.get("invoice_slug"),
          receipt_url: q.get("receipt_url"), capture_method: q.get("capture_method"),
        }),
      }).catch(() => null);
      const j = r ? await r.json().catch(() => null) : null;
      if (parar) return;
      if (!r || !r.ok || !j) { setErro(j?.erro || "Não encontramos este pedido."); return; }
      setD(j);
      if (j.status === "pago" || j.status === "enviado" || j.status === "entregue") {
        limpar();
        try { localStorage.removeItem("br-ultimo-pedido"); } catch {}
        if (j.cupom && lerCupom() === j.cupom) apagarCupom();
      } else if (j.status === "aguardando_pagamento" && tentativas.current < 6 && (q.get("transaction_nsu") || q.get("slug"))) {
        // voltou da InfinitePay: o Pix/cartão pode levar alguns segundos para confirmar
        tentativas.current += 1;
        setTimeout(carregar, 3000);
      }
    }
    carregar();
    return () => { parar = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (erro) return <div className="cont vazio" style={{ padding: "90px 16px" }}><b>Pedido não encontrado</b><p>{erro}</p><Link href="/" className="bt bt-vazado" style={{ marginTop: 18 }}>Voltar à loja</Link></div>;
  if (!d) return <div className="carregando"><div className="giro" />Carregando seu pedido…</div>;

  const pago = ["pago", "enviado", "entregue"].includes(d.status);
  const msg = `Olá, Beyond Ruby! Fiz o pedido nº ${d.numero} pelo site${d.entrega_tipo === "retirada" ? " e quero combinar a retirada" : ""}.`;

  return (
    <div className="cont" style={{ maxWidth: 720, paddingBottom: 72 }}>
      <div className="pedido-ok">
        <div className="selo-ok">{pago ? <IcCheck style={{ width: 30, height: 30 }} /> : <div className="giro" style={{ margin: 0 }} />}</div>
        {pago ? (
          <>
            <h1>Obrigada, {d.primeiro_nome}!</h1>
            <p>Seu pagamento foi confirmado. Pedido <b>nº {d.numero}</b>.</p>
          </>
        ) : d.status === "cancelado" ? (
          <><h1>Pedido cancelado</h1><p>Este pedido foi cancelado. Se precisar, fale com a gente.</p></>
        ) : (
          <>
            <h1>Aguardando pagamento</h1>
            <p>Pedido <b>nº {d.numero}</b>. Assim que o pagamento for aprovado, ele aparece como confirmado aqui.</p>
          </>
        )}
      </div>

      <section className="bloco">
        <h2>Resumo</h2>
        {d.itens.map((i, k) => (
          <div key={k} className="linha-total" style={{ padding: "6px 0" }}><span>{i.quantidade}× {i.nome}</span><span>{moeda(i.preco * i.quantidade)}</span></div>
        ))}
        {Number(d.desconto) > 0 && <div className="linha-total desconto" style={{ padding: "6px 0" }}><span>Cupom do Clube{d.cupom ? ` (${d.cupom})` : ""}</span><span>− {moeda(d.desconto)}</span></div>}
        {Number(d.credito_usado) > 0 && <div className="linha-total desconto" style={{ padding: "6px 0" }}><span>Crédito do Clube</span><span>− {moeda(d.credito_usado)}</span></div>}
        {Number(d.bilhete_valor) > 0 && <div className="linha-total" style={{ padding: "6px 0" }}><span>Bilhete personalizado</span><span>{moeda(d.bilhete_valor!)}</span></div>}
        <div className="linha-total" style={{ padding: "6px 0", borderTop: "1px solid var(--linha)", marginTop: 6 }}><span>{ENTREGA[d.entrega_tipo] || "Entrega"}{d.entrega_regiao && d.entrega_tipo === "uber" ? ` · ${d.entrega_regiao}` : ""}</span><span>{Number(d.frete) ? moeda(d.frete) : "Grátis"}</span></div>
        <div className="linha-total" style={{ paddingTop: 8 }}><span>Total</span><b>{moeda(d.total)}</b></div>
      </section>

      {d.presente && (
        <div className="pedido-presente">
          <span aria-hidden>🎁</span>
          <div><b>É para presente</b>{d.bilhete && <p>Bilhete: “{d.bilhete}”</p>}</div>
        </div>
      )}

      {d.entrega_tipo === "retirada" && d.status !== "cancelado" && <div style={{ marginTop: 14 }}><InfoRetirada frete={frete} pago={pago} /></div>}

      {d.cashback && d.status !== "cancelado" && (
        <p className="cashback-aviso" style={{ marginTop: 14, fontSize: 13.5 }}>
          {d.cashback.status === "previsto"
            ? <>Ao concluir o pagamento, você ganha <b>{moeda(d.cashback.valor)}</b> de crédito do Clube Beyond Ruby.</>
            : d.cashback.status === "disponivel"
              ? <>Seu crédito de <b>{moeda(d.cashback.valor)}</b> do Clube já está disponível{d.cashback.expira_em ? ` até ${new Date(d.cashback.expira_em).toLocaleDateString("pt-BR")}` : ""}. Use na próxima compra com o mesmo e-mail e WhatsApp.</>
              : <>Você ganhou <b>{moeda(d.cashback.valor)}</b> de crédito do Clube Beyond Ruby! Ele é liberado quando o pedido for entregue e vale 90 dias.</>}
        </p>
      )}
      <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
        {!pago && d.pagar_url && <a className="bt bt-cheio bt-largo" href={d.pagar_url}>Ir para o pagamento</a>}
        {pago && d.comprovante && <a className="bt bt-vazado bt-largo" href={d.comprovante} target="_blank" rel="noopener">Ver comprovante</a>}
        <a className="bt bt-vazado bt-largo" href={linkWhats(whatsapp, msg)} target="_blank" rel="noopener"><span className="zap-ic"><IcZap /></span> Falar com a Beyond Ruby</a>
        <Link href="/loja" className="bt bt-vazado bt-largo" style={{ borderColor: "transparent" }}>Continuar comprando</Link>
      </div>
      {pago && (
        <p className="nota" style={{ marginTop: 18 }}>
          {d.entrega_tipo === "retirada" ? `Lembre: a peça fica separada por ${Math.max(1, Number(frete.retirada?.prazo_dias) || 3)} dias.` :
            d.entrega_tipo === "uber" ? "Vamos te chamar no WhatsApp para combinar o horário da entrega." :
              "Você receberá o código de rastreio pelo WhatsApp assim que o pedido for postado."}
        </p>
      )}
    </div>
  );
}
