// ================================================================ sandbox runtime: maps → worlds, terrain, items, play/build
const D2R=Math.PI/180, R2D=180/Math.PI;
const SB = {ready:false, helpSeen:false, inv:false, toastT:0};
const sbUid = p => p + Math.random().toString(36).slice(2,8);
const sbClone = o => JSON.parse(JSON.stringify(o));
tagLayer.id = "tags";

// ---------------------------------------------------------------- textures (the Map Designer's library)
const SBTEX = {};
const sbTexBase = {};
function sbInitTextures(){
  const gen = SB_GEN_TEXTURES();
  for(const [id,t] of Object.entries(gen)) SBTEX[id] = {id, name:t.name, src:t.canvas, m:[1,1], ready:true};
  const jobs=[];
  for(const [k,info] of Object.entries(LIB_TEXTURES)){
    const id="b:"+k, t=SBTEX[id]||(SBTEX[id]={id, name:k.replace(/_/g," "), m:[1,1], ready:false});
    if(info.m) t.m=info.m; t.set=info.set;
    jobs.push(new Promise(res=>{ const im=new Image(); im.onload=()=>{ t.src=im; t.ready=true; res(); }; im.onerror=()=>res(); im.src=info.src; }));
  }
  return Promise.all(jobs).then(()=>{ for(const t of Object.values(SBTEX)) if(t.ready) t.avg=sbAvg(t.src); });
}
function sbAvg(src){ try{ const c=document.createElement("canvas"); c.width=c.height=4; const g=c.getContext("2d"); g.drawImage(src,0,0,4,4); const d=g.getImageData(0,0,4,4).data; let r=0,gg=0,b=0; for(let i=0;i<d.length;i+=4){ r+=d[i]; gg+=d[i+1]; b+=d[i+2]; } const n=d.length/4; return "#"+[r,gg,b].map(v=>Math.round(v/n).toString(16).padStart(2,"0")).join(""); }catch(e){ return "#777777"; } }
function sbAddDocTextures(doc){
  const jobs=[];
  for(const t of doc.textures||[]){ if(!t||!t.id||!t.data) continue; if(SBTEX[t.id]&&SBTEX[t.id].data===t.data) continue;
    const rec=SBTEX[t.id]={id:t.id, name:"★ "+(t.name||t.id), m:t.m||[1,1], ready:false, data:t.data}; delete sbTexBase[t.id];
    jobs.push(new Promise(res=>{ const im=new Image(); im.onload=()=>{ rec.src=im; rec.ready=true; rec.avg=sbAvg(im); res(); }; im.onerror=()=>res(); im.src=t.data; })); }
  return Promise.all(jobs);
}
function sbTex(id, rx, ry){
  const t=SBTEX[id]; if(!t||!t.ready) return null;
  let b=sbTexBase[id]; if(!b){ b = t.src instanceof HTMLCanvasElement ? new THREE.CanvasTexture(t.src) : new THREE.Texture(t.src); b.magFilter=b.minFilter=THREE.NearestFilter; b.wrapS=b.wrapT=THREE.RepeatWrapping; b.needsUpdate=true; sbTexBase[id]=b; }
  const c=b.clone(); c.needsUpdate=true; const m=t.m||[1,1]; c.repeat.set(Math.max(0.05,rx/m[0]), Math.max(0.05,ry/m[1])); return c;
}
const sbMatCache = new Map();
function sbGrey(c){ const x=new THREE.Color(hexStr(c||"#888888")); const l=0.299*x.r+0.587*x.g+0.114*x.b; return 0.3+l*0.45; }
function texMat(id, rx, ry, color){ const g=Math.round(sbGrey(color)*40)/40; const key="grey|"+g; let m=sbMatCache.get(key); if(!m){ m=new THREE.MeshLambertMaterial({color:new THREE.Color(g,g,g)}); sbMatCache.set(key,m); } return m; }
function texMatOld(id, rx, ry, color){
  const key=id+"|"+(Math.round(rx*20)/20)+"|"+(Math.round(ry*20)/20)+"|"+color;
  let m=sbMatCache.get(key); if(m) return m;
  const tx=id?sbTex(id,rx,ry):null; m=new THREE.MeshLambertMaterial({color: tx?0xffffff:hexNum(color||"#888888"), map:tx});
  sbMatCache.set(key,m); return m;
}
function sbTexAvg(id, fallback){ const t=SBTEX[id]; return t&&t.avg ? t.avg : fallback; }
function sbTexOptions(none){ const o=[["",none||"(plain colour)"]]; for(const t of Object.values(SBTEX)) if(t.ready) o.push([t.id, t.name]); return o; }

// ---------------------------------------------------------------- assets (the Map Designer's model library)
function sbAsset(id){ return LIB_ASSETS[id] || ((ED.doc&&ED.doc.assets)||[]).find(a=>a.id===id) || null; }
function sbAssetList(){ const out=Object.entries(LIB_ASSETS).map(([id,a])=>Object.assign({id},a)); for(const a of (ED.doc&&ED.doc.assets)||[]) out.push(Object.assign({cat:"custom"},a)); return out; }
function sbPartMesh(p){
  let geo; const [w,h,d]=p.d; const sg=clamp(p.seg||8,3,24);
  if(p.s==="box") geo=new THREE.BoxGeometry(w,h,d);
  else if(p.s==="cyl"){ geo=new THREE.CylinderGeometry(w/2,w/2,h,sg); if(w>0&&Math.abs(d-w)>1e-4) geo.scale(1,1,d/w); }
  else if(p.s==="cone"){ geo=new THREE.ConeGeometry(w/2,h,sg); if(w>0&&Math.abs(d-w)>1e-4) geo.scale(1,1,d/w); }
  else if(p.s==="sphere"){ geo=new THREE.SphereGeometry(0.5,sg,Math.max(4,Math.round(sg*0.66))); geo.scale(w,h,d); }
  else if(p.s==="wedge"){ geo=new THREE.BufferGeometry(); const x=w/2,y=h/2,z=d/2; const v=[-x,-y,-z,x,-y,-z,x,-y,z,-x,-y,z,-x,y,z,x,y,z]; geo.setAttribute("position",new THREE.Float32BufferAttribute(v,3)); geo.setIndex([0,1,2,0,2,3,3,2,5,3,5,4,0,4,5,0,5,1,0,3,4,1,5,2]); geo.computeVertexNormals(); }
  else geo=new THREE.BoxGeometry(w,h,d);
  const rep=p.tr||Math.max(1,Math.round(Math.max(w,h,d)/0.7));
  const m=new THREE.Mesh(geo, texMat(p.t||"", rep, rep, p.c||"#888888"));
  m.position.set(...p.p); m.rotation.set((p.r[0]||0)*D2R,(p.r[1]||0)*D2R,(p.r[2]||0)*D2R); return m;
}
// furniture is one grey box the size of the real model (trees: a trunk and a cone); searchable things get a gold strip on top
const SB_GOLD=new THREE.MeshBasicMaterial({color:0xc9a24a});
function sbAssetGroup(id, opts={}){
  const g=new THREE.Group(), a=sbAsset(id); if(!a) return g;
  if(a.parts){ for(const p of a.parts) g.add(sbPartMesh(p)); return g; }
  const [x0,x1,y0,y1,z0,z1]=a.bb, w=Math.max(0.05,x1-x0), h=Math.max(0.03,y1-y0), d=Math.max(0.05,z1-z0);
  if(/^tree/.test(id)){ const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.14,h*0.55,6),texMat("",1,1,"#5a5550")); tr.position.y=h*0.275; g.add(tr);
    const cn=new THREE.Mesh(new THREE.ConeGeometry(Math.min(w,d)*0.45,h*0.7,6),texMat("",1,1,"#3e423c")); cn.position.y=h*0.62; g.add(cn); return g; }
  const gr=Math.round((a.g||0.55)*40)/40*(opts.push?1.18:1), m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshLambertMaterial({color:new THREE.Color(gr,gr,gr)}));
  m.position.set((x0+x1)/2,y0+h/2,(z0+z1)/2); g.add(m);
  if(opts.search){ const s=new THREE.Mesh(new THREE.BoxGeometry(w*0.9,0.02,Math.min(0.08,d*0.4)),SB_GOLD); s.position.set((x0+x1)/2,y0+h+0.011,(z0+z1)/2); s.userData.glint=true; g.add(s); }
  return g; }
