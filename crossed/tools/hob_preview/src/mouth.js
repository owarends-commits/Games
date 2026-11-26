// ================================================================ the mouth arm (Hob rework, 2026-11-25)
// A giant arm the Hob coughs up out of its stomach: the gut convulses, it retches, bile and foam spurt from the gut and pour
// out of its unhinged jaw onto the floor, and the arm pushes up the throat and out. The arm has the body's cream skin, glossy
// with bile, ends in a long bony hand, and carries a closed snake eye that snaps open when it spots Norah. Smaller flesh
// arms branch off it, reaching away and grasping. It replaces the old one-handed grabs: the Hob keeps crawling on both hands
// while the arm reaches, catches her, and reels her back to its mouth (break free / shoot the eye, or it bites).
// Swallowed back in after every grab. Everything here is in the Hob's model space (it faces +z, y up).
const MA={on:false};
class Tube{   // a skinned-looking tube rebuilt each frame from a line of points (parallel-transport frames)
  constructor(N,S,mat,uRep=1){ this.N=N; this.S=S; const g=new THREE.BufferGeometry(), n=(N+1)*(S+1);
    g.setAttribute("position",new THREE.BufferAttribute(new Float32Array(n*3),3)); g.setAttribute("normal",new THREE.BufferAttribute(new Float32Array(n*3),3));
    const uv=new Float32Array(n*2); for(let i=0;i<=N;i++) for(let k=0;k<=S;k++){ uv[2*(i*(S+1)+k)]=k/S; uv[2*(i*(S+1)+k)+1]=i/N*uRep; } g.setAttribute("uv",new THREE.BufferAttribute(uv,2));
    const ix=[]; for(let i=0;i<N;i++) for(let k=0;k<S;k++){ const a=i*(S+1)+k, b=a+S+1; ix.push(a,b,a+1, a+1,b,b+1); } g.setIndex(ix);
    this.g=g; this.m=new THREE.Mesh(g,mat); this.m.frustumCulled=false; }
  set(pts,rad){ const N=this.N, S=this.S, P=this.g.attributes.position, Nn=this.g.attributes.normal; let nrm=null;
    for(let i=0;i<=N;i++){ const p=pts[i], tg=pts[Math.min(N,i+1)].clone().sub(pts[Math.max(0,i-1)]); if(tg.lengthSq()<1e-10) tg.set(0,0,1); tg.normalize();
      if(!nrm){ nrm=Math.abs(tg.y)<0.9?new V3(0,1,0):new V3(1,0,0); } nrm.sub(tg.clone().multiplyScalar(nrm.dot(tg))).normalize(); const bi=tg.clone().cross(nrm);
      for(let k=0;k<=S;k++){ const a=k/S*Math.PI*2, d=nrm.clone().multiplyScalar(Math.cos(a)).addScaledVector(bi,Math.sin(a)), r=rad[i]; const j=i*(S+1)+k;
        P.setXYZ(j,p.x+d.x*r,p.y+d.y*r,p.z+d.z*r); Nn.setXYZ(j,d.x,d.y,d.z); } }
    P.needsUpdate=true; Nn.needsUpdate=true; this.g.computeBoundingSphere(); this.frames={nrm}; } }
// a path through points, walked by arc length
function polyPath(ctrl,n=160){ const c=new THREE.CatmullRomCurve3(ctrl,false,"centripetal"), P=c.getSpacedPoints(n), L=[0]; for(let i=1;i<P.length;i++) L.push(L[i-1]+P[i].distanceTo(P[i-1]));
  return {P,L,len:L[L.length-1], at(s){ s=clamp(s,0,this.len); let lo=0,hi=this.L.length-1; while(hi-lo>1){ const m=(lo+hi)>>1; if(this.L[m]<s) lo=m; else hi=m; } const u=(s-this.L[lo])/((this.L[hi]-this.L[lo])||1); return this.P[lo].clone().lerp(this.P[hi],u); },
    tan(s){ return this.at(s+0.05).sub(this.at(s-0.05)).normalize(); } }; }
