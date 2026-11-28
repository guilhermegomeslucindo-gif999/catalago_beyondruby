"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { moeda } from "@/lib/formato";
import { usePainel } from "./Acesso";
import { dataCurta, NOME_STATUS_CURTO } from "./comum";
import { IAlerta, ICaixa, ICoracao, IDinheiro, IPedidos, ISacola, ITicket } from "./icones";

type Rel = {
  faturamento: number; pedidos: number; ticket_medio: number; pecas_vendidas: number; aguardando: number;
  por_dia: { dia: string; total: number; qtd: number }[];
  mais_vendidas: { produto_id: string; nome: string; qtd: number; total: number }[];
  mais_sacola: { produto_id: string; nome: string; qtd: number }[];
  mais_favoritadas?: { produto_id: string; nome: string; qtd: number }[];
  favoritas_total?: number;
};
type Recente = { id: string; numero: number; cliente_nome: string; total: number; status: string; criado_em: string };

const PERIODOS = [
  { id: "7", nome: "7 dias" }, { id: "30", nome: "30 dias" }, { id: "mes", nome: "Este mês" }, { id: "90", nome: "90 dias" }, { id: "ano", nome: "Este ano" },
];

function intervalo(id: string): [Date, Date] {
  const fim = new Date(); fim.setHours(23, 59, 59, 999);
  const ini = new Date(); ini.setHours(0, 0, 0, 0);
  if (id === "mes") ini.setDate(1);
  else if (id === "ano") ini.setMonth(0, 1);
  else ini.setDate(ini.getDate() - (Number(id) - 1));
  return [ini, new Date(fim.getTime() + 1)];
}
function anterior([ini, fim]: [Date, Date]): [Date, Date] {
  const dur = fim.getTime() - ini.getTime();
  return [new Date(ini.getTime() - dur), ini];
}

