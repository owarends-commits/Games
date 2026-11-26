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
  // the snake eyes: the main one in the palm (user, 2026-11-26), three more scattered along the arm. Yellow slit eyes under
  // heavy, shiny lids; all shut while it searches, all snapping open when it spots her
  const makeEye=(parent,r)=>{ const g=new THREE.Group(); parent.add(g); const ball=new THREE.Mesh(new THREE.SphereGeometry(r,24,16),new THREE.MeshPhongMaterial({map:snakeEyeTex,shininess:120,specular:0xffffff})); ball.rotation.y=Math.PI/2; const piv=new THREE.Group(); piv.rotation.x=Math.PI/2; piv.add(ball); g.add(piv);   /* turned about its look axis: the slit stands upright between the lids */   /* the iris (texture u 0.25) faces the eye's look axis, +x */
    const lid=(up)=>{ const q=new THREE.Group(); const m=new THREE.Mesh(new THREE.SphereGeometry(r*1.12,24,10,Math.PI/2,Math.PI,up?0:Math.PI/2,Math.PI/2),MA.armMat); q.add(m); g.add(q); return q; };   /* upper / lower lid over the front (+x) of the eye */
    const lidU=lid(true), lidD=lid(false); const rim=new THREE.Mesh(new THREE.TorusGeometry(r*1.12,r*0.27,8,24),MA.armMat); rim.rotation.y=Math.PI/2; g.add(rim);
    const wound=new THREE.Mesh(new THREE.SphereGeometry(r*0.92,12,8),new THREE.MeshLambertMaterial({color:0x4a0606})); wound.visible=false; g.add(wound); return {g,ball,lidU,lidD,wound}; };
  MA.palmEye=makeEye(handIn,0.085); MA.palmEye.g.position.set(0,-0.05,0.21); MA.palmEye.g.rotation.z=-Math.PI/2;   /* its look axis (x) straight out of the palm (-y) */   // facing out of the palm
  MA.armEyes=[[0.95,0.5],[2.15,-1.9],[3.35,2.5]].map(([d,ang])=>Object.assign(makeEye(MA.root,0.095),{d,ang}));
  MA.eyes=[MA.palmEye,...MA.armEyes]; MA.eye=MA.armEyes[0].g;   /* the one she can shoot while the palm is pressed against her */
  // the small arms: thin flesh arms off the big one, reaching away, each with a little three-fingered claw
  MA.kids=[]; for(let i=0;i<6;i++){ const tb=new Tube(10,7,MA.fleshMat,2); MA.root.add(tb.m); const cl=new THREE.Group(); MA.root.add(cl);
    for(let f=0;f<3;f++){ const fg=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.02,0.16,5),MA.fleshMat); fg.rotation.x=Math.PI/2; const piv=new THREE.Group(); piv.rotation.y=(f-1)*0.5; fg.position.z=0.08; piv.add(fg); cl.add(piv); }
    MA.kids.push({tb,cl,at:0.18+i*0.11,side:i%2?1:-1,ph:i*1.9,len:0.95+0.2*Math.sin(i*2.3)}); cl.scale.setScalar(1.2); }
  // the cross on its lower cheek (user, 2026-11-26): a burning brand, easy to see; two shots to it break the grab
  { resetBones(); H.group.updateMatrixWorld(true); const B=H.base, n=B.length/3, tx=0.4, ty=0.82; let best=null, bz=-1e9;
    for(let i=0;i<n;i++){ const x=B[3*i], y=B[3*i+1], z=B[3*i+2]; if(Math.abs(x-tx)<0.08&&Math.abs(y-ty)<0.08&&z>bz){ bz=z; best=new V3(x,y,z); } }
    const P=best||new V3(tx,ty,1.0), nrm=new V3(0.35,-0.05,1).normalize(); const g=new THREE.Group(); const mat=new THREE.MeshPhongMaterial({color:0x2a0603,emissive:0xff4a10,emissiveIntensity:1.2,shininess:20});
    const bar=(w,h)=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,0.04),mat); g.add(m); return m; }; bar(0.1,0.5).position.y=-0.03; bar(0.36,0.1).position.y=0.09;
    const scar=new THREE.Mesh(new THREE.CircleGeometry(0.36,24),new THREE.MeshLambertMaterial({color:0x3a1208,transparent:true,opacity:0.55,depthWrite:false})); scar.position.z=-0.015; g.add(scar);
    const wp=m2w(P.clone().addScaledVector(nrm,0.012)); H.B.head.add(g); g.position.copy(H.B.head.worldToLocal(wp)); g.lookAt(m2w(P.clone().addScaledVector(nrm,2)));
    MA.cheekCross=g; MA.cheekMat=mat; }
  MA.drops=[]; MA.puddle=null; hideMouthArm(); }