const snakeEyeTex=canvasTex(256,128,(g,w,h)=>{ const gr=g.createRadialGradient(64,64,4,64,64,62); gr.addColorStop(0,"#f2e24a"); gr.addColorStop(0.55,"#d8b21a"); gr.addColorStop(0.85,"#8a6a08"); gr.addColorStop(1,"#3a2a04");
  g.fillStyle="#1a1404"; g.fillRect(0,0,w,h); g.fillStyle=gr; g.beginPath(); g.arc(64,64,62,0,7); g.fill();
  g.strokeStyle="rgba(80,50,0,0.55)"; g.lineWidth=1; for(let i=0;i<40;i++){ const a=i/40*7; g.beginPath(); g.moveTo(64+Math.cos(a)*8,64+Math.sin(a)*14); g.lineTo(64+Math.cos(a)*58,64+Math.sin(a)*58); g.stroke(); }
  g.fillStyle="#050302"; g.beginPath(); g.ellipse(64,64,7,46,0,0,7); g.fill(); g.fillStyle="rgba(255,255,230,0.8)"; g.beginPath(); g.ellipse(50,44,6,4,-0.5,0,7); g.fill(); });
function setupMouthArm(){
  let skinPatch=lidMat&&lidMat.map; const img=skinMat&&skinMat.map&&skinMat.map.image;
  if(img&&img.width){ const c=document.createElement('canvas'); c.width=c.height=256; const g=c.getContext('2d'); const W=img.width, Hh=img.height; g.drawImage(img,0.02*W,0.52*Hh,0.2*W,0.2*Hh,0,0,256,256); skinPatch=new THREE.CanvasTexture(c); skinPatch.wrapS=skinPatch.wrapT=THREE.MirroredRepeatWrapping; skinPatch.repeat.set(2,1); } MA.armMat=new THREE.MeshPhongMaterial({map:skinPatch,color:0xf6e6bc,specular:0x9a9a60,shininess:110,side:THREE.DoubleSide});
  MA.boneMat=new THREE.MeshPhongMaterial({color:0xcbb98e,specular:0x8a8a6a,shininess:90});
  MA.fleshMat=new THREE.MeshPhongMaterial({color:0xe0b49a,specular:0x7a6050,shininess:80,side:THREE.DoubleSide});
  MA.bileMat=new THREE.MeshPhongMaterial({color:0xb6b22a,specular:0xffffcc,shininess:140,transparent:true,opacity:0.9});
  MA.foamMat=new THREE.MeshPhongMaterial({color:0xf0ecc0,specular:0xffffff,shininess:60,transparent:true,opacity:0.92});
  MA.root=new THREE.Group(); H.group.add(MA.root);
  MA.tube=new Tube(40,14,MA.armMat,8); MA.root.add(MA.tube.m);
  // the hand: a long bony palm and five three-jointed fingers with knuckles
  const hand=new THREE.Group(); MA.root.add(hand); MA.hand=hand; MA.fingers=[]; const handIn=new THREE.Group(); handIn.scale.setScalar(1.7); hand.add(handIn);
  const palmM=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.14,0.46),MA.armMat); palmM.position.z=0.21; handIn.add(palmM);
  for(let f=0;f<5;f++){ const thumb=f===4, x=thumb?0.27:-0.18+f*0.12, base=new THREE.Group(); base.position.set(x,0,thumb?0.12:0.42); base.rotation.y=thumb?0.9:(f-1.5)*0.26; handIn.add(base); const segs=[];
    let par=base; for(const [L,r] of (thumb?[[0.17,0.075],[0.14,0.068],[0.11,0.06]]:[[0.23,0.075],[0.18,0.066],[0.14,0.057]])){ const j=new THREE.Group(); par.add(j);
      const kn=new THREE.Mesh(new THREE.SphereGeometry(r*1.02,10,8),MA.boneMat); j.add(kn); const bn=new THREE.Mesh(new THREE.CylinderGeometry(r*0.8,r,L,8),MA.armMat); bn.rotation.x=Math.PI/2; bn.position.z=L/2; j.add(bn);
      const nx=new THREE.Group(); nx.position.z=L; j.add(nx); segs.push(j); par=nx; }
    const claw=new THREE.Mesh(new THREE.ConeGeometry(0.03,0.09,6),MA.boneMat); claw.rotation.x=Math.PI/2; claw.position.z=0.04; par.add(claw); MA.fingers.push({segs,thumb}); }
  // the snake eye on the forearm: a yellow slit eye under two heavy, shiny lids
  const eye=new THREE.Group(); MA.root.add(eye); MA.eye=eye; const ball=new THREE.Mesh(new THREE.SphereGeometry(0.19,24,16),new THREE.MeshPhongMaterial({map:snakeEyeTex,shininess:120,specular:0xffffff})); ball.rotation.y=-Math.PI/2; eye.add(ball); MA.ball=ball;
  const lid=(up)=>{ const g=new THREE.Group(); const m=new THREE.Mesh(new THREE.SphereGeometry(0.21,24,10,0,Math.PI*2,up?0:Math.PI/2,Math.PI/2),MA.armMat); m.rotation.z=Math.PI/2; g.add(m); eye.add(g); return g; };
  MA.lidU=lid(true); MA.lidD=lid(false); const rim=new THREE.Mesh(new THREE.TorusGeometry(0.21,0.05,8,24),MA.armMat); rim.rotation.y=Math.PI/2; eye.add(rim);
  MA.wound=new THREE.Mesh(new THREE.SphereGeometry(0.12,12,8),new THREE.MeshLambertMaterial({color:0x4a0606})); MA.wound.visible=false; eye.add(MA.wound);
  // the small arms: thin flesh arms off the big one, reaching away, each with a little three-fingered claw
  MA.kids=[]; for(let i=0;i<6;i++){ const tb=new Tube(10,7,MA.fleshMat,2); MA.root.add(tb.m); const cl=new THREE.Group(); MA.root.add(cl);
    for(let f=0;f<3;f++){ const fg=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.02,0.16,5),MA.fleshMat); fg.rotation.x=Math.PI/2; const piv=new THREE.Group(); piv.rotation.y=(f-1)*0.5; fg.position.z=0.08; piv.add(fg); cl.add(piv); }
    MA.kids.push({tb,cl,at:0.18+i*0.11,side:i%2?1:-1,ph:i*1.9,len:1.7+0.35*Math.sin(i*2.3)}); cl.scale.setScalar(2.2); }
  MA.drops=[]; MA.puddle=null; hideMouthArm(); }
