// ---------------------------------------------------------------- models: setup section and the model viewer
const MDL_GROUPS = [
  ["cast","Cast","Kenneth, Norah, Louis (human), the Stranger and Rachel."],
  ["catalogue","Catalogue adults","Adult NPCs, no roles yet. cat08 shares Louis's face: don't cast it near him."],
  ["kids","Kids","The ten catalogue kids."],
  ["across/men","ACROSS · men","across_01 and v01–v12. Bigger ones carry extra hits."],
  ["across/women","ACROSS · women","The women's twins of the same 13."],
  ["across/imposing","ACROSS · imposing","Wider bony shoulders, longer legs, big hands. Up to 2 extra hits."],
  ["across/uncanny","ACROSS · uncanny","Look test: they keep the photo's own eyes, grin and lips. Not a decision yet."],
  ["bcross/brute","BCROSS · Brutes","Louis, the one-armed woman, the club-fist, and the four two-armed Brutes (static, no rig yet)."],
  ["bcross/runner","BCROSS · Runners","Base man, woman, and one in bone armour (endgame only)."],
  ["bcross/reacher","BCROSS · Reachers","Three neck Reachers and two arm Reachers. Dies when its head comes off."],
  ["bcross/tactician","BCROSS · Tactician","The big vertical eye. Shots to the eye do full headshot damage."],
  ["bcross/contortionist","BCROSS · Contortionists","Spider-like wall and ceiling crawlers. Child-sized, base, large, and two armoured (endgame only)."]];
const mdlName = k => k.replace(/_/g," ");
function mdlKeys(g){ return Object.keys(MODEL_LIB).filter(k=>MODEL_LIB[k].g===g); }

function suModels(M){
  const MS = SIM.models = Object.assign({on:true, norah:"norah", louis:"louis_brute", pools:{}}, SIM.models||{}); MS.pools = MS.pools||{};
  M.appendChild(mh("div",{class:"suField"},[mh("label",{text:"Character models"}),suCheck(" Use the low-poly models from the repo",()=>MS.on!==false,v=>{ MS.on=v; saveSim(); renderSetup(); }),
    mh("small",{text:"Off brings back the old procedural bodies. The models still use the same AI, hitboxes and poses; the hidden rig drives their skeletons."})]));
  if(MS.on===false){ M.appendChild(mh("button",{class:"suBtn",text:"Open the model viewer",onclick:()=>mvOpen()})); return; }
  const opt = test => Object.keys(MODEL_LIB).filter(k=>MODEL_LIB[k].hip && !MODEL_LIB[k].end && test(MODEL_LIB[k],k)).map(k=>[k,mdlName(k)]);
  M.appendChild(suField("Norah",suSelect(MS,"norah",opt(I=>I.g==="cast"),saveSim),"Her model in play. The cast models are all the same build."));
  M.appendChild(suField("Louis",suSelect(MS,"louis",opt((I,k)=>LOUIS_OK.includes(k)),saveSim),"Louis turned (2.64 m). The one-armed woman and the club-fist use the same rig and moves, standing in for him."));
  for(const [v,label] of [["walker","Walker"],["crawler","Crawler"],["matron","Matron"],["mourner","Mourner"]]){
    if(MS.pools[v]==null) MS.pools[v]=MDL_DEFAULT_POOL[v];
    const n=()=>mdlPool(MS.pools[v]).length;
    const sm=mh("small",{text:""}); const upd=()=>{ sm.textContent = MS.pools[v]==="off" ? "Old procedural body." : `${n()} models; each one is picked at random when it spawns.${v==="mourner"?" Extra hits don't apply: 3 headshots always kill it.":""}`; };
    const s=suSelect(MS.pools,v,MDL_POOL_OPTS,()=>{ saveSim(); upd(); }); upd();
    M.appendChild(mh("div",{class:"suField"},[mh("label",{text:label}),s,sm])); }
  M.appendChild(mh("p",{class:"suNote",text:"Bigger ACROSS take more shots: each model's extra hits (0–2) are added to its health. Bone-armoured models are endgame only and never spawn here. Models load the first time they're used, so a body can appear as the old greybox for a moment."}));
  M.appendChild(mh("button",{class:"suBtn",text:"Open the model viewer",onclick:()=>mvOpen()}));
}

