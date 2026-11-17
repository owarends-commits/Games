// ================================================================ the SPLIT-HEAD REACHER (unique · f01)
// Her head is split across: the skull with the upper fangs on top, a deep mouth, and a lower flap fanged along its top
// edge with her own face hanging upside-down beneath it. Her body sits in the next room; the neck (stretched at load
// from 2.7 m to 5 m: the model file is untouched) runs out along the floor and through the doorway, and the head hunts
// on it. The neck lies on the floor wherever it isn't lifting the head, so its weight is carried by the floor; the face
// and the hair hang under gravity on their own joints.
const SH={ BX:-0.95, DZ:0.55, NXs:3.0, L:5.0 };
const QI=()=>new THREE.Quaternion();
let SPL=null;
/* the body settles onto the floor after the neck is laid (the physics guard's offset, steady while it sits): the neck is laid against the floor as it will be after that */
const GE=()=>(runner&&runner.gs&&runner.gs.e)||0, FLR=()=>RC.r-GE();   /* the head's split rig, in head-local metres */

// ---- load time 1: stretch the neck along its own centre line (thickness kept), and carry the head out to the new end
function stretchNeck(gltf,Lwant){ if(gltf.userData.stretched) return; gltf.userData.stretched=1;
  let mesh; gltf.scene.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); gltf.scene.updateMatrixWorld(true);
  const g=mesh.geometry, sk=mesh.skeleton, bones=sk.bones, inv=sk.boneInverses, P=g.attributes.position, SI=g.attributes.skinIndex, SWt=g.attributes.skinWeight;
  const bi=n=>bones.findIndex(b=>b.name===n), bp=n=>new V3().setFromMatrixPosition(inv[bi(n)].clone().invert());
  const dom=i=>{ let b=0,w=-1; for(let k=0;k<4;k++){ const x=cmp(SWt,i,k); if(x>w){ w=x; b=cmp(SI,i,k); } } return b; };
  const nb=bi("neck"), cb=bi("chest"), hb=bi("head"), S=bp("neck"), E=bp("head"), v=new V3(), pts=[], ids=[], heads=[];
  for(let i=0;i<P.count;i++){ const d=dom(i); v.fromBufferAttribute(P,i).applyMatrix4(mesh.bindMatrix); if(d===nb||(d===cb&&v.z>0.17)){ pts.push(v.clone()); ids.push(i); } else if(d===hb) heads.push(i); }
  let poly=[S.clone(),E.clone()];
  const plen=()=>{ let s=0; for(let k=0;k<poly.length-1;k++) s+=poly[k].distanceTo(poly[k+1]); return s; };
  const proj=p=>{ let best=1e9,bs=0,acc=0; for(let k=0;k<poly.length-1;k++){ const a=poly[k], ab=poly[k+1].clone().sub(a), L=ab.length()||1e-9, u=clamp(p.clone().sub(a).dot(ab)/(L*L),0,1), d=a.clone().addScaledVector(ab,u).distanceTo(p); if(d<best){ best=d; bs=acc+u*L; } acc+=L; } return bs; };
  const at=s=>{ let acc=0; for(let k=0;k<poly.length-1;k++){ const L=poly[k].distanceTo(poly[k+1]); if(s<=acc+L||k===poly.length-2) return poly[k].clone().lerp(poly[k+1],clamp((s-acc)/(L||1e-9),0,1)); acc+=L; } return poly[poly.length-1].clone(); };
  for(let it=0;it<7;it++){ const L=plen(), M=it<3?14:34, sum=[...Array(M)].map(()=>new V3()), cnt=new Array(M).fill(0);
    for(const p of pts){ const k=Math.min(M-1,Math.floor(proj(p)/L*M)); sum[k].add(p); cnt[k]++; }
    const np=[S.clone()]; for(let k=0;k<M;k++) if(cnt[k]>3) np.push(sum[k].divideScalar(cnt[k])); np.push(E.clone()); poly=np;
    for(let q=0;q<(it<3?2:1);q++) poly=poly.map((p,k)=>k===0||k===poly.length-1?p:p.clone().multiplyScalar(0.5).addScaledVector(poly[k-1],0.25).addScaledVector(poly[k+1],0.25)); }
  // laid out straight from the chest along its first direction, each ring turned with the curve so the tube keeps its thickness
  const L0=plen(), K=Lwant/L0, tan=s=>at(Math.min(L0,s+0.03)).sub(at(Math.max(0,s-0.03))).normalize(), dir=tan(0.04), Bi=mesh.bindMatrixInverse, d=S.clone().addScaledVector(dir,Lwant).sub(E);
  for(let q=0;q<ids.length;q++){ const p=pts[q], s=proj(p), c=at(s), off=p.clone().sub(c).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(tan(s),dir)), n=S.clone().addScaledVector(dir,s*K).add(off); n.applyMatrix4(Bi); P.setXYZ(ids[q],n.x,n.y,n.z); }
  for(const i of heads){ v.fromBufferAttribute(P,i).applyMatrix4(mesh.bindMatrix).add(d).applyMatrix4(Bi); P.setXYZ(i,v.x,v.y,v.z); }
  inv[hb].multiply(new THREE.Matrix4().makeTranslation(-d.x,-d.y,-d.z)); P.needsUpdate=true; g.computeBoundingSphere(); g.computeBoundingBox();
  gltf.userData.L0=L0; }

