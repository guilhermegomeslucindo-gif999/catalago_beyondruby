"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { FUNCOES, SUPABASE_KEY } from "@/lib/config";
import { foneBonito, linkWhats, moeda } from "@/lib/formato";
import { usePainel } from "../Acesso";
import { dataCurta, NOME_ENTREGA, NOME_STATUS_CURTO, NOME_STATUS_PEDIDO } from "../comum";
import { IBusca, IFechar, IPedidos, IZap } from "../icones";

type Item = { nome: string; preco: number; quantidade: number };
type PedidoAdm = {
  id: string; numero: number; token: string; status: string; criado_em: string; pago_em: string | null; atualizado_em: string;
  cliente_nome: string; cliente_email: string; cliente_whatsapp: string;
  entrega_tipo: string; entrega_regiao: string | null; endereco: Record<string, string> | null;
  subtotal: number; frete: number; total: number; observacao: string | null; rastreio: string | null;
  cupom: string | null; desconto: number; credito_usado: number;
  ip_capture_method: string | null; ip_parcelas: number | null; ip_receipt_url: string | null; ip_valor_pago: number | null;
  pedido_itens: Item[];
};

const ABAS: [string, string][] = [["pago", "A enviar"], ["aguardando_pagamento", "Aguardando"], ["enviado", "Enviados"], ["entregue", "Entregues"], ["cancelado", "Cancelados"], ["", "Todos"]];

export default function PaginaPedidos() {
  return <Suspense fallback={<div className="pn-carregando"><div className="giro" />Carregando…</div>}><Pedidos /></Suspense>;
}

