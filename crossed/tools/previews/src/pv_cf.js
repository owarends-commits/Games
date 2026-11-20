// ================================================================ PV_CF: clubfist-preview.html wrapped for the playground (made by mkpv.py)
const PV_CF=(function(){
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

function applyPose(C,J){ const R=C.R;
  R.hips.position.set(J.hx,R.hip0-J.hd,J.hz); R.hips.rotation.set(J.hp,J.hyaw,J.hroll);
  R.chest.rotation.set(J.sp,J.syaw,J.sroll); R.neck.rotation.set(J.nx,J.ny,J.nz); R.head.rotation.set(J.hdx,J.hdy,0);
  R.armL.rotation.set(J.aLx,J.aLy,J.aLz); R.armR.rotation.set(J.aRx,-J.aRy,-J.aRz); R.elbowL.rotation.x=-J.eL; R.elbowR.rotation.x=-J.eR;
  R.legL.rotation.set(J.lLx,0,J.lLz); R.legR.rotation.set(J.lRx,0,-J.lRz); R.kneeL.rotation.x=J.kL; R.kneeR.rotation.x=J.kR; R.ankleL.rotation.x=J.fL; R.ankleR.rotation.x=J.fR; }
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
function clubSwing(J,ctx,dt,o={}){ const Lc=0.62, c=CS.club, a=((ctx.v||0)-CS.lastV)/Math.max(dt,1e-4); CS.lastV=ctx.v||0;
  // body accelerating forward swings it back; a turn of the chest flings it out sideways
  const drive=(o.drive||0), turn=((J.syaw||0)-CS.lastYaw)/Math.max(dt,1e-4); CS.lastYaw=J.syaw||0;
  c.v+=(-(GRAVC/Lc)*Math.sin(c.x)-1.6*c.v+clamp(a,-12,12)/Lc*Math.cos(c.x)+drive)*dt; c.x+=c.v*dt;
  const s=CS.side; s.v+=(-(GRAVC/Lc)*Math.sin(s.x)-1.8*s.v+clamp(turn,-20,20)*0.9+(o.sideDrive||0))*dt; s.x+=s.v*dt;
  J.aRx=c.x+(o.base||0); J.aRz=0.3+s.x; J.eR=0.18; return J; }
// balance: lean the hips and chest away from the heavy side until the centre of mass is over the feet
function balance(C,m,ctx,dt){ if(!m||!m.con.length) return; let cx=0,cz=0; for(const p of m.con){ cx+=p.x; cz+=p.z; } cx/=m.con.length; cz/=m.con.length;
  const rx=Math.cos(ctx.yaw), rz=-Math.sin(ctx.yaw), fx=Math.sin(ctx.yaw), fz=Math.cos(ctx.yaw); CS.err=(m.com.x-cx)*rx+(m.com.z-cz)*rz; CS.lean=clamp(CS.lean+CS.err*dt*6,-0.45,0.45);
  if(!ctx.moving){ CS.errF=(m.com.x-cx)*fx+(m.com.z-cz)*fz; CS.leanF=clamp(CS.leanF-CS.errF*dt*6,-0.5,0.5); } else CS.leanF*=Math.max(0,1-dt*3); }   /* front-back too, when he's not walking */
// he slouches into the heavy side: shoulders dipped toward the club. His hips shift the other way (and the right foot
// plants wider, out under the arm) so the centre of mass still ends up over his feet: the balance controller drives the hip shift.
const SLOUCH={roll:0.16, s:1, h:1};
function applyLean(J){ J.sroll=(J.sroll||0)+SLOUCH.s*SLOUCH.roll; J.hroll=(J.hroll||0)+SLOUCH.s*SLOUCH.roll*0.3; J.nz=(J.nz||0)-SLOUCH.s*SLOUCH.roll*0.7;
  const ab=clamp(CS.lean,-0.45,0.45)*0.5; J.lLz=(J.lLz||0)+SLOUCH.h*ab; J.lRz=(J.lRz||0)-SLOUCH.h*ab+0.08; J.hroll-=SLOUCH.h*ab;   /* legs angle under him: pelvis shifts over, feet stay */ J.hp=(J.hp||0)+CS.leanF*0.45; J.sp=(J.sp||0)+CS.leanF*0.55; J.nz=(J.nz||0)-CS.lean*0.6; J.aLz=(J.aLz||0)+Math.max(0,-CS.lean)*0; return J; }
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
// neutral: never still. The head snaps to new bearings, he sniffs the air in short bursts, and the big arm twitches:
// a jerk at the elbow or a hitch of the shoulder that sets the whole heavy pendulum swinging
const NS0={head:{x:0,v:0},hT:0.3,hTo:0,sT:1.6,tT:1.1,tw:0};
A.idle={ start(ctx){ ctx.x=-0.5; ctx.yaw=Math.PI/2; ctx.norah=false; ctx.v=0; Object.assign(NS0,{head:{x:0,v:0},hT:0.3,hTo:0,sT:1.6,tT:1.1,tw:0}); },
  step(t,dt,ctx){ const J=stance(t); let drive=0;
    NS0.hT-=dt; if(NS0.hT<=0){ NS0.hT=0.35+Math.random()*0.9; NS0.hTo=Math.random()<0.2?0:(Math.random()*2-1)*1.1; }
    const h=spring(NS0.head,NS0.hTo,dt,24); J.ny=h*0.6; J.hdy=h*0.35; J.syaw+=h*0.12; J.nz=(J.nz||0)-h*0.06;
    ctx.phase="looks around";
    NS0.sT-=dt; if(NS0.sT<-0.8) NS0.sT=1.5+Math.random()*2.2;
    if(NS0.sT<0){ const u=Math.sin(sat(-NS0.sT/0.8)*Math.PI); J.nx=(J.nx||0)-0.35*u; J.hdx=-0.22*u+0.06*u*Math.sign(Math.sin(t*57)); J.sp-=0.06*u; ctx.phase="sniffs the air"; }
    NS0.tT-=dt; if(NS0.tT<=0){ NS0.tT=0.9+Math.random()*2.0; NS0.tw=0.22; NS0.twK=Math.random()<0.5?"elbow":"shoulder"; }
    let el=0.18, base=0; if(NS0.tw>0){ NS0.tw-=dt; const q=Math.sin((1-NS0.tw/0.22)*Math.PI); if(NS0.twK==="elbow") el=0.18+0.9*q; else { base=-0.25*q; J.sroll=(J.sroll||0)+0.08*q; } drive=7*q*(NS0.twK==="elbow"?-1:1); ctx.phase="the big arm twitches"; }
    clubSwing(J,ctx,dt,{drive,base}); J.eR=el; return applyLean(J); } };
A.walk={ start(ctx){ ctx.x=-6; ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=false; },
  step(t,dt,ctx){ if(t<0.6){ ctx.phase="stands lopsided"; ctx.v=0; const J=stance(t); clubSwing(J,ctx,dt); return applyLean(J); }
    const prev=ctx.ph, slowR=ctx.ph>=0.5?0.75:1.15; ctx.ph=(ctx.ph+dt/1.25*slowR)%1;    /* lingers on the heavy-side foot */
    if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:ctx.ph<prev?0.5:0.85});
    if(t>9.4){ ctx.phase="stops"; ctx.v=Math.max(0,(ctx.v||0)-dt*2); const J=stance(t); clubSwing(J,ctx,dt); return applyLean(J); }
    ctx.v=1.05*(0.75+0.5*Math.max(0,1-(ctx.ph%0.5)/0.3)); ctx.x+=ctx.v*dt; ctx.moving=true; ctx.phase="drags himself on · the arm swings";
    const J=dragWalk(ctx.ph); if(dragWalk.scrape){ ctx.scrT=(ctx.scrT||0)-dt; if(ctx.scrT<=0){ ctx.scrT=0.09; ctx.events.push({kind:"scrape"}); } }
    clubSwing(J,ctx,dt,{sideDrive:2.2*Math.sin(ctx.ph*Math.PI*2)}); return applyLean(J); } };
