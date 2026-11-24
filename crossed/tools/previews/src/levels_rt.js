// ================================================================ levels: second floors and basements
// A map is multi-level when any object carries a level (`lv`, the height of that level's floor: -3.2 basement, 0 ground,
// 3.2 upstairs, ...) or when it has stairs. Then:
//  - every floor is a slab (a 0.2 m thick plate; its underside is the ceiling of the level below), with holes cut over stairwells;
//  - groundY() answers for the body being moved: the highest floor (or stair ramp) at or a little above its feet, so a body
//    downstairs never snaps up onto the floor over its head;
//  - walls, doors, furniture, pillars, items and containers belong to one level. While a body moves, the world's collision
//    lists (segs, doors, boxes, circles, pickups, containers) are swapped for its level's, so walls upstairs never block or hide
//    anything downstairs; the path grid is kept per level;
//  - creatures on another level than Norah don't see or hear her through floors; one that was hunting her follows her by
//    heading for the stairs, and picks her up again once it's on her level.
const LV={multi:false, views:false, slab:false, levels:[0], ref:0, view:null, all:null, snap:{}, nav:{}, stairs:[], rise:3.2, ghost:null};
const LV_KEYS=["segs","doors","boxes","circles","pickups","containers"];
const lvOf=o=>+o.lv||0;
function lvPrep(doc){
  const set=new Set([0]); let st=false;
  for(const o of doc.objects||[]){ set.add(lvOf(o)); if(o.type==="stairs"){ st=true; set.add(lvOf(o)); set.add(lvOf(o)+(+o.rise||LV.rise)); } }
  LV.levels=[...set].sort((a,b)=>a-b); LV.multi=st||LV.levels.length>1; LV.stairDocs=(doc.objects||[]).filter(o=>o.type==="stairs");
}
const lvIndex=y=>{ let i=0; for(let k=0;k<LV.levels.length;k++) if(LV.levels[k]<=y+0.05) i=k; return i; };
// a body changes level 30% of the way along the stairs from the side it set off from
function lvTrack(ent){ const L=LV.levels; let i=ent._lvI??lvIndex(ent._lvY||0); const y=ent._lvY||0;
  if(i+1<L.length && y>L[i]+0.3*(L[i+1]-L[i])) i++; else if(i>0 && y<L[i]-0.3*(L[i]-L[i-1])) i--; ent._lvI=i; }
// ---------------------------------------------------------------- height under a point, for the body being moved
function lvRampH(f,x,z){ const r=f.ramp; let t;
  if(r.dir==="+z") t=(z-f.z0)/(f.z1-f.z0); else if(r.dir==="-z") t=(f.z1-z)/(f.z1-f.z0); else if(r.dir==="+x") t=(x-f.x0)/(f.x1-f.x0); else t=(f.x1-x)/(f.x1-f.x0);
  return r.y0+r.rise*clamp(t,0,1); }
{ const g0=groundY; groundY=function(x,z){ if(!LV.multi||!world) return g0(x,z);
    const top=LV.ref+0.75; let best=null, low=null;
    for(const f of world.floorRects){ if(x<f.x0||x>f.x1||z<f.z0||z>f.z1) continue; const h=f.ramp?lvRampH(f,x,z):f.y;
      if(h<=top&&(best===null||h>best)) best=h; if(low===null||h<low) low=h; }
    if(best!==null) return best; if(low!==null) return low;
    const fr=world.floorRects; world.floorRects=[]; try{ return g0(x,z); } finally{ world.floorRects=fr; } }; }
