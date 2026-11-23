import Link from "next/link";
import type { Categoria, ConfigLoja } from "@/lib/tipos";
import { foneBonito, linkWhats } from "@/lib/formato";
import { IcEmail, IcInsta, IcZap, Logo } from "./Icones";

export function Rodape({ loja, categorias }: { loja: ConfigLoja; categorias: Categoria[] }) {
  const insta = loja.instagram?.replace("@", "");
  return (
    <footer className="rodape">
      <div className="cont">
        <div className="rodape-grid">
          <div>
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
              <li><a href={linkWhats(loja.whatsapp, "Olá, Beyond Ruby! Vim pelo site.")} target="_blank" rel="noopener" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><IcZap style={{ color: "#1f9d55" }} /> {foneBonito(loja.whatsapp)}</a></li>
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
  );
}
