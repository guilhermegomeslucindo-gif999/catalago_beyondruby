// Faixa com frases correndo da direita para a esquerda, em loop contínuo.
// O conteúdo é repetido duas vezes para o movimento não ter "pulo".
import { Coroa } from "./Icones";

export function FaixaCorrida({ itens }: { itens: string[] }) {
  const lista = itens.filter(Boolean);
  if (!lista.length) return null;
  // garante largura suficiente mesmo com poucas frases
  const base = lista.length < 4 ? [...lista, ...lista, ...lista] : lista;
  const grupo = (oculto: boolean) => (
    <ul className="corrida-grupo" aria-hidden={oculto || undefined}>
      {base.map((t, i) => <li key={i}>{t}<span className="corrida-sep"><Coroa /></span></li>)}
    </ul>
  );
  return (
    <div className="corrida" role="region" aria-label="Destaques da loja" style={{ ["--dur" as string]: `${Math.max(28, base.length * 7)}s` }}>
      <div className="corrida-trilho">{grupo(false)}{grupo(true)}</div>
    </div>
  );
}
