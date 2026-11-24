// ================================================================ roofs in play: the shoulder camera stays under them
{ const uc0=updateCamera; updateCamera=function(rdt){ uc0(rdt); const R=world&&world.roofs; if(!R||!R.length||isFixed()) return;
    const p=player.pos, py=groundY(p.x,p.z)+(player.posY||0); let lim=null;
    for(const r of R){ if(r.y<py+1.2) continue; /* a roof below her (she's upstairs, or on top of it) isn't her ceiling */
      const inC=camera.position.x>=r.x0-0.4&&camera.position.x<=r.x1+0.4&&camera.position.z>=r.z0-0.4&&camera.position.z<=r.z1+0.4, inP=p.x>=r.x0&&p.x<=r.x1&&p.z>=r.z0&&p.z<=r.z1;
      if(inC||inP) lim=lim==null?r.y:Math.min(lim,r.y); }
    if(lim!=null&&camera.position.y>lim-0.18){ const dy=camera.position.y-(lim-0.18); camera.position.y-=dy; camPos.y=Math.min(camPos.y,lim-0.18); } }; }

// ================================================================ simulations: ten small themed rooms; pick one, an enemy type and how many, and run it
// Every room: a floor, 3.2 m walls (4.4 m in the forest), a roof fitted to the wall tops, lights, themed furniture (some of it
// searchable), Norah's spawn at one end and room for the creatures at the other.
function simRoom(name,W,D,o={}){ const d=sbNewDoc(name); d.win="kill"; d.sim=true; const h=o.h||3.2, x0=-W/2, z0=-D/2;
  d.objects.push({id:sbUid("f"),type:"floor",x:x0,z:z0,w:W,d:D,tex:o.ftex||"",colA:o.fa||"#2e2a26",colB:o.fb||"#36322c",y:0});
  const ops=o.ops||{}; const c=[[x0,z0],[x0+W,z0],[x0+W,z0+D],[x0,z0+D]], names=["n","e","s","w"];
  for(let i=0;i<4;i++) d.objects.push({id:sbUid("w"),type:"wall",a:c[i],b:c[(i+1)%4],height:h,thick:0.2,color:o.wall||"#5e594f",tex:o.wtex||"",openings:(ops[names[i]]||[]).map(q=>Object.assign({id:sbUid("o")},q))});
  d.objects.push({id:sbUid("r"),type:"roof",x:x0-0.1,z:z0-0.1,w:W+0.2,d:D+0.2,y:h,color:o.roof||"#2e2a26",tex:""});
  d.objects.push({id:sbUid("s"),type:"spawn",x:0,z:+(D/2-1.8).toFixed(2),yaw:180});
  for(const L of (o.lights||[[0,0]])) d.objects.push({id:sbUid("l"),type:"light",x:L[0],y:h-0.35,z:L[1],color:o.lcol||"#ffc890",intensity:o.li||0.9,dist:o.ld||9});
  d.env=Object.assign({},ENV_DEF,{fill:false},o.env||{}); d.room={W,D}; return d; }
