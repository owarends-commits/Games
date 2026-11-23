// ================================================================ PV_BR: brute-preview.html wrapped for the playground (made by mkbr.py)
const PV_BR=(function(){
let scene=null, t=0, ctx={events:[]}, cur=null; const PVHOOK={};
function blob(){ const c=document.createElement("canvas"); c.width=c.height=64; const g=c.getContext("2d"); const gr=g.createRadialGradient(32,32,2,32,32,30); gr.addColorStop(0,"rgba(0,0,0,0.55)"); gr.addColorStop(1,"rgba(0,0,0,0)"); g.fillStyle=gr; g.fillRect(0,0,64,64);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=0.005; scene.add(m); return m; }

// ---------------------------------------------------------------- characters: a friendly rig (limbs hang at rest) retargeted onto the model's skeleton
const AXD=new THREE.Vector3(0,-1,0);
const _q1=new THREE.Quaternion(),_q2=new THREE.Quaternion(),_v1=new THREE.Vector3(),_v2=new THREE.Vector3(),_v3=new THREE.Vector3();
function piv(p,pos){ const o=new THREE.Object3D(); o.position.copy(pos); p.add(o); return o; }
function makeChar(gltf){
  const group=new THREE.Group(); scene.add(group);
  const model=THREE.SkeletonUtils.clone(gltf.scene); const B={}; model.traverse(o=>{ if(o.isBone) B[o.name]=o; if(o.isMesh){ o.frustumCulled=false; } });
  model.traverse(o=>{ if(o.isMesh){ const map=o.material.map; if(map) map.encoding=THREE.LinearEncoding; o.material=new THREE.MeshLambertMaterial({map,side:THREE.DoubleSide,skinning:!!o.isSkinnedMesh}); } });
  group.add(model); model.traverse(o=>{ if(o.isMesh) o.layers.enable(1); }); const top=B.hips.parent;
  const R={}; R.root=piv(top,new THREE.Vector3()); R.hips=piv(R.root,B.hips.position); R.hip0=B.hips.position.y;
  R.chest=piv(R.hips,B.chest.position); R.neck=piv(R.chest,B.neck.position); R.head=piv(R.neck,B.head.position);
  const ax={};
  for(const s of ["L","R"]){
    R["arm"+s]=piv(R.chest,B["upperarm_"+s].position);
    R["elbow"+s]=piv(R["arm"+s],new THREE.Vector3(0,-B["forearm_"+s].position.length(),0));
    R["wrist"+s]=piv(R["elbow"+s],new THREE.Vector3(0,-B["hand_"+s].position.length(),0));
    R["leg"+s]=piv(R.hips,B["thigh_"+s].position);
    R["knee"+s]=piv(R["leg"+s],new THREE.Vector3(0,-B["shin_"+s].position.length(),0));
    R["ankle"+s]=piv(R["knee"+s],new THREE.Vector3(0,-B["foot_"+s].position.length(),0));
    ax["upperarm_"+s]=B["forearm_"+s].position.clone().normalize(); ax["forearm_"+s]=B["hand_"+s].position.clone().normalize(); ax["hand_"+s]=ax["forearm_"+s];
    ax["thigh_"+s]=B["shin_"+s].position.clone().normalize(); ax["shin_"+s]=B["foot_"+s].position.clone().normalize(); }
  const map=[["chest","ori",R.chest],["neck","ori",R.neck],["head","ori",R.head]];
  for(const s of ["L","R"]) map.push(["upperarm_"+s,"pts",R["arm"+s],R["elbow"+s]],["forearm_"+s,"pts",R["elbow"+s],R["wrist"+s]],["hand_"+s,"axis",R["wrist"+s],AXD],
    ["thigh_"+s,"pts",R["leg"+s],R["knee"+s]],["shin_"+s,"pts",R["knee"+s],R["ankle"+s]],["foot_"+s,"ori",R["ankle"+s]]);
  const shadow=blob();
  return {group,model,B,R,map,ax,shadow,gltf};
}
function retarget(C){
  const B=C.B,R=C.R; C.group.updateMatrixWorld(true);
  B.hips.position.copy(R.hips.position); B.hips.quaternion.copy(R.hips.quaternion); B.hips.updateMatrixWorld(true);
  for(const [name,kind,src,b] of C.map){ const bone=B[name]; if(!bone) continue;
    bone.parent.getWorldQuaternion(_q1); _q1.invert();
    if(kind==="ori"){ src.getWorldQuaternion(_q2); bone.quaternion.copy(_q1).multiply(_q2); }
    else { if(kind==="pts"){ src.getWorldPosition(_v2); b.getWorldPosition(_v3); _v3.sub(_v2); } else { src.getWorldQuaternion(_q2); _v3.copy(b).applyQuaternion(_q2); }
      if(_v3.lengthSq()<1e-10) continue; _v3.normalize().applyQuaternion(_q1); bone.quaternion.setFromUnitVectors(C.ax[name],_v3); }
    bone.updateMatrixWorld(true); }
  const hp=new THREE.Vector3(); B.hips.getWorldPosition(hp); C.shadow.position.set(hp.x,0.005,hp.z); const s=Math.max(0.4,1.1-0.4*Math.max(0,hp.y-R.hip0)); C.shadow.scale.setScalar(s);
}
// ---------------------------------------------------------------- pose format (adds ankle roll, head roll and wrists to the Runner's)
const P0=()=>({hd:0,hz:0,hx:0,hp:0,hyaw:0,hroll:0,sp:0,syaw:0,sroll:0,nx:0,ny:0,nz:0,hdx:0,hdy:0,hdz:0,
  aLx:0,aLy:0,aLz:0.08,eL:0.15,wL:0,aRx:0,aRy:0,aRz:0.08,eR:0.15,wR:0,lLx:0,lLz:0.02,kL:0,fL:0,fLz:0,lRx:0,lRz:0.02,kR:0,fR:0,fRz:0});
function applyPose(C,J){ const R=C.R;
  R.hips.position.set(J.hx,R.hip0-J.hd,J.hz); R.hips.rotation.set(J.hp,J.hyaw,J.hroll);
  R.chest.rotation.set(J.sp,J.syaw,J.sroll); R.neck.rotation.set(J.nx,J.ny,J.nz); R.head.rotation.set(J.hdx,J.hdy,J.hdz);
  R.armL.rotation.set(J.aLx,J.aLy,J.aLz); R.armR.rotation.set(J.aRx,-J.aRy,-J.aRz); R.elbowL.rotation.x=-J.eL; R.elbowR.rotation.x=-J.eR; R.wristL.rotation.x=J.wL; R.wristR.rotation.x=J.wR;
  R.legL.rotation.set(J.lLx,0,J.lLz); R.legR.rotation.set(J.lRx,0,-J.lRz); R.kneeL.rotation.x=J.kL; R.kneeR.rotation.x=J.kR; R.ankleL.rotation.set(J.fL,0,J.fLz); R.ankleR.rotation.set(J.fR,0,-J.fRz); }
function mix(a,b,t){ const o={}; for(const k in a) o[k]=a[k]+(b[k]-a[k])*t; return o; }
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), sat=x=>clamp(x,0,1);
const ss=t=>{ t=sat(t); return t*t*(3-2*t); }, easeIn=t=>{ t=sat(t); return t*t*t; }, easeOut=t=>{ t=sat(t); return 1-(1-t)**3; };
const noise=(t,s)=>Math.sin(t*1.9+s)*0.5+Math.sin(t*3.7+s*1.7)*0.3+Math.sin(t*7.3+s*2.3)*0.2;
function spring(s,target,dt,w){ const a=w*w*(target-s.x)-2*w*s.v; s.v+=a*dt; s.x+=s.v*dt; return s.x; }
// sample-and-hold jitter: a joint snaps to a new offset at random moments (the puppet feel)
function jn(C,key,amp,dt){ const J=C.jj||(C.jj={}); let j=J[key]; if(!j) j=J[key]={cur:0,tg:0,t:0}; j.t-=dt; if(j.t<=0){ j.tg=(Math.random()*2-1)*amp; j.t=0.05+Math.random()*0.3; } j.cur+=(j.tg-j.cur)*Math.min(1,dt*24); return j.cur; }

// ---------------------------------------------------------------- ACROSS bodies at rest and walking
function idleA(C,t,dt,still){ const a=still?0:1, J=P0();
  J.sp=0.16+jn(C,"sp",0.05*a,dt); J.hp=0.05; J.nx=0.02+jn(C,"nx",0.12*a,dt); J.nz=0.3*Math.sin(t*0.9)*a+jn(C,"nz",0.12*a,dt);
  J.aLx=0.05+jn(C,"al",0.12*a,dt); J.aRx=0.05+jn(C,"ar",0.12*a,dt); J.aLz=J.aRz=0.1; J.eL=J.eR=0.15; J.kL=0.12; J.kR=0.18; J.lLx=-0.05; J.lRx=0.06; J.hd=0.03; return J; }
// Marionette: held up from above, toes dragging, head lolling, arms dangling and yanked
function marWalk(C,ph,t,dt){ const s=Math.sin(ph*2*Math.PI), c=Math.cos(ph*2*Math.PI), J=idleA(C,t,dt);
  J.lLx=-0.28*s; J.lRx=0.28*s; J.kL=0.12+0.32*Math.max(0,c)+Math.abs(jn(C,"kl",0.3,dt)); J.kR=0.12+0.32*Math.max(0,-c)+Math.abs(jn(C,"kr",0.3,dt));
  J.fL=0.6+0.2*Math.max(0,c); J.fR=0.6+0.2*Math.max(0,-c); J.hd=-0.03+jn(C,"hy",0.03,dt);
  J.nz=0.38*Math.sin(t*1.3)+jn(C,"lz",0.2,dt); J.nx=0.05+jn(C,"lx",0.2,dt);
  J.aLx=0.15*s+jn(C,"mal",0.35,dt); J.aRx=-0.15*s+jn(C,"mar",0.35,dt); J.aLz=0.12+Math.abs(jn(C,"maz",0.2,dt)); J.aRz=0.12+Math.abs(jn(C,"mbz",0.2,dt)); J.hroll=jn(C,"hr",0.1,dt); return J; }
// Lurcher: stiff right leg trailing back behind it, dragged round; body tilted; the bad hip pops out and back every few steps
function lurWalk(C,ph,t,dt,pop){ const s=Math.sin(ph*2*Math.PI), c=Math.cos(ph*2*Math.PI), S=Math.max(0,s), J=idleA(C,t,dt);
  J.lLx=-0.35*s-0.08; J.kL=0.2+0.6*Math.max(0,c)+0.25*S; J.lRx=0.38+0.14*c; J.kR=0.03; J.fR=0.35; J.lRz=0.1+0.16*Math.max(0,-s);
  J.hroll=-0.22-0.12*S+pop*0.35; J.hx=pop*0.07; J.nz=0.35; J.sp=0.3; J.hp=0.15; J.hd=0.05+0.07*S;
  J.aRx=0.05+0.1*S; J.aRz=0.06; J.eR=0.1; J.aLx=-0.2-0.35*S; J.aLz=0.3; J.eL=0.6; return J; }

// ---------------------------------------------------------------- Norah's reactions
const NP={
  stand(){ const J=P0(); J.aLx=-0.25; J.aRx=-0.5; J.eL=0.5; J.eR=0.9; J.aLz=0.12; J.aRz=0.1; J.kL=J.kR=0.08; J.lLx=-0.08; J.lRx=0.08; return J; },
  backstep(ph){ const J=NP.stand(), s=Math.sin(ph*2*Math.PI); J.lLx=0.3*s; J.lRx=-0.3*s; J.kL=0.1+0.3*Math.max(0,-s); J.kR=0.1+0.3*Math.max(0,s); J.sp=-0.06; return J; },
  held(t){ const J=P0(), n=s=>noise(t*14,s)*0.14; J.aLx=-0.6+n(1); J.aRx=-0.7+n(2); J.aLz=0.2; J.aRz=0.2; J.eL=1.2+n(3); J.eR=1.3+n(4); J.sp=-0.2+n(5)*0.5; J.syaw=n(6); J.nx=-0.3+n(7); J.ny=0.35+n(8); J.kL=0.25; J.kR=0.15; J.lLx=-0.12; J.lRx=0.18; return J; },
  clutch(side,k,J0){ const J=J0||NP.stand(); // a hand to the struck side of her stomach, the body folding round it
    if(side>0){ J.aLx=-0.55*k+J.aLx*(1-k); J.aLz=-0.25*k+J.aLz*(1-k); J.eL=1.95*k+J.eL*(1-k); } else { J.aRx=-0.6*k+J.aRx*(1-k); J.aRz=-0.25*k+J.aRz*(1-k); J.eR=1.95*k+J.eR*(1-k); }
    J.sp+=0.3*k; J.sroll+=0.18*k*side; J.nx+=0.25*k; J.syaw-=0.15*k*side; return J; },
  stumble(){ const J=P0(); J.sp=-0.25; J.aLx=-0.9; J.aRx=-0.6; J.aLz=0.6; J.aRz=0.5; J.eL=J.eR=0.5; J.lLx=0.35; J.kL=0.3; J.lRx=-0.3; J.kR=0.2; J.nx=-0.2; return J; },
  doubled(k,t){ const J=P0(); J.sp=0.75*k+0.05*Math.sin(t*9)*k; J.hp=0.15*k; J.nx=0.5*k; J.hd=0.12*k; J.kL=0.45*k; J.kR=0.35*k; J.lLx=-0.25*k; J.lRx=0.2*k;
    J.aLx=-0.7; J.aLz=-0.3; J.eL=1.9; J.aRx=-0.65; J.aRz=-0.35; J.eR=1.8; return J; },
  // on her back (the group is tipped over); kicking and pushing it off
  lie(t,k,fight){ const J=P0(), f=fight; J.hd=0; J.nx=-0.3*k+0.15; J.lLx=-0.25+0.55*Math.sin(t*9)*f; J.lRx=-0.25-0.55*Math.sin(t*9+1.3)*f; J.kL=0.6+0.5*Math.max(0,Math.sin(t*9))*f; J.kR=0.6+0.5*Math.max(0,Math.sin(t*9+1.3))*f;
    J.aLx=-1.35+0.35*Math.sin(t*11)*f; J.aRx=-1.4+0.35*Math.sin(t*12+1)*f; J.aLz=J.aRz=0.35; J.eL=0.9+0.4*Math.sin(t*11+2)*f; J.eR=0.9+0.4*Math.sin(t*12)*f; J.ny=0.3*Math.sin(t*3)*f; return J; },
  pinnedArm(J){ J.aLx=-0.1; J.aLz=1.2; J.eL=0.2; return J; } };

// ---------------------------------------------------------------- the ACROSS attack poses
function hugA(t,sq){ const J=P0(), n=s=>noise(t*24,s)*0.04; J.hd=0.08; J.hp=0.12; J.sp=0.25+n(1); J.nx=0.4; J.ny=0.55; J.hdz=0.3;
  J.aLz=J.aRz=1.35; J.aLy=J.aRy=-1.2-0.15*sq+n(2); J.aLx=J.aRx=0.2; J.eL=J.eR=1.6+0.25*sq+n(3); J.lLx=-0.45; J.kL=0.55; J.lRx=0.4; J.kR=0.45; J.fR=-0.3; return J; }
function swipeWind(t,dt,C,side,k){ const J=idleA(C,t,dt), tr=noise(t*44,side)*0.12*k;   // the striking arm drawn back and out, hand shaking
  if(side>0){ J.aLx=0.75*k+tr; J.aLz=1.0*k; J.eL=0.3; J.wL=0.6*k+tr*2; } else { J.aRx=0.75*k+tr; J.aRz=1.0*k; J.eR=0.3; J.wR=0.6*k+tr*2; }
  J.syaw=-0.35*side*k; J.sp=0.35; J.lLx=-0.35; J.kL=0.35; J.lRx=0.25; J.kR=0.3; J.hd=0.07; J.nx=0.1; return J; }
function swipeStrike(C,side,u){ const J=P0(); const a=easeIn(Math.min(1,u*1.4));   // whips across at stomach height; the elbow bends backward at the end
  const ax=0.75+(-1.35-0.75)*a, az=1.0+(0.1-1.0)*a, e=u<0.7?0.3:0.3-0.75*ss((u-0.7)/0.3);
  if(side>0){ J.aLx=ax; J.aLz=az; J.aLy=-0.4*a; J.eL=e; J.wL=0.3; J.aRx=0.2; J.aRz=0.3; } else { J.aRx=ax; J.aRz=az; J.aRy=-0.4*a; J.eR=e; J.wR=0.3; J.aLx=0.2; J.aLz=0.3; }
  J.syaw=(-0.35+0.8*a)*side; J.sp=0.45; J.hp=0.1; J.lLx=-0.45; J.kL=0.45; J.lRx=0.3; J.kR=0.3; J.hd=0.1; J.nx=0.1; J.hz=0.08*a; return J; }

// ---------------------------------------------------------------- gore: blood bursts, chunks, drips from its mouth, a smear on its face
const fx=[]; const bloodTex=(()=>{ const c=document.createElement("canvas"); c.width=c.height=64; const g=c.getContext("2d"); const gr=g.createRadialGradient(32,32,2,32,32,30); gr.addColorStop(0,"rgba(120,6,6,0.95)"); gr.addColorStop(1,"rgba(80,0,0,0)"); g.fillStyle=gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
function blood(p,n,spd,size=0.06){ for(let i=0;i<n;i++){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:bloodTex,transparent:true,depthWrite:false})); m.position.copy(p); m.scale.setScalar(size*(0.6+Math.random())); scene.add(m);
  fx.push({m,t:0,life:1.4,o:1,v:new THREE.Vector3((Math.random()-.5)*spd,Math.random()*spd*0.8,(Math.random()-.5)*spd),g:9.8,splat:size*2.2}); } }
// ---------------------------------------------------------------- gore that stays: floor spatter, wounds and bruises on bodies, spurts and drips that follow a bone
const splatTex=(()=>{ const c=document.createElement("canvas"); c.width=c.height=64; const g=c.getContext("2d"); g.fillStyle="rgba(92,6,6,0.9)";
  g.beginPath(); g.arc(32,32,13,0,7); g.fill(); for(let i=0;i<10;i++){ const a=Math.random()*7, r=14+Math.random()*14; g.beginPath(); g.arc(32+Math.cos(a)*r,32+Math.sin(a)*r,1.5+Math.random()*3.5,0,7); g.fill(); } return new THREE.CanvasTexture(c); })();
const splats=[];
function floorSplat(p,size){ const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:splatTex,transparent:true,depthWrite:false,opacity:0.9})); m.rotation.x=-Math.PI/2; m.rotation.z=Math.random()*6; m.scale.setScalar(Math.max(0.05,size)*(0.7+Math.random()*0.7)); m.position.set(p.x,0.006+splats.length*0.00002,p.z); scene.add(m); splats.push(m); if(splats.length>160) scene.remove(splats.shift()); }
const woundTex={}; function wtex(kind){ if(woundTex[kind]) return woundTex[kind]; const c=document.createElement("canvas"); c.width=c.height=64; const g=c.getContext("2d");
  if(kind==="bullet"){ let gr=g.createRadialGradient(32,32,2,32,32,30); gr.addColorStop(0,"rgba(10,0,0,1)"); gr.addColorStop(0.18,"rgba(40,0,0,1)"); gr.addColorStop(0.32,"rgba(120,12,10,0.95)"); gr.addColorStop(0.55,"rgba(70,30,60,0.55)"); gr.addColorStop(1,"rgba(60,30,60,0)"); g.fillStyle=gr; g.fillRect(0,0,64,64); g.fillStyle="rgba(110,8,6,0.95)"; g.fillRect(29,34,6,26); }
  else if(kind==="cut"){ g.strokeStyle="rgba(70,0,0,1)"; g.lineWidth=5; g.lineCap="round"; for(let i=0;i<3;i++){ g.beginPath(); g.moveTo(8,18+i*12); g.lineTo(56,26+i*12); g.stroke(); } g.fillStyle="rgba(120,10,8,0.9)"; for(let i=0;i<6;i++) g.fillRect(12+i*8,26+Math.random()*20,2.5,10+Math.random()*16); }
  else if(kind==="bite"){ g.fillStyle="rgba(30,0,0,1)"; g.beginPath(); g.ellipse(32,30,18,12,0,0,7); g.fill(); g.fillStyle="rgba(140,14,12,0.95)"; g.beginPath(); g.ellipse(32,30,13,8,0,0,7); g.fill(); g.fillStyle="rgba(110,8,6,0.9)"; for(let i=0;i<5;i++) g.fillRect(20+i*6,38,3,12+Math.random()*16); }
  else { const gr=g.createRadialGradient(32,32,2,32,32,30); gr.addColorStop(0,"rgba(70,30,80,0.85)"); gr.addColorStop(0.5,"rgba(90,40,70,0.5)"); gr.addColorStop(1,"rgba(90,60,40,0)"); g.fillStyle=gr; g.fillRect(0,0,64,64); }
  return woundTex[kind]=new THREE.CanvasTexture(c); }
const decals=[];
// a mark on the body, stuck to a bone: off = point on the skin in the bone's frame, n = which way the skin faces there
// find the real skin surface: walk out from a point inside the bone along the skin direction, using the mesh's own vertices (in the bone's bind frame)
function surfacePoint(C,bone,off,n){ C.sp=C.sp||{}; const key=bone+off.toArray().map(v=>v.toFixed(3)).join()+n.toArray().map(v=>v.toFixed(2)).join(); if(C.sp[key]) return C.sp[key].clone();
  let mesh=null; C.model.traverse(o=>{ if(o.isSkinnedMesh&&!mesh) mesh=o; }); if(!mesh) return off.clone();
  const sk=mesh.skeleton, bi=sk.bones.indexOf(C.B[bone]); if(bi<0) return off.clone(); const inv=sk.boneInverses[bi], g=mesh.geometry, P=g.attributes.position, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight;
  const nn=n.clone().normalize(), v=new THREE.Vector3(), w=new THREE.Vector3(); let best=-1;
  for(let i=0;i<P.count;i++){ let wt=0; const ix=[SI.getX(i),SI.getY(i),SI.getZ(i),SI.getW(i)], wx=[SW.getX(i),SW.getY(i),SW.getZ(i),SW.getW(i)]; for(let k=0;k<4;k++){ if(ix[k]===bi) wt+=wx[k]; } if(wt<0.35) continue;
    v.fromBufferAttribute(P,i).applyMatrix4(mesh.bindMatrix).applyMatrix4(inv); w.copy(v).sub(off); const sd=w.dot(nn); if(sd<0) continue; const perp=w.addScaledVector(nn,-sd).length(); if(perp<0.045 && sd>best) best=sd; }
  const r=best>0? off.clone().addScaledVector(nn,best+0.006) : off.clone(); C.sp[key]=r; return r.clone(); }
