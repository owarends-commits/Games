// ================================================================ PV_RC: reacher-preview.html wrapped for the playground (made by mkpv.py)
const PV_RC=(function(){
let scene=null, runner=null, norah=null, t=0, ctx={events:[]}, cur=null; const PVHOOK={};
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
// a pose: angles in radians. Legs: lx (− = forward), lz (out), k (knee bend), f (foot). Arms: ax (− = forward), az (out; − crosses the body), e (elbow bend).
// Spine: hp/hyaw/hroll (hips), sp/syaw/sroll (chest; + roll drops the right shoulder, + yaw brings it forward), nx/ny/nz (neck; + nx = head down), hd (hips drop, m), hz (hips forward, m).
const P0=()=>({hd:0,hz:0,hx:0,hp:0,hyaw:0,hroll:0,sp:0,syaw:0,sroll:0,nx:0,ny:0,nz:0,hdx:0,hdy:0,
  aLx:0,aLy:0,aLz:0.08,eL:0.15,aRx:0,aRy:0,aRz:0.08,eR:0.15,lLx:0,lLz:0.02,kL:0,fL:0,lRx:0,lRz:0.02,kR:0,fR:0});
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
    if(S.wasHeld){ S.wasHeld=false; S.init=true; S.e=0; S.cy=m.com.y; S.vy=0; S.hinit=true; S.hx=0; S.hz=0; S.cx=m.com.x; S.cz=m.com.z; S.vx=0; S.vz=0; S.airT=0; }   /* let go: it falls from where it was held, under gravity, never snapped down */
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

/* the heavy arm's side: the clips are written with the strong arm on the right; a model whose strong arm is its left gets them mirrored */
let MIR=false; const SW=s=>MIR?(s==="L"?"R":"L"):s, HB=n=>MIR?n.replace(/_(L|R)$/,(m,q)=>"_"+(q==="L"?"R":"L")):n, MS=()=>MIR?-1:1;
function mirrorJ(J){ const o=Object.assign({},J), sw=(a,b)=>{ o[a]=J[b]; o[b]=J[a]; };
  for(const k of ["x","y","z"]){ sw("aL"+k,"aR"+k); } sw("eL","eR"); sw("lLx","lRx"); sw("lLz","lRz"); sw("kL","kR"); sw("fL","fR");
  for(const k of ["hyaw","hroll","syaw","sroll","ny","nz","hx","hdy"]) o[k]=-(J[k]||0); return o; }
function heavySide(C){ let mesh; C.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); const bones=mesh.skeleton.bones, si=mesh.geometry.attributes.skinIndex, sw=mesh.geometry.attributes.skinWeight, n={L:0,R:0};
  for(let i=0;i<sw.count;i++){ const b=bones[si.getX(i)].name; if(sw.getX(i)>0.5 && /^(hand|forearm|upperarm)_[LR]$/.test(b)) n[b.slice(-1)]++; } return n.L>n.R?"L":"R"; }
function applyPose(C,J){ if(MIR && C===runner) J=mirrorJ(J); const R=C.R;
  R.hips.position.set(J.hx,R.hip0-J.hd,J.hz); R.hips.rotation.set(J.hp,J.hyaw,J.hroll);
  R.chest.rotation.set(J.sp,J.syaw,J.sroll); R.neck.rotation.set(J.nx,J.ny,J.nz); R.head.rotation.set(J.hdx,J.hdy,0);
  R.armL.rotation.set(J.aLx,J.aLy,J.aLz); R.armR.rotation.set(J.aRx,-J.aRy,-J.aRz); R.elbowL.rotation.x=-J.eL; R.elbowR.rotation.x=-J.eR;
  R.legL.rotation.set(J.lLx,0,J.lLz); R.legR.rotation.set(J.lRx,0,-J.lRz); R.kneeL.rotation.x=J.kL; R.kneeR.rotation.x=J.kR; R.ankleL.rotation.x=J.fL; R.ankleR.rotation.x=J.fR; 
  if(C===runner && C.footPts && ctx && !ctx.rise && !ctx.noPlant){ if(!ctx.moving) plantFeet(C,ctx); else if(ctx.gait) plantWalk(C,ctx); }   /* both feet on the floor, before anything measures them */ }
function mix(a,b,t){ const o={}; for(const k in a) o[k]=a[k]+(b[k]-a[k])*t; return o; }

// ---------------------------------------------------------------- motion helpers
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), sat=x=>clamp(x,0,1);
const ss=t=>{ t=sat(t); return t*t*(3-2*t); }, easeIn=t=>{ t=sat(t); return t*t*t; }, easeOut=t=>{ t=sat(t); return 1-(1-t)**3; };
const noise=(t,s)=>Math.sin(t*1.9+s)*0.5+Math.sin(t*3.7+s*1.7)*0.3+Math.sin(t*7.3+s*2.3)*0.2;
function spring(s,target,dt,w){ const a=w*w*(target-s.x)-2*w*s.v; s.v+=a*dt; s.x+=s.v*dt; return s.x; }   // critically damped
// one leg's stride: phase 0..1, stance first (foot planted, sweeping back), then the swing ending in the stomp
function stride(ph, P){ const st=P.stance;
  if(ph<st){ const u=ph/st; return {lx:P.front+(P.back-P.front)*u, k:P.kStance*Math.sin(u*Math.PI)+(u<0.12?P.kImpact*(1-u/0.12):0), f:-0.1*u, plant:true}; }
  const u=(ph-st)/(1-st);
  if(u<P.liftEnd){ const a=ss(u/P.liftEnd); return {lx:P.back+(P.high-P.back)*a, k:P.kLift*Math.sin(a*Math.PI*0.5)+0.3*(1-a), f:0.35*(1-a)+0.2, plant:false}; }
  const a=easeIn((u-P.liftEnd)/(1-P.liftEnd));                                              // driven down, accelerating into the floor
  return {lx:P.high+(P.front-P.high)*a, k:P.kLift*(1-a)+0.02, f:0.2*(1-a)-0.12*a, plant:false}; }

