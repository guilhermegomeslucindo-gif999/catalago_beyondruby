import type { Metadata } from "next";
import { Dicas } from "@/components/Dicas";

export const metadata: Metadata = { title: "Cuidados com as peças" };

export default function Cuidados() {
  return (
    <>
      <div className="cont texto" style={{ paddingBottom: 24 }}>
        <h1>Cuide da sua peça</h1>
        <p style={{ textAlign: "center" }}>Pequenos hábitos que mantêm o brilho das suas semijoias por muito mais tempo.</p>
      </div>
      <section className="secao vinho"><div className="cont"><Dicas /></div></section>
      <div className="cont texto">
        <h2>Limpeza</h2>
        <p>Depois de usar, passe uma flanela macia e seca para tirar a oleosidade da pele. Não use produtos abrasivos, pasta de dente ou álcool.</p>
        <h2>Como guardar</h2>
        <p>Guarde cada peça separada, de preferência em saquinhos ou porta-joias com divisórias, longe do banheiro e de locais úmidos.</p>
      </div>
    </>
  );
}
