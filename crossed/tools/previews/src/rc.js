// ================================================================ the REACHER (BCROSS)
// Three with necks two or three times a person's, two with arms near four metres long. At load the long parts are given
// a chain of extra joints (the model files are left alone), and each frame the chain is laid along a curve in the world:
// a neck that whips, arcs over and coils; arms that drag on the floor, sweep, snatch and trip. Segment lengths never
// change, so nothing stretches; the physics guard weighs the long parts by their volume like everything else.
const sm5=x=>{ x=sat(x); return x*x*x*(x*(x*6-15)+10); };
const Z=()=>1, V3=THREE.Vector3; SLOUCH.s=0; SLOUCH.h=0;
const NX=3.2, UP=new V3(0,1,0);
const TP=()=>({fwd:new V3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw)), right:new V3(-Math.cos(ctx.yaw),0,Math.sin(ctx.yaw))});
const TWALK={stance:0.64,front:-0.3,back:0.3,high:-0.5,kStance:0.1,kImpact:0.1,kLift:0.8,liftEnd:0.55};
const TPHYS={ active:ctx=>!!ctx.gait, stance:ctx=>strideStance(ctx.ph,TWALK), traction:8, imp:0.6, rollK:0 };
const GC4=["getX","getY","getZ","getW"], cmp=(A,i,k)=>A[GC4[k]](i);
let RC=null;   /* the current model's chains: {kind:"neck"|"arm", ...} */
const KIND=()=>RC&&RC.kind;

// ---- load time: lay a chain of joints along the neck (or each arm) and re-skin the vertices onto it
function buildChains(gltf){ if(gltf.userData.rc) return gltf.userData.rc;
  let mesh; gltf.scene.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); gltf.scene.updateMatrixWorld(true);
  const g=mesh.geometry, sk=mesh.skeleton, bones=sk.bones.slice(), inv=sk.boneInverses.map(m=>m.clone()), P=g.attributes.position, SI=g.attributes.skinIndex, SWt=g.attributes.skinWeight, U2=g.attributes.uv2;
  const bi=n=>bones.findIndex(b=>b.name===n), bp=n=>new V3().setFromMatrixPosition(inv[bi(n)].clone().invert());
  const dom=i=>{ let b=0,w=-1; for(let k=0;k<4;k++){ const x=cmp(SWt,i,k); if(x>w){ w=x; b=cmp(SI,i,k); } } return b; };
  const addBone=(name,parent,J,Jp)=>{ const b=new THREE.Bone(); b.name=name; b.position.copy(J).sub(Jp); parent.add(b); bones.push(b); inv.push(new THREE.Matrix4().makeTranslation(-J.x,-J.y,-J.z)); return bones.length-1; };
  const skin=(i,a,b,w)=>{ SI.setXYZW(i,a,b,0,0); SWt.setXYZW(i,1-w,w,0,0); };
  const blend=(i,u,cur,prev,next)=>{ if(u>0.6&&next!=null) skin(i,cur,next,0.5*(u-0.6)/0.4); else if(u<0.4&&prev!=null) skin(i,cur,prev,0.5*(0.4-u)/0.4); else skin(i,cur,cur,0); };
  const v=new V3(), info={};
  if(!U2){ // a neck: its centre line is found from its own vertices (it can droop, curl and wiggle in the bind pose)
    const nb=bi("neck"), cb=bi("chest"), hb=bi("head"), S=bp("neck"), E=bp("head"), pts=[], ids=[];
    for(let i=0;i<P.count;i++){ const d=dom(i); v.fromBufferAttribute(P,i).applyMatrix4(mesh.bindMatrix); if(d===nb||(d===cb&&v.z>0.17)){ pts.push(v.clone()); ids.push(i); } }
    let poly=[S.clone(),E.clone()];
    const plen=()=>{ let s=0; for(let k=0;k<poly.length-1;k++) s+=poly[k].distanceTo(poly[k+1]); return s; };
    const proj=p=>{ let best=1e9,bs=0,acc=0; for(let k=0;k<poly.length-1;k++){ const a=poly[k], ab=poly[k+1].clone().sub(a), L=ab.length()||1e-9, u=clamp(p.clone().sub(a).dot(ab)/(L*L),0,1), d=a.clone().addScaledVector(ab,u).distanceTo(p); if(d<best){ best=d; bs=acc+u*L; } acc+=L; } return bs; };
    const at=s=>{ let acc=0; for(let k=0;k<poly.length-1;k++){ const L=poly[k].distanceTo(poly[k+1]); if(s<=acc+L||k===poly.length-2) return poly[k].clone().lerp(poly[k+1],clamp((s-acc)/(L||1e-9),0,1)); acc+=L; } return poly[poly.length-1].clone(); };
    for(let it=0;it<4;it++){ const L=plen(), M=14, sum=[...Array(M)].map(()=>new V3()), cnt=new Array(M).fill(0);
      for(const p of pts){ const k=Math.min(M-1,Math.floor(proj(p)/L*M)); sum[k].add(p); cnt[k]++; }
      const np=[S.clone()]; for(let k=0;k<M;k++) if(cnt[k]>3) np.push(sum[k].divideScalar(cnt[k])); np.push(E.clone()); poly=np;
      for(let q=0;q<2;q++) poly=poly.map((p,k)=>k===0||k===poly.length-1?p:p.clone().multiplyScalar(0.5).addScaledVector(poly[k-1],0.25).addScaledVector(poly[k+1],0.25)); }
    const L=plen(), N=clamp(Math.round(L/0.17),6,14), J=[]; for(let k=0;k<=N;k++) J.push(at(k*L/N));
    const ch=[nb]; let par=bones[nb]; for(let k=1;k<N;k++){ const id=addBone("nk"+k,par,J[k],J[k-1]); ch.push(id); par=bones[id]; }
    par.add(bones[hb]); bones[hb].position.copy(E).sub(J[N-1]);
    poly=J; const segL=L/N;
    for(let q=0;q<ids.length;q++){ const s=proj(pts[q]), k=Math.min(N-1,Math.floor(s/segL)), u=s/segL-k; blend(ids[q],u,ch[k],k>0?ch[k-1]:cb,k<N-1?ch[k+1]:hb); }
    Object.assign(info,{kind:"neck",N,L}); }
  else { // two arms: each arm vertex carries its side and how far along the arm it is (TEXCOORD_1)
    info.kind="arm"; let mj=null; gltf.scene.traverse(o=>{ if(o.userData&&o.userData.arm_main_joints) mj=o.userData.arm_main_joints; }); mj=mj||[0.26,0.5,0.74];
    const F=[0,mj[0]/2,mj[0],(mj[0]+mj[1])/2,mj[1],(mj[1]+mj[2])/2,mj[2],(mj[2]+1)/2]; Object.assign(info,{F,main:[2,4,6],tip:{},len:{},cum:{}});
    for(const [s,sg] of [["L",1],["R",-1]]){ const ids=[], fr=[], ps=[];
      for(let i=0;i<P.count;i++){ if(Math.round(U2.getX(i))!==sg) continue; ids.push(i); fr.push(U2.getY(i)); ps.push(new V3().fromBufferAttribute(P,i).applyMatrix4(mesh.bindMatrix)); }
      const n=ids.length; let mf=0; const mp=new V3(); for(let q=0;q<n;q++){ mf+=fr[q]; mp.add(ps[q]); } mf/=n; mp.divideScalar(n);
      let sff=0; const sfp=new V3(); for(let q=0;q<n;q++){ const df=fr[q]-mf; sff+=df*df; sfp.addScaledVector(ps[q].clone().sub(mp),df); }
      const b=sfp.divideScalar(sff), a=mp.clone().addScaledVector(b,-mf), pos=f=>a.clone().addScaledVector(b,f);   /* straight in the bind pose: position = a + b·fraction */
      const ub=bi("upperarm_"+s), J=[bp("upperarm_"+s)]; for(let k=1;k<F.length;k++) J.push(pos(F[k])); const tip=pos(1);
      const ch=[ub]; let par=bones[ub]; for(let k=1;k<F.length;k++){ const id=addBone("ar"+s+k,par,J[k],J[k-1]); ch.push(id); par=bones[id]; }
      for(let q=0;q<n;q++){ const f=fr[q]; let k=0; while(k<F.length-1&&f>=F[k+1]) k++; const hi=k<F.length-1?F[k+1]:1, u=clamp((f-F[k])/(hi-F[k]),0,1); if(k===0&&u<0.1) skin(ids[q],ch[0],bi("chest"),0.5*(0.1-u)/0.1); else blend(ids[q],u,ch[k],k>0?ch[k-1]:null,k<F.length-1?ch[k+1]:null); }   /* only a narrow seam onto the chest at the shoulder */
      info.tip[s]=tip.clone().sub(J[F.length-1]); const cum=[0]; for(let k=1;k<F.length;k++) cum.push(cum[k-1]+J[k].distanceTo(J[k-1])); cum.push(cum[F.length-1]+tip.distanceTo(J[F.length-1])); info.cum[s]=cum; info.len[s]=cum[cum.length-1]; } }
  mesh.bind(new THREE.Skeleton(bones,inv),mesh.bindMatrix); SI.needsUpdate=true; SWt.needsUpdate=true;
  gltf.userData.rc=info; return info; }
