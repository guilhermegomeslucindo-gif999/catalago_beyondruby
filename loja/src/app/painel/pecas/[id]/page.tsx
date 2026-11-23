"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { slugify } from "@/lib/formato";
import type { Categoria, Detalhe, StatusProduto } from "@/lib/tipos";
import { usePainel } from "../../Acesso";

type Foto = { id?: string; url: string; alt: string; arquivo?: Blob; nova?: boolean };
type FormPeca = {
  nome: string; categoria: string; tom: "Dourado" | "Prata"; preco: string; descricao: string;
  detalhes: Detalhe[]; status: StatusProduto; estoque: string; novidade: boolean; ordem: string;
};
const NOVA: FormPeca = {
  nome: "", categoria: "", tom: "Dourado", preco: "", descricao: "",
  detalhes: [{ rotulo: "Material", valor: "" }, { rotulo: "Tamanho", valor: "" }, { rotulo: "Garantia", valor: "6 meses" }],
  status: "ativo", estoque: "", novidade: true, ordem: "0",
};
const BUCKET = "produtos";

// Reduz a foto no próprio aparelho (máx. 1400px) e converte para WebP (ou JPEG se o aparelho não suportar).
async function prepararFoto(f: File): Promise<Blob> {
  const bmp = await createImageBitmap(f);
  const esc = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * esc); c.height = Math.round(bmp.height * esc);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.85));
  if (blob && blob.type === "image/webp") return blob;
  return (await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.88)))!;
}
const caminhoDaUrl = (url: string) => url.split(`/object/public/${BUCKET}/`)[1];