// ---- left jabs: quick and short, the left shoulder snapping forward
A.jab={ start(ctx){ ctx.x=3.2-1.25; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.nx=3.2; },
  step(t,dt,ctx){ const J=stance(t); const jabs=[0.9,1.75,3.3]; let e=0, ld=0, stp=0;
    // each jab: a short load (elbow back, left shoulder turned away, weight sinking) then the release: hips and shoulders
    // whip through, the arm snaps straight, and the left foot steps in under it, carrying his weight into her
    for(const j0 of jabs){ const u=t-j0;
      if(u>=-0.2&&u<0){ ld=sm5((u+0.2)/0.2); }
      else if(u>=0&&u<0.5){ e= u<0.08? Math.pow(u/0.08,1.5) : u<0.14? 1 : 1-sm5((u-0.14)/0.36); stp=Math.sin(Math.min(1,u/0.3)*Math.PI);
        if(u<0.3){ const dx=dt*0.75*Math.cos(Math.min(1,u/0.3)*Math.PI/2); ctx.x+=dx; }
        if(u>=0.08&&!ctx["h"+j0]){ ctx["h"+j0]=1; ctx.jt=t; ctx.events.push({kind:"jabHit"}); } } }
    J.aLx=-0.45*(1-e)+(-0.1)*ld-1.5*e; J.eL=1.7+0.3*ld-1.65*e; J.aLz=0.25-0.15*e+0.1*ld;
    J.syaw=0.32*ld-0.6*e; J.hyaw=0.14*ld-0.28*e; J.sp=0.14+0.04*ld+0.16*e; J.hz=0.08*e; J.kL=0.14+0.18*ld; J.kR=0.2+0.15*ld+0.1*e; J.hd=0.05+0.04*ld;
    J.lLx=-0.05-0.5*stp; J.kL+=0.45*stp; J.fL=-0.1*stp;      /* the left foot steps in with the punch */
    // her: knocked back a step each time, winded a little
    const jl=ctx.jt!=null?Math.max(0,1-(t-ctx.jt)/0.45):0; if(ctx.jt!=null&&t-ctx.jt<0.25) ctx.nx+=dt*1.0*(1-(t-ctx.jt)/0.25);
    const nJ=NP.stand(); nJ.hz=-0.1*jl; nJ.sp=-0.25*jl+0.35*jl*jl; nJ.nx=-0.35*jl; nJ.aLx=-0.25-0.4*jl; nJ.aRx=-0.5-0.3*jl; nJ.lLx=0.3*jl; nJ.kL=0.08+0.3*jl;
    ctx.nOver={J:nJ,x:ctx.nx};
    ctx.phase= e>0?"jab · steps in":ld>0?"loads":"guard up"; clubSwing(J,ctx,dt); return applyLean(J); } };