// ---------------------------------------------------------------- the animations
// each returns the pose plus what the root and the scene should do this frame
const S={ head:{x:0,v:0}, headT:0, headTo:0, shufX:{x:0,v:0}, shufZ:{x:0,v:0}, shufT:0, shufTo:[0,0], stepPh:0, crouchT:2, crouch:0 };
function restless(t,dt,ctx){
  const J=P0();
  // a ready crouch, up on the balls of the feet
  J.hd=0.07+0.035*S.crouch; J.kL=J.kR=0.32+0.25*S.crouch; J.lLx=J.lRx=-0.12-0.1*S.crouch; J.fL=J.fR=-0.12;
  J.sp=0.16+0.04*Math.sin(t*6.2)+0.12*S.crouch; J.nx=-0.12-0.1*S.crouch;
  J.aLx=J.aRx=-0.3; J.aLz=J.aRz=0.22; J.eL=0.85+0.15*noise(t*2.4,1); J.eR=0.85+0.15*noise(t*2.6,4);
  // sharp looks: the head jumps to a new bearing and the body half follows
  S.headT-=dt; if(S.headT<=0){ S.headTo=Math.random()<0.25?0:(Math.random()*2-1)*1.05; S.headT=0.3+Math.random()*0.8; }
  const h=spring(S.head,S.headTo,dt,22); J.ny=h*0.62; J.hdy=h*0.3; J.syaw=h*0.22; J.hyaw=h*0.08; J.nz=-h*0.08;
  // shuffles: quick little moves back and forth and side to side
  S.shufT-=dt; if(S.shufT<=0){ S.shufTo=[(Math.random()*2-1)*0.32,(Math.random()*2-1)*0.25]; S.shufT=0.45+Math.random()*0.9; }
  const ox=S.shufX.x, oz=S.shufZ.x; spring(S.shufX,S.shufTo[0],dt,13); spring(S.shufZ,S.shufTo[1],dt,13);
  const mv=Math.hypot(S.shufX.v,S.shufZ.v); S.stepPh+=dt*mv*9;
  const lift=sat(mv*1.6);
  J.lLx+=-0.25*lift*Math.max(0,Math.sin(S.stepPh)); J.kL+=0.7*lift*Math.max(0,Math.sin(S.stepPh));
  J.lRx+=-0.25*lift*Math.max(0,-Math.sin(S.stepPh)); J.kR+=0.7*lift*Math.max(0,-Math.sin(S.stepPh));
  J.hroll=0.06*Math.sin(S.stepPh)*lift - S.shufZ.v*0.05; J.hp=S.shufX.v*0.05; J.lLz+=0.06; J.lRz+=0.06;
  // now and then it sinks lower for a moment, listening
  S.crouchT-=dt; if(S.crouchT<=0){ S.crouchT=2+Math.random()*3; S.crouchK=0.55; } if(S.crouchK>0){ S.crouchK-=dt; S.crouch=Math.sin(sat(1-S.crouchK/0.55)*Math.PI); } else S.crouch=0;
  ctx.local={x:S.shufX.x,z:-S.shufZ.x}; ctx.v=mv;
  return J;
}
const WALK={stance:0.56,front:-0.42,back:0.42,high:-0.95,kStance:0.12,kImpact:0.22,kLift:1.45,liftEnd:0.62};
function walkPose(ph, J0){
  const J=J0||P0(); const a=stride(ph,WALK), b=stride((ph+0.5)%1,WALK);
  J.lLx=a.lx; J.kL=a.k; J.fL=a.f; J.lRx=b.lx; J.kR=b.k; J.fR=b.f;
  const imp=Math.max(Math.max(0,1-(ph%0.5)/0.09),0);                                    // the jolt right after each stomp
  J.hd=0.035+0.05*imp+0.03*Math.abs(Math.sin(ph*Math.PI*2)); J.sp=0.22+0.06*imp; J.hp=0.04;
  J.hyaw=0.16*Math.sin(ph*Math.PI*2); J.syaw=-0.28*Math.sin(ph*Math.PI*2); J.hroll=0.06*Math.cos(ph*Math.PI*2);
  J.aLx=0.72*Math.sin(ph*Math.PI*2); J.aRx=-0.72*Math.sin(ph*Math.PI*2); J.eL=0.95+0.25*Math.max(0,-Math.sin(ph*Math.PI*2)); J.eR=0.95+0.25*Math.max(0,Math.sin(ph*Math.PI*2)); J.aLz=J.aRz=0.16;
  J.nx=0.06-0.08*imp; return {J,imp}; }
const RUN={stance:0.36,front:-0.8,back:0.8,high:-1.25,kStance:0.6,kImpact:0.3,kLift:1.9,liftEnd:0.55};
function sprintPose(ph, J0, shoulder){
  const J=J0||P0(); const a=stride(ph,RUN), b=stride((ph+0.5)%1,RUN);
  J.lLx=a.lx+0.1; J.kL=a.k; J.fL=a.f; J.lRx=b.lx+0.1; J.kR=b.k; J.fR=b.f;
  const imp=Math.max(0,1-(ph%0.5)/0.1);
  J.hd=0.09+0.06*imp; J.hp=0.14; J.sp=0.42+0.05*imp; J.nx=-0.22;
  J.hyaw=0.12*Math.sin(ph*Math.PI*2); J.syaw=-0.32*Math.sin(ph*Math.PI*2);
  J.aLx=1.15*Math.sin(ph*Math.PI*2)-0.15; J.aRx=-1.15*Math.sin(ph*Math.PI*2)-0.15; J.eL=J.eR=1.55; J.aLz=J.aRz=0.1;
  if(shoulder){ const s=shoulder;                                                            // right shoulder dropped and leading
    J.syaw=J.syaw*(1-s)+0.72*s; J.sroll=0.38*s; J.hyaw=J.hyaw*(1-s)+0.3*s; J.ny=-0.55*s; J.nz=-0.2*s; J.nx=-0.1*s-0.22*(1-s);
    J.aRx=J.aRx*(1-s)+(-0.15)*s; J.aRz=J.aRz*(1-s)+(-0.35)*s; J.eR=1.55*(1-s)+2.05*s;
    J.aLx=J.aLx*(1-s)+(0.45+0.3*Math.sin(ph*Math.PI*2))*s; J.aLz=0.1*(1-s)+0.4*s; }
  return {J,imp}; }
