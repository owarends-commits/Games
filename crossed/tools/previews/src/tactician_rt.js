// ================================================================ the Tactician (BCROSS): cowardly and malicious
// A man's body under a head nearly a metre across. Bold with two or more Crossed beside it, holds its upper hand with one,
// and alone it begrudgingly scurries out of her sight to find more, or hides at a doorway or a hallway turn to ambush her.
// Animations come from the Tactician preview, posed on the hidden rig like the Runner.
VMAP.tactician={key:"tactician",name:"Tactician",stance:"stand",p:"walker",h:[2.3,2.4],fw:[1.0,1.0],skin:"grey",hair:[0,0.1],long:0,clothes:"tee",fight:{}};
MDL_POOLS.tactician=k=>MODEL_LIB[k].g==="bcross/tactician"; MDL_DEFAULT_POOL.tactician="tactician";

const TAC=(()=>{
  const {P0,mix,nz,sat,ss}=RUN; const sm5=x=>{ x=sat(x); return x*x*x*(x*(x*6-15)+10); };
  const TW={stance:0.64,front:-0.3,back:0.3,high:-0.5,kLift:0.8};
  const CW={stance:0.58,front:-0.2,back:0.2,high:-0.42,kLift:1.0};            // the cowering scurry: short, quick steps
  // the planted knee bends just enough to keep the hips at landing height, so both feet meet the floor
  function levelKnee(lx,kLand,front){ const h=Math.cos(kLand/2)*Math.cos(front+kLand/2); let lo=0,hi=1.4; for(let i=0;i<20;i++){ const k=(lo+hi)/2; if(Math.cos(k/2)*Math.cos(lx+k/2)>h) lo=k; else hi=k; } return (lo+hi)/2; }
  function tStride(ph,P){ const st=P.stance;
    if(ph<st){ const u=ph/st; return {lx:P.front+(P.back-P.front)*u, f:-0.12*(1-sm5(u/0.18))-0.08*sm5((u-0.6)/0.4), plant:true, u}; }
    const u=(ph-st)/(1-st), up=sm5(u/0.5), dn=sm5((u-0.35)/0.65);
    return {lx:P.back+(P.high-P.back)*up+(P.front-P.high)*dn, k:P.kLift*Math.sin(Math.PI*sat(u))+0.1, f:-0.08+0.3*Math.sin(Math.PI*sat(u/0.7))-0.04*dn, plant:false}; }
  function legs(J,ph,P,bias){ const a=tStride(ph%1,P), b=tStride((ph+0.5)%1,P), kb=u=>bias*sm5(u/0.25);
    J.lLx=a.lx; J.fL=a.f; J.kL=a.plant?levelKnee(a.lx,0.1,P.front)+kb(a.u):a.k; J.lRx=b.lx; J.fR=b.f; J.kR=b.plant?levelKnee(b.lx,0.1,P.front)+kb(b.u):b.k; J.lLz=J.lRz=0; return J; }
  // braced stand: leaning back and to its right against the head's weight; the left hand comes up under the head (IK)
  function stand(t){ const J=P0(); J.hd=0.05; J.kL=J.kR=0.14; J.sp=-0.1+0.012*Math.sin(t*1.4); J.sroll=0.1; J.nz=0.1; J.nx=-0.05; J.aRx=0.05; J.aRz=0.16; J.eR=0.35; J.aLz=0.35; J.eL=0.45; return J; }
  function walk(ph,t){ const J=legs(stand(t),ph,TW,0.44), imp=Math.sin(Math.PI*sat((ph%0.5)/0.24)); J.hd=0.04+0.025*imp; J.nx+=0.05*imp; J.aRx=-0.25*Math.sin(ph*Math.PI*2); J.hyaw=0.06*Math.sin(ph*Math.PI*2); return J; }
  // the fearful scurry: hunched, knees knocking in, tiny frantic steps, both hands clutching the head, shivering all over,
  // throwing panicked glances back over its shoulder. Undignified on purpose.
  // crouched low with the hips sitting back and the chest curled upright, the head ducked down onto its shoulders, both hands
  // clutching it (IK), elbows tucked in front, knees knocking; tiny quick steps; it shivers all over and throws panicked glances back.
  function cower(ph,t,glance,still){ const J=P0(), sh=k=>nz(t*31,k)*0.04+Math.sin(t*47+k*1.7)*0.018;
    if(!still) legs(J,ph,CW,0.5); else { J.kL=0.5; J.kR=0.55; J.lLx=-0.22; J.lRx=0.05; }
    J.lLz=-0.07; J.lRz=-0.07; J.kL+=0.45+sh(1); J.kR+=0.45+sh(2); J.lLx-=0.25; J.lRx-=0.25; J.fL+=0.2; J.fR+=0.2;
    J.hd=0.24+(still?0.015*Math.sin(t*9):0.025*Math.abs(Math.sin(ph*Math.PI*2))); J.hp=0.3; J.sp=-0.18+sh(3); J.sroll=0.03+sh(4); J.syaw=0.05*Math.sin(ph*Math.PI*2)+sh(5);
    J.nx=0.18+sh(6); J.nz=sh(7); J.aLx=-1.2+sh(8); J.aLz=0.3; J.eL=1.9; J.aRx=-1.2+sh(9); J.aRz=0.3; J.eR=1.9;
    J.ny=1.05*glance; J.hdy=0.45*glance; J.syaw+=0.3*glance; return J; }
  function crouchWait(t){ const J=P0(), b=Math.sin(t*1.7)*0.02; J.hd=0.3; J.hp=0.3; J.sp=0.35+b; J.kL=0.95; J.kR=1.05; J.lLx=-0.55; J.lRx=-0.35; J.fL=0.25; J.fR=0.3; J.nx=0.05; J.aRx=-0.3; J.aRz=0.25; J.eR=0.9; J.aLz=0.35; J.eL=0.45; return J; }
  function sidestep(J,u,dir){ const lead=dir>0?"R":"L", trail=dir>0?"L":"R", a=Math.sin(sat(u/0.5)*Math.PI), b=Math.sin(sat((u-0.5)/0.5)*Math.PI);
    J["l"+lead+"z"]+=0.22*a; J["k"+lead]+=0.35*a; J["l"+trail+"z"]+=0.12*b; J["k"+trail]+=0.3*b; return J; }
  // the headbutt: rear (w 0..1), drop (u 0..1), and what the weight does after
  function rear(t,w){ const J=stand(t); J.sp=-0.1-0.28*w; J.nx=-0.05-0.32*w; J.kL+=0.12*w; J.kR+=0.12*w; J.aRx=0.35*w; J.aRz=0.35; J.eR=0.6; return J; }
  function drop(t,u){ const J=stand(t); J.sp=-0.38+1.45*u; J.hp=0.42*u; J.nx=-0.37+0.95*u; J.kL+=0.12+0.38*u; J.kR+=0.12+0.38*u; J.hd=0.05+0.2*u; J.aRx=0.35-1.2*u; J.aLx=-0.6*u; J.aLz=0.4; J.eL=0.6; J.eR=0.6; return J; }
  function stagger(t,s,u0){ const u=u0*(1-sm5((s-0.5)/0.7)), J=drop(t,u), st=sm5(s/0.45); if(s<0.45){ J.lRx-=0.45*Math.sin(st*Math.PI); J.kR+=0.5*Math.sin(st*Math.PI); } J.nx+=0.15*Math.sin(sat(s/0.4)*Math.PI); return J; }
  function onHands(t,s){ const dn=sm5(s/0.35), up=sm5((s-1.3)/0.8), w=dn*(1-up), J=drop(t,1);
    J.sp=0.95-0.1*w-1.0*up; J.hp=0.42+0.1*w-0.4*up; J.nx=0.35-0.3*w-0.3*up; J.hd=0.25+0.12*w-0.2*up; J.kL+=0.4+0.5*w-0.4*up; J.kR+=0.4+0.5*w-0.4*up; J.lLx-=0.3*w; J.lRx-=0.3*w;
    J.aLx=-1.3*w-0.6*(1-w); J.aRx=-1.3*w+0.35*(1-w); J.eL=J.eR=0.25*w+0.6*(1-w); J.aLz=J.aRz=0.15; return J; }
  function reach(t,w){ const J=stand(t); J.aRx=-1.35*w; J.aRz=0.1; J.eR=0.35+0.2*(1-w); J.sp=-0.1+0.12*w; J.syaw=-0.2*w; return J; }
  function pullIn(t,k){ const J=reach(t,1), n=s=>nz(t*14,s)*0.03; J.eR=0.9+0.4*k+n(1); J.aRx=-1.1+n(2); J.sp=-0.1-0.25*k; J.nx=-0.1-0.3*k; J.kL+=0.1; J.kR+=0.1; return J; }
  function stiff(t){ const J=P0(); J.aLx=-1.4; J.aLz=0.7; J.eL=0.3; J.aRx=-1.4; J.aRz=0.7; J.eR=0.3; J.nx=-0.5; J.kL=J.kR=0.04; return J; }
  function lying(t){ const J=stiff(t); J.aLx=-2.0+0.08*Math.sin(t*3); J.aRx=-2.0+0.08*Math.sin(t*2.6); J.nx=-0.55+0.05*Math.sin(t*2); return J; }
  function flinch(t,f){ const J=stand(t); J.sp-=0.25*f; J.nx-=0.2*f; J.aRx=-0.6*f; J.eR=1.2*f; return J; }
  // emboldened (two or more Crossed with it): it straightens up and carries the head without a hand, chest out, shoulders
  // back, arms loose and ready; walks with a long stride and can run flat out
  const TB={stance:0.6,front:-0.45,back:0.45,high:-0.75,kLift:1.0};
  function boldStand(t){ const J=P0(); J.hd=0.02; J.kL=J.kR=0.1; J.sp=0.04+0.015*Math.sin(t*1.3); J.hp=-0.04; J.nx=-0.14; J.sroll=0.04; J.nz=0.06;
    J.aLx=-0.1+0.04*Math.sin(t*1.1); J.aLz=0.28; J.eL=0.45; J.aRx=-0.1+0.04*Math.sin(t*1.2+1); J.aRz=0.28; J.eR=0.45; J.lLz=0.03; J.lRz=0.03; return J; }
  function boldWalk(ph,t){ const J=legs(boldStand(t),ph,TB,0.35), s=Math.sin(ph*Math.PI*2), imp=Math.sin(Math.PI*sat((ph%0.5)/0.24));
    J.hd=0.03+0.03*imp; J.aLx=0.55*s-0.1; J.aRx=-0.55*s-0.1; J.eL=0.5+0.2*Math.max(0,-s); J.eR=0.5+0.2*Math.max(0,s); J.hyaw=0.1*s; J.syaw=-0.16*s; J.sp+=0.06; return J; }
  function boldRun(ph,t){ const J=RUN.sprintPose(ph,0); J.sp=0.24+0.04*Math.sin(ph*Math.PI*4); J.nx=-0.3; J.hp=0.08; return J; }
  return {P0,mix,sat,ss,sm5,TW,CW,boldStand,boldWalk,boldRun,stand,walk,cower,crouchWait,sidestep,rear,drop,stagger,onHands,reach,pullIn,stiff,lying,flinch};
})();

