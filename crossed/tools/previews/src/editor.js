// ================================================================ the builder
const ED = {doc:null, sel:null, selOp:null, tool:"select", view:"3d", snap:0.25, draft:null, drag:null, undo:[], redo:[], cursor:{x:0,z:0,ok:false},
  pan:{x:0,z:0}, zoom:30, orbit:{tx:0,ty:0,tz:0,yaw:0.75,pitch:0.85,dist:26}, planDirty:true, terrainImg:null, terrainDirty:true,
  helpers:new THREE.Group(), selBox:null, rebuildT:0, saveT:0, tab:"inspect", assetQ:"", assetCat:"all", thumbs:{}, preview:null, lastPick:0,
  opts:{ wall:{height:2.8,thick:0.2,color:"#5e594f",tex:""}, floor:{tex:"",colA:"#2e2a26",colB:"#36322c"}, door:{width:1,closed:false,locked:false,key:""}, window:{width:1.2,sill:0.9,top:2.1}, gap:{width:1.2},
    block:{h:1,color:"#5b4128",tex:"",push:true,name:"crate",search:false}, pillar:{r:0.35,h:3,color:"#5a5246"}, prop:{asset:"wardrobe",rot:0,scale:1},
    terrain:{mode:"raise",radius:3,strength:0.5,paint:1}, enemy:{kind:"across",start:"hunting"}, item:{item:"ammo",qty:6,name:"",text:""}, exit:{r:0.9,needs:""},
    light:{color:"#ffb060",intensity:1,dist:8,height:2.6}, camera:{height:2.8,fov:60,track:true}, path:{width:1.6,tex:"",color:"#6a665e"}, spawn:{}, corpse:{} } };
scene.add(ED.helpers);
ED.selBox=new THREE.Box3Helper(new THREE.Box3(), 0xd07a44); ED.selBox.material.depthTest=false; ED.selBox.material.transparent=true; ED.selBox.renderOrder=999; ED.selBox.visible=false; scene.add(ED.selBox);
const edAmb=new THREE.AmbientLight(0xc0c8d8,0); scene.add(edAmb);
const planCv=$("edPlan"), planG=planCv.getContext("2d");

const IC = {
  select:'<path d="M5 3l12 8-5 1 3 6-2 1-3-6-4 4z"/>', wall:'<path d="M3 17h18M3 13h18M7 13v4M15 13v4M11 9v4M3 9h18M19 9v4M5 9V5h14v4"/>', room:'<rect x="4" y="5" width="16" height="14"/><path d="M4 9h16"/>',
  floor:'<path d="M3 16l9-5 9 5-9 5z"/>', door:'<path d="M6 21V3h10v18M6 21h12M13 12h1"/>', window:'<rect x="5" y="5" width="14" height="14"/><path d="M12 5v14M5 12h14"/>', gap:'<path d="M3 12h6M15 12h6M9 8v8M15 8v8"/>',
  block:'<path d="M4 8l8-4 8 4v8l-8 4-8-4zM4 8l8 4 8-4M12 12v8"/>', pillar:'<ellipse cx="12" cy="5" rx="5" ry="2"/><path d="M7 5v14M17 5v14"/><ellipse cx="12" cy="19" rx="5" ry="2"/>',
  prop:'<path d="M6 20V9h12v11M4 9h16M9 9V5h6v4M9 14h6"/>', terrain:'<path d="M2 19l6-9 4 5 3-4 7 8z"/>', spawn:'<circle cx="12" cy="6" r="3"/><path d="M12 9v7M8 12h8M12 16l-3 5M12 16l3 5"/>',
  enemy:'<circle cx="12" cy="7" r="3"/><path d="M12 10l-2 6M10 16l-3 5M10 16l4 5M11 12l-5 2M11 12l6-1"/>', item:'<path d="M12 3l7 9-7 9-7-9z"/>', exit:'<circle cx="12" cy="12" r="8"/><path d="M9 12h7M13 9l3 3-3 3"/>',
  light:'<circle cx="12" cy="10" r="5"/><path d="M10 17h4M10 20h4"/>', camera:'<rect x="3" y="8" width="13" height="9"/><path d="M16 11l5-3v9l-5-3"/>', corpse:'<path d="M3 16h16M5 13h6l3 3M17 13a2 2 0 1 0 0 .1"/>',
  path:'<path d="M5 21c2-6 10-4 12-10S17 4 19 3"/><path d="M8 21c2-5 9-4 11-9"/>'
};
const TOOLS=[["select","Select","V"],["wall","Wall","W"],["room","Room","R"],["floor","Floor","F"],["door","Door","D"],["window","Window","N"],["gap","Opening","G"],["block","Block","B"],["pillar","Pillar","O"],
  ["prop","Furniture","A"],["terrain","Terrain","T"],["path","Path","P"],["spawn","Norah","S"],["enemy","Enemy","Z"],["item","Item","I"],["exit","Exit","X"],["light","Light","L"],["camera","Camera","C"],["corpse","Body","K"]];
const HINTS={select:"Click to select · drag to move · Q/E turn · Del deletes · Ctrl+D duplicates · arrows nudge",
  wall:"Click, click, click to chain walls · double-click, right-click or Esc ends the chain", room:"Drag a rectangle: floor and four walls", floor:"Drag a rectangle of floor",
  door:"Click on a wall to cut a door into it", window:"Click on a wall to add a window", gap:"Click on a wall to cut an open doorway", block:"Drag a rectangle: a crate, a stage, a counter. Low ones can be vaulted",
  pillar:"Click to place a pillar", prop:"Click to place the chosen furniture (ASSETS tab) · Q/E turn it before placing", terrain:"Drag to sculpt. Pick raise, lower, smooth, flatten or paint in INSPECT",
  path:"Click points along a road or trail · double-click or Esc finishes", spawn:"Click where Norah starts, drag to face her", enemy:"Click to place, drag to face it", item:"Click to drop an item on the floor",
  exit:"Click to place a way out. It can require a key", light:"Click to place a light", camera:"Click to place a fixed camera, drag to aim it", corpse:"Click to lay a body on the floor"};

// ---------------------------------------------------------------- doc helpers
const obj = id => ED.doc.objects.find(o=>o.id===id);
const selObj = () => ED.sel ? obj(ED.sel) : null;
function snapV(v, ev){ return (ev&&ev.altKey)||!ED.snap ? +v.toFixed(3) : Math.round(v/ED.snap)*ED.snap; }
function snapP(p, ev){ return {x:snapV(p.x,ev), z:snapV(p.z,ev)}; }
function edSnapshot(){ const s=JSON.stringify(ED.doc); if(ED.undo[ED.undo.length-1]===s) return; ED.undo.push(s); if(ED.undo.length>60) ED.undo.shift(); ED.redo=[]; }
function edUndo(){ if(!ED.undo.length){ edStatusMsg("Nothing to undo"); return; } ED.redo.push(JSON.stringify(ED.doc)); ED.doc=JSON.parse(ED.undo.pop()); edAfterLoad(false); }
function edRedo(){ if(!ED.redo.length){ edStatusMsg("Nothing to redo"); return; } ED.undo.push(JSON.stringify(ED.doc)); ED.doc=JSON.parse(ED.redo.pop()); edAfterLoad(false); }
function edAfterLoad(frame){ if(ED.sel&&!obj(ED.sel)) ED.sel=null; ED.selOp=null; ED.draft=null; ED.terrainDirty=true; edRebuild(true); edRenderSide(); if(frame) edFrameAll(); edSave(); $("edName").value=ED.doc.name; }
function edChanged(o={}){ ED.dirty=true; edSave(); ED.planDirty=true; if(o.terrain) ED.terrainDirty=true; if(!o.noRebuild) edRebuild(o.now); if(o.inspector) edRenderInspector(); }
function edSave(){ clearTimeout(ED.saveT); ED.saveT=setTimeout(()=>{ try{ localStorage.setItem("crossed_sandbox_current", JSON.stringify(ED.doc)); ED.saveMsg="saved in this browser"; }catch(e){ ED.saveMsg="not saved: map too big for browser storage (copy it from FILES)"; } edStatus(); },400); }
function edRebuild(now){ clearTimeout(ED.rebuildT); if(now) edDoRebuild(); else ED.rebuildT=setTimeout(edDoRebuild,110); }
function edDoRebuild(){ if(!SB.ready||MODE==="play") return; buildFromDoc(ED.doc,true); edBuildHelpers(); edUpdateSelBox(); ED.planDirty=true; edAmb.intensity=edPrefs.work?0.55:0; player.root.visible=false; edStatus(); }

// ---------------------------------------------------------------- 3D helpers for things that have no body in the world while building
function edBuildHelpers(){
  for(const c of [...ED.helpers.children]){ ED.helpers.remove(c); }
  const H=ED.helpers; ED.helpers.visible=true;
  const tag=(g,o)=>{ g.traverse(c=>c.userData.oid=o.id); H.add(g); return g; };
  const ring=(o,col,r)=>{ const m=new THREE.Mesh(new THREE.RingGeometry(r*0.8,r,24),new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:0.8,side:THREE.DoubleSide,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.set(o.x,groundY(o.x,o.z)+0.04,o.z); return m; };
  const arrow=(o,col)=>{ const g=new THREE.Group(); const m=new THREE.Mesh(new THREE.ConeGeometry(0.12,0.4,4),new THREE.MeshBasicMaterial({color:col})); m.rotation.x=Math.PI/2; m.position.z=0.6; g.add(m); g.position.set(o.x,groundY(o.x,o.z)+0.06,o.z); g.rotation.y=(o.yaw||0)*D2R; return g; };
  for(const o of ED.doc.objects){
    if(o.type==="spawn"){ const r=buildBody("norah",null); r.position.set(o.x,groundY(o.x,o.z),o.z); r.rotation.y=(o.yaw||0)*D2R; tag(r,o); tag(ring(o,0x59a6c9,0.45),o); tag(arrow(o,0x59a6c9),o); }
    else if(o.type==="enemy"){ let r; const k=o.kind||"across";
      if(k==="brute"||k==="dummy"){ r=buildBody(k,null); r.scale.setScalar(CFG.brute.height/1.8); }
      else { const v=k.startsWith("across:")?k.slice(7):k==="across_legless"?"crawler":"walker"; r=buildPerson(VMAP[v]||VMAP.walker, (o.x*1000+o.z*37)|0).root; if(k==="across") r.traverse(c=>{ if(c.isMesh&&c.material&&c.material.color){ c.material=c.material.clone(); c.material.color.multiplyScalar(0.7); } }); }
      r.position.set(o.x,groundY(o.x,o.z),o.z); r.rotation.y=(o.yaw||0)*D2R; tag(r,o); tag(ring(o,o.start==="hunting"?0xd84040:0xd8b040,0.42),o); tag(arrow(o,0xd84040),o); }
    else if(o.type==="light"){ const m=new THREE.Mesh(new THREE.OctahedronGeometry(0.14,0),new THREE.MeshBasicMaterial({color:hexNum(o.color||"#ffb060")})); m.position.set(o.x,o.y??2.6,o.z); tag(m,o);
      const g=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(o.x,o.y??2.6,o.z),new THREE.Vector3(o.x,groundY(o.x,o.z),o.z)]); tag(new THREE.Line(g,new THREE.LineBasicMaterial({color:0x6a5a30})),o); }
    else if(o.type==="camera"){ const L=o.look||[o.x,0.8,o.z-3]; const g=new THREE.Group(); const b=new THREE.Mesh(new THREE.BoxGeometry(0.22,0.16,0.3),new THREE.MeshBasicMaterial({color:0x59a6c9})); g.add(b); g.position.set(o.x,o.y??2.8,o.z); g.lookAt(L[0],L[1],L[2]); tag(g,o);
      const lg=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(o.x,o.y??2.8,o.z),new THREE.Vector3(L[0],L[1],L[2])]); if(o.id===ED.sel) tag(new THREE.Line(lg,new THREE.LineDashedMaterial({color:0x59a6c9,dashSize:0.2,gapSize:0.15})).computeLineDistances(),o); }
    else if((o.type==="prop"||o.type==="block")&&o.search){ const n=(o.items||[]).length; const m=new THREE.Mesh(new THREE.OctahedronGeometry(0.1,0),new THREE.MeshBasicMaterial({color:n?0xe8c77a:0x6a6458}));
      const c=world.containers.find(c=>c.oid===o.id); if(c){ m.position.set(c.box.x,(c.box.y0||0)+(c.box.h||1)+0.3,c.box.z); tag(m,o); } }
  }
}
function edTagged(id){ const out=[]; for(const c of world.group.children) if(c.userData.oid===id) out.push(c); for(const c of ED.helpers.children) if(c.userData.oid===id) out.push(c); return out; }
function edUpdateSelBox(){
  const o=selObj(); if(ED._helperSel!==ED.sel){ ED._helperSel=ED.sel; if(SB.ready&&MODE==="build") edBuildHelpers(); } if(!o||MODE!=="build"){ ED.selBox.visible=false; return; }
  const b=new THREE.Box3(); for(const c of edTagged(o.id)){ if(c.isLight) continue; c.updateMatrixWorld(true); b.expandByObject(c); }
  if(b.isEmpty()){ ED.selBox.visible=false; return; } b.expandByScalar(0.03); ED.selBox.box=b; ED.selBox.visible=true;
}

// ---------------------------------------------------------------- creating things
function edAdd(o){ o.id=o.id||sbUid(o.type[0]); ED.doc.objects.push(o); ED.sel=o.id; ED.selOp=null; return o; }
function edNearestWall(p, maxD=0.8){ let best=null, bd=maxD;
  for(const w of ED.doc.objects){ if(w.type!=="wall") continue; const dx=w.b[0]-w.a[0], dz=w.b[1]-w.a[1], L2=dx*dx+dz*dz; if(L2<1e-6) continue; const t=clamp(((p.x-w.a[0])*dx+(p.z-w.a[1])*dz)/L2,0,1);
    const d=Math.hypot(w.a[0]+dx*t-p.x, w.a[1]+dz*t-p.z); if(d<bd){ bd=d; best={w,t,L:Math.sqrt(L2)}; } } return best; }