// ---------------------------------------------------------------- building
// a floor of a multi-level map: a slab at its level, with the stairwells that come up through it cut out
function lvBuildFloor(o){ const y=lvOf(o)+(+o.y||0);
  if(!LV.multi){ addFloor(o.x,o.z,o.x+o.w,o.z+o.d,"#3c3c3c","#444444",{y:+o.y||0}); return; }
  let rects=[[o.x,o.z,o.x+o.w,o.z+o.d]];
  for(const s of LV.stairDocs){ if(Math.abs(lvOf(s)+(+s.rise||LV.rise)-y)>0.3) continue; const hx0=s.x, hz0=s.z, hx1=s.x+s.w, hz1=s.z+s.d, out=[];
    for(const [x0,z0,x1,z1] of rects){ if(hx1<=x0||hx0>=x1||hz1<=z0||hz0>=z1){ out.push([x0,z0,x1,z1]); continue; }
      const cx0=Math.max(x0,hx0), cx1=Math.min(x1,hx1);
      if(hz0>z0) out.push([x0,z0,x1,hz0]); if(hz1<z1) out.push([x0,hz1,x1,z1]);
      if(hx0>x0) out.push([x0,Math.max(z0,hz0),cx0,Math.min(z1,hz1)]); if(hx1<x1) out.push([cx1,Math.max(z0,hz0),x1,Math.min(z1,hz1)]); }
    rects=out.filter(r=>r[2]-r[0]>0.01&&r[3]-r[1]>0.01); }
  LV.slab=true; try{ for(const [x0,z0,x1,z1] of rects) addFloor(x0,z0,x1,z1,"#3c3c3c","#444444",{y}); } finally{ LV.slab=false; } }
// the plate under a floor: solid to bullets and the camera, and the ceiling of the level below
function lvSlab(x0,z0,x1,z1,y){ const w=x1-x0, d=z1-z0; const m=new THREE.Mesh(new THREE.BoxGeometry(w,0.2,d),M(0x34302a)); m.position.set((x0+x1)/2,y-0.105,(z0+z1)/2); world.group.add(m); world.blockers.push(m);
  (world.roofs||(world.roofs=[])).push({x0,z0,x1,z1,y:y-0.21}); }
