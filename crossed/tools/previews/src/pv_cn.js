// ================================================================ PV_CN: contortionist-preview.html wrapped for the playground (made by mkpv.py)
const PV_CN=(function(){
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
// ================================================================ the CONTORTIONIST (BCROSS)
// Spider-like. Three movement subclasses on one body: the backbend spider walk (belly up, head twisted round the right
// way), the face-down spider crawl (elbows and knees jutting high over its back), and the upright walker that folds
// down into the crawl with its joints popping the wrong way. Hands and feet are planted on the floor (or the wall) at
// fixed points and swung to the next: nothing skates, and the physics guard holds the body up on them.
const sm5=x=>{ x=sat(x); return x*x*x*(x*(x*6-15)+10); };
const Z=()=>(runner&&runner.sz)||1, V3=THREE.Vector3;
SLOUCH.s=0; SLOUCH.h=0;
let NX=3.2;   /* live: where she is along the stage line, set every frame */
// size: the small ones are quick and light, the big ones slow and heavy (same animations)
const SZ=()=>runner&&runner.hgt?runner.hgt:1.56, QUICK=()=>Math.sqrt(1.56/SZ());
const TP=()=>({fwd:new V3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw)), right:new V3(-Math.cos(ctx.yaw),0,Math.sin(ctx.yaw))});
const LIMBS=[{k:"armL",arm:true,s:"L",off:0.0},{k:"armR",arm:true,s:"R",off:0.5},{k:"legL",arm:false,s:"L",off:0.5},{k:"legR",arm:false,s:"R",off:0.0}];
function limbRoot(L){ runner.group.updateMatrixWorld(true); return (L.arm?runner.R["arm"+L.s]:runner.R["leg"+L.s]).getWorldPosition(new V3()); }
function limbLen(L){ const R=runner.R; if(L.arm){ const a=R["arm"+L.s].getWorldPosition(new V3()), e=R["elbow"+L.s].getWorldPosition(new V3()), w=R["wrist"+L.s].getWorldPosition(new V3()); return a.distanceTo(e)+e.distanceTo(w)*(1+0.08*Z()/e.distanceTo(w)); }
  const h=R["leg"+L.s].getWorldPosition(new V3()), k=R["knee"+L.s].getWorldPosition(new V3()), a=R["ankle"+L.s].getWorldPosition(new V3()); return h.distanceTo(k)+k.distanceTo(a); }
// the gait: each limb in stance holds its anchor; in swing it arcs to a foothold ahead of where its root will be at landing
// Q: {T (cycle s), duty, stride (m), lift (m), splay (m out from the root), reach (m ahead of the root), offs}
function gaitStep(ctx,Q,dt,moving,surf){ const G=ctx.G||(ctx.G={ph:0,limb:{}}); const S=surf||floorSurf;
  if(moving) G.ph+=dt/(Q.v? Q.stride/(Q.v*Q.duty) : Q.T);
  for(const L of LIMBS){ const st=G.limb[L.k]||(G.limb[L.k]={anchor:null,swing:null});
    const ph=((G.ph+(Q.offs?Q.offs[L.k]:L.off))%1+1)%1, inStance= !moving || ph<Q.duty;
    const hold=(root)=>reachable(root,S.hold(root,L,Q),L,S);   /* where this limb would plant now, within its reach */
    if(inStance){ if(st.swing){ st.anchor=st.swing.to.clone(); st.swing=null; ctx.events.push({kind:"plant",limb:L.k,p:st.anchor.clone(),arm:L.arm}); } if(!st.anchor) st.anchor=hold(limbRoot(L)); st.tgt=st.anchor; }
    else { const u=(ph-Q.duty)/(1-Q.duty);
      if(!st.swing){ const ahead=limbRoot(L).addScaledVector(S.along(),Q.stride*0.5+ (ctx.v||0)*Q.T*(1-Q.duty)); st.swing={from:(st.anchor||hold(limbRoot(L))).clone(), to:hold(ahead)}; st.anchor=null; }
      const p=st.swing.from.clone().lerp(st.swing.to,sm5(u)); p.addScaledVector(S.normal(),Q.lift*Math.sin(Math.PI*u)); st.tgt=p; } }
  return G; }
// a hold the limb can actually reach: slid in along the surface toward the root until it's within 90% of the limb's length
function reachable(root,p,L,S){ const n=S.normal(), d=p.clone().sub(root), dn=d.dot(n), tan=d.clone().addScaledVector(n,-dn), Lm=limbLen(L)*0.9;
  const maxT=Math.sqrt(Math.max(0,Lm*Lm-dn*dn)); if(tan.length()>maxT) tan.setLength(maxT); return root.clone().addScaledVector(n,dn).add(tan); }
// a surface the limbs plant on: the floor, or the wall
const floorSurf={ along:()=>TP().fwd, normal:()=>new V3(0,1,0),
  hold(root,L,Q){ const P=TP(), side=L.s==="L"?-1:1, p=root.clone().addScaledVector(P.right,side*(Q.splay||0)).addScaledVector(P.fwd,(Q.reach||0)*(L.arm?1:-0.3)); p.y= L.arm?Q.handY:runner.a0; return p; } };
// solve every limb onto its target; poles put the elbows and knees where this subclass carries them
// the arm, solved numerically: the elbow bends until the hand is the right distance from the shoulder (true to this rig,
// whatever way its forearm bone points), then the arm aims at the target and swivels the elbow toward the pole
function handTip(L){ const R=runner.R, w=R["wrist"+L.s].position; return w.clone().multiplyScalar((w.length()+0.08*Z())/w.length()); }
function armIK2(s,T,pole){ const R=runner.R, sh=R["arm"+s], el=R["elbow"+s], tl=handTip({s}); runner.group.updateMatrixWorld(true); const S=sh.getWorldPosition(new V3()), d=T.distanceTo(S);
  const dist=e=>{ el.rotation.x=e; el.updateMatrixWorld(true); return el.localToWorld(tl.clone()).distanceTo(S); };
  let lo=-2.7, hi=0.05; if(dist(hi)<=d){ el.rotation.x=hi; } else if(dist(lo)>=d){ el.rotation.x=lo; } else { for(let i=0;i<20;i++){ const m=(lo+hi)/2; if(dist(m)>d) hi=m; else lo=m; } el.rotation.x=(lo+hi)/2; }
  el.updateMatrixWorld(true); const tip=el.localToWorld(tl.clone()); rotWorld(sh,new THREE.Quaternion().setFromUnitVectors(tip.sub(S).normalize(),T.clone().sub(S).normalize()));
  const ax=T.clone().sub(S).normalize(), ve=el.getWorldPosition(new V3()).sub(S), vp=pole.clone().sub(S); ve.addScaledVector(ax,-ve.dot(ax)); vp.addScaledVector(ax,-vp.dot(ax));
  if(ve.lengthSq()>1e-8&&vp.lengthSq()>1e-8){ let a=ve.angleTo(vp); if(ve.clone().cross(vp).dot(ax)<0) a=-a; rotWorld(sh,new THREE.Quaternion().setFromAxisAngle(ax,a)); } }