function hideMouthArm(){ if(!MA.root) return; MA.root.visible=false; if(H&&H.ins) H.ins.visible=true; if(H&&H.mesh){ const th=[].concat(H.mesh.material)[1]; if(th&&th.transparent) th.opacity=0.6; } if(MA.hand) MA.hand.visible=true; for(const d of MA.drops) d.m.parent&&d.m.parent.remove(d.m); MA.drops.length=0; if(MA.puddle){ scene.remove(MA.puddle); MA.puddle=null; } if(MA.eyes) for(const E of MA.eyes){ E.wound.visible=false; E.ball.visible=true; } MA.on=false; }
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
    pts.push(p); rad.push((0.12+0.1*sat((s-u)/1.8)+0.02*Math.sin(u*9))*(0.7+0.3*sat((s-u)/0.35))); }
  MA.tube.set(pts,rad); MA.pts=pts;
  // the hand at the tip
  const tip=pts[N], tg=pts[N].clone().sub(pts[N-2]).normalize(); MA.hand.position.copy(tip); const m=new THREE.Matrix4(), upv=o.palmUp?UP.clone():UP.clone().negate();
  const x=upv.clone().cross(tg).normalize(), y=tg.clone().cross(x).normalize(); m.makeBasis(x,y,tg); let qT=new Q4().setFromRotationMatrix(m).normalize();
  if(o.palmAt){ // the palm held up toward her, fingers splayed upward, so the palm's eye is what looks at her
    const nP=tip.clone().sub(o.palmAt); nP.y=0; nP.normalize(); const Z=UP.clone().multiplyScalar(0.86).addScaledVector(nP,-0.5).normalize(), Y=nP.clone().sub(Z.clone().multiplyScalar(nP.dot(Z))).normalize(), X=Y.clone().cross(Z).normalize();
    const qP=new Q4().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X,Y,Z)).normalize(); qT=qT.clone().slerp(qP,o.palmK??1); }
  if(G&&gk>0.01){ const qG=new Q4().setFromRotationMatrix(new THREE.Matrix4().makeBasis(G.n.clone().cross(G.side).normalize(),G.n,G.side)).normalize(); MA.hand.quaternion.copy(qT).slerp(qG,ss(gk)); } else MA.hand.quaternion.copy(qT);
  const curlK=o.curl??0.25; MA.fingers.forEach((f,fi)=>{ const jig=0.08*Math.sin(t*6+fi)*(1-sat(curlK)); f.segs.forEach((j,k)=>{ j.rotation.x=(f.thumb?0.75:1)*curlK*[0.75,1.2,1.05][k]+jig; }); });
  // the eye, on top of the forearm 1.8 m back from the hand
  const ue=Math.max(0,s-1.8), ei=Math.round(ue/s*N), ep=pts[ei].clone(), et=path.tan(ue), en=UP.clone().sub(et.clone().multiplyScalar(et.y)).normalize();
  const open=o.eye??0;
  for(const E of MA.armEyes){ const u=Math.max(0,s-E.d), ei=Math.min(N,Math.round(u/s*N)), et=path.tan(u), up0=UP.clone().sub(et.clone().multiplyScalar(et.y)).normalize(), bx=et.clone().cross(up0);
    const en=up0.clone().multiplyScalar(Math.cos(E.ang)).addScaledVector(bx,Math.sin(E.ang)).normalize(); E.g.position.copy(pts[ei]).addScaledVector(en,rad[ei]*0.8);
    E.g.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(et,en,et.clone().cross(en).normalize())); E.g.visible=u>sMouth+0.2; }
  for(const E of MA.eyes){ E.lidU.rotation.z=1.3*open; E.lidD.rotation.z=-1.3*open;
    if(o.look&&open>0.2&&E.ball.visible){ E.g.updateMatrixWorld(true); const q=E.ball.parent.getWorldQuaternion(new Q4()).invert(), d=m2w(o.look).sub(E.g.getWorldPosition(new V3())).applyQuaternion(q).normalize(); E.ball.rotation.set(0,Math.PI/2+clamp(Math.atan2(-d.z,d.x),-0.9,0.9),Math.asin(clamp(d.y,-1,1))*0.6); } }
  // the small arms: off the forearm and upper arm, reaching away from where the big one goes, grasping at the air
  for(const k of MA.kids){ const u=s*k.at+s*0.25, show=u>sMouth+0.3&&s>sMouth+1.2; k.tb.m.visible=k.cl.visible=show; if(!show) continue;
    const i0=Math.round(u/s*N), base=pts[i0].clone(), at=path.tan(u), side=at.clone().cross(UP).normalize().multiplyScalar(k.side), back=at.clone().negate();
    const unf=sat((s-sMouth-1.2)/1.4), dirk=side.clone().multiplyScalar(0.8).add(back.multiplyScalar(0.5)).add(new V3(0,0.45,0)).normalize(), L=k.len*unf, P2=[], R2=[];
    for(let j=0;j<=10;j++){ const v=j/10, w=Math.sin(t*4+k.ph+v*3)*0.12*v; P2.push(base.clone().addScaledVector(dirk,L*v).addScaledVector(side,w).add(new V3(0,-0.25*v*v*L+0.08*Math.sin(t*5+k.ph)*v,0))); R2.push(0.045*(1-0.6*v)+0.008); }
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
  const T={retch:1.2,cough:2.7,search:3.5,spot:4.6,rear:4.95,lunge:8.2,catch:8.65,reel:8.9,bite:11.4,shot:10.0,shot2:10.75,done:13.2,writhe:2.1,suck:0.8};   /* rear..lunge: the long slow snaking reach */
  const relT=variant==="esc"?T.shot2+0.1:variant==="digest"?T.bite+1.5:T.bite+0.55;
  // the body keeps coming: a steady crawl, slower while it retches and while it hauls her in
  const slowK=variant==="digest"&&t>T.bite?0:variant==="esc"&&t>T.shot&&t<relT+T.writhe+T.suck*0.6?0.15:variant==="esc"&&t>=relT+T.writhe+T.suck*0.6?1.3:t>T.retch&&t<T.search?0.5:t>T.rear&&t<T.lunge?0.35:t>T.catch?0.65:1; ctx.cx=(ctx.cx??0)+dt*slowK; const X=crawl(ctx.cx,dt,ctx,2.8,0); H.group.position.x=X;
  const k=ss((t-T.retch)/0.4)*(1-ss((t-T.search)/0.6))+(t>relT&&t<T.done?0.8*(1-ss((t-relT)/1.4)):0);
  let jaw=ss((t-T.retch-0.5)/1.0)*(1-ss((t-T.done+0.6)/0.6))*(variant==="bite"&&t>T.bite&&t<T.bite+0.3?1-ss((t-T.bite)/0.1):1);
  if(variant==="digest"&&t>T.bite-0.6){ const d=t-T.bite; jaw=d<2.4?1+0.55*ss((d+0.6)/0.6):d<6?Math.max(0.15,1.55-0.9*ss((d-2.4)/1.2))*(1+0.2*Math.max(0,Math.sin(d*5))):0.25+0.15*Math.max(0,Math.sin(d*2.3)); }
  retch(t,k,jaw,ctx);
  if(variant==="esc"&&t>T.shot-0.05){ // each hit on the cross: it flinches and shrieks; then it writhes on its belly
    const h1=Math.exp(-Math.pow((t-T.shot-0.12)/0.12,2)), h2=Math.exp(-Math.pow((t-T.shot2-0.12)/0.12,2)), w=t>relT&&t<relT+T.writhe?(ctx.writhe??1):0, d=t-relT;
    H.B.head.quaternion.premultiply(qE(-0.35*(h1+h2)-0.2*w*Math.abs(Math.sin(d*7)),0.3*w*Math.sin(d*9.5),0.25*w*Math.sin(d*6.4))); H.B.jaw.quaternion.premultiply(qE(0.6*(h1+h2)+0.5*w,0,0));
    H.B.root.quaternion.premultiply(qE(0,0.22*w*Math.sin(d*5.3),0.32*w*Math.sin(d*7.9))); H.B.spine1.quaternion.premultiply(qE(0.1*w*Math.sin(d*11),0.25*w*Math.sin(d*6.1),0)); H.B.spine2.quaternion.premultiply(qE(0,-0.3*w*Math.sin(d*6.1+1),0.2*w*Math.sin(d*8)));
    H.B.root.position.y+=0.12*w*Math.abs(Math.sin(d*8.3)); ctx.frantic=w>0.2; ctx.lumpK=1+1.5*w; ctx.pulseK=1+2*w; ctx.heart=1.3+2*w; ctx.flare=Math.max(h1,h2)*3+w; }
  if(MA.cheekMat) MA.cheekMat.emissiveIntensity=1.0+0.25*Math.sin(t*17)+0.15*Math.sin(t*41)+(ctx.flare||0)*0.8;
  H.group.updateMatrixWorld(true);
  const her=ctx.herW=ctx.herW||new V3(H.group.position.x+6.6,0,0.35); const mo=mouthNow(ctx), sM=ctx.sMouth||5;
  const herC=()=>w2m(her).add(new V3(0,1.02,0)), nTo=(C)=>{ const v=mo.clone().sub(C); v.y=0; return v.normalize(); };
  if(variant==="digest"&&t>=T.bite&&ctx.Cend) return digest(t,dt,ctx,T,mo);
  ctx.S=ctx.S??0; ctx.A=ctx.A||mo.clone().add(new V3(0,0.4,2)); let sT=0, aT=null, o={eye:0,curl:0.3,look:null,full:false};
  if(t<T.retch){ ctx.phase="crawls after her · the arm is swallowed"; }
  else if(t<T.cough){ ctx.phase="its gut convulses · it retches · bile spits from its gut · the jaw unhinges"; gutSpit(dt,60*k,ctx); if(t>T.cough-0.6) pour(mo,dt,90,ctx); }
  else if(t<T.search){ const u=ss((t-T.cough)/0.75); sT=sM-0.4+2.4*u; aT=mo.clone().add(new V3(Math.sin(t*1.3)*1.0,0.6,2.6)); pour(mo,dt,220*(1-u*0.5),ctx); gutSpit(dt,25,ctx); o.curl=0.5; ctx.phase="it coughs the arm up · bile and foam pour from its mouth"; }
  else if(t<T.spot){ sT=sM+2.4+0.35*Math.sin((t-T.search)*2); aT=mo.clone().add(new V3(Math.sin(t*1.5)*1.6,0.45+0.3*Math.sin(t*2.1),3.0)); pour(mo,dt,30,ctx); o.curl=0.35; o.palmAt=herC(); o.palmK=ss((t-T.search)/0.6); ctx.phase="the arm searches · its eyes still shut"; }
  else if(t<T.lunge){ // the eye snaps open; the arm draws back and up, gathering itself
    o.eye=ss((t-T.spot)/0.12); o.look=herC(); const r=ss((t-T.spot)/(T.rear-T.spot)); sT=sM+2.4-0.9*r; aT=mo.clone().add(new V3(0,0.9+0.9*r,2.2-0.6*r)).lerp(herC(),0.15); o.curl=0.2-0.35*r; o.palmAt=herC();
    ctx.phase="the eye in its palm snaps open, and the eyes along the arm · the arm draws back"; if(!ctx.sp1){ ctx.sp1=1; camPunch(0.4); }
    if(t>=T.rear){ // the long reach: the arm snakes slowly towards her, a wave rolling down it, the palm's eye fixed on her
      const u=ss((t-T.rear)/(T.lunge-T.rear)), C=herC(), dist=mo.distanceTo(C), n=nTo(C), side=n.clone().cross(UP).normalize();
      sT=sM+1.5+(dist-0.2)*u; aT=C.clone().addScaledVector(n,0.9+1.6*(1-u)).add(new V3(0,0.25+0.55*(1-u)+0.2*Math.sin(t*1.7),0)).addScaledVector(side,0.6*Math.sin(t*1.3)*(1-0.6*u));
      o.wave=1.8; o.curl=-0.15+0.1*Math.sin(t*2.2); ctx.creep=1; ctx.phase="it watches her · the arm snakes slowly towards her"; } }
  else if(t<T.catch){ // the lunge: up and over, then down onto her, the hand turning into the grip, fingers spread wide
    const u=(t-T.lunge)/(T.catch-T.lunge); const C=herC(); o.grip={C,n:nTo(C)}; o.gripK=ss(u*1.25); o.full=u>0.55; o.eye=1; o.look=C; o.curl=-0.2+0.15*u; o.palmAt=C; o.palmK=1-ss(u*1.6);
    sT=sM+1.5+((ctx.lastLen||sM+5)-sM-1.5)*easeOut(u); aT=gripFrame(C,nTo(C)).W; pour(mo,dt,140,ctx); ctx.phase="it lunges · up and over and down onto her"; }
  else if(t<relT){ // caught: the fingers clamp round her; it lifts her and hauls her to its mouth
    if(!ctx.C0){ ctx.C0=herC(); ctx.Cend=mo.clone().add(nTo(ctx.C0).negate().multiplyScalar(1.15)).add(new V3(0,0.15,0)); shake=0.25; camPunch(0.5); }
    const e=ss((t-T.reel)/((variant==="esc"?T.shot2+0.6:T.bite)-T.reel)), lift=0.45*ss((t-T.catch)/0.5);
    const C=ctx.C0.clone().lerp(ctx.Cend,variant==="esc"?Math.min(e,0.55):e).add(new V3(0.05*Math.sin(t*13),lift+0.35*Math.sin(Math.PI*e)+0.04*Math.sin(t*9),0.06*Math.sin(t*11)));
    ctx.Ccur=C; o.grip={C,n:nTo(C)}; o.gripK=1; o.full=true; o.eye=1; o.look=C; o.curl=1.15*ss((t-T.catch)/0.22); aT=gripFrame(C,nTo(C)).W; sT=999;
    pour(mo,dt,20,ctx); ctx.phase=variant==="esc"&&t>T.shot-0.6?(t<T.shot2?"she aims at the cross on its cheek · one shot":"a second shot into the cross"):"its fingers clamp round her · it hauls her to its mouth"; }
  else if(variant==="esc"){ const d=t-relT;
    if(d<T.writhe){ // the cross burns: it drops her, the arm spasms open and flails, the body writhes on the floor
      if(!ctx.Lrel) ctx.Lrel=ctx.lastLen||sM+3; sT=ctx.Lrel*(0.75+0.1*Math.sin(d*9)); aT=mo.clone().add(new V3(2.2*Math.sin(d*6.3),0.9+0.8*Math.sin(d*8.7),1.6+0.9*Math.cos(d*5.1))); o.curl=-0.25+0.5*Math.abs(Math.sin(d*11)); o.eye=0.3; o.wave=2.6;
      ctx.writhe=1-ss((d-T.writhe+0.5)/0.5); ctx.phase="the cross burns · it drops her and writhes on the floor, the arm flailing"; pour(mo,dt,40,ctx); }
    else { const r=ss((d-T.writhe)/T.suck); sT=(ctx.Lrel||sM+3)*0.8*(1-r); aT=mo.clone().add(new V3(0,0.3,1.2)); o.curl=0.2; o.eye=0; ctx.phase=r<1?"it sucks the arm back into its mouth":"it comes after her again"; if(r<0.9) pour(mo,dt,90,ctx); } }
  else { // let go; the arm is swallowed back down, gagging
    const r=ss((t-relT)/1.3); if(!ctx.Lrel) ctx.Lrel=ctx.lastLen||sM+3; sT=ctx.Lrel*(1-r); aT=ctx.A.clone(); o.curl=-0.1; o.eye=variant==="esc"?0:1-r; pour(mo,dt,60*(1-r),ctx);
    ctx.phase=variant==="esc"?"the eye bursts · the arm spasms open and is swallowed back down":"it swallows the arm back down, gagging"; }
  const cr=t>=T.rear&&t<T.lunge, ar=cr?1.6:6;
  if(aT){ if(t<T.lunge||t>=relT){ ctx.A.x=ease(ctx.A.x,aT.x,dt,ar); ctx.A.y=ease(ctx.A.y,aT.y,dt,ar); ctx.A.z=ease(ctx.A.z,aT.z,dt,ar); } else ctx.A.copy(aT); }
  ctx.S=t>=T.lunge&&t<relT?sT:ease(ctx.S,sT,dt,t>=relT?5:cr?1.8:7);
  if(ctx.S>0.05){ const R=poseArm(t,dt,ctx,Math.min(ctx.S,999),ctx.A,o); if(t<relT) ctx.lastLen=Math.min(ctx.S,R.len); }
  else { MA.root.visible=false; if(!ctx.sMouth){ poseArm(t,dt,ctx,0.01,mo.clone().add(new V3(0,0,3)),{}); MA.root.visible=false; } }
  stepBile(dt);
  // Norah
  let pose="walk", hp=her.clone(), look=0;
  if(t<T.catch-0.05){ her.x+=dt*(t<T.spot?0.55:t<T.rear?0.9:0.32); hp=her.clone(); pose=t<T.spot?"walk":"backstep"; look=1; }
  else if(t<relT){ const C=m2w(ctx.Ccur||herC()); hp=new V3(C.x,Math.max(0,C.y-1.02),C.z); her.copy(hp); pose=variant==="esc"&&t>T.shot-0.6?"held":"dragged"; }
  else if(variant==="bite"){ if(!ctx.bit){ ctx.bit=1; shake=0.5; camPunch(0.9); hitStop(0.12); blood(m2w(mo),40,3.2,0.08); } her.y=Math.max(0,her.y-dt*3); hp=her.clone(); pose="fall"; }
  else { her.y=Math.max(0,her.y-dt*3.5); const d=t-relT; her.x+=dt*(d>0.9?2.2:0); hp=her.clone(); pose=d<0.9?"fall":"walk"; }
  if(variant==="esc"){ for(const [ts,key] of [[T.shot,"s1"],[T.shot2,"s2"]]) if(t>=ts&&!ctx[key]){ ctx[key]=1; const cw=MA.cheekCross.getWorldPosition(new V3()); fireAt(cw,true); blood(cw,22,2.2,0.06); embers(cw,18,2.4); shake=0.35; hitStop(0.09); camPunch(0.6); } }
  ctx.her={m:w2m(hp),pose,ph:t*1.1,look,k:ss((t-relT)/0.5),aim:pose==="held"?MA.cheekCross.getWorldPosition(new V3()):null,faceIt:pose==="held"||pose==="dragged"||pose==="backstep"};
  const hw=m2w(mo), hwp=hp.clone(), mid=hw.clone().lerp(hwp,0.45), span=Math.max(4,Math.abs(hwp.x-hw.x)); ctx.camS=ctx.camS||mid.clone(); ctx.camS.lerp(mid,Math.min(1,dt*2.5));
  ctx.cam={p:new V3(ctx.camS.x+1.2,2.6+0.12*span,4.8+0.75*span),look:new V3(ctx.camS.x-0.3,1.1,0)};
  if(variant==="esc"&&t>T.shot-1.0&&t<relT+0.6){ const k2=ss((t-T.shot+1.0)/0.5)*(1-ss((t-relT-0.1)/0.5)); const cp=m2w(mo.clone().add(new V3(3.4,1.0,5.2))), cl=m2w(mo.clone().add(new V3(0.3,0.3,0.6)));
    ctx.cam.p.lerp(cp,k2); ctx.cam.look.lerp(cl,k2); } }
