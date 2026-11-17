// ---------------------------------------------------------------- the two-armed Brute: posing the rig
const NX=2.0;
const ALT={}; const outcome=(id,ctx)=>{ const v=document.getElementById(id).value; if(v==="alt"){ ALT[id]=!ALT[id]; return ALT[id]?"a":"b"; } return v; };
function noraPoint(kind){ const B=nora.B, p=new THREE.Vector3();
  if(kind==="flank"){ B.hips.getWorldPosition(p); p.y+=0.2; p.z+=0.13; p.x-=0.08; return p; }
  if(kind==="head"){ B.head.getWorldPosition(p); p.y+=0.08; return p; }
  if(kind==="neck"){ B.neck.getWorldPosition(p); p.y+=0.06; return p; } return p; }
let BR=null;          // the rigged brute
const BS={};          // its live state (springs, limp arms, bursts)
// stretched flesh between the forearm and the fist: a twisted bundle that thins as it lengthens
function sinew(R,s,K,W,r,L2){ R.sin=R.sin||{}; let g=R.sin[s];
  if(!g){ g=new THREE.Group(); const mat=new THREE.MeshLambertMaterial({map:R.mesh.material.map||null,color:0xc06058}), mat2=new THREE.MeshLambertMaterial({color:0x8a2a26});
    for(let i=0;i<6;i++){ const geo=new THREE.CylinderGeometry(1,1,1,7,4,true); geo.translate(0,0.5,0); const m=new THREE.Mesh(geo,i?mat2:mat); m.userData.i=i; g.add(m); } scene.add(g); R.sin[s]=g; }
  if(r<1.04||!K){ g.visible=false; return; } g.visible=true; const dir=W.clone().sub(K), D=dir.length(); dir.normalize(); const a=K.clone().addScaledVector(dir,L2*0.55), len=W.distanceTo(a)+0.05;
  const q=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir); const thin=Math.sqrt(1/r);
  for(const m of g.children){ const i=m.userData.i, ang=i*1.05+r*2.2; const off=i?new THREE.Vector3(Math.cos(ang),0,Math.sin(ang)).multiplyScalar(0.07*thin).applyQuaternion(q):new THREE.Vector3();
    m.position.copy(a).add(off); m.quaternion.copy(q); const rad=(i?0.022:0.075)*thin; m.scale.set(rad,len,rad); } }
// the morning star: the stump's end balls up and pushes out bone spikes as it stretches
function morningStar(R,s,pos,dir,m,t){ R.star=R.star||{}; let g=R.star[s];
  if(!g){ g=new THREE.Group(); const geo=new THREE.IcosahedronGeometry(1,2), pa=geo.attributes.position; for(let i=0;i<pa.count;i++){ const v=new THREE.Vector3(pa.getX(i),pa.getY(i),pa.getZ(i)); const n=1+0.13*Math.sin(v.x*7.1+v.y*3.3)*Math.cos(v.z*5.7-v.x*2.1); v.multiplyScalar(n); pa.setXYZ(i,v.x,v.y,v.z); } geo.computeVertexNormals();
    const ball=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:0xa8443c,emissive:0x2a0806})); ball.castShadow=true; g.add(ball); g.userData.ball=ball;
    const ico=new THREE.IcosahedronGeometry(1,0).attributes.position, dirs=[]; for(let i=0;i<ico.count;i++){ const v=new THREE.Vector3(ico.getX(i),ico.getY(i),ico.getZ(i)).normalize(); if(!dirs.some(d=>d.distanceTo(v)<0.1)) dirs.push(v); }
    const cone=new THREE.ConeGeometry(1,1,6); cone.translate(0,0.5,0); const bone=new THREE.MeshLambertMaterial({color:0xd9cbb0}); g.userData.sp=[];
    /* no spikes: just the swelling ball of flesh */
    scene.add(g); R.star[s]=g; }
  if(!pos||m<=0.01){ g.visible=false; return; } g.visible=true; const r=0.06+0.24*m, wob=1+0.06*Math.sin(t*23)*(m<1?1:0.3);
  g.position.copy(pos).addScaledVector(dir,r*0.55); g.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),dir);
  g.userData.ball.scale.set(r*wob,r/wob,r*(2-wob)*(1+0.25*(1-m)));
  for(const o of g.userData.sp){ const k=Math.max(0,Math.min(1,(m-0.35-o.del)/0.5)); const L=r*(0.9+1.1*o.len*k); o.sp.position.copy(o.d).multiplyScalar(r*0.75); o.sp.scale.set(r*0.2*(0.4+0.6*k),k>0?L:0.001,r*0.2*(0.4+0.6*k)); o.sp.visible=k>0; } }
// ---- contact: the stump's real pad must meet Norah's real skin. Each frame we skin both meshes' vertices near the
// contact, find the closest pair, and nudge that stump's target by the gap; the next frame's IK closes it.
const CT={};
function skinPts(mesh,bones,key,cap=360){ let idx=CT[key]; const g=mesh.geometry, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight;
  if(!idx){ const all=mesh.skeleton.bones, set=new Set(bones.map(b=>all.indexOf(b)).filter(i=>i>=0)); idx=[];
    for(let i=0;i<SI.count;i++){ let w=0; const ix=[SI.getX(i),SI.getY(i),SI.getZ(i),SI.getW(i)], wx=[SW.getX(i),SW.getY(i),SW.getZ(i),SW.getW(i)]; for(let k=0;k<4;k++) if(set.has(ix[k])) w+=wx[k]; if(w>=0.3) idx.push(i); }
    if(idx.length>cap){ const st=idx.length/cap; idx=Array.from({length:cap},(_,j)=>idx[Math.floor(j*st)]); } CT[key]=idx; }
  const out=[]; for(const i of idx){ const v=new THREE.Vector3(); mesh.boneTransform(i,v); v.applyMatrix4(mesh.matrixWorld); out.push(v); } return out; }
function noraMesh(){ if(!nora.skm) nora.model.traverse(o=>{ if(o.isSkinnedMesh&&!nora.skm) nora.skm=o; }); return nora.skm; }
function closestPair(A,B){ let best=1e9, a=null, b=null; for(const p of A) for(const q of B){ const d=p.distanceToSquared(q); if(d<best){ best=d; a=p; b=q; } } return {a,b,d:Math.sqrt(best)}; }
function contactSolve(R,s,c,dt){ BS.cor=BS.cor||{}; const cor=BS.cor[s]||(BS.cor[s]=new THREE.Vector3());
  if(!c){ cor.multiplyScalar(Math.max(0,1-dt*6)); return null; }
  R.mesh.updateMatrixWorld(true); const pad=skinPts(R.mesh,[R.B["wr"+s],R.B["ft"+s]],"pad"+s+R.uid);
  const nm=noraMesh(); nm.updateMatrixWorld(true); const skin=skinPts(nm,c.bones.map(n=>nora.B[n]).filter(Boolean),"nora:"+c.bones.join());
  const cp=closestPair(pad,skin); if(!cp.a) return null; const gap=cp.b.clone().sub(cp.a), want=cp.d-(c.gap??0.01);
  if(cp.d>1e-4) cor.addScaledVector(gap.normalize(),want*Math.min(1,dt*(c.rate??14))*(c.w??1)); if(cor.length()>1.4) cor.setLength(1.4); BS.lastGap=BS.lastGap||{}; BS.lastGap[s]=cp.d; return cp.d; }