// ---- overhead hammer: heaves the club up over his head (the tell), brings it down; the weight drags him a step after it
// ---- overhead hammer: one fluid heave, elbow cocked so the club hangs behind his head; then the arm SWELLS up there (the tell).
// Brought down, it throws his whole body forward into a stagger and leaves him stunned. Shot while it swells, the top-heavy club can
// tip back past his heels and take him over backward, flat as a plank; the huge arm slams down behind him on anything standing there.
let hamAlt=false; const hamOutcome=()=>{ const v=((ctx.outSel&&ctx.outSel["oHammer"])||"alt"); if(v==="alt"){ hamAlt=!hamAlt; return hamAlt?"smash":"tip"; } return v; };
const sm5=x=>{ x=sat(x); return x*x*x*(x*(x*6-15)+10); };
A.hammer={ start(ctx){ ctx.x=3.2-2.3; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.soft=true; ctx.out=hamOutcome(); ctx.by=true; ctx.shots=0; if(by){ by.x=ctx.x-1.75; } },
  step(t,dt,ctx){ const J=stance(t); ctx.soft=true; let th=0, el=0.18, sc=1; const W0=0.35, W1=1.6, G1=2.9, S1=3.32;
    // Norah: braces and gets hit, or shoots into the swelling arm
    if(ctx.out==="tip" && ctx.tip==null){ const aim=ss((t-1.2)/0.4); const nJ=NP.stand(); nJ.aRx=-1.5*aim; nJ.eR=0.12+0.4*(1-aim); nJ.aLx=-1.3*aim; nJ.eL=0.7; nJ.aLz=-0.1*aim;
      if(ctx.shots<2 && t>[2.0,2.45][ctx.shots]){ ctx.shots++; ctx.events.push({kind:"shot",n:ctx.shots}); if(ctx.shots===2){ ctx.tip=t; ctx.tS={th:0.04,w:0.35}; } }
      ctx.nOver={J:nJ,x:3.2}; }
    // ---- tipped over backward
    if(ctx.tip!=null){ const k=t-ctx.tip, S=ctx.tS; const lean=sm5(k/0.35);
      PHYS.topple(S,dt,1.95,Math.PI/2-0.05); ctx.rise=-S.th; ctx.noBal=1;
      J.sp=-0.08; J.hp=0; J.kL=J.kR=0.04; J.lLx=J.lRx=0; J.aLx=-1.4-0.6*sm5(k/0.5); J.aLz=0.6; J.eL=0.3; J.nx=-0.3*lean;
      th=-3.05-0.35*lean; el=2.3-1.9*sm5(k/0.45); sc=1.55-0.55*ss((k-1.4)/2.0);
      if(S.done&&!ctx.landed){ ctx.landed=t; ctx.events.push({kind:"tipLand"}); }
      ctx.phase= !S.done? (k<0.3?"the club tips back past his heels":"goes over backward, rigid") : "flat on his back · stunned";
      if(S.done){ const l=t-ctx.landed; J.nx=0.05*Math.sin(l*2.3); J.aLx=-2.0+0.1*Math.sin(l*3); }
      const nJ=NP.stand(); nJ.aRx=-1.5*(1-ss(k/1.2)); nJ.eR=0.12+0.5*ss(k/1.2); nJ.aLx=-1.3*(1-ss(k/1.2)); ctx.nOver={J:nJ,x:3.2};
      ctx.armScale=sc; CS.club.x=th; CS.club.v=0; J.aRx=th; J.aRz=0.3; J.eR=el; return J; }
    if(t<W0){ ctx.phase="sizes her up"; clubSwing(J,ctx,dt); return applyLean(J); }
    if(t<W1){ // one continuous heave: the knees load first, the body rises, the shoulder lifts the arm and the elbow folds last
      const u=(t-W0)/(W1-W0), dip=Math.sin(Math.min(1,u*1.4)*Math.PI);
      th=-3.05*sm5(u*1.12-0.08); el=0.18+2.12*sm5(u*1.35-0.35); J.kL=J.kR=0.14+0.28*dip; J.hd=0.05+0.07*dip; J.sp=0.12+0.08*sm5(u); J.syaw=0.22*sm5(u); J.aLx=-0.8*sm5(u); J.aLz=0.35+0.3*sm5(u); J.nx=-0.1*sm5(u);
      ctx.phase="heaves the club up · elbow folding behind his head"; }
    else if(t<G1){ // it swells: the whole arm grows, pulsing, heavier every moment; he trembles under it
      const u=(t-W1)/(G1-W1); sc=1+0.55*sm5(u)+0.025*u*Math.sin(t*21); const tr=noise(t*36,4)*0.04*(0.4+u);
      th=-3.05+tr; el=2.3+tr*0.8; J.kL=J.kR=0.16+0.12*u; J.sp=0.2+tr; J.syaw=0.22; J.aLx=-0.8; J.aLz=0.65+0.15*u; J.nx=-0.1+0.12*u;
      if(u>0.1&&!ctx.c1){ ctx.c1=1; ctx.events.push({kind:"swell"}); } ctx.phase="the arm swells over his head (the tell)"; }
    else if(t<S1){ // the smash: the shoulder leads, the elbow whips straight after it, the body follows down
      const u=(t-G1)/(S1-G1), d1=u*u, d2=Math.pow(sat((u-0.2)/0.8),2); sc=1.55;
      th=-3.05+1.8*d1; el=2.3-2.2*d2; J.sp=0.2+0.5*d1; J.hp=0.22*d1; J.kL=J.kR=0.28+0.4*d1; J.hd=0.07+0.12*d1; J.syaw=0.22-0.7*d1; J.aLx=-0.8+1.3*d1; J.aLz=0.8-0.35*d1;
      ctx.phase="brings it down"; }
    else { const k=t-S1; sc=1+0.55*(1-ss((k-0.8)/1.8)); if(!ctx.hit){ ctx.hit=t; ctx.events.push({kind:"hammer",big:true}); }
      if(k<0.95){ // thrown forward after it: two stumbling steps, the club dragging
        const st=Math.sin(Math.min(1,k/0.95)*Math.PI*2), f=Math.exp(-k*2.2);
        ctx.x+=dt*1.5*f; J.sp=0.7*f+0.3; J.hp=0.25*f; J.lLx=-0.55*Math.max(0,st); J.kL=0.3+0.6*Math.max(0,st); J.lRx=-0.45*Math.max(0,-st); J.kR=0.35+0.5*Math.max(0,-st); J.hd=0.12;
        th=-1.25+0.15*sm5(k/0.95); el=0.1; J.aLx=0.6*f; J.aLz=0.6; ctx.phase="the weight throws him forward"; if(k>0.15&&!ctx.st1){ ctx.st1=1; ctx.events.push({kind:"stomp",side:"L",strength:0.9}); } if(k>0.6&&!ctx.st2){ ctx.st2=1; ctx.events.push({kind:"stomp",side:"R",strength:0.7}); } }
      else if(k<2.5){ // stunned: head lolling, swaying, the arm a dead weight on the floor shrinking back
        const l=k-0.95; J.sp=0.3+0.05*Math.sin(l*2.2); J.nx=0.35+0.18*Math.sin(l*2.7); J.nz=0.25*Math.sin(l*1.9); J.hroll=0.06*Math.sin(l*1.9); J.kL=J.kR=0.3+0.05*Math.sin(l*3); J.hd=0.1; J.aLx=0.1; J.aLz=0.55+0.1*Math.sin(l*2);
        th=-1.1+0.05*Math.sin(l*2); el=0.12; ctx.phase="stunned · reeling"; }
      else { const r=sm5((k-2.5)/0.9); J.sp=0.3*(1-r)+J.sp*r; J.nx=0.35*(1-r); J.kL=J.kR=0.3*(1-r)+0.17*r; J.hd=0.1*(1-r)+0.05*r; th=-1.1*(1-r); el=0.12; ctx.phase="shakes it off";
        if(r>=1){ ctx.armScale=1; clubSwing(J,ctx,dt); return applyLean(J); } } }
    ctx.armScale=sc; CS.club.x=th; CS.club.v=0; J.aRx=th; J.aRz=0.3; J.eR=el; return applyLean(J); } };