export default function Resumo() {
  const { db } = usePainel();
  const [periodo, setPeriodo] = useState("30");
  const [r, setR] = useState<Rel | null>(null);
  const [ant, setAnt] = useState<Rel | null>(null);
  const [fotos, setFotos] = useState<Record<string, string>>({});
  const [recentes, setRecentes] = useState<Recente[]>([]);
  const [aEnviar, setAEnviar] = useState(0);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const atual = intervalo(periodo);
    const prev = anterior(atual);
    setR(null);
    Promise.all([
      db.rpc("relatorio", { p_inicio: atual[0].toISOString(), p_fim: atual[1].toISOString() }),
      db.rpc("relatorio", { p_inicio: prev[0].toISOString(), p_fim: prev[1].toISOString() }),
    ]).then(([a, b]) => {
      if (a.error) return setErro("Não foi possível carregar o relatório.");
      setR(a.data as Rel); setAnt((b.data as Rel) || null);
    });
  }, [db, periodo]);

  useEffect(() => {
    db.from("produtos").select("id,produto_imagens(url,ordem)").then(({ data }) => {
      const m: Record<string, string> = {};
      (data || []).forEach((p: { id: string; produto_imagens: { url: string; ordem: number }[] }) => {
        const f = [...p.produto_imagens].sort((a, b) => a.ordem - b.ordem)[0];
        if (f) m[p.id] = f.url;
      });
      setFotos(m);
    });
    db.from("pedidos").select("id,numero,cliente_nome,total,status,criado_em").neq("status", "cancelado").order("criado_em", { ascending: false }).limit(5)
      .then(({ data }) => setRecentes((data as Recente[]) || []));
    db.from("pedidos").select("id", { count: "exact", head: true }).eq("status", "pago").then(({ count }) => setAEnviar(count || 0));
  }, [db]);

  const dias = (() => {
    if (!r) return [];
    const [ini, fim] = intervalo(periodo);
    const mapa = new Map(r.por_dia.map((d) => [d.dia, d]));
    const out: { dia: string; total: number; qtd: number }[] = [];
    for (let d = new Date(ini); d < fim; d.setDate(d.getDate() + 1)) {
      const k = d.toLocaleDateString("sv-SE");
      out.push(mapa.get(k) ?? { dia: k, total: 0, qtd: 0 });
    }
    return out.length > 92 ? agruparPorMes(out) : out;
  })();
  const max = Math.max(1, ...dias.map((d) => Number(d.total)));
  const nomePeriodo = PERIODOS.find((p) => p.id === periodo)!.nome.toLowerCase();

  return (
    <>
      <div className="pn-cab">
        <div><h1>Resumo</h1><p>Como a loja está indo {periodo === "mes" || periodo === "ano" ? nomePeriodo : `nos últimos ${nomePeriodo}`}</p></div>
        <div className="pn-seg" role="group" aria-label="Período">
          {PERIODOS.map((p) => <button key={p.id} aria-pressed={periodo === p.id} onClick={() => setPeriodo(p.id)}>{p.nome}</button>)}
        </div>
      </div>

      {aEnviar > 0 && (
        <div className="pn-alerta-card"><IAlerta width={18} height={18} />{aEnviar === 1 ? "1 pedido pago aguardando envio" : `${aEnviar} pedidos pagos aguardando envio`}<Link href="/painel/pedidos">Ver pedidos</Link></div>
      )}
      {erro && <p className="pn-msg erro">{erro}</p>}

      {!r ? <div className="pn-carregando"><div className="giro" />Carregando…</div> : (
        <div className="pn-grade">
          <div className="pn-kpis">
            <Kpi rotulo="Faturamento" Ic={IDinheiro} valor={moeda(r.faturamento)} atual={Number(r.faturamento)} antes={ant ? Number(ant.faturamento) : null} />
            <Kpi rotulo="Pedidos pagos" Ic={IPedidos} valor={String(r.pedidos)} atual={r.pedidos} antes={ant?.pedidos ?? null} />
            <Kpi rotulo="Ticket médio" Ic={ITicket} valor={moeda(r.ticket_medio)} atual={Number(r.ticket_medio)} antes={ant ? Number(ant.ticket_medio) : null} />
            <Kpi rotulo="Peças vendidas" Ic={ICaixa} valor={String(r.pecas_vendidas)} atual={Number(r.pecas_vendidas)} antes={ant ? Number(ant.pecas_vendidas) : null} />
          </div>

          <section className="pn-cartao">
            <div className="pn-cartao-cab"><div><h2>Vendas por {dias.length > 0 && dias[0].dia.length === 7 ? "mês" : "dia"}</h2><p>Somente pedidos pagos{r.aguardando ? ` · ${r.aguardando} aguardando pagamento` : ""}</p></div></div>
            <div className="pn-cartao-corpo">
              {r.pedidos === 0 ? (
                <div className="pn-vazio"><IDinheiro /><b>Nenhuma venda paga no período</b>Assim que os pedidos forem pagos, o gráfico aparece aqui.</div>
              ) : (
                <>
                  <div className="pn-grafico" role="img" aria-label="Gráfico de vendas">
                    {dias.map((d) => (
                      <div key={d.dia} className={`col${Number(d.total) ? "" : " zero"}`}>
                        <i style={{ height: `${(Number(d.total) / max) * 100}%` }} />
                        <span className="dica">{fmtDia(d.dia)} · {moeda(d.total)} · {d.qtd} pedido{d.qtd === 1 ? "" : "s"}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pn-eixo"><span>{fmtDia(dias[0]?.dia)}</span><span>{fmtDia(dias[dias.length - 1]?.dia)}</span></div>
                </>
              )}
            </div>
          </section>

          <div className="pn-duas">
            <Ranking titulo="Mais vendidas" sub="Unidades vendidas no período" fotos={fotos} Ic={ICaixa} vazio="Sem vendas no período."
              itens={r.mais_vendidas.map((x) => ({ id: x.produto_id, nome: x.nome, qtd: Number(x.qtd), extra: moeda(x.total) }))} />
            <Ranking titulo="Mais adicionadas à sacola" sub="Interesse das clientes no período" fotos={fotos} Ic={ISacola} vazio="Ninguém adicionou peças à sacola no período."
              itens={r.mais_sacola.map((x) => ({ id: x.produto_id, nome: x.nome, qtd: Number(x.qtd), extra: "adições" }))} />
            <Ranking titulo="Mais favoritadas" sub={`Corações marcados no período${r.favoritas_total ? ` · ${r.favoritas_total} no total` : ""}`} fotos={fotos} Ic={ICoracao} vazio="Ninguém favoritou peças no período."
              itens={(r.mais_favoritadas || []).map((x) => ({ id: x.produto_id, nome: x.nome, qtd: Number(x.qtd), extra: "favoritas" }))} />
          </div>

          <section className="pn-cartao">
            <div className="pn-cartao-cab"><div><h2>Últimos pedidos</h2></div><Link href="/painel/pedidos" className="pn-bt pequeno">Ver todos</Link></div>
            <div className="pn-cartao-corpo" style={{ paddingTop: 8 }}>
              {recentes.length === 0 ? <div className="pn-vazio" style={{ padding: 20 }}>Nenhum pedido ainda.</div> : (
                <div className="pn-lista-cel" style={{ margin: "0 -18px -18px" }}>
                  {recentes.map((p) => (
                    <Link key={p.id} href={`/painel/pedidos?p=${p.id}`} style={{ gridTemplateColumns: "1fr auto" }}>
                      <div><div className="t">#{p.numero} · {p.cliente_nome}</div><div className="s">{dataCurta(p.criado_em)}</div></div>
                      <div style={{ textAlign: "right" }}><div className="v">{moeda(p.total)}</div><span className={`pn-st ${p.status}`} style={{ marginTop: 4 }}>{NOME_STATUS_CURTO[p.status]}</span></div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function Kpi({ rotulo, valor, atual, antes, Ic }: { rotulo: string; valor: string; atual: number; antes: number | null; Ic: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement }) {
  let delta: React.ReactNode = null;
  if (antes !== null) {
    if (antes === 0 && atual === 0) delta = <span className="pn-delta igual">— sem variação</span>;
    else if (antes === 0) delta = <span className="pn-delta sobe">↑ novo</span>;
    else {
      const pct = Math.round(((atual - antes) / antes) * 100);
      delta = <span className={`pn-delta ${pct > 0 ? "sobe" : pct < 0 ? "desce" : "igual"}`}>{pct > 0 ? "↑" : pct < 0 ? "↓" : "="} {Math.abs(pct)}%</span>;
    }
  }
  return (
    <div className="pn-cartao pn-kpi">
      <div className="pn-kpi-topo">{rotulo}<Ic /></div>
      <b>{valor}</b>
      <div>{delta}<small>vs. período anterior</small></div>
    </div>
  );
}

function Ranking({ titulo, sub, itens, vazio, fotos, Ic }: {
  titulo: string; sub: string; vazio: string; fotos: Record<string, string>;
  itens: { id: string; nome: string; qtd: number; extra?: string }[];
  Ic: (p: React.SVGProps<SVGSVGElement>) => React.ReactElement;
}) {
  const max = Math.max(1, ...itens.map((i) => i.qtd));
  return (
    <section className="pn-cartao">
      <div className="pn-cartao-cab"><div><h2>{titulo}</h2><p>{sub}</p></div></div>
      <div className="pn-cartao-corpo">
        {itens.length === 0 ? <div className="pn-vazio" style={{ padding: 20 }}><Ic />{vazio}</div> : (
          <ol className="pn-rank">
            {itens.slice(0, 6).map((i) => (
              <li key={i.id}>
                {fotos[i.id] ? <img src={fotos[i.id]} alt="" loading="lazy" /> : <span className="sem-foto" />}
                <div><div className="nome">{i.nome}</div><div className="barra"><i style={{ width: `${(i.qtd / max) * 100}%` }} /></div></div>
                <div className="val">{i.qtd}<small>{i.extra}</small></div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}

function fmtDia(d?: string) {
  if (!d) return "";
  const [a, m, dia] = d.split("-");
  return dia ? `${dia}/${m}` : `${m}/${a}`;
}
function agruparPorMes(dias: { dia: string; total: number; qtd: number }[]) {
  const m = new Map<string, { dia: string; total: number; qtd: number }>();
  for (const d of dias) {
    const k = d.dia.slice(0, 7);
    const x = m.get(k) ?? { dia: k, total: 0, qtd: 0 };
    x.total += Number(d.total); x.qtd += d.qtd; m.set(k, x);
  }
  return [...m.values()];
}
