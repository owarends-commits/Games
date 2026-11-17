// ================================================================ NORAH (the player)
// Scared but steadying: never trained, she shakes, flinches at her own shots and hunches, but once the gun is up and held
// the tremor settles. The flashlight rides under the revolver (wrists crossed, the light hand bracing the gun hand) so the
// beam follows her aim. The revolver and flashlight are built from the game's own item data. The flashlight is a real
// light. An ACROSS stands in as the target and the attacker.
const sm5=x=>{ x=sat(x); return x*x*x*(x*(x*6-15)+10); };
const V3=THREE.Vector3, UP=new V3(0,1,0), QI=()=>new THREE.Quaternion(); SLOUCH.s=0; SLOUCH.h=0;
const TP=()=>({fwd:new V3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw)), right:new V3(-Math.cos(ctx.yaw),0,Math.sin(ctx.yaw))});
const KIND=()=>"pl", fin=J=>applyLean(J);
let altK={}; const outcome=(id,a,b)=>{ const v=document.getElementById(id).value; if(v==="alt"){ altK[id]=!altK[id]; return altK[id]?a:b; } return v; };
const HIP0=()=>runner.R.hip0;
function gaitOn(ctx,dt,T,P,dir=1){ const prev=ctx.ph; ctx.ph=((ctx.ph+dir*dt/T)%1+1)%1; ctx.moving=true; ctx.gait={ph:ctx.ph,P}; }
const GP=P=>({ active:ctx=>!!ctx.gait, stance:ctx=>strideStance(ctx.ph,ctx.gait?ctx.gait.P:P), traction:9, imp:0.6, rollK:0.4 });
// human gaits (not the creatures'): heel to toe, a little knee bend in stance, the same numbers drive the stance clock so
// the planted foot stays put
const NWALK={stance:0.62,front:-0.36,back:0.26,high:-0.46,kStance:0.16,kImpact:0.06,kLift:1.05,liftEnd:0.58};
const HRUN={stance:0.38,front:-0.62,back:0.45,high:-0.95,kStance:0.5,kImpact:0.1,kLift:1.85,liftEnd:0.55};
const HSTEP={stance:0.55,front:-0.16,back:0.1,high:-0.38,kStance:0.08,kImpact:0.03,kLift:0.75,liftEnd:0.55};
// legs from the stride clock; the pelvis turns a little with the swinging leg and drops a little on its side, the shoulders
// counter it, the head stays on its line
function hLegs(ph,J,P=NWALK,k=1){ const a=stride(ph,P), b=stride((ph+0.5)%1,P), s=Math.sin(ph*Math.PI*2), c=Math.cos(ph*Math.PI*2);
  J.lLx=a.lx; J.kL=a.k; J.fL=a.f; J.lRx=b.lx; J.kR=b.k; J.fR=b.f;
  J.hyaw+=0.07*s*k; J.syaw-=0.06*s*k; J.ny+=0.04*s*k; J.hroll+=0.035*c*k; J.sroll-=0.02*c*k; return J; }
function hRun(ph,t){ const J=hLegs(ph,P0(),HRUN,1.6), s=Math.sin(ph*Math.PI*2); J.hp=0.1; J.sp=0.2; J.nx=-0.08; J.hd=0.04;
  J.aLx=-0.3+0.55*s; J.aRx=-0.3-0.55*s; J.eL=1.35+0.2*Math.max(0,s); J.eR=1.3+0.2*Math.max(0,-s); J.aLz=0.12; J.aRz=0.1; return J; }
const NCROUCH={stance:0.64,front:-0.3,back:0.28,high:-0.6,kStance:0.04,kImpact:0.06,kLift:0.7,liftEnd:0.55};
const WPHYS=GP(NWALK), RPHYS={ active:ctx=>!!ctx.gait, stance:ctx=>strideStance(ctx.ph,HRUN), flight:true, bounce:0.45, traction:10, imp:0.9, rollK:0.3, leanW:9 }, CPHYS=GP(NCROUCH);

// ---------------------------------------------------------------- the props, from the game's item data
// (a part: shape s, centre p, size d, rotation r in degrees, colour c; barrels and lenses point along −x)
const ITEMS=__ITEMS__;
function buildItem(key){ const g=new THREE.Group(), parts={};
  for(const p of ITEMS[key]){ let geo;
    if(p.s==="cyl") geo=new THREE.CylinderGeometry(0.5,0.5,1,p.seg||10); else if(p.s==="cone") geo=new THREE.CylinderGeometry(0.33,0.5,1,p.seg||10);
    else if(p.s==="torus") geo=new THREE.TorusGeometry(0.4,0.1,6,p.seg||12); else geo=new THREE.BoxGeometry(1,1,1);
    const m=new THREE.Mesh(geo,new THREE.MeshLambertMaterial({color:new THREE.Color(p.c)})); m.scale.set(...p.d.map(x=>Math.max(1e-4,x))); m.rotation.set(...p.r.map(x=>x*Math.PI/180),"XYZ"); m.position.set(...p.p);
    g.add(m); parts[p.name]=m; m.userData.rest={p:m.position.clone(),q:m.quaternion.clone()}; }
  g.userData.parts=parts; return g; }
let GUN=null, LIGHT=null, SPOT=null, FLASH=null;
// the revolver's working parts: the hammer and trigger on their pins, the cylinder on its crane (it swings out to the
// left), five chambers each with a round (a bullet nose at the front, a brass case at the back), the ejector rod and star
function rigRevolver(g){ const pr=g.userData.parts, R={}, piv=(part,at)=>{ const o=new THREE.Group(); o.position.copy(at); g.add(o); const m=pr[part]; m.position.sub(at); o.add(m); return o; };
  R.hammer=piv("Hammer",new V3(0.046,0.018,0)); R.trigger=piv("Trigger",new V3(0.016,-0.007,0));
  R.crane=new THREE.Group(); R.crane.position.set(-0.006,-0.005,0.01); g.add(R.crane);
  R.cylG=new THREE.Group(); R.cylG.position.set(0,0.014,-0.01); R.crane.add(R.cylG);
  const cyl=pr.Cylinder; g.remove(cyl); cyl.position.set(0,0,0); R.cylG.add(cyl);
  R.ch=[]; for(let i=0;i<5;i++){ const a=i/5*Math.PI*2, y=0.0105*Math.cos(a), z=0.0105*Math.sin(a);
    const mouth=new THREE.Mesh(new THREE.CylinderGeometry(0.0046,0.0046,0.0015,8),new THREE.MeshBasicMaterial({color:0x070707})); mouth.rotation.z=Math.PI/2; mouth.position.set(-0.0193,y,z);
    const nose=new THREE.Mesh(new THREE.SphereGeometry(0.0041,8,6),new THREE.MeshLambertMaterial({color:0x8c8c92})); nose.scale.set(0.6,1,1); nose.position.set(-0.0185,y,z);
    const cas=new THREE.Mesh(new THREE.CylinderGeometry(0.0053,0.0053,0.003,10),new THREE.MeshLambertMaterial({color:0xb48c3c})); cas.rotation.z=Math.PI/2; cas.position.set(0.0196,y,z);
    const pri=new THREE.Mesh(new THREE.CylinderGeometry(0.0018,0.0018,0.001,8),new THREE.MeshLambertMaterial({color:0x9a7a50})); pri.rotation.z=Math.PI/2; pri.position.set(0.0213,y,z);
    R.cylG.add(mouth,nose,cas,pri); R.ch.push({nose,cas,pri}); }
  const steel=new THREE.MeshLambertMaterial({color:0x4a4e56});
  R.star=new THREE.Mesh(new THREE.CylinderGeometry(0.0125,0.0125,0.0015,10),steel); R.star.rotation.z=Math.PI/2; R.star.position.set(0.0186,0.014,-0.01); R.crane.add(R.star); R.star0=R.star.position.x;
  R.rod=new THREE.Mesh(new THREE.CylinderGeometry(0.0022,0.0022,0.034,8),steel); R.rod.rotation.z=Math.PI/2; R.rod.position.set(-0.036,0.014,-0.01); R.crane.add(R.rod); R.rod0=R.rod.position.x;
  g.userData.rv=R; }
// double action: pulling the trigger cocks the hammer and turns the cylinder a fifth of a turn; at the end of the pull the
// hammer drops. Each pull starts 0.16 s before its shot.
function gunCycle(t,times){ let trig=0,cock=0,n=0,turn=0; for(const s of times){ if(t>=s){ n++; trig=Math.max(trig,sat(1-(t-s-0.05)/0.12)); } else if(t>s-0.16){ const u=sm5((t-s+0.16)/0.16); trig=Math.max(trig,u); cock=u; turn=u; } } return {trig,cock,cylA:(n+turn)*Math.PI*2/5,n}; }
const LIVE5=["live","live","live","live","live"];
function ensureProps(){ if(GUN) return; GUN=buildItem("revolver"); rigRevolver(GUN); LIGHT=buildItem("flashlight"); scene.add(GUN,LIGHT);
  SPOT=new THREE.SpotLight(0xfff0c8,4.0,16,0.3,0.45,1.0); SPOT.position.set(-0.122,0,0); const tg=new THREE.Object3D(); tg.position.set(-1.2,0,0); LIGHT.add(SPOT,tg); SPOT.target=tg;
  LIGHT.userData.parts.Lens.material=new THREE.MeshBasicMaterial({color:0xfff6d8});
  FLASH=new THREE.PointLight(0xffc46a,0,6,2); scene.add(FLASH); }
