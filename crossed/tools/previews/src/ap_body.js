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
function wound(C,bone,off,n,kind,size){ size*=kind==="bruise"?1.25:1.3; const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshBasicMaterial({map:wtex(kind),transparent:true,depthWrite:false,opacity:kind==="bruise"?0:1,side:THREE.DoubleSide}));
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
    else { e.acc=(e.acc||0)+dt*e.rate*(1-0.5*e.t/e.dur); while(e.acc>=1){ e.acc-=1; const m=new THREE.Sprite(new THREE.SpriteMaterial({map:bloodTex,transparent:true,depthWrite:false})); m.position.copy(p); m.scale.set(0.018,0.04,1); scene.add(m); fx.push({m,t:0,life:2,o:1,v:new THREE.Vector3(0,-0.3,0),g:5,splat:0.035}); } } } }
function clearGore(){ for(const d of decals) d.m.parent&&d.m.parent.remove(d.m); decals.length=0; emit.length=0; for(const m of splats) scene.remove(m); splats.length=0; }
function chunks(p,dir,n){ for(let i=0;i<n;i++){ const m=new THREE.Mesh(new THREE.BoxGeometry(0.035,0.025,0.03),new THREE.MeshLambertMaterial({color:i%2?0x5a0a0a:0x8a2a22})); m.position.copy(p); scene.add(m);
  fx.push({m,t:0,life:1.4,v:new THREE.Vector3(dir.x*2+(Math.random()-.5)*1.5,1.2+Math.random()*1.4,dir.z*2+(Math.random()-.5)*1.5),g:9.8,spin:true,floor:true}); } }
function drip(p){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:bloodTex,transparent:true,depthWrite:false})); m.position.copy(p); m.scale.set(0.02,0.05,1); scene.add(m); fx.push({m,t:0,life:1.6,o:1,v:new THREE.Vector3(0,-0.2,0),g:3,splat:0.035}); }
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
// ---------------------------------------------------------------- locomotion physics
// The body is moved by its legs, not slid along: the stance foot is pinned to the floor (or partly, for a dragged
// foot) and the root goes wherever that puts it; the lowest point of the feet rests on the ground, so the bob comes
// from leg geometry. Landings compress the stance knee by how fast the body was dropping; the chest, head and arms
// lag behind acceleration on springs.
const GRAV_A=9.8;
function solePts(C,s){ const R=C.R, a=R["ankle"+s]; if(C.a0==null){ const g=C.group, sv=[g.position.clone(),g.rotation.y]; applyPose(C,P0()); g.position.set(0,0,0); g.rotation.set(0,0,0); g.updateMatrixWorld(true); C.a0=a.getWorldPosition(new THREE.Vector3()).y; g.position.copy(sv[0]); g.rotation.y=sv[1]; }
  return [a.localToWorld(new THREE.Vector3(0,-C.a0,-0.03)), a.localToWorld(new THREE.Vector3(0,-C.a0+0.015,0.13))]; }
function lowSole(C,s){ const [h,t]=solePts(C,s); return h.y<t.y?h:t; }
function physLoco(C,J,ctx,dt,cfg){ const P=C.pl||(C.pl={lean:{x:0,v:0},dip:{x:0,v:0},hl:{x:0,v:0},arm:{x:0,v:0},roll:{x:0,v:0},y:0,lx:ctx.x,ly:0,vx:0,vy:0,ax:0,stance:null,anchor:null});
  if(ctx.plReset){ ctx.plReset=0; Object.assign(P,{y:0,lx:ctx.x,ly:0,vx:0,vy:0,ax:0,stance:null,anchor:null}); P.lean={x:0,v:0}; P.dip={x:0,v:0}; }
  if(C.a0==null) solePts(C,"L");   // calibrate the ankle height before posing
  const st=cfg.stance(ctx);
  // springs from the motion so far: inertia
  J.sp+=P.lean.x; J.hp+=P.lean.x*0.35; J.nx+=P.hl.x; J.aLx+=P.arm.x; J.aRx+=P.arm.x; J.hroll+=P.roll.x;
  if(st){ J["k"+st]+=P.dip.x*1.3; J["l"+st+"x"]-=P.dip.x*0.45; J["f"+st]-=P.dip.x*0.4; J.sp+=P.dip.x*0.3; }
  const g=C.group; applyPose(C,J); g.position.set(ctx.x,P.y,ctx.z||0); g.rotation.set(0,ctx.yaw,0); g.updateMatrixWorld(true);
  const fwd=new THREE.Vector3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw));
  if(st){ const f=P.stance===st&&P.anchor? solePts(C,st)[P.kind] : lowSole(C,st);   // track the same point (heel or toe) frame to frame
    if(P.stance!==st||!P.anchor){ // touchdown: the body was falling; the stance leg takes it
      const k=clamp(-P.vy*1.2+Math.abs(P.vx)*0.35,0,2.2)*(cfg.imp??1); P.dip.v-=k*2.2; P.lean.v+=k*0.8; P.roll.v+=(st==="L"?1:-1)*k*(cfg.rollK??0.6);
      P.anchor=f.clone(); P.stance=st; cfg.onLand&&cfg.onLand(f,k,st); const carry=P.vx*dt*(1-0.25*Math.min(1,k)); ctx.x+=fwd.x*carry; ctx.z=(ctx.z||0)+fwd.z*carry; }   /* momentum carries through the contact frame, minus what the impact took */
    else { const slip=(cfg.slip&&cfg.slip[st])||0, d=P.anchor.clone().sub(f); let along=d.dot(fwd)*(1-slip); if(along<0 && cfg.drag&&cfg.drag[st]) along*=0.08; if(cfg.traction&&dt>0){ const vLeg=along/dt, nv=P.vx+(vLeg-P.vx)*Math.min(1,dt*cfg.traction); along=nv*dt; }   /* the body has momentum: the foot grips, but can't snap its speed instantly */ /* a dragged foot can push it on, but slides rather than pull it back */ ctx.x+=fwd.x*along; ctx.z=(ctx.z||0)+fwd.z*along;
      if(slip>0 && Math.abs(d.dot(fwd))*slip>0.004 && Math.random()<0.25) cfg.onDrag&&cfg.onDrag(f); }
  } else { if(P.stance&&cfg.flight) P.vy*=cfg.bounce??1; P.stance=null; if(cfg.flight){ ctx.x+=fwd.x*P.vx*dt; ctx.z=(ctx.z||0)+fwd.z*P.vx*dt; P.y+=(P.vy-GRAV_A*dt)*dt; } }   // airborne: momentum and gravity only
  g.position.set(ctx.x,P.y,ctx.z||0); g.updateMatrixWorld(true);
  const low=Math.min(lowSole(C,"L").y,lowSole(C,"R").y); if(st||!cfg.flight||low<0) P.y-=low; g.position.y=P.y; g.updateMatrixWorld(true);
  if(st){ const pp=solePts(C,st); P.kind=pp[0].y<pp[1].y?0:1; P.anchor=pp[P.kind].clone(); }
  // measure what that did
  const dx=((ctx.x-P.lx)*fwd.x+((ctx.z||0)-(P.lz||0))*fwd.z), vx=dt>0?dx/dt:0, vy=dt>0?(P.y-P.ly)/dt:0; P.lx=ctx.x; P.lz=ctx.z||0; P.ly=P.y;
  const ax=dt>0?(vx-P.vx)/dt:0; P.ax+=(clamp(ax,-25,25)-P.ax)*Math.min(1,dt*10); P.vx=vx; P.vy=vy; ctx.v=vx; ctx.y=P.y;
  spring(P.lean,clamp(-P.ax*0.03,-0.22,0.22),dt,cfg.leanW??7); spring(P.hl,clamp(vy*0.12-P.ax*0.02,-0.25,0.25),dt,9); spring(P.arm,clamp(-P.ax*0.06,-0.35,0.35),dt,6); spring(P.dip,0,dt,cfg.dipW??9); spring(P.roll,0,dt,6); }
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
let cueT=0; function cue(s){ const el=document.getElementById("cue"); el.textContent="♪ "+s; el.style.opacity=1; cueT=1.2; }
let dmgT=0; function dmg(a,b){ const el=document.getElementById("dmg"); el.innerHTML=`${a}<small>${b}</small>`; el.style.opacity=1; dmgT=1.8; }
let hold=0; function hitStop(s){}   /* no freeze frames: impact frames are reserved for the runner's drop kick */
let shake=0;

