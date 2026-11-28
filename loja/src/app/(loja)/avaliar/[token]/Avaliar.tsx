"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IcCheck, IcFechar } from "@/components/Icones";
import { SUPABASE_KEY, SUPABASE_URL } from "@/lib/config";
import type { Midia } from "@/lib/tipos";

type Item = { produto_id: string; nome: string; imagem: string | null; avaliacao: { nota: number; texto: string | null; midia: Midia[]; status: string } | null };
type Dados = { ok: boolean; pedido: string; numero: number; nome: string; itens: Item[] };

const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };
const MAX_MB = 50;
const MAX_MIDIAS = 5;
const NOTAS = ["", "Não gostei", "Poderia ser melhor", "Boa", "Gostei muito", "Amei!"];

async function rpc<T>(nome: string, corpo: unknown): Promise<T | null> {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${nome}`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify(corpo) }).catch(() => null);
  return r && r.ok ? r.json() : null;
}

// foto: reduz no aparelho (máx. 1600px) para enviar rápido; se não der (ex.: HEIC no Android), envia a original
async function prepararFoto(f: File): Promise<{ blob: Blob; ext: string }> {
  try {
    const bmp = await createImageBitmap(f);
    const esc = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * esc); c.height = Math.round(bmp.height * esc);
    c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
    const webp = await new Promise<Blob | null>((r) => c.toBlob(r, "image/webp", 0.86));
    if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp" };
    const jpg = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.88));
    if (jpg) return { blob: jpg, ext: "jpg" };
  } catch {}
  return { blob: f, ext: (f.name.split(".").pop() || "jpg").toLowerCase() };
}

async function enviarArquivo(pedido: string, f: File): Promise<Midia> {
  const video = f.type.startsWith("video/");
  if (f.size > MAX_MB * 1024 * 1024) throw new Error(`O arquivo ${video ? "de vídeo " : ""}passa de ${MAX_MB} MB. Grave um vídeo mais curto (até 1 minuto).`);
  const { blob, ext } = video ? { blob: f as Blob, ext: (f.name.split(".").pop() || "mp4").toLowerCase() } : await prepararFoto(f);
  const caminho = `${pedido}/${crypto.randomUUID()}.${ext}`;
  const r = await fetch(`${SUPABASE_URL}/storage/v1/object/avaliacoes/${caminho}`, {
    method: "POST", headers: { ...H, "Content-Type": blob.type || f.type || "application/octet-stream", "x-upsert": "false" }, body: blob,
  });
  if (!r.ok) throw new Error("Não foi possível enviar o arquivo. Confira se é uma foto ou vídeo e tente de novo.");
  return { url: `${SUPABASE_URL}/storage/v1/object/public/avaliacoes/${caminho}`, tipo: video ? "video" : "foto" };
}

export function Avaliar({ token }: { token: string }) {
  const [d, setD] = useState<Dados | null | false>(null);
  useEffect(() => { rpc<Dados>("pedido_para_avaliar", { p_token: token }).then((x) => setD(x && x.ok ? x : false)); }, [token]);

  if (d === null) return <div className="carregando"><div className="giro" />Carregando…</div>;
  if (d === false) return (
    <div className="cont vazio" style={{ padding: "90px 16px" }}>
      <b>Link de avaliação inválido</b><p>Confira se o link está completo ou fale com a gente pelo WhatsApp.</p>
      <Link href="/" className="bt bt-vazado" style={{ marginTop: 18 }}>Ir para a loja</Link>
    </div>
  );
  return (
    <div className="cont avaliar">
      <header className="avaliar-cab">
        <small>Pedido nº {d.numero}</small>
        <h1>{d.nome}, conta pra gente o que achou!</h1>
        <p>Sua opinião ajuda outras clientes a escolher. Se puder, mande uma foto ou um vídeo usando a peça.</p>
      </header>
      <div className="avaliar-lista">{d.itens.map((i) => <FormItem key={i.produto_id} i={i} pedido={d.pedido} token={token} />)}</div>
    </div>
  );
}

function FormItem({ i, pedido, token }: { i: Item; pedido: string; token: string }) {
  const a = i.avaliacao;
  const travada = !!a && a.status !== "nova";
  const [nota, setNota] = useState(a?.nota ?? 0);
  const [passando, setPassando] = useState(0);
  const [texto, setTexto] = useState(a?.texto ?? "");
  const [midia, setMidia] = useState<Midia[]>(a?.midia ?? []);
  const [enviandoArq, setEnviandoArq] = useState(0);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [feito, setFeito] = useState(!!a);
  const [editando, setEditando] = useState(!a);

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arqs = Array.from(e.target.files || []).slice(0, MAX_MIDIAS - midia.length);
    e.target.value = "";
    if (!arqs.length) return;
    setErro("");
    setEnviandoArq((n) => n + arqs.length);
    for (const f of arqs) {
      try { const m = await enviarArquivo(pedido, f); setMidia((x) => [...x, m]); }
      catch (err) { setErro((err as Error).message); }
      finally { setEnviandoArq((n) => n - 1); }
    }
  }

  async function salvar() {
    setErro("");
    if (!nota) return setErro("Escolha de 1 a 5 estrelas.");
    setSalvando(true);
    const r = await rpc<{ ok: boolean; erro?: string }>("enviar_avaliacao", { p_token: token, p_produto: i.produto_id, p_nota: nota, p_texto: texto, p_midia: midia });
    setSalvando(false);
    if (!r?.ok) return setErro(r?.erro || "Não foi possível enviar agora. Tente de novo.");
    setFeito(true); setEditando(false);
  }

  const mostrar = passando || nota;
  return (
    <section className="avaliar-item">
      <div className="avaliar-peca">
        {i.imagem && <img src={i.imagem} alt="" />}
        <div><b>{i.nome.split(" - ")[0]}</b><span>{i.nome.split(" - ")[1] || ""}</span></div>
      </div>

      {feito && !editando ? (
        <div className="avaliar-ok">
          <span className="ic"><IcCheck /></span>
          <div><b>Obrigada pela avaliação!</b><p>{travada ? "Ela já foi analisada pela nossa equipe." : "Ela vai aparecer no site depois que a nossa equipe conferir."}</p></div>
          {!travada && <button type="button" onClick={() => setEditando(true)}>Editar</button>}
        </div>
      ) : (
        <>
          <div className="avaliar-estrelas" role="radiogroup" aria-label="Sua nota" onMouseLeave={() => setPassando(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={nota === n} aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
                className={n <= mostrar ? "on" : ""} onMouseEnter={() => setPassando(n)} onClick={() => setNota(n)}>
                <svg viewBox="0 0 24 24" aria-hidden><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2 6.4 20.2l1.1-6.3L2.9 9.5l6.3-.9L12 2.8Z" /></svg>
              </button>
            ))}
            <span className="rotulo">{NOTAS[mostrar] || "Toque nas estrelas"}</span>
          </div>
          <div className="campo">
            <label htmlFor={`t-${i.produto_id}`}>Conte como foi <small>(opcional)</small></label>
            <textarea id={`t-${i.produto_id}`} rows={3} maxLength={1000} placeholder="O que você achou da peça? Do brilho, do tamanho, da entrega…" value={texto} onChange={(e) => setTexto(e.target.value)} />
          </div>
          <div className="avaliar-midias">
            {midia.map((m, k) => (
              <div key={m.url} className="m">
                {m.tipo === "video" ? <video src={`${m.url}#t=0.1`} muted playsInline preload="metadata" /> : <img src={m.url} alt="" />}
                {m.tipo === "video" && <span className="play">▶</span>}
                <button type="button" onClick={() => setMidia((x) => x.filter((_, j) => j !== k))} aria-label="Remover"><IcFechar /></button>
              </div>
            ))}
            {Array.from({ length: enviandoArq }).map((_, k) => <div key={`e${k}`} className="m carregando-m"><div className="giro" /></div>)}
            {midia.length + enviandoArq < MAX_MIDIAS && (
              <label className="m add">
                <input type="file" accept="image/*,video/*" multiple onChange={escolher} />
                <svg viewBox="0 0 24 24" className="i" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
                <span>Foto ou vídeo</span>
              </label>
            )}
          </div>
          <p className="dica-campo">Até {MAX_MIDIAS} arquivos · vídeos de até 1 minuto</p>
          {erro && <p className="erro-msg" role="alert">{erro}</p>}
          <button type="button" className="bt bt-cheio bt-largo" onClick={salvar} disabled={salvando || enviandoArq > 0}>
            {salvando ? "Enviando…" : enviandoArq ? "Aguarde o envio dos arquivos…" : feito ? "Salvar alterações" : "Enviar avaliação"}
          </button>
        </>
      )}
    </section>
  );
}
