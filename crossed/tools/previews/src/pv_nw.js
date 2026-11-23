// ================================================================ PV_NW: norah-weapons-preview.html wrapped for the playground (made by mkpv.py)
const PV_NW=(function(){
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
// ================================================================ NORAH (the player)
// Scared but steadying: never trained, she shakes, flinches at her own shots and hunches, but once the gun is up and held
// the tremor settles. The flashlight rides under the revolver (wrists crossed, the light hand bracing the gun hand) so the
// beam follows her aim. The revolver and flashlight are built from the game's own item data. The flashlight is a real
// light. An ACROSS stands in as the target and the attacker.
const sm5=x=>{ x=sat(x); return x*x*x*(x*(x*6-15)+10); };
const V3=THREE.Vector3, UP=new V3(0,1,0), QI=()=>new THREE.Quaternion(); SLOUCH.s=0; SLOUCH.h=0;
const TP=()=>({fwd:new V3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw)), right:new V3(-Math.cos(ctx.yaw),0,Math.sin(ctx.yaw))});
const KIND=()=>"pl", fin=J=>applyLean(J);
let altK={}; const outcome=(id,a,b)=>{ const v=((ctx.outSel&&ctx.outSel[id])||"alt"); if(v==="alt"){ altK[id]=!altK[id]; return altK[id]?a:b; } return v; };
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
const ITEMS={"revolver": [{"name": "Grip", "s": "box", "p": [0.062, -0.038, 0], "d": [0.027999999999999997, 0.07, 0.03], "r": [0, 0, -16], "c": "#4a2e1c", "seg": 10}, {"name": "Frame", "s": "box", "p": [0.013999999999999999, 0.004, 0], "d": [0.064, 0.034, 0.019], "r": [0, 0, 0], "c": "#2a2e36", "seg": 10}, {"name": "Cylinder", "s": "cyl", "p": [-0.006, 0.009000000000000001, 0], "d": [0.036000000000000004, 0.038, 0.036000000000000004], "r": [0, 0, 90], "c": "#2e323a", "seg": 6}, {"name": "Barrel", "s": "cyl", "p": [-0.076, 0.017, 0], "d": [0.013999999999999999, 0.092, 0.013999999999999999], "r": [0, 0, 90], "c": "#2a2e36", "seg": 10}, {"name": "Under-lug", "s": "box", "p": [-0.057999999999999996, 0.01, 0], "d": [0.064, 0.006999999999999999, 0.009000000000000001], "r": [0, 0, 0], "c": "#2a2e36", "seg": 10}, {"name": "Front sight", "s": "box", "p": [-0.11800000000000001, 0.026000000000000002, 0], "d": [0.005, 0.006999999999999999, 0.0025], "r": [0, 0, 0], "c": "#2a2e36", "seg": 10}, {"name": "Hammer", "s": "box", "p": [0.046, 0.026000000000000002, 0], "d": [0.009000000000000001, 0.016, 0.0055000000000000005], "r": [0, 0, 24], "c": "#3a3e46", "seg": 10}, {"name": "Trigger guard", "s": "torus", "p": [0.018000000000000002, -0.017, 0], "d": [0.027999999999999997, 0.027999999999999997, 0.027999999999999997], "r": [0, 0, 0], "c": "#2a2e36", "seg": 12}, {"name": "Trigger", "s": "box", "p": [0.016, -0.015, 0], "d": [0.0034999999999999996, 0.016, 0.0034999999999999996], "r": [0, 0, -12], "c": "#3a3e46", "seg": 10}], "flashlight": [{"name": "Body", "s": "cyl", "p": [0, 0, 0], "d": [0.034, 0.16, 0.034], "r": [0, 0, 90], "c": "#2a2c30", "seg": 12}, {"name": "Neck", "s": "cone", "p": [-0.086, 0, 0], "d": [0.046, 0.018000000000000002, 0.046], "r": [0, 0, -90], "c": "#2a2c30", "seg": 12}, {"name": "Head", "s": "cyl", "p": [-0.106, 0, 0], "d": [0.046, 0.026000000000000002, 0.046], "r": [0, 0, 90], "c": "#33363b", "seg": 12}, {"name": "Lens", "s": "cyl", "p": [-0.12, 0, 0], "d": [0.039, 0.003, 0.039], "r": [0, 0, 90], "c": "#fff0b8", "seg": 12}, {"name": "Bezel ring", "s": "torus", "p": [-0.11900000000000001, 0, 0], "d": [0.046, 0.046, 0.046], "r": [0, 90, 0], "c": "#9a9ea4", "seg": 14}, {"name": "Tail cap", "s": "cyl", "p": [0.085, 0, 0], "d": [0.037000000000000005, 0.012, 0.037000000000000005], "r": [0, 0, 90], "c": "#18181a", "seg": 12}, {"name": "Switch", "s": "box", "p": [-0.05, 0.018500000000000003, 0], "d": [0.016, 0.005, 0.01], "r": [0, 0, 0], "c": "#18181a", "seg": 10}, {"name": "Lanyard loop", "s": "torus", "p": [0.094, 0, 0], "d": [0.013999999999999999, 0.013999999999999999, 0.013999999999999999], "r": [0, 0, 0], "c": "#5a5e64", "seg": 8}]};
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
function standTarget(ctx,t){ if(ctx.S){ ctx.atk=ctx.atk||{x:9,z:0,yaw:-Math.PI/2,J:P0(),live:1}; return; } ctx.camX=1.75; ctx.camD=6.4; ctx.atk={x:3.9,z:0,yaw:-Math.PI/2,J:aStand(t)}; }
const tgtChest=()=>(ctx&&ctx.S&&ctx.S.aimAt)?ctx.S.aimAt.clone():by.c.B.chest.getWorldPosition(new V3()).add(new V3(0,0.05,0));
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

// ================================================================ WEAPONS SHE FINDS
// Each is built like the game's items: parts (shape, centre, size, rotation, colour), barrels and blades along −x. Firearms
// have their working parts rigged: the shotgun's pump, the rifle's bolt, the pistol's slide and magazine, the flare gun's
// barrel. The flashlight: taped under the barrel of the long guns, braced under the gun hand with the pistol and flare
// gun, in her other hand with the hand weapons and the road flare.
const WX={
 shotgun:{name:"Pump Shotgun",parts:[
  {name:"Barrel",s:"cyl",p:[-0.4,0.03,0],d:[0.022,0.62,0.022],r:[0,0,90],c:"#2a2c30"},{name:"Mag tube",s:"cyl",p:[-0.27,0.006,0],d:[0.024,0.44,0.024],r:[0,0,90],c:"#2a2c30"},
  {name:"Receiver",s:"box",p:[0.0,0.018,0],d:[0.2,0.058,0.03],r:[0,0,0],c:"#2b2d31"},{name:"Bead",s:"box",p:[-0.705,0.044,0],d:[0.005,0.006,0.005],r:[0,0,0],c:"#d8d0b0"},
  {name:"Forend",s:"box",p:[-0.2,0.008,0],d:[0.2,0.042,0.04],r:[0,0,0],c:"#5a3a22",seg:10},
  {name:"Trigger guard",s:"torus",p:[0.06,-0.022,0],d:[0.03,0.03,0.03],r:[0,0,0],c:"#2a2c30"},{name:"Trigger",s:"box",p:[0.058,-0.018,0],d:[0.0035,0.016,0.0035],r:[0,0,-12],c:"#3a3e46"},
  {name:"Wrist",s:"box",p:[0.15,-0.02,0],d:[0.12,0.046,0.032],r:[0,0,-14],c:"#5a3a22"},{name:"Stock",s:"box",p:[0.34,-0.048,0],d:[0.3,0.078,0.036],r:[0,0,-6],c:"#5a3a22"},
  {name:"Butt pad",s:"box",p:[0.494,-0.064,0],d:[0.014,0.12,0.04],r:[0,0,-6],c:"#141414"},{name:"Port",s:"box",p:[0.005,0.03,-0.0156],d:[0.055,0.018,0.002],r:[0,0,0],c:"#0a0a0a"},
  {name:"Loading port",s:"box",p:[0.03,-0.0115,0],d:[0.06,0.002,0.02],r:[0,0,0],c:"#0a0a0a"}],
  pts:{grip:[0.12,-0.03,0],fore:[-0.2,-0.004,0],butt:[0.5,-0.06,0],eye:[0.3,0.075,0],muzzle:[-0.715,0.03,0],port:[0.005,0.03,-0.017],load:[0.03,-0.014,0],tape:[-0.42,-0.025,0]}},
 rifle:{name:"Hunting Rifle",parts:[
  {name:"Barrel",s:"cyl",p:[-0.4,0.025,0],d:[0.018,0.6,0.018],r:[0,0,90],c:"#25272b"},{name:"Receiver",s:"cyl",p:[0.03,0.024,0],d:[0.03,0.2,0.03],r:[0,0,90],c:"#25272b"},
  {name:"Scope",s:"cyl",p:[0.05,0.078,0],d:[0.026,0.3,0.026],r:[0,0,90],c:"#141517"},{name:"Objective",s:"cyl",p:[-0.12,0.078,0],d:[0.044,0.06,0.044],r:[0,0,90],c:"#141517"},
  {name:"Eyepiece",s:"cyl",p:[0.19,0.078,0],d:[0.038,0.05,0.038],r:[0,0,90],c:"#141517"},{name:"Mount front",s:"box",p:[-0.02,0.052,0],d:[0.014,0.024,0.02],r:[0,0,0],c:"#141517"},
  {name:"Mount rear",s:"box",p:[0.1,0.052,0],d:[0.014,0.024,0.02],r:[0,0,0],c:"#141517"},{name:"Forestock",s:"box",p:[-0.16,0.0,0],d:[0.4,0.042,0.042],r:[0,0,0],c:"#6a4426"},
  {name:"Wrist",s:"box",p:[0.16,-0.016,0],d:[0.12,0.046,0.034],r:[0,0,-12],c:"#6a4426"},{name:"Stock",s:"box",p:[0.34,-0.044,0],d:[0.28,0.086,0.038],r:[0,0,-5],c:"#6a4426"},
  {name:"Butt pad",s:"box",p:[0.484,-0.058,0],d:[0.014,0.12,0.042],r:[0,0,-5],c:"#141414"},{name:"Trigger guard",s:"torus",p:[0.07,-0.022,0],d:[0.03,0.03,0.03],r:[0,0,0],c:"#25272b"},
  {name:"Trigger",s:"box",p:[0.068,-0.018,0],d:[0.0035,0.016,0.0035],r:[0,0,-12],c:"#3a3e46"},{name:"Floorplate",s:"box",p:[0.02,-0.024,0],d:[0.07,0.006,0.03],r:[0,0,0],c:"#25272b"},
  {name:"Lens",s:"cyl",p:[-0.151,0.078,0],d:[0.036,0.002,0.036],r:[0,0,90],c:"#3a4a5a"}],
  pts:{grip:[0.13,-0.03,0],fore:[-0.18,-0.006,0],butt:[0.49,-0.058,0],eye:[0.285,0.078,0],muzzle:[-0.7,0.025,0],port:[0.04,0.04,0],tape:[-0.3,-0.04,0],bolt:[0.085,0.024,0]}},
 pistol:{name:"9mm Pistol",parts:[
  {name:"Frame",s:"box",p:[-0.04,0.0,0],d:[0.15,0.016,0.022],r:[0,0,0],c:"#1e1f22"},{name:"Grip",s:"box",p:[0.042,-0.048,0],d:[0.036,0.09,0.03],r:[0,0,-12],c:"#1a1a1c"},
  {name:"Trigger guard",s:"torus",p:[-0.005,-0.017,0],d:[0.03,0.028,0.028],r:[0,0,0],c:"#1e1f22"},{name:"Trigger",s:"box",p:[-0.007,-0.014,0],d:[0.0035,0.015,0.0035],r:[0,0,-14],c:"#3a3e46"}],
  pts:{grip:[0.046,-0.035,0],muzzle:[-0.122,0.022,0],port:[-0.01,0.032,-0.013]}},
 hatchet:{name:"Hatchet",melee:true,parts:[
  {name:"Handle",s:"cyl",p:[0,-0.17,0],d:[0.028,0.36,0.024],r:[0,0,0],c:"#7a5634"},{name:"Head",s:"box",p:[-0.028,0.0,0],d:[0.1,0.05,0.016],r:[0,0,0],c:"#55595f"},
  {name:"Bit",s:"box",p:[-0.084,0.0,0],d:[0.016,0.078,0.007],r:[0,0,0],c:"#b8bcc4"},{name:"Poll",s:"box",p:[0.03,0.0,0],d:[0.026,0.036,0.022],r:[0,0,0],c:"#45484d"}],
  pts:{grip:[0,-0.29,0],tip:[-0.09,0,0]}},
 crowbar:{name:"Crowbar",melee:true,parts:[
  {name:"Bar",s:"cyl",p:[0,-0.3,0],d:[0.018,0.62,0.018],r:[0,0,0],c:"#8a1e18"},{name:"Bend",s:"cyl",p:[-0.018,0.03,0],d:[0.018,0.07,0.018],r:[0,0,40],c:"#8a1e18"},
  {name:"Claw",s:"box",p:[-0.05,0.04,0],d:[0.03,0.018,0.012],r:[0,0,-20],c:"#5a5e64"},{name:"Chisel",s:"box",p:[-0.008,-0.615,0],d:[0.022,0.026,0.006],r:[0,0,20],c:"#5a5e64"}],
  pts:{grip:[0,-0.48,0],tip:[-0.05,0.04,0]}},
 knife:{name:"Kitchen Knife",melee:true,parts:[
  {name:"Handle",s:"box",p:[0,-0.055,0],d:[0.02,0.11,0.017],r:[0,0,0],c:"#18181a"},{name:"Bolster",s:"box",p:[0,0.002,0],d:[0.026,0.006,0.016],r:[0,0,0],c:"#8a8e94"},
  {name:"Blade",s:"box",p:[0.002,0.085,0],d:[0.03,0.16,0.0025],r:[0,0,0],c:"#c4c8ce"},{name:"Point",s:"box",p:[-0.004,0.17,0],d:[0.016,0.022,0.0025],r:[0,0,-28],c:"#c4c8ce"}],
  pts:{grip:[0,-0.055,0],tip:[0,0.18,0]}},
 flare:{name:"Road Flare",melee:true,parts:[
  {name:"Tube",s:"cyl",p:[0,0,0],d:[0.03,0.24,0.03],r:[0,0,0],c:"#b8201c"},{name:"Band",s:"cyl",p:[0,-0.06,0],d:[0.031,0.03,0.031],r:[0,0,0],c:"#e8d8a0"},
  {name:"Cap",s:"cyl",p:[0,0.133,0],d:[0.034,0.026,0.034],r:[0,0,0],c:"#d8d0c0"},{name:"Wick",s:"cyl",p:[0,0.122,0],d:[0.02,0.006,0.02],r:[0,0,0],c:"#2a1a14"}],
  pts:{grip:[0,-0.06,0],tip:[0,0.125,0]}},
 flaregun:{name:"Flare Gun",parts:[
  {name:"Frame",s:"box",p:[0.018,0.012,0],d:[0.06,0.032,0.026],r:[0,0,0],c:"#d0601c"},{name:"Grip",s:"box",p:[0.04,-0.045,0],d:[0.032,0.085,0.03],r:[0,0,-15],c:"#c45818"},
  {name:"Hammer",s:"box",p:[0.046,0.032,0],d:[0.01,0.016,0.008],r:[0,0,20],c:"#2a2a2a"},{name:"Trigger guard",s:"torus",p:[0.008,-0.012,0],d:[0.028,0.026,0.026],r:[0,0,0],c:"#d0601c"},
  {name:"Trigger",s:"box",p:[0.006,-0.01,0],d:[0.0035,0.014,0.0035],r:[0,0,-12],c:"#2a2a2a"}],
  pts:{grip:[0.046,-0.033,0],muzzle:[-0.13,0.02,0],hinge:[-0.008,0.003,0]}}
};
for(const k in WX) ITEMS["w_"+k]=WX[k].parts;
const W={}; let TL=null, TSP=null;   /* the taped-on flashlight for the long guns */
const v3=a=>new V3(a[0],a[1],a[2]);
const mat=c=>new THREE.MeshLambertMaterial({color:c});
function cylX(r,l,c,at){ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,10),mat(c)); m.rotation.z=Math.PI/2; m.position.copy(at); return m; }
function buildWeapons(){ if(W.shotgun) return;
  for(const k in WX){ const g=buildItem("w_"+k), o={obj:g,pts:{},key:k}; for(const p in WX[k].pts) o.pts[p]=v3(WX[k].pts[p]); g.visible=false; scene.add(g); W[k]=o; }
  const piv=(o,part,at)=>{ const q=new THREE.Group(); q.position.copy(at); o.obj.add(q); const m=o.obj.userData.parts[part]; m.position.sub(at); q.add(m); return q; };
  // shotgun: the pump; a shell in the chamber (seen through the port), shells to load
  { const o=W.shotgun; o.pump=piv(o,"Forend",new V3(0,0,0)); o.trig=piv(o,"Trigger",new V3(0.058,-0.01,0)); }
  // rifle: the bolt (body, handle and knob), turning up and sliding back
  { const o=W.rifle; o.trig=piv(o,"Trigger",new V3(0.068,-0.01,0)); const b=new THREE.Group(); b.position.copy(o.pts.bolt); o.obj.add(b);
    const h=new THREE.Group(); b.add(h); const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.042,8),mat(0x3a3e46)); stem.position.set(0,0,-0.024); stem.rotation.x=Math.PI/2; h.add(stem);
    const knob=new THREE.Mesh(new THREE.SphereGeometry(0.009,8,6),mat(0x2a2c30)); knob.position.set(0,-0.006,-0.046); h.add(knob); const body=cylX(0.0085,0.07,0x8a8e94,new V3(0.01,0,0)); b.add(body);
    o.bolt=b; o.handle=h; o.knob=knob; }
  // pistol: the slide (with sights and the ejection port) and the magazine
  { const o=W.pistol; o.trig=piv(o,"Trigger",new V3(-0.007,-0.006,0)); const s=new THREE.Group(); o.obj.add(s);
    const add=(geo,c,p)=>{ const m=new THREE.Mesh(geo,mat(c)); m.position.set(...p); s.add(m); return m; };
    add(new THREE.BoxGeometry(0.18,0.03,0.024),0x26282c,[-0.03,0.023,0]); add(new THREE.BoxGeometry(0.004,0.006,0.004),0x101010,[-0.115,0.041,0]); add(new THREE.BoxGeometry(0.006,0.006,0.012),0x101010,[0.05,0.041,0]);
    add(new THREE.BoxGeometry(0.035,0.012,0.002),0x050505,[-0.01,0.03,-0.0125]); const bore=add(new THREE.CylinderGeometry(0.0045,0.0045,0.002,8),0x050505,[-0.121,0.022,0]); bore.rotation.z=Math.PI/2; o.slide=s;
    const mg=new THREE.Group(); mg.position.set(0.045,-0.005,0); mg.rotation.z=-12*Math.PI/180; o.obj.add(mg); const mb=new THREE.Mesh(new THREE.BoxGeometry(0.022,0.1,0.02),mat(0x3a3c40)); mb.position.set(0,-0.05,0); mg.add(mb);
    const bp=new THREE.Mesh(new THREE.BoxGeometry(0.026,0.008,0.024),mat(0x2a2a2c)); bp.position.set(0,-0.1,0); mg.add(bp); o.mag=mg; }
  // flare gun: the barrel on its hinge (breaks open, muzzle down), a flare shell in it
  { const o=W.flaregun; const b=new THREE.Group(); b.position.copy(o.pts.hinge); o.obj.add(b);
    const bar=cylX(0.017,0.13,0xd0601c,new V3(-0.063,0.017,0)); b.add(bar); const bore=new THREE.Mesh(new THREE.CylinderGeometry(0.0115,0.0115,0.002,10),mat(0x0a0a0a)); bore.rotation.z=Math.PI/2; bore.position.set(-0.129,0.017,0); b.add(bore);
    const sh=new THREE.Group(); sh.position.set(0.0,0.017,0); b.add(sh); const hull=cylX(0.0112,0.06,0xb82a20,new V3(-0.028,0,0)); const head=cylX(0.0125,0.006,0xb08a3a,new V3(0.003,0,0)); sh.add(hull,head);
    o.barrel=b; o.shell=sh; o.hammer=o.obj.userData.parts.Hammer; o.trig=piv(o,"Trigger",new V3(0.006,-0.003,0)); }
  // the flare's fire: a light and the glow at its end
  { const o=W.flare; o.light=new THREE.PointLight(0xff3a1a,0,9,1.6); o.light.position.copy(o.pts.tip); o.obj.add(o.light); o.glow=new THREE.Mesh(new THREE.SphereGeometry(0.02,8,6),new THREE.MeshBasicMaterial({color:0xffd0a0})); o.glow.position.copy(o.pts.tip); o.glow.visible=false; o.obj.add(o.glow); }
  // the taped flashlight: its own lamp, and two wraps of grey tape
  TL=buildItem("flashlight"); TSP=new THREE.SpotLight(0xfff0c8,4.0,16,0.3,0.45,1.0); TSP.position.set(-0.122,0,0); const tg=new THREE.Object3D(); tg.position.set(-1.2,0,0); TL.add(TSP,tg); TSP.target=tg;
  TL.userData.parts.Lens.material=new THREE.MeshBasicMaterial({color:0xfff6d8});
  for(const x of [-0.03,0.05]){ const b=new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.024,0.022,10),mat(0x8a8a86)); b.rotation.z=Math.PI/2; b.position.set(x,0.008,0); TL.add(b); }
  TL.visible=false; scene.add(TL); }