// the rig side: a pivot per new joint, retargeted like the rest
function chainRig(C,info){ const R=C.R, B=C.B;
  if(info.kind==="neck"){ C.nk=[R.neck]; let p=R.neck; const add=[]; for(let k=1;k<info.N;k++){ const q=piv(p,B["nk"+k].position); C.nk.push(q); add.push(["nk"+k,"ori",q]); p=q; }
    p.add(R.head); R.head.position.copy(B.head.position); C.nkEnd=B.head.position.clone();
    const i=C.map.findIndex(m=>m[0]==="neck"); C.map.splice(i+1,0,...add); }
  else { C.map=C.map.filter(m=>!/^(upperarm|forearm|hand)_/.test(m[0])); C.ar={};
    for(const s of ["L","R"]){ const ch=[R["arm"+s]]; C.map.push(["upperarm_"+s,"ori",R["arm"+s]]); let p=R["arm"+s]; for(let k=1;k<info.F.length;k++){ const q=piv(p,B["ar"+s+k].position); ch.push(q); C.map.push(["ar"+s+k,"ori",q]); p=q; } C.ar[s]={piv:ch,end:info.tip[s].clone()}; } } }

// ---- curves: a path is a function of arc length s (metres from its start) to a world point; past its end it carries straight on
function polyPath(S){ const acc=[0]; for(let i=1;i<S.length;i++) acc.push(acc[i-1]+S[i].distanceTo(S[i-1])); const n=S.length-1;
  const f=s=>{ if(s<=0) return S[0].clone(); if(s>=acc[n]){ const d=S[n].clone().sub(S[n-1]).normalize(); return S[n].clone().addScaledVector(d,s-acc[n]); }
    let lo=0,hi=n; while(hi-lo>1){ const m=(lo+hi)>>1; if(acc[m]<=s) lo=m; else hi=m; } return S[lo].clone().lerp(S[hi],(s-acc[lo])/((acc[hi]-acc[lo])||1e-9)); };
  f.len=acc[n]; f.pts=S; return f; }
function mkPath(W){ const S=[], cr=(a,b,c,d,u)=>{ const u2=u*u,u3=u2*u; return new V3().addScaledVector(a,-0.5*u3+u2-0.5*u).addScaledVector(b,1.5*u3-2.5*u2+1).addScaledVector(c,-1.5*u3+2*u2+0.5*u).addScaledVector(d,0.5*u3-0.5*u2); };
  for(let i=0;i<W.length-1;i++){ const a=W[Math.max(0,i-1)], b=W[i], c=W[i+1], d=W[Math.min(W.length-1,i+2)]; for(let k=0;k<10;k++) S.push(cr(a,b,c,d,k/10)); } S.push(W[W.length-1].clone()); return polyPath(S); }
const lerpPath=(a,b,w)=>s=>{ const k=typeof w==="function"?w(s):w; return k<=0?a(s):k>=1?b(s):a(s).lerp(b(s),k); };
// a path cut at arc length 'at' and carried straight on from there (a neck or arm still reaching round)
const cutPath=(p,at)=>{ const e=p(at), d=p(at).sub(p(Math.max(0,at-0.05))).normalize(); return s=>s<=at?p(s):e.clone().addScaledVector(d,s-at); };
// lay a chain of pivots along a path: each joint lands on the curve, one segment length from the last
function chainTo(ch,endOff,path,yMin){ for(let i=1;i<ch.length;i++) ch[i].quaternion.identity(); runner.group.updateMatrixWorld(true); let sl=0;
  for(let i=0;i<ch.length;i++){ const p=ch[i], off= i<ch.length-1? ch[i+1].position : endOff, len=off.length(), P=p.getWorldPosition(new V3());
    let s1=sl; const far=sl+len*3+4; while(path(s1).distanceTo(P)<len&&s1<far) s1+=0.04; let lo=Math.max(sl,s1-0.04), hi=s1; for(let k=0;k<12;k++){ const m=(lo+hi)/2; if(path(m).distanceTo(P)<len) lo=m; else hi=m; } sl=hi;
    const Q=path(hi); if(yMin!=null) Q.y=Math.max(Q.y,yMin); Q.sub(P); const C=p.localToWorld(off.clone()).sub(P);
    if(C.lengthSq()<1e-10||Q.lengthSq()<1e-10) continue; rotWorld(p,new THREE.Quaternion().setFromUnitVectors(C.normalize(),Q.normalize())); } }
// fit: find k in [lo,hi] so the path made by mk(k) is 'len' long (the length grows with k)
function fitLen(mk,len,lo,hi){ for(let i=0;i<18;i++){ const m=(lo+hi)/2; if(mk(m).len<len) lo=m; else hi=m; } return mk((lo+hi)/2); }

// ---- the neck
function nRoot(){ runner.group.updateMatrixWorld(true); return runner.R.neck.getWorldPosition(new V3()); }
// a neck shape from its root: lean (from vertical, toward its facing), bend (a forward curl that grows toward the tip),
// side (a sideways curl), wave (an S along its length), sway (a sideways S). Integrated along its length, so it is always L long.
function neckShape(o){ const L=RC.L, n=28, ds=L/n, yaw=o.yaw??ctx.yaw, f=new V3(Math.sin(yaw),0,Math.cos(yaw)), r=new V3(-f.z,0,f.x), p=nRoot(), pts=[p.clone()];
  for(let i=0;i<n;i++){ const u=(i+0.5)/n, th=(o.lean||0)+(o.bend||0)*Math.pow(u,o.pw||1.6)+(o.wave||0)*Math.sin(Math.PI*2*u*(o.wk||1)-(o.wph||0)), ps=(o.side||0)*u+(o.sway||0)*Math.sin(Math.PI*u*(o.wk||1)-(o.sph||0));
    const d=UP.clone().multiplyScalar(Math.cos(th)*Math.cos(ps)).addScaledVector(f,Math.sin(th)*Math.cos(ps)).addScaledVector(r,Math.sin(ps)); p.addScaledVector(d,ds); pts.push(p.clone()); }
  return polyPath(pts); }
const mixP=(a,b,w)=>{ const o={}; for(const k of new Set([...Object.keys(a),...Object.keys(b)])) o[k]=(a[k]||0)+((b[k]||0)-(a[k]||0))*w; return o; };
// it looms: tall, curled forward over her, swaying like a reed. Long necks fold into an S to carry the head lower
function loomP(t){ const long=RC.L>2; return {lean:long?0.32:0.1, bend:long?1.9:1.25, pw:long?1.4:2.2, wave:long?0.55:0.1, wk:long?1.3:1, wph:0.4,
  sway:0.22*Math.sin(t*0.55)+0.06*Math.sin(t*1.7), side:0.08*Math.sin(t*0.37), sph:0}; }
