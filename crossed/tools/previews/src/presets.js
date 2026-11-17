// ================================================================ maps: new, presets (the playground's arenas and scenarios), import
function sbNewDoc(name="Untitled map"){
  return {app:"crossed-sandbox", version:1, name, note:"", win:"either", env:Object.assign({},ENV_DEF), start:{hp:"",rounds:"",spare:"",items:[],flashOn:false}, terrain:null, objects:[], customItems:[], textures:[], assets:[]};
}
function sbNormalize(d){
  const n=sbNewDoc(d.name||"Untitled map"); for(const k in n) if(d[k]===undefined) d[k]=n[k];
  d.env=Object.assign({},ENV_DEF,d.env||{}); d.start=Object.assign({hp:"",rounds:"",spare:"",items:[],flashOn:false},d.start||{});
  if(d.terrain) terrainFix(d.terrain);
  for(const o of d.objects){ if(!o.id) o.id=sbUid(o.type[0]); if(o.type==="wall"&&!o.openings) o.openings=[]; if(o.type==="wall") for(const op of o.openings) if(!op.id) op.id=sbUid("o"); if((o.type==="prop"||o.type==="block")&&o.search&&!o.items) o.items=[]; }
  return d;
}
// run one of the playground's arena builders in "record" mode and keep what it would have built
function recordArena(key){
  const keep=world; world={bounds:{},spawn:{x:0,z:0,yaw:0},enemySpawns:[],group:{add(){}},goal:null}; REC=[];
  try{ ARENAS[key].build(); } finally { var out={objects:REC,spawn:world.spawn,goal:world.goal,enemySpawns:world.enemySpawns}; world=keep; REC=null; }
  return out;
}
// the arenas' plain boxes become library furniture stretched to the same size, so layouts and push/vault tests stay identical
const BLOCK_ASSETS={wardrobe:"wardrobe",bed:"bed_double",couch:"couch","coffee table":"table",bookshelf:"bookshelf",desk:"desk",cabinet:"filing_cabinet",crate:"crate",shelf:"metal_shelving",table:"table",counter:"counter",pew:"pew",altar:"altar",chair:"chair"};
function blockToProp(o, rot){
  const asset=BLOCK_ASSETS[o.name]; if(!asset||!LIB_ASSETS[asset]) return o;
  const B=sbAssetBounds(asset); const q=(rot||0)%180!==0; const bw=B.maxX-B.minX, bd=B.maxZ-B.minZ, bh=B.maxY;
  const tw=q?o.d:o.w, td=q?o.w:o.d;
  return {id:o.id, type:"prop", asset, x:o.x, z:o.z, rot:rot||0, scale:1, sx:+(tw/bw).toFixed(3), sy:+(o.h/bh).toFixed(3), sz:+(td/bd).toFixed(3), push:o.push, name:o.name, solid:true};
}
function arenaDoc(key, name){
  const r=recordArena(key), d=sbNewDoc(name);
  d.objects=r.objects.map(o=>Object.assign({id:sbUid(o.type[0])},o));
  for(const o of d.objects) if(o.type==="wall") for(const op of o.openings) op.id=sbUid("o");
  d.objects.push({id:sbUid("s"),type:"spawn",x:r.spawn.x,z:r.spawn.z,yaw:Math.round(r.spawn.yaw*R2D)});
  if(r.goal) d.objects.push({id:sbUid("x"),type:"exit",x:r.goal.x,z:r.goal.z,r:r.goal.r,needs:""});
  d.env=Object.assign({},ENV_DEF,{fill:false});
  return d;
}
const findBlock=(d,name,x,z)=>d.objects.find(o=>o.type==="block"&&o.name===name&&(x===undefined||Math.abs(o.x-x)<0.05&&Math.abs(o.z-z)<0.05));
function propify(d,name,x,z,rot,search){ const o=findBlock(d,name,x,z); if(!o) return null; const p=blockToProp(o,rot); if(search){ p.search=true; p.items=search; } d.objects[d.objects.indexOf(o)]=p; return p; }
function setSpawn(d,x,z,yawRad){ const s=d.objects.find(o=>o.type==="spawn"); s.x=x; s.z=z; s.yaw=Math.round(yawRad*R2D); }
function addEnemies(d,list){ for(const [t,x,z,o] of list){ const op=o||{}; d.objects.push({id:sbUid("e"),type:"enemy",kind:t,x,z,yaw:Math.round((op.yaw??Math.PI)*R2D),start:op.aware==="unaware"?(op.idle||"wander"):"hunting",hpMul:1,speedMul:1}); } }
const IT=(item,qty=1,name="",text="")=>({item,qty,name,text});