const LONG=k=>k==="shotgun"||k==="rifle";
function showWeapon(k){ buildWeapons(); for(const q in W) W[q].obj.visible=(q===k); if(GUN) GUN.visible=false;
  TL.visible=false; }   /* no light with the long guns: two hands on the gun, no hand for a light (the drawback of carrying one) */
const wpt=(k,p)=>{ const o=W[k]; o.obj.updateMatrixWorld(true); return o.obj.localToWorld(o.pts[p].clone()); };
// a placement (position + rotation) that puts local point 'loc' at 'at' with −x along f, +y toward u
function placement(loc,at,f,u){ const X=f.clone().normalize().negate(), Y=u.clone().addScaledVector(X,-u.dot(X)).normalize(), Zv=new V3().crossVectors(X,Y), q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X,Y,Zv));
  return {q, p:at.clone().sub(loc.clone().applyQuaternion(q))}; }
function applyPl(o,a,b,w){ const q=w<=0?a.q:w>=1?b.q:a.q.clone().slerp(b.q,w), p=w<=0?a.p:w>=1?b.p:a.p.clone().lerp(b.p,w); o.position.copy(p); o.quaternion.copy(q); o.updateMatrixWorld(true); }

// ---------------------------------------------------------------- the long guns: shouldered
// aim 0 = low ready (butt in her shoulder, muzzle dipped), 1 = her eye down the barrel. Then her hands go to the grip and
// the forend. kick/back: the recoil. hands: overrides for either hand (a world point), or null to leave it on the gun.
function longPost(ctx,k,o){ const P=TP(), Wk=W[k]; runner.group.updateMatrixWorld(true);
  const E=eyeAt(), T=o.at||E.clone().addScaledVector(P.fwd,5), f=T.clone().sub(E).normalize(), side=new V3().crossVectors(f,UP).normalize(), up=new V3().crossVectors(side,f).normalize();
  const amp=o.amp||0, sw=side.clone().multiplyScalar(amp*noise(t*3.1,1)).addScaledVector(up,amp*0.8*noise(t*2.7,5));
  const kick=o.kick||0, fa=f.clone().applyAxisAngle(side,kick), ua=up.clone().applyAxisAngle(side,kick);
  // aimed: the butt in her shoulder pocket, the gun pointed from there; her head comes down onto the stock (nShoulder)
  const sh=runner.R.armR.getWorldPosition(new V3()), pocketA=sh.clone().addScaledVector(side,-0.035).addScaledVector(f,0.05).addScaledVector(up,-0.035).addScaledVector(fa,-(o.back||0)).add(sw);
  const fe=T.clone().sub(pocketA.clone().addScaledVector(up,0.12)).normalize(), fA=fe.clone().applyAxisAngle(side,kick), uA=new V3().crossVectors(new V3().crossVectors(fe,UP).normalize(),fe).normalize().applyAxisAngle(side,kick);
  const aimP=placement(Wk.pts.butt,pocketA,fA,uA);
  const dip=o.dip??0.6, fl=f.clone().applyAxisAngle(side,-dip), ul=up.clone().applyAxisAngle(side,-dip).applyAxisAngle(fl,o.cant||0);
  const pocket=runner.R.armR.getWorldPosition(new V3()).addScaledVector(P.right,-0.06).addScaledVector(P.fwd,0.06).add(new V3(0,-0.05,0));
  const lowP=placement(Wk.pts.butt,pocket,fl,ul);
  applyPl(Wk.obj,lowP,aimP,sat(o.aim??1));
  const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
  const gR=o.handR||wpt(k,"grip"), gL=o.handL||(Wk.pump? Wk.pump.localToWorld(Wk.pts.fore.clone()) : wpt(k,"fore"));
  armIK(runner,{side:"R",target:gR,pole:S.clone().add(new V3(0,-0.25,0)).addScaledVector(P.right,0.5),w:o.wR??1,tip:0.07});
  armIK(runner,{side:"L",target:gL,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.12),w:o.wL??1,tip:0.07}); }
// the shouldering stance: bladed a little, her cheek down onto the stock
function nShoulder(t,f,aim){ const J=nStand(t,f); J.lLx=-0.32; J.lRx=0.24; J.kL=0.28; J.kR=0.22; J.lRz=0.16; J.syaw=-0.42*aim; J.hyaw=-0.22*aim; J.sp=0.2+0.06*aim; J.nx=0.18+0.22*aim; J.nz=0.3*aim; J.ny=0.42*aim; J.hp=0.06; return J; }

// ---------------------------------------------------------------- shells, cases and flares in the world
function ammo(kind){ const g=new THREE.Group();
  if(kind==="shell"){ g.add(cylX(0.0098,0.058,0xa0201c,new V3(0.004,0,0)), cylX(0.0105,0.016,0xb08a3a,new V3(0.035,0,0))); }
  else if(kind==="round"){ g.add(cylX(0.0055,0.05,0xb48c3c,new V3(0.01,0,0))); const tip=new THREE.Mesh(new THREE.ConeGeometry(0.0045,0.02,8),mat(0xb06a3a)); tip.rotation.z=Math.PI/2; tip.position.set(-0.025,0,0); g.add(tip); }
  else if(kind==="case"){ g.add(cylX(0.0055,0.05,0xb48c3c,new V3(0,0,0))); }
  else if(kind==="case9"){ g.add(cylX(0.0045,0.019,0xb48c3c,new V3(0,0,0))); }
  else if(kind==="fshell"){ g.add(cylX(0.0112,0.06,0x8a2a20,new V3(-0.028,0,0)), cylX(0.0125,0.006,0xb08a3a,new V3(0.003,0,0))); }
  scene.add(g); return g; }
function eject(kind,at,v){ const g=ammo(kind); g.position.copy(at); g.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3); dropPiece(g,v,new V3(Math.random()*16-8,Math.random()*16-8,Math.random()*16-8)); }
// fire: sparks thrown off a burning flare, and its flickering light
function sparks(at,n,c){ for(let i=0;i<n;i++){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:c||0xffb070,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); m.position.copy(at); m.scale.setScalar(0.03); scene.add(m); puffs.push({m,t:0.35+Math.random()*0.2,v:new V3((Math.random()-.5)*0.9,0.3+Math.random()*0.9,(Math.random()-.5)*0.9),s:0.1}); } }
const FLARES=[];   /* burning flares in the world: {m, light, v, rest} */
function flareStep(dt){ for(const f of FLARES){ if(!f.rest){ f.v.y-=9.8*dt; f.m.position.addScaledVector(f.v,dt); if(f.m.position.y<0.02){ f.m.position.y=0.02; f.v.y=-0.3*f.v.y; f.v.x*=0.5; f.v.z*=0.5; if(f.v.length()<0.15) f.rest=true; } }
    f.light.intensity=4.2+1.2*noise(t*25,f.seed)+0.5*Math.random(); if(Math.random()<0.8) sparks(f.m.position,1,f.c); } }
function flaresClear(){ for(const f of FLARES) scene.remove(f.m); FLARES.length=0; }
function burningFlare(at,v,c){ const m=new THREE.Group(); m.position.copy(at); const core=new THREE.Mesh(new THREE.SphereGeometry(0.018,8,6),new THREE.MeshBasicMaterial({color:0xffe0c0})); const li=new THREE.PointLight(c||0xff3a1a,4.5,12,1.3); const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xff4a2a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); halo.scale.setScalar(0.5); m.add(core,li,halo); scene.add(m);
  const f={m,light:li,v:v.clone(),seed:Math.random()*9,c:c===0xff5a2a?0xffa060:0xff8050}; FLARES.push(f); return f; }