function chargePose(c, t, shoulder){                                                           // shoulders curl in toward the core, trembling
  const J=P0(), tr=c*c, sh=(k)=>noise(t*38,k)*0.05*tr;
  J.hd=0.08+0.16*c; J.sp=0.18+0.5*c+sh(1); J.hp=0.08+0.1*c; J.nx=0.05+0.32*c+sh(2);
  J.lLx=-0.35*c; J.kL=0.3+0.55*c; J.fL=-0.1*c; J.lRx=0.45*c; J.kR=0.3+0.75*c; J.fR=-0.35*c;
  J.aLx=J.aRx=-0.2-0.45*c; J.aLz=J.aRz=0.15-0.7*c; J.eL=J.eR=0.8+1.35*c; J.aLx+=sh(3); J.aRx+=sh(4);
  if(shoulder){ J.syaw=0.55*c; J.sroll=0.32*c; J.ny=-0.45*c; J.aRz=-0.45*c; J.aRx=-0.15; J.eR=2.0*c+0.4; J.aLz=0.15+0.2*c; J.aLx=0.25*c; J.eL=0.9; }
  return J; }

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
  if(st){ const f=P.stance===st&&P.anchor? solePts(C,SW(st))[P.kind] : lowSole(C,SW(st));   // track the same point (heel or toe) frame to frame
    if(P.stance!==st||!P.anchor){ // touchdown: the body was falling; the stance leg takes it
      const k=clamp(-P.vy*1.2+Math.abs(P.vx)*0.35,0,2.2)*(cfg.imp??1); P.dip.v-=k*2.2; P.lean.v+=k*0.8; P.roll.v+=(st==="L"?1:-1)*k*(cfg.rollK??0.6);
      P.anchor=f.clone(); P.stance=st; cfg.onLand&&cfg.onLand(f,k,st); const carry=P.vx*dt*(1-0.25*Math.min(1,k)); ctx.x+=fwd.x*carry; ctx.z=(ctx.z||0)+fwd.z*carry; }   /* momentum carries through the contact frame, minus what the impact took */
    else { const slip=(cfg.slip&&cfg.slip[st])||0, d=P.anchor.clone().sub(f); let along=d.dot(fwd)*(1-slip); if(along<0 && cfg.drag&&cfg.drag[st]) along*=0.08; if(cfg.traction&&dt>0){ const vLeg=along/dt, nv=P.vx+(vLeg-P.vx)*Math.min(1,dt*cfg.traction); along=nv*dt; }   /* the body has momentum: the foot grips, but can't snap its speed instantly */ /* a dragged foot can push it on, but slides rather than pull it back */ ctx.x+=fwd.x*along; ctx.z=(ctx.z||0)+fwd.z*along;
      if(slip>0 && Math.abs(d.dot(fwd))*slip>0.004 && Math.random()<0.25) cfg.onDrag&&cfg.onDrag(f); }
  } else { if(P.stance&&cfg.flight) P.vy*=cfg.bounce??1; P.stance=null; if(cfg.flight){ ctx.x+=fwd.x*P.vx*dt; ctx.z=(ctx.z||0)+fwd.z*P.vx*dt; P.y+=(P.vy-GRAV_A*dt)*dt; } }   // airborne: momentum and gravity only
  g.position.set(ctx.x,P.y,ctx.z||0); g.updateMatrixWorld(true);
  const low= C.footPts ? Math.min(footLow(C,"L"),footLow(C,"R")) : Math.min(lowSole(C,"L").y,lowSole(C,"R").y); if(st||!cfg.flight||low<0) P.y-=low;   /* the real soles where the model has them measured */ g.position.y=P.y; g.updateMatrixWorld(true);
  if(st){ const pp=solePts(C,SW(st)); P.kind=pp[0].y<pp[1].y?0:1; P.anchor=pp[P.kind].clone(); }
  // measure what that did
  const dx=((ctx.x-P.lx)*fwd.x+((ctx.z||0)-(P.lz||0))*fwd.z), vx=dt>0?dx/dt:0, vy=dt>0?(P.y-P.ly)/dt:0; P.lx=ctx.x; P.lz=ctx.z||0; P.ly=P.y;
  const ax=dt>0?(vx-P.vx)/dt:0; P.ax+=(clamp(ax,-25,25)-P.ax)*Math.min(1,dt*10); P.vx=vx; P.vy=vy; ctx.v=vx; ctx.y=P.y;
  spring(P.lean,clamp(-P.ax*0.03,-0.22,0.22),dt,cfg.leanW??7); spring(P.hl,clamp(vy*0.12-P.ax*0.02,-0.25,0.25),dt,9); spring(P.arm,clamp(-P.ax*0.06,-0.35,0.35),dt,6); spring(P.dip,0,dt,cfg.dipW??9); spring(P.roll,0,dt,6); }

// which foot is planted, from the stride clock: double support goes to the foot that landed last; none = airborne
function strideStance(ph,P){ const a=ph%1, bb=(ph+0.5)%1, inL=a<P.stance, inR=bb<P.stance; if(inL&&inR) return a<bb?"L":"R"; return inL?"L":inR?"R":null; }
// ---------------------------------------------------------------- choreography for each clip
const A={};
const NP={
  stand(){ const J=P0(); J.aLx=-0.25; J.aRx=-0.5; J.eL=0.5; J.eR=0.9; J.aLz=0.12; J.aRz=0.1; J.kL=J.kR=0.08; J.lLx=-0.08; J.lRx=0.08; return J; },
  held(t){ const J=P0(), n=s=>noise(t*14,s)*0.14; J.aLx=0.05+n(1); J.aRx=0.05+n(2); J.aLz=-0.02; J.aRz=-0.02; J.eL=0.6+n(3); J.eR=0.7+n(4); J.sp=-0.15+n(5)*0.5; J.syaw=n(6); J.nx=-0.25+n(7); J.kL=0.25; J.kR=0.15; J.lLx=-0.12; J.lRx=0.18; J.fL=J.fR=0.2; return J; },
  crushed(t,k){ const J=P0(), n=s=>noise(t*30,s)*0.06*(0.5+k); J.aLx=0.1+n(1); J.aRx=0.1+n(2); J.aLz=0; J.aRz=0; J.eL=0.9+n(3); J.eR=0.9+n(4); J.sp=-0.25-0.35*k+n(5); J.hp=0.1+0.15*k; J.nx=-0.45-0.4*k+n(6); J.ny=n(7); J.lLx=-0.25+n(8); J.lRx=0.05+n(9); J.kL=0.45; J.kR=0.35; J.fL=J.fR=0.55; return J; },
  kneel(t){ const J=P0(); J.hd=0.42; J.hp=0.05; J.lLx=-1.25; J.kL=1.55; J.fL=-0.25; J.lRx=0.25; J.kR=1.8; J.fR=0.7; J.sp=0.5+0.04*Math.sin(t*5); J.nx=0.45; J.aLx=-0.75; J.aLz=-0.45; J.eL=1.9; J.aRx=-0.35; J.aRz=0.15; J.eR=0.4; return J; },
  stumble(){ const J=P0(); J.sp=-0.25; J.aLx=-0.9; J.aRx=-0.6; J.aLz=0.6; J.aRz=0.5; J.eL=J.eR=0.5; J.lLx=0.35; J.kL=0.3; J.lRx=-0.3; J.kR=0.2; J.nx=-0.2; return J; } };
// ---------------------------------------------------------------- the club-fist: a man dragged lopsided by one monstrous arm
// The club arm is a real pendulum hung from the shoulder (gravity, damping, and the body's own acceleration swing it);
// he leans away from it by a balance controller that reads his real centre of mass (the voxelised mesh) against his feet.
const GRAVC=9.8, CS={club:{x:0,v:0},side:{x:0,v:0},lastV:0,lastYaw:0,lean:0,err:0,leanF:0,errF:0};
function clubSwing(J,ctx,dt,o={}){ const Lc=0.62*((runner&&runner.sz)||1), c=CS.club, a=((ctx.v||0)-CS.lastV)/Math.max(dt,1e-4); CS.lastV=ctx.v||0;
  // body accelerating forward swings it back; a turn of the chest flings it out sideways
  const drive=(o.drive||0), turn=((J.syaw||0)-CS.lastYaw)/Math.max(dt,1e-4); CS.lastYaw=J.syaw||0;
  c.v+=(-(GRAVC/Lc)*Math.sin(c.x)-1.6*c.v+clamp(a,-12,12)/Lc*Math.cos(c.x)+drive)*dt; c.x+=c.v*dt;
  const s=CS.side; s.v+=(-(GRAVC/Lc)*Math.sin(s.x)-1.8*s.v+clamp(turn,-20,20)*0.9+(o.sideDrive||0))*dt; s.x+=s.v*dt;
  J.aRx=c.x+(o.base||0); J.aRz=0.3+s.x; J.eR=0.18; return J; }
// balance: lean the hips and chest away from the heavy side until the centre of mass is over the feet
function balance(C,m,ctx,dt){ if(!m||!m.con.length) return; let cx=0,cz=0; for(const p of m.con){ cx+=p.x; cz+=p.z; } cx/=m.con.length; cz/=m.con.length;
  const rx=Math.cos(ctx.yaw), rz=-Math.sin(ctx.yaw), fx=Math.sin(ctx.yaw), fz=Math.cos(ctx.yaw); CS.err=MS()*((m.com.x-cx)*rx+(m.com.z-cz)*rz); CS.lean=clamp(CS.lean+CS.err*dt*6,-0.45,0.45);
  if(!ctx.moving){ CS.errF=(m.com.x-cx)*fx+(m.com.z-cz)*fz; CS.leanF=clamp(CS.leanF-CS.errF*dt*6,-0.5,0.5); } else CS.leanF*=Math.max(0,1-dt*3); }   /* front-back too, when he's not walking */
