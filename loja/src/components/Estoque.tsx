// "Últimas unidades": aparece quando o estoque cadastrado da peça está baixo.
export const LIMITE_ULTIMAS = 3;

export const poucasUnidades = (estoque: number | null | undefined, status: string) =>
  status === "ativo" && typeof estoque === "number" && estoque > 0 && estoque <= LIMITE_ULTIMAS;

export const textoUltimas = (n: number) => (n === 1 ? "Última unidade" : `Últimas ${n} unidades`);

// versão da página da peça: aviso + barrinha
export function UltimasUnidades({ estoque }: { estoque: number }) {
  return (
    <div className="ultimas" role="status">
      <span className="ultimas-ponto" aria-hidden />
      <div>
        <b>{estoque === 1 ? "Última unidade disponível!" : `Corra! Últimas ${estoque} unidades`}</b>
        <div className="ultimas-barra" aria-hidden><i style={{ width: `${Math.max(14, (estoque / (LIMITE_ULTIMAS + 2)) * 100)}%` }} /></div>
      </div>
    </div>
  );
}