// ---------------------------------------------------------------- the rig: two-bone arm IK on the hidden rig
function tacRotWorld(o,qw){ o.updateMatrixWorld(true); const pq=o.parent.getWorldQuaternion(new THREE.Quaternion()).invert(), wq=o.getWorldQuaternion(new THREE.Quaternion()); o.quaternion.copy(pq.multiply(qw.clone().multiply(wq))); o.updateMatrixWorld(true); }
function tacArmIK(e,side,T,pole,w,tip){ const V=THREE.Vector3, P=e.P, sh=P["arm"+side], el=P["elbow"+side], wr=P["wrist"+side]; if(!sh||!el||!wr||w<=0.01) return; e.root.updateMatrixWorld(true);
  const q0=sh.quaternion.clone(), e0=el.rotation.x, S=sh.getWorldPosition(new V()), E=el.getWorldPosition(new V()), W=wr.getWorldPosition(new V());
  const L1=S.distanceTo(E), wl=E.distanceTo(W), L2=wl*(1+(tip||0)), d=clamp(T.distanceTo(S),Math.abs(L1-L2)+0.02,L1+L2-0.002);
  const interior=Math.acos(clamp((L1*L1+L2*L2-d*d)/(2*L1*L2),-1,1)); el.rotation.x=-(Math.PI-interior); el.updateMatrixWorld(true);
  const tipW=el.localToWorld(wr.position.clone().multiplyScalar(1+(tip||0))); tacRotWorld(sh,new THREE.Quaternion().setFromUnitVectors(tipW.sub(S).normalize(),T.clone().sub(S).normalize()));
  const ax=T.clone().sub(S).normalize(), ve=el.getWorldPosition(new V()).sub(S), vp=pole.clone().sub(S); ve.addScaledVector(ax,-ve.dot(ax)); vp.addScaledVector(ax,-vp.dot(ax));
  if(ve.lengthSq()>1e-8&&vp.lengthSq()>1e-8){ let a=ve.angleTo(vp); if(ve.clone().cross(vp).dot(ax)<0) a=-a; tacRotWorld(sh,new THREE.Quaternion().setFromAxisAngle(ax,a)); }
  if(w<1){ sh.quaternion.copy(q0.slerp(sh.quaternion.clone(),w)); el.rotation.x=e0+(el.rotation.x-e0)*w; sh.updateMatrixWorld(true); }
  (e.tIkErr||(e.tIkErr={}))[side]=+(el.localToWorld(wr.position.clone().multiplyScalar(1+(tip||0))).distanceTo(T)).toFixed(3); }
