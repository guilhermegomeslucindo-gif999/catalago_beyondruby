import { Cabecalho, FaixaAvisos } from "@/components/Cabecalho";
import { FlutuaClube, JanelaClube } from "@/components/Clube";
import { Aviso } from "@/components/Favoritos";
import { FlutuaZap } from "@/components/FlutuaZap";
import { Rodape } from "@/components/Rodape";
import { SacolaProvider } from "@/components/Sacola";
import { getCategorias, getConfigs, getProdutos } from "@/lib/dados";

export const revalidate = 60;

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const [{ loja, frete, home, clube }, categorias, produtos] = await Promise.all([getConfigs(), getCategorias(), getProdutos()]);
  // peças disponíveis que a sacola pode sugerir ("Combina com a sua sacola")
  const sugestoes = produtos.filter((p) => p.status === "ativo").map((p) => ({
    id: p.id, slug: p.slug, nome: p.nome, tom: p.tom, preco: p.preco, categoria: p.categoria,
    imagem: p.produto_imagens[0]?.url ?? null, estoque: p.estoque, ordem: p.ordem,
  }));
  return (
    <SacolaProvider freteGratisMinimo={frete.frete_gratis_minimo} clube={clube} sugestoes={sugestoes}>
      <FaixaAvisos avisos={loja.avisos || []} />
      <Cabecalho categorias={categorias.map((c) => ({ slug: c.slug, nome: c.nome }))} whatsapp={loja.whatsapp} instagram={loja.instagram} />
      <main>{children}</main>
      <Rodape loja={loja} categorias={categorias} clube={clube} />
      <FlutuaClube cfg={clube} />
      <FlutuaZap whatsapp={loja.whatsapp} />
      <Aviso />
      <JanelaClube cfg={clube} imagem={home.destaques?.[0]?.imagem || home.hero} />
    </SacolaProvider>
  );
}