// ---------------------------------------------------------------- the clips. Each moves the ACROSS (ctx.x), poses it, and drives Norah (ctx.n) and a second ACROSS (ctx.b)
const NX=2.0;
function approach(t,dt,ctx,stopAt,speed=0.95){ ctx.ph=(ctx.ph||0)+dt*1.25; const C=ac; ctx.x=Math.min(stopAt,ctx.x+speed*dt*(0.6+0.8*Math.max(0,Math.sin(ctx.ph*2*Math.PI))));
  if(ctx.x>=stopAt && ctx.arr==null){ ctx.arr=t; } ctx.phase="shambles in"; return marWalk(C,ctx.ph,t,dt); }
const outcome=(id,ctx)=>{ const v=document.getElementById(id).value; if(v==="alt"){ ALT[id]=!ALT[id]; return ALT[id]?"a":"b"; } return v; }; const ALT={};
const A={};
A.marionette={ name:"Marionette walk", len:12, start(ctx){ ctx.x=-5; ctx.dir=1; ctx.ph=0; ctx.yaw=Math.PI/2; ctx.plReset=1; },
  phys:{ stance:ctx=>ctx.turn>0?null:(Math.cos(ctx.ph*2*Math.PI)>0?"R":"L"), imp:0.45, slip:{L:0.12,R:0.12}, drag:{L:1,R:1}, onLand:(f,k)=>{ if(k>0.3) dust(f,0.25+0.2*k,1); }, onDrag:f=>dust(f,0.2,1), rollK:0.3 },
  step(t,dt,ctx){ if(ctx.turn>0){ ctx.turn-=dt; ctx.yaw=ctx.yaw0+Math.PI*ss(1-ctx.turn/0.8); ctx.phase="turns"; return idleA(ac,t,dt); }
    ctx.ph+=dt*1.25; ctx.phase="toes dragging";
    if((ctx.dir>0&&ctx.x>3)||(ctx.dir<0&&ctx.x<-5)){ ctx.dir*=-1; ctx.turn=0.8; ctx.yaw0=ctx.yaw; } return marWalk(ac,ctx.ph,t,dt); } };
A.lurcher={ name:"Lurcher walk", len:14, start(ctx){ ctx.x=-5; ctx.dir=1; ctx.ph=0; ctx.yaw=Math.PI/2; ctx.steps=0; ctx.pop={x:0,v:0}; ctx.plReset=1; },
  // the good leg plants and takes the weight hard; while it swings, the body pole-vaults over the stiff leg, whose foot drags
  phys:{ stance:ctx=>ctx.turn>0?null:(Math.cos(ctx.ph*2*Math.PI)>0?"R":"L"), imp:1.2, slip:{R:0.2}, drag:{R:1}, rollK:1.0, onLand:(f,k,s)=>{ if(s==="L"){ dust(f,0.35+0.3*k,2); if(k>0.8) debris(f,2,0.5); } }, onDrag:f=>dust(f,0.25,1) },
  step(t,dt,ctx){ if(ctx.turn>0){ ctx.turn-=dt; ctx.yaw=ctx.yaw0+Math.PI*ss(1-ctx.turn/0.9); ctx.phase="turns"; return lurWalk(ac,0,t,dt,0); }
    const prev=ctx.ph; ctx.ph+=dt*0.85; if(Math.floor(ctx.ph*2)>Math.floor(prev*2)){ ctx.steps++; if(ctx.steps%3===0){ ctx.pop.v=9; cue("hip pops · click"); } }
    const pop=spring(ctx.pop,0,dt,14); ctx.phase=Math.abs(pop)>0.05?"hip pops":"lurching";
    if((ctx.dir>0&&ctx.x>3)||(ctx.dir<0&&ctx.x<-5)){ ctx.dir*=-1; ctx.turn=0.9; ctx.yaw0=ctx.yaw; } if(pop>0.5&&Math.random()<0.3) debris(footOf(ac,"L"),1,0.4); return lurWalk(ac,ctx.ph,t,dt,pop); } };

A.grab={ name:"Two-step grab", len:7.5, start(ctx){ ctx.x=NX-3.2; ctx.n={}; const f=document.getElementById("oFreeze").value; ctx.freeze = f==="always" ? (Math.random()<0.75?0.25+Math.random()*0.75:1+Math.random()) : f==="rare"&&Math.random()<0.25 ? (Math.random()<0.8?0.25+Math.random()*0.75:1+Math.random()) : 0; },
  step(t,dt,ctx){ const C=ac; if(ctx.arr==null) return approach(t,dt,ctx,NX-1.05);
    let ta=t-ctx.arr; const x0=NX-1.05;
    if(ta<0.35){ const u=ss(ta/0.35); ctx.phase="first step"; ctx.x=x0+0.33*u; const J=idleA(C,t,dt); J.lLx=-0.45*u; J.kL=0.25; J.lRx=0.25*u; J.sp=0.3+0.1*u; return J; }
    if(ta<0.47){ const u=(ta-0.35)/0.12; ctx.phase="plants · knee buckles the wrong way"; if(!ctx.c1){ ctx.c1=1; cue("knee pops"); } const J=idleA(C,t,dt,true); J.lLx=-0.45; J.kL=-0.42*Math.sin(u*Math.PI); J.lRx=0.25; J.sp=0.4; return J; }
    if(ta<0.92){ ctx.phase="dead still (the tell)"; const J=idleA(C,t,dt,true); J.lLx=-0.45; J.lRx=0.25; J.sp=0.4; J.nx=0.1; return J; }
    ta-=0.92;
    const WIDE=(u)=>{ const J=idleA(C,t,dt,true); J.lLx=-0.45+0.85*u; J.lRx=0.25-0.85*u; J.kR=0.2+0.4*Math.sin(u*Math.PI); J.kL=0.35; J.sp=0.4+0.15*u; J.hz=0.12*u; J.aLz=J.aRz=0.1+1.85*u; J.aLx=J.aRx=0.55*u; J.eL=J.eR=0.25; J.nx=0.25; return J; };
    if(ctx.freeze>0 && ta>=0.09 && ta<0.09+ctx.freeze){ ctx.phase=`frozen mid-grab (${ctx.freeze.toFixed(2)} s)`; ctx.v=0; return WIDE(0.5); }
    if(ctx.freeze>0 && ta>=0.09+ctx.freeze) ta-=ctx.freeze;
    if(ta<0.18){ const u=ss(ta/0.18); ctx.phase="second step · arms too wide"; if(!ctx.c2&&u>0.5){ ctx.c2=1; cue("shoulders click"); } ctx.x=x0+0.33+0.4*u; return WIDE(u); }
    if(ta<0.3){ const u=easeIn((ta-0.18)/0.12); ctx.phase="snaps shut"; ctx.x=x0+0.73; if(!ctx.c5&&u>0.7){ ctx.c5=1; hitStop(0.05); camPunch(0.35); shake=Math.max(shake,0.12); dust(new THREE.Vector3(ctx.x,0,0),0.6,4); } return mix(WIDE(1),hugA(t,0),u); }
    if(ta<1.8){ ctx.phase="holds her"; ctx.x=x0+0.73; ctx.qte={k:"E",fill:(ta-0.3)/1.5,txt:"BREAK FREE"}; ctx.n={J:NP.held(t)}; return hugA(t,ss((ta-0.3)/0.4)); }
    const u=ta-1.8; ctx.phase="shoved off"; if(!ctx.freed){ ctx.freed=1; dmg("BROKE FREE","it staggers back"); shake=Math.max(shake,0.05); }
    ctx.x=x0+0.73-0.6*easeOut(u/0.4); const J=idleA(C,t,dt); J.sp=-0.3*(1-ss(u/0.8)); J.nx=-0.4*(1-ss(u/0.8)); J.aLz=J.aRz=0.9*(1-ss(u/0.8))+0.1; J.lRx=0.3*(1-ss(u/0.8)); J.kR=0.3;
    ctx.n={J:u<0.5?NP.stumble():mix(NP.stumble(),NP.stand(),ss((u-0.5)/0.5)), x:NX+0.25*easeOut(u/0.3)}; return J; } };