function simP(d,asset,x,z,rot,extra){ const o=Object.assign({id:sbUid("p"),type:"prop",asset,x,z,rot:rot||0,scale:1},extra||{}); d.objects.push(o); return o; }
const SR=(...items)=>({search:true,items}), CL=(at,width=1)=>({kind:"door",at,width,closed:true}), WIN=(at,width=1.2)=>({kind:"window",at,width,sill:0.95,top:2.1});
const SIM_ROOMS=[
  {key:"living", name:"House · living room", desc:"Couch, armchair, TV, bookshelf. Warm lamps, windows on the night outside.", make(){
    const d=simRoom("Living room",9,8,{fa:"#3a2c20",fb:"#43331f",wall:"#6b5e4c",roof:"#3a332b",ops:{n:[WIN(2.5),WIN(6.5)],w:[CL(4)]},lights:[[-2,-1],[2.5,1.5]]});
    simP(d,"couch",-2.6,0.6,90); simP(d,"table",-1.1,0.6,90); simP(d,"armchair",-1.4,-1.6,30); simP(d,"tvstand",0.6,-3.6,0); simP(d,"rug",-1.4,0.4,90);
    simP(d,"bookshelf",4.25,-1.5,-90,SR(IT("ammo",4),IT("photo"))); simP(d,"sideboard",3.95,1.6,-90,SR(IT("pills"))); simP(d,"lamp",-4,-3.5,0); simP(d,"lamp",4,3.5,0); return d; }},
  {key:"bedroom", name:"House · bedroom", desc:"A double bed, a wardrobe to search, a toy chest. One lamp.", make(){
    const d=simRoom("Bedroom",8,8,{fa:"#3c2e24",fb:"#45352a",wall:"#5f6a6e",roof:"#353a3c",ops:{n:[WIN(4)],e:[CL(5.5)]},lights:[[0,-0.5]],li:0.7});
    simP(d,"bed_double",-1.6,-2.8,0); simP(d,"nightstand",-2.75,-3.6,0); simP(d,"nightstand",-0.45,-3.6,0); simP(d,"wardrobe",3.6,-2.6,-90,SR(IT("bandage"),IT("hatchet")));
    simP(d,"dresser",-3.7,1.2,90,SR(IT("ammo",3))); simP(d,"toy_chest",2.6,1.8,0); simP(d,"rug",-1.4,-0.6,0); simP(d,"lamp",-3.5,-3.5,0); return d; }},
  {key:"hospital", name:"Hospital room", desc:"Two beds, a medicine cabinet, cold white light and tiles.", make(){
    const d=simRoom("Hospital room",9,8,{fa:"#7d8682",fb:"#8b948f",wall:"#9ba6a0",roof:"#8a948f",ops:{s:[CL(6.5,1.2)],n:[WIN(4.5,1.6)]},lights:[[-2,-1],[2,-1],[0,2]],lcol:"#d8ecff",li:0.85});
    simP(d,"bed_twin",-3.2,-2.7,0); simP(d,"bed_twin",-0.6,-2.7,0); simP(d,"chair",-2,-1.2,0); simP(d,"medicine_cabinet",3,-3.85,0,SR(IT("pills"),IT("firstaid")));
    simP(d,"cabinet",4.2,-1.2,-90,SR(IT("bandage"),IT("knife"))); simP(d,"sink",4.2,1.2,-90); simP(d,"water_cooler",-4.2,2.8,90); simP(d,"trashcan",2.4,3.3,0); return d; }},
  {key:"hallway", name:"Hallway", desc:"A long narrow corridor lined with closed doors, a coat rack, lockers.", make(){
    const d=simRoom("Hallway",3.4,18,{fa:"#2b2a28",fb:"#33312d",wall:"#5a5448",roof:"#2e2c28",ops:{e:[CL(3.5),CL(9),CL(14.5)],w:[CL(6),CL(12)]},lights:[[0,-6],[0,0],[0,6]],li:0.6,ld:7});
    simP(d,"coat_rack",-1.35,6.5,90); simP(d,"locker_row",1.35,-2.2,-90,SR(IT("ammo",3))); simP(d,"chair",-1.35,-3.4,90); simP(d,"trashcan",1.3,4.3,0); simP(d,"cabinet",-1.4,-7.6,90,SR(IT("batteries"))); return d; }},
  {key:"forest", name:"Forest clearing", desc:"Under a thick canopy: pines, birches, a fallen log, boulders, ferns. Dim moonlight.", make(){
    const d=simRoom("Forest clearing",12,12,{h:4.4,fa:"#283121",fb:"#2f3926",wall:"#1d2417",roof:"#141b0f",lights:[[-2,-2],[3,2]],lcol:"#9fb4cf",li:0.55,ld:11,env:{dark:0.12}});
    const T=[["tree_pine",-4.6,-4.4],["tree",4.4,-4.6],["tree_birch",-4.8,1.2],["tree_pine",4.7,0.6],["tree_birch",1.4,-5],["tree",-2.2,4.8],["tree_pine",4.4,4.6]];
    for(const [a,x,z] of T) simP(d,a,x,z,Math.round(rng()*360),{scale:0.68});
    simP(d,"log",-1.2,-1.4,30,SR(IT("ammo",3))); simP(d,"boulder",2.2,-2.2,0); simP(d,"stump",-2.8,-2.8,0); simP(d,"rock",1.8,2.4,40); simP(d,"bush",-3.6,3.4,0); simP(d,"bush",3.4,-0.8,0);
    simP(d,"fern_clump",0.4,-3.4,0); simP(d,"fern_clump",-0.6,3.8,0); simP(d,"leaf_pile",2.8,3.6,0,SR(IT("bandage"))); return d; }},
  {key:"kitchen", name:"Kitchen", desc:"Counters, a stove, a fridge, a table in the middle. Something left in the pantry.", make(){
    const d=simRoom("Kitchen",9,8,{fa:"#4a463f",fb:"#55514a",wall:"#6e6a5a",roof:"#45423a",ops:{n:[WIN(6)],w:[CL(5)]},lights:[[0,-1],[0,2]]});
    simP(d,"counter",-3.6,-3.6,0); simP(d,"counter",-2.35,-3.6,0,SR(IT("knife"))); simP(d,"stove",-1.2,-3.55,0); simP(d,"sink",0.2,-3.6,0); simP(d,"fridge",1.5,-3.5,0,SR(IT("pills")));
    simP(d,"pantry_shelf",4.25,-1.6,-90,SR(IT("ammo",4),IT("road_flare"))); simP(d,"table",-0.4,0.4,0); simP(d,"chair",-1.2,0.4,90); simP(d,"chair",0.4,0.4,-90); simP(d,"chair",-0.4,1.2,180); simP(d,"china_hutch",4.15,1.8,-90); return d; }},
  {key:"office", name:"Office", desc:"Desks behind cubicle walls, filing cabinets, a photocopier and a water cooler.", make(){
    const d=simRoom("Office",10,8,{fa:"#33363a",fb:"#3a3d42",wall:"#7a7a72",roof:"#5e5e58",ops:{n:[WIN(3,1.8),WIN(7,1.8)],s:[CL(8)]},lights:[[-2.5,-1],[2.5,-1],[0,2]],lcol:"#e8f0ff",li:0.8});
    simP(d,"office_desk",-3,-2.6,0); simP(d,"office_chair",-3,-1.9,180); simP(d,"office_desk",0.2,-2.6,0,SR(IT("ammo",3))); simP(d,"office_chair",0.2,-1.9,180); simP(d,"cubicle_wall",-1.4,-1.6,90); simP(d,"cubicle_wall",1.8,-1.6,90);
    simP(d,"office_desk",3.2,0.6,-90); simP(d,"filing_cabinet",-4.7,1.2,90,SR(IT("pills"),IT("pistol"),IT("nine_mm",12))); simP(d,"filing_cabinet",-4.7,2,90); simP(d,"photocopier",4.3,-3.4,0); simP(d,"water_cooler",4.6,3.4,-90); return d; }},
  {key:"basement", name:"Basement storage", desc:"Metal shelving, crates and barrels, one weak bulb. Very dark.", make(){
    const d=simRoom("Basement storage",9,9,{fa:"#2f2f2d",fb:"#363634",wall:"#4a4a46",roof:"#2a2a28",ops:{s:[CL(2,1)]},lights:[[0,0]],lcol:"#ffd9a0",li:0.45,ld:7,env:{dark:0.04}});
    simP(d,"metal_shelving",-3.8,-3.95,0,SR(IT("batteries"),IT("crowbar"))); simP(d,"metal_shelving",-1.6,-3.95,0); simP(d,"metal_shelving",4.2,-2,-90,SR(IT("ammo",4)));
    simP(d,"crate",-0.8,-1,15,SR(IT("shells",4))); simP(d,"crate_stack",2.4,-3.4,0); simP(d,"barrel",-3.8,0.8,0); simP(d,"barrel",-3.2,1.5,0); simP(d,"cardboard_boxes",3.4,1.6,0); simP(d,"toolchest",-3.9,3.4,90); simP(d,"footlocker",1.4,3.6,0,SR(IT("road_flare",2))); return d; }},
  {key:"chapel", name:"Chapel", desc:"Two rows of pews to vault, an altar, tall candlesticks, a statue in the corner.", make(){
    const d=simRoom("Chapel",10,12,{fa:"#3e3a34",fb:"#46413a",wall:"#6e665a",roof:"#3a342c",ops:{e:[WIN(3,1),WIN(9,1)],w:[WIN(3,1),WIN(9,1)]},lights:[[0,-4],[0,1]],lcol:"#ffc070",li:0.7});
    for(let r=0;r<3;r++){ simP(d,"pew",-2.4,-1.4+r*1.7,0); simP(d,"pew",2.4,-1.4+r*1.7,0); }
    simP(d,"altar",0,-5,0,SR(IT("ammo",5),IT("rosary"))); simP(d,"candlestick_tall",-1.7,-5.1,0); simP(d,"candlestick_tall",1.7,-5.1,0); simP(d,"pulpit",3.3,-3.8,-90); simP(d,"statue_mary",-4.3,-5.3,45); simP(d,"kneeler",0,-3.9,0); return d; }},
  {key:"classroom", name:"Classroom", desc:"Rows of desks, a chalkboard, the teacher's desk and a bookcase.", make(){
    const d=simRoom("Classroom",10,9,{fa:"#4a3c2c",fb:"#544433",wall:"#7a7262",roof:"#5a5446",ops:{e:[WIN(2,1.6),WIN(5.5,1.6)],s:[CL(8.5)]},lights:[[-2,-1],[2,-1],[0,2]],li:0.8});
    simP(d,"chalkboard",0,-4.42,0); simP(d,"office_desk",-3,-3.2,0,SR(IT("ammo",3))); simP(d,"office_chair",-3,-3.9,0);
    for(let r=0;r<3;r++) for(let c=0;c<3;c++){ simP(d,"desk",-2.4+c*2.4,-1.4+r*1.6,0); simP(d,"chair",-2.4+c*2.4,-0.8+r*1.6,180); }
    simP(d,"bookcase_office",-4.75,1.2,90,SR(IT("bandage"))); simP(d,"coat_rack",4.6,3.8,-90); return d; }}];