// ---------------------------------------------------------------- per-weapon starts
function wStart(ctx,k,x){ nStart(ctx,x??0); buildWeapons(); if(DOOR){ DOOR.rotation.y=0; } runner.R.wristR.rotation.set(0,0,0); runner.R.wristL.rotation.set(0,0,0); if(DOOR) DOOR.visible=false; W.pistol.mag.visible=true; showWeapon(k); ctx.wk=k; ctx.camX=null; flaresClear(); if(W.flare){ W.flare.light.intensity=0; W.flare.glow.visible=false; } }
// the hand weapons and pistols: the weapon in her right hand from the palm; f = which way its edge (or barrel) faces, u = its tip (or top)
function inHand(k,f,u){ const o=W[k], R=palm("R"); setProp(o.obj,o.pts.grip,R.p,f,u); }
// the light in her left hand (beam ahead, or wherever 'lf' says)
function lightLeft(lf,on=1){ ensureProps(); const L=palm("L"), P=TP(); LIGHT.visible=true; setProp(LIGHT,LGRIP,L.p,(lf||P.fwd.clone().add(new V3(0,-0.3,0))).normalize(),UP); SPOT.intensity=4*on; }

// ================================================================ SHOTGUN
// ---- aim: from low ready up to the shoulder, her cheek down on the stock; the beam from the taped light on the target
A.sg_aim={ start(ctx){ wStart(ctx,"shotgun"); },
  step(t,dt,ctx){ standTarget(ctx,t); const aim=sm5((t-0.8)/0.5), J=nShoulder(t,1-0.5*aim,aim);
    ctx.post=()=>longPost(ctx,"shotgun",{aim,at:tgtChest(),amp:tremor(ctx,dt,aim>0.99)*0.8}); ctx.post2=()=>{ LIGHT.visible=false; };
    ctx.phase=t<0.8?"low ready · no hand free for a light":t<1.3?"brings it to her shoulder":"cheek on the stock · on the target"; return fin(J); } };
// ---- fire and pump: a heavy kick that rocks her back a step; her left hand racks the pump back (the empty hull flies out
// of the port) and forward again
A.sg_fire={ start(ctx){ wStart(ctx,"shotgun"); ctx.aimT=1.5; ctx.shots=[0.9,2.3]; },
  step(t,dt,ctx){ standTarget(ctx,t); const T=ctx.T; let J=nShoulder(t,0.5,1), kick=0, back=0, rock=0, pump=0;
    ctx.shots.forEach((s,i)=>{ if(t>s&&!T["s"+i]){ T["s"+i]=t; ctx.events.push({kind:"sgShot"}); }
      const k=t-s; if(k>0){ kick+=0.5*Math.exp(-k/0.1)*sat(k/0.02); back+=0.08*Math.exp(-k/0.12)*sat(k/0.02); rock+=Math.exp(-k/0.3)*sat(k/0.03); ctx.x-=0.6*Math.exp(-k/0.1)*dt;
        const pu=k-0.45; pump=Math.max(pump, pu<0?0: pu<0.16? sm5(pu/0.16) : pu<0.36? 1-sm5((pu-0.2)/0.16) : 0); if(pu>0.16&&!T["e"+i]){ T["e"+i]=1; ctx.events.push({kind:"sgEject"}); } } });
    J.sp-=0.2*rock; J.nx-=0.12*rock; J.lRx+=0.12*rock; J.kL+=0.08*rock;
    const G=gunCycle(t,ctx.shots); W.shotgun.trig.rotation.z=0.45*G.trig;
    ctx.post=()=>{ W.shotgun.pump.position.x=0.085*pump; longPost(ctx,"shotgun",{aim:1,at:tgtChest(),kick,back,amp:tremor(ctx,dt,true)*0.7}); }; ctx.post2=()=>{ LIGHT.visible=false; };
    ctx.atk.J=aStand(t); if(T.s1){ const k=t-T.s1; ctx.atk.fall=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.3,w:3.4}),dt,1.6,Math.PI/2-0.08)); } else if(T.s0){ const k=t-T.s0; ctx.atk.J.sp-=0.5*Math.exp(-k/0.25); ctx.atk.x=3.9+0.25*sm5(k/0.3); }
    if(T.s1) ctx.atk.x=4.15+0.35*sm5((t-T.s1)/0.3);
    ctx.phase= t<0.9?"on the target": rock>0.4?"the kick rocks her back": pump>0?"racks the pump · the hull flies out":"back on the target"; return fin(J); } };
// ---- reload: shells from her coat pocket into the loading port under the gun, one at a time, thumbed in; four, then a rack
A.sg_load={ start(ctx){ wStart(ctx,"shotgun"); },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), n=4, t0=0.6, per=0.75; let J=nShoulder(t,0.6,0); J.nx=0.38; J.sp=0.24; J.ny=0.2;
    const i=Math.floor((t-t0)/per), u=((t-t0)%per)/per, loading=t>t0&&i<n, rack=t>t0+n*per+0.15?t-(t0+n*per+0.15):-1;
    const pocket=runner.B.hips.getWorldPosition(new V3()).addScaledVector(P.right,-0.16).addScaledVector(P.fwd,0.04);
    if(loading&&u>0.62&&!T["l"+i]){ T["l"+i]=1; ctx.events.push({kind:"sgLoad"}); }
    const pump=rack<0?0: rack<0.18? sm5(rack/0.18) : rack<0.4? 1-sm5((rack-0.22)/0.18) : 0;
    ctx.post=()=>{ W.shotgun.pump.position.x=0.085*pump;
      // the gun held low across her, turned belly-up toward her left hand; the left hand goes pocket -> port each round
      longPost(ctx,"shotgun",{aim:0,dip:0.35,cant:-1.1,wL:0,at:runner.group.position.clone().addScaledVector(P.fwd,4).setY(0.9)});
      const port=wpt("shotgun","load"), SL=runner.R.armL.getWorldPosition(new V3());
      const lh= !loading? (rack>=0? W.shotgun.pump.localToWorld(W.shotgun.pts.fore.clone()) : port.clone().add(new V3(0,-0.04,0))) : u<0.35? port.clone().lerp(pocket,sm5(u/0.35)) : u<0.5? pocket : pocket.clone().lerp(port,sm5((u-0.5)/0.12));
      armIK(runner,{side:"L",target:lh,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.2),w:sm5(t/0.4),tip:0.07}); };
    ctx.post2=()=>{ LIGHT.visible=false; if(!ctx.shell){ ctx.shell=ammo("shell"); } ctx.shell.visible=loading&&u>0.42&&u<0.66; if(ctx.shell.visible){ const L=palm("L"); setProp(ctx.shell,new V3(0.02,0,0),L.p,P.fwd,UP); } };
    ctx.phase= t<t0?"lowers it, turns it over": loading?`a shell from her pocket · thumbed into the port (${Math.min(n,i+1)} of ${n})`: rack<0.4?"racks one into the chamber":"ready"; return fin(J); } };

// ================================================================ HUNTING RIFLE
A.rf_aim={ start(ctx){ wStart(ctx,"rifle"); },
  step(t,dt,ctx){ standTarget(ctx,t); const aim=sm5((t-0.8)/0.6), J=nShoulder(t,1-0.6*aim,aim);
    ctx.post=()=>longPost(ctx,"rifle",{aim,at:tgtChest(),amp:tremor(ctx,dt,aim>0.99)*0.6}); ctx.post2=()=>{ LIGHT.visible=false; };
    ctx.phase=t<0.8?"low ready":t<1.4?"up to her shoulder · her eye to the scope":"holds her breath · steadier"; return fin(J); } };
// ---- fire and work the bolt: a hard kick; her right hand leaves the grip, lifts the bolt, pulls it back (the case flies
// out), drives it forward and down, and goes back to the grip
A.rf_fire={ start(ctx){ wStart(ctx,"rifle"); ctx.aimT=2; ctx.shots=[1.0,3.0]; },
  step(t,dt,ctx){ standTarget(ctx,t); const T=ctx.T, P=TP(); let J=nShoulder(t,0.4,1), kick=0, back=0, rock=0, lift=0, slide=0, hand=0;
    ctx.shots.forEach((s,i)=>{ if(t>s&&!T["s"+i]){ T["s"+i]=t; ctx.events.push({kind:"rfShot"}); }
      const k=t-s; if(k>0){ kick+=0.38*Math.exp(-k/0.1)*sat(k/0.02); back+=0.06*Math.exp(-k/0.12)*sat(k/0.02); rock+=Math.exp(-k/0.3)*sat(k/0.03); ctx.x-=0.4*Math.exp(-k/0.1)*dt;
        const b=k-0.55; if(b>-0.2&&b<1.1){ hand=Math.max(hand,sm5((b+0.2)/0.2)*(1-sm5((b-0.9)/0.2))); lift=Math.max(lift,b<0?0:b<0.12?sm5(b/0.12):b<0.62?1:1-sm5((b-0.62)/0.12)); slide=Math.max(slide,b<0.14?0:b<0.32?sm5((b-0.14)/0.18):b<0.44?1:1-sm5((b-0.44)/0.16)); if(b>0.3&&!T["e"+i]){ T["e"+i]=1; ctx.events.push({kind:"rfEject"}); } } } });
    J.sp-=0.15*rock; J.nx-=0.1*rock;
    const G=gunCycle(t,ctx.shots); W.rifle.trig.rotation.z=0.45*G.trig;
    ctx.post=()=>{ const R=W.rifle; R.handle.rotation.x=-1.4*lift; R.bolt.position.x=R.pts.bolt.x+0.085*slide;
      longPost(ctx,"rifle",{aim:1,at:tgtChest(),kick,back,amp:tremor(ctx,dt,true)*0.6,wR:0}); R.obj.updateMatrixWorld(true);
      const S=runner.R.armR.getWorldPosition(new V3()), knob=R.knob.getWorldPosition(new V3()), grip=wpt("rifle","grip");
      armIK(runner,{side:"R",target:grip.clone().lerp(knob,hand),pole:S.clone().add(new V3(0,-0.4,0)).addScaledVector(P.right,0.4),w:1,tip:0.07}); };
    ctx.post2=()=>{ LIGHT.visible=false; };
    ctx.atk.J=aStand(t); if(T.s0&&!T.s1){ const k=t-T.s0; ctx.atk.J.sp-=0.45*Math.exp(-k/0.25); } if(T.s1){ ctx.atk.fall=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.25,w:3.0}),dt,1.6,Math.PI/2-0.08)); }
    ctx.phase= t<1?"on the target · holds her breath": hand>0?"works the bolt · up, back (the case flies), forward, down":"back on the target"; return fin(J); } };
// ---- reload: bolt open, four rounds pressed down into the top of the action one at a time, bolt closed
A.rf_load={ start(ctx){ wStart(ctx,"rifle"); },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), n=4, t0=1.0, per=0.7; let J=nShoulder(t,0.6,0); J.nx=0.4; J.sp=0.24; J.ny=0.15;
    const open=sm5((t-0.3)/0.5)*(1-sm5((t-(t0+n*per+0.1))/0.4)), i=Math.floor((t-t0)/per), u=((t-t0)%per)/per, loading=t>t0&&i<n;
    const pocket=runner.B.hips.getWorldPosition(new V3()).addScaledVector(P.right,0.2).addScaledVector(P.fwd,0.06);   /* her right coat pocket, for her right hand */
    if(loading&&u>0.66&&!T["l"+i]){ T["l"+i]=1; ctx.events.push({kind:"rfLoad"}); }
    ctx.post=()=>{ const R=W.rifle; const lift=sat(open*2), slide=sat(open*2-1); R.handle.rotation.x=-1.4*lift; R.bolt.position.x=R.pts.bolt.x+0.085*slide;
      longPost(ctx,"rifle",{aim:0,dip:0.3,cant:0.25,wL:1,wR:0,at:runner.group.position.clone().addScaledVector(P.fwd,4).setY(0.9)});
      const S=runner.R.armR.getWorldPosition(new V3()), port=wpt("rifle","port"), knob=R.knob.getWorldPosition(new V3()), grip=wpt("rifle","grip");
      const rh= loading? (u<0.35? port.clone().lerp(pocket,sm5(u/0.35)) : u<0.5? pocket : pocket.clone().lerp(port.clone().add(new V3(0,0.02,0)),sm5((u-0.5)/0.16))) : (open>0.02&&open<0.98? knob : grip);
      armIK(runner,{side:"R",target:rh,pole:S.clone().add(new V3(0,-0.5,0)).addScaledVector(P.right,0.35),w:1,tip:0.07}); };
    ctx.post2=()=>{ LIGHT.visible=false; if(!ctx.rnd) ctx.rnd=ammo("round"); ctx.rnd.visible=loading&&u>0.42&&u<0.68; if(ctx.rnd.visible){ const R=palm("R"); setProp(ctx.rnd,new V3(0,0,0),R.p,P.fwd,UP); } };
    ctx.phase= t<0.8?"opens the bolt": loading?`presses a round down into the action (${Math.min(n,i+1)} of ${n})`: t<t0+n*per+0.6?"closes the bolt":"ready"; return fin(J); } };

// ================================================================ 9mm PISTOL
// the pistol's working parts each frame: slide back (0..1), magazine out (0..1), trigger
function pistolParts(slide,magOut,trig){ const o=W.pistol; o.slide.position.x=0.034*slide; o.mag.position.set(0.045+0.02*magOut*0.2,-0.005-0.12*magOut,0); o.trig.rotation.z=0.4*trig; }
function pistolPost(ctx,H){ holdPost(ctx,H); }
function pistolPost2(ctx,H){ const P=TP(), R=palm("R"), f=(ctx.aimF||P.fwd).clone(); const w=sat(H.aim||0), low=R.d.clone().multiplyScalar(0.55).add(P.fwd.clone().multiplyScalar(0.8)).normalize();
  inHand("pistol",H.gunF||low.lerp(f,w).normalize(),H.gunU||UP.clone().lerp(ctx.aimU||UP,w)); if(GUN) GUN.visible=false;
  if(H.light==="tuck"){ propsPost(ctx,{gun:"gone",light:"tuck"}); } else { const L=palm("L"); LIGHT.visible=true; setProp(LIGHT,LGRIP,L.p,(H.lightF||P.fwd.clone().add(new V3(0,-0.38,0)).lerp(f,w)).normalize(),UP); SPOT.intensity=4; } }