// the viewer: every model in the repo, its own clips, size and rules
const MV={open:false};
function mvBuild(){
  const st=document.createElement("style"); st.textContent=`
#mv{position:fixed;inset:0;z-index:60;background:#121010;color:#e3dccb;display:grid;grid-template-columns:260px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr);font:13px "Courier New",monospace}
#mv[hidden]{display:none}
#mvTop{grid-column:1/3;display:flex;gap:10px;align-items:center;padding:10px 14px;border-bottom:1px solid #3a3228}
#mvTop b{letter-spacing:.12em;color:#e8c77a} #mvTop .sp{flex:1}
#mvList{overflow:auto;border-right:1px solid #3a3228;padding:8px}
#mvList h4{margin:10px 4px 4px;color:#b7ad98;font-size:12px;font-weight:normal;text-transform:uppercase;letter-spacing:.08em}
#mvList button{display:block;width:100%;text-align:left;font:inherit;font-size:12.5px;color:#d8d0bc;background:none;border:0;padding:3px 6px;cursor:pointer}
#mvList button[aria-pressed=true]{background:#3a3226;color:#fff} #mvList button:hover{background:#2a241c}
#mvStage{position:relative;min-height:0} #mvCan{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab}
#mvInfo{position:absolute;left:12px;top:12px;max-width:min(420px,calc(100% - 24px));background:rgba(18,16,16,.82);border:1px solid #3a3228;padding:10px 12px;line-height:1.45}
#mvInfo h3{margin:0 0 4px;font-size:15px;color:#e8c77a} #mvInfo .gp{color:#9a9283;font-size:12px}
#mvClips{position:absolute;left:12px;bottom:12px;right:12px;display:flex;flex-wrap:wrap;gap:6px}
#mvClips button,#mvTop button{font:inherit;font-size:12.5px;color:#e3dccb;background:#2a241c;border:1px solid #5a5040;padding:6px 10px;cursor:pointer}
#mvClips button[aria-pressed=true]{background:#5a4a2a;border-color:#e8c77a}
#mv .warn{color:#ff9a6a}
@media (max-width:700px){ #mv{grid-template-columns:minmax(0,1fr);grid-template-rows:auto 34vh minmax(0,1fr)} #mvTop{grid-column:1} #mvList{border-right:0;border-bottom:1px solid #3a3228} }`;
  document.head.appendChild(st);
  const root=document.createElement("div"); root.id="mv"; root.hidden=true; root.setAttribute("role","dialog"); root.setAttribute("aria-label","Model viewer");
  root.innerHTML=`<div id="mvTop"><b>MODELS</b><span id="mvCount"></span><span class="sp"></span><button id="mvLine">Lineup</button><button id="mvClose">Close (Esc)</button></div>
    <nav id="mvList" aria-label="Models"></nav><div id="mvStage"><canvas id="mvCan"></canvas><div id="mvInfo"></div><div id="mvClips"></div></div>`;
  document.body.appendChild(root);
  const L=root.querySelector("#mvList");
  for(const [g,label] of MDL_GROUPS){ const ks=mdlKeys(g); if(!ks.length) continue; L.appendChild(Object.assign(document.createElement("h4"),{textContent:`${label} (${ks.length})`}));
    for(const k of ks){ const b=document.createElement("button"); b.textContent=mdlName(k)+(MODEL_LIB[k].end?" ·endgame":""); b.dataset.k=k; b.onclick=()=>mvShow(k); L.appendChild(b); } }
  root.querySelector("#mvCount").textContent=`${Object.keys(MODEL_LIB).length} models`;
  root.querySelector("#mvClose").onclick=mvClose; root.querySelector("#mvLine").onclick=()=>mvLineup(MV.group||"across/men");
  MV.can=root.querySelector("#mvCan"); MV.r=new THREE.WebGLRenderer({canvas:MV.can,antialias:true}); MV.r.setPixelRatio(Math.min(2,devicePixelRatio||1));
  MV.scene=new THREE.Scene(); MV.scene.background=new THREE.Color(0x24201c);
  MV.scene.add(new THREE.HemisphereLight(0xe8eef8,0x302820,0.9)); const dl=new THREE.DirectionalLight(0xffffff,0.55); dl.position.set(2,4,3); MV.scene.add(dl);
  const fl=new THREE.Mesh(new THREE.CircleGeometry(4,32),new THREE.MeshLambertMaterial({color:0x3a342c})); fl.rotation.x=-Math.PI/2; MV.scene.add(fl);
  MV.cam=new THREE.PerspectiveCamera(35,1,0.05,100); MV.yaw=0.5; MV.pitch=0.12; MV.dist=4; MV.ty=0.9; MV.clock=new THREE.Clock(); MV.items=[];
  let drag=null; MV.can.addEventListener("pointerdown",e=>{ drag={x:e.clientX,y:e.clientY,yaw:MV.yaw,pitch:MV.pitch}; MV.can.setPointerCapture(e.pointerId); });
  MV.can.addEventListener("pointermove",e=>{ if(!drag) return; MV.yaw=drag.yaw-(e.clientX-drag.x)*0.01; MV.pitch=Math.max(-0.2,Math.min(1.2,drag.pitch+(e.clientY-drag.y)*0.006)); });
  MV.can.addEventListener("pointerup",()=>drag=null);
  MV.can.addEventListener("wheel",e=>{ e.preventDefault(); MV.dist=Math.max(0.8,Math.min(30,MV.dist*(e.deltaY>0?1.1:0.9))); },{passive:false});
  addEventListener("keydown",e=>{ if(MV.open && e.code==="Escape"){ e.stopImmediatePropagation(); mvClose(); } },true);
  MV.root=root;
}
function mvOpen(key){ if(!MV.root) mvBuild(); MV.open=true; MV.root.hidden=false; mvShow(key||MV.key||"norah"); mvLoop(); }
function mvClose(){ MV.open=false; if(MV.root) MV.root.hidden=true; }
function mvClear(){ for(const it of MV.items){ MV.scene.remove(it.obj); } MV.items=[]; }
function mvPlace(k, x){ const c=mdlClone(k); if(!c) return null; c.scene.position.x=x; MV.scene.add(c.scene);
  const it={k, obj:c.scene, mixer:c.clips.length?new THREE.AnimationMixer(c.scene):null, clips:c.clips}; MV.items.push(it); return it; }