A.swipe={ name:"Gut swipe", len:4.6, start(ctx){ ctx.x=NX-2.7; ctx.side=(ALT.side=!ALT.side)?1:-1; ctx.n={}; ctx.nx=NX; },
  step(t,dt,ctx){ const C=ac; ctx.nx+=dt*0.35; const nb=NP.backstep(t*1.1); ctx.n={J:nb, x:ctx.nx}; const stop=ctx.nx-1.05;
    if(ctx.arr==null) return approach(t,dt,ctx,stop,1.1);
    const ta=t-ctx.arr; const x0=ctx.x0??(ctx.x0=ctx.x);
    if(ta<0.3){ const u=ss(ta/0.3); ctx.phase="one step in"; ctx.x=x0+0.32*u; const J=swipeWind(t,dt,C,ctx.side,u*0.4); J.lLx=-0.35*u; J.lRx=0.25*u; return J; }
    if(ta<0.7){ ctx.phase="fingers splay and tremble"; ctx.x=x0+0.32+(ctx.nx-1.35-x0-0.32)*0; return swipeWind(t,dt,C,ctx.side,0.4+0.6*ss((ta-0.3)/0.25)); }
    if(ta<0.83){ const u=(ta-0.7)/0.13; ctx.phase="slashes · elbow bends backward"; streak(tipOf(C,ctx.side>0?"L":"R"),1.2); if(u>0.55 && !ctx.hit){ ctx.hit=t; shake=Math.max(shake,0.16); hitStop(0.07); camPunch(0.4); const p=nora.group.position.clone(); p.y=1.0; p.z+=0.12*-ctx.side; blood(p,10,1.8); dmg("NORAH −14","gut swipe · clutches her side"); cue("flesh tears");
      const sx=-ctx.side; wound(nora,"hips",new THREE.Vector3(0.07*sx,0.17,0.1),new THREE.Vector3(0.3*sx,0,1),"bruise",0.2); wound(nora,"hips",new THREE.Vector3(0.07*sx,0.17,0.105),new THREE.Vector3(0.3*sx,0,1),"cut",0.13);
      spurt(nora,"hips",new THREE.Vector3(0.07*sx,0.17,0.11),new THREE.Vector3(0.4*sx,0.2,1),0.45,50,1.6); dripFrom(nora,"hips",new THREE.Vector3(0.07*sx,0.12,0.11),5,5);
      if(ctx.side>0) handBloodL(C,0.9); else handBlood(C,0.9); dripFrom(C,ctx.side>0?"hand_L":"hand_R",new THREE.Vector3(ctx.side>0?0.08:-0.08,0,0),4,6); } return swipeStrike(C,ctx.side,u); }
    if(ctx.hit){ const k=t-ctx.hit; if(k<0.9){ const c=k<0.08?k/0.08:k<0.45?1:Math.max(0,1-(k-0.45)/0.35); ctx.n={J:NP.clutch(-ctx.side,c,nb), x:ctx.nx}; } }
    if(ta<1.1){ ctx.phase="follow-through"; return swipeStrike(C,ctx.side,1); }
    ctx.phase="recovers"; return mix(swipeStrike(C,ctx.side,1),idleA(C,t,dt),ss((ta-1.1)/0.5)); } };

A.stumble={ name:"Stumbling shoulder", len:5.2, start(ctx){ ctx.x=NX-2.9; ctx.n={}; },
  step(t,dt,ctx){ const C=ac; if(ctx.arr==null) return approach(t,dt,ctx,NX-1.5);
    const ta=t-ctx.arr, x0=NX-1.5;
    if(ta<0.3){ const u=ss(ta/0.3); ctx.phase="one step in"; ctx.x=x0+0.3*u; const J=swipeWind(t,dt,C,-1,u*0.4); J.lLx=-0.35*u; J.lRx=0.25*u; return J; }
    if(ta<0.62){ ctx.phase="winds up like a swipe…"; return swipeWind(t,dt,C,-1,0.4+0.6*ss((ta-0.3)/0.25)); }
    const tt=ta-0.62;
    const TRIP=(u)=>{ const J=swipeWind(t,dt,C,-1,1-u); J.fLz=0.75*Math.min(1,u*3); J.kL=0.35+0.55*u; J.hp=0.42*u; J.sp=0.35-0.05*u; J.nx=0.1+0.45*u; J.syaw=0.6*ss((u-0.4)/0.6); J.sroll=0.38*ss((u-0.4)/0.6); J.lRx=0.25+0.35*u; J.kR=0.3; J.aRx=0.2; J.aRz=0.25; J.hd=0.1+0.12*u; return J; };
    if(tt<0.28){ const u=tt/0.28; ctx.phase= u<0.3?"ankle folds under it":"head hits her, then the shoulder"; if(!ctx.c1){ ctx.c1=1; cue("ankle rolls"); dust(footOf(C,"L"),0.6,3); } ctx.x=x0+0.3+0.7*easeIn(u);
      if(u>0.65 && !ctx.hit){ ctx.hit=t; shake=Math.max(shake,0.22); cue("thud"); hitStop(0.08); camPunch(0.5); dust(new THREE.Vector3(NX,0,0),0.8,5); wound(nora,"chest",new THREE.Vector3(-0.06,0.2,0.1),new THREE.Vector3(0,0.2,1),"bruise",0.2); wound(nora,"upperarm_R",new THREE.Vector3(-0.08,0,0.04),new THREE.Vector3(0,0.3,1),"bruise",0.14); dmg("NORAH −10","stumbling shoulder · knocked back a step"); } return TRIP(u); }
    if(ctx.hit){ const k=t-ctx.hit; ctx.n={J:k<0.6?NP.stumble():mix(NP.stumble(),NP.stand(),ss((k-0.6)/0.5)), x:NX+0.75*easeOut(k/0.35)}; }
    if(tt<0.95){ const u=(tt-0.28); ctx.phase="legs keep scrabbling"; if(Math.random()<dt*14){ const sd=Math.random()<0.5?"L":"R"; const f=footOf(C,sd); dust(f,0.5,2); debris(f,1,0.5); } const J=TRIP(1); const f=Math.sin(u*28), g=Math.sin(u*28+1.7); J.lLx=-0.1+0.45*f; J.lRx=0.3+0.45*g; J.kL=0.6+0.4*Math.max(0,f); J.kR=0.5+0.4*Math.max(0,g); ctx.x=x0+0.95+0.2*u; return J; }
    ctx.phase="catches itself"; return mix(TRIP(1),idleA(C,t,dt),ss((tt-0.95)/0.6)); } };

// ---------------------------------------------------------------- aiming: after each frame the page measures a body part against a target on Norah,
// and the clip nudges the ACROSS (position, crouch) so the mouth or face actually arrives there instead of passing through her
function headPos(C){ const p=new THREE.Vector3(0,0.1,0.02); C.B.head.localToWorld(p); return p; }
function noraPoint(kind){ const B=nora.B, p=new THREE.Vector3();
  if(kind==="flank"){ B.hips.getWorldPosition(p); const r=new THREE.Vector3(0,0,1); p.y+=0.2; p.addScaledVector(r,0.13); p.x-=0.08; return p; }   // her right side, just above the hip
  if(kind==="face"){ B.head.getWorldPosition(p); p.y+=0.3; return p; }                                                                   // above her face, lying on her back
  if(kind==="neck"){ B.neck.getWorldPosition(p); p.y+=0.06; return p; }
  return p; }
function aimStep(ctx,dt,gain){ const e=ctx.aimErr; if(!e) return; ctx.ox=(ctx.ox||0)+e.x*Math.min(1,dt*gain); ctx.oz=(ctx.oz||0)+e.z*Math.min(1,dt*gain); ctx.oy=(ctx.oy||0)-e.y*Math.min(1,dt*gain); ctx.oy=clamp(ctx.oy,-0.25,0.45); }
// a gaping mouth for the unhinged jaw (the model has no jaw bone yet): a dark slot on the face that stretches open
function gape(C,k){ if(!C.gape){ const c=document.createElement("canvas"); c.width=32; c.height=64; const g=c.getContext("2d"); g.fillStyle="#120404"; g.beginPath(); g.ellipse(16,32,12,30,0,0,7); g.fill(); g.fillStyle="#d8ccb0"; for(let i=0;i<5;i++){ g.fillRect(6+i*4,6,2,6); g.fillRect(6+i*4,52,2,6); }
    const m=new THREE.Mesh(new THREE.PlaneGeometry(0.05,0.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false})); m.position.set(0,0.0,0.118); C.B.head.add(m); C.gape=m; }
  C.gape.visible=k>0.02; C.gape.scale.set(0.7+0.5*k,0.15+1.35*k,1); C.gape.position.y=0.02-0.03*k; }