let poundAlt=false; const poundOutcome=()=>{ const v=((ctx.outSel&&ctx.outSel["oPound"])||"alt"); if(v==="alt"){ poundAlt=!poundAlt; return poundAlt?"free":"beaten"; } return v; };
A.pound={ start(ctx){ ctx.x=3.2-2.1; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.ph=0; ctx.out=poundOutcome(); ctx.mash=0; ctx.n=0; ctx.nx=3.2; },
  step(t,dt,ctx){ const nx=ctx.nx;
    if(t<1.2){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt/1.0)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.7});
      ctx.v=1.1; ctx.x=Math.min(nx-0.74,ctx.x+ctx.v*dt); ctx.phase="lurches at her"; const J=dragWalk(ctx.ph); J.aLx=-0.9*ss((t-0.6)/0.6); J.eL=0.6; clubSwing(J,ctx,dt); return applyLean(J); }
    ctx.v=0; const tg=t-1.2; const J=stance(t);
    // the grip: left hand at her collar, his arm braced straight
    const reach=ss(tg/0.2); J.aLx=-1.25*reach; J.aLz=0.15; J.eL=0.35*reach+0.5*(1-reach); J.syaw=-0.25*reach; J.sp=0.18;
    if(tg>=0.2&&!ctx.seized){ ctx.seized=1; ctx.events.push({kind:"seized"}); }
    ctx.grip = ctx.res==null ? sm5(tg/0.2) : Math.max(0,1-sm5((t-ctx.resT)/(ctx.res==="free"?0.12:0.35)));   /* the small hand on her collar for the whole hold */
    const free = ctx.out==="free" && ctx.mash>=1, done=ctx.res!=null;
    if(!done){ const rate=ctx.out==="free"?0.42:0.22; if(tg>0.2) ctx.mash=Math.min(1,ctx.mash+dt*rate); ctx.qte= tg>0.2? ctx.mash : null; }
    // the gut punch, by IK: the elbow drives back and the club fist tucks in at the side of his own abdomen, coiled; then a short,
    // straight jab drives it into the front of her stomach. It lands where her stomach actually is, and stays planted while she folds over it.
    let th=0, el=0.2; const cyc=1.45, k=tg-0.35, c=Math.floor(k/cyc), u=k-c*cyc;
    const V=THREE.Vector3, fwd=new V(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw)), right=new V(-Math.cos(ctx.yaw),0,Math.sin(ctx.yaw))   /* his right: the club side */;
    const hipW=runner.B.hips.getWorldPosition(new V()), shW=runner.B.upperarm_R.getWorldPosition(new V());
    const side=hipW.clone().addScaledVector(right,0.62).addScaledVector(fwd,-0.12).add(new V(0,0.16,0));           /* out at the side of his gut, just behind the hip: the club clears his body */
    const belly=norah.c.B.hips.getWorldPosition(new V()).add(new V(0,0.1,0)).addScaledVector(fwd,-0.14);        /* the front of her stomach */
    const poleBack=shW.clone().addScaledVector(fwd,-0.75).addScaledVector(right,0.55).add(new V(0,0.1,0)), poleDown=shW.clone().add(new V(0,-0.7,0)).addScaledVector(right,0.5);
    const hangPt=hipW.clone().addScaledVector(right,0.6).add(new V(0,-0.32,0)); ctx.hangPt=hangPt;      /* hanging, well outside his hip */
    if(!done && k<=0){ ctx.ik={target:hangPt,pole:poleDown,w:sm5(tg/0.35)}; }
    if(!done && k>0){
      if(u<0.55 && c>0){ ctx.ik={target:side,pole:poleBack,w:1}; J.syaw=0.35; J.hyaw=0.15; J.sp=0.23; J.kR=0.4; J.hd=0.09; ctx.phase="coiled"; }   /* already drawn back to the side */
      else if(u<0.55){ const w=sm5(u/0.55); ctx.ik={target:hangPt.clone().lerp(side,w),pole:poleDown.clone().lerp(poleBack,w),w:1}; J.syaw=-0.25+0.6*w; J.hyaw=0.15*w; J.sp=0.18+0.05*w; J.kR=0.2+0.2*w; J.hd=0.05+0.04*w; ctx.phase="drives the elbow back · fist by his gut"; }
      else if(u<0.72){ const tr=noise(t*44,8)*0.015; ctx.ik={target:side.clone().add(new V(tr,tr,0)),pole:poleBack,w:1}; J.syaw=0.35; J.hyaw=0.15; J.sp=0.23; J.kR=0.4; J.hd=0.09; ctx.phase="coiled"; }
      else if(u<0.84){ const d=Math.pow((u-0.72)/0.12,1.6); ctx.ik={target:side.clone().lerp(belly,d),pole:poleBack.clone().lerp(poleDown,d),w:1}; J.syaw=0.35-0.85*d; J.hyaw=0.15-0.35*d; J.sp=0.23+0.15*d; J.kR=0.4-0.2*d; J.hd=0.09;
        const dx=dt*0.9*(1-d); ctx.x+=dx; ctx.phase="jabs it into her stomach"; }
      else if(u<1.0){ ctx.ik={target:belly,pole:poleDown,w:1}; J.syaw=-0.5; J.hyaw=-0.2; J.sp=0.38; J.hd=0.09; ctx.phase="fist buried in her stomach";
        if(ctx.n<=c){ ctx.n=c+1; ctx.events.push({kind:"pound",n:ctx.n}); ctx.jolt=t; } }
      else { const r=sm5((u-1.0)/0.45); const mid=side.clone().addScaledVector(right,0.3).addScaledVector(fwd,0.4); ctx.ik={target:belly.clone().multiplyScalar((1-r)*(1-r)).addScaledVector(mid,2*r*(1-r)).addScaledVector(side,r*r),pole:poleDown.clone().lerp(poleBack,r),w:1};   /* swings out round his hip */ J.syaw=-0.5+0.85*r; J.hyaw=-0.2+0.35*r; J.sp=0.38-0.15*r; J.kR=0.2+0.2*r; ctx.phase="draws back to his side"; } }
    if(free&&!done){ ctx.res="free"; ctx.resT=t; ctx.events.push({kind:"escape"}); }
    if(!done && ctx.out!=="free" && ctx.n>=3 && u>1.38){ ctx.res="beaten"; ctx.resT=t; ctx.events.push({kind:"beaten"}); }
    const jl=ctx.jolt!=null?Math.max(0,1-(t-ctx.jolt)/0.35):0;
    // her
    if(!done){ const w=ctx.jolt!=null?Math.max(0,1-(t-ctx.jolt)/0.7):0, w2=w*w, fold=Math.min(1,w*1.6);
      const nJ=NP.stand(); nJ.aLx=nJ.aRx=-1.15*(1-fold)-0.55*fold; nJ.eL=nJ.eR=1.5+0.5*fold; nJ.aLz=nJ.aRz=-0.1-0.25*fold;   /* hands leave his wrist to clutch her stomach */
      nJ.hz=-0.16*w2; nJ.hp=0.25*fold; nJ.sp=-0.1+0.75*fold; nJ.nx=-0.2+0.55*fold; nJ.kL=nJ.kR=0.1+0.35*fold; nJ.hd=0.08*fold;   /* the stomach knocked back, folding over the blow */
      ctx.nOver={J:nJ,x:nx}; }
    if(done){ const r=t-ctx.resT; ctx.ik={target:(ctx.lastIk||side).clone().lerp(hangPt,sm5(r/0.45)),pole:poleDown,w:1-sm5((r-0.45)/0.3)}; }
    if(ctx.ik&&!done) ctx.lastIk=ctx.ik.target.clone();
    if(!done){}   /* (she is still held: handled above) */
    else if(ctx.res==="free"){ const r=t-ctx.resT; ctx.phase= r<0.5?"she tears loose":"he swings at air"; ctx.qte=null; J.aLx=-0.6*(1-ss(r/0.3)); th= r<0.6? -2.5+1.8*ss(r/0.5) : -0.7+0.7*ss((r-0.6)/0.8);
      ctx.nOver={J: r<0.5?NP.stumble():mix(NP.stumble(),NP.stand(),ss((r-0.5)/0.6)), x:nx+1.1*easeOut(Math.min(1,r/0.6))}; el=0.15; if(r>0.6){ clubSwing(J,ctx,dt); return applyLean(J); } }
    else { const r=t-ctx.resT; ctx.phase= r<0.6?"lets her drop":"stands over her"; ctx.qte=null; J.aLx=-1.25*(1-ss(r/0.4)); th=-1.05+1.05*ss(r/0.8);
      const nJ= r<0.5? mix(NP.stand(),NP.kneel(t),ss(r/0.5)) : NP.kneel(t); ctx.nOver={J:nJ,x:nx}; if(r>0.8){ clubSwing(J,ctx,dt); return applyLean(J); } }
    CS.club.x=th; CS.club.v=0; J.aRx=th; J.aRz=0.3; J.eR=el; return applyLean(J); } };