function hideMouthArm(){ if(!MA.root) return; MA.root.visible=false; for(const d of MA.drops) d.m.parent&&d.m.parent.remove(d.m); MA.drops.length=0; if(MA.puddle){ scene.remove(MA.puddle); MA.puddle=null; } if(MA.wound) MA.wound.visible=false; if(MA.ball) MA.ball.visible=true; MA.on=false; }
// where the mouth is: between the lips (half on the head, half on the jaw), and the way out of it
function mouthM(){ H.group.updateMatrixWorld(true); const a=w2m(H.B.head.localToWorld(H.B.head.worldToLocal(m2w(new V3(0,0.66,1.05))).clone())); return a; }
function mouthNow(ctx){ if(!ctx.mo){ resetBones(); H.group.updateMatrixWorld(true); ctx.mo={h:H.B.head.worldToLocal(m2w(new V3(0,0.66,1.0))), j:H.B.jaw.worldToLocal(m2w(new V3(0,0.46,1.0)))}; }
  H.group.updateMatrixWorld(true); const a=w2m(H.B.head.localToWorld(ctx.mo.h.clone())), b=w2m(H.B.jaw.localToWorld(ctx.mo.j.clone())); return a.add(b).multiplyScalar(0.5); }
// the retch: the gut convulses, the spine heaves, the head jerks forward, the jaw unhinges
function retch(t,k,jaw,ctx){ if(k<=0&&jaw<=0) return; const hv=Math.max(0,Math.sin(t*9))**3*k;
  H.B.spine1.quaternion.premultiply(qE(-0.16*hv,0,0.02*Math.sin(t*23)*k)); H.B.spine2.quaternion.premultiply(qE(0.22*hv,0,0)); H.B.spine3.quaternion.premultiply(qE(-0.1*hv,0,0));
  H.B.root.position.y+=0.1*hv; H.B.head.quaternion.premultiply(qE(0.18*hv-0.12*jaw,0.04*Math.sin(t*17)*k,0)); H.B.jaw.quaternion.premultiply(qE(1.05*jaw+0.12*hv,0,0.05*Math.sin(t*13)*jaw));
  ctx.pulseK=1+2.2*k; ctx.lumpK=1+1.4*k; ctx.heart=1.4+2.0*k; ctx.squirm=1+3*k; ctx.heave=hv; }