// where the creatures go: the far half of the room, spread out (the game nudges each one clear of furniture as it appears)
function simSpots(d,n){ const {W,D}=d.room, out=[], R=mulberry(77+n), sp=d.objects.find(o=>o.type==="spawn");
  for(let tries=0;out.length<n&&tries<400;tries++){ const x=(R()-0.5)*(W-1.4), z=-D/2+0.8+R()*(D*0.55);
    if(Math.hypot(x-sp.x,z-sp.z)<Math.min(5,D*0.55)) continue; if(out.some(q=>Math.hypot(q[0]-x,q[1]-z)<(tries<250?1.3:0.7))) continue; out.push([+x.toFixed(2),+z.toFixed(2)]); }
  while(out.length<n) out.push([0,-D/2+1.2]); return out; }
const SIM_KINDS=[["across","ACROSS (any kind)"],["across:walker","ACROSS · Walker"],["across:crawler","ACROSS · Crawler"],["across:matron","ACROSS · Matron"],["across:mourner","ACROSS · Mourner"],["across_legless","Legless crawler"],
  ["brute","Louis"],["runner","Runner"],["tactician","Tactician"],["contortionist","Contortionist"],["reacher","Reacher (long neck)"],["reacher_arm","Reacher (long arms)"],["splithead","Split-head Reacher"],["hob","The Hob"],
  ["brute_club","Club-fist Brute"],["brute_onearm","One-arm Brute"],["brute2","Two-armed Brute"],["brute2_legless","Legless Brute"],["brute2_split","Split Brute"],["brute2_armored","Armoured Brute"],["dummy","Training dummy"]];