function limbEnd(L){ const R=runner.R; return L.arm? R["elbow"+L.s].localToWorld(handTip(L)) : R["ankle"+L.s].getWorldPosition(new V3()); }
// the hand's and foot's own vertices, carried on the rig: where they really meet the floor or the wall
function limbAnchor(C){ let mesh; C.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); const g=mesh.geometry, si=g.attributes.skinIndex, sw=g.attributes.skinWeight, pos=g.attributes.position, bones=mesh.skeleton.bones;
  C.group.updateMatrixWorld(true); C.limbPts={}; const v=new V3(), map={hand_L:["wristL","armL"],hand_R:["wristR","armR"],foot_L:["ankleL","legL"],foot_R:["ankleR","legR"]};
  for(let i=0;i<pos.count;i++){ const n=bones[si.getX(i)].name, m=map[n]; if(sw.getX(i)>0.5&&m){ v.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld); (C.limbPts[m[1]]||(C.limbPts[m[1]]=[])).push(C.R[m[0]].worldToLocal(v.clone())); } } }
function limbContact(L,n,lvl){ const R=runner.R, b=L.arm?R["wrist"+L.s]:R["ankle"+L.s]; b.updateMatrixWorld(true); let lo=1e9; const v=new V3(); for(const p of runner.limbPts[L.k]||[]){ v.copy(p); b.localToWorld(v); lo=Math.min(lo,v.dot(n)-lvl); } return lo; }   /* how far the limb is clear of the surface (− = through it) */
function limbsIK(ctx,poles,surf){ const S=surf||floorSurf, n=S.normal(), lvl= S===wallSurfRef()? WX : 0;   /* distance from the surface along its normal */
  for(const L of LIMBS){ const st=ctx.G.limb[L.k]; if(!st||!st.tgt) continue; const pole=poles(L,limbRoot(L)), solve=T=>{ if(L.arm) armIK2(L.s,T,pole); else legIK(runner,L.s,T,pole); };
    st.T=st.tgt.clone(); solve(st.T); }
  // then, measured the way the guard measures it (the skinned mesh): planted ends just touch, swinging ones never go through
  const BN={armL:["hand_L","forearm_L"],armR:["hand_R","forearm_R"],legL:["foot_L","shin_L"],legR:["foot_R","shin_R"]};
  for(let it=0;it<3;it++){ retarget(runner); runner.group.updateMatrixWorld(true); if(!runner.pb){ const ms=[]; runner.group.traverse(q=>{ if(q.isSkinnedMesh) ms.push(q); }); runner.pb=PHYS.body(ms); } const m=runner.pb.measure(); let worst=0;
    for(const L of LIMBS){ const st=ctx.G.limb[L.k]; if(!st||!st.T) continue; let lo=1e9; m.pts.forEach((q,k)=>{ const b=m.bone[k]; if(b&&BN[L.k].includes(b.name)) lo=Math.min(lo,q.dot(n)+lvl); });
      if(lo>1e8) continue; const planted=!!st.anchor, c= planted? lo : Math.min(0,lo); if(Math.abs(c)<0.003) continue; worst=Math.max(worst,Math.abs(c));
      st.T.addScaledVector(n,-c); const pole=poles(L,limbRoot(L)); if(L.arm) armIK2(L.s,st.T,pole); else legIK(runner,L.s,st.T,pole); }
    if(worst<0.003) break; } }
function crawlPoles(L,root){ const P=TP(), side=L.s==="L"?-1:1; return root.clone().add(new V3(0,1.3*Z(),0)).addScaledVector(P.right,side*0.25*Z()).addScaledVector(P.fwd,L.arm?0.15:-0.3); }   /* elbows and knees high over the back */
const TWALK={stance:0.64,front:-0.3,back:0.3,high:-0.5,kStance:0.1,kImpact:0.1,kLift:0.8,liftEnd:0.55};
const TPHYS={ active:ctx=>(ctx.phase||"").startsWith("walks"), stance:ctx=>strideStance(ctx.ph,TWALK), traction:8, imp:0.6, rollK:0 };
floorSurf.along=()=>ctx.travel||TP().fwd;
// ---- the body poses for each subclass (the limbs are placed by IK)
function crawlBody(t,k){ const J=P0(), q=Math.sin(t*9)*0.01; J.hd=runner.hip0-(0.25*Z()+q); J.hp=1.42; J.sp=0.1; J.nx=-1.15; J.hdx=-0.1; J.hyaw=0.05*k; J.syaw=-0.06*k; return J; }
function bendBody(t,k){ const J=P0(); J.hd=runner.hip0-0.5*Z(); J.hp=-1.32; J.sp=-0.32; J.nx=-0.55; J.ny=Math.PI*0.97; J.hroll=0.04*k; J.sroll=-0.05*k; return J; }   /* belly up, the head twisted right way round */
function bendPoles(L,root){ const tr=ctx.travel||TP().fwd, side=L.s==="L"?-1:1, r=new V3(-tr.z,0,tr.x); return root.clone().add(new V3(0,0.8*Z(),0)).addScaledVector(r,-side*0.35*Z()).addScaledVector(tr,L.arm?-0.35:0.4); }
// gaits (scaled by size: small ones quicker)
const QCRAWL=()=>({T:0.62/QUICK(),duty:0.62,stride:0.38*Z(),lift:0.12*Z(),splay:0.36*Z(),reach:0.14*Z(),handY:0.07*Z(),offs:{armL:0,legR:0.08,armR:0.5,legL:0.58}});
const QBEND=()=>({T:0.5/QUICK(),duty:0.58,stride:0.46*Z(),lift:0.12*Z(),splay:0.2*Z(),reach:0.18*Z(),handY:0.07*Z(),offs:{armL:0,legR:0.06,armR:0.5,legL:0.56}});
// ---- 1 · face-down spider crawl: scuttles in bursts and freezes, head up, watching
A.crawl={ start(ctx){ ctx.x=-5.2; ctx.yaw=Math.PI/2; ctx.travel=null; ctx.norah=false; ctx.v=0; ctx.burst={on:false,t:0.6}; },
  step(t,dt,ctx){ const B=ctx.burst; B.t-=dt; if(B.t<=0){ B.on=!B.on; B.t=B.on?0.7+Math.random()*0.6:0.5+Math.random()*0.8; }
    const Q=QCRAWL(), vmax=1.6*Z()*QUICK(); ctx.v+=((B.on&&ctx.x<5.5?vmax:0)-ctx.v)*Math.min(1,dt*(B.on?9:14)); const mv=ctx.v>0.05; ctx.x+=ctx.v*dt; ctx.moving=mv;
    ctx.phase= mv?"scuttles":"freezes · watching"; const J=crawlBody(t,mv?Math.sin(t*12):0); if(!mv){ J.ny=0.35*Math.sin(t*0.9); J.nx+=0.1*Math.sin(t*1.7); }
    ctx.onLimbs=true; ctx.post=()=>{ Q.v=vmax; gaitStep(ctx,Q,dt*(ctx.v/vmax),mv); limbsIK(ctx,crawlPoles); }; return J; } };
