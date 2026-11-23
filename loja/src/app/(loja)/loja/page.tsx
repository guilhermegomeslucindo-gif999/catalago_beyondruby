import type { Metadata } from "next";
import { Vitrine } from "@/components/Vitrine";
import { getCategorias, getConfigs, getProdutos } from "@/lib/dados";

export const metadata: Metadata = { title: "Todas as peças", description: "Anéis, brincos, colares e pulseiras Beyond Ruby." };

export default async function Loja({ searchParams }: { searchParams: Promise<{ q?: string; ordem?: string }> }) {
  const { q, ordem } = await searchParams;
  const [produtos, categorias, { loja }] = await Promise.all([getProdutos(), getCategorias(), getConfigs()]);
  const busca = q?.trim().slice(0, 60) || undefined;
  return (
    <>
      <div className="cont cab-pagina">
        <h1>{busca ? "Resultado da busca" : "Todas as peças"}</h1>
        <p>{busca ? `Você buscou por “${busca}”` : "Semijoias delicadas para todos os momentos"}</p>
      </div>
      <Vitrine produtos={produtos} whatsapp={loja.whatsapp} categorias={categorias} busca={busca}
        ordemInicial={ordem === "novidades" ? "novidades" : "destaque"} />
    </>
  );
}