const LEN={idle:7, walk:11, jab:4.8, hammer:7.6, pound:8.6};
const NAMES={idle:"Stands lopsided",walk:"Drag walk",jab:"Left jabs",hammer:"Overhead hammer",pound:"Grab and pound"};
const CWALKPHYS={ active:ctx=>(ctx.phase||"").startsWith("drags himself"), stance:ctx=>strideStance(ctx.ph,CWALK), traction:9, imp:0.7, rollK:0.25, drag:{R:true} };
A.walk.phys=CWALKPHYS;
const DMG0=1; const DMG={shot:["BRUTE −8","shot in the swelling arm"],shotTip:["BRUTE −8","shot · the club tips back"],byHit:["ACROSS −12","the arm comes down on it · knocked back"],jab:["NORAH −10","left jab · knocked back a step"],hammer:["NORAH −45","overhead hammer · knocked down"],pound:["NORAH −15","pounded"],escape:["BROKE FREE","she tears out of his grip"],beaten:["NORAH −60","beaten to her knees"]};

// ---- his one elbow, solved: shoulder (ball) + elbow (hinge) so the club fist reaches a target; the swivel puts the elbow toward a pole
function rotWorld(obj,qw){ obj.updateMatrixWorld(true); const pq=obj.parent.getWorldQuaternion(new THREE.Quaternion()).invert(), wq=obj.getWorldQuaternion(new THREE.Quaternion()); obj.quaternion.copy(pq.multiply(qw.clone().multiply(wq))); obj.updateMatrixWorld(true); }
function armIK(C,o){ const V=THREE.Vector3, R=C.R, sd=o.side||"R", sh=R["arm"+sd], el=R["elbow"+sd]; C.group.updateMatrixWorld(true); const q0=sh.quaternion.clone(), e0=el.rotation.x;
  const S=sh.getWorldPosition(new V()), L1=S.distanceTo(el.getWorldPosition(new V())), tipL=new V(0,-(R["wrist"+sd].position.length()+(o.tip??0.17)),0), L2=tipL.length();
  const T=o.target, d=clamp(T.distanceTo(S),Math.abs(L1-L2)+0.02,L1+L2-0.002);
  const interior=Math.acos(clamp((L1*L1+L2*L2-d*d)/(2*L1*L2),-1,1)); el.rotation.x=-(Math.PI-interior); el.updateMatrixWorld(true);
  const tip=el.localToWorld(tipL.clone()); rotWorld(sh,new THREE.Quaternion().setFromUnitVectors(tip.sub(S).normalize(),T.clone().sub(S).normalize()));
  const ax=T.clone().sub(S).normalize(), ve=el.getWorldPosition(new V()).sub(S), vp=o.pole.clone().sub(S); ve.addScaledVector(ax,-ve.dot(ax)); vp.addScaledVector(ax,-vp.dot(ax));
  if(ve.lengthSq()>1e-6&&vp.lengthSq()>1e-6){ let a=ve.angleTo(vp); if(ve.clone().cross(vp).dot(ax)<0) a=-a; rotWorld(sh,new THREE.Quaternion().setFromAxisAngle(ax,a)); }
  if(o.w<1){ sh.quaternion.copy(q0.slerp(sh.quaternion.clone(),o.w)); el.rotation.x=e0+(el.rotation.x-e0)*o.w; sh.updateMatrixWorld(true); }
  return el.localToWorld(tipL.clone()); }