// ---- load time 2: the split. Hinged upper and lower halves, the face on its own joint under the flap, the hair in two hanks
function splitRig(gltf){ if(gltf.userData.split) return gltf.userData.split;
  let mesh; gltf.scene.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); gltf.scene.updateMatrixWorld(true);
  const g=mesh.geometry, sk=mesh.skeleton, bones=sk.bones.slice(), inv=sk.boneInverses.map(m=>m.clone()), P=g.attributes.position, SI=g.attributes.skinIndex, SWt=g.attributes.skinWeight, UV=g.attributes.uv, ix=g.index;
  const hb=bones.findIndex(b=>b.name==="head"), E=new V3().setFromMatrixPosition(inv[hb].clone().invert());
  const dom=i=>{ let b=0,w=-1; for(let k=0;k<4;k++){ const x=cmp(SWt,i,k); if(x>w){ w=x; b=cmp(SI,i,k); } } return b; };
  const R=[], H=[]; for(let i=0;i<P.count;i++){ R.push(new V3().fromBufferAttribute(P,i).applyMatrix4(mesh.bindMatrix).sub(E)); if(dom(i)===hb) H.push(i); }
  const isHair=i=>{ const u=UV.getX(i), w=UV.getY(i); return u>=0.37&&u<=0.505&&w>=0.18&&w<=0.255; };
  // pieces of the head: joined by shared triangles and by shared positions (seams)
  const par=new Int32Array(P.count).map((_,i)=>i), f=x=>{ while(par[x]!==x){ par[x]=par[par[x]]; x=par[x]; } return x; }, un=(a,b)=>{ a=f(a); b=f(b); if(a!==b) par[b]=a; };
  const key=new Map(); for(const i of H){ const k=R[i].toArray().map(x=>Math.round(x*1e4)).join(","); if(key.has(k)) un(key.get(k),i); else key.set(k,i); }
  for(let q=0;q<ix.count;q+=3){ const a=ix.getX(q), b=ix.getX(q+1), c=ix.getX(q+2); un(a,b); un(a,c); }
  const comp=new Map(); for(const i of H){ const r=f(i); (comp.get(r)||comp.set(r,[]).get(r)).push(i); }
  const face=new Set(); let fTop=-1e9; const fC=new V3(); let fn=0;
  for(const vs of comp.values()){ if(vs.some(isHair)) continue; let mx=-1e9; for(const i of vs) mx=Math.max(mx,R[i].y); if(mx<-0.27){ for(const i of vs){ face.add(i); fC.add(R[i]); fn++; fTop=Math.max(fTop,R[i].y); } } }
  fC.divideScalar(Math.max(1,fn)); const fAt=new V3(fC.x,fTop,fC.z);
  const addBone=(name,parent,J,Jp)=>{ const b=new THREE.Bone(); b.name=name; b.position.copy(J).sub(Jp); parent.add(b); bones.push(b); inv.push(new THREE.Matrix4().makeTranslation(-J.x,-J.y,-J.z)); return bones.length-1; };
  const hinge=new V3(0,0,0.03), hairAt=new V3(0,0.25,0.15), w=p=>E.clone().add(p);
  const jU=addBone("jawU",bones[hb],w(hinge),E), jL=addBone("jawL",bones[hb],w(hinge),E), fc=addBone("face",bones[jL],w(fAt),w(hinge)),
        hL=addBone("hairL",bones[jU],w(hairAt),w(hinge)), hR=addBone("hairR",bones[jU],w(hairAt),w(hinge));
  const skin=(i,a,b,x)=>{ SI.setXYZW(i,a,b,0,0); SWt.setXYZW(i,1-x,x,0,0); };
  for(const i of H){ const r=R[i];
    if(isHair(i)) skin(i,jU,r.x>=0?hL:hR,sat((0.22-r.y)/0.3));
    else if(face.has(i)) skin(i,fc,fc,0);
    else if(r.y>0.012) skin(i,jU,jU,0);
    else if(r.y<-0.012) skin(i,jL,fc,r.y<-0.25?0.6*sat((-0.25-r.y)/0.05):0);   /* the bottom of the flap: a strand of flesh the face hangs on */
    else skin(i,jU,jL,(0.012-r.y)/0.024); }
  mesh.bind(new THREE.Skeleton(bones,inv),mesh.bindMatrix); SI.needsUpdate=true; SWt.needsUpdate=true;
  return gltf.userData.split={ mouth:new V3(0,-0.01,0.19), hinge, fAt, fDown:fC.clone().sub(fAt).normalize(), fLen:fC.distanceTo(fAt), hairAt, hairLen:0.6 }; }
// the neck's thickness, for laying it on the floor
function neckR(C){ let mesh; C.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); const g=mesh.geometry, P=g.attributes.position, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, sk=mesh.skeleton, nb=new Set(sk.bones.map((b,i)=>/^nk\d+$/.test(b.name)?i:-1).filter(i=>i>=0));
  let s=0,n=0; C.group.updateMatrixWorld(true); const v=new V3(), c=new V3();
  for(let i=0;i<P.count;i+=3){ const b=SI.getX(i); if(!nb.has(b)||SW.getX(i)<0.99) continue; v.fromBufferAttribute(P,i).applyMatrix4(mesh.bindMatrix); c.setFromMatrixPosition(sk.boneInverses[b].clone().invert()); const off=v.sub(c), ax=sk.bones[b].children[0]? sk.bones[b].children[0].position.clone().normalize() : null; if(ax) off.addScaledVector(ax,-off.dot(ax)); s+=off.length(); n++; }
  return n? s/n : 0.05; }

// each neck joint's own thickness (the neck has lumps): how high that joint rests when it lies on the floor
function neckRk(C){ let mesh; C.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); const g=mesh.geometry, P=g.attributes.position, SI=g.attributes.skinIndex, sk=mesh.skeleton, N=RC.N;
  const ch=[sk.bones.findIndex(b=>b.name==="neck")]; for(let k=1;k<N;k++) ch.push(sk.bones.findIndex(b=>b.name==="nk"+k)); const mx=new Array(N).fill(0), v=new V3(), c=new V3();
  for(let j=0;j<N;j++){ const b=ch[j]; c.setFromMatrixPosition(sk.boneInverses[b].clone().invert()); const nx=sk.bones[b].children.find(x=>/^nk|^head$/.test(x.name)), ax=nx.position.clone().normalize();
    for(let i=0;i<P.count;i++){ if(SI.getX(i)!==b) continue; v.fromBufferAttribute(P,i).applyMatrix4(mesh.bindMatrix).sub(c); v.addScaledVector(ax,-v.dot(ax)); mx[j]=Math.max(mx[j],v.length()); } }
  const rk=[]; for(let j=0;j<=N;j++) rk.push(Math.max(RC.r, mx[Math.max(0,j-1)], mx[Math.min(N-1,j)])*0.92); return rk; }
const FLk=j=>(RC.rk?RC.rk[Math.min(j,RC.rk.length-1)]:RC.r)-GE();
// ---- the rooms: her room (x>0) and the room it sits in (x<0), one doorway between
let ROOM=null;
function ensureRoom(){ if(ROOM) return; ROOM=new THREE.Group(); const m=new THREE.MeshLambertMaterial({color:0x2b2621}), mk=(w,h,d,x,y,z)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m); b.position.set(x,y,z); ROOM.add(b); };
  mk(0.16,2.7,4.4,0,1.35,-SH.DZ-2.2); mk(0.16,0.6,2*SH.DZ,0,2.4,0);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(4.6,7),new THREE.MeshLambertMaterial({color:0x1d1916})); fl.rotation.x=-Math.PI/2; fl.position.set(-2.38,0.002,-1.0); ROOM.add(fl);
  scene.add(ROOM); }

