# Beyond Ruby · Catálogo de Pré-lançamento

Site estático de uma página (`index.html`). Fotos, logo e ícones já estão dentro do arquivo.

## Publicar na Vercel
1. Suba esta pasta para um repositório no GitHub.
2. Na Vercel: **Add New → Project**, escolha o repositório.
3. Framework Preset: **Other**. Não precisa de Build Command nem Output Directory.
4. Clique em **Deploy**.

WhatsApp do atendimento configurado: +55 31 7271-5616.

## Catálogo em PDF
O arquivo `catalogo-beyond-ruby.pdf` é o catálogo pronto para baixar e enviar
(fica disponível em `/catalogo-beyond-ruby.pdf` no site). Os botões de WhatsApp
e os atalhos de categoria funcionam dentro do PDF.

Para gerar de novo depois de mudar o `index.html`:

    node ferramentas/gerar-pdf.js "$PWD/index.html" catalogo-beyond-ruby.pdf 760 1120