const PRESETS=[
  {key:"clinic", name:"Abandoned clinic (stealth)", desc:"Dark rooms, eight ACROSS who haven't noticed her yet, a locked way out and a key somewhere in the office.", make(){
    const d=arenaDoc("clinic","Abandoned clinic"); d.win="exit";
    d.start={hp:"",rounds:2,spare:0,items:[IT("flashlight")],flashOn:false}; d.objects.find(o=>o.type==="spawn");
    const exitWall=d.objects.find(o=>o.type==="wall"&&o.a[1]===-12&&o.b[1]===-12); const door=exitWall.openings.find(op=>op.kind==="door"); door.closed=true; door.locked=true; door.key="Clinic key";
    propify(d,"cabinet",-8.7,-0.5,90,[IT("key",1,"Clinic key"),IT("note",1,"Duty roster","NIGHT SHIFT\nBack door key stays in the office cabinet.\nDo NOT prop the ward door open.")]);
    propify(d,"desk",-5,3.2,180,[IT("pills")]);
    propify(d,"crate",8.4,0.2,0,[IT("ammo",3)]); propify(d,"crate",4.6,-0.6,0,[]);
    propify(d,"shelf",4,4.2,180,[IT("batteries")]); propify(d,"shelf",7.4,4.2,180,[]);
    d.objects.push({id:sbUid("i"),type:"item",x:-3.4,z:-7.4,item:"bandage",qty:1,name:"",text:""});
    addEnemies(d,[["across:walker",0.3,-1.6,{aware:"unaware",idle:"playdead"}],["across:crawler",-7.2,-8.2,{aware:"unaware",idle:"lurk",yaw:Math.PI/2}],["across:matron",-5,1,{aware:"unaware",idle:"wander"}],["across:mourner",5.6,-6.6,{aware:"unaware",idle:"feed",yaw:Math.PI}],["across:walker",6,-3.4,{aware:"unaware",idle:"wander"}]]);
    d.note="Reach the green exit at the north end. Its door is locked: the key is in the office (west side, near the entrance). Crouch (Q) in the dark and don't run. The flashlight (L) helps you see but makes you easier to spot. Two bullets. That body in the hall may not be dead.";
    return d; }},
  {key:"house", name:"Norah's house: Louis in the bedroom", desc:"Chapter One's fight. Five loaded, seven spare. The wardrobe and the bookshelf can be searched.", make(){
    const d=arenaDoc("house","Norah's house"); d.win="kill"; setSpawn(d,-0.4,-1.2,Math.PI); d.start.rounds=5; d.start.spare=7;
    propify(d,"bed",-1.4,-3.4,0); propify(d,"couch",-1.8,2.6,90); propify(d,"coffee table",1.2,2.8,0);
    propify(d,"wardrobe",1.9,-4.15,0,[IT("pills")]); propify(d,"bookshelf",3.6,0.7,0,[IT("ammo",3),IT("photo")]);
    addEnemies(d,[["brute",1.2,-3.7]]); return d; }},
  {key:"houseDoor", name:"Hold the door: Louis outside the bedroom", desc:"Slam the bedroom door (E) and push the wardrobe in front of it.", make(){
    const d=arenaDoc("house","Hold the door"); d.win="kill"; setSpawn(d,-0.5,-2.5,0); d.start.rounds=5; d.start.spare=7;
    propify(d,"bed",-1.4,-3.4,0); propify(d,"couch",-1.8,2.6,90); propify(d,"coffee table",1.2,2.8,0); propify(d,"wardrobe",1.9,-4.15,0,[IT("bandage")]); propify(d,"bookshelf",3.6,0.7,0);
    addEnemies(d,[["brute",1.3,2.2]]); d.note="Slam the bedroom door (E) and push the wardrobe."; return d; }},
  {key:"corridor", name:"Corridor: 3 ACROSS", desc:"A hallway with side rooms. The desk and the cabinet have supplies.", make(){
    const d=arenaDoc("corridor","Corridor"); d.win="kill"; propify(d,"desk",-3.5,-2,90,[IT("ammo",5),IT("bandage")]); propify(d,"cabinet",3.4,-11,0,[IT("flashlight")]);
    addEnemies(d,[["across",0,-13.2],["across",-0.4,-12.2],["across",0.4,-11.3]]); return d; }},
  {key:"noAmmo", name:"No bullets: shove and run", desc:"Get past it and close a door behind you.", make(){
    const d=arenaDoc("corridor","No bullets"); d.win="none"; setSpawn(d,0,-3,Math.PI); d.start.rounds=0; d.start.spare=0; propify(d,"desk",-3.5,-2,90,[IT("ammo",2)]); propify(d,"cabinet",3.4,-11,0);
    addEnemies(d,[["across",0,-9]]); d.note="Get past it and close a door behind you. The desk in the west room might have something."; return d; }},
  {key:"open", name:"Open arena: Louis", desc:"The basic test. Pillars, cover, a corridor with a door, two crates to search.", make(){
    const d=arenaDoc("open","Open arena"); d.win="kill"; propify(d,"crate",-8,0,0,[IT("firstaid")]); propify(d,"crate",8,1,0,[IT("ammo",10)]);
    addEnemies(d,[["brute",0,0]]); return d; }},
  {key:"runner", name:"Open arena: the Runner", desc:"One Runner. Watch it curl in before it charges, then sidestep. Two crates to search.", make(){
    const d=arenaDoc("open","The Runner"); d.win="kill"; d.start.rounds=5; d.start.spare=20; propify(d,"crate",-8,0,0,[IT("firstaid")]); propify(d,"crate",8,1,0,[IT("ammo",10)]);
    addEnemies(d,[["runner",0,-4]]); return d; }},
  {key:"tactician", name:"Corridor: a Tactician and two Walkers", desc:"Bold while the Walkers live. Kill them and watch it lose its nerve: it scurries out of sight and waits at a doorway or a turn to ambush her.", make(){
    const d=arenaDoc("corridor","The Tactician"); d.win="kill"; d.start.rounds=6; d.start.spare=24; propify(d,"desk",-3.5,-2,90,[IT("ammo",6),IT("bandage")]);
    addEnemies(d,[["tactician",0,-12.4],["across:walker",-0.6,-11.2],["across:walker",0.6,-10.6]]); return d; }},
  {key:"variety", name:"Open arena: one of each ACROSS", desc:"All four subclasses: Walker, Crawler, Matron and a kneeling Mourner (don't wake it).", make(){
    const d=arenaDoc("open","One of each"); d.win="kill"; setSpawn(d,0,9,Math.PI); d.start.rounds=5; d.start.spare=30; propify(d,"crate",-8,0,0,[IT("firstaid")]); propify(d,"crate",8,1,0,[IT("ammo",10)]);
    addEnemies(d,[["across:walker",-6,-6],["across:crawler",-2,-3],["across:matron",3,-6],["across:mourner",7,-8,{aware:"unaware",idle:"feed",yaw:Math.PI}]]); return d; }},
  {key:"pack", name:"Open arena: ACROSS pack of 6", desc:"Only a few attack at once; the rest circle.", make(){
    const d=arenaDoc("open","ACROSS pack"); d.win="kill"; d.start.rounds=5; d.start.spare=15; propify(d,"crate",-8,0,0); propify(d,"crate",8,1,0,[IT("ammo",6)]);
    addEnemies(d,[["across",-4,-2],["across",-2,-3],["across",0,-3.5],["across",2,-3],["across",4,-2],["across:crawler",0,-5]]); return d; }},
  {key:"crippled", name:"Legless crawlers (grab test)", desc:"They grab ankles. Hit the prompts in time to push them off.", make(){
    const d=arenaDoc("open","Legless crawlers"); d.win="kill"; setSpawn(d,0,4,Math.PI); d.start.rounds=5; d.start.spare=10; propify(d,"crate",-8,0,0); propify(d,"crate",8,1,0);
    addEnemies(d,[["across_legless",-1,1],["across_legless",1.2,0.5]]); return d; }},
  {key:"chapel", name:"Chapel: 5 ACROSS", desc:"Pews to vault, pillars, the altar holds something.", make(){
    const d=arenaDoc("chapel","Chapel"); d.win="kill"; d.start.rounds=5; d.start.spare=15;
    for(const o of d.objects.filter(o=>o.type==="block"&&o.name==="pew")) d.objects[d.objects.indexOf(o)]=blockToProp(o,0);
    propify(d,"altar",0,-10.3,0,[IT("rosary"),IT("ammo",5)]);
    addEnemies(d,[["across",-1.5,-7.8],["across",1.5,-7.8],["across",0,-6.5],["across",-0.6,-4],["across",0.7,-2.5]]); return d; }},
  {key:"hillside", name:"Hillside cabin (terrain)", desc:"Rolling ground, woods, a cabin and a car. Find the car keys and drive out. Shows terrain, paths and outdoor props.", make(){ return hillsideDoc(); }},
  {key:"blankIn", name:"New: empty room", desc:"A 12 × 12 m room with one light, Norah and nothing else.", make(){
    const d=sbNewDoc("New room"); d.win="either";
    d.objects.push({id:sbUid("f"),type:"floor",x:-6,z:-6,w:12,d:12,tex:"",colA:"#2e2a26",colB:"#36322c",y:0});
    for(const [a,b] of [[[-6,-6],[6,-6]],[[6,-6],[6,6]],[[6,6],[-6,6]],[[-6,6],[-6,-6]]]) d.objects.push({id:sbUid("w"),type:"wall",a,b,height:2.8,thick:0.2,color:"#5e594f",tex:"",openings:[]});
    d.objects.push({id:sbUid("l"),type:"light",x:0,y:2.6,z:0,color:"#ffc890",intensity:1,dist:12},{id:sbUid("s"),type:"spawn",x:0,z:4,yaw:180});
    return d; }},
  {key:"blankOut", name:"New: open ground (terrain)", desc:"40 × 40 m of flat grass to sculpt with the terrain brushes.", make(){
    const d=sbNewDoc("New outdoor map"); d.win="either"; d.terrain=terrainMake(-20,-20,40,40,1,1);
    d.env=Object.assign({},ENV_DEF,{sky:"#20262e",fog:0.03,hemi:0.7,moon:0.6});
    d.objects.push({id:sbUid("s"),type:"spawn",x:0,z:8,yaw:180}); return d; }}
];
function hillsideDoc(){
  const d=sbNewDoc("Hillside cabin"); d.win="exit";
  const T=d.terrain=terrainMake(-26,-26,52,52,1,1); terrainHills(T,1.4,7.3);
  const flat=(cx,cz,r,h,soft=3)=>tEach(T,cx,cz,r+soft,(k,dd)=>{ const t=clamp((dd-r)/soft,0,1), s=t*t*(3-2*t); T.h[k]=h*(1-s)+T.h[k]*s; });
  const paint=(cx,cz,r,p,ch=1)=>tEach(T,cx,cz,r,(k)=>{ if(vhash(k*7+p)<ch) T.p[k]=p; });
  const cab={x0:2,z0:-8,w:6,d:5}; const ccx=cab.x0+cab.w/2, ccz=cab.z0+cab.d/2; const ch=Math.round(tSample(T,ccx,ccz)*10)/10;
  flat(ccx,ccz,5.5,ch,4);
  const road=[[-26,14],[-10,12.5],[4,11],[14,11.5],[26,13]];
  for(let i=0;i<road.length-1;i++){ const [ax,az]=road[i],[bx,bz]=road[i+1]; for(let t=0;t<=1;t+=0.05){ const x=ax+(bx-ax)*t, z=az+(bz-az)*t; flat(x,z,2.2,tSample(T,x,z),2.5); } }
  for(let i=0;i<road.length-1;i++){ const [ax,az]=road[i],[bx,bz]=road[i+1]; for(let t=0;t<=1;t+=0.05) paint(ax+(bx-ax)*t,az+(bz-az)*t,2.6,4,0.8); }
  paint(ccx,ccz,5,0,0.7); paint(-12,-12,6,9,0.6); paint(14,-14,5,9,0.5); paint(-8,0,4,2,0.7); paint(16,2,5,2,0.6); paint(-14,20,5,3,0.6);
  const H=(x,z)=>Math.round(tSample(T,x,z)*100)/100;
  d.objects.push({id:sbUid("q"),type:"path",points:road,width:3.2,tex:"",color:"#3a3a38"});
  d.objects.push({id:sbUid("q"),type:"path",points:[[ccx,cab.z0+cab.d+0.1],[ccx,6],[6,10.5]],width:1.4,tex:"",color:"#5e5446"});
  d.objects.push({id:sbUid("f"),type:"floor",x:cab.x0,z:cab.z0,w:cab.w,d:cab.d,tex:"",colA:"#3a2e24",colB:"#43352a",y:ch});
  const W=(a,b,op)=>d.objects.push({id:sbUid("w"),type:"wall",a,b,height:2.6,thick:0.18,color:"#6a5a48",tex:"",openings:op||[]});
  W([cab.x0,cab.z0],[cab.x0+cab.w,cab.z0],[{id:sbUid("o"),kind:"window",at:3,width:1.2,sill:0.95,top:2.0}]);
  W([cab.x0+cab.w,cab.z0],[cab.x0+cab.w,cab.z0+cab.d],[{id:sbUid("o"),kind:"window",at:2.5,width:1.0,sill:0.95,top:2.0}]);
  W([cab.x0+cab.w,cab.z0+cab.d],[cab.x0,cab.z0+cab.d],[{id:sbUid("o"),kind:"door",at:3,width:1.0,side:1,closed:true}]);
  W([cab.x0,cab.z0+cab.d],[cab.x0,cab.z0]);
  const P=(asset,x,z,rot,extra)=>{ const o=Object.assign({id:sbUid("p"),type:"prop",asset,x,z,rot:rot||0,scale:1},extra||{}); d.objects.push(o); return o; };
  P("bed_twin",cab.x0+0.7,cab.z0+1.1,0); P("nightstand",cab.x0+1.6,cab.z0+0.35,0,{search:true,items:[IT("pills")]});
  P("dresser",cab.x0+3.4,cab.z0+0.35,0,{search:true,items:[IT("truck_keys",1,"Car keys"),IT("note",1,"Note on the dresser","Took the truck to town. Car keys are in the top drawer if you need to leave.\nDon't wait for me. — L")]});
  P("table",cab.x0+4.6,cab.z0+3.3,0); P("chair",cab.x0+4.0,cab.z0+3.3,90); P("stove",cab.x0+cab.w-0.45,cab.z0+1.8,-90,{search:true,items:[IT("ammo",4)]});
  P("rug",cab.x0+2.6,cab.z0+2.8,0); P("lamp",cab.x0+0.4,cab.z0+cab.d-0.4,0);
  d.objects.push({id:sbUid("l"),type:"light",x:ccx,y:ch+2.3,z:ccz,color:"#ffc070",intensity:0.6,dist:6});
  P("car",14,9.3,90,{search:true,items:[IT("firstaid")]}); P("streetlight",-4,9.8,0); P("mailbox",6.8,10,0); P("well",-6,-3,0); P("woodpile",cab.x0-0.8,cab.z0+2.5,90,{search:true,items:[IT("batteries")]});
  P("shed",16,-6,-90,{search:true,items:[IT("ammo",5),IT("bandage")]});
  for(let i=0;i<5;i++) P("fence",-1+i*2,-11,0);
  const trees=["tree","tree_pine","tree_pine","tree_birch","tree_bare","tree_dead"], R=mulberry(99);
  for(let i=0;i<46;i++){ const x=-24+R()*48, z=-24+R()*48; if(Math.hypot(x-ccx,z-ccz)<8||Math.abs(z-12)<4.5||Math.hypot(x-16,z+6)<4||Math.hypot(x+6,z+3)<3) continue; P(trees[Math.floor(R()*trees.length)],+x.toFixed(2),+z.toFixed(2),Math.round(R()*360),{scale:+(0.8+R()*0.5).toFixed(2)}); }
  for(let i=0;i<10;i++){ const x=-24+R()*48, z=-24+R()*48; if(Math.abs(z-12)<4||Math.hypot(x-ccx,z-ccz)<7) continue; P(R()<0.5?"rock":"boulder",+x.toFixed(2),+z.toFixed(2),Math.round(R()*360),{scale:+(0.7+R()*0.6).toFixed(2)}); }
  for(let i=0;i<14;i++){ const x=-24+R()*48, z=-24+R()*48; if(Math.abs(z-12)<4||Math.hypot(x-ccx,z-ccz)<6) continue; P("bush",+x.toFixed(2),+z.toFixed(2),Math.round(R()*360)); }
  P("stump",-10,4,0); P("log",-14,-6,30);
  d.objects.push({id:sbUid("i"),type:"item",x:-16,z:9.5,item:"ammo",qty:3,name:"",text:""});
  d.objects.push({id:sbUid("x"),type:"exit",x:14,z:12.2,r:1.2,needs:"Car keys",label:"the car"});
  d.objects.push({id:sbUid("s"),type:"spawn",x:-20,z:13,yaw:90});
  d.objects.push({id:sbUid("c"),type:"corpse",x:-2,z:5.5,yaw:40});
  addEnemies(d,[["across:walker",-8,2,{aware:"unaware",idle:"wander"}],["across:mourner",-6,-1.6,{aware:"unaware",idle:"feed",yaw:Math.PI}],["across:walker",18,2,{aware:"unaware",idle:"wander"}],["across:crawler",cab.x0+1.2,cab.z0+3.6,{aware:"unaware",idle:"lurk",yaw:Math.PI}]]);
  d.env=Object.assign({},ENV_DEF,{sky:"#1a1f27",fog:0.032,hemi:0.62,moon:0.55,dark:""});
  d.start={hp:"",rounds:5,spare:4,items:[],flashOn:false};
  d.note="Dusk. The car by the road won't start without its keys, and they're somewhere in the cabin. Something is lying in there. The woods are full of them.";
  return d;
}