// bile and foam
const dropGeo=new THREE.SphereGeometry(1,7,5);
function bile(p,v,size,foam,stick=0){ const m=new THREE.Mesh(dropGeo,foam?MA.foamMat:MA.bileMat); m.scale.setScalar(size); m.position.copy(p); MA.root.add(m); MA.drops.push({m,v:v.clone(),t:0,life:foam?2.6:1.8,foam,stick,size}); }
function pour(mo,dt,rate,ctx){ let n=rate*dt; ctx.pacc=(ctx.pacc||0)+n; while(ctx.pacc>=1){ ctx.pacc-=1; const f=Math.random()<0.35;
  bile(mo.clone().add(new V3((Math.random()-.5)*0.4,-0.08,(Math.random()-.2)*0.25)),new V3((Math.random()-.5)*0.5,-0.4-Math.random()*0.8,0.5+Math.random()*1.2),f?0.03+Math.random()*0.04:0.018+Math.random()*0.03,f,f?0.5*Math.random():0); } }
function gutSpit(dt,rate,ctx){ ctx.gacc=(ctx.gacc||0)+rate*dt; while(ctx.gacc>=1){ ctx.gacc-=1; const z=-2.2-Math.random()*2.2, sd=Math.random()<0.5?-1:1;
  const p=new V3(sd*0.28,0.75+Math.random()*0.3,z); bile(p,new V3(sd*(0.8+Math.random()*1.5),0.4+Math.random()*1.2,(Math.random()-.5)*0.6),0.02+Math.random()*0.035,Math.random()<0.5); } }
function stepBile(dt){ for(let i=MA.drops.length-1;i>=0;i--){ const d=MA.drops[i]; d.t+=dt;
    if(d.stick>0){ d.stick-=dt; d.v.multiplyScalar(0.2); } else { d.v.y-=9.8*dt*(d.foam?0.55:1); d.m.position.addScaledVector(d.v,dt); }
    if(d.m.position.y<0.02){ d.m.position.y=0.02; growPuddle(d.m.position,d.size); MA.root.remove(d.m); MA.drops.splice(i,1); continue; }
    if(d.t>d.life){ MA.root.remove(d.m); MA.drops.splice(i,1); } } }
function growPuddle(pm,size){ const w=m2w(pm); if(!MA.puddle){ MA.puddle=new THREE.Group(); scene.add(MA.puddle); MA.puddle.userData.area=0; MA.puddle.userData.blobs=[]; }
  const P=MA.puddle, B=P.userData.blobs; P.userData.area+=size*size*9;
  let near=B.find(q=>Math.hypot(q.x-w.x,q.z-w.z)<q.r*0.8);
  if(!near&&B.length<14){ const sh=new THREE.Shape(); const n=18; for(let i=0;i<=n;i++){ const a=i/n*Math.PI*2, r=1+0.22*Math.sin(a*3+B.length)+0.12*Math.sin(a*5+B.length*2); i?sh.lineTo(Math.cos(a)*r,Math.sin(a)*r):sh.moveTo(Math.cos(a)*r,Math.sin(a)*r); }
    const m=new THREE.Mesh(new THREE.ShapeGeometry(sh),new THREE.MeshPhongMaterial({color:0x5e5a14,specular:0xeeeebb,shininess:160,transparent:true,opacity:0.78,depthWrite:false}));
    m.rotation.x=-Math.PI/2; m.position.set(w.x,0.011+B.length*0.0004,w.z); P.add(m); near={x:w.x,z:w.z,r:0.08,m}; B.push(near); }
  if(near){ near.r=Math.min(1.1,Math.sqrt(near.r*near.r+size*size*6)); near.m.scale.set(near.r,near.r*0.8,1); } }