function Pedidos() {
  const { db, atualizarContadores } = usePainel();
  const q0 = useSearchParams();
  const [todos, setTodos] = useState<PedidoAdm[] | null>(null);
  const [aba, setAba] = useState("pago");
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState<string | null>(q0.get("p"));

  const carregar = useCallback(async () => {
    const { data } = await db.from("pedidos").select("*,pedido_itens(nome,preco,quantidade)").order("criado_em", { ascending: false }).limit(500);
    setTodos((data as PedidoAdm[]) || []);
    atualizarContadores();
  }, [db, atualizarContadores]);
  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    // se abriu um pedido pelo link, mostra a aba dele
    const id = q0.get("p");
    if (id && todos) { const p = todos.find((x) => x.id === id); if (p) setAba(p.status); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos === null]);

  const contagem = useMemo(() => {
    const c: Record<string, number> = { "": todos?.length || 0 };
    (todos || []).forEach((p) => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [todos]);
  const vis = useMemo(() => {
    const t = q.trim().toLowerCase();
    const dig = t.replace(/\D/g, "");
    return (todos || []).filter((p) => (!aba || p.status === aba) &&
      (!t || String(p.numero).includes(t) || p.cliente_nome.toLowerCase().includes(t) || (dig.length >= 4 && p.cliente_whatsapp.includes(dig))));
  }, [todos, aba, q]);
  const pedido = todos?.find((p) => p.id === aberto) || null;
  const qtdPecas = (p: PedidoAdm) => p.pedido_itens.reduce((s, i) => s + i.quantidade, 0);

  return (
    <>
      <div className="pn-cab">
        <div><h1>Pedidos</h1><p>Acompanhe pagamentos, envios e entregas</p></div>
      </div>

      <section className="pn-cartao">
        <div className="pn-filtro-abas" role="group" aria-label="Situação">
          {ABAS.map(([id, nome]) => (
            <button key={id} aria-pressed={aba === id} onClick={() => setAba(id)}>{nome}{todos && <span className="n">{contagem[id] || 0}</span>}</button>
          ))}
        </div>
        <div className="pn-ferramentas">
          <label className="pn-busca"><IBusca /><span className="sr">Buscar</span><input type="search" placeholder="Buscar por nº do pedido, nome ou WhatsApp" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        </div>

        {!todos ? <div className="pn-carregando"><div className="giro" />Carregando…</div> : vis.length === 0 ? (
          <div className="pn-vazio"><IPedidos /><b>{q ? "Nenhum pedido encontrado" : "Nada por aqui"}</b>{q ? "Tente buscar de outro jeito." : aba === "pago" ? "Nenhum pedido pago esperando envio." : "Nenhum pedido nesta situação."}</div>
        ) : (
          <>
            <table className="pn-tabela pn-so-pc">
              <thead><tr><th>Pedido</th><th>Data</th><th>Cliente</th><th>Entrega</th><th>Peças</th><th className="dir">Total</th><th>Situação</th></tr></thead>
              <tbody>
                {vis.map((p) => (
                  <tr key={p.id} onClick={() => setAberto(p.id)} className={aberto === p.id ? "sel" : ""}>
                    <td className="forte">#{p.numero}</td>
                    <td className="fraco num">{dataCurta(p.criado_em)}</td>
                    <td><div className="forte">{p.cliente_nome}</div><div className="fraco">{foneBonito(p.cliente_whatsapp)}</div></td>
                    <td>{NOME_ENTREGA[p.entrega_tipo]}</td>
                    <td className="num">{qtdPecas(p)}</td>
                    <td className="dir num forte">{moeda(p.total)}</td>
                    <td><span className={`pn-st ${p.status}`}>{NOME_STATUS_CURTO[p.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pn-lista-cel pn-so-cel">
              {vis.map((p) => (
                <button key={p.id} onClick={() => setAberto(p.id)} style={{ gridTemplateColumns: "1fr auto" }}>
                  <div><div className="t">#{p.numero} · {p.cliente_nome}</div><div className="s">{dataCurta(p.criado_em)} · {NOME_ENTREGA[p.entrega_tipo]} · {qtdPecas(p)} peça{qtdPecas(p) === 1 ? "" : "s"}</div></div>
                  <div style={{ textAlign: "right" }}><div className="v">{moeda(p.total)}</div><span className={`pn-st ${p.status}`} style={{ marginTop: 4 }}>{NOME_STATUS_CURTO[p.status]}</span></div>
                </button>
              ))}
            </div>
          </>
        )}
      </section>

      <div className={`pn-veu${pedido ? " on" : ""}`} onClick={() => setAberto(null)} aria-hidden />
      <aside className={`pn-gaveta${pedido ? " on" : ""}`} aria-label="Detalhes do pedido" aria-hidden={!pedido}>
        {pedido && <Detalhe p={pedido} onFechar={() => setAberto(null)} onMudou={carregar} />}
      </aside>
    </>
  );
}

function Detalhe({ p, onFechar, onMudou }: { p: PedidoAdm; onFechar: () => void; onMudou: () => void }) {
  const { db } = usePainel();
  const [rastreio, setRastreio] = useState(p.rastreio || "");
  const [msg, setMsg] = useState<{ t: "ok" | "erro" | "info"; m: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => { setRastreio(p.rastreio || ""); setMsg(null); }, [p.id, p.rastreio]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onFechar]);

  const mudar = async (status: string, extra: Record<string, unknown> = {}) => {
    if (status === "cancelado" && !confirm(`Cancelar o pedido #${p.numero}? Isso não estorna o pagamento na InfinitePay.`)) return;
    setOcupado(true);
    const { error } = await db.from("pedidos").update({ status, ...extra }).eq("id", p.id);
    setOcupado(false);
    if (error) setMsg({ t: "erro", m: "Não foi possível salvar." });
    else { setMsg({ t: "ok", m: `Pedido marcado como “${NOME_STATUS_PEDIDO[status].toLowerCase()}”.` }); onMudou(); }
  };
  const conferir = async () => {
    setOcupado(true); setMsg(null);
    const r = await fetch(`${FUNCOES}/confirmar-pedido`, { method: "POST", headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY }, body: JSON.stringify({ pedido: p.id, token: p.token }) });
    const j = await r.json().catch(() => ({}));
    setOcupado(false);
    if (j.status === "pago") { setMsg({ t: "ok", m: "Pagamento confirmado pela InfinitePay!" }); onMudou(); }
    else setMsg({ t: "info", m: "A InfinitePay ainda não confirmou o pagamento deste pedido." });
  };

  const e = p.endereco;
  const primeiro = p.cliente_nome.split(" ")[0];
  const zap = p.cliente_whatsapp.length <= 11 ? "55" + p.cliente_whatsapp : p.cliente_whatsapp;
  const msgZap = p.status === "enviado" && p.rastreio
    ? `Oi, ${primeiro}! Seu pedido nº ${p.numero} da Beyond Ruby foi enviado. Código de rastreio: ${p.rastreio} (acompanhe em rastreamento.correios.com.br).`
    : `Oi, ${primeiro}! Aqui é da Beyond Ruby, sobre o seu pedido nº ${p.numero}.`;
  const correios = p.entrega_tipo === "pac" || p.entrega_tipo === "sedex";
  const pagamento = p.ip_capture_method === "pix" ? "Pix" : p.ip_capture_method === "credit_card" ? `Cartão de crédito${p.ip_parcelas && p.ip_parcelas > 1 ? ` em ${p.ip_parcelas}x` : " à vista"}` : (p.ip_capture_method || "Confirmado");
  const etapas = [
    { nome: "Pedido criado", data: p.criado_em, feito: true },
    { nome: "Pagamento confirmado", data: p.pago_em, feito: !!p.pago_em || ["pago", "enviado", "entregue"].includes(p.status) },
    { nome: correios ? "Enviado" : p.entrega_tipo === "retirada" ? "Pronto para retirada" : "Saiu para entrega", feito: ["enviado", "entregue"].includes(p.status) },
    { nome: p.entrega_tipo === "retirada" ? "Retirado" : "Entregue", feito: p.status === "entregue" },
  ];

  return (
    <>
      <div className="pn-gaveta-topo">
        <div><h2>Pedido #{p.numero}</h2><p>{dataCurta(p.criado_em)} · <span className={`pn-st ${p.status}`}>{NOME_STATUS_CURTO[p.status]}</span></p></div>
        <button className="pn-bt icone fantasma" onClick={onFechar} aria-label="Fechar"><IFechar /></button>
      </div>
      <div className="pn-gaveta-corpo">
        {msg && <p className={`pn-msg ${msg.t}`} style={{ margin: 0 }}>{msg.m}</p>}

        {p.status !== "cancelado" && (
          <section className="pn-cartao pn-cartao-corpo" style={{ display: "grid", gap: 12 }}>
            <ul className="pn-linha-tempo">
              {etapas.map((et) => <li key={et.nome} className={et.feito ? "feito" : ""}><div><b>{et.nome}</b>{et.data && et.feito && <span>{dataCurta(et.data)}</span>}</div></li>)}
            </ul>
            {p.status === "aguardando_pagamento" && <button className="pn-bt primario" disabled={ocupado} onClick={conferir}>Conferir pagamento na InfinitePay</button>}
            {(p.status === "pago" || p.status === "enviado") && correios && (
              <div className="pn-campo">
                <label htmlFor="rastreio">Código de rastreio</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input id="rastreio" value={rastreio} onChange={(ev) => setRastreio(ev.target.value.toUpperCase())} placeholder="Ex.: AB123456789BR" />
                  <button className="pn-bt primario" disabled={ocupado} onClick={() => mudar("enviado", { rastreio: rastreio.trim() || null })}>{p.status === "enviado" ? "Salvar" : "Marcar enviado"}</button>
                </div>
              </div>
            )}
            <div className="pn-acoes">
              {p.status === "pago" && !correios && <button className="pn-bt" disabled={ocupado} onClick={() => mudar("enviado")}>{p.entrega_tipo === "retirada" ? "Pronto para retirada" : "Saiu para entrega"}</button>}
              {(p.status === "pago" || p.status === "enviado") && <button className="pn-bt" disabled={ocupado} onClick={() => mudar("entregue")}>Marcar {p.entrega_tipo === "retirada" ? "retirado" : "entregue"}</button>}
              <a className="pn-bt" href={linkWhats(zap, msgZap)} target="_blank" rel="noopener"><IZap />WhatsApp</a>
            </div>
          </section>
        )}

        <section className="pn-cartao">
          <div className="pn-cartao-cab"><h2>Peças</h2></div>
          <div className="pn-cartao-corpo">
            <div className="pn-linhas">
              {p.pedido_itens.map((i, k) => <div key={k}><span>{i.quantidade}× {i.nome}</span><span className="num">{moeda(i.preco * i.quantidade)}</span></div>)}
              <div><span className="rot">Subtotal</span><span>{moeda(p.subtotal)}</span></div>
              {Number(p.desconto) > 0 && <div><span className="rot">Cupom do Clube ({p.cupom})</span><span style={{ color: "var(--pn-ok)" }}>− {moeda(p.desconto)}</span></div>}
              {Number(p.credito_usado) > 0 && <div><span className="rot">Crédito do Clube</span><span style={{ color: "var(--pn-ok)" }}>− {moeda(p.credito_usado)}</span></div>}
              <div><span className="rot">Frete · {NOME_ENTREGA[p.entrega_tipo]}{p.entrega_regiao && p.entrega_tipo === "uber" ? ` (${p.entrega_regiao})` : ""}</span><span>{Number(p.frete) ? moeda(p.frete) : "Grátis"}</span></div>
              <div className="total"><span>Total</span><span>{moeda(p.total)}</span></div>
            </div>
            {p.observacao && <p className="pn-msg info" style={{ margin: "14px 0 0" }}>“{p.observacao}”</p>}
          </div>
        </section>

        <section className="pn-cartao">
          <div className="pn-cartao-cab"><h2>Cliente</h2></div>
          <div className="pn-cartao-corpo">
            <dl className="pn-dl">
              <div><dt>Nome</dt><dd>{p.cliente_nome}</dd></div>
              <div><dt>WhatsApp</dt><dd><a href={linkWhats(zap, msgZap)} target="_blank" rel="noopener">{foneBonito(p.cliente_whatsapp)}</a></dd></div>
              <div><dt>E-mail</dt><dd style={{ wordBreak: "break-all" }}>{p.cliente_email}</dd></div>
              {e ? <div><dt>Endereço de entrega</dt><dd>{e.rua}, {e.numero}{e.complemento ? ` – ${e.complemento}` : ""}<br />{e.bairro} · {e.cidade}/{e.uf}<br />CEP {e.cep?.replace(/^(\d{5})(\d{3})$/, "$1-$2")}</dd></div>
                : <div><dt>Entrega</dt><dd>Retirada em Vespasiano (combinar pelo WhatsApp)</dd></div>}
            </dl>
          </div>
        </section>

        <section className="pn-cartao">
          <div className="pn-cartao-cab"><h2>Pagamento</h2></div>
          <div className="pn-cartao-corpo">
            <dl className="pn-dl">
              <div><dt>Forma</dt><dd>{p.pago_em ? pagamento : "Ainda não pago"}</dd></div>
              {p.pago_em && <div><dt>Pago em</dt><dd>{dataCurta(p.pago_em)}{p.ip_valor_pago ? ` · ${moeda(p.ip_valor_pago)}` : ""}</dd></div>}
              {p.ip_receipt_url && <div><dt>Comprovante</dt><dd><a href={p.ip_receipt_url} target="_blank" rel="noopener">Abrir comprovante</a></dd></div>}
            </dl>
          </div>
        </section>

        {p.status !== "cancelado" && p.status !== "entregue" && (
          <button className="pn-bt perigo" disabled={ocupado} onClick={() => mudar("cancelado")} style={{ justifySelf: "start" }}>Cancelar pedido</button>
        )}
      </div>
    </>
  );
}
