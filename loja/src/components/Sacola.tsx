"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { moeda, separarNome } from "@/lib/formato";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";
import { IcFechar, IcSacola } from "./Icones";

export type ItemSacola = { id: string; slug: string; nome: string; tom: string; preco: number; imagem: string | null; qtd: number };

type Ctx = {
  itens: ItemSacola[];
  total: number;
  quantidade: number;
  aberta: boolean;
  abrir: () => void;
  fechar: () => void;
  adicionar: (i: Omit<ItemSacola, "qtd">, qtd?: number) => void;
  alterar: (id: string, qtd: number) => void;
  remover: (id: string) => void;
  limpar: () => void;
  substituir: (itens: ItemSacola[]) => void;
  pronta: boolean;
};

const SacolaCtx = createContext<Ctx | null>(null);
const CHAVE = "br-sacola-v1";
const MAX = 10;

export function useSacola() {
  const c = useContext(SacolaCtx);
  if (!c) throw new Error("useSacola fora do provedor");
  return c;
}

function registrarAdicao(id: string) {
  // alimenta o relatório "mais adicionadas à sacola" (não bloqueia nada se falhar)
  fetch(`${SUPABASE_URL}/rest/v1/rpc/registrar_sacola`, {
    method: "POST",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ p_produto: id }),
    keepalive: true,
  }).catch(() => {});
}

export function SacolaProvider({ children, freteGratisMinimo }: { children: ReactNode; freteGratisMinimo: number }) {
  const [itens, setItens] = useState<ItemSacola[]>([]);
  const [aberta, setAberta] = useState(false);
  const [pronta, setPronta] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(CHAVE);
      if (s) setItens(JSON.parse(s));
    } catch {}
    setPronta(true);
  }, []);
  useEffect(() => {
    if (!pronta) return;
    try { localStorage.setItem(CHAVE, JSON.stringify(itens)); } catch {}
  }, [itens, pronta]);
  useEffect(() => {
    document.body.style.overflow = aberta ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAberta(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [aberta]);

  const adicionar = useCallback((i: Omit<ItemSacola, "qtd">, qtd = 1) => {
    setItens((atual) => {
      const ex = atual.find((x) => x.id === i.id);
      if (ex) return atual.map((x) => (x.id === i.id ? { ...x, ...i, qtd: Math.min(MAX, x.qtd + qtd) } : x));
      return [...atual, { ...i, qtd: Math.min(MAX, qtd) }];
    });
    registrarAdicao(i.id);
    setAberta(true);
  }, []);
  const alterar = useCallback((id: string, qtd: number) => {
    setItens((a) => (qtd <= 0 ? a.filter((x) => x.id !== id) : a.map((x) => (x.id === id ? { ...x, qtd: Math.min(MAX, qtd) } : x))));
  }, []);
  const remover = useCallback((id: string) => setItens((a) => a.filter((x) => x.id !== id)), []);
  const limpar = useCallback(() => setItens([]), []);
  const substituir = useCallback((n: ItemSacola[]) => setItens(n), []);

  const total = itens.reduce((s, i) => s + i.preco * i.qtd, 0);
  const quantidade = itens.reduce((s, i) => s + i.qtd, 0);

  const valor = useMemo<Ctx>(() => ({
    itens, total, quantidade, aberta, pronta,
    abrir: () => setAberta(true), fechar: () => setAberta(false),
    adicionar, alterar, remover, limpar, substituir,
  }), [itens, total, quantidade, aberta, pronta, adicionar, alterar, remover, limpar, substituir]);

  return (
    <SacolaCtx.Provider value={valor}>
      {children}
      <div className={`veu${aberta ? " on" : ""}`} onClick={() => setAberta(false)} aria-hidden />
      <aside className={`gaveta dir${aberta ? " on" : ""}`} aria-label="Sacola" aria-hidden={!aberta} inert={!aberta}>
        <div className="gaveta-topo">
          <h2>Sacola {quantidade > 0 && <small>({quantidade})</small>}</h2>
          <button className="bt-ic" onClick={() => setAberta(false)} aria-label="Fechar sacola"><IcFechar /></button>
        </div>
        {itens.length > 0 && <ProgressoFrete total={total} minimo={freteGratisMinimo} />}
        <div className="gaveta-corpo">
          {itens.length === 0 ? (
            <div className="vazio">
              <IcSacola style={{ width: 34, height: 34, margin: "0 auto 12px", color: "var(--vinho)" }} />
              <b>Sua sacola está vazia</b>
              <p>Que tal conhecer as peças?</p>
              <Link href="/loja" className="bt bt-cheio" style={{ marginTop: 20 }} onClick={() => setAberta(false)}>Ver peças</Link>
            </div>
          ) : (
            itens.map((i) => <LinhaItem key={i.id} item={i} onFechar={() => setAberta(false)} />)
          )}
        </div>
        {itens.length > 0 && (
          <div className="sacola-rodape">
            <div className="linha-total"><span>Subtotal</span><b>{moeda(total)}</b></div>
            <Link href="/finalizar" className="bt bt-cheio bt-largo" onClick={() => setAberta(false)}>Finalizar compra</Link>
            <button className="bt bt-vazado bt-largo" onClick={() => setAberta(false)}>Continuar comprando</button>
            <p className="nota">Frete e prazo calculados na próxima etapa. Pix ou cartão.</p>
          </div>
        )}
      </aside>
    </SacolaCtx.Provider>
  );
}

export function ProgressoFrete({ total, minimo }: { total: number; minimo: number }) {
  if (!minimo) return null;
  const falta = Math.max(0, minimo - total);
  const pct = Math.min(100, (total / minimo) * 100);
  return (
    <div className="prog">
      {falta > 0 ? <>Faltam <b>{moeda(falta)}</b> para ganhar <b>frete grátis</b> (PAC)</> : <><b>Você ganhou frete grátis</b> no PAC!</>}
      <div className="trilha"><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export function LinhaItem({ item, onFechar, compacto }: { item: ItemSacola; onFechar?: () => void; compacto?: boolean }) {
  const { alterar, remover } = useSacola();
  const { titulo, variante } = separarNome(item.nome);
  return (
    <div className="item">
      <Link href={`/peca/${item.slug}`} onClick={onFechar}>
        {item.imagem ? <img src={item.imagem} alt="" width={76} height={95} loading="lazy" /> : <span />}
      </Link>
      <div>
        <Link href={`/peca/${item.slug}`} onClick={onFechar} className="item-nome">{titulo}</Link>
        <div className="item-var">{variante || item.tom}{compacto ? ` · ${item.qtd} un.` : ""}</div>
        {!compacto && (
          <>
            <div className="qtd-sel" role="group" aria-label="Quantidade">
              <button onClick={() => alterar(item.id, item.qtd - 1)} aria-label="Diminuir">−</button>
              <span aria-live="polite">{item.qtd}</span>
              <button onClick={() => alterar(item.id, item.qtd + 1)} aria-label="Aumentar" disabled={item.qtd >= MAX}>+</button>
            </div>
            <button className="remover" onClick={() => remover(item.id)}>Remover</button>
          </>
        )}
      </div>
      <div className="item-preco">{moeda(item.preco * item.qtd)}</div>
    </div>
  );
}