A.ps_aim={ start(ctx){ wStart(ctx,"pistol"); },
  step(t,dt,ctx){ standTarget(ctx,t); const t0=0.8, aim=sm5((t-t0)/0.45), J=mix(nStand(t,1),nAim(t,1-0.7*sat((t-t0-0.5)/2.5)),aim);
    const H={aim,amp:tremor(ctx,dt,t>t0+0.45),at:tgtChest()}; ctx.H=H; ctx.post=()=>pistolPost(ctx,H); ctx.post2=()=>{ pistolParts(0,0,0); pistolPost2(ctx,H); };
    ctx.phase=t<t0?"low ready":"up into the hold · the light under it · the shake settles"; return fin(J); } };
// ---- fire: four quick shots. The slide snaps back and forward each time and a case spins out; on the last round the
// slide locks back, empty
A.ps_fire={ start(ctx){ wStart(ctx,"pistol"); ctx.aimT=2; ctx.shots=[0.9,1.35,1.75,2.15]; },
  step(t,dt,ctx){ standTarget(ctx,t); const T=ctx.T; let J=nAim(t,0.3), kick=0, slide=0, fl=0;
    ctx.shots.forEach((s,i)=>{ if(t>s&&!T["s"+i]){ T["s"+i]=t; ctx.events.push({kind:"psShot",last:i===3}); ctx.aimT=0.3*i; } const k=t-s;
      if(k>0){ kick+=0.22*Math.exp(-k/0.07)*sat(k/0.015); fl+=[0.7,0.4,0.3,0.25][i]*Math.exp(-k/0.25); slide=Math.max(slide, i===3? sat(k/0.025) : k<0.025? k/0.025 : 1-sat((k-0.025)/0.04)); } });
    J.nx-=0.15*fl; J.ny+=0.2*fl; J.sp-=0.06*fl;
    const trig=Math.max(...ctx.shots.map(s=>sat(1-Math.abs(t-s+0.04)/0.06)));
    const H={aim:1,amp:tremor(ctx,dt,true),kick,at:tgtChest()}; ctx.H=H; ctx.post=()=>pistolPost(ctx,H); ctx.post2=()=>{ pistolParts(slide,0,trig); pistolPost2(ctx,H); };
    ctx.atk.J=aStand(t); const hits=ctx.shots.filter((s,i)=>T["s"+i]).length; ctx.atk.J.sp-=0.12*hits*(1+0.5*Math.sin(t*20)*Math.exp(-(t-(T["s"+(hits-1)]||t))/0.2));
    ctx.phase= t<0.9?"on the target": !T.s3?"quick shots · the slide snaps back, a case spins out":"the slide locks back · empty"; return fin(J); } };
// ---- reload: the empty magazine drops; she tucks the light, takes a fresh one from her pocket, seats it with a slap and
// drops the slide; back on the aim
A.ps_load={ start(ctx){ wStart(ctx,"pistol"); },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t1=0.5, t2=0.8, t3=1.7, t4=2.15, t5=2.5; let J=nStand(t,0.8); J.nx=0.35; J.sp=0.25;
    if(t>t1&&!T.drop){ T.drop=1; ctx.events.push({kind:"magDrop"}); }
    if(t>t4&&!T.seat){ T.seat=1; ctx.events.push({kind:"magSeat"}); }
    if(t>t5&&!T.rel){ T.rel=1; ctx.events.push({kind:"slideRel"}); }
    const back=sm5((t-t5-0.1)/0.45), magOut= t<t1?0: t<t1+0.25? sm5((t-t1)/0.25) : t<t3? 9 : t<t4? 1-sm5((t-t3)/(t4-t3)) : 0;
    const chest=runner.B.chest.getWorldPosition(new V3()).addScaledVector(P.fwd,0.33).addScaledVector(P.right,0.05).add(new V3(0,-0.04,0)), pocket=runner.B.hips.getWorldPosition(new V3()).addScaledVector(P.right,-0.17).addScaledVector(P.fwd,0.06);
    const gF=P.fwd.clone().addScaledVector(P.right,-0.3).add(new V3(0,0.25,0)).normalize();
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
      armIK(runner,{side:"R",target:chest,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.18),w:1-back,tip:0.075});
      const mw=wpt("pistol","grip").add(new V3(0,-0.1,0)), lh= t<t2? null : t<t3? (t<t2+0.4? chest.clone().lerp(pocket,sm5((t-t2)/0.4)) : pocket.clone().lerp(mw,sm5((t-t2-0.5)/0.4))) : t<t4+0.1? mw : t<t5+0.05? wpt("pistol","grip").add(new V3(0,0.04,0)) : null;
      if(lh) armIK(runner,{side:"L",target:lh,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.18),w:1-back,tip:0.075});
      if(back>0) holdPost(ctx,{aim:back,amp:0.02,at:runner.group.position.clone().addScaledVector(P.fwd,5).setY(1.2)}); };
    ctx.post2=()=>{ pistolParts(T.rel?0:1, magOut>1?1:magOut, 0); W.pistol.mag.visible=!(magOut>1); pistolPost2(ctx,{aim:back,gunF:back>0.3?null:gF,light:t>0.25&&back<0.5?"tuck":"hand"});
      if(!ctx.newMag){ ctx.newMag=W.pistol.mag.clone(); scene.add(ctx.newMag); } ctx.newMag.visible=t>t2+0.35&&t<t3; if(ctx.newMag.visible){ const L=palm("L"); ctx.newMag.position.copy(L.p); ctx.newMag.quaternion.copy(W.pistol.obj.quaternion); } };
    ctx.phase= t<t1?"thumbs the release": t<t2?"the empty magazine drops": t<t3?"a fresh one from her pocket": t<t4+0.1?"seats it with a slap": t<t5+0.1?"drops the slide":"back on the aim"; return fin(back>0?mix(J,nAim(t,0.7),back):J); } };

// ================================================================ HAND WEAPONS
// a swing: the hand travels a path (shoulder-relative) while the weapon's tip and edge follow; the light stays in her left hand
function swingPost(ctx,k,o){ const P=TP(); runner.group.updateMatrixWorld(true); const S=runner.R.armR.getWorldPosition(new V3());
  const hp=S.clone().addScaledVector(P.fwd,o.hand[0]).add(new V3(0,o.hand[1],0)).addScaledVector(P.right,o.hand[2]);
  armIK(runner,{side:"R",target:hp,pole:S.clone().add(new V3(0,-0.5,0)).addScaledVector(P.right,0.5).addScaledVector(P.fwd,-0.2),w:1,tip:0.07}); ctx.wTip=o.tip; ctx.wEdge=o.edge; }
function swingPost2(ctx,k,lf){ const P=TP(), tip=P.fwd.clone().multiplyScalar(ctx.wTip[0]).add(new V3(0,ctx.wTip[1],0)).addScaledVector(P.right,ctx.wTip[2]), edge=P.fwd.clone().multiplyScalar(ctx.wEdge[0]).add(new V3(0,ctx.wEdge[1],0)).addScaledVector(P.right,ctx.wEdge[2]);
  inHand(k,edge,tip); lightLeft(lf); }
const lerp3=(a,b,w)=>a.map((x,i)=>x+(b[i]-x)*w);
// keys: [time, hand(fwd,up,right), tip direction, edge direction]
function swingKeys(K,t){ let i=0; while(i<K.length-2&&t>K[i+1][0]) i++; const a=K[i], b=K[i+1], w=sm5((t-a[0])/(b[0]-a[0])); return {hand:lerp3(a[1],b[1],w),tip:lerp3(a[2],b[2],w),edge:lerp3(a[3],b[3],w)}; }
function meleeBody(t,u,wind,hit){ const J=nStand(t,0.8); J.lLx=-0.38; J.kL=0.32; J.lRx=0.25; J.kR=0.25; J.lRz=0.14; J.syaw=0.45*wind-0.55*hit; J.hyaw=0.15*wind-0.2*hit; J.sp=0.15+0.25*hit; J.sroll=0.1*wind-0.15*hit; J.ny=-0.3*wind+0.25*hit; J.aLx=-0.6; J.eL=1.2; J.aLz=0.2; return J; }
// ---- hatchet: chop. Up over her right shoulder, then down hard into the neck of the one in front of her; it drops
// ---------------------------------------------------------------- swings that come from the whole body
// A swing is keyed in joint space ([time, pose, easing]). Each group of joints runs a little behind the one before it,
// hips -> chest -> shoulder -> elbow -> wrist, so the motion travels out along the body to the weapon, the way a real
// swing whips. c = the wrist cocked back (+) or snapped through (−). The weapon comes off the hand's own frame: its edge
// along her fingers, its handle along her thumb.
const CHAIN={hyaw:0,hroll:0,hp:0,hz:0,hd:0,lLx:0,lRx:0,kL:0,kR:0,lLz:0,lRz:0,syaw:0.035,sroll:0.035,sp:0.035,ny:0.05,nx:0.05,nz:0.05,aRx:0.065,aRy:0.065,aRz:0.065,eR:0.1,c:0.13,aLx:0.05,aLy:0.05,aLz:0.05,eL:0.08};
const ePow=u=>u*u, eOut=u=>1-(1-u)*(1-u);
function swingPose(K,t,J){ for(const f in CHAIN){ const tt=t-CHAIN[f]; let i=0; while(i<K.length-2&&tt>K[i+1][0]) i++; const a=K[i], b=K[i+1], va=a[1][f], vb=b[1][f]; if(va==null&&vb==null) continue;
    const u=sat((tt-a[0])/(b[0]-a[0])), e=(b[2]||sm5)(u), A=va??(f==="c"?0:J[f]), Bv=vb??(f==="c"?0:J[f]); if(f==="c") J.c=A+(Bv-A)*e; else J[f]=A+(Bv-A)*e; } return J; }
// the hand's frame from the rig: fingers along −y of the wrist, thumb along +z
function handFrame(s){ runner.group.updateMatrixWorld(true); const q=runner.R["wrist"+s].getWorldQuaternion(QI()); return {fingers:new V3(0,-1,0).applyQuaternion(q), thumb:new V3(0,0,1).applyQuaternion(q)}; }
function cock(s,c){ runner.R["wrist"+s].rotation.set(-c,0,0); }
function heldWeapon(k){ const H=handFrame("R"); inHand(k,H.fingers,H.thumb); }
// the stance for a swing: feet apart, knees soft; the left arm (with the light) counter-swings for balance
const MREADY={hyaw:0,syaw:0,sroll:0,sp:0.16,hz:0,aRx:-0.55,aRy:0.15,aRz:0.18,eR:1.25,c:0.1,aLx:-0.55,aLz:0.22,eL:1.15,nx:0.08,ny:0};
function meleeStance(t){ const J=nStand(t,0.6); J.lLx=-0.36; J.kL=0.3; J.lRx=0.26; J.kR=0.26; J.lLz=0.1; J.lRz=0.16; return Object.assign(J,MREADY); }
function chopPost(ctx){ cock("R",ctx.J.c||0); }
function chopPost2(ctx,k){ heldWeapon(k); lightLeft(null,1); }
// ---- hatchet: chop. Weight back, the arm up and back with the elbow high and the wrist cocked so the head hangs behind
// her shoulder; then hips, chest, shoulder, elbow and wrist come through in turn and the edge drives down into its neck;
// she follows through across her body and recovers
const H_WIND={hyaw:0.22,syaw:0.5,sroll:-0.16,sp:-0.04,hz:-0.04,aRx:-2.55,aRy:0.55,aRz:0.42,eR:2.0,c:0.55,aLx:-1.0,aLz:0.35,eL:0.8,nx:0.02,ny:-0.15,lLx:-0.3,lRx:0.32};
const H_HIT={hyaw:-0.2,syaw:-0.38,sroll:0.16,sp:0.36,hz:0.05,aRx:-1.15,aRy:0.05,aRz:0.12,eR:0.3,c:-0.3,aLx:-0.35,aLz:0.45,eL:0.6,nx:0.2,ny:0.1,lLx:-0.48,lRx:0.18};
const H_THRU={hyaw:-0.3,syaw:-0.52,sroll:0.22,sp:0.46,hz:0.06,aRx:-0.75,aRy:-0.1,aRz:0.05,eR:0.5,c:-0.45,aLx:-0.25,aLz:0.5,eL:0.7,nx:0.25,ny:0.12,lLx:-0.5,lRx:0.16};
A.hx_chop={ start(ctx){ wStart(ctx,"hatchet"); },
  step(t,dt,ctx){ const T=ctx.T, t0=0.7, tw=1.25, th=1.47, tf=1.7, tr=2.5;
    const K=[[0,MREADY],[t0,MREADY],[tw,H_WIND],[tw+0.08,H_WIND],[th,H_HIT,ePow],[tf,H_THRU,eOut],[tr,MREADY]];
    const J=swingPose(K,t,meleeStance(t)); ctx.J=J;
    if(t>th-0.02&&!T.h){ T.h=t; ctx.events.push({kind:"chop"}); }
    ctx.atk={x:0.98,z:0.08,yaw:-Math.PI/2,J:aReach(t,0.4)}; if(T.h){ const k=t-T.h; ctx.atk.J.nx=0.6*sm5(k/0.1); ctx.atk.J.sroll=-0.4*sm5(k/0.15); ctx.atk.fall=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.15,w:1.6}),dt,1.6,Math.PI/2-0.08)); ctx.atk.x=0.98+0.2*sm5(k/0.4); }
    ctx.post=()=>chopPost(ctx); ctx.post2=()=>chopPost2(ctx,"hatchet");
    ctx.phase= t<t0?"hatchet ready, the light in her other hand": t<tw+0.08?"weight back · up over her shoulder, the head hanging behind": t<tf?"hips, chest, arm, wrist · down into its neck":"follows through · it drops"; return fin(J); } };