// he slouches into the heavy side: shoulders dipped toward the club. His hips shift the other way (and the right foot
// plants wider, out under the arm) so the centre of mass still ends up over his feet: the balance controller drives the hip shift.
const SLOUCH={roll:0.16, s:1, h:1};
function applyLean(J){ J.sroll=(J.sroll||0)+SLOUCH.s*SLOUCH.roll; J.hroll=(J.hroll||0)+SLOUCH.s*SLOUCH.roll*0.3; J.nz=(J.nz||0)-SLOUCH.s*SLOUCH.roll*0.7;
  const ab=clamp(CS.lean,-0.45,0.45)*0.5; J.lLz=(J.lLz||0)+SLOUCH.h*ab; J.lRz=(J.lRz||0)-SLOUCH.h*ab;   /* both legs lean the same way, parallel: the pelvis shifts over and both soles stay level */ J.hp=(J.hp||0)+CS.leanF*0.45; J.sp=(J.sp||0)+CS.leanF*0.55; J.nz=(J.nz||0)-CS.lean*0.6; J.aLz=(J.aLz||0)+Math.max(0,-CS.lean)*0; return J; }
function stance(t){ const J=P0(); J.hd=0.05; J.kL=0.14; J.kR=0.2; J.lLx=-0.05; J.lRx=0.06; J.lLz=0.08; J.lRz=0.1; J.sp=0.12+0.015*Math.sin(t*1.6); J.nx=0.05;
  J.aLx=0.05+0.05*Math.sin(t*1.1); J.aLz=0.35; J.eL=0.45; return J; }   /* the left arm held out from the body: it helps balance him */
const CWALK={stance:0.6,front:-0.36,back:0.36,high:-0.6,kStance:0.16,kImpact:0.25,kLift:0.95,liftEnd:0.55};
// the right foot is dragged: under the arm's weight it barely leaves the floor, the toe scraping as it's hauled forward
const CWALK_R={stance:0.62,front:-0.24,back:0.34,high:-0.14,kStance:0.12,kImpact:0.14,kLift:0.16,liftEnd:0.6};
function dragWalk(ph){ const J=P0(); const a=stride(ph,CWALK), b=stride((ph+0.5)%1,CWALK_R);
  J.lLx=a.lx; J.kL=a.k; J.fL=a.f; J.lRx=b.lx; J.kR=b.k+0.1; J.fR= b.plant? b.f : 0.42;    /* toe turned down, scraping */
  dragWalk.scrape=!b.plant;
  const imp=Math.max(0,1-(ph%0.5)/0.12); J.hd=0.06+0.06*imp*(ph>=0.5?1.4:0.7); J.sp=0.2+0.05*imp; J.hp=0.05; J.nx=-0.02;
  J.hyaw=0.1*Math.sin(ph*Math.PI*2); J.syaw=-0.14*Math.sin(ph*Math.PI*2); J.aLx=0.5*Math.sin(ph*Math.PI*2); J.aLz=0.4; J.eL=0.5; return J; }
// the Tactician's head is a core shell with ~26 bulbs stuck on it; a few only touch the surface and leave cracks.
// At load, each loosely attached bulb is pulled in toward the head's centre until it sinks well into its neighbours,
// and swollen slightly so the seam closes. (The model file is left alone.)
function tacBulbFix(mesh){
  const g=mesh.geometry, pos=g.attributes.position, idx=g.index, si=g.attributes.skinIndex, sw=g.attributes.skinWeight;
  const hb=mesh.skeleton.bones.findIndex(b=>b.name==="head"); if(hb<0||!idx||g.userData.bulbsFixed) return 0; g.userData.bulbsFixed=1;   /* the geometry is shared by every clone */
  const n=pos.count, par=new Int32Array(n); for(let i=0;i<n;i++) par[i]=i;
  const f=x=>{ while(par[x]!==x){ par[x]=par[par[x]]; x=par[x]; } return x; }, un=(a,b)=>{ a=f(a); b=f(b); if(a!==b) par[a]=b; };
  for(let t=0;t<idx.count;t+=3){ un(idx.getX(t),idx.getX(t+1)); un(idx.getX(t+1),idx.getX(t+2)); }
  const key=new Map(); for(let i=0;i<n;i++){ const k=pos.getX(i).toFixed(4)+","+pos.getY(i).toFixed(4)+","+pos.getZ(i).toFixed(4); if(key.has(k)) un(i,key.get(k)); else key.set(k,i); }
  const comps=new Map(); for(let i=0;i<n;i++){ if(si.getX(i)!==hb||sw.getX(i)<0.5) continue; const r=f(i); if(!comps.has(r)) comps.set(r,[]); }
  for(let i=0;i<n;i++){ const r=f(i); if(comps.has(r)) comps.get(r).push(i); }
  const V=THREE.Vector3, list=[...comps.values()], small=[], core=[]; const H=new V(); let hn=0;
  for(const L of list){ for(const i of L){ H.x+=pos.getX(i); H.y+=pos.getY(i); H.z+=pos.getZ(i); hn++; } (L.length>200?core:L.length>8&&L.length<=80?small:null)?.push(L); }
  H.divideScalar(Math.max(1,hn));
  const coreP=[]; for(const L of core) for(const i of L) coreP.push(new V(pos.getX(i),pos.getY(i),pos.getZ(i)));
  const B=small.map(L=>{ const c=new V(); for(const i of L) c.add(new V(pos.getX(i),pos.getY(i),pos.getZ(i))); c.divideScalar(L.length); let r=0; for(const i of L) r+=c.distanceTo(new V(pos.getX(i),pos.getY(i),pos.getZ(i))); return {L,c,r:r/L.length,moved:false}; });
  const reach=b=>{ let dc=1e9; for(const p of coreP) dc=Math.min(dc,p.distanceTo(b.c)); let a=b.r-dc; for(const o of B) if(o!==b) a=Math.max(a,b.r+o.r-b.c.distanceTo(o.c)); return a; };
  for(let it=0;it<4;it++) for(const b of B){ const a=reach(b); if(a>=1.1*b.r) continue; const d=H.clone().sub(b.c); const s=Math.min(0.6*b.r,(1.1*b.r-a)*1.1, d.length()*0.5); if(s<=1e-4) continue;
    d.setLength(s); for(const i of b.L) pos.setXYZ(i,pos.getX(i)+d.x,pos.getY(i)+d.y,pos.getZ(i)+d.z); b.c.add(d); b.moved=true; }
  let moved=0; for(const b of B){ if(!b.moved) continue; moved++; for(const i of b.L){ const p=new V(pos.getX(i),pos.getY(i),pos.getZ(i)).sub(b.c).multiplyScalar(1.08).add(b.c); pos.setXYZ(i,p.x,p.y,p.z); } }
  pos.needsUpdate=true; g.computeBoundingSphere(); g.computeBoundingBox(); return moved; }

