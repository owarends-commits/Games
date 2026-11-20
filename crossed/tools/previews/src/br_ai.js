// ================================================================ the two-armed Brutes (BCROSS), in the playground
// They walk on two huge stumps with a man hanging under them. Normal (m01), legless (m02: drags itself on its waist, swings
// the man like a wrecking ball), split (m03: opens down the middle to eat her) and armoured (m04: shoot the plates off;
// bursts splinters). The preview's own engine poses them; the AI picks the attack from how far away she is (each clip is
// built for one distance), and her real position decides every hit. Weak points: the lumps burst, the little arms tear off,
// the plates crack and drop, and the split one's open body takes triple damage.
class BRBody extends PVBody{
  constructor(e,type,key){ super(e,type,key); }
  // re-frame the stage (to turn it, or to push it out of a wall). Things it left in the world stay put; with carry, so do its
  // planted stumps and its gait (a turn), otherwise they move with it (a push)
  reframe(Mn,carry){ const M0=this.M.clone(); this.M.copy(Mn); this.Mi.copy(Mn).invert(); const T=this.Mi.clone().multiply(M0);
    for(const o of this.stage.children){ if(this.C&&o===this.C.group) continue; o.applyMatrix4(T); }
    if(carry){ const c=this.ctx, V=THREE.Vector3, tp=v=>v&&v.isVector3&&v.applyMatrix4(T);
      for(const k in c) tp(c[k]); const g=c.g; if(g){ for(const k in g) tp(g[k]); const p=new V(g.x,0,g.z).applyMatrix4(T), o=new V().applyMatrix4(T), v=new V(g.v,0,g.vz).applyMatrix4(T).sub(o); g.x=p.x; g.z=p.z; g.v=v.x; g.vz=v.z; c.x=g.x; } }
    this.place(); }
  turnToward(heading,rate,dt){ let d=heading-this.a; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; d=clamp(d,-rate*dt,rate*dt); if(Math.abs(d)<1e-5) return;
    const P=new THREE.Vector3(this.ctx.x,0,0), Mn=this.M.clone().multiply(new THREE.Matrix4().makeTranslation(P.x,0,P.z)).multiply(new THREE.Matrix4().makeRotationY(d)).multiply(new THREE.Matrix4().makeTranslation(-P.x,0,-P.z));
    this.a+=d; this.reframe(Mn,true); }
  // an attack starts where it stands: its stumps stay where they're planted if the clip's own stance is close by
  play(name,o={}){ const keep=o.anchor==="keep", c0=this.ctx, wf=!keep&&c0&&c0.fL?{L:this.toWorld(c0.fL),R:this.toWorld(c0.fR)}:null;
    super.play(name,o); const c=this.ctx;
    if(o.reX!=null&&!keep){ c.x=o.reX; plantFix(c); this.anchor(new THREE.Vector3(this.e.pos.x,0,this.e.pos.z),this.lastDir||new THREE.Vector3(Math.sin(this.a),0,Math.cos(this.a)),c.x,0); }
    if(wf&&c.fL){ for(const s of ["L","R"]){ const p=this.toStage(wf[s]); p.y=0.02; if(p.distanceTo(c["f"+s])<0.8) c["f"+s]=p; } } }
  makeHits(){ const mat=new THREE.MeshBasicMaterial({color:0xff4040,transparent:true,opacity:0.3,depthWrite:false}); mat.visible=!!CFG.world.showZones;
    for(const h of PV_BR.LIVE.hitBones(this.rec())){ let m;
      if(h.b){ const d=h.b.position.clone(), L=d.length()||0.2; m=new THREE.Mesh(new THREE.BoxGeometry(h.r*2,L,h.r*2),mat); m.position.copy(d).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize()); }
      else m=new THREE.Mesh(new THREE.SphereGeometry(h.r,8,6),mat);
      h.a.add(m); m.userData={enemy:this.e,zone:h.zone,limb:h.limb,pv:true,hitbox:true}; this.hits.push(m); } }
  sync(){ const e=this.e, c=this.ctx, w=this.toWorld(new THREE.Vector3(c.x,0,0)), p=w.clone(); if(!this.K.noCollide||!this.K.noCollide(this)) collide(p,e.radius*0.8);
    if(p.distanceToSquared(w)>1e-8){ const Mn=this.M.clone(); Mn.elements[12]+=p.x-w.x; Mn.elements[14]+=p.z-w.z; this.reframe(Mn,false); }
    e.pos.set(p.x,0,p.z); e.yaw=this.a; }
}
function plantFix(c){ /* a gait clip started closer than it was built for: its stance (and gait) begin here instead */ const PV=PV_BR; if(c.g){ c.g.x=c.x; } }

// per model: what it can do. dist bands are where she must be for the clip as built (its start offset from her)
const BR_ATT={ sweep:{band:[1.0,2.7],len:4.6}, slam:{band:[2.9,3.7],len:6.3}, lunge:{band:[4.0,4.8],len:4.6}, punch:{band:[5.9,6.9],len:6.6}, splinter:{band:[3.9,4.7],len:7.0},
  eat:{band:[3.0,3.8],len:8.6,grab:1}, wreck:{band:[0.5,1.3],len:7.6}, pin:{band:[4.6,8.5],len:8.2,grab:1,gait:7.5}, charge:{band:[7,15.5],len:9.2,gait:15.5} };