function wound(C,bone,off,n,kind,size){ if(C===nora) return; size*=kind==="bruise"?1.25:1.3; const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:wtex(kind),transparent:true,depthWrite:false,opacity:kind==="bruise"?0:1,side:THREE.DoubleSide}));
  const inner=off.clone().addScaledVector(n.clone().normalize(),-0.08); off=surfacePoint(C,bone,inner,n); if(kind!=="bruise") off.addScaledVector(n.clone().normalize(),0.002);
  m.position.copy(off); m.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),n.clone().normalize()); C.B[bone].add(m); decals.push({m,kind,t:0}); return m; }
const emit=[];
function onSkin(C,bone,off,n){ return surfacePoint(C,bone,off.clone().addScaledVector(n.clone().normalize(),-0.08),n); }
function spurt(C,bone,off,dir,dur=0.7,rate=70,spd=2.2){ off=onSkin(C,bone,off,dir); emit.push({C,bone,off,dir,t:0,dur,rate,spd,kind:"spurt"}); }
function dripFrom(C,bone,off,dur=4,rate=4,n){ if(n) off=onSkin(C,bone,off,n); emit.push({C,bone,off,t:0,dur,rate,kind:"drip"}); }
function stepGore(dt){
  for(const d of decals){ d.t+=dt; if(d.kind==="bruise") d.m.material.opacity=Math.min(0.75,d.t*0.9); }
  const q=new THREE.Quaternion();
  for(let i=emit.length-1;i>=0;i--){ const e=emit[i]; e.t+=dt; if(e.t>e.dur){ emit.splice(i,1); continue; } if(!e.C.group.visible) continue;
    const p=e.off.clone(); e.C.B[e.bone].localToWorld(p);
    if(e.kind==="spurt"){ const pulse=Math.max(0,Math.sin(e.t*15)), k=1-e.t/e.dur; let n=dt*e.rate*pulse*k; e.acc=(e.acc||0)+n;
      e.C.B[e.bone].getWorldQuaternion(q); const dir=e.dir.clone().applyQuaternion(q).normalize();
      while(e.acc>=1){ e.acc-=1; const m=new THREE.Sprite(new THREE.SpriteMaterial({map:bloodTex,transparent:true,depthWrite:false})); m.position.copy(p); m.scale.setScalar(0.025+Math.random()*0.025); scene.add(m);
        const v=dir.clone().multiplyScalar(e.spd*(0.6+0.6*pulse)); v.x+=(Math.random()-.5)*0.4; v.y+=(Math.random()-.5)*0.4+0.3; v.z+=(Math.random()-.5)*0.4;
        fx.push({m,t:0,life:1.4,o:1,v,g:9.8,splat:0.06}); } }
    else { e.acc=(e.acc||0)+dt*e.rate*(1-0.5*e.t/e.dur); while(e.acc>=1){ e.acc-=1; const m=new THREE.Sprite(new THREE.SpriteMaterial({map:bloodTex,transparent:true,depthWrite:false})); m.position.copy(p); m.scale.set(0.018,0.04,1); scene.add(m); fx.push({m,t:0,life:2,o:1,v:new THREE.Vector3(0,-0.3,0),g:9.8,splat:0.035}); } } } }
function clearGore(){ for(const d of decals) d.m.parent&&d.m.parent.remove(d.m); decals.length=0; emit.length=0; for(const m of splats) scene.remove(m); splats.length=0; }
function chunks(p,dir,n){ for(let i=0;i<n;i++){ const m=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.025,0.03),new THREE.MeshLambertMaterial({color:i%2?0x5a0a0a:0x8a2a22})); m.position.copy(p); scene.add(m);
  fx.push({m,t:0,life:1.4,v:new THREE.Vector3(dir.x*2+(Math.random()-.5)*1.5,1.2+Math.random()*1.4,dir.z*2+(Math.random()-.5)*1.5),g:9.8,spin:true,floor:true}); } }
function drip(p){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:bloodTex,transparent:true,depthWrite:false})); m.position.copy(p); m.scale.set(0.02,0.05,1); scene.add(m); fx.push({m,t:0,life:1.6,o:1,v:new THREE.Vector3(0,-0.2,0),g:9.8,splat:0.035}); }
function stepFx(dt){ for(let i=fx.length-1;i>=0;i--){ const q=fx[i]; q.t+=dt; if(q.ring){ const u=q.t/q.life; q.m.scale.setScalar(0.15+q.r*easeOut(u)); q.m.material.opacity=0.55*(1-u); if(q.t>q.life){ scene.remove(q.m); fx.splice(i,1); } continue; }
  if(q.decal){ q.m.material.opacity=Math.min(0.85,q.t*12)*(q.t>q.life-0.8?Math.max(0,(q.life-q.t)/0.8):1); if(q.t>q.life){ scene.remove(q.m); fx.splice(i,1); } continue; }
  q.v.y-=q.g*dt; if(q.drag) q.v.multiplyScalar(Math.max(0,1-q.drag*dt)); q.m.position.addScaledVector(q.v,dt); if(q.grow) q.m.scale.multiplyScalar(1+q.grow*dt);
  if(q.spin && !q.rest){ q.m.rotation.x+=dt*q.spin; q.m.rotation.z+=dt*q.spin*0.7; }
  if(q.splat && q.m.position.y<0.03){ floorSplat(q.m.position,q.splat); scene.remove(q.m); fx.splice(i,1); continue; }
  if(q.floor && q.m.position.y<(q.h||0.02)){ q.m.position.y=q.h||0.02; if(q.bounce && q.v.y<-0.6){ q.v.y*=-0.3; q.v.x*=0.45; q.v.z*=0.45; } else { q.v.set(0,0,0); q.g=0; q.rest=true; } }
  if(q.fade){ if(q.t>q.life-0.6) q.m.material.opacity=Math.max(0,(q.life-q.t)/0.6); }
  else if(q.m.material.opacity!==undefined && !q.spin) q.m.material.opacity=Math.max(0,(q.o??1)*(1-q.t/q.life));
  if(q.t>q.life){ scene.remove(q.m); fx.splice(i,1); } } }
// ---------------------------------------------------------------- weight: dust, debris kicked up, shockwave rings, floor cracks, motion streaks, camera punch
const dustTex=(()=>{ const c=document.createElement("canvas"); c.width=c.height=64; const g=c.getContext("2d"); const gr=g.createRadialGradient(32,32,3,32,32,30); gr.addColorStop(0,"rgba(150,138,122,0.75)"); gr.addColorStop(0.6,"rgba(120,110,98,0.35)"); gr.addColorStop(1,"rgba(110,100,90,0)"); g.fillStyle=gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
const streakTex=(()=>{ const c=document.createElement("canvas"); c.width=c.height=32; const g=c.getContext("2d"); const gr=g.createRadialGradient(16,16,1,16,16,15); gr.addColorStop(0,"rgba(255,236,220,0.9)"); gr.addColorStop(1,"rgba(255,220,200,0)"); g.fillStyle=gr; g.fillRect(0,0,32,32); return new THREE.CanvasTexture(c); })();
const crackTex=(()=>{ const c=document.createElement("canvas"); c.width=c.height=128; const g=c.getContext("2d"); g.strokeStyle="rgba(14,11,9,0.95)"; g.lineCap="round";
  for(let i=0;i<9;i++){ let x=64,y=64,a=i/9*Math.PI*2+Math.random()*0.4; g.lineWidth=3; g.beginPath(); g.moveTo(x,y); for(let k=0;k<6;k++){ a+=(Math.random()-.5)*0.9; const L=6+Math.random()*9; x+=Math.cos(a)*L; y+=Math.sin(a)*L; g.lineTo(x,y); g.lineWidth=Math.max(0.6,3-k*0.45); } g.stroke(); }
  return new THREE.CanvasTexture(c); })();
function dust(p,s=1,n=6){ for(let i=0;i<n;i++){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:dustTex,transparent:true,depthWrite:false})); m.position.set(p.x+(Math.random()-.5)*0.3*s,0.06+Math.random()*0.08,p.z+(Math.random()-.5)*0.3*s); m.scale.setScalar(0.16*s*(0.7+Math.random()*0.6)); scene.add(m);
  fx.push({m,t:0,life:0.8+Math.random()*0.6,o:0.85,v:new THREE.Vector3((Math.random()-.5)*1.6*s,0.25+Math.random()*0.55*s,(Math.random()-.5)*1.6*s),g:-0.25,grow:1.1,drag:2.8}); } }
function debris(p,n,s=1){ for(let i=0;i<n;i++){ const sz=0.012+Math.random()*0.03, gray=Math.random()<0.6; const m=new THREE.Mesh(new THREE.BoxGeometry(sz,sz*(0.5+Math.random()),sz*(0.6+Math.random()*0.8)),new THREE.MeshLambertMaterial({color:gray?[0x5c5650,0x6e665c,0x4a4540][i%3]:[0x5a4430,0x6b5038][i%2],transparent:true}));
  m.position.set(p.x+(Math.random()-.5)*0.2*s,0.03,p.z+(Math.random()-.5)*0.2*s); scene.add(m);
  fx.push({m,t:0,life:2.6+Math.random(),v:new THREE.Vector3((Math.random()-.5)*2.6*s,1.0+Math.random()*1.8*s,(Math.random()-.5)*2.6*s),g:9.8,spin:6+Math.random()*10,floor:true,bounce:true,fade:true,h:sz*0.4}); } }
function ring(p,r){ // impact shove: a radial burst of real particles hugging the floor (no drawn circle)
  const n=Math.round(10+9*r); for(let i=0;i<n;i++){ const a=i/n*Math.PI*2+Math.random()*0.5, sp=r*(2.4+Math.random()*1.6); const m=new THREE.Sprite(new THREE.SpriteMaterial({map:dustTex,transparent:true,depthWrite:false}));
    m.position.set(p.x+Math.cos(a)*0.15,0.05+Math.random()*0.06,p.z+Math.sin(a)*0.15); m.scale.setScalar((0.1+0.06*r)*(0.7+Math.random()*0.6)); scene.add(m);
    fx.push({m,t:0,life:0.55+Math.random()*0.45,o:0.75,v:new THREE.Vector3(Math.cos(a)*sp,0.12+Math.random()*0.35,Math.sin(a)*sp),g:0.4,grow:1.6,drag:3.6}); }
  for(let i=0;i<Math.round(5*r);i++){ const a=Math.random()*Math.PI*2, sp=r*(1.5+Math.random()*2.5), sz=0.012+Math.random()*0.02; const m=new THREE.Mesh(new THREE.BoxGeometry(sz,sz,sz),new THREE.MeshLambertMaterial({color:Math.random()<0.6?0x4a4640:0x6a5a48}));
    m.position.set(p.x,0.04,p.z); scene.add(m); fx.push({m,t:0,life:1.6,o:1,v:new THREE.Vector3(Math.cos(a)*sp,0.6+Math.random()*1.2,Math.sin(a)*sp),g:9.8,floor:true,bounce:true,spin:12,fade:true}); } }
function crack(p,size){ const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:crackTex,transparent:true,depthWrite:false,opacity:0})); m.rotation.x=-Math.PI/2; m.rotation.z=Math.random()*6; m.position.set(p.x,0.008,p.z); scene.add(m); fx.push({m,t:0,life:6,decal:true}); }
function streak(p,s=1){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:streakTex,transparent:true,depthWrite:false,opacity:0.7})); m.position.copy(p); m.scale.setScalar(0.07*s); scene.add(m); fx.push({m,t:0,life:0.14,o:0.7,v:new THREE.Vector3(),g:0}); }
function tipOf(C,side){ const p=new THREE.Vector3(side==="L"?0.07:-0.07,0,0); C.B["hand_"+side].localToWorld(p); return p; }
function footOf(C,side){ const p=new THREE.Vector3(0,-0.05,0.08); C.B["foot_"+side].localToWorld(p); p.y=0.03; return p; }
// a heavy landing: dust along the body, grit kicked out from under it, a ring and (for the worst) a crack
function slamLine(a,b,k=1){ for(let i=0;i<=4;i++){ const p=a.clone().lerp(b,i/4); dust(p,0.9*k,3); debris(p,Math.round(3*k),0.9*k); } const m=a.clone().lerp(b,0.5); ring(m,1.2*k); }
let punch=0; function camPunch(k){ punch=Math.max(punch,k); }
function footDust(C,dt){ if(!C||!C.group.visible||dt<=0) return; const st=C.fd||(C.fd={});
  for(const sd of ["L","R"]){ const p=new THREE.Vector3(0,-0.05,0.08); C.B["foot_"+sd].localToWorld(p); const q=st[sd]; st[sd]={p:p.clone(),cd:Math.max(0,(q?q.cd:0)-dt)};
    if(!q) continue; const vx=(p.x-q.p.x)/dt, vz=(p.z-q.p.z)/dt, vy=(p.y-q.p.y)/dt, sp=Math.hypot(vx,vz);
    if(p.y<0.1 && st[sd].cd<=0 && (sp>2.4 || vy<-2.4)){ const k=Math.min(1,Math.max((sp-1.5)/3,(-vy-1.5)/2.5)); const g=p.clone(); g.y=0.02;
      dust(g,0.35+0.5*k,1+Math.round(2*k)); if(k>0.6) debris(g,Math.round(2*k),0.4); st[sd].cd=0.16; } } }
const smearTex=(()=>{ const c=document.createElement("canvas"); c.width=c.height=64; const g=c.getContext("2d"); g.fillStyle="rgba(110,8,6,0.9)"; for(let i=0;i<14;i++){ g.beginPath(); g.ellipse(20+Math.random()*24,26+Math.random()*24,3+Math.random()*7,3+Math.random()*9,Math.random(),0,7); g.fill(); }
  for(let i=0;i<5;i++) g.fillRect(24+Math.random()*16,40,2+Math.random()*2,10+Math.random()*20); return new THREE.CanvasTexture(c); })();
function smear(C,on){ if(C.hb&&!on) for(const m of C.hb) m.material.opacity=0; if(C.smear&&!on){ C.smear.scale.set(1,1,1); C.smear.position.x=0; } if(!C.smear){ const m=new THREE.Mesh(new THREE.PlaneGeometry(0.16,0.16),new THREE.MeshBasicMaterial({map:smearTex,transparent:true,depthWrite:false,opacity:0})); m.position.set(0,0.06,0.115); C.B.head.add(m); C.smear=m; }
  C.smear.material.opacity=on; }
function handTip(C){ const p=new THREE.Vector3(-0.07,0,0); C.B.hand_R.localToWorld(p); return p; }
function handBloodL(C,k){ if(!C.hbL){ const m=new THREE.Mesh(new THREE.PlaneGeometry(0.09,0.07),new THREE.MeshBasicMaterial({map:smearTex,transparent:true,depthWrite:false,side:THREE.DoubleSide,opacity:0})); m.position.set(0.05,0,0.0); m.rotation.x=Math.PI/2; C.B.hand_L.add(m); C.hbL=m; decals.push({m,kind:"hand",t:0}); } C.hbL.material.opacity=k; }
function handBlood(C,k){ if(!C.hb){ const m=new THREE.Mesh(new THREE.PlaneGeometry(0.09,0.07),new THREE.MeshBasicMaterial({map:smearTex,transparent:true,depthWrite:false,side:THREE.DoubleSide,opacity:0})); m.position.set(-0.05,0.0,0.0); m.rotation.x=Math.PI/2; C.B.hand_R.add(m);
    const m2=m.clone(); m2.material=m.material; m2.rotation.x=0; m2.position.set(-0.05,0,0.018); C.B.hand_R.add(m2); C.hb=[m,m2]; } for(const m of C.hb) m.material.opacity=k; C.hbK=k; }
function smearStreak(C,u){ if(!C.smear) return; C.smear.position.x=-0.03*u; C.smear.scale.set(1+0.6*u,1-0.15*u,1); }
function mouthPos(C){ const p=new THREE.Vector3(0,0.04,0.11); C.B.head.localToWorld(p); return p; }

// ---------------------------------------------------------------- sound cues (placeholders: shown on screen, not played)
let cueT=0; function cue(s){ return; const el=document.getElementById("cue"); el.textContent="♪ "+s; el.style.opacity=1; cueT=1.2; }
let dmgT=0; function dmg(a,b){ if(ctx&&ctx.events) ctx.events.push({kind:"dmg",a,b}); return; const el=document.getElementById("dmg"); el.innerHTML=`${a}<small>${b}</small>`; el.style.opacity=1; dmgT=1.8; }
let hold=0; function hitStop(s){}   /* no freeze frames: impact frames are reserved for the runner's drop kick */
let shake=0;

