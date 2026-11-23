"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { foneBonito, linkWhats, moeda } from "@/lib/formato";
import { FUNCOES, SUPABASE_KEY } from "@/lib/config";
import { usePainel } from "../Acesso";

type Item = { nome: string; preco: number; quantidade: number };
type PedidoAdm = {
  id: string; numero: number; token: string; status: string; criado_em: string; pago_em: string | null;
  cliente_nome: string; cliente_email: string; cliente_whatsapp: string;
  entrega_tipo: string; entrega_regiao: string | null; endereco: Record<string, string> | null;
  subtotal: number; frete: number; total: number; observacao: string | null; rastreio: string | null;
  ip_capture_method: string | null; ip_parcelas: number | null; ip_receipt_url: string | null; ip_valor_pago: number | null;
  pedido_itens: Item[];
};

const STATUS: Record<string, string> = { aguardando_pagamento: "Aguardando pagamento", pago: "Pago", enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado" };
const ENTREGA: Record<string, string> = { retirada: "Retirada", uber: "Uber", pac: "Correios PAC", sedex: "Correios SEDEX" };
const FILTROS = [["", "Todos"], ["pago", "Pagos (a enviar)"], ["aguardando_pagamento", "Aguardando"], ["enviado", "Enviados"], ["entregue", "Entregues"], ["cancelado", "Cancelados"]];
const dataHora = (s: string) => new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function Pedidos() {
  const { db } = usePainel();
  const [lista, setLista] = useState<PedidoAdm[] | null>(null);
  const [filtro, setFiltro] = useState("pago");
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    let req = db.from("pedidos").select("*,pedido_itens(nome,preco,quantidade)").order("criado_em", { ascending: false }).limit(300);
    if (filtro) req = req.eq("status", filtro);
    const { data } = await req;
    setLista((data as PedidoAdm[]) || []);
  }, [db, filtro]);
  useEffect(() => { carregar(); }, [carregar]);

  const vis = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (lista || []).filter((p) => !t || String(p.numero).includes(t) || p.cliente_nome.toLowerCase().includes(t) || p.cliente_whatsapp.includes(t.replace(/\D/g, "") || "§"));
  }, [lista, q]);

  return (
    <>
      <div className="pn-cab"><h1>Pedidos</h1></div>
      <div className="pn-filtros">
        {FILTROS.map(([id, nome]) => <button key={id} className="chip" aria-pressed={filtro === id} onClick={() => { setFiltro(id); setAberto(null); }}>{nome}</button>)}
        <input type="search" placeholder="Buscar por nº, nome ou WhatsApp" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {!lista ? <div className="carregando"><div className="giro" />Carregando…</div> : vis.length === 0 ? (
        <div className="pn-cartao" style={{ color: "var(--suave)" }}>Nenhum pedido {filtro ? `com a situação “${STATUS[filtro]}”` : "ainda"}.</div>
      ) : (
        <div className="pn-lista">
          {vis.map((p) => (
            <div key={p.id}>
              <button className="pn-linha" style={{ width: "100%", textAlign: "left", gridTemplateColumns: "1fr auto" }} onClick={() => setAberto(aberto === p.id ? null : p.id)} aria-expanded={aberto === p.id}>
                <div>
                  <div className="nome">Nº {p.numero} · {p.cliente_nome}</div>
                  <div className="meta"><span>{dataHora(p.criado_em)}</span><span>{ENTREGA[p.entrega_tipo]}</span><span>{p.pedido_itens.reduce((s, i) => s + i.quantidade, 0)} peça(s)</span></div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "var(--f-nome)", fontWeight: 500, color: "var(--vinho)" }}>{moeda(p.total)}</div>
                  <span className={`pn-st ${p.status}`}>{STATUS[p.status]}</span>
                </div>
              </button>
              {aberto === p.id && <Detalhe p={p} onMudou={carregar} />}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Detalhe({ p, onMudou }: { p: PedidoAdm; onMudou: () => void }) {
  const { db } = usePainel();
  const [rastreio, setRastreio] = useState(p.rastreio || "");
  const [msg, setMsg] = useState<{ t: "ok" | "erro"; m: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const mudar = async (status: string, extra: Record<string, unknown> = {}) => {
    if (status === "cancelado" && !confirm(`Cancelar o pedido nº ${p.numero}? Isso não estorna o pagamento na InfinitePay.`)) return;
    setOcupado(true);
    const { error } = await db.from("pedidos").update({ status, ...extra }).eq("id", p.id);
    setOcupado(false);
    if (error) setMsg({ t: "erro", m: "Não foi possível salvar." });
    else { setMsg({ t: "ok", m: "Pedido atualizado." }); onMudou(); }
  };
  const conferir = async () => {
    setOcupado(true); setMsg(null);
    const r = await fetch(`${FUNCOES}/confirmar-pedido`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY }, body: JSON.stringify({ pedido: p.id, token: p.token }) });
    const j = await r.json().catch(() => ({}));
    setOcupado(false);
    if (j.status === "pago") { setMsg({ t: "ok", m: "Pagamento confirmado pela InfinitePay!" }); onMudou(); }
    else setMsg({ t: "erro", m: "A InfinitePay ainda não confirmou o pagamento deste pedido." });
  };

  const e = p.endereco;
  const primeiro = p.cliente_nome.split(" ")[0];
  const msgZap = p.status === "enviado" && p.rastreio
    ? `Oi, ${primeiro}! Seu pedido nº ${p.numero} da Beyond Ruby foi enviado. Código de rastreio: ${p.rastreio} (acompanhe em rastreamento.correios.com.br).`
    : `Oi, ${primeiro}! Aqui é da Beyond Ruby, sobre o seu pedido nº ${p.numero}.`;

  return (
    <div className="pn-detalhe" style={{ marginTop: 8, marginBottom: 6 }}>
      <div className="pn-cartao" style={{ margin: 0 }}>
        <h2>Peças</h2>
        {p.pedido_itens.map((i, k) => <div key={k} className="linha-total" style={{ padding: "4px 0", fontSize: 14 }}><span>{i.quantidade}× {i.nome}</span><span>{moeda(i.preco * i.quantidade)}</span></div>)}
        <div className="linha-total" style={{ padding: "4px 0", fontSize: 14, borderTop: "1px solid var(--linha)", marginTop: 6 }}><span>Frete ({ENTREGA[p.entrega_tipo]}{p.entrega_regiao && p.entrega_tipo === "uber" ? ` · ${p.entrega_regiao}` : ""})</span><span>{Number(p.frete) ? moeda(p.frete) : "Grátis"}</span></div>
        <div className="linha-total" style={{ paddingTop: 6 }}><span>Total</span><b>{moeda(p.total)}</b></div>
        {p.observacao && <p style={{ marginTop: 10, fontSize: 13.5, background: "var(--areia)", padding: 10 }}><b>Observação:</b> {p.observacao}</p>}
      </div>
      <div className="pn-cartao" style={{ margin: 0 }}>
        <h2>Cliente e entrega</h2>
        <dl className="pn-dl">
          <div><dt>Nome</dt><dd>{p.cliente_nome}</dd></div>
          <div><dt>WhatsApp</dt><dd><a href={linkWhats(p.cliente_whatsapp.length <= 11 ? "55" + p.cliente_whatsapp : p.cliente_whatsapp, msgZap)} target="_blank" rel="noopener" style={{ color: "var(--vinho)", textDecoration: "underline" }}>{foneBonito(p.cliente_whatsapp)}</a></dd></div>
          <div><dt>E-mail</dt><dd style={{ wordBreak: "break-all" }}>{p.cliente_email}</dd></div>
          {e && <div><dt>Endereço</dt><dd>{e.rua}, {e.numero}{e.complemento ? ` – ${e.complemento}` : ""}<br />{e.bairro} · {e.cidade}/{e.uf} · CEP {e.cep?.replace(/^(\d{5})(\d{3})$/, "$1-$2")}</dd></div>}
          <div><dt>Pagamento</dt><dd>{p.pago_em ? `${p.ip_capture_method === "pix" ? "Pix" : p.ip_capture_method === "credit_card" ? `Cartão${p.ip_parcelas ? ` em ${p.ip_parcelas}x` : ""}` : (p.ip_capture_method || "Confirmado")} · ${dataHora(p.pago_em)}` : "—"}{p.ip_receipt_url && <> · <a href={p.ip_receipt_url} target="_blank" rel="noopener" style={{ textDecoration: "underline" }}>comprovante</a></>}</dd></div>
        </dl>
        {msg && <p className={`pn-msg ${msg.t}`} style={{ marginTop: 12 }}>{msg.m}</p>}
        <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
          {p.status === "aguardando_pagamento" && <button className="pn-bt cheio" disabled={ocupado} onClick={conferir}>Conferir pagamento na InfinitePay</button>}
          {(p.status === "pago" || p.status === "enviado") && (p.entrega_tipo === "pac" || p.entrega_tipo === "sedex") && (
            <div style={{ display: "flex", gap: 6 }}>
              <input value={rastreio} onChange={(ev) => setRastreio(ev.target.value.toUpperCase())} placeholder="Código de rastreio" style={{ flex: 1, minHeight: 38, border: "1px solid var(--linha-2)", padding: "0 10px" }} />
              <button className="pn-bt cheio" disabled={ocupado} onClick={() => mudar("enviado", { rastreio: rastreio.trim() || null })}>Marcar enviado</button>
            </div>
          )}
          <div className="pn-acoes" style={{ justifyContent: "flex-start" }}>
            {p.status === "pago" && p.entrega_tipo !== "pac" && p.entrega_tipo !== "sedex" && <button className="pn-bt" disabled={ocupado} onClick={() => mudar("enviado")}>Saiu para entrega</button>}
            {(p.status === "pago" || p.status === "enviado") && <button className="pn-bt" disabled={ocupado} onClick={() => mudar("entregue")}>Marcar entregue</button>}
            {p.status !== "cancelado" && p.status !== "entregue" && <button className="pn-bt perigo" disabled={ocupado} onClick={() => mudar("cancelado")}>Cancelar pedido</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
