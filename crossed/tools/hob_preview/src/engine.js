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
      _p.copy(q.c).applyMatrix4(mesh.bindMatrix).applyMatrix4(sk.boneInverses[q.bi]).applyMatrix4(bn.matrixWorld).applyMatrix4(mesh.bindMatrixInverse).applyMatrix4(mesh.matrixWorld); out.addScaledVector(_p,q.m); ws+=q.m; }
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
    g.updateMatrixWorld(true); const m=C.pb.measure(); const lying=m.com.y<0.5; if(lying) m.low=coreLow(C.pb,m);
    if(o.kick && S.kickId!==o.kick.id){ S.kickId=o.kick.id; S.vy=o.kick.v.y; S.vx=o.kick.v.x; S.vz=o.kick.v.z; S.e+=0.003; S.forceAir=true; S.airT=0.2; }
    const e0=S.e, hx0=S.hx, hz0=S.hz; vstep(S,m,dt,{}); if(S.forceAir){ S.air=true; S.forceAir=false; } hstep(S,m,dt);
    g.position.x+=S.hx-hx0; g.position.y+=S.e-e0; g.position.z+=S.hz-hz0;
    if(lying){ g.updateMatrixWorld(true); fold(C.pb); }
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
let hold=0; function hitStop(s){ hold=Math.max(hold,s*(slow?2:1)); }
let shake=0;