// ---------------------------------------------------------------- physics guard
// Every character is a real mass: its centre of mass comes from the mesh's volume (voxelised once, carried by the
// bones), the floor can only push, and anything unsupported falls at g. Each frame, after a clip has posed a body:
//  · vertical: the body sits at the higher of "resting on what supports it" and "its centre of mass continuing on a
//    ballistic arc". So it can't hover, can't sink, can't be pulled down faster than gravity, and leaves the floor by itself
//    when it pushes off hard enough; in the air the centre of mass is a parabola whatever the limbs do.
//  · horizontal: airborne the centre of mass keeps its velocity; on the floor the zero-moment point (where the floor's
//    reaction must act) has to lie inside the support polygon, so a body that would tip is moved back over its support
//    (the Brute shifts its body over its planted stumps; the jointed bodies use the ankle strategy and tip about the edge of their feet).
const PHYS=(function(){
  const V=THREE.Vector3, G=9.8; const GC=['getX','getY','getZ','getW']; const comp=(A,i,w)=>A[GC[w]](i);
  // --- mass model: fill the closed mesh with points (vertical rays, inside = between hit pairs) and give each one to the bones of the nearest vertex
  function massModel(mesh,cell){ const g=mesh.geometry, P=g.attributes.position, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, idx=g.index?g.index.array:null;
    const nT=idx?idx.length/3:P.count/3, vi=k=>idx?idx[k]:k; const bb=new THREE.Box3().setFromBufferAttribute(P), size=bb.getSize(new V());
    cell=cell||Math.max(size.x,size.y,size.z)/48; const nx=Math.ceil(size.x/cell)+1, nz=Math.ceil(size.z/cell)+1, cols=new Map();
    const a=new V(),b=new V(),c=new V();
    for(let t=0;t<nT;t++){ a.fromBufferAttribute(P,vi(3*t)); b.fromBufferAttribute(P,vi(3*t+1)); c.fromBufferAttribute(P,vi(3*t+2));
      const x0=Math.max(0,Math.floor((Math.min(a.x,b.x,c.x)-bb.min.x)/cell)), x1=Math.min(nx-1,Math.ceil((Math.max(a.x,b.x,c.x)-bb.min.x)/cell));
      const z0=Math.max(0,Math.floor((Math.min(a.z,b.z,c.z)-bb.min.z)/cell)), z1=Math.min(nz-1,Math.ceil((Math.max(a.z,b.z,c.z)-bb.min.z)/cell));
      const d=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z); if(Math.abs(d)<1e-12) continue;
      for(let i=x0;i<=x1;i++) for(let j=z0;j<=z1;j++){ const px=bb.min.x+(i+0.5)*cell, pz=bb.min.z+(j+0.5)*cell;
        const l1=((b.z-c.z)*(px-c.x)+(c.x-b.x)*(pz-c.z))/d, l2=((c.z-a.z)*(px-c.x)+(a.x-c.x)*(pz-c.z))/d, l3=1-l1-l2; if(l1<0||l2<0||l3<0) continue;
        const k=i*nz+j; let L=cols.get(k); if(!L) cols.set(k,L=[]); L.push(l1*a.y+l2*b.y+l3*c.y); } }
    // nearest-vertex lookup on a hash grid
    const hc=cell*2, H=new Map(), key=(x,y,z)=>`${Math.floor(x/hc)},${Math.floor(y/hc)},${Math.floor(z/hc)}`;
    for(let i=0;i<P.count;i++){ const k=key(P.getX(i),P.getY(i),P.getZ(i)); let L=H.get(k); if(!L) H.set(k,L=[]); L.push(i); }
    const nearest=(x,y,z)=>{ for(let r=1;r<6;r++){ let best=-1,bd=1e18; const cx=Math.floor(x/hc),cy=Math.floor(y/hc),cz=Math.floor(z/hc);
        for(let i=-r;i<=r;i++) for(let j=-r;j<=r;j++) for(let k=-r;k<=r;k++){ const L=H.get(`${cx+i},${cy+j},${cz+k}`); if(!L) continue; for(const v of L){ const dx=P.getX(v)-x,dy=P.getY(v)-y,dz=P.getZ(v)-z, dd=dx*dx+dy*dy+dz*dz; if(dd<bd){ bd=dd; best=v; } } }
        if(best>=0) return best; } return 0; };
    const nb=mesh.skeleton.bones.length, M=new Float64Array(nb), C=new Float64Array(nb*3); let tot=0;
    for(const [k,L] of cols){ L.sort((p,q)=>p-q); const u=[]; for(const y of L) if(!u.length||y-u[u.length-1]>1e-4) u.push(y);
      const iv=[]; if(u.length>=2){ if(u.length%2===0) for(let s=0;s<u.length;s+=2) iv.push([u[s],u[s+1]]); else iv.push([u[0],u[u.length-1]]); }
      const i=Math.floor(k/nz), j=k%nz, px=bb.min.x+(i+0.5)*cell, pz=bb.min.z+(j+0.5)*cell;
      for(const [y0,y1] of iv) for(let y=y0+cell/2;y<y1;y+=cell){ const v=nearest(px,y,pz); const h=Math.min(cell,y1-y+cell/2);
        for(let w=0;w<4;w++){ const wt=comp(SW,v,w); if(wt<=0) continue; const bi=comp(SI,v,w), m=wt*h; M[bi]+=m; C[3*bi]+=m*px; C[3*bi+1]+=m*y; C[3*bi+2]+=m*pz; tot+=m; } } }
    const parts=[]; for(let i=0;i<nb;i++) if(M[i]>0) parts.push({bi:i,m:M[i]/tot,c:new V(C[3*i]/M[i],C[3*i+1]/M[i],C[3*i+2]/M[i])});
    return {mesh,parts,vol:tot*cell*cell}; }
  const _m=new THREE.Matrix4(), _p=new V();
  function comOf(mm,out){ const mesh=mm.mesh, sk=mesh.skeleton; out=out||new V(); out.set(0,0,0); mesh.updateMatrixWorld(true);
    let ws=0; for(const q of mm.parts){ const bn=sk.bones[q.bi]; if(bn.userData.detached) continue;   // a piece knocked off is no longer part of the body
      _p.copy(q.c).applyMatrix4(mesh.bindMatrix).applyMatrix4(sk.boneInverses[q.bi]).applyMatrix4(bn.matrixWorld).applyMatrix4(mesh.bindMatrixInverse).applyMatrix4(mesh.matrixWorld); const mw=q.m*(bn.userData.massScale||1); out.addScaledVector(_p,mw); ws+=mw; }
    return ws>0?out.divideScalar(ws):out; }
  // --- contact points: the extreme vertices of every bone's part (corners are what touch the floor) plus a spread sample
  function contactSet(mesh){ const g=mesh.geometry, P=g.attributes.position, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, by=new Map();
    for(let i=0;i<P.count;i++){ let bi=0,bw=-1; for(let w=0;w<4;w++){ const x=comp(SW,i,w); if(x>bw){ bw=x; bi=comp(SI,i,w); } } let L=by.get(bi); if(!L) by.set(bi,L=[]); L.push(i); }
    const dirs=[]; for(const x of [-1,0,1]) for(const y of [-1,0,1]) for(const z of [-1,0,1]) if(x||y||z) dirs.push(new V(x,y,z).normalize());
    const S=new Set(); const v=new V(); for(const [,L] of by){ for(const d of dirs){ let best=-1,bd=-1e18; for(const i of L){ v.fromBufferAttribute(P,i); const s=v.dot(d); if(s>bd){ bd=s; best=i; } } S.add(best); } }
    const step=Math.max(1,Math.floor(P.count/400)); for(let i=0;i<P.count;i+=step) S.add(i); return [...S]; }
  function lowPts(mesh,set,out){ const P=mesh.geometry.attributes.position; mesh.updateMatrixWorld(true); out.length=0; for(const i of set){ const p=new V().fromBufferAttribute(P,i); mesh.boneTransform(i,p); p.applyMatrix4(mesh.matrixWorld); out.push(p); } return out; }
  function hull(pts){ if(pts.length<3) return pts.map(p=>({x:p.x,z:p.z})); const Q=pts.map(p=>[p.x,p.z]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]); const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);
    const lo=[],up=[]; for(const p of Q){ while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0) lo.pop(); lo.push(p); } for(let i=Q.length-1;i>=0;i--){ const p=Q[i]; while(up.length>=2&&cr(up[up.length-2],up[up.length-1],p)<=0) up.pop(); up.push(p); } up.pop(); lo.pop(); return lo.concat(up).map(a=>({x:a[0],z:a[1]})); }
  // nearest point of a convex polygon to (x,z); d=0 when inside
  function project(h,x,z){ if(!h.length) return null; if(h.length===1) return {x:h[0].x,z:h[0].z,d:Math.hypot(x-h[0].x,z-h[0].z)}; let inside=h.length>2, best=1e18, bx=0, bz=0;
    for(let i=0;i<h.length;i++){ const a=h[i], b=h[(i+1)%h.length], ex=b.x-a.x, ez=b.z-a.z, L2=ex*ex+ez*ez||1e-12; const u=Math.max(0,Math.min(1,((x-a.x)*ex+(z-a.z)*ez)/L2)); const qx=a.x+u*ex, qz=a.z+u*ez, d=Math.hypot(x-qx,z-qz); if(d<best){ best=d; bx=qx; bz=qz; } if(ex*(z-a.z)-ez*(x-a.x)<0) inside=false; }
    return inside?{x,z,d:0}:{x:bx,z:bz,d:best}; }
  // shrink toward the centroid so the zero-moment point keeps a margin from the edge
  function shrink(h,m){ if(h.length<3) return h; let cx=0,cz=0; for(const p of h){ cx+=p.x; cz+=p.z; } cx/=h.length; cz/=h.length; return h.map(p=>{ const dx=p.x-cx, dz=p.z-cz, L=Math.hypot(dx,dz)||1; const k=Math.max(0,L-m)/L; return {x:cx+dx*k,z:cz+dz*k}; }); }

  // A body: one or more skinned meshes treated as one mass
  function domBone(mesh,set){ const g=mesh.geometry, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight; return set.map(i=>{ let bi=0,bw=-1; for(let w=0;w<4;w++){ const x=comp(SW,i,w); if(x>bw){ bw=x; bi=comp(SI,i,w); } } return mesh.skeleton.bones[bi]; }); }
  function body(meshes){ meshes=[].concat(meshes); const B={meshes, mm:meshes.map(m=>massModel(m)), cs:meshes.map(m=>contactSet(m)), pts:[], st:null}; B.cb=meshes.map((m,i)=>domBone(m,B.cs[i])); B.bone=[].concat(...B.cb);
    B.vol=B.mm.reduce((s,q)=>s+q.vol,0);
    B.refresh=()=>{ B.cb=meshes.map((m,i)=>domBone(m,B.cs[i])); B.bone=[].concat(...B.cb); };   // after the skinning changes (armour knocked loose)
    B.measure=function(){ const c=new V(); let tot=0; for(let i=0;i<meshes.length;i++){ const w=B.mm[i].vol; c.addScaledVector(comOf(B.mm[i]),w); tot+=w; } c.divideScalar(tot||1);
      const all=[]; for(let i=0;i<meshes.length;i++){ const o=[]; lowPts(meshes[i],B.cs[i],o); for(const p of o) all.push(p); }
      for(let k=0;k<all.length;k++) if(B.bone[k]&&B.bone[k].userData.detached) all[k].y=99;
      let low=1e9; for(const p of all) low=Math.min(low,p.y);
      const con=all.filter(p=>p.y<Math.max(low+0.03,0.035)&&p.y<0.06); return {com:c,low,con,hull:hull(con),pts:all,bone:B.bone}; };
    B.reset=()=>{ B.st=null; }; return B; }

  // Vertical: given the measurement with the current offset e applied, return the next offset.
  //  upper (optional): how much higher the body may sit and still be held up by limbs that reach the floor (IK stumps); none = rigid.
  //  want: the offset the clip would like (0 = as authored), used when limbs hold it up.
  function vstep(S,m,dt,o={}){ const low=m.low, cy=m.com.y; const lower=S.e-low;
    const upper = o.upper!=null ? Math.max(lower,S.e+o.upper) : lower; const want=o.want!=null?o.want:lower; let tgt=Math.min(upper,Math.max(lower,want));
    if(o.riseMax!=null && tgt>S.e && tgt>lower) tgt=Math.min(tgt,Math.max(lower,S.e+o.riseMax*dt));
    let e=tgt, air=false;
    if(S.init && !o.held){ const pred=S.cy+S.vy*dt-0.5*G*dt*dt, eb=S.e+(pred-cy); if(eb>tgt+1e-5){ e=eb; air=true; } }
    if(o.held){ e=S.e; air=false; }
    const cyPhys=cy+(e-S.e); if(air) S.vy-=G*dt; else { S.vy = S.init ? (cyPhys-S.cy)/dt : 0; if(S.air) S.landV=S.vy; }   // airborne: exactly v -= g dt
    // on the floor the guard never launches a body: only a declared impulse (a jump, a hit) does. It only lets go
    // downward: a body whose support falls away starts falling from its current downward speed.
    if(!air) S.vy=Math.max(-6,Math.min(0,S.vy));
    S.cy=cyPhys; S.air=air; S.e=e; S.init=true; return e; }
  // Horizontal while airborne: the centre of mass keeps the velocity it left with
  function hstep(S,m,dt){ const c=m.com; if(!S.hinit){ S.hx=S.hx||0; S.hz=S.hz||0; S.cx=c.x; S.cz=c.z; S.vx=0; S.vz=0; S.hinit=true; S.airT=0; return; }
    const cx=c.x+0, cz=c.z+0;
    if(S.air) S.airT+=dt; else S.airT=0;
    if(S.air && S.airT>0.1){ const px=S.cx+S.vx*dt, pz=S.cz+S.vz*dt; S.hx+=px-cx; S.hz+=pz-cz; S.cx=px; S.cz=pz; }
    else { const vx=(cx-S.cx)/dt, vz=(cz-S.cz)/dt; const k=Math.min(1,dt*30); S.vx+= (vx-S.vx)*k; S.vz+=(vz-S.vz)*k; S.cx=cx; S.cz=cz; } }
  // Limbs on the floor: a body lying down rests on its trunk; an arm or leg that would go through the floor is bent up by
  // it (rotated about its shoulder or hip), instead of the whole body being propped up on a foot or a hand.
  const LIMBS=["upperarm_L","upperarm_R","thigh_L","thigh_R"];
  function limbMap(B,names){ const key=names.join(); B.lm=B.lm||{}; if(B.lm[key]&&B.lm[key].bone===B.bone) return B.lm[key].map; if(!B.byName){ B.byName={}; for(const m of B.meshes) for(const bn of m.skeleton.bones) B.byName[bn.name]=bn; }
    const map=B.bone.map(bn=>{ for(let q=bn;q;q=q.parent) if(names.includes(q.name)) return q.name; return null; }); B.lm[key]={bone:B.bone,map}; return map; }
  function limbSetup(B){ B.limb=limbMap(B,LIMBS); }
  function coreLow(B,m){ limbSetup(B); let lo=1e9; m.pts.forEach((p,k)=>{ if(!B.limb[k]) lo=Math.min(lo,p.y); }); return lo; }
  function fold(B,names){ const lm=limbMap(B,names||LIMBS); const up=new V(0,1,0);
    for(let it=0;it<3;it++){ const m=B.measure(), worst={}; m.pts.forEach((p,k)=>{ const L=lm[k]; if(L && p.y<0.005 && (!worst[L]||p.y<worst[L].y)) worst[L]=p; }); let any=false;
      for(const L in worst){ const bone=B.byName[L]; if(!bone||!bone.parent) continue; const p=worst[L], r0=bone.getWorldPosition(new V()), v=p.clone().sub(r0), len=v.length(); if(len<0.05) continue;
        let ax=v.clone().cross(up); if(ax.lengthSq()<1e-4*len*len){ ax=new V(1,0,0).applyQuaternion(bone.parent.getWorldQuaternion(new THREE.Quaternion())).setY(0); }   // hanging straight down: swing it about the hip's side axis
        ax.normalize(); const phi=Math.asin(Math.min(1,Math.max(-1,-v.y/len))), phiT=Math.asin(Math.min(1,Math.max(-1,(r0.y-0.012)/len))), d=Math.max(0.002,phi-phiT);   // exact swing so the lowest point just clears the floor
        ax.applyQuaternion(bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert()); bone.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(ax,d)); bone.updateMatrixWorld(true); any=true; }
      if(!any) break; } }
  // A jointed body placed by a group (Norah, the ACROSS, the Runner). Call right after the page has posed and placed it.
  //  o.held: something else is holding it up (skip). o.balance: ankle strategy on: a body whose centre of mass leaves its
  //  feet is tipped back about the edge of its support (as feet and ankles do). Off for authored falls and dynamic gaits.
  //  o.kick: {id, v:{x,y,z}} an impulse (a jump, a hit) that sends it ballistic.
  function rig(C,dt,o={}){ const g=C.group; if(!g||!g.visible) return null; const S=C.gs||(C.gs={e:0,hx:0,hz:0,rv:new V(),piv:new V()});
    if(o.held){ S.e=0; S.hx=S.hz=0; S.init=false; S.hinit=false; S.rv.set(0,0,0); S.wasHeld=true; return null; }
    if(!C.pb){ const ms=[]; g.traverse(q=>{ if(q.isSkinnedMesh) ms.push(q); }); C.pb=body(ms); }
    g.position.x+=S.hx; g.position.y+=S.e; g.position.z+=S.hz;
    const ang=S.rv.length(); if(ang>1e-5){ const ax=S.rv.clone().divideScalar(ang); g.position.sub(S.piv).applyAxisAngle(ax,ang).add(S.piv); g.rotateOnWorldAxis(ax,ang); }
    g.updateMatrixWorld(true); const m=C.pb.measure(); const lying=!o.rigid && m.com.y<0.5; if(lying) m.low=coreLow(C.pb,m);   /* rigid: a plank on its heels is carried by them */
    if(o.soft&&!lying){ const lm=limbMap(C.pb,o.soft); let lo=1e9; m.pts.forEach((p,k)=>{ if(!lm[k]) lo=Math.min(lo,p.y); }); m.low=lo; }   /* soft limbs (a swung club): the floor stops the limb, it can't lift the body */
    if(o.kick && S.kickId!==o.kick.id){ S.kickId=o.kick.id; S.vy=o.kick.v.y; S.vx=o.kick.v.x; S.vz=o.kick.v.z; S.e+=0.003; S.forceAir=true; S.airT=0.2; }
    const e0=S.e, hx0=S.hx, hz0=S.hz; vstep(S,m,dt,{}); if(S.forceAir){ S.air=true; S.forceAir=false; } hstep(S,m,dt);
    g.position.x+=S.hx-hx0; g.position.y+=S.e-e0; g.position.z+=S.hz-hz0;
    if(lying){ g.updateMatrixWorld(true); fold(C.pb); }
    if(o.soft){ g.updateMatrixWorld(true); fold(C.pb,o.soft); }
    const still=Math.hypot(S.vx||0,S.vz||0)<0.35;   // static balance only: a moving body balances by stepping (the gaits do that)
    if(o.balance && still && !S.air && m.con.length){ const H=shrink(hull(m.con),0.015), c=m.com, pr=project(H,c.x,c.z), h=Math.max(0.4,c.y);
      if(pr.d>0.005){ const d=new V(pr.x-c.x,0,pr.z-c.z), L=d.length(), ax=new V(d.z/L,0,-d.x/L); S.rv.addScaledVector(ax,Math.atan(L/h)*Math.min(1,dt*10)); S.piv.set(pr.x,0,pr.z); }
      else S.rv.multiplyScalar(Math.max(0,1-dt*1.5)); if(S.rv.length()>0.2) S.rv.setLength(0.2); }
    else S.rv.multiplyScalar(Math.max(0,1-dt*4));
    return m; }
  // A stiff body going over: a rod of height H pivoting on its feet under gravity, theta'' = (3g/2H) sin(theta).
  // S={th,w}: start angle and the push it was given. Returns the fall fraction (0 upright .. 1 flat) and S.done on impact.
  function topple(S,dt,H,thMax){ thMax=thMax??Math.PI/2; if(!S.done){ S.w+=1.5*G/H*Math.sin(S.th)*dt; S.th+=S.w*dt; if(S.th>=thMax){ S.th=thMax; S.done=true; S.impactW=S.w; } } return S.th/(Math.PI/2); }
  return {G,massModel,comOf,contactSet,lowPts,hull,project,shrink,body,vstep,hstep,rig,topple,coreLow,fold};
})();