// a Crossed standing behind him, to show what the falling arm does
let by=null;
function stepBystander(dt){ if(!by) return; const on=!!ctx.by; by.c.group.visible=by.c.shadow.visible=on; if(!on) return;
  const J=P0(); J.aLz=J.aRz=0.14; J.eL=J.eR=0.35; J.nx=0.12+0.04*Math.sin(t*1.3); J.kL=J.kR=0.08; J.sp=0.1;
  if(by.hit!=null){ J.aLx=J.aRx=-1.5; J.aLz=J.aRz=0.7; J.sp=-0.3; J.nx=-0.3; PHYS.topple(by.fs,dt,1.7,Math.PI/2-0.05); }
  applyPose(by.c,J); by.c.group.position.set(by.x,0,by.z); by.c.group.rotation.set(0,Math.PI/2,0); if(by.fs) by.c.group.rotateX(-by.fs.th); retarget(by.c);
  PHYS.rig(by.c,dt,{kick:by.kick,balance:by.hit==null}); }
function muzzleFlash(){ if(!norah||!norah.c.B.hand_R) return; const p=new THREE.Vector3(); norah.c.B.hand_R.getWorldPosition(p); const m=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xffd27a,transparent:true,depthWrite:false})); m.position.copy(p); m.scale.setScalar(0.25); scene.add(m); puffs.push({m,t:0.45,v:new THREE.Vector3(),s:0.5}); }
let dmgT=0; function showDmg(k){ if(PVHOOK.dmg) PVHOOK.dmg(k); }