// ---- hatchet: flurry. A forehand chop across from her right, carried round into a backhand from her left, the whole
// upper body winding and unwinding, more desperate than skilled
const F_BACK={hyaw:0.25,syaw:0.55,sroll:-0.1,sp:0.08,aRx:-1.55,aRy:0.7,aRz:0.85,eR:1.7,c:0.5,aLx:-0.9,aLz:0.2,eL:1.0,ny:-0.1};
const F_ACROSS={hyaw:-0.25,syaw:-0.55,sroll:0.12,sp:0.3,aRx:-1.25,aRy:-0.55,aRz:-0.15,eR:0.55,c:-0.4,aLx:-0.4,aLz:0.55,eL:0.6,ny:0.15};
const F_LEFT={hyaw:-0.35,syaw:-0.6,sroll:0.1,sp:0.22,aRx:-1.85,aRy:-0.45,aRz:0.05,eR:1.2,c:-0.05,aLx:-0.3,aLz:0.6,eL:0.6,ny:0.2};
const F_BACKHIT={hyaw:0.2,syaw:0.45,sroll:-0.08,sp:0.3,aRx:-1.3,aRy:0.35,aRz:0.75,eR:0.35,c:-0.45,aLx:-0.9,aLz:0.25,eL:1.0,ny:-0.15};
A.hx_flurry={ start(ctx){ wStart(ctx,"hatchet"); },
  step(t,dt,ctx){ const T=ctx.T;
    const K=[[0,MREADY],[0.6,MREADY],[1.0,F_BACK],[1.22,F_ACROSS,ePow],[1.5,F_LEFT,eOut],[1.72,F_BACKHIT,ePow],[2.0,Object.assign({},F_BACKHIT,{aRz:0.85,syaw:0.55}),eOut],[2.8,MREADY]];
    const J=swingPose(K,t,meleeStance(t)); ctx.J=J;
    if(t>1.18&&!T.a){ T.a=1; ctx.events.push({kind:"chop"}); } if(t>1.68&&!T.b){ T.b=1; ctx.events.push({kind:"chop"}); }
    ctx.atk={x:1.02-0.12*sat(t/0.9),z:0,yaw:-Math.PI/2,J:aReach(t,0.6)}; if(T.a){ ctx.atk.J.syaw=-0.4; } if(T.b){ ctx.atk.fall=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.2,w:2.2}),dt,1.6,Math.PI/2-0.08)); }
    ctx.post=()=>chopPost(ctx); ctx.post2=()=>chopPost2(ctx,"hatchet");
    ctx.phase= t<0.6?"it comes in": t<1.3?"winds and chops across": t<1.8?"carries round into a backhand":"it goes down"; return fin(J); } };
// ---- crowbar: two-handed. The light clipped to her jacket, beam ahead; both hands on the bar. She winds the whole upper
// body back to her right, the bar up over her shoulder, then unwinds hips first and the bar comes round flat into the
// side of its head and on through
function crowbarAt(th,ht,lift){ runner.group.updateMatrixWorld(true); const q=runner.R.chest.getWorldQuaternion(QI()), cf=new V3(0,0,1).applyQuaternion(q).setY(0).normalize(), cr=new V3().crossVectors(cf,UP).negate().normalize(), C=runner.B.chest.getWorldPosition(new V3()).add(new V3(0,0.08,0));
  /* th is measured from where her chest faces, so the bar turns with her shoulders and her arms stay in front of her */
  const rad=cf.clone().multiplyScalar(Math.cos(th)).addScaledVector(cr,Math.sin(th)), tan=cf.clone().multiplyScalar(-Math.sin(th)).addScaledVector(cr,Math.cos(th));
  const G=C.clone().addScaledVector(rad,0.47+0.08*Math.max(0,ht)).add(new V3(0,ht,0)), tip=rad.clone().multiplyScalar(Math.cos(lift)).add(new V3(0,Math.sin(lift),0)).normalize(); return {G,tip,edge:tan.clone().negate()}; }
function lightOnChest(){ ensureProps(); runner.group.updateMatrixWorld(true); const q=runner.R.chest.getWorldQuaternion(QI()), f=new V3(0,0,1).applyQuaternion(q), r=new V3(-1,0,0).applyQuaternion(q), c=runner.B.chest.getWorldPosition(new V3());
  LIGHT.visible=true; setProp(LIGHT,LGRIP,c.clone().addScaledVector(f,0.13).addScaledVector(r,0.07).add(new V3(0,0.12,0)),f.clone().add(new V3(0,-0.2,0)),UP); SPOT.intensity=4; }
function twoHanded(ctx,k,arc){ const o=W[k]; const pl=placement(new V3(0,-0.49,0),arc.G,arc.edge,arc.tip); o.obj.position.copy(pl.p); o.obj.quaternion.copy(pl.q); o.obj.updateMatrixWorld(true);
  const P=TP(), S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3()), gr=o.obj.localToWorld(new V3(0,-0.43,0)), gl=o.obj.localToWorld(new V3(0,-0.56,0));
  armIK(runner,{side:"R",target:gr,pole:S.clone().add(new V3(0,-0.3,0)).addScaledVector(P.right,0.7),w:1,tip:0.07});
  armIK(runner,{side:"L",target:gl,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.3),w:1,tip:0.07}); }
const CB={ ready:{th:0.3,ht:-0.3,lift:0.75}, wind:{th:0.55,ht:0.24,lift:1.25}, hit:{th:0.25,ht:0.05,lift:0.05}, thru:{th:-0.4,ht:-0.06,lift:-0.15} };
const CBB={ ready:{hyaw:0,syaw:0.05,sroll:0,sp:0.18}, wind:{hyaw:0.3,syaw:0.62,sroll:-0.12,sp:0.04,hz:-0.04,ny:-0.35,lLx:-0.28,lRx:0.34}, hit:{hyaw:-0.12,syaw:-0.2,sroll:0.1,sp:0.3,hz:0.05,ny:0.1,lLx:-0.48,lRx:0.18}, thru:{hyaw:-0.38,syaw:-0.62,sroll:0.16,sp:0.36,hz:0.06,ny:0.35,lLx:-0.5,lRx:0.15} };
A.cb_swing={ start(ctx){ wStart(ctx,"crowbar"); },
  step(t,dt,ctx){ const T=ctx.T, t0=0.7, tw=1.3, th=1.52, tf=1.78, tr=2.6;
    const keys=[[0,"ready"],[t0,"ready"],[tw,"wind"],[tw+0.08,"wind"],[th,"hit",ePow],[tf,"thru",eOut],[tr,"ready"]];
    const seg=tt=>{ let i=0; while(i<keys.length-2&&tt>keys[i+1][0]) i++; return [keys[i],keys[i+1],(keys[i+1][2]||sm5)(sat((tt-keys[i][0])/(keys[i+1][0]-keys[i][0])))]; };
    const [a,b,e]=seg(t-0.06), arc={}; for(const f of ["th","ht","lift"]) arc[f]=CB[a[1]][f]+(CB[b[1]][f]-CB[a[1]][f])*e;
    const K=keys.map(k=>[k[0],CBB[k[1]],k[2]]), J=swingPose(K,t,meleeStance(t)); J.aLx=-0.6; J.eL=1.2;
    if(t>th-0.03&&!T.h){ T.h=t; ctx.events.push({kind:"bash"}); }
    ctx.atk={x:1.0,z:0.05,yaw:-Math.PI/2,J:aReach(t,0.35)}; if(T.h){ const k=t-T.h; ctx.atk.J.ny=0.8*sm5(k/0.1); ctx.atk.J.sroll=0.35; ctx.atk.fall=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.2,w:2.4}),dt,1.6,Math.PI/2-0.08)); ctx.atk.z=0.05-0.4*sm5(k/0.5); }
    ctx.post=()=>twoHanded(ctx,"crowbar",crowbarAt(arc.th,arc.ht,arc.lift)); ctx.post2=()=>{ twoHanded(ctx,"crowbar",crowbarAt(arc.th,arc.ht,arc.lift)); lightOnChest(); };
    ctx.phase= t<t0?"two hands on the bar · the light clipped to her jacket": t<tw+0.08?"winds the whole upper body back, the bar over her shoulder": t<tf?"unwinds hips first · the bar comes round flat into its head":"on through · it goes down"; return fin(J); } };
// ---- crowbar: pry the jammed door. The claw in the gap; each heave cracks it open a little more and it springs back part
// of the way, the frame creaking. It won't go. She pulls the bar out, sets her shoulder and both hands against the door and
// drives with her legs: it gives a little, sticks, then breaks free and swings wide; she stumbles in after it.
let DOOR=null; function ensureDoor(){ if(!DOOR){ DOOR=new THREE.Group(); const m=mat(0x2e2a26); const fr=(w,h,x,y)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(0.12,h,w),m); b.position.set(0,y,x); DOOR.add(b); };
    fr(1.2,2.2,-1.02,1.1); fr(0.12,2.2,0.48,1.1); fr(2.2,0.3,-0.45,2.35);   /* the near jamb is left thin so the side camera sees her */
    const d=new THREE.Group(); d.position.set(0,0,-0.42); const leaf=new THREE.Mesh(new THREE.BoxGeometry(0.05,2.05,0.84),mat(0x4a3a2c)); leaf.position.set(0.0,1.03,0.42); d.add(leaf);
    const knob=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,6),mat(0x8a7a50)); knob.position.set(-0.04,1.0,0.76); d.add(knob); DOOR.add(d); DOOR.leaf=d; DOOR.position.set(0.72,0,0); scene.add(DOOR); } DOOR.visible=true; }
const doorEdge=(h,out=0)=>{ DOOR.updateMatrixWorld(true); return DOOR.leaf.localToWorld(new V3(-0.03-out,h,0.8)); };
A.cb_pry={ start(ctx){ wStart(ctx,"crowbar",0); ctx.yaw=Math.PI-0.6; const f=TP().fwd; ctx.s0=-0.24; ctx.x=f.x*ctx.s0; ctx.z=f.z*ctx.s0;   /* turned so the camera sees the door's face over her shoulder */
    ensureDoor(); DOOR.leaf.rotation.y=0; DOOR.position.copy(f.clone().multiplyScalar(0.72)); DOOR.rotation.y=ctx.yaw-Math.PI/2; ctx.camX=0; ctx.camD=4.6; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), tIn=0.8, heaves=[1.2,2.0,2.8], tOut=3.55, tSet=4.1, tPush=4.35, tGive=5.25; let J=nStand(t,0.6);
    // the door: each heave opens it to a peak and it springs back part of the way (the give); then the shove
    let ang=0, lean=0, rest=0; heaves.forEach((h,i)=>{ const k=t-h, peak=[0.07,0.14,0.21][i], keep=[0.025,0.07,0.12][i]; if(k>0){ const up=sat(k/0.35), down=sat((k-0.4)/0.3); const a=peak*sm5(up)-(peak-keep)*sm5(down)+0.012*Math.sin(k*40)*Math.exp(-k*6)*(k<0.7?1:0); ang=Math.max(ang,i===0||k<0.8?a:keep); rest=keep; lean=Math.max(lean,Math.sin(Math.PI*sat(k/0.75))); } });
    const shove=t>tPush? sat((t-tPush)/0.25) : 0, creep=t>tPush? 0.07*sm5((t-tPush)/0.5)+0.025*Math.sin((t-tPush)*18)*Math.exp(-(t-tPush)*3)*(t<tGive?1:0) : 0;
    if(t>tGive&&!T.give){ T.give=t; ctx.events.push({kind:"doorGive"}); } if(t>tPush+0.05&&!T.p){ T.p=1; ctx.events.push({kind:"doorShove"}); }
    const swing=T.give? 1.55*eOut(sat((t-T.give)/0.7)) : 0; ang=Math.max(ang, rest+creep+swing);
    if(T.give) ang=Math.max(ang,rest+0.07); DOOR.leaf.rotation.y=ang;
    // her: pry stance, leaning back on the bar with each heave
    if(t<tOut){ J.lLx=-0.5-0.15*lean; J.kL=0.42+0.15*lean; J.lRx=0.32; J.kR=0.3; J.sp=0.15-0.2*lean; J.hp=-0.1*lean; J.hz=-0.05*lean; J.syaw=0.25; J.nx=0.12; }
    // the shove: steps in, left shoulder and both hands to the door, drives with the back leg
    const step=sm5((t-tOut)/0.6); if(t>tOut){ const sAl=-0.24+0.58*step+(T.give?0.45*sm5((t-T.give-0.1)/0.6):0), f=P.fwd; ctx.x=f.x*sAl; ctx.z=f.z*sAl; ctx.moving=t<tSet||!!T.give; }
    if(t>tOut){ const S={...nStand(t,0.8)}; const d=sat((t-tSet)/0.3); S.lLx=-0.55*d; S.kL=0.5*d+0.1; S.lRx=0.55*d; S.kR=0.15; S.fR=-0.2*d; S.sp=0.18+0.32*d+0.08*shove; S.hp=0.12*d; S.syaw=-0.35*d; S.sroll=0.12*d; S.nx=0.1; S.ny=-0.3*d;
      if(T.give){ const k=t-T.give, st=Math.sin(Math.PI*sat(k/0.5)); S.sp+=0.15*st; S.lLx-=0.3*st; S.kL+=0.3*st; }
      J=mix(J,S,step); }
    const gap=doorEdge(1.05,-0.02), hold=gap.clone().addScaledVector(P.fwd,-0.36-0.07*lean).add(new V3(0,-0.04,0)).addScaledVector(P.right,0.08);
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
      if(t<tOut){ const w=sm5((t-0.2)/0.5)*(1-sm5((t-tOut+0.3)/0.3));
        armIK(runner,{side:"R",target:hold,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.35),w,tip:0.07});
        const onBar=hold.clone().addScaledVector(gap.clone().add(new V3(0,0.06,0)).sub(hold).normalize(),0.22); /* her left hand on the bar, between her right and the claw */
        armIK(runner,{side:"L",target:onBar,pole:SL.clone().add(new V3(0,-0.25,0)).addScaledVector(P.right,-0.9).addScaledVector(P.fwd,-0.2),w:w*sm5((t-tIn)/0.4),tip:0.07}); }
      else { const d=sm5((t-tSet+0.2)/0.4)*(T.give?1-sm5((t-T.give-0.5)/0.5):1);
        armIK(runner,{side:"L",target:doorEdge(1.25,0.04).addScaledVector(P.right,-0.12),pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.4),w:d,tip:0.07});
        armIK(runner,{side:"R",target:doorEdge(1.0,0.04).addScaledVector(P.right,0.1),pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.4),w:d*0.9,tip:0.07}); } };
    ctx.post2=()=>{ if(t<tOut){ const R=palm("R"), claw=gap.clone().add(new V3(0,0.06,0)); inHand("crowbar",P.right.clone().negate(),claw.sub(R.p).normalize()); }
      else { const H=handFrame("R"); inHand("crowbar",H.fingers,H.thumb); }
      lightOnChest(); };
    const hv=heaves.findIndex(h=>t>h&&t<h+0.8);
    ctx.phase= t<tIn?"the claw into the gap": t<tOut? (hv>=0?`heaves (${hv+1} of 3) · it cracks open, springs back`:"resets her grip"): t<tPush?"it won't go · she sets her shoulder and hands to it": !T.give?"drives with her legs · it gives a little, sticks":"it breaks free and swings wide · she stumbles in";
    return fin(J); } };

