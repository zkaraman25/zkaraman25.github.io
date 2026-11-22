// generic version page builder: cfg = {rows:[[bg,fg]...], tiles:[[bg,fg]x6], logo:svg(no fill), mark:svg(no fill), logoW, markW}
function buildVersion(id, cfg){
  const L=(fg)=>cfg.logo.replace('<svg',`<svg style="width:${(cfg.logoW*100).toFixed(1)}%;fill:${fg}"`);
  const M=(fg)=>cfg.mark.replace('<svg',`<svg style="width:${(cfg.markW*100).toFixed(1)}%;fill:${fg}"`);
  const pics=cfg.pics||['cards','sign','extinguisher',['box','copper'],['books','flags'],'van',['workwear','tee'],'wall'];
  return `<div class="brand">
  ${cfg.rows.map(r=>`<div class="row" style="background:${r[0]}">${L(r[1])}</div>`).join('')}
  <div class="tiles">${cfg.tiles.map(t=>`<div style="background:${t[0]}">${M(t[1])}</div>`).join('')}</div>
  <div class="pics">${pics.map(p=>Array.isArray(p)?`<div class="pair">${p.map(q=>`<img src="img/${id}/${q}.jpg" alt="">`).join('')}</div>`:`<img src="img/${id}/${p}.jpg" alt="">`).join('')}</div>
</div>`;
}