// ---------------------------------------------------------------- import: the Map Designer's export, this sandbox's own maps, the Item Modeler's items
function sbFindDesignerMap(j){ if(!j||typeof j!=="object") return null; if(Array.isArray(j.objects)) return j; for(const k in j){ const r=sbFindDesignerMap(j[k]); if(r) return r; } return null; }
function sbFindItems(j){ if(!j||typeof j!=="object") return null; if(Array.isArray(j.items)&&j.items.length&&j.items[0]&&j.items[0].parts) return j.items; for(const k in j){ const r=sbFindItems(j[k]); if(r) return r; } return null; }
function fromDesigner(m, levelId){
  const levels=(Array.isArray(m.levels)&&m.levels.length)?m.levels:[{id:undefined,name:"Ground",elev:0}];
  const lvl=levels.find(l=>l.id===levelId)||levels.find(l=>(l.elev||0)===0)||levels[0], elev=lvl.elev||0;
  const objs=m.objects.filter(o=>o.level===undefined||lvl.id===undefined||o.level===lvl.id);
  const d=sbNewDoc(m.name||"Imported map"); d.env=Object.assign({},ENV_DEF,{fill:true,fillI:lvl.dark?0.2:0.8}); let skipped=0, hasSpawn=false;
  const yawFromDesigner=y=>Math.round(((y||0)+180)%360); const grounds=[];
  for(const o of objs){
    if(o.type==="floor"&&o.w&&o.d&&o.ground) grounds.push(o);
    else if(o.type==="floor"&&o.w&&o.d) d.objects.push({id:o.id||sbUid("f"),type:"floor",x:o.x,z:o.z,w:o.w,d:o.d,tex:o.tex||"",scale:o.scale||1,y:0});
    else if(o.type==="wall"&&o.a&&o.b) d.objects.push({id:o.id||sbUid("w"),type:"wall",a:o.a,b:o.b,height:o.height||2.8,thick:o.thick||0.2,color:"#5a554c",tex:o.texA||"",texB:o.texB||"",scale:o.scale||1,
      openings:(o.openings||[]).map(op=>({id:op.id||sbUid("o"),kind:op.kind==="window"?"window":op.kind==="door"?"door":"gap",at:op.at,width:op.width||1,sill:op.sill,top:op.top,hinge:op.hinge,side:op.side==="out"?1:-1,closed:op.ajar!==undefined&&op.ajar<10,locked:false,key:""}))});
    else if(o.type==="platform"&&o.w&&o.d) d.objects.push({id:o.id||sbUid("b"),type:"block",x:o.x+o.w/2,z:o.z+o.d/2,w:o.w,d:o.d,h:o.h||0.6,tex:o.tex||"",color:"#6a6258",name:"stage",push:false});
    else if(o.type==="prop"&&o.asset) d.objects.push({id:o.id||sbUid("p"),type:"prop",asset:o.asset,x:o.x,z:o.z,rot:o.rot||0,scale:o.scale||1,search:!!o.search,solid:o.solid===false?false:"auto",items:[]});
    else if(o.type==="light") d.objects.push({id:o.id||sbUid("l"),type:"light",x:o.x,y:(o.y??(elev+2.4))-elev,z:o.z,color:o.color||"#ffb060",intensity:+((o.energy||1)*1.2).toFixed(2),dist:+((o.range||8)*1.5).toFixed(2)});
    else if(o.type==="camera"){ const yaw=(o.yaw||0)*D2R, pit=(o.pitch||0)*D2R, y=(o.y??(elev+2.6))-elev; const fx=-Math.sin(yaw)*Math.cos(pit), fy=Math.sin(pit), fz=-Math.cos(yaw)*Math.cos(pit);
      d.objects.push({id:o.id||sbUid("c"),type:"camera",x:o.x,y,z:o.z,look:[+(o.x+fx*5).toFixed(2),+(y+fy*5).toFixed(2),+(o.z+fz*5).toFixed(2)],track:!!(o.mode&&o.mode!=="fixed"),fov:o.fov||60}); }
    else if(o.type==="marker"){ if(o.kind==="spawn"){ d.objects.push({id:sbUid("s"),type:"spawn",x:o.x,z:o.z,yaw:yawFromDesigner(o.rot)}); hasSpawn=true; }
      else if(o.kind==="enemy"){ const t=JSON.stringify(o).toLowerCase(); d.objects.push({id:sbUid("e"),type:"enemy",kind:/brute|louis/.test(t)?"brute":/dummy/.test(t)?"dummy":"across",x:o.x,z:o.z,yaw:yawFromDesigner(o.rot),start:"hunting",hpMul:1,speedMul:1}); }
      else if(o.label) d.objects.push({id:sbUid("i"),type:"item",x:o.x,z:o.z,item:"custom",qty:1,name:o.label,text:o.note||""}); else skipped++; }
    else if(o.type==="figure"){ if(o.who==="norah"||o.player){ if(!hasSpawn){ d.objects.push({id:sbUid("s"),type:"spawn",x:o.x,z:o.z,yaw:yawFromDesigner(o.rot)}); hasSpawn=true; } }
      else if(o.who==="louis"||o.who==="bellemood") d.objects.push({id:sbUid("e"),type:"enemy",kind:"brute",x:o.x,z:o.z,yaw:yawFromDesigner(o.rot),start:"hunting",hpMul:1,speedMul:1});
      else if(o.who==="across") d.objects.push({id:sbUid("e"),type:"enemy",kind:"across:crawler",x:o.x,z:o.z,yaw:yawFromDesigner(o.rot),start:"hunting",hpMul:1,speedMul:1}); else skipped++; }
    else if(o.type==="path"&&Array.isArray(o.points)) d.objects.push({id:o.id||sbUid("q"),type:"path",points:o.points,width:o.width||1.6,tex:o.tex||"",color:"#6a665e"});
    else skipped++;
  }
  if(grounds.length){ // the designer's big outdoor "ground" floors become painted terrain you can sculpt
    let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9; for(const g of grounds){ x0=Math.min(x0,g.x); z0=Math.min(z0,g.z); x1=Math.max(x1,g.x+g.w); z1=Math.max(z1,g.z+g.d); }
    const area=(x1-x0)*(z1-z0), cell=area>16000?2:1; const T=d.terrain=terrainMake(Math.floor(x0),Math.floor(z0),Math.ceil(x1-x0),Math.ceil(z1-z0),cell,0);
    const pick=t=>{ t=String(t||""); return /grass|lawn|moss/.test(t)?1:/dirt|mud|earth/.test(t)?0:/gravel/.test(t)?4:/asphalt|road/.test(t)?7:/concrete/.test(t)?8:/snow/.test(t)?6:/sand/.test(t)?5:/leaf|leaves/.test(t)?9:1; };
    for(let j=0;j<T.nz;j++) for(let i=0;i<T.nx;i++){ const x=T.x0+i*T.cell, z=T.z0+j*T.cell; for(const g of grounds) if(x>=g.x&&x<=g.x+g.w&&z>=g.z&&z<=g.z+g.d) T.p[j*T.nx+i]=pick(g.tex); } }
  if(!hasSpawn){ const B=docBounds(d); d.objects.push({id:sbUid("s"),type:"spawn",x:(B.x0+B.x1)/2,z:(B.z0+B.z1)/2,yaw:180}); }
  d.textures=(m.textures||[]).filter(t=>t&&t.data).map(t=>({id:t.id,name:t.name,data:t.data,m:t.m})); d.assets=(m.assets||[]).filter(a=>a&&a.id&&a.parts);
  return {doc:sbNormalize(d), skipped, level:lvl.name};
}