// ---- 2 · backbend spider walk: bent over backward, belly up, head first, the head twisted round the right way up
A.bend={ start(ctx){ ctx.x=-5.6; ctx.yaw=-Math.PI/2; ctx.travel=new V3(1,0,0); ctx.norah=false; ctx.v=0; },
  step(t,dt,ctx){ const Q=QBEND(), vmax=2.1*Z()*QUICK(), go=t>0.5&&ctx.x<5.4; ctx.v+=((go?vmax:0)-ctx.v)*Math.min(1,dt*6); ctx.x+=ctx.v*dt; ctx.moving=ctx.v>0.05;
    ctx.phase= ctx.moving?"skitters, head first, belly up":"bent over backward, head twisted round"; const J=bendBody(t,ctx.moving?Math.sin(t*14):0);
    ctx.onLimbs=true; ctx.post=()=>{ Q.v=vmax; gaitStep(ctx,Q,dt*(ctx.v/vmax||0),ctx.moving); limbsIK(ctx,bendPoles); }; return J; } };
// ---- 3 · upright, then folds: walks like a man, then snaps down into the crawl, joints popping the wrong way
function popPoles(L,root){ const P=TP(), side=L.s==="L"?-1:1; return root.clone().add(new V3(0,-0.2*Z(),0)).addScaledVector(P.right,side*0.2*Z()).addScaledVector(P.fwd,L.arm?-0.6:0.6); }   /* elbows back, knees forward: the wrong way */
A.fold={ start(ctx){ ctx.x=-5.4; ctx.yaw=Math.PI/2; ctx.travel=null; ctx.norah=false; ctx.v=0; ctx.ph=0; ctx.pops=0; },
  step(t,dt,ctx){ const F0=3.0, F1=3.75;
    if(t<F0){ if(t>0.4){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt/1.2)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.4}); ctx.moving=true; ctx.gait={ph:ctx.ph,P:TWALK}; }
      ctx.phase= t>0.4?"walks like a man":"stands like a man"; const J=t>0.4?tLegs(stance(t),ctx.ph):stance(t); J.aLx=0.25*Math.sin(ctx.ph*Math.PI*2); J.aRx=-J.aLx; J.aLz=J.aRz=0.12; J.eL=J.eR=0.3; J.nx=0.05; J.sp=0.05; return J; }
    const u=(t-F0)/(F1-F0), Q=QCRAWL();
    if(u<1){ ctx.phase="snaps down · its joints pop the wrong way"; const w=sm5(u); const J=mix(stance(t),crawlBody(t,0),w);
      for(const th of [0.15,0.35,0.55,0.75]) if(u>=th&&ctx.pops<th*4+0.5){ ctx.pops++; ctx.events.push({kind:"pop"}); }
      ctx.onLimbs=true; ctx.post=()=>{ gaitStep(ctx,Q,0,false); for(const L of LIMBS){ const st=ctx.G.limb[L.k]; st.anchor=null; st.tgt=null; }
        for(const L of LIMBS){ const root=limbRoot(L), down=floorSurf.hold(root,L,Q); const hang=root.clone().add(new V3(0,-limbLen(L)*0.95,0)); ctx.G.limb[L.k].tgt=hang.lerp(down,sm5((u-(L.arm?0.1:0.3))/0.6)); }
        limbsIK(ctx,(L,root)=>{ const a=popPoles(L,root), b=crawlPoles(L,root); return a.lerp(b,sm5((u-0.6)/0.4)); }); };
      return J; }
    const B=ctx.burst||(ctx.burst={on:true,t:0.8}); B.t-=dt; if(B.t<=0){ B.on=!B.on; B.t=B.on?0.7+Math.random()*0.5:0.5+Math.random()*0.6; }
    const vmax=1.6*Z()*QUICK(); ctx.v+=((B.on&&ctx.x<5.5?vmax:0)-ctx.v)*Math.min(1,dt*9); ctx.x+=ctx.v*dt; ctx.moving=ctx.v>0.05; ctx.phase=ctx.moving?"scuttles":"freezes";
    const J=crawlBody(t,ctx.moving?Math.sin(t*12):0); ctx.onLimbs=true; ctx.post=()=>{ Q.v=vmax; gaitStep(ctx,Q,dt*(ctx.v/vmax),ctx.moving); limbsIK(ctx,crawlPoles); }; return J; } };
A.fold.phys=TPHYS;
function goreClear(){} function goreStep(){} function headPt(){ return runner.B.head.getWorldPosition(new V3()); }

// ---- the wall, and climbing it. On the wall it hangs by its grip (the guard lets a body that's held hang); let go and
// gravity has it.
const WX=4.6; let wallMesh=null; const wallSurfRef=()=>wallSurf;
function ensureWall(){ if(wallMesh) return; wallMesh=new THREE.Mesh(new THREE.BoxGeometry(0.3,3.6,7),new THREE.MeshLambertMaterial({color:0x4a4640})); wallMesh.position.set(WX+0.15,1.8,0); scene.add(wallMesh); }
const wallSurf={ along:()=>new V3(0,1,0), normal:()=>new V3(-1,0,0),
  hold(root,L,Q){ const side=L.s==="L"?-1:1, r=TP().right, p=root.clone(); p.x=WX-(L.arm?0.05:0.07)*Z(); p.addScaledVector(r,side*(Q.splay||0)); p.y+=(Q.reach||0)*(L.arm?1:-0.5); return p; } };
function wallPoles(L,root){ const side=L.s==="L"?-1:1, r=TP().right; return root.clone().add(new V3(-0.55*Z(),(L.arm?0.25:-0.05)*Z(),0)).addScaledVector(r,side*0.45*Z()); }   /* elbows and knees jut out from the wall */
function climbBody(t,k){ const J=P0(); J.hp=0.12; J.sp=0.12+0.04*k; J.nx=-0.55; J.hyaw=0.06*k; J.syaw=-0.08*k; return J; }
const QWALL=()=>({T:0.7/QUICK(),duty:0.65,stride:0.3*Z(),lift:0.1*Z(),splay:0.3*Z(),reach:0.32*Z(),handY:0,offs:{armL:0,legR:0.08,armR:0.5,legL:0.58}});
// how far each limb's end is from where it's meant to be: the grip that holds it on the wall
function gripErr(ctx){ const BN={armL:["hand_L","forearm_L"],armR:["hand_R","forearm_R"],legL:["foot_L","shin_L"],legR:["foot_R","shin_R"]}; runner.group.updateMatrixWorld(true); const m=runner.pb.measure(); let worst=0, n=0;
  for(const L of LIMBS){ const st=ctx.G&&ctx.G.limb[L.k]; if(!st||!st.anchor) continue; let hi=-1e9; m.pts.forEach((q,k)=>{ const b=m.bone[k]; if(b&&BN[L.k].includes(b.name)) hi=Math.max(hi,q.x); }); worst=Math.max(worst,Math.abs(WX-hi)); n++; }
  ctx.gripN=n; return worst; }   /* how far the planted hands and feet are from the wall surface (the mesh, as the guard sees it) */