// ---- the neck as a snake: from the chest down to the floor beside its thigh, any slack coiled on the floor of its room,
// through the doorway, along her floor, and up into the head from behind. The route is always exactly the neck's length:
// slack goes into the coil, then into waves along her floor, then into a hump; a target it can't reach, it stops short of.
function snake(E,F,t,o={}){ const L=RC.L, r=FLR(), R0=nRoot(), fw=TP().fwd, zD=clamp(o.zD??0.12*Math.sin(t*0.4),-0.3,0.3), zs=o.coilSide??-1;
  const R1=R0.clone().addScaledVector(fw,0.28).add(new V3(0,0,0.18*zs)); R1.y=Math.max(r+0.05,R0.y*0.5);
  const F0=new V3(SH.BX+0.5,r,0.36*zs), D=new V3(0,r,zD), D2=new V3(0.3,r,zD);
  const build=(Et,a)=>{ const Ft=Et.clone(), Eb=Et.clone().addScaledVector(F,-(o.back??0.42)); if(Eb.x<0.12) Eb.x=0.12;
    const lift=clamp(-a,0,1); a=Math.max(0,a); const cw=Math.min(a,2.4), A=clamp(a-2.4,0,0.75), Hh=Math.max(0,a-3.15)*0.7;
    const cu=sm5(cw/0.6), P1=F0.clone().lerp(D,0.3), P2=F0.clone().lerp(D,0.62); P1.x+=(-0.95-P1.x)*cu; P2.x+=(-0.12-P2.x)*cu; P1.z+=zs*cw; P2.z+=zs*cw*0.92;   /* the coil: a wide loop, never a hairpin tighter than the neck is thick */
    const W=[R0,R1,F0,P1,P2,D,D2];
    const bx=Math.max(D2.x+0.05, Eb.x-Math.max(0.25,1.05*Eb.y)), zb=zD+(Eb.z-zD)*sat((bx-D2.x)/Math.max(0.05,Eb.x-D2.x)), n=Math.max(0,Math.floor((bx-D2.x)/0.38));
    for(let k=1;k<=n;k++){ const u=k/(n+1), x=D2.x+(bx-D2.x)*u, env=Math.sin(Math.PI*u); W.push(new V3(x, r+Hh*env, zD+(zb-zD)*u+A*Math.sin(Math.PI*2*x/1.3-(o.slither??2.2)*t)*env)); }
    if(Eb.y>0.3&&bx>D2.x+0.1) W.push(new V3(bx,r,zb));
    if(lift>0) for(let k=1;k<W.length;k++){ const u=sat((W[k].x-R0.x)/Math.max(0.1,Eb.x-R0.x)); W[k]=W[k].clone().lerp(R0.clone().lerp(Eb,u),lift*lift*(3-2*lift)); }   /* pulled taut: it lifts off the floor toward a straight line */
    W.push(Eb,Ft); return mkPath(W); };
  let Et=E.clone(), p=build(Et,-1), short=false;
  if(p.len>L){ short=true; const E0=new V3(0.4,Math.min(E.y,1.1),E.z*0.5); p=fitLen(f=>build(E0.clone().lerp(E,f),-1),L,0,1); Et=p.pts[p.pts.length-1].clone(); }
  else p=fitLen(a=>build(Et,a),L,-1,8);
  return {path:p, E:Et, short}; }

// ---- the head: where its mouth goes and what it looks at; the head bone is put where that puts it
function headQ(M,look,o={}){ const d=look.clone().sub(M), yaw=Math.atan2(d.x,d.z)+(o.yaw||0), pit=clamp(Math.atan2(-d.y,Math.hypot(d.x,d.z))+(o.pitch||0),-1.4,1.5);
  return new THREE.Quaternion().setFromEuler(new THREE.Euler(pit,yaw,o.roll||0,"YXZ")); }
// lay the neck and set the head. Returns the mouth as it really ended up (it may have stopped short)
function placeHead(M,look,t,o={}){ M=M.clone(); M.y+=(ctx.dyn&&ctx.dyn.hl)||0; const Q=o.Q||headQ(M,look,o), E=M.clone().sub(SPL.mouth.clone().applyQuaternion(Q)), F=new V3(0,0,1).applyQuaternion(Q);
  const s=snake(E,F,t,o); let path=s.path; if(s.short) ctx.shortN=(ctx.shortN||0)+1;
  if(o.wob){ const p0=path, w=o.wob; path=s2=>{ const q=p0(s2), u=sat(s2/RC.L); q.z+=w*Math.sin(s2*2.2-t*9)*u*u; q.y+=0.4*w*Math.cos(s2*2.6-t*8)*u*u; return q; }; }
  chainTo(runner.nk,runner.nkEnd,path,FLk); const R=runner.R; runner.group.updateMatrixWorld(true);
  R.head.quaternion.copy(R.head.parent.getWorldQuaternion(QI()).invert().multiply(Q)); R.head.updateMatrixWorld(true);
  return R.head.localToWorld(SPL.mouth.clone()); }

// ---- after the rig is set: the jaws, the hanging face and the hair (gravity, on their own joints)
function jawSet(u,l){ const B=runner.B; B.jawU.quaternion.setFromAxisAngle(new V3(1,0,0),u); B.jawL.quaternion.setFromAxisAngle(new V3(1,0,0),l); }
const JAW={ shut:[0.17,-0.17], rest:[0,0], ajar:[-0.12,0.18], open:[-0.55,0.78], wide:[-0.95,1.25] };
const jawMix=(a,b,w)=>[a[0]+(b[0]-a[0])*w, a[1]+(b[1]-a[1])*w];
// a weight on a joint: verlet point at 'len' along the joint's rest 'down', under gravity, kept off the floor and inside a cone
function dangle(S,k,bone,down,len,dt,o={}){ const Qp=bone.parent.getWorldQuaternion(QI()); bone.parent.updateMatrixWorld(true); bone.updateMatrixWorld(true);
  const A=bone.getWorldPosition(new V3()), dW=down.clone().applyQuaternion(Qp); let st=S[k];
  if(!st){ st=S[k]={p:A.clone().addScaledVector(dW,len)}; st.q=st.p.clone(); }
  const h=Math.max(dt,1e-4), vel=st.p.clone().sub(st.q).multiplyScalar(Math.exp(-(o.damp??1.4)*h)); st.q.copy(st.p);
  st.p.add(vel).add(new V3(0,-9.8*h*h,0)); if(o.push) st.p.addScaledVector(o.push,h*h);
  let d=st.p.clone().sub(A); if(d.lengthSq()<1e-10) d.copy(dW); d.normalize();
  const mx=o.cone??1.4, an=d.angleTo(dW); if(an>mx){ const ax=new V3().crossVectors(dW,d); if(ax.lengthSq()>1e-10){ ax.normalize(); d=dW.clone().applyAxisAngle(ax,mx); } }
  st.p.copy(A).addScaledVector(d,len); if(o.floor!=null&&st.p.y<o.floor){ st.p.y=o.floor; st.q.y=Math.min(st.q.y,st.p.y); d=st.p.clone().sub(A).normalize(); st.p.copy(A).addScaledVector(d,len); if(st.p.y<o.floor) st.p.y=o.floor; }
  const U=new THREE.Quaternion().setFromUnitVectors(dW,d); bone.quaternion.copy(Qp.clone().invert().multiply(U).multiply(Qp)); bone.updateMatrixWorld(true); return st.p; }