A.bite={ name:"Bite (rare)", len:10.5, start(ctx){ ctx.x=NX-2.8; ctx.z=0; ctx.n={}; smear(ac,0); gape(ac,0); ctx.ox=ctx.oy=ctx.oz=0; },
  step(t,dt,ctx){ const C=ac; const ZS=0.32;
    if(ctx.arr==null){ const J=approach(t,dt,ctx,NX-1.2); ctx.z=ZS*sat((ctx.x-(NX-2.8))/1.6); return J; }
    const ta=t-ctx.arr, x0=NX-1.2; ctx.z=ZS+ctx.oz; const face=Math.atan2(NX-ctx.x,0.1-ctx.z); ctx.yaw=Math.PI/2+(face-Math.PI/2)*0.6;
    const HOOK=(u)=>{ const J=idleA(C,t,dt,true); J.aLz=J.aRz=0.15+0.5*u; J.aLy=J.aRy=-0.55*u; J.aLx=J.aRx=0.05-1.05*u; J.eL=J.eR=0.2+0.75*u; J.sp=0.25+0.15*u; J.lLx=-0.4*u; J.kL=0.4; J.lRx=0.3*u; J.kR=0.3; J.hd=0.06; J.nx=0.05; return J; };
    const held=()=>{ const J=NP.held(t); J.aLx=-1.0+noise(t*12,1)*0.2; J.aRx=-1.1+noise(t*13,2)*0.2; J.eL=J.eR=0.7; return J; };   // pushing at its head and shoulders
    if(ta<0.3){ const u=ss(ta/0.3); ctx.phase="stumbles in, hooks her sides"; ctx.x=x0+0.45*u; return HOOK(u); }
    ctx.x=x0+0.45+ctx.ox;
    if(ta<0.6){ const u=ss((ta-0.3)/0.3); ctx.phase="jaw unhinges"; if(!ctx.c1){ ctx.c1=1; cue("jaw cracks open"); } gape(C,u); const J=HOOK(1); J.nx=0.05-0.6*u; J.hdx=-0.35*u; ctx.n={J:held(),x:NX}; return J; }
    if(ta<0.85){ const u=ss((ta-0.6)/0.25); ctx.phase="head twists sideways"; gape(C,1); const J=HOOK(1); J.nx=-0.55; J.hdx=-0.35; J.hdz=1.2*u; ctx.n={J:held(),x:NX}; return J; }
    const BITE=(u)=>{ const J=HOOK(1); J.nx=-0.55+1.15*u; J.hdx=-0.35+0.25*u; J.hdz=1.2; J.sp=0.4+0.35*u; J.hp=0.12*u; J.hd=0.06+(0.16+ctx.oy)*u; J.ny=0.35*u; J.kL=0.4+0.35*u; J.kR=0.3+0.35*u; return J; };
    if(ta<1.15){ const u=easeIn((ta-0.85)/0.3); ctx.phase="lunges into her side"; ctx.aim={part:"mouth",target:"flank"}; aimStep(ctx,dt,10*u); ctx.n={J:held(),x:NX}; gape(C,1); return BITE(u); }
    if(ctx.bitT==null){ ctx.bitT=t; hitStop(0.15); shake=Math.max(shake,0.38); camPunch(0.6); cue("crunch"); const p=noraPoint("flank"); blood(p,24,2.2,0.08); dmg("NORAH −30","bite · a chunk torn from her side");
      wound(nora,"hips",new THREE.Vector3(-0.04,0.2,0.1),new THREE.Vector3(-0.6,0,1),"bruise",0.26); ctx.biteW=1; }
    const tb=t-ctx.bitT;
    if(tb<0.6){ ctx.phase="shakes its head to tear"; ctx.aim={part:"mouth",target:"flank"}; aimStep(ctx,dt,8); gape(C,0.6); const J=BITE(1); J.hdy=0.45*Math.sin(tb*62); J.ny+=0.2*Math.sin(tb*62+1); J.syaw=0.1*Math.sin(tb*31); J.hp+=0.05*Math.sin(tb*40);
      if(Math.random()<0.5) blood(mouthPos(C),1,1.2); ctx.n={J:NP.clutch(1,0.3,held()),x:NX}; shake=Math.max(shake,0.07); return J; }
    ctx.aim=null;
    if(!ctx.ripped){ ctx.ripped=1; const p=mouthPos(C); chunks(p,new THREE.Vector3(-1,0,-0.3),7); blood(p,16,2.4,0.07); cue("flesh rips"); smear(C,0.95);
      wound(nora,"hips",new THREE.Vector3(-0.06,0.2,0.105),new THREE.Vector3(-0.6,0,1),"bite",0.15); spurt(nora,"hips",new THREE.Vector3(-0.06,0.2,0.11),new THREE.Vector3(-0.6,0.3,1),0.9,80,2.0); dripFrom(nora,"hips",new THREE.Vector3(-0.06,0.12,0.11),7,7); }
    const tr=tb-0.6;
    // Norah: reels away doubled over, holding her stomach, then straightens a little, still holding it
    const back=easeOut(tr/0.7); const nJ=tr<0.75? mix(NP.doubled(ss(tr/0.12),t),NP.backstep(tr*1.6),0.0) : mix(NP.doubled(1,t),NP.clutch(1,1),ss((tr-0.75)/0.7));
    if(tr<0.7){ const s=Math.sin(tr*14); nJ.lLx+=0.35*s; nJ.lRx-=0.35*s; nJ.kL+=0.2*Math.max(0,-s); nJ.kR+=0.2*Math.max(0,s); }
    ctx.n={J:nJ, x:NX+1.0*back};
    if(Math.random()<dt*7) drip(mouthPos(C)); gape(C,Math.max(0,0.6-tr*1.5));
    const ox=ctx.ox; ctx.ox=ox*(1-Math.min(1,dt*2));
    if(tr<0.3){ ctx.phase="rips free"; const J=mix(BITE(1),idleA(C,t,dt,true),easeOut(tr/0.3)); J.nx-=0.5*(1-tr/0.3); return J; }
    // the slow face-wipe: forearm dragged across its mouth, head turning into it
    if(tr<1.8){ const u=ss((tr-0.3)/1.5); ctx.phase="wipes its face, slowly · left to right";
      // the back of its hand drags across its mouth from its left to its right; the blood comes away on the hand and streaks across its face
      const W=[[-1.2,0.6,-0.4,2.2],[-1.3,0.4,-0.8,2.2],[-1.8,-0.8,-0.6,1.6]], seg=u<0.5?0:1, v=ss(u<0.5?u/0.5:(u-0.5)/0.5), a=W[seg], b=W[seg+1];
      const J=idleA(C,t,dt,true); J.aRx=a[0]+(b[0]-a[0])*v; J.aRz=a[1]+(b[1]-a[1])*v; J.aRy=a[2]+(b[2]-a[2])*v; J.eR=a[3]+(b[3]-a[3])*v; J.wR=0.25; J.sp=0.12; J.nx=0.12; J.ny=0.12-0.3*u; J.hdz=0.08;
      handBlood(C,sat((u-0.15)/0.5)); smearStreak(C,u); if(u>0.3 && Math.random()<dt*10) drip(handTip(C)); return J; }
    // it lifts the hand to its eyes and stares at the gore on it, utterly still
    if(tr<2.9){ const u=ss((tr-1.8)/0.35); ctx.phase="stares at the blood on its hand"; const J=idleA(C,t,dt,true);
      J.aRx=-1.8+0.1*u; J.aRz=-0.8+0.8*u; J.aRy=-0.6; J.eR=1.6-0.4*u; J.wR=-0.35*u; J.sp=0.1; J.nx=0.12+0.15*u; J.ny=-0.18*(1-u); J.hdz=0.5*u; handBlood(C,1); if(Math.random()<dt*4) drip(handTip(C)); return J; }
    if(tr<2.98){ const u=(tr-2.9)/0.08; if(!ctx.c3){ ctx.c3=1; cue("neck snaps round"); } ctx.phase="head snaps back to her"; const J=idleA(C,t,dt,true); J.aRx=-1.7*(1-u)+0.05*u; J.aRy=-0.6*(1-u); J.eR=1.2*(1-u)+0.15*u; J.hdz=0.5*(1-u); J.nx=0.27*(1-u); return J; }
    ctx.phase="watches her"; return idleA(C,t,dt); } };