const GRIP=new V3(0.062,-0.038,0), MUZZLE=new V3(-0.125,0.017,0), LGRIP=new V3(0.0,0,0);
// set a prop so its local point 'loc' sits at world 'at', its −x along f, its +y toward u
function setProp(o,loc,at,f,u){ const X=f.clone().normalize().negate(), Y=u.clone().addScaledVector(X,-u.dot(X)); if(Y.lengthSq()<1e-6) Y.set(0,1,0).addScaledVector(X,-X.y); Y.normalize(); const Zv=new V3().crossVectors(X,Y);
  o.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(X,Y,Zv)); o.position.copy(at).sub(loc.clone().applyQuaternion(o.quaternion)); o.updateMatrixWorld(true); }
const palm=s=>{ const b=runner.B["hand_"+s], p=b.getWorldPosition(new V3()), d=runner.ax["hand_"+s].clone().applyQuaternion(b.getWorldQuaternion(QI())); return {p:p.clone().addScaledVector(d,0.075), d}; };
const eyeAt=()=>{ runner.group.updateMatrixWorld(true); return runner.R.head.localToWorld(new V3(0,0.09,0.07)); };

// ---------------------------------------------------------------- her hands: the two-handed hold, by reach (IK)
// aim: 0..1 into the hold. The point she aims at, plus the tremor (amp, settling while she holds still) and the recoil kick.
function holdPost(ctx,H){ const P=TP(); if(!H||!(H.aim>0)) return; runner.group.updateMatrixWorld(true);
  const E=eyeAt(), T=H.at||E.clone().addScaledVector(P.fwd,5); let f=T.clone().sub(E).normalize();
  { const fh=f.clone().setY(0).normalize(), a=Math.atan2(new V3().crossVectors(P.fwd,fh).y,P.fwd.dot(fh)), lim=1.2; if(Math.abs(a)>lim){ const y=f.y; f=P.fwd.clone().applyAxisAngle(UP,Math.sign(a)*lim).multiplyScalar(Math.sqrt(Math.max(0,1-y*y))).setY(y).normalize(); } }   /* never further round than her arms can go */
  const side=new V3().crossVectors(f,UP).normalize(), up=new V3().crossVectors(side,f).normalize();
  if(H.kick) f.applyAxisAngle(side,H.kick).normalize();
  const amp=H.amp??0.01, tt=t*1.0, sway=side.clone().multiplyScalar(amp*noise(tt*3.1,1)).addScaledVector(up,amp*0.8*noise(tt*2.7,5));
  const AP=E.clone().addScaledVector(f,0.46-(H.back||0)).addScaledVector(up,-0.1).add(sway);
  const TR=AP.clone(), TL=AP.clone().addScaledVector(up,-0.062).addScaledVector(f,-0.02).addScaledVector(side,-0.012);
  const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
  armIK(runner,{side:"R",target:TR,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(side,0.15).addScaledVector(f,-0.1),w:H.aim,tip:0.075});
  armIK(runner,{side:"L",target:TL,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(side,-0.15).addScaledVector(f,-0.1),w:H.aim,tip:0.075});
  ctx.aimF=f; ctx.aimU=up; }
// after the rig: the revolver in her right hand, the flashlight in her left (or wherever it is)
function propsPost(ctx,H){ ensureProps(); const P=TP(); H=H||{}; runner.group.updateMatrixWorld(true);
  const R=palm("R"), L=palm("L"), f=ctx.aimF||P.fwd, w=sat(H.aim||0);
  if(H.gun!=="gone"){ GUN.visible=true; const low=R.d.clone().multiplyScalar(0.55).add(P.fwd.clone().multiplyScalar(0.8)).normalize(), gf=(H.gunF||low.lerp(f,w)).normalize(), gu=H.gunU||UP.clone().lerp(ctx.aimU||UP,w);
    setProp(GUN,GRIP,R.p,gf,gu); } else GUN.visible=false;
  if(H.light!=="gone"){ LIGHT.visible=true; let lf, at;
    if(H.light==="tuck"){ const c=runner.B.chest.getWorldPosition(new V3()); at=c.addScaledVector(P.right,-0.17).addScaledVector(P.fwd,0.02).add(new V3(0,0.06,0)); lf=P.fwd.clone().add(new V3(0,-0.25,0)); }
    else { at=L.p; const sweep=H.sweep||0, ahead=P.fwd.clone().addScaledVector(P.right,sweep).add(new V3(0,-0.38,0)).normalize(); lf=(H.lightF||ahead.lerp(f,w)).normalize(); }
    setProp(LIGHT,LGRIP,at,lf,UP); } else LIGHT.visible=false;
  // the gun's moving parts
  const RV=GUN.userData.rv, ej=H.eject||0; RV.hammer.rotation.z=-0.75*(H.cock||0); RV.trigger.rotation.z=0.45*(H.trig||0);
  RV.crane.rotation.x=1.75*(H.crane||0); RV.cylG.rotation.x=H.cylA||0; RV.star.position.x=RV.star0+0.016*ej; RV.rod.position.x=RV.rod0+0.016*ej;
  (H.ch||LIVE5).forEach((st,i)=>{ const c=RV.ch[i]; c.nose.visible=st==="live"; c.cas.visible=c.pri.visible=st!=="empty"; c.cas.position.x=0.0196+0.016*ej; c.pri.position.x=0.0213+0.016*ej; c.pri.material.color.set(st==="spent"?0x2a2018:0x9a7a50); });
  // the flashlight: its switch, and whether it's on
  const on=H.lightOn??1, sw=LIGHT.userData.parts.Switch; sw.position.y=sw.userData.rest.p.y-0.0028*(H.press||0); SPOT.intensity=4*on; LIGHT.userData.parts.Lens.material.color.setRGB(0.25+0.75*on,0.24+0.72*on,0.2+0.65*on);
  if(FLASH) FLASH.intensity*=0.55; }
function muzzleAt(){ GUN.updateMatrixWorld(true); return GUN.localToWorld(MUZZLE.clone()); }
function fireFx(){ const m=muzzleAt(); const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xffd27a,transparent:true,depthWrite:false})); s.position.copy(m); s.scale.setScalar(0.3); scene.add(s); puffs.push({m:s,t:0.4,v:new V3(),s:0.55}); FLASH.position.copy(m); FLASH.intensity=5; }

// ---------------------------------------------------------------- her body
// stood braced and breathing hard; f = how scared (1 jumpy .. 0 settled)
function nStand(t,f=1){ const J=P0(), br=Math.sin(t*2*Math.PI/(1.6-0.5*f)), sh=Math.sin(t*0.35);   /* breathing; a slow shift of weight from foot to foot */
  J.hd=0.015+0.02*f; J.kL=0.08+0.06*f+0.05*Math.max(0,sh); J.kR=0.1+0.06*f+0.05*Math.max(0,-sh); J.lLx=-0.08; J.lRx=0.06; J.lLz=0.06; J.lRz=0.07; J.hroll=0.025*sh; J.sroll=-0.015*sh;
  J.sp=0.08+0.08*f+0.018*br; J.nx=0.04-0.012*br; J.hp=0.03;
  // low ready: the gun arm loosely down and forward, the light arm bent so the beam is ahead of her
  J.aRx=-0.38; J.eR=0.45; J.aRz=0.06; J.aLx=-0.42; J.eL=1.05; J.aLz=0.08+0.01*br; J.aRz+=0.01*br; return J; }
// looking about: sharp turns of the head, the body half following
function look(J,dt,ctx,k=1){ const L=ctx.look||(ctx.look={x:0,v:0,to:0,T:0.9,c:{x:0,v:0}}); L.T-=dt; if(L.T<=0){ L.to=clamp(-0.4*L.to+(Math.random()*2-1)*0.75*k,-0.8*k,0.8*k); L.T=1.1+Math.random()*1.4; }
  const h=spring(L,L.to,dt,7.5), b=spring(L.c,h,dt,3.2); J.ny+=0.75*h-0.15*b; J.nz-=0.04*h; J.syaw+=0.22*b; J.hyaw+=0.06*b; return h; }