function headCentre(C){ let mesh; C.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); const g=mesh.geometry, si=g.attributes.skinIndex, sw=g.attributes.skinWeight, pos=g.attributes.position, hb=mesh.skeleton.bones.findIndex(b=>b.name==="head"), c=new V3(), v=new V3(); let n=0;
  for(let i=0;i<pos.count;i++) if(si.getX(i)===hb&&sw.getX(i)>0.5){ c.add(v.fromBufferAttribute(pos,i)); n++; } c.divideScalar(Math.max(1,n)); C.headC=c.sub(new V3().setFromMatrixPosition(mesh.skeleton.boneInverses[hb].clone().invert())); }
/* the offset from the end of the neck to the middle of the head, as it is carried upright and facing ahead */
const hOff=()=>runner.headC? runner.headC.clone().applyAxisAngle(UP,ctx.yaw) : new V3();
function headAt(){ runner.group.updateMatrixWorld(true); return runner.B.head.getWorldPosition(new V3()); }
// the head turned to look at a point (and pitched/rolled on top of that)
function headFace(T,pitch=0,roll=0){ const R=runner.R; runner.group.updateMatrixWorld(true); const H=R.head.getWorldPosition(new V3()), d=T.clone().sub(H);
  const yaw=Math.atan2(d.x,d.z), pt=0.5*Math.atan2(-d.y,Math.hypot(d.x,d.z))+pitch, qp=R.head.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  R.head.quaternion.copy(qp.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(clamp(pt,-1.3,1.45),yaw,roll,"YXZ")))); R.head.updateMatrixWorld(true); }
function neckTo(path,look,pitch,roll){ chainTo(runner.nk,runner.nkEnd,path,0.2); headFace(look||nHead(),pitch||0,roll||0); }
const nHead=()=>norah?norah.c.B.head.getWorldPosition(new V3()):new V3(NX,1.55,0), nBone=n=>norah.c.B[n].getWorldPosition(new V3());

// ---- the arms
const shoulder=s=>runner.R["arm"+s].getWorldPosition(new V3()), lat=s=>{ const r=TP().right; return s==="L"?r.negate():r; };
const ALEN=s=>RC.len[s];
// at rest they hang down from the shoulders and lie forward along the floor toward her, knuckles dragging
function drape(s,t,o={}){ const P=TP(), S=shoulder(s), l=lat(s), g=runner.group.position.clone().setY(0.07), sw=0.1*Math.sin(t*0.6+(s==="L"?0:2.1)), fw=o.fw??1, sp=o.spread??0;
  return mkPath([S, S.clone().addScaledVector(l,0.22).add(new V3(0,-0.45,0)).addScaledVector(P.fwd,0.16), g.clone().addScaledVector(l,0.5+sw+sp*0.5).addScaledVector(P.fwd,0.5),
    g.clone().addScaledVector(l,0.66+sw+sp).addScaledVector(P.fwd,1.5*fw), g.clone().addScaledVector(l,0.7+1.6*sw+sp*1.5).addScaledVector(P.fwd,2.7*fw)]); }
// an arm held out at bearing a (0 = straight ahead, + = out to its own side), the tip dropping to 'elev', bowed by 'bend'
function armLine(s,a,elev,bend,len,low){ const P=TP(), S=shoulder(s), L=len||ALEN(s), l=lat(s), d=P.fwd.clone().multiplyScalar(Math.cos(a)).addScaledVector(l,Math.sin(a)), q=P.fwd.clone().multiplyScalar(-Math.sin(a)).addScaledVector(l,Math.cos(a)), pts=[];
  for(let k=0;k<=10;k++){ const u=k/10, p=S.clone().addScaledVector(d,L*u); p.y=S.y+(elev-S.y)*(low? sm5(u/0.32) : u*u); p.addScaledVector(q,bend*L*0.3*Math.sin(Math.PI*u)); pts.push(p); } return polyPath(pts); }
function armTo(s,path,n){ const A=runner.ar[s]; if(n!=null&&n<A.piv.length) chainTo(A.piv.slice(0,n),A.piv[n].position,path,0.07); else chainTo(A.piv,A.end,path,0.07); }
const armTip=s=>{ const A=runner.ar[s], k=A.cut??A.piv.length; return k<A.piv.length? A.piv[k].getWorldPosition(new V3()) : A.piv[A.piv.length-1].localToWorld(A.end.clone()); };
// the bearing (in its own frame) of a world point from a shoulder
const bearing=(s,p)=>{ const P=TP(), d=p.clone().sub(shoulder(s)); return Math.atan2(d.dot(lat(s)),d.dot(P.fwd)); };

// ---- its body: tall, a forward loom; it sways from the hips as it walks
function rStand(t){ const J=P0(); J.hd=0.03; J.kL=J.kR=0.12; J.sp=0.12+0.02*Math.sin(t*0.8); J.hp=0.04; J.aLz=J.aRz=0.1; J.eL=J.eR=0.25; J.aLx=0.05+0.05*Math.sin(t*0.9); J.aRx=0.05+0.05*Math.sin(t*0.9+1);
  J.hroll=0.035*Math.sin(t*0.55); J.sroll=-0.05*Math.sin(t*0.55);
  if(KIND()==="arm"){ J.sp=0.26; J.hp=0.08; J.nx=-0.25; } return J; }
function rWalk(t,ph){ const J=tLegs(rStand(t),ph), s=Math.sin(ph*Math.PI*2); J.hroll+=0.09*s; J.sroll-=0.15*s; J.hyaw=0.06*s; J.nz=(J.nz||0)+0.1*s; J.aLx+=0.2*s; J.aRx-=0.2*s; return J; }
const fin=J=>applyLean(J);
// the stride clock: dir +1 forward, −1 backward. A stop waits for the feet to come together.
function gaitOn(ctx,dt,dir,T){ const prev=ctx.ph; ctx.ph=((ctx.ph+dir*dt/T)%1+1)%1; if(Math.floor(prev*2)!==Math.floor(ctx.ph*2)) ctx.events.push({kind:"stomp",side:Math.floor(ctx.ph*2)?"R":"L",strength:0.35}); ctx.moving=true; ctx.gait={ph:ctx.ph,P:TWALK}; }
function gaitStop(ctx,dt,dir,T){ if(ctx.ph%0.5<0.02||ctx.ph%0.5>0.48){ ctx.ph=Math.round(ctx.ph*2)/2%1; return true; } gaitOn(ctx,dt,dir,T); return false; }
const gapN=()=>NX-ctx.x;
// the edge of its reach, from her (how far it stands off)
const REACH=()=>KIND()==="neck"? 0.92*RC.L+0.45 : 0.78*Math.min(ALEN("L"),ALEN("R"));

// ---- Norah
const NQ={ aim(){ const J=NP.stand(); J.aRx=-1.5; J.eR=0.12; J.aLx=-1.3; J.eL=0.7; J.aLz=-0.1; return J; },
  aimUp(){ const J=NQ.aim(); J.aRx=-2.0; J.aLx=-1.8; J.nx=-0.35; J.sp=-0.1; return J; },
  walk(ph){ const J=NQ.aim(); const s=Math.sin(ph*Math.PI*2); J.lLx=-0.35*s; J.lRx=0.35*s; J.kL=0.35*Math.max(0,s); J.kR=0.35*Math.max(0,-s); return J; },
  flat(k){ const J=NP.stumble(); J.aLx=J.aRx=-1.8-0.5*sat(k/0.6); J.aLz=J.aRz=0.7; J.lLx=0.3*(1-sat(k/0.8)); J.kL=0.1+0.3*(1-sat(k/0.8)); J.lRx=-0.25*(1-sat(k/0.8)); J.kR=0.2; return J; },
  // wrapped in its neck: both hands pushing at the coil, head back away from its face
  coiled(t,k){ const J=NP.stand(), n=s=>noise(t*13,s)*0.14*k; J.aLx=-1.25+n(1); J.aRx=-1.15+n(2); J.aLz=-0.3; J.aRz=-0.25; J.eL=1.75+n(3); J.eR=1.6+n(4); J.sp=-0.12+n(5)*0.4; J.nx=-0.35+n(6); J.ny=0.3; J.kL=0.2+Math.abs(n(7)); J.kR=0.15; J.lLx=-0.1; J.lRx=0.1; return J; },
  // hauled toward it by the waist: heels dug in, leaning back, one hand tearing at the arm
  dragged(t){ const J=NP.stand(), n=s=>noise(t*12,s)*0.1; J.sp=-0.32+n(1); J.hp=-0.12; J.lLx=-0.55; J.kL=0.25; J.fL=0.25; J.lRx=0.15; J.kR=0.35; J.aLx=-0.55+n(2); J.eL=1.3; J.aLz=-0.25; J.aRx=-0.3+n(3); J.aRz=0.5; J.eR=0.6; J.nx=-0.2; return J; },
  knees(t){ const J=NP.kneel(t); J.nx=0.6; J.aLx=-0.2; J.aRx=-0.1; J.eL=J.eR=0.3; return J; } };