A.drag={ name:"Drag-down (very rare)", len:11.5, start(ctx){ ctx.onx=0; ctx.x=NX-2.3; ctx.z=0; ctx.n={}; ctx.out=outcome("oDrag",ctx); ctx.b={vis:false}; ctx.mash=0; ctx.ox=ctx.oy=ctx.oz=0; smear(ac,0); gape(ac,0); },
  step(t,dt,ctx){ const C=ac; if(ctx.arr==null) return approach(t,dt,ctx,NX-1.55);
    const ta0=t-ctx.arr, x0=NX-1.55, hip0=ac.R.hip0;
    // it goes down onto its face under gravity (a body folding forward at the hips: a topple), not on a timer
    const FS=ctx.fs||(ctx.fs={th:0.08,w:1.4}); if(!FS.done){ PHYS.topple(FS,dt,1.5,Math.PI/2); if(FS.done) ctx.fallExtra=ta0-0.35; }
    const ta = FS.done ? ta0-(ctx.fallExtra||0) : Math.min(0.349,ta0);
    const PRONE=(J)=>{ J.hp=1.42; J.hd=hip0-0.2; J.sp=-0.15; J.nx=-0.7; J.lLx=-0.1; J.lRx=-0.06; J.kL=0.1; J.kR=0.12; J.fL=J.fR=0.6; return J; };
    if(!FS.done){ const u=FS.th/(Math.PI/2); ctx.phase="falls at her feet"; ctx.x=x0+0.45*u; const J=idleA(C,t,dt,true); J.hp=1.42*u; J.hd=(hip0-0.2)*u; J.aLx=J.aRx=-2.5*u; J.aLz=J.aRz=0.25; J.eL=J.eR=0.2; J.nx=-0.7*u; J.kL=J.kR=0.4*(1-u); return J; }
    if(ta<0.6){ ctx.phase="hooks her shin"; ctx.x=x0+0.45; if(!ctx.c1){ ctx.c1=1; cue("thud · grip"); camPunch(0.35); shake=Math.max(shake,0.12); slamLine(new THREE.Vector3(ctx.x-0.9,0,0),new THREE.Vector3(ctx.x+0.7,0,0),0.8); } const J=PRONE(P0()); J.aRx=-2.6; J.aRz=0.15; J.eR=0.4; J.aLx=-2.2; J.aLz=0.4; J.eL=0.6; return J; }
    const tf=ta-0.6, fall=ss(tf/0.45); if(!ctx.c2 && tf>0.4){ ctx.c2=1; shake=Math.max(shake,0.26); cue("slams down"); hitStop(0.06); camPunch(0.55); slamLine(new THREE.Vector3(NX+0.1,0,0),new THREE.Vector3(NX+1.45,0,0),1); crack(new THREE.Vector3(NX+1.0,0,0),0.6); dmg("NORAH DOWN","dragged to the floor · mash to kick free"); }
    if(tf<0.45){ ctx.phase="drags her down"; ctx.x=x0+0.45; const J=PRONE(P0()); J.aRx=-2.6+1.2*fall; J.eR=0.4+1.0*fall; J.aLx=-2.2+0.8*fall; J.eL=0.6+0.6*fall;
      const nJ=NP.lie(t,fall,0.3); nJ.kL+=0.9*Math.sin(fall*Math.PI); nJ.kR+=0.8*Math.sin(fall*Math.PI); nJ.hd=0.25*Math.sin(fall*Math.PI); ctx.n={J:nJ, x:NX, fall}; return J; }
    const tc=tf-0.45;
    const pinned = tc>1.9; const rate = ctx.out==="b" ? (pinned?0.2:0.38) : (pinned?0.1:0.24); ctx.mash=Math.min(1,ctx.mash+dt*rate);
    const nJ=NP.lie(t,1,1); if(pinned) NP.pinnedArm(nJ); ctx.n={J:nJ, x:NX, fall:1};
    ctx.qte={k:"E",fill:ctx.mash,txt: pinned?"MASH · PINNED, HARDER":"MASH · KICK IT OFF"};
    // the second ACROSS slithers in low from the side and pins her right arm
    if(tc>0.7){ const u=ss((tc-0.7)/1.3); const J=PRONE(P0()); const w=Math.sin(t*6);
      J.hyaw=0.35*Math.sin(t*5); J.hroll=0.25*Math.sin(t*5+1); J.aLx=-2.2+0.7*Math.max(0,w); J.aRx=-2.2+0.7*Math.max(0,-w); J.eL=0.3+0.9*Math.max(0,w); J.eR=0.3+0.9*Math.max(0,-w); J.aLz=J.aRz=0.35; J.nx=-0.6;
      if(u>=1){ J.aRx=-1.55; J.aLx=-1.5; J.eL=J.eR=0.9; J.aLz=0.6; J.aRz=0.3; J.nx=-0.2; J.hyaw*=0.3; J.hroll*=0.3; }
      ctx.b={vis:true, J, x:NX+1.05, z:-2.4+1.95*u, yaw:0, y:0}; }
    const climbEnd=2.4, faceEnd=climbEnd+1.0;
    if(ctx.out==="b" && ctx.mash>=1 && !ctx.freeT){ ctx.freeT=t; cue("kick · thud"); dmg("KICKED FREE","it's thrown off her"); shake=Math.max(shake,0.18); camPunch(0.4); slamLine(new THREE.Vector3(ctx.x-0.6,0,0),new THREE.Vector3(ctx.x+0.3,0,0),0.7); }
    if(ctx.freeT){ const k=t-ctx.freeT; ctx.qte=null; ctx.aim=null; ctx.phase="kicked off"; const J=PRONE(P0()); J.hroll=0.9*ss(k/0.4); J.aLx=J.aRx=-1.4; J.aLz=J.aRz=0.9; ctx.x=(ctx.xf??(ctx.xf=ctx.x))-1.0*easeOut(k/0.5); ctx.y=Math.max(0,(ctx.yf??(ctx.yf=ctx.y||0))*(1-k/0.3));
      ctx.n={J: k<0.5?NP.lie(t,1,0.6):mix(NP.lie(t,1,0),NP.stand(),ss((k-0.5)/0.6)), x:NX+0.1*ss(k), fall:1-ss((k-0.5)/0.6)}; if(ctx.b.vis) ctx.b.z=Math.max(-2.4,ctx.b.z-dt*1.4); return J; }
    // it climbs her the whole way: hand over hand up her legs, hips, chest, until its face hangs over hers
    if(tc<climbEnd){ const u=tc/climbEnd; ctx.phase="fingers walk up her · slithers"; ctx.aim={part:"head",target:"face"}; if(u>0.6){ ctx.ox=(ctx.ox||0)+(ctx.aimErr?ctx.aimErr.x:0)*Math.min(1,dt*3*(u-0.6)); }
      ctx.x=x0+0.45+1.75*ss(u)+ctx.ox*ss((u-0.6)/0.4); ctx.y=0.22*ss((u-0.12)/0.5);
      const J=PRONE(P0()); const w=Math.sin(tc*7.5), w2=Math.sin(tc*7.5+Math.PI);
      J.aLx=-2.35+0.85*Math.max(0,w); J.aRx=-2.35+0.85*Math.max(0,w2); J.eL=0.25+1.1*Math.max(0,w); J.eR=0.25+1.1*Math.max(0,w2); J.wL=0.7*Math.max(0,-w); J.wR=0.7*Math.max(0,-w2); J.aLz=J.aRz=0.35;
      J.hyaw=0.3*Math.sin(tc*4.6); J.hroll=0.28*Math.sin(tc*4.6+1.2); J.syaw=-0.28*Math.sin(tc*4.6); J.nx=-0.75+0.6*ss((u-0.7)/0.3);
      if(Math.random()<dt*5){ const sd=Math.random()<0.5?"L":"R", p=tipOf(C,sd); p.y=0; dust(p,0.45,2); } return J; }
    // face to face: arms planted either side of her head, it lowers itself and studies her, head tilting
    const planted=(J)=>{ J.aLx=J.aRx=-1.45; J.aLz=J.aRz=0.55; J.eL=J.eR=1.05; J.wL=J.wR=-0.5; const o=ctx.onx||0; J.nx=-0.15+0.45*o; J.sp=-0.15+0.75*o; J.eL=J.eR=1.05+0.5*o; return J; };
    const neckAim=()=>{ const e=ctx.aimErr; if(!e) return; ctx.ox=(ctx.ox||0)+e.x*Math.min(1,dt*5); ctx.onx=clamp((ctx.onx||0)-e.y*Math.min(1,dt*6)*1.6,-0.4,1.3); };
    if(tc<faceEnd){ const u=tc-climbEnd; ctx.phase="face to face, head tilting"; ctx.aim={part:"head",target:"face"}; neckAim(); ctx.x=x0+2.2+ctx.ox; ctx.y=0.2;
      const J=planted(PRONE(P0())); J.hdz=0.5*Math.sin(u*2.2); J.hdx=0.06*Math.sin(u*40); return J; }
    const tb=tc-faceEnd; ctx.phase="bites into her"; ctx.aim=null; ctx.x=x0+2.2+ctx.ox; ctx.y=0.2;
    if(!ctx.bit){ ctx.bit=1; hitStop(0.15); shake=Math.max(shake,0.32); camPunch(0.55); cue("crunch"); dmg("NORAH −30","bitten while pinned"); blood(noraPoint("neck"),22,2,0.08); smear(C,0.95);
      wound(nora,"neck",new THREE.Vector3(0.04,0.04,0.05),new THREE.Vector3(0.4,0,1),"bite",0.09); spurt(nora,"neck",new THREE.Vector3(0.04,0.04,0.06),new THREE.Vector3(0.4,0.6,1),1.0,90,1.8); dripFrom(nora,"neck",new THREE.Vector3(0.04,0.02,0.06),6,6); }
    if(tb>1.5 && !ctx.bit2){ ctx.bit2=1; hitStop(0.1); shake=Math.max(shake,0.25); cue("crunch"); dmg("NORAH −30","bitten again"); blood(noraPoint("neck"),14,2,0.07); }
    const J=planted(PRONE(P0())); const dive=(tb<0.12)? easeIn(tb/0.12) : (tb<0.7||(tb>1.5&&tb<2.0))?1:0.35;
    J.nx+=0.5*dive; J.sp+=0.35*dive; J.hdz=0.5; J.eL+=0.35*dive; J.eR+=0.35*dive; J.hd+=0.04*dive;
    if(dive>0.9){ J.hdy=0.4*Math.sin(tb*60); if(Math.random()<0.4) blood(mouthPos(C),1,1); shake=Math.max(shake,0.05); }
    return J; } };