const SIM_ONE=["hob","splithead"];   /* only one of these at a time */
const SIMR=Object.assign({room:"living",kind:"across",count:2,start:"wander"},(()=>{ try{ return JSON.parse(localStorage.getItem("crossed_sandbox_simrun")||"{}"); }catch(e){ return {}; } })());
function saveSimR(){ try{ localStorage.setItem("crossed_sandbox_simrun",JSON.stringify(SIMR)); }catch(e){} }
function simDoc(){ const R=SIM_ROOMS.find(r=>r.key===SIMR.room)||SIM_ROOMS[0], d=R.make(); d.simKey=R.key;
  const n=SIM_ONE.includes(SIMR.kind)?1:clamp(Math.round(+SIMR.count||1),1,10);
  const sp=d.objects.find(o=>o.type==="spawn");
  for(const [x,z] of simSpots(d,n)) d.objects.push({id:sbUid("e"),type:"enemy",kind:SIMR.kind,x,z,yaw:SIMR.start==="hunting"?Math.round(rng()*360):Math.round(Math.atan2(x-sp.x,z-sp.z)*R2D+(rng()-0.5)*100),start:SIMR.start,hpMul:1,speedMul:1});
  d.note=`${R.name} · ${n} × ${(SIM_KINDS.find(k=>k[0]===SIMR.kind)||["",SIMR.kind])[1]} · ${SIMR.start==="hunting"?"hunting her":"not aware of her yet"}`; return d; }
