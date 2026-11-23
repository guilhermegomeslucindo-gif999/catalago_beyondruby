import { Cabecalho, FaixaAvisos } from "@/components/Cabecalho";
import { FlutuaZap } from "@/components/FlutuaZap";
import { Rodape } from "@/components/Rodape";
import { SacolaProvider } from "@/components/Sacola";
import { getCategorias, getConfigs } from "@/lib/dados";

export const revalidate = 60;

export default async function LojaLayout({ children }: { children: React.ReactNode }) {
  const [{ loja, frete }, categorias] = await Promise.all([getConfigs(), getCategorias()]);
  return (
    <SacolaProvider freteGratisMinimo={frete.frete_gratis_minimo}>
      <FaixaAvisos avisos={loja.avisos || []} />
      <Cabecalho categorias={categorias.map((c) => ({ slug: c.slug, nome: c.nome }))} whatsapp={loja.whatsapp} instagram={loja.instagram} />
      <main>{children}</main>
      <Rodape loja={loja} categorias={categorias} />
      <FlutuaZap whatsapp={loja.whatsapp} />
    </SacolaProvider>
  );
}