const NG={ lie(t,k){ const J=P0(), n=s=>noise(t*9,s)*0.08*k; J.hd=norah.c.R.hip0-0.13; J.hp=-1.5; J.sp=-0.05+n(1); J.nx=0.25+n(2); J.lLx=0.05+n(3); J.lRx=-0.05+n(4); J.kL=0.15+Math.abs(n(5)); J.kR=0.1+Math.abs(n(6));
    J.aLx=-2.6+n(7); J.aRx=-2.5+n(8); J.aLz=J.aRz=0.35; J.eL=0.5+n(9); J.eR=0.6+n(10); return J; },
  sit(){ const J=P0(); J.hd=norah.c.R.hip0-0.14; J.hp=-0.25; J.sp=0.25; J.nx=0.1; J.lLx=-2.25; J.lRx=-1.95; J.kL=2.25; J.kR=1.85; J.fL=0.3; J.fR=0.2; J.aLx=0.7; J.aRx=0.7; J.aLz=J.aRz=0.25; J.eL=J.eR=0.2; return J; },
  knee(){ const J=NP.kneel(0); J.aLx=-0.4; J.aRx=-0.2; return J; },
  crouch(){ const J=P0(); J.hd=0.42; J.hp=0.55; J.sp=0.35; J.nx=-0.2; J.lLx=-1.0; J.lRx=-0.85; J.kL=1.55; J.kR=1.45; J.fL=0.55; J.fR=0.5; J.aLx=-0.6; J.aRx=-0.4; J.aLz=J.aRz=0.3; J.eL=J.eR=0.8; return J; },
  tuck(){ const J=P0(); J.hd=norah.c.R.hip0-0.16; J.hp=0.1; J.sp=0.5; J.nx=-0.1; J.lLx=-1.5; J.lRx=-1.4; J.kL=2.3; J.kR=2.2; J.fL=0.6; J.fR=0.55; J.aLx=-0.3; J.aRx=0.4; J.aLz=J.aRz=0.35; J.eL=J.eR=0.3; return J; },
  up(t,u){ return u<0.2? mix(NG.lie(t,0),NG.sit(),sm5(u/0.2)) : u<0.35? mix(NG.sit(),NG.tuck(),sm5((u-0.2)/0.15)) : u<0.5? mix(NG.tuck(),NG.knee(),sm5((u-0.35)/0.15)) : u<0.72? mix(NG.knee(),NG.crouch(),sm5((u-0.5)/0.22)) : mix(NG.crouch(),NQ.aim(),sm5((u-0.72)/0.28)); } };
const HIPLEN=()=>norah.c.R.hip0*0.97;
let altK={}; const outcome=(id,a,b)=>{ const v=document.getElementById(id).value; if(v==="alt"){ altK[id]=!altK[id]; return altK[id]?a:b; } return v; };

// ================================================================ the clips
// ---- looms at range: it comes on slowly, swaying, and stops at the edge of its reach. When she steps in, it backs off
// to keep that distance, and settles again.
A.loom={ start(ctx){ ctx.x=NX-REACH()-2.4; ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.T={mode:"in"}; ctx.nx=NX; ctx.nph=0; },
  step(t,dt,ctx){ const T=ctx.T, R=REACH();
    // her: steps in on it at 4.6 s
    if(t>4.6&&t<5.8){ ctx.nph+=dt/0.8; ctx.nx=NX-0.95*sm5((t-4.6)/1.2); ctx.nOver={J:NQ.walk(ctx.nph),x:ctx.nx}; } else ctx.nOver={J:NQ.aim(),x:ctx.nx};
    const gap=ctx.nx-ctx.x; let J;
    if(T.mode==="in"){ if(gap>R){ gaitOn(ctx,dt,1,1.7); J=rWalk(t,ctx.ph); ctx.phase="comes on slowly, swaying"; } else if(gaitStop(ctx,dt,1,1.7)){ T.mode="hold"; J=rStand(t); tLegs(J,ctx.ph); } else J=rWalk(t,ctx.ph); }
    else if(T.mode==="hold"){ J=tLegs(rStand(t),ctx.ph); ctx.phase= t<4.6?"stops at the edge of its reach · sways":"she steps in"; if(gap<R-0.45) T.mode="back"; }
    else if(T.mode==="back"){ if(gap<R-0.05){ gaitOn(ctx,dt,-1,1.3); J=rWalk(t,ctx.ph); ctx.phase="backs off to keep its distance"; } else if(gaitStop(ctx,dt,-1,1.3)){ T.mode="hold2"; J=tLegs(rStand(t),ctx.ph); } else J=rWalk(t,ctx.ph); }
    else { J=tLegs(rStand(t),ctx.ph); ctx.phase="looms at range again"; }
    ctx.post=()=>{ if(KIND()==="neck") neckTo(neckShape(loomP(t)),nHead(),0.15); else { armTo("L",drape("L",t)); armTo("R",drape("R",t)); } };
    if(T.mode==="in"||T.mode==="back") ctx.events.push({kind:"drag"});
    return fin(J); } };
A.loom.phys=TPHYS;

// ---- whip headbutt: the neck draws back into an S (the tell), then snaps out straight, the base first and the head last,
// and the head slams into her from out of her reach
A.whip={ start(ctx){ ctx.x=NX-(0.92*RC.L+0.42); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.T={}; ctx.shot=false; },
  step(t,dt,ctx){ return whipStep(t,dt,ctx,null); } };
function whipStep(t,dt,ctx,shotAt){ const T=ctx.T, J=rStand(t), L=RC.L, t0=0.7, t1=1.55, look=nHead();
  if(!T.hit) ctx.nOver={J:NQ.aim(),x:NX};
  const COIL={lean:-0.95, bend:2.6, pw:1.0, wave:L>2?0.35:0.05, wk:1.4, sway:0.05*Math.sin(t*3)};
  const cw=sm5((t-t0)/(t1-t0-0.1)); let P=mixP(loomP(t),COIL,cw);
  // shot in the neck (the neck-shot clip): it buckles and wobbles; the strike still comes, but goes wide and low
  let wob=0, sag=0; if(shotAt!=null&&t>shotAt){ const k=t-shotAt; wob=0.9*Math.exp(-1.6*k)*Math.sin(k*11); sag=0.9*sm5(k/0.25)*Math.exp(-0.45*Math.max(0,k-0.6)); P.sway=(P.sway||0)+wob; P.wph=(P.wph||0)+k*9; P.wave=(P.wave||0)+0.35*wob; P.bend+=0.9*sag; P.lean+=0.5*sag; }
  J.sp=0.12-0.18*cw; J.kL+=0.08*cw; J.kR+=0.08*cw;
  let path=neckShape(P), phase= t<t0?"looms · out of her reach": t<t1?"draws its neck back into an S (the tell)":"";
  if(t>=t1){ const k=t-t1, root=nRoot(), aim=shotAt!=null? look.clone().add(new V3(0,-0.75,1.05)) : look.clone(); const dir=aim.clone().sub(root).normalize();
    const end=aim.clone().addScaledVector(dir,-0.12).sub(hOff()), strike=root.distanceTo(end)<L? fitLen(h=>mkPath([root, root.clone().lerp(end,0.5).add(new V3(0,h,0)), end]), L, 0, 2*L) : mkPath([root, root.clone().lerp(end,0.5).add(new V3(0,0.06,0)), end]);   /* a long neck arcs up into it so the head ends on her, not through her */
    const out=s=>sm5((k-0.11*s/L)/0.15), back=sm5((k-0.75)/0.9), w=s=>out(s)*(1-back);
    path=lerpPath(path,strike,w); J.sp+=0.38*out(0)*(1-back); J.hp+=0.14*out(0)*(1-back); J.kL+=0.1*out(0); J.kR+=0.1*out(0);
    if(!T.hit&&!T.miss&&out(L)>0.85){ runner.group.updateMatrixWorld(true); }
    phase= k<0.22?"snaps out: the base first, the head last" : back<0.5? (T.hit?"the head slams into her":T.miss?"goes wide":"") : "draws back, trembling";
    ctx.post=()=>{ neckTo(path,look,0.05); const h=headAt(); if(!T.hit&&!T.miss&&out(L)>0.6){ if(shotAt==null&&(h.distanceTo(look)<0.4||(out(L)>0.97&&h.distanceTo(look)<0.65))){ T.hit=t; ctx.events.push({kind:"whip"}); } else if(out(L)>0.97){ T.miss=t; ctx.events.push({kind:"whipMiss"}); } } };
    if(T.hit){ ctx.nOver=null; } ctx.phase=phase||ctx.phase; return fin(J); }
  if(shotAt!=null&&t>shotAt){ phase= t-shotAt<0.9?"shot in the neck · it buckles and wobbles":"the strike comes anyway"; }
  ctx.post=()=>neckTo(path,look,cw*-0.1); ctx.phase=phase; return fin(J); }