const sbBoundsCache={};
function sbAssetBounds(id){
  if(sbBoundsCache[id]) return sbBoundsCache[id];
  const la=LIB_ASSETS[id]; if(la&&la.bb){ const b=la.bb; return sbBoundsCache[id]={minX:b[0],maxX:b[1],minY:b[2],maxY:b[3],minZ:b[4],maxZ:b[5]}; }
  const g=sbAssetGroup(id); g.updateMatrixWorld(true); const b=new THREE.Box3().setFromObject(g);
  const r = b.isEmpty() ? {minX:-.3,maxX:.3,minY:0,maxY:.6,minZ:-.3,maxZ:.3} : {minX:b.min.x,maxX:b.max.x,minY:b.min.y,maxY:b.max.y,minZ:b.min.z,maxZ:b.max.z};
  g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); return sbBoundsCache[id]=r;
}
// where a prop's footprint lands in the world (axis-aligned box around the turned model)
function sbPropFoot(o){
  const a=sbAsset(o.asset), B=a?sbAssetBounds(o.asset):{minX:-.3,maxX:.3,minY:0,maxY:.6,minZ:-.3,maxZ:.3};
  const s=+o.scale||1, sx=s*(o.sx||1), sy=s*(o.sy||1), sz=s*(o.sz||1), th=(o.rot||0)*D2R, c=Math.cos(th), sn=Math.sin(th);
  const pts=[[B.minX,B.minZ],[B.maxX,B.minZ],[B.maxX,B.maxZ],[B.minX,B.maxZ]].map(([x,z])=>{ x*=sx; z*=sz; return [o.x+x*c+z*sn, o.z-x*sn+z*c]; });
  const xs=pts.map(p=>p[0]), zs=pts.map(p=>p[1]);
  return {pts, x0:Math.min(...xs), x1:Math.max(...xs), z0:Math.min(...zs), z1:Math.max(...zs), h:B.maxY*sy, a};
}
const PUSH_RE=/wardrobe|shelf|dresser|cabinet|crate|box|desk|table|couch|sofa|chair|chest|trunk|locker|barrel|nightstand|armoire|hutch|sideboard|bookcase|cooler|trash|wheelbarrow|toolchest/;
function sbBox(f){ Object.defineProperties(f,{x0:{get(){return this.x-this.w/2}},x1:{get(){return this.x+this.w/2}},z0:{get(){return this.z-this.d/2}},z1:{get(){return this.z+this.d/2}}}); return f; }
function placeBoxMesh(b){ if(b.place) b.place(b); else b.mesh.position.set(b.x,(b.y0||0)+b.h/2,b.z); }

// ---------------------------------------------------------------- terrain
const GROUND=[{name:"Packed earth",c:"#4a3f33"},{name:"Grass",c:"#3e4a2e"},{name:"Dry grass",c:"#6a6440"},{name:"Mud",c:"#33281f"},{name:"Gravel",c:"#66625a"},{name:"Sand",c:"#9a8a68"},{name:"Snow",c:"#c4c8cc"},{name:"Asphalt",c:"#2e3033"},{name:"Concrete",c:"#6e6e68"},{name:"Leaf litter",c:"#5a3e22"},{name:"Moss",c:"#3a4a28"},{name:"Ash",c:"#3a3836"}];
function terrainMake(x0,z0,w,d,cell=1,paint=1){ const nx=Math.round(w/cell)+1, nz=Math.round(d/cell)+1; return {on:true,x0,z0,cell,nx,nz,h:new Array(nx*nz).fill(0),p:new Array(nx*nz).fill(paint)}; }
function terrainFix(T){ if(!T) return null; const n=T.nx*T.nz; if(!Array.isArray(T.h)||T.h.length!==n) T.h=new Array(n).fill(0); if(!Array.isArray(T.p)||T.p.length!==n) T.p=new Array(n).fill(1); return T; }
function tSample(T,x,z){ const fx=clamp((x-T.x0)/T.cell,0,T.nx-1), fz=clamp((z-T.z0)/T.cell,0,T.nz-1); const i=Math.min(T.nx-2,Math.floor(fx)), j=Math.min(T.nz-2,Math.floor(fz)), u=fx-i, v=fz-j, H=T.h, n=T.nx; return (H[j*n+i]*(1-u)+H[j*n+i+1]*u)*(1-v)+(H[(j+1)*n+i]*(1-u)+H[(j+1)*n+i+1]*u)*v; }
function tEach(T,cx,cz,r,fn){ const i0=Math.max(0,Math.floor((cx-r-T.x0)/T.cell)), i1=Math.min(T.nx-1,Math.ceil((cx+r-T.x0)/T.cell)), j0=Math.max(0,Math.floor((cz-r-T.z0)/T.cell)), j1=Math.min(T.nz-1,Math.ceil((cz+r-T.z0)/T.cell));
  for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const x=T.x0+i*T.cell, z=T.z0+j*T.cell, d=Math.hypot(x-cx,z-cz); if(d<=r) fn(j*T.nx+i,d,x,z); } }