// ---- both feet on the floor: when it stands, the balance lean angles the legs and would leave one foot hovering.
// Two-bone leg solve: the lower foot's knee bends until the soles are level; the guard then sets both down.
function legIK(C,s,T,poleW){ const V=THREE.Vector3, R=C.R, hip=R["leg"+s], knee=R["knee"+s], ank=R["ankle"+s]; C.group.updateMatrixWorld(true);
  const S=hip.getWorldPosition(new V()), K0=knee.getWorldPosition(new V()), A0=ank.getWorldPosition(new V()), L1=S.distanceTo(K0), L2=K0.distanceTo(A0);
  const d=clamp(T.distanceTo(S),Math.abs(L1-L2)+0.01,L1+L2-0.001), interior=Math.acos(clamp((L1*L1+L2*L2-d*d)/(2*L1*L2),-1,1));
  knee.rotation.x=Math.PI-interior; knee.updateMatrixWorld(true);
  const A=ank.getWorldPosition(new V()); rotWorld(hip,new THREE.Quaternion().setFromUnitVectors(A.sub(S).normalize(),T.clone().sub(S).normalize()));
  const ax=T.clone().sub(S).normalize(), ve=knee.getWorldPosition(new V()).sub(S), vp=poleW.clone().sub(S); ve.addScaledVector(ax,-ve.dot(ax)); vp.addScaledVector(ax,-vp.dot(ax));
  if(ve.lengthSq()>1e-8&&vp.lengthSq()>1e-8){ let a=ve.angleTo(vp); if(ve.clone().cross(vp).dot(ax)<0) a=-a; rotWorld(hip,new THREE.Quaternion().setFromAxisAngle(ax,a)); } }
/* the foot's own vertices, carried on the rig's ankle: its real lowest point, edge or heel or toe, as it leans */
function footAnchor(C){ let mesh; C.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); const g=mesh.geometry, si=g.attributes.skinIndex, sw=g.attributes.skinWeight, pos=g.attributes.position, bones=mesh.skeleton.bones;
  C.group.updateMatrixWorld(true); C.footPts={L:[],R:[]}; const v=new THREE.Vector3();
  for(let i=0;i<pos.count;i++){ const n=bones[si.getX(i)].name; if(sw.getX(i)>0.5&&(n==="foot_L"||n==="foot_R")){ v.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld); C.footPts[n.slice(-1)].push(C.R["ankle"+n.slice(-1)].worldToLocal(v.clone())); } } }
function footLow(C,s){ C.group.updateMatrixWorld(true); const a=C.R["ankle"+s], v=new THREE.Vector3(); let lo=1e9; for(const p of C.footPts[s]){ v.copy(p); a.localToWorld(v); lo=Math.min(lo,v.y); } return lo; }
/* lift: a foot deliberately raised (a step), in metres; the other one stays down */
function plantFeet(C,ctx){ if(!C.footPts) return; const fwd=new THREE.Vector3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw)), lift=ctx.lift||{}, want=(lift.R||0)-(lift.L||0);
  for(let it=0;it<6;it++){ const lL=footLow(C,"L"), lR=footLow(C,"R"), d=(lR-lL)-want; if(Math.abs(d)<0.002) break;
    const s=d>0?"L":"R", R=C.R, A=R["ankle"+s].getWorldPosition(new THREE.Vector3()), pole=R["knee"+s].getWorldPosition(new THREE.Vector3()).addScaledVector(fwd,0.4);
    legIK(C,s,A.add(new THREE.Vector3(0,Math.abs(d),0)),pole); } }

/* walking: in double support both soles level; in single support the swinging foot is kept clear of the floor by its arc,
   so the planted one is the one that carries it (no stance foot hovering, no swing foot scraping) */
function plantWalk(C,ctx){ if(!C.footPts) return; const G=ctx.gait, a=G.ph%1, b=(G.ph+0.5)%1, st=G.P.stance, inL=a<st, inR=b<st;
  if(inL&&inR){ const land=(a<b)?"L":"R", old=land==="L"?"R":"L";
    if(C.lastLand!==land){ C.lastLand=land; const gap=footLow(C,land)-footLow(C,old); kBias[old]=clamp(kBias[old]+3.0*gap,0,0.8); }   /* touchdown: learn from the gap */
    ctx.lift=null; plantFeet(C,ctx); return; } if(!inL&&!inR) return;
  const s=inL?"L":"R", o=inL?"R":"L", u=((inL?b:a)-st)/(1-st), clear=0.07*Math.sin(Math.PI*clamp(u,0,1));
  const fwd=new THREE.Vector3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw));
  for(let it=0;it<5;it++){ const d=footLow(C,o)-footLow(C,s); if(d>=clear-0.002) break; const R=C.R, A=R["ankle"+o].getWorldPosition(new THREE.Vector3()), pole=R["knee"+o].getWorldPosition(new THREE.Vector3()).addScaledVector(fwd,0.4);
    legIK(C,o,A.add(new THREE.Vector3(0,clear-d,0)),pole); }
}
/* a planted leg at angle lx (− forward) with knee k reaches down cos(k/2)·cos(lx+k/2) of its length; keep that at the
   landing height so the hips ride level and the foot that lands meets the floor at the same height as the one planted */
function levelKnee(lx,kLand,front){ const h=Math.cos(kLand/2)*Math.cos(front+kLand/2); let lo=0, hi=1.4; for(let i=0;i<22;i++){ const k=(lo+hi)/2; if(Math.cos(k/2)*Math.cos(lx+k/2)>h) lo=k; else hi=k; } return (lo+hi)/2; }
/* its own careful stride: the foot comes down smoothly through the end of the swing (no stamp), lands heel first and
   rolls flat over the first part of the stance */
function tStride(ph){ const P=TWALK, st=P.stance;
  if(ph<st){ const u=ph/st; return {lx:P.front+(P.back-P.front)*u, k:0, f:-0.12*(1-sm5(u/0.18))-0.08*sm5((u-0.6)/0.4), plant:true}; }
  const u=(ph-st)/(1-st), up=sm5(u/0.5), dn=sm5((u-0.35)/0.65);
  return {lx:P.back+(P.high-P.back)*up+(P.front-P.high)*dn, k:P.kLift*Math.sin(Math.PI*clamp(u,0,1))+0.1, f:-0.08+0.3*Math.sin(Math.PI*clamp(u/0.7,0,1))-0.04*dn, plant:false}; }
/* plus a learned extra bend of the planted knee (kBias): at each touchdown the gap between the landing foot and the planted
   one is measured and the bias corrected, so the landing foot comes down level with the planted one */
const kBias={L:0.42,R:0.46};   /* what it settles to; still corrected step by step */ const stanceBias=(ph,s)=>{ const u=ph/TWALK.stance; return ph<TWALK.stance ? kBias[s]*sm5(u/0.25) : 0; };
function tLegs(J,ph){ const pa=ph%1, pb=(ph+0.5)%1, a=tStride(pa), b=tStride(pb);
  J.lLx=a.lx; J.fL=a.f; J.kL= a.plant? levelKnee(a.lx,0.1,TWALK.front)+stanceBias(pa,"L") : a.k; J.lRx=b.lx; J.fR=b.f; J.kR= b.plant? levelKnee(b.lx,0.1,TWALK.front)+stanceBias(pb,"R") : b.k; return J; }