A.whip={ name:"Marionette whip", len:8.5, start(ctx){ ctx.x=NX-4.8; ctx.z=0; ctx.out=outcome("oWhip",ctx); ctx.n={}; ctx.nx=NX; ctx.tw=0.9; ctx.bend=0; },
  step(t,dt,ctx){ const C=ac;
    // bent all the way back into a walking bridge: hips thrust forward, spine and neck folded back toward the floor, arms raised above its head reaching down to the ground behind it
    const BENT=(k,ph,extra=0)=>{ const J=P0(); const s=Math.sin(ph*2*Math.PI), b=k*(1+extra);
      J.hz=0.24*k; J.hp=-0.34*b; J.sp=-1.38*b; J.nx=-0.95*b; J.hd=0.16*k+0.06*extra; J.kL=0.42*k+0.3*Math.max(0,s); J.kR=0.42*k+0.3*Math.max(0,-s); J.lLx=0.22*k-0.3*s; J.lRx=0.22*k+0.3*s; J.fL=J.fR=-0.12*k;
      J.aLx=-2.95*b+0.1*s; J.aRx=-2.95*b-0.1*s; J.aLz=J.aRz=0.22*k; J.eL=J.eR=0.1; J.wL=J.wR=-0.5*k; J.hroll=0.07*s; return J; };
    ctx.tw-=dt; if(ctx.tw<=0 && !ctx.whipT && t>1.5){ ctx.tw=0.5+Math.random()*0.8; ctx.jolt=1; cue("spine cracks"); }
    ctx.jolt=Math.max(0,(ctx.jolt||0)-dt*6); const J0=j=>{ j.sp-=0.22*ctx.jolt; j.nz+=0.35*ctx.jolt*(Math.random()<0.5?1:-1); j.aLx-=0.25*ctx.jolt; j.aRx-=0.2*ctx.jolt; return j; };
    if(ctx.whipT==null){
      // it bends back in four cracking stages
      if(t<1.5){ const st=Math.min(4,Math.floor(t/0.32)+1); if(st!==ctx.stage){ ctx.stage=st; ctx.jolt=1; cue("crack"); } ctx.bend+= (st/4-ctx.bend)*Math.min(1,dt*18);
        ctx.phase="bends its spine back"; return J0(mix(idleA(C,t,dt),BENT(1,0),ctx.bend)); }
      ctx.ph=(ctx.ph||0)+dt*1.15; ctx.x+=dt*1.05*(0.55+0.9*Math.max(0,Math.sin(ctx.ph*2*Math.PI))); ctx.phase="walks in, bent backwards";
      if(ctx.out==="b" && ctx.x>ctx.nx-2.7) ctx.nx+=dt*1.7;                                          // she backs off: it whips at air
      if(ctx.x>=ctx.nx-1.95){ ctx.whipT=t; }
      ctx.n={J:ctx.out==="b"?NP.backstep(t*1.3):NP.stand(), x:ctx.nx}; return J0(BENT(1,ctx.ph)); }
    const tw=t-ctx.whipT;
    // anticipation: it bends further back with one last crack, then everything whips over
    if(tw<0.2){ const u=ss(tw/0.2); if(!ctx.c9){ ctx.c9=1; cue("spine cracks · winds back"); } ctx.phase="winds back"; ctx.n={J:ctx.out==="b"?NP.backstep(t*1.3):NP.stand(), x:ctx.nx}; return BENT(1,ctx.ph||0,0.25*u); }
    const WHIP=(u)=>{ const J=P0(), a=easeIn(u);
      J.hz=0.24+0.18*a; J.hp=-0.42+0.8*a; J.sp=-1.7+2.65*a; J.nx=-1.2+1.7*a; J.hd=0.2; J.kL=0.45+0.2*a; J.kR=0.5; J.lLx=-0.15-0.25*a; J.lRx=0.25; J.fL=0;
      const arc=v=> v<0.5 ? -3.15-0.25*ss(v/0.5) : -3.4+2.25*ss((v-0.5)/0.5);                              // arms stay above its head as it whips over, then slam down in front
      J.aLx=arc(u); J.aRx=arc(Math.max(0,u-0.12)); J.aLz=J.aRz=0.15; J.eL=0.05; J.eR=0.1+0.3*a; J.wL=J.wR=-0.3*a; return J; };
    const tw2=tw-0.2;
    if(tw2<0.2){ const u=tw2/0.2; ctx.phase="whips forward"; streak(tipOf(C,"L"),1.4); streak(tipOf(C,"R"),1.4); if(u>0.78 && !ctx.hit){ ctx.hit=1; if(ctx.out!=="b"){ hitStop(0.11); shake=Math.max(shake,0.34); camPunch(0.7); cue("slap"); dmg("NORAH −20","marionette whip · knocked down"); ctx.down=t;
      wound(nora,"chest",new THREE.Vector3(0.1,0.27,0.05),new THREE.Vector3(0.3,1,0.6),"bruise",0.22); wound(nora,"head",new THREE.Vector3(0.03,0.13,0.09),new THREE.Vector3(0,0.2,1),"cut",0.06); dripFrom(nora,"head",new THREE.Vector3(0.03,0.11,0.1),5,3); blood(noraPoint("neck").setY(1.45),6,1.2,0.05); } else { cue("whoosh"); dmg("MISSED","she backed out of reach"); } }
      ctx.n={J:ctx.out==="b"?NP.backstep(t):NP.stand(), x:ctx.nx}; return WHIP(u); }
    if(ctx.down && !ctx.landed && t-ctx.down>0.42){ ctx.landed=1; cue("body hits the floor"); shake=Math.max(shake,0.2); camPunch(0.35); slamLine(new THREE.Vector3(ctx.nx+0.6,0,0),new THREE.Vector3(ctx.nx+1.9,0,0),0.9); }
    if(!ctx.down && ctx.hit && !ctx.smack && tw2>0.32){ ctx.smack=1; cue("hands smack the floor"); const a=tipOf(C,"L"), b=tipOf(C,"R"); a.y=b.y=0; dust(a,0.7,4); dust(b,0.7,4); debris(a,4,0.6); debris(b,4,0.6); ring(a.clone().lerp(b,0.5),0.7); shake=Math.max(shake,0.1); }
    if(ctx.down){ const k=t-ctx.down; const nJ=NP.stumble(); nJ.nx=-0.3; ctx.n={J:nJ, x:ctx.nx+0.7*easeOut(k/0.35), fall:PHYS.topple(ctx.nt||(ctx.nt={th:0.15,w:2.4}),dt,1.65,1.49)}; } else ctx.n={J:NP.stand(), x:ctx.nx};
    // strings cut: folds over limp, swaying, then jerks itself upright in three snaps
    const LIMP=()=>{ const J=P0(); J.sp=1.05; J.hp=0.5; J.nx=0.75; J.hd=0.3; J.kL=0.75; J.kR=0.7; J.lLx=-0.35; J.lRx=-0.2; J.aLx=J.aRx=-0.2+0.08*Math.sin(t*2.2); J.aLz=J.aRz=0.05; J.eL=J.eR=0.05; J.hroll=0.06*Math.sin(t*1.7); J.nz=0.1*Math.sin(t*1.3); return J; };
    if(tw2<0.5){ ctx.phase="strings cut"; return mix(WHIP(1),LIMP(),ss((tw2-0.2)/0.3)); }
    if(tw2<1.9){ ctx.phase="hangs limp (cooldown)"; return LIMP(); }
    const u=tw2-1.9, st=Math.min(3,Math.floor(u/0.24)+1); if(u<0.72 && st!==ctx.jerk){ ctx.jerk=st; cue("jerks upright"); }
    ctx.phase= u<0.72?"jerks upright":"recovers"; return mix(LIMP(),idleA(C,t,dt),u<0.72?st/3:1); } };