export default function EditarPeca() {
  const { id } = useParams<{ id: string }>();
  const nova = id === "nova";
  const router = useRouter();
  const { db, atualizarSite } = usePainel();
  const [f, setF] = useState<FormPeca>(NOVA);
  const [slug, setSlug] = useState("");
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [removidas, setRemovidas] = useState<Foto[]>([]);
  const [cats, setCats] = useState<Categoria[]>([]);
  const [msg, setMsg] = useState<{ t: "ok" | "erro"; m: string } | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [carregado, setCarregado] = useState(nova);
  const arquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.from("categorias").select("*").order("ordem").then(({ data }) => {
      setCats((data as Categoria[]) || []);
      if (nova && data?.[0]) setF((a) => ({ ...a, categoria: a.categoria || data[0].slug }));
    });
    if (nova) return;
    db.from("produtos").select("*,produto_imagens(id,url,alt,ordem)").eq("id", id).single().then(({ data: p }) => {
      if (!p) { setMsg({ t: "erro", m: "Peça não encontrada." }); return; }
      setF({
        nome: p.nome, categoria: p.categoria, tom: p.tom, preco: Number(p.preco).toFixed(2).replace(".", ","),
        descricao: p.descricao || "", detalhes: p.detalhes || [], status: p.status,
        estoque: p.estoque === null ? "" : String(p.estoque), novidade: p.novidade, ordem: String(p.ordem),
      });
      setSlug(p.slug);
      setFotos([...p.produto_imagens].sort((a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem).map((i: Foto) => ({ id: i.id, url: i.url, alt: i.alt || "" })));
      setCarregado(true);
    });
  }, [db, id, nova]);

  const set = <K extends keyof FormPeca>(k: K, v: FormPeca[K]) => setF((a) => ({ ...a, [k]: v }));
  const setDet = (i: number, campo: keyof Detalhe, v: string) => set("detalhes", f.detalhes.map((d, k) => (k === i ? { ...d, [campo]: v } : d)));

  const escolherFotos = async (lista: FileList | null) => {
    if (!lista?.length) return;
    setMsg({ t: "ok", m: "Preparando fotos…" });
    const novas: Foto[] = [];
    for (const arq of Array.from(lista).slice(0, 10)) {
      try { const b = await prepararFoto(arq); novas.push({ url: URL.createObjectURL(b), alt: f.nome, arquivo: b, nova: true }); }
      catch { setMsg({ t: "erro", m: `Não foi possível ler a foto ${arq.name}.` }); return; }
    }
    setFotos((a) => [...a, ...novas]);
    setMsg(null);
    if (arquivoRef.current) arquivoRef.current.value = "";
  };
  const mover = (i: number, d: -1 | 1) => setFotos((a) => {
    const n = [...a]; const j = i + d; if (j < 0 || j >= n.length) return a;
    [n[i], n[j]] = [n[j], n[i]]; return n;
  });
  const tirarFoto = (i: number) => setFotos((a) => { const x = a[i]; if (x.id) setRemovidas((r) => [...r, x]); return a.filter((_, k) => k !== i); });

  async function salvar() {
    setMsg(null);
    const preco = Number(f.preco.replace(/\./g, "").replace(",", "."));
    if (f.nome.trim().length < 3) return setMsg({ t: "erro", m: "Informe o nome da peça." });
    if (!(preco > 0)) return setMsg({ t: "erro", m: "Informe um preço válido (ex.: 49,90)." });
    if (!f.categoria) return setMsg({ t: "erro", m: "Escolha a categoria." });
    if (!fotos.length) return setMsg({ t: "erro", m: "Adicione pelo menos uma foto." });
    const estoque = f.estoque.trim() === "" ? null : Math.max(0, Math.floor(Number(f.estoque)));
    if (estoque !== null && Number.isNaN(estoque)) return setMsg({ t: "erro", m: "Estoque inválido." });

    setSalvando(true);
    try {
      const dados = {
        nome: f.nome.trim(), categoria: f.categoria, tom: f.tom, preco, descricao: f.descricao.trim() || null,
        detalhes: f.detalhes.filter((d) => d.rotulo.trim() && d.valor.trim()).map((d) => ({ rotulo: d.rotulo.trim(), valor: d.valor.trim() })),
        status: estoque === 0 && f.status === "ativo" ? "esgotado" : f.status, estoque, novidade: f.novidade, ordem: Number(f.ordem) || 0,
      };
      let pid = id;
      let s = slug;
      if (nova) {
        s = slugify(f.nome);
        const { data: existe } = await db.from("produtos").select("slug").like("slug", `${s}%`);
        if (existe?.some((x) => x.slug === s)) s = `${s}-${(existe?.length || 1) + 1}`;
        const { data, error } = await db.from("produtos").insert({ ...dados, slug: s }).select("id").single();
        if (error) throw error;
        pid = data.id;
      } else {
        const { error } = await db.from("produtos").update(dados).eq("id", pid);
        if (error) throw error;
      }

      // fotos: envia as novas, apaga as removidas e grava a ordem/legendas
      const finais: { url: string; alt: string }[] = [];
      for (const [k, ft] of fotos.entries()) {
        if (ft.arquivo) {
          const ext = ft.arquivo.type === "image/webp" ? "webp" : "jpg";
          const caminho = `pecas/${s}/${Date.now()}-${k}.${ext}`;
          const { error } = await db.storage.from(BUCKET).upload(caminho, ft.arquivo, { contentType: ft.arquivo.type, cacheControl: "31536000" });
          if (error) throw error;
          finais.push({ url: db.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl, alt: ft.alt });
        } else finais.push({ url: ft.url, alt: ft.alt });
      }
      await db.from("produto_imagens").delete().eq("produto_id", pid);
      const { error: ei } = await db.from("produto_imagens").insert(finais.map((x, k) => ({ produto_id: pid, url: x.url, alt: x.alt.trim() || dados.nome, ordem: k })));
      if (ei) throw ei;
      const apagar = removidas.map((r) => caminhoDaUrl(r.url)).filter(Boolean);
      if (apagar.length) await db.storage.from(BUCKET).remove(apagar);
      setRemovidas([]);

      await atualizarSite();
      if (nova) { router.replace(`/painel/pecas/${pid}?salvo=1`); return; }
      setFotos(finais.map((x) => ({ url: x.url, alt: x.alt })));
      setMsg({ t: "ok", m: "Peça salva! Já aparece atualizada na loja." });
    } catch (e) {
      console.error(e);
      setMsg({ t: "erro", m: "Não foi possível salvar. Confira os dados e tente de novo." });
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!confirm(`Excluir “${f.nome}” de vez? Se quiser só tirar do site, use “Oculto”.`)) return;
    setSalvando(true);
    const caminhos = fotos.map((x) => caminhoDaUrl(x.url)).filter(Boolean);
    const { error } = await db.from("produtos").delete().eq("id", id);
    if (error) { setSalvando(false); return setMsg({ t: "erro", m: "Não foi possível excluir." }); }
    if (caminhos.length) await db.storage.from(BUCKET).remove(caminhos);
    await atualizarSite();
    router.replace("/painel/pecas");
  }

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("salvo")) setMsg({ t: "ok", m: "Peça criada! Já aparece na loja." });
  }, []);

  if (!carregado) return msg ? <p className="pn-msg erro">{msg.m}</p> : <div className="carregando"><div className="giro" />Carregando…</div>;

  return (
    <>
      <div className="pn-cab">
        <h1>{nova ? "Nova peça" : "Editar peça"}</h1>
        <div className="pn-acoes">
          <Link href="/painel/pecas" className="pn-bt">← Voltar</Link>
          {!nova && slug && <a href={`/peca/${slug}`} target="_blank" rel="noopener" className="pn-bt">Ver na loja</a>}
        </div>
      </div>
      {msg && <p className={`pn-msg ${msg.t}`}>{msg.m}</p>}

      <div className="pn-cartao">
        <h2>Fotos</h2>
        <p style={{ fontSize: 12.5, color: "var(--suave)", marginBottom: 10 }}>A primeira foto é a capa. Use as setas para mudar a ordem. A legenda descreve a foto (ajuda no Google e na acessibilidade).</p>
        <div className="pn-fotos">
          {fotos.map((ft, i) => (
            <div key={ft.url} className="pn-foto">
              <img src={ft.url} alt="" />
              <input value={ft.alt} onChange={(e) => setFotos((a) => a.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} placeholder="Legenda" aria-label="Legenda da foto" />
              <div className="pn-acoes">
                <button className="pn-bt" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Mover para a esquerda">←</button>
                <button className="pn-bt" onClick={() => mover(i, 1)} disabled={i === fotos.length - 1} aria-label="Mover para a direita">→</button>
                <button className="pn-bt perigo" onClick={() => tirarFoto(i)} aria-label="Remover foto">✕</button>
              </div>
            </div>
          ))}
          <label className="pn-subir">
            + Adicionar fotos
            <input ref={arquivoRef} type="file" accept="image/*" multiple hidden onChange={(e) => escolherFotos(e.target.files)} />
          </label>
        </div>
      </div>

      <div className="pn-cartao pn-form">
        <h2>Informações</h2>
        <div className="campo"><label htmlFor="nome">Nome da peça</label><input id="nome" value={f.nome} onChange={(e) => set("nome", e.target.value)} placeholder="Ex.: Anel Solitário Maya - Prata" /></div>
        <div className="campos duas">
          <div className="campo"><label htmlFor="cat">Categoria</label><select id="cat" value={f.categoria} onChange={(e) => set("categoria", e.target.value)}>{cats.map((c) => <option key={c.slug} value={c.slug}>{c.nome}</option>)}</select></div>
          <div className="campo"><label htmlFor="tom">Cor</label><select id="tom" value={f.tom} onChange={(e) => set("tom", e.target.value as FormPeca["tom"])}><option>Dourado</option><option>Prata</option></select></div>
        </div>
        <div className="campos duas">
          <div className="campo"><label htmlFor="preco">Preço (R$)</label><input id="preco" inputMode="decimal" value={f.preco} onChange={(e) => set("preco", e.target.value.replace(/[^\d,.]/g, ""))} placeholder="49,90" /></div>
          <div className="campo"><label htmlFor="st">Situação</label><select id="st" value={f.status} onChange={(e) => set("status", e.target.value as StatusProduto)}><option value="ativo">Disponível</option><option value="esgotado">Esgotado</option><option value="oculto">Oculto (fora do site)</option></select></div>
        </div>
        <div className="campos duas">
          <div className="campo"><label htmlFor="est">Estoque (opcional)</label><input id="est" inputMode="numeric" value={f.estoque} onChange={(e) => set("estoque", e.target.value.replace(/\D/g, ""))} placeholder="Deixe vazio para não controlar" /><span className="dica-campo">Se preencher, baixa sozinho a cada venda e esgota no zero.</span></div>
          <div className="campo"><label htmlFor="ord">Ordem na vitrine</label><input id="ord" inputMode="numeric" value={f.ordem} onChange={(e) => set("ordem", e.target.value.replace(/[^\d-]/g, ""))} /><span className="dica-campo">Números menores aparecem primeiro.</span></div>
        </div>
        <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}><input type="checkbox" checked={f.novidade} onChange={(e) => set("novidade", e.target.checked)} style={{ accentColor: "var(--vinho)", width: 18, height: 18 }} /> Mostrar selo “Novidade”</label>
        <div className="campo"><label htmlFor="desc">Descrição</label><textarea id="desc" rows={4} value={f.descricao} onChange={(e) => set("descricao", e.target.value)} /></div>
        <div className="campo">
          <label>Detalhes (material, tamanho, garantia…)</label>
          <div className="pn-linhas-det">
            {f.detalhes.map((d, i) => (
              <div key={i}>
                <input value={d.rotulo} onChange={(e) => setDet(i, "rotulo", e.target.value)} placeholder="Ex.: Material" aria-label="Nome do detalhe" />
                <input value={d.valor} onChange={(e) => setDet(i, "valor", e.target.value)} placeholder="Ex.: Banho de ouro 18k" aria-label="Valor do detalhe" />
                <button className="pn-bt perigo" onClick={() => set("detalhes", f.detalhes.filter((_, k) => k !== i))} aria-label="Remover detalhe">✕</button>
              </div>
            ))}
          </div>
          <button className="pn-bt" style={{ justifySelf: "start", marginTop: 4 }} onClick={() => set("detalhes", [...f.detalhes, { rotulo: "", valor: "" }])}>+ Detalhe</button>
        </div>
      </div>

      <div className="pn-salvar">
        {!nova && <button className="pn-bt perigo" onClick={excluir} disabled={salvando} style={{ marginRight: "auto" }}>Excluir peça</button>}
        <button className="pn-bt cheio" onClick={salvar} disabled={salvando} style={{ minWidth: 140 }}>{salvando ? "Salvando…" : "Salvar"}</button>
      </div>
    </>
  );
}