// the head's own floor: its lowest point (skull, jaws) this frame; next frame it is carried up by what it sank
let HLS=null; function floorHead(S){ let mesh; runner.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); const g=mesh.geometry, P=g.attributes.position, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, sk=mesh.skeleton;
  if(!HLS||HLS.m!==mesh){ const hb=new Set(["head","jawU","jawL"].map(n=>sk.bones.findIndex(b=>b.name===n))); const ids=[]; for(let i=0;i<P.count;i++){ let b=0,w=-1; for(let k=0;k<4;k++){ const x=cmp(SW,i,k); if(x>w){ w=x; b=cmp(SI,i,k); } } if(hb.has(b)) ids.push(i); } HLS={m:mesh,ids:ids.filter((_,k)=>k%3===0)}; }
  mesh.updateMatrixWorld(true); const v=new V3(); let lo=9; for(const i of HLS.ids){ v.fromBufferAttribute(P,i); mesh.boneTransform(i,v); v.applyMatrix4(mesh.matrixWorld); lo=Math.min(lo,v.y); } lo+=GE();
  S.hl=clamp((S.hl||0)+(0.01-lo)*(lo<0.01?1:0.25),0,1.2); S.hlo=lo; return lo; }
// jaw: [upper, lower]; drop: how far the face lets down on its strand; part: the hair pushed apart; bait: a sideways nudge to the face
function headDyn(ctx,dt,jaw,o={}){ const B=runner.B, S=ctx.dyn||(ctx.dyn={}); floorHead(S); jawSet(jaw[0],jaw[1]); B.jawU.updateMatrixWorld(true); B.jawL.updateMatrixWorld(true);
  const drop=o.drop||0; B.face.position.copy(S.fRest||(S.fRest=B.face.position.clone())).addScaledVector(SPL.fDown,drop);
  dangle(S,"face",B.face,SPL.fDown,SPL.fLen+drop*0.5,dt,{damp:o.fDamp??0.9,cone:1.7,floor:0.14-GE(),push:o.bait});
  const side=new V3(1,0,0).applyQuaternion(B.jawU.getWorldQuaternion(QI())), part=o.part||0;
  dangle(S,"hL",B.hairL,new V3(0,-1,0),SPL.hairLen,dt,{damp:2.2,cone:1.25,floor:0.03-GE()+(S.hfL||0),push:side.clone().multiplyScalar(30*part)});
  dangle(S,"hR",B.hairR,new V3(0,-1,0),SPL.hairLen,dt,{damp:2.2,cone:1.25,floor:0.03-GE()+(S.hfR||0),push:side.clone().multiplyScalar(-30*part)});
  // a hank is a wide curtain: if any of it went under the floor, its end is held that much higher next frame
  for(const [k,n] of [["hfL","hairL"],["hfR","hairR"]]){ const lo=lowOf(n)+GE(); S[k]=clamp((S[k]||0)+(0.01-lo)*(lo<0.01?1:0.25),0,0.6); } }
const LOWS={}; function lowOf(name){ let mesh; runner.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); const g=mesh.geometry, P=g.attributes.position, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, sk=mesh.skeleton;
  let L=LOWS[name]; if(!L||L.m!==mesh){ const bi=sk.bones.findIndex(b=>b.name===name), ids=[]; for(let i=0;i<P.count;i++){ let b=0,w=-1; for(let k=0;k<4;k++){ const x=cmp(SW,i,k); if(x>w){ w=x; b=cmp(SI,i,k); } } if(b===bi) ids.push(i); } L=LOWS[name]={m:mesh,ids:ids.filter((_,k)=>k%2===0)}; }
  mesh.updateMatrixWorld(true); const v=new V3(); let lo=9; for(const i of L.ids){ v.fromBufferAttribute(P,i); mesh.boneTransform(i,v); v.applyMatrix4(mesh.matrixWorld); lo=Math.min(lo,v.y); } return lo; }

// ---- its body: sat on the floor, legs out and apart, slumped; it barely moves
function sSit(t,o={}){ const J=P0(), j=o.jolt||0, dd=o.dead||0; J.hd=runner.hip0-0.11; J.hp=0.3; J.sp=0.32+0.025*Math.sin(t*1.3)+0.4*j+0.55*dd; J.sroll=0.18*dd; J.nx=0.2;
  J.lLx=-1.5-J.hp; J.lRx=-1.42-J.hp; J.lLz=0.32; J.lRz=0.3; J.kL=0.32; J.kR=0.45; J.fL=J.fR=0.35;
  J.aLx=-0.75-0.4*j+0.5*dd; J.aRx=-0.7-0.3*j+0.5*dd; J.aLz=0.18; J.aRz=0.16; J.eL=0.75+0.6*j; J.eR=0.7+0.5*j; return J; }
const SDN=()=>new V3(SH.NXs,0,0);

// ---- Norah, extra
NQ.pry=(t,k)=>{ const J=NP.stand(), n=s=>noise(t*14,s)*0.12*k; J.aLx=-2.75+n(1); J.aRx=-2.7+n(2); J.aLz=-0.25; J.aRz=-0.2; J.eL=0.85+n(3); J.eR=0.8+n(4); J.sp=0.15+n(5)*0.4; J.nx=0.45; J.kL=0.45+n(6); J.kR=0.4; J.lLx=-0.35; J.lRx=0.05; J.hd=0.08; return J; };
NQ.lower=()=>{ const J=NP.stand(); J.aRx=-0.6; J.eR=0.3; J.aLx=-0.35; J.eL=0.4; J.nx=0.1; return J; };
NQ.walkL=ph=>{ const J=NQ.lower(), s=Math.sin(ph*Math.PI*2); J.lLx=-0.35*s; J.lRx=0.35*s; J.kL=0.35*Math.max(0,s); J.kR=0.35*Math.max(0,-s); return J; };