A.whip.phys=TPHYS;

// ---- bite from above: it raises the neck tall, arches it over her, and the head comes down onto her shoulder from above
A.bite={ start(ctx){ ctx.x=NX-(0.36*RC.L+0.42); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.T={}; },
  step(t,dt,ctx){ const T=ctx.T, J=rStand(t), L=RC.L, t0=0.6, t1=1.4, t2=1.95, rel=2.95;
    const RAISE={lean:-0.05, bend:0.45, pw:2, wave:L>2?0.12:0, sway:0.05*Math.sin(t*2)};
    const rw=sm5((t-t0)/(t1-t0)), lw=sm5((t-rel)/0.9); let P=mixP(mixP(loomP(t),RAISE,rw),loomP(t),lw), path=neckShape(P);
    const sh=nBone("upperarm_L").add(new V3(0,0.1,0)).sub(hOff()), look=sh.clone();
    if(t>=t1&&t<rel+0.9){ const root=nRoot(), mid=root.clone().lerp(sh,0.5);
      const arc=fitLen(h=>mkPath([root, root.clone().add(new V3(0,0.4*h,0)), mid.clone().setY(Math.max(root.y,sh.y)+h), sh.clone().add(new V3(0,0.45,0)), sh.clone()]), L+0.02, 0.05, 3*L);
      const go=s=>Math.pow(sat((t-t1-0.12*s/L)/(t2-t1-0.08)),1.6)*(1-lw);   /* it accelerates down onto her, the base leading */ path=lerpPath(path,arc,go); }
    const bit=T.bit!=null?t-T.bit:-1;
    ctx.phase= t<t0?"looms": t<t1?"raises its neck tall over her": t<t2?"arches over and comes down on her": t<rel?"bites into her shoulder, worrying at it":"lets go and rises back";
    if(bit>=0&&t<rel){ const sh2=Math.sin(bit*26)*0.06*(1-sat(bit/0.9)); const p0=path; path=s=>{ const q=p0(s); q.z+=sh2*sat(s/L)**2; return q; }; }
    ctx.post=()=>{ neckTo(path,t<t1?nHead():look,t<t1?0.25:0.9); if(T.bit==null&&t>t1+0.2&&headAt().distanceTo(sh)<0.32){ T.bit=t; ctx.events.push({kind:"bite"}); } };
    // her: aims; it lands on her and she buckles under it, then staggers back
    if(bit<0) ctx.nOver={J:t>t0?NQ.aimUp():NQ.aim(),x:NX}; else if(t<rel+0.2){ ctx.nOver={J:NP.crushed(t,0.6+0.3*Math.sin(bit*9)),x:NX}; } else { const k=t-rel-0.2; const n=k<0.6?NP.stumble():NQ.aim(); ctx.nOver={J:n,x:NX+0.4*sm5(k/0.5)}; }
    J.sp+=0.15*rw*(1-lw); return fin(J); } };
A.bite.phys=TPHYS;

// ---- neck coil: the neck goes out to her and wraps round her chest and shoulders, then squeezes. She pries at it (mash):
// she breaks free, or it brings its head round into her face and bites.
A.coil={ start(ctx){ ctx.T={}; ctx.x=NX-clamp(0.3*RC.L+0.42,0.62,1.3); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.out=outcome("oCoil","free","fail"); ctx.mash=0; },
  step(t,dt,ctx){ const T=ctx.T, J=rStand(t), L=RC.L, t0=0.6, t1=1.35, t2=3.3;
    const c=new V3(NX,0,0), Rr=0.27-0.035*sat((t-t1)/0.3)-0.02*Math.max(0,Math.sin((t-t1)*5))*(t>t1?1:0), root=nRoot();
    const hTop=1.45, hBot=1.12, ang0=Math.PI, q1=c.clone().add(new V3(-Rr,hTop,0)), appr=root.distanceTo(q1)*1.08;
    const turns=clamp((L-appr)/(2*Math.PI*0.27),0.45,1.6), hel=[]; for(let i=0;i<=24;i++){ const u=i/24, a=ang0-2*Math.PI*turns*u; hel.push(new V3(c.x+Rr*Math.cos(a),hTop+(hBot-hTop)*u,c.z+Rr*Math.sin(a))); }
    const mid=root.clone().lerp(q1,0.55).add(new V3(0,0.12,0)), full=mkPath([root, mid, ...hel]), sA=mkPath([root,mid,q1]).len;
    // her answer: free (she pries it loose) or fail (it bites)
    let unwind=0; if(ctx.out==="free"&&T.free) unwind=sm5((t-T.free)/0.45); if(ctx.out==="fail"&&T.bit) unwind=sm5((t-T.bit-0.9)/0.6);
    const p=sm5((t-t0)/(t1-t0))*(1-unwind), at=sA+p*Math.max(0.05,L-sA), wrap=cutPath(full,at);
    const ww=s=>sat((t-t0)/0.25)*(1-sat((unwind-0.7)/0.3)); let path=lerpPath(neckShape(loomP(t)),wrap,ww);
    // the bite: part of the coil comes loose and the head swings round over her shoulder into her face
    if(ctx.out==="fail"&&T.bit){ const face=nHead().add(new V3(-0.2,-0.04,0)).sub(hOff()), bp=mkPath([root, mid, ...hel.slice(0,Math.max(3,Math.round(hel.length*0.55))), face.clone().add(new V3(0,0.12,0.12)), face]), bw=sm5((t-T.bit)/0.3)*(1-sat((t-T.bit-0.9)/0.6)); path=lerpPath(path,bp,bw); }
    const face=nHead(), bitF= ctx.out==="fail"&&T.bit? Math.sin(sat((t-T.bit)/0.5)*Math.PI) : 0;
    ctx.post=()=>{ neckTo(path, bitF>0? face.clone().add(new V3(0,-0.15,0)) : face, 0.1+0.6*bitF); };
    J.sp+=0.22*p; J.hp+=0.06*p; J.kL+=0.06*p; J.kR+=0.06*p;
    const held=p>0.9&&!(ctx.out==="free"&&T.free);
    if(held&&t>t1){ ctx.mash=Math.min(1,ctx.mash+dt*(ctx.out==="free"?0.55:0.3)); ctx.qte=ctx.out==="free"?ctx.mash:Math.min(0.55,ctx.mash); }
    if(ctx.out==="free"&&ctx.mash>=1&&!T.free){ T.free=t; ctx.events.push({kind:"pryFree"}); }
    if(ctx.out==="fail"&&t>t2+0.2&&!T.bit){ T.bit=t; ctx.events.push({kind:"coilBite"}); }
    if(T.free){ const k=t-T.free; ctx.qte=null; ctx.nOver={J:k<0.6?NP.stumble():NQ.aim(),x:NX+0.45*sm5(k/0.5)}; }
    else if(T.bit){ const k=t-T.bit; ctx.nOver={J:k<0.6?NQ.coiled(t,1.6):mix(NQ.coiled(t,0.3),NQ.knees(t),sm5((k-0.6)/0.8)),x:NX}; if(k>0.9) ctx.qte=null; }
    else ctx.nOver={J:p>0.5?NQ.coiled(t,1):NQ.aim(),x:NX};
    ctx.phase= t<t0?"looms close": t<t1?"its neck goes out and round her": T.free? (t-T.free<0.5?"she pries it loose · it unwinds":"recoils") : T.bit? (t-T.bit<0.9?"brings its head round into her face · bites":"unwinds and lets her drop") : "squeezes · mash to pry it loose";
    return fin(J); } };