A.trip={ name:"Trip and rise", len:6.6, start(ctx){ ctx.x=NX-5.4; ctx.ph=0; ctx.tilt=0; },
  step(t,dt,ctx){ const C=ac;
    const STIFF=()=>{ const J=P0(); J.lLx=-0.02; J.lRx=0.06; J.kL=J.kR=0.02; J.aLx=J.aRx=-0.12; J.aLz=J.aRz=0.06; J.eL=J.eR=0.05; J.nx=0.05; J.sp=0.02; J.fL=J.fR=0.1; return J; };
    if(t<1.5){ ctx.ph+=dt*1.25; ctx.x+=dt*0.9*(0.6+0.8*Math.max(0,Math.sin(ctx.ph*2*Math.PI))); ctx.phase="walking"; return marWalk(C,ctx.ph,t,dt); }
    const tt=t-1.5;
    // the toe catches: one frame of a snag, then it goes over rigid, face first, no hands out
    if(tt<0.08){ ctx.phase="toe catches"; if(!ctx.c1){ ctx.c1=1; cue("scuff"); } const J=STIFF(); J.lRx=0.45; J.kR=0.25; J.fR=0.6; J.nx=-0.1; return J; }
    if(ctx.landT==null){ const S=ctx.tp||(ctx.tp={th:0.06,w:1.5}); PHYS.topple(S,dt,1.75,Math.PI/2-0.07); const u=S.th/(Math.PI/2); ctx.tilt=S.th; ctx.noBal=1;
      if(S.done) ctx.landT=tt; else { ctx.phase="falls stiff as a plank"; const J=STIFF(); J.lRx=0.45*(1-u); J.kR=0.25*(1-u); J.aLx=J.aRx=-0.12-0.25*u; return J; } }
    if(!ctx.c2){ ctx.c2=1; shake=Math.max(shake,0.22); cue("thud"); hitStop(0.07); camPunch(0.6); slamLine(new THREE.Vector3(ctx.x+0.15,0,0),new THREE.Vector3(ctx.x+1.6,0,0),1); crack(new THREE.Vector3(ctx.x+1.45,0,0),0.7); }
    const tl=tt-ctx.landT;
    if(tl<0.12){ ctx.tilt=Math.PI/2-0.07-0.06*Math.sin(tl/0.12*Math.PI); ctx.phase="hits the floor"; return STIFF(); }
    ctx.tilt=Math.PI/2-0.07;
    if(tl<0.9){ ctx.phase="lies still · a twitch"; const J=STIFF(); if(tl>0.5&&tl<0.62){ J.aRx-=0.4; J.nz=0.3; if(!ctx.c3){ ctx.c3=1; cue("twitch"); } } return J; }
    // it gets up the wrong way: arms push it into a plank, then the whole body pivots back up off its feet in one rigid piece
    if(tl<1.25){ const u=ss((tl-0.9)/0.35); ctx.phase="pushes up into a plank"; if(!ctx.c6&&u>0.2){ ctx.c6=1; dust(tipOf(ac,"L"),0.6,3); dust(tipOf(ac,"R"),0.6,3); } ctx.tilt=Math.PI/2-0.07-0.22*u; const J=STIFF(); J.aLx=J.aRx=-0.12-1.45*u; J.aLz=J.aRz=0.06+0.25*u; J.eL=J.eR=0.3*(1-u); J.nx=0.05-0.4*u; return J; }
    if(tl<1.85){ const u=(tl-1.25)/0.6, k=easeIn(Math.min(1,u*1.15)); ctx.phase="pivots upright, rigid"; if(!ctx.c4){ ctx.c4=1; cue("joints creak"); debris(tipOf(ac,"L"),3,0.5); debris(tipOf(ac,"R"),3,0.5); } ctx.tilt=(Math.PI/2-0.29)*(1-k)-0.07*Math.sin(Math.min(1,u)*Math.PI)*(u>0.8?1:0); const J=STIFF(); J.aLx=J.aRx=-1.57*(1-k)-0.12*k; J.aLz=J.aRz=0.31*(1-k)+0.06; J.nx=-0.35*(1-k)+0.4*k; return J; }
    ctx.tilt=0; ctx.noBal=0; const tr=tl-1.85;
    if(tr<0.25){ ctx.phase="settles, head hanging"; const J=STIFF(); J.nx=0.55; J.nz=0.25; J.sp=0.1; return J; }
    if(tr<0.33){ ctx.phase="head snaps up"; if(!ctx.c5){ ctx.c5=1; cue("neck cracks"); } const J=STIFF(); J.nx=0.55*(1-(tr-0.25)/0.08); return J; }
    ctx.ph+=dt*1.25; ctx.x+=dt*0.9*(0.6+0.8*Math.max(0,Math.sin(ctx.ph*2*Math.PI))); ctx.phase="walks on"; return mix(STIFF(),marWalk(C,ctx.ph,t,dt),ss((tr-0.33)/0.4)); } };
A.shot={ name:"Shot: bullet wounds", len:7.2, start(ctx){ ctx.x=NX-6.2; ctx.ph=0; ctx.tilt=0; ctx.n={}; ctx.k=0; ctx.lurch=false; ctx.pop={x:0,v:0}; },
  step(t,dt,ctx){ const C=ac;
    // Norah aims both-handed and fires; the revolver kicks
    const AIM=(r)=>{ const J=NP.stand(); J.aLx=-1.45-0.35*r; J.aRx=-1.5-0.4*r; J.aLz=-0.25; J.aRz=-0.05; J.eL=0.35; J.eR=0.15; J.sp=-0.06*r; J.nx=0.02; J.lLx=-0.2; J.lRx=0.2; J.kL=0.12; J.kR=0.08; return J; };
    if(!nora.gun){ const g=new THREE.Mesh(new THREE.BoxGeometry(0.2,0.05,0.035),new THREE.MeshLambertMaterial({color:0x222222})); g.position.set(-0.14,0.02,0); nora.B.hand_R.add(g); nora.gun=g; } nora.gun.visible=true;
    const SH=[[1.1,"torso"],[2.1,"arm"],[3.1,"leg"],[4.4,"head"]];
    const nxt=SH[ctx.k]; let rec=0; if(ctx.lastShot!=null) rec=Math.max(0,1-(t-ctx.lastShot)/0.18);
    ctx.n={J:AIM(rec),x:NX};
    if(nxt && t>=nxt[0]){ ctx.k++; ctx.lastShot=t; const z=nxt[1]; cue("gunshot"); hitStop(0.05); camPunch(0.25); shake=Math.max(shake,0.12);
      const mz=new THREE.Vector3(); nora.gun.localToWorld(mz.set(-0.12,0,0)); const fl=new THREE.Sprite(new THREE.SpriteMaterial({map:streakTex,color:0xffd090,transparent:true,depthWrite:false})); fl.position.copy(mz); fl.scale.setScalar(0.35); scene.add(fl); fx.push({m:fl,t:0,life:0.06,o:1,v:new THREE.Vector3(),g:0});
      const b=new THREE.Vector3(-1,0,0);   // the bullet travels from her toward it (−x)
      const W={torso:["chest",new THREE.Vector3(0.03,0.16,0.09),new THREE.Vector3(0,0,1),0.07],arm:["upperarm_L",new THREE.Vector3(0.12,0,0.035),new THREE.Vector3(0,0.2,1),0.05],leg:["thigh_R",new THREE.Vector3(0,-0.2,0.06),new THREE.Vector3(0,0,1),0.06],head:["head",new THREE.Vector3(0.02,0.09,0.1),new THREE.Vector3(0,0,1),0.05]}[z];
      wound(C,W[0],W[1],W[2],"bruise",W[3]*3); wound(C,W[0],W[1].clone().multiplyScalar(1.02),W[2],"bullet",W[3]);
      spurt(C,W[0],W[1].clone().multiplyScalar(1.05),W[2].clone().add(new THREE.Vector3(0,0.3,0)),z==="head"?0.9:0.55,z==="head"?110:70,1.8);
      dripFrom(C,W[0],W[1].clone().add(new THREE.Vector3(0,-0.03,0)),9,z==="arm"?6:4);
      const p=W[1].clone(); C.B[W[0]].localToWorld(p); const back=p.clone().addScaledVector(b,0.12); for(let i=0;i<10;i++){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:bloodTex,transparent:true,depthWrite:false})); m.position.copy(back); m.scale.setScalar(0.05+Math.random()*0.05); scene.add(m);
        fx.push({m,t:0,life:1.2,o:0.9,v:b.clone().multiplyScalar(2.5+Math.random()*2).add(new THREE.Vector3(0,Math.random()*0.8,(Math.random()-.5)*1.2)),g:9.8,splat:0.08}); }   // exit mist out the back
      ctx.fl={z,t}; if(z==="leg"){ ctx.lurch=true; } if(z==="head"){ ctx.dead=t; } }
    // flinch per zone, then it keeps coming (worse) until the head shot
    const fk = ctx.fl ? Math.max(0,1-(t-ctx.fl.t)/0.35) : 0;
    if(ctx.dead!=null){ const u=(t-ctx.dead); ctx.phase="head shot · drops stiff"; const S=ctx.dp||(ctx.dp={th:0.05,w:1.1}); PHYS.topple(S,dt,1.75,Math.PI/2-0.08); ctx.tilt=-S.th; if(S.done&&!ctx.c9){ ctx.c9=1; cue("body hits the floor"); shake=Math.max(shake,0.2); camPunch(0.3); slamLine(new THREE.Vector3(ctx.x,0,0),new THREE.Vector3(ctx.x-1.5,0,0),0.9); }
      const J=P0(); J.nx=-0.5*Math.min(1,u*6); J.aLx=J.aRx=-0.3; J.aLz=J.aRz=0.3; return J; }
    ctx.ph+=dt*(ctx.lurch?0.85:1.25); const pace=ctx.lurch?0.6*(0.35+1.1*Math.max(0,Math.sin(ctx.ph*2*Math.PI))):0.9*(0.6+0.8*Math.max(0,Math.sin(ctx.ph*2*Math.PI))); ctx.x+=dt*pace*(1-fk*0.9); ctx.phase= ctx.fl?`hit · ${ctx.fl.z}`:"walks into her aim";
    const J= ctx.lurch ? lurWalk(C,ctx.ph,t,dt,0) : marWalk(C,ctx.ph,t,dt);
    if(ctx.fl && fk>0){ const z=ctx.fl.z; if(z==="torso"){ J.sp-=0.55*fk; J.hp-=0.2*fk; J.nx-=0.4*fk; } else if(z==="arm"){ J.aLx+=1.4*fk; J.aLz+=0.6*fk; J.syaw+=0.5*fk; } else if(z==="leg"){ J.kR+=1.0*fk; J.hd+=0.12*fk; J.hroll-=0.25*fk; } }
    if(ctx.k>=2) J.aLx=Math.max(J.aLx,0.05)+0.05*Math.sin(t*3);            // the shot arm hangs
    return J; } };
