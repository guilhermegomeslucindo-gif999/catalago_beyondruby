import Link from "next/link";
import type { Categoria, ConfigClube, ConfigLoja } from "@/lib/tipos";
import { BotaoClube } from "./Clube";
import { foneBonito, linkWhats, MENSAGEM_PADRAO, moeda } from "@/lib/formato";
import { IcEmail, IcInsta, IcZap, Logo } from "./Icones";

export function Rodape({ loja, categorias, clube }: { loja: ConfigLoja; categorias: Categoria[]; clube?: ConfigClube }) {
  const insta = loja.instagram?.replace("@", "");
  const v = (n: number) => moeda(n).replace(",00", "");
  return (
    <>
    {clube?.ativo && (
      <section className="clube-faixa" aria-label="Clube Beyond Ruby">
        <div className="cont">
          <span style={{ display: "block", color: "var(--pele)" }}><svg className="coroa-f" viewBox="700 180 2530 1320" aria-hidden><use href="/marca.svg#logo-g" /></svg></span>
          <div>
            <h2>Clube Beyond Ruby</h2>
            <p style={{ marginTop: 6 }}><b>{v(clube.valor)} OFF</b> na sua primeira compra acima de {v(clube.minimo)} e <b>{clube.cashback_pct}% de volta</b> em crédito nas compras seguintes.</p>
          </div>
          <div className="acoes">
            <BotaoClube className="bt bt-claro">Quero participar</BotaoClube>
            <Link href="/clube" className="bt bt-claro" style={{ borderColor: "transparent" }}>Como funciona</Link>
          </div>
        </div>
      </section>
    )}
    <footer className="rodape">
      <div className="cont">
        <div className="rodape-grid">
          <div className="rodape-marca">
            <Logo />
            <p style={{ color: "var(--suave)", marginTop: 14, maxWidth: "34ch" }}>Semijoias delicadas para revelar o que você tem de mais valioso: a sua identidade.</p>
          </div>
          <div>
            <h3>Loja</h3>
            <ul>
              <li><Link href="/loja">Todas as peças</Link></li>
              {categorias.map((c) => <li key={c.slug}><Link href={`/categoria/${c.slug}`}>{c.nome}</Link></li>)}
            </ul>
          </div>
          <div>
            <h3>Ajuda</h3>
            <ul>
              <li><Link href="/trocas">Trocas e garantia</Link></li>
              <li><Link href="/entregas">Entregas e frete</Link></li>
              <li><Link href="/cuidados">Cuidados com as peças</Link></li>
              <li><Link href="/privacidade">Privacidade</Link></li>
              <li><Link href="/sobre">Sobre nós</Link></li>
            </ul>
          </div>
          <div>
            <h3>Atendimento</h3>
            <ul>
              <li><a href={linkWhats(loja.whatsapp, MENSAGEM_PADRAO)} target="_blank" rel="noopener" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><IcZap style={{ color: "#1f9d55" }} /> {foneBonito(loja.whatsapp)}</a></li>
              {insta && <li><a href={`https://instagram.com/${insta}`} target="_blank" rel="noopener" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><IcInsta /> @{insta}</a></li>}
              <li><a href={`mailto:${loja.email}`} style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><IcEmail /> {loja.email}</a></li>
            </ul>
            <h3 style={{ marginTop: 22 }}>Pagamento</h3>
            <div className="pagamentos"><span>PIX</span><span>VISA</span><span>MASTERCARD</span><span>ELO</span></div>
          </div>
        </div>
        <div className="legal">
          <span>Pagamento processado pela InfinitePay em nome de {loja.responsavel} · CNPJ {loja.cnpj}</span>
          <span>© {new Date().getFullYear()} Beyond Ruby · Valor &amp; Identidade · {loja.cidade}</span>
        </div>
      </div>
    </footer>
    </>
  );
}