// the aimed stance: square to the target, left foot forward, head down to the sights
function nAim(t,f=0.5){ const J=nStand(t,f); J.lLx=-0.3; J.lRx=0.2; J.kL=0.3; J.kR=0.22; J.sp=0.2+0.05*f; J.syaw=0.05; J.nx=0.16; J.hp=0.08; return J; }
const NG={ lie(t,k){ const J=P0(), n=s=>noise(t*9,s)*0.08*k; J.hd=HIP0()-0.13; J.hp=-1.5; J.sp=-0.05+n(1); J.nx=0.25+n(2); J.lLx=0.05+n(3); J.lRx=-0.05+n(4); J.kL=0.15+Math.abs(n(5)); J.kR=0.1+Math.abs(n(6));
    J.aLx=-1.05+n(7); J.aRx=-0.95+n(8); J.aLz=0.95; J.aRz=0.9; J.eL=0.55+n(9); J.eR=0.65+n(10); return J; },   /* arms out on the floor beside her */
  sit(){ const J=P0(); J.hd=HIP0()-0.14; J.hp=-0.25; J.sp=0.25; J.nx=0.1; J.lLx=-2.25; J.lRx=-1.95; J.kL=2.25; J.kR=1.85; J.fL=0.3; J.fR=0.2; J.aLx=0.7; J.aRx=0.7; J.aLz=J.aRz=0.25; J.eL=J.eR=0.2; return J; },
  knee(){ const J=NP.kneel(0); J.aLx=-0.6; J.aRx=-0.3; J.aLz=0.3; J.aRz=0.2; J.eL=0.6; J.eR=0.5; return J; },
  crouch(){ const J=P0(); J.hd=0.42; J.hp=0.55; J.sp=0.35; J.nx=-0.2; J.lLx=-1.0; J.lRx=-0.85; J.kL=1.55; J.kR=1.45; J.fL=-0.55; J.fR=-0.6; J.aLx=-0.95; J.aRx=-0.75; J.aLz=0.42; J.aRz=0.4; J.eL=J.eR=0.55; return J; },
  tuck(){ const J=P0(); J.hd=HIP0()-0.16; J.hp=0.1; J.sp=0.5; J.nx=-0.1; J.lLx=-1.5; J.lRx=-1.4; J.kL=2.3; J.kR=2.2; J.fL=0.6; J.fR=0.55; J.aLx=-0.3; J.aRx=0.4; J.aLz=J.aRz=0.35; J.eL=J.eR=0.3; return J; },
  up(t,u){ return u<0.2? mix(NG.lie(t,0),NG.sit(),sm5(u/0.2)) : u<0.35? mix(NG.sit(),NG.tuck(),sm5((u-0.2)/0.15)) : u<0.5? mix(NG.tuck(),NG.knee(),sm5((u-0.35)/0.15)) : u<0.72? mix(NG.knee(),NG.crouch(),sm5((u-0.5)/0.22)) : mix(NG.crouch(),nStand(t,1),sm5((u-0.72)/0.28)); } };
// crouched: hips low, knees deep, the light low ahead
function nCrouch(t){ const J=P0(); J.lLx=-1.2; J.lRx=-0.95; J.kL=1.75; J.kR=1.6; J.fL=-(J.lLx+J.kL); J.fR=-(J.lRx+J.kR); J.hp=0.35; J.sp=0.45+0.02*Math.sin(t*4.4); J.nx=-0.25; J.aLx=-0.75; J.aRx=-0.65; J.eL=1.2; J.eR=0.9; J.aLz=0.12; J.aRz=0.1; J.lLz=0.12; J.lRz=0.14; return J; }
function crouchWalk(ph,t){ const J=nCrouch(t), a=stride(ph,NCROUCH), b=stride((ph+0.5)%1,NCROUCH); J.lLx=-1.05+a.lx; J.kL=1.6+a.k*0.8; J.fL=-(J.lLx+J.kL)+a.f; J.lRx=-1.05+b.lx; J.kR=1.6+b.k*0.8; J.fR=-(J.lRx+J.kR)+b.f;   /* feet kept level with the floor */ J.syaw=-0.08*Math.sin(ph*Math.PI*2); return J; }

// ---------------------------------------------------------------- the ACROSS (target and attacker)
// ctx.atk = {x, z, yaw, J, fall (toppled back, 0..1 of a right angle), fwd (toppled forward)}
function aStand(t){ const J=P0(); J.hd=0.06; J.kL=0.25; J.kR=0.35; J.sp=0.38+0.04*Math.sin(t*1.7); J.nx=-0.2+0.15*noise(t*2,3); J.ny=0.2*noise(t*1.3,1); J.aLx=-0.35; J.aRx=-0.2; J.aLz=0.25; J.aRz=0.3; J.eL=0.7; J.eR=0.5; J.sroll=0.12; return J; }
function aWalk(ph,t){ const {J}=walkPose(ph,aStand(t)); J.aLx=-0.6+0.3*Math.sin(ph*Math.PI*2); J.aRx=-0.55-0.3*Math.sin(ph*Math.PI*2); J.eL=J.eR=0.6; J.sp=0.42; return J; }
function aReach(t,k){ const J=aStand(t); J.aLx=-1.45*k-0.3*(1-k); J.aRx=-1.5*k-0.2*(1-k); J.eL=0.25+0.4*(1-k); J.eR=0.2+0.4*(1-k); J.aLz=0.1; J.aRz=0.1; J.sp=0.42+0.25*k; J.nx=-0.35*k; J.hz=0.08*k; J.lLx=-0.45*k; J.kL=0.4*k; J.lRx=0.35*k; return J; }
function aSwipe(t,u){ const J=aStand(t), wu=sm5(u/0.45), sw=sm5((u-0.45)/0.25); J.aRx=-0.3-1.5*wu+0.9*sw; J.aRz=0.3+1.0*wu-1.6*sw; J.eR=0.4; J.syaw=-0.5*wu+0.9*sw; J.sp=0.4+0.15*sw; J.lLx=-0.3*sw; J.kL=0.3; return J; }
const AK={}; function atkStep(dt){ if(!by) return; const a=ctx.atk, b=by.c; b.group.visible=b.shadow.visible=!!a; if(!a) return;
  applyPose(b,a.J); b.group.position.set(a.x,0,a.z||0); b.group.rotation.set(0,a.yaw??-Math.PI/2,0); if(a.fall) b.group.rotateX(-a.fall*Math.PI/2); if(a.fwd) b.group.rotateX(a.fwd*Math.PI/2); retarget(b);
  PHYS.rig(b,dt,{balance:!a.fall&&!a.fwd,held:!!a.held}); }
const aFace=()=>{ const r=runner.group.position, a=ctx.atk; return Math.atan2(r.x-a.x,(r.z)-(a.z||0)); };

// ---------------------------------------------------------------- dropped and spent things: rigid bodies under gravity
const PIECES=[], BLOOD=[];
function goreClear(){ for(const p of PIECES){ if(p.keep){ p.m.parent&&p.m.parent.remove(p.m); scene.add(p.m); continue; } scene.remove(p.m); } PIECES.length=0; for(const b of BLOOD) scene.remove(b.m); BLOOD.length=0;
  if(GUN){ GUN.visible=true; LIGHT.visible=true; } if(LEDGE) LEDGE.visible=false; }
function dropPiece(m,v,w,keep){ m.updateMatrixWorld(true); const bb=new THREE.Box3(); const sample=[]; m.traverse(o=>{ if(o.isMesh){ o.geometry.computeBoundingBox(); const b=o.geometry.boundingBox; for(const x of [b.min.x,b.max.x]) for(const y of [b.min.y,b.max.y]) for(const z of [b.min.z,b.max.z]){ const p=new V3(x,y,z).applyMatrix4(o.matrix); sample.push(p); } } });
  PIECES.push({m,v:v.clone(),w:w.clone(),sample,keep}); }
function shell(at,v){ const m=new THREE.Mesh(new THREE.CylinderGeometry(0.0048,0.0048,0.03,6),new THREE.MeshLambertMaterial({color:0xb08a3a})); m.position.copy(at); m.rotation.set(Math.random(),Math.random(),Math.random()); scene.add(m); dropPiece(m,v,new V3(Math.random()*8-4,Math.random()*8-4,Math.random()*8-4)); return m; }
function pieceStep(dt){ for(const p of PIECES){ if(p.rest) continue; p.v.y-=9.8*dt; p.m.position.addScaledVector(p.v,dt); const wl=p.w.length(); if(wl>1e-4) p.m.rotateOnWorldAxis(p.w.clone().divideScalar(wl),wl*dt);
    p.m.updateMatrixWorld(true); let lo=1e9, lp=null; const q=new V3(); for(const s of p.sample){ q.copy(s).applyMatrix4(p.m.matrixWorld); if(q.y<lo){ lo=q.y; lp=q.clone(); } }
    if(lo<0.002){ p.m.position.y+=0.002-lo; if(p.v.y<-1.2&&p.big){ puff(lp,0.6); } p.v.y=Math.max(0,-0.25*p.v.y); p.v.x*=0.75; p.v.z*=0.75;
      let hi=-1e9; for(const s of p.sample){ q.copy(s).applyMatrix4(p.m.matrixWorld); hi=Math.max(hi,q.y); }
      const arm=p.m.position.clone().sub(lp), tq=new V3(arm.z,0,-arm.x);
      if(hi-lo>0.05&&tq.lengthSq()>1e-8&&p.tips!==false){ p.w.copy(tq.normalize().multiplyScalar(Math.min(4,p.w.length()*0.6+5*dt))); } else { p.w.multiplyScalar(0.5); if(p.v.length()<0.03) p.rest=true; } } } }
function BLOODsplat(p,n){ for(let i=0;i<n;i++){ const m=new THREE.Mesh(new THREE.BoxGeometry(0.02,0.02,0.02),new THREE.MeshLambertMaterial({color:0x5a0606})); m.position.copy(p); scene.add(m); BLOOD.push({m,v:new V3((Math.random()-0.5)*2,0.5+Math.random()*1.5,(Math.random()-0.5)*2)}); } }
function goreStep(dt){ pieceStep(dt); for(const b of BLOOD){ if(b.rest) continue; b.v.y-=9.8*dt; b.m.position.addScaledVector(b.v,dt); if(b.m.position.y<=0.006){ b.m.position.y=0.006; b.rest=true; b.m.scale.set(1.5+Math.random()*2,0.12,1.5+Math.random()*2); } } }
function puffAt(p,s){ for(let i=0;i<4;i++){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,transparent:true,depthWrite:false})); m.position.set(p.x+(Math.random()-.5)*0.1,p.y+(Math.random()-.5)*0.1,p.z+(Math.random()-.5)*0.1); m.scale.setScalar(0.16*s); scene.add(m); puffs.push({m,t:0,v:new V3((Math.random()-.5)*0.5,0.2+Math.random()*0.3,(Math.random()-.5)*0.5),s}); } }