const BR_MODELS={ brute_twoarm_m01:{type:"brute2",name:"Brute",loco:"walk",att:["sweep","slam","lunge","punch","pin","charge"]},
  brute_twoarm_m02_legless:{type:"brute2_legless",name:"Legless Brute",loco:"crawl",att:["wreck","sweep","lunge","punch","pin","charge"]},
  brute_twoarm_m03_split:{type:"brute2_split",name:"Split Brute",loco:"walk",att:["sweep","slam","lunge","eat","punch","pin","charge"]},
  brute_twoarm_m04_armored:{type:"brute2_armored",name:"Armoured Brute",loco:"walk",att:["sweep","slam","lunge","splinter","pin","charge"]} };
function brStagePos(b){ return b.toStage(new THREE.Vector3(player.pos.x,0,player.pos.z)); }
function brNear(e,stagePt,r){ const w=e.pv.toWorld(stagePt); return Math.hypot(w.x-player.pos.x,w.z-player.pos.z)<r; }
function brBase(key){ const M=BR_MODELS[key], X=PV_BR.A, L=PV_BR.LIVE;
  const clips={walk:L.walk, vault:L.vault, crawl:L.crawl, die:L.die}; for(const a of M.att) clips[a]=X[a];
  return { mod:PV_BR, body:BRBody, label:M.name, group:"bcross/brute", only:k=>k===key, cfg:"brute2", radius:0.75, holds:["pin","eat"], noHeadHit:()=>true, clips,
  start(e,b){ e.pvMem.cool=1.5; e.pvMem.chCool=4; e.maxHp=e.hp=CFG.brute2.hp*({brute2_legless:0.8,brute2_split:0.9,brute2_armored:0.9}[M.type]||1); b.play(M.loco); },
  brain(e,dt,dist,toP){ const C=CFG.brute2, b=e.pv, m=e.pvMem, name=b.clipName, c=b.ctx; m.cool-=dt; m.chCool-=dt; const held=player.grabbed&&player.grabbed.by===e;
    bfBlock(e);
    const A=BR_ATT[name];
    if(A){ const S=brStagePos(b);
      if(name==="charge"&&c.hitT==null) c.out=(Math.abs(S.z)>1.0||S.x<c.x-0.5)?"b":"a";
      if(name==="punch"&&c.hitT==null&&c.tgt) c.out=Math.hypot(S.x-c.tgt.x,S.z-c.tgt.z)>0.8?"b":"c";
      if(name==="wreck"&&b.ct<1.6) c.out=dist>1.7?"b":"a";
      if(A.grab){ const caught=name==="pin"?c.hitT!=null:!!c.c1;
        if(caught&&!m.grabbed){ m.grabbed=1; if(!player.grabbed&&dist<2.0&&player.grab(e,{dmg:name==="pin"?C.hugDamage:C.eatGrabDamage,how:name==="pin"?"bear hug":"engulf"})){ shake=Math.max(shake,0.2); } else { c.out="b"; c.mash=1; } }
        if(held){ const w=b.toWorld(new THREE.Vector3(c.x+(name==="pin"?0.75:1.1),0,0)); player.pos.x+=(w.x-player.pos.x)*Math.min(1,dt*8); player.pos.z+=(w.z-player.pos.z)*Math.min(1,dt*8); collide(player.pos,0.3); player.vel.set(0,0,0); } }
      const over=(c.free!=null&&b.t>c.free+1.2)||(c.end!=null&&b.t>c.end+1.4)||(c.dead!=null&&b.t>c.dead+2.4)||(!held&&b.ct>A.len)||b.ct>A.len+6;
      if(over){ if(held) player.grabbed=null; m.grabbed=0; b.play(M.loco,{anchor:"keep"}); m.cool=C.attackCool*(0.7+0.6*rng()); }
      return; }
    // moving: toward her (or where she was last seen), turning its whole body as it goes
    const sees=!player.dead&&dist<C.sight&&lineOfSight(e.pos.x,e.pos.z,player.pos.x,player.pos.z,false); let tx=null,tz=null;
    if(sees){ m.last={x:player.pos.x,z:player.pos.z}; const g=e.goal(dt); tx=g.x; tz=g.z; } else if(m.last&&Math.hypot(m.last.x-e.pos.x,m.last.z-e.pos.z)>1){ const g=pvRouteTo(e,m.last.x,m.last.z); tx=g.x; tz=g.z; }
    const stopAt=M.loco==="crawl"?1.2:3.4;
    if(tx!=null){ b.turnToward(Math.atan2(tx-e.pos.x,tz-e.pos.z),M.loco==="crawl"?0.8:0.7,dt); c.wantV=sees&&dist<stopAt?0:1; } else c.wantV=0;
    if(!sees||m.cool>0||player.grabbed||e.facing(toP)<0.93) return;
    const can=M.att.filter(a=>{ const A=BR_ATT[a]; if(dist<A.band[0]||dist>A.band[1]) return false; if(a==="charge"&&(m.chCool>0||(typeof navLine==="function"&&!navLine(e.pos.x,e.pos.z,player.pos.x,player.pos.z,0.6)))) return false; if(a==="pin"&&typeof navLine==="function"&&!navLine(e.pos.x,e.pos.z,player.pos.x,player.pos.z,0.5)) return false; return true; });
    if(!can.length||rng()>dt*C.eager*(dist<3.2?4:1)) return;
    const a=can[Math.floor(rng()*can.length)], A2=BR_ATT[a];
    b.lastDir=toP.clone(); b.play(a,{outSel:{oPin:"pending",oEat:"pending",oCharge:"a",oPunch:"c",oSplinter:"c",oWreck:"a"},reX:A2.gait?PV_BR.NX-dist:null}); m.grabbed=0; if(a==="charge") m.chCool=C.chargeCool; m.cool=99; },
  events(e,list){ const C=CFG.brute2, b=e.pv, c=b.ctx, V=THREE.Vector3, held=player.grabbed&&player.grabbed.by===e, d=Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z);
    for(const ev of list){ if(ev.kind!=="dmg") continue; const a=String(ev.a), n=+((a.match(/NORAH −(\d+)/)||[])[1]||0), name=b.clipName;
      if(a==="ESCAPED"||a==="BROKE FREE"){ if(held) player.grabbed=null; log(`Norah tears out of ${e.name}'s hold`,"#9ed08a"); continue; }
      if(a==="NORAH KILLED"){ if(held) player.grabbed=null; const dmg=name==="eat"?C.eatDamage:C.hugCrush; player.hurt(dmg,e,name==="eat"?"eaten":"crushing hug"); qteBanner(`${name==="eat"?"EATEN":"CRUSHED"} −${dmg}`,"bad"); shake=Math.max(shake,0.5); if(!player.dead){ player.downT=Math.max(player.downT||0,2.0); } continue; }
      if(!n) continue;
      if(name==="splinter"){ player.hurt(n,e,"splinters"); log(`${e.name}'s splinters hit her: −${n}`,"#ff7070"); continue; }
      let ok=false, push=3, down=1;
      if(name==="sweep"){ ok=brNear(e,c.fR,1.1)||brNear(e,c.fL,1.1)||d<1.6; push=4; down=1.2; }
      else if(name==="slam"){ ok=brNear(e,c.fL.clone().add(c.fR).multiplyScalar(0.5),1.9); push=2; down=1.6; }
      else if(name==="lunge"){ ok=d<2.4&&brNear(e,new V(c.x+1.1,0,0),1.3); push=3.5; down=0.8; }
      else if(name==="charge"){ ok=d<1.9; push=6; down=2.4; }
      else if(name==="punch"){ ok=c.fist?brNear(e,c.fist,1.0):d<1.5; push=5; down=2.0; }
      else if(name==="wreck"){ ok=d<2.2; push=4.5; down=1.5; }
      if(ok&&runnerHitNorah(e,n,{sweep:"sweeping swing",slam:"double slam",lunge:"lunge",charge:"barrel charge",punch:"stretching punch",wreck:"wrecking-ball swing"}[name]||name,push,down)){ shake=Math.max(shake,0.3+n/200); log(`${e.name}: ${ev.b}`,"#ff7070"); } } },
  // shots: the preview's weak points, worked out from where the shot really lands
  dodge(e,mesh,point,dir){ const b=e.pv; if(!b.ready) return false; const p=b.toStage(point), dS=b.toStage(point.clone().add(dir)).sub(p).normalize(); e.pvMem.shot=b.withStage(()=>PV_BR.LIVE.shot(b.rec(),p,dS));
    const w=e.pvMem.shot.what; if(w!=="flesh") log(`${e.name}: ${({armor:"glances off the armour",armorOff:"the armour cracks and drops off",lump:"a lump bursts",arm:"a little arm tears off",organ:"shot into the open body"})[w]}`,w==="armor"?"#bbb":"#ffb070"); return false; },
  zoneMult(e,mesh){ const s=e.pvMem.shot; e.pvMem.shot=null; const base=CFG.zones[mesh.userData.zone+"Mult"]??1; return s?(s.what==="flesh"?base*(mesh.userData.limb&&mesh.userData.limb.startsWith("stump")?0.6:1):s.mult*(s.what==="organ"?CFG.brute2.openMult/3:1)):base; },
  freed(e){ const c=e.pv.ctx; c.out="b"; c.mash=1; },
  failed(e){ const c=e.pv.ctx; c.out="a"; return true; } }; }
for(const k in BR_MODELS) PVK[BR_MODELS[k].type]=brBase(k);
{ const bt0=BRUTE_TYPE; BRUTE_TYPE=function(key){ return bt0(key)||(BR_MODELS[key]&&BR_MODELS[key].type)||null; }; for(const k in BR_MODELS) BRUTE_NAMES[BR_MODELS[k].type]=BR_MODELS[k].name; }