const vhash = i => { let x=Math.imul(i^0x9e3779b9, 0x85ebca6b); x^=x>>>13; x=Math.imul(x,0xc2b2ae35); x^=x>>>16; return (x>>>0)/4294967296; };
let sbGreyTex=null;
function terrainMesh(T){
  const n=T.nx*T.nz, pos=new Float32Array(n*3), col=new Float32Array(n*3), uv=new Float32Array(n*2), idx=[];
  for(let j=0;j<T.nz;j++) for(let i=0;i<T.nx;i++){ const k=j*T.nx+i; pos[k*3]=T.x0+i*T.cell; pos[k*3+2]=T.z0+j*T.cell; uv[k*2]=pos[k*3]/2; uv[k*2+1]=pos[k*3+2]/2; }
  for(let j=0;j<T.nz-1;j++) for(let i=0;i<T.nx-1;i++){ const a=j*T.nx+i, b=a+1, c=a+T.nx, d=c+1; idx.push(a,c,b,b,c,d); }
  const g=new THREE.BufferGeometry(); g.setAttribute("position",new THREE.BufferAttribute(pos,3)); g.setAttribute("color",new THREE.BufferAttribute(col,3)); g.setAttribute("uv",new THREE.BufferAttribute(uv,2)); g.setIndex(idx);
  if(!sbGreyTex){ sbGreyTex=noiseTex("#9a9a9a","#8a8a8a",4,1); }
  const m=new THREE.Mesh(g,new THREE.MeshLambertMaterial({vertexColors:true, map:sbGreyTex, flatShading:true}));
  m.userData.terrain=true; terrainRefresh(T,m); return m;
}
function terrainRefresh(T,m){
  m=m||T.mesh; if(!m) return; const pos=m.geometry.attributes.position, col=m.geometry.attributes.color, c=new THREE.Color();
  for(let k=0;k<T.nx*T.nz;k++){ pos.array[k*3+1]=T.h[k]-0.015;
    const i=k%T.nx, j=(k/T.nx)|0, hx=T.h[j*T.nx+Math.min(T.nx-1,i+1)]-T.h[j*T.nx+Math.max(0,i-1)], hz=T.h[Math.min(T.nz-1,j+1)*T.nx+i]-T.h[Math.max(0,j-1)*T.nx+i];
    const slope=Math.hypot(hx,hz)/(2*T.cell); const sh=clamp(1.05-slope*0.35+(hx+hz)*0.08,0.55,1.25)*(0.86+vhash(k)*0.28);
    const gy=0.3*sh; col.array[k*3]=gy; col.array[k*3+1]=gy; col.array[k*3+2]=gy*1.04; }
  pos.needsUpdate=true; col.needsUpdate=true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); m.geometry.computeBoundingBox();
}
function buildTerrain(T){
  world.terrain=null; if(!T||!T.on) return; terrainFix(T);
  world.terrain={x0:T.x0,z0:T.z0,cell:T.cell,nx:T.nx,nz:T.nz,h:T.h,p:T.p};
  const m=terrainMesh(world.terrain); world.terrain.mesh=m; world.group.add(m); world.blockers.push(m);
}
function terrainHills(T, amount=1.5, seed=Math.random()*1000){
  const r=mulberry(seed*1000|0), ph=[r()*6,r()*6,r()*6,r()*6], f=[0.09+r()*0.05,0.17+r()*0.08,0.33+r()*0.1];
  for(let j=0;j<T.nz;j++) for(let i=0;i<T.nx;i++){ const x=T.x0+i*T.cell, z=T.z0+j*T.cell;
    T.h[j*T.nx+i]+= amount*(Math.sin(x*f[0]+ph[0])*Math.cos(z*f[0]*0.9+ph[1]) + 0.45*Math.sin(x*f[1]+z*f[1]*0.7+ph[2]) + 0.2*Math.cos(z*f[2]-x*f[2]*0.6+ph[3])); }
}

// ---------------------------------------------------------------- the item catalog (the Item Modeler's items, plus a few)
const ITEMS = {
  ammo:{name:".38 rounds", cat:"ammo", col:"#c09040", qty:6, desc:"Loose .38 cartridges. They go straight into Norah's pocket for reloading."},
  pills:{name:"Pills", cat:"health", col:"#d8701c", heal:"pillHeal", desc:"An orange prescription bottle, a few left. Takes the edge off. (Heals a little.)"},
  bandage:{name:"Bandage", cat:"health", col:"#e8e2d4", heal:"bandageHeal", desc:"A roll of gauze and tape. (Heals a little.)"},
  firstaid:{name:"First aid kit", cat:"health", col:"#b03a2a", heal:"kitHeal", desc:"A dented tin first aid kit. (Heals a lot.)"},
  flashlight:{name:"Flashlight", cat:"tool", col:"#3a3c40", light:1, desc:"A heavy metal flashlight. The beam is yellow and doesn't reach far. L turns it on and off. Its light makes Norah easier to see."},
  flashlight_dead:{name:"Flashlight (no batteries)", cat:"tool", col:"#3a3c40", light:0, desc:"A heavy metal flashlight. Clicks. Nothing."},
  batteries:{name:"D batteries", cat:"tool", col:"#c9922a", charge:1, desc:"Two D batteries. A full charge for the flashlight."},
  battery_half:{name:"Battery (half charge)", cat:"tool", col:"#8a8a8a", charge:0.5, desc:"Half a charge, maybe."},
  key:{name:"Key", cat:"key", col:"#b0b4ba", desc:"A key. A locked door or exit that names this key opens with it."},
  house_keys:{name:"House keys", cat:"key", col:"#c09a48", desc:"Front door and back door. The brass one sticks."},
  truck_keys:{name:"Truck keys", cat:"key", col:"#9a1e1a", desc:"A ring of keys on a red fob."},
  note:{name:"Note", cat:"document", col:"#e6dfcc", desc:"A folded note."},
  journal:{name:"Norah's journal", cat:"document", col:"#5a3424", desc:"Addie's week, Pickle, work, Louis and the porch step."},
  photo:{name:"Photo", cat:"document", col:"#f0ece0", desc:"An instant photo, a little curled."},
  rosary:{name:"Louis's Rosary", cat:"keepsake", col:"#6a4630", desc:"Worn smooth. A paper tag: \"Rose's. For keeping.\""},
  custom:{name:"Item", cat:"misc", col:"#8a8478", desc:"Something worth keeping."}
};
const LOOT = [["ammo",5],["ammo",3],["pills",1],["bandage",1],["batteries",1],["battery_half",1],["firstaid",1],["ammo",8]];
function itemDef(key){
  if(ITEMS[key]) return ITEMS[key];
  const c=((ED.doc&&ED.doc.customItems)||[]).find(c=>c.key===key);
  if(c) return {name:c.name||key, cat:c.cat||"misc", col:c.col||"#8a8478", desc:c.desc||""};
  return {name:key, cat:"misc", col:"#8a8478", desc:""};
}
function itemOptions(){ const o=Object.entries(ITEMS).map(([k,d])=>[k,d.name]); for(const c of (ED.doc&&ED.doc.customItems)||[]) o.push([c.key,"★ "+(c.name||c.key)]); return o; }
function entryName(e){ const d=itemDef(e.item); return (e.name&&String(e.name).trim()) || d.name; }
function entryLabel(e){ const n=entryName(e); return (e.qty||1)>1 ? `${n} ×${e.qty}` : n; }