// ---------------------------------------------------------------- the ledge (for the hard landing)
let LEDGE=null; function ensureLedge(){ if(!LEDGE){ LEDGE=new THREE.Mesh(new THREE.BoxGeometry(1.6,0.6,1.4),new THREE.MeshLambertMaterial({color:0x3a3430})); LEDGE.position.set(-1.2,0.3,0); scene.add(LEDGE); } LEDGE.visible=true; }

// ---------------------------------------------------------------- common start
function nStart(ctx,x){ ensureProps(); ctx.x=x??0; ctx.z=0; ctx.yaw=Math.PI/2; ctx.ph=0; ctx.v=0; ctx.T={}; ctx.H={aim:0}; ctx.atk=null; ctx.camX=null; ctx.camD=null; ctx.look=null; ctx.aimT=0; ctx.fall=0; ctx.roll=0; ctx.elev=0; ctx.gripN=0; }
function hands(ctx,H){ ctx.H=H; ctx.post=()=>holdPost(ctx,H); ctx.post2=()=>propsPost(ctx,H); }
// her tremor: high when she has just raised the gun, been hit or fired; it settles while she holds still
function tremor(ctx,dt,still){ ctx.aimT=(ctx.aimT||0)+(still?dt:0); return 0.006+0.03*Math.exp(-ctx.aimT/1.1); }

// ================================================================ MOVING
// ---- idle: scared, breathing hard, looking about; the light sweeps where she looks; a noise makes her jump
A.idle={ start(ctx){ nStart(ctx,0); },
  step(t,dt,ctx){ const T=ctx.T, J=nStand(t,1), h=look(J,dt,ctx,1), jump=t>4.2&&t<5.2?Math.sin(sat((t-4.2)/0.3)*Math.PI)*Math.exp(-(t-4.2)*1.5):0;
    if(t>4.2&&!T.n){ T.n=1; ctx.look.to=-1.1; ctx.look.T=1.2; }
    J.sp-=0.15*jump; J.hd-=0.05*jump; J.aLx-=0.5*jump; J.aRx-=0.5*jump; J.nx-=0.15*jump; J.kL+=0.1*jump;
    const press=sat(1-Math.abs(t-0.75)/0.12), fl=t>2.6&&t<3.5? (noise(t*40,2)>0.1?1:0.15) : 1, shk=t>3.3&&t<3.6?Math.sin((t-3.3)/0.3*Math.PI*3):0;
    J.aLx+=0.12*shk; J.eL+=0.15*shk; if(t>3.5&&!T.sk){ T.sk=1; }
    hands(ctx,{aim:0,sweep:h*0.9,press,lightOn:t<0.72?0:fl});
    ctx.phase= t<0.9?"clicks the light on": t>2.6&&t<3.6?"the light flickers · she shakes it": t<4.2?"breathing hard · looking about · the light follows her eyes": t<5.4?"a noise behind her · she jumps":"settles, still breathing hard";
    return fin(J); } };
// ---- walk: cautious, the light ahead and the gun low, her head never still
A.walk={ start(ctx){ nStart(ctx,-3); ctx.camX=null; },
  step(t,dt,ctx){ const going=t>0.4&&ctx.x<3.4; let J;
    if(going){ gaitOn(ctx,dt,1.2,NWALK); J=hLegs(ctx.ph,nStand(t,0.8)); const s=Math.sin(ctx.ph*Math.PI*2); J.aLx+=0.05*s; J.aRx-=0.07*s; J.sp=0.14; J.hd=0.01; }
    else J=nStand(t,0.8);
    const h=look(J,dt,ctx,0.7); hands(ctx,{aim:0,sweep:h*0.8+0.1*Math.sin(t*1.3)});
    ctx.camX=ctx.x+0.6; ctx.phase=going?"cautious steps · the light ahead, the gun low":"stops"; return fin(J); } };
A.walk.phys=WPHYS;
// ---- run: panicked, everything pumping; a look back over her shoulder that costs her a stumble
A.run={ start(ctx){ nStart(ctx,-5); },
  step(t,dt,ctx){ const T=ctx.T; let J;
    if(ctx.x<5){ gaitOn(ctx,dt,0.64,HRUN); J=hRun(ctx.ph,t);
      const lb=t>2.2&&t<3.1?sm5((t-2.2)/0.3)*(1-sm5((t-2.75)/0.35)):0; J.ny+=1.0*lb; J.syaw+=0.4*lb; J.hyaw+=0.08*lb; J.nx-=0.05*lb; if(lb>0.5&&!T.lb){ T.lb=1; } }
    else J=nStand(t,1);
    hands(ctx,{aim:0}); ctx.camX=ctx.x+0.3; ctx.phase= t>2.2&&t<3.1?"a look back over her shoulder":ctx.x<5?"runs · gun and light pumping":"stops, gasping"; return fin(J); } };
A.run.phys=RPHYS;
// ---- turn: something behind her. Her head snaps round first, then she turns her body in two quick steps and raises the gun
A.turn={ start(ctx){ nStart(ctx,0); ctx.yaw0=Math.PI/2; },
  step(t,dt,ctx){ const t0=0.9, t1=1.3, t2=2.05; let J=nStand(t,1);
    const head=sm5((t-t0)/0.28)*(1-sm5((t-t1-0.1)/0.5)), turn=sm5((t-t1)/(t2-t1)); ctx.yaw=ctx.yaw0+Math.PI*turn;
    J.ny+=1.05*head; J.syaw+=0.3*head; J.hyaw+=0.08*head; J.nx-=0.05*head; J.sp-=0.05*head;
    if(t>t1&&t<t2){ ctx.ph=((t-t1)/(t2-t1)*1.5)%1; J=hLegs(ctx.ph,J,HSTEP,0.5); ctx.moving=true; J.ny+=1.05*head*(1-turn); }
    const aim=sm5((t-t2+0.15)/0.4); if(t<t2) ctx.aimT=0;
    const amp=tremor(ctx,dt,t>t2+0.3); hands(ctx,{aim,amp,at:runner.group.position.clone().addScaledVector(TP().fwd,6).setY(1.3)});
    ctx.phase= t<t0?"listening": t<t1?"her head turns first": t<t2?"steps round to face it":"gun up · shaking, then steadier"; return fin(aim>0?mix(J,nAim(t,0.8),aim):J); } };
// ---- crouch: down into a crouch, creeps forward at 0.9 m/s, and stands
A.crouch={ start(ctx){ nStart(ctx,-2.2); },
  step(t,dt,ctx){ const t0=0.6, t1=1.2, t2=4.6; let J;
    if(t<t1){ J=mix(nStand(t,0.8),nCrouch(t),sm5((t-t0)/(t1-t0))); }
    else if(t<t2){ gaitOn(ctx,dt,0.95,NCROUCH); J=crouchWalk(ctx.ph,t); }
    else { J=mix(nCrouch(t),nStand(t,0.8),sm5((t-t2-0.3)/0.7)); }
    const h=look(J,dt,ctx,0.5); hands(ctx,{aim:0,sweep:0.5*h});
    ctx.phase= t<t1?"drops into a crouch": t<t2?"creeps forward, low (0.9 m/s)":"stands"; return fin(J); } };
A.crouch.phys=CPHYS;
// ---- hard landing: steps off a ledge (60 cm), lands hard in a crouch with a hand to the floor, a woozy beat, gets up
A.land={ start(ctx){ nStart(ctx,-1.55); ensureLedge(); ctx.elev=0.6; },
  step(t,dt,ctx){ const T=ctx.T, edge=-0.4; let J;
    const air= runner.gs&&runner.gs.air;
    if(!T.off){ // on the ledge, held up by it: walks to the edge and steps off
      if(ctx.x<edge){ gaitOn(ctx,dt,1.2,NWALK); J=hLegs(ctx.ph,nStand(t,0.6)); J.hd=0.01; }
      else { T.off=t; J=nStand(t,0.6); }
      if(!T.off||t-T.off<0){ ctx.held=true; ctx.grip=0; ctx.gripN=2; } ctx.phase="walks to the edge of the ledge"; }
    if(T.off){ ctx.gripN=0; const k=t-T.off; ctx.x+=dt*0.9*(1-sat(k/0.5));
      if(!T.land&&k>0.12&&runner.gs&&!runner.gs.air&&runner.gs.init){ T.land=t; ctx.events.push({kind:"land"}); }
      const fallJ=nStand(t,1); fallJ.aLx=-1.1; fallJ.aRx=-1.0; fallJ.aLz=0.6; fallJ.aRz=0.5; fallJ.kL=0.35; fallJ.kR=0.45; fallJ.lLx=-0.35; fallJ.sp=0.1;
      if(!T.land) J=fallJ;
      else { const q=t-T.land, hard={...NG.crouch()}; hard.hd=0; hard.hp=0.45; hard.sp=0.5; hard.nx=0.2; hard.aLx=-0.3; hard.eL=0.2; hard.aLz=0.45; hard.aRx=-0.3; hard.eR=0.9; hard.kL=2.0; hard.kR=1.9; hard.lLx=-1.3; hard.lRx=-1.05; hard.fL=-0.7; hard.fR=-0.85;
        const sway=Math.sin(q*3.1)*Math.exp(-q*0.6)*sat((q-0.25)/0.3); hard.hroll=0.1*sway; hard.nz=0.25*sway; hard.ny=0.2*sway;
        J= q<0.14? mix(fallJ,hard,sm5(q/0.14)) : q<2.0? hard : mix(hard,nStand(t,1),sm5((q-2.0)/0.9)); }
      ctx.moving=!T.land; ctx.phase= !T.land?"steps off · drops 60 cm": t-T.land<0.3?"lands hard · a hand to the floor": t-T.land<2?"a woozy beat":"gets up"; }
    hands(ctx,{aim:0}); return fin(J); } };