// pose the arm: its tip ("s" metres along the path from the gut) and where the path heads after the mouth
function poseArm(t,dt,ctx,s,aim,o={}){ MA.root.visible=true; MA.on=true; const mo=mouthNow(ctx), wav=o.wave??1;
  const out=aim.clone().sub(mo); out.y=Math.max(out.y,-0.3); const reach=out.length(), dir=out.clone().normalize();
  const ctrl=[new V3(0,1.0,-2.8),new V3(0,0.98,-1.6),new V3(0,0.7,-0.2),mo.clone().addScaledVector(dir,-0.3),mo.clone(),mo.clone().addScaledVector(dir,Math.min(1.2,reach*0.35)).add(new V3(0,0.55,0))];
  const G=o.grip?gripFrame(o.grip.C,o.grip.n):null, gk=o.gripK??(G?1:0);
  if(G&&gk>0.01){ const hi=G.W.clone().addScaledVector(G.n,0.9).add(new V3(0,1.25,0)), lo=G.W.clone().addScaledVector(G.n,0.32).add(new V3(0,0.38,0)), endP=aim.clone().lerp(G.W,gk);
    if(reach>2.2) ctrl.push(mo.clone().lerp(hi,0.55).add(new V3(0,0.35,0))); ctrl.push(hi.lerp(endP.clone().add(new V3(0,1.0,0)),1-gk)); ctrl.push(lo.lerp(endP,1-gk)); ctrl.push(endP); }
  else ctrl.push(aim.clone());
  const path=polyPath(ctrl); MA.path=path; let bi=0,bd=1e9; path.P.forEach((q,i)=>{ const d=q.distanceToSquared(mo); if(d<bd){ bd=d; bi=i; } }); const sMouth=path.L[bi];
  ctx.sMouth=sMouth; if(o.full) s=path.len; s=Math.min(s,path.len); const N=MA.tube.N, pts=[], rad=[];
  for(let i=0;i<=N;i++){ const u=s*i/N, p=path.at(u), outK=sat((u-sMouth)/1.2)*sat((s-u)/0.8);
    const tg=path.tan(u), side=tg.clone().cross(UP).normalize(); p.addScaledVector(side,wav*0.22*outK*Math.sin(u*2.3-t*3.1)); p.y+=wav*0.12*outK*Math.sin(u*1.7-t*2.3+1);
    pts.push(p); rad.push((0.21+0.2*sat((s-u)/1.8)+0.035*Math.sin(u*9))*(0.55+0.45*sat((s-u)/0.35))); }
  MA.tube.set(pts,rad); MA.pts=pts;
  // the hand at the tip
  const tip=pts[N], tg=pts[N].clone().sub(pts[N-2]).normalize(); MA.hand.position.copy(tip); const m=new THREE.Matrix4(), upv=o.palmUp?UP.clone():UP.clone().negate();
  const x=upv.clone().cross(tg).normalize(), y=tg.clone().cross(x).normalize(); m.makeBasis(x,y,tg); const qT=new Q4().setFromRotationMatrix(m).normalize();
  if(G&&gk>0.01){ const qG=new Q4().setFromRotationMatrix(new THREE.Matrix4().makeBasis(G.n.clone().cross(G.side).normalize(),G.n,G.side)).normalize(); MA.hand.quaternion.copy(qT).slerp(qG,ss(gk)); } else MA.hand.quaternion.copy(qT);
  const curlK=o.curl??0.25; MA.fingers.forEach((f,fi)=>{ const jig=0.08*Math.sin(t*6+fi)*(1-sat(curlK)); f.segs.forEach((j,k)=>{ j.rotation.x=(f.thumb?0.75:1)*curlK*[0.75,1.2,1.05][k]+jig; }); });
  // the eye, on top of the forearm 1.8 m back from the hand
  const ue=Math.max(0,s-1.8), ei=Math.round(ue/s*N), ep=pts[ei].clone(), et=path.tan(ue), en=UP.clone().sub(et.clone().multiplyScalar(et.y)).normalize();
  MA.eye.position.copy(ep.addScaledVector(en,rad[ei]*0.75)); const em=new THREE.Matrix4(), ex=et.clone().cross(en).normalize(); em.makeBasis(et,en,ex); MA.eye.quaternion.setFromRotationMatrix(em);
  const open=o.eye??0; MA.lidU.rotation.z=-1.25*open; MA.lidD.rotation.z=1.25*open; MA.eye.visible=s-1.8>sMouth-0.2;
  if(o.look&&open>0.2){ const q=MA.eye.getWorldQuaternion(new Q4()).invert(), d=m2w(o.look).sub(MA.eye.getWorldPosition(new V3())).applyQuaternion(q).normalize(); MA.ball.rotation.set(0,Math.atan2(-d.z,d.x),Math.asin(clamp(d.y,-1,1))*0.6); }
  // the small arms: off the forearm and upper arm, reaching away from where the big one goes, grasping at the air
  for(const k of MA.kids){ const u=s*k.at+s*0.25, show=u>sMouth+0.3&&s>sMouth+1.2; k.tb.m.visible=k.cl.visible=show; if(!show) continue;
    const i0=Math.round(u/s*N), base=pts[i0].clone(), at=path.tan(u), side=at.clone().cross(UP).normalize().multiplyScalar(k.side), back=at.clone().negate();
    const unf=sat((s-sMouth-1.2)/1.4), dirk=side.clone().multiplyScalar(0.8).add(back.multiplyScalar(0.5)).add(new V3(0,0.45,0)).normalize(), L=k.len*unf, P2=[], R2=[];
    for(let j=0;j<=10;j++){ const v=j/10, w=Math.sin(t*4+k.ph+v*3)*0.12*v; P2.push(base.clone().addScaledVector(dirk,L*v).addScaledVector(side,w).add(new V3(0,-0.25*v*v*L+0.08*Math.sin(t*5+k.ph)*v,0))); R2.push(0.1*(1-0.6*v)+0.015); }
    k.tb.set(P2,R2); k.cl.position.copy(P2[10]); k.cl.lookAt(m2w(P2[10].clone().add(P2[10].clone().sub(P2[8])))); k.cl.quaternion.premultiply(H.group.getWorldQuaternion(new Q4()).invert());
    const g=0.4+0.4*Math.sin(t*7+k.ph); k.cl.children.forEach((pv,f)=>{ pv.rotation.x=g; }); }
  return {tip, sMouth, len:path.len}; }