// ---------------------------------------------------------------- Norah: stands in the way, gets knocked back
function norahStep(N,dt,ctx){
  if(ctx.nOver){ const o=ctx.nOver; if(o.x!=null) N.x=o.x; const J=o.J; if(o.jolt){ J.sp+=0.25*o.jolt; J.nx+=0.3*o.jolt; } applyPose(N.c,J); N.c.group.position.set(N.x,o.y||0,o.z||0); N.c.group.rotation.set(0,-Math.PI/2,0); ctx.nOver=null; return; }
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
  for(const s of ["L","R"]){ R["ankle"+s].rotation.y=(ctx.footBack&&ctx.footBack[s])||0; R["wrist"+s].rotation.x=(ctx.claw&&ctx.claw[s])||0; }
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

// ---------------------------------------------------------------- the live host side of a Brute preview module (club-fist, one-arm)
// These pages run their own frame loop (no foot anchors or post hooks): this is that loop for one live body, minus the
// page's camera, Norah, bystander and UI. The swing state (CS, NS0, S) is the page's one body's: each live body keeps its own.
function pvDeep(o){ if(o&&o.isVector3) return o.clone(); if(Array.isArray(o)) return o.map(pvDeep); if(o&&typeof o==="object"){ const r={}; for(const k in o) r[k]=pvDeep(o[k]); return r; } return o; }
const PV_SHARED=[CS,NS0,S], PV_ST0=PV_SHARED.map(pvDeep); let pvCurC=null;
function pvBind(h){ runner=h.C; ctx=h.ctx; scene=h.stage; t=h.t; norah=h.norah; if(typeof MIR!=="undefined") MIR=!!h.mir;
  const C=h.C; if(C&&pvCurC!==C){ if(pvCurC) pvCurC.pvSt=PV_SHARED.map(o=>Object.assign({},o)); const st=C.pvSt||PV_ST0.map(pvDeep);
    PV_SHARED.forEach((o,i)=>{ for(const k of Object.keys(o)) delete o[k]; Object.assign(o,st[i]); }); pvCurC=C; } }
function pvSetup(C){ runner=C; if(!C.sz) C.sz=1; C.group.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(C.model); C.hgt=bb.max.y-bb.min.y; C.pb=null; C.a0=null;
  solePts(C,"L"); C.hip0=C.R.hip0; return C; }
const pvHB=n=>typeof HB==="function"?HB(n):n;
function pvStep(h,dt){ pvBind(h); h.t+=dt; t=h.t;
  ctx.moving=false; ctx.armScale=1; ctx.rise=null; ctx.ik=null; ctx.grip=0; ctx.events=[]; ctx.ghost=false; ctx.local=null; ctx.footBack=null; ctx.claw=null; ctx.levelHead=null; ctx.kick=null;
  const clip=h.clip, x0=ctx.x, z0=ctx.z||0; const J=clip.step(t,dt,ctx); const PH=clip.phys; ctx.lastJ=J;
  if(PH&&PH.active(ctx)){ ctx.x=x0; ctx.z=z0; if(!ctx.plOn){ ctx.plOn=1; ctx.plReset=1; if(runner.pl){ runner.pl.vx=ctx.v||0; } } physLoco(runner,J,ctx,dt,PH); } else { ctx.plOn=0; ctx.y=0; applyPose(runner,J); }
  const ms=typeof MS==="function"?MS():1, lx=ctx.local?ms*ctx.local.x:0, lz=ctx.local?ctx.local.z:0, fx_=Math.sin(ctx.yaw), fz_=Math.cos(ctx.yaw);
  runner.group.position.set(ctx.x+fx_*lz+fz_*lx, ctx.plOn?ctx.y:0, (ctx.z||0)+fz_*lz-fx_*lx);
  runner.group.rotation.set(0,ctx.yaw,0); unnatural(runner,ctx); if(ctx.ik) ctx.ikTip=armIK(runner,ctx.ik); retarget(runner);
  { const sc=ctx.armScale||1, ua=runner.B[pvHB("upperarm_R")]; ua.scale.setScalar(sc); ua.updateMatrixWorld(true); for(const n of ["upperarm_R","forearm_R","hand_R"].map(pvHB)) runner.B[n].userData.massScale=sc*sc*sc; }
  runner.group.position.y=ctx.y||0; const mB=PHYS.rig(runner,dt,{balance:false,kick:ctx.kick,soft:[pvHB("upperarm_R")],rigid:!!ctx.rise}); if(!ctx.rise) balance(runner,mB,ctx,dt);
  if(ctx.grip){ const V=THREE.Vector3; runner.group.updateMatrixWorld(true);
    const nk=norah.c.B.neck.getWorldPosition(new V()), ch=norah.c.B.chest.getWorldPosition(new V()), sh=runner.B[pvHB("upperarm_L")].getWorldPosition(new V());
    const collar=ch.clone().lerp(nk,0.72), toHim=sh.clone().sub(collar).setY(0).normalize(); collar.addScaledVector(toHim,0.075);
    const left=new V(Math.cos(ctx.yaw),0,-Math.sin(ctx.yaw)).multiplyScalar(ms), pole=sh.clone().add(new V(0,-0.6,0)).addScaledVector(left,0.35);
    ctx.gripTip=armIK(runner,{side:"L",target:collar,pole,w:ctx.grip,tip:0.06}); retarget(runner); ctx.gripTarget=collar; }
  runner.group.updateMatrixWorld(true); return ctx.events; }
function pvFx(dt){ for(let i=puffs.length-1;i>=0;i--){ const q=puffs[i]; q.t+=dt; q.m.position.addScaledVector(q.v,dt); q.v.multiplyScalar(1-dt*2.5); q.m.scale.setScalar((0.25+q.t*1.6)*q.s); q.m.material.opacity=Math.max(0,0.8-q.t*1.6); if(q.t>0.6){ q.m.parent&&q.m.parent.remove(q.m); puffs.splice(i,1); } }
  const s=shake; shake=0; return s; }

// ================================================================ the club-fist Brute, live (playground)
const LIVE={}; const WALK_PHASE="drags himself on · the arm swings";
function turnTo(ctx,dt,rate){ const w=ctx.wantYaw??ctx.yaw; let d=w-ctx.yaw; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return ctx.yaw+clamp(d,-rate*dt,rate*dt); }
const pvZ=()=>typeof Z==="function"?Z():1;
// the drag walk, steered: it turns toward where it wants to go, and stands when there's nowhere to go
LIVE.walk={ start(ctx){ ctx.ph=ctx.ph||0; },
  step(t,dt,ctx){ ctx.yaw=turnTo(ctx,dt,1.0);
    if(!(ctx.wantV>0)){ ctx.phase="stands lopsided"; ctx.v=0; const J=stance(t); clubSwing(J,ctx,dt); return applyLean(J); }
    const prev=ctx.ph, slowR=ctx.ph>=0.5?0.75:1.15; ctx.ph=(ctx.ph+dt/1.25*slowR)%1;
    if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:ctx.ph<prev?0.5:0.85});
    ctx.v=1.05*pvZ()*(0.75+0.5*Math.max(0,1-(ctx.ph%0.5)/0.3)); ctx.moving=true; ctx.phase=WALK_PHASE;
    const J=dragWalk(ctx.ph); if(dragWalk.scrape){ ctx.scrT=(ctx.scrT||0)-dt; if(ctx.scrT<=0){ ctx.scrT=0.09; ctx.events.push({kind:"scrape"}); } }
    clubSwing(J,ctx,dt,{sideDrive:2.2*Math.sin(ctx.ph*Math.PI*2)}); return applyLean(J); } };