// ================================================================ the REACHER (BCROSS)
// Three with necks two or three times a person's, two with arms near four metres long. At load the long parts are given
// a chain of extra joints (the model files are left alone), and each frame the chain is laid along a curve in the world:
// a neck that whips, arcs over and coils; arms that drag on the floor, sweep, snatch and trip. Segment lengths never
// change, so nothing stretches; the physics guard weighs the long parts by their volume like everything else.
const sm5=x=>{ x=sat(x); return x*x*x*(x*(x*6-15)+10); };
const Z=()=>1, V3=THREE.Vector3; SLOUCH.s=0; SLOUCH.h=0;
let NX=3.2; const UP=new V3(0,1,0);
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
let altK={}; const outcome=(id,a,b)=>{ const v=((ctx.outSel&&ctx.outSel[id])||"alt"); if(v==="alt"){ altK[id]=!altK[id]; return altK[id]?a:b; } return v; };

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
  step(t,dt,ctx){ return whipStep(t,dt,ctx,ctx.liveShotAt??null); } };
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


// ---- his one elbow, solved: shoulder (ball) + elbow (hinge) so the club fist reaches a target; the swivel puts the elbow toward a pole
function rotWorld(obj,qw){ obj.updateMatrixWorld(true); const pq=obj.parent.getWorldQuaternion(new THREE.Quaternion()).invert(), wq=obj.getWorldQuaternion(new THREE.Quaternion()); obj.quaternion.copy(pq.multiply(qw.clone().multiply(wq))); obj.updateMatrixWorld(true); }
function armIK(C,o){ const V=THREE.Vector3, R=C.R, sd=(C===runner?SW(o.side||"R"):(o.side||"R")), sh=R["arm"+sd], el=R["elbow"+sd]; C.group.updateMatrixWorld(true); const q0=sh.quaternion.clone(), e0=el.rotation.x;
  const S=sh.getWorldPosition(new V()), L1=S.distanceTo(el.getWorldPosition(new V())), tipL=new V(0,-(R["wrist"+sd].position.length()+(o.tip??0.17)),0), L2=tipL.length();
  const T=o.target, d=clamp(T.distanceTo(S),Math.abs(L1-L2)+0.02,L1+L2-0.002);
  const interior=Math.acos(clamp((L1*L1+L2*L2-d*d)/(2*L1*L2),-1,1)); el.rotation.x=-(Math.PI-interior); el.updateMatrixWorld(true);
  const tip=el.localToWorld(tipL.clone()); rotWorld(sh,new THREE.Quaternion().setFromUnitVectors(tip.sub(S).normalize(),T.clone().sub(S).normalize()));
  const ax=T.clone().sub(S).normalize(), ve=el.getWorldPosition(new V()).sub(S), vp=o.pole.clone().sub(S); ve.addScaledVector(ax,-ve.dot(ax)); vp.addScaledVector(ax,-vp.dot(ax));
  if(ve.lengthSq()>1e-6&&vp.lengthSq()>1e-6){ let a=ve.angleTo(vp); if(ve.clone().cross(vp).dot(ax)<0) a=-a; rotWorld(sh,new THREE.Quaternion().setFromAxisAngle(ax,a)); }
  if(o.w<1){ sh.quaternion.copy(q0.slerp(sh.quaternion.clone(),o.w)); el.rotation.x=e0+(el.rotation.x-e0)*o.w; sh.updateMatrixWorld(true); }
  return el.localToWorld(tipL.clone()); }
// a Crossed standing behind him, to show what the falling arm does
let by=null, by2=null;
function byPlace(L){ [by,by2].forEach((b,i)=>{ if(b&&L[i]){ b.x=L[i][0]; b.z=L[i][1]; b.hit=null; b.fs=null; b.kick=null; b.c.gs=null; } }); }
function stepBystander(dt){ [by,by2].forEach((b,i)=>{ if(!b) return; const on=!!ctx.by && i<(ctx.byN||1); b.c.group.visible=b.c.shadow.visible=on; if(!on) return;
  const J=P0(); J.aLz=J.aRz=0.14; J.eL=J.eR=0.35; J.nx=0.12+0.04*Math.sin(t*1.3+i*2); J.kL=J.kR=0.08; J.sp=0.1+0.03*Math.sin(t*0.9+i);
  if(b.hit!=null){ J.aLx=J.aRx=-1.5; J.aLz=J.aRz=0.7; J.sp=-0.3; J.nx=-0.3; PHYS.topple(b.fs,dt,1.7,Math.PI/2-0.05); }
  applyPose(b.c,J); b.c.group.position.set(b.x,0,b.z); b.c.group.rotation.set(0,Math.PI/2,0); if(b.fs) b.c.group.rotateX(-b.fs.th); retarget(b.c);
  PHYS.rig(b.c,dt,{kick:b.kick,balance:b.hit==null}); }); }
function muzzleFlash(){ if(!norah||!norah.c.B.hand_R) return; const p=new THREE.Vector3(); norah.c.B.hand_R.getWorldPosition(p); const m=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xffd27a,transparent:true,depthWrite:false})); m.position.copy(p); m.scale.setScalar(0.25); scene.add(m); puffs.push({m,t:0.45,v:new THREE.Vector3(),s:0.5}); }
let dmgT=0; function showDmg(k){ if(PVHOOK.dmg) PVHOOK.dmg(k); }

// ---------------------------------------------------------------- Norah: stands in the way, gets knocked back
function norahStep(N,dt,ctx){
  if(ctx.nOver){ const o=ctx.nOver; if(MIR){ if(o.roll) o.roll=-o.roll; if(o.z) o.z=-o.z; if(o.kickV) o.kickV=Object.assign({},o.kickV,{z:-(o.kickV.z||0)}); } if(o.x!=null) N.x=o.x; const J=o.J; if(o.jolt){ J.sp+=0.25*o.jolt; J.nx+=0.3*o.jolt; } applyPose(N.c,J); N.c.group.position.set(N.x,o.y||0,o.z||0); N.c.group.rotation.set(0,o.yaw??-Math.PI/2,0); if(o.fall) N.c.group.rotateX(-o.fall); if(o.roll) N.c.group.rotateZ(o.roll);
    ctx.nKick=o.kick?{id:o.kick,v:o.kickV}:null; ctx.nDown=!!(o.fall||o.roll||o.down); ctx.nUp=!!o.up; ctx.nOver=null; return; }
  const J=P0(); J.aLx=-0.25; J.aRx=-0.5; J.eL=0.5; J.eR=0.9; J.aLz=0.12; J.aRz=0.1; J.kL=J.kR=0.08; J.lLx=-0.08; J.lRx=0.08;
  if(N.kb>0){ N.kt+=dt; const u=N.kt;                                                         // thrown back off her feet, then down
    if(N.kb===2){ N.vy-=9.8*dt; N.y=Math.max(0,N.y+N.vy*dt); N.x+=N.kv*dt; N.kv=Math.max(0,N.kv-(N.y>0?0.8:11)*dt); N.fall=Math.min(1.5,N.fall+dt*(N.y>0?3.4:6)); if(N.y<=0&&!N.landed&&u>0.15){ N.landed=1; const p=N.c.group.position.clone(); puff(p,1.8); shake=Math.max(shake,0.08); } }
    else { N.x+=N.kv*dt; N.kv=Math.max(0,N.kv-6.5*dt); N.fall=Math.min(1.45,N.fall+dt*(u<0.25?2.2:4.6)); }
    J.aLx=-1.6; J.aRx=-1.4; J.aLz=0.9; J.aRz=0.8; J.eL=J.eR=0.4; J.nx=-0.5*Math.min(1,u*5); J.sp=-0.35; J.lLx=-0.6*Math.min(1,u*3); J.kL=0.5; J.lRx=-0.2; J.kR=0.3;
    if(u>0.9){ J.aLx=-2.4; J.aRx=-2.2; J.aLz=0.5; J.aRz=0.6; } }
  applyPose(N.c,J); N.c.group.position.set(N.x,N.y||0,0); N.c.group.rotation.set(0,-Math.PI/2,0);
  N.c.model.rotation.x=0; N.c.group.rotateX(-N.fall); }