// a smooth track through timed keys [t, x,y,z]: Catmull-Rom between keys, still at the ends
function track(K,t){ if(t<=K[0][0]) return new V3(K[0][1],K[0][2],K[0][3]); const n=K.length-1; if(t>=K[n][0]) return new V3(K[n][1],K[n][2],K[n][3]);
  let i=0; while(K[i+1][0]<t) i++; const u=(t-K[i][0])/(K[i+1][0]-K[i][0]), g=j=>{ const k=K[clamp(j,0,n)]; return new V3(k[1],k[2],k[3]); };
  const a=g(i-1), b=g(i), c=g(i+1), d=g(i+2), u2=u*u, u3=u2*u;
  return new V3().addScaledVector(a,-0.5*u3+u2-0.5*u).addScaledVector(b,1.5*u3-2.5*u2+1).addScaledVector(c,-1.5*u3+2*u2+0.5*u).addScaledVector(d,0.5*u3-0.5*u2); }
const nFace=()=>nHead().add(new V3(-0.1,0.02,0));
function shStart(ctx){ ensureRoom(); ctx.x=SH.BX; ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.T={}; ctx.dyn={}; ctx.camX=null; }

// ================================================================ the clips
// ---- it hunts: the head comes through the doorway low along the floor, the face dragging, rises into her room, sways and
// searches, finds her and holds on her. The coil in its room pays out as it comes.
A.hunt={ start(ctx){ shStart(ctx); ctx.nx=3.25; },
  step(t,dt,ctx){ const T=ctx.T, J=sSit(t);
    const K=[[0,0.15,0.42,0.05],[2.2,1.05,0.44,-0.1],[3.6,1.45,1.45,0.1],[4.8,1.7,1.55,-0.55],[6.0,1.75,1.5,0.6],[7.2,1.85,1.52,0.0],[9.5,2.0,1.5,0.05]];
    const M=track(K,t), sway=new V3(0,0.04*Math.sin(t*1.9),0.12*Math.sin(t*0.9)*sat((t-3.6)/0.8)); M.add(sway);
    const scan=t<3.6? new V3(M.x+2,0.3,M.z) : t<7.2? new V3(M.x+2,1.4,M.z+2.2*Math.sin((t-3.6)*1.2)) : nFace(), look=t<6.4? scan : scan.clone().lerp(nFace(),sm5((t-6.4)/0.6));
    ctx.post=()=>{ placeHead(M,look,t,{pitch:t<2.6?-0.05:0}); };
    const jaw=t<7.2? JAW.rest : jawMix(JAW.rest,JAW.ajar,sm5((t-7.2)/0.4));
    ctx.post2=d=>headDyn(ctx,d,jaw,{part:t>7.2?0.25:0,drop:0.08*sat((t-7.6)/0.6)});
    if(t>7.6&&t<8.6){ ctx.nph=(ctx.nph||0)+dt/0.9; ctx.nx=3.25+0.3*sm5((t-7.6)/1.0); ctx.nOver={J:NQ.walk(ctx.nph),x:ctx.nx}; } else ctx.nOver={J:NQ.aim(),x:ctx.nx};
    ctx.phase= t<2.2?"slides through the doorway low, the face dragging": t<3.6?"rises into her room": t<6.4?"sways and searches · the coil in its room pays out": t<7.6?"finds her · the split eases open":"she backs off a step · it holds on her";
    return fin(J); } };

// ---- the face as bait: it holds off at her eye level and lets the face down on its strand, swinging it slowly side to
// side. She lowers the gun and steps closer; the face is snatched up and the split snaps at her.
A.bait={ start(ctx){ shStart(ctx); ctx.nx=3.25; },
  step(t,dt,ctx){ const T=ctx.T, J=sSit(t), t1=4.9, t2=5.12;
    const base=new V3(1.55,1.58,0.12), sw=Math.sin(t*2.6)*sat((t-0.8)/1.0)*(1-sat((t-t1)/0.15)), M=base.clone().add(new V3(0,0.04*Math.sin(t*1.3),0.1*sw));
    let look=nFace(), jaw=jawMix(JAW.rest,JAW.ajar,sat(t/0.6)), drop=0.3*sm5((t-0.6)/1.4);
    const bait=new V3(0,0,-9*Math.cos(t*2.6)).multiplyScalar(sat((t-0.8)/1.0)*(1-sat((t-t1)/0.1)));
    if(t>t1){ drop*=1-sm5((t-t1)/0.12); jaw= t<t2? jawMix(JAW.ajar,JAW.open,sm5((t-t1)/0.16)) : jawMix(JAW.open,JAW.shut,sm5((t-t2)/0.07)); }
    let Mt=M; if(t>t1){ const hit=nFace(), u=sm5((t-t1-0.05)/0.17), back=sm5((t-t2-0.35)/0.9); Mt=M.clone().lerp(hit,u*(1-back)); }
    if(t>t2&&!T.bit){ T.bit=t; ctx.events.push({kind:"baitSnap"}); }
    ctx.post=()=>{ placeHead(Mt,look,t,{pitch:t<t1?0.08:0}); };
    ctx.post2=d=>headDyn(ctx,d,jaw,{drop,bait,part:0.35*(1-sat((t-t1)/0.2)),fDamp:0.5});
    const k=T.bit?t-T.bit:-1;
    if(k>=0){ ctx.nOver={J:k<0.7?NP.stumble():NQ.aim(),x:2.72+0.6*sm5(k/0.6)}; }
    else if(t>3.2&&t<4.6){ ctx.nph=(ctx.nph||0)+dt/0.95; ctx.nx=3.25-0.53*sm5((t-3.2)/1.4); ctx.nOver={J:NQ.walkL(ctx.nph),x:ctx.nx}; }
    else ctx.nOver={J:t>2.2?mix(NQ.aim(),NQ.lower(),sm5((t-2.2)/0.8)):NQ.aim(),x:ctx.nx};
    ctx.phase= t<0.8?"holds off at her eye level": t<3.2?"lets its face down on a strand · swings it slowly": t<t1?"she lowers the gun and steps in": k<0.6?"the face is snatched up · the split snaps at her":"she reels back";
    return fin(J); } };