A.coil.phys=TPHYS;

// ---- shot in the neck: it is mid-strike; the neck buckles and sways, and the strike goes wide
A.neckshot={ start(ctx){ ctx.x=NX-(0.92*RC.L+0.42); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.T={}; },
  step(t,dt,ctx){ const T=ctx.T; if(t>1.1&&!T.shot){ T.shot=t; ctx.events.push({kind:"neckShot"}); }
    return whipStep(t+(t>1.1?-Math.min(0.9,(t-1.1)*0.6):0),dt,ctx,T.shot?1.1:null); } };
A.neckshot.phys=TPHYS;

// ---- long swipe: one arm comes up off the floor and out wide behind it, then sweeps across in front at waist height,
// the hand trailing, and slaps her aside from three metres
A.swipe={ start(ctx){ ctx.x=NX-0.78*ALEN("R")+0.1; ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.T={}; },
  step(t,dt,ctx){ const T=ctx.T, J=rStand(t), t0=0.8, t1=1.65, t2=2.1, t3=2.9, t4=3.7;
    const wu=sm5((t-t0)/(t1-t0)), sw=sm5((t-t1)/(t2-t1)), ft=sm5((t-t2)/(t3-t2)), bk=sm5((t-t3)/(t4-t3));
    const a= t<t1? 1.9 : t<t2? 1.9-2.8*sw : -0.9-0.4*ft, ad=t>=t1&&t<t2? -2.8*6/(4*(t2-t1))*Math.sin(Math.PI*sat((t-t1)/(t2-t1))) : 0;
    const elev= t<t1? 1.7 : t<t2? 1.7-0.65*sw : 1.05-0.95*ft, bend=clamp(-ad*0.06,0,0.5);
    const line=armLine("R",a,elev,bend), path=lerpPath(drape("R",t),line,wu*(1-bk));
    J.syaw=-0.35*wu*(1-sw)+0.45*sw*(1-bk); J.sroll=0.12*wu*(1-bk); J.sp+=0.1*sw*(1-bk); J.kL+=0.08*wu; J.kR+=0.08*wu;
    ctx.post=()=>{ armTo("L",drape("L",t,{spread:-0.2*wu*(1-bk)})); armTo("R",path); if(!T.hit&&t>t1){ const b=bearing("R",nBone("hips")); if(a<b+0.05){ T.hit=t; ctx.events.push({kind:"swipe"}); } } };
    ctx.phase= t<t0?"looms · arms on the floor": t<t1?"one arm comes up and out wide behind it": t<t2?"sweeps across at her waist": t<t3?"follows through, the hand trailing":"drags it back along the floor";
    if(T.hit){ const h=t-T.hit; ctx.nOver={J:h<0.25?NP.stumble():NQ.flat(h-0.25),x:NX,z:-0.85*sm5(h/0.45),roll:-PHYS.topple(ctx.nT||(ctx.nT={th:0.2,w:2.2}),dt,1.65,1.45)*Math.PI/2*0.95,yaw:-Math.PI/2}; }
    else ctx.nOver={J:NQ.aim(),x:NX};
    return fin(J); } };
A.swipe.phys=TPHYS;

// ---- snatch and reel in: an arm shoots out flat and wraps round her waist; it hauls her in hand over hand, the slack piling
// on the floor, and bends to bite. She breaks the grip (mash), or it bites her shoulder.
A.snatch={ start(ctx){ ctx.x=NX-0.74*ALEN("R"); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.T={}; ctx.nx=NX; ctx.out=outcome("oSnatch","free","fail"); ctx.mash=0; },
  step(t,dt,ctx){ const T=ctx.T, J=rStand(t), t0=0.7, t1=1.05, near=ctx.x+0.68, L=ALEN("R");
    // her: hauled in once it has her
    if(T.grab&&!T.free&&!T.bit){ const v=Math.min(1.7,(t-T.grab)*2.2); ctx.nx=Math.max(near,ctx.nx-v*dt); }
    const W=new V3(ctx.nx,1.0,0), toR=new V3(-1,0,0), Rw=0.21, front=W.clone().addScaledVector(toR,Rw);
    const wrapPts=b=>{ const out=[]; for(let i=1;i<=10;i++){ const a=Math.PI-i/10*2*Math.PI*0.8; out.push(new V3(W.x+Rw*Math.cos(a),1.0-0.04*i/10,Rw*Math.sin(a))); } return out; };
    const S=shoulder("R"), grab=fitLen(b=>mkPath([S, S.clone().lerp(front,0.45).addScaledVector(lat("R"),b*0.6).setY(Math.max(0.07,S.y-b*1.4)), front, ...wrapPts()]), L, 0, 3);
    let unw=0; if(T.free) unw=sm5((t-T.free)/0.5); if(T.bit) unw=sm5((t-T.bit-0.8)/0.6);
    const shoot=sm5((t-t0)/(t1-t0))*(1-unw), path=lerpPath(drape("R",t),grab,s=>sat(shoot*1.25-0.25*s/L));
    if(!T.grab&&t>=t1){ T.grab=t; ctx.events.push({kind:"snatch"}); }
    const gap=ctx.nx-ctx.x, bend=T.grab? sm5((t-T.grab-0.5)/0.8)*(1-unw) : 0;
    J.sp+=0.15*shoot+0.45*bend*(gap<1.2?1:0.4); J.hp+=0.12*bend; J.kL+=0.15*bend; J.kR+=0.15*bend; J.syaw=-0.25*shoot;
    const bite=ctx.out==="fail"&&T.bit? Math.sin(sat((t-T.bit)/0.5)*Math.PI):0; J.sp+=0.3*bite; J.nx+=0.5*bite;
    ctx.post=()=>{ armTo("L",drape("L",t)); armTo("R",path); };
    const held=T.grab&&!T.free&&!T.bit; if(held){ ctx.mash=Math.min(1,ctx.mash+dt*(ctx.out==="free"?0.5:0.26)); ctx.qte=ctx.out==="free"?ctx.mash:Math.min(0.55,ctx.mash); }
    if(ctx.out==="free"&&ctx.mash>=1&&!T.free){ T.free=t; ctx.events.push({kind:"snatchFree"}); }
    if(ctx.out==="fail"&&!T.bit&&T.grab&&gap<1.0&&t-T.grab>1.6){ T.bit=t; ctx.events.push({kind:"snatchBite"}); }
    if(T.free){ const k=t-T.free; ctx.qte=null; ctx.nOver={J:k<0.6?NP.stumble():NQ.aim(),x:ctx.nx+0.5*sm5(k/0.5)}; }
    else if(T.bit){ const k=t-T.bit; if(k>0.6) ctx.qte=null; ctx.nOver={J:k<0.4?NP.crushed(t,0.8):mix(NP.crushed(t,0.5),NQ.knees(t),sm5((k-0.4)/0.8)),x:ctx.nx}; }
    else ctx.nOver={J:T.grab?NQ.dragged(t):NQ.aim(),x:ctx.nx};
    ctx.phase= t<t0?"looms · arms on the floor": !T.grab?"an arm shoots out at her": T.free? (t-T.free<0.5?"she breaks its grip":"the arm drops back") : T.bit? (t-T.bit<0.8?"bends and bites her shoulder":"lets her drop") : gap>1.2?"reels her in · the slack piling on the floor":"bends to bite · mash to break the grip";
    return fin(J); } };
A.snatch.phys=TPHYS;