A.land.phys={ active:ctx=>!!ctx.gait&&!ctx.T.off, stance:ctx=>strideStance(ctx.ph,NWALK), traction:9, imp:0.6, rollK:0.4 };

// ================================================================ GUN
const tgtPos=()=>new V3(3.9,0,0);
function standTarget(ctx,t){ ctx.camX=1.75; ctx.camD=6.4; ctx.atk={x:3.9,z:0,yaw:-Math.PI/2,J:aStand(t)}; }
const tgtChest=()=>by.c.B.chest.getWorldPosition(new V3()).add(new V3(0,0.05,0));
// ---- raise and aim: up into the hold, wrists crossed, the beam on the target; the shake settles as she holds
A.aim={ start(ctx){ nStart(ctx,0); },
  step(t,dt,ctx){ standTarget(ctx,t); const t0=0.8, aim=sm5((t-t0)/0.45), f=1-0.7*sat((t-t0-0.5)/2.5); const J=mix(nStand(t,1),nAim(t,f),aim);
    const amp=tremor(ctx,dt,t>t0+0.45); hands(ctx,{aim,amp,at:tgtChest()});
    ctx.phase= t<t0?"gun low, light ahead": t<t0+0.5?"brings it up · light under the gun":"holds · the shake settles"; return fin(J); } };
// ---- aimed walk: slow (0.7 m/s) in any direction while she holds the aim: forward, to the side, back
A.aimwalk={ start(ctx){ nStart(ctx,-0.6); ctx.aimT=1.5; },
  step(t,dt,ctx){ standTarget(ctx,t); const seg=t<0.6?0:t<2.6?1:t<4.8?2:t<6.8?3:4, P=TP(); let J=nAim(t,0.4);
    const dirs=[null,P.fwd,P.right,P.fwd.clone().negate(),null], d=dirs[seg];
    if(d){ ctx.mv=(ctx.mv||0)+dt; const ph=(t*1.0)%1, s=Math.sin(ph*Math.PI*2), c=Math.cos(ph*Math.PI*2), sp=0.7;
      ctx.x+=d.x*sp*dt; ctx.z=(ctx.z||0)+d.z*sp*dt; ctx.moving=true;
      if(seg===2){ J.lLz+=0.18*Math.max(0,s); J.lRz+=0.18*Math.max(0,-s); J.kL+=0.3*Math.max(0,s); J.kR+=0.3*Math.max(0,-s); }
      else { const k=seg===3?-1:1; J.lLx+=-0.3*s*k; J.lRx+=0.3*s*k; J.kL+=0.35*Math.max(0,s); J.kR+=0.35*Math.max(0,-s); }
      J.hd+=0.015*Math.abs(c);  }
    const amp=d?0.016:tremor(ctx,dt,true); hands(ctx,{aim:1,amp,at:tgtChest()});
    ctx.phase=["holds","walks forward on the aim (0.7 m/s)","sidesteps, still on the aim","backs away, still on the aim","holds"][seg]; return fin(J); } };
// ---- fire: four shots. The first makes her flinch hard, eyes shut and head turned; the next less; the kick throws the aim
// up and she brings it back down. Each shot nudges her back.
A.fire={ start(ctx){ nStart(ctx,0); ctx.aimT=2; ctx.shots=[1.0,1.9,2.6,3.2]; },
  step(t,dt,ctx){ standTarget(ctx,t); const T=ctx.T; let J=nAim(t,0.3), kick=0, back=0, fl=0;
    ctx.shots.forEach((s,i)=>{ if(t>s&&!T["s"+i]){ T["s"+i]=t; ctx.events.push({kind:"shot",i}); ctx.aimT=0.4*i; } if(T["s"+i]){ const k=t-s, f=[1,0.6,0.35,0.25][i]; kick+=(0.32+0.12*f)*Math.exp(-k/0.09)*sat(k/0.02); back+=0.05*Math.exp(-k/0.1)*sat(k/0.02); fl+=f*Math.exp(-k/0.35)*sat(k/0.03); ctx.x-=0.35*Math.exp(-k/0.08)*dt; } });
    J.nx-=0.22*fl; J.ny+=0.35*fl; J.sp-=0.12*fl; J.hd+=0.03*fl; J.aLz+=0.1*fl;
    const G=gunCycle(t,ctx.shots), ch=LIVE5.map((x,i)=>i>=1&&i<=G.n?"spent":"live");
    ctx.atk.J=aStand(t); if(T.s0){ const k=t-T.s0; ctx.atk.J.sp-=0.3*Math.exp(-k/0.2); }
    const amp=tremor(ctx,dt,true); hands(ctx,{aim:1,amp,kick,back,at:tgtChest(),trig:G.trig,cock:G.cock,cylA:G.cylA,ch});
    ctx.phase= t<1?"on the aim": t<1.6?"first shot · she flinches hard, eyes shut": t<3.6?"the kick throws the aim up · she brings it back down":"holds, breathing"; return fin(J); } };
// ---- empty: the hammer falls on a spent chamber. Click. She starts, then tips the gun to look at it
A.empty={ start(ctx){ nStart(ctx,0); ctx.aimT=2; },
  step(t,dt,ctx){ standTarget(ctx,t); const T=ctx.T, t0=1.0; let J=nAim(t,0.3), aim=1, gF=null, gU=null;
    if(t>t0&&!T.c){ T.c=t; ctx.events.push({kind:"click"}); }
    const k=T.c?t-T.c:-1, start=k>=0?Math.sin(sat(k/0.35)*Math.PI)*Math.exp(-k*2):0, peek=sm5((k-0.6)/0.4)*(1-sm5((k-2.6)/0.5));
    J.sp-=0.08*start; J.nx-=0.1*start; aim=1-0.85*peek; J=mix(J,nStand(t,1),peek*0.6); J.nx+=0.25*peek; J.aRx=-1.2*peek-0.5*(1-peek); J.eR=1.5*peek+0.75*(1-peek);
    if(peek>0){ const P=TP(); gF=P.right.clone().negate().lerp(P.fwd,0.4).add(new V3(0,0.25,0)); gU=UP.clone().lerp(P.fwd.clone().negate(),0.5); }
    const G=gunCycle(t,[t0]), amp=tremor(ctx,dt,true)+0.02*start;
    hands(ctx,{aim,amp,at:tgtChest(),trig:G.trig,cock:G.cock,cylA:G.cylA,ch:["spent","spent","spent","spent","spent"],gunF:peek>0.3?gF:null,gunU:peek>0.3?gU:null});
    ctx.phase= k<0?"on the aim · squeezes": k<0.6?"click · nothing": k<2.6?"tips the gun to look at it":"back on the aim"; return fin(J); } };