// ---- the split opens to bite: it draws back and up, the split opening (the tell), lunges, clamps on her shoulder and
// worries at it; she wrenches free
A.bite2={ start(ctx){ shStart(ctx); },
  step(t,dt,ctx){ const T=ctx.T, J=sSit(t), t0=0.7, t1=1.25, t2=1.45, rel=2.75; const sh=nBone("upperarm_L").add(new V3(-0.05,0.07,0));
    const hold=new V3(1.6,1.45,0.1), rear=sh.clone().add(new V3(-1.05,0.45,-0.15));
    let M=t<t0? hold.clone().lerp(hold,0) : t<t1? hold.clone().lerp(rear,sm5((t-t0)/(t1-t0))) : rear.clone().lerp(sh,Math.pow(sat((t-t1)/(t2-t1)),1.7));
    let jaw=t<t0? JAW.rest : t<t1? jawMix(JAW.rest,JAW.open,sm5((t-t0)/0.35)) : t<t2? JAW.open : jawMix(JAW.open,[0.06,-0.05],sm5((t-t2)/0.06));
    let roll=0, yawJ=0; if(t>t2&&t<rel){ const k=t-t2; roll=0.32*Math.sin(k*19)*(1-sat((k-1.1)/0.3)); yawJ=0.18*Math.sin(k*13); M.add(new V3(0.03*Math.sin(k*17),0.03*Math.sin(k*23),0)); }
    if(t>=rel){ const k=t-rel; jaw=jawMix([0.06,-0.05],JAW.ajar,sm5(k/0.15)); M=sh.clone().lerp(new V3(1.35,1.2,0.3),sm5((k-0.08)/0.7)); }
    if(t>t2&&!T.bit){ T.bit=t; ctx.events.push({kind:"bite2"}); }
    const look=t<t2? sh.clone() : sh.clone().add(new V3(1,0,0));
    ctx.post=()=>{ placeHead(M,look,t,{roll,yaw:yawJ,pitch:t>t2&&t<rel?0.25:0}); };
    ctx.post2=d=>headDyn(ctx,d,jaw,{part:t>t0&&t<rel+0.3?0.6:0.1});
    const k=T.bit?t-T.bit:-1;
    if(k<0) ctx.nOver={J:NQ.aim(),x:SH.NXs};
    else if(t<rel) ctx.nOver={J:NP.crushed(t,0.5+0.3*Math.sin(k*9)),x:SH.NXs};
    else { const q=t-rel; ctx.nOver={J:q<0.7?NP.stumble():NQ.aim(),x:SH.NXs+0.55*sm5(q/0.55)}; }
    ctx.phase= t<t0?"holds on her": t<t1?"draws back · the split opens (the tell)": t<t2?"lunges": t<rel?"clamps on her shoulder · worries at it":"she wrenches free";
    return fin(J); } };

// ---- it engulfs her head: the head rises over her, turns face-down and opens the split as wide as it goes, then drops
// over her head and shoulders and closes. Mash: she forces the jaws apart and ducks out, or it bites down.
A.engulf={ start(ctx){ shStart(ctx); ctx.out=outcome("oEngulf","free","fail"); ctx.mash=0; },
  step(t,dt,ctx){ const T=ctx.T, J=sSit(t), t0=0.6, t1=1.5, t2=2.25, t3=2.5, hd=nHead();
    const hold=new V3(1.6,1.45,0.1), over=hd.clone().add(new V3(-0.2,0.95,0)), on=hd.clone().add(new V3(0.0,0.06,0));
    let M= t<t0? hold.clone() : t<t1? hold.clone().lerp(over,sm5((t-t0)/(t1-t0))) : t<t2? over.clone().add(new V3(0,0.04*Math.sin(t*3),0)) : over.clone().lerp(on,Math.pow(sat((t-t2)/(t3-t2)),1.5));
    const look= t<t0? nFace() : hd.clone().add(new V3(0.05,-1.5,0)), lk=t<t0? look : nFace().lerp(look,sm5((t-t0)/0.8));
    let jaw= t<t1? jawMix(JAW.rest,JAW.ajar,sat((t-t0)/0.6)) : t<t3? jawMix(JAW.ajar,JAW.wide,sm5((t-t1)/0.5)) : jawMix(JAW.wide,[-0.38,0.5],sm5((t-t3)/0.1));
    const held=t>t3&&!T.free&&!T.out;
    if(held){ ctx.mash=Math.min(1,ctx.mash+dt*(ctx.out==="free"?0.5:0.28)); ctx.qte=ctx.out==="free"?ctx.mash:Math.min(0.55,ctx.mash); }
    if(t>t3&&!T.on){ T.on=t; ctx.events.push({kind:"engulf"}); }
    if(ctx.out==="free"&&ctx.mash>=1&&!T.free){ T.free=t; ctx.events.push({kind:"engulfFree"}); }
    if(ctx.out==="fail"&&t>t3+2.1&&!T.out){ T.out=t; ctx.events.push({kind:"engulfBite"}); }
    if(T.free){ const k=t-T.free; jaw=jawMix([-0.38,0.5],JAW.wide,sm5(k/0.25)); if(k>0.25) jaw=jawMix(JAW.wide,JAW.rest,sm5((k-0.5)/0.6)); M=on.clone().lerp(hold.clone().add(new V3(-0.2,0.3,0)),sm5((k-0.3)/0.9)); ctx.qte=null; }
    if(T.out){ const k=t-T.out; jaw= k<0.12? jawMix([-0.38,0.5],[0.02,-0.02],sm5(k/0.08)) : jawMix([0.02,-0.02],JAW.ajar,sm5((k-0.9)/0.3)); M=on.clone().lerp(hold,sm5((k-1.0)/1.0)); if(k>0.9) ctx.qte=null; }
    if(held&&T.on){ const k=t-T.on; M.add(new V3(0.02*Math.sin(k*15),0.015*Math.sin(k*21),0.02*Math.sin(k*11))); if(ctx.out==="free") jaw=jawMix(jaw,JAW.open,0.35*sat(ctx.mash*1.3)*(0.6+0.4*Math.sin(k*12))); }
    ctx.post=()=>{ placeHead(M,lk,t,{back:t>t1?0.5:0.42}); };
    ctx.post2=d=>headDyn(ctx,d,jaw,{part:t>t1?0.8:0.1});
    if(T.free){ const k=t-T.free; ctx.nOver={J:k<0.35?NQ.pry(t,1):k<0.9?NP.stumble():NQ.aim(),x:SH.NXs+0.5*sm5((k-0.2)/0.5)}; }
    else if(T.out){ const k=t-T.out; ctx.nOver={J:k<0.9?NQ.pry(t,1.8):mix(NQ.pry(t,0.4),NQ.knees(t),sm5((k-0.9)/0.7)),x:SH.NXs}; }
    else if(T.on) ctx.nOver={J:NQ.pry(t,1),x:SH.NXs};
    else ctx.nOver={J:t>t0?NQ.aimUp():NQ.aim(),x:SH.NXs};
    ctx.phase= t<t0?"holds on her": t<t1?"rises over her": t<t2?"turns face-down · the split opens as wide as it goes": t<t3?"drops over her head":
      T.free? (t-T.free<0.4?"she forces the jaws apart · ducks out":"it pulls back") : T.out? (t-T.out<0.9?"it bites down":"lets her drop") : "closed over her head and shoulders · mash to force it open";
    return fin(J); } };