// stairs: {type:"stairs", x, z (corner), w, d, dir: "+z"|"-z"|"+x"|"-x" (the way up), lv (bottom level), rise (default 3.2)}
function lvBuildStairs(o){
  const L=lvOf(o), R=+o.rise||LV.rise, U=L+R, x0=+o.x, z0=+o.z, w=Math.max(0.6,+o.w||1.4), d=Math.max(0.6,+o.d||4.8), x1=x0+w, z1=z0+d, dir=o.dir||"+z";
  const alongZ=dir[1]==="z", len=alongZ?d:w, N=Math.max(4,Math.round(R/0.2)), col=hexNum(o.color||"#5a4a38");
  const mat=(o.tex&&SBTEX[o.tex]&&SBTEX[o.tex].ready)?texMat(o.tex,alongZ?w:len/N,alongZ?len/N:d,o.color||"#5a4a38"):M(col);
  for(let k=0;k<N;k++){ const h=(k+1)*R/N, a=k*len/N, b=(k+1)*len/N; let bx,bz,bw,bd;
    if(alongZ){ bw=w; bd=b-a; bx=(x0+x1)/2; bz=dir==="+z"?z0+(a+b)/2:z1-(a+b)/2; } else { bw=b-a; bd=d; bz=(z0+z1)/2; bx=dir==="+x"?x0+(a+b)/2:x1-(a+b)/2; }
    const m=new THREE.Mesh(new THREE.BoxGeometry(bw,h,bd),mat); m.position.set(bx,L+h/2,bz); world.group.add(m); world.blockers.push(m); }
  world.floorRects.push({x0,z0,x1,z1,y:L,ramp:{dir,y0:L,rise:R}});
  // the low end (where you step on) and the high end (where you step off)
  const ends={"+z":[[x0,z0,x1,z0],[x0,z1,x1,z1]],"-z":[[x0,z1,x1,z1],[x0,z0,x1,z0]],"+x":[[x0,z0,x0,z1],[x1,z0,x1,z1]],"-x":[[x1,z0,x1,z1],[x0,z0,x0,z1]]}[dir];
  const sides=alongZ?[[x0,z0,x0,z1],[x1,z0,x1,z1]]:[[x0,z0,x1,z0],[x0,z1,x1,z1]];
  const seg=(s,lys)=>{ const sg={ax:s[0],az:s[1],bx:s[2],bz:s[3],t:0.08,lys,stair:true}; world.segs.push(sg); return sg; };
  for(const s of sides) seg(s,[L,U]);
  seg(ends[1],[L]);   /* downstairs you can't walk in under the top of the flight */
  seg(ends[0],[U]);   /* upstairs, the stairwell is railed off except at the top step */
  // railings round the stairwell upstairs
  const rail=(s)=>{ const dx=s[2]-s[0], dz=s[3]-s[1], l=Math.hypot(dx,dz); const m=new THREE.Mesh(new THREE.BoxGeometry(l,0.06,0.06),M(0x3a3028)); m.position.set((s[0]+s[2])/2,U+0.92,(s[1]+s[3])/2); m.rotation.y=-Math.atan2(dz,dx); world.group.add(m);
    const n=Math.max(2,Math.round(l/0.5)); for(let i=0;i<=n;i++){ const p=new THREE.Mesh(new THREE.BoxGeometry(0.04,0.9,0.04),M(0x3a3028)); p.position.set(s[0]+dx*i/n,U+0.45,s[1]+dz*i/n); world.group.add(p); } };
  for(const s of [...sides,ends[0]]) rail(s);
  const mid=(s,k)=>{ const mx=(s[0]+s[2])/2, mz=(s[1]+s[3])/2, ux={"+z":[0,1],"-z":[0,-1],"+x":[1,0],"-x":[-1,0]}[dir]; return {x:mx+ux[0]*k, z:mz+ux[1]*k}; };
  LV.stairs.push({x0,z0,x1,z1,L,U,dir, lowIn:mid(ends[0],0.35), highIn:mid(ends[1],-0.3), lowOut:mid(ends[0],-0.6), highOut:mid(ends[1],0.6)});
}
// every object knows its level: the collision pieces it makes are tagged with it, and heights are read on its level
{ const b0=sbBuildObj; sbBuildObj=function(o){ const L=lvOf(o);
    if(o.type==="stairs"){ lvBuildStairs(o); return; }
    const n={}; for(const k of LV_KEYS) n[k]=world[k].length; const rf=LV.ref; LV.ref=L+0.05;
    let oo=o; if(L&&(o.type==="light"||o.type==="camera"||o.type==="roof")){ oo=Object.assign({},o,{y:(o.y??(o.type==="light"?2.6:o.type==="camera"?2.8:3.2))+L}); if(o.type==="camera") oo.look=(o.look?[o.look[0],o.look[1]+L,o.look[2]]:[o.x,0.8+L,o.z-3]); }
    try{ b0(oo); } finally{ LV.ref=rf; for(const k of LV_KEYS) for(let i=n[k];i<world[k].length;i++) if(world[k][i].ly===undefined&&!world[k][i].lys) world[k][i].ly=L;
      if(o.type==="spawn") world.spawn.lv=L; if(o.type==="enemy"){ const s=world.enemySpawns[world.enemySpawns.length-1]; if(s) s.lv=L; } } }; }
{ const bf0=buildFromDoc; buildFromDoc=function(doc,forEditor){ lvPrep(doc); LV.stairs=[]; LV.views=false; LV.view=null; LV.all=null; LV.nav={}; LV.ref=forEditor?(ED.lv||0)+0.05:0;
    bf0(doc,forEditor);
    if(LV.multi&&!forEditor){ LV.all={}; for(const k of LV_KEYS) LV.all[k]=world[k]; LV.views=true; } }; }
// ---------------------------------------------------------------- per-level views of the collision lists
const lvIn=(it,L)=>it.lys?it.lys.includes(L):(it.ly===undefined?0:it.ly)===L;
function lvSync(){ if(LV.view===null||!LV.all) return; const L=LV.levels[LV.view];
  for(const k of LV_KEYS){ const cur=world[k], snap=LV.snap[k]; if(!snap) continue; let same=cur.length===snap.length; if(same) for(let i=0;i<cur.length;i++) if(cur[i]!==snap[i]){ same=false; break; } if(same) continue;
    const cs=new Set(cur), ss=new Set(snap), all=LV.all[k];
    for(const x of snap) if(!cs.has(x)){ const j=all.indexOf(x); if(j>=0) all.splice(j,1); }
    for(const x of cur) if(!ss.has(x)){ if(x.ly===undefined&&!x.lys) x.ly=L; all.push(x); } } }