// ---- trip from range: an arm sweeps low along the floor and takes her feet out; while she's down the other arm comes up
// over and down onto her chest and drags her toward it. She kicks it off and gets up.
A.trip={ start(ctx){ ctx.x=NX-0.74*ALEN("L"); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.T={}; ctx.nX=NX; },
  step(t,dt,ctx){ const T=ctx.T, J=rStand(t), t0=0.7, t1=1.15, t2=1.6, D=1.5;
    // the sweep: its left arm draws out to the side on the floor, then sweeps across through her ankles
    const wu=sm5((t-t0)/(t1-t0)), sw=sm5((t-t1)/(t2-t1)), back=sm5((t-t2-0.3)/0.9);
    const a= t<t1? 1.25*wu : 1.25-1.75*sw, sweep=armLine("L",a,0.07,clamp(0.35*sw*(1-sw)*4,0,0.35),null,true);
    const pL=lerpPath(drape("L",t),sweep,wu*(1-back));
    if(!T.trip&&t>t1){ const b=bearing("L",nBone("foot_L")); if(a<b+0.05){ T.trip=t; ctx.events.push({kind:"trip"}); } }
    // the pin: its right arm over the top and down onto her chest
    const k=T.trip?t-T.trip:-1, pinUp=sm5((k-0.9)/0.6), down=Math.pow(sat((k-1.5)/0.3),1.7), lift=T.free?sm5((t-T.free)/0.5):0;
    const chest=nBone("chest").add(new V3(0,0.12,0)), S=shoulder("R"), L=ALEN("R");
    const over=fitLen(h=>mkPath([S, S.clone().add(new V3(0,0.3*h,0)).addScaledVector(TP().fwd,0.3), S.clone().lerp(chest,0.55).setY(S.y+h), chest.clone().add(new V3(0,0.5,0)), chest]), L, 0.05, 4);
    const high=armLine("R",0.15,S.y+1.1,0.3), upP=lerpPath(drape("R",t),high,pinUp*(1-lift)), pR=lerpPath(upP,over,down*(1-lift));
    if(k>=0&&down>=1&&!T.pin){ T.pin=t; ctx.events.push({kind:"pin"}); }
    const dragging=T.pin&&!T.free&&t-T.pin<1.3; if(dragging){ ctx.nX-=dt*0.5; } if(T.pin&&!T.free&&t-T.pin>1.7){ T.free=t; ctx.events.push({kind:"kickFree"}); }
    J.syaw=0.3*wu*(1-back)-0.2*pinUp*(1-lift); J.sp+=0.12*wu+0.15*down*(1-lift); J.kL+=0.1*wu; J.kR+=0.1*wu;
    ctx.post=()=>{ armTo("L",pL); armTo("R",pR); };
    // her: swept off her feet backward; down on her back; dragged; kicks free and gets up
    if(k<0) ctx.nOver={J:NQ.aim(),x:NX};
    else if(k<D){ ctx.nOver={J:NQ.flat(k),x:NX,fall:PHYS.topple(ctx.nT||(ctx.nT={th:0.35,w:3.2}),dt,1.65,1.45)}; ctx.nX=NX+HIPLEN(); }
    else if(!T.free) ctx.nOver={J:NG.lie(t,dragging?1:0.4),x:ctx.nX,down:true};
    else { const u=sat((t-T.free-0.35)/1.9); ctx.nOver={J:u>0?NG.up(t,u):NG.lie(t,1),x:ctx.nX,down:u<0.72,up:u>0}; }
    ctx.phase= t<t0?"looms · arms on the floor": t<t1?"its arm draws out to the side along the floor": k<0?"sweeps it through her ankles": k<0.9?"takes her feet out": !T.pin?"the other arm comes up and over": !T.free?"pins her and drags her toward it": t-T.free<0.5?"she kicks it off":"she gets up";
    return fin(J); } };
A.trip.phys=TPHYS;

// ---- an arm shot off: she shoots it at one of its three main joints. The rest of the arm drops; the stump thrashes and
// bleeds, and its next swipe falls short of her.
let jAlt=0;
A.armshot={ start(ctx){ ctx.x=NX-0.74*ALEN("R"); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.T={}; const v=document.getElementById("oJoint").value; ctx.joint= v==="alt"? (jAlt=jAlt%3+1) : +v; },
  step(t,dt,ctx){ const T=ctx.T, J=rStand(t), ts=1.0, c=RC.main[ctx.joint-1], Ls=RC.cum.R[c];
    ctx.nOver={J:NQ.aim(),x:NX};
    if(t>=ts&&!T.shot){ T.shot=t; ctx.events.push({kind:"armShot",joint:c}); }
    const k=T.shot&&t>T.shot?t-T.shot:-1;   /* the frame of the shot is posed as it stood: that is what gets cut off */
    // after: recoil a step, the stump thrashing; then a swipe with what's left, short of her
    let pR=drape("R",t);
    if(k>=0){ const th=Math.exp(-0.9*k), a=0.9*Math.sin(k*8.5)*th+0.4, el=shoulder("R").y+0.7*Math.sin(k*6.3+1)*th-0.35*(1-th);
      const thrash=armLine("R",a,el,0.4*Math.sin(k*11)*th,Ls), hang=mkPath([shoulder("R"), shoulder("R").addScaledVector(lat("R"),0.15+0.1*Math.sin(k*2.6)).add(new V3(0,-Ls,0)).addScaledVector(TP().fwd,0.1*Math.sin(k*1.9))]);
      const s0=2.2, s1=2.75, sw=sm5((k-s0)/(s1-s0)), wu=sm5((k-1.6)/0.6), done=sm5((k-s1-0.3)/0.6);
      const swing=armLine("R",1.6-2.6*sw,1.2,0.3*sw*(1-sw)*4,Ls);
      pR=lerpPath(lerpPath(thrash,swing,wu*(1-done)),hang,done);
      if(sw>0.5&&!T.short){ T.short=t; ctx.events.push({kind:"short"}); }
      if(k<1.5&&Math.random()<dt*14) ctx.events.push({kind:"bleed"}); }
    ctx.post=()=>{ armTo("L",drape("L",t)); armTo("R",pR, k>=0?c:null); };
    if(k>=0&&k<1.0){ gaitOn(ctx,dt,-1,1.0); const W=rWalk(t,ctx.ph); W.sp-=0.2*Math.exp(-3*k); ctx.phase="the arm drops · the stump thrashes, bleeding"; return fin(W); }
    if(k>=1.0&&!T.st){ if(gaitStop(ctx,dt,-1,1.0)) T.st=1; else return fin(rWalk(t,ctx.ph)); }
    tLegs(J,ctx.ph); J.syaw= k>1.6&&k<3.1? 0.35*Math.sin(sat((k-1.6)/1.4)*Math.PI) : 0;
    ctx.phase= k<0?"looms · arms on the floor": k<1.6?"backs off, the stump thrashing": k<2.9?"swipes with what's left · falls short":"the stump swings loose";
    return fin(J); } };
A.armshot.phys=TPHYS;

// ---- the cut arm and blood: the piece shot off is baked from the skin as it was and falls as one rigid body; blood
// drips from the stump and pools
const PIECES=[], BLOOD=[];
function goreClear(){ for(const p of PIECES) scene.remove(p.m); for(const b of BLOOD) scene.remove(b.m); PIECES.length=0; BLOOD.length=0;
  if(runner&&runner.cap){ runner.cap.parent&&runner.cap.parent.remove(runner.cap); runner.cap=null; }
  if(runner&&runner.ar){ for(const s of ["L","R"]){ const A=runner.ar[s]; A.cut=null; for(let k=1;k<RC.F.length;k++){ const b=runner.B["ar"+s+k]; b.scale.setScalar(1); b.userData.detached=false; } } runner.pb=null; } }