// ---------------------------------------------------------------- building a world from a map
const SB_MAXLIGHTS = 20;
const ENV_DEF = {sky:"#07080a", fogColor:"", fog:0.045, hemi:0.55, moon:0.5, dark:"", fill:false, fillI:0.8};
function sbEnv(doc){ const E=Object.assign({},ENV_DEF,doc.env||{}); if(!E.fogColor) E.fogColor=E.sky; return E; }
function sbTagged(o, fn){ const n0=world.group.children.length; const r=fn(); const ch=world.group.children; for(let i=n0;i<ch.length;i++) ch[i].traverse(c=>{ c.userData.oid=o.id; }); return r; }
function docBounds(doc){
  let x0=1e9,x1=-1e9,z0=1e9,z1=-1e9; const g=(x,z)=>{ if(!isFinite(x)||!isFinite(z)) return; x0=Math.min(x0,x); x1=Math.max(x1,x); z0=Math.min(z0,z); z1=Math.max(z1,z); };
  for(const o of doc.objects){
    if(o.type==="wall"){ g(o.a[0],o.a[1]); g(o.b[0],o.b[1]); }
    else if(o.type==="floor"){ g(o.x,o.z); g(o.x+o.w,o.z+o.d); }
    else if(o.type==="block"){ g(o.x-o.w/2,o.z-o.d/2); g(o.x+o.w/2,o.z+o.d/2); }
    else if(o.type==="path") for(const p of o.points||[]) g(p[0],p[1]);
    else if(typeof o.x==="number") g(o.x,o.z);
  }
  const T=doc.terrain; if(T&&T.on){ g(T.x0,T.z0); g(T.x0+(T.nx-1)*T.cell, T.z0+(T.nz-1)*T.cell); }
  if(x0>x1){ x0=-10;x1=10;z0=-10;z1=10; }
  return {x0,x1,z0,z1};
}
function buildFromDoc(doc, forEditor){
  newWorld(); world.name="doc"; activeCam=null; sbLights=0;
  const E=sbEnv(doc);
  scene.background.set(E.sky); scene.fog.color.set(E.fogColor); scene.fog.density = forEditor ? (edPrefs.fog?E.fog:0) : E.fog;
  hemi.intensity=+E.hemi; moon.intensity=+E.moon; world.ambient = (E.dark===""||E.dark===null||E.dark===undefined) ? null : +E.dark;
  buildTerrain(doc.terrain);
  for(const o of doc.objects) if(o.type==="floor") sbTagged(o,()=>addFloor(o.x,o.z,o.x+o.w,o.z+o.d,"#3c3c3c","#444444",{y:+o.y||0}));
  const B=docBounds(doc); world.bounds={x0:B.x0-1,x1:B.x1+1,z0:B.z0-1,z1:B.z1+1};
  world.spawn={x:(B.x0+B.x1)/2, z:(B.z0+B.z1)/2, yaw:Math.PI};
  for(const o of doc.objects){ if(o.type==="floor") continue; try{ sbTagged(o,()=>sbBuildObj(o)); }catch(err){ console.warn("couldn't build",o,err); } }
  if(!world.cams.length){ const b=world.bounds, cx=(b.x0+b.x1)/2, cz=(b.z0+b.z1)/2; addCam(b.x0+0.6,3.6,b.z0+0.6,cx,0.6,cz); addCam(b.x1-0.6,3.6,b.z1-0.6,cx,0.6,cz); addCam(b.x1-0.6,3.6,b.z0+0.6,cx,0.6,cz); addCam(b.x0+0.6,3.6,b.z1-0.6,cx,0.6,cz); }
  if(E.fill){ const b=world.bounds; const l=new THREE.PointLight(0xffc080,+E.fillI||0.8,Math.max(30,(b.x1-b.x0+b.z1-b.z0))); l.position.set((b.x0+b.x1)/2,4,(b.z0+b.z1)/2); world.group.add(l); }
}
let sbLights=0;
function sbLight(x,y,z,col,i,r){ if(sbLights>=SB_MAXLIGHTS){ world.lightCapped=true; return null; } sbLights++; return addLight(x,y,z,col,i,r); }
function sbBuildObj(o){
  switch(o.type){
    case "wall": { const mx=(o.a[0]+o.b[0])/2, mz=(o.a[1]+o.b[1])/2;
      const ops=(o.openings||[]).map(op=>({kind:op.kind||"door",at:+op.at,width:+op.width||1,sill:op.sill,top:op.top,hinge:op.hinge,side:op.side===-1?-1:1,closed:!!op.closed,locked:!!op.locked,key:op.key||""}));
      addWall(o.a[0],o.a[1],o.b[0],o.b[1],+o.height||2.8,+o.thick||0.2,o.weak?0x8a7e6a:0x6a6a6a,ops,{tex:o.tex,texB:o.texB,scale:+o.scale||1,base:groundY(mx,mz),skirt:!!world.terrain,weak:!!o.weak}); break; }
    case "block": { const b=addBox(o.x,o.z,+o.w||1,+o.d||1,+o.h||1,o.push?0x8c8c8c:0x6e6e6e,!!o.push,o.name||"",{}); if(o.search) sbContainer(o,b,o.name||"crate"); break; }
    case "pillar": addPillar(o.x,o.z,+o.r||0.4,+o.h||3,0x707070); break;
    case "corpse": addCorpse(o.x,o.z,(o.yaw||0)*D2R); break;
    case "light": sbLight(o.x,o.y??2.6,o.z,hexNum(o.color||"#ffb060"),+(o.intensity??1),+(o.dist??8)); break;
    case "camera": { const L=o.look||[o.x,0.8,o.z-3]; addCam(o.x,o.y??2.8,o.z,L[0],L[1],L[2],o.track!==false,+o.fov||60); break; }
    case "prop": sbBuildProp(o); break;
    case "item": sbBuildPickup(o); break;
    case "exit": sbBuildExit(o); break;
    case "path": sbBuildPath(o); break;
    case "spawn": world.spawn={x:o.x,z:o.z,yaw:(o.yaw||0)*D2R}; break;
    case "enemy": world.enemySpawns.push({x:o.x,z:o.z,type:o.kind||"across",o}); break;
  }
}
function sbBuildProp(o){
  const F=sbPropFoot(o), a=F.a; const s=+o.scale||1;
  const pushPre=(o.push===undefined||o.push==="auto")?(PUSH_RE.test((o.asset||"")+" "+String(o.name||(a?a.name:"")).toLowerCase())&&F.h<2.3):!!o.push;
  let g; if(a) g=sbAssetGroup(o.asset,{push:pushPre,search:!!o.search}); else { g=new THREE.Group(); const m=new THREE.Mesh(new THREE.BoxGeometry(0.6,0.6,0.6),M(0x8a8478)); m.position.y=0.3; g.add(m); }
  g.scale.set(s*(o.sx||1),s*(o.sy||1),s*(o.sz||1)); g.rotation.y=(o.rot||0)*D2R;
  const y0=groundY(o.x,o.z)+(+o.y||0); g.position.set(o.x,y0,o.z); world.group.add(g);
  if(a&&a.light&&o.light!==false){ const L=a.light, th=(o.rot||0)*D2R, lx=L.p[0]*s*(o.sx||1), lz=L.p[2]*s*(o.sz||1);
    sbLight(o.x+lx*Math.cos(th)+lz*Math.sin(th), y0+L.p[1]*s*(o.sy||1), o.z-lx*Math.sin(th)+lz*Math.cos(th), hexNum(L.color||"#ffd8a0"), (L.energy||1)*1.4, (L.range||4)*1.6*s); }
  const fw=F.x1-F.x0, fd=F.z1-F.z0, nm=String(o.name||(a?a.name:o.asset)||"thing").toLowerCase().split(/[,(]/)[0].trim();
  const auto=!(a&&a.solid===false) && F.h>0.2 && fw*fd>0.03;
  const solid=(o.solid===undefined||o.solid==="auto")?auto:!!o.solid;
  const push=(o.push===undefined||o.push==="auto")?(PUSH_RE.test((o.asset||"")+" "+nm)&&F.h<2.3):!!o.push;
  let b=null;
  if(solid && /^tree/.test(o.asset||"")){ // trees block with the trunk only, not the whole canopy
    const tw=0.45*s; g.traverse(m=>{ if(m.isMesh) world.blockers.push(m); }); world.circles.push({x:o.x,z:o.z,r:tw/2});
  } else if(solid){ g.traverse(m=>{ if(m.isMesh) world.blockers.push(m); });
    b=sbBox({x:(F.x0+F.x1)/2,z:(F.z0+F.z1)/2,w:fw,d:fd,h:F.h,y0,mesh:g,push,name:nm,under:/bed|table|desk|pew|gurney|bench/.test(nm)&&F.h>=0.5});
    b.ox=b.x-o.x; b.oz=b.z-o.z; b.place=bb=>g.position.set(bb.x-bb.ox,bb.y0,bb.z-bb.oz); world.boxes.push(b); }
  if(o.search) sbContainer(o, b||sbBox({x:(F.x0+F.x1)/2,z:(F.z0+F.z1)/2,w:fw,d:fd,h:F.h,y0,name:nm}), nm);
}
function sbGlint(){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(0.035,0), new THREE.MeshBasicMaterial({color:0xfff0c0,transparent:true,opacity:0.9,depthWrite:false})); m.userData.glint=true; return m; }
function sbContainer(o, box, name){
  const gl=sbGlint(); gl.visible=false; world.group.add(gl);
  world.containers.push({oid:o.id, name, items:sbClone(o.items||[]), searched:false, box, glint:gl});
}
function sbBuildPickup(o){
  const d=itemDef(o.item), g=new THREE.Group(); const y=groundY(o.x,o.z);
  const shape = d.cat==="health" ? new THREE.CylinderGeometry(0.045,0.045,0.11,8) : d.cat==="key" ? new THREE.TorusGeometry(0.04,0.012,4,10) : d.cat==="document" ? new THREE.BoxGeometry(0.16,0.012,0.21) : new THREE.BoxGeometry(0.12,0.07,0.09);
  const m=new THREE.Mesh(shape,M(hexNum(d.col||"#8a8478"))); m.position.y = d.cat==="key"?0.015:d.cat==="document"?0.008:0.05; if(d.cat==="key") m.rotation.x=Math.PI/2; m.rotation.y=(o.yaw||((o.x*7+o.z*3)%6)); g.add(m);
  const gl=sbGlint(); gl.position.y=0.3; g.add(gl); g.position.set(o.x,y,o.z); world.group.add(g);
  world.pickups.push({oid:o.id, x:o.x, z:o.z, g, glint:gl, entry:{item:o.item,qty:+o.qty||1,name:o.name||"",text:o.text||""}, taken:false});
}
function sbBuildExit(o){
  const y=groundY(o.x,o.z), r=+o.r||0.8;
  const ring=new THREE.Mesh(new THREE.RingGeometry(0.9,1,40), new THREE.MeshBasicMaterial({color:0x60ff80,transparent:true,opacity:0.7,depthWrite:false,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2; ring.position.set(o.x,y+0.03,o.z); ring.scale.set(r,r,1); world.group.add(ring);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(1,24), new THREE.MeshBasicMaterial({color:0x2a6a34,transparent:true,opacity:0.25,depthWrite:false})); disc.rotation.x=-Math.PI/2; disc.position.set(o.x,y+0.02,o.z); disc.scale.set(r,r,1); world.group.add(disc);
  sbLight(o.x,y+1.6,o.z,0x60ff80,0.6,3.5);
  world.exits.push({x:o.x,z:o.z,r,needs:(o.needs||"").trim(),label:o.label||"the exit",warned:0});
}
function sbBuildPath(o){
  const P=o.points||[], w=+o.width||1.6;
  for(let i=0;i<P.length-1;i++){ const [ax,az]=P[i], [bx,bz]=P[i+1], L=Math.hypot(bx-ax,bz-az); if(L<0.01) continue;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(L+w*0.3,w), texMat("",1,1,"#3a3a3a"));
    m.rotation.order="YXZ"; m.rotation.y=-Math.atan2(bz-az,bx-ax); m.rotation.x=-Math.PI/2; const mx=(ax+bx)/2, mz=(az+bz)/2; m.position.set(mx,groundY(mx,mz)+0.006+i*0.0005,mz); world.group.add(m); }
}

// ---------------------------------------------------------------- items in play: pickups, searching, inventory, flashlight, keys, exits
player.inv=[]; player.flash={has:false,on:false,charge:0}; player.search=null;
const flashSpot=new THREE.SpotLight(0xfff0c8,0,13,0.5,0.45,1.2); const flashTgt=new THREE.Object3D(); flashSpot.target=flashTgt; scene.add(flashSpot); scene.add(flashTgt);
function flashVis(){ return player.flash.on&&player.flash.charge>0 ? CFG.items.flashVis : 0; }
function hasItem(name){ if(!name) return true; const n=String(name).trim().toLowerCase(); return player.inv.some(e=>entryName(e).toLowerCase()===n || e.item===n); }
function giveItem(e, silent){
  const d=itemDef(e.item), q=+e.qty||1;
  if(e.item==="ammo"){ player.spare+=q; if(!silent) log(`+${q} .38 rounds (${player.spare} spare)`,"#e8c77a"); return; }
  if(d.light!==undefined){ player.flash.has=true; player.flash.charge=Math.max(player.flash.charge,d.light); if(player.inv.some(x=>itemDef(x.item).light!==undefined)) { if(!silent) log(`Another flashlight. Took its batteries.`,"#e8c77a"); return; } }
  const same=player.inv.find(x=>x.item===e.item && entryName(x)===entryName(e) && !x.text && !e.text);
  if(same) same.qty=(same.qty||1)+q; else player.inv.push({item:e.item,qty:q,name:e.name||"",text:e.text||""});
  if(!silent) log(`Picked up: ${entryLabel(e)}`,"#e8c77a");
}
function findInteract(){
  if(player.dead||player.grabbed||player.vault) return null;
  const p=player.pos, fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); let best=null, bs=1e9;
  const facing=(dx,dz,d)=> d<0.55 || (dx*fx+dz*fz)/Math.max(d,1e-4)>0.25;
  for(const k of world.pickups){ if(k.taken) continue; const dx=k.x-p.x, dz=k.z-p.z, d=Math.hypot(dx,dz); if(d<CFG.items.pickupRange && facing(dx,dz,d) && d<bs){ bs=d; best={kind:"pickup",k,text:`E: pick up ${entryLabel(k.entry)}`}; } }
  for(const c of world.containers){ if(c.searched) continue; const b=c.box; const cx=clamp(p.x,b.x0,b.x1), cz=clamp(p.z,b.z0,b.z1), dx=cx-p.x, dz=cz-p.z, d=Math.hypot(dx,dz);
    if(d<0.95 && facing(b.x-p.x,b.z-p.z,d) && d+0.2<bs){ bs=d+0.2; best={kind:"search",c,text:`E: search the ${c.name}`}; } }
  if(best) return best;
  for(const d of world.doors){ if(d.broken) continue; const s=doorSeg(d); const mx=(s.ax+s.bx)/2, mz=(s.az+s.bz)/2; const dd=Math.hypot(mx-p.x,mz-p.z); if(dd<1.4&&dd<bs){ bs=dd; best={kind:"door",d,text:d.locked?`E: locked (needs ${d.key||"a key"})${hasItem(d.key)?" · you have it":""}`:d.target>0.01?"E: slam the door":"E: open the door"}; } }
  for(const b of world.boxes){ if(!b.push) continue; const cx=clamp(p.x,b.x0,b.x1), cz=clamp(p.z,b.z0,b.z1); const dx=cx-p.x, dz=cz-p.z, d=Math.hypot(dx,dz); if(d<0.9 && (dx*fx+dz*fz)>d*0.5 && d<bs){ bs=d; best={kind:"push",text:`E: push the ${b.name||"crate"}`}; } }
  return best;
}
function interactFirst(){
  const f=findInteract(); if(!f) return false;
  if(f.kind==="pickup"){ f.k.taken=true; f.k.g.visible=false; giveItem(f.k.entry); SFX.roundIn(0); makeNoise(player.pos.x,player.pos.z,1,"pickup"); return true; }
  if(f.kind==="search"){ player.search={c:f.c,t:0,dur:CFG.items.searchTime*(f.c.items.length?1:0.7),nt:0}; player.vel.set(0,0,0); return true; }
  return false;
}
function updateSearch(dt){
  const S=player.search; if(!S) return; if(isAiming()){ player.search=null; log("Stopped searching","#9a9283"); return; }
  S.t+=dt; S.nt-=dt; if(S.nt<=0){ S.nt=0.45; makeNoise(player.pos.x,player.pos.z,CFG.items.searchNoise,"rummaging"); noise(0.22,0.25,"bandpass",900+Math.random()*900,null,2); }
  if(S.t>=S.dur){ const c=S.c; c.searched=true; player.search=null;
    if(c.items.length){ const names=c.items.map(entryLabel); for(const e of c.items) giveItem(e,true); sbToast(`Found in the ${c.name}: ${names.join(", ")}`); log(`Found in the ${c.name}: ${names.join(", ")}`,"#e8c77a"); SFX.roundIn(0); c.items=[]; }
    else { log(`The ${c.name} is empty`,"#9a9283"); sbToast(`The ${c.name} is empty`); } }
}
function tryUnlock(door){
  if(hasItem(door.key)&&door.key){ door.locked=false; log(`Unlocked with the ${door.key}`,"#9ed08a"); SFX.cylinder(); return true; }
  log(`Locked. ${door.key?"Needs the "+door.key:"It won't budge"}.`,"#e0a070"); SFX.empty(); return false;
}
function toggleFlash(){
  if(!player.flash.has){ log("No flashlight","#7d7668"); return; }
  if(player.flash.charge<=0){ log("*click* The flashlight is dead. Find batteries.","#7d7668"); SFX.empty(); return; }
  player.flash.on=!player.flash.on; SFX.hammer();
}
function itemsTick(dt){
  const F=player.flash, I=CFG.items;
  if(F.on){ F.charge=Math.max(0,F.charge-I.flashDrain*dt); if(F.charge<=0){ F.on=false; log("The flashlight dies","#e0a070"); } }
  const lit=F.on&&F.charge>0&&MODE==="play";
  flashSpot.intensity = lit ? 2.4*Math.min(1,0.25+F.charge*2.5)*(F.charge<0.1&&Math.random()<0.15?0.2:1) : 0;
  if(lit){ const gy=groundY(player.pos.x,player.pos.z); const fixed=isFixed(); const yaw=fixed?player.yaw:camYaw, pit=fixed?-0.12+player.aimHeight*0.25:camPitch;
    const r=new THREE.Vector3(-Math.cos(yaw),0,Math.sin(yaw)); flashSpot.position.set(player.pos.x,1.3+gy+(player.posY||0),player.pos.z).addScaledVector(r,0.18);
    flashTgt.position.copy(flashSpot.position).add(new THREE.Vector3(Math.sin(yaw)*Math.cos(pit),Math.sin(pit),Math.cos(yaw)*Math.cos(pit)).multiplyScalar(5));
    flashSpot.distance=I.flashRange; flashSpot.angle=I.flashAngle*D2R; }
  const t=performance.now()/1000;
  for(const k of world.pickups){ if(k.taken) continue; k.glint.rotation.y=t*2; k.glint.position.y=0.28+Math.sin(t*3+k.x)*0.04; k.glint.material.opacity=0.5+0.4*Math.sin(t*5+k.z); }
  for(const c of world.containers){ const on=I.glints && !c.searched && c.items.length>0 && Math.hypot(c.box.x-player.pos.x,c.box.z-player.pos.z)<5; c.glint.visible=on;
    if(on){ c.glint.position.set(c.box.x,(c.box.y0||0)+(c.box.h||1)+0.18+Math.sin(t*3)*0.03,c.box.z); c.glint.rotation.y=t*2; c.glint.material.opacity=0.45+0.35*Math.sin(t*5); } }
}
function checkExits(){
  if(!run||run.over||player.dead) return;
  for(const ex of world.exits){ if(Math.hypot(player.pos.x-ex.x,player.pos.z-ex.z)>=ex.r) { ex.inside=false; continue; }
    if(ex.needs && !hasItem(ex.needs)){ if(!ex.inside){ ex.inside=true; log(`The way out is shut. You need the ${ex.needs}.`,"#e0a070"); sbToast(`Needs the ${ex.needs}`); } continue; }
    if(ED.doc.win!=="kill" && ED.doc.win!=="none") endRun("ESCAPED"); return; }
}
function clearWins(){ const w=ED.doc&&ED.doc.win; return w!=="exit" && w!=="none"; }
function sbToast(t){ const el=$("toast"); el.textContent=t; el.style.opacity=1; clearTimeout(SB.toastT); SB.toastT=setTimeout(()=>el.style.opacity=0,2600); }
function sbHud(){
  const f=findInteract(), pr=$("prompt");
  pr.textContent = player.search ? "" : f ? (pad.connected?f.text.replace(/^E:/,"A:"):f.text) : "";
  const sb=$("searchbar"); if(player.search){ sb.style.display="block"; sb.querySelector(".fill").style.width=Math.min(100,player.search.t/player.search.dur*100)+"%"; sb.querySelector(".lab").textContent=`SEARCHING THE ${player.search.c.name.toUpperCase()}…  (aim to stop)`; } else sb.style.display="none";
  const F=player.flash; $("flashline").textContent = F.has ? `FLASHLIGHT ${F.on?"ON":"off"} ${Math.round(F.charge*100)}% · L` : "";
  $("bagline").textContent = `BAG ${player.inv.reduce((a,e)=>a+(e.qty||1),0)} · I`;
}
// inventory screen
function invOpen(){ return SB.inv; }
let invSel=0;
function openInv(){ if(MODE!=="play"||player.dead) return; SB.inv=true; try{ document.exitPointerLock(); }catch(e){} invSel=Math.min(invSel,Math.max(0,player.inv.length-1)); renderInv(); $("inv").hidden=false; }
function closeInv(){ SB.inv=false; $("inv").hidden=true; try{ const p=canvas.requestPointerLock(); if(p&&p.catch)p.catch(()=>{}); }catch(e){} }
function renderInv(){
  const L=$("invList"), D=$("invDetail"); L.innerHTML="";
  const F=player.flash; $("invHead").textContent=`HEALTH ${Math.ceil(player.hp)} / ${CFG.norah.hp} · REVOLVER ${player.rounds} + ${player.spare}${F.has?` · FLASHLIGHT ${Math.round(F.charge*100)}%`:""}`;
  if(!player.inv.length){ L.innerHTML=`<p class="invEmpty">Nothing yet. Search furniture that glints (E) and pick up what's on the floor.</p>`; D.innerHTML=""; return; }
  player.inv.forEach((e,i)=>{ const d=itemDef(e.item); const b=document.createElement("button"); b.className="invItem"; b.setAttribute("aria-pressed",i===invSel?"true":"false");
    b.innerHTML=`<i style="background:${d.col}"></i><span>${entryLabel(e)}</span><small>${d.cat}</small>`; b.onclick=()=>{ invSel=i; renderInv(); }; L.appendChild(b); });
  const e=player.inv[invSel]; if(!e){ D.innerHTML=""; return; } const d=itemDef(e.item);
  D.innerHTML=`<h3>${entryName(e)}</h3><p>${(e.text||d.desc||"").replace(/</g,"&lt;").replace(/\n/g,"<br>")}</p>`;
  const acts=document.createElement("div"); acts.className="invActs";
  const act=(t,f)=>{ const b=document.createElement("button"); b.className="invBtn"; b.textContent=t; b.onclick=()=>{ f(); renderInv(); }; acts.appendChild(b); };
  const use1=()=>{ e.qty=(e.qty||1)-1; if(e.qty<=0){ player.inv.splice(invSel,1); invSel=Math.max(0,invSel-1); } };
  if(d.heal){ act(player.hp>=CFG.norah.hp?"Use (health is full)":"Use",()=>{ if(player.hp>=CFG.norah.hp) return; const h=CFG.items[d.heal]||20; player.hp=Math.min(CFG.norah.hp,player.hp+h); log(`${entryName(e)}: +${h} health`,"#9ed08a"); use1(); }); }
  if(d.charge){ act(F.has?"Put in the flashlight":"Use (no flashlight)",()=>{ if(!F.has) return; F.charge=Math.min(1,F.charge+d.charge); log(`Flashlight charged to ${Math.round(F.charge*100)}%`,"#9ed08a"); use1(); }); }
  if(d.light!==undefined){ act(F.on?"Turn off (L)":"Turn on (L)",()=>toggleFlash()); }
  if(d.cat==="key") acts.appendChild(Object.assign(document.createElement("span"),{className:"invNote",textContent:"Opens locked doors and exits that name it."}));
  act("Drop",()=>{ const q=e.qty||1; player.inv.splice(invSel,1); invSel=Math.max(0,invSel-1); if(d.light!==undefined){ F.has=false; F.on=false; }
    const o={id:sbUid("i"),type:"item",x:player.pos.x+Math.sin(player.yaw)*0.5,z:player.pos.z+Math.cos(player.yaw)*0.5,item:e.item,qty:q,name:e.name,text:e.text}; sbTagged(o,()=>sbBuildPickup(o)); });
  D.appendChild(acts);
}
$("invClose").onclick=closeInv;