// ---- reload: the five-shot revolver. She tucks the light under her arm, swings the cylinder out, tips it up and punches
// the empties out, tips it down and thumbs in five rounds, flicks it shut and takes the light back. Under pressure she
// fumbles a round and it drops.
A.reload={ start(ctx){ nStart(ctx,0); ctx.out=outcome("oReload","calm","rushed"); },
  step(t,dt,ctx){ const T=ctx.T, R=ctx.out==="rushed", sp=R?0.85:1, P=TP(); let J=nStand(t,R?1:0.5); J.nx=0.42; J.sp=0.3;
    const tt=t*(R?1.15:1), k1=0.5, k2=1.1, k3=1.6, k4=2.3, kL=2.5, nR=5, per=R?0.42:0.5, kE=kL+nR*per+(R?per:0), kC=kE+0.35, kB=kC+0.6;
    const at=k=>tt>k;
    // the gun in front of her chest, barrel to her left; up for the ejector, down to load
    const chest=runner.B.chest.getWorldPosition(new V3()).addScaledVector(P.fwd,0.32).add(new V3(0,-0.02,0)), tip=at(k3)&&!at(k4)?1:0;
    const gF=P.right.clone().negate().lerp(P.fwd,0.35).normalize().add(new V3(0,tip?0.9:(at(k4)&&!at(kC)?-0.55:0),0)).normalize(), gU=UP.clone().lerp(P.fwd.clone().negate(),0.3);
    const cyl=at(k2)&&!at(kC)?sm5((tt-k2)/0.2):at(kC)?1-sm5((tt-kC)/0.12):0, light=at(k1)&&!at(kB)?"tuck":"hand";
    if(at(k3+0.42)&&!T.ej){ T.ej=t; ctx.events.push({kind:"eject"}); }
    let li=-1; for(let i=0;i<nR+(R?1:0);i++) if(at(kL+i*per)&&!T["r"+i]){ T["r"+i]=t; li=i; ctx.events.push({kind:R&&i===2?"fumble":"round"}); }
    if(at(kC)&&!T.cl){ T.cl=t; ctx.events.push({kind:"close"}); }
    const ld=at(kL)&&!at(kE), lp=ld?((tt-kL)%per)/per:0;   /* the left hand to her pocket and back to the cylinder each round */
    const pocket=runner.B.hips.getWorldPosition(new V3()).addScaledVector(P.right,-0.17).addScaledVector(P.fwd,0.06);
    const gunAt=chest.clone().addScaledVector(P.right,0.06);
    const lhand= !at(k1)? null : at(k3)&&!at(k4)? gunAt.clone().add(new V3(0,0.05,0)) : ld? gunAt.clone().lerp(pocket,Math.sin(lp*Math.PI)) : at(kC-0.1)&&!at(kB)? gunAt.clone().addScaledVector(P.right,-0.08) : null;
    const back=at(kB)?sm5((tt-kB)/0.4):0;
    ctx.post=()=>{ runner.group.updateMatrixWorld(true); const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
      armIK(runner,{side:"R",target:gunAt,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.18),w:1-back,tip:0.075});
      if(lhand) armIK(runner,{side:"L",target:lhand,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.18),w:sm5((tt-k1)/0.3),tip:0.075});
      else if(light==="tuck"||at(kB)){ armIK(runner,{side:"L",target:SL.clone().add(new V3(0,-0.3,0)).addScaledVector(P.fwd,0.12),pole:SL.clone().addScaledVector(P.right,-0.18),w:1-back,tip:0.075}); }
      if(back>0) holdPost(ctx,{aim:back,amp:0.02,at:runner.group.position.clone().addScaledVector(P.fwd,5).setY(1.2)}); };
    const nl=Object.keys(T).filter(k=>/^r\d$/.test(k)&&!(R&&k==="r2")).length, idx=T.idx=(T.idx??0)+(nl*Math.PI*2/5-(T.idx??0))*Math.min(1,dt*14);
    const ejp=at(k3+0.22)&&!at(k3+0.6)?Math.sin(sat((tt-k3-0.22)/0.38)*Math.PI):0, ch=[0,1,2,3,4].map(i=>T.ej?(i<nl?"live":"empty"):"spent");
    const spin=T.cl?14*Math.exp(-(t-T.cl)/0.35)*0.35:0; T.sp=(T.sp||0)+spin*dt;
    ctx.post2=()=>{ propsPost(ctx,{aim:back,gunF:back>0.3?null:gF,gunU:back>0.3?null:gU,light,crane:cyl,eject:ejp,ch,cylA:idx+T.sp});
      // a round in her fingers while it goes in
      if(!ctx.rnd){ ctx.rnd=new THREE.Mesh(new THREE.CylinderGeometry(0.0048,0.0048,0.032,6),new THREE.MeshLambertMaterial({color:0xc0a050})); scene.add(ctx.rnd); }
      ctx.rnd.visible=ld&&lp>0.3; if(ctx.rnd.visible){ const L=palm("L"); ctx.rnd.position.copy(L.p); } };
    ctx.phase= !at(k1)?"lowers the gun": !at(k2)?"tucks the light under her arm": !at(k3)?"swings the cylinder out": !at(k4)?"tips it up · punches the empties out": !at(kE)?(R&&T.r2&&t-T.r2<0.6?"fumbles a round · it drops":"thumbs in five rounds, one by one"): !at(kB)?"flicks it shut":"takes the light back · gun up";
    if(back>0){ J=mix(J,nAim(t,0.6),back); }
    return fin(J); } };

// ================================================================ DODGE AND SHOVE
// ---- dodge: an ACROSS lunges. She lurches to the side, a desperate stumbling step, nearly loses her feet, catches herself;
// it goes past and sprawls
A.dodge={ start(ctx){ nStart(ctx,0); ctx.aimT=1.5; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t0=0.9, tL=1.35, tD=1.42; let J=nAim(t,0.6), aim=1;
    // the lunge: winds up, then throws itself at where she was
    const lx= t<t0? 2.6 : t<tL? 2.6 : 2.6-2.9*sm5((t-tL)/0.45)-0.6*sat((t-tL-0.45)/0.6);
    const fk=T.trip?Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.3,w:2.2}),dt,1.6,Math.PI/2-0.08)):0;
    ctx.atk={x:lx,z:0,yaw:-Math.PI/2,J:t<t0?aStand(t):t<tL?aReach(t,0.25*sm5((t-t0)/0.4)):aReach(t,1),fwd:fk};
    if(t>tL+0.45&&!T.trip){ T.trip=t; ctx.events.push({kind:"sprawl"}); }
    if(t>tD&&!T.d){ T.d=t; ctx.events.push({kind:"dodge"}); }
    const k=T.d?t-T.d:-1;
    if(k>=0){ const s1=sm5(k/0.2), s2=sm5((k-0.2)/0.24), s3=sm5((k-0.5)/0.2), wob=Math.sin(sat((k-0.15)/0.9)*Math.PI)*Math.exp(-k*0.9);
      const zR=0.62*s1+0.2*s3, zL=0.78*s2, zB=0.36*s1+0.42*s2+0.1*s3; ctx.z=zB; ctx.moving=k<1.2; aim=1-sm5(k/0.1)*(1-sm5((k-1.3)/0.5));
      const S=nStand(t,1); S.kL=0.35+0.25*wob; S.kR=0.4+0.35*wob; S.sroll=0.32*wob*(1-s3)+0.12*wob; S.hroll=-0.12*wob; S.sp=0.28+0.18*wob; S.nx=-0.15+0.1*wob;
      S.aLx=-0.9-0.4*wob; S.aLz=0.55; S.aRx=-0.75; S.aRz=0.5; S.eL=S.eR=0.7; S.ny=-0.25*(1-s2);   /* arms out for balance, eyes on it */
      J=mix(S,nAim(t,1),sm5((k-1.3)/0.5)); if(k<1.3) ctx.aimT=0;
      if(k>1.15){ if(T.y0==null){ T.y0=ctx.yaw; const d=new V3(ctx.atk.x-0.3,0,0).sub(runner.group.position); let ty=Math.atan2(d.x,d.z); while(ty-T.y0>Math.PI) ty-=2*Math.PI; while(ty-T.y0<-Math.PI) ty+=2*Math.PI; T.y1=ty; }
        const u=sm5((k-1.15)/0.7); ctx.yaw=T.y0+(T.y1-T.y0)*u; if(u>0&&u<1){ J=hLegs(((k-1.15)/0.7*1.5)%1,J,HSTEP,0.5); ctx.moving=true; } }   /* turns round to face it, stepping */
      if(!T.a0){ runner.group.updateMatrixWorld(true); T.a0={L:runner.R.ankleL.getWorldPosition(new V3()),R:runner.R.ankleR.getWorldPosition(new V3())}; }
      if(k<1.2){ const arc=(u,h)=>h*Math.sin(Math.PI*sat(u)), fR=T.a0.R.clone().add(new V3(0,arc(k/0.2,0.11)+arc((k-0.5)/0.2,0.07),zR)), fL=T.a0.L.clone().add(new V3(-0.06*s2,arc((k-0.2)/0.24,0.1),zL)), P=TP();
        T.feet=(rp)=>{ for(const [sd,f] of [["L",fL],["R",fR]]) legIK(runner,sd,f,f.clone().addScaledVector(P.fwd,0.7).add(new V3(0,0.5,0))); }; } else T.feet=null; }
    if(t<tD){ const tell=t>t0?1:0; J.sp-=0.04*tell; }
    hands(ctx,{aim,amp:tremor(ctx,dt,k<0||k>1.6),at:new V3(ctx.atk.x,1.0,ctx.atk.z)}); if(T.feet){ const H=ctx.H, f=T.feet; ctx.post=()=>{ f(); holdPost(ctx,H); }; }
    ctx.phase= t<t0?"on the aim": t<tD?"it winds up and lunges · DODGE!": k<0.45?"she lurches aside · two stumbling steps": k<1.15?"a third step to stop herself going over": k<1.9?"turns to face it":"back on the aim"; return fin(J); } };