function runSim(){ audio(); const d=simDoc(); ED.doc=sbNormalize(d); ED.sel=null; ED.undo=[]; ED.redo=[]; ED.dirty=false;
  sbAddDocTextures(ED.doc).then(()=>{ edDoRebuild(); $("mm").hidden=true; document.body.classList.remove("menu"); playMap(null); }); }

// ---------------------------------------------------------------- the Simulations screen
(function(){ const st=document.createElement("style"); st.textContent=`
#mmSims{display:grid; grid-template-rows:auto minmax(0,1fr) auto; gap:12px}
#simMain{overflow:auto; background:rgba(10,8,6,.88); border:1px solid #3d362c; padding:14px 18px 24px; display:grid; gap:12px; align-content:start}
.simOpts{display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:10px 16px; align-items:end}
.simOpts label{display:grid; gap:4px; font-size:12px; color:#9a9283}
.simOpts select,.simOpts input{font:inherit; font-size:13px; background:#1a1612; color:#e6e0d0; border:1px solid #5a5040; padding:5px 6px}
.simStart{display:flex; flex-wrap:wrap; gap:6px}
.simStart button{font:inherit; font-size:12.5px; color:#d8d2c4; background:#16120e; border:1px solid #3d362c; padding:6px 10px; cursor:pointer}
.simStart button[aria-pressed="true"]{border-color:#e8c77a; background:#2a2016; color:#f0e6cc}
#mmTitle .mmButtons button.mmSmall{font-size:12px; opacity:.75}`; document.head.appendChild(st); })();
(function(){ const sec=mh("section",{id:"mmSims",class:"mmScreen",hidden:""},[
    mh("header",{class:"suTop"},[mh("button",{id:"simBack",class:"mmBack",text:"◂ TITLE",onclick:()=>showScreen("mmTitle")}),mh("h1",{text:"SIMULATIONS"}),mh("span")]),
    mh("main",{id:"simMain"}),
    mh("footer",{class:"suFoot"},[mh("span",{id:"simSummary"}),mh("button",{class:"go",text:"RUN SIMULATION ▶",onclick:runSim})])]);
  $("mm").appendChild(sec); sec.hidden=true; })();
function renderSims(){ const M=$("simMain"); M.innerHTML="";
  M.appendChild(mh("div",{class:"suHead"},[mh("h2",{text:"Pick a room"}),mh("p",{text:"Ten small rooms, each with a roof, lights, furniture to search and Norah's spawn at one end."})]));
  const g=mh("div",{class:"suGrid"}); for(const r of SIM_ROOMS) g.appendChild(suCard(r.name,r.desc,SIMR.room===r.key,()=>{ SIMR.room=r.key; saveSimR(); renderSims(); })); M.appendChild(g);
  M.appendChild(mh("div",{class:"suHead"},[mh("h2",{text:"Who is in it"})]));
  const kind=mh("select"); for(const [k,t] of SIM_KINDS) kind.appendChild(mh("option",{value:k,text:t})); kind.value=SIMR.kind; kind.onchange=()=>{ SIMR.kind=kind.value; saveSimR(); renderSims(); };
  const one=SIM_ONE.includes(SIMR.kind), cnt=mh("input",{type:"number",min:1,max:10,step:1}); cnt.value=one?1:SIMR.count; cnt.disabled=one; cnt.oninput=()=>{ SIMR.count=clamp(Math.round(+cnt.value||1),1,10); saveSimR(); simSum(); };
  const start=mh("div",{class:"simStart"}); for(const [k,t] of [["wander","Unaware · wandering"],["stand","Unaware · standing still"],["hunting","Hunting her"]]) start.appendChild(mh("button",{"aria-pressed":String(SIMR.start===k),text:t,onclick:()=>{ SIMR.start=k; saveSimR(); renderSims(); }}));
  M.appendChild(mh("div",{class:"simOpts"},[mh("label",{},["Enemy",kind]),mh("label",{},[one?"How many (only one of these at a time)":"How many (1–10)",cnt]),mh("label",{},["How they start",start])]));
  M.appendChild(mh("p",{class:"suNote",text:"Unaware ones haven't noticed her: they notice when she's in front of them in plain sight (closer if she's crouched, farther with the light on), right beside them, when she makes noise near them, or when she shoots them."}));
  simSum(); }
