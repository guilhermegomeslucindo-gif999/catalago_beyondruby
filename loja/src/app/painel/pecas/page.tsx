"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { moeda } from "@/lib/formato";
import type { Categoria, Produto, StatusProduto } from "@/lib/tipos";
import { usePainel } from "../Acesso";
import { NOME_STATUS_PECA } from "../comum";
import { IBusca, IMais, IOlho, IPecas } from "../icones";

const ABAS: [string, string][] = [["", "Todas"], ["ativo", "Disponíveis"], ["esgotado", "Esgotadas"], ["oculto", "Ocultas"]];

export default function Pecas() {
  const { db, atualizarSite } = usePainel();
  const router = useRouter();
  const [lista, setLista] = useState<Produto[] | null>(null);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [st, setSt] = useState("");
  const [msg, setMsg] = useState("");

  const carregar = useCallback(async () => {
    const [{ data }, { data: c }] = await Promise.all([
      db.from("produtos").select("*,produto_imagens(url,alt,ordem)").order("ordem").order("nome"),
      db.from("categorias").select("*").order("ordem"),
    ]);
    setLista(((data as Produto[]) || []).map((p) => ({ ...p, preco: Number(p.preco), produto_imagens: [...p.produto_imagens].sort((a, b) => a.ordem - b.ordem) })));
    setCats((c as Categoria[]) || []);
  }, [db]);
  useEffect(() => { carregar(); }, [carregar]);

  const mudarStatus = async (p: Produto, status: StatusProduto) => {
    setLista((l) => l?.map((x) => (x.id === p.id ? { ...x, status } : x)) ?? null);
    const { error } = await db.from("produtos").update({ status }).eq("id", p.id);
    if (error) { setMsg("Não foi possível salvar."); carregar(); return; }
    setMsg(`“${p.nome}” agora está ${NOME_STATUS_PECA[status].toLowerCase()}.`);
    atualizarSite();
  };

  const ordemCat = (s: string) => cats.find((c) => c.slug === s)?.ordem ?? 99;
  const nomeCat = (s: string) => cats.find((c) => c.slug === s)?.nome ?? s;
  const contagem = useMemo(() => {
    const c: Record<string, number> = { "": lista?.length || 0 };
    (lista || []).forEach((p) => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [lista]);
  const vis = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (lista || [])
      .filter((p) => (!cat || p.categoria === cat) && (!st || p.status === st) && (!t || p.nome.toLowerCase().includes(t)))
      .sort((a, b) => ordemCat(a.categoria) - ordemCat(b.categoria) || a.ordem - b.ordem || a.nome.localeCompare(b.nome));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lista, q, cat, st, cats]);

  const Chave = ({ p }: { p: Produto }) => (
    <label className="pn-chave" onClick={(e) => e.stopPropagation()} title={p.status === "oculto" ? "Peça oculta: edite para voltar ao site" : "Disponível para compra"}>
      <input type="checkbox" checked={p.status === "ativo"} disabled={p.status === "oculto"} onChange={(e) => mudarStatus(p, e.target.checked ? "ativo" : "esgotado")} />
      <span />
    </label>
  );
  const Foto = ({ p }: { p: Produto }) => p.produto_imagens[0] ? <img className="pn-thumb" src={p.produto_imagens[0].url} alt="" loading="lazy" /> : <span className="pn-thumb" />;

  return (
    <>
      <div className="pn-cab">
        <div><h1>Peças</h1><p>{lista ? `${contagem.ativo || 0} disponíveis · ${contagem.esgotado || 0} esgotadas${contagem.oculto ? ` · ${contagem.oculto} ocultas` : ""}` : "Catálogo da loja"}</p></div>
        <Link href="/painel/pecas/nova" className="pn-bt primario"><IMais />Nova peça</Link>
      </div>
      {msg && <p className="pn-msg ok">{msg}</p>}

      <section className="pn-cartao">
        <div className="pn-filtro-abas" role="group" aria-label="Situação">
          {ABAS.map(([id, nome]) => <button key={id} aria-pressed={st === id} onClick={() => setSt(id)}>{nome}{lista && <span className="n">{contagem[id] || 0}</span>}</button>)}
        </div>
        <div className="pn-ferramentas">
          <label className="pn-busca"><IBusca /><span className="sr">Buscar</span><input type="search" placeholder="Buscar peça" value={q} onChange={(e) => setQ(e.target.value)} /></label>
          <select className="pn-select" value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoria">
            <option value="">Todas as categorias</option>
            {cats.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}
          </select>
        </div>

        {!lista ? <div className="pn-carregando"><div className="giro" />Carregando…</div> : vis.length === 0 ? (
          <div className="pn-vazio"><IPecas /><b>Nenhuma peça encontrada</b>Tente outro filtro ou cadastre uma peça nova.</div>
        ) : (
          <>
            <table className="pn-tabela pn-so-pc">
              <thead><tr><th style={{ width: 64 }} /><th>Peça</th><th>Categoria</th><th className="dir">Preço</th><th className="dir">Estoque</th><th>Situação</th><th>Disponível</th><th /></tr></thead>
              <tbody>
                {vis.map((p) => (
                  <tr key={p.id} onClick={() => router.push(`/painel/pecas/${p.id}`)}>
                    <td><Foto p={p} /></td>
                    <td><div className="forte">{p.nome}</div>{p.novidade && <div className="fraco">Novidade</div>}</td>
                    <td className="fraco">{nomeCat(p.categoria)}</td>
                    <td className="dir num forte">{moeda(p.preco)}</td>
                    <td className="dir num fraco">{p.estoque ?? "—"}</td>
                    <td><span className={`pn-st ${p.status}`}>{NOME_STATUS_PECA[p.status]}</span></td>
                    <td><Chave p={p} /></td>
                    <td className="dir" onClick={(e) => e.stopPropagation()}>
                      <div className="pn-acoes" style={{ justifyContent: "flex-end", flexWrap: "nowrap" }}>
                        {p.status !== "oculto" && <a className="pn-bt pequeno icone fantasma" href={`/peca/${p.slug}`} target="_blank" rel="noopener" aria-label="Ver na loja" title="Ver na loja"><IOlho /></a>}
                        <Link className="pn-bt pequeno" href={`/painel/pecas/${p.id}`}>Editar</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pn-lista-cel pn-so-cel">
              {vis.map((p) => (
                <div key={p.id} role="link" tabIndex={0} onClick={() => router.push(`/painel/pecas/${p.id}`)} onKeyDown={(e) => e.key === "Enter" && router.push(`/painel/pecas/${p.id}`)} style={{ cursor: "pointer" }}>
                  <Foto p={p} />
                  <div style={{ minWidth: 0 }}>
                    <div className="t">{p.nome}</div>
                    <div className="s">{moeda(p.preco)} · {nomeCat(p.categoria)}</div>
                    <span className={`pn-st ${p.status}`} style={{ marginTop: 6 }}>{NOME_STATUS_PECA[p.status]}</span>
                  </div>
                  <Chave p={p} />
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