A.kn_slash={ start(ctx){ wStart(ctx,"knife"); },
  step(t,dt,ctx){ const T=ctx.T, R0=[0.25,-0.3,0.15], tR=[0.8,0.3,0], eR=[0.1,0,-1];
    const K=[[0,R0,tR,eR],[0.8,R0,tR,eR],[1.0,[0.15,0.0,0.3],[0.6,0.4,0.6],[0.2,0,-1]],[1.15,[0.45,-0.05,-0.25],[0.6,0.1,-0.7],[0.2,0,-1]],[1.5,[0.15,-0.2,0.15],[0.8,0.2,0],[0,-1,0]],[1.7,[0.55,-0.15,0.0],[1,0,0],[0,-1,0]],[2.4,R0,tR,eR]];
    const sk=swingKeys(K,t); if(t>1.1&&!T.a){ T.a=1; ctx.events.push({kind:"slash"}); } if(t>1.66&&!T.b){ T.b=1; ctx.events.push({kind:"stab"}); }
    ctx.atk={x:0.85,z:0,yaw:-Math.PI/2,J:aReach(t,0.5)}; if(T.a){ ctx.atk.J.sp-=0.2; } if(T.b){ const k=t-1.66; ctx.atk.J.sp-=0.35*sm5(k/0.2); ctx.atk.x=0.85+0.35*sm5((k-0.1)/0.5); }
    const sw=t<1.15?sm5((t-0.8)/0.35):t<1.7?1:1-sm5((t-1.7)/0.6), J=meleeBody(t,0,0.3*(1-sw),sw*0.6); J.lLx=-0.45; J.kL=0.4;
    ctx.post=()=>swingPost(ctx,"knife",sk); ctx.post2=()=>swingPost2(ctx,"knife");
    ctx.phase= t<0.8?"knife low, the light up": t<1.3?"slashes across": t<1.8?"stabs":"it reels back"; return fin(J); } };
// ---- knife: breaking a grab. Its hands on her shoulders; she drives the knife up into its neck, again, until it lets go
A.kn_free={ start(ctx){ wStart(ctx,"knife"); ctx.mash=0; ctx.out="free"; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), tG=0.5; let J=nStand(t,1);
    const g=t-tG, held=g>0&&!T.free; if(g>0&&!T.g){ T.g=1; ctx.events.push({kind:"grab"}); }
    ctx.atk={x:Math.max(0.62,1.6-1.2*sm5(t/0.5)),z:0,yaw:-Math.PI/2,J:aReach(t,1)};
    const stabs=[1.0,1.45,1.9], si=stabs.findIndex(s=>t<s+0.3&&t>s-0.25), ph=si>=0?(t-stabs[si]+0.25)/0.55:0;
    stabs.forEach((s,i)=>{ if(t>s&&!T["s"+i]){ T["s"+i]=1; ctx.events.push({kind:"stab"}); } });
    if(held){ ctx.qte=Math.min(1,(t-tG)/1.5); const S=nStand(t,1); S.sp=-0.18; S.nx=-0.3; S.ny=0.25; S.lLx=-0.4; S.kL=0.4; J=S; ctx.atk.J.nx=-0.5+0.15*Math.sin(t*9); ctx.atk.J.hz=0.1; if(T.s0) ctx.atk.J.nx-=0.2*Math.sin(t*14); }
    if(t>2.1&&!T.free){ T.free=t; ctx.events.push({kind:"knFree"}); ctx.qte=null; }
    if(T.free){ const k=t-T.free; ctx.atk.fall=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.2,w:2.0}),dt,1.6,Math.PI/2-0.08)); ctx.atk.x=0.62+0.4*sm5(k/0.5); J=mix(J,nStand(t,1),sm5(k/0.4)); ctx.x-=0.25*dt*(k<0.6?1:0); }
    const neck=by.c.B.neck.getWorldPosition(new V3()), low=runner.B.chest.getWorldPosition(new V3()).addScaledVector(P.fwd,0.2).add(new V3(0,-0.12,0)).addScaledVector(P.right,0.08);
    const stab=si>=0? Math.sin(Math.PI*sat(ph)) : 0, hand=held? low.clone().lerp(neck.clone().addScaledVector(P.fwd,-0.08),stab) : null;
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
      if(hand) armIK(runner,{side:"R",target:hand,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.3),w:1,tip:0.07});
      if(held){ const ch=by.c.B.chest.getWorldPosition(new V3()); armIK(runner,{side:"L",target:ch.clone().addScaledVector(P.right,-0.1).add(new V3(0,0.1,0)),pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.3),w:1,tip:0.07});
        const sh=s=>runner.B["upperarm_"+s].getWorldPosition(new V3()); armIK(by.c,{side:"L",target:sh("R"),pole:by.c.R.armL.getWorldPosition(new V3()).add(new V3(0,-0.6,0)),w:1,tip:0.1}); armIK(by.c,{side:"R",target:sh("L"),pole:by.c.R.armR.getWorldPosition(new V3()).add(new V3(0,-0.6,0)),w:1,tip:0.1}); } };
    ctx.post2=()=>{ const R=palm("R"), tipDir=held? neck.clone().sub(R.p).normalize() : P.fwd.clone().add(new V3(0,0.3,0)); inHand("knife",P.right.clone(),tipDir); lightLeft(held?P.fwd.clone().add(new V3(0,-0.6,0)):null); };
    ctx.phase= g<0?"it lunges": held?"grabbed · she drives the knife up into its neck":"it lets go and drops"; return fin(J); } };

// ================================================================ ROAD FLARE
function flarePost2(ctx,lit,fd){ const P=TP(); inHand("flare",P.right.clone().negate(),fd||P.fwd.clone().add(new V3(0,1.2,0))); lightLeft(null,1);
  const o=W.flare; o.glow.visible=lit>0; o.light.intensity=lit*(2.6+0.9*noise(t*25,3)+0.4*Math.random()); if(lit>0&&Math.random()<0.85){ o.obj.updateMatrixWorld(true); sparks(o.obj.localToWorld(o.pts.tip.clone()),1,0xff8050); }
  o.obj.userData.parts.Cap.visible=!ctx.T.cap; }
// ---- strike: pulls the cap, strikes the end across it; it catches and burns red. She holds it up; the one in the dark
// backs off from the light, an arm over its eyes
A.fl_strike={ start(ctx){ wStart(ctx,"flare"); ctx.camX=1.4; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t0=0.6, t1=1.2, t2=1.45; let J=nStand(t,1);
    if(t>t0&&!T.cap){ T.cap=1; } if(t>t2&&!T.lit){ T.lit=t; ctx.events.push({kind:"flareLit"}); }
    const lit=T.lit?Math.min(1,(t-T.lit)/0.25):0, up=sm5((t-t2-0.4)/0.5);
    ctx.atk={x:2.6,z:0.1,yaw:-Math.PI/2,J:aStand(t)}; if(T.lit){ const k=t-T.lit; const sh=sm5((k-0.2)/0.4); ctx.atk.J.aLx=-1.4*sh; ctx.atk.J.eL=1.9*sh; ctx.atk.J.aLz=-0.3*sh; ctx.atk.J.nx=0.3*sh; ctx.atk.J.sp=0.3-0.15*sh; ctx.atk.x=2.6+1.0*sm5((k-0.4)/1.4); ctx.atk.J.lLx=0.3*Math.sin(k*6)*sat(k-0.4)*(1-sat((k-1.8)/0.2)); }
    const chest=runner.B.chest.getWorldPosition(new V3());
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
      const hold=chest.clone().addScaledVector(P.fwd,0.28).addScaledVector(P.right,0.06), high=S.clone().addScaledVector(P.fwd,0.35).add(new V3(0,0.3,0)).addScaledVector(P.right,0.1);
      const strike=t>t1&&t<t2+0.1? Math.sin(Math.PI*sat((t-t1)/0.3)) : 0;
      armIK(runner,{side:"R",target:hold.clone().lerp(high,up).addScaledVector(P.fwd,0.06*strike),pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.4),w:sm5(t/0.4),tip:0.07});
      if(t>t0-0.3&&t<t2+0.2) armIK(runner,{side:"L",target:hold.clone().addScaledVector(P.right,-0.06).add(new V3(0,0.18-0.15*strike,0)).addScaledVector(P.fwd,0.05),pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.3),w:sm5((t-t0+0.3)/0.2)*(1-sm5((t-t2)/0.2)),tip:0.07}); };
    ctx.post2=()=>{ flarePost2(ctx,lit,P.fwd.clone().multiplyScalar(0.3).add(new V3(0,1,0))); if(t>t0-0.3&&t<t2+0.2){ const L=palm("L"); /* the cap in her left hand, struck across the end */ } };
    J.nx=0.15-0.25*up; J.sp=0.12; ctx.phase= t<t0?"a road flare from her pocket": t<t1?"pulls the cap": t<t2+0.1?"strikes it":"it burns red · she holds it up · it backs off from the light"; return fin(J); } };
// ---- throw: lit, she lobs it underarm down the hall; it lands, rolls and keeps burning there
A.fl_throw={ start(ctx){ wStart(ctx,"flare"); ctx.T.cap=1; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t0=0.8, t1=1.25; let J=nStand(t,0.8);
    if(t>t1&&!T.thrown){ T.thrown=t; ctx.events.push({kind:"flareThrow"}); }
    const wind=sm5((t-t0)/(t1-t0-0.1))*(1-sm5((t-t1)/0.12)), thr=sm5((t-t1+0.12)/0.2)*(1-sm5((t-t1-0.5)/0.6));
    J.lLx=-0.4*thr; J.kL=0.3; J.lRx=0.3*wind; J.sp=0.15+0.1*thr; J.syaw=0.4*wind-0.2*thr; J.nx=0.1;
    ctx.atk={x:3.9,z:-0.2,yaw:-Math.PI/2,J:aStand(t)}; if(T.thrown){ const k=t-T.thrown; const sh=sm5((k-0.6)/0.4); ctx.atk.J.aLx=-1.4*sh; ctx.atk.J.eL=1.9*sh; ctx.atk.x=3.9+0.8*sm5((k-0.8)/1.5); }
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()); const back=S.clone().addScaledVector(P.fwd,-0.35).add(new V3(0,-0.45,0)).addScaledVector(P.right,0.15), rel=S.clone().addScaledVector(P.fwd,0.5).add(new V3(0,-0.05,0)), hold=S.clone().addScaledVector(P.fwd,0.3).add(new V3(0,-0.25,0)).addScaledVector(P.right,0.05);
      const tg= t<t0? hold : t<t1? hold.clone().lerp(back,wind) : t<t1+0.25? back.clone().lerp(rel,sm5((t-t1+0.05)/0.25)) : rel.clone().lerp(hold,sm5((t-t1-0.3)/0.7));
      armIK(runner,{side:"R",target:tg,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.35),w:1,tip:0.07}); };
    ctx.post2=()=>{ if(!T.thrown) flarePost2(ctx,1); else { W.flare.obj.visible=false; W.flare.light.intensity=0; lightLeft(null,1); } };
    ctx.phase= t<t0?"a lit flare": t<t1?"swings it back": !T.thrown||t-T.thrown<1?"lobs it underarm down the hall":"it burns on the floor · the dark ahead lit red"; ctx.camX=ctx.x+1.6; ctx.camD=6.2; return fin(J); } };

// ================================================================ FLARE GUN
function fgParts(open,cock,trig,shell){ const o=W.flaregun; o.barrel.rotation.z=0.75*open; o.hammer.rotation.z=(20-40*cock)*Math.PI/180; o.trig.rotation.z=0.4*trig; o.shell.visible=shell!=="none"; o.shell.children[0].material.color.set(shell==="spent"?0x5a2a20:0xb82a20); o.shell.position.x=shell==="out"?0.03:0; }
// ---- fire: she thumbs the hammer back, aims high, fires; the flare arcs out burning and lands far down, lighting the dark
A.fg_fire={ start(ctx){ wStart(ctx,"flaregun"); ctx.aimT=1.5; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t0=0.6, tc=1.0, tf=1.9; const aim=sm5((t-t0)/0.45); let J=mix(nStand(t,1),nAim(t,0.5),aim);
    if(t>tf&&!T.f){ T.f=t; ctx.events.push({kind:"fgShot"}); }
    const k=T.f?t-T.f:-1, kick=k>=0?0.45*Math.exp(-k/0.1)*sat(k/0.02):0, cock=t<tc?0:t<tc+0.2?sm5((t-tc)/0.2):k>=0?0:1, trig=k>=0?sat(1-(k-0.05)/0.15):t>tf-0.12?sm5((t-tf+0.12)/0.12):0;
    J.nx-=0.12*(k>=0?Math.exp(-k/0.3):0);
    const at=runner.group.position.clone().addScaledVector(P.fwd,8).setY(3.0), H={aim,amp:tremor(ctx,dt,aim>0.99),kick,at}; ctx.H=H;
    ctx.post=()=>holdPost(ctx,H); ctx.post2=()=>{ fgParts(0,cock,trig,k>=0?"spent":"live"); const R=palm("R"), f=(ctx.aimF||P.fwd); inHand("flaregun",f.clone().lerp(R.d.clone().multiplyScalar(0.55).add(P.fwd.clone().multiplyScalar(0.8)).normalize(),1-aim).normalize(),UP.clone().lerp(ctx.aimU||UP,aim)); const L=palm("L"); LIGHT.visible=true; setProp(LIGHT,LGRIP,L.p,f.clone().lerp(P.fwd.clone().add(new V3(0,-0.38,0)),1-aim).normalize(),UP); SPOT.intensity=4; };
    const fx=ctx.fgF?ctx.fgF.m.position.x:ctx.x; ctx.camX= k>0? (ctx.x+fx)/2+0.4 : null; ctx.camD= k>0? Math.max(5.6,(fx-ctx.x)*1.05+2) : null;
    ctx.phase= t<t0?"a flare gun": t<tc?"up, aimed high": t<tf?"thumbs the hammer back": k<1.2?"fires · the flare arcs out burning":"it lands far down and burns · the dark lit red"; return fin(J); } };