function climbClip(ctx,t,dt,dropOn){ ctx.wall=true; const T=ctx.T, Q=QCRAWL(), QW=QWALL(), sz=Z(), top=(dropOn?1.95:1.75)*sz;
  if(T.ph==="crawl"){ const vmax=1.5*sz*QUICK(); const go=ctx.x<WX-0.95*sz; ctx.v+=((go?vmax:0)-ctx.v)*Math.min(1,dt*8); ctx.x+=ctx.v*dt; ctx.moving=ctx.v>0.05; ctx.onLimbs=true; ctx.phase="scuttles to the wall";
    if(!go&&ctx.v<0.08){ T.ph="rear"; T.t0=t; T.x0=ctx.x; }
    const J=crawlBody(t,ctx.moving?Math.sin(t*12):0); ctx.post=()=>{ Q.v=vmax; gaitStep(ctx,Q,dt*(ctx.v/vmax),ctx.moving); limbsIK(ctx,crawlPoles); }; return J; }
  if(T.ph==="rear"){ const u=(t-T.t0)/0.9, w=sm5(u); ctx.x=T.x0+(WX-0.3*sz-T.x0)*w; ctx.elev=0.12*sz*w; ctx.onLimbs=true; ctx.phase="rears up onto the wall";
    const J=mix(crawlBody(t,0),climbBody(t,0),w);
    ctx.post=()=>{ const G=ctx.G; for(const L of LIMBS){ const st=G.limb[L.k]; if(L.arm){ const root=limbRoot(L), to=wallSurf.hold(root,L,QW); if(!st.from) st.from=(st.anchor||st.tgt).clone(); st.tgt=st.from.clone().lerp(to,sm5(u/0.8)).addScaledVector(new V3(-1,0,0),0.12*Math.sin(Math.PI*sat(u/0.8))); } }
      limbsIK(ctx,(L,root)=>crawlPoles(L,root).lerp(wallPoles(L,root),w)); };
    if(u>=1){ T.ph="climb"; for(const L of LIMBS){ const st=ctx.G.limb[L.k]; st.from=null; st.anchor=L.arm?st.tgt.clone():null; st.swing=null; } ctx.G.ph=0.0; }
    return J; }
  if(T.ph==="climb"){ ctx.held=true; ctx.onLimbs=true; const v=0.75*sz*QUICK(), go=ctx.elev<top; ctx.v=go?v:0; ctx.elev=Math.min(top,ctx.elev+ctx.v*dt); ctx.moving=go; ctx.phase="climbs the wall, hanging by its grip";
    if(!go){ T.ph="hang"; T.t0=t; } const J=climbBody(t,go?Math.sin(t*10):0);
    ctx.post=()=>{ QW.v=v; gaitStep(ctx,QW,dt,go,wallSurf); limbsIK(ctx,wallPoles,wallSurf); ctx.grip=gripErr(ctx); }; return J; }
  if(T.ph==="hang"){ ctx.held=true; ctx.onLimbs=true; const k=t-T.t0; ctx.phase="hangs · the head twists round to look down at the room";
    const J=climbBody(t,0); J.ny=Math.min(1,k/0.5)*2.4; J.hdy=Math.min(1,k/0.5)*0.6; J.nx=-0.2; if(dropOn) dropOn.look(k);
    ctx.post=()=>{ gaitStep(ctx,QW,0,false,wallSurf); limbsIK(ctx,wallPoles,wallSurf); ctx.grip=gripErr(ctx); };
    if(k>(dropOn?dropOn.wait():1.6)){ T.ph="drop"; T.t0=t; T.yaw0=ctx.yaw; ctx.events.push({kind:"letgo"}); } return J; }
  // let go: it pushes off, twists round in the air and lands on all fours
  const k=t-T.t0, w=sm5(k/0.45); ctx.onLimbs=true; ctx.kick={id:"drop"+T.t0,v:dropOn?dropOn.v():{x:-1.4,y:0.6,z:0}}; ctx.yaw=T.yaw0+Math.PI*w; ctx.phase= k<0.6?"lets go · twists round in the air":"lands on all fours";
  const J=mix(climbBody(t,0),crawlBody(t,0),w);
  ctx.post=()=>{ const G=ctx.G; if(k<0.55){ for(const L of LIMBS){ const st=G.limb[L.k]; st.anchor=null; st.swing=null; const root=limbRoot(L); st.tgt=root.clone().add(new V3(0,-limbLen(L)*0.75,0)).addScaledVector(TP().fwd,L.arm?0.25:-0.1); } limbsIK(ctx,crawlPoles); }
    else { gaitStep(ctx,Q,0,false); limbsIK(ctx,crawlPoles); } if(dropOn&&dropOn.post) dropOn.post(k); };
  if(k>0.45 && !T.landed){ T.landed=1; } return J; }
A.climb={ start(ctx){ ensureWall(); ctx.wallOn=true; ctx.x=-0.6; ctx.yaw=Math.PI/2; ctx.travel=null; ctx.norah=false; ctx.v=0; ctx.elev=0; ctx.T={ph:"crawl"}; },
  step(t,dt,ctx){ return climbClip(ctx,t,dt,null); } };

// ---------------------------------------------------------------- the attacks
const NQ={ aim(){ const J=NP.stand(); J.aRx=-1.5; J.eR=0.12; J.aLx=-1.3; J.eL=0.7; J.aLz=-0.1; return J; },
  aimUp(){ const J=NQ.aim(); J.aRx=-2.2; J.aLx=-2.0; J.nx=-0.45; J.sp=-0.12; return J; },
  walk(ph){ const J=NP.stand(); const s=Math.sin(ph*Math.PI*2); J.lLx=-0.35*s; J.lRx=0.35*s; J.kL=0.35*Math.max(0,s); J.kR=0.35*Math.max(0,-s); J.aLx=0.3*s; J.aRx=-0.3*s; return J; },
  flat(k){ const J=NP.stumble(); J.aLx=J.aRx=-1.8-0.5*sat(k/0.6); J.aLz=J.aRz=0.7; J.lLx=0.3*(1-sat(k/0.8)); J.kL=0.1+0.3*(1-sat(k/0.8)); J.lRx=-0.25*(1-sat(k/0.8)); J.kR=0.2; return J; },
  struggle(t){ const J=NQ.flat(1), n=s=>noise(t*16,s)*0.25; J.aLx=-1.2+n(1); J.aRx=-1.1+n(2); J.aLz=0.3; J.aRz=0.3; J.eL=1.2+n(3); J.eR=1.3+n(4); J.lLx=-0.4+n(5); J.kL=0.9; J.lRx=-0.2+n(6); J.kR=0.7; J.nx=0.35; return J; } };
