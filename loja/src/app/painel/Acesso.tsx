"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { Coroa, Logo } from "@/components/Icones";
import { supabaseNavegador } from "@/lib/supabase";
import { IClientes, IConfig, ILoja, IPecas, IPedidos, IResumo } from "./icones";
import "./painel.css";

type Ctx = { db: SupabaseClient; sessao: Session; atualizarSite: () => Promise<void>; atualizarContadores: () => void };
const PainelCtx = createContext<Ctx | null>(null);
export const usePainel = () => {
  const c = useContext(PainelCtx);
  if (!c) throw new Error("fora do painel");
  return c;
};

type Estado = "carregando" | "login" | "negado" | "trocar" | "ok";

function Marca({ painel = true }: { painel?: boolean }) {
  return <span className="pn-marca"><Coroa /><b>BEYOND RUBY</b>{painel && <small>Painel</small>}</span>;
}

export function Acesso({ children }: { children: ReactNode }) {
  const db = supabaseNavegador();
  const [estado, setEstado] = useState<Estado>("carregando");
  const [sessao, setSessao] = useState<Session | null>(null);
  const [aEnviar, setAEnviar] = useState(0);
  const caminho = usePathname();

  const verificar = useCallback(async (s: Session | null) => {
    setSessao(s);
    if (!s) return setEstado("login");
    const { data } = await db.from("admins").select("trocar_senha").eq("user_id", s.user.id).maybeSingle();
    if (!data) return setEstado("negado");
    setEstado(data.trocar_senha ? "trocar" : "ok");
  }, [db]);

  useEffect(() => {
    db.auth.getSession().then(({ data }) => verificar(data.session));
    const { data: sub } = db.auth.onAuthStateChange((ev, s) => {
      // link "esqueci a senha" do e-mail: entra direto na tela de criar senha nova
      if (ev === "PASSWORD_RECOVERY") { setSessao(s); setEstado("trocar"); return; }
      if (ev === "SIGNED_OUT" || ev === "SIGNED_IN") verificar(s);
    });
    return () => sub.subscription.unsubscribe();
  }, [db, verificar]);

  // quantos pedidos pagos ainda não foram enviados (aparece no menu)
  const atualizarContadores = useCallback(() => {
    db.from("pedidos").select("id", { count: "exact", head: true }).eq("status", "pago").then(({ count }) => setAEnviar(count || 0));
  }, [db]);
  useEffect(() => {
    if (estado !== "ok") return;
    atualizarContadores();
    const t = setInterval(atualizarContadores, 60000);
    return () => clearInterval(t);
  }, [estado, atualizarContadores]);

  // Pede para a loja atualizar as páginas na hora (senão atualizam sozinhas em até 1 minuto).
  const atualizarSite = useCallback(async () => {
    const { data } = await db.auth.getSession();
    if (!data.session) return;
    await fetch("/api/revalidar", { method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}` } }).catch(() => {});
  }, [db]);

  if (estado === "carregando") return <div className="pn"><div className="pn-carregando" style={{ minHeight: "100svh" }}><div className="giro" />Carregando…</div></div>;
  if (estado === "login") return <Login />;
  if (estado === "negado") return (
    <TelaLogin>
      <div style={{ display: "grid", gap: 14, textAlign: "center" }}>
        <h1>Sem acesso</h1>
        <p className="sub">Este e-mail não tem permissão para usar o painel.</p>
        <button className="pn-bt primario" onClick={() => db.auth.signOut()}>Sair</button>
      </div>
    </TelaLogin>
  );
  if (estado === "trocar") return <TrocarSenha onPronto={() => setEstado("ok")} />;

  const nav = [
    { href: "/painel", nome: "Resumo", Ic: IResumo },
    { href: "/painel/pedidos", nome: "Pedidos", Ic: IPedidos, bolha: aEnviar },
    { href: "/painel/pecas", nome: "Peças", Ic: IPecas },
    { href: "/painel/clientes", nome: "Clientes", Ic: IClientes },
    { href: "/painel/configuracoes", nome: "Ajustes", Ic: IConfig },
  ];
  const ativo = (href: string) => (href === "/painel" ? caminho === href : caminho.startsWith(href));
  const email = sessao?.user.email || "";

  return (
    <PainelCtx.Provider value={{ db, sessao: sessao!, atualizarSite, atualizarContadores }}>
      <div className="pn">
        <aside className="pn-lateral" aria-label="Menu do painel">
          <Link href="/painel"><Marca /></Link>
          <nav className="pn-menu">
            {nav.map(({ href, nome, Ic, bolha }) => (
              <Link key={href} href={href} aria-current={ativo(href) ? "page" : undefined}>
                <Ic />{nome === "Ajustes" ? "Configurações" : nome}{!!bolha && <span className="bolha" title="Pedidos pagos a enviar">{bolha}</span>}
              </Link>
            ))}
            <div className="pn-menu-rotulo">Loja</div>
            <a href="/" target="_blank" rel="noopener"><ILoja />Ver loja</a>
          </nav>
          <div className="pn-usuario">
            <span className="pn-avatar">{email.slice(0, 1)}</span>
            <div><b title={email}>{email}</b><button onClick={() => db.auth.signOut()}>Sair</button></div>
          </div>
        </aside>

        <div className="pn-corpo">
          <header className="pn-topo-m">
            <Link href="/painel"><Marca /></Link>
            <div className="pn-acoes">
              <a className="pn-bt pequeno fantasma" href="/" target="_blank" rel="noopener" aria-label="Ver loja"><ILoja /></a>
              <button className="pn-bt pequeno" onClick={() => db.auth.signOut()}>Sair</button>
            </div>
          </header>
          <main className="pn-main">{children}</main>
        </div>

        <nav className="pn-abas" aria-label="Menu do painel">
          {nav.map(({ href, nome, Ic, bolha }) => (
            <Link key={href} href={href} aria-current={ativo(href) ? "page" : undefined}>
              <Ic />{nome}{!!bolha && <span className="bolha">{bolha}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </PainelCtx.Provider>
  );
}

function TelaLogin({ children }: { children: ReactNode }) {
  return (
    <div className="pn">
      <div className="pn-login">
        <div className="pn-login-arte">
          <Logo className="logo" />
          <p>Valor &amp; Identidade em cada peça.</p>
          <small>Painel de gestão · Beyond Ruby</small>
        </div>
        <div className="pn-login-form">{children}</div>
      </div>
    </div>
  );
}

function Login() {
  const db = supabaseNavegador();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [enviando, setEnviando] = useState(false);
  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(""); setEnviando(true);
    const { error } = await db.auth.signInWithPassword({ email: email.trim(), password: senha });
    setEnviando(false);
    if (error) setErro(error.message.includes("Invalid") ? "E-mail ou senha incorretos." : "Não foi possível entrar. Tente de novo.");
  };
  const esqueci = async () => {
    setErro(""); setOk("");
    if (!email.trim()) return setErro("Digite seu e-mail acima e clique de novo em “Esqueci minha senha”.");
    const { error } = await db.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/painel` });
    if (error) setErro("Não foi possível enviar agora. Tente mais tarde.");
    else setOk("Se esse e-mail tiver acesso, você vai receber um link para criar uma nova senha.");
  };
  return (
    <TelaLogin>
      <form onSubmit={entrar}>
        <Marca painel={false} />
        <h1>Entrar no painel</h1>
        <p className="sub">Acesso restrito à equipe Beyond Ruby</p>
        <div className="pn-campo"><label htmlFor="em">E-mail</label><input id="em" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="pn-campo"><label htmlFor="se">Senha</label><input id="se" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
        {erro && <p className="pn-msg erro">{erro}</p>}
        {ok && <p className="pn-msg ok">{ok}</p>}
        <button className="pn-bt primario" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
        <button type="button" className="pn-link" onClick={esqueci}>Esqueci minha senha</button>
      </form>
    </TelaLogin>
  );
}