const ORDER=["marionette","lurcher","grab","swipe","stumble","bite","drag","whip","trip","shot"];

// ---------------------------------------------------------------- run it
const loader=new THREE.GLTFLoader(); const cache={};
const load=k=>cache[k]||(cache[k]=new Promise((res,rej)=>loader.load(k,res,undefined,rej)));
let ac=null, ac2=null, nora=null, cur="grab", t=0, ctx={}, camMode="side", slow=false, playAll=false;
const orbit={yaw:0.9,pitch:0.18,drag:null};
async function setModel(key){ document.getElementById("load").hidden=false;
  const [g,g2]=await Promise.all([load(`m/across/${key}.json`),load(`m/across/${key.includes("f")?"men/across_v05":"women/across_v04f"}.json`)]);
  for(const c of [ac,ac2]) if(c){ scene.remove(c.group); scene.remove(c.shadow); }
  ac=makeChar(g); ac2=makeChar(g2); document.getElementById("load").hidden=true; start(cur); }
function start(a){ if(nora&&nora.gun) nora.gun.visible=false; for(const c of [ac,ac2,nora]) if(c) c.gs=null; cur=a; t=0; ctx={x:0,yaw:Math.PI/2,v:0,y:0,tilt:0}; for(const q of fx) scene.remove(q.m); fx.length=0; clearGore(); if(ac){ ac.hb=null; ac.hbL=null; ac.smear=null; ac.gape=null; } if(ac) smear(ac,0); if(ac) gape(ac,0); A[a].start(ctx);
  for(const b of document.querySelectorAll(".anim")) b.setAttribute("aria-pressed",String(b.dataset.a===a)); document.getElementById("hName").textContent=A[a].name;
  document.getElementById("qte").hidden=true; document.getElementById("dmg").style.opacity=0; }
function poseNorah(){ const n=ctx.n||{}; const J=n.J||NP.stand(); applyPose(nora,J); nora.group.position.set(n.x??NX,0,0); nora.group.rotation.set(0,-Math.PI/2,0); if(n.fall) nora.group.rotateX(-n.fall*Math.PI/2); retarget(nora); }
function frame(dtReal){
  if(!ac||!nora) return;
  if(hold>0){ hold-=Math.min(0.05,dtReal); renderer.render(scene,cam); return; }
  const dt=Math.min(0.05,dtReal)*(slow?0.25:1); t+=dt; ctx.qte=null; ctx.aim=null;
  const J=A[cur].step(t,dt,ctx); if(A[cur].phys) physLoco(ac,J,ctx,dt,A[cur].phys); else applyPose(ac,J); ac.group.position.set(ctx.x,ctx.y||0,ctx.z||0); ac.group.rotation.set(0,ctx.yaw,0); if(ctx.tilt) ac.group.rotateX(ctx.tilt); retarget(ac);
  PHYS.rig(ac,dt,{balance:!A[cur].phys&&!ctx.tilt&&!ctx.noBal,kick:ctx.kick});   // gravity, the floor, ballistic flight, balance
  const b=ctx.b; ac2.group.visible=ac2.shadow.visible=!!(b&&b.vis); if(b&&b.vis){ applyPose(ac2,b.J); ac2.group.position.set(b.x,b.y||0,b.z); ac2.group.rotation.set(0,b.yaw,0); retarget(ac2); }
  const showN = cur!=="marionette" && cur!=="lurcher" && cur!=="trip"; nora.group.visible=nora.shadow.visible=showN; if(showN){ poseNorah(); const n=ctx.n||{}; PHYS.rig(nora,dt,{held:n.held,balance:!n.fall&&!n.noBal,kick:n.kick}); }
  if(ctx.aim){ ac.group.updateMatrixWorld(true); const m=ctx.aim.part==="head"?headPos(ac):mouthPos(ac), tg=noraPoint(ctx.aim.target); ctx.aimErr={x:tg.x-m.x,y:tg.y-m.y,z:tg.z-m.z}; } else ctx.aimErr=null;
  stepFx(dt); stepGore(dt); footDust(ac,dt); if(ac2&&ac2.group.visible) footDust(ac2,dt); if(nora.group.visible) footDust(nora,dt);
  const q=document.getElementById("qte"); if(ctx.qte){ q.hidden=false; document.getElementById("qteBar").style.width=`${Math.round(sat(ctx.qte.fill)*100)}%`; document.getElementById("qteTxt").textContent=ctx.qte.txt; } else q.hidden=true;
  if(dmgT>0){ dmgT-=dt; if(dmgT<=0) document.getElementById("dmg").style.opacity=0; } if(cueT>0){ cueT-=dt; if(cueT<=0) document.getElementById("cue").style.opacity=0; }
  document.getElementById("hPh").textContent=ctx.phase||"—";
  if(t>A[cur].len){ if(playAll) start(ORDER[(ORDER.indexOf(cur)+1)%ORDER.length]); else start(cur); }
  const rp=ac.group.position, fxx = camMode==="follow"? rp.x : showN ? (rp.x+(ctx.n&&ctx.n.x!=null?ctx.n.x:NX))/2-(cur==="whip"?0.5:0) : clamp(rp.x,-4,2);
  const gap=showN?Math.abs(rp.x-(ctx.n&&ctx.n.x!=null?ctx.n.x:NX)):0;
  let p; if(camMode==="side") p=new THREE.Vector3(fxx,1.25,cur==="drag"?4.6:Math.max(5.2,gap*1.15+2.2)); else if(camMode==="front") p=new THREE.Vector3(fxx+4.6,1.3,0.6);
  else if(camMode==="top") p=new THREE.Vector3(fxx+0.01,5.2,1.0); else if(camMode==="follow") p=new THREE.Vector3(rp.x-3.2,1.6,2.4);
  else p=new THREE.Vector3(fxx+Math.sin(orbit.yaw)*5.6*Math.cos(orbit.pitch),1.0+Math.sin(orbit.pitch)*5.6,Math.cos(orbit.yaw)*5.6*Math.cos(orbit.pitch));
  shake=Math.max(0,shake-dtReal*0.5); p.x+=(Math.random()-.5)*shake; p.y+=(Math.random()-.5)*shake;
  punch=Math.max(0,punch-dtReal*3.5); const fov=36-7*punch; if(Math.abs(cam.fov-fov)>0.01){ cam.fov=fov; cam.updateProjectionMatrix(); }
  cam.position.lerp(p,camMode==="follow"?0.2:1); cam.lookAt(fxx, cur==="drag"?0.5:0.95, 0);
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
(async()=>{ try{ const ng=await load("m/cast/norah.json"); nora=makeChar(ng); await setModel("men/across_v01"); requestAnimationFrame(loop); }
  catch(e){ document.getElementById("load").textContent="Couldn't load the models: "+(e&&e.message||e); } })();
window.__ap={start,get ctx(){return ctx;},get t(){return t;},frame,cam,renderer,scene,get ac(){return ac;},get nora(){return nora;},get hold(){return hold;}};