function bruteFrame(st,dt){ const R=BR, m=R.mesh;
  // resting on the man's feet: the body is lowered until his lowest point touches the floor (solved from last frame)
  BS.restOff=BS.restOff||0; if(st.rest) st.rootY+=BS.restOff*st.rest; else BS.restOff*=Math.max(0,1-dt*5);
  m.position.set(st.x,0,st.z||0); m.rotation.set(0,st.yaw,0);
  const root=R.B.root; root.position.set(0,st.rootY,0); root.rotation.set(st.pitch||0,st.twist||0,st.roll||0); m.updateMatrixWorld(true);
  const q=m.getWorldQuaternion(new THREE.Quaternion()), fwd=new THREE.Vector3(0,0,1).applyQuaternion(q);
  for(const s of ["L","R"]){ const out=new THREE.Vector3(s==="L"?1:-1,0,0).applyQuaternion(q);
    const pole=st.pole&&st.pole[s] ? st.pole[s] : out.clone().multiplyScalar(1).add(new THREE.Vector3(0,0.35,0)).addScaledVector(fwd,-0.15);
    const wr=R.B["wr"+s]; if(!wr.userData.rp) wr.userData.rp=wr.position.clone(); wr.position.copy(wr.userData.rp);
    const fist0=st.fist&&st.fist[s], ct=st.contact&&st.contact[s], cor=BS.cor&&BS.cor[s]; const fist=fist0&&cor&&cor.lengthSq()>1e-8?fist0.clone().add(cor):fist0; let sinE=0;
    if(!fist0 && st.feet[s] && cor && cor.lengthSq()>1e-8) st.feet[s]=st.feet[s].clone().add(cor);
    if(fist){ const sh=wposB(R,"sh"+s), d=R.len["d"+s], dir=st.padDir&&st.padDir[s]? st.padDir[s].clone().normalize() : fist.clone().sub(sh).normalize(); const Wg=fist.clone().addScaledVector(dir,-d);
      stumpIK(R,s,Wg.clone().add(new THREE.Vector3(0,-d,0)),pole,(st.lift&&st.lift[s])||0);
      const K=wposB(R,"kn"+s), L2=R.len["c"+s], KW=Wg.clone().sub(K), D=KW.length(); aimBone(R,"kn"+s,KW);
      if(D>L2){ wr.position.copy(wr.userData.rp).multiplyScalar(D/L2); wr.updateMatrixWorld(true); sinE=D/L2; } aimBone(R,"wr"+s,fist.clone().sub(Wg)); sinew(R,s,K,Wg,sinE,L2);
      const sm=st.star&&st.star[s]||0; wr.scale.setScalar(1-0.6*Math.min(1,sm)); morningStar(R,s,sm>0?Wg.clone().addScaledVector(dir,d*0.4):null,dir,sm,gameT); }
    else stumpIK(R,s,st.feet[s],pole,(st.lift&&st.lift[s])||0);
    if(!fist){ sinew(R,s,null,null,0,1); wr.scale.setScalar(1); morningStar(R,s,null,null,0,0); }
    if(BS.lastGap) BS.lastGap[s]=null; contactSolve(R,s,ct,dt); }
  // the man: dead weight swinging under the body's movement; his head finds her
  const rp=new THREE.Vector3(); root.getWorldPosition(rp); const v=BS.lastRoot?rp.clone().sub(BS.lastRoot).divideScalar(Math.max(dt,1e-4)):new THREE.Vector3(); const a=BS.lastV?v.clone().sub(BS.lastV).divideScalar(Math.max(dt,1e-4)):new THREE.Vector3(); BS.lastRoot=rp; BS.lastV=v;
  const loc=a.clone().applyQuaternion(q.clone().invert()); BS.sw=BS.sw||{x:{x:0,v:0},z:{x:0,v:0},lx:{x:0,v:0},lz:{x:0,v:0}};
  const kick=BS.twitch||0; BS.twitch=Math.max(0,kick-dt*3);
  spring(BS.sw.x,clamp(-loc.z*0.05,-0.7,0.7)+(st.manSwing||0),dt,6); spring(BS.sw.z,clamp(loc.x*0.05,-0.6,0.6),dt,6);
  spring(BS.sw.lx,clamp(-loc.z*0.07,-0.9,0.9)+(st.manSwing||0)*1.3,dt,5); spring(BS.sw.lz,clamp(loc.x*0.06,-0.7,0.7),dt,5);
  if(st.rest){ for(const k of ["x","z","lx","lz"]){ BS.sw[k].x*=1-0.25*st.rest; BS.sw[k].v*=1-0.3*st.rest; } }
  R.B.torso.rotation.set(BS.sw.x.x-(st.pitch||0)+0.25*kick*Math.sin(gameT*40),0,BS.sw.z.x-(st.roll||0)+0.2*kick*Math.sin(gameT*33));
  if(R.B.legL){ R.B.legL.rotation.set(BS.sw.lx.x+0.6*kick*Math.sin(gameT*30),0,BS.sw.lz.x+0.06); R.B.legR.rotation.set(BS.sw.lx.x-0.6*kick*Math.sin(gameT*27+1),0,BS.sw.lz.x-0.06); }
  if(R.B.head){ const hp=wposB(R,"head"), tg=st.look||new THREE.Vector3(NX,1.4,0); R.B.torso.updateMatrixWorld(true); const tq=R.B.torso.getWorldQuaternion(new THREE.Quaternion()).invert(); const d=tg.clone().sub(hp).applyQuaternion(tq);
    const yaw=clamp(Math.atan2(d.x,d.z),-1.1,1.1), pit=clamp(-Math.atan2(d.y,Math.hypot(d.x,d.z)),-0.6,0.6); BS.hy=(BS.hy||0)+(yaw-(BS.hy||0))*Math.min(1,dt*4); BS.hp=(BS.hp||0)+(pit-(BS.hp||0))*Math.min(1,dt*4);
    R.B.head.rotation.set(BS.hp+0.3*kick*Math.sin(gameT*45),BS.hy,0); }
  if(st.rest){ m.updateMatrixWorld(true); const pts=skinPts(m,R.B.legL?[R.B.legL,R.B.legR]:[R.B.torso],"man"+R.uid,240); let low=1e9; for(const p of pts) low=Math.min(low,p.y);
    BS.restOff+=(0.01-low)*0.6; BS.restOff=clamp(BS.restOff,-2,1); if(low<0.04 && st.rest>0.5 && Math.random()<dt*3) dust(new THREE.Vector3(st.x,0.02,0),0.25,1); }
  // the little arms: wriggling out of rhythm, or hanging limp on a ruined side
  for(const arm of R.arms){ const id=R.arms.indexOf(arm), limp=(BS.limp&&BS.limp[arm.side])||arm.dead;
    if(limp){ arm.base.parent.updateMatrixWorld(true); aimBone(R,arm.base.name,new THREE.Vector3(0.05*Math.sin(gameT+id),-1,0)); aimBone(R,arm.mid.name,new THREE.Vector3(0,-1,0.05)); }
    else { arm.base.rotation.set(jn(arm,"a",0.55,dt),jn(arm,"b",0.55,dt),jn(arm,"c",0.6,dt)); arm.mid.rotation.set(jn(arm,"d",0.8,dt),jn(arm,"e",0.6,dt),jn(arm,"f",0.9,dt)); } }
  // the split body's jaws: mostly shut, now and then they snap open and clack shut; a clip can take them over
  if(R.jaw){ BS.jw=BS.jw||{x:-0.5,v:0}; BS.snapT=(BS.snapT??2)-dt; let tgt;
    if(st.jaw!=null) tgt=st.jaw; else { if(BS.snapT<=0){ BS.snapT=1.8+Math.random()*2.4; BS.snapOpen=0.28; } if(BS.snapOpen>0){ BS.snapOpen-=dt; tgt=0.35; if(BS.snapOpen<=0) BS.clack=1; } else tgt=-0.5; }
    const prev=BS.jw.x; spring(BS.jw,tgt,dt,tgt<prev?26:9); if(BS.clack && BS.jw.x<-0.4){ BS.clack=0; cue("rib teeth clack"); shake=Math.max(shake,0.05); }
    R.B.jawL.rotation.set(0,BS.jw.x,0); R.B.jawR.rotation.y=-BS.jw.x; }
  for(const o of (R.organs||[])){ if(o.burst!=null){ o.burst+=dt; o.b.scale.setScalar(o.burst<0.05?1+o.burst*8:0.001); } }
  // bursting lumps
  for(const l of R.lumps){ if(l.burst!=null){ l.burst+=dt; l.b.scale.setScalar(Math.max(0.001,1+2*l.burst*(l.burst<0.04?1:0)-(l.burst>=0.04?1:0))); } }
  m.updateMatrixWorld(true);
}
function lumpWorld(l){ const p=new THREE.Vector3(); l.b.getWorldPosition(p); return p; }
function bruteLocal(st,lx,ly,lz){ const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,st.yaw,0)); return new THREE.Vector3(lx,ly,lz).applyQuaternion(q).add(new THREE.Vector3(st.x,0,st.z||0)); }
// feet planted relative to the body: lx = sideways (its left +), lz = ahead
function footSpot(st,s,ahead,width=0.95){ return bruteLocal(st,(s==="L"?1:-1)*width,0.02,ahead); }

// a heavy stump landing: the thing has weight
function stumpSlam(p,k=1){ dust(p,1.0*k,5); debris(p,Math.round(6*k),0.9*k); ring(p,1.1*k); shake=Math.max(shake,0.14*k); camPunch(0.3*k); cue("stump slams down"); if(k>0.9) crack(p,0.7*k); }
// a growth bursting: a wet flash that blows everything near it back
function growthBurst(p){ const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:streakTex,color:0xffb0a0,transparent:true,depthWrite:false})); fl.position.copy(p); fl.scale.setScalar(1.4); scene.add(fl); fx.push({m:fl,t:0,life:0.12,o:1,v:new THREE.Vector3(),g:0});
  burstLight.position.copy(p); burstLight.intensity=6; blood(p,26,3,0.08); chunks(p,new THREE.Vector3(0,0.4,1),8); ring(new THREE.Vector3(p.x,0,p.z),1.6); hitStop(0.08); camPunch(0.5); shake=Math.max(shake,0.3); cue("growth bursts · wet crack"); }
const burstLight=new THREE.PointLight(0xff8866,0,6); scene.add(burstLight);

// ---------------------------------------------------------------- Norah's poses here
function noraPose(n){ const J=n.J||NP.stand(); applyPose(nora,J); nora.group.position.set(n.x??NX,0,n.z||0); nora.group.rotation.set(0,n.yaw??-Math.PI/2,0); if(n.fall) nora.group.rotateX(-n.fall*Math.PI/2); if(n.roll) nora.group.rotateZ(n.roll); retarget(nora); }
const AIMP=(r)=>{ const J=NP.stand(); J.aLx=-1.45-0.35*r; J.aRx=-1.5-0.4*r; J.aLz=-0.25; J.aRz=-0.05; J.eL=0.35; J.eR=0.15; J.sp=-0.06*r; J.lLx=-0.2; J.lRx=0.2; J.kL=0.12; J.kR=0.08; return J; };

// ---------------------------------------------------------------- the clips
function base(ctx){ return {x:ctx.x,z:0,yaw:Math.PI/2,rootY:BR.shoulderY,pitch:0,roll:0,twist:0,feet:{L:ctx.fL,R:ctx.fR},lift:{L:0,R:0},look:noraPoint("head")}; }
function plantInit(ctx,ahead=0){ const st={x:ctx.x,yaw:Math.PI/2}; ctx.fL=footSpot(st,"L",ahead); ctx.fR=footSpot(st,"R",ahead); }
// one stump step: lift, arc forward, slam down
function stepFoot(ctx,s,from,to,u,h=0.55){ const p=from.clone().lerp(to,ss(u)); p.y=0.02+h*Math.sin(Math.min(1,u*1.15)*Math.PI)*(u<0.7?1:1-easeIn((u-0.7)/0.3)); ctx["f"+s]=p; }
// ---------------------------------------------------------------- gait physics
// The body is an inverted pendulum over its planted stump(s): x'' = (g/h)(x - p). It slows climbing over the
// foot and speeds up falling past it. Each step is placed from momentum (capture point), each landing loses
// energy (collision) and compresses the body, and push-off puts it back. Lean, sway and the man all follow acceleration.
const GRAV=9.8;
function gaitInit(ctx,o){ const g=Object.assign({mode:"alt",Ts:0.62,Tds:0.14,H:0.5,loss:0.82,push:2.2,vdes:0,width:0.95,ahead:0.55},o);
  Object.assign(g,{x:ctx.x,v:o.v0||0,y:0,vy:0,air:false,stance:"R",swing:null,swT:0,ds:0,from:null,dip:{x:0,v:0},lean:{x:0,v:0},sway:{x:0,v:0},acc:0,lv:o.v0||0,land:0,still:true}); ctx.g=g; return g; }
