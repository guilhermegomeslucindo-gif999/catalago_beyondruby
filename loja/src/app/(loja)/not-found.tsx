import Link from "next/link";

export default function NaoEncontrado() {
  return (
    <div className="cont vazio" style={{ padding: "100px 16px" }}>
      <b>Página não encontrada</b>
      <p>Essa página não existe ou a peça saiu do catálogo.</p>
      <Link href="/loja" className="bt bt-cheio" style={{ marginTop: 20 }}>Ver as peças</Link>
    </div>
  );
}