function mvPlay(it, name){ if(!it.mixer) return; it.mixer.stopAllAction(); if(!name) return; const cl=it.clips.find(c=>c.name===name); if(!cl) return;
  const a=it.mixer.clipAction(cl); a.reset(); a.setLoop(name==="death"||name==="hit"?THREE.LoopOnce:THREE.LoopRepeat); a.clampWhenFinished=true; a.play(); }
function mvShow(k){
  MV.key=k; MV.group=MODEL_LIB[k].g; for(const b of MV.root.querySelectorAll("#mvList button")) b.setAttribute("aria-pressed",String(b.dataset.k===k));
  const I=MODEL_LIB[k]; const info=MV.root.querySelector("#mvInfo"); const gl=(MDL_GROUPS.find(g=>g[0]===I.g)||[])[2]||"";
  info.innerHTML=`<h3>${mdlName(k)}</h3><div class="gp">${I.g} · ${I.f.split("/").pop()}</div>
    <div>Height ${I.h.toFixed(2)} m · ${I.tri.toLocaleString()} triangles · ${I.kb} KB</div>
    <div>${I.hip?`Rigged (16 bones) · clips: ${I.clips.join(", ")}`:`<span class="warn">Static and posed, no rig yet</span>`}</div>
    ${I.x?`<div>Extra hits: +${I.x} health</div>`:""}${I.end?`<div class="warn">Bone armour: endgame only</div>`:""}<div class="gp" style="margin-top:4px">${gl}</div><div id="mvState" class="gp"></div>`;
  const clips=MV.root.querySelector("#mvClips"); clips.innerHTML="";
  mvClear(); MV.root.querySelector("#mvState").textContent=MDL.ready[k]?"":"Loading…";
  mdlLoad(k).then(()=>{ if(MV.key!==k) return; mvClear(); const it=mvPlace(k,0); MV.ty=I.h*0.5; MV.dist=Math.max(2.4,I.h*2.3); const st=MV.root.querySelector("#mvState"); if(st) st.textContent="";
    const btns=[]; const mk=(name,label)=>{ const b=document.createElement("button"); b.textContent=label; b.onclick=()=>{ mvPlay(it,name); for(const x of btns) x.setAttribute("aria-pressed",String(x===b)); }; btns.push(b); clips.appendChild(b); return b; };
    const rest=mk(null,"Bind pose"); for(const c of it.clips) mk(c.name,c.name);
    const first=it.clips.find(c=>c.name==="spider_idle")||it.clips.find(c=>c.name==="walk"); if(first) btns[it.clips.indexOf(first)+1].click(); else rest.setAttribute("aria-pressed","true");
  }).catch(e=>{ const st=MV.root.querySelector("#mvState"); if(st) st.innerHTML=`<span class="warn">Couldn't load: ${String(e&&e.message||e)}</span>`; });
}
function mvLineup(g){
  const ks=mdlKeys(g); MV.key=null; mvClear(); const clips=MV.root.querySelector("#mvClips"); clips.innerHTML="";
  const info=MV.root.querySelector("#mvInfo"); info.innerHTML=`<h3>${(MDL_GROUPS.find(x=>x[0]===g)||[0,g])[1]} lineup</h3><div class="gp">${ks.length} models, true heights. Loading…</div>`;
  mdlPreload(ks).then(()=>{ let x=0, w=0; const its=[]; for(const k of ks){ const I=MODEL_LIB[k], step=Math.max(0.9,I.h*1.08); const it=mvPlace(k,x); if(it){ its.push(it); } x+=step; w=x; }
    for(const it of its){ it.obj.position.x-=w/2-0.45; }
    const mh_=Math.max(...ks.map(k=>MODEL_LIB[k].h)); MV.ty=mh_*0.5; MV.dist=Math.max(4,w*1.25); MV.yaw=0; MV.pitch=0.08;
    info.querySelector(".gp").textContent=`${ks.length} models, true heights.`;
    const any=its.find(i=>i.mixer); const btns=[]; const mk=(name,label)=>{ const b=document.createElement("button"); b.textContent=label; b.onclick=()=>{ for(const i of its) mvPlay(i,name); for(const y of btns) y.setAttribute("aria-pressed",String(y===b)); }; btns.push(b); clips.appendChild(b); };
    mk(null,"Bind pose"); if(any) for(const c of any.clips) mk(c.name,"All: "+c.name); });
}
function mvLoop(){ if(!MV.open) return; requestAnimationFrame(mvLoop);
  const dt=Math.min(0.05,MV.clock.getDelta()); for(const it of MV.items) if(it.mixer) it.mixer.update(dt);
  const w=MV.can.clientWidth||1, h=MV.can.clientHeight||1; if(MV.can.width!==Math.round(w*MV.r.getPixelRatio())||MV.can.height!==Math.round(h*MV.r.getPixelRatio())){ MV.r.setSize(w,h,false); MV.cam.aspect=w/h; MV.cam.updateProjectionMatrix(); }
  if(!MV.key && MV.items.length===0) MV.yaw+=dt*0.2; else if(MV.key) MV.yaw+=dt*0.15;
  MV.cam.position.set(Math.sin(MV.yaw)*Math.cos(MV.pitch)*MV.dist, MV.ty+Math.sin(MV.pitch)*MV.dist, Math.cos(MV.yaw)*Math.cos(MV.pitch)*MV.dist); MV.cam.lookAt(0,MV.ty,0);
  MV.r.render(MV.scene,MV.cam); }
(function(){ const nav=document.querySelector("#mmTitle .mmButtons"); if(!nav) return; const b=document.createElement("button"); b.id="mmModels"; b.textContent="MODELS"; b.onclick=()=>mvOpen(); nav.insertBefore(b, document.getElementById("mmControls")); })();
// start fetching the default bodies as soon as the page is up
setTimeout(()=>{ try{ mdlPreload(mdlPoolKeys()); }catch(e){} }, 300);