// an upright stance and walk for the third subclass (it walks like a man, then does what a man can't)
function manStand(t){ const J=stance(t); J.aLz=J.aRz=0.12; J.eL=J.eR=0.3; J.nx=0.05; J.sp=0.05; J.lLz=J.lRz=0; J.lLx=J.lRx=0; J.kL=J.kR=0.1; return J; }
function manWalk(t,ph){ const J=tLegs(manStand(t),ph); J.aLx=0.25*Math.sin(ph*Math.PI*2); J.aRx=-J.aLx; return J; }
function walkTo(ctx,t,dt,stopAt){ const go=ctx.x<stopAt; if(go){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt/1.1)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.4}); ctx.moving=true; ctx.gait={ph:ctx.ph,P:TWALK}; ctx.phase="walks like a man"; return manWalk(t,ctx.ph); } return null; }
let altK={};
const outcome=(id,a,b)=>{ const v=((ctx.outSel&&ctx.outSel[id])||"alt"); if(v==="alt"){ altK[id]=!altK[id]; return altK[id]?a:b; } return v; };

// ---- drop from above: it hangs high on the wall; when she passes under, it lets go onto her and pins her. Mash to throw it off.
A.drop={ start(ctx){ ensureWall(); ctx.wallOn=true; ctx.x=WX-1.6; ctx.yaw=Math.PI/2; ctx.travel=null; ctx.norah=true; ctx.v=0; ctx.elev=0; ctx.T={ph:"crawl"}; ctx.nx=WX-4.4; ctx.nph=0; ctx.out=outcome("oDrop","off","bitten"); ctx.mash=0; },
  step(t,dt,ctx){ const T=ctx.T, under=WX-1.2*Z();
    // her: walks in under the wall, aiming about; it drops onto her and she goes down under it
    const YW=Math.PI/2;   /* she faces the wall, looking for it */
    if(!T.landT){ if(T.ph==="hang"||T.ph==="drop"){ if(ctx.nx<under-0.05){ ctx.nph+=dt/0.75; ctx.nx=Math.min(under,ctx.nx+1.1*dt); ctx.nOver={J:NQ.walk(ctx.nph),x:ctx.nx,yaw:YW}; } else ctx.nOver={J:T.ph==="drop"?NQ.aimUp():NQ.aim(),x:ctx.nx,yaw:YW}; } else ctx.nOver={J:NQ.aim(),x:ctx.nx,yaw:YW}; }
    const J0=climbClip(ctx,t,dt,{ wait:()=> ctx.nx>=under-0.06 ? (T.waitT??(T.waitT=t-T.t0))+0.35 : 99,
      look:k=>{}, v:()=>({x:-1.6*Z(),y:0.5,z:0}),
      post:k=>{ if(k>0.5&&!T.landT){ T.landT=t; ctx.events.push({kind:"dropHit"}); } } });
    let J=J0;
    if(T.landT){ const k=t-T.landT; ctx.onLimbs=true;
      // it scuttles up onto her chest as she goes down, and pins her there
      const Q=QCRAWL(), tx=under-0.8*Z(), go=!T.offT && k>0.15 && ctx.x>tx; if(go){ ctx.x=Math.max(tx,ctx.x-1.2*Z()*dt); }
      J=crawlBody(t,go?Math.sin(t*12):0); ctx.post=()=>{ Q.v=1.2*Z(); gaitStep(ctx,Q,go?dt:0,go); limbsIK(ctx,crawlPoles); };
      if(ctx.out==="off" && ctx.mash>=1){ if(!T.offT){ T.offT=t; ctx.events.push({kind:"thrownOff"}); } }
      const pinned=!T.offT; if(pinned){ ctx.mash=Math.min(1,ctx.mash+dt*(ctx.out==="off"?0.62:0.18)); ctx.qte=ctx.mash; } else ctx.qte=null;
      if(pinned){ const n= k<0.3?NP.stumble():NQ.struggle(t); ctx.nOver={J:n,x:ctx.nx,yaw:YW,fall:PHYS.topple(ctx.nT||(ctx.nT={th:0.3,w:2.6}),dt,1.65,1.45)}; }
      else { const u=sat((t-T.offT-0.45)/1.9); ctx.nOver={J:u>0?NG.up(t,u):NG.lie(t,1),x:ctx.nx-HIPLEN(),yaw:YW,down:u<0.72,up:u>0}; }   /* thrown off it: she gets back up */
      if(pinned){ ctx.phase= k<0.4?"drops onto her · she goes down under it":"pins her · mash to throw it off";
        if(ctx.out==="bitten"&&k>1.4){ const b=Math.max(0,Math.sin((k-1.4)*7)); J.nx=(J.nx||0)+0.7*b; if(b>0.97&&!T.bit){ T.bit=1; ctx.events.push({kind:"bite"}); } if(b<0.5) T.bit=0; } }
      else { const r=t-T.offT; ctx.phase= r<0.6?"she throws it off":"she gets up";
        if(r<0.7){ const Qc=QCRAWL(); ctx.post=()=>{ const G=ctx.G; for(const L of LIMBS){ const st=G.limb[L.k]; st.anchor=null; st.swing=null; const root=limbRoot(L); st.tgt=root.clone().add(new V3(0,-limbLen(L)*0.7,0)).addScaledVector(TP().fwd,L.arm?0.2:-0.1); } limbsIK(ctx,crawlPoles); }; }   /* thrown: the limbs flail loose, nothing planted */
        else { const Qc=QCRAWL(); ctx.post=()=>{ gaitStep(ctx,Qc,0,false); limbsIK(ctx,crawlPoles); }; } ctx.kick={id:"off"+T.offT,v:{x:-2.2*Z(),y:1.4,z:0.6}}; }
      if(ctx.out==="bitten"&&k>4.0&&!T.end){ T.end=1; ctx.qte=null; } }
    return J; } };

