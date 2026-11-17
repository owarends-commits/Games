// ---- emboldened: with two or more Crossed beside it its nerve comes up. It straightens, carries the head without a hand,
// chest out, shoulders back, and runs her down; close in it walks tall and studies her, ready.
const BR={stance:0.42,front:-0.55,back:0.5,high:-1.05,kLift:1.5};   /* the run: a flight phase between steps */
const BW={stance:0.62,front:-0.42,back:0.42,high:-0.7,kLift:1.0};
const BOLDPHYS={ active:ctx=>(ctx.phase||"").startsWith("runs")||(ctx.phase||"").startsWith("strides"), stance:ctx=>strideStance(ctx.ph,ctx.gaitP||BR), traction:7, imp:0.8, rollK:0, flight:true, bounce:0 };
function boldStand(t){ const J=P0(); J.hd=0.02; J.kL=J.kR=0.1; J.sp=0.04+0.015*Math.sin(t*1.3); J.hp=-0.04; J.nx=-0.14; J.sroll=0.04; J.nz=0.06;
  J.aLx=-0.1+0.04*Math.sin(t*1.1); J.aLz=0.28; J.eL=0.45; J.aRx=-0.1+0.04*Math.sin(t*1.2+1); J.aRz=0.28; J.eR=0.45; return J; }
function boldLegs(J,ph,P){ const a=tStride(ph%1), b=tStride((ph+0.5)%1); return J; }
function strideP(ph,P){ const st=P.stance; if(ph<st){ const u=ph/st; return {lx:P.front+(P.back-P.front)*u, f:-0.1*(1-sm5(u/0.2))-0.1*sm5((u-0.6)/0.4), plant:true}; }
  const u=(ph-st)/(1-st), up=sm5(u/0.5), dn=sm5((u-0.35)/0.65); return {lx:P.back+(P.high-P.back)*up+(P.front-P.high)*dn, k:P.kLift*Math.sin(Math.PI*clamp(u,0,1))+0.1, f:0.25*Math.sin(Math.PI*clamp(u/0.7,0,1))-0.06, plant:false}; }
function boldGait(t,ph,P,run){ const J=boldStand(t), a=strideP(ph%1,P), b=strideP((ph+0.5)%1,P), s=Math.sin(ph*Math.PI*2);
  J.lLx=a.lx; J.fL=a.f; J.kL=a.plant?levelKnee(a.lx,0.12,P.front)+(run?0.25:0.1)*Math.sin(Math.PI*clamp((ph%1)/P.stance,0,1)):a.k; J.lRx=b.lx; J.fR=b.f; J.kR=b.plant?levelKnee(b.lx,0.12,P.front)+(run?0.25:0.1)*Math.sin(Math.PI*clamp(((ph+0.5)%1)/P.stance,0,1)):b.k;
  J.lLz=J.lRz=0; const sw=run?1.0:0.55; J.aLx=sw*s-0.15; J.aRx=-sw*s-0.15; J.eL=J.eR=run?1.4:0.55; J.aLz=J.aRz=0.15; J.hyaw=0.1*s; J.syaw=-0.18*s;
  if(run){ J.sp=0.22; J.hp=0.08; J.nx=-0.3; } else J.sp+=0.06; return J; }
A.bold={ start(ctx){ ctx.x=NX-8.2*Z(); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.by=true; ctx.byN=2; ctx.B=0; ctx.rate=0; byPlace([[ctx.x-0.7,-1.1],[ctx.x-0.5,1.2]]); },
  step(t,dt,ctx){ ctx.nOver={J:NQ.aim(),x:NX};
    if(t<1.6){ const B=sm5((t-0.3)/1.1); ctx.B=B; const J=mix(tStand(t),boldStand(t),B); braceHead(ctx,1-B); ctx.v=0; lookAt(J,ctx,NX,0);
      ctx.phase= t<0.6?"two Crossed beside it":"its nerve comes up · it lets go of its head"; return applyLean(J); }
    const gap=NX-ctx.x; let P=BR, run=true, target=2.6;   /* the stride rate: a sprint until it's close, then it slows to a walk */
    if(gap<3.6*Z()){ P=BW; run=false; target=gap<1.95*Z()?0:1.0; }
    ctx.rate+=(target-ctx.rate)*Math.min(1,dt*(run?2.2:3.5)); ctx.gaitP=P;
    if(ctx.rate>0.08){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt*ctx.rate)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:run?0.9:0.5});
      ctx.moving=true; if(!run) ctx.gait={ph:ctx.ph,P:{stance:BW.stance}}; ctx.phase= run?"runs her down":"strides in, tall"; return boldGait(t,ctx.ph,P,run); }
    ctx.v=0; const J=boldStand(t); lookAt(J,ctx,NX,0); J.nz+=0.08*Math.sin(t*0.6); ctx.phase="studies her, emboldened"; return J; } };
A.bold.phys=BOLDPHYS;