// ---------------------------------------------------------------- auto-rig: the two-armed Brutes come as one static mesh. Split it into its pieces and bind them to bones:
// each stump arch gets a chain (shoulder → arch top → knee → foot) bent with IK; each viscera lump its own bone (so it can burst);
// each little arm two bones (wriggle, go limp); the man gets torso, head and legs.
function autoRig(gltf,opt={}){
  let src=null; gltf.scene.traverse(o=>{ if(o.isMesh&&!src) src=o; });
  const geo=src.geometry.clone(); const P=geo.attributes.position, N=P.count, idx=geo.index.array;
  const par=new Int32Array(N); for(let i=0;i<N;i++) par[i]=i; const f=x=>{ while(par[x]!==x){ par[x]=par[par[x]]; x=par[x]; } return x; }; const u=(a,b)=>{ a=f(a); b=f(b); if(a!==b) par[b]=a; };
  for(let i=0;i<idx.length;i+=3){ u(idx[i],idx[i+1]); u(idx[i],idx[i+2]); }
  const weld=new Map(); for(let i=0;i<N;i++){ const k=`${P.getX(i).toFixed(3)},${P.getY(i).toFixed(3)},${P.getZ(i).toFixed(3)}`; if(weld.has(k)) u(weld.get(k),i); else weld.set(k,i); }
  const C=new Map(); for(let i=0;i<N;i++){ const r=f(i); if(!C.has(r)) C.set(r,[]); C.get(r).push(i); }
  const v=new THREE.Vector3(); const comps=[...C.values()].map(vs=>{ const b=new THREE.Box3(), c=new THREE.Vector3(); for(const i of vs){ v.fromBufferAttribute(P,i); b.expandByPoint(v); c.add(v); } c.divideScalar(vs.length); const s=new THREE.Vector3(); b.getSize(s); return {vs,box:b,c,size:s,ext:Math.max(s.x,s.y,s.z)}; }).sort((a,b)=>b.vs.length-a.vs.length);
  const H=new THREE.Box3().setFromBufferAttribute(P).max.y;
  // the two stump arches are the two biggest pieces
  const stumps=comps.slice(0,2).sort((a,b)=>a.c.x-b.c.x); const side={L:stumps[1],R:stumps[0]};      // model faces +z: its left is +x
  const mean=(vs,test)=>{ const c=new THREE.Vector3(); let n=0; for(const i of vs){ v.fromBufferAttribute(P,i); if(test(v)){ c.add(v); n++; } } return n?c.divideScalar(n):null; };
  const L={};
  for(const s of ["L","R"]){ const st=side[s], sg=Math.sign(st.c.x), top=st.box.max.y;
    const foot=mean(st.vs,p=>p.y<0.06*top), apex=mean(st.vs,p=>p.y>0.93*top), knee=mean(st.vs,p=>p.y>0.5*top&&p.y<0.58*top), wrist=mean(st.vs,p=>p.y>0.15*top&&p.y<0.21*top);
    let minAX=1e9; for(const i of st.vs){ v.fromBufferAttribute(P,i); if(v.y>0.7*top) minAX=Math.min(minAX,Math.abs(v.x)); }
    const inner=mean(st.vs,p=>p.y>0.7*top && Math.abs(p.x)<minAX+0.16) || apex.clone();
    L[s]={shoulder:new THREE.Vector3(inner.x,Math.max(inner.y,apex.y-0.3),inner.z), apex, knee, wrist, foot}; }
  const shoulderY=(L.L.shoulder.y+L.R.shoulder.y)/2;
  const isArm=c=>c.vs.length<130 && c.ext>0.26 && !(Math.abs(c.c.x)<0.3 && c.c.y<shoulderY);   // the little arms: long thin pieces
  // bones (bind pose: identity rotations, positions only)
  const bones=[], B={}; const mk=(name,pos,parent)=>{ const b=new THREE.Bone(); b.name=name; const w=pos.clone(); if(parent){ parent.updateMatrixWorld(true); parent.worldToLocal(w); } b.position.copy(w); if(parent) parent.add(b); bones.push(b); B[name]=b; return b; };
  const root=mk("root",new THREE.Vector3(0,shoulderY,0),null); root.updateMatrixWorld(true);
  const torso=mk("torso",new THREE.Vector3(0,shoulderY,0),root);
  for(const s of ["L","R"]){ const l=L[s]; const a=mk("sh"+s,l.shoulder,root), b=mk("ap"+s,l.apex,a), c=mk("kn"+s,l.knee,b), w=mk("wr"+s,l.wrist,c), d=mk("ft"+s,l.foot,w); root.updateMatrixWorld(true); }
  const center=comps.slice(2).filter(c=>!isArm(c) && Math.abs(c.c.x)<0.3);
  const headC=center.filter(c=>c.box.min.y>shoulderY+0.02).sort((a,b)=>b.c.y-a.c.y)[0];
  if(headC) mk("head",new THREE.Vector3(0,headC.box.min.y,headC.c.z*0.3),torso);
  const legC=center.filter(c=>c.c.y<shoulderY-0.9);
  const hipY=legC.length?Math.max(...legC.map(c=>c.box.max.y)):null;
  if(hipY!=null){ for(const s of ["L","R"]){ const sg=s==="L"?1:-1; mk("leg"+s,new THREE.Vector3(0.12*sg,hipY,0),torso); } }
  root.updateMatrixWorld(true);
  // weights
  const SI=new Uint16Array(N*4), SW=new Float32Array(N*4), bi=b=>bones.indexOf(b);
  const setW=(i,list)=>{ list.sort((a,b)=>b[1]-a[1]); let tot=0; for(let k=0;k<4&&k<list.length;k++) tot+=list[k][1]; for(let k=0;k<4;k++){ if(k<list.length){ SI[i*4+k]=list[k][0]; SW[i*4+k]=list[k][1]/tot; } } };
  const wpos=b=>{ const p=new THREE.Vector3(); b.getWorldPosition(p); return p; };
  const chains={}; for(const s of ["L","R"]) chains[s]=[B["sh"+s],B["ap"+s],B["kn"+s],B["wr"+s],B["ft"+s]].map(b=>({b,p:wpos(b)}));
  const segInfo=(p,ch)=>{ let best=null; for(let k=0;k<ch.length-1;k++){ const a=ch[k].p,b=ch[k+1].p, ab=b.clone().sub(a), t=Math.max(0,Math.min(1,p.clone().sub(a).dot(ab)/ab.lengthSq())), d=a.clone().addScaledVector(ab,t).distanceTo(p); if(!best||d<best.d) best={k,t,d}; } return best; };
  const chainW=(p,ch)=>{ const s=segInfo(p,ch), k=s.k, t=s.t, list=[[bi(ch[k].b),1]];
    if(t<0.06 && k>0){ const w=0.5*(1-t/0.06); list[0][1]=1-w; list.push([bi(ch[k-1].b),w]); }
    if(t>0.94 && k<ch.length-2){ const w=0.5*((t-0.94)/0.06); list[0][1]=1-w; list.push([bi(ch[k+1].b),w]); } return list; };
  for(const s of ["L","R"]) for(const i of side[s].vs){ v.fromBufferAttribute(P,i); setW(i,chainW(v,chains[s])); }
  for(const s of ["L","R"]){ const ch=chains[s]; for(const i of side[s].vs){ v.fromBufferAttribute(P,i); const si=segInfo(v,ch); let f=0;
      if(si.k===0) f=0.45*(1-0.5*si.t); else if(si.k===1 && si.t<0.35) f=0.22*(1-si.t/0.35);
      if(f>0){ const a=ch[si.k].p, b=ch[si.k+1].p, c=a.clone().lerp(b,si.t); const d=v.clone().sub(c); d.multiplyScalar(1+f); const np=c.add(d); if(si.k===0) np.y+=0.06*(1-si.t); P.setXYZ(i,np.x,np.y,np.z); } } }
  P.needsUpdate=true; geo.computeVertexNormals();
  const lumps=[], arms=[];
  const allSeg=[]; for(const s of ["L","R"]) for(let k=0;k<4;k++) allSeg.push({s,k,a:chains[s][k],b:chains[s][k+1]});
  const nearestStump=p=>{ let best=null; for(const g of allSeg){ const ab=g.b.p.clone().sub(g.a.p), t=Math.max(0,Math.min(1,p.clone().sub(g.a.p).dot(ab)/ab.lengthSq())), d=g.a.p.clone().addScaledVector(ab,t).distanceTo(p); if(!best||d<best.d) best={...g,t,d}; } return best; };
  const manBones=[torso,B.head,B.legL,B.legR].filter(Boolean);
  const halves=comps.slice(2).filter(c=>!isArm(c) && c.vs.length>=21 && c.c.y>shoulderY-0.8 && c.c.y<shoulderY+0.2 && Math.abs(c.c.x)>0.06 && Math.abs(c.c.x)<0.3 && c.size.x>0.15 && c.size.y>0.12);
  const organs=[]; let jaw=null;
  if(halves.length>=2){ const backZ=Math.min(...halves.map(h=>h.box.min.z)); const midY=(Math.min(...halves.map(h=>h.box.min.y))+Math.max(...halves.map(h=>h.box.max.y)))/2;
    mk("jawL",new THREE.Vector3(0.02,midY,backZ),torso); mk("jawR",new THREE.Vector3(-0.02,midY,backZ),torso); jaw={halves:new Set(halves)}; }
  // armour (the endgame one): pale bone-coloured pieces, read from the texture under each piece
  const map0=src.material.map, UV=geo.attributes.uv; let tex=null;
  if(map0&&map0.image&&UV){ try{ const im=map0.image, cv=document.createElement("canvas"); cv.width=cv.height=256; const g2=cv.getContext("2d"); g2.drawImage(im,0,0,256,256); tex=g2.getImageData(0,0,256,256).data; }catch(e){ tex=null; } }
  const colOf=c=>{ if(!tex) return null; let r=0,g=0,b=0,n=0; for(let k=0;k<c.vs.length;k+=Math.max(1,c.vs.length>>6)){ const i=c.vs[k]; let x=UV.getX(i)%1, y=UV.getY(i)%1; if(x<0) x+=1; if(y<0) y+=1; const px=Math.min(255,Math.floor(x*256)), py=Math.min(255,Math.floor((map0.flipY?1-y:y)*256)), o=(py*256+px)*4; r+=tex[o]; g+=tex[o+1]; b+=tex[o+2]; n++; } return n?[r/n,g/n,b/n]:null; };
  const isArmor=c=>{ if(!opt.armor) return false; const q=colOf(c); c.col=q; return q && q[0]>100 && q[1]>q[0]*0.77 && q[2]>q[0]*0.6; };
  const armor=[];
  for(const c of comps.slice(2)){
    if(isArmor(c)){ // armour rides whatever it is strapped to, rigidly, on its own bone so it can be knocked off
      let host; if(Math.abs(c.c.x)<0.3 && c.c.y<shoulderY+0.8 && !(c.size.x>0.5)){ host= (B.head && c.c.y>shoulderY+0.05) ? B.head : torso; } else { const ns=nearestStump(c.c); host=ns.t>0.5?ns.b.b:ns.a.b; c.side=ns.s; }
      const ab=mk("armor"+armor.length,c.c,host); armor.push({b:ab,c:c.c.clone(),side:c.side||null,vs:c.vs,ext:c.ext,size:c.size.clone(),hp:3,off:false,host:host.name}); for(const i of c.vs) setW(i,[[bi(ab),1]]); continue; }
    if(isArm(c)){ // base: the end nearest a stump
      let far=null, near=null, fd=-1, nd=1e9; for(const i of c.vs){ v.fromBufferAttribute(P,i); const ns=nearestStump(v); if(ns.d<nd){ nd=ns.d; near=v.clone(); } if(ns.d>fd){ fd=ns.d; far=v.clone(); } }
      const ns=nearestStump(near), parent=ns.t>0.5?ns.b.b:ns.a.b; const base=mk("arm"+arms.length+"a",near,parent), mid=mk("arm"+arms.length+"b",near.clone().lerp(far,0.5),base); const tip=mk("arm"+arms.length+"c",far,mid);
      const ab=far.clone().sub(near); for(const i of c.vs){ v.fromBufferAttribute(P,i); const t=Math.max(0,Math.min(1,v.clone().sub(near).dot(ab)/ab.lengthSq())); setW(i, t<0.5?[[bi(base),1-t],[bi(mid),t]]:[[bi(mid),1.5-t],[bi(tip),t-0.5]]); }
      arms.push({base,mid,tip,side:ns.s,len:ab.length(),dir:ab.clone().normalize(),c}); continue; }
    if(jaw && jaw.halves.has(c)){ const jb=c.c.x>0?B.jawL:B.jawR; for(const i of c.vs) setW(i,[[bi(jb),1]]); continue; }
    if(jaw && c.vs.length<=60 && c.ext<0.2 && Math.abs(c.c.x)<0.25 && c.c.y>shoulderY-0.7 && c.c.y<shoulderY+0.12 && c.c.z<0){ const ob=mk("organ"+organs.length,c.c,torso); organs.push({b:ob,c:c.c.clone(),alive:true}); for(const i of c.vs) setW(i,[[bi(ob),1]]); continue; }
    if(Math.abs(c.c.x)<0.3 && c.c.y<shoulderY+0.6){ // the man
      let tgt=torso; if(B.head && c===headC) tgt=B.head; else if(B.legL && c.c.y<shoulderY-0.9) tgt=c.c.x>0?B.legL:B.legR;
      for(const i of c.vs){ setW(i,[[bi(tgt),1]]); }
      // a plate strapped onto the man himself (chest plate, helmet cage): its bone-coloured vertices become their own piece
      if(opt.armor && tex){ const cream=[]; for(const i of c.vs){ const q=colOf({vs:[i]}); if(q && q[0]>100 && q[1]>q[0]*0.77 && q[2]>q[0]*0.6) cream.push(i); }
        if(cream.length>30){ const cc=new THREE.Vector3(), bb=new THREE.Box3(); for(const i of cream){ v.fromBufferAttribute(P,i); cc.add(v); bb.expandByPoint(v); } cc.divideScalar(cream.length); const sz=bb.getSize(new THREE.Vector3());
          const ab=mk("armor"+armor.length,cc,tgt); armor.push({b:ab,c:cc.clone(),side:null,vs:cream,ext:Math.max(sz.x,sz.y,sz.z),size:sz,hp:4,off:false,host:tgt.name,plate:true}); for(const i of cream) setW(i,[[bi(ab),1]]); } }
      continue; }
    // lumps, foot nubs, plates: ride the nearest stump bone; the round lumps get their own bone so they can burst
    const ns=nearestStump(c.c); const host=ns.t>0.5?ns.b.b:ns.a.b;
    if(c.vs.length<=60 && c.ext<0.25 && c.c.y>0.4){ const lb=mk("lump"+lumps.length,c.c,host); lumps.push({b:lb,side:ns.s,c:c.c.clone(),r:c.ext/2,alive:true}); for(const i of c.vs) setW(i,[[bi(lb),1]]); }
    else for(const i of c.vs) setW(i,[[bi(host),1]]); }
  for(let i=0;i<N;i++) if(SW[i*4]===0){ v.fromBufferAttribute(P,i); setW(i,[[bi(torso),1]]); }
  // armour is fitted to the skin: every armour vertex takes the skinning of the flesh right under it, so it bends exactly as
  // that flesh bends (over a joint it flexes with the joint, elsewhere it is carried rigidly) and can never lift off or sink in.
  // Only when a piece is knocked loose does it switch to its own bone and become a rigid body.
  if(armor.length){ const body=new Set(["root","torso","head","legL","legR"]); for(const s of ["L","R"]) for(const k of ["sh","ap","kn","wr","ft"]) body.add(k+s);
    const isBody=i=>{ const b=bones[SI[i*4]]; return b && body.has(b.name) && SW[i*4]>0; };
    const armV=new Set(); for(const a of armor) for(const i of a.vs) armV.add(i);
    const hc=0.08, H2=new Map(), key=(x,y,z)=>`${Math.floor(x/hc)},${Math.floor(y/hc)},${Math.floor(z/hc)}`;
    for(let i=0;i<N;i++){ if(armV.has(i)||!isBody(i)) continue; const k=key(P.getX(i),P.getY(i),P.getZ(i)); let L=H2.get(k); if(!L) H2.set(k,L=[]); L.push(i); }
    const nearestBody=(x,y,z)=>{ for(let r=1;r<6;r++){ let best=-1,bd=1e18; const cx=Math.floor(x/hc),cy=Math.floor(y/hc),cz=Math.floor(z/hc);
        for(let a=-r;a<=r;a++) for(let b2=-r;b2<=r;b2++) for(let c2=-r;c2<=r;c2++){ const L=H2.get(`${cx+a},${cy+b2},${cz+c2}`); if(!L) continue; for(const j of L){ const dx=P.getX(j)-x,dy=P.getY(j)-y,dz=P.getZ(j)-z, d=dx*dx+dy*dy+dz*dz; if(d<bd){ bd=d; best=j; } } }
        if(best>=0) return best; } return -1; };
    for(const a of armor){ a.own=bi(a.b); a.skinI=new Uint16Array(a.vs.length*4); a.skinW=new Float32Array(a.vs.length*4); a.multi=0;
      a.vs.forEach((i,n)=>{ const j=nearestBody(P.getX(i),P.getY(i),P.getZ(i)); if(j>=0){ for(let k=0;k<4;k++){ SI[i*4+k]=SI[j*4+k]; SW[i*4+k]=SW[j*4+k]; } if(SW[j*4]<0.95) a.multi++; }
        for(let k=0;k<4;k++){ a.skinI[n*4+k]=SI[i*4+k]; a.skinW[n*4+k]=SW[i*4+k]; } }); a.bends=a.multi>a.vs.length*0.1; } }
  geo.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(SI,4)); geo.setAttribute("skinWeight",new THREE.Float32BufferAttribute(SW,4));
  const map=src.material.map; if(map) map.encoding=THREE.LinearEncoding;
  const mesh=new THREE.SkinnedMesh(geo,new THREE.MeshLambertMaterial({map,side:THREE.DoubleSide,skinning:true})); mesh.frustumCulled=false;
  mesh.add(root); mesh.bind(new THREE.Skeleton(bones));
  // bind directions (each bone's child) for aiming bones later
  const bind={}; for(const b of bones){ const ch=b.children.find(x=>x.isBone); if(ch) bind[b.name]=ch.position.clone().normalize(); }
  bind.legL=new THREE.Vector3(0,-1,0); bind.legR=new THREE.Vector3(0,-1,0); bind.head=new THREE.Vector3(0,1,0);
  const len={}; for(const s of ["L","R"]){ len["a"+s]=chains[s][0].p.distanceTo(chains[s][1].p); len["b"+s]=chains[s][1].p.distanceTo(chains[s][2].p); len["c"+s]=chains[s][2].p.distanceTo(chains[s][3].p); len["d"+s]=chains[s][3].p.distanceTo(chains[s][4].p); }
  const rest={}; for(const s of ["L","R"]){ rest["foot"+s]=chains[s][4].p.clone(); rest["sh"+s]=chains[s][0].p.clone(); rest["ap"+s]=chains[s][1].p.clone(); }
  return {mesh,B,bones,lumps,arms,organs,armor,jaw:!!jaw,bind,len,rest,shoulderY,H,hasLegs:!!B.legL,hasHead:!!B.head};
}
// aim a bone so its child points along a world direction
const _aq=new THREE.Quaternion(), _av=new THREE.Vector3();
function aimBone(R,name,dirW){ const b=R.B[name]; if(!b||!R.bind[name]) return; b.parent.getWorldQuaternion(_aq); _aq.invert(); _av.copy(dirW).normalize().applyQuaternion(_aq); b.quaternion.setFromUnitVectors(R.bind[name],_av); b.updateMatrixWorld(true); }
function wposB(R,name){ const p=new THREE.Vector3(); R.B[name].getWorldPosition(p); return p; }
// two-bone IK for the arch: from the arch top to the knee to the foot, the knee bending outward (pole)
function stumpIK(R,s,footW,pole,lift){
  const sh=wposB(R,"sh"+s); const out=new THREE.Vector3(s==="L"?1:-1,0,0).applyQuaternion(R.mesh.getWorldQuaternion(new THREE.Quaternion()));
  // the arch top: up and out from the shoulder, raised by "lift"
  const ap0=R.rest["ap"+s].clone().sub(R.rest["sh"+s]); const apDir=new THREE.Vector3(out.x*Math.abs(ap0.x),ap0.y+lift*R.len["a"+s],out.z*Math.abs(ap0.x)).normalize();
  aimBone(R,"sh"+s,apDir); const A=wposB(R,"ap"+s);
  const wristW=footW.clone().add(new THREE.Vector3(0,R.len["d"+s],0));
  const L1=R.len["b"+s], L2=R.len["c"+s]; const d=wristW.clone().sub(A); let D=d.length(); D=Math.min(D,L1+L2-1e-3); D=Math.max(D,Math.abs(L1-L2)+1e-3);
  const dir=d.clone().normalize(); const cosA=(L1*L1+D*D-L2*L2)/(2*L1*D); const a=Math.acos(Math.max(-1,Math.min(1,cosA)));
  const pl=pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  const kneeDir=dir.clone().multiplyScalar(Math.cos(a)).addScaledVector(pl,Math.sin(a));
  aimBone(R,"ap"+s,kneeDir); const K=wposB(R,"kn"+s); aimBone(R,"kn"+s,wristW.clone().sub(K)); const W=wposB(R,"wr"+s); aimBone(R,"wr"+s,footW.clone().sub(W)); }

// ---------------------------------------------------------------- the two-armed Brute: posing the rig
const NX=2.0;
const ALT={}; const outcome=(id,ctx)=>{ const v=(ctx.outSel&&ctx.outSel[id])||"a"; if(v==="alt"){ ALT[id]=!ALT[id]; return ALT[id]?"a":"b"; } return v; };
function noraPoint(kind){ const B=nora.B, p=new THREE.Vector3();
  if(kind==="flank"){ B.hips.getWorldPosition(p); p.y+=0.2; p.z+=0.13; p.x-=0.08; return p; }
  if(kind==="head"){ B.head.getWorldPosition(p); p.y+=0.08; return p; }
  if(kind==="neck"){ B.neck.getWorldPosition(p); p.y+=0.06; return p; }
  if(kind==="chest"){ (B.chest||B.spine||B.neck).getWorldPosition(p); if(!B.chest&&!B.spine) p.y-=0.2; return p; }
  B.hips.getWorldPosition(p); return p; }