// ---- shooting the head: it is quick and won't hold still. Shots go past it into the wall; one glances off the skull.
// Only a shot into the open split counts: it snaps shut, the neck recoils and sways, and its strike is spoiled.
A.headshot={ start(ctx){ shStart(ctx); ctx.dart=[]; },
  step(t,dt,ctx){ const T=ctx.T, J=sSit(t), shots=[0.95,1.6,2.25], tS=3.55, tO=3.05;
    const dz=k=>[0.5,-0.55,0.35,-0.45,0.6,-0.3,0.15][k%7], ph=t/0.42, k0=Math.floor(ph), u=sm5((ph-k0)/0.45), dart=t<tO? dz(k0)+(dz(k0+1)-dz(k0))*u : 0;
    const hov=new V3(1.75,1.42+0.12*Math.sin(t*4.1),dart), rear=new V3(1.45,1.62,0.05);
    let M= t<tO? hov : hov.clone().lerp(rear,sm5((t-tO)/0.4)), jaw= t<tO? JAW.rest : jawMix(JAW.rest,JAW.open,sm5((t-tO)/0.35)), wob=0;
    for(let i=0;i<shots.length;i++) if(t>shots[i]&&!T["s"+i]){ T["s"+i]=t; ctx.events.push({kind:i<2?"shMiss":"shGlance"}); }
    if(t>tS&&!T.in){ T.in=t; ctx.events.push({kind:"shSplit"}); }
    if(T.in){ const k=t-T.in; jaw=jawMix(JAW.open,JAW.shut,sm5(k/0.06)); if(k>1.4) jaw=jawMix(JAW.shut,JAW.rest,sm5((k-1.4)/0.6));
      M=rear.clone().lerp(new V3(0.95,0.95,-0.2),sm5(k/0.35)).lerp(new V3(1.5,1.4,0.05),sm5((k-1.6)/1.2)); wob=0.5*Math.exp(-1.5*k)*Math.sin(k*10); }
    const look=nFace(), roll=T.in? 0.5*Math.exp(-2*(t-T.in))*Math.sin((t-T.in)*14) : 0;
    ctx.post=()=>{ const m=placeHead(M,look,t,{wob,roll}); ctx.mouthAt=m; };
    ctx.post2=d=>headDyn(ctx,d,jaw,{part:t>tO&&!T.in?0.7:0.05,fDamp:0.7});
    ctx.nOver={J:NQ.aim(),x:SH.NXs+0.25};
    const hit=T.in?t-T.in:-1;
    ctx.phase= t<shots[2]+0.3?"darts side to side · the shots go past it": t<tO?"one glances off the skull": !T.in?"draws back · the split opens to strike": hit<1.4?"shot inside the split · it snaps shut and recoils · the strike is spoiled":"comes back, wary";
    return fin(J); } };

// ---- find the body: she has come round into its room. The body takes the shots easily; the head, out in the other room,
// shrieks and races back along its neck, but the third shot kills it and the whole neck drops where it is.
A.body={ start(ctx){ shStart(ctx); ctx.camX=-1.7; ctx.rope=null; },
  step(t,dt,ctx){ const T=ctx.T, shots=[1.0,1.85,2.6];
    for(let i=0;i<3;i++) if(t>shots[i]&&!T["s"+i]){ T["s"+i]=t; ctx.events.push({kind:i<2?"bodyShot":"bodyDead"}); if(i===2) T.dead=t; }
    const jolt=Math.max(...shots.map((s,i)=>T["s"+i]?Math.exp(-7*(t-s))*Math.sin(Math.min(Math.PI,(t-s)*14)):0)), dead=T.dead?sm5((t-T.dead)/0.6):0;
    const J=sSit(t,{jolt:jolt*(1-dead),dead});
    const K=[[0,2.0,1.45,0.1],[1.0,2.0,1.45,0.0],[1.25,2.05,1.85,0.2],[2.0,1.1,1.0,-0.2],[2.6,0.55,0.62,0.0],[4,0.2,0.5,0.0]];
    const M=track(K,t), look= t<1.0? new V3(4,1.4,0) : M.clone().add(new V3(-2,-0.4,0));
    if(!T.dead){ ctx.post=()=>{ placeHead(M,look,t,{slither:5,roll:t>1.0?0.35*Math.sin(t*9)*Math.exp(-(t-1)):0}); ropeRecord(ctx); }; }
    else ctx.post=()=>ropeFall(ctx,dt);
    const jaw= t<1.0? JAW.rest : !T.dead? jawMix(JAW.rest,JAW.wide,sm5((t-1.0)/0.12)*(1-0.5*sm5((t-1.6)/0.3))) : jawMix(JAW.open,[-0.2,0.35],sm5((t-T.dead)/0.5));
    ctx.post2=d=>headDyn(ctx,d,jaw,{part:t>1&&!T.dead?0.6:0,fDamp:T.dead?2.5:0.9});
    ctx.nOver={J:NQ.aim(),x:SH.BX-2.3,yaw:Math.PI/2};
    ctx.phase= t<1.0?"she has found the body, sat in the next room": !T.dead? (t<1.85?"shot · out in the other room the head shrieks and races back":"shot again · the neck pays back through the doorway") : t-T.dead<1.2?"the third shot kills it · the neck drops where it is":"dead";
    return fin(J); } };
