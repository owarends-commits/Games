// ================================================================ smooth, solid bodies (every creature worn as a skinned model)
// 1. No pops: the procedural body under a model can switch pose in one frame (a Runner going from sprint to skid, an ACROSS
//    changing gait), which threw a foot a metre or a head through the floor for a frame. Each bone may turn at most POP.turn
//    radians a frame and the hips move at most POP.move m relative to the body, so a switch eases in over a few frames instead.
//    Fast moves the creature really makes (a strike, a lunge) stay well inside that.
// 2. Solid floor: an arm or leg that would reach through the floor is swung up at the shoulder or hip until its hand or foot rests
//    on it (limbs that have come off are left alone).
const POP={turn:0.25, move:0.14, on:true};
const _apq=new THREE.Quaternion(), _apv=new THREE.Vector3(), _apw=new THREE.Vector3(), _apu=new THREE.Vector3(), _apq2=new THREE.Quaternion();
function apChains(S){ if(S.apCh) return S.apCh; const B=S.B, ch=[]; for(const s of ["L","R"]){ if(B["upperarm_"+s]&&B["hand_"+s]) ch.push({root:"upperarm_"+s,tip:"hand_"+s,lift:0.03}); if(B["thigh_"+s]&&B["foot_"+s]) ch.push({root:"thigh_"+s,tip:"foot_"+s,lift:0.02}); } return S.apCh=ch; }
{ const ss0=skinSync; skinSync=function(S){ ss0(S); if(!S.model||!POP.on) return; const o=S.owner; if(!o||o===player||!enemies.includes(o)) return;
    const F=S.ap||(S.ap={q:{},h:null,f:-9}), fresh=frameNo-F.f>2||o.removed; F.f=frameNo; const B=S.B;
    // 1. ease any pose switch
    if(!fresh&&!o.dead){ for(const n in B){ const bn=B[n]; if(!bn.isBone||S.collapsed[n]) continue; const q0=F.q[n]; if(q0){ const ang=q0.angleTo(bn.quaternion); if(ang>POP.turn){ _apq.copy(q0).rotateTowards(bn.quaternion,POP.turn); bn.quaternion.copy(_apq); } } }
      if(F.h&&B.hips){ const d=B.hips.position.distanceTo(F.h); if(d>POP.move) B.hips.position.copy(F.h).lerp(B.hips.position,POP.move/d); } }
    for(const n in B){ const bn=B[n]; if(!bn.isBone) continue; (F.q[n]||(F.q[n]=new THREE.Quaternion())).copy(bn.quaternion); } if(B.hips) F.h=(F.h||new THREE.Vector3()).copy(B.hips.position);
    S.model.updateMatrixWorld(true);
    // 2. limbs on the floor, not through it
    for(const c of apChains(S)){ if(S.collapsed[c.root]||S.collapsed[c.tip]) continue; const r=B[c.root], tp=B[c.tip]; tp.getWorldPosition(_apw); const gy=groundY(_apw.x,_apw.z)+c.lift; if(_apw.y>=gy) continue;
      r.getWorldPosition(_apv); if(_apv.y<=gy+0.05) continue;   /* the shoulder or hip itself is down there: nothing to swing */
      _apu.subVectors(_apw,_apv); const L=_apu.length(), h=gy-_apv.y; if(L<1e-4) continue; const horiz=Math.sqrt(Math.max(0,L*L-h*h)), hv=new THREE.Vector3(_apu.x,0,_apu.z); if(hv.lengthSq()<1e-8) hv.set(1,0,0); hv.setLength(horiz); const want=hv.add(new THREE.Vector3(0,h,0));
      _apq.setFromUnitVectors(_apu.normalize(),want.normalize());   // the world rotation that lifts the tip onto the floor
      r.parent.getWorldQuaternion(_apq2); const pinv=_apq2.clone().invert(); r.getWorldQuaternion(_apq2); _apq2.premultiply(_apq); r.quaternion.copy(pinv.multiply(_apq2)); r.updateMatrixWorld(true);
      (F.q[c.root]||(F.q[c.root]=new THREE.Quaternion())).copy(r.quaternion); } }; }

// the same for creatures run by their preview's code (the Contortionist, the Reachers, the split head, the club-fist and one-arm Brutes):
// a clip that switches a limb to a new target in one frame (a hand taking hold of the wall) eases there instead
function pvNoPop(b){ if(!POP.on||!b.C||!b.C.model||b.K.noPop) return; const F=b.ap||(b.ap={q:new Map(),f:-9}), fresh=frameNo-F.f>2; F.f=frameNo; if(b.e.dead) { F.q.clear(); return; }
  b.C.model.traverse(o=>{ if(!o.isBone) return; const q0=F.q.get(o); if(q0&&!fresh){ const ang=q0.angleTo(o.quaternion); if(ang>POP.turnPV){ _apq.copy(q0).rotateTowards(o.quaternion,POP.turnPV); o.quaternion.copy(_apq); } } if(q0) q0.copy(o.quaternion); else F.q.set(o,o.quaternion.clone()); });
  b.C.model.updateMatrixWorld(true); }
POP.turnPV=0.45;

// a new clip starts from the pose it is in, not from its own first frame: bones and the body's place blend over a quarter second
// (a creature going from its walk into an attack, or back, used to snap there in one frame)
function pvSnapPose(b){ if(!b.ready||!b.C||!b.C.group||!b.posed){ b.pvSnap=null; return; }   /* never from its unposed rest shape */ const g=b.C.group, root=b.C.model||g, bones=new Map(); g.updateMatrixWorld(true);
  root.traverse(o=>{ if(o.isBone) bones.set(o,{q:o.quaternion.clone(),p:o.position.clone()}); });
  b.pvSnap={bones, gw:g.getWorldPosition(new THREE.Vector3()), gq:g.getWorldQuaternion(new THREE.Quaternion())}; b.pvBlend=0; }
function pvBlendPose(b,dt){ const S=b.pvSnap; b.pvBlend=Math.min(1,b.pvBlend+dt/0.25); const k=b.pvBlend*b.pvBlend*(3-2*b.pvBlend), g=b.C.group;
  for(const [o,s] of S.bones){ o.quaternion.copy(_apq.copy(s.q).slerp(o.quaternion,k)); o.position.lerp(s.p,1-k); }
  g.updateMatrixWorld(true); const wNow=g.getWorldPosition(new THREE.Vector3()), qNow=g.getWorldQuaternion(new THREE.Quaternion());
  const w=S.gw.clone().lerp(wNow,k), q=S.gq.clone().slerp(qNow,k); const par=g.parent; par.updateMatrixWorld(true);
  g.position.copy(par.worldToLocal(w)); g.quaternion.copy(par.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(q)); g.updateMatrixWorld(true);
  if(b.pvBlend>=1) b.pvSnap=null; }