const NAV_F=["g","cl","nx","nz","x0","z0","world","sig","t"];
function lvUse(i){ if(!LV.views||!LV.all) return; if(i===LV.view&&world.segs!==LV.all.segs) return;
  lvSync(); if(LV.view!==null){ const s=LV.nav[LV.view]={}; for(const f of NAV_F) s[f]=NAV[f]; }
  const L=LV.levels[i]; for(const k of LV_KEYS){ world[k]=LV.all[k].filter(it=>lvIn(it,L)); LV.snap[k]=world[k].slice(); }
  const s=LV.nav[i]; if(s&&s.world===world) for(const f of NAV_F) NAV[f]=s[f]; else { NAV.g=null; NAV.world=null; }
  LV.view=i; }
// where a creature on another level thinks Norah is: if it was after her, the far end of the stairs that lead towards her;
// otherwise nowhere near (it can't see or hear her through the floor)
function lvProxy(e){ const B=world.bounds, far={x:B.x1+80,z:B.z1+80};
  const hunting=e.aware==="hunting"||e.aware==="searching"||e.aware===undefined; if(!hunting||gameTime-(e._lvSeen??-99)>30) return far;
  const i=e._lvI, j=player._lvI, k=j>i?i+1:i-1, lo=LV.levels[Math.min(i,k)], hi=LV.levels[Math.max(i,k)];
  let best=null, bd=1e9; for(const s of LV.stairs){ if(Math.abs(s.L-lo)>0.1||Math.abs(s.U-hi)>0.1) continue; const p=j>i?s.lowIn:s.highIn, dd=Math.hypot(p.x-e.pos.x,p.z-e.pos.z); if(dd<bd){ bd=dd; best=s; } }
  if(!best) return far; const up=j>i, s=best, inS=e.pos.x>=s.x0-0.05&&e.pos.x<=s.x1+0.05&&e.pos.z>=s.z0-0.05&&e.pos.z<=s.z1+0.05;
  const entry=up?s.lowOut:s.highOut, enter=up?s.lowIn:s.highIn, exit=up?s.highIn:s.lowIn;
  // on the flight: head for its far end. Off it: head for the foot (or the head) of the stairs, and once in front of them,
  // look straight up the flight, so a creature never lunges at the empty stairs
  if(inS) return {x:exit.x,z:exit.z,see:true};
  if(Math.hypot(e.pos.x-entry.x,e.pos.z-entry.z)<3&&wallsClear(e.pos.x,e.pos.z,enter.x,enter.z)) return {x:exit.x,z:exit.z,see:true};
  return {x:entry.x,z:entry.z,see:true}; }
// while a creature follows her towards the stairs it keeps its eyes on where it thinks she is
{ const l0=lineOfSight; lineOfSight=function(ax,az,bx,bz,see,skipDoors){ const g=LV.ghostPt; if(g&&((Math.abs(bx-g.x)<1e-6&&Math.abs(bz-g.z)<1e-6)||(Math.abs(ax-g.x)<1e-6&&Math.abs(az-g.z)<1e-6))) return true; return l0(ax,az,bx,bz,see,skipDoors); }; }
const lvHide=(fn)=>{ const moved=[]; for(const e of enemies){ if(e._lvI!==undefined&&e._lvI!==player._lvI){ moved.push(e); e.pos.x+=1e4; } } try{ return fn(); } finally{ for(const e of moved) e.pos.x-=1e4; } };
function lvPlayerCtx(){ if(player._lvY===undefined){ player._lvY=world.spawn&&world.spawn.lv||0; player._lvI=lvIndex(player._lvY); } lvUse(player._lvI); LV.ref=player._lvY; }
{ const up0=updatePlayer; updatePlayer=function(dt){ if(!LV.views) return up0(dt); lvPlayerCtx();
    try{ return lvHide(()=>up0(dt)); } finally{ LV.ref=player._lvY; player._lvY=player.vault?player._lvY:groundY(player.pos.x,player.pos.z); lvTrack(player); lvPlayerCtx(); } }; }
{ const w0=wpnStep; wpnStep=function(dt){ if(!LV.views) return w0(dt); lvPlayerCtx(); return lvHide(()=>w0(dt)); }; }
{ const u0=Enemy.prototype.update; Enemy.prototype.update=function(dt){ if(!LV.views) return u0.call(this,dt);
    if(this._lvY===undefined){ this._lvY=this._lvSpawn??player._lvY??0; this._lvI=lvIndex(this._lvY); }
    lvUse(this._lvI); LV.ref=this._lvY; const same=this._lvI===player._lvI, px=player.pos.x, pz=player.pos.z, gb=player.grabbed;
    if(!same){ const P=lvProxy(this); player.pos.x=P.x; player.pos.z=P.z; LV.ghost=this; LV.ghostPt=P.see?{x:player.pos.x,z:player.pos.z}:null; if(P.see) this._lvFollow=true; }
    try{ return u0.call(this,dt); }
    finally{ if(!same){ player.pos.x=px; player.pos.z=pz; LV.ghost=null; LV.ghostPt=null; if(player.grabbed===this&&gb!==this) player.grabbed=gb; }
      else if(Math.hypot(px-this.pos.x,pz-this.pos.z)<16&&lineOfSight(this.pos.x,this.pos.z,px,pz,true)) this._lvSeen=gameTime;
      LV.ref=this._lvY; this._lvY=groundY(this.pos.x,this.pos.z); lvTrack(this); lvPlayerCtx(); } }; }
