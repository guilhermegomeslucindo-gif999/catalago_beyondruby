import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Icones";
import { getConfigs } from "@/lib/dados";

export const metadata: Metadata = { title: "Sobre a Beyond Ruby" };

export default async function Sobre() {
  const { home } = await getConfigs();
  return (
    <>
      <div className="cont texto" style={{ textAlign: "center" }}>
        <Logo className="logo" />
        <h1 style={{ marginTop: 18 }}>Valor &amp; Identidade</h1>
        <p>A Beyond Ruby nasceu para criar semijoias delicadas que acompanham a sua rotina e revelam o que você tem de mais valioso: a sua identidade.</p>
        <p>Cada peça é escolhida com cuidado, pensando em combinar com o dia a dia e em compor o seu mix de anéis, brincos, colares e pulseiras.</p>
        <p style={{ marginTop: 24 }}><Link href="/loja" className="bt bt-cheio">Conhecer as peças</Link></p>
      </div>
      {home.destaques?.[0] && (
        <div className="destaque" style={{ minHeight: "60svh" }}>
          <img src={home.destaques[0].imagem} alt="" loading="lazy" />
          <div><h2>{home.destaques[0].titulo}</h2><p>{home.destaques[0].texto}</p></div>
        </div>
      )}
    </>
  );
}