// ---- reload: breaks it open, the spent shell slides out and drops, a fresh flare shell from her pocket in, snaps it shut
A.fg_load={ start(ctx){ wStart(ctx,"flaregun"); },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t1=0.5, t2=0.9, t3=1.8, t4=2.2; let J=nStand(t,0.8); J.nx=0.38; J.sp=0.24;
    const open= t<t1?0: t<t1+0.2? sm5((t-t1)/0.2) : t<t4? 1 : 1-sm5((t-t4)/0.12);
    if(t>t2&&!T.ex){ T.ex=1; ctx.events.push({kind:"fgEject"}); } if(t>t3&&!T.in){ T.in=1; }
    const back=sm5((t-t4-0.3)/0.45), chest=runner.B.chest.getWorldPosition(new V3()).addScaledVector(P.fwd,0.32).addScaledVector(P.right,0.05).add(new V3(0,-0.04,0)), pocket=runner.B.hips.getWorldPosition(new V3()).addScaledVector(P.right,-0.17).addScaledVector(P.fwd,0.06);
    const gF=P.fwd.clone().addScaledVector(P.right,-0.4).add(new V3(0,0.15,0)).normalize();
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
      armIK(runner,{side:"R",target:chest,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.18),w:1-back,tip:0.075});
      const breech=W.flaregun.barrel.localToWorld(new V3(0.0,0.017,0)), lh= t<t1-0.1? null : t<t2+0.2? breech : t<t3? (t<t2+0.6? breech.clone().lerp(pocket,sm5((t-t2-0.2)/0.4)) : pocket.clone().lerp(breech,sm5((t-t2-0.75)/0.35))) : t<t4+0.15? breech : null;
      if(lh) armIK(runner,{side:"L",target:lh,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.18),w:1-back,tip:0.075});
      if(back>0) holdPost(ctx,{aim:back,amp:0.02,at:runner.group.position.clone().addScaledVector(P.fwd,5).setY(1.4)}); };
    ctx.post2=()=>{ fgParts(open,0,0,T.in?"live":T.ex?"none":"spent"); const R=palm("R"); inHand("flaregun",back>0.3?(ctx.aimF||P.fwd):gF,UP); propsPost(ctx,{gun:"gone",light:t>0.2&&back<0.5?"tuck":"hand",aim:back});
      if(!ctx.fs) ctx.fs=ammo("fshell"); ctx.fs.visible=t>t2+0.5&&t<t3; if(ctx.fs.visible){ const L=palm("L"); setProp(ctx.fs,new V3(0,0,0),L.p,gF,UP); } };
    ctx.phase= t<t1?"lowers it": t<t2?"breaks it open": t<t2+0.5?"the spent shell slides out and drops": t<t3?"a fresh flare from her pocket": t<t4?"slides it in":"snaps it shut · back up"; return fin(back>0?mix(J,nAim(t,0.7),back):J); } };

// ================================================================ the menu
const WCLIPS={shotgun:["sg_aim","sg_fire","sg_load"],rifle:["rf_aim","rf_fire","rf_load"],pistol:["ps_aim","ps_fire","ps_load"],hatchet:["hx_chop","hx_flurry"],crowbar:["cb_swing","cb_pry"],knife:["kn_slash","kn_free"],flare:["fl_strike","fl_throw"],flaregun:["fg_fire","fg_load"]};
const ORDERS={pl:[].concat(...Object.values(WCLIPS))};
const LEN={sg_aim:4.5,sg_fire:4.4,sg_load:5.0,rf_aim:4.8,rf_fire:5.2,rf_load:5.0,ps_aim:4.0,ps_fire:3.6,ps_load:4.0,hx_chop:3.6,hx_flurry:3.4,cb_swing:3.6,cb_pry:7.2,kn_slash:3.2,kn_free:4.0,fl_strike:5.0,fl_throw:5.6,fg_fire:6.0,fg_load:4.0};
const NAMES={sg_aim:"Shotgun · aim",sg_fire:"Shotgun · fire and pump",sg_load:"Shotgun · reload",rf_aim:"Rifle · aim",rf_fire:"Rifle · fire and bolt",rf_load:"Rifle · reload",ps_aim:"Pistol · aim",ps_fire:"Pistol · fire",ps_load:"Pistol · reload",
  hx_chop:"Hatchet · chop",hx_flurry:"Hatchet · flurry",cb_swing:"Crowbar · swing",cb_pry:"Crowbar · pry a door",kn_slash:"Knife · slash and stab",kn_free:"Knife · break a grab",fl_strike:"Road flare · strike",fl_throw:"Road flare · throw",fg_fire:"Flare gun · fire",fg_load:"Flare gun · reload"};
const DMG={doorShove:["SHOVE","her shoulder to it"],sgShot:["BOOM","12-gauge"],rfShot:["CRACK",".30-06"],psShot:["9mm",""],chop:["CHOP",""],bash:["CLANG",""],slash:["SLASH",""],stab:["STAB",""],grab:["GRABBED",""],knFree:["FREE","it lets go"],flareLit:["LIT","it backs off from the light"],doorGive:["IT GIVES",""],fgShot:["FLARE",""]};
const RCEV={
  sgShot(){ const m=wpt("shotgun","muzzle"); FLASH.position.copy(m); FLASH.intensity=7; puffAt(m,0.9); sparks(m,6,0xffd27a); shake=Math.max(shake,0.14); const c=tgtChest(); puffAt(c,0.8); BLOODsplat(c,14); },
  sgEject(){ const p=wpt("shotgun","port"), P=TP(); eject("shell",p,P.right.clone().multiplyScalar(1.6).add(new V3(0,1.4,0)).addScaledVector(P.fwd,-0.3)); },
  sgLoad(){ shake=Math.max(shake,0.01); },
  rfShot(){ const m=wpt("rifle","muzzle"); FLASH.position.copy(m); FLASH.intensity=7; puffAt(m,0.7); shake=Math.max(shake,0.12); const c=tgtChest(); puffAt(c,0.5); BLOODsplat(c,10); },
  rfEject(){ const p=wpt("rifle","port"), P=TP(); eject("case",p,P.right.clone().multiplyScalar(1.4).add(new V3(0,1.2,0))); }, rfLoad(){},
  psShot(e){ const m=wpt("pistol","muzzle"); FLASH.position.copy(m); FLASH.intensity=4.5; puffAt(m,0.3); shake=Math.max(shake,0.04); const p=wpt("pistol","port"), P=TP(); eject("case9",p,P.right.clone().multiplyScalar(1.8).add(new V3(0,1.6,0))); const c=tgtChest(); BLOODsplat(c,4); },
  magDrop(){ const o=W.pistol; o.obj.updateMatrixWorld(true); const m=o.mag.clone(); o.mag.getWorldPosition(m.position); o.mag.getWorldQuaternion(m.quaternion); scene.add(m); dropPiece(m,new V3(0,-0.4,0),new V3(1,0,2)); },
  magSeat(){ shake=Math.max(shake,0.02); }, slideRel(){ shake=Math.max(shake,0.02); },
  chop(){ const c=by.c.B.neck.getWorldPosition(new V3()); BLOODsplat(c,12); shake=Math.max(shake,0.1); }, bash(){ const c=by.c.B.head.getWorldPosition(new V3()); BLOODsplat(c,8); shake=Math.max(shake,0.12); },
  slash(){ BLOODsplat(by.c.B.chest.getWorldPosition(new V3()),6); }, stab(){ BLOODsplat(by.c.B.neck.getWorldPosition(new V3()),6); shake=Math.max(shake,0.05); }, grab(){ shake=Math.max(shake,0.1); }, knFree(){ shake=Math.max(shake,0.06); },
  flareLit(){ const o=W.flare; o.obj.updateMatrixWorld(true); sparks(o.obj.localToWorld(o.pts.tip.clone()),14,0xffc080); },
  flareThrow(){ const o=W.flare, P=TP(); o.obj.updateMatrixWorld(true); const p=o.obj.localToWorld(o.pts.tip.clone()); burningFlare(p,P.fwd.clone().multiplyScalar(3.4).add(new V3(0,2.0,0))); },
  doorGive(){ shake=Math.max(shake,0.14); puff(new V3(0.72,0,0.4),1); }, doorShove(){ shake=Math.max(shake,0.05); },
  fgShot(){ const m=W.flaregun.barrel.localToWorld(new V3(-0.13,0.017,0)), P=TP(); FLASH.position.copy(m); FLASH.intensity=5; puffAt(m,0.6); sparks(m,10,0xff8050); shake=Math.max(shake,0.06); const d=(ctx.aimF||P.fwd).clone(); ctx.fgF=burningFlare(m,d.multiplyScalar(9),0xff5a2a); },
  fgEject(){ const o=W.flaregun; const p=o.shell.getWorldPosition(new V3()); eject("fshell",p,new V3(0,-0.2,0)); } };


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