function gaitStep(ctx,dt,st,onLand){ const g=ctx.g, L=BR.shoulderY, other=s=>s==="L"?"R":"L";
  const fx=s=>ctx["f"+s].x, pv = g.mode==="pair"||g.swing==null ? (fx("L")+fx("R"))/2 : fx(g.stance);
  const pend=dx=>Math.sqrt(L*L-Math.min(dx*dx,0.36*L*L));
  // --- body dynamics
  if(g.air){ g.vy-=GRAV*dt; g.y+=g.vy*dt; g.x+=g.v*dt; }
  else { if(g.mode==="pair"&&g.vdes>0&&g.v<0.35) g.v+=dt*1.5;   // the man's legs scrabble to keep it going
    const h=pend(g.x-pv), w2=GRAV/h; let a=w2*clamp(g.x-pv,-0.9,0.9); if(g.ds>0) a*=0.35; g.v+=a*dt; if(Math.abs(g.v)<0.02&&g.vdes===0&&Math.abs(g.x-pv)<0.04){ g.v*=0.5; } g.x+=g.v*dt; g.y=h-L; }
  g.acc=(g.v-g.lv)/Math.max(dt,1e-4); g.lv=g.v;
  const w=Math.sqrt(GRAV/L);
  const capture=()=>g.x+g.v*Math.tanh(w*g.Ts/2)/w+0.22*(g.v-g.vdes)/w;
  // --- stepping
  if(g.mode==="alt"){
    if(g.ds>0){ g.ds-=dt; if(g.ds<=0 && !(g.vdes===0 && Math.abs(g.v)<0.06 && Math.abs(fx("L")-fx("R"))<0.08)){ // push off the trailing stump, then swing it
        g.v+=clamp(g.push*(g.vdes-g.v)*0.5,-1.0,g.push*0.5)+ (g.vdes>0?0.12:0); g.swing=other(g.stance); g.swT=0; g.from=ctx["f"+g.swing].clone(); } }
    else if(g.swing==null && !(g.vdes===0 && Math.abs(g.v)<0.06)){ g.swing=other(g.stance); g.swT=0; g.from=ctx["f"+g.swing].clone(); }
    if(g.swing){ const s=g.swing; const lead=g.x-fx(g.stance), urg=clamp((lead-0.3)/0.3,0,1); g.swT+=dt*(1+3*urg); const u=Math.min(1,g.swT/g.Ts);   // falling too far past the stance stump hurries the swing down
      let cx=capture(); if(g.vdes>0) cx=Math.max(cx,g.x+0.18); cx=clamp(cx,g.x-0.5,g.x+0.9); const tgt=footSpot({x:cx,yaw:Math.PI/2},s,0,g.width); g.to=g.to&&u>0.75?g.to:tgt;
      const p=g.from.clone().lerp(g.to,1-Math.pow(1-u,2)); const H=g.H*(0.4+0.6*Math.min(1,Math.abs(g.to.x-g.from.x)/0.9));
      p.y=0.02+(u<0.4?H*Math.sin(u/0.4*Math.PI/2):H*(1-Math.pow((u-0.4)/0.6,2))); ctx["f"+s]=p; st.lift[s]=0.35*(p.y/Math.max(0.05,g.H));
      if(u>=1){ // touchdown: the step redirects the body and bleeds energy into the floor
        p.y=0.02; const k=clamp(Math.abs(g.v)/2.5,0.25,1.6); g.v*=g.loss; g.dip.v-=(1.7*k+0.6)*(g.imp??1); g.lean.v+=1.6*k; g.stance=s; g.swing=null; g.to=null; g.ds=g.Tds; g.land++; onLand&&onLand(p,k); } } }
  else { // pair: both stumps plant, the body vaults between them, flies a moment, both reach out and catch it
    if(!g.air && g.swing==null && g.x-pv>0.42 && g.vdes>0){ g.air=true; g.vy=1.1; g.v+=clamp(0.9*(g.vdes-g.v),0.2,1.2); g.swing="B"; g.swT=0; g.fromL=ctx.fL.clone(); g.fromR=ctx.fR.clone(); }
    if(!g.air && g.swing==null && g.vdes===0 && g.x-pv>0.22){ g.swing="B"; g.swT=0; g.fromL=ctx.fL.clone(); g.fromR=ctx.fR.clone(); }   // braking: both stumps reach out to catch it
    if(g.swing==="B"){ g.swT+=dt; const u=Math.min(1,g.swT/g.Ts); const cx=g.vdes===0? g.x+Math.max(0,g.v)/w : g.x+Math.max(0.15,0.62*g.v/w);   // ahead of the body, but short of where it would stop: it vaults over them
      for(const s of ["L","R"]){ const to=footSpot({x:cx,yaw:Math.PI/2},s,0,g.width+0.1), p=g["from"+s].clone().lerp(to,1-Math.pow(1-u,2)); p.y=0.02+g.H*Math.sin(u*Math.PI)*(u<0.8?1:1); ctx["f"+s]=p; st.lift[s]=0.4*Math.sin(u*Math.PI); }
      if(g.air && g.y<=pend(g.x-(ctx.fL.x+ctx.fR.x)/2)-L && g.vy<0 && u>0.6 || (u>=1&&g.air&&g.y<-0.05) || (u>=1&&!g.air)){ g.air=false; ctx.fL.y=ctx.fR.y=0.02; const k=clamp(-g.vy/1.5+Math.abs(g.v)/3,0.5,1.8); g.v*=g.loss; g.dip.v-=1.3*k; g.lean.v+=2.2*k; g.swing=null; g.land++; onLand&&onLand(ctx.fL,k); onLand&&onLand(ctx.fR,k); } } }
  // --- the body's response: compression, inertial lean, sway over the stance side
  spring(g.dip,0,dt,6); spring(g.lean,clamp(-g.acc*0.05,-0.3,0.3),dt,5.5);
  const sz = g.mode==="alt" && g.swing ? (g.stance==="L"?-1:1)*0.16 : 0; spring(g.sway,sz,dt,5);
  st.x=g.x; ctx.x=g.x; st.rootY=L+g.y+g.dip.x-0.04; st.pitch=0.06+g.lean.x+0.04*Math.min(1,Math.abs(g.v)); st.z=g.sway.x; st.roll=-g.sway.x*0.55+g.sway.v*0.02; st.twist=g.mode==="alt"&&g.swing?(g.swing==="L"?1:-1)*0.07*Math.min(1,Math.abs(g.v)):0;
  st.feet={L:ctx.fL,R:ctx.fR}; return st; }
const landFx=(p,k)=>{ stumpSlam(p,0.45+0.35*k); BS.twitch=Math.max(BS.twitch||0,0.3*k); };
const A={};
A.walk={ name:"Walk: alternating stumps", len:10.5, start(ctx){ ctx.x=-7.5; plantInit(ctx,0); gaitInit(ctx,{Ts:0.66,Tds:0.16,H:0.5,loss:0.8,push:2.4}); },
  step(t,dt,ctx){ const g=ctx.g, st=base(ctx); g.vdes = t<0.6?0 : t<7.2?1.35 : 0;
    ctx.phase = t<0.6?"stands · weight settled" : g.v<0.9&&t<3?"leans in · first heavy steps" : t<7.2?"walking · vaults over each stump" : Math.abs(g.v)>0.1?"brakes · steps catch its momentum":"stopped · rocks to rest";
    return gaitStep(ctx,dt,st,landFx); } };
A.vault={ name:"Crutch-vault (hurrying)", len:8, start(ctx){ ctx.x=-7.5; plantInit(ctx,0); gaitInit(ctx,{mode:"pair",Ts:0.5,H:0.7,loss:0.78,width:1.05}); },
  step(t,dt,ctx){ const g=ctx.g, st=base(ctx); if(t<0.6){ ctx.phase="sets itself"; st.rootY=BR.shoulderY-0.12*ss(t/0.6); return st; }
    if(t<0.75&&!g.go){ g.go=1; g.v=1.6; } g.vdes=t<6.6?2.6:0; const r=gaitStep(ctx,dt,st,(p,k)=>{ stumpSlam(p,0.6+0.4*k); if(k>1) crack(p,0.5); });
    ctx.phase=g.air?"swings through · airborne for a beat":g.vdes?"lands on both stumps · vaults over them":"stops"; st.manSwing=-0.25*clamp(g.v/2.5,0,1)+(g.air?-0.3:0); return r; } };