// ---- killed by a head shot: the head bursts. A shockwave throws back everyone close, gore flies in every direction and
// sticks where it lands, and the brain matter pools on the floor and fizzes.
const GORE=[], ACID=[], GORECOL=[0x4a0606,0x6a0c0c,0x8a2a2a,0xb87a70,0xd9c8b0,0x5c1010];
function goreClear(){ for(const g of GORE) scene.remove(g.m); for(const a of ACID) scene.remove(a.m); GORE.length=0; ACID.length=0; if(runner&&runner.stump){ runner.stump.parent&&runner.stump.parent.remove(runner.stump); runner.stump=null; } if(runner&&runner.B.head){ runner.B.head.scale.setScalar(1); runner.B.head.userData.massScale=1; } }
function goreBurst(c){ for(let i=0;i<90;i++){ const u=Math.random()*2-1, a=Math.random()*Math.PI*2, r=Math.sqrt(1-u*u), v=new THREE.Vector3(r*Math.cos(a),Math.abs(u)*0.8+0.15,r*Math.sin(a)).multiplyScalar(3+Math.random()*7);
    const sz=0.025+Math.random()*0.06, m=new THREE.Mesh(new THREE.BoxGeometry(sz,sz*(0.5+Math.random()),sz*(0.6+Math.random())),new THREE.MeshLambertMaterial({color:GORECOL[i%GORECOL.length]})); m.position.copy(c); scene.add(m);
    GORE.push({m,v,spin:new THREE.Vector3(Math.random()*14-7,Math.random()*14-7,Math.random()*14-7),rest:false,acid:i<12}); } }
function goreStep(dt){ for(const g of GORE){ if(g.rest) continue; const p=g.m.position; g.v.y-=9.8*dt; p.addScaledVector(g.v,dt); g.m.rotation.x+=g.spin.x*dt; g.m.rotation.y+=g.spin.y*dt;
    if(p.y<=0.015){ p.y=0.015; g.rest=true; g.m.rotation.set(0,Math.random()*6,0); g.m.scale.y=0.25;
      const pool=new THREE.Mesh(new THREE.CircleGeometry(1,12),new THREE.MeshBasicMaterial({color:g.acid?0x5c5212:0x2a0404,transparent:true,opacity:0.85,depthWrite:false})); pool.rotation.x=-Math.PI/2; pool.position.set(p.x,0.006+ACID.length*0.0003,p.z);
      const rr=g.acid?0.25+Math.random()*0.25:0.06+Math.random()*0.1; pool.scale.setScalar(0.02); scene.add(pool); ACID.push({m:pool,r:rr,t:0,acid:g.acid,bub:Math.random()}); } }
  for(const a of ACID){ a.t+=dt; a.m.scale.setScalar(Math.min(a.r,0.02+a.t*a.r*2)); if(a.acid){ a.bub-=dt; if(a.bub<=0){ a.bub=0.2+Math.random()*0.4; const q=a.m.position; const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xc8c040,transparent:true,depthWrite:false})); s.position.set(q.x+(Math.random()-.5)*a.r,0.04,q.z+(Math.random()-.5)*a.r); s.scale.setScalar(0.06); scene.add(s); puffs.push({m:s,t:0,v:new THREE.Vector3(0,0.25,0),s:0.25}); } } } }
let bAlt=false;
A.burst={ start(ctx){ goreClear(); ctx.x=NX-2.2*Z(); ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.by=true; ctx.byN=2; ctx.T={}; byPlace([[ctx.x-1.4,-1.2],[ctx.x-1.1,1.3]]); },
  step(t,dt,ctx){ const T=ctx.T;
    if(T.shot==null){ ctx.nOver={J:NQ.aim(),x:NX}; const J=tStand(t); braceHead(ctx,1); lookAt(J,ctx,NX,0); ctx.phase="she has the gun on its head";
      if(t>1.2){ T.shot=t; const h=runner.B.head; runner.group.updateMatrixWorld(true); T.c=headPt(0,0,0); ctx.events.push({kind:"tShot",where:"head"}); ctx.events.push({kind:"burst"});
        h.scale.setScalar(0.001); h.userData.massScale=0.0001; const st=new THREE.Mesh(new THREE.SphereGeometry(0.11,8,6),new THREE.MeshLambertMaterial({color:0x5a0a0a})); st.scale.set(1,0.55,1); (runner.B.neck||runner.B.chest).add(st); st.position.set(0,0.1,0); runner.stump=st;
        goreBurst(T.c); T.tS={th:0.04,w:0.5,done:false}; T.nT={th:0.2,w:2.8};
        // the shockwave: Norah and the two Crossed are thrown back from it
        for(const b of [by,by2]) if(b){ const d=Math.hypot(b.x-T.c.x,b.z-T.c.z), k=Math.max(0,1-d/4); if(k>0){ b.hit=t; const f=new THREE.Vector3(b.x-T.c.x,0,b.z-T.c.z).normalize(); b.kick={id:"burst"+b.z,v:{x:f.x*5*k,y:1.6*k,z:f.z*5*k}}; b.fs={th:0.2,w:2.4*k+0.6}; } } }
      return applyLean(J); }
    const k=t-T.shot, J=tStand(t); braceHead(ctx,0); J.aLx=-0.9*sm5(k/0.3); J.aLz=0.6; J.aRx=-0.8*sm5(k/0.3); J.aRz=0.6; J.eL=J.eR=0.3;
    // headless: the knees go, and it falls back where the shot drove it
    const S=T.tS; PHYS.topple(S,dt,1.6*Z(),Math.PI/2-0.08); ctx.rise=-S.th; J.kL=J.kR=0.05; J.lLx=J.lRx=0; J.hd=0;
    if(S.done&&!T.land){ T.land=t; ctx.events.push({kind:"tipLand"}); }
    const nk=k; ctx.nOver={J:QS.flat(nk),x:NX,fall:PHYS.topple(T.nT,dt,1.65,1.45),kick:"burst",kickV:{x:4.2,y:1.8,z:0}};
    ctx.phase= k<0.25?"the head bursts · the shockwave throws them back": !S.done?"the headless body goes over": "brain matter fizzing on the floor"; return J; } };