// ---------------------------------------------------------------- the wrong body: things a person's body won't do
// rise: the whole body pivots on its heels as one rigid plank. footBack: a foot turned round on its ankle. claw: hands bent hard
// at the wrist, fingers driven in. levelHead: the head held dead level and still in the world, whatever the body under it does.
function unnatural(C,ctx){ const R=C.R;
  if(ctx.rise) C.group.rotateX(ctx.rise);
  for(const s of ["L","R"]){ const p=C===runner?SW(s):s; R["ankle"+p].rotation.y=(ctx.footBack&&ctx.footBack[s])||0; R["wrist"+p].rotation.x=(ctx.claw&&ctx.claw[s])||0; }
  if(ctx.levelHead){ C.group.updateMatrixWorld(true); const qp=R.head.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    const qd=new THREE.Quaternion().setFromEuler(new THREE.Euler(ctx.levelHead.pitch||0,ctx.yaw+(ctx.levelHead.yaw||0),ctx.levelHead.roll||0,"YXZ")); R.head.quaternion.copy(qp.multiply(qd)); } }
// ---------------------------------------------------------------- afterimages
const ghosts=[]; let ghostT=0;
function makeGhosts(C){ for(const g of ghosts) scene.remove(g.obj); ghosts.length=0;
  for(let i=0;i<10;i++){ const obj=THREE.SkeletonUtils.clone(C.model); const B={}; obj.traverse(o=>{ if(o.isBone) B[o.name]=o; if(o.isMesh){ o.frustumCulled=false; o.material=new THREE.MeshBasicMaterial({map:o.material.map,color:0xff8a66,transparent:true,opacity:0,depthWrite:false,skinning:!!o.isSkinnedMesh}); o.renderOrder=-1; } });
    const holder=new THREE.Group(); holder.add(obj); holder.visible=false; scene.add(holder); ghosts.push({obj:holder,model:obj,B,life:0}); } }
const ghostHist=[]; function ghostRecord(C){ const b={}; for(const k in C.B) b[k]=[C.B[k].position.clone(),C.B[k].quaternion.clone()]; ghostHist.push({p:C.group.position.clone(),q:C.group.quaternion.clone(),b}); if(ghostHist.length>14) ghostHist.shift(); }
const TWIST=[["head",new THREE.Vector3(0,1,0),2.6],["chest",new THREE.Vector3(0,1,0),1.4],["forearm_L",new THREE.Vector3(1,0,0),-2.2],["forearm_R",new THREE.Vector3(1,0,0),-2.2],["shin_R",new THREE.Vector3(1,0,0),-1.8],["neck",new THREE.Vector3(0,0,1),1.7]];
function dropGhost(C){ const g=ghosts.find(x=>x.life<=0)||ghosts[0]; const h=ghostHist[Math.max(0,ghostHist.length-1-6)]||ghostHist[ghostHist.length-1]; if(!h) return;   /* a tenth of a second behind it */
  g.life=0.32; g.obj.visible=true; g.obj.position.copy(h.p); g.obj.quaternion.copy(h.q); g.vel=new THREE.Vector3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw)).multiplyScalar((ctx.v||0)*0.35);
  for(const k in h.b){ const d=g.B[k]; if(d){ d.position.copy(h.b[k][0]); d.quaternion.copy(h.b[k][1]); } }
  g.tw=null; if(Math.random()<0.4){ const w=TWIST[Math.floor(Math.random()*TWIST.length)]; if(g.B[w[0]]) g.tw={bone:g.B[w[0]],axis:w[1],rate:w[2]*(Math.random()<0.5?-1:1)}; } }
function updateGhosts(dt){ for(const g of ghosts){ if(g.life<=0) continue; g.life-=dt; const o=Math.max(0,g.life/0.32)*0.42;
    if(g.vel) g.obj.position.addScaledVector(g.vel,dt); if(g.tw) g.tw.bone.rotateOnAxis(g.tw.axis,g.tw.rate*dt);   /* lags on behind it; some keep twisting the wrong way */ g.model.traverse(m=>{ if(m.isMesh) m.material.opacity=o; }); if(g.life<=0) g.obj.visible=false; } }

// ---------------------------------------------------------------- dust and shake
const puffs=[]; const puffTex=(()=>{ const c=document.createElement("canvas"); c.width=c.height=64; const g=c.getContext("2d"); const gr=g.createRadialGradient(32,32,2,32,32,30); gr.addColorStop(0,"rgba(190,170,150,0.55)"); gr.addColorStop(1,"rgba(190,170,150,0)"); g.fillStyle=gr; g.fillRect(0,0,64,64); return new THREE.CanvasTexture(c); })();
function puff(p,s){ for(let i=0;i<5;i++){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,transparent:true,depthWrite:false})); m.position.set(p.x+(Math.random()-.5)*0.2,0.06,p.z+(Math.random()-.5)*0.2); m.scale.setScalar(0.2*s); scene.add(m);
  puffs.push({m,t:0,v:new THREE.Vector3((Math.random()-.5)*0.8,0.3+Math.random()*0.3,(Math.random()-.5)*0.8),s}); } }
let shake=0;

// ---------------------------------------------------------------- run it

// ---------------------------------------------------------------- the live host side of a preview module (inside its closure)
// Everything above is the preview's own engine and creature code, unchanged. A playground enemy hands in a body record h:
// {C (this module's character), ctx, t, stage, norah (a stand-in for the live player, in stage coordinates), clip}.
// pvStep runs one frame of it exactly as the preview page's frame() did, minus the page's camera, Norah and UI.
function pvBind(h){ runner=h.C; ctx=h.ctx; scene=h.stage; t=h.t; norah=h.norah; MIR=!!h.mir; if(h.nx!=null) NX=h.nx; }
function pvSetup(C){ runner=C; C.group.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(C.model); C.sz=1; C.hgt=bb.max.y-bb.min.y; C.group.scale.setScalar(1); C.pb=null; C.a0=null;
  solePts(C,"L"); footAnchor(C); if(typeof limbAnchor==="function") limbAnchor(C); C.hip0=C.R.hip0; return C; }