function edPlacePoint(tool, p, ev){
  const O=ED.opts, s=snapP(p,ev), gy=groundY(s.x,s.z);
  switch(tool){
    case "pillar": return edAdd({type:"pillar",x:s.x,z:s.z,r:O.pillar.r,h:O.pillar.h,color:O.pillar.color});
    case "prop": { const a=sbAsset(O.prop.asset); return edAdd({type:"prop",asset:O.prop.asset,x:s.x,z:s.z,rot:O.prop.rot,scale:O.prop.scale,search:!!(a&&a.search),solid:"auto",push:"auto",items:[]}); }
    case "item": return edAdd({type:"item",x:s.x,z:s.z,item:O.item.item,qty:O.item.qty,name:O.item.name,text:O.item.text});
    case "exit": return edAdd({type:"exit",x:s.x,z:s.z,r:O.exit.r,needs:O.exit.needs,label:""});
    case "light": return edAdd({type:"light",x:s.x,y:+(gy+O.light.height).toFixed(2),z:s.z,color:O.light.color,intensity:O.light.intensity,dist:O.light.dist});
    case "corpse": return edAdd({type:"corpse",x:s.x,z:s.z,yaw:Math.round(Math.random()*360)});
    case "camera": return edAdd({type:"camera",x:s.x,y:+(gy+O.camera.height).toFixed(2),z:s.z,look:[s.x,+(gy+0.8).toFixed(2),s.z-3],track:O.camera.track,fov:O.camera.fov});
    case "enemy": return edAdd({type:"enemy",kind:O.enemy.kind,x:s.x,z:s.z,yaw:180,start:O.enemy.start,hpMul:1,speedMul:1});
    case "spawn": { let sp=ED.doc.objects.find(o=>o.type==="spawn"); if(sp){ sp.x=s.x; sp.z=s.z; ED.sel=sp.id; return sp; } return edAdd({type:"spawn",x:s.x,z:s.z,yaw:180}); }
  }
}
function edMakeRect(tool,a,b){
  const x0=Math.min(a.x,b.x), z0=Math.min(a.z,b.z), w=Math.abs(b.x-a.x), d=Math.abs(b.z-a.z); if(w<0.2||d<0.2) return null;
  const O=ED.opts, y=+(ED.doc.terrain&&ED.doc.terrain.on ? tSample(ED.doc.terrain,x0+w/2,z0+d/2) : 0).toFixed(2);
  if(tool==="block") return edAdd({type:"block",x:x0+w/2,z:z0+d/2,w,d,h:O.block.h,color:O.block.color,tex:O.block.tex,push:O.block.push,name:O.block.name,search:O.block.search,items:[]});
  const f=edAdd({type:"floor",x:x0,z:z0,w,d,tex:O.floor.tex,colA:O.floor.colA,colB:O.floor.colB,y});
  if(tool==="room"){ const c=[[x0,z0],[x0+w,z0],[x0+w,z0+d],[x0,z0+d]]; for(let i=0;i<4;i++) ED.doc.objects.push({id:sbUid("w"),type:"wall",a:c[i],b:c[(i+1)%4],height:O.wall.height,thick:O.wall.thick,color:O.wall.color,tex:O.wall.tex,openings:[]}); ED.sel=f.id; }
  return f;
}
function edAddOpening(tool,p){
  const nw=edNearestWall(p); if(!nw){ edStatusMsg("Click on (or next to) a wall"); return; }
  const O=ED.opts[tool], L=nw.L, wdt=Math.min(O.width,L-0.1); const at=clamp(snapV(nw.t*L),wdt/2+0.02,L-wdt/2-0.02);
  edSnapshot();
  const op = tool==="door" ? {id:sbUid("o"),kind:"door",at,width:wdt,side:1,closed:O.closed,locked:O.locked,key:O.key} : tool==="window" ? {id:sbUid("o"),kind:"window",at,width:wdt,sill:O.sill,top:O.top} : {id:sbUid("o"),kind:"gap",at,width:wdt};
  nw.w.openings.push(op); ED.sel=nw.w.id; ED.selOp=op.id; edChanged({inspector:true});
}

// ---------------------------------------------------------------- terrain brushes
function edEnsureTerrain(){ const d=ED.doc; if(d.terrain&&d.terrain.on) return d.terrain;
  const B=docBounds(d); const pad=6, x0=Math.floor(B.x0-pad), z0=Math.floor(B.z0-pad), w=Math.max(30,Math.ceil(B.x1+pad-x0)), dd=Math.max(30,Math.ceil(B.z1+pad-z0));
  d.terrain=terrainMake(x0,z0,w,dd,w*dd>6400?2:1,1); edStatusMsg("Terrain switched on for this map (MAP tab sets its size)"); ED.terrainDirty=true; edRebuild(true); return d.terrain; }
function edBrush(p, first){
  const T=ED.doc.terrain; if(!T||!T.on) return; const O=ED.opts.terrain, r=+O.radius, st=+O.strength;
  if(first) ED.flatTo = O.mode==="flatten" ? tSample(T,p.x,p.z) : 0;
  const fall=d=>{ const q=1-(d/r)**2; return q*q; };
  if(O.mode==="smooth"){ const nh=T.h.slice(); tEach(T,p.x,p.z,r,(k,d)=>{ const i=k%T.nx, j=(k/T.nx)|0; let s=0,n=0; for(let dj=-1;dj<=1;dj++) for(let di=-1;di<=1;di++){ const ii=i+di, jj=j+dj; if(ii<0||jj<0||ii>=T.nx||jj>=T.nz) continue; s+=T.h[jj*T.nx+ii]; n++; } nh[k]=T.h[k]+(s/n-T.h[k])*Math.min(1,st*1.5)*fall(d); }); for(let k=0;k<nh.length;k++) T.h[k]=nh[k]; }
  else tEach(T,p.x,p.z,r,(k,d)=>{ const f=fall(d);
    if(O.mode==="raise") T.h[k]+=0.12*st*f; else if(O.mode==="lower") T.h[k]-=0.12*st*f;
    else if(O.mode==="flatten") T.h[k]+=(ED.flatTo-T.h[k])*Math.min(1,st*0.6)*f;
    else if(O.mode==="noise") T.h[k]+=(vhash(k+(Date.now()&1023))-0.5)*0.15*st*f;
    else if(O.mode==="paint"){ if(f>0.15 || vhash(k*31+(Date.now()&255))<f*3) T.p[k]=+O.paint; } });
  for(let k=0;k<T.h.length;k++) T.h[k]=Math.round(clamp(T.h[k],-20,30)*1000)/1000;
  if(world.terrain&&world.terrain.mesh) terrainRefresh(world.terrain); ED.terrainDirty=true; ED.planDirty=true;
}

// ---------------------------------------------------------------- pointer handling shared by the plan and the 3D view
function edToolDown(p, ev, pickId, from3d){
  const t=ED.tool; ED.cursor={x:p.x,z:p.z,ok:true};
  if(t==="select"){
    if(pickId){ const o=obj(pickId); const soft=from3d && o && ["floor","path"].includes(o.type);
      if(!soft){ if(ED.sel!==pickId){ ED.sel=pickId; ED.selOp=null; edRenderInspector(); edUpdateSelBox(); }
        let end=null; if(!from3d&&o.type==="wall"){ const tol=10/ED.zoom; if(Math.hypot(p.x-o.a[0],p.z-o.a[1])<tol) end="a"; else if(Math.hypot(p.x-o.b[0],p.z-o.b[1])<tol) end="b"; }
        ED.drag={kind:end?"end":"move", end, o, start:p, orig:sbClone(o), moved:false, sx:ev.clientX, sy:ev.clientY, meshes:from3d?edTagged(o.id).map(m=>({m,p:m.position.clone()})):null}; return true; }
      ED.drag={kind:"softpick", id:pickId, sx:ev.clientX, sy:ev.clientY}; return false; }
    ED.drag={kind:"softpick", id:null, sx:ev.clientX, sy:ev.clientY}; return false;
  }
  if(t==="wall"){ const s=snapP(p,ev); if(!ED.draft||ED.draft.kind!=="wall") ED.draft={kind:"wall",a:s,b:s}; else { if(Math.hypot(s.x-ED.draft.a.x,s.z-ED.draft.a.z)>0.05){ edSnapshot(); const O=ED.opts.wall; const w=edAdd({type:"wall",a:[ED.draft.a.x,ED.draft.a.z],b:[s.x,s.z],height:O.height,thick:O.thick,color:O.color,tex:O.tex,openings:[]}); ED.draft={kind:"wall",a:s,b:s}; edChanged({inspector:true}); } } ED.planDirty=true; return true; }
  if(t==="path"){ const s=snapP(p,ev); if(!ED.draft||ED.draft.kind!=="path") ED.draft={kind:"path",pts:[[s.x,s.z]],b:s}; else ED.draft.pts.push([s.x,s.z]); ED.planDirty=true; return true; }
  if(t==="room"||t==="floor"||t==="block"){ const s=snapP(p,ev); ED.draft={kind:"rect",tool:t,a:s,b:s}; ED.drag={kind:"rect"}; return true; }
  if(t==="door"||t==="window"||t==="gap"){ edAddOpening(t,p); return true; }
  if(t==="terrain"){ edSnapshot(); edEnsureTerrain(); edBrush(p,true); ED.drag={kind:"terrain",last:0}; return true; }
  if(["spawn","enemy","camera"].includes(t)){ edSnapshot(); const o=edPlacePoint(t,p,ev); ED.drag={kind:"aim",o,start:p}; edChanged({inspector:true}); return true; }
  edSnapshot(); edPlacePoint(t,p,ev); edChanged({inspector:true}); return true;
}
function edToolMove(p, ev){
  ED.cursor={x:p.x,z:p.z,ok:true}; const D=ED.drag;
  if(ED.draft&&(ED.draft.kind==="wall"||ED.draft.kind==="path")){ ED.draft.b=snapP(p,ev); ED.planDirty=true; }
  if(!D){ if(["prop","terrain"].includes(ED.tool)) ED.planDirty=true; return; }
  if(D.kind==="rect"){ ED.draft.b=snapP(p,ev); ED.planDirty=true; }
  else if(D.kind==="terrain"){ const now=performance.now(); if(now-D.last>35){ D.last=now; edBrush(p,false); } }
  else if(D.kind==="aim"){ const o=D.o, dx=p.x-o.x, dz=p.z-o.z; if(Math.hypot(dx,dz)<0.25) return;
    if(o.type==="camera") o.look=[+p.x.toFixed(2),+(groundY(p.x,p.z)+0.8).toFixed(2),+p.z.toFixed(2)]; else o.yaw=Math.round(Math.atan2(dx,dz)*R2D/15)*15;
    ED.planDirty=true; edBuildHelpers(); edUpdateSelBox(); }
  else if(D.kind==="move"||D.kind==="end"){
    if(!D.moved && Math.hypot(ev.clientX-D.sx,ev.clientY-D.sy)<4) return; if(!D.moved){ D.moved=true; edSnapshotFrom(D.orig); }
    const dx=snapV(p.x-D.start.x,ev), dz=snapV(p.z-D.start.z,ev), o=D.o, g=D.orig;
    if(D.kind==="end"){ o[D.end]=[snapV(g[D.end][0]+dx,ev), snapV(g[D.end][1]+dz,ev)]; }
    else edShift(o,g,dx,dz);
    ED.planDirty=true;
    if(D.meshes){ for(const q of D.meshes){ q.m.position.set(q.p.x+dx,q.p.y,q.p.z+dz); } edUpdateSelBox(); }
  }
}
function edSnapshotFrom(orig){ edSnapshot(); } // nothing has changed yet when the drag first moves, so this records the state before it
function edShift(o,g,dx,dz){
  if(o.type==="wall"){ o.a=[g.a[0]+dx,g.a[1]+dz]; o.b=[g.b[0]+dx,g.b[1]+dz]; }
  else if(o.type==="path"){ o.points=g.points.map(q=>[q[0]+dx,q[1]+dz]); }
  else { o.x=+(g.x+dx).toFixed(3); o.z=+(g.z+dz).toFixed(3); if(o.type==="camera"&&g.look) o.look=[g.look[0]+dx,g.look[1],g.look[2]+dz]; }
}
function edToolUp(p, ev){
  const D=ED.drag; ED.drag=null; if(!D) return;
  if(D.kind==="rect"){ edSnapshot(); const r=edMakeRect(ED.draft.tool,ED.draft.a,ED.draft.b); ED.draft=null; if(r) edChanged({inspector:true}); ED.planDirty=true; }
  else if(D.kind==="terrain"){ edChanged({terrain:true}); }
  else if(D.kind==="aim"){ edChanged({inspector:true}); }
  else if(D.kind==="move"||D.kind==="end"){ if(D.moved){ edChanged({inspector:true}); } }
  else if(D.kind==="softpick"){ if(Math.hypot(ev.clientX-D.sx,ev.clientY-D.sy)<5){ ED.sel=D.id; ED.selOp=null; edRenderInspector(); edUpdateSelBox(); ED.planDirty=true; } }
}
function edEndChain(){ const d=ED.draft; if(d&&d.kind==="path"&&d.pts.length>=2){ edSnapshot(); const O=ED.opts.path; edAdd({type:"path",points:d.pts,width:O.width,tex:O.tex,color:O.color}); edChanged({inspector:true}); } ED.draft=null; ED.planDirty=true; }