// the head: its centre and its points, read off the model's head bone (one frame behind the rig, which is plenty)
function tacHead(e){ const S=e.skin; if(!S||!S.model||!S.B||!S.B.head) return null;
  if(!e.tHead){ let mesh; S.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); if(!mesh) return null; const g=mesh.geometry, si=g.attributes.skinIndex, sw=g.attributes.skinWeight, pos=g.attributes.position;
    const hb=mesh.skeleton.bones.indexOf(S.B.head); if(hb<0) return null; const M=new THREE.Matrix4().multiplyMatrices(mesh.skeleton.boneInverses[hb],mesh.bindMatrix), v=new THREE.Vector3(), c=new THREE.Vector3(), pts=[]; let n=0;
    for(let i=0;i<pos.count;i++){ if(si.getX(i)===hb&&sw.getX(i)>0.5){ v.fromBufferAttribute(pos,i).applyMatrix4(M); c.add(v); n++; if(i%5===0) pts.push(v.clone()); } }
    if(!n) return null; e.tHead={c:c.divideScalar(n),pts}; }
  S.B.head.updateWorldMatrix(true,false); return {c:e.tHead.c.clone().applyMatrix4(S.B.head.matrixWorld), low:()=>{ let lo=1e9; const v=new THREE.Vector3(); for(const p of e.tHead.pts){ v.copy(p).applyMatrix4(S.B.head.matrixWorld); lo=Math.min(lo,v.y); } return lo; }}; }
// the head hitbox grows to the head it actually has
function tacFitHitbox(e){ if(e.tHitFit||!e.P.hbHead) return; const h=tacHead(e); if(!h) return; const hb=e.P.hbHead, par=hb.parent; par.updateMatrixWorld(true);
  const ws=par.getWorldScale(new THREE.Vector3()), p=hb.geometry.parameters, s=(e.skin.fit&&e.skin.fit.ms)||1;
  hb.position.copy(par.worldToLocal(h.c.clone())); hb.scale.set(0.82*s/(p.width*ws.x),0.8*s/(p.height*ws.y),0.82*s/(p.depth*ws.z)); e.tHitFit=true; }

// ---------------------------------------------------------------- choke points: doorways and hallway turns
function tacChokes(){ if(world.tacChokes) return world.tacChokes; const out=[], free=(x,z)=>!collide(new THREE.Vector3(x,0,z),0.35);
  for(const d of world.doors){ if(d.broken) continue; const ux=Math.cos(d.base), uz=Math.sin(d.base), cx=d.hx+ux*d.width/2, cz=d.hz+uz*d.width/2, nx=-uz, nz=ux;
    for(const sn of [1,-1]) for(const su of [1,-1]){ const x=cx+nx*0.75*sn+ux*(d.width/2+0.45)*su, z=cz+nz*0.75*sn+uz*(d.width/2+0.45)*su; if(free(x,z)) out.push({kind:"door",x,z,fx:cx,fz:cz}); } }
  const B=world.bounds, dirs=[[1,0],[-1,0],[0,1],[0,-1]];
  for(let x=B.x0+1;x<B.x1-0.5;x+=1) for(let z=B.z0+1;z<B.z1-0.5;z+=1){ if(!free(x,z)) continue;
    const open=dirs.map(([dx,dz])=>lineOfSight(x,z,x+dx*1.8,z+dz*1.8,false,true)); const n=open.filter(Boolean).length;
    if(n===2 && (open[0]||open[1]) && (open[2]||open[3])){ const near=dirs.filter((d,i)=>!open[i]).every(([dx,dz])=>!lineOfSight(x,z,x+dx*1.3,z+dz*1.3,false,true));
      if(near){ const o=dirs.filter((d,i)=>open[i]); out.push({kind:"turn",x,z,fx:x+(o[0][0]+o[1][0])*1.2,fz:z+(o[0][1]+o[1][1])*1.2}); } } }
  return world.tacChokes=out; }
// a point out of her sight; regrouping, it leans toward the nearest Crossed
/* how close the straight run from a to b passes her */
function tacPass(ax,az,bx,bz){ const pp=player.pos, dx=bx-ax, dz=bz-az, L=dx*dx+dz*dz||1, u=clamp(((pp.x-ax)*dx+(pp.z-az)*dz)/L,0,1); return Math.hypot(ax+dx*u-pp.x,az+dz*u-pp.z); }
function tacHideFrom(e,toward){ const pp=player.pos; let best=null, bs=-1e9, far=null, fs=-1e9;
  const cand=[]; for(let i=0;i<48;i++){ const a=i/16*Math.PI*2, r=2.5+Math.floor(i/16)*4.5+(i%3)*0.8; cand.push([e.pos.x+Math.sin(a)*r,e.pos.z+Math.cos(a)*r,r]); }
  for(const c of tacChokes()) cand.push([c.x,c.z,Math.hypot(c.x-e.pos.x,c.z-e.pos.z)]);
  const B=world.bounds; for(const [x,z,r] of cand){ if(r>22||x<B.x0+0.5||x>B.x1-0.5||z<B.z0+0.5||z>B.z1-0.5) continue; const p=new THREE.Vector3(x,0,z); if(collide(p,0.35)||Math.hypot(p.x-x,p.z-z)>0.05) continue; const dp=Math.hypot(x-pp.x,z-pp.z); const ds=Math.hypot(e.pos.x-pp.x,e.pos.z-pp.z), lim=Math.min(2.5,ds*0.8), rt=route(e.pos.x,e.pos.z,x,z), wx=rt&&!rt.direct?rt.x:x, wz=rt&&!rt.direct?rt.z:z;
    if(tacPass(e.pos.x,e.pos.z,wx,wz)<lim || tacPass(wx,wz,x,z)<lim) continue;   /* by the way it would actually go */   /* a coward doesn't run past her */
    const hid=!lineOfSight(pp.x,pp.z,x,z,false), s=dp*0.6-r*0.3-(toward?Math.hypot(x-toward.pos.x,z-toward.pos.z)*0.8:0);
    if(hid && s>bs){ bs=s; best={x,z}; } if(!hid && dp>fs){ fs=dp; far={x,z}; } }
  return best||far; }   /* nowhere hidden: as far from her as it can get */