// ================================================================ Norah, live (the playground player)
// Her approved poses, composed from what the player is really doing each frame (ctx.S, set by the host):
//   S = {fwdV, sideV (m/s, her own frame), run, crouch, aim, aimAt (stage point), shots:[drive times], shotN, rounds,
//        click (time), reload (0..1 or null), dodge {t, side}, shove (time), hurt (time), stagger (time),
//        down {t, up (time she gets up)}, grabbed (bool), dead (time), light (bool), tier (0 fine .. 2 critical)}
const LIVE={}; let NX=3.2;   /* the creature pages keep a target here; Norah has none */
const LEN_W=1.15, LEN_R=2.1, LEN_C=0.85;
const ease=(D,k,to,r,dt)=>{ D[k]=(D[k]??to)+(to-(D[k]??to))*Math.min(1,dt*r); return D[k]; };
let PLVctx=null;
LIVE.drive={ start(ctx){ nStart(ctx,0); ctx.D={ph:0}; ctx.aimT=1.5; PLVctx=ctx; },
  step(t,dt,ctx){ const S=ctx.S||{}, D=ctx.D, P=TP(), fv=S.fwdV||0, sv=S.sideV||0, sp=Math.hypot(fv,sv);
    const L= S.run?LEN_R: S.crouch?LEN_C: LEN_W, dir= fv<-0.05&&Math.abs(fv)>=Math.abs(sv)?-1:1;
    D.ph=((D.ph+dir*sp*dt/L)%1+1)%1;
    const mv=ease(D,"mv",sp>0.12?1:0,8,dt), rn=ease(D,"rn",S.run?1:0,5,dt), cr=ease(D,"cr",S.crouch?1:0,6,dt);
    let aimTo=S.aim&&!S.reloadOn&&!S.grabbed&&S.dead==null?1:0; const aim0=ease(D,"aim",aimTo,aimTo?9:6,dt);
    // ---- the legs and body: stand, walk, run, crouch
    const f=0.75+0.12*(S.tier||0); let J=nStand(t,f); const h=look(J,dt,ctx,0.7*(1-aim0)*(1-mv*0.4));
    if(mv>0.01){ let W=hLegs(D.ph,nStand(t,0.8)); const s=Math.sin(D.ph*Math.PI*2); W.aLx+=0.05*s; W.aRx-=0.07*s; W.sp=0.14+0.05*(S.tier||0); W.hd=0.01;
      if(rn>0.01) W=mix(W,hRun(D.ph,t),rn); J=mix(J,W,mv); }
    if(cr>0.01) J=mix(J,mv>0.05?crouchWalk(D.ph,t):nCrouch(t),cr);
    // ---- the aim: the upper body goes into the hold; the legs keep doing what they do (forward, sideways, back)
    let aim=aim0;
    if(aim>0.01){ const A=nAim(t,0.4), U=mix(J,A,aim); if(mv>0.05){ for(const k of ["lLx","lRx","lLz","lRz","kL","kR","fL","fR","hd"]) U[k]=J[k];
        if(Math.abs(sv)>Math.abs(fv)){ const s=Math.sin(D.ph*Math.PI*2); U.lLx=A.lLx; U.lRx=A.lRx; U.lLz=(U.lLz||0)+0.18*Math.max(0,s); U.lRz=(U.lRz||0)+0.18*Math.max(0,-s); U.kL=A.kL+0.3*Math.max(0,s); U.kR=A.kR+0.3*Math.max(0,-s); } }
      J=U; }
    // ---- shots: the kick throws the aim up; the first after a pause makes her flinch hard; each nudges her back
    let kick=0, back=0, fl=0; const shots=S.shots||[];
    for(let i=0;i<shots.length;i++){ const s=shots[i], k=t-s; if(k<0||k>1.6) continue; const gap=i>0?s-shots[i-1]:9, fk=gap>1.5?1:gap>0.8?0.6:0.35;
      kick+=(0.32+0.12*fk)*Math.exp(-k/0.09)*sat(k/0.02); back+=0.05*Math.exp(-k/0.1)*sat(k/0.02); fl+=fk*Math.exp(-k/0.35)*sat(k/0.03); }
    J.nx-=0.22*fl; J.ny+=0.35*fl; J.sp-=0.12*fl; J.hd+=0.03*fl; J.aLz+=0.1*fl;
    // ---- the empty click: she starts
    if(S.click!=null){ const k=t-S.click, st=k>=0?Math.sin(sat(k/0.35)*Math.PI)*Math.exp(-k*2):0; J.sp-=0.08*st; J.nx-=0.1*st; }
    // ---- hit: a flinch away; a stagger back on stumbling steps
    if(S.hurt!=null){ const k=t-S.hurt, j=k>=0?Math.exp(-k/0.25)*sat(k/0.04):0; J.syaw-=0.45*j; J.sroll+=0.25*j; J.nx-=0.15*j; J.ny-=0.5*j; J.hyaw-=0.15*j; aim*=1-0.6*j; kick-=0.25*j; }
    if(S.stagger!=null){ const k=t-S.stagger; if(k>=0&&k<1.3){ const ph=(k/0.32)%1, s=Math.sin(ph*Math.PI*2), St=nStand(t,1); St.lLx=0.4*s; St.lRx=-0.4*s; St.kL=0.3+0.3*Math.max(0,s); St.kR=0.3+0.3*Math.max(0,-s); St.sp=-0.3*Math.exp(-k/0.4)+0.2; St.nx=-0.3*Math.exp(-k/0.3); St.aLx=-0.8; St.aRx=-0.7; St.aLz=0.45; St.aRz=0.4;
        const w=1-sm5((k-1.0)/0.3); J=mix(J,St,w); aim*=1-w; } }
    // ---- the dodge: she lurches aside on stumbling steps, arms out for balance, and comes back up on the aim
    if(S.dodge){ const k=t-S.dodge.t; if(k>=0&&k<1.6){ const wob=Math.sin(sat((k-0.15)/0.9)*Math.PI)*Math.exp(-k*0.9), sd=S.dodge.side||1, Sd=nStand(t,1), s1=sm5(k/0.2), s2=sm5((k-0.2)/0.24);
        Sd.kL=0.35+0.25*wob; Sd.kR=0.4+0.35*wob; Sd.sroll=(0.32*wob+0.12*wob)*sd; Sd.hroll=-0.12*wob*sd; Sd.sp=0.28+0.18*wob; Sd.nx=-0.15+0.1*wob;
        Sd.aLx=-0.9-0.4*wob; Sd.aLz=0.55; Sd.aRx=-0.75; Sd.aRz=0.5; Sd.eL=Sd.eR=0.7; Sd.lLz=0.25*s1*(1-s2)*sd; Sd.lRz=-0.2*s2*(1-sm5((k-0.6)/0.3))*sd;
        const w=1-sm5((k-1.1)/0.5); J=mix(J,Sd,w); aim*=1-w; } }
    // ---- the shove: both hands still full, she drives her forearms out into it
    let shoveW=0; if(S.shove!=null){ const k=t-S.shove; if(k>=-0.05&&k<0.8){ const push=sat(k/0.12)*(1-sm5((k-0.35)/0.35)); shoveW=1-sm5((k-0.5)/0.3); const Sh=nStand(t,1); Sh.lLx=-0.55*push; Sh.kL=0.45; Sh.lRx=0.35; Sh.sp=0.3+0.25*push; Sh.hz=0.12*push; Sh.nx=0.1; J=mix(J,Sh,shoveW); aim*=1-shoveW; D.push=push; } }
    // ---- knocked down: over backward, dazed on the floor, rolls up and gets up
    if(S.down){ const k=t-S.down.t; const st=NP.stumble(), sit=NG.sit(), lie=NG.lie(t,0.5); sit.aLx=sit.aRx=-0.9; sit.eL=sit.eR=0.4; sit.nx=0.35; lie.nx=0.4;
      const a1=Math.pow(sat(k/0.38),2), a2=Math.pow(sat((k-0.38)/0.3),2); let Dn= k<0.12? mix(J,st,sm5(k/0.12)) : k<0.38? mix(st,sit,a1) : k<0.68? mix(sit,lie,a2) : lie;
      if(S.down.up!=null){ const u=sat((t-S.down.up)/1.2); Dn=u<1?NG.up(t,u):Dn; if(u>0.3) ctx.onLimbs=true; if(u>=1) Dn=J; }
      J=Dn; aim=0; }
    // ---- grabbed: struggling, her forearms braced against it
    let held=0; if(S.grabbed){ const n=s=>noise(t*12,s)*0.12, G=nStand(t,1); G.sp=-0.2+n(1); G.nx=-0.35+n(2); G.ny=0.3; G.lLx=-0.45; G.kL=0.4; G.lRx=0.3; G.kR=0.35; J=G; aim=0; held=1; }
    // ---- dead: her knees go and she drops onto them, sways there a moment, then keels forward and lies flat on her face
    let dead=null; if(S.dead!=null){ const k=t-S.dead, kn=NQknees(t), sl=sm5(k/0.45); aim=0;
      const kw=P0(), sw=sm5((k-0.45)/0.6);    /* on both knees, shins flat behind her, slumping */
      kw.hd=HIP0()-0.5; kw.hz=-0.04; kw.lLx=kw.lRx=-0.02; kw.lLz=0.06; kw.lRz=-0.06; kw.kL=kw.kR=1.62; kw.fL=kw.fR=0.95;
      kw.sp=0.22+0.14*sw+0.03*Math.sin(k*5); kw.nx=0.55+0.4*sw; kw.hroll=0.03*Math.sin(k*3.3);
      kw.aLx=kw.aRx=-0.08; kw.aLz=0.12; kw.aRz=0.1; kw.eL=kw.eR=0.15;
      J=mix(J,kw,sl);
      if(k>1.15){ const pr=P0(); pr.hd=HIP0()-0.1; pr.hz=0.42; pr.hp=1.66; pr.sp=0.05; pr.nx=0.3; pr.lLx=pr.lRx=-0.1; pr.ny=1.15; pr.nz=0.25;     /* face down, cheek to the floor */
        pr.lLz=0.1; pr.kL=0.04; pr.kR=0.1; pr.fL=pr.fR=0.9; pr.lLz=0.1; pr.lRz=-0.12;
        pr.aLx=0.15; pr.aRx=0.05; pr.aLz=0.35; pr.aRz=0.28; pr.eL=0.35; pr.eR=0.2;
        const u=Math.pow(sat((k-1.15)/0.5),2), b=k>1.65?0.05*Math.exp(-(k-1.65)*9)*Math.sin((k-1.65)*30):0;   /* falls like a dead weight; one small bounce as she lands */
        J=mix(kw,pr,u); J.hd-=b; J.hp+=b*0.6; }
      dead={gun:k>0.45?"gone":"hand",light:k>0.75?"gone":"hand"}; }
    // ---- any weapon but the revolver: its own approved clips (the hold, the shot, the load, the swing), legs from above
    if(S.wpn&&S.wpn!=="revolver"&&S.dead==null&&!S.grabbed&&!S.down){ const wr=weaponPose(t,dt,ctx,S,D,J,mv,aim0); if(wr) return wr; }
    else if(D.wk){ hideWeapons(); D.wk=null; D.sub=null; }
    // ---- the reload: the approved sequence, run at the playground's reload speed
    if(S.reload!=null&&S.dead==null&&!S.grabbed&&!S.down){ if(!D.rT){ D.rT={}; } const T0=ctx.T, P0x=ctx.post, P2=ctx.post2; ctx.T=D.rT; ctx.out="calm"; const R=A.reload.step(S.reload*6.4,dt,ctx); D.rT=ctx.T; ctx.T=T0;
      const RL=R; for(const k of ["lLx","lRx","lLz","lRz","kL","kR","fL","fR","hd"]) RL[k]=J[k]; ctx.phase="reloads"; return RL; }
    if(D.rT){ D.rT=null; if(ctx.rnd) ctx.rnd.visible=false; }
    // ---- the revolver's working parts, the light
    const G=gunCycle(t,shots.slice(-6)); const n=S.shotN||0, cylA=(n+(G.cylA*5/(Math.PI*2)-G.n))*Math.PI*2/5;
    const live=clamp(S.rounds??5,0,5), ch=[0,1,2,3,4].map(i=>i<live?"live":"spent");
    const H= dead? {aim:0,gun:dead.gun,light:dead.light} : {aim,amp:tremor(ctx,dt,mv<0.05&&fl<0.05)+0.004*(S.tier||0),kick,back,at:S.aimAt,trig:G.trig,cock:Math.max(G.cock,S.cock||0),cylA,ch,lightOn:S.light?1:0,sweep:h*0.8};
    if(S.click!=null&&t-S.click<0.2) H.trig=Math.max(H.trig,1-sat((t-S.click)/0.2));
    hands(ctx,H);
    if(shoveW>0.01||held){ const Hh=ctx.H, w=Math.max(shoveW,held), push=D.push||0;
      ctx.post=()=>{ holdPost(ctx,Hh); const Sr=runner.R.armR.getWorldPosition(new V3()), Sl=runner.R.armL.getWorldPosition(new V3()), tg=runner.B.chest.getWorldPosition(new V3()).addScaledVector(P.fwd,held?0.42:0.25+0.25*push);
        armIK(runner,{side:"R",target:tg.clone().addScaledVector(P.right,0.12),pole:Sr.clone().add(new V3(0,-0.5,0)).addScaledVector(P.right,0.18),w,tip:0.075});
        armIK(runner,{side:"L",target:tg.clone().addScaledVector(P.right,-0.12),pole:Sl.clone().add(new V3(0,-0.5,0)).addScaledVector(P.right,-0.18),w,tip:0.075}); }; }
    ctx.phase= dead?"dead": S.down?"down": held?"grabbed": aim>0.5?"on the aim": mv>0.5?(rn>0.5?"runs":"walks"):"idle";
    return fin(J); } };
LIVE.muzzle=()=>muzzleAt();
// her abdomen, in her stage (where the blood comes from when she lies dead)
LIVE.abdomen=()=>{ runner.group.updateMatrixWorld(true); const h=runner.B.hips.getWorldPosition(new V3()), c=runner.B.chest.getWorldPosition(new V3()); return h.lerp(c,0.35); };
LIVE.props=()=>({GUN,LIGHT,SPOT});

// ---------------------------------------------------------------- the other weapons
// hold: the clip and time that is her ready (or aimed) hold; act: the clips her actions play, from..to (s)
const WPN={
  shotgun:{hold:k=>["sg_aim",0.8+0.5*k], fire:["sg_fire",0.8,2.25], load:["sg_load",0,4.6]},
  rifle:{hold:k=>["rf_aim",0.8+0.6*k], fire:["rf_fire",0.9,2.95], load:["rf_load",0,4.6]},
  pistol:{hold:k=>["ps_aim",0.8+0.45*k], fire:["ps_fire",0.85,1.3], load:["ps_load",0,3.2]},
  flaregun:{hold:k=>["fg_fire",0.6+0.4*k], fire:["fg_fire",1.75,3.4], load:["fg_load",0,3.6]},
  hatchet:{hold:()=>["hx_chop",0.3], fire:["hx_chop",0.55,2.4], flurry:["hx_flurry",0.5,2.9]},
  crowbar:{hold:()=>["cb_swing",0.3], fire:["cb_swing",0.55,2.5], pry:["cb_pry",0.4,6.4]},
  knife:{hold:()=>["kn_slash",0.3], fire:["kn_slash",0.75,2.2]},
  flare:{hold:()=>["fl_strike",0.3], light:["fl_strike",0.3,2.6], lit:["fl_strike",3.4], fire:["fl_throw",0.6,2.2]} };
function hideWeapons(){ if(typeof W!=="undefined") for(const q in W) if(W[q]&&W[q].obj) W[q].obj.visible=false; if(typeof TL!=="undefined"&&TL) TL.visible=false; }
function subStart(c,ctx,place){ const keep={x:ctx.x,z:ctx.z,yaw:ctx.yaw,ph:ctx.ph,look:ctx.look,D:ctx.D,S:ctx.S,aimT:ctx.aimT,T:ctx.T}; A[c].start(ctx); if(place){ keep.x=ctx.x; keep.z=ctx.z; keep.yaw=ctx.yaw; } const st={}; for(const q of ["shots","out","mash","s0","yaw0"]) if(ctx[q]!==undefined) st[q]=ctx[q]; Object.assign(ctx,keep); return st; }
function runSub(c,tc,dt,ctx,T,st,place){ const keep={x:ctx.x,z:ctx.z,yaw:ctx.yaw,ph:ctx.ph,look:ctx.look,D:ctx.D,S:ctx.S}; const T0=ctx.T; ctx.T=T; if(st) Object.assign(ctx,st); const J=A[c].step(tc,dt,ctx); ctx.T=T0; if(place){ keep.x=ctx.x; keep.z=ctx.z; keep.yaw=ctx.yaw; } Object.assign(ctx,keep); return J; }
function weaponPose(t,dt,ctx,S,D,Jb,mv,aimK){ const k=S.wpn, Wd=WPN[k]; if(!Wd) return null;
  if(D.wk!==k){ const keep={look:ctx.look,D:ctx.D,S:ctx.S,aimT:ctx.aimT}; wStart(ctx,k); Object.assign(ctx,keep); D.wk=k; D.sub=null; D.lastAct=null; D.hc=null; }
  // a new action from the host: start its clip
  const act=S.act; if(act&&act.id!==D.lastAct){ D.lastAct=act.id; if(act.kind==="cancel"){ D.sub=null; } const c=Wd[act.kind]; if(c){ const place=act.kind==="pry"; D.sub={c:c[0],from:c[1],to:c[2],t0:t,T:{},kind:act.kind,dur:act.dur,place,st:subStart(c[0],ctx,place)}; if(place){ D.pryX=ctx.x; D.pryZ=ctx.z; D.pryYaw=ctx.yaw; } if(act.kind==="fire"&&k==="flare") D.sub.T.cap=1; } }
  let J=null, sub=D.sub;
  if(sub&&sub.kind==="load"){ if(S.reload==null) { D.sub=sub=null; } }
  if(sub){ let tc; if(sub.kind==="load") tc=sub.from+(S.reload||0)*(sub.to-sub.from); else tc=sub.from+(t-sub.t0)*(sub.dur?(sub.to-sub.from)/sub.dur:1);
    if(tc>sub.to&&sub.kind!=="load"){ D.sub=sub=null; } else { J=runSub(sub.c,Math.min(tc,sub.to),dt,ctx,sub.T,sub.st,sub.place); if(sub.place){ D.pryX=ctx.x; D.pryZ=ctx.z; D.pryYaw=ctx.yaw; D.doorAng=DOOR?Math.abs(DOOR.leaf.rotation.y):0; if(DOOR) DOOR.visible=false; } } }
  if(!sub&&D.pryX!=null){ D.pryX=null; ctx.x=0; ctx.z=0; ctx.yaw=Math.PI/2; }
  if(!J){ const h= k==="flare"&&S.lit? Wd.lit : Wd.hold(aimK); D.holdT=D.holdT||{}; if(k==="flare"&&S.lit){ D.holdT.cap=1; D.holdT.lit=D.holdT.lit||0.01; } if(D.hc!==h[0]){ D.hc=h[0]; D.hst=subStart(h[0],ctx); } J=runSub(h[0],h[1],dt,ctx,k==="flare"&&S.lit?D.holdT:{},D.hst); }
  // the legs keep walking under it
  if(mv>0.05) for(const q of ["lLx","lRx","lLz","lRz","kL","kR","fL","fR","hd"]) J[q]=Jb[q];
  ctx.phase=(sub?sub.kind:"holds")+" · "+k; return J; }
LIVE.wmuzzle=k=>{ const o=W[k]; if(!o) return null; o.obj.updateMatrixWorld(true); return o.obj.localToWorld((o.pts.muzzle||o.pts.tip||new V3()).clone()); };
LIVE.wtip=k=>{ const o=W[k]; if(!o) return null; o.obj.updateMatrixWorld(true); return o.obj.localToWorld((o.pts.tip||o.pts.muzzle||new V3()).clone()); };
LIVE.pryState=()=>{ const D=PLVctx&&PLVctx.D; return D&&D.pryX!=null?{x:D.pryX,z:D.pryZ,yaw:D.pryYaw,door:D.doorAng||0,on:!!(D.sub&&D.sub.kind==="pry")}:null; };
LIVE.itemModel=k=>{ const key=WX[k]?"w_"+k:k; if(!ITEMS[key]) return null; const g=buildItem(key); if(g.parent) g.parent.remove(g); return g; };
LIVE.loose=()=>({pieces:PIECES, blood:BLOOD, flares:FLARES});
LIVE.flareStep=dt=>{ if(typeof flareStep==="function") flareStep(dt); };

return { A, LIVE, makeChar, pvPrep:(typeof pvPrep==="function"?pvPrep:null), pvPost:(typeof pvPost==="function"?pvPost:null), pvSetup, pvBind, pvStep, pvFx, PHYS, P0, mix, PVHOOK, get NX(){ return NX; } };
})();
