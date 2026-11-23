const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export const moeda = (v: number | string) => brl.format(Number(v));

export const linkWhats = (numero: string, texto: string) =>
  `https://wa.me/${numero.replace(/\D/g, "")}?text=${encodeURIComponent(texto)}`;

export const foneBonito = (numero: string) => {
  const d = numero.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return numero;
};

export function slugify(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// "Anel Solitário Maya - Prata" -> { titulo: "Anel Solitário Maya", variante: "Prata" }
export function separarNome(nome: string) {
  const i = nome.lastIndexOf(" - ");
  return i > 0 ? { titulo: nome.slice(0, i), variante: nome.slice(i + 3) } : { titulo: nome, variante: "" };
}