// ---- wrong-angle strike: it walks up like a man; the arm bends back the wrong way at the elbow and swings round over the
// top from behind, hitting her from an angle she didn't expect
A.strike={ start(ctx){ ctx.x=NX-4.5*Z(); ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.ph=0; ctx.T={}; },
  step(t,dt,ctx){ const T=ctx.T; ctx.nOver={J:NQ.aim(),x:NX};
    const W=walkTo(ctx,t,dt,NX-1.05*Z()); if(W) return W; if(T.t0==null){ T.t0=t; }
    const k=t-T.t0, J=manStand(t); ctx.phase= k<0.7?"stops · the elbow pops the wrong way (the tell)": k<1.05?"the arm whips round over the top":"recovers, twisting back";
    const pop=sm5(k/0.5), sw=Math.pow(sat((k-0.7)/0.32),1.3), back=sm5((k-1.3)/0.8);
    J.eR=-1.15*pop*(1-back)+0.3*back; J.aRz=0.15+0.5*pop*(1-sw);                      /* the elbow bent backward: a joint going the wrong way */
    J.aRx= (0.9*pop)*(1-sw) + (-4.5)*sw*(1-back) + 0.05*back;                          /* back, then up and over and down into her */
    J.syaw= 0.45*pop*(1-sw) - 0.7*sw*(1-back); J.sroll=-0.2*sw*(1-back); J.sp=0.1+0.2*sw*(1-back); J.ny=-0.5*pop*(1-back); J.kL=J.kR=0.15+0.15*sw*(1-back);
    if(sw>0.85&&!T.hit){ T.hit=t; ctx.events.push({kind:"strike"}); }
    if(T.hit){ const h=t-T.hit; const n=h<0.5?NP.stumble():NP.stand(); n.syaw=0.4*(1-sat(h/0.8)); ctx.nOver={J:n,x:NX+0.25*sm5(h/0.4),z:-0.35*sm5(h/0.4),roll:-0.2*Math.sin(Math.min(1,h/0.6)*Math.PI)}; }
    return J; } };

// ---- Norah down on her back, and getting back up: lying, sitting up, onto a knee, standing (one pose space, no snapping)
const NG={ lie(t,k){ const J=P0(), n=s=>noise(t*9,s)*0.08*k; J.hd=norah.c.R.hip0-0.13; J.hp=-1.5; J.sp=-0.05+n(1); J.nx=0.25+n(2); J.lLx=0.05+n(3); J.lRx=-0.05+n(4); J.kL=0.15+Math.abs(n(5)); J.kR=0.1+Math.abs(n(6));
    J.aLx=-2.6+n(7); J.aRx=-2.5+n(8); J.aLz=J.aRz=0.35; J.eL=0.5+n(9); J.eR=0.6+n(10); return J; },   /* flat on her back, arms over her head clawing at the floor */
  sit(){ const J=P0(); J.hd=norah.c.R.hip0-0.14; J.hp=-0.25; J.sp=0.25; J.nx=0.1; J.lLx=-2.25; J.lRx=-1.95; J.kL=2.25; J.kR=1.85; J.fL=0.3; J.fR=0.2;   /* knees up, feet flat by her hips */ J.aLx=0.7; J.aRx=0.7; J.aLz=J.aRz=0.25; J.eL=J.eR=0.2; return J; },
  knee(){ const J=NP.kneel(0); J.aLx=-0.4; J.aRx=-0.2; return J; },
  crouch(){ const J=P0(); J.hd=0.42; J.hp=0.55; J.sp=0.35; J.nx=-0.2; J.lLx=-1.0; J.lRx=-0.85; J.kL=1.55; J.kR=1.45; J.fL=0.55; J.fR=0.5; J.aLx=-0.6; J.aRx=-0.4; J.aLz=J.aRz=0.3; J.eL=J.eR=0.8; return J; },
  tuck(){ const J=P0(); J.hd=norah.c.R.hip0-0.16; J.hp=0.1; J.sp=0.5; J.nx=-0.1; J.lLx=-1.5; J.lRx=-1.4; J.kL=2.3; J.kR=2.2; J.fL=0.6; J.fR=0.55; J.aLx=-0.3; J.aRx=0.4; J.aLz=J.aRz=0.35; J.eL=J.eR=0.3; return J; },   /* knees drawn up, feet under her */
  up(t,u){ return u<0.2? mix(NG.lie(t,0),NG.sit(),sm5(u/0.2)) : u<0.35? mix(NG.sit(),NG.tuck(),sm5((u-0.2)/0.15)) : u<0.5? mix(NG.tuck(),NG.knee(),sm5((u-0.35)/0.15)) : u<0.72? mix(NG.knee(),NG.crouch(),sm5((u-0.5)/0.22)) : mix(NG.crouch(),NQ.aim(),sm5((u-0.72)/0.28)); } };
const HIPLEN=()=>norah.c.R.hip0*0.97;   /* her hips are this far from her feet: where the lying pose puts them */

// ---- leg wrap: it scuttles in low, coils its arms round her shins and drags her down, then backs away dragging her flat
// along the floor by the legs. She kicks it off and gets up.
A.wrap={ start(ctx){ ctx.x=NX-4.2*Z(); ctx.yaw=Math.PI/2; ctx.travel=null; ctx.norah=true; ctx.v=0; ctx.T={}; ctx.nX=NX; },
  step(t,dt,ctx){ const T=ctx.T, Q=QCRAWL(), vmax=1.7*Z()*QUICK(); ctx.onLimbs=true;
    if(!T.grab){ const go=ctx.x<NX-0.95*Z(); ctx.v+=((go?vmax:0)-ctx.v)*Math.min(1,dt*8); ctx.x+=ctx.v*dt; ctx.moving=ctx.v>0.05; ctx.phase="scuttles in low"; ctx.nOver={J:NQ.aim(),x:NX};
      if(!go&&ctx.v<0.1){ T.grab=t; } const J=crawlBody(t,ctx.moving?Math.sin(t*12):0); ctx.post=()=>{ Q.v=vmax; gaitStep(ctx,Q,dt*(ctx.v/vmax),ctx.moving); limbsIK(ctx,crawlPoles); }; return J; }
    const k=t-T.grab, J=crawlBody(t,0), shin=s=>norah.c.B["shin_"+s].getWorldPosition(new V3());
    const D0=1.5, D1=3.3, K0=3.5;   /* down by 1.5 s; dragged until 3.3 s; she kicks free at 3.5 s */
    // her: pulled off her feet backward, then lying flat (in the lying pose, hips at her old hip spot), dragged feet first
    if(k<D0){ const n= k<0.6? (()=>{ const q=NP.stand(); q.aRx=-1.2; q.aLx=-0.9; q.sp=0.25*sm5(k/0.6); q.nx=0.4*sm5(k/0.6); return q; })() : NQ.flat(k-0.6);
      ctx.nOver={J:n,x:NX,fall:PHYS.topple(ctx.nT||(ctx.nT={th:0.15,w:1.8}),dt,1.65,1.45)}; ctx.nX=NX+HIPLEN(); }
    else if(!T.free){ const dragging=k<D1; if(dragging) ctx.nX-=dt*0.85*Z(); ctx.nOver={J:NG.lie(t,dragging?1:0.5),x:ctx.nX,down:true};
      if(k>K0&&!ctx.live){ T.free=t; ctx.events.push({kind:"kickFree"}); } }
    else { const u=sat((t-T.free-0.35)/1.9); ctx.nOver={J:u>0?NG.up(t,u):NG.lie(t,1),x:ctx.nX,down:u<0.72,up:u>0}; }   /* getting up: carried by whatever touches the floor, not held down as if lying */
    // it: hands on her shins; it backs away on its feet, hauling her along
    const backing=k>=D0&&k<D1&&!(ctx.live&&T.free), kicked=T.free?t-T.free:-1; ctx.travel= backing? new V3(-1,0,0) : null;
    if(backing) ctx.x-=dt*0.85*Z();
    if(kicked>=0){ ctx.kick={id:"kickfree"+T.free,v:{x:-2.4*Z(),y:1.0,z:0.4}}; }
    ctx.phase= k<0.7?"coils its arms round her shins": k<D0?"drags her down": k<D1?"drags her flat along the floor": !T.free?"holds her by the legs": kicked<0.5?"she kicks it off":"she gets up";
    ctx.post=()=>{ const G=gaitStep(ctx,Q,backing?dt*0.85/1.0:0,backing);
      if(kicked<0||kicked<0.15){ for(const s of ["L","R"]){ const st=G.limb["arm"+s], p=shin(s==="L"?"R":"L"); st.anchor=null; st.swing=null; st.tgt=(st.tgt||p).clone().lerp(p,sm5(k/0.35)); } }
      limbsIK(ctx,crawlPoles); };
    if(k>0.4&&!T.pull){ T.pull=1; ctx.events.push({kind:"wrap"}); }
    return J; } };