function simSum(){ const R=SIM_ROOMS.find(r=>r.key===SIMR.room)||SIM_ROOMS[0], n=SIM_ONE.includes(SIMR.kind)?1:SIMR.count; $("simSummary").innerHTML=`<b>${R.name}</b> · ${n} × ${(SIM_KINDS.find(k=>k[0]===SIMR.kind)||["",""])[1]} · ${SIMR.start==="hunting"?"hunting":"unaware"} · goal: clear the room`; }

// ---------------------------------------------------------------- not aware of her yet (the creatures run by their preview's code)
// ACROSS, Louis, the Runner and the Tactician already have their own unaware idles and noticing. The others hunt on sight, so an
// unaware one waits or wanders until it notices her: in front of it in plain sight for a moment (closer if she's crouched, farther
// with the light on), right beside it, a noise near it, or a shot.
{ const sp0=spawn; spawn=function(type,x,z,opts){ const e=sp0(type,x,z,opts); if(e&&e.kind==="pv"&&opts&&opts.aware==="unaware"){ e.pvUnaware={idle:opts.idle||"wander",t:0,see:0,heard:false,faceYaw:opts.yaw??null}; if(e.pvMem) e.pvMem.last=null; } return e; }; }
{ const mn0=makeNoise; makeNoise=function(x,z,r,...a){ for(const e of enemies) if(e.pvUnaware&&!e.dead&&Math.hypot(e.pos.x-x,e.pos.z-z)<r) e.pvUnaware.heard=true; return mn0(x,z,r,...a); }; }
{ const ph0=Enemy.prototype.pvHit; Enemy.prototype.pvHit=function(...a){ if(this.pvUnaware) pvAlert(this,"shot"); return ph0.apply(this,a); }; }
// an unaware one starts facing the way it was placed, not toward her
{ const pl0=PVBody.prototype.play; PVBody.prototype.play=function(name,o={}){ const U=this.e.pvUnaware; if(U&&U.faceYaw!=null&&o.anchor!=="keep"&&!o.dir) o=Object.assign({},o,{dir:new THREE.Vector3(Math.sin(U.faceYaw),0,Math.cos(U.faceYaw))}); return pl0.call(this,name,o); }; }
function pvAlert(e,why){ e.pvUnaware=null; if(e.pvMem) e.pvMem.last={x:player.pos.x,z:player.pos.z}; log(`${e.name} ${why==="shot"?"is shot · it knows where she is":why==="heard"?"heard her":"has noticed her"}`,"#ff9a6a"); }
function pvNotices(e,dist,toP,dt,U0){ const U=U0||e.pvUnaware; if(player.dead) return false; if(U.heard) return "heard"; if(dist<1.6) return "near";
  const range=8*(player.crouch?0.5:1)*(player.flash&&player.flash.on?1.4:1); const front=e.facing?e.facing(toP):1;
  if(dist<range&&front>0.55&&lineOfSight(e.pos.x,e.pos.z,player.pos.x,player.pos.z,true)) U.see+=dt*(dist<range*0.5?2:1); else U.see=Math.max(0,U.see-dt*0.5);
  return U.see>1.1?"seen":false; }