function pvStep(h,dt){ pvBind(h); h.t+=dt; t=h.t;
  ctx.moving=false; ctx.armScale=1; ctx.rise=null; ctx.ik=null; ctx.ik2=null; ctx.post=null; ctx.post2=null; ctx.onLimbs=false; ctx.held=false; ctx.wall=false; ctx.kick=null; ctx.noPlant=false; ctx.lift=null; ctx.gait=null; ctx.grip=0; ctx.events=[]; ctx.ghost=false; ctx.local=null; ctx.footBack=null; ctx.claw=null; ctx.levelHead=null; ctx.nOver=null;
  const clip=h.clip, x0=ctx.x, z0=ctx.z||0; const J=clip.step(t,dt,ctx); const PH=clip.phys;
  if(PH&&PH.active(ctx)){ ctx.x=x0; ctx.z=z0; if(!ctx.plOn){ ctx.plOn=1; ctx.plReset=1; if(runner.pl){ runner.pl.vx=ctx.v||0; } } physLoco(runner,J,ctx,dt,PH); } else { ctx.plOn=0; ctx.y=0; applyPose(runner,J); }
  const lx=ctx.local?MS()*ctx.local.x:0, lz=ctx.local?ctx.local.z:0, fx_=Math.sin(ctx.yaw), fz_=Math.cos(ctx.yaw);
  runner.group.position.set(ctx.x+fx_*lz+fz_*lx, ctx.plOn?ctx.y:(ctx.elev||0), (ctx.z||0)+fz_*lz-fx_*lx);
  runner.group.rotation.set(0,ctx.yaw,0); if(typeof unnatural==="function") unnatural(runner,ctx); if(ctx.post){ ctx.post(); }
  for(const k of ["ik","ik2"]){ const o=ctx[k]; if(!o) continue; if(o.at){ const r=o.at(); o.target=r.target; o.pole=r.pole; } ctx[k+"Tip"]=armIK(runner,o); }
  retarget(runner); if(ctx.post2){ runner.group.updateMatrixWorld(true); ctx.post2(dt); }
  runner.group.position.y=ctx.plOn?(ctx.y||0):(ctx.elev||0); const mB=PHYS.rig(runner,dt,{balance:false,kick:ctx.kick,held:!!ctx.held,rigid:!!ctx.rise||!!ctx.onLimbs}); if(!ctx.rise&&typeof balance==="function") balance(runner,mB,ctx,dt);
  runner.group.updateMatrixWorld(true); return ctx.events; }
// puffs and gore belong to the module, not to one body: run once a frame
function pvFx(dt){ if(typeof goreStep==="function") goreStep(dt);
  for(let i=puffs.length-1;i>=0;i--){ const q=puffs[i]; q.t+=dt; q.m.position.addScaledVector(q.v,dt); q.v.multiplyScalar(1-dt*2.5); q.m.scale.setScalar((0.25+q.t*1.6)*q.s); q.m.material.opacity=Math.max(0,0.8-q.t*1.6); if(q.t>0.6){ q.m.parent&&q.m.parent.remove(q.m); puffs.splice(i,1); } }
  const s=shake; shake=0; return s; }

// ================================================================ the Reachers, live (playground)
// Each body keeps its own joint chains (RC): bound in with the rest of it every frame.
function pvPrep(g,h){ h.rc=buildChains(g); RC=h.rc; }
function pvPost(C,h){ C.rc=h.rc; chainRig(C,h.rc); headCentre(C); }
{ const bind0=pvBind; pvBind=function(h){ bind0(h); if(h.C&&h.C.rc) RC=h.C.rc; else if(h.rc) RC=h.rc; }; }
const LIVE={};
function turnTo(ctx,dt,rate){ const w=ctx.wantYaw??ctx.yaw; let d=w-ctx.yaw; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return ctx.yaw+clamp(d,-rate*dt,rate*dt); }
// loom: comes on slowly, swaying, to the edge of its reach (ctx.gap: how far she really is); backs off if she steps inside it
LIVE.loom={ start(ctx){ ctx.ph=ctx.ph||0; ctx.T=ctx.T||{}; ctx.T.mode="in"; },
  step(t,dt,ctx){ const T=ctx.T, R=REACH(), gap=ctx.gap??(NX-ctx.x); let J; ctx.yaw=turnTo(ctx,dt,0.9);
    const lost=ctx.wantV===0;
    if(lost||(gap<=R-0.02&&gap>=R-0.5)){ if(T.mode!=="hold"&&!gaitStop(ctx,dt,T.mode==="back"?-1:1,T.mode==="back"?1.3:1.7)) J=rWalk(t,ctx.ph); else { T.mode="hold"; J=tLegs(rStand(t),ctx.ph); }
      ctx.phase= lost?"stands, swaying":"at the edge of its reach · sways"; }
    else if(gap>R-0.02){ T.mode="in"; gaitOn(ctx,dt,1,1.7); J=rWalk(t,ctx.ph); ctx.phase="comes on slowly, swaying"; ctx.events.push({kind:"drag"}); }
    else { T.mode="back"; gaitOn(ctx,dt,-1,1.3); J=rWalk(t,ctx.ph); ctx.phase="backs off to keep its distance"; ctx.events.push({kind:"drag"}); }
    ctx.post=()=>{ if(KIND()==="neck") neckTo(neckShape(loomP(t)),nHead(),0.15); else { armTo("L",drape("L",t)); armTo("R",drape("R",t)); } };
    return fin(J); } };
LIVE.loom.phys=TPHYS;
// down: the legs go and it falls forward on its face; the neck (or the arms) lie out along the floor
LIVE.die={ start(ctx){ ctx.dT=null; },
  step(t,dt,ctx){ if(ctx.dT==null){ ctx.dT=t; ctx.dJ=rStand(t); } const u=sm5((t-ctx.dT)/0.7), J=P0(); J.hd=runner.hip0-0.14; J.hp=1.45; J.sp=0.05; J.nx=-0.4;
    J.aLx=-1.6; J.aRx=-1.3; J.aLz=0.5; J.aRz=0.6; J.eL=0.4; J.eR=0.6; J.lLx=-0.1; J.lRx=0.1; J.kL=0.3; J.kR=0.2;
    ctx.post=()=>{ const P=TP(), g=runner.group.position.clone().setY(0.07);
      if(KIND()==="neck"){ const root=nRoot(), down=mkPath([root, root.clone().addScaledVector(P.fwd,0.25).setY(Math.max(0.15,root.y*0.5)), g.clone().addScaledVector(P.fwd,0.9), g.clone().addScaledVector(P.fwd,1.8).addScaledVector(P.right,0.3), g.clone().addScaledVector(P.fwd,2.8).addScaledVector(P.right,-0.2)]);
        chainTo(runner.nk,runner.nkEnd,lerpPath(neckShape(loomP(t)),down,u),0.08); }
      else { armTo("L",drape("L",t,{fw:1.1})); armTo("R",drape("R",t,{fw:1.1,spread:0.3})); } };
    ctx.phase="dead"; return mix(ctx.dJ,J,u); } };
// an arm taken off at a joint by her shots (side, joint 1..3)
LIVE.cutArm=(h,s,j)=>{ pvBind(h); if(!runner.ar||runner.ar[s].cut!=null) return false; cutArm(s,RC.main[j-1]); return true; };
LIVE.kind=h=>{ pvBind(h); return RC&&RC.kind; };
LIVE.reach=h=>{ pvBind(h); return REACH(); };

return { A, LIVE, makeChar, pvPrep:(typeof pvPrep==="function"?pvPrep:null), pvPost:(typeof pvPost==="function"?pvPost:null), pvSetup, pvBind, pvStep, pvFx, PHYS, P0, mix, PVHOOK, get NX(){ return NX; } };
})();
