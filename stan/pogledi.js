/* Pogledi: tlocrt prostorije i pogledi na svaki zid, generirani iz istih koordinata kao 3D.
   Klik na element pokazuje kote. Sve u cm. */
(function(){
const H3=260;
const ROOM_NAMES={b:'Dnevni boravak i kuhinja',h:'Hodnik',w:'Kupaona',s:'Spavaća soba',d:'Dječja soba',l:'Lođa'};
const DIRN={s:'Južni zid',n:'Sjeverni zid',w:'Zapadni zid',e:'Istočni zid'};
const svgNS='http://www.w3.org/2000/svg';
function el(tag,attrs,parent,text){const e=document.createElementNS(svgNS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(text!=null)e.textContent=text;parent.appendChild(e);return e;}
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;');
function polyArea(p){let a=0;for(let i=0;i<p.length;i++){const [x1,y1]=p[i],[x2,y2]=p[(i+1)%p.length];a+=x1*y2-x2*y1;}return a/2;}

// zidovi prostorije: {k, i, a, b, horiz, dir, lo, hi, nx, ny, len, name}
function wallsOf(r){
  const ccw=polyArea(r.poly)>0, n=r.poly.length, out=[];
  for(let i=0;i<n;i++){const [ax,ay]=r.poly[i],[bx,by]=r.poly[(i+1)%n];const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy);
    let nx=-dy/len,ny=dx/len; if(!ccw){nx=-nx;ny=-ny;} // lijeva normala = prema unutra za CCW
    const horiz=ay===by; const dir=horiz?(ny>0?'s':'n'):(nx>0?'w':'e');
    out.push({k:r.k,i,a:[ax,ay],b:[bx,by],horiz,dir,lo:horiz?Math.min(ax,bx):Math.min(ay,by),hi:horiz?Math.max(ax,bx):Math.max(ay,by),c:horiz?ay:ax,nx,ny,len,name:(typeof EDGE_NAMES!=='undefined'&&EDGE_NAMES[r.k]&&EDGE_NAMES[r.k][i])||DIRN[dir]});}
  return out;
}
// koordinata "uzduž zida" gledano iznutra, slijeva nadesno
function along(w,x,y){ if(w.dir==='s')return -x; if(w.dir==='n')return x; if(w.dir==='w')return -y; return y; }
function openSpec(t){ if(t==='door')return [0,210]; if(t==='entry')return [0,215]; if(t==='pass')return [0,245]; if(t==='slide')return [0,245]; if(t==='win100')return [100,180]; if(t==='win90')return [90,230]; return [0,210]; }

function roomBox(r){const xs=r.poly.map(p=>p[0]),ys=r.poly.map(p=>p[1]);return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];}

/* ---------- kote ---------- */
function dim(g,x1,y1,x2,y2,label,off){ // off: pomak linije kote (okomito)
  const horiz=y1===y2; const ox=horiz?0:off, oy=horiz?off:0;
  el('line',{x1:x1,y1:y1,x2:x1+ox,y2:y1+oy,class:'dg'},g);el('line',{x1:x2,y1:y2,x2:x2+ox,y2:y2+oy,class:'dg'},g);
  el('line',{x1:x1+ox,y1:y1+oy,x2:x2+ox,y2:y2+oy,class:'dl'},g);
  const mx=(x1+x2)/2+ox,my=(y1+y2)/2+oy;
  if(horiz)el('text',{x:mx,y:my-5,class:'dt','text-anchor':'middle'},g,label);
  else el('text',{x:mx-5,y:my,class:'dt','text-anchor':'end','dominant-baseline':'middle'},g,label);
}

/* ---------- tlocrt prostorije ---------- */
function drawRoomPlan(svg,r,onPick){
  svg.innerHTML=''; const [x0,y0,x1,y1]=roomBox(r); const M=70;
  svg.setAttribute('viewBox',`${x0-M} ${-(y1)-M} ${x1-x0+2*M} ${y1-y0+2*M}`);
  const Y=y=>-y;
  const g=el('g',{},svg);
  el('polygon',{points:r.poly.map(([x,y])=>`${x},${Y(y)}`).join(' '),class:'pf'},g);
  // zidovi s otvorima
  wallsOf(r).forEach(w=>{
    const opens=EDGE_OPEN.filter(o=>o[0]===r.k&&o[1]===w.i).sort((p,q)=>p[2]-q[2]);
    let cur=w.lo; const th=8;
    const seg=(a,b,cls)=>{if(b-a<0.1)return;const rect=w.horiz?{x:a,y:Y(w.c)-(w.ny>0?th:0),width:b-a,height:th}:{x:w.c-(w.nx>0?th:0),y:Y(b),width:th,height:b-a};el('rect',{...rect,class:cls},g);};
    opens.forEach(o=>{seg(cur,o[2],'pw');seg(o[2],o[3],o[4].startsWith('win')||o[4]==='slide'?'pg':'po');cur=o[3];});seg(cur,w.hi,'pw');
  });
  // namještaj
  const items=FURN3.filter(f=>f.r===r.k);
  items.forEach(f=>{const [a,b,c,d]=f.b;const rr=el('rect',{x:a,y:Y(d),width:c-a,height:d-b,class:'pe'+(f.z[0]>=100?' hi':''),'data-id':f.id},g);
    if((c-a)>30&&(d-b)>25)el('text',{x:(a+c)/2,y:Y((b+d)/2),class:'pt','text-anchor':'middle','dominant-baseline':'middle'},g,f.n.split(' ')[0]);
    rr.addEventListener('click',()=>onPick(f,'plan'));});
  // ukupne kote
  const gd=el('g',{class:'dims'},g);
  dim(gd,x0,Y(y0),x1,Y(y0),`${x1-x0}`,34); dim(gd,x0,Y(y0),x0,Y(y1),`${y1-y0}`,-34);
  callouts(svg,g,items.filter(f=>(f.b[2]-f.b[0])*(f.b[3]-f.b[1])>=1200&&!/^(st\d|sp\d|kava|B1b|H2|F1)$/.test(f.id)).map(f=>({f,x:(f.b[0]+f.b[2])/2,y:Y((f.b[1]+f.b[3])/2),t:f.n,s:`${f.b[2]-f.b[0]} × ${f.b[3]-f.b[1]}`})),x0-M,x1+M,-(y1)-M,y1-y0+2*M,onPick);
  return {g,Y};
}
/* oznake s linijama na rubu, kao u 3D modelu: lijevi stupac za elemente u lijevoj polovici, desni za desnu */
function callouts(svg,g,items,vx0,vx1,vy0,vh,onPick){
  const COL=270, STEP=34, gc=el('g',{class:'callouts'},g);
  const mid=(vx0+vx1)/2; const L=items.filter(i=>i.x<mid).sort((a,b)=>a.y-b.y), R=items.filter(i=>i.x>=mid).sort((a,b)=>a.y-b.y);
  const place=(ls,side)=>{const ys=[];ls.forEach(it=>ys.push(Math.max(it.y,ys.length?ys[ys.length-1]+STEP:vy0+20)));const over=ys[ys.length-1]-(vy0+vh-10);if(over>0)for(let i=0;i<ys.length;i++)ys[i]-=over;
    ls.forEach((it,i)=>{const ty=ys[i];const tx=side==='L'?vx0-COL+10:vx1+COL-10;const bend=side==='L'?vx0-14:vx1+14;
      el('polyline',{points:`${side==='L'?tx+150:tx-150},${ty} ${bend},${ty} ${it.x},${it.y}`,class:'cl'},gc);el('circle',{cx:it.x,cy:it.y,r:3,class:'cd'},gc);
      const t=el('text',{x:tx,y:ty-2,class:'ct','text-anchor':side==='L'?'start':'end'},gc,it.t.length>34?it.t.slice(0,33)+'…':it.t);el('text',{x:tx,y:ty+11,class:'cs','text-anchor':side==='L'?'start':'end'},gc,it.s);
      t.style.cursor='pointer';t.addEventListener('click',()=>onPick(it.f,'plan'));});};
  if(L.length)place(L,'L'); if(R.length)place(R,'R');
  const vb=svg.getAttribute('viewBox').split(' ').map(Number); svg.setAttribute('viewBox',`${vb[0]-(L.length?COL:0)} ${vb[1]} ${vb[2]+(L.length?COL:0)+(R.length?COL:0)} ${vb[3]}`);
}
function planDims(svg,ctx,r,f){
  svg.querySelectorAll('.pick').forEach(e=>e.remove());
  const [rx0,ry0,rx1,ry1]=roomBox(r); const [a,b,c,d]=f.b; const Y=ctx.Y;
  const g=el('g',{class:'dims pick'},ctx.g);
  el('rect',{x:a,y:Y(d),width:c-a,height:d-b,class:'sel'},g);
  dim(g,a,Y(b),c,Y(b),`${c-a}`,16); dim(g,c,Y(b),c,Y(d),`${d-b}`,16);
  if(a-rx0>0.5)dim(g,rx0,Y(d),a,Y(d),`${a-rx0}`,-14); if(rx1-c>0.5)dim(g,c,Y(d),rx1,Y(d),`${rx1-c}`,-14);
  if(b-ry0>0.5)dim(g,a,Y(ry0),a,Y(b),`${b-ry0}`,-14); if(ry1-d>0.5)dim(g,a,Y(d),a,Y(ry1),`${ry1-d}`,-14);
}

/* ---------- pogled na zid ---------- */
function drawElevation(svg,r,w,onPick){
  svg.innerHTML=''; const L=w.len, M=60;
  const a0=Math.min(along(w,...w.a),along(w,...w.b)); // lijevi rub u koordinati "uzduž"
  const X=v=>v-a0, Yz=z=>H3-z;
  svg.setAttribute('viewBox',`${-M} ${-M+10} ${L+2*M} ${H3+2*M}`);
  const g=el('g',{},svg);
  el('rect',{x:0,y:0,width:L,height:H3,class:'ew'},g);
  // otvori na tom zidu
  EDGE_OPEN.filter(o=>o[0]===r.k&&o[1]===w.i).forEach(o=>{const [s,h]=openSpec(o[4]);
    const p=w.horiz?[along(w,o[2],w.c),along(w,o[3],w.c)]:[along(w,w.c,o[2]),along(w,w.c,o[3])];const l=Math.min(...p),rr=Math.max(...p);
    const cls=o[4].startsWith('win')||o[4]==='slide'?'eg':'eo';el('rect',{x:X(l),y:Yz(h),width:rr-l,height:h-s,class:cls},g);
    if(o[4]==='slide'){el('line',{x1:X((l+rr)/2),y1:Yz(h),x2:X((l+rr)/2),y2:Yz(s),class:'ef'},g);}
    if(o[4].startsWith('win')){el('line',{x1:X(l),y1:Yz((s+h)/2),x2:X(rr),y2:Yz((s+h)/2),class:'ef'},g);}
  });
  // elementi: svi u sobi, projicirani na zid, dalji prvo
  const items=FURN3.filter(f=>f.r===r.k).map(f=>{const [a,b,c,d]=f.b;
    const dist=w.horiz?(w.ny>0?b-w.c:w.c-d):(w.nx>0?a-w.c:w.c-c); // udaljenost prednjeg ruba od zida
    const p=w.horiz?[along(w,a,0),along(w,c,0)]:[along(w,0,b),along(w,0,d)];
    return {f,dist,l:Math.min(...p),r:Math.max(...p),L0:Math.min(...p)-a0,L1:Math.max(...p)-a0};}).filter(it=>it.dist<260&&it.r-it.l>0.5).sort((p,q)=>q.dist-p.dist);
  items.forEach(it=>{const f=it.f;const near=it.dist<=12;
    const rr=el('rect',{x:X(it.l),y:Yz(f.z[1]),width:it.r-it.l,height:f.z[1]-f.z[0],class:'ee'+(near?'':' far'),'data-id':f.id},g);
    if(it.r-it.l>40)el('text',{x:X((it.l+it.r)/2),y:Yz((f.z[0]+f.z[1])/2),class:'et','text-anchor':'middle','dominant-baseline':'middle'},g,f.n.split(' ')[0]);
    rr.addEventListener('click',()=>onPick(f,'elev',w,it));});
  el('line',{x1:0,y1:H3,x2:L,y2:H3,class:'efl'},g);
  const gd=el('g',{class:'dims'},g); dim(gd,0,H3,L,H3,`${Math.round(L)}`,40); dim(gd,L,0,L,H3,`${H3}`,40);
  callouts(svg,g,items.filter(it=>it.dist<=12).map(it=>({f:it.f,x:X((it.l+it.r)/2),y:Yz((it.f.z[0]+it.f.z[1])/2),t:it.f.n,s:`${Math.round(it.r-it.l)} × ${it.f.z[1]-it.f.z[0]}${it.f.z[0]?', od poda '+it.f.z[0]:''}`})),-M,L+M,-M+10,H3+2*M,(f)=>onPick(f,'elev',w,items.find(i=>i.f===f)));
  return {g,X,Yz,L};
}
function elevDims(svg,ctx,w,it){
  svg.querySelectorAll('.pick').forEach(e=>e.remove()); const f=it.f;
  const g=el('g',{class:'dims pick'},ctx.g); const {X,Yz,L}=ctx;
  el('rect',{x:X(it.l),y:Yz(f.z[1]),width:it.r-it.l,height:f.z[1]-f.z[0],class:'sel'},g);
  dim(g,X(it.l),Yz(f.z[1]),X(it.r),Yz(f.z[1]),`${Math.round(it.r-it.l)}`,-14);
  dim(g,X(it.r),Yz(f.z[1]),X(it.r),Yz(f.z[0]),`${f.z[1]-f.z[0]}`,16);
  if(f.z[0]>0.5)dim(g,X(it.r),Yz(f.z[0]),X(it.r),H3,`${f.z[0]}`,16);
  if(f.z[1]<H3-0.5)dim(g,X(it.l),0,X(it.l),Yz(f.z[1]),`${H3-f.z[1]}`,-16);
  if(X(it.l)>0.5)dim(g,0,Yz(f.z[0])+0,X(it.l),Yz(f.z[0]),`${Math.round(X(it.l))}`,14);
  if(L-X(it.r)>0.5)dim(g,X(it.r),Yz(f.z[0]),L,Yz(f.z[0]),`${Math.round(L-X(it.r))}`,14);
}

/* ---------- UI ---------- */
function init(){
  const root=document.getElementById('pogRoot'); if(!root)return;
  const roomSel=document.getElementById('pogRoom'), viewSel=document.getElementById('pogView'), svg=document.getElementById('pogSvg'), info=document.getElementById('info'), title=document.getElementById('pogTitle');
  ROOMS.forEach(r=>{const o=document.createElement('button');o.textContent=r.name;o.dataset.k=r.k;roomSel.appendChild(o);});
  let cur={k:'b',view:'plan'};
  function buildViews(){viewSel.innerHTML='';const r=ROOMS.find(r=>r.k===cur.k);
    const add=(id,label)=>{const b=document.createElement('button');b.textContent=label;b.dataset.v=id;b.setAttribute('aria-pressed',id===cur.view);b.addEventListener('click',()=>{cur.view=id;draw();});viewSel.appendChild(b);};
    if(planOnly){add('plan','Tlocrt');return;}
    ((window.VIEWS&&window.VIEWS[r.k])||[]).forEach(([id,lab])=>add('img:'+id,(/^[A-Z]+\d$/.test(id)?id+' · ':'')+lab));
    add('plan','Tlocrt sobe s kotama');
  }
  function countSame(r,w){return wallsOf(r).filter(x=>x.dir===w.dir&&x.len>=60).length;}
  function draw(){const r=ROOMS.find(r=>r.k===cur.k);roomSel.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===cur.k));viewSel.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===cur.view));
    if(window.buildStrip)buildStrip(r.k);
    if(svg.dataset.room!==r.k){svg.dataset.room=r.k;const ctx=drawRoomPlan(svg,r,(f)=>{planDims(svg,ctx,r,f);showInfo(f,null);});}
    if(cur.view.startsWith('img:')){if(window.focusCard)focusCard(cur.view);return;}
    if(window.focusCard)focusCard('plan');
    if(cur.view==='plan'||!svg.dataset.room||svg.dataset.room!==r.k){svg.dataset.room=r.k;const ctx=drawRoomPlan(svg,r,(f)=>{planDims(svg,ctx,r,f);showInfo(f,null);});if(cur.view!=='plan')return;}
    else{const w=wallsOf(r)[+cur.view.slice(1)];title.textContent=r.name+', '+w.name.toLowerCase()+' (pogled iznutra)';const ctx=drawElevation(svg,r,w,(f,_,w2,it)=>{elevDims(svg,ctx,w2,it);showInfo(f,it);});}
  }
  function showInfo(f,it){const [a,b,c,d]=f.b;
    info.innerHTML=`<h3>${esc(f.n)}</h3><div class="kote"><div><b>${c-a}</b><span>širina (x)</span></div><div><b>${d-b}</b><span>dubina (y)</span></div><div><b>${f.z[1]-f.z[0]}</b><span>visina</span></div><div><b>${f.z[0]}</b><span>od poda</span></div><div><b>${H3-f.z[1]}</b><span>do stropa</span></div></div>
      ${f.note?`<div style="margin-top:8px">${esc(f.note)}</div>`:''}<div class="sub" style="margin-top:8px">Tlocrt: x ${a}–${c}, y ${b}–${d}${it?`; u pogledu: ${Math.round(it.L0)}–${Math.round(it.L1)} od lijevog kuta, ${Math.round(it.dist)} od zida`:''}</div>`;}
  roomSel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;cur.k=b.dataset.k;cur.view='plan';buildViews();draw();if(typeof selectRoom==='function'&&window.curRoomK!==cur.k){}});
  let planOnly=false;
  window.Pogledi={wallsOf,drawRoomPlan,planDims,drawElevation,elevDims,
    firstWall:k=>{const v=window.VIEWS&&window.VIEWS[k];return v&&v.length?'img:'+v[0][0]:'plan';},
    show:(k,v,po)=>{cur.k=k;planOnly=!!po;cur.view=v||'plan';buildViews();draw();}};
  buildViews();
  window.dispatchEvent(new Event('pogledi-ready'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