function pvIdle(e,dt,U){ const b=e.pv, c=b.ctx; U.t-=dt;
  if(e.pvType==="hob"){ if(!U.init){ U.init=1; if(U.faceYaw!=null) b.yaw=U.faceYaw; } c.I=0; if(U.t<=0){ U.turn=(rng()-0.5)*0.5; U.t=2+rng()*3; } b.yaw+=(U.turn||0)*dt; return; }
  const stand=U.idle!=="wander"; if(stand){ c.wantV=0; return; }
  if(U.t<=0||!U.goal){ U.t=4+rng()*4; const a=rng()*Math.PI*2, r=1.5+rng()*2.5, gx=e.pos.x+Math.cos(a)*r, gz=e.pos.z+Math.sin(a)*r;
    U.goal=(typeof navLine!=="function"||navLine(e.pos.x,e.pos.z,gx,gz,0.3))?{x:gx,z:gz}:null; }
  if(!U.goal){ c.wantV=0; return; } const dx=U.goal.x-e.pos.x, dz=U.goal.z-e.pos.z; if(Math.hypot(dx,dz)<0.6){ U.goal=null; U.t=1.5+rng()*2.5; c.wantV=0; return; }
  if(b.turnToward) b.turnToward(Math.atan2(dx,dz),0.5,dt); else c.wantYaw=pvWantYaw(b,dx,dz); c.wantV=1; }
for(const k in PVK){ const K=PVK[k], br=K.brain; if(!br||K._unaware) continue; K._unaware=true;
  K.brain=function(e,dt,dist,toP){ const U=e.pvUnaware; if(U){ const why=pvNotices(e,dist,toP,dt); if(why) pvAlert(e,why); else { pvIdle(e,dt,U); return; } } return br.call(this,e,dt,dist,toP); }; }

// Louis and the Runner always hunt: unaware, they hold still where they were placed until they notice her the same ways
{ const sp1=spawn; spawn=function(type,x,z,opts){ const e=sp1(type,x,z,opts); if(e&&(e.kind==="brute"||e.kind==="runner")&&opts&&opts.aware==="unaware") e.xUnaware={t:0,see:0,heard:false,faceYaw:opts.yaw??null}; return e; }; }
{ const mn1=makeNoise; makeNoise=function(x,z,r,...a){ for(const e of enemies) if(e.xUnaware&&!e.dead&&Math.hypot(e.pos.x-x,e.pos.z-z)<r) e.xUnaware.heard=true; return mn1(x,z,r,...a); }; }
{ const up0=Enemy.prototype.update; Enemy.prototype.update=function(dt){ const U=this.xUnaware;
    if(U&&!this.dead&&dt>0){ const toP=new THREE.Vector3(player.pos.x-this.pos.x,0,player.pos.z-this.pos.z), dist=toP.length(); toP.normalize();
      if(U.faceYaw!=null){ this.yaw=U.faceYaw; if(this.root) this.root.rotation.y=this.yaw; } const why=pvNotices(this,dist,toP,dt,U); if(!why){ if(this.syncRoot) this.syncRoot(); if(this.root) this.root.rotation.y=this.yaw; return; }
      this.xUnaware=null; this.lastKnown={x:player.pos.x,z:player.pos.z}; log(`${this.name} ${why==="heard"?"heard her":"has noticed her"}`,"#ff9a6a"); }
    return up0.call(this,dt); }; }
{ const hi0=Enemy.prototype.hit; Enemy.prototype.hit=function(...a){ if(this.xUnaware){ this.xUnaware=null; this.lastKnown={x:player.pos.x,z:player.pos.z}; } return hi0.apply(this,a); }; }