function cutArm(s,c){ let mesh; runner.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); runner.group.updateMatrixWorld(true);
  const g=mesh.geometry, U2=g.attributes.uv2, P=g.attributes.position, uv=g.attributes.uv, idx=g.index, sg=s==="L"?1:-1, f0=RC.F[c], keep=new Map(), pos=[], uvs=[], v=new V3(), cen=new V3();
  for(let i=0;i<P.count;i++){ if(Math.round(U2.getX(i))!==sg||U2.getY(i)<f0-0.004) continue; v.fromBufferAttribute(P,i); mesh.boneTransform(i,v); v.applyMatrix4(mesh.matrixWorld); keep.set(i,pos.length/3); pos.push(v.x,v.y,v.z); uvs.push(uv.getX(i),uv.getY(i)); cen.add(v); }
  cen.divideScalar(Math.max(1,keep.size)); for(let q=0;q<pos.length;q+=3){ pos[q]-=cen.x; pos[q+1]-=cen.y; pos[q+2]-=cen.z; }
  const ind=[]; for(let q=0;q<idx.count;q+=3){ const a=keep.get(idx.getX(q)), b=keep.get(idx.getX(q+1)), d=keep.get(idx.getX(q+2)); if(a!=null&&b!=null&&d!=null) ind.push(a,b,d); }
  const ng=new THREE.BufferGeometry(); ng.setAttribute("position",new THREE.Float32BufferAttribute(pos,3)); ng.setAttribute("uv",new THREE.Float32BufferAttribute(uvs,2)); ng.setIndex(ind); ng.computeVertexNormals();
  const mat=new THREE.MeshLambertMaterial({map:mesh.material.map,side:THREE.DoubleSide}), m=new THREE.Mesh(ng,mat); m.position.copy(cen); scene.add(m);
  const sample=[]; for(let q=0;q<pos.length;q+=3*Math.max(1,Math.floor(pos.length/3/80))) sample.push(new V3(pos[q],pos[q+1],pos[q+2]));
  PIECES.push({m,v:new V3(0,0.4,0).addScaledVector(TP().fwd,0.3),w:new V3(0,0,0),sample});
  // the arm beyond the joint is gone from the body: hidden, and no longer part of its mass or its contact with the floor
  const A=runner.ar[s]; A.cut=c; for(let k=c;k<RC.F.length;k++){ const b=runner.B["ar"+s+k]; b.userData.detached=true; } runner.B["ar"+s+c].scale.setScalar(0.001); runner.pb&&runner.pb.refresh();
  const cap=new THREE.Mesh(new THREE.SphereGeometry(0.055,8,6),new THREE.MeshLambertMaterial({color:0x5a0a0a})); cap.scale.set(1,0.6,1); const pb=runner.B["ar"+s+(c-1)]||runner.B["upperarm_"+s]; pb.add(cap); cap.position.copy(runner.B["ar"+s+c].position); runner.cap=cap; }
function pieceStep(dt){ for(const p of PIECES){ if(p.rest) continue; p.v.y-=9.8*dt; p.m.position.addScaledVector(p.v,dt); const wl=p.w.length(); if(wl>1e-4) p.m.rotateOnWorldAxis(p.w.clone().divideScalar(wl),wl*dt);
    p.m.updateMatrixWorld(true); let lo=1e9, lp=null; const q=new V3(); for(const s of p.sample){ q.copy(s).applyMatrix4(p.m.matrixWorld); if(q.y<lo){ lo=q.y; lp=q.clone(); } }
    if(lo<0.012){ p.m.position.y+=0.012-lo; if(p.v.y<-0.6){ puff(lp,1.2); BLOODsplat(lp,6); } p.v.y=Math.max(0,-0.15*p.v.y); p.v.x*=0.7; p.v.z*=0.7;
      // gravity on a long piece touching at one end: it tips over about that point until it lies flat
      let hi=-1e9; for(const s of p.sample){ q.copy(s).applyMatrix4(p.m.matrixWorld); hi=Math.max(hi,q.y); }
      const arm=p.m.position.clone().sub(lp), tq=new V3(arm.z,0,-arm.x);
      if(hi-lo>0.16&&tq.lengthSq()>1e-6){ p.w.copy(tq.normalize().multiplyScalar(Math.min(3.5,p.w.length()+6*dt))); } else { p.w.multiplyScalar(0.3); if(p.v.length()<0.05) p.rest=true; } } } }
function BLOODsplat(p,n){ for(let i=0;i<n;i++){ const m=new THREE.Mesh(new THREE.BoxGeometry(0.025,0.025,0.025),new THREE.MeshLambertMaterial({color:0x5a0606})); m.position.copy(p); scene.add(m); BLOOD.push({m,v:new V3((Math.random()-0.5)*2.4,0.6+Math.random()*1.8,(Math.random()-0.5)*2.4)}); } }
function goreStep(dt){ pieceStep(dt);
  for(const b of BLOOD){ if(b.rest) continue; b.v.y-=9.8*dt; b.m.position.addScaledVector(b.v,dt); if(b.m.position.y<=0.006){ b.m.position.y=0.006; b.rest=true; b.m.scale.set(1.6+Math.random()*2,0.12,1.6+Math.random()*2); } } }

const ORDERS={neck:["loom","whip","bite","coil","neckshot"],arm:["loom","swipe","snatch","trip","armshot"]};
const LEN={loom:9.5, whip:4.6, bite:5.2, coil:5.6, neckshot:5.2, swipe:4.6, snatch:5.4, trip:7.6, armshot:6.4};
const NAMES={loom:"Looms at range",whip:"Whip headbutt",bite:"Bite from above",coil:"Neck coil",neckshot:"Shot in the neck",swipe:"Long swipe",snatch:"Snatch and reel in",trip:"Trip from range",armshot:"Arm shot off"};
const DMG={whip:["NORAH −25","the head slams into her"],whipMiss:["MISS","the strike goes wide"],bite:["NORAH −20","bitten from above"],pryFree:["PRIED LOOSE","she breaks out of the coil"],coilBite:["NORAH −30","bitten in the face"],
  swipe:["NORAH −15","slapped aside"],snatch:["GRABBED","an arm round her waist"],snatchFree:["BROKE FREE","she breaks its grip"],snatchBite:["NORAH −25","bitten"],trip:["DOWN","her feet swept out"],pin:["NORAH −10","pinned and dragged"],kickFree:["KICKED FREE","she kicks it off"],
  armShot:["ARM OFF","shot through a joint"],neckShot:["NECK SHOT","it buckles · the strike goes wide"],short:["MISS","the arm's too short now"]};
const RCEV={ whip(){ norah.kb=1; norah.kt=0; norah.kv=3.4; norah.x=NX; shake=Math.max(shake,0.28); puff(nHead(),1.4); },
  whipMiss(){ shake=Math.max(shake,0.1); const p=headAt(); p.y=0.05; puff(p,1); },
  bite(){ shake=Math.max(shake,0.18); BLOODsplat(nBone("upperarm_L"),8); }, coilBite(){ shake=Math.max(shake,0.2); BLOODsplat(nHead(),10); }, snatchBite(){ shake=Math.max(shake,0.18); BLOODsplat(nBone("upperarm_L"),8); },
  pryFree(){ shake=Math.max(shake,0.08); }, snatchFree(){ shake=Math.max(shake,0.08); }, snatch(){ shake=Math.max(shake,0.1); puff(nBone("hips"),1); },
  swipe(){ shake=Math.max(shake,0.25); puff(nBone("hips"),1.6); }, trip(){ shake=Math.max(shake,0.16); const p=nBone("foot_L"); puff(p,1.6); }, pin(){ shake=Math.max(shake,0.2); puff(nBone("chest").setY(0.1),1.6); },
  kickFree(){ shake=Math.max(shake,0.1); },
  armShot(e){ muzzleFlash(); runner.group.updateMatrixWorld(true); const p=runner.ar.R.piv[e.joint].getWorldPosition(new V3()); puff(p,0.7); BLOODsplat(p,14); shake=Math.max(shake,0.12); cutArm("R",e.joint); },
  neckShot(){ muzzleFlash(); runner.group.updateMatrixWorld(true); const p=runner.nk[Math.floor(runner.nk.length/2)].getWorldPosition(new V3()); puff(p,0.6); BLOODsplat(p,12); shake=Math.max(shake,0.1); },
  bleed(){ const A=runner.ar.R; if(A.cut==null) return; const p=A.piv[A.cut].getWorldPosition(new V3()); BLOODsplat(p,1); },
  short(){ shake=Math.max(shake,0.05); }, drag(){ if(KIND()==="arm"&&Math.random()<0.05){ for(const s of ["L","R"]){ const p=armTip(s); p.y=0.03; puff(p,0.35); } } } };