// ---- neck-twist run: its back is to her. The head ticks round, crack by crack, until it faces her over its spine; then
// it comes at her backward in a stiff, quickening shuffle, the head locked on her while the body twists the other way
// at every step, and lunges back into her, biting.
A.bite={ start(ctx){ ctx.x=NX-4.6*Z(); ctx.yaw=-Math.PI/2; ctx.norah=true; ctx.v=0; ctx.T={}; ctx.ph=0; },
  step(t,dt,ctx){ const T=ctx.T, J=manStand(t), toN=()=>Math.atan2(NX-ctx.x,0)-ctx.yaw;
    ctx.nOver={J:NQ.aim(),x:NX};
    if(t<0.5){ ctx.phase="its back to her"; return J; }
    const k=t-0.5;
    if(k<1.6){ const n=Math.min(6,Math.floor(k/0.26)), f=(n+sm5(((k%0.26))/0.09))/6;   /* six ticks: the head turns all the way back */
      if(n!==T.cr){ T.cr=n; ctx.events.push({kind:"pop"}); } J.ny=Math.PI*Math.min(1,f); J.nx=-0.08; J.hdy=0.02*Math.sin(t*60)*(1-f);
      ctx.phase="the head ticks round, crack by crack, until it faces her"; return J; }
    // the shuffle: backward toward her, quickening; each step the body twists to the other side, the head held on her
    const s=k-1.6, gap=NX-ctx.x;
    if(!T.lunge){ const v=Math.min(2.4,0.8+s*0.9)*Z(), rate=v/(0.34*Z()); const prev=ctx.ph; ctx.ph=(ctx.ph+dt*rate*0.5)%1; const step=Math.floor(ctx.ph*2);
      if(step!==T.st){ T.st=step; ctx.events.push({kind:"stomp",side:step?"R":"L",strength:0.5}); }
      ctx.x+=v*dt; ctx.moving=true; const sw=step?1:-1, snap=sm5(((ctx.ph*2)%1)/0.25); T.tw=(T.tw||0)+((sw*0.75)-(T.tw||0))*snap*0.5;
      ctx.yaw=-Math.PI/2+T.tw; ctx.levelHead={pitch:0.05,yaw:Math.atan2(NX-ctx.x,0.0001)-ctx.yaw,roll:0};
      const a=Math.sin(ctx.ph*Math.PI*2); J.lLx=0.28*a; J.lRx=-0.28*a; J.kL=0.06+0.12*Math.max(0,-a); J.kR=0.06+0.12*Math.max(0,a); J.fL=J.fR=0; J.sp=-0.05; J.aLx=J.aRx=0.05; J.aLz=J.aRz=0.1; J.eL=J.eR=0.1;   /* stiff: barely bends a knee */
      J.hd=0.02*Math.abs(a); J.syaw=-T.tw*0.4; ctx.phase= s<1.2?"shuffles at her backward, stiff, the body switching sides each step":"breaks into a stiff backward run";
      if(gap<0.95*Z()){ T.lunge=t; } return J; }
    const l=t-T.lunge, lg=sm5(l/0.18)*(1-sm5((l-0.7)/0.6)); ctx.levelHead={pitch:0.05-0.35*lg,yaw:Math.atan2(NX-ctx.x,0.0001)-ctx.yaw,roll:0};
    J.sp=-0.4*lg; J.hp=-0.15*lg; J.kL=J.kR=0.1+0.25*lg; ctx.local={x:0,z:-0.3*lg*Z()}; ctx.phase= l<0.7?"lunges back into her, biting":"holds on her, still facing away";
    if(lg>0.95&&!T.bit){ T.bit=t; ctx.events.push({kind:"bite"}); }
    if(T.bit){ const h=t-T.bit; const n=NP.stumble(); n.aLx=-1.4; n.aLz=0.3; n.eL=1.6; ctx.nOver={J:h<0.6?n:NQ.aim(),x:NX+0.35*sm5(h/0.3)}; }
    return J; } };

A.strike.phys=TPHYS;
const LEN={drop:11.8, strike:6.2, wrap:8.6, bite:6.6, climb:9.6, crawl:8, bend:6.5, fold:8};
const NAMES={drop:"Drop from above",strike:"Wrong-angle strike",wrap:"Leg wrap",bite:"Neck-twist run",climb:"Wall climb",crawl:"Spider crawl",bend:"Backbend spider walk",fold:"Upright, then folds"};
const DMG={dropHit:["NORAH −15","dropped on from above · pinned"],thrownOff:["THROWN OFF","she throws it off"],bite:["NORAH −12","bitten"],strike:["NORAH −20","struck from the wrong side"],wrap:["DOWN","legs wrapped · dragged down"],kickFree:["KICKED FREE","she kicks it off her legs"]};


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