// ---------------------------------------------------------------- the main menu, simplified: Simulations, Maps, Map editor (and the controls)
{ const nav=document.querySelector("#mmTitle .mmButtons"); nav.innerHTML="";
  nav.append(mh("button",{id:"mmSimsBtn",text:"SIMULATIONS",onclick:()=>{ audio(); goMenu("sims"); }}),
    mh("button",{id:"mmStart",text:"MAPS",onclick:()=>{ audio(); goMenu("setup"); }}),
    mh("button",{id:"mmEdit",text:"MAP EDITOR",onclick:()=>{ audio(); goMenu("setup"); openBuilder(); }}),
    mh("button",{id:"mmControls",class:"mmSmall",text:"CONTROLS",onclick:()=>showScreen("mmCtl")})); }
{ const gm0=goMenu; goMenu=function(screen){ if(screen==="sims"){ gm0("title"); showScreen("mmSims"); renderSims(); return; } return gm0(screen); }; }
// Maps: just the maps (the tuning lives in the in-game panel, ` key)
{ const h=document.querySelector("#mmSetup .suTop h1"); if(h) h.textContent="MAPS"; const rs=$("suReset"); if(rs) rs.hidden=true; const nv=$("suNav"); if(nv) nv.hidden=true;
  const ms=$("mmSetup"); if(ms) ms.style.gridTemplateColumns="minmax(0,1fr)";
  suMap=function(M){ const d=ED.doc; const c={}; for(const o of d.objects) c[o.type]=(c[o.type]||0)+1;
    M.appendChild(mh("div",{class:"suCurrent"},[mh("b",{text:d.name}),mh("span",{text:`${c.wall||0} walls · ${c.prop||0} furniture · ${c.enemy||0} enemies${c.roof?" · "+c.roof+" roof"+(c.roof>1?"s":""):""}`}),
      mh("div",{class:"suRow"},[mh("button",{class:"suBtn",text:"Edit this map",onclick:openBuilder}),mh("button",{class:"suBtn",text:"New empty room",onclick:()=>{ suLoad(PRESETS.find(p=>p.key==="blankIn").make()); openBuilder(); }}),mh("button",{class:"suBtn",text:"New open ground",onclick:()=>{ suLoad(PRESETS.find(p=>p.key==="blankOut").make()); openBuilder(); }})])]));
    const g=mh("div",{class:"suGrid"}); for(const pr of PRESETS){ if(pr.key.startsWith("blank")) continue; g.appendChild(suCard(pr.name,pr.desc,d.preset===pr.key,()=>suLoad(Object.assign(pr.make(),{preset:pr.key})))); } M.appendChild(g);
    const maps=edMaps(); if(Object.keys(maps).length){ M.appendChild(mh("div",{class:"suLabel",text:"Your saved maps"})); const g2=mh("div",{class:"suGrid"}); for(const n of Object.keys(maps)) g2.appendChild(suCard(n,`${(maps[n].objects||[]).length} objects`,false,()=>suLoad(sbClone(edMaps()[n])))); M.appendChild(g2); } };
  const rs0=renderSetup; renderSetup=function(){ suSection="map"; rs0(); const hd=document.querySelector("#suMain .suHead"); if(hd) hd.remove(); }; }
// extras from the old Enemies section no longer have a place in the menu: none
SIM.extraAcross=0; SIM.extraLouis=0; SIM.startOverride="map"; saveSim();

// ---------------------------------------------------------------- first person (a test): the camera at her eyes, her body hidden, what she holds still shown
// Turned on from the pause menu. Aim, fire and movement work as in the shoulder view (the shot goes where the centre of the view is).
{ const uc1=updateCamera; updateCamera=function(rdt){ uc1(rdt); const fp=!!CFG.ctrl.fp&&!isFixed()&&MODE==="play"&&!replay.on;
    if(PLV.stage) PLV.stage.traverse(o=>{ if(o.isSkinnedMesh) o.visible=!fp||player.dead; });
    if(!fp||player.dead) return;
    let eye=null; try{ eye=plvWith(()=>{ const B=PLV.C&&PLV.C.B; return B&&B.head?B.head.getWorldPosition(new THREE.Vector3()):null; }); if(eye) eye.applyMatrix4(PLV.stage.matrixWorld); }catch(e){}
    if(!eye) eye=new THREE.Vector3(player.pos.x,groundY(player.pos.x,player.pos.z)+(player.posY||0)+(player.crouch?1.05:1.58),player.pos.z); else eye.y+=0.06;
    const look=new THREE.Vector3(Math.sin(camYaw)*Math.cos(camPitch),Math.sin(camPitch),Math.cos(camYaw)*Math.cos(camPitch));
    eye.addScaledVector(new THREE.Vector3(look.x,0,look.z).normalize(),0.1);   /* just in front of her face */
    camera.position.copy(eye); camPos.copy(eye); camera.lookAt(eye.clone().add(look)); if(camera.fov!==75){ camera.fov=75; camera.updateProjectionMatrix(); } }; }