// ---------------------------------------------------------------- plan view
function planSize(){ let r=planCv.getBoundingClientRect(); if(!r.width) r=canvas.getBoundingClientRect(); return {w:r.width||innerWidth,h:r.height||innerHeight}; }
function toS(x,z){ const s=planSize(); return [(x-ED.pan.x)*ED.zoom+s.w/2,(z-ED.pan.z)*ED.zoom+s.h/2]; }
function toW(px,py){ const s=planSize(); return {x:(px-s.w/2)/ED.zoom+ED.pan.x, z:(py-s.h/2)/ED.zoom+ED.pan.z}; }
function planHit(p){
  const os=ED.doc.objects, tol=8/ED.zoom; let best=null, bd=1e9;
  for(const o of os){ if(!["spawn","enemy","item","exit","light","camera","corpse","pillar"].includes(o.type)) continue; const r=Math.max(o.type==="exit"?(+o.r||0.8)*0.6:o.type==="pillar"?(+o.r||0.4):0.32,tol); const d=Math.hypot(o.x-p.x,o.z-p.z); if(d<r&&d<bd){ bd=d; best=o.id; } }
  if(best) return best;
  let ba=1e9;
  for(const o of os){ if(o.type!=="prop") continue; const F=sbPropFoot(o); if(edInPoly(p.x,p.z,F.pts)){ const a=(F.x1-F.x0)*(F.z1-F.z0); if(a<ba){ ba=a; best=o.id; } } }
  if(best) return best;
  for(const o of os){ if(o.type!=="wall") continue; const dx=o.b[0]-o.a[0], dz=o.b[1]-o.a[1], L2=dx*dx+dz*dz||1, t=clamp(((p.x-o.a[0])*dx+(p.z-o.a[1])*dz)/L2,0,1), d=Math.hypot(o.a[0]+dx*t-p.x,o.a[1]+dz*t-p.z); if(d<(+o.thick||0.2)/2+tol&&d<bd){ bd=d; best=o.id; } }
  if(best) return best;
  for(const o of os){ if(o.type==="block"&&Math.abs(p.x-o.x)<=o.w/2&&Math.abs(p.z-o.z)<=o.d/2){ const a=o.w*o.d; if(a<ba){ ba=a; best=o.id; } } }
  if(best) return best;
  for(const o of os){ if(o.type!=="path") continue; const P=o.points||[]; for(let i=0;i<P.length-1;i++){ const [ax,az]=P[i],[bx,bz]=P[i+1], dx=bx-ax, dz=bz-az, L2=dx*dx+dz*dz||1, t=clamp(((p.x-ax)*dx+(p.z-az)*dz)/L2,0,1); if(Math.hypot(ax+dx*t-p.x,az+dz*t-p.z)<(+o.width||1.6)/2) return o.id; } }
  for(const o of os){ if(o.type==="floor"&&p.x>=o.x&&p.x<=o.x+o.w&&p.z>=o.z&&p.z<=o.z+o.d){ const a=o.w*o.d; if(a<ba){ ba=a; best=o.id; } } }
  return best;
}
function edInPoly(x,z,P){ let ins=false; for(let i=0,j=P.length-1;i<P.length;j=i++){ const [xi,zi]=P[i],[xj,zj]=P[j]; if((zi>z)!==(zj>z)&&x<(xj-xi)*(z-zi)/(zj-zi)+xi) ins=!ins; } return ins; }
function edTerrainImage(){
  const T=ED.doc.terrain; if(!T||!T.on){ ED.terrainImg=null; return; }
  const c=ED.terrainImg&&ED.terrainImg.width===T.nx&&ED.terrainImg.height===T.nz?ED.terrainImg:document.createElement("canvas"); c.width=T.nx; c.height=T.nz;
  const g=c.getContext("2d"), im=g.createImageData(T.nx,T.nz), col=new THREE.Color();
  for(let j=0;j<T.nz;j++) for(let i=0;i<T.nx;i++){ const k=j*T.nx+i; col.set((GROUND[T.p[k]]||GROUND[0]).c);
    const hx=T.h[j*T.nx+Math.min(T.nx-1,i+1)]-T.h[j*T.nx+Math.max(0,i-1)], hz=T.h[Math.min(T.nz-1,j+1)*T.nx+i]-T.h[Math.max(0,j-1)*T.nx+i];
    const sh=clamp(1+(-hx-hz)*0.6/T.cell+T.h[k]*0.05,0.4,1.7);
    im.data[k*4]=clamp(col.r*255*sh,0,255); im.data[k*4+1]=clamp(col.g*255*sh,0,255); im.data[k*4+2]=clamp(col.b*255*sh,0,255); im.data[k*4+3]=255; }
  g.putImageData(im,0,0); ED.terrainImg=c; ED.terrainDirty=false;
}
function drawPlan(){
  ED.planDirty=false; const s=planSize(), dpr=Math.min(2,devicePixelRatio||1);
  if(planCv.width!==Math.round(s.w*dpr)||planCv.height!==Math.round(s.h*dpr)){ planCv.width=Math.round(s.w*dpr); planCv.height=Math.round(s.h*dpr); }
  const g=planG; g.setTransform(dpr,0,0,dpr,0,0); g.fillStyle="#0a0c0b"; g.fillRect(0,0,s.w,s.h);
  const Z=ED.zoom, S=toS, os=ED.doc.objects, sel=ED.sel;
  const T=ED.doc.terrain; if(T&&T.on){ if(ED.terrainDirty||!ED.terrainImg) edTerrainImage(); const [x0,z0]=S(T.x0-T.cell/2,T.z0-T.cell/2); g.imageSmoothingEnabled=false; g.globalAlpha=0.85; g.drawImage(ED.terrainImg,x0,z0,T.nx*T.cell*Z,T.nz*T.cell*Z); g.globalAlpha=1; }
  if(edPrefs.grid){ const tl=toW(0,0), br=toW(s.w,s.h); const step=Z<8?5:Z<20?1:ED.snap>=1?1:0.5;
    g.lineWidth=1; for(let x=Math.floor(tl.x/step)*step;x<=br.x;x+=step){ const [px]=S(x,0); g.strokeStyle=Math.abs(x%5)<1e-6?"rgba(140,150,130,.22)":"rgba(140,150,130,.08)"; g.beginPath(); g.moveTo(Math.round(px)+.5,0); g.lineTo(Math.round(px)+.5,s.h); g.stroke(); }
    for(let z=Math.floor(tl.z/step)*step;z<=br.z;z+=step){ const [,py]=S(0,z); g.strokeStyle=Math.abs(z%5)<1e-6?"rgba(140,150,130,.22)":"rgba(140,150,130,.08)"; g.beginPath(); g.moveTo(0,Math.round(py)+.5); g.lineTo(s.w,Math.round(py)+.5); g.stroke(); }
    const [ox,oz]=S(0,0); g.strokeStyle="rgba(181,86,44,.45)"; g.beginPath(); g.moveTo(ox-6,oz); g.lineTo(ox+6,oz); g.moveTo(ox,oz-6); g.lineTo(ox,oz+6); g.stroke(); }
  const selCol="#ff9a50";
  for(const o of os) if(o.type==="floor"){ const [x,z]=S(o.x,o.z); g.fillStyle=sbTexAvg(o.tex,o.colA||"#2e2a26"); g.globalAlpha=0.9; g.fillRect(x,z,o.w*Z,o.d*Z); g.globalAlpha=1; g.strokeStyle=o.id===sel?selCol:"rgba(0,0,0,.4)"; g.lineWidth=o.id===sel?2:1; g.strokeRect(x,z,o.w*Z,o.d*Z); }
  for(const o of os) if(o.type==="path"){ g.strokeStyle=o.id===sel?selCol:sbTexAvg(o.tex,o.color||"#6a665e"); g.lineWidth=Math.max(2,(+o.width||1.6)*Z); g.lineCap="round"; g.lineJoin="round"; g.globalAlpha=0.85; g.beginPath(); (o.points||[]).forEach((q,i)=>{ const [x,z]=S(q[0],q[1]); i?g.lineTo(x,z):g.moveTo(x,z); }); g.stroke(); g.globalAlpha=1; g.lineCap="butt"; }
  for(const o of os){
    if(o.type==="block"){ const [x,z]=S(o.x-o.w/2,o.z-o.d/2); g.fillStyle=sbTexAvg(o.tex,o.color||"#5b4128"); g.fillRect(x,z,o.w*Z,o.d*Z); g.strokeStyle=o.id===sel?selCol:"#1a1410"; g.lineWidth=o.id===sel?2:1; g.strokeRect(x,z,o.w*Z,o.d*Z); if(o.search) edBadge(g,x+o.w*Z,z,(o.items||[]).length); if(Z>26&&o.name){ g.fillStyle="#e8dfc8"; g.font="10px 'IBM Plex Mono',monospace"; g.fillText(o.name,x+3,z+11); } }
    else if(o.type==="pillar"){ const [x,z]=S(o.x,o.z); g.fillStyle=hexStr(o.color||"#5a5246"); g.beginPath(); g.arc(x,z,Math.max(3,(+o.r||0.4)*Z),0,7); g.fill(); g.strokeStyle=o.id===sel?selCol:"#111"; g.lineWidth=o.id===sel?2:1; g.stroke(); }
    else if(o.type==="corpse"){ const [x,z]=S(o.x,o.z); g.save(); g.translate(x,z); g.rotate(-(o.yaw||0)*D2R); g.fillStyle="#4a2a24"; g.fillRect(-0.22*Z,-0.8*Z,0.44*Z,1.6*Z); g.strokeStyle=o.id===sel?selCol:"#200"; g.strokeRect(-0.22*Z,-0.8*Z,0.44*Z,1.6*Z); g.restore(); }
  }
  for(const o of os) if(o.type==="prop"){ const F=sbPropFoot(o); const a=F.a; let col="#6a5a48"; if(a&&a.parts&&a.parts[0]) col=sbTexAvg(a.parts[0].t,a.parts[0].c||col);
    g.beginPath(); F.pts.forEach((q,i)=>{ const [x,z]=S(q[0],q[1]); i?g.lineTo(x,z):g.moveTo(x,z); }); g.closePath(); g.fillStyle=col; g.globalAlpha=0.88; g.fill(); g.globalAlpha=1; g.strokeStyle=o.id===sel?selCol:"rgba(0,0,0,.6)"; g.lineWidth=o.id===sel?2:1; g.stroke();
    const [cx,cz]=S((F.x0+F.x1)/2,(F.z0+F.z1)/2);
    const th=(o.rot||0)*D2R; const [fx,fz]=S(o.x+Math.sin(th)*0.25*(o.scale||1),o.z+Math.cos(th)*0.25*(o.scale||1)); const [ox,oz]=S(o.x,o.z); if(Z>18){ g.strokeStyle="rgba(232,223,200,.55)"; g.beginPath(); g.moveTo(ox,oz); g.lineTo(fx,fz); g.stroke(); }
    if(o.search) edBadge(g,S(F.x1,F.z0)[0],S(F.x1,F.z0)[1],(o.items||[]).length);
    if(Z>34){ g.fillStyle="#e8dfc8"; g.font="10px 'IBM Plex Mono',monospace"; const nm=(a?a.name:o.asset).split(/[,(]/)[0]; g.fillText(nm,cx-g.measureText(nm).width/2,cz+3); } }
  for(const o of os) if(o.type==="wall"){ const [ax,az]=S(o.a[0],o.a[1]), [bx,bz]=S(o.b[0],o.b[1]); const L=Math.hypot(o.b[0]-o.a[0],o.b[1]-o.a[1])||1, ux=(bx-ax)/(L*Z), uz=(bz-az)/(L*Z);
    const lw=Math.max(2,(+o.thick||0.2)*Z); const segs=[]; let s0=0; for(const op of [...o.openings].sort((p,q)=>p.at-q.at)){ const a=Math.max(0,op.at-op.width/2), b=Math.min(L,op.at+op.width/2); if(a>s0) segs.push([s0,a]); s0=Math.max(s0,b); } if(s0<L) segs.push([s0,L]);
    g.strokeStyle=o.id===sel?selCol:sbTexAvg(o.tex,hexStr(o.color||"#5a554c")); g.lineWidth=lw; for(const [a,b] of segs){ g.beginPath(); g.moveTo(ax+ux*a*Z,az+uz*a*Z); g.lineTo(ax+ux*b*Z,az+uz*b*Z); g.stroke(); }
    if(o.id!==sel){ g.strokeStyle="rgba(0,0,0,.5)"; g.lineWidth=1; }
    for(const op of o.openings){ const a=op.at-op.width/2, b=op.at+op.width/2, p0=[ax+ux*a*Z,az+uz*a*Z], p1=[ax+ux*b*Z,az+uz*b*Z]; const on=op.id===ED.selOp;
      if(op.kind==="window"){ g.strokeStyle=on?selCol:"#7fb6d6"; g.lineWidth=Math.max(2,lw*0.45); g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); }
      else if(op.kind==="door"){ g.strokeStyle=on?selCol:op.locked?"#e0a070":"#c9a23a"; g.lineWidth=1.5; const r=op.width*Z; const nx=-uz*(op.side||1), nz=ux*(op.side||1);
        g.beginPath(); g.moveTo(...p0); g.lineTo(p0[0]+nx*r,p0[1]+nz*r); g.stroke(); g.setLineDash([3,3]); g.beginPath(); g.moveTo(p0[0]+nx*r,p0[1]+nz*r); g.quadraticCurveTo(p0[0]+(nx+ux)*r,p0[1]+(nz+uz)*r,p1[0],p1[1]); g.stroke(); g.setLineDash([]);
        if(op.locked){ g.fillStyle="#e0a070"; g.font="bold 11px 'IBM Plex Mono',monospace"; g.fillText("⊠",(p0[0]+p1[0])/2-4,(p0[1]+p1[1])/2+4); } if(op.closed){ g.strokeStyle="#8a6a40"; g.lineWidth=3; g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); } }
      else { g.strokeStyle=on?selCol:"rgba(201,162,58,.6)"; g.setLineDash([2,3]); g.lineWidth=1; g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke(); g.setLineDash([]); } }
    if(o.id===sel){ for(const [x,z] of [[ax,az],[bx,bz]]){ g.fillStyle=selCol; g.fillRect(x-4,z-4,8,8); } } }
  for(const o of os){ const [x,z]=typeof o.x==="number"?S(o.x,o.z):[0,0]; const on=o.id===sel;
    if(o.type==="light"){ g.fillStyle="rgba(255,200,100,.06)"; g.beginPath(); g.arc(x,z,(+o.dist||8)*Z*0.45,0,7); g.fill(); g.fillStyle=hexStr(o.color||"#ffb060"); g.beginPath(); g.arc(x,z,5,0,7); g.fill(); g.strokeStyle=on?selCol:"#000"; g.lineWidth=on?2:1; g.stroke(); }
    else if(o.type==="camera"){ const L=o.look||[o.x,0,o.z-3]; const [lx,lz]=S(L[0],L[2]); g.strokeStyle="rgba(89,166,201,.5)"; g.setLineDash([4,4]); g.lineWidth=1; g.beginPath(); g.moveTo(x,z); g.lineTo(lx,lz); g.stroke(); g.setLineDash([]);
      const an=Math.atan2(lz-z,lx-x), f=(+o.fov||60)*D2R/2; g.fillStyle="rgba(89,166,201,.18)"; g.beginPath(); g.moveTo(x,z); g.arc(x,z,40,an-f,an+f); g.closePath(); g.fill(); g.fillStyle="#59a6c9"; g.fillRect(x-5,z-4,10,8); if(on){ g.strokeStyle=selCol; g.lineWidth=2; g.strokeRect(x-6,z-5,12,10); } }
    else if(o.type==="item"){ const d=itemDef(o.item); g.fillStyle=d.col; g.strokeStyle=on?selCol:"#e8c77a"; g.lineWidth=on?2:1.5; g.beginPath(); g.moveTo(x,z-7); g.lineTo(x+6,z); g.lineTo(x,z+7); g.lineTo(x-6,z); g.closePath(); g.fill(); g.stroke(); if(Z>22){ g.fillStyle="#e8c77a"; g.font="10px 'IBM Plex Mono',monospace"; g.fillText(entryLabel(o),x+9,z+4); } }
    else if(o.type==="exit"){ g.strokeStyle=on?selCol:"#60ff80"; g.lineWidth=2; g.beginPath(); g.arc(x,z,Math.max(6,(+o.r||0.8)*Z),0,7); g.stroke(); g.fillStyle="#60ff80"; g.font="10px 'IBM Plex Mono',monospace"; g.fillText(o.needs?"EXIT ⊠ "+o.needs:"EXIT",x+Math.max(8,(+o.r||.8)*Z)+3,z+4); }
    else if(o.type==="spawn"||o.type==="enemy"){ const sp=o.type==="spawn", col=sp?"#59a6c9":o.start==="hunting"?"#d84040":"#d8b040", th=(o.yaw||0)*D2R, r=Math.max(6,0.32*Z);
      g.fillStyle=col; g.beginPath(); g.arc(x,z,r,0,7); g.fill(); g.strokeStyle=on?selCol:"#000"; g.lineWidth=on?2.5:1; g.stroke();
      g.strokeStyle="#fff"; g.lineWidth=2; g.beginPath(); g.moveTo(x,z); g.lineTo(x+Math.sin(th)*r*1.6,z+Math.cos(th)*r*1.6); g.stroke();
      g.fillStyle="#0b0d0c"; g.font="bold 10px 'IBM Plex Mono',monospace"; const lab=sp?"N":edEnemyShort(o.kind); g.fillText(lab,x-g.measureText(lab).width/2,z+3.5); }
  }
  // drafts and cursors
  const D=ED.draft;
  if(D&&D.kind==="wall"){ const [ax,az]=S(D.a.x,D.a.z), [bx,bz]=S(D.b.x,D.b.z); g.strokeStyle="#d07a44"; g.lineWidth=Math.max(2,ED.opts.wall.thick*Z); g.beginPath(); g.moveTo(ax,az); g.lineTo(bx,bz); g.stroke(); edLabel(g,(ax+bx)/2,(az+bz)/2,Math.hypot(D.b.x-D.a.x,D.b.z-D.a.z).toFixed(2)+" m"); }
  if(D&&D.kind==="path"){ g.strokeStyle="#d07a44"; g.lineWidth=2; g.beginPath(); D.pts.forEach((q,i)=>{ const [x,z]=S(q[0],q[1]); i?g.lineTo(x,z):g.moveTo(x,z); }); const [bx,bz]=S(D.b.x,D.b.z); g.lineTo(bx,bz); g.stroke(); }
  if(D&&D.kind==="rect"){ const [ax,az]=S(Math.min(D.a.x,D.b.x),Math.min(D.a.z,D.b.z)); const w=Math.abs(D.b.x-D.a.x), d=Math.abs(D.b.z-D.a.z); g.strokeStyle="#d07a44"; g.lineWidth=2; g.setLineDash([6,4]); g.strokeRect(ax,az,w*Z,d*Z); g.setLineDash([]); edLabel(g,ax+w*Z/2,az+d*Z/2,`${w.toFixed(2)} × ${d.toFixed(2)} m`); }
  if(ED.cursor.ok&&ED.view==="plan"){ const [cx,cz]=S(ED.cursor.x,ED.cursor.z);
    if(ED.tool==="terrain"){ g.strokeStyle="rgba(232,199,122,.8)"; g.lineWidth=1.5; g.beginPath(); g.arc(cx,cz,ED.opts.terrain.radius*Z,0,7); g.stroke(); }
    if(ED.tool==="prop"){ const F=sbPropFoot({asset:ED.opts.prop.asset,x:snapV(ED.cursor.x),z:snapV(ED.cursor.z),rot:ED.opts.prop.rot,scale:ED.opts.prop.scale}); g.strokeStyle="#d07a44"; g.setLineDash([4,3]); g.lineWidth=1.5; g.beginPath(); F.pts.forEach((q,i)=>{ const [x,z]=S(q[0],q[1]); i?g.lineTo(x,z):g.moveTo(x,z); }); g.closePath(); g.stroke(); g.setLineDash([]); } }
  // scale bar
  const m=Z<10?10:Z<30?5:Z<80?2:1; g.fillStyle="rgba(232,223,200,.8)"; g.fillRect(14,14,m*Z,3); g.font="10px 'IBM Plex Mono',monospace"; g.fillText(m+" m",14+m*Z+6,19);
}
function edBadge(g,x,z,n){ g.fillStyle=n?"#e8c77a":"#6a6458"; g.beginPath(); g.arc(x,z,6,0,7); g.fill(); g.fillStyle="#150b05"; g.font="bold 9px 'IBM Plex Mono',monospace"; const t=String(n); g.fillText(t,x-g.measureText(t).width/2,z+3); }
function edLabel(g,x,z,t){ g.font="11px 'IBM Plex Mono',monospace"; const w=g.measureText(t).width+8; g.fillStyle="rgba(7,9,8,.9)"; g.fillRect(x-w/2,z-20,w,15); g.fillStyle="#e8dfc8"; g.fillText(t,x-w/2+4,z-9); }
function edEnemyShort(k){ k=k||"across"; if(k==="brute") return "L"; if(k==="dummy") return "D"; if(k==="across") return "A"; if(k==="across_legless") return "c"; const v=k.slice(7); return (VMAP[v]?VMAP[v].name.replace("The ",""):"A")[0]; }