// ================================================================ the Contortionist, live (playground)
// Locomotion that goes anywhere: the preview's bodies and gait, with its heading (ctx.wantYaw, stage yaw) and pace
// (ctx.wantV, 0..1) handed in by the AI. The attacks are the preview's own clips (A.strike, A.wrap, A.bite).
const LIVE={};
function turnTo(ctx,dt,rate){ const w=ctx.wantYaw??ctx.yaw; let d=w-ctx.hd0; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; ctx.hd0+=clamp(d,-rate*dt,rate*dt); return ctx.hd0; }
// spider crawl: bursts and freezes, as in the preview; it goes where it's sent
LIVE.crawl={ start(ctx){ ctx.hd0=ctx.yaw; ctx.burst={on:true,t:0.6}; },
  step(t,dt,ctx){ if(ctx.hd0==null){ ctx.hd0=ctx.yaw; ctx.burst={on:true,t:0.6}; } const B=ctx.burst; B.t-=dt; if(B.t<=0){ B.on=!B.on; B.t=B.on?0.7+Math.random()*0.6:0.35+Math.random()*0.6; }
    const Q=QCRAWL(), vmax=1.6*Z()*QUICK(), want=(ctx.wantV??0)>0.05, go=want&&(B.on||ctx.wantV>1);
    ctx.yaw=turnTo(ctx,dt,2.4); ctx.v+=((go?vmax*Math.min(1,ctx.wantV):0)-ctx.v)*Math.min(1,dt*(go?9:14)); const mv=ctx.v>0.05;
    ctx.x+=Math.sin(ctx.yaw)*ctx.v*dt; ctx.z=(ctx.z||0)+Math.cos(ctx.yaw)*ctx.v*dt; ctx.moving=mv;
    ctx.phase= mv?"scuttles":"freezes · watching"; const J=crawlBody(t,mv?Math.sin(t*12):0); if(!mv){ J.ny=0.35*Math.sin(t*0.9); J.nx+=0.1*Math.sin(t*1.7); }
    ctx.onLimbs=true; ctx.post=()=>{ Q.v=vmax; gaitStep(ctx,Q,dt*(ctx.v/vmax),mv||Math.abs((ctx.wantYaw??ctx.yaw)-ctx.yaw)>0.3); limbsIK(ctx,crawlPoles); }; return J; } };
// backbend spider walk: bent over backward, belly up, head first; the body faces back along its travel
LIVE.bend={ start(ctx){ ctx.hd0=ctx.yaw+Math.PI; },
  step(t,dt,ctx){ if(ctx.hd0==null) ctx.hd0=ctx.yaw+Math.PI; const Q=QBEND(), vmax=2.1*Z()*QUICK(), go=(ctx.wantV??0)>0.05; const tr=turnTo(ctx,dt,2.0);
    ctx.yaw=tr+Math.PI; ctx.travel=new V3(Math.sin(tr),0,Math.cos(tr)); ctx.v+=((go?vmax*Math.min(1,ctx.wantV):0)-ctx.v)*Math.min(1,dt*6);
    ctx.x+=ctx.travel.x*ctx.v*dt; ctx.z=(ctx.z||0)+ctx.travel.z*ctx.v*dt; ctx.moving=ctx.v>0.05;
    ctx.phase= ctx.moving?"skitters, head first, belly up":"bent over backward, head twisted round"; const J=bendBody(t,ctx.moving?Math.sin(t*14):0);
    ctx.onLimbs=true; ctx.post=()=>{ Q.v=vmax; gaitStep(ctx,Q,dt*(ctx.v/vmax||0),ctx.moving); limbsIK(ctx,bendPoles); }; return J; } };
// walks like a man (the disguise), then can fold
LIVE.walk={ start(ctx){ ctx.hd0=ctx.yaw; ctx.ph=ctx.ph||0; },
  step(t,dt,ctx){ if(ctx.hd0==null) ctx.hd0=ctx.yaw; const go=(ctx.wantV??0)>0.05; ctx.yaw=turnTo(ctx,dt,2.2);
    if(go){ const prev=ctx.ph||0; ctx.ph=(prev+dt/1.2)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.4}); ctx.moving=true; ctx.gait={ph:ctx.ph,P:TWALK}; }
    ctx.phase= go?"walks like a man":"stands like a man"; const J=go?tLegs(stance(t),ctx.ph):stance(t); J.aLx=0.25*Math.sin((ctx.ph||0)*Math.PI*2); J.aRx=-J.aLx; J.aLz=J.aRz=0.12; J.eL=J.eR=0.3; J.nx=0.05; J.sp=0.05; return J; } };
LIVE.walk.phys={ active:ctx=>(ctx.phase||"").startsWith("walks"), stance:ctx=>strideStance(ctx.ph,TWALK), traction:8, imp:0.6, rollK:0 };
// the fold: from standing, it snaps down into the crawl, joints popping the wrong way
LIVE.fold={ start(ctx){ ctx.fT=null; ctx.pops=0; },
  step(t,dt,ctx){ if(ctx.fT==null){ ctx.fT=t; ctx.pops=0; } const u=(t-ctx.fT)/0.75, Q=QCRAWL(); ctx.phase="snaps down · its joints pop the wrong way";
    const w=sm5(u); const J=mix(stance(t),crawlBody(t,0),w); for(const th of [0.15,0.35,0.55,0.75]) if(u>=th&&ctx.pops<th*4+0.5){ ctx.pops++; ctx.events.push({kind:"pop"}); }
    ctx.onLimbs=true; ctx.post=()=>{ gaitStep(ctx,Q,0,false); for(const L of LIMBS){ const st=ctx.G.limb[L.k]; st.anchor=null; st.tgt=null; }
      for(const L of LIMBS){ const root=limbRoot(L), down=floorSurf.hold(root,L,Q); const hang=root.clone().add(new V3(0,-limbLen(L)*0.95,0)); ctx.G.limb[L.k].tgt=hang.lerp(down,sm5((u-(L.arm?0.1:0.3))/0.6)); }
      limbsIK(ctx,(L,root)=>{ const a=popPoles(L,root), b=crawlPoles(L,root); return a.lerp(b,sm5((u-0.6)/0.4)); }); };
    if(u>=1) ctx.folded=true; return J; } };
// down: it goes limp onto its front, limbs splayed, and the floor takes it
LIVE.die={ start(ctx){ ctx.dT=null; },
  step(t,dt,ctx){ if(ctx.dT==null) ctx.dT=t; const u=sm5((t-ctx.dT)/0.6), J=P0(); J.hd=runner.hip0-0.14; J.hp=1.45; J.sp=0.05; J.nx=-0.15+0.3*u; J.ny=0.5*u;
    J.aLx=-2.3; J.aRx=-2.0; J.aLz=0.65; J.aRz=0.5; J.eL=0.7; J.eR=0.5; J.lLx=-0.2; J.lRx=0.15; J.kL=0.5; J.kR=0.3; J.lLz=0.25; J.lRz=0.2;
    const from=ctx.dJ||(ctx.dJ=crawlBody(t,0)); ctx.phase="dead"; return mix(from,J,u); } };

return { A, LIVE, makeChar, pvPrep:(typeof pvPrep==="function"?pvPrep:null), pvPost:(typeof pvPost==="function"?pvPost:null), pvSetup, pvBind, pvStep, pvFx, PHYS, P0, mix, PVHOOK, get NX(){ return NX; } };
})();