let BR=null;          // the rigged brute
let BS={};   /* live: each body has its own, bound every frame */          // its live state (springs, limp arms, bursts)
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
  // the physics guard's corrections from last frame: height (gravity / support) and a shift over the support (balance)
  const PS=BS.ps||(BS.ps={e:0,hx:0,hz:0}); BS.pf=BS.pf||{L:0,R:0}; st.rootY+=PS.e; const planted={}, slack={}; const e0=PS.e, hx0=PS.hx, hz0=PS.hz;
  m.position.set(st.x+PS.hx,0,(st.z||0)+PS.hz); m.rotation.set(0,st.yaw,0);
  const root=R.B.root; root.position.set(0,st.rootY,0); root.rotation.set(st.pitch||0,st.twist||0,st.roll||0); m.updateMatrixWorld(true);
  const q=m.getWorldQuaternion(new THREE.Quaternion()), fwd=new THREE.Vector3(0,0,1).applyQuaternion(q);
  const limbs=pass=>{ for(const s of ["L","R"]){ const out=new THREE.Vector3(s==="L"?1:-1,0,0).applyQuaternion(q);
    const pole=st.pole&&st.pole[s] ? st.pole[s] : out.clone().multiplyScalar(1).add(new THREE.Vector3(0,0.35,0)).addScaledVector(fwd,-0.15);
    const wr=R.B["wr"+s]; if(!wr.userData.rp) wr.userData.rp=wr.position.clone(); wr.position.copy(wr.userData.rp);
    const fist0=st.fist&&st.fist[s], ct=st.contact&&st.contact[s], cor=BS.cor&&BS.cor[s]; const fist=fist0&&cor&&cor.lengthSq()>1e-8?fist0.clone().add(cor):fist0; let sinE=0;
    if(pass===1 && !fist0 && st.feet[s] && cor && cor.lengthSq()>1e-8) st.feet[s]=st.feet[s].clone().add(cor);
    if(pass===1 && !fist0 && st.feet[s] && st.feet[s].y<0.08){ planted[s]=true; st.feet[s]=st.feet[s].clone(); st.feet[s].y+=BS.pf[s]; }   // a planted pad sits exactly on the floor
    if(fist){ const sh=wposB(R,"sh"+s), d=R.len["d"+s], dir=st.padDir&&st.padDir[s]? st.padDir[s].clone().normalize() : fist.clone().sub(sh).normalize(); const Wg=fist.clone().addScaledVector(dir,-d);
      stumpIK(R,s,Wg.clone().add(new THREE.Vector3(0,-d,0)),pole,(st.lift&&st.lift[s])||0);
      const K=wposB(R,"kn"+s), L2=R.len["c"+s], KW=Wg.clone().sub(K), D=KW.length(); aimBone(R,"kn"+s,KW);
      if(D>L2){ wr.position.copy(wr.userData.rp).multiplyScalar(D/L2); wr.updateMatrixWorld(true); sinE=D/L2; } aimBone(R,"wr"+s,fist.clone().sub(Wg)); sinew(R,s,K,Wg,sinE,L2);
      const sm=st.star&&st.star[s]||0; wr.scale.setScalar(1-0.6*Math.min(1,sm)); morningStar(R,s,sm>0?Wg.clone().addScaledVector(dir,d*0.4):null,dir,sm,gameT); }
    else { stumpIK(R,s,st.feet[s],pole,((st.lift&&st.lift[s])||0)+((BS.al&&BS.al[s])||0));
      if(planted[s]){ const A=wposB(R,"ap"+s), d=st.feet[s].clone().add(new THREE.Vector3(0,R.len["d"+s],0)).sub(A), L12=R.len["b"+s]+R.len["c"+s], h=Math.hypot(d.x,d.z); slack[s]= h<L12? Math.sqrt(L12*L12-h*h)+d.y : -0.5; } }
    if(!fist){ sinew(R,s,null,null,0,1); wr.scale.setScalar(1); morningStar(R,s,null,null,0,0); }
    if(pass===1){ if(BS.lastGap) BS.lastGap[s]=null; if(nora&&nora.model) contactSolve(R,s,ct,dt); } } };
  limbs(1);
  // the man: dead weight swinging under the body's movement; his head finds her
  const rp=new THREE.Vector3(); root.getWorldPosition(rp); const v=BS.lastRoot?rp.clone().sub(BS.lastRoot).divideScalar(Math.max(dt,1e-4)):new THREE.Vector3(); const a=BS.lastV?v.clone().sub(BS.lastV).divideScalar(Math.max(dt,1e-4)):new THREE.Vector3(); BS.lastRoot=rp; BS.lastV=v;
  const loc=a.clone().applyQuaternion(q.clone().invert()); BS.sw=BS.sw||{x:{x:0,v:0},z:{x:0,v:0},lx:{x:0,v:0},lz:{x:0,v:0}};
  const kick=BS.twitch||0; BS.twitch=Math.max(0,kick-dt*3);
  if(st.manAngle!=null){ BS.sw.x.x=st.manAngle; BS.sw.x.v=0; } else spring(BS.sw.x,clamp(-loc.z*0.05,-0.7,0.7)+(st.manSwing||0),dt,6); spring(BS.sw.z,clamp(loc.x*0.05,-0.6,0.6),dt,6);
  spring(BS.sw.lx,clamp(-loc.z*0.07,-0.9,0.9)+(st.manSwing||0)*1.3,dt,5); spring(BS.sw.lz,clamp(loc.x*0.06,-0.7,0.7),dt,5);
  if(st.rest){ for(const k of ["x","z","lx","lz"]){ BS.sw[k].x*=1-0.25*st.rest; BS.sw[k].v*=1-0.3*st.rest; } }
  R.B.torso.rotation.set(BS.sw.x.x-(st.pitch||0)+0.25*kick*Math.sin(gameT*40),0,BS.sw.z.x-(st.roll||0)+0.2*kick*Math.sin(gameT*33));
  if(R.B.legL){ R.B.legL.rotation.set(BS.sw.lx.x+0.6*kick*Math.sin(gameT*30),0,BS.sw.lz.x+0.06); R.B.legR.rotation.set(BS.sw.lx.x-0.6*kick*Math.sin(gameT*27+1),0,BS.sw.lz.x-0.06); }
  if(R.B.head){ const hp=wposB(R,"head"), tg=st.look||new THREE.Vector3(NX,1.4,0); R.B.torso.updateMatrixWorld(true); const tq=R.B.torso.getWorldQuaternion(new THREE.Quaternion()).invert(); const d=tg.clone().sub(hp).applyQuaternion(tq);
    const yaw=clamp(Math.atan2(d.x,d.z),-1.1,1.1), pit=clamp(-Math.atan2(d.y,Math.hypot(d.x,d.z)),-0.6,0.6); BS.hy=(BS.hy||0)+(yaw-(BS.hy||0))*Math.min(1,dt*4); BS.hp=(BS.hp||0)+(pit-(BS.hp||0))*Math.min(1,dt*4);
    R.B.head.rotation.set(BS.hp+0.3*kick*Math.sin(gameT*45),BS.hy,0); }
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
  m.updateMatrixWorld(true); bruteGuard(st,dt,planted,slack); { const lim=0.03, c0=PS.hx, c1=PS.hz; PS.hx=clamp(hx0+clamp(PS.hx-hx0,-lim,lim),-0.6,0.6); PS.hz=clamp(hz0+clamp(PS.hz-hz0,-lim,lim),-0.6,0.6); if(PS.e<-0.4) PS.e=-0.4; if(PS.e>e0+0.06) PS.e=e0+0.06; if(Math.abs(c0-PS.hx)>1e-4||Math.abs(c1-PS.hz)>1e-4){ PS.vx=0; PS.vz=0; PS.hinit=false; } }
  // apply the guard's answer in this same frame (no one-frame lag): shift the body, re-solve the stumps to their planted spots
  if(Math.abs(PS.e-e0)>1e-4||Math.abs(PS.hx-hx0)>1e-4||Math.abs(PS.hz-hz0)>1e-4){ root.position.y+=PS.e-e0; m.position.x+=PS.hx-hx0; m.position.z+=PS.hz-hz0; m.updateMatrixWorld(true); limbs(2); m.updateMatrixWorld(true);
    // airborne, nothing touches: the re-solved limbs moved the mass a little, so put the centre of mass exactly back on its arc (a rigid shift)
    if(PS.air){ const c2=R.pb.measure().com, dy=PS.cy-c2.y; if(Math.abs(dy)>1e-4){ root.position.y+=dy; PS.e+=dy; m.updateMatrixWorld(true); } } }
  { const fl=(R.B.legL?["legL","legR"]:[]).concat(R.arms.map(a=>a.base.name)); if(fl.length){ m.updateMatrixWorld(true); PHYS.fold(R.pb,fl); } }   // the man's legs and the little arms: the floor bends them up, they never go through it   // the man's legs: the floor bends them up at the hip, they never go through it
  if(R.armor&&R.armor.length&&cur!=="splinter") stepLoose(R,dt);
  if(R.legless){ if(!R.waist) waistInit(R); if(!R.guts) gutsInit(R); waistGore(R,dt); gutsStep(R,dt); }
}
// ---- the physics guard for the Brute (see PHYS): measured from the posed, skinned body every frame, applied next frame
function bruteGuard(st,dt,planted,slack){ const R=BR, PS=BS.ps, V=THREE.Vector3; if(!R.pb) R.pb=PHYS.body(R.mesh);
  const m=R.pb.measure(); if(!R.comH){ R.comH=m.com.y; R.comOff=m.com.clone().sub(R.mesh.position).setY(0); }
  if(!R.pb.chain) R.pb.chain=m.bone.map(bn=>{ for(let q=bn;q;q=q.parent){ const mt=/^(sh|ap|kn|wr|ft)([LR])$/.exec(q.name||""); if(mt) return [mt[0],q===bn?mt[1]:"on",mt[2]]; } return null; });   // which stump a point rides on (lumps and little arms included)
  if(!R.pb.leg) R.pb.leg=m.bone.map(bn=>{ for(let q=bn;q;q=q.parent) if(/^leg[LR]$/.test(q.name||"")) return true; return false; });
  const low={L:1e9,R:1e9}, arch={L:1e9,R:1e9}; let free=1e9, legLow=1e9;
  for(let i=0;i<m.pts.length;i++){ const p=m.pts[i], mt=R.pb.chain[i];
    if(mt && !/^(wr|ft)/.test(mt[0]) && !(st.fist&&st.fist[mt[2]])) arch[mt[2]]=Math.min(arch[mt[2]],p.y);   // the arch of any stump on its feet (planted or stepping)
    if(mt && planted[mt[2]]){ if(mt[1]==="wr"||mt[1]==="ft") low[mt[2]]=Math.min(low[mt[2]],p.y); }
    else if(mt && st.fist && st.fist[mt[2]]) continue;   // a stump driven as a fist is an effector: it can't lift the body
    else if(R.pb.leg[i]) legLow=Math.min(legLow,p.y);
    else if(p.y<free){ free=p.y; BS.freeBone=m.bone[i].name+"@"+p.x.toFixed(2)+","+p.z.toFixed(2); } }
  // the man's dangling legs are soft: on the floor they hold the body up, but a leg swung into the floor folds rather than throwing the body up
  free=Math.min(free,Math.max(legLow,-1.2*dt),arch.L,arch.R);   // a stump's knee or arch on the floor holds the body up like any other part
  // a planted stump's arch can't fold into the floor: it arches up instead (the floor pushes the knee, not the body)
  BS.al=BS.al||{L:0,R:0}; for(const s of ["L","R"]){ if(arch[s]<0.03) BS.al[s]=clamp(BS.al[s]+(0.03-arch[s])*1.2,0,2); else BS.al[s]*=Math.max(0,1-dt*2); } BS.dbgLow=`free=${free.toFixed(2)} leg=${legLow.toFixed(2)} padL=${low.L.toFixed(2)} padR=${low.R.toFixed(2)} pl=${Object.keys(planted)} sl=${Object.values(slack).map(v=>v.toFixed(2))}`;
  for(const s of ["L","R"]){ if(planted[s]&&low[s]<0.08&&slack[s]>0) BS.pf[s]=clamp(BS.pf[s]+(0.004-low[s])*0.6,-0.1,0.15); else BS.pf[s]*=Math.max(0,1-dt*4); }
  // vertical: held up by planted stumps only as far as they reach; otherwise it drops onto whatever is under it (the man's feet, its body) at g
  const sl=["L","R"].filter(s=>planted[s]).map(s=>slack[s]); const e0=PS.e;
  PHYS.vstep(PS,{low:free,com:m.com},dt,{upper:sl.length?Math.min(...sl):null,want:st.sink?-3:0,riseMax:1.6});   // sink: it lets itself down onto its waist
  if(PS.air&&!BS.wasAir) BS.airT=0; if(!PS.air&&BS.wasAir&&PS.landV<-1.2){ const p=m.com.clone().setY(0.02); stumpSlam(p,clamp(-PS.landV/4,0.3,1)); } BS.wasAir=PS.air;
  // horizontal: airborne it keeps its momentum; on the floor the point where the floor must push (ZMP) stays inside its support
  if(st.gait){ PS.hx*=Math.max(0,1-dt*3); PS.hz*=Math.max(0,1-dt*3); PS.hinit=false; } else PHYS.hstep(PS,m,dt); BS.lastGuard={air:PS.air,e:PS.e,hx:PS.hx,hz:PS.hz};
  if(PS.air&&PS.airT>0.1){ BS.cah=null; return; }
  const ca=m.com.clone().sub(new V(PS.hx,0,PS.hz)), H=BS.cah||(BS.cah=[]); H.push(ca); if(H.length>5) H.shift();
  const a=new V(); if(H.length===5) a.copy(H[4]).addScaledVector(H[2],-2).add(H[0]).divideScalar(4*dt*dt); a.clampLength(0,6);
  BS.alp=BS.alp||new V(); BS.alp.lerp(a,Math.min(1,dt*5));
  // support: the pads of the stumps the clip has planted, plus anything else of it that is on the floor (the man's feet, its body)
  const sup=[]; for(const s of ["L","R"]) if(planted[s]) sup.push(st.feet[s]); for(let i=0;i<m.pts.length;i++){ const p=m.pts[i]; if(p.y<0.035 && !R.pb.chain[i]) sup.push(p); }
  if(!sup.length) return;
  const cp=[]; for(const p of sup) for(let i=0;i<6;i++){ const a=i*Math.PI/3; cp.push(new V(p.x+0.11*Math.cos(a),0,p.z+0.11*Math.sin(a))); }   // fleshy pads: a contact patch, not a point
  const hull=PHYS.shrink(PHYS.hull(cp),0.03), h=Math.max(0.5,m.com.y), zx=m.com.x-h/GRAV*BS.alp.x, zz=m.com.z-h/GRAV*BS.alp.z, pr=PHYS.project(hull,zx,zz), k=Math.min(1,dt*6);
  BS.lastZmp=pr.d; if(st.gait) return;   // the gait engine is already a pendulum on its stumps: its ZMP is the stance stump
  if(pr.d>0){ PS.hx=clamp(PS.hx+(pr.x-zx)*k,-0.9,0.9); PS.hz=clamp(PS.hz+(pr.z-zz)*k,-0.9,0.9); }
  else { const dx=-PS.hx*Math.min(1,dt*1.5), dz=-PS.hz*Math.min(1,dt*1.5); if(PHYS.project(hull,zx+dx,zz+dz).d===0){ PS.hx+=dx; PS.hz+=dz; } } }
function lumpWorld(l){ const p=new THREE.Vector3(); l.b.getWorldPosition(p); return p; }
function bruteLocal(st,lx,ly,lz){ const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(0,st.yaw,0)); return new THREE.Vector3(lx,ly,lz).applyQuaternion(q).add(new THREE.Vector3(st.x,0,st.z||0)); }
// feet planted relative to the body: lx = sideways (its left +), lz = ahead
function footSpot(st,s,ahead,width=0.95){ return bruteLocal(st,(s==="L"?1:-1)*width,0.02,ahead); }

// a heavy stump landing: the thing has weight
function stumpSlam(p,k=1){ dust(p,1.0*k,5); debris(p,Math.round(6*k),0.9*k); ring(p,1.1*k); shake=Math.max(shake,0.14*k); camPunch(0.3*k); cue("stump slams down"); if(k>0.9) crack(p,0.7*k); }
// a growth bursting: a wet flash that blows everything near it back
function growthBurst(p){ const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:streakTex,color:0xffb0a0,transparent:true,depthWrite:false})); fl.position.copy(p); fl.scale.setScalar(1.4); scene.add(fl); fx.push({m:fl,t:0,life:0.12,o:1,v:new THREE.Vector3(),g:0});
  burstLight.position.copy(p); burstLight.intensity=6; blood(p,26,3,0.08); chunks(p,new THREE.Vector3(0,0.4,1),8); ring(new THREE.Vector3(p.x,0,p.z),1.6); hitStop(0.08); camPunch(0.5); shake=Math.max(shake,0.3); cue("growth bursts · wet crack"); }
const burstLight=new THREE.PointLight(0xff8866,0,6);   /* live: never added (a new light would recompile every material) */

// ---------------------------------------------------------------- Norah's poses here
function noraPose(n,dt){ const J=n.J||NP.stand(); applyPose(nora,J); const NS=BS.ns||(BS.ns={e:0,hx:0,hz:0}); const by=n.y||0;
  if(NS.wasHeld && !n.held){ NS.e=NS.carry-by; NS.wasHeld=false; }
  if(n.kick && NS.kickId!==n.kick){ NS.kickId=n.kick; NS.pendingKick=n.kickV; }
  nora.group.position.set((n.x??NX)+(n.held?0:NS.hx),by+(n.held?0:NS.e),(n.z||0)+(n.held?0:NS.hz)); nora.group.rotation.set(0,n.yaw??-Math.PI/2,0); if(n.fall) nora.group.rotateX(-n.fall*Math.PI/2); if(n.roll) nora.group.rotateZ(n.roll); retarget(nora);
  if(!dt) return; if(!nora.pb){ const ms=[]; nora.group.traverse(o=>{ if(o.isSkinnedMesh) ms.push(o); }); nora.pb=PHYS.body(ms); }
  nora.group.updateMatrixWorld(true); const m=nora.pb.measure(); const lying=m.com.y<0.5; if(lying) m.low=PHYS.coreLow(nora.pb,m);
  if(n.held){ PHYS.fold(nora.pb); /* held up by it: her dangling legs still cannot go through the floor */ const cy=m.com.y; NS.vy=NS.init?(cy-NS.cy)/dt:0; NS.cy=cy; NS.init=true; NS.air=false; NS.carry=by; NS.wasHeld=true; NS.hx=NS.hz=0; NS.hinit=false; return; }
  if(NS.pendingKick){ const k=NS.pendingKick; NS.pendingKick=null; NS.vy=k.y; NS.vx=k.x; NS.vz=k.z; NS.e+=0.004; NS.forceAir=true; }
  const e0=NS.e, hx0=NS.hx, hz0=NS.hz; PHYS.vstep(NS,m,dt,{}); if(NS.forceAir){ NS.air=true; NS.forceAir=false; } PHYS.hstep(NS,m,dt);
  nora.group.position.x+=NS.hx-hx0; nora.group.position.y+=NS.e-e0; nora.group.position.z+=NS.hz-hz0; if(lying){ nora.group.updateMatrixWorld(true); PHYS.fold(nora.pb); } }
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
  Object.assign(g,{x:ctx.x,v:o.v0||0,y:0,vy:0,z:0,vz:0,zp:0,air:false,stance:"R",swing:null,swT:0,ds:0,from:null,dip:{x:0,v:0},lean:{x:0,v:0},sway:{x:0,v:0},acc:0,lv:o.v0||0,land:0,still:true}); ctx.g=g; return g; }