// lay a chain of pivots exactly through a list of points (one per joint, then the end)
function chainPts(ch,endOff,pts){ for(let i=1;i<ch.length;i++) ch[i].quaternion.identity(); runner.group.updateMatrixWorld(true);
  for(let i=0;i<ch.length;i++){ const p=ch[i], off= i<ch.length-1? ch[i+1].position : endOff, P=p.getWorldPosition(new V3()), Q=pts[i+1].clone().sub(P), C=p.localToWorld(off.clone()).sub(P);
    if(C.lengthSq()<1e-10||Q.lengthSq()<1e-10) continue; rotWorld(p,new THREE.Quaternion().setFromUnitVectors(C.normalize(),Q.normalize())); } }
// the neck as a dead rope: each joint a point under gravity, joined at their lengths, the chest end carried by the body
function ropeRecord(ctx){ runner.group.updateMatrixWorld(true); const P=runner.nk.map(p=>p.getWorldPosition(new V3())); P.push(runner.R.head.getWorldPosition(new V3())); ctx.rope={p:P.map(v=>v.clone()),q:ctx.rope?ctx.rope.p:P.map(v=>v.clone())}; }
function ropeFall(ctx,dt){ const R=ctx.rope, n=R.p.length, r=FLR(), h=Math.max(dt,1e-4); if(!R.len){ R.len=[]; for(let i=1;i<n;i++) R.len.push(R.p[i].distanceTo(R.p[i-1])); R.hq=runner.R.head.getWorldQuaternion(QI()); }
  for(let i=1;i<n;i++){ const p=R.p[i], v=p.clone().sub(R.q[i]).multiplyScalar(0.985); R.q[i]=p.clone(); p.add(v).add(new V3(0,-9.8*h*h,0)); }
  for(let it=0;it<12;it++){ R.p[0]=nRoot();
    for(let i=1;i<n;i++){ const a=R.p[i-1], b=R.p[i], d=b.clone().sub(a), l=d.length()||1e-6, e=(l-R.len[i-1])/l; if(i===1) b.addScaledVector(d,-e); else { a.addScaledVector(d,0.5*e); b.addScaledVector(d,-0.5*e); } }
    for(let i=1;i<n;i++){ const fl=i===n-1?0.12-GE()+((ctx.dyn&&ctx.dyn.hl)||0):FLk(i); if(R.p[i].y<fl){ R.p[i].y=fl; const q=R.q[i]; q.x=R.p[i].x+(q.x-R.p[i].x)*0.4; q.z=R.p[i].z+(q.z-R.p[i].z)*0.4; q.y=Math.min(q.y,fl); } } }
  chainPts(runner.nk,runner.nkEnd,R.p);
  // the head goes over onto its side as it lands
  const H=runner.R.head, land=sat((0.55-R.p[n-1].y)/0.35); R.roll=Math.max(R.roll||0,land); const fwd=new V3(0,0,1).applyQuaternion(R.hq); fwd.y=0; if(fwd.lengthSq()<1e-4) fwd.set(-1,0,0); fwd.normalize();
  const Qf=new THREE.Quaternion().setFromEuler(new THREE.Euler(0.15,Math.atan2(fwd.x,fwd.z),1.35,"YXZ")), Q=R.hq.clone().slerp(Qf,sm5(R.roll));
  runner.group.updateMatrixWorld(true); H.quaternion.copy(H.parent.getWorldQuaternion(QI()).invert().multiply(Q)); H.updateMatrixWorld(true); }

const ORDERS={neck:["hunt","bait","bite2","engulf","headshot","body"]};
const LEN={hunt:9.5, bait:7.2, bite2:5.2, engulf:6.6, headshot:7.6, body:7.5};
const NAMES={hunt:"The neck hunts",bait:"Face swings like bait",bite2:"The split opens to bite",engulf:"Engulfs her head",headshot:"Shooting the head",body:"Find the body"};
const DMG={baitSnap:["NORAH −15","lured in · snapped at"],bite2:["NORAH −25","clamped on her shoulder"],engulf:["ENGULFED","its mouth closes over her head"],engulfFree:["FORCED OPEN","she ducks out"],engulfBite:["NORAH −40","it bites down"],
  shMiss:["MISS","it's too quick"],shGlance:["HEAD −3","glances off the skull"],shSplit:["HEAD −30","shot inside the split · it snaps shut"],bodyShot:["BODY −40","the head shrieks in the other room"],bodyDead:["DEAD","the body was the weak point"]};
const RCEV={ baitSnap(){ shake=Math.max(shake,0.16); BLOODsplat(nHead().add(new V3(-0.1,-0.05,0)),5); }, bite2(){ shake=Math.max(shake,0.2); BLOODsplat(nBone("upperarm_L"),10); },
  engulf(){ shake=Math.max(shake,0.18); }, engulfFree(){ shake=Math.max(shake,0.08); }, engulfBite(){ shake=Math.max(shake,0.3); BLOODsplat(nBone("neck"),16); },
  shMiss(){ muzzleFlash(); const h=headAt(); const p=new V3(0.1,clamp(h.y+(Math.random()-0.5)*0.4,0.4,2.0),clamp(h.z+(Math.random()<0.5?-0.5:0.5),-SH.DZ-0.6,SH.DZ+0.6)); puffAt(p,0.6); shake=Math.max(shake,0.04); },
  shGlance(){ muzzleFlash(); const h=runner.B.jawU.localToWorld(new V3(0,0.12,0.05)); puffAt(h,0.5); shake=Math.max(shake,0.05); },
  shSplit(){ muzzleFlash(); const m=ctx.mouthAt||headAt(); puffAt(m,0.5); BLOODsplat(m,14); shake=Math.max(shake,0.14); },
  bodyShot(){ muzzleFlash(); const c=runner.B.chest.getWorldPosition(new V3()); puffAt(c,0.5); BLOODsplat(c,12); shake=Math.max(shake,0.1); },
  bodyDead(){ muzzleFlash(); const c=runner.B.chest.getWorldPosition(new V3()); puffAt(c,0.6); BLOODsplat(c,18); shake=Math.max(shake,0.14); } };
// a puff where something is hit, at its own height (puff() is for the floor)
function puffAt(p,s){ for(let i=0;i<4;i++){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,transparent:true,depthWrite:false})); m.position.set(p.x+(Math.random()-.5)*0.1,p.y+(Math.random()-.5)*0.1,p.z+(Math.random()-.5)*0.1); m.scale.setScalar(0.18*s); scene.add(m); puffs.push({m,t:0,v:new V3((Math.random()-.5)*0.6,0.2+Math.random()*0.3,(Math.random()-.5)*0.6),s}); } }