// ---------------------------------------------------------------- play / build
let playFrom=null;
function playMap(from){
  if(!SB.ready) return;
  MODE="play"; document.body.classList.remove("build","menu"); document.body.classList.add("play"); $("mm").hidden=true; $("panel").classList.add("hidden"); edHideSide();
  playFrom=from||null; resize();
  startPlay();
  if(!SB.helpSeen){ SB.helpSeen=true; $("help").style.display="block"; } else { try{ const p=canvas.requestPointerLock(); if(p&&p.catch)p.catch(()=>{}); }catch(e){} }
}
function startPlay(){
  const d=ED.doc, st=d.start||{};
  mdlPreload(mdlPoolKeys());
  clearEnemies(); seed=1234567; buildFromDoc(d,false); ED.helpers.visible=false; ED.selBox.visible=false; player.root.visible=true;
  const sp = playFrom ? {x:playFrom.x,z:playFrom.z,yaw:world.spawn.yaw} : world.spawn;
  player.pos.set(sp.x,0,sp.z); player.yaw=sp.yaw; camYaw=sp.yaw; camPitch=-0.08; camPos.set(sp.x-Math.sin(sp.yaw)*2.7,1.75+groundY(sp.x,sp.z),sp.z-Math.cos(sp.yaw)*2.7);
  player.hp=st.hp?Math.min(+st.hp,CFG.norah.hp):CFG.norah.hp; player.dead=false; player.stumble=0; player.dodge=0; player.vel.set(0,0,0); player.crouch=false; player.grabbed=null; player.vault=null; player.posY=0; player.reloading=0; player.hammer=0; player.aiming=false; player.search=null;
  skinPlayer(); player.crushT=0; player.kneelT=0;
  $("dead").style.display="none"; $("result").style.display="none";
  let ammo=[st.rounds===""||st.rounds==null?CFG.rev.chambers:+st.rounds, st.spare===""||st.spare==null?CFG.rev.spare:+st.spare];
  if(CFG.world.budget) ammo=[Math.min(5,CFG.rev.chambers),7];
  player.rounds=Math.min(ammo[0],CFG.rev.chambers); player.spare=ammo[1];
  player.inv=[]; player.flash={has:false,on:false,charge:0};
  for(const e of st.items||[]) giveItem(e,true);
  if(st.flashOn&&player.flash.has&&player.flash.charge>0) player.flash.on=true;
  newRun(d.name+(CFG.world.budget?" · ammo budget":""));
  logLines.length=0; logEl.innerHTML="";
  SWARM.lastTell=-9;
  QUIET_SPAWN=true;
  for(const m of world.enemySpawns){ const o=m.o||{}; const start=o.start||"hunting", yaw=(o.yaw||0)*D2R;
    const st2 = SIM.startOverride&&SIM.startOverride!=="map" ? SIM.startOverride : start;
    const opts = st2==="hunting" ? {aware:"hunting",yaw} : {aware:"unaware",idle:st2,yaw,face:yaw}; if(o.move) opts.move=o.move;
    try{ const e=spawn(m.type||"across",m.x,m.z,opts); if(o.hpMul&&+o.hpMul!==1){ e.hpMul=+o.hpMul; e._sf=-1; e.maxHp=e.hp=e.kind==="brute"?CFG.brute.hp*e.hpMul:e.S.hp; } if(o.speedMul&&+o.speedMul!==1) e.speedMul=+o.speedMul; }catch(err){ console.warn(err); } }
  simExtras();
  for(const e of enemies){ const hm=(+SIM.hpMul||1)*(e.hpMul||1), sm=(+SIM.speedMul||1)*(e.speedMul||1); if(hm!==1){ e.hpMul=hm; e._sf=-1; e.maxHp=e.hp=e.kind==="brute"?CFG.brute.hp*hm:e.S.hp; } if(sm!==1) e.speedMul=sm; }
  QUIET_SPAWN=false; SB.simMenu=false; $("simMenu").hidden=true;
  if(d.note) log(d.note,"#e8c77a");
  log(`Map: ${d.name}${world.lightCapped?` · only the first ${SB_MAXLIGHTS} lights are on`:""}`,"#e8c77a");
  replay.frames.length=0; activeCam=null; heldYaw=null; paused=false; $("paused").style.display="none";
  showTouch(CFG.ctrl.touch); const ml=$("mapnameline"); if(ml) ml.textContent="Map: "+d.name;
}
function loadScenario(key){ if(MODE!=="play") return; if(key==="variety"){ for(const v of VARIANTS){ const a=Math.random()*Math.PI*2; spawn("across:"+v.key, player.pos.x+Math.sin(a)*7, player.pos.z+Math.cos(a)*7); } return; } startPlay(); }
function toBuild(){
  if(MODE==="build") return;
  if(replay.on) exitReplay();
  MODE="build"; document.body.classList.add("build"); document.body.classList.remove("play");
  try{ document.exitPointerLock(); }catch(e){}
  SB.inv=false; $("inv").hidden=true; $("help").style.display="none"; $("result").style.display="none"; $("dead").style.display="none"; paused=false; $("paused").style.display="none";
  clearEnemies(); player.search=null; player.flash.on=false; flashSpot.intensity=0; player.root.visible=false; showTouch(false);
  mouseAim=false; for(const k in keys) keys[k]=false;
  resize(); edRebuild(true);
}
$("toBuildBtn").onclick=e=>{ e.target.blur(); toBuild(); };

