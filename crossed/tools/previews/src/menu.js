// ================================================================ menus: title, controls, setup, and the in-simulation menu
const SIM = Object.assign({extraAcross:0, extraKind:"across", extraLouis:0, startOverride:"map", hpMul:1, speedMul:1, models:{on:true, norah:"norah", louis:"louis_brute", pools:{}}}, (()=>{ try{ return JSON.parse(localStorage.getItem("crossed_sandbox_sim")||"{}"); }catch(e){ return {}; } })());
function saveSim(){ try{ localStorage.setItem("crossed_sandbox_sim",JSON.stringify(SIM)); }catch(e){} }
let suSection="map";
const mh=(tag,attrs={},kids=[])=>H(tag,attrs,kids);

// ---------------------------------------------------------------- screens
function showScreen(id){ for(const s of document.querySelectorAll("#mm .mmScreen")) s.hidden = s.id!==id; }
function goMenu(screen){
  if(MODE==="play") toBuild();
  MODE="menu"; document.body.classList.remove("build","play","sideOpen"); document.body.classList.add("menu");
  try{ document.exitPointerLock(); }catch(e){}
  $("mm").hidden=false; $("simMenu").hidden=true; SB.simMenu=false; $("panel").classList.add("hidden");
  resize(); edDoRebuild(); ED.helpers.visible=false; ED.selBox.visible=false; edFrameAll(); ED.orbit.pitch=0.55; ED.orbit.dist*=0.9;
  showScreen(screen==="setup"?"mmSetup":screen==="controls"?"mmCtl":"mmTitle");
  if(screen==="setup") renderSetup();
}
function openBuilder(){
  MODE="build"; $("mm").hidden=true; document.body.classList.remove("menu","play"); document.body.classList.add("build");
  resize(); edRebuild(true); ED.helpers.visible=true; edFrameAll(); edRenderSide();
}
function beginSim(){ $("mm").hidden=true; document.body.classList.remove("menu"); playMap(null); }

// ---------------------------------------------------------------- setup
const SETUP_SECTIONS=[
  ["map","Map","Pick or build the place, and what counts as winning."],
  ["norah","Norah","What she starts with, and how she moves and fights."],
  ["enemies","Enemies","Who is in the map, how they start, and extras on top."],
  ["models","Models","Which character model each body wears. Opens the model viewer too."],
  ["louis","Louis AI","Hunting, breaking the house, the charge, slam, grab and throws."],
  ["runner","Runner AI","The sprinter: charge-ups, sprint attacks, kicks, the grab and the rare drop kick."],
  ["tactician","Tactician AI","Cowardly and malicious: bold in a group, flees her sight alone, ambushes from doorways and turns."],
  ["across","ACROSS AI","The pack: speed, tells, lunges, swipes, grabs, knockdowns."],
  ["combat","Combat","The revolver, aim help, and what each hit zone does."],
  ["physics","Physics","Momentum, weight and pushes."],
  ["stealth","Stealth","Light, noise, sight and how long they search."],
  ["items","Items","Searching, healing and the flashlight."],
  ["camera","Camera & controls","Shoulder camera or fixed cameras, sensitivity, controller."],
  ["world","World & debug","Time scale, resolution, fog, doors, overlays."]];