let planDrag=null, spaceDown=false;
planCv.addEventListener("pointerdown",e=>{
  if(MODE!=="build") return; planCv.focus(); const r=planCv.getBoundingClientRect(), p=toW(e.clientX-r.left,e.clientY-r.top); planCv.setPointerCapture(e.pointerId);
  if(e.button===2&&ED.draft&&(ED.draft.kind==="wall"||ED.draft.kind==="path")){ edEndChain(); return; }
  if(e.button===1||e.button===2||spaceDown){ planDrag={x:e.clientX,y:e.clientY,px:ED.pan.x,pz:ED.pan.z}; return; }
  const used=edToolDown(p,e,ED.tool==="select"?planHit(p):null,false);
  if(!used&&ED.tool==="select") planDrag={x:e.clientX,y:e.clientY,px:ED.pan.x,pz:ED.pan.z,click:true};
  ED.planDirty=true;
});
planCv.addEventListener("pointermove",e=>{
  if(MODE!=="build") return; const r=planCv.getBoundingClientRect(), p=toW(e.clientX-r.left,e.clientY-r.top);
  if(planDrag){ ED.pan.x=planDrag.px-(e.clientX-planDrag.x)/ED.zoom; ED.pan.z=planDrag.pz-(e.clientY-planDrag.y)/ED.zoom; ED.planDirty=true; ED.cursor={x:p.x,z:p.z,ok:true}; return; }
  edToolMove(p,e); edStatus();
});
planCv.addEventListener("pointerup",e=>{ if(MODE!=="build") return; const r=planCv.getBoundingClientRect(), p=toW(e.clientX-r.left,e.clientY-r.top);
  if(planDrag){ const moved=Math.hypot(e.clientX-planDrag.x,e.clientY-planDrag.y)>4; const wasClick=planDrag.click; planDrag=null; if(wasClick&&!moved&&ED.drag&&ED.drag.kind==="softpick"){ edToolUp(p,e); } else if(ED.drag&&ED.drag.kind==="softpick") ED.drag=null; ED.planDirty=true; return; }
  edToolUp(p,e); ED.planDirty=true; });
planCv.addEventListener("dblclick",()=>{ if(ED.draft&&(ED.draft.kind==="wall"||ED.draft.kind==="path")) edEndChain(); });
planCv.addEventListener("wheel",e=>{ e.preventDefault(); const r=planCv.getBoundingClientRect(), p=toW(e.clientX-r.left,e.clientY-r.top); ED.zoom=clamp(ED.zoom*Math.pow(1.0015,-e.deltaY),3,240); const q=toW(e.clientX-r.left,e.clientY-r.top); ED.pan.x+=p.x-q.x; ED.pan.z+=p.z-q.z; ED.planDirty=true; },{passive:false});
planCv.addEventListener("pointerleave",()=>{ ED.cursor.ok=false; ED.planDirty=true; });
planCv.addEventListener("contextmenu",e=>e.preventDefault());

// ---------------------------------------------------------------- 3D view
const edRay=new THREE.Raycaster();
function pick3(e, terrainOnly){
  const r=canvas.getBoundingClientRect(); edRay.setFromCamera({x:(e.clientX-r.left)/r.width*2-1, y:-((e.clientY-r.top)/r.height)*2+1}, camera);
  const targets = terrainOnly ? (world.terrain&&world.terrain.mesh?[world.terrain.mesh]:[]) : [world.group, ED.helpers];
  const hits=edRay.intersectObjects(targets,true).filter(h=>{ let o=h.object; while(o){ if(o.visible===false) return false; o=o.parent; } return !h.object.userData.glint && !(h.object.isLine); });
  let id=null; if(hits.length){ let o=hits[0].object; while(o&&o.userData.oid===undefined) o=o.parent; id=o?o.userData.oid:null; }
  let pt=hits.length?hits[0].point:null;
  if(!pt){ const pl=new THREE.Plane(new THREE.Vector3(0,1,0),0), v=new THREE.Vector3(); pt=edRay.ray.intersectPlane(pl,v); }
  return {id, pt:pt?{x:pt.x,z:pt.z,y:pt.y}:null};
}
let orbitDrag=null;
canvas.addEventListener("pointerdown",e=>{
  if(MODE!=="build"||ED.view!=="3d") return; canvas.setPointerCapture(e.pointerId); ED.preview=null;
  if(e.button===2||e.button===1||e.altKey){ orbitDrag={x:e.clientX,y:e.clientY,pan:e.button===1||e.shiftKey}; return; }
  const P=pick3(e, ED.tool==="terrain"); if(!P.pt) return;
  const used=edToolDown(P.pt,e,ED.tool==="select"?P.id:null,true);
  if(ED.drag&&ED.drag.kind==="move"){ const y=groundY(P.pt.x,P.pt.z); ED.drag.planeY=y; const q=edPlanePt(e,y); if(q) ED.drag.start=q; }
  if(!used) orbitDrag={x:e.clientX,y:e.clientY,pan:false,sx:e.clientX,sy:e.clientY};
});
canvas.addEventListener("pointermove",e=>{
  if(MODE!=="build"||ED.view!=="3d") return;
  if(orbitDrag){ const dx=e.clientX-orbitDrag.x, dy=e.clientY-orbitDrag.y; orbitDrag.x=e.clientX; orbitDrag.y=e.clientY; const O=ED.orbit;
    if(orbitDrag.pan){ const k=O.dist*0.0016; O.tx+=(-Math.cos(O.yaw)*dx - Math.sin(O.yaw)*dy)*k; O.tz+=(Math.sin(O.yaw)*dx - Math.cos(O.yaw)*dy)*k; }
    else { O.yaw-=dx*0.006; O.pitch=clamp(O.pitch+dy*0.005,0.05,1.52); } return; }
  const now=performance.now(); if(!ED.drag && now-ED.lastPick<45) return; ED.lastPick=now;
  const P=pick3(e, ED.tool==="terrain"||(ED.drag&&ED.drag.kind==="terrain")); if(!P.pt) return;
  if(ED.drag&&(ED.drag.kind==="move")){ // drag along a flat plane at the object's own height so it doesn't climb what it passes over
    const r=canvas.getBoundingClientRect(); edRay.setFromCamera({x:(e.clientX-r.left)/r.width*2-1, y:-((e.clientY-r.top)/r.height)*2+1}, camera);
    const v=new THREE.Vector3(); const hit=edRay.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-(ED.drag.planeY??(ED.drag.planeY=groundY(ED.drag.start.x,ED.drag.start.z)))),v); if(hit) P.pt={x:v.x,z:v.z,y:v.y}; }
  edToolMove(P.pt,e); edStatus();
});
canvas.addEventListener("pointerup",e=>{ if(MODE!=="build"||ED.view!=="3d") return;
  if(orbitDrag){ const click=orbitDrag.sx!==undefined && Math.hypot(e.clientX-orbitDrag.sx,e.clientY-orbitDrag.sy)<5; orbitDrag=null; if(ED.drag&&ED.drag.kind==="softpick"){ if(click) edToolUp(ED.cursor,e); else ED.drag=null; } return; }
  edToolUp(ED.cursor,e); });
canvas.addEventListener("dblclick",()=>{ if(MODE==="build"&&ED.draft&&(ED.draft.kind==="wall"||ED.draft.kind==="path")) edEndChain(); });
canvas.addEventListener("wheel",e=>{ if(MODE!=="build"||ED.view!=="3d") return; e.preventDefault(); ED.preview=null; ED.orbit.dist=clamp(ED.orbit.dist*Math.pow(1.0012,e.deltaY),1.5,160); },{passive:false});
canvas.addEventListener("pointerdown",e=>{ if(MODE==="build"&&ED.view==="3d"&&e.button===2&&ED.draft&&(ED.draft.kind==="wall"||ED.draft.kind==="path")){ edEndChain(); orbitDrag=null; } });
function edPlanePt(e,y){ const r=canvas.getBoundingClientRect(); edRay.setFromCamera({x:(e.clientX-r.left)/r.width*2-1, y:-((e.clientY-r.top)/r.height)*2+1}, camera); const v=new THREE.Vector3(); return edRay.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),-y),v)?{x:v.x,z:v.z,y}:null; }
function edPan3(dx,dz){ ED.orbit.tx+=dx; ED.orbit.tz+=dz; }
function edOrbitCam(){
  const O=ED.orbit;
  if(ED.preview){ const o=obj(ED.preview); if(o){ const L=o.look||[o.x,0.8,o.z-3]; camera.position.set(o.x,o.y??2.8,o.z); if(camera.fov!==(+o.fov||60)){ camera.fov=+o.fov||60; camera.updateProjectionMatrix(); } camera.lookAt(L[0],L[1],L[2]); return; } ED.preview=null; }
  if(camera.fov!==55){ camera.fov=55; camera.updateProjectionMatrix(); }
  camera.position.set(O.tx+Math.cos(O.pitch)*Math.sin(O.yaw)*O.dist, O.ty+Math.sin(O.pitch)*O.dist, O.tz+Math.cos(O.pitch)*Math.cos(O.yaw)*O.dist);
  camera.lookAt(O.tx,O.ty,O.tz);
}
function edFrameAll(){
  const B=docBounds(ED.doc), cx=(B.x0+B.x1)/2, cz=(B.z0+B.z1)/2, w=Math.max(4,B.x1-B.x0), d=Math.max(4,B.z1-B.z0);
  ED.pan={x:cx,z:cz}; const s=planSize(); ED.zoom=clamp(Math.min(s.w/(w+3),s.h/(d+3)),3,120);
  Object.assign(ED.orbit,{tx:cx,ty:0,tz:cz,dist:Math.max(w,d)*1.05+4}); ED.planDirty=true;
}
function edFocusSel(){ const o=selObj(); if(!o) { edFrameAll(); return; } const p=o.type==="wall"?{x:(o.a[0]+o.b[0])/2,z:(o.a[1]+o.b[1])/2}:o.type==="floor"?{x:o.x+o.w/2,z:o.z+o.d/2}:o.type==="path"?{x:o.points[0][0],z:o.points[0][1]}:{x:o.x,z:o.z};
  ED.pan={x:p.x,z:p.z}; Object.assign(ED.orbit,{tx:p.x,tz:p.z,ty:groundY(p.x,p.z),dist:Math.min(ED.orbit.dist,9)}); ED.planDirty=true; }