function TrocarSenha({ onPronto }: { onPronto: () => void }) {
  const db = supabaseNavegador();
  const [s1, setS1] = useState("");
  const [s2, setS2] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    if (s1.length < 8) return setErro("Use pelo menos 8 caracteres.");
    if (s1 !== s2) return setErro("As senhas não conferem.");
    setEnviando(true);
    const { error } = await db.auth.updateUser({ password: s1 });
    if (error) { setEnviando(false); return setErro(error.message.includes("different") ? "Escolha uma senha diferente da temporária." : "Não foi possível salvar. Tente outra senha."); }
    await db.rpc("senha_trocada");
    onPronto();
  };
  return (
    <TelaLogin>
      <form onSubmit={salvar}>
        <Marca painel={false} />
        <h1>Crie sua senha</h1>
        <p className="sub">Primeiro acesso: troque a senha temporária por uma só sua.</p>
        <div className="pn-campo"><label htmlFor="n1">Nova senha</label><input id="n1" type="password" autoComplete="new-password" value={s1} onChange={(e) => setS1(e.target.value)} /><span className="ajuda">Mínimo de 8 caracteres.</span></div>
        <div className="pn-campo"><label htmlFor="n2">Repita a nova senha</label><input id="n2" type="password" autoComplete="new-password" value={s2} onChange={(e) => setS2(e.target.value)} /></div>
        {erro && <p className="pn-msg erro">{erro}</p>}
        <button className="pn-bt primario" disabled={enviando}>{enviando ? "Salvando…" : "Salvar e entrar"}</button>
      </form>
    </TelaLogin>
  );
}
