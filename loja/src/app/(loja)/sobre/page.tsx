import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Icones";

export const metadata: Metadata = { title: "Sobre a Beyond Ruby" };

export default function Sobre() {
  return (
    <div className="cont texto sobre">
      <Logo className="logo sobre-logo" />
      <h1 className="sr">Sobre a Beyond Ruby</h1>
      <p>A Beyond Ruby nasceu para criar semijoias delicadas que acompanham a sua rotina e revelam o que você tem de mais valioso: a sua identidade.</p>
      <p>Cada peça é escolhida com cuidado, pensando em combinar com o dia a dia e em compor o seu mix de anéis, brincos, colares e pulseiras.</p>
      <p style={{ marginTop: 28 }}><Link href="/loja" className="bt bt-cheio">Conhecer as peças</Link></p>
    </div>
  );
}