// a creature fooled into going for the stairs can't hurt her from the wrong floor
for(const m of ["hurt","bite"]){ const f=player[m]; if(typeof f==="function") player[m]=function(...a){ if(LV.ghost) return; return f.apply(this,a); }; }
// a new creature starts on its spawn's level (map spawns), or on Norah's (spawned from the keys)
{ const s0=spawn; spawn=function(type,x,z,opts={}){ if(!LV.views) return s0(type,x,z,opts);
    let ly=player._lvY??0; if(x!==undefined){ const m=world.enemySpawns.find(q=>q.x===x&&q.z===z); if(m&&m.lv!==undefined) ly=m.lv; }
    const i=lvIndex(ly); lvUse(i); const rf=LV.ref; LV.ref=ly+0.05; let e;
    try{ e=s0(type,x,z,opts); } finally{ LV.ref=rf; lvPlayerCtx(); }
    if(e){ e._lvSpawn=ly; e._lvY=ly; e._lvI=i; } return e; }; }
// play starts on the spawn's level
{ const sp0=startPlay; startPlay=function(...a){ player._lvY=undefined; player._lvI=undefined; LV.view=null; const r=sp0.apply(this,a); if(LV.views) lvPlayerCtx(); return r; }; }

// ---------------------------------------------------------------- the builder: a level switch, and a Stairs tool
ED.lv=0;
const LV_NAMES=v=>v===0?"Ground":v<0?(v>=-3.3?"Basement":`Basement ${Math.round(-v/3.2)}`):(v<=3.3?"Upstairs":`Floor ${Math.round(v/3.2)+1}`);
function edLevels(){ const s=new Set([0,ED.lv]); for(const o of ED.doc.objects){ s.add(lvOf(o)); if(o.type==="stairs") s.add(lvOf(o)+(+o.rise||LV.rise)); } return [...s].sort((a,b)=>a-b); }
// while the plan is drawn, clicked or edited, it sees only the current level's objects (plus the stairs coming up into it);
// what's added lands on that level
function edScoped(fn){ return function(...a){ if(ED._sc||!ED.doc) return fn.apply(this,a); const L=ED.lv, doc=ED.doc, all=doc.objects;
    if(!L&&!all.some(o=>o.lv||o.type==="stairs")) return fn.apply(this,a);
    const sub=all.filter(o=>lvOf(o)===L||(o.type==="stairs"&&Math.abs(lvOf(o)+(+o.rise||LV.rise)-L)<0.05)); doc.objects=sub; ED._sc=true;
    try{ return fn.apply(this,a); }
    finally{ ED._sc=false; if(ED.doc===doc){ const cur=doc.objects, cs=new Set(cur), ss=new Set(sub), as=new Set(all);
        let out=all.filter(o=>!ss.has(o)||cs.has(o)); const added=cur.filter(o=>!as.has(o)); for(const o of added){ if(L&&o.lv===undefined) o.lv=L; }
        if(added.some(o=>o.type==="spawn")) out=out.filter(o=>o.type!=="spawn"); doc.objects=out.concat(added); }
      else if(doc.objects===sub){ /* the doc was replaced (undo/redo); the old one is gone */ } } }; }