// ---------------------------------------------------------------- keys while building
addEventListener("keydown",e=>{
  if(MODE!=="build"||!SB.ready) return;
  const tg=e.target.tagName; if(tg==="INPUT"||tg==="TEXTAREA"||tg==="SELECT"){ if(e.code==="Escape") e.target.blur(); return; }
  if(e.code==="Space"){ spaceDown=true; }
  const ctrl=e.ctrlKey||e.metaKey;
  if(ctrl&&e.code==="KeyZ"){ e.preventDefault(); e.shiftKey?edRedo():edUndo(); return; }
  if(ctrl&&e.code==="KeyY"){ e.preventDefault(); edRedo(); return; }
  if(ctrl&&e.code==="KeyD"){ e.preventDefault(); edDuplicate(); return; }
  if(ctrl) return;
  if(e.code==="Enter"){ e.preventDefault(); playMap(e.shiftKey&&ED.cursor.ok?{x:ED.cursor.x,z:ED.cursor.z}:null); return; }
  if(e.code==="Tab"){ e.preventDefault(); edSetView(ED.view==="3d"?"plan":"3d"); return; }
  if(e.code==="Escape"){ if(ED.draft){ if(ED.draft.kind==="path") edEndChain(); else ED.draft=null; } else if(ED.sel){ ED.sel=null; ED.selOp=null; edRenderInspector(); edUpdateSelBox(); } else edSetTool("select"); ED.planDirty=true; return; }
  if(e.code==="Delete"||e.code==="Backspace"){ e.preventDefault(); edDelete(); return; }
  if(e.code==="KeyQ"||e.code==="KeyE"){ edRotate((e.code==="KeyQ"?1:-1)*(e.shiftKey?90:15)); return; }
  if(e.code==="KeyH"&&!e.repeat){ edFocusSel(); return; }
  if(e.code.startsWith("Arrow")&&ED.sel){ e.preventDefault(); const o=selObj(); if(!o) return; edSnapshot(); const st=ED.snap||0.05, dx=e.code==="ArrowLeft"?-st:e.code==="ArrowRight"?st:0, dz=e.code==="ArrowUp"?-st:e.code==="ArrowDown"?st:0; edShift(o,sbClone(o),dx,dz); edChanged({inspector:true}); return; }
  const tl=TOOLS.find(t=>"Key"+t[2]===e.code); if(tl&&!e.repeat){ edSetTool(tl[0]); }
});
addEventListener("keyup",e=>{ if(e.code==="Space") spaceDown=false; });
function edDelete(){
  const o=selObj(); if(!o) return; edSnapshot();
  if(ED.selOp&&o.type==="wall"){ o.openings=o.openings.filter(op=>op.id!==ED.selOp); ED.selOp=null; edChanged({inspector:true}); return; }
  ED.doc.objects=ED.doc.objects.filter(x=>x!==o); ED.sel=null; edChanged({inspector:true}); edUpdateSelBox();
}
function edDuplicate(){ const o=selObj(); if(!o||o.type==="spawn") return; edSnapshot(); const c=sbClone(o); c.id=sbUid(o.type[0]); if(c.openings) for(const op of c.openings) op.id=sbUid("o"); edShift(c,sbClone(c),1,1); ED.doc.objects.push(c); ED.sel=c.id; edChanged({inspector:true}); }
function edRotate(deg){
  const o=selObj();
  if(!o){ if(ED.tool==="prop"){ ED.opts.prop.rot=((ED.opts.prop.rot+deg)%360+360)%360; ED.planDirty=true; edRenderInspector(); } return; }
  edSnapshot();
  if(o.type==="prop") o.rot=((o.rot||0)+deg+360)%360;
  else if(["spawn","enemy","corpse","item"].includes(o.type)) o.yaw=((o.yaw||0)+deg+360)%360;
  else if(o.type==="block"&&Math.abs(deg)>=90){ const t=o.w; o.w=o.d; o.d=t; }
  else if(o.type==="camera"&&o.look){ const a=Math.atan2(o.look[0]-o.x,o.look[2]-o.z)+deg*D2R, r=Math.hypot(o.look[0]-o.x,o.look[2]-o.z); o.look=[+(o.x+Math.sin(a)*r).toFixed(2),o.look[1],+(o.z+Math.cos(a)*r).toFixed(2)]; }
  else if(o.type==="wall"){ const mx=(o.a[0]+o.b[0])/2, mz=(o.a[1]+o.b[1])/2, c=Math.cos(deg*D2R), s=Math.sin(deg*D2R); const rot=q=>[+(mx+(q[0]-mx)*c-(q[1]-mz)*s).toFixed(3),+(mz+(q[0]-mx)*s+(q[1]-mz)*c).toFixed(3)]; o.a=rot(o.a); o.b=rot(o.b); }
  edChanged({inspector:true});
}

// ---------------------------------------------------------------- the side panel
const H=(tag,attrs={},kids=[])=>{ const e=document.createElement(tag); for(const k in attrs){ const v=attrs[k]; if(k==="text") e.textContent=v; else if(k==="html") e.innerHTML=v; else if(k.startsWith("on")) e[k]=v; else if(k==="class") e.className=v; else if(v!==false&&v!=null) e.setAttribute(k,v===true?"":v); } for(const c of [].concat(kids)) if(c) e.appendChild(typeof c==="string"?document.createTextNode(c):c); return e; };
let fid=0; const nid=()=>"f"+(++fid);
function fRow(label, input, hint){ if(/texture|Other side/i.test(label)) return H("div",{hidden:true}); const id=input.id||(input.id=nid()); return H("div",{class:"frow"},[H("label",{for:id,text:label}),input,hint?H("small",{class:"fhint",text:hint}):null]); }
function fNum(o,k,opt={}){ const i=H("input",{type:"number",step:opt.step??0.1,min:opt.min,max:opt.max,value:o[k]??""}); if(opt.ph) i.placeholder=opt.ph;
  i.oninput=()=>{ const v=i.value===""?(opt.blank??""):parseFloat(i.value); if(i.value!==""&&!isFinite(v)) return; o[k]=v; (opt.on||(()=>edChanged()))(v); }; return i; }
function fText(o,k,opt={}){ const i=H(opt.area?"textarea":"input",{type:"text",placeholder:opt.ph||""}); i.value=o[k]??""; if(opt.list) i.setAttribute("list",opt.list); i.oninput=()=>{ o[k]=i.value; (opt.on||(()=>edChanged({noRebuild:opt.noRebuild})))(i.value); }; return i; }
function fColor(o,k,opt={}){ const i=H("input",{type:"color"}); i.value=hexStr(o[k]); i.oninput=()=>{ o[k]=i.value; (opt.on||(()=>edChanged()))(i.value); }; return i; }
function fCheck(o,k,label,opt={}){ const i=H("input",{type:"checkbox"}); i.checked=!!o[k]; i.onchange=()=>{ o[k]=i.checked; (opt.on||(()=>edChanged({inspector:opt.re})))(i.checked); }; return H("label",{class:"fchk"},[i,label]); }
function fSelect(o,k,options,opt={}){ const s=H("select"); for(const opt of options){ if(!Array.isArray(opt)){ const g=H("optgroup",{label:opt.group}); for(const [vv,tt] of opt.items){ g.appendChild(H("option",{value:vv,text:tt})); } s.appendChild(g); continue; } s.appendChild(H("option",{value:opt[0],text:opt[1]})); } s.value=String(o[k]??"");
  s.onchange=()=>{ o[k]=opt.num?+s.value:s.value; (opt.on||(()=>edChanged({inspector:opt.re})))(s.value); }; return s; }
function fBtns(list){ return H("div",{class:"fbtns"},list.map(([t,f,cls])=>H("button",{class:"btn small"+(cls?" "+cls:""),text:t,onclick:e=>{ e.currentTarget.blur(); f(e); }}))); }
function fConfirm(text, f){ const b=H("button",{class:"btn small danger",text}); let armed=0; b.onclick=()=>{ if(armed&&Date.now()-armed<3000){ armed=0; b.textContent=text; f(); } else { armed=Date.now(); b.textContent="Click again to confirm"; setTimeout(()=>{ if(armed){ armed=0; b.textContent=text; } },3000); } }; return b; }
function fHead(t,sub){ return H("div",{class:"fhead"},[H("h3",{text:t}),sub?H("p",{class:"muted",text:sub}):null]); }
const enemyOptions=()=>[["across","Random ACROSS"],{group:"ACROSS subclasses",items:VARIANTS.map(v=>["across:"+v.key,v.name])},["across_legless","Legless crawler"],["brute","Louis (Brute)"],["runner","Runner (BCROSS)"],["tactician","Tactician (BCROSS)"],["contortionist","Contortionist (BCROSS)"],["reacher","Reacher, long neck (BCROSS)"],["reacher_arm","Reacher, long arms (BCROSS)"],["splithead","Split-head Reacher (unique)"],["hob","The Hob (boss)"],["dummy","Training dummy"]];
const startOptions=[["hunting","Hunting Norah"],["wander","Wandering (unaware)"],["stand","Standing still"],["feed","Feeding"],["playdead","Playing dead"],["lurk","Lurking"]];
function assetOptions(){ const cats={}; for(const a of sbAssetList()) (cats[a.cat||"other"]=cats[a.cat||"other"]||[]).push([a.id,a.name]); return Object.entries(cats).map(([c,items])=>({group:c,items})); }