function gaitStep(ctx,dt,st,onLand){ const g=ctx.g, L=BR.shoulderY, other=s=>s==="L"?"R":"L";
  const fx=s=>ctx["f"+s].x, pv = g.mode==="pair"||g.swing==null ? (fx("L")+fx("R"))/2 : fx(g.stance);
  const pend=dx=>Math.sqrt(L*L-Math.min(dx*dx,0.36*L*L));
  // --- body dynamics
  if(g.air){ g.vy-=GRAV*dt; g.y+=g.vy*dt; g.x+=g.v*dt; }
  else { if(g.mode==="pair"&&g.vdes>0&&g.v<0.35) g.v+=dt*1.5;   // the man's legs scrabble to keep it going
    const h=pend(g.x-pv), w2=GRAV/h; let a=w2*clamp(g.x-pv,-0.9,0.9); if(g.ds>0) a*=0.35; g.v+=a*dt; if(Math.abs(g.v)<0.02&&g.vdes===0&&Math.abs(g.x-pv)<0.04){ g.v*=0.5; } g.x+=g.v*dt; g.y=h-L; }
  g.acc=(g.v-g.lv)/Math.max(dt,1e-4); g.lv=g.v;
  const w=Math.sqrt(GRAV/L);
  // --- sideways: the same pendulum. On one stump the floor can only push at that stump, so the body falls toward the
  // swinging side until the next stump catches it; a wide stance means a big, heavy sway from stump to stump.
  // Stumps are placed from the divergent component of motion (xi = z + vz/w): landing each one a fixed offset b outside
  // where xi will be at touchdown gives a steady sway that recovers from any push.
  const hc=BR.comH||L, wl=Math.sqrt(GRAV/hc), fz=s=>ctx["f"+s].z, mid=(fz("L")+fz("R"))/2, sideOf=s=>s==="L"?-1:1;
  const Tc=g.Ts+g.Tds, xiS=g.width*Math.tanh(wl*g.Ts/2), bOff=g.width*(1-Math.tanh(wl*Tc/2)), xi=g.z+g.vz/wl;
  const moving=g.vdes>0||Math.abs(g.v)>0.15; let zp, latReady=g.mode!=="alt";
  if(g.mode!=="alt") zp=mid;
  else if(g.swing||g.ds>0) zp=fz(g.stance);
  else if(moving){ if(!g.walked){ if(sideOf(g.stance)*(xi-mid)<0) g.stance=other(g.stance);   // first step: shove off the other stump until the sway will carry it over this one
      if(sideOf(g.stance)*(xi-mid)<xiS) zp=fz(other(g.stance)); else { zp=fz(g.stance); latReady=true; } }
    else { zp=fz(g.stance); latReady=true; } }
  else { g.walked=false; const ad=22*(mid-g.z)-9*g.vz; zp=clamp(g.z-ad/(wl*wl),Math.min(fz("L"),fz("R")),Math.max(fz("L"),fz("R"))); }
  g.zp=zp; g.vz+=wl*wl*(g.z-zp)*dt; g.z+=g.vz*dt; { const zm=(fz("L")+fz("R"))/2; if(g.z>zm+0.45){ g.z=zm+0.45; if(g.vz>0) g.vz=0; } if(g.z<zm-0.45){ g.z=zm-0.45; if(g.vz<0) g.vz=0; } }
  const capture=()=>g.x+g.v*Math.tanh(w*g.Ts/2)/w+0.22*(g.v-g.vdes)/w;
  // --- stepping
  if(g.mode==="alt"){
    if(g.ds>0) g.ds-=dt;
    if(g.ds<=0 && g.swing==null && latReady && !(g.vdes===0 && Math.abs(g.v)<0.06 && Math.abs(fx("L")-fx("R"))<0.08)){ { // push off the trailing stump, then swing it
        g.v+=clamp(g.push*(g.vdes-g.v)*0.5,-1.0,g.push*0.5)+ (g.vdes>0?0.12:0); g.swing=other(g.stance); g.swT=0; g.from=ctx["f"+g.swing].clone(); g.walked=true; } }

    if(g.swing){ const s=g.swing; const lead=g.x-fx(g.stance), urg=clamp((lead-(g.mode==="alt"?0.6:0.3))/0.3,0,1); g.swT+=dt*(1+3*urg); const u=Math.min(1,g.swT/g.Ts);   // falling too far past the stance stump hurries the swing down
      let cx=capture(); if(g.vdes>0) cx=Math.max(cx,g.x+0.18); cx=clamp(cx,g.x-0.5,g.x+0.9); const tgt=footSpot({x:cx,yaw:Math.PI/2},s,0,g.width);
        // sideways placement: b outside where xi will be when this stump lands
        const tau=Math.max(0,(1-u)*g.Ts/(1+3*urg)), pst=fz(g.stance), xiT=pst+(g.z+g.vz/wl-pst)*Math.exp(wl*tau), sg=sideOf(s), zc=g.zc||0;
        // one-step deadbeat: land where the next stance carries xi exactly to its mirror point
        const eT=Math.exp(wl*Tc), xiN=zc-sg*g.width*Math.tanh(wl*Tc/2), pz=(xiN-xiT*eT)/(1-eT); tgt.z=zc+sg*clamp(sg*(pz-zc),0.15,g.width+0.6); g.dbg=`u=${u.toFixed(2)} urg=${urg.toFixed(2)} xi=${(g.z+g.vz/wl).toFixed(2)} xiT=${xiT.toFixed(2)} tz=${tgt.z.toFixed(2)}`; if(g.to&&u>0.75){ g.to.z=tgt.z; } else g.to=tgt;
      const p=g.from.clone().lerp(g.to,1-Math.pow(1-u,2)); const H=g.H*(0.4+0.6*Math.min(1,Math.abs(g.to.x-g.from.x)/0.9));
      p.y=0.02+(u<0.4?H*Math.sin(u/0.4*Math.PI/2):H*(1-Math.pow((u-0.4)/0.6,2))); ctx["f"+s]=p; st.lift[s]=0.35*(p.y/Math.max(0.05,g.H));
      if(u>=1){ // touchdown: the step redirects the body and bleeds energy into the floor
        p.y=0.02; (g.td=g.td||[]).push(`t${gameT.toFixed(2)} ${s} at ${p.z.toFixed(2)} xi ${(g.z+g.vz/Math.sqrt(GRAV/(BR.comH||L))).toFixed(2)} to ${g.to.z.toFixed(2)}`); const k=clamp(Math.abs(g.v)/2.5,0.25,1.6); g.v*=g.loss; g.dip.v-=(1.7*k+0.6)*(g.imp??1); g.lean.v+=1.6*k; g.stance=s; g.swing=null; g.to=null; g.ds=g.Tds; g.land++; onLand&&onLand(p,k); } } }
  else { // pair: both stumps plant, the body vaults between them, flies a moment, both reach out and catch it
    if(!g.air && g.swing==null && g.x-pv>0.42 && g.vdes>0){ g.air=true; g.vy=1.1; g.v+=clamp(0.9*(g.vdes-g.v),0.2,1.2); g.swing="B"; g.swT=0; g.fromL=ctx.fL.clone(); g.fromR=ctx.fR.clone(); }
    if(!g.air && g.swing==null && g.vdes===0 && g.x-pv>0.22){ g.swing="B"; g.swT=0; g.fromL=ctx.fL.clone(); g.fromR=ctx.fR.clone(); }   // braking: both stumps reach out to catch it
    if(g.swing==="B"){ g.swT+=dt; const u=Math.min(1,g.swT/g.Ts); const cx=g.vdes===0? g.x+Math.max(0,g.v)/w : g.x+Math.max(0.15,0.62*g.v/w);   // ahead of the body, but short of where it would stop: it vaults over them
      for(const s of ["L","R"]){ const to=footSpot({x:cx,yaw:Math.PI/2},s,0,g.width+0.1), p=g["from"+s].clone().lerp(to,1-Math.pow(1-u,2)); p.y=0.02+g.H*Math.sin(u*Math.PI)*(u<0.8?1:1); ctx["f"+s]=p; st.lift[s]=0.4*Math.sin(u*Math.PI); }
      if(g.air && g.y<=pend(g.x-(ctx.fL.x+ctx.fR.x)/2)-L && g.vy<0 && u>0.6 || (u>=1&&g.air&&g.y<-0.05) || (u>=1&&!g.air)){ g.air=false; ctx.fL.y=ctx.fR.y=0.02; const k=clamp(-g.vy/1.5+Math.abs(g.v)/3,0.5,1.8); g.v*=g.loss; g.dip.v-=1.3*k; g.lean.v+=2.2*k; g.swing=null; g.land++; onLand&&onLand(ctx.fL,k); onLand&&onLand(ctx.fR,k); } } }
  // --- the body's response: compression, inertial lean, sway over the stance side
  spring(g.dip,0,dt,6); spring(g.lean,clamp(-g.acc*0.05,-0.3,0.3),dt,5.5);
  spring(g.sway,0,dt,5);
  st.x=g.x; ctx.x=g.x; st.rootY=L+g.y+g.dip.x-0.04; st.pitch=0.06+g.lean.x+0.04*Math.min(1,Math.abs(g.v)); st.z=g.z-(BR.comOff?BR.comOff.z:0); st.roll=clamp(-(g.z-mid)*0.35-g.vz*0.03,-0.3,0.3); st.twist=g.mode==="alt"&&g.swing?(g.swing==="L"?1:-1)*0.07*Math.min(1,Math.abs(g.v)):0;
  st.feet={L:ctx.fL,R:ctx.fR}; st.gait=true; return st; }
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
    if(ctx.hit){ const k=t-ctx.hit; ctx.n={J:NP.stumble(), x:NX+0.3*easeOut(k/0.4), z:-1.6*easeOut(k/0.45), fall:PHYS.topple(ctx.nt||(ctx.nt={th:0.15,w:2.6}),dt,1.65,1.49), roll:0}; if(k>0.42&&!ctx.landed){ ctx.landed=1; slamLine(new THREE.Vector3(NX+0.3,0,-1.6),new THREE.Vector3(NX+1.6,0,-1.6),0.8); } }
    const u=ss((t-2.05)/0.8); ctx.phase= u<1?"swings back, plants":"settles"; const end=footSpot(st,"R",0.1); const from=arcAt(-0.25+Math.PI*0.95,1.15); stepFoot(ctx,"R",from,end,u,0.6); if(u>=1&&!ctx.pl){ ctx.pl=1; stumpSlam(ctx.fR,0.8); } st.twist=0.5*(1-u); st.roll=0.12*(1-u);
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
A.slam={ name:"Overhead double slam", len:7, start(ctx){ ctx.x=NX-3.3; plantInit(ctx,0); ctx.n={}; },
  step(t,dt,ctx){ const st=base(ctx); ctx.n={J:NP.stand()}; const L0=ctx.L0||(ctx.L0=ctx.fL.clone()), R0=ctx.R0||(ctx.R0=ctx.fR.clone());
    const up=s=>bruteLocal(st,(s==="L"?1:-1)*0.65,3.0,0.45), down=s=>bruteLocal(st,(s==="L"?1:-1)*0.55,0.02,2.0);
    if(t<0.6){ ctx.phase="settles"; return st; }
    // rocks back and sits down onto the man's feet, so both stumps are free to rise
    if(t<1.15){ const u=ss((t-0.6)/0.55); ctx.phase="sits back onto its feet · stumps rear up"; st.rest=u; st.rootY=BR.shoulderY-0.6*u; ctx.fL=L0.clone().lerp(up("L"),u); ctx.fR=R0.clone().lerp(up("R"),u); st.lift.L=st.lift.R=1.0*u; st.pitch=-0.3*u; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(t<1.5){ ctx.phase="holds high on its feet (the tell)"; const j=0.05*Math.sin(t*35); st.rest=1; st.rootY=BR.shoulderY-0.6; ctx.fL=up("L").add(new THREE.Vector3(0,j,0)); ctx.fR=up("R").add(new THREE.Vector3(0,-j,0)); st.lift.L=st.lift.R=1; st.pitch=-0.3; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(t<2.3){ const u=((t-1.5)/0.8)**2; ctx.phase="topples forward · slams down"; /* its weight falls with gravity: it cannot come down faster than g */ st.rest=1; st.rootY=BR.shoulderY-0.6-0.3*u; ctx.fL=up("L").lerp(down("L"),u); ctx.fR=up("R").lerp(down("R"),u); st.lift.L=st.lift.R=1-u; st.pitch=-0.3+0.75*u; streak(ctx.fL,1.6); streak(ctx.fR,1.6); return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(!ctx.hit){ ctx.hit=t; const c=bruteLocal(st,0,0,2.0); hitStop(0.13); shake=Math.max(shake,0.5); camPunch(0.9); cue("ground-shaking slam"); ring(c,3.2); crack(c,1.6); for(let i=0;i<6;i++){ const p=c.clone().add(new THREE.Vector3((Math.random()-.5)*1.4,0,(Math.random()-.5)*1.4)); dust(p,1.2,4); debris(p,6,1.2); }
      if(c.distanceTo(new THREE.Vector3(NX,0,0))<2.8){ ctx.down=t; dmg("NORAH −22","double slam · knocked off her feet"); } }
    if(ctx.down){ const k=t-ctx.down; ctx.n={J:NP.stumble(), x:NX+0.8*easeOut(k/0.35), fall:PHYS.topple(ctx.nt||(ctx.nt={th:0.15,w:2.4}),dt,1.65,1.49)}; if(k>0.45&&!ctx.landed){ ctx.landed=1; slamLine(new THREE.Vector3(NX+0.8,0,0),new THREE.Vector3(NX+2.1,0,0),0.8); } }
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
    if(ctx.hit){ const k=t-ctx.hit; ctx.n={J:NP.stumble(), x:NX+1.9*easeOut(k/0.45), fall:PHYS.topple(ctx.nt||(ctx.nt={th:0.18,w:2.8}),dt,1.65,1.52)}; if(k>0.5&&!ctx.landed){ ctx.landed=1; slamLine(new THREE.Vector3(NX+1.9,0,0),new THREE.Vector3(NX+3.2,0,0),0.9); } }
    const k=t-1.25; ctx.phase= k<0.5?"stretched out":"drags its stumps after it"; st.x=ctx.x; st.rootY=BR.shoulderY-0.1; st.pitch=0.2*(1-ss(k/0.8));
    if(k>0.5){ const u=ss((k-0.5)/0.45); const L0=ctx.L0||(ctx.L0=ctx.fL.clone()); stepFoot(ctx,"L",L0,footSpot(st,"L",0.2),u,0.4); if(u>=1&&!ctx.p1){ ctx.p1=1; stumpSlam(ctx.fL,0.7); } }
    if(k>0.9){ const u=ss((k-0.9)/0.45); const R0=ctx.R0||(ctx.R0=ctx.fR.clone()); stepFoot(ctx,"R",R0,footSpot(st,"R",0.2),u,0.4); if(u>=1&&!ctx.p2){ ctx.p2=1; stumpSlam(ctx.fR,0.7); } }
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
A.pin={ name:"Charge and crushing hug", len:8.5, start(ctx){ ctx.x=NX-7.5; plantInit(ctx,0); ctx.ph=0; ctx.n={}; ctx.out=outcome("oPin",ctx); ctx.mash=0; gaitInit(ctx,{mode:"pair",Ts:0.42,H:0.6,loss:0.8,width:1.05,v0:1.8}); },
  step(t,dt,ctx){ const st=base(ctx);
    if(ctx.hitT==null){ ctx.n={J:NP.stand()};     // fast crutch-vaults at her: the same pendulum and flight physics as the vault
      const g=ctx.g; g.vdes=3.2; gaitStep(ctx,dt,st,(p,k)=>{ stumpSlam(p,0.7+0.3*k); }); st.manSwing=-0.3+(g.air?-0.3:0);
      st.x=ctx.x; ctx.phase="charges"; if(ctx.x>NX-1.15){ ctx.hitT=t; ctx.L0=ctx.fL.clone(); ctx.R0=ctx.fR.clone(); hitStop(0.1); camPunch(0.7); shake=Math.max(shake,0.35); cue("caught"); }
      if(ctx.x>NX-2.6){ const J=NP.stand(); J.aLx=J.aRx=-0.9; J.eL=J.eR=1.2; J.sp=-0.1; ctx.n={J}; }
      return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    // both stumps swing round behind her and haul her in tight against its body, lifting her off her feet
    const k=t-ctx.hitT; st.x=ctx.x; const pull=ss(k/0.45), body=new THREE.Vector3(ctx.x+0.62,0,0);
    const hold=new THREE.Vector3(NX,0,0).lerp(body,pull); hold.y=0.35*pull;            // her root while held
    const back=(s)=>new THREE.Vector3(hold.x+0.16,hold.y+1.12,(s==="L"?-1:1)*0.05);     // behind her back, wrapped round
    const squeeze=ctx.dead?0.06*Math.min(1,(t-ctx.dead)/0.15):0;
    if(!ctx.free){ const u=ss(k/0.35); for(const s of ["L","R"]){ const from=ctx[s+"0"].clone().add(new THREE.Vector3(0,R_d(s)+0.04+1.0*Math.sin(u*Math.PI),(s==="L"?-1:1)*0.6*Math.sin(u*Math.PI)));
        ctx["f"+s]=from.lerp(back(s).add(new THREE.Vector3(-squeeze,0,0)),u); }
      st.fist={L:ctx.fL,R:ctx.fR}; st.padDir={L:new THREE.Vector3(0.45,-0.15,0.88),R:new THREE.Vector3(0.45,-0.15,-0.88)}; const c={bones:["chest","hips"],gap:ctx.dead?-0.02:0.003,w:sat((k-0.2)/0.2)}; st.contact={L:c,R:c};
      st.pole={L:new THREE.Vector3(0,0.2,-1),R:new THREE.Vector3(0,0.2,1)}; st.pitch=0.12+0.1*pull+(ctx.dead?0.08:0); st.rootY=BR.shoulderY-0.2*pull; st.rest=ss(k/0.3); }
    if(k>0.3&&!ctx.c3){ ctx.c3=1; hitStop(0.08); shake=Math.max(shake,0.3); camPunch(0.5); cue("crushed against it · ribs creak"); dust(new THREE.Vector3(NX,0,0),0.8,5); }
    // her: pressed flat to it, legs kicking off the floor
    const nJ=NP.held(t); nJ.sp=-0.15; nJ.aLx=nJ.aRx=-0.5; nJ.aLz=nJ.aRz=0.5; nJ.eL=nJ.eR=1.6; nJ.lLx=-0.3+0.5*Math.sin(t*10); nJ.lRx=-0.3-0.5*Math.sin(t*10+1); nJ.kL=0.5+0.3*Math.sin(t*10); nJ.kR=0.5-0.3*Math.sin(t*10);
    if(ctx.free){ const f=t-ctx.free; ctx.qte=null; ctx.phase= f<0.6?"wrenches free · drops":"staggers back";
      const out=ss(f/0.3); ctx.fL=ctx.fL.clone().lerp(footSpot({x:ctx.x,yaw:Math.PI/2},"L",0.5),out*0.2); ctx.fR=ctx.fR.clone().lerp(footSpot({x:ctx.x,yaw:Math.PI/2},"R",0.5),out*0.2); st.fist=null;
      st.rest=1-ss(f/0.4); if(f>0.25&&!ctx.sl){ ctx.sl=1; stumpSlam(ctx.fL,0.6); stumpSlam(ctx.fR,0.6); }
      ctx.n={J:f<0.5?NP.stumble():mix(NP.stumble(),NP.stand(),ss((f-0.5)/0.5)), x:ctx.fx+1.3*easeOut(f/0.6)};   // she drops from the hold under gravity
      if(!ctx.land && f>0.25){ ctx.land=1; dust(new THREE.Vector3(ctx.n.x,0,0),0.6,3); } return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    if(!ctx.dead){ const rate=ctx.out==="b"?0.6:0.22; if(k>0.35) ctx.mash=Math.min(1,ctx.mash+dt*rate); ctx.qte={k:"E",fill:ctx.mash,txt:"MASH · ESCAPE OR DIE"}; ctx.phase= k<0.45?"wraps round her · hauls her in":"crushing hug";
      shake=Math.max(shake,0.03); ctx.n={J:nJ,x:hold.x,y:hold.y,held:true};
      if(ctx.out==="b"&&ctx.mash>=1){ ctx.free=t; ctx.fx=hold.x; ctx.fy=hold.y; cue("wrenches free"); dmg("ESCAPED","she wrenches out of the hug"); hitStop(0.05); }
      if(ctx.out==="a"&&k>2.1){ ctx.dead=t; hitStop(0.22); camPunch(1.1); shake=Math.max(shake,0.55); cue("CRUNCH · spine snaps"); dmg("NORAH KILLED","crushed in the hug"); const p=noraPoint("neck"); blood(p,18,2.2,0.07); }
      return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    // dead: one hard squeeze, she folds backward over the stumps, limp; it holds her a moment and lets her slide down
    const e=t-ctx.dead; ctx.qte=null; ctx.phase= e<1.6?"dead · held limp":"lets her drop";
    const dJ=P0(); dJ.sp=-0.55*ss(e/0.2); dJ.nx=-0.9*ss(e/0.25); dJ.ny=0.3; dJ.aLx=dJ.aRx=0.25; dJ.aLz=dJ.aRz=0.35; dJ.eL=dJ.eR=0.2; dJ.lLx=0.1; dJ.lRx=-0.05; dJ.kL=0.35; dJ.kR=0.2; dJ.fL=dJ.fR=0.4;
    if(e<1.6){ if(Math.random()<dt*6) drip(noraPoint("neck")); ctx.n={J:dJ,x:hold.x,y:hold.y,held:true}; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    const d=ss((e-1.6)/0.5); st.rest=1-d; for(const s of ["L","R"]) ctx["f"+s]=ctx["f"+s].clone().lerp(footSpot({x:ctx.x,yaw:Math.PI/2},s,0.4),Math.min(1,dt*6)); st.fist=null; st.contact=null;
    if(d>0.95&&!ctx.drop){ ctx.drop=1; dust(new THREE.Vector3(hold.x,0,0),0.9,6); debris(new THREE.Vector3(hold.x,0,0),6,0.8); cue("body drops"); }
    ctx.n={J:mix(dJ,NP.lie(t,1,0),d), x:hold.x+0.3*d, fall:d, held:d<0.05, y:d<0.05?hold.y:0}; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
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
      ctx.n={J:nJ,x:h.x,y:h.y-0.95,held:true}; if(Math.random()<dt*3) cue("ribs creak open");
      if(ctx.out==="b" && ctx.mash>=1){ ctx.end=t; ctx.res="free"; ctx.pullAt=pull; ctx.hy=h.y-0.95; cue("tears loose · drops"); dmg("BROKE FREE","drops and stumbles clear"); hitStop(0.06); }
      if(ctx.out==="a" && pull>=0.999){ ctx.end=t; ctx.res="eaten"; hitStop(0.22); camPunch(1); shake=Math.max(shake,0.6); cue("jaws slam shut · crunch"); dmg("NORAH KILLED","eaten · the jaws close on her"); const p=mouthPos3(); blood(p,40,3,0.09); }
      return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    const e=t-ctx.end;
    if(ctx.res==="free"){ ctx.qte=null; ctx.phase="she drops free"; const fy=Math.max(0,ctx.hy*(1-easeIn(Math.min(1,e/0.3))));
      if(!ctx.land && fy<=0.001){ ctx.land=1; dust(new THREE.Vector3(h.x+0.6,0,0),0.7,4); cue("lands hard"); }
      ctx.n={J: e<0.6?NP.stumble():mix(NP.stumble(),NP.stand(),ss((e-0.6)/0.5)), x:h.x+1.2*easeOut(Math.min(1,e/0.6))};
      const out=ss(e/0.35); ctx.fL=side(h,"L").add(new THREE.Vector3(-0.3*out,-0.4*out,-0.5*out)); ctx.fR=side(h,"R").add(new THREE.Vector3(-0.3*out,-0.4*out,0.5*out)); st.jaw=0.45-0.95*ss(e/0.25);
      if(e>0.18&&!ctx.snap){ ctx.snap=1; cue("jaws snap on air"); shake=Math.max(shake,0.12); } return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    // eaten: the halves slam shut on her and grind; her legs kick, then hang
    ctx.qte=null; ctx.phase= e<1.5?"jaws shut on her · grinding":"still"; st.jaw=-0.15+0.08*Math.sin(e*13)*(e<1.5?1:0.1); st.pitch=-0.15;
    if(e<1.5 && Math.random()<0.4) blood(mouthPos3(),2,1.4,0.06); if(Math.random()<dt*10) drip(mouthPos3().add(new THREE.Vector3(0,-0.25,(Math.random()-0.5)*0.4)));
    const lJ=NP.held(t); lJ.sp=0.5; const kick=e<1.3?1-e/1.3:0; lJ.lLx=-0.1+0.6*kick*Math.sin(e*13); lJ.lRx=0.1-0.6*kick*Math.sin(e*11); lJ.kL=0.2+0.4*kick; lJ.kR=0.2; lJ.aLx=lJ.aRx=0.25; lJ.aLz=lJ.aRz=0.1; lJ.nx=0.7;
    ctx.n={J:lJ,x:h.x,y:h.y-0.95,held:true}; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
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

// ---- the legless one (m02): the man ends at an open waist. It drags that wound along the floor, and the waist hangs viscera
const GUT_COL=[0x6e1414,0x8c3a30,0x5a0c10,0x9a4a3a,0x701c18];
function waistInit(R){ const g=R.mesh.geometry, P=g.attributes.position, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, ti=R.mesh.skeleton.bones.indexOf(R.B.torso);
  const vs=[]; const v=new THREE.Vector3(); for(let i=0;i<P.count;i++){ let bi=0,bw=-1; for(let w=0;w<4;w++){ const x=[SW.getX(i),SW.getY(i),SW.getZ(i),SW.getW(i)][w]; if(x>bw){ bw=x; bi=[SI.getX(i),SI.getY(i),SI.getZ(i),SI.getW(i)][w]; } } if(bi===ti) vs.push(i); }
  let lo=1e9; for(const i of vs) lo=Math.min(lo,P.getY(i)); const c=new THREE.Vector3(); let n=0; for(const i of vs) if(P.getY(i)<lo+0.08){ c.add(v.fromBufferAttribute(P,i)); n++; } c.divideScalar(Math.max(1,n));
  let r=0; for(const i of vs) if(P.getY(i)<lo+0.08){ v.fromBufferAttribute(P,i); r+=Math.hypot(v.x-c.x,v.z-c.z); } r=Math.max(0.06,r/Math.max(1,n));
  const M=new THREE.Matrix4().multiplyMatrices(R.mesh.skeleton.boneInverses[ti],R.mesh.bindMatrix), toL=p=>p.clone().applyMatrix4(M);
  R.waist={c:toL(c.setY(lo+0.02)),ring:[0,1,2,3,4].map(k=>{ const a=k/5*Math.PI*2+0.4; return toL(new THREE.Vector3(c.x+Math.cos(a)*r*0.65,lo+0.01,c.z+Math.sin(a)*r*0.65)); }),r}; }
function waistW(R,p){ R.mesh.updateMatrixWorld(true); return p.clone().applyMatrix4(R.B.torso.matrixWorld).applyMatrix4(R.mesh.bindMatrixInverse).applyMatrix4(R.mesh.matrixWorld); }
// viscera: ropes of verlet nodes hanging from the waist ring. Gravity, segment length, the floor (rest + scraping friction); they swing with the body, pile and drag
function gutsInit(R){ gutsClear(R); if(!R.waist) return; R.guts=[];
  R.waist.ring.forEach((a,k)=>{ const n=7+((k*3)%4), seg=0.085+0.015*(k%3), rad=0.034+0.012*((k+1)%3), A=waistW(R,a), nodes=[], meshes=[]; const mat=new THREE.MeshLambertMaterial({color:GUT_COL[k%5]});
    for(let i=0;i<n;i++){ const p=A.clone().add(new THREE.Vector3(0,-seg*i,0)); nodes.push({p,q:p.clone()}); }
    for(let i=0;i<n-1;i++){ const m=new THREE.Mesh(new THREE.CylinderGeometry(rad*(1-0.25*i/n),rad*(1-0.25*(i+1)/n),1,7),mat); scene.add(m); meshes.push(m); }
    const blob=new THREE.Mesh(new THREE.SphereGeometry(rad*1.5,8,6),mat); scene.add(blob);
    R.guts.push({a,nodes,meshes,blob,seg,rad,drip:Math.random()}); }); }
function gutsClear(R){ if(R&&R.guts) for(const g of R.guts){ for(const m of g.meshes) scene.remove(m); scene.remove(g.blob); } if(R) R.guts=null; }
function gutsStep(R,dt){ if(!R.guts) return; const G=new THREE.Vector3(0,-GRAV,0), up=new THREE.Vector3(0,1,0);
  const h=Math.min(dt,1/30)/2; for(let sub=0;sub<2;sub++) for(const g of R.guts){ const N=g.nodes; N[0].p.copy(waistW(R,g.a)); N[0].q.copy(N[0].p);
    for(let i=1;i<N.length;i++){ const o=N[i], vel=o.p.clone().sub(o.q).multiplyScalar(0.995); o.q.copy(o.p); o.p.add(vel).addScaledVector(G,h*h); }
    for(let it=0;it<5;it++) for(let i=1;i<N.length;i++){ const a=N[i-1], b=N[i], d=b.p.clone().sub(a.p), L=d.length()||1e-6, k=(L-g.seg)/L; if(i===1) b.p.addScaledVector(d,-k); else { a.p.addScaledVector(d,k*0.5); b.p.addScaledVector(d,-k*0.5); } }
    for(let i=1;i<N.length;i++){ const o=N[i]; if(o.p.y<g.rad){ o.p.y=g.rad; if(o.q.y>o.p.y) o.q.y=o.p.y; o.q.x+=(o.p.x-o.q.x)*0.35; o.q.z+=(o.p.z-o.q.z)*0.35; } } }   // floor: no sinking, scraping friction
  for(const g of R.guts){ const N=g.nodes; for(let i=0;i<g.meshes.length;i++){ const a=N[i].p, b=N[i+1].p, d=b.clone().sub(a), m=g.meshes[i]; m.position.copy(a).lerp(b,0.5); m.scale.set(1,Math.max(0.01,d.length()),1); m.quaternion.setFromUnitVectors(up,d.normalize()); }
    const tip=N[N.length-1].p; g.blob.position.copy(tip);
    g.drip-=dt*(1.4+N[N.length-1].p.distanceTo(N[N.length-1].q)/dt*0.6); if(g.drip<=0){ g.drip=0.25+Math.random()*0.9; if(tip.y>0.06) drip(tip.clone().add(new THREE.Vector3(0,-g.rad,0))); else floorSplat(tip,0.12); } } }
// the open waist itself: a steady drip; dragged across the floor it leaves a wet smear
function waistGore(R,dt){ if(!R.waist) return; const W=waistW(R,R.waist.c); BS.wdrip=(BS.wdrip??0)-dt*3.5; if(BS.wdrip<=0){ BS.wdrip=Math.random(); if(W.y>0.08) drip(W.clone().add(new THREE.Vector3((Math.random()-.5)*R.waist.r,0,(Math.random()-.5)*R.waist.r))); }
  if(W.y<0.2){ const last=BS.smear; if(!last || Math.hypot(W.x-last.x,W.z-last.z)>0.14){ floorSplat(new THREE.Vector3(W.x,0,W.z),0.42); BS.smear=W.clone(); if(last && Math.random()<0.35) cue("wet scrape"); } } else BS.smear=null;
  return W; }
// ---- drag-crawl: it reaches one stump ahead, plants it, and hauls its body forward on the waist against sliding friction
const MU_K=0.6, WAIST_LOAD=0.45;      // kinetic friction on the wound; share of its weight on the waist while dragging
A.crawl={ name:"Drags itself on its waist", len:11, start(ctx){ ctx.x=-7.0; plantInit(ctx,0); ctx.v=0; ctx.s="L"; ctx.ph="reach"; ctx.pt=0; ctx.n={}; },
  step(t,dt,ctx){ const st=base(ctx); const other=s=>s==="L"?"R":"L";
    if(t<0.9){ const u=ss(t/0.9); ctx.phase="sinks onto its waist"; st.rootY=BR.shoulderY-0.95*u; st.sink=u>0.5; st.pitch=0.12*u; return st; }
    st.rootY=BR.shoulderY-0.95; st.sink=true; const fr=MU_K*GRAV*WAIST_LOAD; let pull=0;
    if(t<9.6){ const s=ctx.s; ctx.pt+=dt;
      if(ctx.ph==="reach"){ const T=0.62, u=Math.min(1,ctx.pt/T); if(!ctx.from) ctx.from=ctx["f"+s].clone(); const to=footSpot({x:ctx.x,yaw:Math.PI/2},s,0.9,0.9);
        stepFoot(ctx,s,ctx.from,to,u,0.5); st.lift[s]=0.4*Math.sin(u*Math.PI); ctx.phase="reaches a stump ahead";
        if(u>=1){ stumpSlam(ctx["f"+s],0.6); ctx.ph="pull"; ctx.pt=0; ctx.from=null; } }
      else { const lead=ctx["f"+s].x-ctx.x; pull = lead>0.3 ? 3.9 : 0; ctx.phase="hauls itself forward · waist scraping"; if(lead<=0.3||ctx.pt>1.1){ ctx.ph="reach"; ctx.pt=0; ctx.s=other(s); } } }
    else ctx.phase= ctx.v>0.02?"slides to a stop":"lies on its wound, breathing";
    // Coulomb friction: the wound sticks once it stops
    ctx.v+=pull*dt; if(ctx.v>0){ ctx.v=Math.max(0,ctx.v-fr*dt); } ctx.x+=ctx.v*dt; st.x=ctx.x;
    const pk=pull>0?1:0; BS.pk=(BS.pk||0)+(pk-(BS.pk||0))*Math.min(1,dt*6); st.pitch=0.12+0.14*BS.pk; st.z=(ctx.s==="L"?-1:1)*0.1*BS.pk; st.roll=-st.z*0.6; st.manSwing=0.25*BS.pk;
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
// ---- wrecking-ball swing: plants wide and staggered, pumps the hanging man like a pendulum, then heaves him into her
A.wreck={ name:"Wrecking-ball swing", len:8, start(ctx){ ctx.x=NX-0.8; ctx.fL=footSpot({x:ctx.x,yaw:Math.PI/2},"L",0.75,1.0); ctx.fR=footSpot({x:ctx.x,yaw:Math.PI/2},"R",-0.75,1.0); ctx.n={}; ctx.out=outcome("oWreck",ctx); ctx.pd={th:0,w:0}; },
  step(t,dt,ctx){ const st=base(ctx), P=ctx.pd; const Lp=0.93, wn=Math.sqrt(GRAV/Lp);   // the man as a physical pendulum hung at its shoulders
    let drive=0; const amp=Math.hypot(P.th,P.w/wn);
    if(t<0.7){ ctx.phase="plants wide, staggered"; }
    else if(!ctx.go){ ctx.phase="pumps him back and forth (the tell)"; drive=amp<0.85? 2.2*Math.sign(P.w||1) : 0; if(amp>0.8 && P.th<-0.4 && P.w>=0){ ctx.go=t; cue("the man's body creaks back"); } }
    else if(!ctx.hit && P.th<0.2 && t-ctx.go<1.2){ ctx.phase="heaves him forward"; drive=3.0; }
    else ctx.phase= ctx.hit? "swings back · settles" : "swings through";
    P.w+=(-wn*wn*Math.sin(P.th)+drive-(ctx.hit?0.9:0.25)*P.w)*dt; P.th+=P.w*dt;
    // its body takes the reaction: rocks against the swing and bobs to pump it
    st.manAngle=-P.th; st.pitch=-0.12*P.th+0.05; st.rootY=BR.shoulderY-0.3-0.06*Math.cos(2*P.th);
    // Norah: braces, or reads the tell and steps back out of reach
    if(!ctx.hit){ if(ctx.out==="b" && t>1.6){ ctx.bp=(ctx.bp||0)+dt*1.4; ctx.n={J:NP.backstep(ctx.bp),x:NX+Math.min(1.1,(t-1.6)*0.9)}; } else ctx.n={J:NP.stand()}; }
    if(ctx.go && !ctx.hit && P.w>0){ const hp=new THREE.Vector3(); BR.B.torso.getWorldPosition(hp); const W=BR.waist?waistW(BR,BR.waist.c):hp; const tip=hp.clone().lerp(W,0.9), nx=ctx.n.x??NX;
      BS.wtip=tip; if(tip.distanceTo(new THREE.Vector3(nx-0.15,1.1,0))<0.42){ ctx.hit=t; P.w*=0.5; hitStop(0.14); camPunch(1); shake=Math.max(shake,0.5); cue("meat into meat · CRUNCH"); dmg("NORAH −35","wrecking-ball swing · knocked flying"); const p=noraPoint("chest"); blood(p,16,3,0.07); blood(W,10,2.5,0.06); ctx.nx0=nx; } }
    if(ctx.hit){ const k=t-ctx.hit; const J=k<0.6?NP.stumble():NP.lie(t,1,0.2); if(k<0.6){ J.aLx=J.aRx=-2.0; } ctx.n={J,x:ctx.nx0,fall:PHYS.topple(ctx.nt||(ctx.nt={th:0.25,w:3.6}),dt,1.65,1.5),kick:"wreck",kickV:{x:5.2,y:2.0,z:0.4}};
      if(k>0.5&&!ctx.landed){ ctx.landed=1; cue("she hits the floor"); dust(new THREE.Vector3(ctx.nx0+2.2,0,0),0.8,5); } }
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };

// ---- the armoured one (m04): bone-coloured plates and slats strapped over the flesh. Bullets glance off; a cracked piece
// is knocked loose and becomes its own rigid body (gravity, tumbling, landing, tipping over onto its flattest side)
const V3=THREE.Vector3;
function armorPrep(R){ if(!R.armor||R.armorPrep) return; R.armorPrep=1; R.loose=[]; const P=R.mesh.geometry.attributes.position;
  for(const a of R.armor){ a.hp0=a.hp; const vs=a.vs, samp=new Set(); const ax=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].map(d=>new V3(...d));
    for(const d of ax){ let best=-1,bd=-1e9; for(const i of vs){ const q=new V3().fromBufferAttribute(P,i).dot(d); if(q>bd){ bd=q; best=i; } } samp.add(best); }
    for(let k=0;k<vs.length;k+=Math.max(1,Math.floor(vs.length/10))) samp.add(vs[k]); a.samp=[...samp]; } }
// skinning swaps: fitted to the flesh while on, its own bone (rigid) once knocked loose
function armorSkin(R,a,own){ const g=R.mesh.geometry, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight;
  a.vs.forEach((i,n)=>{ for(let k=0;k<4;k++){ SI.array[i*4+k]= own? (k===0?a.own:0) : a.skinI[n*4+k]; SW.array[i*4+k]= own? (k===0?1:0) : a.skinW[n*4+k]; } });
  SI.needsUpdate=SW.needsUpdate=true; if(R.pb){ R.pb.refresh(); R.pb.chain=null; R.pb.leg=null; } }
function armorReset(R){ if(!R||!R.armor) return; armorPrep(R); let ch=0; for(const a of R.armor){ if(a.off){ a.par.add(a.b); a.b.position.copy(a.p0); a.b.quaternion.copy(a.q0); a.b.userData.detached=false; if(a.skinI) armorSkin(R,a,false); ch++; } a.off=false; a.hp=a.hp0; a.rb=null; } R.loose=[]; }
function armorHome(a){ return a.off? a.par.localToWorld(a.p0.clone()) : a.b.getWorldPosition(new V3()); }
function armorKnock(R,a,v,w){ if(a.off) return; R.mesh.updateMatrixWorld(true); if(a.skinI) armorSkin(R,a,true); a.par=a.b.parent; a.p0=a.b.position.clone(); a.q0=a.b.quaternion.clone(); scene.attach(a.b); a.b.userData.detached=true; a.off=true;
  a.rb={v:v.clone(),w:w||new V3((Math.random()-.5)*14,(Math.random()-.5)*14,(Math.random()-.5)*14),rest:false,hitN:false}; R.loose.push(a); }
function stepLoose(R,dt,onFly){ if(!R.loose||!R.loose.length) return; const P=R.mesh.geometry.attributes.position, p=new V3();
  for(const a of R.loose){ const r=a.rb; if(r.rest) continue; const b=a.b; r.v.y-=GRAV*dt; b.position.addScaledVector(r.v,dt);
    const ang=r.w.length(); if(ang>1e-4) b.quaternion.premultiply(new THREE.Quaternion().setFromAxisAngle(r.w.clone().divideScalar(ang),ang*dt)); b.updateMatrixWorld(true);
    let lo=1e9, lp=null; for(const i of a.samp){ p.fromBufferAttribute(P,i); R.mesh.boneTransform(i,p); p.applyMatrix4(R.mesh.matrixWorld); if(p.y<lo){ lo=p.y; lp=p.clone(); } }
    if(onFly) onFly(a,b.getWorldPosition(new V3()));
    if(lo<0){ b.position.y-=lo; const imp=-r.v.y; if(r.v.y<0) r.v.y=imp*0.22; r.v.x*=0.5; r.v.z*=0.5;
      if(imp>2){ dust(lp.clone().setY(0.02),0.25,1); if(Math.random()<0.4) cue("bone-plate clatters"); }
      // gravity about the contact corner tips it toward its flattest side; contact friction takes the spin out
      const c=b.getWorldPosition(new V3()), arm=c.clone().sub(lp), k=a.ext*a.ext/12+arm.lengthSq(); r.w.add(arm.clone().cross(new V3(0,-GRAV,0)).multiplyScalar(dt/k)); r.w.multiplyScalar(0.7);
      if(r.v.length()<0.12 && r.w.length()<0.4){ r.rest=true; } } } }
// one round from her gun into its front: armour takes it (and maybe cracks and falls), bare flesh bleeds
function tracer(a,b){ const g=new THREE.BufferGeometry().setFromPoints([a,b]); const m=new THREE.Line(g,new THREE.LineBasicMaterial({color:0xffe0a0,transparent:true,opacity:0.9})); scene.add(m); fx.push({m,t:0,life:0.06,o:1,v:new V3(),g:0}); }
function shotAt(R,ctx,tgt,label){ const mz=new V3(); nora.gun.localToWorld(mz.set(-0.12,0,0)); muzzle(); tracer(mz,tgt); cue("gunshot"); hitStop(0.035); camPunch(0.15); const dir=tgt.clone().sub(mz).normalize();
  const near=(R.armor||[]).filter(a=>!a.off && a.b.getWorldPosition(new V3()).distanceTo(tgt)<Math.max(0.12,a.ext*0.38));
  if(near.length){ let broke=0; for(const a of near){ a.hp--; if(a.hp<=0){ broke++; armorKnock(R,a,dir.clone().multiplyScalar(1.6+Math.random()*1.4).add(new V3((Math.random()-.5)*1.2,1.2+Math.random(),(Math.random()-.5)*1.2))); } }
    chunks(tgt,dir.clone().negate(),5); for(const q of fx.slice(-5)) if(q.m.material) q.m.material.color.setHex(0xd8ccae); streak(tgt,0.5); dust(tgt,0.3,2);
    ctx.hp-=1; if(broke){ cue("plate cracks · falls away"); dmg(`BRUTE −1 · ${ctx.hp}`,`${label}: the armour cracks and drops off`); shake=Math.max(shake,0.12); } else { cue("round glances off bone-plate"); dmg(`BRUTE −1 · ${ctx.hp}`,`${label}: glances off the armour`); }
    BS.twitch=Math.max(BS.twitch||0,0.3); return "armor"; }
  blood(tgt,10,2.2,0.06); chunks(tgt,dir.clone().negate(),3); ctx.hp-=12; dmg(`BRUTE −12 · ${ctx.hp}`,`${label}: bare flesh · full damage`); cue("wet thud · it roars"); BS.twitch=1.2; ctx.kb=ctx.t; return "flesh"; }
A.armor={ name:"Shooting the armour", len:10, start(ctx){ ctx.x=NX-4.6; plantInit(ctx,0); ctx.n={}; ctx.k=0; ctx.hp=100; ctx.plan=null; },
  step(t,dt,ctx){ const st=base(ctx); ctx.t=t; gunUp(); const rec=ctx.lastShot!=null?Math.max(0,1-(t-ctx.lastShot)/0.18):0; ctx.n={J:AIMP(rec)};
    if(!ctx.plan){ const A=BR.armor; const big=f=>A.filter(f).sort((a,b)=>b.vs.length-a.vs.length);
      const chest=big(a=>a.plate&&a.host==="torso")[0]||big(a=>a.host==="torso")[0], fore=big(a=>/^kn/.test(a.host)&&a.side==="L"), pad=big(a=>/^ap/.test(a.host)&&a.side==="L")[0];
      const foreC=()=>{ const c=new V3(); let n=0; for(const a of fore) if(!a.off||true){ c.add(armorHome(a)); n++; } return c.divideScalar(Math.max(1,n)); };
      const P=(f,l)=>({f,l}); ctx.plan=[P(()=>armorHome(chest),"chest"),P(()=>armorHome(chest),"chest"),P(()=>armorHome(chest),"chest"),P(()=>armorHome(chest),"chest"),P(()=>armorHome(chest),"chest"),
        P(foreC,"forearm"),P(foreC,"forearm"),P(foreC,"forearm"),P(foreC,"forearm"),P(()=>armorHome(pad),"shoulder"),P(()=>armorHome(pad),"shoulder"),P(()=>armorHome(pad),"shoulder")]; }
    const T0=1.0, gap=0.62; if(ctx.k<ctx.plan.length && t>=T0+ctx.k*gap){ const q=ctx.plan[ctx.k++]; ctx.lastShot=t; const p=q.f().add(new V3((Math.random()-.5)*0.04,(Math.random()-.5)*0.04,0)); ctx.last=shotAt(BR,ctx,p,q.l); }
    const kb=ctx.kb!=null?Math.max(0,1-(t-ctx.kb)/0.5):0; st.pitch=-0.3*kb+0.04*Math.sin(t*1.7); st.manSwing=0.4*kb; st.rootY=BR.shoulderY-0.03+0.02*Math.sin(t*1.5);
    ctx.phase= ctx.k===0?"braces, plated":ctx.last==="flesh"?"hit in the bare flesh · roars":"rounds glance off · plates crack loose";
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
// ---- splinter burst: it grinds its slatted forearms together and smashes them: the slats burst into a spray of splinters at her
let SHARDS=[]; function shardsClear(){ for(const s of SHARDS) s.m.parent&&s.m.parent.remove(s.m); SHARDS=[]; }
const shardMat=new THREE.MeshLambertMaterial({color:0xd6c9a6});
A.splinter={ name:"Splinter burst", len:7.5, start(ctx){ ctx.x=NX-4.3; plantInit(ctx,0); ctx.n={}; ctx.out=outcome("oSplinter",ctx); ctx.hits=0; },
  step(t,dt,ctx){ const st=base(ctx); const L0=ctx.L0||(ctx.L0=ctx.fL.clone().add(new V3(0,R_d("L"),0))), R0=ctx.R0||(ctx.R0=ctx.fR.clone().add(new V3(0,R_d("R"),0)));
    const up=s=>bruteLocal(st,(s==="L"?1:-1)*1.0,1.95,0.75), C=bruteLocal(st,0,1.75,1.05), nx=NX;
    // Norah: stands in it, or reads the grind and dives
    if(ctx.out==="b" && t>1.55){ const k=t-1.55, u=easeOut(Math.min(1,k/0.45)); const J=NP.stumble(); J.aLx=J.aRx=-2.2*u; ctx.n={J:k<0.55?J:k<1.6?NP.lie(t,1,0.3):mix(NP.lie(t,1,0),NP.stand(),ss((k-1.6)/0.6)),x:NX+0.2,z:-1.9*u,kick:"dive",kickV:{x:0.2,y:2.4,z:-3.9},fall:k<1.6?Math.min(1,k/0.35):1-ss((k-1.6)/0.6),roll:1.3*u*(k<1.6?1:1-ss((k-1.6)/0.6))}; }
    else if(ctx.flinch!=null && t-ctx.flinch<0.5){ const J=NP.stumble(); J.aLx=J.aRx=-1.4; J.eL=J.eR=1.6; ctx.n={J}; }
    else ctx.n={J:NP.stand()};
    if(t<0.6){ ctx.phase="watching her"; return st; }
    let fist=null;
    if(t<1.7){ const u=ss((t-0.6)/0.8), tr=0.03*u*Math.sin(t*47); fist={L:L0.clone().lerp(up("L"),u).add(new V3(tr,tr,0)),R:R0.clone().lerp(up("R"),u).add(new V3(-tr,tr,0))}; st.rest=u; st.pitch=-0.18*u; ctx.phase="raises its slatted forearms · grinds them (the tell)";
      if(t>1.0&&!ctx.c1){ ctx.c1=1; cue("slats grind and creak"); } }
    else if(!ctx.boom){ const u=Math.min(1,((t-1.7)/0.2)**2); fist={L:up("L").lerp(C.clone().add(new V3(0,0,-0.12)),u),R:up("R").lerp(C.clone().add(new V3(0,0,0.12)),u)}; st.rest=1; st.pitch=-0.18+0.4*u; ctx.phase="smashes them together";
      if(u>=1){ ctx.boom=t; hitStop(0.12); shake=Math.max(shake,0.6); camPunch(1.1); cue("CRACK · the slats burst"); dust(C,1.2,8);
        const toN=new V3(nx,1.1,0).sub(C).normalize();
        for(const a of BR.armor) if(!a.off && /^kn/.test(a.host)){ const v=toN.clone().multiplyScalar(1.5+Math.random()*5).add(new V3((Math.random()-.5)*5,1+Math.random()*3,(Math.random()-.5)*6)); armorKnock(BR,a,v); a.rb.shard=true; }
        for(let i=0;i<46;i++){ const m=new THREE.Mesh(new THREE.BoxGeometry(0.016,0.016,0.09+Math.random()*0.1),shardMat); const p=C.clone().add(new V3((Math.random()-.5)*0.3,(Math.random()-.5)*0.3,(Math.random()-.5)*0.3)); m.position.copy(p); scene.add(m);
          const d=toN.clone().add(new V3((Math.random()-.5)*0.6,(Math.random()-.5)*0.55+0.1,(Math.random()-.5)*1.1)).normalize(); SHARDS.push({m,v:d.multiplyScalar(8+Math.random()*8),stuck:false}); } } }
    else { const e=t-ctx.boom, u=ss(e/1.1); fist= u<1? {L:C.clone().lerp(L0,u),R:C.clone().lerp(R0,u)} : null; st.rest=1-u; st.pitch=0.22*(1-u); ctx.phase= e<1.1?"forearms bare · flesh shredded":"settles"; if(u>=1&&!ctx.pl){ ctx.pl=1; stumpSlam(ctx.fL,0.5); stumpSlam(ctx.fR,0.5); } }
    if(fist){ st.fist=fist; st.padDir={L:new V3(0,0,1),R:new V3(0,0,-1)}; st.lift={L:0.6,R:0.6}; }
    // shards: ballistic; they stick in the floor or in her
    const np=nora.group.position, a0=new V3(np.x,np.y+0.15,np.z), a1=new V3(np.x,np.y+1.55,np.z);
    const inHer=p=>{ const ab=a1.clone().sub(a0), u=clamp(p.clone().sub(a0).dot(ab)/ab.lengthSq(),0,1); return p.distanceTo(a0.clone().addScaledVector(ab,u))<0.21; };
    for(const sh of SHARDS){ if(sh.stuck) continue; sh.v.y-=GRAV*dt; sh.m.position.addScaledVector(sh.v,dt); sh.m.quaternion.setFromUnitVectors(new V3(0,0,1),sh.v.clone().normalize());
      if(nora.group.visible && inHer(sh.m.position)){ sh.stuck=true; sh.m.parent&&sh.m.parent.remove(sh.m); ctx.hits++; ctx.flinch=t; blood(sh.m.getWorldPosition(new V3()),3,1.2,0.04); dmg(`NORAH −${ctx.hits*3}`,`${ctx.hits} splinter${ctx.hits>1?"s":""} in her`); }
      else if(sh.m.position.y<0.03){ sh.stuck=true; sh.m.position.y=0.03; sh.m.rotateX(0.4); } }
    stepLoose(BR,dt,(a,p)=>{ if(a.rb.shard && !a.rb.hitN && nora.group.visible && inHer(p)){ a.rb.hitN=true; ctx.hits+=2; ctx.flinch=t; blood(p,6,1.6,0.05); dmg(`NORAH −${ctx.hits*3}`,"a whole slat hits her"); a.rb.v.multiplyScalar(-0.2); } });
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
// ---- brick wall: something for the charge to go through
let WALL=null; const WX=NX+4.4;
function buildWall(){ if(ctx.live) return; if(WALL) scene.remove(WALL.g); const g=new THREE.Group(), bricks=[]; const mats=[0x6e3a2a,0x7a4330,0x63341f,0x845038].map(c=>new THREE.MeshLambertMaterial({color:c}));
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
      if(ctx.dive!=null){ const k=t-ctx.dive, u=easeOut(Math.min(1,k/0.45)); const J=NP.stumble(); J.aLx=J.aRx=-2.4*u; ctx.n={J:k<0.5?J:NP.lie(t,1,0.3),x:NX+0.3,z:2.1*u,fall:Math.min(1,k/0.35),roll:-1.4*u,yaw:-Math.PI/2+0.9*u,kick:"dive",kickV:{x:0.3,y:2.6,z:4.2}}; if(k>0.4&&!ctx.dl){ ctx.dl=1; dust(new THREE.Vector3(NX+0.3,0,2.1),0.7,4); cue("dives clear"); } }
      if(gap<0.95){ ctx.hitT=t; ctx.vHit=ctx.v;
        if(ctx.out==="b"){ cue("misses · ploughs on"); shake=Math.max(shake,0.2); }
        else { hitStop(0.16); camPunch(1.3); shake=Math.max(shake,0.75); cue("CRUNCH · like a car"); dmg("NORAH −70","hit by the charge · thrown"); ring(new THREE.Vector3(NX,0.02,0),2.2); const p=noraPoint("chest"); blood(p,22,4,0.08); dust(p,1.2,8); debris(new THREE.Vector3(NX,0.05,0),18,1.4);
          ctx.np=new THREE.Vector3(NX+0.4,0.9,0); ctx.nv=new THREE.Vector3(8.5,3.4,2.4); ctx.nf=0; ctx.kid=1; } }
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
    if(ctx.out!=="b"){ if(ctx.nv){ ctx.nv.y-=GRAV*dt; ctx.np.addScaledVector(ctx.nv,dt); ctx.nf+=dt*6.5;
        if(ctx.np.x>WX-0.35 && ctx.nv.x>0){ ctx.np.x=WX-0.35; ctx.nv.x=-1.2; ctx.nv.z*=0.3; ctx.kid++; smashWall(ctx.np.clone(),0.55,new THREE.Vector3(2.5,0,0),0.6); hitStop(0.07); shake=Math.max(shake,0.35); cue("into the bricks"); blood(ctx.np.clone(),10,2,0.07); }
        if(ctx.np.y<=0.25 && ctx.nv.y<0){ ctx.np.y=0.25; if(!ctx.land){ ctx.land=1; dust(ctx.np.clone(),1,6); debris(ctx.np.clone(),6,0.8); cue("lands · skids"); } ctx.nv.y=0; ctx.nv.x*=Math.pow(0.02,dt); ctx.nv.z*=Math.pow(0.02,dt); if(ctx.nv.length()>0.6&&Math.random()<0.5) dust(ctx.np.clone(),0.4,1); } }
      const air=!ctx.land, J=air?NP.stumble():NP.lie(t,1,Math.max(0,0.25-0.05*k)); if(air){ J.aLx=J.aRx=-2.2; J.lLx=-0.6; J.kL=J.kR=0.4; }
      ctx.n={J,x:ctx.np.x,y:air?Math.max(0,ctx.np.y-0.9):0,z:ctx.np.z,kick:"c"+ctx.kid,kickV:{x:ctx.nv.x,y:ctx.nv.y,z:ctx.nv.z},fall:air?Math.min(1.6,ctx.nf*0.4+0.3):1,roll:air?Math.sin(ctx.nf)*0.6:-0.3,yaw:-Math.PI/2}; }
    else { const k2=t-ctx.dive; ctx.n={J:k2<1.6?NP.lie(t,1,0.4):mix(NP.lie(t,1,0),NP.stand(),ss((k2-1.6)/0.7)),x:NX+0.3,z:2.1,fall:1-ss((k2-1.6)/0.7),yaw:-Math.PI/2+0.9}; }
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
// ---- the stretching punch: balances on one stump, throws the other; slow to start, brutal if she's still there
function gunUp(){ if(!nora.gun){ const g=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.05,0.035),new THREE.MeshLambertMaterial({color:0x222222})); g.position.set(-0.14,0.02,0); nora.B.hand_R.add(g); nora.gun=g; } nora.gun.visible=true; }
function muzzle(){ const mz=new THREE.Vector3(); nora.gun.localToWorld(mz.set(-0.12,0,0)); const f2=new THREE.Sprite(new THREE.SpriteMaterial({map:streakTex,color:0xffd090,transparent:true,depthWrite:false})); f2.position.copy(mz); f2.scale.setScalar(0.35); scene.add(f2); fx.push({m:f2,t:0,life:0.06,o:1,v:new THREE.Vector3(),g:0}); }
A.punch={ name:"Stretching punch", len:7, start(ctx){ ctx.x=NX-6.4; plantInit(ctx,0); ctx.n={}; ALT.pside=!ALT.pside; ctx.s=ALT.pside?"L":"R"; ctx.p=ctx.s==="L"?"R":"L"; ctx.out=outcome("oPunch",ctx); ctx.shots=0; ctx.hp=100; },
  step(t,dt,ctx){ const st=base(ctx), s=ctx.s, P=ctx.p, sg=s==="L"?1:-1; const st0={x:ctx.x,yaw:Math.PI/2};
    if(!ctx.F0){ ctx.F0=ctx["f"+s].clone(); ctx.P0=ctx["f"+P].clone(); ctx.fist=ctx.F0.clone().add(new THREE.Vector3(0,R_d(s),0)); }
    const cocked=bruteLocal(st0,sg*0.85,1.9,-0.7);
    // Norah: shooting it, standing there, or reading the wind-up and diving
    const shooting=ctx.out==="a";
    if(ctx.hitT==null){ if(shooting){ gunUp(); const rec=ctx.lastShot!=null?Math.max(0,1-(t-ctx.lastShot)/0.18):0; ctx.n={J:AIMP(rec)};
        if(t>0.7 && t<2.3 && (ctx.lastShot==null||t-ctx.lastShot>0.42)){ ctx.lastShot=t; muzzle(); cue("gunshot"); const p=new THREE.Vector3(); BR.B.torso.getWorldPosition(p); p.y+=0.3*Math.random(); blood(p,4,1.4,0.05); BS.twitch=1; ctx.hp-=4; dmg(`BRUTE −4 · ${ctx.hp}`,"shooting · she's standing still"); } }
      else if(ctx.out==="b" && t>1.95){ const k=t-1.95, u=easeOut(Math.min(1,k/0.45)); const J=NP.stumble(); J.aLx=J.aRx=-2.2*u; ctx.n={J:k<0.55?J:k<1.4?NP.lie(t,1,0.3):mix(NP.lie(t,1,0),NP.stand(),ss((k-1.4)/0.6)),x:NX+0.2,z:-1.9*u,kick:"dive",kickV:{x:0.2,y:2.4,z:-3.9},fall:k<1.4?Math.min(1,k/0.35):1-ss((k-1.4)/0.6),roll:1.3*u*(k<1.4?1:1-ss((k-1.4)/0.6))}; if(k>0.42&&!ctx.dl){ ctx.dl=1; dust(new THREE.Vector3(NX+0.2,0,-1.9),0.7,4); cue("dives aside"); } }
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
    if(ctx.hitT==null){ const u=Math.min(1,(t-2.15)/0.24), e=u*u; const end=ctx.out==="b"? ctx.tgt.clone().add(new THREE.Vector3(0.7,-ctx.tgt.y+0.15,0)) : ctx.tgt;
      ctx.fist=cocked.clone().lerp(end,e); st.fist={[s]:ctx.fist}; ctx.sm=0.55+0.45*u; st.star={[s]:ctx.sm}; st.pitch=0.35*e; st.twist=-sg*0.3*e; st.rootY=BR.shoulderY-0.15; ctx.phase="throws it · the flesh stretches";
      if(u<0.2&&!ctx.c3){ ctx.c3=1; cue("wet tearing stretch"); stumpSlam(ctx["f"+P],0.5); }
      if(u>=1){ ctx.hitT=t;
        if(ctx.out==="b"){ hitStop(0.08); camPunch(0.6); shake=Math.max(shake,0.35); stumpSlam(end,1); crack(end,1.1); debris(end,14,1.2); cue("fist buries in the floor"); }
        else { hitStop(0.2); camPunch(1.3); shake=Math.max(shake,0.65); cue("heavy crunch"); dmg("NORAH −55","punched clean off her feet"); const p=noraPoint("chest"); blood(p,20,3.5,0.08); dust(p,0.8,5); ring(new THREE.Vector3(NX,0.02,0),1.4);
          ctx.np=new THREE.Vector3(NX,0.9,0); ctx.nv=new THREE.Vector3(6.2,2.6,-sg*0.6); ctx.nf=0; ctx.kid=1; } }
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
    if(ctx.np){ ctx.nv.y-=GRAV*dt; ctx.np.addScaledVector(ctx.nv,dt); ctx.nf+=dt*6;
      if(ctx.np.y<=0.25 && ctx.nv.y<0){ ctx.np.y=0.25; if(!ctx.land){ ctx.land=1; dust(ctx.np.clone(),0.9,5); debris(ctx.np.clone(),5,0.8); cue("lands hard"); } ctx.nv.y=0; ctx.nv.x*=Math.pow(0.03,dt); ctx.nv.z*=Math.pow(0.03,dt); if(ctx.nv.length()>0.6&&Math.random()<0.5) dust(ctx.np.clone(),0.4,1); }
      const air=!ctx.land, J=air?NP.stumble():NP.lie(t,1,0.15); if(air){ J.aLx=J.aRx=-2.0; J.kL=J.kR=0.5; } if(nora.gun) nora.gun.visible=false;
      ctx.n={J,x:ctx.np.x,y:air?Math.max(0,ctx.np.y-0.9):0,z:ctx.np.z,kick:"p"+ctx.kid,kickV:{x:ctx.nv.x,y:ctx.nv.y,z:ctx.nv.z},fall:air?Math.min(1.5,0.3+ctx.nf*0.35):1,roll:air?Math.sin(ctx.nf)*0.4:0.2}; }
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
function R_d(s){ return BR.len["d"+s]; }
const ORDER=["walk","crawl","vault","sweep","slam","lunge","pin","charge","punch","wreck","armor","splinter","weak","eat","gut"];
const BASE=["walk","vault","sweep","slam","lunge","pin","charge","punch","weak"];
const MODEL_CLIPS={brute_twoarm_m01:BASE, brute_twoarm_m02_legless:["crawl","vault","sweep","lunge","pin","charge","punch","weak","wreck"],
  brute_twoarm_m03_split:BASE.concat(["eat","gut"]), brute_twoarm_m04_armored:["walk","vault","sweep","slam","lunge","pin","charge","armor","splinter"]};
const HOME={crawl:"brute_twoarm_m02_legless",wreck:"brute_twoarm_m02_legless",eat:"brute_twoarm_m03_split",gut:"brute_twoarm_m03_split",armor:"brute_twoarm_m04_armored",splinter:"brute_twoarm_m04_armored"};
const SWAP={walk:"crawl",crawl:"walk",slam:"wreck",wreck:"sweep",punch:"splinter",weak:"armor",armor:"weak",splinter:"punch",eat:"walk",gut:"weak"};
const modelHas=(k,c)=>(MODEL_CLIPS[k]||BASE).includes(c);
function modelFor(c){ const k=BR&&BR.uid; if(k&&modelHas(k,c)) return k; return HOME[c]||"brute_twoarm_m01"; }
function nextClip(){ for(let k=1;k<=ORDER.length;k++){ const c=ORDER[(ORDER.indexOf(cur)+k)%ORDER.length]; if(modelHas(BR.uid,c)) return c; } return cur; }

// ---------------------------------------------------------------- run it

// ---------------------------------------------------------------- the live host side of the two-armed Brute module
// One live body: its rig (BR) and state (BS) are bound in each frame. Her body is the playground's stand-in.
let nora=null, gameT=0, PV_KEY=""; const pvNoraCache=new WeakMap();
function pvNora(n){ if(!n) return null; let o=pvNoraCache.get(n); if(!o){ o={B:n.c.B, group:n.c.group, shadow:n.c.shadow, gun:null, model:null}; pvNoraCache.set(n,o); } return o; }
function pvPrep(g,h){ PV_KEY=h.key; }
function pvMakeChar(g){ const key=PV_KEY; const R=autoRig(g,{armor:key.includes("armored")}); R.uid=key; R.legless=key.includes("legless"); scene.add(R.mesh); if(R.armor&&R.armor.length) armorReset(R);   /* its loose-armour list, as the preview's clip start sets up */
  const C={group:R.mesh, model:R.mesh, B:R.B, R, bs:{limp:{L:false,R:false},lastRoot:null,lastV:null,ps:null,pf:null,al:null,cah:null,alp:null,ns:null,wasAir:false}, shadow:null}; return C; }
function pvBind(h){ ctx=h.ctx; scene=h.stage; t=h.t; nora=pvNora(h.norah); if(h.C){ BR=h.C.R; BS=h.C.bs; } }
function pvSetup(C){ BR=C.R; BS=C.bs; C.hgt=BR.H; C.hip0=BR.shoulderY; return C; }
function pvStep(h,dt){ pvBind(h); h.t+=dt; t=h.t; gameT+=dt; ctx.qte=null; ctx.events=[];
  const st=h.clip.step(t,dt,ctx); ctx.lastSt=st;
  // a stump never jumps more than 0.35 m in one frame (at a charge's speed the gait's swing target can leap a metre): it gets there a frame or two later
  { const F=ctx.fPrev||(ctx.fPrev={}); for(const s of ["L","R"]){ const f=st.feet&&st.feet[s]; if(!f||!f.isVector3) continue; const q=F[s]; if(q&&!ctx.fNoCap){ const d=f.distanceTo(q); if(d>0.35){ f.copy(q.clone().lerp(f,0.35/d)); } } F[s]=f.clone(); } ctx.fNoCap=false; }
  bruteFrame(st,dt); if(BS.ps&&BS.ps.e<-0.4) BS.ps.e=-0.4;   /* never sunk more than 0.4 m below its stance */
  // and its body never jolts up or down more than 10 cm in a frame (the flight physics at a charge's speed can): eased over a few frames
  { const rt=BR.B.root; if(rt){ const y=rt.position.y; if(ctx.rootY!=null&&!ctx.fNoCap){ const dy=y-ctx.rootY; if(Math.abs(dy)>0.1){ rt.position.y=ctx.rootY+Math.sign(dy)*0.1; BR.mesh.updateMatrixWorld(true); } } ctx.rootY=rt.position.y; } } BR.mesh.updateMatrixWorld(true); return ctx.events; }
function pvFx(dt){ stepFx(dt); stepGore(dt); const s=shake; shake=0; return s; }

// ---------------------------------------------------------------- the two-armed Brutes, live (playground)
const LIVE={};
// walking on its stumps: the preview's pendulum gait, toward wherever the AI wants it (ctx.wantV: 0 stop, 1 walk, 2 hurry)
LIVE.walk={ start(ctx){ if(!ctx.fL) plantInit(ctx,0); if(!ctx.g||ctx.g.mode!=="alt") gaitInit(ctx,{Ts:0.66,Tds:0.16,H:0.5,loss:0.8,push:2.4}); },
  step(t,dt,ctx){ const g=ctx.g, st=base(ctx); g.vdes=ctx.wantV>0?1.35*(ctx.speedK||1):0;
    ctx.phase= g.vdes>0?(g.v<0.9?"leans in · heavy steps":"walking · vaults over each stump"):Math.abs(g.v)>0.1?"brakes · steps catch its momentum":"stands · weight settled";
    return gaitStep(ctx,dt,st,landFx); } };
// hurrying: both stumps at once, vaulting between them
LIVE.vault={ start(ctx){ if(!ctx.fL) plantInit(ctx,0); if(!ctx.g||ctx.g.mode!=="pair") gaitInit(ctx,{mode:"pair",Ts:0.5,H:0.7,loss:0.78,width:1.05,v0:ctx.g?Math.max(0,ctx.g.v):0}); },
  step(t,dt,ctx){ const g=ctx.g, st=base(ctx); g.vdes=ctx.wantV>0?2.6:0; const r=gaitStep(ctx,dt,st,(p,k)=>{ stumpSlam(p,0.6+0.4*k); if(k>1) crack(p,0.5); });
    ctx.phase=g.air?"swings through · airborne for a beat":g.vdes?"lands on both stumps · vaults over them":"stops"; st.manSwing=-0.25*clamp(g.v/2.5,0,1)+(g.air?-0.3:0); return r; } };
// the legless one: drags itself on its waist, a stump at a time
LIVE.crawl={ start(ctx){ if(!ctx.fL) plantInit(ctx,0); ctx.v=ctx.v||0; ctx.s=ctx.s||"L"; ctx.ph=ctx.ph||"reach"; ctx.pt=ctx.pt||0; ctx.sk=ctx.sk??(ctx.lastSt?0.9:0); },
  step(t,dt,ctx){ const st=base(ctx); const other=s=>s==="L"?"R":"L"; ctx.sk+=dt;
    if(ctx.sk<0.9){ const u=ss(ctx.sk/0.9); ctx.phase="sinks onto its waist"; st.rootY=BR.shoulderY-0.95*u; st.sink=u>0.5; st.pitch=0.12*u; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    st.rootY=BR.shoulderY-0.95; st.sink=true; const fr=MU_K*GRAV*WAIST_LOAD; let pull=0;
    if(ctx.wantV>0||ctx.ph==="pull"||ctx.from){ const s=ctx.s; ctx.pt+=dt;
      if(ctx.ph==="reach"){ const T=0.62, u=Math.min(1,ctx.pt/T); if(!ctx.from) ctx.from=ctx["f"+s].clone(); const to=footSpot({x:ctx.x,yaw:Math.PI/2},s,0.9,0.9);
        stepFoot(ctx,s,ctx.from,to,u,0.5); st.lift[s]=0.4*Math.sin(u*Math.PI); ctx.phase="reaches a stump ahead";
        if(u>=1){ stumpSlam(ctx["f"+s],0.6); ctx.ph="pull"; ctx.pt=0; ctx.from=null; } }
      else { const lead=ctx["f"+s].x-ctx.x; pull = lead>0.3 ? 3.9 : 0; ctx.phase="hauls itself forward · waist scraping"; if(lead<=0.3||ctx.pt>1.1){ ctx.ph="reach"; ctx.pt=0; ctx.s=other(s); } } }
    else ctx.phase= ctx.v>0.02?"slides to a stop":"lies on its wound, breathing";
    ctx.v+=pull*dt; if(ctx.v>0){ ctx.v=Math.max(0,ctx.v-fr*dt); } ctx.x+=ctx.v*dt; st.x=ctx.x;
    const pk=pull>0?1:0; BS.pk=(BS.pk||0)+(pk-(BS.pk||0))*Math.min(1,dt*6); st.pitch=0.12+0.14*BS.pk; st.z=(ctx.s==="L"?-1:1)*0.1*BS.pk; st.roll=-st.z*0.6; st.manSwing=0.25*BS.pk;
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
// down for good: both stumps buckle outward and it sinks onto its belly; the man hangs still
LIVE.die={ start(ctx){ ctx.dk=0; ctx.dL=ctx.fL&&ctx.fL.clone(); ctx.dR=ctx.fR&&ctx.fR.clone(); if(!ctx.dL){ plantInit(ctx,0); ctx.dL=ctx.fL.clone(); ctx.dR=ctx.fR.clone(); } ctx.g=null; BS.limp={L:true,R:true}; },
  step(t,dt,ctx){ ctx.dk+=dt; const st=base(ctx), c=ss(ctx.dk/0.7), legless=BR.legless; ctx.phase="dead";
    for(const s of ["L","R"]){ const F=footSpot(st,s,0.3,1.45); F.y=0.02; ctx["f"+s]=ctx["d"+s].clone().lerp(F,c); }
    st.rootY=(legless?BR.shoulderY-0.95:BR.shoulderY)-(legless?0.15:0.95)*c; st.roll=0.18*c; st.pitch=0.2*c; st.sink=legless;
    if(c>0.95&&!ctx.dslam){ ctx.dslam=1; slamLine(bruteLocal(st,-1.0,0,0),bruteLocal(st,1.0,0,0),1.0); }
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
// a shot from the playground lands on it: lumps burst, little arms tear off, armour cracks and drops, the open body bleeds.
// pt and dir in stage coordinates; returns what it hit and the damage multiplier
LIVE.shot=(h,pt,dir)=>{ pvBind(h); const R=BR, V=THREE.Vector3; R.mesh.updateMatrixWorld(true);
  // armour first: the plates cover what's under them
  if(R.armor&&R.armor.length){ armorPrep(R); const near=R.armor.filter(a=>!a.off&&armorHome(a).distanceTo(pt)<Math.max(0.14,a.ext*0.45));
    if(near.length){ let broke=0; for(const a of near){ a.hp--; if(a.hp<=0){ broke++; armorKnock(R,a,dir.clone().multiplyScalar(1.6+Math.random()*1.4).add(new V((Math.random()-.5)*1.2,1.2+Math.random(),(Math.random()-.5)*1.2))); } }
      debris(pt,broke?8:3,0.6); dust(pt,0.4,2); return {what:broke?"armorOff":"armor", mult:broke?0.25:0.08}; } }
  for(const l of R.lumps){ if(l.burst!=null||!l.alive) continue; const p=lumpWorld(l); if(p.distanceTo(pt)<Math.max(0.1,l.r*1.25)){ l.burst=0; growthBurst(p); BS.twitch=1;
      for(const o of R.lumps) if(o!==l&&o.burst==null&&lumpWorld(o).distanceTo(p)<0.22) o.burst=0;
      const left=R.lumps.filter(o=>o.side===l.side&&o.burst==null).length; if(!left&&l.side) BS.limp[l.side]=true; return {what:"lump", mult:2.5}; } }
  for(const a of R.arms){ if(a.dead) continue; const p=a.mid.getWorldPosition(new V()); if(p.distanceTo(pt)<0.16){ a.dead=true; blood(p,18,2.4,0.07); chunks(p,dir.clone(),5); BS.twitch=1.4; return {what:"arm", mult:3.0}; } }
  for(const o of R.organs||[]){ if(o.burst!=null) continue; const p=o.b.getWorldPosition(new V()); if(p.distanceTo(pt)<0.13){ o.burst=0; growthBurst(p); blood(p,14,2,0.07); BS.twitch=1.2; return {what:"organ", mult:3.0}; } }
  blood(pt,4,1.4,0.05); BS.twitch=Math.max(BS.twitch||0,0.6); return {what:"flesh", mult:1}; };
LIVE.info=h=>{ pvBind(h); const R=BR; return {legless:!!R.legless, split:!!(R.organs&&R.organs.length), armored:!!(R.armor&&R.armor.length), lumps:R.lumps.filter(l=>l.burst==null).length}; };
// the bones its hit boxes ride on: the stumps (shoulder to fist), the torso, the man and the little arms
LIVE.hitBones=h=>{ pvBind(h); const R=BR, B=R.B, out=[]; for(const s of ["L","R"]){ for(const [a,b] of [["sh"+s,"ap"+s],["ap"+s,"wr"+s],["wr"+s,"ft"+s]]) if(B[a]&&B[b]) out.push({a:B[a],b:B[b],r:0.16,zone:"arm",limb:"stump"+s}); }
  if(B.torso) out.push({a:B.torso,b:null,r:0.55,zone:"torso",limb:"body"}); if(B.head) out.push({a:B.head,b:null,r:0.16,zone:"head",limb:"head"});
  for(const s of ["L","R"]) if(B["leg"+s]&&B["kn"+s]) out.push({a:B["leg"+s],b:B["kn"+s],r:0.09,zone:"leg",limb:"man"});
  for(const a of R.arms) out.push({a:a.base,b:a.tip,r:0.07,zone:"arm",limb:"little"});
  for(const l of R.lumps) out.push({a:l.b,b:null,r:Math.max(0.08,l.r),zone:"torso",limb:"lump"});
  for(const a of R.armor||[]) out.push({a:a.b,b:null,r:Math.max(0.1,a.ext*0.4),zone:"torso",limb:"armor"});
  return out; };

return { A, LIVE, makeChar:pvMakeChar, pvPrep, pvPost:null, pvSetup, pvBind, pvStep, pvFx, PHYS, P0, mix, PVHOOK, NX };
})();