// ---------------------------------------------------------------- the brain
Enemy.prototype.brainTactician=function(dt,dist,want,toP){
  const C=CFG.tactician, pp=player.pos; this.rDirect=false; this.rNoPush=false;
  const los=lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,false); this.sees=!player.dead&&los&&dist<C.sight;
  if(this.sees){ this.lastKnown={x:pp.x,z:pp.z}; this.lostT=0; } else this.lostT=(this.lostT||0)+dt;
  const seen=!player.dead&&los&&dist<25, tc=this.tc||(this.tc={atk:1.5,ctr:0,wait:0,think:0}); tc.atk-=dt; tc.ctr-=dt; tc.think-=dt; this.tt=(this.tt||0)+dt;
  const go=s=>{ this.state=s; this.tt=0; this.t=0; this.tHit=false; this.tGoal=null; }, st=this.state;
  // who is with it
  let allies=0, near=null, nd=1e9; const set=new Set();
  const ar=C.allyRange*(this.tConf==="bold"?2:this.tConf==="upper"?1.5:1);   /* once its nerve is up, the pack only has to be roughly with it */
  for(const o of enemies){ if(o===this||o.dead||o.type==="dummy") continue; const d=Math.hypot(o.pos.x-this.pos.x,o.pos.z-this.pos.z); if(d<ar){ allies++; set.add(o); } if(d<nd&&d<C.searchRange){ nd=d; near=o; } }
  let fell=false; for(const o of this.tSet||[]) if(o.dead) fell=true; this.tSet=set; this.tAllies=allies; this.tConf= allies>=2?"bold":allies===1?"upper":"alone";
  if(fell && allies===0 && !["ttopple","tdown","tgetup","grab","tsmash","tcounter"].includes(st) && rng()<C.allyDeathBackoff){ log(`${this.name} watches its last ally drop and loses its nerve`,"#c0a0ff"); go("tbegrudge"); return; }
  if(st==="stagger"||st==="recover"){ this.desired={x:0,z:0}; if(st==="recover"&&this.tt>0.4) go("chase"); return; }
  // it eases a closed door open rather than battering it; a locked one rules that way out. Wedged for a second: pick again.
  const tacGo=(x,z,sp)=>{ this.mvT=(this.mvT||0)-dt;   /* its own steering: quick to turn, easing in to each waypoint so it doesn't overshoot a doorway */
    if(this.mvT<=0||!this.mvGoal||this.mvGoal.tx!==x||this.mvGoal.tz!==z){ this.mvT=0.3; const g=route(this.pos.x,this.pos.z,x,z); this.mvGoal={x:g.direct?x:g.x,z:g.direct?z:g.z,tx:x,tz:z,direct:g.direct}; }
    const G=this.mvGoal, dw=Math.hypot(G.x-this.pos.x,G.z-this.pos.z), want=Math.atan2(G.x-this.pos.x,G.z-this.pos.z), off=Math.abs(wrapA(want-this.yaw));
    this.goalPt=G; this.steer(dt,want,sp*Math.min(1,0.35+dw/1.2)*(off>1.2?0.35:1),C.turn*2); };
  const via=(x,z,sp)=>{ tacGo(x,z,sp); const g=this.mvGoal; if(g){ const d=blockingDoor(this.pos.x,this.pos.z,g.x,g.z);
      if(d && Math.hypot(d.hx-this.pos.x,d.hz-this.pos.z)<2.2){ if(d.locked){ (this.tBad||(this.tBad=new Set())).add(this.tSpot||this.tGoal); this.tSpot=null; this.tGoal=null; }
        else if(d.target<0.5){ d.target=1.45; d.speed=1.6; SFX.creak(new THREE.Vector3(d.hx,1,d.hz)); makeNoise(d.hx,d.hz,CFG.stealth.doorNoise*0.5,"door"); } } }
    if(Math.hypot(this.vel.x,this.vel.z)<0.12){ this.tWedge=(this.tWedge||0)+dt; if(this.tWedge>1.2){ this.tWedge=0; if(this.tGoal){ (this.tBad||(this.tBad=new Set())).add(this.tGoal); this.tGoal=null; this.tc.think=0; } } } else this.tWedge=0; };
  const cowerTo=(x,z)=>{ this.tAnim="cower"; via(x,z,C.cower); };
  const bold=this.tConf==="bold";
  const sneakTo=(x,z,far)=>{ if(bold&&far){ this.tAnim="run"; via(x,z,C.boldRun); } else { this.tAnim="walk"; via(x,z,bold?C.boldWalk:C.walk); } };
  switch(st){
  case "theadbutt": { this.desired={x:0,z:0}; this.turnTo(want,dt,C.turn*(this.tPh==="drop"?0.2:1));
    if(this.tPh==="close"){ if(dist>C.attackRange && this.tt<0.9){ this.tAnim="walk"; this.steer(dt,want,(this.tConf==="bold"?C.boldWalk*1.3:C.walk*1.6),C.turn); return; } this.tPh="rear"; this.tt=0; }
    if(this.tPh==="rear"){ if(this.tt>=(this.tQuick?0.25:0.45)){ this.tPh="drop"; this.tt=0; } return; }
    if(this.tPh==="drop"){ if(!this.tHit && this.tt>0.12){ if(dist<C.attackRange+0.35 && this.facing(toP)>0.5){ this.tHit=true; this.tPh="stagger"; this.tt=0; this.tU=TAC.sm5(this.tt/0.3)+0.6;
          if(runnerHitNorah(this,C.headbuttDamage,"headbutt",C.headbuttPush,C.headbuttDown)){ shake=Math.max(shake,0.4); SFX.slam(this.pos); log(`${this.name} brings its head down on her`,"#ff7070"); } return; } }
      if(this.tt>=0.32){ this.tPh="hands"; this.tt=0; SFX.slam(this.pos); shake=Math.max(shake,0.15); log(`${this.name} misses, the head takes it down onto its hands`,"#9ed08a"); } return; }
    if(this.tPh==="stagger"){ if(this.tt<0.45){ const f=new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)); this.desired={x:f.x*0.9,z:f.z*0.9}; } if(this.tt>1.6){ tc.atk=C.headbuttCool; go("chase"); } return; }
    if(this.tPh==="hands"){ if(this.tt>2.1){ tc.atk=C.headbuttCool; go("chase"); } return; } return; }
  case "tcounter": { this.desired={x:0,z:0}; this.rNoPush=true;
    if(this.tt<0.35){ const r=new THREE.Vector3(-Math.cos(this.yaw),0,Math.sin(this.yaw)).multiplyScalar(this.tSide*1.7); this.desired={x:r.x,z:r.z}; this.turnTo(want,dt,C.turn); return; }
    if(this.tt<0.5){ this.turnTo(want,dt,C.turn); if(dist>1.7){ go("chase"); } return; }
    if(!this.tHit && this.tt>=0.8){ this.tHit=true; const a=this.yaw+this.tSide*1.6, dir=new THREE.Vector3(Math.sin(a),0,Math.cos(a));
      if(!dodgeSaves()){ player.hurt(C.throwDamage,this,"throw"); if(!player.dead){ player.vel.copy(dir.multiplyScalar(C.throwSpeed)); player.stumble=C.throwDown; player.downT=C.throwDown; player.thrown={t:0.8,last:C.throwSpeed,hit:false,by:this}; }
        shake=Math.max(shake,0.45); SFX.slam(null); log(`${this.name} slips her shove, catches her arm and throws her`,"#ff7070"); } }
    if(this.tt<0.9) this.yaw+=this.tSide*dt*2.2; if(this.tt>1.7){ tc.ctr=C.counterCool; go("chase"); } return; }
  case "grab": { this.rNoPush=true; this.desired={x:0,z:0}; this.vel.set(0,0,0);
    const f=new THREE.Vector3(pp.x-this.pos.x,0,pp.z-this.pos.z); if(f.lengthSq()<1e-4) f.set(Math.sin(this.yaw),0,Math.cos(this.yaw)); f.normalize(); this.yaw=Math.atan2(f.x,f.z);
    if(dist>C.holdGap){ player.pos.addScaledVector(f,-Math.min(dist-C.holdGap,1.6*dt)); collide(player.pos,0.3); }   /* it hauls her in to the head */
    if(!(player.grabbed&&player.grabbed.by===this)) go("chase"); return; }
  case "tsmash": { this.desired={x:0,z:0}; this.rNoPush=true;
    if(!this.tHit && this.tt>=0.32){ this.tHit=true; if(runnerHitNorah(this,C.smashDamage,"point-blank headbutt",C.headbuttPush*0.6,C.headbuttDown*1.4)){ shake=Math.max(shake,0.5); SFX.slam(this.pos); log(`${this.name} drives its head into her face`,"#ff5050"); } }
    if(this.tt>1.5) go(this.tConf==="alone"?"tflee":"chase"); return; }
  case "tstun": { const b=new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)).multiplyScalar(this.tt<0.5?-1.0:0); this.desired={x:b.x,z:b.z}; if(this.tt>C.freedStun) go(this.tConf==="alone"?"tflee":"chase"); return; }
  case "ttopple": { this.desired={x:0,z:0}; this.vel.set(0,0,0); const S=this.tS; const h=tacHead(this);
    if(!S.done && S.th>0.6 && h && h.low()<=0.03+S.w*0.017){ S.done=true; S.w=0; }   /* read a frame late: allow for this frame's turn */        /* the back of the head reaches the floor: it props it there */
    if(!S.done){ S.w+=1.5*9.8/2.2*Math.sin(S.th)*dt; S.th+=S.w*dt; if(S.th>=1.5){ S.th=1.5; S.done=true; } }
    this.tRise=-S.th; if(S.done && !this.tLanded){ this.tLanded=true; this.tt=0; SFX.slam(this.pos); shake=Math.max(shake,0.3); log(`${this.name} goes over backward, flat out`,"#9ed08a"); }
    if(this.tLanded && this.tt>C.toppleStun){ go("tgetup"); } return; }
  case "tgetup": { this.desired={x:0,z:0}; const u=TAC.ss(this.tt/1.1); this.tRise=-this.tS.th*(1-u); if(this.tt>1.2){ this.tRise=0; go(this.tConf==="alone"?"tflee":"tbackoff"); } return; }
  case "tbegrudge": { this.desired={x:0,z:0}; this.turnTo(want,dt,C.turn*0.5); if(this.tt>0.9) go("tflee"); return; }
  case "tbackoff": { if(this.tConf==="alone"&&this.tt>0.4){ go("tflee"); return; }
    const away=new THREE.Vector3(this.pos.x-pp.x,0,this.pos.z-pp.z).normalize(); this.turnTo(want,dt,C.turn);
    if(this.tt<this.tBackT){ const sp=this.tConf==="alone"?C.cower:C.walk*1.3; this.desired={x:away.x*sp,z:away.z*sp}; this.tAnim=this.tConf==="alone"?"cower":"back"; return; }
    if(this.tt<this.tBackT+2.2){ const side=new THREE.Vector3(-away.z,0,away.x).multiplyScalar(this.tSide), g=side.multiplyScalar(C.walk); this.desired={x:g.x,z:g.z}; this.tAnim="walk"; return; }
    go("chase"); return; }
  case "tflee": { // begrudging and afraid: out of her sight first, then to the nearest Crossed it can find, or to a choke point to wait
    if(allies>=1){ go("chase"); return; }
    if(!this.tGoal || tc.think<=0 || (seen && Math.hypot(this.tGoal.x-this.pos.x,this.tGoal.z-this.pos.z)<0.8)){ tc.think=1.2; this.tGoal= seen? tacHideFrom(this,near) : near? {x:near.pos.x,z:near.pos.z} : null; }
    if(!near && !seen){ go("thide"); return; }
    if(!this.tGoal){ const aw=new THREE.Vector3(this.pos.x-pp.x,0,this.pos.z-pp.z).normalize(), q=this.pos.clone().addScaledVector(aw,4); collide(q,0.35); this.tGoal={x:q.x,z:q.z}; }   /* nowhere better: just away from her */
    if(seen) cowerTo(this.tGoal.x,this.tGoal.z); else if(near && tacPass(this.pos.x,this.pos.z,near.pos.x,near.pos.z)>2.5) sneakTo(near.pos.x,near.pos.z); else if(near){ go("thide"); } else { this.desired={x:0,z:0}; this.tAnim="cowerStill"; } return; }
  case "thide": { if(allies>=1){ go("chase"); return; } if(near && !seen && tacPass(this.pos.x,this.pos.z,near.pos.x,near.pos.z)>2.5){ go("tflee"); return; }
    if(!this.tSpot){ const bad=this.tBad||(this.tBad=new Set()), cs=tacChokes().filter(c=>!bad.has(c) && !collide(new THREE.Vector3(c.x,0,c.z),0.35) && !lineOfSight(pp.x,pp.z,c.x,c.z,false) && Math.hypot(c.x-pp.x,c.z-pp.z)>4 && c!==this.tLastSpot); let best=null,bd=1e9;
      for(const c of cs){ const d=Math.hypot(c.x-this.pos.x,c.z-this.pos.z); if(d<bd&&d<30){ bd=d; best=c; } } this.tSpot=best||null; if(!best){ const h=tacHideFrom(this,null); this.tSpot=h?{x:h.x,z:h.z,fx:pp.x,fz:pp.z,kind:"spot"}:null; } }
    if(!this.tSpot){ this.desired={x:0,z:0}; this.tAnim="cowerStill"; return; }
    const toSpot=Math.hypot(this.tSpot.x-this.pos.x,this.tSpot.z-this.pos.z);
    if(toSpot>0.5){ /* wedged (a door leaf, a chair): close enough will do, otherwise try another spot */
      if(Math.hypot(this.vel.x,this.vel.z)<0.12){ this.tStuck=(this.tStuck||0)+dt; if(this.tStuck>0.8){ this.tStuck=0; if(toSpot>1.1){ (this.tBad||(this.tBad=new Set())).add(this.tSpot); this.tSpot=null; return; } } else { if(seen) cowerTo(this.tSpot.x,this.tSpot.z); else sneakTo(this.tSpot.x,this.tSpot.z); return; } }
      else { this.tStuck=0; if(seen) cowerTo(this.tSpot.x,this.tSpot.z); else sneakTo(this.tSpot.x,this.tSpot.z); return; } }
    log(`${this.name} presses itself in by the ${this.tSpot.kind==="door"?"doorway":this.tSpot.kind==="turn"?"turn in the hall":"wall"} to wait for her`,"#c0a0ff"); go("tambush"); return; }
  case "tambush": { this.desired={x:0,z:0}; if(allies>=1){ this.tSpot=null; go("chase"); return; }
    const S2=this.tSpot; if(S2) this.turnTo(Math.atan2(S2.fx-this.pos.x,S2.fz-this.pos.z),dt,C.turn*0.4);
    if(this.sees && dist<C.ambushRange && tc.atk<=0){ tc.atk=C.headbuttCool; this.tLastSpot=this.tSpot; this.tSpot=null; this.yaw=want;
      if(rng()<C.ambushGrab && !player.grabbed){ if(player.grab(this,{dmg:C.grabDamage,how:"collar pull"})){ go("grab"); shake=Math.max(shake,0.25); log(`${this.name} lunges from the ${S2&&S2.kind==="door"?"doorway":"corner"} and hauls her in by the collar`,"#ff7070"); return; } }
      go("theadbutt"); this.tPh="rear"; this.tQuick=true; log(`${this.name} springs from the ${S2&&S2.kind==="door"?"doorway":"corner"}, head first`,"#ff7070"); return; }
    if(seen && dist>3 && dist<14 && player.vel.lengthSq()<9){ const pf=new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw)); if(pf.dot(new THREE.Vector3(-toP.x,0,-toP.z))>0.8 && this.tt>0.6){ this.tLastSpot=this.tSpot; this.tSpot=null; log(`${this.name} is spotted and scurries off`,"#9ed08a"); go("tflee"); } }
    this.tAnim="crouch"; return; }
  default: { if(st!=="chase") go("chase");
    if(player.dead){ this.desired={x:0,z:0}; this.tAnim="stand"; return; }
    if(this.tConf==="alone"){ go("tbegrudge"); return; }
    if(!this.sees){ if(this.lastKnown && Math.hypot(this.lastKnown.x-this.pos.x,this.lastKnown.z-this.pos.z)>0.8) sneakTo(this.lastKnown.x,this.lastKnown.z,Math.hypot(this.lastKnown.x-this.pos.x,this.lastKnown.z-this.pos.z)>C.boldRunDist); else { this.desired={x:0,z:0}; this.tAnim="stand"; } return; }
    this.turnTo(want,dt,C.turn); tc.wait+=dt;
    const opening = player.reloading>0 || player.stumble>0 || player.downT>0 || (player.grabbed&&player.grabbed.by!==this) || new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw)).dot(new THREE.Vector3(-toP.x,0,-toP.z))<0.2;
    const impatient = this.tConf==="bold" ? tc.wait>C.boldWait : tc.wait>C.boldWait*2.2;
    if(tc.atk<=0 && dist<3.6 && (opening||impatient) && this.facing(toP)>0.6){ tc.wait=0; go("theadbutt"); this.tPh="close"; this.tQuick=false; log(`${this.name} sees an opening`,"#ffb070"); return; }
    const hold=C.holdDist*(this.tConf==="bold"?0.85:1);
    if(dist>hold+0.5){ sneakTo(pp.x,pp.z,dist>C.boldRunDist); return; }   /* emboldened: it runs her down */
    if(dist<hold-0.6){ const b=new THREE.Vector3(-toP.x,0,-toP.z).multiplyScalar(C.walk*0.8); this.desired={x:b.x,z:b.z}; this.tAnim="back"; return; }
    // studies her, mirroring her side steps
    const side=new THREE.Vector3(-toP.z,0,toP.x), lat=player.vel.x*side.x+player.vel.z*side.z; const m=clamp(lat*0.8,-C.walk,C.walk);
    this.desired={x:side.x*m,z:side.z*m}; this.tAnim= Math.abs(m)>0.15?"mirror":"study"; this.tMirror=Math.sign(m); }
  }
};
// her shove at it: it reads it, slips it and counters (unless it's alone and afraid)
Enemy.prototype.tacCounter=function(){ const C=CFG.tactician; if(this.dead||this.tConf==="alone"||(this.tc&&this.tc.ctr>0)||["ttopple","tdown","tgetup","grab","tsmash","tcounter","theadbutt","stagger"].includes(this.state)) return false;
  if(rng()>C.counterChance) return false; this.state="tcounter"; this.tt=0; this.t=0; this.tHit=false; this.tSide=rng()<0.5?1:-1; log(`${this.name} reads the shove and slips it`,"#ffb070"); return true; };
