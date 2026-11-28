export type Imagem = { id?: string; url: string; alt: string | null; ordem: number };
export type Detalhe = { rotulo: string; valor: string };
export type StatusProduto = "ativo" | "esgotado" | "oculto";

export type Produto = {
  id: string;
  slug: string;
  nome: string;
  categoria: string;
  tom: "Dourado" | "Prata";
  preco: number;
  descricao: string | null;
  detalhes: Detalhe[];
  status: StatusProduto;
  novidade: boolean;
  ordem: number;
  estoque: number | null;
  criado_em: string;
  produto_imagens: Imagem[];
};

export type Categoria = { slug: string; nome: string; subtitulo: string | null; imagem_url: string | null; ordem: number; na_capa?: boolean };

export type RegiaoUber = { id: string; nome: string; valor: number };
export type ConfigFrete = {
  frete_gratis_minimo: number;
  frete_gratis_tipos: string[];
  retirada: { ativo: boolean; local: string; texto?: string };
  uber: { ativo: boolean; texto?: string; regioes: RegiaoUber[] };
  correios: {
    ativo: boolean;
    tabela: Record<"MG" | "SUDESTE_SUL" | "OUTRAS", { pac: number; sedex: number }>;
    prazos?: { pac?: string; sedex?: string };
  };
};

export type ConfigLoja = {
  whatsapp: string;
  instagram: string;
  email: string;
  responsavel: string;
  cnpj: string;
  cidade: string;
  avisos: string[];
  infinitepay_handle?: string;
  bilhete_valor?: number;
};

export type Destaque = { imagem: string; titulo: string; texto: string; link: string; botao: string };
// "Compre o look": x/y = ponto no anel; lx/ly = onde fica o número (em % da foto)
export type PontoLook = { produto_id: string; x: number; y: number; lx: number; ly: number };
export type ConfigLook = { ativo: boolean; imagem: string; pontos: PontoLook[] };
export type ConfigHome = { hero: string; titulo: string; subtitulo: string; destaques: Destaque[]; look?: ConfigLook };

export type Midia = { url: string; tipo: "foto" | "video" };
export type Avaliacao = { id: string; nota: number; texto: string | null; midia: Midia[]; autor: string; cidade: string | null; criado_em: string; slug: string; produto: string; imagem: string | null };
export type ResumoAvaliacoes = { media: number | null; total: number; lista: Avaliacao[] };

export type ConfigClube = { ativo: boolean; valor: number; minimo: number; cashback_pct: number; validade_dias: number; atraso_segundos: number };