// ---- shove: one gets in close. Both hands still full, she drives her forearms into its chest; it goes down; she backs off
// and comes up on the aim
A.shove={ start(ctx){ nStart(ctx,0); ctx.aimT=1.5; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t0=1.4, tS=1.55; let J=nAim(t,0.7), aim=1;
    const ax= t<t0? 2.6-1.85*sm5(t/t0) : 0.75;
    if(t>tS+0.12&&!T.h){ T.h=t; ctx.events.push({kind:"shove"}); }
    const fb=T.h?Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.25,w:3.0}),dt,1.6,Math.PI/2-0.08)):0;
    const kb=T.h?0.55*sm5((t-T.h)/0.5):0;
    ctx.atk={x:ax+kb,z:0,yaw:-Math.PI/2,J:t<t0?aWalk((t*1.1)%1,t):aReach(t,1),fall:fb}; if(t<t0) ctx.atk.J=aWalk((t/0.9)%1,t);
    const k=t-tS, push=sat(k/0.12)*(1-sm5((k-0.35)/0.35));
    let H={aim:1,amp:tremor(ctx,dt,k<0||k>1),at:new V3(ctx.atk.x,1.0,0)};
    if(k>-0.2&&k<0.9){ aim=1-sm5((k+0.2)/0.15)*(1-sm5((k-0.55)/0.3)); H.aim=aim;
      const chest=by.c.B.chest.getWorldPosition(new V3());
      ctx.post=()=>{ holdPost(ctx,H); const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3()), w=1-aim, tg=k<0.12? runner.B.chest.getWorldPosition(new V3()).addScaledVector(P.fwd,0.25) : chest.clone().addScaledVector(P.fwd,-0.12);
        armIK(runner,{side:"R",target:tg.clone().addScaledVector(P.right,0.12),pole:S.clone().add(new V3(0,-0.5,0)).addScaledVector(P.right,0.18),w,tip:0.075});
        armIK(runner,{side:"L",target:tg.clone().addScaledVector(P.right,-0.12),pole:SL.clone().add(new V3(0,-0.5,0)).addScaledVector(P.right,-0.18),w,tip:0.075}); };
      ctx.post2=()=>propsPost(ctx,H); ctx.H=H;
      const S=nStand(t,1); S.lLx=-0.55*push; S.kL=0.45; S.lRx=0.35; S.sp=0.3+0.25*push; S.hz=0.12*push; S.nx=0.1; J=mix(J,S,1-aim); ctx.x+=0.35*dt*(k<0.3?1:0)-0.4*dt*(k>0.4&&k<0.9?1:0); ctx.moving=true; }
    else hands(ctx,H);
    ctx.phase= t<t0?"one comes at her": k<0.15?"in close · she drops the aim": k<0.45?"shoves it off with both forearms": k<1?"it goes down · she backs off":"back on the aim"; return fin(J); } };

// ================================================================ GETTING HURT
// ---- flinch: a swipe catches her arm. Her aim is knocked off; she flinches away and brings it back
A.flinch={ start(ctx){ nStart(ctx,0); ctx.aimT=1.5; },
  step(t,dt,ctx){ const T=ctx.T, t0=0.9, tH=1.35; let J=nAim(t,0.5);
    ctx.atk={x:0.95,z:0.05,yaw:-Math.PI/2,J:t<t0?aStand(t):aSwipe(t,(t-t0)/0.65)};
    if(t>tH&&!T.h){ T.h=t; ctx.events.push({kind:"swipe"}); ctx.aimT=0; }
    const k=T.h?t-T.h:-1, j=k>=0?Math.exp(-k/0.25)*sat(k/0.04):0;
    J.syaw-=0.45*j; J.sroll+=0.25*j; J.nx-=0.15*j; J.ny-=0.5*j; J.hyaw-=0.15*j; ctx.z=-0.12*sm5(k/0.2)*(k>=0?1:0);
    const aim=1-0.9*j; hands(ctx,{aim,amp:tremor(ctx,dt,true),kick:-0.25*j,at:by.c.B.chest.getWorldPosition(new V3()).add(new V3(0,0,0.4*j))});
    ctx.phase= t<t0?"on the aim · it's close": k<0?"it swipes": k<0.5?"catches her arm · she flinches away":"brings the aim back"; return fin(J); } };
// ---- stagger: a lunge hits her square. She's knocked back a metre on stumbling steps, arms out, and catches her balance
A.stagger={ start(ctx){ nStart(ctx,0); ctx.aimT=1.5; },
  step(t,dt,ctx){ const T=ctx.T, t0=0.9, tH=1.3; let J=nAim(t,0.5), aim=1;
    const ax=t<t0?2.0:2.0-1.25*sm5((t-t0)/0.4); ctx.atk={x:ax+(ctx.x),z:0,yaw:-Math.PI/2,J:t<t0?aStand(t):aReach(t,sm5((t-t0)/0.35))};
    if(t>tH&&!T.h){ T.h=t; ctx.events.push({kind:"lunge"}); }
    const k=T.h?t-T.h:-1;
    if(k>=0){ const v=2.2*Math.exp(-k/0.35); ctx.x-=v*dt; ctx.atk.x=Math.max(ctx.atk.x,ctx.x+0.7);
      const ph=(k/0.32)%1, s=Math.sin(ph*Math.PI*2), S=nStand(t,1); S.lLx=0.4*s; S.lRx=-0.4*s; S.kL=0.3+0.3*Math.max(0,s); S.kR=0.3+0.3*Math.max(0,-s); S.sp=-0.3*Math.exp(-k/0.4)+0.2; S.nx=-0.3*Math.exp(-k/0.3); S.aLx=-0.8; S.aRx=-0.7; S.aLz=0.45; S.aRz=0.4; S.eL=S.eR=0.7;
      ctx.moving=k<1.0; aim=sm5((k-1.0)/0.4); J=mix(S,nAim(t,1),aim); if(k<1.2) ctx.aimT=0; }
    hands(ctx,{aim,amp:tremor(ctx,dt,k<0||k>1.3),at:by.c.B.chest.getWorldPosition(new V3())});
    ctx.phase= t<t0?"on the aim": k<0?"it lunges": k<1?"knocked back on stumbling steps":"catches her balance · aim back up"; return fin(J); } };
// ---- knocked down: it hits her hard enough to take her off her feet. She goes over backward, lies dazed, rolls up and gets up
A.down={ start(ctx){ nStart(ctx,0); ctx.aimT=1.5; ctx.camX=0.0; },
  step(t,dt,ctx){ const T=ctx.T, t0=0.9, tH=1.3, D=1.2; let J=nAim(t,0.5), aim=1;
    const ax=t<t0?2.2:2.2-1.4*sm5((t-t0)/0.4); ctx.atk={x:ax,z:0,yaw:-Math.PI/2,J:t<t0?aStand(t):aReach(t,sm5((t-t0)/0.35))};
    if(t>tH&&!T.h){ T.h=t; ctx.events.push({kind:"down"}); }
    const k=T.h?t-T.h:-1;
    if(k>=0){ aim=0; ctx.atk.x=Math.max(ctx.atk.x,0.9); const fl={...NP.stumble()}; fl.aLx=fl.aRx=-1.8-0.5*sat(k/0.6); fl.aLz=fl.aRz=0.7;
      const st=NP.stumble(), sit=NG.sit(), lie=NG.lie(t,0.5); sit.aLx=sit.aRx=-0.9; sit.eL=sit.eR=0.4; sit.nx=0.35; lie.nx=0.4;
      const a1=Math.pow(sat(k/0.38),2), a2=Math.pow(sat((k-0.38)/0.3),2);   /* falling: each part speeds up as it goes */
      if(k<0.12) J=mix(nStand(t,1),st,sm5(k/0.12)); else if(k<0.38) J=mix(st,sit,a1); else if(k<0.68) J=mix(sit,lie,a2); else J=lie;
      if(k<0.5) ctx.x-=0.9*dt*(1-k/0.5);
      if(k>=D){ const u=sat((k-D-1.0)/2.2); J=u>0?NG.up(t,u):NG.lie(t,0.5); if(u>0.3) ctx.onLimbs=true;   /* up on hands, knees and feet: carried by them, not lying */ if(u>0.95) aim=sm5((u-0.95)/0.05); }
      ctx.moving=false; }
    hands(ctx,{aim,amp:tremor(ctx,dt,k<0),at:by.c.B.chest.getWorldPosition(new V3())});
    ctx.phase= t<t0?"on the aim": k<0?"it charges her": k<D?"her knees give · down hard on her back": k<D+1?"down · dazed":"rolls up and gets up"; return fin(J); } };