// ---------------------------------------------------------------- the grip: the palm on her front, the long fingers wrapping round her side and back
// C: her torso centre; n: the level direction from her to the Hob's mouth. The hand's fingers run along "side" and curl back
// towards her (the hand's -y faces her), so they close round her; the wrist sits beside her, so the arm never goes through her.
const HAND_S=1.7, PALM_OFF=0.21*HAND_S, PALM_FRONT=0.3;
function gripFrame(C,n0){ const n=new V3(n0.x,0,n0.z).normalize(), side=n.clone().cross(UP).normalize(), palm=C.clone().addScaledVector(n,PALM_FRONT); return {C,n,side,palm,W:palm.clone().addScaledVector(side,-PALM_OFF)}; }
const ease=(a,b,dt,k)=>a+(b-a)*(1-Math.exp(-dt*k));
// ---------------------------------------------------------------- the grab: cough up, search, spot, rear back, lunge, catch, reel in; then bite or the eye-shot escape
function mouthGrab(t,dt,ctx,variant){
  const T={retch:1.2,cough:2.7,search:3.5,spot:4.6,rear:4.95,lunge:5.15,catch:5.75,reel:6.0,bite:8.6,shot:7.1,done:10.4};
  const relT=variant==="bite"?T.bite+0.55:T.shot+0.15;
  // the body keeps coming: a steady crawl, slower while it retches and while it hauls her in
  const slowK=t>T.retch&&t<T.search?0.5:t>T.catch?0.65:1; ctx.cx=(ctx.cx??0)+dt*slowK; const X=crawl(ctx.cx,dt,ctx,2.8,0); H.group.position.x=X;
  const k=ss((t-T.retch)/0.4)*(1-ss((t-T.search)/0.6))+(t>relT&&t<T.done?0.8*(1-ss((t-relT)/1.4)):0);
  const jaw=ss((t-T.retch-0.5)/1.0)*(1-ss((t-T.done+0.6)/0.6))*(variant==="bite"&&t>T.bite&&t<T.bite+0.3?1-ss((t-T.bite)/0.1):1);
  retch(t,k,jaw,ctx); H.group.updateMatrixWorld(true);
  const her=ctx.herW=ctx.herW||new V3(H.group.position.x+6.6,0,0.35); const mo=mouthNow(ctx), sM=ctx.sMouth||5;
  const herC=()=>w2m(her).add(new V3(0,1.02,0)), nTo=(C)=>{ const v=mo.clone().sub(C); v.y=0; return v.normalize(); };
  ctx.S=ctx.S??0; ctx.A=ctx.A||mo.clone().add(new V3(0,0.4,2)); let sT=0, aT=null, o={eye:0,curl:0.3,look:null,full:false};
  if(t<T.retch){ ctx.phase="crawls after her · the arm is swallowed"; }
  else if(t<T.cough){ ctx.phase="its gut convulses · it retches · bile spits from its gut · the jaw unhinges"; gutSpit(dt,60*k,ctx); if(t>T.cough-0.6) pour(mo,dt,90,ctx); }
  else if(t<T.search){ const u=ss((t-T.cough)/0.75); sT=sM-0.4+2.4*u; aT=mo.clone().add(new V3(Math.sin(t*1.3)*1.0,0.6,2.6)); pour(mo,dt,220*(1-u*0.5),ctx); gutSpit(dt,25,ctx); o.curl=0.5; ctx.phase="it coughs the arm up · bile and foam pour from its mouth"; }
  else if(t<T.spot){ sT=sM+2.4+0.35*Math.sin((t-T.search)*2); aT=mo.clone().add(new V3(Math.sin(t*1.5)*1.6,0.45+0.3*Math.sin(t*2.1),3.0)); pour(mo,dt,30,ctx); o.curl=0.35; ctx.phase="the arm searches · its eye still shut"; }
  else if(t<T.lunge){ // the eye snaps open; the arm draws back and up, gathering itself
    o.eye=ss((t-T.spot)/0.12); o.look=herC(); const r=ss((t-T.spot)/(T.rear-T.spot)); sT=sM+2.4-0.9*r; aT=mo.clone().add(new V3(0,0.9+0.9*r,2.2-0.6*r)).lerp(herC(),0.15); o.curl=0.2-0.35*r;
    ctx.phase="the snake eye snaps open · the arm draws back"; if(!ctx.sp1){ ctx.sp1=1; camPunch(0.4); } }
  else if(t<T.catch){ // the lunge: up and over, then down onto her, the hand turning into the grip, fingers spread wide
    const u=(t-T.lunge)/(T.catch-T.lunge); const C=herC(); o.grip={C,n:nTo(C)}; o.gripK=ss(u*1.25); o.full=u>0.55; o.eye=1; o.look=C; o.curl=-0.2+0.15*u;
    sT=sM+1.5+((ctx.lastLen||sM+5)-sM-1.5)*easeOut(u); aT=gripFrame(C,nTo(C)).W; pour(mo,dt,140,ctx); ctx.phase="it lunges · up and over and down onto her"; }
  else if(t<relT){ // caught: the fingers clamp round her; it lifts her and hauls her to its mouth
    if(!ctx.C0){ ctx.C0=herC(); ctx.Cend=mo.clone().add(nTo(ctx.C0).negate().multiplyScalar(1.15)).add(new V3(0,0.15,0)); shake=0.25; camPunch(0.5); }
    const e=ss((t-T.reel)/((variant==="bite"?T.bite:T.shot+0.6)-T.reel)), lift=0.45*ss((t-T.catch)/0.5);
    const C=ctx.C0.clone().lerp(ctx.Cend,variant==="esc"?Math.min(e,0.55):e).add(new V3(0.05*Math.sin(t*13),lift+0.35*Math.sin(Math.PI*e)+0.04*Math.sin(t*9),0.06*Math.sin(t*11)));
    ctx.Ccur=C; o.grip={C,n:nTo(C)}; o.gripK=1; o.full=true; o.eye=1; o.look=C; o.curl=1.15*ss((t-T.catch)/0.22); aT=gripFrame(C,nTo(C)).W; sT=999;
    pour(mo,dt,20,ctx); ctx.phase=variant==="esc"&&t>T.shot-0.6?"she twists round and aims at its eye":"its fingers clamp round her · it hauls her to its mouth"; }
  else { // let go; the arm is swallowed back down, gagging
    const r=ss((t-relT)/1.3); if(!ctx.Lrel) ctx.Lrel=ctx.lastLen||sM+3; sT=ctx.Lrel*(1-r); aT=ctx.A.clone(); o.curl=-0.1; o.eye=variant==="esc"?0:1-r; pour(mo,dt,60*(1-r),ctx);
    ctx.phase=variant==="esc"?"the eye bursts · the arm spasms open and is swallowed back down":"it swallows the arm back down, gagging"; }
  if(aT){ if(t<T.lunge||t>=relT){ ctx.A.x=ease(ctx.A.x,aT.x,dt,6); ctx.A.y=ease(ctx.A.y,aT.y,dt,6); ctx.A.z=ease(ctx.A.z,aT.z,dt,6); } else ctx.A.copy(aT); }
  ctx.S=t>=T.lunge&&t<relT?sT:ease(ctx.S,sT,dt,t>=relT?5:7);
  if(ctx.S>0.05){ const R=poseArm(t,dt,ctx,Math.min(ctx.S,999),ctx.A,o); if(t<relT) ctx.lastLen=Math.min(ctx.S,R.len); }
  else { MA.root.visible=false; if(!ctx.sMouth){ poseArm(t,dt,ctx,0.01,mo.clone().add(new V3(0,0,3)),{}); MA.root.visible=false; } }
  stepBile(dt);
  // Norah
  let pose="walk", hp=her.clone(), look=0;
  if(t<T.catch-0.05){ her.x+=dt*(t<T.spot?0.55:0.9); hp=her.clone(); pose=t<T.spot?"walk":"backstep"; look=1; }
  else if(t<relT){ const C=m2w(ctx.Ccur||herC()); hp=new V3(C.x,Math.max(0,C.y-1.02),C.z); her.copy(hp); pose=variant==="esc"&&t>T.shot-0.6?"held":"dragged"; }
  else if(variant==="bite"){ if(!ctx.bit){ ctx.bit=1; shake=0.5; camPunch(0.9); hitStop(0.12); blood(m2w(mo),40,3.2,0.08); } her.y=Math.max(0,her.y-dt*3); hp=her.clone(); pose="fall"; }
  else { her.y=Math.max(0,her.y-dt*3); her.x+=dt*(t>T.shot+1.0?1.6:0); hp=her.clone(); pose=t<T.shot+1.0?"fall":"walk"; }
  if(variant==="esc"&&t>=T.shot&&!ctx.shotDone){ ctx.shotDone=1; const ew=MA.eye.getWorldPosition(new V3()); fireAt(ew,true); blood(ew,30,2.4,0.06); for(let i=0;i<14;i++) bile(w2m(ew),new V3((Math.random()-.5)*2,Math.random()*2,(Math.random()-.5)*2),0.03,false); MA.ball.visible=false; MA.wound.visible=true; shake=0.35; hitStop(0.1); }
  ctx.her={m:w2m(hp),pose,ph:t*1.1,look,k:ss((t-relT)/0.5),aim:pose==="held"?MA.eye.getWorldPosition(new V3()):null,faceIt:pose==="held"||pose==="dragged"||pose==="backstep"};
  const hw=m2w(mo), hwp=hp.clone(), mid=hw.clone().lerp(hwp,0.45), span=Math.max(4,Math.abs(hwp.x-hw.x)); ctx.camS=ctx.camS||mid.clone(); ctx.camS.lerp(mid,Math.min(1,dt*2.5));
  ctx.cam={p:new V3(ctx.camS.x+1.2,2.6+0.12*span,4.8+0.75*span),look:new V3(ctx.camS.x-0.3,1.1,0)}; }
A.mouth={ name:"Mouth arm grab · the bite", len:11.5, start(ctx){ ctx.x0=-4; ctx.heart=1.3; hideMouthArm(); }, step(t,dt,ctx){ mouthGrab(t,dt,ctx,"bite"); } };
A.mouthEsc={ name:"Mouth arm grab · shot in the eye", len:10.5, start(ctx){ ctx.x0=-4; ctx.heart=1.3; hideMouthArm(); }, step(t,dt,ctx){ mouthGrab(t,dt,ctx,"esc"); } };