// shot: a head shot can topple it; otherwise it may back off, more readily the fewer Crossed are with it
Enemy.prototype.tacHurt=function(z,dir){ const C=CFG.tactician; if(["ttopple","tgetup"].includes(this.state)) return;
  if(z==="head" && rng()<C.headTopple){ this.state="ttopple"; this.tt=0; this.tS={th:0.06,w:1.0,done:false}; this.tLanded=false; this.tNoStag="the head's weight takes it over backward"; if(player.grabbed&&player.grabbed.by===this) joinedRelease(player.grabbed,false), player.grabbed=null; return; }
  const p= this.tConf==="bold"?C.backoffBold : this.tConf==="upper"?C.backoffOne : 1;
  if(rng()<p && !["grab","tsmash"].includes(this.state)){ this.state="tbackoff"; this.tt=0; this.tBackT=1.2+rng()*1.0; this.tSide=rng()<0.5?1:-1; this.tNoStag= this.tConf==="alone"?"cowers and scurries back":"backs off out of reach"; } };
Enemy.prototype.tacFreed=function(dir){ this.state="tstun"; this.tt=0; this.stagger=0; log(`${this.name} reels back, clutching its head`,"#9ed08a"); };
Enemy.prototype.tacSmash=function(){ this.state="tsmash"; this.tt=0; this.tHit=false; player.vel.set(0,0,0); log(`${this.name} rears its head back over her`,"#ff5050"); };

