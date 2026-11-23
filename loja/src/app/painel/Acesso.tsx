"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { Coroa } from "@/components/Icones";
import { supabaseNavegador } from "@/lib/supabase";

type Ctx = { db: SupabaseClient; sessao: Session; atualizarSite: () => Promise<void> };
const PainelCtx = createContext<Ctx | null>(null);
export const usePainel = () => {
  const c = useContext(PainelCtx);
  if (!c) throw new Error("fora do painel");
  return c;
};

type Estado = "carregando" | "login" | "negado" | "trocar" | "ok";

export function Acesso({ children }: { children: ReactNode }) {
  const db = supabaseNavegador();
  const [estado, setEstado] = useState<Estado>("carregando");
  const [sessao, setSessao] = useState<Session | null>(null);
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

  // Pede para a loja atualizar as páginas na hora (senão atualizam sozinhas em até 1 minuto).
  const atualizarSite = useCallback(async () => {
    const { data } = await db.auth.getSession();
    if (!data.session) return;
    await fetch("/api/revalidar", { method: "POST", headers: { Authorization: `Bearer ${data.session.access_token}` } }).catch(() => {});
  }, [db]);

  if (estado === "carregando") return <div className="pn-login"><div className="giro" style={{ borderTopColor: "var(--pele)" }} /></div>;
  if (estado === "login") return <Login />;
  if (estado === "negado") return (
    <div className="pn-login"><div style={{ background: "#fff", padding: 24, maxWidth: 380 }}>
      <p>Este e-mail não tem acesso ao painel.</p>
      <button className="bt bt-cheio bt-largo" style={{ marginTop: 14 }} onClick={() => db.auth.signOut()}>Sair</button>
    </div></div>
  );
  if (estado === "trocar") return <TrocarSenha onPronto={() => setEstado("ok")} />;

  const nav = [["/painel", "Resumo"], ["/painel/pedidos", "Pedidos"], ["/painel/pecas", "Peças"], ["/painel/configuracoes", "Configurações"]];
  return (
    <PainelCtx.Provider value={{ db, sessao: sessao!, atualizarSite }}>
      <div className="pn">
        <header className="pn-topo">
          <div className="pn-topo-in">
            <Link href="/painel" className="marca"><span style={{ width: 30, height: 16, display: "block" }}><Coroa /></span><b>BEYOND RUBY</b><small>Painel</small></Link>
            <div className="dir">
              <a href="/" target="_blank" rel="noopener">Ver loja</a>
              <button onClick={() => db.auth.signOut()}>Sair</button>
            </div>
          </div>
        </header>
        <nav className="pn-nav"><div className="pn-nav-in">
          {nav.map(([href, nome]) => (
            <Link key={href} href={href} aria-current={(href === "/painel" ? caminho === href : caminho.startsWith(href)) ? "page" : undefined}>{nome}</Link>
          ))}
        </div></nav>
        <main className="pn-main">{children}</main>
      </div>
    </PainelCtx.Provider>
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
    if (!email.trim()) return setErro("Digite seu e-mail acima e clique de novo em “Esqueci a senha”.");
    const { error } = await db.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/painel` });
    if (error) setErro("Não foi possível enviar agora. Tente mais tarde.");
    else setOk("Se esse e-mail tiver acesso, você vai receber um link para criar uma nova senha.");
  };
  return (
    <div className="pn-login">
      <form onSubmit={entrar}>
        <div className="marca"><span style={{ width: 44, height: 23, display: "block" }}><Coroa /></span><b>BEYOND RUBY</b></div>
        <p style={{ textAlign: "center", color: "var(--suave)", fontSize: 13, marginTop: -6 }}>Painel da loja</p>
        <div className="campo"><label htmlFor="em">E-mail</label><input id="em" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div className="campo"><label htmlFor="se">Senha</label><input id="se" type="password" autoComplete="current-password" required value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
        {erro && <p className="erro-msg">{erro}</p>}
        {ok && <p className="pn-msg ok">{ok}</p>}
        <button className="bt bt-cheio bt-largo" disabled={enviando}>{enviando ? "Entrando…" : "Entrar"}</button>
        <button type="button" onClick={esqueci} style={{ fontSize: 13, color: "var(--suave)", textDecoration: "underline" }}>Esqueci a senha</button>
      </form>
    </div>
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
    <div className="pn-login">
      <form onSubmit={salvar}>
        <h1 style={{ fontFamily: "var(--f-caps)", color: "var(--vinho)", fontWeight: 500, fontSize: 20, textAlign: "center" }}>Crie sua senha</h1>
        <p style={{ fontSize: 13.5, color: "var(--suave)", textAlign: "center" }}>Primeiro acesso: troque a senha temporária por uma só sua.</p>
        <div className="campo"><label htmlFor="n1">Nova senha</label><input id="n1" type="password" autoComplete="new-password" value={s1} onChange={(e) => setS1(e.target.value)} /></div>
        <div className="campo"><label htmlFor="n2">Repita a nova senha</label><input id="n2" type="password" autoComplete="new-password" value={s2} onChange={(e) => setS2(e.target.value)} /></div>
        {erro && <p className="erro-msg">{erro}</p>}
        <button className="bt bt-cheio bt-largo" disabled={enviando}>{enviando ? "Salvando…" : "Salvar e entrar"}</button>
      </form>
    </div>
  );
}