// ---------------------------------------------------------------- fight readability: crosshair on a body, grab prompts
SB.aimOver=false; let aimRayT=0; const aimRay=new THREE.Raycaster();
function aimOverCheck(fixed){
  if(!player.aiming||fixed){ SB.aimOver=false; return false; }
  const now=performance.now(); if(now-aimRayT<50) return SB.aimOver; aimRayT=now;
  aimRay.setFromCamera({x:0,y:0},camera); aimRay.far=40;
  const hits=aimRay.intersectObjects(world.blockers.concat(enemyMeshes()),false); const skip=camera.position.distanceTo(new THREE.Vector3(player.pos.x,1.5+groundY(player.pos.x,player.pos.z),player.pos.z))*0.6;
  const h=hits.find(x=>x.distance>skip); SB.aimOver=!!(h&&h.object.userData.enemy); return SB.aimOver;
}
let qteBannerT=0;
function qteBanner(text, cls){ return; const el=$("qteResult"); el.textContent=text; el.className="show "+cls; clearTimeout(qteBannerT); qteBannerT=setTimeout(()=>{ el.className=""; },950); }
function qteLabel(k){ return pad.connected?k.padLabel:(CFG.ctrl.touch?"TAP":k.label); }
function qteRing(frac, label, big){
  const r=big?27:20, c=2*Math.PI*r, s=(r+4)*2;
  return `<span class="qKey${big?" big":""}"><svg viewBox="0 0 ${s} ${s}" width="${s}" height="${s}" aria-hidden="true"><circle cx="${s/2}" cy="${s/2}" r="${r}" class="trk"/><circle cx="${s/2}" cy="${s/2}" r="${r}" class="arc" style="stroke-dasharray:${c};stroke-dashoffset:${c*(1-frac)}" transform="rotate(-90 ${s/2} ${s/2})"/></svg><b>${label}</b></span>`;
}
function renderQte(){
  const gm=$("grabmsg"), g=player.grabbed, vig=$("grabVig");
  vig.style.opacity = g ? (0.55+0.2*Math.sin(performance.now()/140)).toFixed(2) : "0";
  if(!g||!g.qte){ gm.style.display="none"; return; }
  const q=g.qte, frac=clamp(q.t/q.win,0,1), who=g.by.name.replace(/\s\d+$/,"").replace(/^The /,"").toUpperCase();
  gm.style.display="block"; gm.className=(q.pulse>0?"pulse ":"")+(q.wrong>0?"wrong ":"")+(frac<0.35?"low":"");
  const k = q.mode==="mash" ? q.key : q.seq[q.i];
  gm.innerHTML = qteRing(frac,qteLabel(k),true) + (q.mode==="mash" ? `<div class="qMeter"><i style="width:${Math.min(100,q.fill*100).toFixed(1)}%"></i></div>` : "");
}