A.mouth={ name:"Mouth arm grab · the bite", len:14.2, start(ctx){ ctx.x0=-4; ctx.heart=1.3; hideMouthArm(); }, step(t,dt,ctx){ mouthGrab(t,dt,ctx,"bite"); } };
A.mouthEsc={ name:"Mouth arm grab · two shots to the cheek cross", len:16, start(ctx){ ctx.x0=-4; ctx.heart=1.3; hideMouthArm(); }, step(t,dt,ctx){ mouthGrab(t,dt,ctx,"esc"); } };

// ---------------------------------------------------------------- swallowed: fed in head first, down the throat into the gut, digested
function noraFade(k){ if(typeof nora==="undefined"||!nora) return; nora.group.traverse(m=>{ if(!m.isMesh) return; for(const mt of [].concat(m.material)){ if(!mt.userData.o0) mt.userData.o0={tr:mt.transparent,op:mt.opacity,c:mt.color?mt.color.clone():null};
    const o=mt.userData.o0; mt.transparent=k<0.999||o.tr; mt.opacity=o.op*k; if(o.c&&mt.color) mt.color.copy(o.c).lerp(new THREE.Color(0.32,0.12,0.08),Math.min(1,(1-k)*1.6)); mt.needsUpdate=true; } }); }
function digest(t,dt,ctx,T,mo){ const d=t-T.bite, feedE=1.5, gulpE=3.6;
  // the way down, from the bones as they are now: mouth, throat (head), neck (root), chest (spine1), gut (between spine1 and spine2)
  const sp1=bonePosM("spine1"), sp2=bonePosM("spine2"), GUT=[mo.clone().add(new V3(0,0,-0.45)),bonePosM("head").add(new V3(0,-0.25,0.2)),bonePosM("root").add(new V3(0,-0.1,0)),sp1.clone().add(new V3(0,-0.12,0)),sp1.clone().lerp(sp2,0.6).add(new V3(0,-0.12,0))];
  // where she is: pushed into the mouth by the hand, then gulped down in three swallows, then lying in the gut
  let C, head, sc=0.76, pose="scramble";
  if(d<feedE){ const e=ss(d/feedE); C=ctx.Cend.clone().lerp(GUT[0],e); head=GUT[1].clone(); sc=1-0.24*e; ctx.phase="its jaw unhinges as wide as it goes · the hand feeds her in, head first"; }
  else if(d<gulpE){ const g=(d-feedE)/(gulpE-feedE)*4, gi=Math.min(3,Math.floor(g)), ge=ss((g-gi)/0.7); C=GUT[gi].clone().lerp(GUT[gi+1],ge); head=GUT[Math.min(4,gi+1)].clone().add(new V3(0,0,-0.5));
    H.B.head.quaternion.premultiply(qE(-0.22*Math.sin(Math.PI*Math.min(1,(g-gi)/0.7)),0,0)); if(ge>0.05&&ge<0.2&&!ctx["g"+gi]){ ctx["g"+gi]=1; shake=0.18; } ctx.phase="it gulps · her shape slides down its throat into its gut"; }
  else { const e=d-gulpE; C=GUT[4].clone().add(new V3(0.04*Math.sin(e*2.1),0.03*Math.sin(e*3.1),0.15*Math.sin(e*0.9))); head=C.clone().add(new V3(0.35*Math.sin(e*0.6),0.15*Math.cos(e*0.8),-0.9)); sc=0.76-0.34*ss(e/6);
    noraFade(1-ss((e-2.0)/4.5)); ctx.phase=e<2.4?"she struggles inside its gut, squirming against the skin":"the gut churns · it convulses · she darkens and shrinks away inside it"; }
  if(H.ins) H.ins.visible=d<feedE+0.8;
  const thin=[].concat(H.mesh.material)[1]; if(thin&&thin.transparent) thin.opacity=0.6-0.22*ss((d-feedE)/1.0);   /* the stretched skin thins: her shape shows through */   /* her body takes the space: the organs would hide her */
  ctx.bulge={z:C.z,amp:d<feedE?0:0.32*(sc/0.76)*(d<gulpE?1:1-0.6*ss((d-gulpE-2)/5))};
  // the gut works: squirming, swellings, heartbeat, convulsions, bile from the mouth
  const conv=d>gulpE?Math.max(0,Math.sin((d-gulpE)*2.2))**4:0; retch(t,0.25+0.6*conv,0,ctx); ctx.squirm=d>feedE?4.5:2; ctx.lumpK=1.8; ctx.heart=2.4; ctx.frantic=d>gulpE&&d<gulpE+3;
  if(d>gulpE) pour(mo,dt,12+50*conv,ctx); if(d>gulpE+0.5&&Math.random()<dt*0.8) gutSpit(dt,40,ctx);
  // the arm goes in with her, still holding, then is swallowed
  if(d<feedE){ const R=poseArm(t,dt,ctx,999,gripFrame(C,new V3(0,0,1)).W,{grip:{C,n:new V3(0,0,1)},gripK:1,full:true,eye:1,curl:1.1}); }
  else { ctx.S=ease(ctx.S||5,0,dt,5); if(ctx.S>0.1){ poseArm(t,dt,ctx,ctx.S,mo.clone().add(new V3(0,-0.2,1.5)),{curl:0.6,eye:0}); MA.hand.visible=false; } else MA.root.visible=false; }
  stepBile(dt);
  const cw=m2w(C), hw=m2w(head), wig=d>gulpE?Math.sin(d*7)*0.25*(1-ss((d-gulpE-2)/4)):0;
  ctx.her={m:w2m(cw),pose,ph:t*1.4,k:1,post:(nr)=>{ const g=nr.group, dir=hw.clone().sub(cw).normalize(); g.scale.setScalar(sc); g.position.copy(cw).addScaledVector(dir,-0.85*sc); g.lookAt(g.position.clone().add(dir)); g.rotateX(Math.PI/2); g.rotateY(wig); }};
  const look=cw.clone(); look.y=Math.max(0.9,look.y); ctx.camS=ctx.camS||look.clone(); ctx.camS.lerp(look,Math.min(1,dt*1.8)); ctx.cam={p:ctx.camS.clone().add(new V3(1.6,1.7,5.6)),look:ctx.camS.clone()}; }
A.digest={ name:"Mouth arm grab · swallowed", len:21, start(ctx){ ctx.x0=-4; ctx.heart=1.3; hideMouthArm(); noraFade(1); if(typeof nora!=="undefined"&&nora) nora.group.scale.setScalar(1); }, step(t,dt,ctx){ mouthGrab(t,dt,ctx,"digest"); } };