function edRenderSide(){ edRenderInspector(); edRenderAssets(); edRenderMap(); edRenderFiles(); }
function edRenderInspector(){
  const P=$("pane-inspect"); if(!P) return; P.innerHTML=""; const o=selObj();
  if(!o){ edToolOptions(P); return; }
  const re=()=>edRenderInspector();
  const head={wall:"Wall",floor:"Floor",block:"Block",pillar:"Pillar",prop:"Furniture",item:"Item on the floor",exit:"Exit",light:"Light",camera:"Fixed camera",spawn:"Norah's start",enemy:"Enemy",corpse:"Body",path:"Path"}[o.type]||o.type;
  P.appendChild(fHead(head, o.type==="prop"?(sbAsset(o.asset)||{}).name:null));
  const pos=()=>{ P.appendChild(fRow("X",fNum(o,"x",{step:0.05}))); P.appendChild(fRow("Z",fNum(o,"z",{step:0.05}))); };
  switch(o.type){
    case "wall": {
      P.appendChild(fRow("Start X / Z",H("div",{class:"pair"},[fNum(o.a,0,{step:0.05}),fNum(o.a,1,{step:0.05})]))); P.appendChild(fRow("End X / Z",H("div",{class:"pair"},[fNum(o.b,0,{step:0.05}),fNum(o.b,1,{step:0.05})])));
      P.appendChild(fRow("Length",H("span",{class:"val",text:Math.hypot(o.b[0]-o.a[0],o.b[1]-o.a[1]).toFixed(2)+" m"})));
      P.appendChild(fRow("Height (m)",fNum(o,"height",{step:0.1,min:0.2}))); P.appendChild(fRow("Thickness",fNum(o,"thick",{step:0.02,min:0.04})));
      P.appendChild(fCheck(o,"weak","Louis can smash through it")); P.appendChild(fRow("Colour",fColor(o,"color"))); P.appendChild(fRow("Texture",fSelect(o,"tex",sbTexOptions()))); P.appendChild(fRow("Other side",fSelect(o,"texB",sbTexOptions("(same)"))));
      P.appendChild(H("div",{class:"label",text:"Doors, windows and openings"}));
      const L=Math.hypot(o.b[0]-o.a[0],o.b[1]-o.a[1]);
      if(!o.openings.length) P.appendChild(H("p",{class:"muted",text:"None. Use the Door, Window or Opening tool and click on this wall."}));
      for(const op of o.openings){ const box=H("div",{class:"card"+(op.id===ED.selOp?" on":"")}); box.onclick=e=>{ if(ED.selOp!==op.id){ ED.selOp=op.id; ED.planDirty=true; box.classList.add("on"); } };
        box.appendChild(fRow("Kind",fSelect(op,"kind",[["door","Door"],["window","Window"],["gap","Open doorway"]],{re:true})));
        box.appendChild(fRow("Along wall (m)",fNum(op,"at",{step:0.05,min:0,max:L}))); box.appendChild(fRow("Width",fNum(op,"width",{step:0.05,min:0.3})));
        if(op.kind==="window"){ box.appendChild(fRow("Sill height",fNum(op,"sill",{step:0.05}))); box.appendChild(fRow("Top",fNum(op,"top",{step:0.05}))); }
        if(op.kind==="door"){ box.appendChild(fCheck(op,"closed","Starts closed")); box.appendChild(fCheck(op,"locked","Locked",{re:true}));
          if(op.locked) box.appendChild(fRow("Key that opens it",fText(op,"key",{ph:"e.g. Clinic key",list:"keyNames"}),"Put an item with this exact name in a container or on the floor. Louis can still smash it."));
          box.appendChild(fRow("Swings",fSelect(op,"side",[["1","One way"],["-1","The other way"]],{num:true}))); }
        box.appendChild(fBtns([["Remove",()=>{ edSnapshot(); o.openings=o.openings.filter(x=>x!==op); ED.selOp=null; edChanged({inspector:true}); },"danger"]]));
        P.appendChild(box); }
      break; }
    case "floor": pos(); P.appendChild(fRow("Width",fNum(o,"w",{step:0.25,min:0.2}))); P.appendChild(fRow("Depth",fNum(o,"d",{step:0.25,min:0.2})));
      P.appendChild(fRow("Height (m)",fNum(o,"y",{step:0.05}),"Characters stand at this height anywhere on this floor."));
      P.appendChild(fBtns([["Match the ground under it",()=>{ if(!ED.doc.terrain||!ED.doc.terrain.on) return; edSnapshot(); o.y=+tSample(ED.doc.terrain,o.x+o.w/2,o.z+o.d/2).toFixed(2); edChanged({inspector:true}); }],["Flatten the ground to it",()=>{ const T=ED.doc.terrain; if(!T||!T.on) return; edSnapshot(); tEach(T,o.x+o.w/2,o.z+o.d/2,Math.hypot(o.w,o.d)/2+2,(k,d,x,z)=>{ const inside=x>=o.x-1&&x<=o.x+o.w+1&&z>=o.z-1&&z<=o.z+o.d+1; if(inside) T.h[k]=+o.y||0; }); edChanged({terrain:true}); }]]));
      P.appendChild(fRow("Texture",fSelect(o,"tex",sbTexOptions("(two-tone check)")))); P.appendChild(fRow("Texture size",fNum(o,"scale",{step:0.25,min:0.25,ph:"1"}))); P.appendChild(fRow("Colours",H("div",{class:"pair"},[fColor(o,"colA"),fColor(o,"colB")]))); break;
    case "block": pos(); P.appendChild(fRow("Width",fNum(o,"w",{step:0.05,min:0.1}))); P.appendChild(fRow("Depth",fNum(o,"d",{step:0.05,min:0.1}))); P.appendChild(fRow("Height",fNum(o,"h",{step:0.05,min:0.05}),"0.35–1.3 m can be vaulted (Space)."));
      P.appendChild(fRow("Name",fText(o,"name",{ph:"crate"}))); P.appendChild(fRow("Colour",fColor(o,"color"))); P.appendChild(fRow("Texture",fSelect(o,"tex",sbTexOptions()))); P.appendChild(fCheck(o,"push","Can be pushed (E)"));
      edContainerUI(P,o); break;
    case "pillar": pos(); P.appendChild(fRow("Radius",fNum(o,"r",{step:0.05,min:0.05}))); P.appendChild(fRow("Height",fNum(o,"h",{step:0.1}))); P.appendChild(fRow("Colour",fColor(o,"color"))); break;
    case "prop": { pos(); P.appendChild(fRow("Model",fSelect(o,"asset",assetOptions(),{re:true})));
      P.appendChild(fRow("Turn (°)",fNum(o,"rot",{step:15}),"Q / E turn it in 15° steps (Shift: 90°).")); P.appendChild(fRow("Size ×",fNum(o,"scale",{step:0.05,min:0.05})));
      const det=H("details",{},[H("summary",{text:"Stretch, lift"})]); det.appendChild(fRow("Stretch X / Y / Z",H("div",{class:"trio"},[fNum(o,"sx",{step:0.05,ph:"1"}),fNum(o,"sy",{step:0.05,ph:"1"}),fNum(o,"sz",{step:0.05,ph:"1"})]))); det.appendChild(fRow("Lift (m)",fNum(o,"y",{step:0.05,ph:"0"}),"Raise it off the ground, onto a table or shelf.")); P.appendChild(det);
      P.appendChild(fRow("Blocks movement",fSelect(o,"solid",[["auto","Automatic (by size)"],["true","Yes"],["false","No (walk through)"]],{on:v=>{ o.solid=v==="auto"?"auto":v==="true"; edChanged(); }})));
      P.appendChild(fRow("Can be pushed",fSelect(o,"push",[["auto","Automatic"],["true","Yes"],["false","No"]],{on:v=>{ o.push=v==="auto"?"auto":v==="true"; edChanged(); }})));
      const a=sbAsset(o.asset); if(a&&a.light) P.appendChild(fCheck({on:o.light!==false},"on","Its lamp is lit",{on:v=>{ o.light=v; edChanged(); }}));
      P.appendChild(fRow("Name in game",fText(o,"name",{ph:a?a.name.split(/[,(]/)[0].toLowerCase():""}),"Shown as \"E: search the …\"."));
      edContainerUI(P,o); break; }
    case "item": pos(); edEntryFields(P,o); break;
    case "exit": pos(); P.appendChild(fRow("Radius",fNum(o,"r",{step:0.1,min:0.3}))); P.appendChild(fRow("Needs item",fText(o,"needs",{ph:"nothing",list:"keyNames"}),"Name of an item Norah must carry, e.g. Car keys. Leave empty for an open exit.")); P.appendChild(fRow("Label",fText(o,"label",{ph:"the exit",noRebuild:true}))); break;
    case "light": pos(); P.appendChild(fRow("Height (m)",fNum(o,"y",{step:0.1}))); P.appendChild(fRow("Colour",fColor(o,"color"))); P.appendChild(fRow("Brightness",fNum(o,"intensity",{step:0.1,min:0}))); P.appendChild(fRow("Reach (m)",fNum(o,"dist",{step:0.5,min:0.5}))); break;
    case "camera": pos(); P.appendChild(fRow("Height (m)",fNum(o,"y",{step:0.1}))); P.appendChild(fRow("Field of view",fNum(o,"fov",{step:1,min:20,max:120}))); P.appendChild(fCheck(o,"track","Turns to follow Norah"));
      P.appendChild(fRow("Looks at X / Y / Z",H("div",{class:"trio"},[fNum(o.look,0,{step:0.1}),fNum(o.look,1,{step:0.1}),fNum(o.look,2,{step:0.1})])));
      P.appendChild(fBtns([["Look through it (3D)",()=>{ edSetView("3d"); ED.preview=o.id; }]])); P.appendChild(H("p",{class:"muted",text:"Fixed cameras are used when Camera / controls in the play panel is set to a fixed-camera mode. Drag on the map while placing to aim."})); break;
    case "spawn": pos(); P.appendChild(fRow("Facing (°)",fNum(o,"yaw",{step:15}))); P.appendChild(H("p",{class:"muted",text:"Starting health, ammo and items are on the MAP tab."})); break;
    case "enemy": { pos(); P.appendChild(fRow("Type",fSelect(o,"kind",enemyOptions(),{re:true}))); P.appendChild(fRow("Starts",fSelect(o,"start",startOptions))); if(String(o.kind||"").startsWith("across")) P.appendChild(fRow("Moves",fSelect(o,"move",[["","Auto: by health, some start slower"],["marionette","Marionette (healthy)"],["lurcher","Lurcher"],["puller","Puller"]])));
      P.appendChild(fRow("Facing (°)",fNum(o,"yaw",{step:15}))); P.appendChild(fRow("Health ×",fNum(o,"hpMul",{step:0.1,min:0.1}))); P.appendChild(fRow("Speed ×",fNum(o,"speedMul",{step:0.1,min:0.1})));
      const v=(o.kind||"").startsWith("across:")?VMAP[o.kind.slice(7)]:null; if(v) P.appendChild(H("p",{class:"muted",text:v.fights})); break; }
    case "corpse": pos(); P.appendChild(fRow("Turn (°)",fNum(o,"yaw",{step:15}))); break;
    case "path": P.appendChild(fRow("Width",fNum(o,"width",{step:0.1,min:0.2}))); P.appendChild(fRow("Texture",fSelect(o,"tex",sbTexOptions()))); P.appendChild(fRow("Colour",fColor(o,"color"))); P.appendChild(H("p",{class:"muted",text:`${(o.points||[]).length} points. Paths are flat: flatten the terrain under them for roads.`})); break;
  }
  P.appendChild(fBtns([["Duplicate (Ctrl+D)",edDuplicate],["Deselect (Esc)",()=>{ ED.sel=null; edRenderInspector(); edUpdateSelBox(); ED.planDirty=true; }]]));
  P.appendChild(H("div",{class:"fbtns"},[fConfirm("Delete",edDelete)]));
}
function edEntryFields(P,e){
  P.appendChild(fRow("Item",fSelect(e,"item",itemOptions(),{re:true})));
  const d=itemDef(e.item); P.appendChild(fRow(e.item==="ammo"?"Rounds":"How many",fNum(e,"qty",{step:1,min:1})));
  if(["key","note","custom","truck_keys","house_keys"].includes(e.item)||d.cat==="key"||d.cat==="document") P.appendChild(fRow("Name",fText(e,"name",{ph:d.name})));
  if(d.cat==="document"||e.item==="custom") P.appendChild(fRow("Text",fText(e,"text",{area:true,ph:d.desc})));
  P.appendChild(H("p",{class:"muted",text:d.desc}));
}
function edContainerUI(P,o){
  P.appendChild(H("div",{class:"label",text:"Searchable"}));
  P.appendChild(fCheck(o,"search","Norah can search it (E) and take what's inside",{on:v=>{ if(v&&!o.items) o.items=[]; edChanged({inspector:true}); }}));
  if(!o.search) return; o.items=o.items||[];
  const box=H("div",{class:"card"});
  if(!o.items.length) box.appendChild(H("p",{class:"muted",text:"Empty. Searching it still takes time and makes noise."}));
  o.items.forEach((e,i)=>{ const row=H("div",{class:"entry"});
    row.appendChild(fSelect(e,"item",itemOptions(),{re:true})); row.appendChild(fNum(e,"qty",{step:1,min:1}));
    row.appendChild(H("button",{class:"btn small danger",text:"×",title:"Remove",onclick:()=>{ edSnapshot(); o.items.splice(i,1); edChanged({inspector:true}); }}));
    const d=itemDef(e.item); if(d.cat==="key"||d.cat==="document"||e.item==="custom"){ const sub=H("div",{class:"entrySub"}); sub.appendChild(fText(e,"name",{ph:"Name: "+d.name,list:d.cat==="key"?"keyNames":null})); if(d.cat==="document"||e.item==="custom") sub.appendChild(fText(e,"text",{area:true,ph:"What it says"})); row.appendChild(sub); }
    box.appendChild(row); });
  const add={item:"ammo"}; const sel=fSelect(add,"item",itemOptions(),{on:()=>{}});
  box.appendChild(H("div",{class:"entry"},[sel,H("button",{class:"btn small",text:"Add",onclick:()=>{ edSnapshot(); const d=ITEMS[add.item]; o.items.push({item:add.item,qty:d&&d.qty?d.qty:1,name:"",text:""}); edChanged({inspector:true}); }})]));
  box.appendChild(fBtns([["Random loot",()=>{ edSnapshot(); const n=1+Math.floor(Math.random()*2); o.items=[]; for(let i=0;i<n;i++){ const [k,q]=LOOT[Math.floor(Math.random()*LOOT.length)]; o.items.push({item:k,qty:q,name:"",text:""}); } edChanged({inspector:true}); }],["Empty it",()=>{ edSnapshot(); o.items=[]; edChanged({inspector:true}); }]]));
  P.appendChild(box);
}
function edToolOptions(P){
  const t=ED.tool, O=ED.opts[t]||{}, tl=TOOLS.find(x=>x[0]===t);
  P.appendChild(fHead(tl?tl[1]+" tool":"", HINTS[t]));
  const re=()=>edRenderInspector(), nop=()=>{ ED.planDirty=true; };
  switch(t){
    case "select": P.appendChild(H("p",{class:"muted",html:"Nothing selected. Click something in the plan or the 3D view.<br><br><b>Plan:</b> drag empty space or right-drag to pan, wheel to zoom.<br><b>3D:</b> drag empty space or right-drag to orbit, middle-drag (or Shift+right-drag) to pan, wheel to zoom.<br><b>Tab</b> switches views · <b>Enter</b> plays from Norah's start · <b>Shift+Enter</b> plays from the cursor · <b>H</b> centres on the selection."})); break;
    case "wall": case "room": P.appendChild(fRow("Wall height",fNum(ED.opts.wall,"height",{step:0.1,on:nop}))); P.appendChild(fRow("Thickness",fNum(ED.opts.wall,"thick",{step:0.02,on:nop}))); P.appendChild(fRow("Colour",fColor(ED.opts.wall,"color",{on:nop}))); P.appendChild(fRow("Texture",fSelect(ED.opts.wall,"tex",sbTexOptions(),{on:nop})));
      if(t==="room") P.appendChild(fRow("Floor texture",fSelect(ED.opts.floor,"tex",sbTexOptions("(two-tone check)"),{on:nop}))); break;
    case "floor": P.appendChild(fRow("Texture",fSelect(O,"tex",sbTexOptions("(two-tone check)"),{on:nop}))); P.appendChild(fRow("Colours",H("div",{class:"pair"},[fColor(O,"colA",{on:nop}),fColor(O,"colB",{on:nop})]))); break;
    case "door": P.appendChild(fRow("Width",fNum(O,"width",{step:0.05,on:nop}))); P.appendChild(fCheck(O,"closed","Starts closed",{on:nop})); P.appendChild(fCheck(O,"locked","Locked",{on:re})); if(O.locked) P.appendChild(fRow("Key name",fText(O,"key",{ph:"e.g. Clinic key",list:"keyNames",on:nop}))); break;
    case "window": P.appendChild(fRow("Width",fNum(O,"width",{step:0.05,on:nop}))); P.appendChild(fRow("Sill",fNum(O,"sill",{step:0.05,on:nop}))); P.appendChild(fRow("Top",fNum(O,"top",{step:0.05,on:nop}))); P.appendChild(H("p",{class:"muted",text:"ACROSS that are hunting smash through windows."})); break;
    case "gap": P.appendChild(fRow("Width",fNum(O,"width",{step:0.05,on:nop}))); break;
    case "block": P.appendChild(fRow("Height",fNum(O,"h",{step:0.05,on:nop}))); P.appendChild(fRow("Name",fText(O,"name",{on:nop}))); P.appendChild(fRow("Colour",fColor(O,"color",{on:nop}))); P.appendChild(fRow("Texture",fSelect(O,"tex",sbTexOptions(),{on:nop}))); P.appendChild(fCheck(O,"push","Can be pushed",{on:nop})); P.appendChild(fCheck(O,"search","Searchable",{on:nop})); break;
    case "pillar": P.appendChild(fRow("Radius",fNum(O,"r",{step:0.05,on:nop}))); P.appendChild(fRow("Height",fNum(O,"h",{step:0.1,on:nop}))); P.appendChild(fRow("Colour",fColor(O,"color",{on:nop}))); break;
    case "prop": { const a=sbAsset(O.asset); P.appendChild(fRow("Model",fSelect(O,"asset",assetOptions(),{on:re}))); P.appendChild(fRow("Turn (°)",fNum(O,"rot",{step:15,on:nop}))); P.appendChild(fRow("Size ×",fNum(O,"scale",{step:0.05,on:nop})));
      if(a&&a.search) P.appendChild(H("p",{class:"muted",text:"This model is searchable by default. Select it after placing to put items inside."}));
      P.appendChild(fBtns([["Browse the library",()=>edSetTab("assets")]])); break; }
    case "terrain": {
      const T=ED.doc.terrain; if(!T||!T.on) P.appendChild(H("p",{class:"muted",text:"This map has no terrain yet. The first stroke switches it on, sized to fit the map. Set its size on the MAP tab."}));
      P.appendChild(fRow("Brush",fSelect(O,"mode",[["raise","Raise"],["lower","Lower"],["smooth","Smooth"],["flatten","Flatten (to where you start)"],["noise","Roughen"]],{on:re})));
      P.appendChild(fRow("Radius (m)",fNum(O,"radius",{step:0.5,min:0.5,max:30,on:nop}))); P.appendChild(fRow("Strength",fNum(O,"strength",{step:0.1,min:0.05,max:3,on:nop})));
      if(O.mode==="paint"){ const sw=H("div",{class:"swatches"}); GROUND.forEach((gr,i)=>{ sw.appendChild(H("button",{class:"sw","aria-pressed":String(+O.paint===i),title:gr.name,style:`background:${gr.c}`,onclick:()=>{ O.paint=i; re(); }})); }); P.appendChild(sw); P.appendChild(H("p",{class:"muted",text:GROUND[O.paint].name})); }
      P.appendChild(H("p",{class:"muted",text:"Floors keep their own height; use a floor's \"Flatten the ground to it\" to seat a building. Hills block bullets."})); break; }
    case "enemy": P.appendChild(fRow("Type",fSelect(O,"kind",enemyOptions(),{on:re}))); P.appendChild(fRow("Starts",fSelect(O,"start",startOptions,{on:nop}))); { const v=O.kind.startsWith("across:")?VMAP[O.kind.slice(7)]:null; if(v) P.appendChild(H("p",{class:"muted",text:v.moves+" "+v.fights})); } break;
    case "item": edEntryFields(P,O); break;
    case "exit": P.appendChild(fRow("Radius",fNum(O,"r",{step:0.1,on:nop}))); P.appendChild(fRow("Needs item",fText(O,"needs",{ph:"nothing",list:"keyNames",on:nop}))); break;
    case "light": P.appendChild(fRow("Colour",fColor(O,"color",{on:nop}))); P.appendChild(fRow("Brightness",fNum(O,"intensity",{step:0.1,on:nop}))); P.appendChild(fRow("Reach (m)",fNum(O,"dist",{step:0.5,on:nop}))); P.appendChild(fRow("Height above ground",fNum(O,"height",{step:0.1,on:nop}))); P.appendChild(H("p",{class:"muted",text:`Up to ${SB_MAXLIGHTS} lights are lit in play (lamps count). Light makes Norah easier to see.`})); break;
    case "camera": P.appendChild(fRow("Height above ground",fNum(O,"height",{step:0.1,on:nop}))); P.appendChild(fRow("Field of view",fNum(O,"fov",{step:1,on:nop}))); P.appendChild(fCheck(O,"track","Turns to follow Norah",{on:nop})); break;
    case "path": P.appendChild(fRow("Width",fNum(O,"width",{step:0.1,on:nop}))); P.appendChild(fRow("Texture",fSelect(O,"tex",sbTexOptions(),{on:nop}))); P.appendChild(fRow("Colour",fColor(O,"color",{on:nop}))); break;
  }
}
// ASSETS tab
let thumbR=null, thumbScene=null, thumbCam=null; const thumbQ=[]; let thumbBusy=false;
function edThumbAsync(id, done){ if(ED.thumbs[id]){ done&&done(); return; } thumbQ.push([id,done]); if(!thumbBusy) edThumbPump(); }
function edThumbPump(){ thumbBusy=true; const job=thumbQ.shift(); if(!job){ thumbBusy=false; return; } const [id,done]=job; if(!ED.thumbs[id]){ try{ ED.thumbs[id]=edThumb(id); }catch(e){ ED.thumbs[id]=""; } } done&&done(); setTimeout(edThumbPump,0); }
function edThumb(id){
  if(!thumbR){ const c=document.createElement("canvas"); c.width=128; c.height=96; thumbR=new THREE.WebGLRenderer({canvas:c,antialias:true,preserveDrawingBuffer:true}); thumbR.setSize(128,96,false); thumbScene=new THREE.Scene(); thumbScene.background=new THREE.Color(0x101312);
    thumbScene.add(new THREE.HemisphereLight(0xdde4f0,0x302820,1.0)); const dl=new THREE.DirectionalLight(0xffffff,0.6); dl.position.set(2,4,3); thumbScene.add(dl); thumbCam=new THREE.PerspectiveCamera(35,128/96,0.01,200); }
  const g=sbAssetGroup(id); thumbScene.add(g); const B=sbAssetBounds(id); const cx=(B.minX+B.maxX)/2, cy=(B.minY+B.maxY)/2, cz=(B.minZ+B.maxZ)/2; const r=Math.max(0.2,Math.hypot(B.maxX-B.minX,B.maxY-B.minY,B.maxZ-B.minZ)/2);
  thumbCam.position.set(cx+r*1.5,cy+r*1.1,cz+r*2.1); thumbCam.lookAt(cx,cy,cz); thumbR.render(thumbScene,thumbCam); const url=thumbR.domElement.toDataURL(); thumbScene.remove(g); g.traverse(o=>{ if(o.geometry) o.geometry.dispose(); }); return url;
}
function edRenderAssets(){
  const P=$("pane-assets"); if(!P) return; P.innerHTML="";
  P.appendChild(fHead("Furniture & props",`${Object.keys(LIB_ASSETS).length} pieces, each a grey box the size of the real thing. Click one, then click on the map to place it. SEARCH marks pieces that are searchable by default.`));
  const cats=["all",...new Set(sbAssetList().map(a=>a.cat||"other"))];
  const q=H("input",{type:"search",placeholder:"Search: bed, crate, pew…",value:ED.assetQ}); q.oninput=()=>{ ED.assetQ=q.value; fill(); };
  const cs=H("select"); for(const c of cats) cs.appendChild(H("option",{value:c,text:c==="all"?"All folders":c})); cs.value=ED.assetCat; cs.onchange=()=>{ ED.assetCat=cs.value; fill(); };
  P.appendChild(H("div",{class:"pair"},[q,cs])); const grid=H("div",{class:"lib"}); P.appendChild(grid);
  const io=new IntersectionObserver(ents=>{ for(const en of ents) if(en.isIntersecting){ const im=en.target; io.unobserve(im); edThumbAsync(im.dataset.id,()=>{ im.src=ED.thumbs[im.dataset.id]||""; }); } },{root:P});
  function fill(){ grid.innerHTML=""; const qq=ED.assetQ.trim().toLowerCase();
    for(const a of sbAssetList()){ if(ED.assetCat!=="all"&&(a.cat||"other")!==ED.assetCat) continue; if(qq&&!(a.name.toLowerCase().includes(qq)||a.id.includes(qq))) continue;
      const B=sbAssetBounds(a.id), im=H("small",{class:"dims",text:`${(B.maxX-B.minX).toFixed(1)} × ${(B.maxZ-B.minZ).toFixed(1)} × ${B.maxY.toFixed(1)} m`});
      const b=H("button",{class:"libitem","aria-pressed":String(ED.opts.prop.asset===a.id&&ED.tool==="prop"),title:a.name,onclick:()=>{ ED.opts.prop.asset=a.id; edSetTool("prop"); fill(); }},[im,H("span",{text:a.name}),a.search?H("small",{class:"tag",text:"SEARCH"}):null]);
      grid.appendChild(b); } }
  fill();
}
// MAP tab
function edRenderMap(){
  const P=$("pane-map"); if(!P) return; P.innerHTML=""; const d=ED.doc, E=d.env, st=d.start;
  P.appendChild(fHead("This map"));
  P.appendChild(fRow("Name",fText(d,"name",{noRebuild:true,on:v=>{ $("edName").value=v; edChanged({noRebuild:true}); }})));
  P.appendChild(fRow("Opening note",fText(d,"note",{area:true,ph:"Shown in the log when play starts",noRebuild:true})));
  P.appendChild(fRow("Goal",fSelect(d,"win",[["either","Clear every enemy or reach an exit"],["exit","Reach an exit"],["kill","Clear every enemy"],["none","Sandbox (never ends)"]],{on:()=>edChanged({noRebuild:true})})));
  P.appendChild(H("div",{class:"label",text:"Norah starts with"}));
  P.appendChild(fRow("Health",fNum(st,"hp",{step:5,min:1,ph:`${CFG.norah.hp} (panel)`,on:()=>edChanged({noRebuild:true})})));
  P.appendChild(fRow("Loaded / spare",H("div",{class:"pair"},[fNum(st,"rounds",{step:1,min:0,ph:String(CFG.rev.chambers),on:()=>edChanged({noRebuild:true})}),fNum(st,"spare",{step:1,min:0,ph:String(CFG.rev.spare),on:()=>edChanged({noRebuild:true})})]),"Empty uses the play panel's revolver settings."));
  const sbox=H("div",{class:"card"}); const so={search:true,items:st.items}; st.items.forEach((e,i)=>{ const row=H("div",{class:"entry"}); row.appendChild(fSelect(e,"item",itemOptions(),{on:()=>edChanged({noRebuild:true,inspector:false})})); row.appendChild(fNum(e,"qty",{step:1,min:1,on:()=>edChanged({noRebuild:true})})); row.appendChild(H("button",{class:"btn small danger",text:"×",onclick:()=>{ edSnapshot(); st.items.splice(i,1); edChanged({noRebuild:true}); edRenderMap(); }})); const dd=itemDef(e.item); if(dd.cat==="key"||dd.cat==="document") row.appendChild(H("div",{class:"entrySub"},[fText(e,"name",{ph:"Name: "+dd.name,noRebuild:true})])); sbox.appendChild(row); });
  const add={item:"flashlight"}; sbox.appendChild(H("div",{class:"entry"},[fSelect(add,"item",itemOptions(),{on:()=>{}}),H("button",{class:"btn small",text:"Add",onclick:()=>{ edSnapshot(); const dd=ITEMS[add.item]; st.items.push({item:add.item,qty:dd&&dd.qty?dd.qty:1,name:"",text:""}); edChanged({noRebuild:true}); edRenderMap(); }})]));
  P.appendChild(sbox); P.appendChild(fCheck(st,"flashOn","Flashlight on at the start",{on:()=>edChanged({noRebuild:true})}));
  P.appendChild(H("div",{class:"label",text:"Sky, fog and light"}));
  P.appendChild(fRow("Sky",fColor(E,"sky"))); P.appendChild(fRow("Fog colour",fColor(E,"fogColor",{on:()=>edChanged()}))); P.appendChild(fRow("Fog thickness",fNum(E,"fog",{step:0.005,min:0,max:0.3}),"Build view hides fog unless Fog is ticked above the view."));
  P.appendChild(fRow("Sky light",fNum(E,"hemi",{step:0.05,min:0}))); P.appendChild(fRow("Moonlight",fNum(E,"moon",{step:0.05,min:0})));
  P.appendChild(fRow("Darkness for stealth",fNum(E,"dark",{step:0.01,min:0,max:1,ph:"panel ("+CFG.stealth.ambient+")",blank:""}),"How visible Norah is in unlit places: 0 is pitch black, 0.6 is broad daylight."));
  P.appendChild(fCheck(E,"fill","Add a soft fill light over the whole map"));
  P.appendChild(H("div",{class:"label",text:"Terrain"}));
  const T=d.terrain;
  if(!T||!T.on){ P.appendChild(H("p",{class:"muted",text:"Off. Characters walk on flat ground at height 0, or on floors."})); P.appendChild(fBtns([["Add terrain sized to the map",()=>{ edSnapshot(); edEnsureTerrain(); edChanged({terrain:true}); edRenderMap(); }]])); }
  else {
    const t2={x0:T.x0,z0:T.z0,w:(T.nx-1)*T.cell,d:(T.nz-1)*T.cell,cell:T.cell};
    P.appendChild(fRow("Corner X / Z",H("div",{class:"pair"},[fNum(t2,"x0",{step:1,on:()=>{}}),fNum(t2,"z0",{step:1,on:()=>{}})])));
    P.appendChild(fRow("Size W / D (m)",H("div",{class:"pair"},[fNum(t2,"w",{step:2,min:4,on:()=>{}}),fNum(t2,"d",{step:2,min:4,on:()=>{}})])));
    P.appendChild(fRow("Grid cell",fSelect(t2,"cell",[["0.5","0.5 m (fine)"],["1","1 m"],["2","2 m (big maps)"]],{num:true,on:()=>{}})));
    P.appendChild(fBtns([["Apply size",()=>{ edSnapshot(); d.terrain=edResizeTerrain(T,+t2.x0,+t2.z0,+t2.w,+t2.d,+t2.cell); edChanged({terrain:true,now:true}); edRenderMap(); }],["Fit to the map",()=>{ edSnapshot(); const B=docBounds({objects:d.objects,terrain:null}); d.terrain=edResizeTerrain(T,Math.floor(B.x0-6),Math.floor(B.z0-6),Math.ceil(B.x1-B.x0+12),Math.ceil(B.z1-B.z0+12),T.cell); edChanged({terrain:true,now:true}); edRenderMap(); }]]));
    const hl={amt:1.5}; P.appendChild(fRow("Hill height",fNum(hl,"amt",{step:0.25,min:0.25,on:()=>{}})));
    P.appendChild(fBtns([["Add rolling hills",()=>{ edSnapshot(); terrainHills(T,+hl.amt); edChanged({terrain:true,now:true}); }],["Smooth all",()=>{ edSnapshot(); for(let n=0;n<2;n++){ const h=T.h.slice(); for(let j=1;j<T.nz-1;j++) for(let i=1;i<T.nx-1;i++){ const k=j*T.nx+i; h[k]=(T.h[k]*4+T.h[k-1]+T.h[k+1]+T.h[k-T.nx]+T.h[k+T.nx])/8; } T.h=h; } edChanged({terrain:true,now:true}); }],["Flatten all",()=>{ edSnapshot(); T.h.fill(0); edChanged({terrain:true,now:true}); }]]));
    const pa={p:1}; P.appendChild(fRow("Paint everything",H("div",{class:"pair"},[fSelect(pa,"p",GROUND.map((g,i)=>[String(i),g.name]),{num:true,on:()=>{}}),H("button",{class:"btn small",text:"Paint",onclick:()=>{ edSnapshot(); T.p.fill(+pa.p); edChanged({terrain:true,now:true}); }})])));
    P.appendChild(fBtns([[ "Remove terrain",()=>{ edSnapshot(); d.terrain=null; edChanged({terrain:true,now:true}); edRenderMap(); },"danger"]]));
  }
  const c={}; for(const o of d.objects) c[o.type]=(c[o.type]||0)+1;
  P.appendChild(H("p",{class:"muted",text:"In this map: "+Object.entries(c).map(([k,v])=>`${v} ${k}${v>1?"s":""}`).join(", ")}));
}
function edResizeTerrain(T,x0,z0,w,d,cell){ const N=terrainMake(x0,z0,Math.max(4,w),Math.max(4,d),cell||1,1);
  for(let j=0;j<N.nz;j++) for(let i=0;i<N.nx;i++){ const x=x0+i*N.cell, z=z0+j*N.cell, k=j*N.nx+i; if(x>=T.x0&&z>=T.z0&&x<=T.x0+(T.nx-1)*T.cell&&z<=T.z0+(T.nz-1)*T.cell){ N.h[k]=+tSample(T,x,z).toFixed(3); const oi=Math.round((x-T.x0)/T.cell), oj=Math.round((z-T.z0)/T.cell); N.p[k]=T.p[oj*T.nx+oi]??1; } }
  return N; }
// FILES tab
function edRenderFiles(){
  const P=$("pane-files"); if(!P) return; P.innerHTML="";
  P.appendChild(fHead("Start from","Opening one replaces the map you're editing. Save it below first if you want to keep it."));
  const pl=H("div",{class:"presets"}); for(const pr of PRESETS){ let armed=0; const b=H("button",{class:"preset"},[H("b",{text:pr.name}),H("span",{text:pr.desc})]);
    b.onclick=()=>{ if(!armed){ armed=Date.now(); b.classList.add("armed"); b.querySelector("span").textContent="Click again to open (replaces the current map)"; setTimeout(()=>{ armed=0; b.classList.remove("armed"); b.querySelector("span").textContent=pr.desc; },3000); return; }
      edSnapshot(); ED.doc=sbNormalize(pr.make()); ED.sel=null; edAfterLoad(true); edStatusMsg(`Opened: ${pr.name}`); }; pl.appendChild(b); }
  P.appendChild(pl);
  P.appendChild(H("div",{class:"label",text:"Saved in this browser"}));
  const maps=edMaps(); const nm={n:ED.doc.name};
  P.appendChild(H("div",{class:"pair"},[fText(nm,"n",{on:()=>{}}),H("button",{class:"btn small primary",text:"Save",onclick:()=>{ const n=(nm.n||"").trim()||ED.doc.name; const m=edMaps(); m[n]=ED.doc; try{ localStorage.setItem("crossed_sandbox_maps",JSON.stringify(m)); edStatusMsg("Saved as "+n); }catch(e){ edStatusMsg("Couldn't save: browser storage is full. Copy the map instead."); } edRenderFiles(); }})]));
  if(!Object.keys(maps).length) P.appendChild(H("p",{class:"muted",text:"Nothing saved yet. The map you're editing is kept automatically; Save keeps named copies."}));
  for(const n of Object.keys(maps)) P.appendChild(H("div",{class:"saved"},[H("span",{text:n}),H("button",{class:"btn small",text:"Open",onclick:()=>{ edSnapshot(); ED.doc=sbNormalize(sbClone(edMaps()[n])); sbAddDocTextures(ED.doc).then(()=>edAfterLoad(true)); }}),fConfirm("Delete",()=>{ const m=edMaps(); delete m[n]; try{ localStorage.setItem("crossed_sandbox_maps",JSON.stringify(m)); }catch(e){} edRenderFiles(); })]));
  P.appendChild(H("div",{class:"label",text:"Share or move a map"}));
  const out=H("textarea",{readonly:true,class:"mono",placeholder:"Copy map JSON fills this if the clipboard is blocked"});
  P.appendChild(fBtns([["Copy map JSON",()=>{ const t=JSON.stringify(ED.doc); try{ navigator.clipboard.writeText(t).then(()=>edStatusMsg("Map copied. Paste it to Claude or into another browser."),()=>{ out.value=t; out.select(); }); }catch(e){ out.value=t; out.select(); } }]]));
  P.appendChild(out);
  P.appendChild(H("div",{class:"label",text:"Import"}));
  P.appendChild(H("p",{class:"muted",text:"Accepts this sandbox's maps, a Map Designer export (walls, doors, floors, stages, furniture, lights, cameras, markers, paths, your textures and models) and an Item Modeler export (adds its items to the item list)."}));
  const fi=H("input",{type:"file",accept:".json,application/json,text/plain"}); const ta=H("textarea",{class:"mono",placeholder:"…or paste JSON here"}); const msg=H("p",{class:"muted"}); const lv=H("div");
  const go=txt=>edImport(txt,msg,lv);
  fi.onchange=()=>{ const f=fi.files[0]; if(!f) return; const r=new FileReader(); r.onload=()=>go(String(r.result)); r.readAsText(f); };
  P.appendChild(fi); P.appendChild(ta); P.appendChild(fBtns([["Import pasted JSON",()=>go(ta.value)]])); P.appendChild(lv); P.appendChild(msg);
  const ci=ED.doc.customItems||[]; if(ci.length){ P.appendChild(H("div",{class:"label",text:"Imported items"})); for(const c of ci) P.appendChild(H("div",{class:"saved"},[H("span",{text:`${c.name} (${c.cat})`}),H("button",{class:"btn small danger",text:"Remove",onclick:()=>{ edSnapshot(); ED.doc.customItems=ci.filter(x=>x!==c); edChanged({noRebuild:true}); edRenderFiles(); }})])); }
}
function edMaps(){ try{ return JSON.parse(localStorage.getItem("crossed_sandbox_maps")||"{}"); }catch(e){ return {}; } }
function edImport(txt,msg,lvBox){
  let j; try{ j=JSON.parse(txt); }catch(e){ msg.textContent="That isn't valid JSON. Paste the whole export, from the first { to the last }."; return; }
  lvBox.innerHTML="";
  if(j&&j.app==="crossed-sandbox"){ edSnapshot(); ED.doc=sbNormalize(j); sbAddDocTextures(ED.doc).then(()=>edAfterLoad(true)); msg.textContent=`Opened "${j.name}".`; return; }
  const items=sbFindItems(j);
  if(items){ edSnapshot(); const ci=ED.doc.customItems=ED.doc.customItems||[]; let n=0; for(const it of items){ const key="im_"+(it.key||it.name||"item").replace(/\W+/g,"_").toLowerCase(); if(ITEMS[it.key]) continue; if(ci.some(c=>c.key===key)) continue; ci.push({key,name:it.name||it.key,cat:it.cat||"misc",desc:it.desc||it.examine||""}); n++; }
    edChanged({noRebuild:true}); edRenderFiles(); msg.textContent=n?`Added ${n} item${n>1?"s":""} from the Item Modeler. They're in every item list, marked ★. Items the sandbox already knows (flashlight, revolver ammo, pills…) use the built-in versions.`:"Those items are already in the list."; return; }
  const m=sbFindDesignerMap(j); if(!m){ msg.textContent="No map or items found in that JSON."; return; }
  const levels=(m.levels||[]).filter(l=>m.objects.some(o=>o.level===l.id));
  const doIt=lid=>{ const r=fromDesigner(m,lid); edSnapshot(); ED.doc=r.doc; sbAddDocTextures(ED.doc).then(()=>edAfterLoad(true));
    msg.textContent=`Imported "${ED.doc.name}"${levels.length>1?` (${r.level})`:""}: ${ED.doc.objects.length} objects.${r.skipped?` ${r.skipped} things the sandbox can't play yet were left out (roofs, ceilings, stairs, other floors, NPC figures).`:""} Furniture marked searchable in the designer is searchable here: select it to fill it.`; };
  if(levels.length>1){ const o={l:levels.find(l=>(l.elev||0)===0)?.id||levels[0].id}; lvBox.appendChild(fRow("Which floor",fSelect(o,"l",levels.map(l=>[l.id,l.name]),{on:()=>{}}))); lvBox.appendChild(fBtns([["Import this floor",()=>doIt(o.l),"primary"]])); msg.textContent=`This map has ${levels.length} floors. The sandbox plays one at a time.`; return; }
  doIt(levels[0]&&levels[0].id);
}

// ---------------------------------------------------------------- chrome
function edSetTool(t){ if(ED.draft&&ED.draft.kind==="path"&&t!=="path") edEndChain(); ED.draft=null; ED.tool=t; for(const b of document.querySelectorAll("#edTools .tool")) b.setAttribute("aria-pressed",String(b.dataset.t===t));
  if(t!=="select"&&ED.sel){ ED.sel=null; ED.selOp=null; edUpdateSelBox(); } $("edHint").textContent=HINTS[t]||""; if(ED.tab!=="inspect"&&t!=="prop") edSetTab("inspect"); edRenderInspector(); ED.planDirty=true;
  planCv.style.cursor=t==="select"?"default":"crosshair"; }
function edSetView(v){ ED.view=v; $("vPlan").setAttribute("aria-pressed",String(v==="plan")); $("v3d").setAttribute("aria-pressed",String(v==="3d")); planCv.hidden=v!=="plan"; ED.planDirty=true; if(v==="3d") ED.preview=null; }
function edSetTab(t){ ED.tab=t; for(const b of document.querySelectorAll("#edTabs button")) b.setAttribute("aria-selected",String(b.dataset.tab===t)); for(const p of document.querySelectorAll("#edSide .pane")) p.hidden=p.id!=="pane-"+t; if(t==="map") edRenderMap(); if(t==="files") edRenderFiles(); if(t==="assets") edRenderAssets(); }
function edHideSide(){ document.body.classList.remove("sideOpen"); }
let statusMsg="", statusT=0;
function edStatusMsg(t){ statusMsg=t; clearTimeout(statusT); statusT=setTimeout(()=>{ statusMsg=""; edStatus(); },3500); edStatus(); }
function edStatus(){ const c=ED.cursor, el=$("edStatus"); if(!el) return; const n=ED.doc?ED.doc.objects.length:0;
  el.innerHTML=`<span>X <b>${c.ok?c.x.toFixed(2):"–"}</b> Z <b>${c.ok?c.z.toFixed(2):"–"}</b> ground <b>${c.ok&&world?groundY(c.x,c.z).toFixed(2):"–"} m</b></span><span>${n} objects${world&&world.lightCapped?` · over ${SB_MAXLIGHTS} lights: some stay dark in play`:""}</span><span>${statusMsg||ED.saveMsg||""}</span>`; }
function edInitUI(){
  const tools=$("edTools"); tools.innerHTML="";
  for(const [k,label,key] of TOOLS) tools.appendChild(H("button",{class:"tool","data-t":k,title:`${label} (${key})`,"aria-pressed":String(k===ED.tool),onclick:()=>edSetTool(k),html:`<svg viewBox="0 0 24 24" aria-hidden="true">${IC[k]}</svg><span>${label}</span><kbd>${key}</kbd>`}));
  $("vPlan").onclick=()=>edSetView("plan"); $("v3d").onclick=()=>edSetView("3d");
  $("edUndo").onclick=edUndo; $("edRedo").onclick=edRedo; $("edPlay").onclick=()=>{ $("mm").hidden=true; playMap(null); };
  $("edName").value=ED.doc.name; $("edName").oninput=()=>{ ED.doc.name=$("edName").value; edChanged({noRebuild:true}); };
  for(const b of document.querySelectorAll("#edTabs button")) b.onclick=()=>edSetTab(b.dataset.tab);
  $("edSnap").value=String(ED.snap); $("edSnap").onchange=()=>{ ED.snap=+$("edSnap").value; $("edSnap").blur(); };
  const chip=(id,key,f)=>{ const c=$(id); c.checked=!!edPrefs[key]; c.onchange=()=>{ edPrefs[key]=c.checked; savePrefs(); f&&f(); c.blur(); }; };
  chip("edFog","fog",()=>edRebuild(true)); chip("edWork","work",()=>{ edAmb.intensity=edPrefs.work?0.55:0; }); chip("edPixel","pixel",()=>{ document.body.classList.toggle("pixel",!!edPrefs.pixel); resize(); }); document.body.classList.toggle("pixel",!!edPrefs.pixel); chip("edGrid","grid",()=>{ ED.planDirty=true; });
  $("edPanelBtn").onclick=()=>document.body.classList.toggle("sideOpen");
  const dl=$("keyNames"); dl.innerHTML=""; for(const n of ["Clinic key","House keys","Truck keys","Car keys","Front door key","Cellar key"]) dl.appendChild(H("option",{value:n}));
  edSetView(ED.view); edSetTool("select"); edSetTab("inspect"); edRenderSide();
  new ResizeObserver(()=>{ if(MODE==="build"){ resize(); ED.planDirty=true; } }).observe(canvas);
}
function edFrame(rdt){
  if(!SB.ready){ renderer.render(scene,camera); return; }
  if(MODE==="menu"){ ED.preview=null; ED.orbit.yaw+=rdt*0.06; edOrbitCam(); renderer.render(scene,camera); return; }
  if(ED.view==="3d"){ edOrbitCam(); for(const d of world.doors) applyDoor(d); renderer.render(scene,camera); }
  else if(ED.planDirty) drawPlan();
}
async function sbBoot(){
  $("edLoading").hidden=false;
  try{ await sbInitTextures(); }catch(e){ console.warn(e); }
  let d=null; try{ d=JSON.parse(localStorage.getItem("crossed_sandbox_current")||"null"); }catch(e){}
  let firstCh1=false; try{ firstCh1=!localStorage.getItem("crossed_sandbox_ch1_v1"); localStorage.setItem("crossed_sandbox_ch1_v1","1"); }catch(e){}
  if(firstCh1 && d && d.app==="crossed-sandbox"){ try{ const m=edMaps(); m["Saved before Chapter One opened ("+(d.name||"map")+")"]=d; localStorage.setItem("crossed_sandbox_maps",JSON.stringify(m)); }catch(e){} }
  ED.doc = sbNormalize(d && d.app==="crossed-sandbox" && !firstCh1 ? d : Object.assign(PRESETS[0].make(),{preset:PRESETS[0].key}));
  await sbAddDocTextures(ED.doc);
  SB.ready=true; $("edLoading").hidden=true;
  edInitUI(); goMenu("title"); edStatus();
}