// ---------------------------------------------------------------- the pose for each state
Enemy.prototype.poseTactician=function(dt){
  if(this.dead) return; const C=CFG.tactician, t=gameTime, st=this.state, T=TAC; let J, brace=1, grabT=null;
  this.tB=(this.tB||0)+((this.tConf==="bold"?1:0)-(this.tB||0))*Math.min(1,dt*2.5);
  const sp=Math.hypot(this.vel.x,this.vel.z), step=(per)=>{ this.tph=((this.tph||0)+dt/per)%1; };
  if(st==="theadbutt"){ const k=this.tt||0;
    if(this.tPh==="close"){ step(0.6); J=T.walk(this.tph,t); }
    else if(this.tPh==="rear"){ const w=T.sm5(k/(this.tQuick?0.25:0.45)); J=T.rear(t,w); brace=1-w; }
    else if(this.tPh==="drop"){ J=T.drop(t,Math.min(1,(k/0.32)**2)); brace=0; }
    else if(this.tPh==="stagger"){ J=T.stagger(t,k,this.tU||0.7); brace=T.sm5((k-1.0)/0.5); }
    else { J=T.onHands(t,k); brace=T.sm5((k-1.8)/0.3); } }
  else if(st==="tcounter"){ const k=this.tt||0; J=T.stand(t); brace=1-T.sm5((k-0.3)/0.15); if(k<0.35) T.sidestep(J,k/0.35,-this.tSide); else { J=T.reach(t,T.sm5((k-0.35)/0.15)); J.hyaw=this.tSide*0.3*T.sm5((k-0.5)/0.4); J.syaw-=this.tSide*0.25*T.sm5((k-0.5)/0.4); if(k<0.95) grabT="wrist"; } }
  else if(st==="grab"){ J=T.pullIn(t,T.sm5((this.tt||0)/1.5)); grabT="collar"; }
  else if(st==="tsmash"){ const k=this.tt||0; J= k<0.2? T.rear(t,T.sm5(k/0.2)) : k<0.32? T.drop(t,((k-0.2)/0.12)**2*0.7) : T.stagger(t,k-0.32,0.7); brace=k<0.2?1-T.sm5(k/0.2):T.sm5((k-1.0)/0.4); if(k<0.32) grabT="collar"; }
  else if(st==="ttopple"||st==="tgetup"){ J= st==="ttopple"&&this.tLanded? T.lying(t) : T.stiff(t); brace=0; if(st==="tgetup"){ const u=T.ss((this.tt||0)/1.1); J=T.mix(T.lying(t),T.stand(t),u); brace=u; } }
  else if(st==="tstun"){ const k=this.tt||0; J=T.flinch(t,Math.sin(T.sat(k/0.6)*Math.PI)); brace=0.4; }
  else if(st==="tbegrudge"){ const k=this.tt||0; J=T.mix(T.stand(t),T.cower(0,t,0,true),T.sm5(k/0.9)); J.ny+=0.35*Math.sin(k*9)*(1-k); brace=1-T.sm5(k/0.5); }
  else if(st==="tbackoff" && (this.tt||0)<0.3){ J=T.flinch(t,Math.sin((this.tt||0)/0.3*Math.PI)); }
  else if(st==="stagger"){ J=T.flinch(t,Math.min(1,this.stagger*2)); brace=0.5; }
  else if(this.tB>0.02 && !["cower","cowerStill","crouch"].includes(this.tAnim)){ const a=this.tAnim||"stand", B=this.tB;   /* emboldened body, blended in as its nerve comes up */
    let N, D; if(a==="run" && sp>1.2){ step(0.42*5.5/Math.max(2.5,sp)); D=T.boldRun(this.tph,t); N=T.walk(this.tph,t); }
    else if((a==="walk"||a==="back"||a==="mirror") && sp>0.15){ step(1.15*C.boldWalk/Math.max(0.4,sp)); D=T.boldWalk(a==="back"?1-this.tph:this.tph,t); N=T.walk(this.tph,t); if(a==="mirror"){ D=T.boldStand(t); T.sidestep(D,(this.tph*2)%1,this.tMirror||1); } }
    else { D=T.boldStand(t); N=T.stand(t); }
    J=T.mix(N,D,B); brace=1-B; }
  else { const a=this.tAnim||"stand";
    if(a==="cower"||a==="cowerStill"){ if(a==="cower"&&sp>0.2) step(0.32*2.4/Math.max(0.8,sp)); this.tGl=(this.tGl||0)-dt; if(this.tGl<=0){ this.tGlT=0.45; this.tGl=0.9+Math.random()*1.4; this.tGlS=Math.random()<0.5?1:-1; } this.tGlT=Math.max(0,(this.tGlT||0)-dt);
      J=T.cower(this.tph||0,t,(this.tGlT>0?Math.sin(this.tGlT/0.45*Math.PI):0)*this.tGlS,a==="cowerStill"||sp<0.2); brace=1; this.tBoth=true; }
    else if(a==="crouch"){ J=T.crouchWait(t); }
    else if((a==="walk"||a==="back"||a==="mirror") && sp>0.15){ const back=a==="back"; step(1.5*C.walk/Math.max(0.4,sp)*(back?0.9:1)); J=T.walk(back?1-(this.tph||0):this.tph,t);
      if(a==="mirror"){ J=T.stand(t); T.sidestep(J,(this.tph*2)%1,this.tMirror||1); } }
    else { J=T.stand(t); J.nz+=0.14*Math.sin(t*0.7); J.hdx=-0.04+0.05*Math.sin(t*0.45); } }
  if(this.tB>0.02) brace*=1-this.tB;
  this.runnerApply(J);
  // the hands: the left steadies the head; the right reaches for her collar or her wrist
  const h=tacHead(this); tacFitHitbox(this);
  if(h){ const f=new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)), r=new THREE.Vector3(-Math.cos(this.yaw),0,Math.sin(this.yaw)), s=(this.skin.fit&&this.skin.fit.ms)||1;
    if(brace>0.01){ const sh=this.P.armL.getWorldPosition(new THREE.Vector3()), both=this.tBoth; const sv=n=>both?RUN.nz(t*29,n)*0.025:0;
      tacArmIK(this,"L",h.c.clone().addScaledVector(r,-0.24*s+sv(1)).add(new THREE.Vector3(0,-0.33*s+sv(2),0)).addScaledVector(f,0.03*s),both? sh.clone().addScaledVector(f,0.6).add(new THREE.Vector3(0,-0.3,0)) : sh.addScaledVector(r,-0.55).add(new THREE.Vector3(0,-0.35,0)).addScaledVector(f,-0.1),brace,0.15);
      if(both){ const sR=this.P.armR.getWorldPosition(new THREE.Vector3()); tacArmIK(this,"R",h.c.clone().addScaledVector(r,0.2*s+sv(3)).add(new THREE.Vector3(0,-0.36*s+sv(4),0)).addScaledVector(f,0.0),sR.addScaledVector(f,0.6).add(new THREE.Vector3(0,-0.3,0)),brace,0.15); } }
    this.tBoth=false;
    if(grabT && player.root){ const tgt=grabT==="collar"? player.pos.clone().add(new THREE.Vector3(0,1.38,0)).addScaledVector(f,-0.12) : player.pos.clone().add(new THREE.Vector3(0,1.1,0)).addScaledVector(r,-0.18*(this.tSide||1));
      const sh=this.P.armR.getWorldPosition(new THREE.Vector3()); tacArmIK(this,"R",tgt,sh.addScaledVector(r,0.4).add(new THREE.Vector3(0,-0.5,0)),1,0.1); } }
  this.rootY=0;
};

