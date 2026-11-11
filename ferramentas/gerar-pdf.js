// Gera o catálogo em PDF (páginas 760x1120px, visual de tablet, sem cortar peças).
// Uso: node ferramentas/gerar-pdf.js "$PWD/index.html" catalogo-beyond-ruby.pdf 760 1120
// Requer Playwright com Chromium instalado.
const {chromium}=require('playwright');
(async()=>{const [src,out,W,H]=process.argv.slice(2);const b=await chromium.launch();
const p=await b.newPage({viewport:{width:+W,height:+H},deviceScaleFactor:2});
await p.emulateMedia({media:'screen',reducedMotion:'reduce'});
await p.goto('file://'+src);await p.waitForLoadState('networkidle');await p.evaluate(()=>document.fonts.ready);
await p.addStyleTag({content:`
html,body{background:var(--creme)!important;overflow:visible!important}
.flutua,.busca,.ficha,.seta,.pontos,.card .ver{display:none!important}
.revela{opacity:1!important;transform:none!important;transition:none!important}
*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;animation:none!important;transition:none!important}
.pg{height:${H-1}px;overflow:hidden;display:flex;flex-direction:column;break-after:page;page-break-after:always}
.pg:last-child{break-after:auto;page-break-after:auto}
.pg>*{flex:none}
.pg>.estica{flex:1 0 auto}
.pg>.capa{flex:1 0 auto;grid-template-rows:1fr auto}
.pg>.capa .foto{aspect-ratio:auto!important;max-height:none!important;height:100%}
.pg>.cats,.pg>.rodape,.pg>.cuidados{display:flex;flex-direction:column;justify-content:center}
.pg>.cats>*,.pg>.rodape>*,.pg>.cuidados>*{width:100%}
.pg>.rodape>.zap{width:auto;align-self:center}
.secao.cont{padding-top:12px!important}
.rodape{padding-bottom:56px!important}
.editorial{min-height:0!important;height:520px}
.secao.meio{padding-bottom:0!important}
.secao.topo-pg{padding-top:28px!important}
`});
const n=await p.evaluate(({H})=>{
  const pieces=[];
  const capa=document.querySelector('.capa');
  for(const el of [...document.querySelectorAll('.capa,.cats,.secao,.editorial,.cuidados,.rodape')]){
    if(el.matches('.capa')) pieces.push({el,full:true});
    else if(el.matches('.cats,.editorial,.cuidados,.rodape')) pieces.push({el});
    else if(el.matches('.secao')){
      const grade=el.querySelector('.grade');const cards=[...grade.children];
      const cols=getComputedStyle(grade).gridTemplateColumns.split(' ').length;
      const rows=[];for(let i=0;i<cards.length;i+=cols)rows.push(cards.slice(i,i+cols));
      rows.forEach((r,k)=>{let s;
        if(k===0){s=el;} else {s=el.cloneNode(true);s.removeAttribute('id');s.querySelector('.cab')?.remove();s.classList.add('cont');}
        const g=s.querySelector('.grade');g.replaceChildren(...r);
        if(k<rows.length-1)s.classList.add('meio');
        pieces.push({el:s});});
    }
  }
  // place in a measuring container
  const root=document.createElement('div');[...document.body.children].forEach(c=>{if(c.tagName.toLowerCase()!=='svg'&&!c.querySelector('symbol,defs'))c.remove();});document.body.appendChild(root);
  const pages=[];let cur=null,used=0;
  const novaPg=()=>{cur=document.createElement('div');cur.className='pg';root.appendChild(cur);pages.push(cur);used=0;};
  for(const pc of pieces){
    if(pc.full){novaPg();cur.appendChild(pc.el);used=H;continue;}
    if(!cur||used>=H){novaPg();}
    cur.appendChild(pc.el);
    if(pc.el.classList.contains('cont')&&used===0)pc.el.classList.add('topo-pg');
    let h=pc.el.getBoundingClientRect().height;
    if(used>0&&used+h>H-1){cur.removeChild(pc.el);cur.lastElementChild.classList.add('estica');novaPg();cur.appendChild(pc.el);
      if(pc.el.classList.contains('cont'))pc.el.classList.add('topo-pg');h=pc.el.getBoundingClientRect().height;}
    used+=h;
  }
  pages.forEach(pg=>pg.lastElementChild.classList.add('estica'));
  document.querySelectorAll('a.abre').forEach(a=>a.removeAttribute('href'));
  return pages.length;
},{H:+H});
console.log('Páginas:',n);
await p.waitForTimeout(400);
await p.pdf({path:out,width:W+'px',height:H+'px',printBackground:true,margin:{top:0,right:0,bottom:0,left:0}});
await b.close();})();