A.sweep={ name:"Wide sweeping swing", len:5.5, start(ctx){ ctx.x=NX-2.3; plantInit(ctx,0.1); ctx.n={}; },
  step(t,dt,ctx){ const st=base(ctx); const sh=bruteLocal(st,-0.35,0,0); ctx.n={J:NP.stand()};
    const arcAt=(ang,h)=>bruteLocal(st,-Math.cos(ang)*2.05,h,Math.sin(ang)*2.05);       // around it, from its right side round the front
    if(t<0.8){ ctx.phase="sets its weight"; st.roll=0.08*ss(t/0.8); return st; }
    const r0=ctx.fR0||(ctx.fR0=ctx.fR.clone());
    if(t<1.35){ const u=ss((t-0.8)/0.55); ctx.phase="right stump lifts out wide"; ctx.fR=r0.clone().lerp(arcAt(-0.25,1.2),u); st.lift.R=0.6*u; st.roll=0.12; st.twist=-0.25*u; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(t<1.65){ ctx.phase="holds it out (the tell)"; ctx.fR=arcAt(-0.25,1.2+0.05*Math.sin(t*30)); st.lift.R=0.6; st.roll=0.12; st.twist=-0.25; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(t<2.05){ const u=easeIn(Math.min(1,(t-1.65)/0.32)); ctx.phase="sweeps through"; const ang=-0.25+(Math.PI*0.95)*u; ctx.fR=arcAt(ang,1.15); st.lift.R=0.6; st.roll=0.12; st.twist=-0.25+0.75*u;
      streak(ctx.fR.clone().setY(1.15),2); if(!ctx.hit && ctx.fR.distanceTo(new THREE.Vector3(NX,1.15,0))<0.9){ ctx.hit=t; hitStop(0.09); camPunch(0.6); shake=Math.max(shake,0.35); cue("meat on bone · thud"); dmg("NORAH −28","sweeping swing · knocked flying"); blood(noraPoint("flank"),10,2,0.06); wound(nora,"chest",new THREE.Vector3(0.08,0.2,0.08),new THREE.Vector3(0.3,0,1),"bruise",0.24); }
      return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(ctx.hit){ const k=t-ctx.hit; ctx.n={J:NP.stumble(), x:NX+0.3*easeOut(k/0.4), z:-1.6*easeOut(k/0.45), fall:Math.min(1,k/0.4)*0.95, roll:0}; if(k>0.42&&!ctx.landed){ ctx.landed=1; slamLine(new THREE.Vector3(NX+0.3,0,-1.6),new THREE.Vector3(NX+1.6,0,-1.6),0.8); } }
    const u=ss((t-2.05)/0.8); ctx.phase= u<1?"swings back, plants":"settles"; const end=footSpot(st,"R",0.1); const from=arcAt(-0.25+Math.PI*0.95,1.15); stepFoot(ctx,"R",from,end,u,0.6); if(u>=1&&!ctx.pl){ ctx.pl=1; stumpSlam(ctx.fR,0.8); } st.twist=0.5*(1-u); st.roll=0.12*(1-u);
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
A.slam={ name:"Overhead double slam", len:6.5, start(ctx){ ctx.x=NX-3.3; plantInit(ctx,0); ctx.n={}; },
  step(t,dt,ctx){ const st=base(ctx); ctx.n={J:NP.stand()}; const L0=ctx.L0||(ctx.L0=ctx.fL.clone()), R0=ctx.R0||(ctx.R0=ctx.fR.clone());
    const up=s=>bruteLocal(st,(s==="L"?1:-1)*0.65,3.0,0.45), down=s=>bruteLocal(st,(s==="L"?1:-1)*0.55,0.02,2.0);
    if(t<0.6){ ctx.phase="settles"; return st; }
    // rocks back and sits down onto the man's feet, so both stumps are free to rise
    if(t<1.15){ const u=ss((t-0.6)/0.55); ctx.phase="sits back onto its feet · stumps rear up"; st.rest=u; st.rootY=BR.shoulderY-0.6*u; ctx.fL=L0.clone().lerp(up("L"),u); ctx.fR=R0.clone().lerp(up("R"),u); st.lift.L=st.lift.R=1.0*u; st.pitch=-0.3*u; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(t<1.5){ ctx.phase="holds high on its feet (the tell)"; const j=0.05*Math.sin(t*35); st.rest=1; st.rootY=BR.shoulderY-0.6; ctx.fL=up("L").add(new THREE.Vector3(0,j,0)); ctx.fR=up("R").add(new THREE.Vector3(0,-j,0)); st.lift.L=st.lift.R=1; st.pitch=-0.3; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(t<1.68){ const u=easeIn((t-1.5)/0.18); ctx.phase="slams down"; st.rest=1; st.rootY=BR.shoulderY-0.6-0.3*u; ctx.fL=up("L").lerp(down("L"),u); ctx.fR=up("R").lerp(down("R"),u); st.lift.L=st.lift.R=1-u; st.pitch=-0.3+0.75*u; streak(ctx.fL,1.6); streak(ctx.fR,1.6); return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(!ctx.hit){ ctx.hit=t; const c=bruteLocal(st,0,0,2.0); hitStop(0.13); shake=Math.max(shake,0.5); camPunch(0.9); cue("ground-shaking slam"); ring(c,3.2); crack(c,1.6); for(let i=0;i<6;i++){ const p=c.clone().add(new THREE.Vector3((Math.random()-.5)*1.4,0,(Math.random()-.5)*1.4)); dust(p,1.2,4); debris(p,6,1.2); }
      if(c.distanceTo(new THREE.Vector3(NX,0,0))<2.8){ ctx.down=t; dmg("NORAH −22","double slam · knocked off her feet"); } }
    if(ctx.down){ const k=t-ctx.down; ctx.n={J:NP.stumble(), x:NX+0.8*easeOut(k/0.35), fall:Math.min(1,k/0.45)*0.95}; if(k>0.45&&!ctx.landed){ ctx.landed=1; slamLine(new THREE.Vector3(NX+0.8,0,0),new THREE.Vector3(NX+2.1,0,0),0.8); } }
    const k=t-ctx.hit;
    // sprawled: stumps flat out in front, body sagging between them and its feet
    if(k<1.1){ ctx.phase="sprawled · heaving"; ctx.fL=down("L"); ctx.fR=down("R"); st.rest=1; st.rootY=BR.shoulderY-0.9+0.03*Math.sin(t*6); st.pitch=0.45; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    // walks its stumps back under itself one at a time
    if(k<2.1){ const u=(k-1.1)/1.0; ctx.phase="drags its stumps back under itself"; stepFoot(ctx,"L",down("L"),footSpot(st,"L",0.35),sat(u/0.55),0.3); stepFoot(ctx,"R",down("R"),footSpot(st,"R",0.35),sat((u-0.45)/0.55),0.3);
      if(u>0.55&&!ctx.p1){ ctx.p1=1; stumpSlam(ctx.fL,0.5); } if(u>0.999&&!ctx.p2){ ctx.p2=1; stumpSlam(ctx.fR,0.5); }
      st.rest=1; st.rootY=BR.shoulderY-0.9+0.03*Math.sin(t*6); st.pitch=0.45-0.25*ss(u); return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    // presses itself up on its arms, trembling with the effort; the weight comes off the man's feet
    const u=ss((k-2.1)/1.1), tr=(1-u)*0.025*Math.sin(t*31); ctx.phase= u<1?"pushes itself back up on its arms":"upright";
    ctx.fL=footSpot(st,"L",0.35); ctx.fR=footSpot(st,"R",0.35); st.rest=1-u; st.rootY=BR.shoulderY-0.9*(1-u)+tr; st.pitch=0.2*(1-u)+tr; st.lift.L=st.lift.R=-0.1*(1-u);
    if(u>0.2&&u<0.9&&Math.random()<dt*6){ dust(ctx.fL.clone(),0.3,1); dust(ctx.fR.clone(),0.3,1); }
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
A.lunge={ name:"Lunge", len:5, start(ctx){ ctx.x=NX-4.4; plantInit(ctx,0.2); ctx.n={}; },
  step(t,dt,ctx){ const st=base(ctx); ctx.n={J:NP.stand()};
    if(t<0.9){ const u=ss((t-0.3)/0.6); ctx.phase="plants both stumps, sinks"; st.rootY=BR.shoulderY-0.25*u; st.pitch=-0.15*u; st.manSwing=0.2*u; return st; }
    if(t<1.25){ const u=easeOut((t-0.9)/0.35); ctx.phase="hurls itself forward"; ctx.x=NX-4.4+2.9*u; st.x=ctx.x; st.rootY=BR.shoulderY-0.25+0.15*Math.sin(u*Math.PI); st.pitch=0.45*Math.sin(u*Math.PI); st.manSwing=-0.9*Math.sin(u*Math.PI*0.8);
      if(!ctx.hit && ctx.x>NX-1.8){ ctx.hit=t; hitStop(0.1); camPunch(0.7); shake=Math.max(shake,0.4); cue("body slams into her"); dmg("NORAH −30","lunge · thrown back"); blood(noraPoint("neck"),8,1.6,0.06); wound(nora,"chest",new THREE.Vector3(0,0.18,0.1),new THREE.Vector3(0,0,1),"bruise",0.26); }
      return st; }
    if(ctx.hit){ const k=t-ctx.hit; ctx.n={J:NP.stumble(), x:NX+1.9*easeOut(k/0.45), fall:Math.min(1,k/0.5)*0.97}; if(k>0.5&&!ctx.landed){ ctx.landed=1; slamLine(new THREE.Vector3(NX+1.9,0,0),new THREE.Vector3(NX+3.2,0,0),0.9); } }
    const k=t-1.25; ctx.phase= k<0.5?"stretched out":"drags its stumps after it"; st.x=ctx.x; st.rootY=BR.shoulderY-0.1; st.pitch=0.2*(1-ss(k/0.8));
    if(k>0.5){ const u=ss((k-0.5)/0.45); const L0=ctx.L0||(ctx.L0=ctx.fL.clone()); stepFoot(ctx,"L",L0,footSpot(st,"L",0.2),u,0.4); if(u>=1&&!ctx.p1){ ctx.p1=1; stumpSlam(ctx.fL,0.7); } }
    if(k>0.9){ const u=ss((k-0.9)/0.45); const R0=ctx.R0||(ctx.R0=ctx.fR.clone()); stepFoot(ctx,"R",R0,footSpot(st,"R",0.2),u,0.4); if(u>=1&&!ctx.p2){ ctx.p2=1; stumpSlam(ctx.fR,0.7); } }
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
A.pin={ name:"Charge and crushing hug", len:8.5, start(ctx){ ctx.x=NX-7.5; plantInit(ctx,0); ctx.ph=0; ctx.n={}; ctx.out=outcome("oPin",ctx); ctx.mash=0; },
  step(t,dt,ctx){ const st=base(ctx);
    if(ctx.hitT==null){ ctx.n={J:NP.stand()}; const T=0.62; ctx.ph+=dt/T; if(ctx.ph>=1){ ctx.ph-=1; ctx.from=null; ctx.slammed=0; } const u=ctx.ph;     // fast vaults at her
      if(u<0.35){ const k=u/0.35; if(!ctx.from){ ctx.fromL=ctx.fL.clone(); ctx.fromR=ctx.fR.clone(); ctx.from=1; } const st0={x:ctx.x,yaw:Math.PI/2}; stepFoot(ctx,"L",ctx.fromL,footSpot(st0,"L",1.3,1.05),k,0.6); stepFoot(ctx,"R",ctx.fromR,footSpot(st0,"R",1.3,1.05),k,0.6);
        if(k>0.97&&!ctx.slammed){ ctx.slammed=1; stumpSlam(ctx.fL,0.9); stumpSlam(ctx.fR,0.9); } }
      else { const k=(u-0.35)/0.65; ctx.x+=dt*2.4/(0.65*T); st.rootY=BR.shoulderY-0.4*Math.sin(k*Math.PI); st.pitch=0.35*Math.sin(k*Math.PI); st.manSwing=-0.5*Math.sin(k*Math.PI); }
      st.x=ctx.x; ctx.phase="charges"; if(ctx.x>NX-1.15){ ctx.hitT=t; ctx.L0=ctx.fL.clone(); ctx.R0=ctx.fR.clone(); hitStop(0.1); camPunch(0.7); shake=Math.max(shake,0.35); cue("caught"); }
      if(ctx.x>NX-2.6){ const J=NP.stand(); J.aLx=J.aRx=-0.9; J.eL=J.eR=1.2; J.sp=-0.1; ctx.n={J}; }
      return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    // both stumps swing round behind her and haul her in tight against its body, lifting her off her feet
    const k=t-ctx.hitT; st.x=ctx.x; const pull=ss(k/0.45), body=new THREE.Vector3(ctx.x+0.62,0,0);
    const hold=new THREE.Vector3(NX,0,0).lerp(body,pull); hold.y=0.35*pull;            // her root while held
    const back=(s)=>new THREE.Vector3(hold.x+0.16,hold.y+1.12,(s==="L"?-1:1)*0.05);     // behind her back, wrapped round
    const squeeze=ctx.dead?0.06*Math.min(1,(t-ctx.dead)/0.15):0;
    if(!ctx.free){ const u=ss(k/0.35); for(const s of ["L","R"]){ const from=ctx[s+"0"].clone().add(new THREE.Vector3(0,1.0*Math.sin(u*Math.PI),(s==="L"?-1:1)*0.6*Math.sin(u*Math.PI)));
        ctx["f"+s]=from.lerp(back(s).add(new THREE.Vector3(-squeeze,0,0)),u); }
      st.fist={L:ctx.fL,R:ctx.fR}; st.padDir={L:new THREE.Vector3(0.45,-0.15,0.88),R:new THREE.Vector3(0.45,-0.15,-0.88)}; const c={bones:["chest","hips"],gap:ctx.dead?-0.02:0.003,w:sat((k-0.2)/0.2)}; st.contact={L:c,R:c};
      st.pole={L:new THREE.Vector3(0,0.2,-1),R:new THREE.Vector3(0,0.2,1)}; st.pitch=0.12+0.1*pull+(ctx.dead?0.08:0); st.rootY=BR.shoulderY-0.2*pull; st.rest=ss(k/0.3); }
    if(k>0.3&&!ctx.c3){ ctx.c3=1; hitStop(0.08); shake=Math.max(shake,0.3); camPunch(0.5); cue("crushed against it · ribs creak"); dust(new THREE.Vector3(NX,0,0),0.8,5); }
    // her: pressed flat to it, legs kicking off the floor
    const nJ=NP.held(t); nJ.sp=-0.15; nJ.aLx=nJ.aRx=-0.5; nJ.aLz=nJ.aRz=0.5; nJ.eL=nJ.eR=1.6; nJ.lLx=-0.3+0.5*Math.sin(t*10); nJ.lRx=-0.3-0.5*Math.sin(t*10+1); nJ.kL=0.5+0.3*Math.sin(t*10); nJ.kR=0.5-0.3*Math.sin(t*10);
    if(ctx.free){ const f=t-ctx.free; ctx.qte=null; ctx.phase= f<0.6?"wrenches free · drops":"staggers back";
      const out=ss(f/0.3); ctx.fL=ctx.fL.clone().lerp(footSpot({x:ctx.x,yaw:Math.PI/2},"L",0.5),out*0.2); ctx.fR=ctx.fR.clone().lerp(footSpot({x:ctx.x,yaw:Math.PI/2},"R",0.5),out*0.2); st.fist=null;
      st.rest=1-ss(f/0.4); if(f>0.25&&!ctx.sl){ ctx.sl=1; stumpSlam(ctx.fL,0.6); stumpSlam(ctx.fR,0.6); }
      ctx.n={J:f<0.5?NP.stumble():mix(NP.stumble(),NP.stand(),ss((f-0.5)/0.5)), x:ctx.fx+1.3*easeOut(f/0.6), y:Math.max(0,ctx.fy*(1-easeIn(Math.min(1,f/0.25))))};
      if(!ctx.land && f>0.25){ ctx.land=1; dust(new THREE.Vector3(ctx.n.x,0,0),0.6,3); } return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(!ctx.dead){ const rate=ctx.out==="b"?0.6:0.22; if(k>0.35) ctx.mash=Math.min(1,ctx.mash+dt*rate); ctx.qte={k:"E",fill:ctx.mash,txt:"MASH · ESCAPE OR DIE"}; ctx.phase= k<0.45?"wraps round her · hauls her in":"crushing hug";
      shake=Math.max(shake,0.03); ctx.n={J:nJ,x:hold.x,y:hold.y};
      if(ctx.out==="b"&&ctx.mash>=1){ ctx.free=t; ctx.fx=hold.x; ctx.fy=hold.y; cue("wrenches free"); dmg("ESCAPED","she wrenches out of the hug"); hitStop(0.05); }
      if(ctx.out!=="b"&&k>2.1){ ctx.dead=t; hitStop(0.22); camPunch(1.1); shake=Math.max(shake,0.55); cue("CRUNCH · spine snaps"); dmg("NORAH KILLED","crushed in the hug"); const p=noraPoint("neck"); blood(p,18,2.2,0.07); }
      return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    // dead: one hard squeeze, she folds backward over the stumps, limp; it holds her a moment and lets her slide down
    const e=t-ctx.dead; ctx.qte=null; ctx.phase= e<1.6?"dead · held limp":"lets her drop";
    const dJ=P0(); dJ.sp=-0.55*ss(e/0.2); dJ.nx=-0.9*ss(e/0.25); dJ.ny=0.3; dJ.aLx=dJ.aRx=0.25; dJ.aLz=dJ.aRz=0.35; dJ.eL=dJ.eR=0.2; dJ.lLx=0.1; dJ.lRx=-0.05; dJ.kL=0.35; dJ.kR=0.2; dJ.fL=dJ.fR=0.4;
    if(e<1.6){ if(Math.random()<dt*6) drip(noraPoint("neck")); ctx.n={J:dJ,x:hold.x,y:hold.y}; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    const d=ss((e-1.6)/0.5); st.rest=1-d; for(const s of ["L","R"]) ctx["f"+s]=ctx["f"+s].clone().lerp(footSpot({x:ctx.x,yaw:Math.PI/2},s,0.4),Math.min(1,dt*6)); st.fist=null; st.contact=null;
    if(d>0.95&&!ctx.drop){ ctx.drop=1; dust(new THREE.Vector3(hold.x,0,0),0.9,6); debris(new THREE.Vector3(hold.x,0,0),6,0.8); cue("body drops"); }
    ctx.n={J:mix(dJ,NP.lie(t,1,0),d), x:hold.x+0.3*d, y:hold.y*(1-easeIn(d)), fall:d}; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
A.weak={ name:"Weak points: lumps and little arms", len:11, start(ctx){ ctx.x=NX-4.2; plantInit(ctx,0); ctx.n={}; ctx.k=0; ctx.hp=100; BS.limp={L:false,R:false};
    for(const l of BR.lumps){ l.burst=null; l.b.scale.setScalar(1); } for(const a of BR.arms) a.dead=false; ctx.col=0; },
  step(t,dt,ctx){ const st=base(ctx);
    if(!nora.gun){ const g=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.05,0.035),new THREE.MeshLambertMaterial({color:0x222222})); g.position.set(-0.14,0.02,0); nora.B.hand_R.add(g); nora.gun=g; } nora.gun.visible=true;
    let rec=ctx.lastShot!=null?Math.max(0,1-(t-ctx.lastShot)/0.18):0; ctx.n={J:AIMP(rec)};
    // she shoots three lumps on its left stump (the side facing her), then one hard shot at a little arm
    const plan=[1.2,2.3,3.4,6.6];
    if(ctx.k<plan.length && t>=plan[ctx.k]){ ctx.k++; ctx.lastShot=t; cue("gunshot"); hitStop(0.04); camPunch(0.2); shake=Math.max(shake,0.1);
      const mz=new THREE.Vector3(); nora.gun.localToWorld(mz.set(-0.12,0,0)); const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:streakTex,color:0xffd090,transparent:true,depthWrite:false})); fl.position.copy(mz); fl.scale.setScalar(0.35); scene.add(fl); fx.push({m:fl,t:0,life:0.06,o:1,v:new THREE.Vector3(),g:0});
      if(ctx.k<=3){ const cand=BR.lumps.filter(l=>l.side==="R"&&l.burst==null).map(l=>({l,p:lumpWorld(l)})).filter(o=>o.p.y>0.7&&o.p.y<2.3).sort((a,b)=>b.p.x-a.p.x);
        const pick=cand[Math.min(cand.length-1,ctx.k*3)]; if(pick){ pick.l.burst=0; growthBurst(pick.p); for(const o of cand.filter(o=>o.p.distanceTo(pick.p)<0.22)) o.l.burst=0; }
        ctx.hp-=10; dmg(`BRUTE −10 · ${ctx.hp}`,`viscera lump ${ctx.k} of 3 burst · blown back`); ctx.kb=t; BS.twitch=1;
        if(ctx.k===3){ ctx.colT=t; BS.limp.R=true; cue("stump buckles · wet tearing"); } }
      else { const arm=BR.arms.filter(a=>a.side==="L")[0]||BR.arms[0]; arm.dead=true; const p=new THREE.Vector3(); arm.mid.getWorldPosition(p); blood(p,18,2.4,0.07); chunks(p,new THREE.Vector3(1,0.3,0),5); hitStop(0.1); camPunch(0.5); shake=Math.max(shake,0.25);
        ctx.hp-=35; dmg(`BRUTE −35 · ${ctx.hp}`,"little arm hit · heavy damage (a hard shot)"); BS.twitch=1.4; cue("shriek from the man"); } }
    ctx.phase= ctx.colT!=null?(t-ctx.colT<1.4?"its right stump collapses":"crippled, dragging itself"):ctx.k>0?"shot · blown back by the burst":"stands, swaying";
    const kb=ctx.kb!=null?Math.max(0,1-(t-ctx.kb)/0.45):0; st.x=ctx.x-0.35*Math.sin(Math.min(1,kb)*Math.PI)*0; ctx.x-=dt*0.9*kb; st.x=ctx.x; st.pitch=-0.35*kb; st.rootY=BR.shoulderY-0.04+0.03*Math.sin(t*1.7);
    if(ctx.colT!=null){ const c=ss((t-ctx.colT)/0.6); ctx.col=c; const F=footSpot(st,"R",0.35,1.35); F.y=0.02; ctx.fR=footSpot(st,"R",0,0.95).lerp(F,c); st.rootY=BR.shoulderY-0.95*c; st.roll=-0.42*c; st.pitch=0.15*c-0.35*kb;
      st.pole={R:new THREE.Vector3(0,-1,0).add(new THREE.Vector3(0,0,c*0.5))}; if(!ctx.cf&&c>0.95){ ctx.cf=1; slamLine(bruteLocal(st,-0.2,0,0),bruteLocal(st,-1.2,0,0.3),1.1); } }
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
function mouthPos3(){ const a=new THREE.Vector3(), c=new THREE.Vector3(); BR.B.jawL.getWorldPosition(a); BR.B.jawR.getWorldPosition(c); a.add(c).multiplyScalar(0.5); const q=BR.mesh.getWorldQuaternion(new THREE.Quaternion()); return a.add(new THREE.Vector3(0,0,0.3).applyQuaternion(q)); }
A.eat={ name:"Eat grab (split version)", len:9, start(ctx){ ctx.x=NX-3.4; plantInit(ctx,0); ctx.n={}; ctx.out=outcome("oEat",ctx); ctx.mash=0; },
  step(t,dt,ctx){ const st=base(ctx); ctx.n={J:NP.stand()};
    if(t<0.7){ ctx.phase="jaws shut, watching"; st.jaw=-0.5; return st; }
    // one heavy lurch in on both stumps while the halves part
    if(t<1.5){ const u=(t-0.7)/0.8; if(!ctx.L0){ ctx.L0=ctx.fL.clone(); ctx.R0=ctx.fR.clone(); } const x1=NX-1.25, st1={x:x1,yaw:Math.PI/2};
      stepFoot(ctx,"L",ctx.L0,footSpot(st1,"L",0.3),u,0.7); stepFoot(ctx,"R",ctx.R0,footSpot(st1,"R",0.3),u,0.7); ctx.x=NX-3.4+(x1-(NX-3.4))*ss(u); st.x=ctx.x;
      st.rootY=BR.shoulderY-0.25*Math.sin(u*Math.PI); st.pitch=0.25*Math.sin(u*Math.PI); st.jaw=-0.5+0.95*ss(u); ctx.phase="lurches in, halves parting";
      if(u>0.97&&!ctx.s1){ ctx.s1=1; stumpSlam(ctx.fL,0.8); stumpSlam(ctx.fR,0.8); } return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(!ctx.P0){ ctx.P0=ctx.fL.clone(); ctx.Q0=ctx.fR.clone(); }
    const hip=y=>new THREE.Vector3(NX,0.95+y,0), side=(p,s)=>p.clone().add(new THREE.Vector3(0,0,s==="L"?-0.36:0.36));
    // both stumps swing round her sides and clamp at the hips
    if(t<1.9){ const u=ss((t-1.5)/0.4); ctx.phase="stumps scoop round her"; ctx.fL=ctx.P0.clone().lerp(side(hip(0),"L"),u); ctx.fR=ctx.Q0.clone().lerp(side(hip(0),"R"),u); ctx.fL.z-=0.5*Math.sin(u*Math.PI); ctx.fR.z+=0.5*Math.sin(u*Math.PI);
      st.jaw=0.45; st.pitch=0.2*u; st.rest=u; const J=NP.stand(); J.aLx=J.aRx=-0.4*u; ctx.n={J}; if(u>0.6){ const c={bones:["hips","chest"],w:(u-0.6)/0.4}; st.contact={L:c,R:c}; }
      if(u>0.98&&!ctx.c1){ ctx.c1=1; hitStop(0.07); camPunch(0.5); shake=Math.max(shake,0.22); cue("caught · wet slap"); dust(hip(-0.9),0.6,3); } return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    // she's hauled up and in toward the open body; mash before the jaws close
    const k=t-1.9, pull=ss(k/2.4), m0=ctx.m0||(ctx.m0=mouthPos3());
    const tgt=new THREE.Vector3(m0.x+0.25,m0.y-0.75,0); let h=hip(0).lerp(tgt,ctx.end!=null&&ctx.res==="free"?ctx.pullAt:pull);
    if(ctx.end!=null&&ctx.res==="eaten") h=tgt.clone().add(new THREE.Vector3(-0.12,0,0));
    const shk=ctx.end==null?0.04*Math.sin(t*23):0; ctx.fL=side(h,"L").add(new THREE.Vector3(0,shk,0)); ctx.fR=side(h,"R").add(new THREE.Vector3(0,-shk,0));
    if(!(ctx.end!=null&&ctx.res==="free")){ const c={bones:["hips","chest"],gap:0.005}; st.contact={L:c,R:c}; }
    st.pitch=0.2-0.35*pull; st.rootY=BR.shoulderY-0.1*pull; st.rest=ctx.end!=null&&ctx.res==="free"?1-ss((t-ctx.end)/0.5):1; st.jaw=0.45+0.12*Math.sin(t*5); st.look=h.clone().add(new THREE.Vector3(0,0.7,0));
    const nJ=NP.held(t); nJ.lLx=-0.4+0.5*Math.sin(t*9); nJ.lRx=-0.4-0.5*Math.sin(t*9+1); nJ.kL=0.6+0.3*Math.sin(t*9); nJ.kR=0.6-0.3*Math.sin(t*9); nJ.sp=-0.25; nJ.nx=-0.3;
    if(ctx.end==null){ const rate=ctx.out==="b"?0.55:0.24; ctx.mash=Math.min(1,ctx.mash+dt*rate); ctx.qte={k:"E",fill:ctx.mash,txt:"MASH · BREAK FREE BEFORE IT CLOSES"}; ctx.phase= pull<0.6?"hauled up off her feet":"pulled in toward the open body";
      ctx.n={J:nJ,x:h.x,y:h.y-0.95}; if(Math.random()<dt*3) cue("ribs creak open");
      if(ctx.out==="b" && ctx.mash>=1){ ctx.end=t; ctx.res="free"; ctx.pullAt=pull; ctx.hy=h.y-0.95; cue("tears loose · drops"); dmg("BROKE FREE","drops and stumbles clear"); hitStop(0.06); }
      if(ctx.out!=="b" && pull>=0.999){ ctx.end=t; ctx.res="eaten"; hitStop(0.22); camPunch(1); shake=Math.max(shake,0.6); cue("jaws slam shut · crunch"); dmg("NORAH KILLED","eaten · the jaws close on her"); const p=mouthPos3(); blood(p,40,3,0.09); }
      return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    const e=t-ctx.end;
    if(ctx.res==="free"){ ctx.qte=null; ctx.phase="she drops free"; const fy=Math.max(0,ctx.hy*(1-easeIn(Math.min(1,e/0.3))));
      if(!ctx.land && fy<=0.001){ ctx.land=1; dust(new THREE.Vector3(h.x+0.6,0,0),0.7,4); cue("lands hard"); }
      ctx.n={J: e<0.6?NP.stumble():mix(NP.stumble(),NP.stand(),ss((e-0.6)/0.5)), x:h.x+1.2*easeOut(Math.min(1,e/0.6)), y:fy};
      const out=ss(e/0.35); ctx.fL=side(h,"L").add(new THREE.Vector3(-0.3*out,-0.4*out,-0.5*out)); ctx.fR=side(h,"R").add(new THREE.Vector3(-0.3*out,-0.4*out,0.5*out)); st.jaw=0.45-0.95*ss(e/0.25);
      if(e>0.18&&!ctx.snap){ ctx.snap=1; cue("jaws snap on air"); shake=Math.max(shake,0.12); } return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    // eaten: the halves slam shut on her and grind; her legs kick, then hang
    ctx.qte=null; ctx.phase= e<1.5?"jaws shut on her · grinding":"still"; st.jaw=-0.15+0.08*Math.sin(e*13)*(e<1.5?1:0.1); st.pitch=-0.15;
    if(e<1.5 && Math.random()<0.4) blood(mouthPos3(),2,1.4,0.06); if(Math.random()<dt*10) drip(mouthPos3().add(new THREE.Vector3(0,-0.25,(Math.random()-0.5)*0.4)));
    const lJ=NP.held(t); lJ.sp=0.5; const kick=e<1.3?1-e/1.3:0; lJ.lLx=-0.1+0.6*kick*Math.sin(e*13); lJ.lRx=0.1-0.6*kick*Math.sin(e*11); lJ.kL=0.2+0.4*kick; lJ.kR=0.2; lJ.aLx=lJ.aRx=0.25; lJ.aLz=lJ.aRz=0.1; lJ.nx=0.7;
    ctx.n={J:lJ,x:h.x,y:h.y-0.95}; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
A.gut={ name:"Shot into the open body (split version)", len:10, start(ctx){ ctx.x=NX-4.0; plantInit(ctx,0); ctx.n={}; ctx.k=0; ctx.hp=100; ctx.jawOpen=0.4; for(const o of BR.organs||[]){ o.burst=null; o.b.scale.setScalar(1); } },
  step(t,dt,ctx){ const st=base(ctx);
    if(!nora.gun){ const g=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.05,0.035),new THREE.MeshLambertMaterial({color:0x222222})); g.position.set(-0.14,0.02,0); nora.B.hand_R.add(g); nora.gun=g; } nora.gun.visible=true;
    let rec=ctx.lastShot!=null?Math.max(0,1-(t-ctx.lastShot)/0.18):0; ctx.n={J:AIMP(rec)};
    // its jaws hang open (a target), flinch shut when hit inside, and slowly reopen
    const fl=ctx.flinch!=null?t-ctx.flinch:9; const open = fl<0.12? 0.4-1.05*(fl/0.12) : fl<1.6? -0.65 : -0.65+1.05*ss((fl-1.6)/1.4);
    st.jaw=open; const shutNow=open<-0.3;
    const plan=[1.2,2.0,4.6]; if(ctx.k<plan.length && t>=plan[ctx.k]){ ctx.k++; ctx.lastShot=t; cue("gunshot"); hitStop(0.04); camPunch(0.2);
      const mz=new THREE.Vector3(); nora.gun.localToWorld(mz.set(-0.12,0,0)); const f2=new THREE.Sprite(new THREE.SpriteMaterial({map:streakTex,color:0xffd090,transparent:true,depthWrite:false})); f2.position.copy(mz); f2.scale.setScalar(0.35); scene.add(f2); fx.push({m:f2,t:0,life:0.06,o:1,v:new THREE.Vector3(),g:0});
      if(shutNow){ const p=mouthPos3(); dust(p,0.4,2); blood(p,3,1,0.04); ctx.hp-=3; dmg(`BRUTE −3 · ${ctx.hp}`,"hits the closed halves · barely hurts it"); cue("bullet glances off rib"); }
      else { const org=(BR.organs||[]).filter(o=>o.burst==null); const o=org[Math.floor(org.length/2)]; const p=new THREE.Vector3(); if(o){ o.b.getWorldPosition(p); o.burst=0; for(const q of org) if(q!==o && q.b.getWorldPosition(new THREE.Vector3()).distanceTo(p)<0.16) q.burst=0; } else p.copy(mouthPos3());
        growthBurst(p); ctx.hp-=30; dmg(`BRUTE −30 · ${ctx.hp}`,"shot into the open body · organs burst"); ctx.flinch=t; ctx.recoil=t; cue("wet scream"); BS.twitch=1.5; } }
    const r=ctx.recoil!=null?Math.max(0,1-(t-ctx.recoil)/0.9):0; st.pitch=-0.45*Math.sin(Math.min(1,r)*Math.PI*0.9)*(r>0?1:0); st.rootY=BR.shoulderY+0.2*r; ctx.x-=dt*0.8*r; st.x=ctx.x;
    ctx.phase= fl<1.6&&ctx.flinch!=null?"jaws flinch shut · it rears back screaming":shutNow?"jaws reopening slowly":"jaws hang open";
    return st; } };
// ---- brick wall: something for the charge to go through
let WALL=null; const WX=NX+4.4;
function buildWall(){ if(WALL) scene.remove(WALL.g); const g=new THREE.Group(), bricks=[]; const mats=[0x6e3a2a,0x7a4330,0x63341f,0x845038].map(c=>new THREE.MeshLambertMaterial({color:c}));
  for(let r=0;r<11;r++) for(let c=0;c<11;c++){ const off=r%2?0.26:0; const z=-2.75+off+c*0.52; if(z>2.75) continue; const m=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.25,0.5),mats[(r*7+c*3)%4]); m.position.set(WX,0.13+r*0.26,z); m.castShadow=true; g.add(m); bricks.push({m,v:null,w:null}); }
  scene.add(g); WALL={g,bricks}; }
function smashWall(p,rad,v,k=1){ if(!WALL) return 0; let n=0; for(const b of WALL.bricks){ if(b.v) continue; const d=Math.hypot(b.m.position.y-p.y,b.m.position.z-p.z)*(0.8+Math.random()*0.4); if(d>rad) continue; n++;
    b.v=new THREE.Vector3(v.x*(0.5+Math.random()*0.7),1.5+Math.random()*3.5*k,(b.m.position.z-p.z)*2.5+(Math.random()-0.5)*3); b.w=new THREE.Vector3(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5).multiplyScalar(14); }
  if(n){ dust(new THREE.Vector3(WX,p.y,p.z),1.6*k,10); debris(new THREE.Vector3(WX,p.y,p.z),Math.round(14*k),1.4*k); } return n; }
function stepWall(dt){ if(!WALL) return; for(const b of WALL.bricks){ if(!b.v) continue; const m=b.m; b.v.y-=9.8*dt; m.position.addScaledVector(b.v,dt); m.rotation.x+=b.w.x*dt; m.rotation.y+=b.w.y*dt; m.rotation.z+=b.w.z*dt;
    if(m.position.y<0.12){ m.position.y=0.12; if(b.v.y<-2.5 && Math.random()<0.25) dust(m.position.clone(),0.35,1); b.v.y*=-0.25; b.v.x*=0.6; b.v.z*=0.6; b.w.multiplyScalar(0.55); if(b.v.length()<0.25){ b.v.set(0,0,0); b.w.set(0,0,0); } } } }
// ---- the barrel charge: full commitment, the weight of a brick wall
A.charge={ name:"Barrel charge", len:9.5, start(ctx){ ctx.x=NX-15.5; plantInit(ctx,0); ctx.v=0; gaitInit(ctx,{Ts:0.5,Tds:0.05,H:0.55,loss:0.9,push:4.5,imp:0.35}); ctx.side="L"; ctx.hp=0; ctx.n={}; ctx.out=outcome("oCharge",ctx); buildWall(); BS.twitch=0; },
  step(t,dt,ctx){ const st=base(ctx); stepWall(dt); const gap=NX-ctx.x;
    // 1 · wind-up: sinks, paws the floor once, the man's head snaps up
    if(t<0.95){ const u=ss(t/0.95); ctx.phase="sinks low · paws the floor"; st.rootY=BR.shoulderY-0.35*u; st.pitch=0.3*u; st.manSwing=0.35*u; ctx.n={J:NP.stand()};
      if(!ctx.R0) ctx.R0=ctx.fR.clone(); const paw=Math.sin(Math.min(1,t/0.7)*Math.PI); ctx.fR=ctx.R0.clone().add(new THREE.Vector3(-0.5*paw,0.12*paw,0)); if(paw>0.3&&Math.random()<0.5) dust(ctx.fR.clone(),0.4,1);
      if(t>0.55&&!ctx.b1){ ctx.b1=1; cue("deep bellow · floor hums"); shake=Math.max(shake,0.12); BS.twitch=1; } return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(ctx.hitT==null){
      // 2 · the gallop: the same pendulum physics, the controller demanding more speed every stride
      const g=ctx.g; g.vdes=9.2; g.Ts=clamp(0.5-0.03*g.v,0.24,0.5); g.H=0.45+0.04*g.v; g.push=4.5+g.v*0.3; if(!g.kick){ g.kick=1; g.v=1.2; }
      gaitStep(ctx,dt,st,(p,k)=>{ const near=clamp(1-(NX-ctx.x)/12,0,1), sp=g.v/9.2; stumpSlam(p,0.55+0.6*sp); if(sp>0.6) crack(p,0.5+0.4*sp); shake=Math.max(shake,0.08+0.35*sp*(0.4+near)); BS.twitch=0.6; });
      ctx.v=g.v; const sp=ctx.v/9.2; st.pitch+=0.2+0.2*sp; st.rootY-=0.15*sp; st.manSwing=-0.9*sp;
      if(sp>0.5 && Math.random()<dt*20) dust(new THREE.Vector3(ctx.x-0.8,0.1,(Math.random()-0.5)*1.4),0.5+0.4*sp,1);   // wake of dust
      ctx.phase= sp<0.5?"builds speed":"full barrel";
      // Norah: freezes, backs off, braces (or dives)
      if(gap>6){ ctx.n={J:NP.stand()}; } else if(ctx.out==="b" && gap<2.6){ ctx.dive=ctx.dive??t; }
      else if(gap>2.6){ ctx.bp=(ctx.bp||0)+dt*1.6; ctx.n={J:NP.backstep(ctx.bp),x:NX+0.15*(6-gap)/3.4}; } else { const J=NP.stumble(); J.aLx=J.aRx=-1.5; J.eL=J.eR=1.9; J.aLz=0.3; J.aRz=-0.3; J.sp=0.25; J.nx=0.4; ctx.n={J,x:NX+0.15}; }
      if(ctx.dive!=null){ const k=t-ctx.dive, u=easeOut(Math.min(1,k/0.45)); const J=NP.stumble(); J.aLx=J.aRx=-2.4*u; ctx.n={J:k<0.5?J:NP.lie(t,1,0.3),x:NX+0.3,z:2.1*u,y:0.35*Math.sin(Math.min(1,k/0.45)*Math.PI),fall:Math.min(1,k/0.35),roll:-1.4*u,yaw:-Math.PI/2+0.9*u}; if(k>0.4&&!ctx.dl){ ctx.dl=1; dust(new THREE.Vector3(NX+0.3,0,2.1),0.7,4); cue("dives clear"); } }
      if(gap<0.95){ ctx.hitT=t; ctx.vHit=ctx.v;
        if(ctx.out==="b"){ cue("misses · ploughs on"); shake=Math.max(shake,0.2); }
        else { hitStop(0.16); camPunch(1.3); shake=Math.max(shake,0.75); cue("CRUNCH · like a car"); dmg("NORAH −70","hit by the charge · thrown"); ring(new THREE.Vector3(NX,0.02,0),2.2); const p=noraPoint("chest"); blood(p,22,4,0.08); dust(p,1.2,8); debris(new THREE.Vector3(NX,0.05,0),18,1.4);
          ctx.np=new THREE.Vector3(NX+0.4,0.9,0); ctx.nv=new THREE.Vector3(8.5,3.4,2.4); ctx.nf=0; } }
      return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    // 3 · it doesn't stop for her. it goes through the wall, then skids
    const k=t-ctx.hitT; if(!ctx.thru){ ctx.v=Math.max(0,ctx.v-dt*(ctx.x<WX-0.6?1.5:11)); } else ctx.v=Math.max(0,ctx.v-dt*9);
    ctx.x+=ctx.v*dt; st.x=ctx.x;
    if(!ctx.thru && ctx.x>WX-1.3){ ctx.thru=1; hitStop(0.1); camPunch(1); shake=Math.max(shake,0.8); cue("wall explodes"); const n=smashWall(new THREE.Vector3(WX,1.5,0),1.9,new THREE.Vector3(ctx.v+3,0,0),1.4); ring(new THREE.Vector3(WX,0.02,0),2.6); crack(new THREE.Vector3(WX-0.5,0.01,0),1.6); }
    if(ctx.thru && ctx.v>0.2 && Math.random()<0.6) smashWall(new THREE.Vector3(WX,1.2+Math.random(),(Math.random()-0.5)*1.4),0.6,new THREE.Vector3(ctx.v+2,0,0),1);
    const sp=ctx.v/9.2;
    if(ctx.v>0.4){ // stumps thrown out front, gouging
      ctx.fL=footSpot({x:ctx.x,yaw:Math.PI/2},"L",1.0+0.4*sp,1.0); ctx.fR=footSpot({x:ctx.x,yaw:Math.PI/2},"R",0.9+0.4*sp,1.0); if(Math.random()<0.7){ dust(ctx.fL.clone(),0.6,1); dust(ctx.fR.clone(),0.6,1); debris(ctx.fL.clone(),1,0.6); }
      if(!ctx.gL){ ctx.gL=ctx.fL.clone(); } st.pitch=-0.25*sp+0.1; st.rootY=BR.shoulderY-0.3*sp; st.manSwing=0.9*sp; ctx.phase= ctx.thru?"through the wall · skidding":"ploughs on"; shake=Math.max(shake,0.15*sp); }
    else { if(!ctx.stop){ ctx.stop=t; if(ctx.gL) slamLine(ctx.gL,ctx.fL,0.8); stumpSlam(ctx.fL,0.6); } const e=t-ctx.stop; ctx.phase= e<1.4?"stops · heaving":"turns back toward her";
      st.rootY=BR.shoulderY-0.1+0.07*Math.sin(e*5); st.pitch=0.1+0.06*Math.sin(e*5); st.yaw=Math.PI/2+(ctx.out==="b"?-1:1)*0.0+Math.PI*ss((e-1.4)/1.6)*(e>1.4?1:0)*-1; if(e>1.4){ const s2={x:ctx.x,yaw:st.yaw}; ctx.fL=footSpot(s2,"L",0.2); ctx.fR=footSpot(s2,"R",0.2); } }
    // Norah after the hit: thrown, slams the wall, drops, skids
    if(ctx.out!=="b"){ if(ctx.nv){ ctx.nv.y-=13*dt; ctx.np.addScaledVector(ctx.nv,dt); ctx.nf+=dt*6.5;
        if(ctx.np.x>WX-0.35 && ctx.nv.x>0){ ctx.np.x=WX-0.35; ctx.nv.x=-1.2; ctx.nv.z*=0.3; smashWall(ctx.np.clone(),0.55,new THREE.Vector3(2.5,0,0),0.6); hitStop(0.07); shake=Math.max(shake,0.35); cue("into the bricks"); blood(ctx.np.clone(),10,2,0.07); }
        if(ctx.np.y<=0.25 && ctx.nv.y<0){ ctx.np.y=0.25; if(!ctx.land){ ctx.land=1; dust(ctx.np.clone(),1,6); debris(ctx.np.clone(),6,0.8); cue("lands · skids"); } ctx.nv.y=0; ctx.nv.x*=Math.pow(0.02,dt); ctx.nv.z*=Math.pow(0.02,dt); if(ctx.nv.length()>0.6&&Math.random()<0.5) dust(ctx.np.clone(),0.4,1); } }
      const air=!ctx.land, J=air?NP.stumble():NP.lie(t,1,Math.max(0,0.25-0.05*k)); if(air){ J.aLx=J.aRx=-2.2; J.lLx=-0.6; J.kL=J.kR=0.4; }
      ctx.n={J,x:ctx.np.x,y:air?Math.max(0,ctx.np.y-0.9):0,z:ctx.np.z,fall:air?Math.min(1.6,ctx.nf*0.4+0.3):1,roll:air?Math.sin(ctx.nf)*0.6:-0.3,yaw:-Math.PI/2}; }
    else { const k2=t-ctx.dive; ctx.n={J:k2<1.6?NP.lie(t,1,0.4):mix(NP.lie(t,1,0),NP.stand(),ss((k2-1.6)/0.7)),x:NX+0.3,z:2.1,fall:1-ss((k2-1.6)/0.7),yaw:-Math.PI/2+0.9}; }
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
// ---- the stretching punch: balances on one stump, throws the other; slow to start, brutal if she's still there
function gunUp(){ if(!nora.gun){ const g=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.05,0.035),new THREE.MeshLambertMaterial({color:0x222222})); g.position.set(-0.14,0.02,0); nora.B.hand_R.add(g); nora.gun=g; } nora.gun.visible=true; }
function muzzle(){ const mz=new THREE.Vector3(); nora.gun.localToWorld(mz.set(-0.12,0,0)); const f2=new THREE.Sprite(new THREE.SpriteMaterial({map:streakTex,color:0xffd090,transparent:true,depthWrite:false})); f2.position.copy(mz); f2.scale.setScalar(0.35); scene.add(f2); fx.push({m:f2,t:0,life:0.06,o:1,v:new THREE.Vector3(),g:0}); }
A.punch={ name:"Stretching punch", len:7, start(ctx){ ctx.x=NX-6.4; plantInit(ctx,0); ctx.n={}; ALT.pside=!ALT.pside; ctx.s=ALT.pside?"L":"R"; ctx.p=ctx.s==="L"?"R":"L"; ctx.out=outcome("oPunch",ctx); ctx.shots=0; ctx.hp=100; },
  step(t,dt,ctx){ const st=base(ctx), s=ctx.s, P=ctx.p, sg=s==="L"?1:-1; const st0={x:ctx.x,yaw:Math.PI/2};
    if(!ctx.F0){ ctx.F0=ctx["f"+s].clone(); ctx.P0=ctx["f"+P].clone(); ctx.fist=ctx.F0.clone().add(new THREE.Vector3(0,R_d(s),0)); }
    const cocked=bruteLocal(st0,sg*0.85,2.35,-0.7);
    // Norah: shooting it, standing there, or reading the wind-up and diving
    const shooting=ctx.out==="a";
    if(ctx.hitT==null){ if(shooting){ gunUp(); const rec=ctx.lastShot!=null?Math.max(0,1-(t-ctx.lastShot)/0.18):0; ctx.n={J:AIMP(rec)};
        if(t>0.7 && t<2.3 && (ctx.lastShot==null||t-ctx.lastShot>0.42)){ ctx.lastShot=t; muzzle(); cue("gunshot"); const p=new THREE.Vector3(); BR.B.torso.getWorldPosition(p); p.y+=0.3*Math.random(); blood(p,4,1.4,0.05); BS.twitch=1; ctx.hp-=4; dmg(`BRUTE −4 · ${ctx.hp}`,"shooting · she's standing still"); } }
      else if(ctx.out==="b" && t>1.95){ const k=t-1.95, u=easeOut(Math.min(1,k/0.45)); const J=NP.stumble(); J.aLx=J.aRx=-2.2*u; ctx.n={J:k<0.55?J:k<1.4?NP.lie(t,1,0.3):mix(NP.lie(t,1,0),NP.stand(),ss((k-1.4)/0.6)),x:NX+0.2,z:-1.9*u,y:0.3*Math.sin(Math.min(1,k/0.45)*Math.PI),fall:k<1.4?Math.min(1,k/0.35):1-ss((k-1.4)/0.6),roll:1.3*u*(k<1.4?1:1-ss((k-1.4)/0.6))}; if(k>0.42&&!ctx.dl){ ctx.dl=1; dust(new THREE.Vector3(NX+0.2,0,-1.9),0.7,4); cue("dives aside"); } }
      else ctx.n={J:NP.stand()}; }
    if(t<0.5){ ctx.phase="watching her"; return st; }
    // 1 · the long tell: rolls its weight onto one stump, the other rises and draws back, trembling
    if(t<2.15){ const u=ss((t-0.5)/1.3), tr=0.035*u*Math.sin(t*41);
      ctx["f"+P]=ctx.P0.clone().lerp(footSpot(st0,P,0.25,0.4),u); st.roll=(P==="L"?-1:1)*0.2*u; st.rootY=BR.shoulderY-0.15*u; st.pitch=-0.12*u; st.twist=sg*0.25*u; st.lift[s]=0.5*u;
      ctx.fist=ctx.F0.clone().add(new THREE.Vector3(0,R_d(s),0)).lerp(cocked,u).add(new THREE.Vector3(tr,tr*0.6,-tr)); st.fist={[s]:ctx.fist};
      ctx.sm=0.55*ss((t-1.45)/0.7); st.star={[s]:ctx.sm}; if(t>1.5&&!ctx.c6){ ctx.c6=1; cue("the stump's end swells into a ball"); }
      if(t>0.6&&!ctx.c1){ ctx.c1=1; cue("leans onto one stump · flesh creaks"); dust(ctx["f"+P].clone(),0.5,2); } if(t>1.55&&!ctx.c2){ ctx.c2=1; cue("skin pulls tight · tendons crackle"); BS.twitch=1; }
      if(t>=1.7 && !ctx.tgt){ ctx.tgt=noraPoint("chest").add(new THREE.Vector3(-0.1,0,0)); }   // it commits here
      ctx.phase=t<1.7?"leans onto one stump · draws back":"locked on · trembling"; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    const roll=(P==="L"?-1:1)*0.2; st.roll=roll; st.lift[s]=0.5;
    // 2 · the throw: the arm leaves its length behind
    if(ctx.hitT==null){ const u=Math.min(1,(t-2.15)/0.17), e=u*u; const end=ctx.out==="b"? ctx.tgt.clone().add(new THREE.Vector3(0.7,-ctx.tgt.y+0.15,0)) : ctx.tgt;
      ctx.fist=cocked.clone().lerp(end,e); st.fist={[s]:ctx.fist}; ctx.sm=0.55+0.45*u; st.star={[s]:ctx.sm}; st.pitch=0.35*e; st.twist=-sg*0.3*e; st.rootY=BR.shoulderY-0.15; ctx.phase="throws it · the flesh stretches";
      if(u<0.2&&!ctx.c3){ ctx.c3=1; cue("wet tearing stretch"); stumpSlam(ctx["f"+P],0.5); }
      if(u>=1){ ctx.hitT=t;
        if(ctx.out==="b"){ hitStop(0.08); camPunch(0.6); shake=Math.max(shake,0.35); stumpSlam(end,1); crack(end,1.1); debris(end,14,1.2); cue("fist buries in the floor"); }
        else { hitStop(0.2); camPunch(1.3); shake=Math.max(shake,0.65); cue("heavy crunch"); dmg("NORAH −55","punched clean off her feet"); const p=noraPoint("chest"); blood(p,20,3.5,0.08); dust(p,0.8,5); ring(new THREE.Vector3(NX,0.02,0),1.4);
          ctx.np=new THREE.Vector3(NX,0.9,0); ctx.nv=new THREE.Vector3(6.2,2.6,-sg*0.6); ctx.nf=0; } }
      return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    // 3 · stuck out there a moment, then the flesh snaps back like rubber
    const k=t-ctx.hitT, hold=ctx.out==="b"?0.85:0.3, end=ctx.fist0||(ctx.fist0=ctx.fist.clone());
    if(k<hold){ const q=ctx.out==="b"?0.03*Math.sin(k*38):0; ctx.fist=end.clone().add(new THREE.Vector3(0,q,0)); st.pitch=0.3; st.twist=-sg*0.3; ctx.phase=ctx.out==="b"?"fist stuck in the floor · open to shots":"holds out there"; if(ctx.out==="b"&&k>hold-0.12&&!ctx.tear){ ctx.tear=1; debris(end,8,1); dust(end,0.7,3); cue("tears it free"); } }
    else if(k<hold+0.5){ const u=(k-hold)/0.5; const back=cocked.clone().lerp(ctx.F0.clone().add(new THREE.Vector3(0,R_d(s),0)),0.5); const over=1.12*Math.sin(Math.min(1,u*1.35)*Math.PI/2); const e=Math.min(1,over)+Math.max(0,over-1)*-1;
      ctx.fist=end.clone().lerp(back,Math.min(1.08,easeOut(u)*1.08)); st.pitch=0.3*(1-u); st.twist=-sg*0.3*(1-u); ctx.phase="flesh snaps back";
      if(!ctx.c4){ ctx.c4=1; cue("rubbery snap"); shake=Math.max(shake,0.15); } if(Math.random()<0.4) drip(ctx.fist.clone()); }
    else { const u=ss((k-hold-0.5)/0.6); ctx.phase="settles back onto both stumps"; const back=cocked.clone().lerp(ctx.F0.clone().add(new THREE.Vector3(0,R_d(s),0)),0.5); const home=footSpot(st0,s,0);
      if(u<1){ ctx.fist=back.clone().lerp(home.clone().add(new THREE.Vector3(0,R_d(s),0)),u); } else { ctx["f"+s]=home; if(!ctx.c5){ ctx.c5=1; stumpSlam(home,0.6); } }
      ctx["f"+P]=footSpot(st0,P,0.25,0.4).lerp(ctx.P0,u); st.roll=roll*(1-u); st.lift[s]=0.5*(1-u); }
    if(ctx.fist && !(k>=hold+0.5 && ctx.c5)){ st.fist={[s]:ctx.fist}; st.star={[s]: k<hold?1: k<hold+0.5? 1-0.6*ss((k-hold)/0.5) : 0.4*(1-ss((k-hold-0.5)/0.5))}; }
    // Norah after a hit: thrown back, lands, skids
    if(ctx.np){ ctx.nv.y-=13*dt; ctx.np.addScaledVector(ctx.nv,dt); ctx.nf+=dt*6;
      if(ctx.np.y<=0.25 && ctx.nv.y<0){ ctx.np.y=0.25; if(!ctx.land){ ctx.land=1; dust(ctx.np.clone(),0.9,5); debris(ctx.np.clone(),5,0.8); cue("lands hard"); } ctx.nv.y=0; ctx.nv.x*=Math.pow(0.03,dt); ctx.nv.z*=Math.pow(0.03,dt); if(ctx.nv.length()>0.6&&Math.random()<0.5) dust(ctx.np.clone(),0.4,1); }
      const air=!ctx.land, J=air?NP.stumble():NP.lie(t,1,0.15); if(air){ J.aLx=J.aRx=-2.0; J.kL=J.kR=0.5; } if(nora.gun) nora.gun.visible=false;
      ctx.n={J,x:ctx.np.x,y:air?Math.max(0,ctx.np.y-0.9):0,z:ctx.np.z,fall:air?Math.min(1.5,0.3+ctx.nf*0.35):1,roll:air?Math.sin(ctx.nf)*0.4:0.2}; }
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
function R_d(s){ return BR.len["d"+s]; }
const ORDER=["walk","vault","sweep","slam","lunge","pin","charge","punch","weak","eat","gut"];

// ---------------------------------------------------------------- run it
const loader=new THREE.GLTFLoader(); const cache={};
const load=k=>cache[k]||(cache[k]=new Promise((res,rej)=>loader.load(k,res,undefined,rej)));
let nora=null, cur="walk", t=0, ctx={}, camMode="side", slow=false, playAll=false, gameT=0;
const orbit={yaw:0.9,pitch:0.18,drag:null};
async function setModel(key){ document.querySelectorAll(".splitOnly").forEach(e=>e.hidden=!key.includes("split")); document.getElementById("load").hidden=false; const g=await load(`m/bcross/brute/${key}.json`); if(BR){ scene.remove(BR.mesh); if(BR.sin) for(const k in BR.sin) scene.remove(BR.sin[k]); if(BR.star) for(const k in BR.star) scene.remove(BR.star[k]); } BR=autoRig(g); BR.uid=key; scene.add(BR.mesh); for(const s in BS) delete BS[s]; document.getElementById("load").hidden=true; start(cur); }
function start(a){ if(BR&&BR.sin) for(const k in BR.sin) BR.sin[k].visible=false; if(BR&&BR.star) for(const k in BR.star) BR.star[k].visible=false; if(WALL){ scene.remove(WALL.g); WALL=null; } cur=a; t=0; ctx={x:0,n:{}}; for(const q of fx) scene.remove(q.m); fx.length=0; clearGore(); BS.limp={L:false,R:false}; BS.lastRoot=null; BS.lastV=null; if(BR){ for(const l of BR.lumps){ l.burst=null; l.b.scale.setScalar(1); } for(const a of BR.arms) a.dead=false; for(const o of BR.organs||[]){ o.burst=null; o.b.scale.setScalar(1); } }
  if(nora&&nora.gun) nora.gun.visible=false; if((a==="eat"||a==="gut") && BR && !BR.jaw){ document.getElementById("oModel").value="brute_twoarm_m03_split"; ctx.wait=1; setModel("brute_twoarm_m03_split"); return; } A[a].start(ctx);
  for(const b of document.querySelectorAll(".anim")) b.setAttribute("aria-pressed",String(b.dataset.a===a)); document.getElementById("hName").textContent=A[a].name; document.getElementById("qte").hidden=true; document.getElementById("dmg").style.opacity=0; }
function frame(dtReal){
  if(!BR||!nora||ctx.wait) return;
  if(hold>0){ hold-=Math.min(0.05,dtReal); renderer.render(scene,cam); return; }
  const dt=Math.min(0.05,dtReal)*(slow?0.25:1); t+=dt; gameT+=dt; ctx.qte=null;
  const st=A[cur].step(t,dt,ctx); bruteFrame(st,dt);
  const showN = cur!=="walk" && cur!=="vault"; nora.group.visible=nora.shadow.visible=showN; if(showN) noraPose(ctx.n||{});
  burstLight.intensity=Math.max(0,burstLight.intensity-dtReal*40);
  stepFx(dt); stepGore(dt); if(showN) footDust(nora,dt);
  const q=document.getElementById("qte"); if(ctx.qte){ q.hidden=false; document.getElementById("qteBar").style.width=`${Math.round(sat(ctx.qte.fill)*100)}%`; document.getElementById("qteTxt").textContent=ctx.qte.txt; } else q.hidden=true;
  if(dmgT>0){ dmgT-=dt; if(dmgT<=0) document.getElementById("dmg").style.opacity=0; } if(cueT>0){ cueT-=dt; if(cueT<=0) document.getElementById("cue").style.opacity=0; }
  document.getElementById("hPh").textContent=ctx.phase||"—";
  if(t>A[cur].len){ if(playAll) start(ORDER[(ORDER.indexOf(cur)+1)%ORDER.length]); else start(cur); }
  const bx=st.x, fxx = camMode==="follow"? bx : showN ? (bx+NX)/2 : clamp(bx,-4,1.5);
  const wide=(cur==="charge"||cur==="punch")?Math.max(0,Math.abs(bx-NX)-2.5)*0.95:0; let p; if(camMode==="side") p=new THREE.Vector3(fxx,1.7+wide*0.08,8.2+wide); else if(camMode==="front") p=new THREE.Vector3(fxx+6.5,1.8,0.8);
  else if(camMode==="top") p=new THREE.Vector3(fxx+0.01,8,1.2); else if(camMode==="follow") p=new THREE.Vector3(bx-4.5,2.4,3.6);
  else p=new THREE.Vector3(fxx+Math.sin(orbit.yaw)*8*Math.cos(orbit.pitch),1.4+Math.sin(orbit.pitch)*8,Math.cos(orbit.yaw)*8*Math.cos(orbit.pitch));
  shake=Math.max(0,shake-dtReal*0.5); p.x+=(Math.random()-.5)*shake; p.y+=(Math.random()-.5)*shake;
  punch=Math.max(0,punch-dtReal*3.5); const fov=40-8*punch; if(Math.abs(cam.fov-fov)>0.01){ cam.fov=fov; cam.updateProjectionMatrix(); }
  cam.position.lerp(p,camMode==="follow"?0.2:1); cam.lookAt(fxx,1.3,0);
  renderer.render(scene,cam); }
let last=performance.now();
function loop(now){ requestAnimationFrame(loop); const w=canvas.clientWidth, h=canvas.clientHeight; if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){ renderer.setSize(w,h,false); cam.aspect=w/Math.max(1,h); cam.updateProjectionMatrix(); }
  frame((now-last)/1000); last=now; }
for(const b of document.querySelectorAll(".anim")) b.onclick=()=>{ playAll=false; document.getElementById("oAll").setAttribute("aria-pressed","false"); start(b.dataset.a); };
for(const b of document.querySelectorAll("[data-cam]")) b.onclick=()=>{ camMode=b.dataset.cam; for(const x of document.querySelectorAll("[data-cam]")) x.setAttribute("aria-pressed",String(x===b)); };
const tog=(id,f)=>{ const b=document.getElementById(id); b.onclick=()=>{ const on=b.getAttribute("aria-pressed")!=="true"; b.setAttribute("aria-pressed",String(on)); f(on); }; };
tog("oSlow",on=>slow=on); tog("oAll",on=>{ playAll=on; if(on) start(ORDER[0]); });
document.getElementById("oModel").onchange=e=>setModel(e.target.value);
canvas.addEventListener("pointerdown",e=>{ orbit.drag={x:e.clientX,y:e.clientY,yaw:orbit.yaw,pitch:orbit.pitch}; });
addEventListener("pointermove",e=>{ if(!orbit.drag||camMode!=="three") return; orbit.yaw=orbit.drag.yaw-(e.clientX-orbit.drag.x)*0.01; orbit.pitch=clamp(orbit.drag.pitch+(e.clientY-orbit.drag.y)*0.006,0.02,1.1); });
addEventListener("pointerup",()=>orbit.drag=null);
(async()=>{ try{ const ng=await load("m/cast/norah.json"); nora=makeChar(ng); await setModel("brute_twoarm_m01"); requestAnimationFrame(loop); }
  catch(e){ document.getElementById("load").textContent="Couldn't load the models: "+(e&&e.message||e); console.error(e); } })();
window.__bp={gap:s=>BS.lastGap&&BS.lastGap[s]!=null?BS.lastGap[s].toFixed(3):"-",start,get ctx(){return ctx;},get t(){return t;},frame,cam,renderer,scene,get BR(){return BR;},get nora(){return nora;}};