LIVE.walk.phys=CWALKPHYS;
// down: goes over backward, rigid, the way the tipped club takes him, and lies there
LIVE.die={ start(ctx){ ctx.dS={th:0.04,w:0.5}; ctx.dJ=ctx.lastJ||stance(0); ctx.dk=0; },
  step(t,dt,ctx){ ctx.dk+=dt; const S2=ctx.dS, u=sm5(ctx.dk/0.6); PHYS.topple(S2,dt,1.9*pvZ(),Math.PI/2-0.05); ctx.rise=-S2.th; ctx.noBal=1;
    const L=P0(); L.sp=-0.08; L.kL=L.kR=0.05; L.aLx=-1.2; L.aLz=0.7; L.eL=0.3; L.aRx=-1.0; L.aRz=0.5; L.eR=0.2; L.nx=-0.3; ctx.phase="dead"; return mix(ctx.dJ,L,u); } };
// up again (after the club tipped him over): rocks back up to his feet
LIVE.rise={ start(ctx){ ctx.rJ=ctx.lastJ||stance(0); ctx.rTh=(ctx.tS&&ctx.tS.th)||0; ctx.rk=0; },
  step(t,dt,ctx){ ctx.rk+=dt; const u=sm5(ctx.rk/1.6); if(ctx.rTh>0.02){ ctx.rise=-ctx.rTh*(1-u); ctx.noBal=1; } else ctx.noBal=0;
    const J=stance(t); clubSwing(J,ctx,dt); ctx.phase=u<1?"heaves himself back up":"stands lopsided"; return mix(ctx.rJ,applyLean(J),u); } };

return { A, LIVE, makeChar, pvPrep:(typeof pvPrep==="function"?pvPrep:null), pvPost:(typeof pvPost==="function"?pvPost:null), pvSetup, pvBind, pvStep, pvFx, PHYS, P0, mix, PVHOOK, get NX(){ return NX; } };
})();