// ---------------------------------------------------------------- Chapter One: Norah's house, from the Godot blockout
// Coordinates copied from crossed/tools/build_norah_house.py (owarends-commits/Games): X east, Z south (north = −Z), 1 unit = 1 m.
//   Living room X 0..4, Z −5.33..0 · Kitchen X 4..8, Z −5.33..−3.17 · Hallway X 4..8, Z −3.17..−2.33 · Bathroom X 4..5.83, Z −2.33..0 · Bedroom X 5.83..8, Z −2.33..0
const GODOT_TREES=[[-15.87, -31.36, 8.6], [-29.94, -24.62, 7.46], [-30.75, -25.12, 6.15], [-9.72, -32.78, 6.36], [-10.23, -19.53, 6.5], [-21.5, -23.02, 9.79], [-1.68, -27.06, 9.91], [-31.39, -18.98, 7.16], [-25.92, -31.94, 7.23], [11.7, -30.84, 8.33], [1.78, -27.48, 8.19], [-30.48, -32.96, 6.82], [4.1, -26.52, 7.26], [-1.21, -26.07, 7.2], [10.49, -21.77, 6.98], [-1.83, -24.81, 9.5], [6.85, -28.96, 9.92], [-27.39, -26.68, 9.03], [-25.49, -25.44, 6.16], [3.42, -20.62, 8.29], [15.03, -28.51, 8.78], [-0.72, -23.85, 7.82], [13.04, -17.47, 7.9], [3.19, -32.94, 8.81], [2.24, -16.62, 9.29], [-18.06, -27.25, 8.67], [-32.74, -25.92, 6.67], [-27.44, -32.97, 9.07], [-26.76, -29.67, 7.56], [14.8, -32.59, 7.8], [-3.23, -18.54, 9.28], [14.38, -29.13, 7.66], [-13.91, -18.53, 9.83], [-25.55, -30.92, 6.93], [-20.93, -25.51, 8.36], [-19.29, -33.93, 7.68], [-13.32, -24.09, 9.81], [4.67, -24.98, 8.47], [3.87, -33.06, 9.6], [9.68, -18.7, 9.19], [-12.03, -27.02, 6.41], [1.52, -32.91, 6.27], [-22.31, -31.16, 7.36], [-31.06, -34.0, 6.61], [-28.32, -27.64, 6.1], [14.96, -23.25, 6.59], [-19.87, -27.92, 7.46], [-27.12, -19.14, 9.97], [-7.9, -25.53, 6.34], [-28.28, -28.0, 7.06], [12.42, -31.17, 6.09], [19.26, -24.76, 6.59], [-3.58, -33.53, 8.11], [20.8, -18.89, 8.78], [-19.38, -27.58, 6.67], [9.23, -24.68, 9.12], [-15.54, -30.1, 9.25], [21.16, -19.08, 9.22], [11.83, -21.05, 6.91], [-5.01, -27.78, 6.12], [-32.44, -29.11, 7.04], [4.78, -17.26, 7.79], [18.47, -16.71, 9.82], [-13.58, -30.14, 6.91], [-22.98, -30.42, 8.5], [16.42, -19.29, 7.92], [2.57, -20.01, 6.34], [2.99, -18.08, 9.13], [8.01, -25.63, 6.71], [10.19, -28.18, 9.2], [22.66, -4.12, 7.61], [22.36, 5.74, 6.68], [12.52, -11.47, 9.62], [20.68, -11.61, 9.31], [22.76, 3.72, 7.4], [17.58, -12.07, 6.06], [22.65, 3.49, 8.11], [22.2, -2.99, 9.49], [20.91, -9.67, 7.01], [14.52, -8.78, 8.35], [14.11, -3.43, 6.52], [21.92, -5.39, 7.83], [18.0, 11.13, 7.68], [22.01, -0.95, 8.13], [17.28, -15.44, 7.76], [13.2, -15.88, 9.2], [13.07, -1.8, 8.9], [17.68, -6.22, 8.07], [17.67, 7.53, 6.42], [17.72, -8.55, 7.11], [20.27, -0.77, 8.25], [20.12, 11.37, 7.77], [18.35, -0.83, 8.05], [19.31, -2.43, 8.13], [16.74, 12.25, 8.8], [21.52, 12.27, 7.04], [17.71, 12.3, 9.36], [12.65, -12.35, 7.77], [11.87, -8.78, 6.29], [19.03, 7.52, 9.59], [12.85, 5.48, 8.64], [12.72, 10.48, 9.87], [13.64, 12.58, 7.59], [16.85, 13.7, 9.33], [12.94, -3.05, 8.06], [15.07, -10.13, 7.27], [19.67, -15.42, 8.22], [16.29, -15.46, 7.33], [18.49, -0.63, 6.26], [22.82, 7.65, 9.89], [-7.4, -22.0, 8], [-3.9, -23.6, 9], [-11.6, -14.6, 8]];
function ch1HouseDoc(){
  const d=sbNewDoc("Chapter One: Norah's house"); d.win="kill";
  const CEIL=2.3, WT=0.12, ET=0.18, DH=2.0;
  const T=d.terrain=terrainMake(-40,-38,64,54,1,1);
  for(let k=0;k<T.p.length;k++){ const x=T.x0+(k%T.nx), z=T.z0+Math.floor(k/T.nx);
    if(x>=-34&&x<=-24&&z>=-14&&z<=8) T.p[k]=0;                       // the cul-de-sac's edge
    else if(z<-16||x>11) T.p[k]=vhash(k)<0.6?9:1;                    // woods floor
    else if(vhash(k*3)<0.2) T.p[k]=2; }
  const W=(a,b,o)=>d.objects.push(Object.assign({id:sbUid("w"),type:"wall",a,b,height:CEIL,thick:WT,color:"#7a7262",tex:"b:wallpaper",texB:"b:wallpaper",openings:[]},o||{}));
  const F=(x0,x1,z0,z1,tex,y=0)=>d.objects.push({id:sbUid("f"),type:"floor",x:x0,z:z0,w:x1-x0,d:z1-z0,tex:"b:"+tex,colA:"#3a2e24",colB:"#43352a",y});
  const op=(kind,a0,a1,extra)=>Object.assign({id:sbUid("o"),kind,at:+((a0+a1)/2).toFixed(3),width:+Math.abs(a1-a0).toFixed(3)},kind==="door"?{side:1,closed:false,top:DH}:kind==="gap"?{top:DH}:{},extra||{});
  // a library model stretched to fill one of the blockout's boxes exactly
  const fit=(asset,x0,x1,z0,z1,h,rot,extra)=>{ const B=sbAssetBounds(asset), q=(rot%180)!==0, bw=B.maxX-B.minX, bd=B.maxZ-B.minZ;
    const o=Object.assign({id:sbUid("p"),type:"prop",asset,x:+((x0+x1)/2).toFixed(3),z:+((z0+z1)/2).toFixed(3),rot,scale:1,sx:+((q?z1-z0:x1-x0)/bw).toFixed(3),sy:+(h/B.maxY).toFixed(3),sz:+((q?x1-x0:z1-z0)/bd).toFixed(3),solid:"auto",push:"auto"},extra||{}); d.objects.push(o); return o; };
  const blk=(x0,x1,z0,z1,h,color,name,extra)=>d.objects.push(Object.assign({id:sbUid("b"),type:"block",x:+((x0+x1)/2).toFixed(3),z:+((z0+z1)/2).toFixed(3),w:+(x1-x0).toFixed(3),d:+(z1-z0).toFixed(3),h,color,name,push:false,tex:""},extra||{}));
  const P=(asset,x,z,rot,extra)=>{ const o=Object.assign({id:sbUid("p"),type:"prop",asset,x,z,rot:rot||0,scale:1,solid:"auto",push:"auto"},extra||{}); d.objects.push(o); return o; };
  const L=(x,y,z,col,i,r)=>d.objects.push({id:sbUid("l"),type:"light",x,y,z,color:col,intensity:i,dist:r});
  // floors
  F(0,4,-5.33,0,"carpet_brown"); F(4,8,-5.33,-3.17,"lino_beige"); F(4,8,-3.17,-2.33,"carpet_brown"); F(4,5.83,-2.33,0,"tile_white_small"); F(5.83,8,-2.33,0,"carpet_brown");
  F(-1,0,-3.95,-1.35,"porch_boards",0.08); F(-1.45,-1,-3.3,-2.0,"pine_planks",0.04);
  // exterior walls, wallpaper inside and grey siding outside (each wall's first face points into the house)
  const ext={thick:ET,tex:"b:wallpaper",texB:"b:siding_gray_peel"};
  W([0,-5.33],[8,-5.33],Object.assign({},ext,{openings:[op("window",5.6,6.7,{sill:1.0,top:1.7})]}));                                   // north: kitchen window
  W([8,-5.33],[8,0],Object.assign({},ext,{openings:[op("door",-4.5+5.33,-3.83+5.33,{closed:true}),op("window",-1.67+5.33,-0.67+5.33,{sill:0.85,top:1.9})]}));   // east: back door, bedroom window
  W([8,0],[0,0],Object.assign({},ext));                                                                                                  // south
  W([0,0],[0,-5.33],Object.assign({},ext,{openings:[op("door",2.17,3.17,{closed:true}),op("window",0.5,1.6,{sill:0.9,top:1.8})]}));    // west: front door (a full metre), living window
  // interior walls. The thin ones Louis can smash through are marked weak.
  W([4,-5.33],[4,-3.17],{weak:true});                                                        // living | kitchen
  W([4,-2.33],[4,0],{weak:true});                                                            // living | bath
  W([4,-3.17],[8,-3.17],{weak:true,openings:[op("gap",0.5,1.3)]});                          // kitchen | hall: kitchen doorway
  W([4,-2.33],[8,-2.33],{weak:true,openings:[op("door",0.58,1.25,{side:-1}),op("door",2.17,2.83,{side:-1})]});   // hall | bath, bedroom
  W([5.83,-2.33],[5.83,0],{weak:true});                                                      // bath | bedroom
  // living room: the couch north of the front door (push it 1.15 m south to block the door), TV, radiator, side table, coat rack, plant
  fit("couch",0.35,1.35,-5.2,-3.1,0.85,90,{push:true,name:"couch"});
  fit("tvstand",3.05,3.6,-4.55,-3.65,0.98,-90);
  blk(0.05,0.2,-5.2,-4.4,0.6,"#4a4a4e","radiator"); blk(0.4,0.85,-1.2,-0.75,0.55,"#6a4a30","side table");
  P("coat_rack",0.28,-1.4,0); P("potted_plant_dead",3.72,-0.28,0);
  // kitchen: fridge, counter run with the junk drawer, table and mismatched chairs, the bookshelf by the back door
  fit("fridge",4.1,4.75,-5.25,-4.6,1.75,0);
  fit("counter",4.8,7.0,-5.25,-4.65,0.9,0,{search:true,name:"junk drawer",items:[IT("batteries")]});
  fit("table",6.3,7.1,-3.95,-3.3,0.72,0); fit("chair",6.0,6.3,-3.75,-3.45,0.9,90); fit("chair",7.1,7.4,-3.75,-3.45,0.9,-90);
  fit("bookshelf",7.55,7.95,-5.2,-4.6,1.7,-90,{push:true,name:"bookshelf"});
  // hallway: the lamp table (its drawer has the dead flashlight)
  blk(7.6,7.95,-3.1,-2.75,0.7,"#4a3424","hall table",{search:true,items:[IT("flashlight_dead")]});
  // bedroom: twin bed with its head on the south wall and the lockbox under it, nightstand, the wardrobe beside the window, laundry basket
  fit("bed_twin",6.6,7.4,-1.65,-0.02,0.95,180,{search:true,name:"bed",items:[IT("custom",1,"Lockbox","The grey metal lockbox from under the bed. Louis gave her the combination.")]});
  fit("nightstand",6.12,6.5,-0.45,-0.08,0.6,180,{search:true,name:"nightstand",items:[IT("photo",1,"Photo of Norah and Adaline","Adaline's birthday, cake on her nose.")]});
  fit("wardrobe",7.45,7.95,-2.25,-1.75,1.9,-90,{push:true,search:true,name:"wardrobe",items:[IT("ammo",7)]});
  blk(7.5,7.88,-0.5,-0.15,0.4,"#7a6a5a","laundry basket");
  // bathroom: clawfoot tub, sink with the mirror cabinet, toilet
  fit("tub",4.15,5.75,-0.65,-0.12,0.6,0); fit("sink",4.15,4.6,-1.9,-1.45,0.85,90);
  P("medicine_cabinet",4.13,-1.67,90,{y:1.05,solid:false,search:true,name:"mirror cabinet",items:[IT("pills")]});
  fit("toilet",5.3,5.75,-1.7,-1.3,0.45,-90);
  // porch: rails at the ends, posts, the bare bulb, the cracked plastic chair
  blk(-1.0,-0.94,-3.95,-3.5,0.95,"#b0aca0","porch rail"); blk(-1.0,-0.94,-1.8,-1.35,0.95,"#b0aca0","porch rail");
  d.objects.push({id:sbUid("p"),type:"pillar",x:-0.94,z:-3.88,r:0.05,h:2.3,color:"#6a5a48"},{id:sbUid("p"),type:"pillar",x:-0.94,z:-1.42,r:0.05,h:2.3,color:"#6a5a48"});
  P("chair",-0.55,-1.62,30,{scale:0.9,name:"plastic chair"});
  // yard: the gravel pull-in and the ~18 m path to the porch, the car nose toward the house, woodpile, trash cans, mailbox, power pole
  d.objects.push({id:sbUid("q"),type:"path",points:[[-24,-5],[-18.6,-5]],width:2.4,tex:"b:gravel",color:"#66625a"});
  d.objects.push({id:sbUid("q"),type:"path",points:[[-19.2,-2.65],[-1.4,-2.65]],width:1.3,tex:"b:gravel",color:"#66625a"});
  fit("car",-23.4,-19.4,-5.85,-4.15,1.25,90,{name:"car"});
  fit("woodpile",0.95,3.1,-6.0,-5.45,0.6,0); P("trashcan",-0.55,-5.95,0); P("trashcan",-0.05,-6.05,0);
  P("mailbox",-24.6,-2.2,90); P("pole",-25.2,-7.4,0);
  // the woods: same trees, same seed as the Godot build (70 north, 40 behind the house, 3 framing Louis's vantage points)
  for(const [x,z,h] of GODOT_TREES) P("tree_pine",x,z,Math.round(vhash((x*100+z*7)|0)*360),{scale:+(h/5.5).toFixed(2)});
  // lights: dim, one per room, warm and failing
  L(2.0,2.1,-2.7,"#ffd18c",1.0,5); L(5.8,2.1,-4.3,"#d9f2cc",0.8,4); L(6.0,2.1,-2.75,"#ffcc80",0.5,3); L(6.14,0.95,-0.35,"#ffbf73",0.7,3); L(4.9,2.1,-1.2,"#f2f2d9",0.7,3);
  L(-0.2,1.9,-2.35,"#ffd98c",1.3,6); L(-18.6,0.7,-5.0,"#fff2cc",1.1,8); L(-6.0,4.0,-4.0,"#808cb3",0.5,14);
  // gameplay cameras from the Godot scene (used by the fixed-camera modes)
  const C=(x,y,z,l,fov)=>d.objects.push({id:sbUid("c"),type:"camera",x,y,z,look:l,track:true,fov});
  C(-0.6,1.95,-1.3,[-14,0.9,-3.4],54); C(-7.5,2.4,1.5,[0,1,-2.6],52); C(8.6,1.7,-6.2,[13,1.2,-1],58); C(-0.6,0.55,-6.0,[8,1,-5.6],60);
  C(0.25,2.15,-5.1,[2.4,0.5,-2.3],72); C(4.85,0.95,-4.4,[7.8,1,-4.05],64); C(7.85,1.5,-2.75,[4,1.15,-2.75],62); C(4.15,1.65,-2.75,[8,1,-2.6],62);
  C(6.5,1.8,-2.18,[7.6,0.6,-0.9],66); C(6.15,0.95,-0.22,[8,1.3,-1.25],58); C(5.7,2.15,-0.15,[4.9,0.6,-2.3],72); C(6.0,0.25,-3.05,[4.9,0.6,-2.3],62);
  // Norah where she stops to look at the treeline; Louis where the figure stands
  d.objects.push({id:sbUid("s"),type:"spawn",x:-8.0,z:-3.2,yaw:150});
  d.objects.push({id:sbUid("e"),type:"enemy",kind:"brute",x:9.5,z:-14.5,yaw:-60,start:"hunting",hpMul:1,speedMul:1});
  d.env=Object.assign({},ENV_DEF,{sky:"#04050a",fogColor:"#05060a",fog:0.03,hemi:0.42,moon:0.32,dark:""});
  d.start={hp:"",rounds:5,spare:0,items:[],flashOn:false};
  d.note="Norah's house, from the Godot blockout. Louis comes out of the treeline where the figure stood. Five in the revolver; seven more on the wardrobe shelf. Doors and windows won't hold him, and he can charge straight through any inner wall. Step aside when his head goes down: if he hits an outside wall he staggers. Back off when both arms go up. If he grabs you, hit the keys or he throws you.";
  return d;
}
PRESETS.unshift({key:"ch1house", name:"Chapter One: Norah's house", desc:"Built from crossed/tools/build_norah_house.py: the house, porch, yard, gravel path, car and woods. Louis hunts her from the treeline.", make(){ return ch1HouseDoc(); }});