const SCHEMA_FOR={norah:["Norah","Norah · Movement"],louis:["Louis (Brute)"],runner:["Runner (BCROSS)"],tactician:["Tactician (BCROSS)"],across:["ACROSS","ACROSS · Walker","ACROSS · Crawler","ACROSS · Matron","ACROSS · Mourner","ACROSS · Animation","ACROSS · Movement types"],combat:["Revolver","Hit zones"],physics:["Physics"],stealth:["Stealth"],items:["Items & searching"],camera:["Camera & controls"],world:["Spawn & world","See what's happening"]};
function renderSetup(){
  const nav=$("suNav"); nav.innerHTML="";
  for(const [k,label] of SETUP_SECTIONS) nav.appendChild(mh("button",{class:"suTab","aria-pressed":String(k===suSection),text:label,onclick:()=>{ suSection=k; renderSetup(); }}));
  const M=$("suMain"); M.innerHTML=""; M.scrollTop=0; const sec=SETUP_SECTIONS.find(s=>s[0]===suSection);
  M.appendChild(mh("div",{class:"suHead"},[mh("h2",{text:sec[1]}),mh("p",{text:sec[2]})]));
  if(suSection==="map") suMap(M); else if(suSection==="norah"){ suNorah(M); suSchema(M,SCHEMA_FOR.norah); } else if(suSection==="enemies") suEnemies(M); else if(suSection==="models") suModels(M); else suSchema(M,SCHEMA_FOR[suSection]);
  suSummary();
}
function suSummary(){
  const d=ED.doc, en={}; for(const o of d.objects) if(o.type==="enemy"){ const k=(o.kind==="brute"?"Louis":o.kind==="dummy"?"Dummy":"ACROSS"); en[k]=(en[k]||0)+1; }
  if(SIM.extraAcross) en.ACROSS=(en.ACROSS||0)+SIM.extraAcross; if(SIM.extraLouis) en.Louis=(en.Louis||0)+SIM.extraLouis;
  const goal={either:"clear or escape",exit:"reach an exit",kill:"clear every enemy",none:"sandbox"}[d.win]||"";
  $("suSummary").innerHTML=`<b>${d.name.replace(/</g,"&lt;")}</b> · ${Object.entries(en).map(([k,v])=>`${v} ${k}`).join(", ")||"no enemies"} · goal: ${goal}${CFG.rev.infinite?" · infinite ammo":""}${CFG.norah.god?" · god mode":""}`;
}
function suCard(title,desc,on,click,badge){ return mh("button",{class:"suCard"+(on?" on":""),onclick:click},[badge?mh("i",{text:badge}):null,mh("b",{text:title}),mh("span",{text:desc})]); }
function suLoad(doc,label){
  if(ED.dirty){ try{ const m=edMaps(); m["Unsaved: "+ED.doc.name]=ED.doc; localStorage.setItem("crossed_sandbox_maps",JSON.stringify(m)); }catch(e){} }
  ED.doc=sbNormalize(doc); ED.sel=null; ED.undo=[]; ED.redo=[];
  sbAddDocTextures(ED.doc).then(()=>{ edSave(); ED.dirty=false; edDoRebuild(); ED.helpers.visible=false; edFrameAll(); ED.orbit.pitch=0.55; $("edName").value=ED.doc.name; renderSetup(); });
}
function suMap(M){
  const d=ED.doc;
  M.appendChild(mh("div",{class:"suLabel",text:"Current map"}));
  const c={}; for(const o of d.objects) c[o.type]=(c[o.type]||0)+1;
  M.appendChild(mh("div",{class:"suCurrent"},[mh("b",{text:d.name}),mh("span",{text:`${c.wall||0} walls · ${c.prop||0} furniture · ${c.enemy||0} enemies · ${(c.prop?d.objects.filter(o=>o.search).length:0)} searchable${d.terrain&&d.terrain.on?" · terrain":""}`}),
    mh("div",{class:"suRow"},[mh("button",{class:"suBtn",text:"Edit this map in the builder",onclick:openBuilder}),mh("button",{class:"suBtn",text:"New empty room",onclick:()=>{ suLoad(PRESETS.find(p=>p.key==="blankIn").make()); openBuilder(); }}),mh("button",{class:"suBtn",text:"New open ground",onclick:()=>{ suLoad(PRESETS.find(p=>p.key==="blankOut").make()); openBuilder(); }})])]));
  M.appendChild(suField("Goal",suSelect(d,"win",[["either","Clear every enemy or reach an exit"],["exit","Reach an exit"],["kill","Clear every enemy"],["none","Sandbox (never ends)"]],()=>{ edSave(); suSummary(); })));
  const E=d.env; M.appendChild(suField("Darkness",suSelect(E,"dark",[["","Map default"],["0.02","Pitch black"],["0.1","Night"],["0.3","Dusk"],["0.6","Daylight"]],()=>{ edSave(); })));
  M.appendChild(suField("Fog",suSelect({f:String(E.fog)},"f",[["0","None"],["0.015","Thin"],["0.03","Light"],["0.05","Heavy"],["0.09","Blind"]].concat([[String(E.fog),"Map default ("+E.fog+")"]]),v=>{ E.fog=+v; edSave(); edDoRebuild(); ED.helpers.visible=false; })));
  M.appendChild(mh("div",{class:"suLabel",text:"Maps"}));
  const g=mh("div",{class:"suGrid"}); for(const pr of PRESETS){ if(pr.key.startsWith("blank")) continue; g.appendChild(suCard(pr.name,pr.desc,d.preset===pr.key,()=>suLoad(Object.assign(pr.make(),{preset:pr.key})),pr.key==="ch1house"?"CHAPTER ONE":null)); }
  M.appendChild(g);
  const maps=edMaps(); if(Object.keys(maps).length){ M.appendChild(mh("div",{class:"suLabel",text:"Your saved maps"})); const g2=mh("div",{class:"suGrid"}); for(const n of Object.keys(maps)) g2.appendChild(suCard(n,`${(maps[n].objects||[]).length} objects`,false,()=>suLoad(sbClone(edMaps()[n])))); M.appendChild(g2); }
  M.appendChild(mh("p",{class:"suNote",text:"Import Map Designer or Item Modeler files from the builder's FILES tab."}));
}
function suField(label,input,hint){ return mh("div",{class:"suField"},[mh("label",{text:label}),input,hint?mh("small",{text:hint}):null]); }
function suSelect(o,k,opts,on){ const s=mh("select"); for(const [v,t] of opts) s.appendChild(mh("option",{value:v,text:t})); s.value=String(o[k]??""); s.onchange=()=>{ o[k]=s.value; on&&on(s.value); }; return s; }
function suNum(o,k,ph,on,step=1){ const i=mh("input",{type:"number",step,placeholder:ph||""}); i.value=o[k]??""; i.oninput=()=>{ o[k]=i.value===""?"":+i.value; on&&on(); }; return i; }
function suCheck(label,get,set){ const c=mh("input",{type:"checkbox"}); c.checked=!!get(); c.onchange=()=>{ set(c.checked); suSummary(); }; return mh("label",{class:"suChk"},[c,label]); }
function suNorah(M){
  const st=ED.doc.start, save=()=>{ edSave(); suSummary(); };
  M.appendChild(mh("div",{class:"suLabel",text:"Starting loadout (this map)"}));
  M.appendChild(suField("Health",suNum(st,"hp",`${CFG.norah.hp} (full)`,save)));
  M.appendChild(suField("Rounds loaded",suNum(st,"rounds",String(CFG.rev.chambers),save)));
  M.appendChild(suField("Spare rounds",suNum(st,"spare",String(CFG.rev.spare),save)));
  const items=mh("div",{class:"suItems"}); const draw=()=>{ items.innerHTML=""; st.items.forEach((e,i)=>items.appendChild(mh("span",{class:"suChip"},[entryLabel(e)+" ",mh("button",{text:"×","aria-label":"Remove",onclick:()=>{ st.items.splice(i,1); save(); draw(); }})]))); if(!st.items.length) items.appendChild(mh("span",{class:"suNote",text:"Nothing in her bag."})); };
  draw(); const add={item:"flashlight"}; M.appendChild(suField("In her bag",items));
  M.appendChild(suField("",mh("div",{class:"suRow"},[suSelect(add,"item",itemOptions()),mh("button",{class:"suBtn",text:"Add",onclick:()=>{ const dd=ITEMS[add.item]; st.items.push({item:add.item,qty:dd&&dd.qty?dd.qty:1,name:"",text:""}); save(); draw(); }})])));
  M.appendChild(suCheck("Flashlight on at the start",()=>st.flashOn,v=>{ st.flashOn=v; save(); }));
  M.appendChild(mh("div",{class:"suLabel",text:"Cheats"}));
  M.appendChild(suCheck("Infinite ammo",()=>CFG.rev.infinite,v=>{ CFG.rev.infinite=v; saveCfg(); }));
  M.appendChild(suCheck("God mode (takes no damage)",()=>CFG.norah.god,v=>{ CFG.norah.god=v; saveCfg(); }));
  M.appendChild(suCheck("Ammo budget: Chapter One supply (5 loaded + 7), whatever the map says",()=>CFG.world.budget,v=>{ CFG.world.budget=v; saveCfg(); }));
}
function suEnemies(M){
  const d=ED.doc, list=d.objects.filter(o=>o.type==="enemy");
  M.appendChild(mh("div",{class:"suLabel",text:`In this map (${list.length})`}));
  if(!list.length) M.appendChild(mh("p",{class:"suNote",text:"No enemy markers. Add some below, or place them in the builder."}));
  const kindName=k=>k==="brute"?"Louis":k==="dummy"?"Training dummy":k==="across"?"ACROSS (random)":k==="across_legless"?"Legless crawler":(VMAP[(k||"").slice(7)]||{}).name||k;
  const groups={}; for(const o of list){ const key=kindName(o.kind)+" · "+(startOptions.find(s=>s[0]===o.start)||["","Hunting"])[1]; groups[key]=(groups[key]||0)+1; }
  const ul=mh("div",{class:"suItems"}); for(const [k,v] of Object.entries(groups)) ul.appendChild(mh("span",{class:"suChip",text:`${v} × ${k}`})); if(list.length) M.appendChild(ul);
  M.appendChild(suField("How they start",suSelect(SIM,"startOverride",[["map","As placed in the map"],["hunting","All hunting Norah"],["wander","All unaware, wandering"],["stand","All unaware, standing still"]],saveSim)));
  M.appendChild(mh("div",{class:"suLabel",text:"Extra enemies"}));
  M.appendChild(suField("Extra ACROSS",suNum(SIM,"extraAcross","0",()=>{ SIM.extraAcross=Math.max(0,Math.min(30,+SIM.extraAcross||0)); saveSim(); suSummary(); }),"They appear at random spots at least 8 m from Norah."));
  M.appendChild(suField("Which ACROSS",suSelect(SIM,"extraKind",[["across","Random subclass"],...VARIANTS.map(v=>["across:"+v.key,v.name])],saveSim)));
  M.appendChild(suField("Extra Louis",suNum(SIM,"extraLouis","0",()=>{ SIM.extraLouis=Math.max(0,Math.min(5,+SIM.extraLouis||0)); saveSim(); suSummary(); })));
  M.appendChild(mh("div",{class:"suLabel",text:"Every enemy"}));
  M.appendChild(suField("Health ×",suNum(SIM,"hpMul","1",saveSim,0.1)));
  M.appendChild(suField("Speed ×",suNum(SIM,"speedMul","1",saveSim,0.1)));
  M.appendChild(suField("ACROSS attacking at once",suNum(CFG.across,"maxAttackers",String(DEFAULTS.across.maxAttackers),()=>saveCfg())));
  M.appendChild(mh("p",{class:"suNote",text:"Their behaviour is in Louis AI and ACROSS AI."}));
}
function suSchema(M, titles){
  for(const t of titles){ const sec=SCHEMA.find(s=>s[0]===t); if(!sec) continue; const [title,sub,rows]=sec;
    const box=mh("div",{class:"suBlock"}); box.appendChild(mh("div",{class:"suLabel"},[title,mh("button",{class:"suReset",text:"Reset to defaults",onclick:()=>{ for(const r of rows){ const p=r[0]==="chk"?r[1]:r[0]; if(typeof p==="string"&&p.includes(".")) setP(p,defP(p)); } saveCfg(); renderSetup(); }})]));
    if(sub) box.appendChild(mh("p",{class:"suNote",text:sub}));
    for(const r of rows){ const kind=r[0];
      if(kind==="chk"){ box.appendChild(suCheck(r[2],()=>getP(r[1]),v=>{ setP(r[1],v); if(r[1]==="world.showZones") setZoneView(v); saveCfg(); })); continue; }
      if(kind==="cam"){ box.appendChild(suField("Camera",suSelect(CFG.ctrl,"cam",[["ots","Over the shoulder"],["tank","Fixed cameras · tank controls"],["relative","Fixed cameras · camera-relative"]],()=>{ saveCfg(); activeCam=null; }))); continue; }
      if(kind==="variants"){ continue; }
      if(typeof kind!=="string"||!kind.includes(".")||r.length<5) continue;
      const [path,label,min,max,step]=r, def=defP(path), v=mh("output",{text:fmt(getP(path))}), inp=mh("input",{type:"range",min,max,step}); inp.value=getP(path);
      const paint=()=>v.classList.toggle("changed",getP(path)!==def);
      inp.oninput=()=>{ const x=parseFloat(inp.value); setP(path,x); v.textContent=fmt(x); paint(); if(path==="world.res") resize(); saveCfg(); };
      paint(); box.appendChild(mh("div",{class:"suSlider",title:"Default: "+def},[mh("label",{text:label}),inp,v])); }
    M.appendChild(box); }
}

