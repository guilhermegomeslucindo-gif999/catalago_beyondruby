"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";
import { moeda } from "@/lib/formato";
import type { ConfigClube } from "@/lib/tipos";
import { Coroa, IcCheck, IcFechar } from "./Icones";

// ---------- memória do aparelho ----------
const K_CUPOM = "br-cupom";
const K_MEMBRO = "br-clube-membro";
const K_FECHADO = "br-clube-fechado";
const SETE_DIAS = 7 * 24 * 3600 * 1000;
const ler = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const gravar = (k: string, v: string | null) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch {} };
export const lerCupom = () => ler(K_CUPOM);
export const apagarCupom = () => gravar(K_CUPOM, null);
export const ehMembro = () => ler(K_MEMBRO) === "1";
export const abrirClube = () => window.dispatchEvent(new Event("br-abrir-clube"));

const NAO_MOSTRAR = ["/finalizar", "/pedido", "/clube", "/painel"];

const mascaraFone = (v: string) => {
  let d = v.replace(/\D/g, "").slice(0, 13);
  if (d.length > 11 && d.startsWith("55")) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`;
};

export function JanelaClube({ cfg, imagem }: { cfg: ConfigClube; imagem?: string }) {
  const caminho = usePathname();
  const [aberta, setAberta] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [zap, setZap] = useState("");
  const [aceita, setAceita] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [codigo, setCodigo] = useState<string | null>(null);
  const [jaCliente, setJaCliente] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const campo = useRef<HTMLInputElement>(null);

  const podeMostrarSozinha = useCallback(() => {
    if (!cfg.ativo || ehMembro()) return false;
    if (NAO_MOSTRAR.some((c) => window.location.pathname.startsWith(c))) return false;
    const f = Number(ler(K_FECHADO) || 0);
    return !f || Date.now() - f > SETE_DIAS;
  }, [cfg.ativo]);

  // abre sozinha depois de alguns segundos (uma vez por visita)
  useEffect(() => {
    if (!cfg.ativo) return;
    const t = setTimeout(() => { if (podeMostrarSozinha()) setAberta(true); }, (cfg.atraso_segundos || 15) * 1000);
    // no computador, também quando o mouse sai pela parte de cima (indo fechar a aba)
    const sair = (e: MouseEvent) => {
      if (e.clientY <= 0 && !e.relatedTarget && window.innerWidth >= 900 && podeMostrarSozinha() && !sessionStorage.getItem("br-clube-saida")) {
        sessionStorage.setItem("br-clube-saida", "1");
        setAberta(true);
      }
    };
    document.addEventListener("mouseout", sair);
    return () => { clearTimeout(t); document.removeEventListener("mouseout", sair); };
  }, [cfg.ativo, cfg.atraso_segundos, podeMostrarSozinha]);

  // abrir por botão (rodapé, sacola, página do clube)
  useEffect(() => {
    const abrir = () => {
      const c = lerCupom();
      if (ehMembro() && c) { setCodigo(c); }
      setAberta(true);
    };
    window.addEventListener("br-abrir-clube", abrir);
    return () => window.removeEventListener("br-abrir-clube", abrir);
  }, []);

  useEffect(() => { setAberta((a) => (a && NAO_MOSTRAR.some((c) => caminho.startsWith(c)) && caminho !== "/clube" ? false : a)); }, [caminho]);
  useEffect(() => {
    if (!aberta) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    if (window.innerWidth >= 900) setTimeout(() => campo.current?.focus(), 250);
    return () => window.removeEventListener("keydown", esc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberta]);

  function fechar() {
    setAberta(false);
    if (!ehMembro()) gravar(K_FECHADO, String(Date.now()));
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!aceita) return setErro("Marque a opção para receber as novidades.");
    setEnviando(true);
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/entrar_clube`, {
        method: "POST",
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ p_nome: nome, p_email: email, p_whatsapp: zap, p_aceita: aceita }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.erro || "Não foi possível entrar agora. Tente de novo.");
      gravar(K_MEMBRO, "1");
      if (d.codigo) { gravar(K_CUPOM, d.codigo); setCodigo(d.codigo); }
      else setJaCliente(true);
      try { localStorage.setItem("br-cliente", JSON.stringify({ ...(JSON.parse(localStorage.getItem("br-cliente") || "{}")), email, whatsapp: zap })); } catch {}
    } catch (err) {
      setErro((err as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  const copiar = async () => {
    if (!codigo) return;
    try { await navigator.clipboard.writeText(codigo); setCopiado(true); setTimeout(() => setCopiado(false), 1800); } catch {}
  };

  if (!cfg.ativo) return null;
  const sucesso = !!codigo || jaCliente;

  return (
    <>
      <div className={`clube-veu${aberta ? " on" : ""}`} onClick={fechar} aria-hidden />
      <div className={`clube-janela${aberta ? " on" : ""}`} role="dialog" aria-modal="true" aria-labelledby="clube-titulo" aria-hidden={!aberta} inert={!aberta}>
        {imagem && <div className="clube-foto"><img src={imagem} alt="" loading="lazy" /><span><Coroa /><b>Clube Beyond Ruby</b></span></div>}
        <div className="clube-corpo">
          <button className="clube-fechar" onClick={fechar} aria-label="Fechar"><IcFechar /></button>
          {!sucesso ? (
            <form onSubmit={enviar} noValidate>
              <small className="clube-selo">Clube Beyond Ruby</small>
              <h2 id="clube-titulo">Ganhe {moeda(cfg.valor).replace(",00", "")} na sua primeira compra</h2>
              <ul className="clube-beneficios">
                <li><IcCheck /><span><b>{moeda(cfg.valor).replace(",00", "")} OFF</b> na primeira compra acima de {moeda(cfg.minimo).replace(",00", "")}</span></li>
                <li><IcCheck /><span><b>{cfg.cashback_pct}% de volta</b> em crédito nas compras seguintes</span></li>
              </ul>
              <div className="clube-campos">
                <label className="sr" htmlFor="cl-nome">Primeiro nome</label>
                <input ref={campo} id="cl-nome" placeholder="Seu primeiro nome" autoComplete="given-name" value={nome} onChange={(e) => setNome(e.target.value)} required />
                <label className="sr" htmlFor="cl-email">E-mail</label>
                <input id="cl-email" type="email" inputMode="email" placeholder="Seu e-mail" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <label className="sr" htmlFor="cl-zap">WhatsApp</label>
                <input id="cl-zap" type="tel" inputMode="tel" placeholder="WhatsApp com DDD" autoComplete="tel-national" value={zap} onChange={(e) => setZap(mascaraFone(e.target.value))} required />
              </div>
              <label className="clube-aceite"><input type="checkbox" checked={aceita} onChange={(e) => setAceita(e.target.checked)} />Quero receber novidades e ofertas da Beyond Ruby por e-mail</label>
              {erro && <p className="clube-erro" role="alert">{erro}</p>}
              <button className="bt bt-cheio bt-largo" disabled={enviando}>{enviando ? "Enviando…" : `Quero meus ${moeda(cfg.valor).replace(",00", "")}`}</button>
              <div className="clube-links"><Link href="/clube" onClick={() => setAberta(false)}>Como funciona o Clube</Link><button type="button" onClick={fechar}>Agora não</button></div>
            </form>
          ) : (
            <div className="clube-ok">
              <span className="clube-ok-ic"><IcCheck /></span>
              <small className="clube-selo">Clube Beyond Ruby</small>
              <h2 id="clube-titulo">{jaCliente ? "Que bom te ver de novo!" : `Bem-vinda ao Clube${nome ? `, ${nome.split(" ")[0]}` : ""}!`}</h2>
              {codigo ? (
                <>
                  <p>Seu cupom de <b>{moeda(cfg.valor).replace(",00", "")}</b> para a primeira compra acima de {moeda(cfg.minimo).replace(",00", "")}:</p>
                  <button className="clube-codigo" onClick={copiar} aria-label={`Copiar cupom ${codigo}`}>{codigo}<span>{copiado ? "Copiado ✓" : "Copiar"}</span></button>
                  <p className="clube-nota">Já guardamos o cupom: ele entra sozinho na finalização da compra. E a cada compra você ganha {cfg.cashback_pct}% de volta em crédito.</p>
                </>
              ) : (
                <p>Você já é nossa cliente, então o cupom de boas-vindas não se aplica. Mas o melhor continua: a cada compra, <b>{cfg.cashback_pct}% de volta em crédito</b> para usar na próxima.</p>
              )}
              <Link href="/loja" className="bt bt-cheio bt-largo" onClick={() => setAberta(false)}>Ver as peças</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// botão que abre a janela (usado no rodapé, na sacola e na página do clube)
export function BotaoClube({ children, className = "bt bt-cheio" }: { children: React.ReactNode; className?: string }) {
  return <button type="button" className={className} onClick={abrirClube}>{children}</button>;
}

// lembrete dentro da sacola
export function LembreteClube({ cfg, subtotal }: { cfg: ConfigClube; subtotal: number }) {
  const [cupom, setCupom] = useState<string | null>(null);
  const [membro, setMembro] = useState(true);
  useEffect(() => {
    const atualizar = () => { setCupom(lerCupom()); setMembro(ehMembro()); };
    atualizar();
    window.addEventListener("storage", atualizar);
    window.addEventListener("focus", atualizar);
    const t = setInterval(atualizar, 2000);
    return () => { window.removeEventListener("storage", atualizar); window.removeEventListener("focus", atualizar); clearInterval(t); };
  }, []);
  if (!cfg.ativo) return null;
  const v = moeda(cfg.valor).replace(",00", "");
  if (cupom) {
    const falta = cfg.minimo - subtotal;
    return <div className="clube-lembrete ok"><Coroa /><span>{falta > 0 ? <>Seu cupom <b>{cupom}</b> ({v} OFF) vale a partir de {moeda(cfg.minimo)}. Faltam <b>{moeda(falta)}</b>.</> : <>Cupom <b>{cupom}</b>: {v} OFF aplicado na finalização.</>}</span></div>;
  }
  if (membro) return null;
  return (
    <button className="clube-lembrete" onClick={abrirClube}>
      <Coroa /><span><b>Ganhe {v}</b> na 1ª compra acima de {moeda(cfg.minimo).replace(",00", "")} · Entre no Clube</span>
    </button>
  );
}