for(const nm of ["edToolDown","edToolMove","edToolUp","edEndChain","planHit","drawPlan","edNearestWall","edMakeRect","edRoofFit","edRoofFor","edDelete","edDuplicate"]){
  const f=globalThis[nm]; if(typeof f==="function") globalThis[nm]=edScoped(f); }
// new things land on the current level; heights of lights and cameras are kept relative to it
{ const a0=edAdd; edAdd=function(o){ const L=ED.lv||0;
    if(L&&o.lv===undefined){ o.lv=L; if(o.type==="light") o.y=+ED.opts.light.height; if(o.type==="camera"){ o.y=+ED.opts.camera.height; if(o.look) o.look[1]=0.8; } if(o.type==="floor") o.y=0; }
    return a0(o); }; }
// the 3D view shows the current level and those under it (what's above is hidden so you can see in)
{ const r0=edDoRebuild; edDoRebuild=function(){ r0(); if(!world||!ED.doc) return; const L=ED.lv||0, lvById={}; for(const o of ED.doc.objects) lvById[o.id]=lvOf(o);
    const hide=c=>{ const id=c.userData.oid; if(id!==undefined&&lvById[id]!==undefined&&lvById[id]>L+0.05) c.visible=false; };
    for(const c of world.group.children) hide(c); for(const c of ED.helpers.children) hide(c); }; }
function edSetLevel(v){ ED.lv=+v||0; LV.ref=ED.lv+0.05; ED.sel=null; ED.selOp=null; ED.draft=null; edLevelUI(); edRebuild(true); edRenderInspector(); ED.planDirty=true; edStatusMsg(`Building on: ${LV_NAMES(ED.lv)} (${ED.lv.toFixed(1)} m)`); }
function edLevelUI(){ let box=$("edLvBox"); const tools=$("edTools"); if(!tools) return;
  if(!box){ box=H("div",{id:"edLvBox",style:"flex:0 0 auto;width:96px;max-width:100%;overflow:hidden;box-sizing:border-box;display:flex;flex-direction:column;gap:2px;padding:2px;font:10px monospace;color:#b8ae98"}); }
  if(box.parentNode!==tools||tools.firstChild!==box) tools.insertBefore(box,tools.firstChild);
  box.innerHTML=""; box.appendChild(H("span",{text:"LEVEL",style:"line-height:10px"}));
  const sel=H("select",{id:"edLv",title:"Which level you're building on",style:"width:100%;height:22px;font:10px monospace;box-sizing:border-box"});
  for(const v of edLevels().reverse()) sel.appendChild(H("option",{value:String(v),text:v===0?"Ground":v>0?`Up ${Math.round(v/3.2)}`:`Down ${Math.round(-v/3.2)}`, title:`${LV_NAMES(v)} (${v.toFixed(1)} m)`}));
  sel.value=String(ED.lv||0); sel.onchange=()=>{ edSetLevel(sel.value); sel.blur(); }; box.appendChild(sel);
  const row=H("div",{style:"display:flex;gap:3px"}); const lv=edLevels();
  row.appendChild(H("button",{text:"+↑",title:"Start a new level above the top one",style:"flex:1;height:16px;padding:0;font:10px monospace",onclick:()=>edSetLevel(+(lv[lv.length-1]+LV.rise).toFixed(2))}));
  row.appendChild(H("button",{text:"+↓",title:"Start a basement under the lowest level",style:"flex:1;height:16px;padding:0;font:10px monospace",onclick:()=>edSetLevel(+(lv[0]-LV.rise).toFixed(2))}));
  box.appendChild(row); }
{ const i0=edInitUI; edInitUI=function(...a){ const r=i0.apply(this,a); edLevelUI(); return r; }; }
{ const l0=edAfterLoad; edAfterLoad=function(...a){ if(ED.doc&&!edLevels().includes(ED.lv)) ED.lv=0; LV.ref=(ED.lv||0)+0.05; const r=l0.apply(this,a); edLevelUI(); return r; }; }
{ const s0=edStatus; edStatus=function(){ s0(); const el=$("edStatus"); if(el&&ED.doc&&(ED.lv||edLevels().length>1)) el.insertAdjacentHTML("afterbegin",`<span>level <b>${LV_NAMES(ED.lv||0)}</b></span>`); }; }