// ---------------------------------------------------------------- the in-simulation menu
function openSimMenu(result){
  if(MODE!=="play"||SB.simMenu) return; if(SB.inv) closeInv();
  SB.simMenu=true; try{ document.exitPointerLock(); }catch(e){} $("simMenu").hidden=false; renderSimMenu(result);
}
function closeSimMenu(){ SB.simMenu=false; $("simMenu").hidden=true; $("result").style.display="none"; try{ const p=canvas.requestPointerLock(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
function renderSimMenu(result){
  $("smTitle").textContent = result==="WON"?"CLEARED":result==="ESCAPED"?"ESCAPED":result==="DIED"||player.dead?"YOU DIED":"PAUSED";
  const B=$("smBody"); B.innerHTML="";
  const btn=(t,f,cls)=>mh("button",{class:"smBtn"+(cls?" "+cls:""),text:t,onclick:()=>{ f(); }});
  const tog=(t,get,set)=>{ const b=mh("button",{class:"smTog","aria-pressed":String(!!get()),text:t}); b.onclick=()=>{ set(!get()); saveCfg(); b.setAttribute("aria-pressed",String(!!get())); }; return b; };
  if(run) B.appendChild(mh("p",{class:"smStats",text:`${run.name} · ${run.t.toFixed(1)} s · shots ${run.shots} · hits ${run.hits} · damage taken ${Math.round(run.dmgTaken)} · ammo ${CFG.rev.infinite?"∞":player.rounds+player.spare}`}));
  B.appendChild(mh("div",{class:"smCol"},[
    result||player.dead ? null : btn("Resume",closeSimMenu,"primary"),
    btn("Restart",()=>{ closeSimMenu(); startPlay(); },result||player.dead?"primary":""),
    btn("Back to setup",()=>goMenu("setup")),
    btn("Edit this map",()=>{ goMenu("setup"); openBuilder(); }),
    btn("Main menu",()=>goMenu("title"))]));
  B.appendChild(mh("div",{class:"smLabel",text:"Combat options"}));
  B.appendChild(mh("div",{class:"smGrid"},[
    tog("Infinite ammo",()=>CFG.rev.infinite,v=>CFG.rev.infinite=v),
    tog("God mode",()=>CFG.norah.god,v=>CFG.norah.god=v),
    tog("Freeze AI",()=>CFG.world.freezeAI,v=>CFG.world.freezeAI=v),
    tog("Slow motion",()=>CFG.world.timeScale<1,v=>CFG.world.timeScale=v?0.25:1),
    tog("Show hit zones",()=>CFG.world.showZones,v=>{ CFG.world.showZones=v; setZoneView(v); }),
    tog("Reach rings",()=>CFG.debug.rings,v=>CFG.debug.rings=CFG.debug.attackLog=v)]));
  B.appendChild(mh("div",{class:"smGrid"},[
    btn("Clear enemies",()=>{ clearEnemies(); log("Enemies cleared","#9a9283"); renderSimMenu(result); }),
    btn("Heal + refill",()=>{ player.hp=CFG.norah.hp; player.rounds=CFG.rev.chambers; player.spare=Math.max(player.spare,CFG.rev.spare); if(player.dead) respawn(); renderSimMenu(result); }),
    btn("Spawn ACROSS",()=>{ spawn("across"); }), btn("Spawn Louis",()=>{ spawn("brute"); }), btn("Spawn dummy",()=>{ spawn("dummy"); }),
    btn("Tuning panel",()=>{ closeSimMenu(); $("panel").classList.remove("hidden"); try{ document.exitPointerLock(); }catch(e){} })]));
  B.appendChild(mh("p",{class:"smHint",text:"Esc or P closes this menu · N restarts · ` opens the tuning panel"}));
}
// extra enemies from the setup screen, at open spots away from Norah
function simExtras(){
  const b=world.bounds, R=mulberry(9001), spots=[];
  const pick=()=>{ for(let i=0;i<60;i++){ const x=b.x0+1+R()*(b.x1-b.x0-2), z=b.z0+1+R()*(b.z1-b.z0-2); if(Math.hypot(x-player.pos.x,z-player.pos.z)<8) continue;
      const p=new THREE.Vector3(x,0,z); if(collide(p,0.45)) continue; if(spots.some(s=>Math.hypot(s.x-x,s.z-z)<1.5)) continue; spots.push({x,z}); return {x,z}; } return null; };
  for(let i=0;i<(+SIM.extraAcross||0);i++){ const s=pick(); if(s) spawn(SIM.extraKind||"across",s.x,s.z,{aware:"hunting"}); }
  for(let i=0;i<(+SIM.extraLouis||0);i++){ const s=pick(); if(s) spawn("brute",s.x,s.z); }
}

// ---------------------------------------------------------------- wiring
$("mmStart").onclick=()=>{ audio(); goMenu("setup"); };
$("mmControls").onclick=()=>showScreen("mmCtl");
$("ctlBack").onclick=()=>showScreen("mmTitle");
$("suBack").onclick=()=>showScreen("mmTitle");
$("suEdit").onclick=openBuilder;
$("suGo").onclick=()=>{ audio(); beginSim(); };
$("suReset").onclick=()=>{ const keep=clone(CFG.ctrl); CFG=clone(DEFAULTS); CFG.ctrl=keep; saveCfg(); resize(); scene.fog.density=CFG.world.fog; buildPanel(); renderSetup(); };
$("edBack").onclick=e=>{ e.currentTarget.blur(); goMenu("setup"); };
$("toBuildBtn").onclick=e=>{ e.currentTarget.blur(); openSimMenu(); };
$("help").innerHTML=`<b>READY</b><br>Click the view to take the mouse. <b>Esc</b> opens the menu: pause, restart, combat options.<br>Controls are on the title screen.<div class="btns" style="margin-top:8px"><button id="helpok">Begin</button></div>`;
$("helpok").onclick=()=>{ audio(); $("help").style.display="none"; try{ const p=canvas.requestPointerLock(); if(p&&p.catch)p.catch(()=>{}); }catch(e){} };
document.addEventListener("pointerlockchange",()=>{ if(document.pointerLockElement!==canvas && MODE==="play" && !SB.inv && !SB.simMenu && $("help").style.display==="none" && $("panel").classList.contains("hidden") && !replay.on) openSimMenu(); });