// ---- grabbed: it gets its hands on her shoulders and drives its face at her. Mash: she shoves it off, or it bites and she
// stumbles free
A.grab={ start(ctx){ nStart(ctx,0); ctx.out=outcome("oGrab","free","fail"); ctx.mash=0; ctx.aimT=1.5; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t0=0.9, tG=1.45; let J=nAim(t,0.5), aim=1;
    if(t>tG&&!T.g){ T.g=t; ctx.events.push({kind:"grab"}); }
    const g=T.g?t-T.g:-1, held=g>=0&&!T.free&&!T.bit;
    const ax= t<t0? 2.0 : t<tG? 2.0-1.35*sm5((t-t0)/0.5) : 0.62;
    ctx.atk={x:ax,z:0,yaw:-Math.PI/2,J:t<t0?aStand(t):aReach(t,1)};
    if(held){ ctx.mash=Math.min(1,ctx.mash+dt*(ctx.out==="free"?0.55:0.3)); ctx.qte=ctx.out==="free"?ctx.mash:Math.min(0.55,ctx.mash);
      const n=s=>noise(t*12,s)*0.12; const S=nStand(t,1); S.sp=-0.2+n(1); S.nx=-0.35+n(2); S.ny=0.3; S.lLx=-0.45; S.kL=0.4; S.lRx=0.3; S.kR=0.35; J=S; aim=0;
      ctx.atk.J.nx=-0.55+0.2*Math.sin(t*9); ctx.atk.J.hz=0.12; ctx.x-=dt*0.08; ctx.atk.x=ctx.x+0.62; ctx.moving=true;
      const chest=by.c.B.chest.getWorldPosition(new V3());
      ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
        armIK(runner,{side:"R",target:chest.clone().addScaledVector(P.right,0.1).add(new V3(0,0.05,0)),pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.18),w:1,tip:0.075});
        armIK(runner,{side:"L",target:chest.clone().addScaledVector(P.right,-0.1).add(new V3(0,0.12,0)),pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.18),w:1,tip:0.075});
        // its hands on her shoulders
        const sh=s=>runner.B["upperarm_"+s].getWorldPosition(new V3()); armIK(by.c,{side:"L",target:sh("R"),pole:by.c.R.armL.getWorldPosition(new V3()).add(new V3(0,-0.6,0)),w:1,tip:0.1}); armIK(by.c,{side:"R",target:sh("L"),pole:by.c.R.armR.getWorldPosition(new V3()).add(new V3(0,-0.6,0)),w:1,tip:0.1}); };
      ctx.post2=()=>propsPost(ctx,{aim:0}); ctx.H={aim:0}; }
    if(ctx.out==="free"&&ctx.mash>=1&&!T.free){ T.free=t; ctx.events.push({kind:"grabFree"}); }
    if(ctx.out==="fail"&&g>2.2&&!T.bit){ T.bit=t; ctx.events.push({kind:"bite"}); }
    if(T.free){ const k=t-T.free; ctx.qte=null; const fb=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.25,w:3.0}),dt,1.6,Math.PI/2-0.08)); ctx.atk.fall=fb; ctx.atk.x=ctx.x+0.62+0.5*sm5(k/0.5);
      aim=sm5((k-0.6)/0.4); J=mix(nStand(t,1),nAim(t,1),aim); ctx.x-=dt*0.3*(k<0.6?1:0); }
    if(T.bit){ const k=t-T.bit; if(k>0.6) ctx.qte=null; ctx.atk.J.nx=-0.7; ctx.atk.x=ctx.x+0.62+0.7*sm5((k-0.6)/0.4); const S=NP.stumble(); aim=sm5((k-1.3)/0.5); J=mix(S,nAim(t,1),aim); ctx.x-=dt*0.5*(k>0.5&&k<1.2?1:0); }
    if(!held) hands(ctx,{aim,amp:tremor(ctx,dt,!T.g||(t-(T.free||T.bit||t))>1.4),at:by.c.B.chest.getWorldPosition(new V3())});
    ctx.phase= t<t0?"on the aim": g<0?"it comes at her": held?"its hands on her shoulders · mash to shove it off": T.free?(t-T.free<0.6?"she shoves it off":"back on the aim"):(t-T.bit<0.6?"it bites":"she stumbles free");
    return fin(J); } };
// ---- death: hurt badly, one more hit. Her knees go, she drops the gun, folds onto her side; the light rolls away on the floor
A.death={ start(ctx){ nStart(ctx,0); ctx.aimT=1.5; },
  step(t,dt,ctx){ const T=ctx.T, t0=0.9, tH=1.3; let J=nAim(t,1), aim=1;
    const ax=t<t0?2.0:2.0-1.2*sm5((t-t0)/0.4); ctx.atk={x:ax,z:0,yaw:-Math.PI/2,J:t<t0?aStand(t):aReach(t,sm5((t-t0)/0.35))};
    if(t>tH&&!T.h){ T.h=t; ctx.events.push({kind:"dead"}); }
    const k=T.h?t-T.h:-1; let H={aim,amp:tremor(ctx,dt,k<0)+0.02,at:by.c.B.chest.getWorldPosition(new V3())};
    if(k>=0){ ctx.atk.x=Math.max(1.0,ctx.atk.x); aim=0; H={aim:0,gun:T.gd?"gone":"hand",light:T.ld?"gone":"hand"};
      const kn=NQknees(t), sl=sm5(k/0.5); J=mix(nStand(t,1),kn,sl);
      if(k>0.45&&!T.gd){ T.gd=t; ctx.events.push({kind:"dropGun"}); }
      if(k>0.75&&!T.ld){ T.ld=t; ctx.events.push({kind:"dropLight"}); }
      if(k>0.8){ const side=P0(); side.hd=HIP0()-0.13; side.hroll=-1.42; side.hp=0.35; side.sp=0.18; side.sroll=-0.1; side.nx=0.15; side.nz=-0.35; side.lLx=-0.85; side.kL=1.15; side.lRx=-0.3; side.kR=0.5; side.fL=side.fR=0.25; side.lLz=0.35; side.lRz=0.0; side.lRx=-0.55;   /* her legs a little apart, the top one drawn up, so they lie on each other rather than through */
          side.aRx=-1.3; side.aRz=0.2; side.eR=0.4; side.aLx=-0.55; side.aLz=0.15; side.eL=0.9;   /* on her right side, the under arm out ahead, the upper one fallen over her */
        const u=Math.pow(sat((k-0.8)/0.6),2); J=mix(kn,side,u); } }
    hands(ctx,H);
    ctx.phase= t<t0?"on the aim, shaking": k<0?"it lunges": k<0.5?"hit · her knees go": k<0.9?"the gun drops": k<2?"she folds onto her side":"dead · the light rolls away on the floor"; return fin(J); } };
function NQknees(t){ const J=NP.kneel(t); J.nx=0.6; J.aLx=-0.25; J.aRx=-0.15; J.aLz=0.18; J.aRz=0.16; J.eL=J.eR=0.3; return J; }

const ORDERS={pl:["idle","walk","run","turn","crouch","land","aim","aimwalk","fire","empty","reload","dodge","shove","flinch","stagger","down","grab","death"]};
const LEN={idle:7, walk:7.5, run:6.0, turn:4.0, crouch:6.6, land:5.6, aim:5.0, aimwalk:7.6, fire:5.2, empty:4.6, reload:9.0, dodge:4.4, shove:4.4, flinch:3.6, stagger:4.0, down:7.0, grab:5.6, death:6.0};
const NAMES={idle:"Scared idle",walk:"Cautious walk",run:"Panicked run",turn:"Startled turn",crouch:"Crouch",land:"Hard landing",aim:"Raise and aim",aimwalk:"Aimed walk",fire:"Fire",empty:"Empty click",reload:"Reload",dodge:"Dodge",shove:"Shove",flinch:"Flinch",stagger:"Stagger",down:"Knocked down",grab:"Grabbed",death:"Death"};
const DMG={shot:["SHOT","the kick throws her aim up"],click:["CLICK","empty"],dodge:["DODGE!","press E"],shove:["SHOVE","it goes down"],swipe:["NORAH −10","her arm is caught"],lunge:["NORAH −15","knocked back"],down:["NORAH −20","knocked down"],
  grab:["GRABBED","hands on her shoulders"],grabFree:["SHOVED OFF","it goes down"],bite:["NORAH −8","bitten"],dead:["NORAH −25","dead"],fumble:["FUMBLED","a round drops"],land:["HARD LANDING","a woozy beat"]};
const RCEV={ shot(e){ fireFx(); { const m=muzzleAt(); for(let i=0;i<3;i++){ const q=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0x9a9690,transparent:true,depthWrite:false})); q.position.copy(m); q.scale.setScalar(0.05); scene.add(q); puffs.push({m:q,t:0.1*i,v:new V3((Math.random()-.5)*0.15,0.12+Math.random()*0.1,(Math.random()-.5)*0.15),s:0.22}); } } shake=Math.max(shake,0.05); const c=tgtChest(); puffAt(c,0.4); BLOODsplat(c,5); },
  click(){ shake=Math.max(shake,0.02); }, dodge(){}, sprawl(){ puff(new V3(ctx.atk.x-0.8,0,0),1.2); }, shove(){ shake=Math.max(shake,0.08); },
  swipe(){ shake=Math.max(shake,0.12); BLOODsplat(runner.B.forearm_L.getWorldPosition(new V3()),4); }, lunge(){ shake=Math.max(shake,0.18); }, down(){ shake=Math.max(shake,0.22); },
  grab(){ shake=Math.max(shake,0.1); }, grabFree(){ shake=Math.max(shake,0.06); }, bite(){ shake=Math.max(shake,0.18); BLOODsplat(runner.B.neck.getWorldPosition(new V3()),8); },
  dead(){ shake=Math.max(shake,0.25); BLOODsplat(runner.B.chest.getWorldPosition(new V3()),10); },
  land(){ shake=Math.max(shake,0.12); puff(runner.group.position.clone(),1.2); },
  dropGun(){ const g=GUN.clone(); g.position.copy(GUN.position); g.quaternion.copy(GUN.quaternion); scene.add(g); GUN.visible=false; dropPiece(g,new V3(0.3,0.2,0.15),new V3(2,1,3)); PIECES[PIECES.length-1].big=true; },
  dropLight(){ LIGHT.parent.remove(LIGHT); scene.add(LIGHT); dropPiece(LIGHT,new V3(0.5,0.3,0.4),new V3(1,3,2),true); const p=PIECES[PIECES.length-1]; p.big=true; p.roll=true; },
  eject(){ GUN.updateMatrixWorld(true); for(const c of GUN.userData.rv.ch){ const p=c.cas.getWorldPosition(new V3()); shell(p,new V3((Math.random()-0.5)*0.3,-0.2-Math.random()*0.4,(Math.random()-0.5)*0.3)); } },
  round(){}, fumble(){ const L=palm("L"); shell(L.p,new V3(0.2,0.2,0.3)).material.color.set(0xc0a050); }, close(){ shake=Math.max(shake,0.02); } };