// ---------------------------------------------------------------- killed by a head shot: the head bursts
// The head blows open: a shockwave throws back anyone close (Norah and Crossed alike), gore flies out in every direction
// and sticks where it lands, and the brain matter pools on the floor and eats at whatever stands in it for a while.
const TACFX={gore:[], acid:[]};
const TAC_GORE_COL=[0x4a0606,0x6a0c0c,0x8a2a2a,0xb87a70,0xd9c8b0,0x5c1010];
Enemy.prototype.tacBurst=function(point,dir){ const C=CFG.tactician, h=tacHead(this), c=h?h.c.clone():this.pos.clone().add(new THREE.Vector3(0,1.9,0));
  const S=this.skin; if(S&&S.B&&S.B.head){ S.B.head.scale.setScalar(0.001);   /* the head is gone */
    const stump=new THREE.Mesh(new THREE.SphereGeometry(0.11,8,6),new THREE.MeshLambertMaterial({color:0x5a0a0a})); stump.scale.set(1,0.55,1); (S.B.neck||S.B.chest).add(stump); stump.position.set(0,0.12/((S.fit&&S.fit.ms)||1),0); }
  if(this.P.hbHead) this.P.hbHead.userData={};
  shake=Math.max(shake,0.7); SFX.slam(c); SFX.flesh(c); SFX.flesh(c); log(`${this.name}'s head bursts open`,"#ff5050");
  // the shockwave
  const R=C.burstRadius, see=(x,z)=>lineOfSight(c.x,c.z,x,z,false);
  if(!player.dead){ const d=Math.hypot(player.pos.x-c.x,player.pos.z-c.z); if(d<R && see(player.pos.x,player.pos.z)){ const k=1-d/R;
      runnerHitNorah(this,Math.round(C.burstDamage*k),"head burst",C.burstPush*k+1,k>0.45?C.burstDown:0); } }
  for(const o of enemies){ if(o===this||o.dead) continue; const d=Math.hypot(o.pos.x-c.x,o.pos.z-c.z); if(d>=R||!see(o.pos.x,o.pos.z)) continue; const k=1-d/R, f=new THREE.Vector3(o.pos.x-c.x,0,o.pos.z-c.z).normalize();
    o.hp-=C.burstEnemyDamage*k; if(o.hp<=0){ o.die(f); continue; } o.push(f,C.burstPush*k*6);
    if(o.kind==="across" && o.legsLost()===0 && o.gait && k>0.35) o.knockDown(f,"burst"); else { o.stagger=0.6+0.8*k; o.state="stagger"; o.t=0; o.flinch=1; } }
  // the gore: every direction, ballistic, sticking where it hits
  const n=C.goreBits; for(let i=0;i<n;i++){ const u=Math.random()*2-1, a=Math.random()*Math.PI*2, r=Math.sqrt(1-u*u), v=new THREE.Vector3(r*Math.cos(a),Math.abs(u)*0.8+0.15,r*Math.sin(a)).multiplyScalar(3+Math.random()*8);
    const sz=0.025+Math.random()*0.07, m=new THREE.Mesh(new THREE.BoxGeometry(sz,sz*(0.5+Math.random()),sz*(0.6+Math.random())),new THREE.MeshLambertMaterial({color:TAC_GORE_COL[i%TAC_GORE_COL.length]}));
    m.position.copy(c).add(v.clone().multiplyScalar(0.06)); scene.add(m); TACFX.gore.push({m,v,spin:new THREE.Vector3(Math.random()*14-7,Math.random()*14-7,Math.random()*14-7),rest:false,acid:i<C.acidPools}); }
  for(let i=0;i<14;i++){ const a=i/14*Math.PI*2; spray(c,new THREE.Vector3(Math.cos(a)*2.5,0,Math.sin(a)*2.5)); }
  // a ring of dust and blood hugging the floor (particles only)
  for(let i=0;i<20;i++){ const a=i/20*Math.PI*2; spray(new THREE.Vector3(c.x,groundY(c.x,c.z)+0.05,c.z),new THREE.Vector3(Math.cos(a)*3,0,Math.sin(a)*3),0x7a6a58); }
  bloodPool(this.pos.x,this.pos.z,1.0);
};
function tacAcidPool(x,z){ const C=CFG.tactician, r=0.18+Math.random()*0.2;
  const m=new THREE.Mesh(new THREE.CircleGeometry(1,12),new THREE.MeshBasicMaterial({color:0x3e3a0e,transparent:true,opacity:0.85,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.set(x,groundY(x,z)+0.016,z); m.scale.setScalar(r); scene.add(m);
  TACFX.acid.push({x,z,r,t:C.acidTime,m,acc:0,bub:0}); }
function tacFxStep(dt){ if(dt<=0) return; const C=CFG.tactician;
  for(const g of TACFX.gore){ if(g.rest) continue; const p=g.m.position, prev=p.clone(); g.v.y-=9.8*dt; p.addScaledVector(g.v,dt); g.m.rotation.x+=g.spin.x*dt; g.m.rotation.y+=g.spin.y*dt; g.m.rotation.z+=g.spin.z*dt;
    const q=new THREE.Vector3(p.x,0,p.z); if(collide(q,0.03)){ p.x=q.x; p.z=q.z; g.v.set(0,Math.min(0,g.v.y)*0.2,0); g.wall=true; g.slide=0.6; }   /* splats on the wall and slides a little */
    if(g.wall){ g.slide-=dt; if(g.slide<=0||p.y<=groundY(p.x,p.z)+0.03){ g.rest=true; } }
    const gy=groundY(p.x,p.z); if(p.y<=gy+0.02){ p.y=gy+0.02; g.rest=true; g.m.rotation.set(-Math.PI/2+Math.random()*0.3,Math.random()*6,0); if(g.acid) tacAcidPool(p.x,p.z); else if(Math.random()<0.4) bloodPool(p.x,p.z,0.15+Math.random()*0.2); } }
  if(TACFX.gore.length>400){ for(const g of TACFX.gore.splice(0,TACFX.gore.length-400)) scene.remove(g.m); }
  let inAcid=false;
  for(let i=TACFX.acid.length-1;i>=0;i--){ const A=TACFX.acid[i]; A.t-=dt; const life=A.t/C.acidTime; A.m.material.opacity=0.85*Math.min(1,A.t/3);
    A.bub-=dt; if(A.bub<=0){ A.bub=0.25+Math.random()*0.5; spray(new THREE.Vector3(A.x+(Math.random()-.5)*A.r,groundY(A.x,A.z)+0.03,A.z+(Math.random()-.5)*A.r),new THREE.Vector3(0,0.2,0),0x9a9a30); }   /* it fizzes */
    if(!player.dead && !(player.posY>0.1) && Math.hypot(player.pos.x-A.x,player.pos.z-A.z)<A.r+0.15) inAcid=true;
    for(const o of enemies){ if(o.dead) continue; if(Math.hypot(o.pos.x-A.x,o.pos.z-A.z)<A.r+0.1){ o.hp-=C.acidDps*0.25*dt; if(o.hp<=0) o.die(new THREE.Vector3(0,0,1)); } }
    if(A.t<=0){ scene.remove(A.m); TACFX.acid.splice(i,1); } }
  if(inAcid){ TACFX.acc=(TACFX.acc||0)+C.acidDps*dt; if(TACFX.acc>=1){ const d=Math.floor(TACFX.acc); TACFX.acc-=d; tacAcidHurt(d); } } }   /* one burn however many pools she stands in */
function tacFxClear(){ for(const g of TACFX.gore) scene.remove(g.m); for(const A of TACFX.acid) scene.remove(A.m); TACFX.gore.length=0; TACFX.acid.length=0; }
function tacAcidHurt(d){ const N=CFG.norah; if(!N.god) player.hp-=d; if(run){ run.dmgTaken+=N.god?0:d; } flashRed(); if(!TACFX.burnLog||gameTime-TACFX.burnLog>3){ TACFX.burnLog=gameTime; log(`The brain matter burns her: −${d}/s`,"#c8c040"); }
  if(player.hp<=0){ player.hp=0; player.grabbed=null; player.dead=true; document.getElementById("dead").style.display="flex"; try{ document.exitPointerLock(); }catch(e){} endRun("DIED"); } }
