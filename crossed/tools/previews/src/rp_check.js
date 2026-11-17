
"use strict";
// ---------------------------------------------------------------- scene
const canvas=document.getElementById("c");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true}); renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0e0d0c); scene.fog=new THREE.Fog(0x0e0d0c,14,34);
const cam=new THREE.PerspectiveCamera(36,1,0.05,100);
scene.add(new THREE.HemisphereLight(0xd8dce6,0x2a2218,0.85));
const sun=new THREE.DirectionalLight(0xfff0dd,0.7); sun.position.set(-3,6,5); scene.add(sun);
// the track: concrete with metre marks
(function(){ const c=document.createElement("canvas"); c.width=c.height=256; const g=c.getContext("2d");
  g.fillStyle="#2a2724"; g.fillRect(0,0,256,256); for(let i=0;i<900;i++){ g.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},${Math.random()<.5?0:255},0.035)`; g.fillRect(Math.random()*256,Math.random()*256,2,2); }
  g.strokeStyle="rgba(255,255,255,0.07)"; g.lineWidth=2; g.strokeRect(0,0,256,256);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(40,40);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshLambertMaterial({map:t})); fl.rotation.x=-Math.PI/2; scene.add(fl);
  for(let x=-9;x<=7;x++){ const m=new THREE.Mesh(new THREE.PlaneGeometry(0.03,x%5===0?0.7:0.35),new THREE.MeshBasicMaterial({color:x%5===0?0xd8723a:0x6a6158})); m.rotation.x=-Math.PI/2; m.position.set(x,0.003,-1.2); scene.add(m);
    if(x%5===0){ const lc=document.createElement("canvas"); lc.width=64; lc.height=32; const lg=lc.getContext("2d"); lg.fillStyle="#d8723a"; lg.font="20px monospace"; lg.fillText(x+" m",4,22);
      const s=new THREE.Mesh(new THREE.PlaneGeometry(0.6,0.3),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(lc),transparent:true})); s.rotation.x=-Math.PI/2; s.position.set(x+0.3,0.004,-1.75); scene.add(s); } } })();
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
A.neutral={ start(ctx){ ctx.x=-1; ctx.yaw=Math.PI/2; ctx.norah=false; ctx.sniffT=1.4; },
  step(t,dt,ctx){ const J=restless(t,dt,ctx); ctx.phase="scanning";
    // it sniffs: chin up, a burst of tiny fast jerks of the head, the body frozen under it
    ctx.sniffT-=dt; if(ctx.sniffT<-0.9) ctx.sniffT=1.8+Math.random()*1.6;
    if(ctx.sniffT<0){ const u=Math.sin(sat(-ctx.sniffT/0.9)*Math.PI); ctx.phase="sniffing the air"; J.nx-=0.35*u; J.hdx=-0.25*u+0.07*u*Math.sign(Math.sin(t*58)); J.sp-=0.08*u;
      ctx.levelHead={yaw:S.head.x*0.9, pitch:-0.38*u+0.06*u*Math.sign(Math.sin(t*58))}; }
    else ctx.levelHead={yaw:S.head.x*0.9};   /* the head never bobs or rolls with the shuffles */
    return J; } };
A.walk={ start(ctx){ ctx.x=-7; ctx.yaw=Math.PI/2; ctx.dir=1; ctx.ph=0; ctx.turn=0; ctx.norah=false; },
  step(t,dt,ctx){
    if(ctx.turn>0){ ctx.turn-=dt; const u=1-ctx.turn/0.7; ctx.yaw=ctx.yaw0+Math.PI*ss(u); ctx.phase="turn"; const r=restless(t,dt,{}); r.ny=0; return r; }
    const T=1.05; const prev=ctx.ph; ctx.ph=(ctx.ph+dt/T)%1;
    if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.6});
    const {J,imp}=walkPose(ctx.ph); ctx.levelHead={yaw:0}; ctx.v=1.85*(0.82+0.36*Math.max(0,1-(ctx.ph%0.5)/0.25)); ctx.x+=ctx.dir*ctx.v*dt; ctx.phase="stride";
    if((ctx.dir>0&&ctx.x>4)||(ctx.dir<0&&ctx.x<-7)){ ctx.dir*=-1; ctx.turn=0.7; ctx.yaw0=ctx.yaw; }
    return J; } };
function attackClip(kind){ return {
  start(ctx){ ctx.x = kind==="kick"? 1.75 : kind==="stomp"? 2.2 : -6.5; ctx.stomped=0; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.nx=3.2; ctx.ph=0; ctx.v=0; ctx.hit=0; ctx.done=-1; },
  step(t,dt,ctx){
    const isKick = kind==="kick"||kind==="stomp", tA = isKick? 0.9 : 1.0, tC = kind==="butt"? 0.45 : 0.55;
    if(t<tA){ ctx.phase="restless"; return restless(t,dt,{}); }
    if(!isKick){
      if(t<tA+tC){ const c=ss((t-tA)/tC); ctx.phase="charge"; ctx.v=0; return chargePose(c,t,kind==="butt"); }
      const stopAt = kind==="butt"? ctx.nx-0.62 : ctx.nx-1.15;
      if(ctx.done<0){
        const tb=t-tA-tC; ctx.ghost=true;
        const vmax = kind==="butt"? 7.6 : 8.2; ctx.v=Math.min(vmax, vmax*easeOut(tb/0.32)+1.5);
        const prev=ctx.ph; ctx.ph=(ctx.ph+dt/0.44)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:1});
        ctx.x+=ctx.v*dt; ctx.phase="burst";
        const sh = kind==="butt"? 1 : 0; const {J}=sprintPose(ctx.ph,null,sh); ctx.levelHead={yaw:0};
        if(tb<0.12){ const c=chargePose(1,t,kind==="butt"); return mix(c,J,ss(tb/0.12)); }
        if(ctx.x>=stopAt){ ctx.x=stopAt; ctx.done=t; if(kind==="butt"){ ctx.events.push({kind:"impact",strength:1}); ctx.hit=1; } else ctx.events.push({kind:"skid"}); }
        return J; }
      const td=t-ctx.done; ctx.v=0;
      if(kind==="butt"){ ctx.ghost=td<0.12; ctx.phase= td<0.35?"impact":"recover";
        const {J}=sprintPose(0.08,null,1); J.syaw=0.95; J.sroll=0.42; J.hz=0.18*Math.exp(-td*6); J.sp=0.5; J.lLx=-0.75; J.kL=0.45; J.lRx=0.6; J.kR=0.35; J.fR=-0.4;
        const cave=Math.min(1,td/0.06)*(td<1.05?1:Math.max(0,1-(td-1.05)/0.05));                 /* caved in, until it pops back */
        const r=td<0.35?null:restless(t,dt,{}); const K=r?mix(J,r,ss((td-0.35)/0.6)):J;
        K.aRz-=0.6*cave; K.aRx+=0.15*cave; K.eR=K.eR*(1-cave)+0.05*cave; K.sroll+=0.22*cave; K.aRy+=1.1*cave; K.syaw-=0.25*cave;   /* the shoulder collapses forward and in, the arm hanging dead across the front */
        if(td>=1.05&&!ctx.pop){ ctx.pop=1; ctx.events.push({kind:"pop"}); ctx.ghost=true; } if(td>0.35&&td<1.05) ctx.phase="shoulder caved in";
        return K; }
      ctx.ghost=td<0.1; ctx.phase= td<0.4?"skid":"halt";                                     // sprint: digs in and skids to a stop
      const J=P0(); const k=Math.exp(-td*5); J.hp=-0.22*(1-k)+0.1; J.sp=0.1; J.hd=0.16; J.lLx=-0.75; J.kL=0.2; J.fL=0.2; J.lRx=0.55; J.kR=0.9; J.fR=-0.4;
      J.aLx=-0.6; J.aLz=0.55; J.aRx=0.3; J.aRz=0.5; J.eL=0.5; J.eR=0.7; J.nx=-0.15; ctx.x+=1.2*k*dt*4;
      if(td<0.6) return J; const r=restless(t,dt,{}); return mix(J,r,ss((td-0.6)/0.5)); }
    // the kick: chamber, hold shaking, then force the leg out straight
    const tc=t-tA, tChamber=0.38, tHold=0.16, tStrike=0.09, tStay=0.2, tBack=0.45;
    const CH=P0(); CH.hd=0.05; CH.lRx=-2.25; CH.kR=2.75; CH.fR=0.6; CH.kL=0.28; CH.lLx=-0.05; CH.fL=-0.1; CH.sp=-0.18; CH.hp=-0.08; CH.nx=0.12;
    CH.aLx=-0.35; CH.aLz=0.65; CH.aRx=0.25; CH.aRz=0.55; CH.eL=0.6; CH.eR=0.7; CH.hroll=-0.06;
    if(tc<tChamber+tHold){ const c=ss(tc/tChamber); const J=mix(restless(t,dt,{}),CH,c); ctx.phase= tc<tChamber?"chamber":"charged";
      if(tc>=tChamber){ const tr=noise(t*45,7)*0.06; J.lRx+=tr; J.kR+=tr*1.3; J.sp+=tr*0.4; } ctx.footBack={L:-2.6*ss((tc-0.15)/(tChamber+tHold-0.15))}; return J; }
    const ST=P0(); Object.assign(ST,CH); ST.lRx=-1.55; ST.kR=0.0; ST.fR=-0.35; ST.hz=0.32; ST.sp=-0.36; ST.hp=-0.12; ST.aLx=0.35; ST.aLz=0.5; ST.aRx=0.55; ST.aRz=0.35; ST.nx=0.05; ST.kL=0.34;
    if(kind==="stomp"){ ST.lRx=-0.62; ST.kR=0.08; ST.fR=-0.05; ST.hd=0.17; ST.hz=0.34; ST.sp=0.36; ST.hp=0.14; ST.nx=0.4; ST.aLx=0.45; ST.aRx=0.4; ST.aLz=0.35; ST.aRz=0.35; ST.kL=0.55; }
    const ts=tc-tChamber-tHold;
    if(kind==="stomp" && ctx.hit){ const u=sat((ts-tStrike)/0.22); ctx.nOver={J:mix(NP.stand(),NP.kneel(t),easeOut(u)), x:norah.x, jolt:Math.max(0,1-u*3)}; }
    ctx.footBack={L: ts<tStrike+tStay ? -2.6 : -2.6*(1-ss((ts-tStrike-tStay)/0.12))};   /* snaps back round under it on the way down */
    if(ts<tStrike){ ctx.ghost=true; ctx.phase="strike"; return mix(CH,ST,easeIn(ts/tStrike)); }
    if(!ctx.hit){ ctx.hit=1; ctx.events.push({kind:kind==="stomp"?"stompHit":"impact",strength:0.9}); }
    if(ts<tStrike+tStay){ ctx.ghost=ts<tStrike+0.08; ctx.phase="extended"; const J=Object.assign({},ST); const tr=noise(t*40,3)*0.025; J.lRx+=tr; return J; }
    const tb=ts-tStrike-tStay; ctx.phase= tb<tBack?"stomp down":"recover";
    const DN=P0(); DN.lRx=kind==="stomp"?-0.55:-0.45; DN.kR=0.1; DN.lLx=0.35; DN.kL=0.3; DN.hd=0.1; DN.hz=0.3; DN.sp=0.25; DN.aLx=0.3; DN.aRx=-0.3; DN.eL=DN.eR=0.9; DN.aLz=DN.aRz=0.2;
    if(tb<0.22){ const u=easeIn(tb/0.22); const J=mix(ST,DN,u); if(tb+dt>=0.22&&!ctx.stomped){ ctx.stomped=1; ctx.events.push({kind:"stomp",side:"R",strength:1}); } return J; }
    const r=restless(t,dt,{}); return mix(DN,r,ss((tb-0.22)/0.5)); } }; }
A.sprint=attackClip("sprint"); A.butt=attackClip("butt"); A.kick=attackClip("kick"); A.stomp=attackClip("stomp");
// legs move the body: walking pins the stance foot; sprinting adds flight between strides
const WALKPHYS={ active:ctx=>!(ctx.turn>0), stance:ctx=>strideStance(ctx.ph,WALK), traction:9, imp:0.6, rollK:0.4 };
const RUNPHYS={ active:ctx=>ctx.phase==="burst", stance:ctx=>strideStance(ctx.ph,RUN), flight:true, bounce:0.45, traction:10, imp:0.9, rollK:0.3, leanW:9 };
A.walk.phys=WALKPHYS; A.sprint.phys=RUNPHYS; A.butt.phys=RUNPHYS;
// Norah's poses for being grabbed, crushed, dropped and stamped on
const NP={
  stand(){ const J=P0(); J.aLx=-0.25; J.aRx=-0.5; J.eL=0.5; J.eR=0.9; J.aLz=0.12; J.aRz=0.1; J.kL=J.kR=0.08; J.lLx=-0.08; J.lRx=0.08; return J; },
  held(t){ const J=P0(), n=s=>noise(t*14,s)*0.14; J.aLx=0.05+n(1); J.aRx=0.05+n(2); J.aLz=-0.02; J.aRz=-0.02; J.eL=0.6+n(3); J.eR=0.7+n(4); J.sp=-0.15+n(5)*0.5; J.syaw=n(6); J.nx=-0.25+n(7); J.kL=0.25; J.kR=0.15; J.lLx=-0.12; J.lRx=0.18; J.fL=J.fR=0.2; return J; },
  crushed(t,k){ const J=P0(), n=s=>noise(t*30,s)*0.06*(0.5+k); J.aLx=0.1+n(1); J.aRx=0.1+n(2); J.aLz=0; J.aRz=0; J.eL=0.9+n(3); J.eR=0.9+n(4); J.sp=-0.25-0.35*k+n(5); J.hp=0.1+0.15*k; J.nx=-0.45-0.4*k+n(6); J.ny=n(7); J.lLx=-0.25+n(8); J.lRx=0.05+n(9); J.kL=0.45; J.kR=0.35; J.fL=J.fR=0.55; return J; },
  kneel(t){ const J=P0(); J.hd=0.42; J.hp=0.05; J.lLx=-1.25; J.kL=1.55; J.fL=-0.25; J.lRx=0.25; J.kR=1.8; J.fR=0.7; J.sp=0.5+0.04*Math.sin(t*5); J.nx=0.45; J.aLx=-0.75; J.aLz=-0.45; J.eL=1.9; J.aRx=-0.35; J.aRz=0.15; J.eR=0.4; return J; },
  stumble(){ const J=P0(); J.sp=-0.25; J.aLx=-0.9; J.aRx=-0.6; J.aLz=0.6; J.aRz=0.5; J.eL=J.eR=0.5; J.lLx=0.35; J.kL=0.3; J.lRx=-0.3; J.kR=0.2; J.nx=-0.2; return J; } };
const RP={
  // arms out to the side, swung forward, elbows bending round her back (the twist turns the elbow's hinge upright)
  // crouched chest to chest, arms locked all the way round her waist: hands meet behind her hips. sq 0→0.55 closes the lock, 0.55→1 lifts and crushes
  grab(t,sq){ const lock=Math.min(1,sq/0.55), lift=sat((sq-0.55)/0.45), n=s=>noise(t*26,s)*0.04*sq;
    const J=P0(); J.hd=0.34+0.02*lift; J.hp=0.15; J.sp=0.2-0.06*lift+n(1); J.nx=0.32; J.ny=0.5;
    J.aLz=J.aRz=1.38; J.aLy=J.aRy=-1.0-0.3*lock-0.12*lift+n(2); J.aLx=J.aRx=0.5+0.12*lift; J.eL=J.eR=1.4+0.35*lock+0.3*lift+n(3);
    J.lLx=-0.6; J.kL=1.0-0.25*lift; J.lRx=0.35; J.kR=1.0-0.2*lift; J.fR=-0.4; J.lLz=J.lRz=0.2; return J; },
  stunned(u){ const J=P0(); J.sp=-0.4*(1-u)+0.12*u; J.nx=-0.6*(1-u)+0.05; J.aLx=-0.9*(1-u)-0.25; J.aRx=-0.8*(1-u)-0.25; J.aLz=0.95*(1-u)+0.2; J.aRz=0.9*(1-u)+0.2; J.eL=J.eR=0.4+0.45*u; J.lLx=0.3*(1-u); J.kL=0.35; J.lRx=-0.1; J.kR=0.25; J.hd=0.08; return J; },
  lying(t){ const J=P0(); J.hp=-1.5; J.hd=runner.R.hip0-0.2; J.sp=-0.05; J.nx=0.35+0.1*Math.sin(t*3); J.lLx=0.2; J.kL=0.5; J.lRx=0.05; J.kR=0.2; J.aLx=-0.4; J.aLz=1.0; J.aRx=-0.2; J.aRz=0.9; J.eL=J.eR=0.4; return J; },
  crouch(){ const J=P0(); J.hd=0.38; J.hp=0.35; J.sp=0.35; J.lLx=-1.0; J.kL=1.9; J.lRx=-0.3; J.kR=2.1; J.fR=0.5; J.aLx=-0.6; J.aRx=0.2; J.aLz=0.4; J.aRz=0.3; J.eL=0.6; J.eR=0.3; J.nx=-0.1; return J; } };
function burstTo(t,dt,ctx,stopAt,vmax){ const tb=t-ctx.tb0; ctx.ghost=true; ctx.v=Math.min(vmax, vmax*easeOut(tb/0.32)+1.5);
  const prev=ctx.ph; ctx.ph=(ctx.ph+dt/0.44)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:1});
  ctx.x+=ctx.v*dt; ctx.phase="burst"; const {J}=sprintPose(ctx.ph,null,0);
  if(tb<0.12) return {J:mix(chargePose(1,t,false),J,ss(tb/0.12)), arrived:false};
  return {J, arrived:ctx.x>=stopAt}; }
let grabAlt=false; const nextOutcome=()=>{ const v=document.getElementById("oGrab").value; if(v==="alt"){ grabAlt=!grabAlt; return grabAlt?"free":"fail"; } return v; };
A.grab={ start(ctx){ ctx.x=-6.5; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.ph=0; ctx.v=0; ctx.done=-1; ctx.outcome=nextOutcome(); },
  step(t,dt,ctx){ const tA=1.0, tC=0.55;
    if(t<tA){ ctx.phase="restless"; return restless(t,dt,{}); }
    if(t<tA+tC){ ctx.phase="charge"; ctx.v=0; return chargePose(ss((t-tA)/tC),t,false); }
    if(ctx.tb0==null) ctx.tb0=tA+tC;
    if(ctx.done<0){ const r=burstTo(t,dt,ctx,norah.x-0.16,8.0); if(r.arrived){ ctx.x=norah.x-0.16; ctx.done=t; ctx.dragV=ctx.v*0.42; ctx.events.push({kind:"grabbed"}); } return r.J; }
    const td=t-ctx.done; ctx.v=ctx.dragV||0;
    if(ctx.dragV>0){ ctx.x+=ctx.dragV*dt; ctx.dragV=Math.max(0,ctx.dragV-6*dt); }                 // its momentum drags them both back
    const nX=ctx.x+0.16;
    if(td<1.6){ ctx.phase= td<0.4?"seized · dragged":"squeeze"; ctx.qte= td>0.35 ? sat((td-0.35)/1.25) : null; ctx.ghost=td<0.1;
      const sq=ss((td-0.3)/0.4)*0.55; ctx.nOver={J:NP.held(t), x:nX}; const k=ss((td-0.25)/0.3)+0.08*noise(t*30,2); ctx.claw={L:1.35*k,R:1.35*k}; return mix(sprintPose(0.1).J, RP.grab(t,sq), ss(td/0.12)); }
    ctx.qte=null; const u=td-1.6;
    if(ctx.outcome==="free"){ if(!ctx.res){ ctx.res=1; ctx.events.push({kind:"free"}); ctx.nX2=nX; }
      ctx.phase= u<0.45?"broke free · stunned":"steps away";
      ctx.x -= dt*(u<0.22?1.7:u<0.8?0.55:0); ctx.nX2 += dt*(u<0.3?1.3:0);
      const J=RP.stunned(ss(u/0.9)); if(u>0.3&&u<0.8){ const a=Math.sin((u-0.3)/0.5*Math.PI); J.lRx=0.55*a; J.kR=0.25+0.7*a; }
      ctx.nOver={J: u<0.6? NP.stumble() : mix(NP.stumble(),NP.stand(),ss((u-0.6)/0.5)), x:ctx.nX2};
      if(u<1.4) return J; return mix(J,restless(t,dt,{}),ss((u-1.4)/0.5)); }
    // she failed: it hugs her tight, lifts her and nearly crushes her, then lets her drop to a knee
    if(u<1.3){ if(!ctx.res){ ctx.res=1; ctx.events.push({kind:"crush"}); } ctx.phase="crushing"; const k=ss(u/0.35);
      ctx.squeeze=0.03*k; ctx.claw={L:1.45+0.1*noise(t*30,3),R:1.45+0.1*noise(t*31,5)}; const J=RP.grab(t,0.55+0.45*k); ctx.nOver={J:NP.crushed(t,k), x:nX, y:0.12*k}; return J; }
    const r=u-1.3; ctx.squeeze=0; ctx.phase= r<0.5?"release":"down on a knee"; if(!ctx.dropped){ ctx.dropped=1; ctx.events.push({kind:"drop"}); }
    const nJ = r<0.22? mix(NP.crushed(t,1),NP.stumble(),r/0.22) : mix(NP.stumble(),NP.kneel(t),ss((r-0.22)/0.3));
    ctx.nOver={J:nJ, x:nX+0.18*ss(r/0.3), y:0.14*Math.max(0,1-r/0.16)};
    const open=RP.stunned(1); open.sp=0.05; const J=mix(RP.grab(t,1),open,ss(r/0.35));
    if(r<1.0) return J; return mix(J,restless(t,dt,{}),ss((r-1.0)/0.5)); } };
A.drop={ start(ctx){ ctx.x=-7.8; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.ph=0; ctx.v=0; ctx.air=-1; ctx.y=0; ctx.vy=0; ctx.hitT=-1; ctx.landT=-1; },
  step(t,dt,ctx){ const tA=1.0, tC=0.45;
    if(t<tA){ ctx.phase="restless"; return restless(t,dt,{}); }
    if(t<tA+tC){ ctx.phase="charge"; ctx.v=0; return chargePose(ss((t-tA)/tC),t,false); }
    if(ctx.tb0==null) ctx.tb0=tA+tC;
    if(ctx.air<0){ const r=burstTo(t,dt,ctx,norah.x-3.35,8.6); if(r.arrived){ ctx.air=t; ctx.vy=3.1; ctx.events.push({kind:"stomp",side:"L",strength:1.4}); } return r.J; }
    const ta=t-ctx.air;
    ctx.vy-=9.8*dt; ctx.y=Math.max(0,ctx.y+ctx.vy*dt);
    if(ctx.hitT<0){                                                                                // airborne, feet first
      ctx.ghost=true; ctx.x+=ctx.v*dt; ctx.phase="leap"; const u=ss(ta/0.2);
      const J=P0(); J.hp=-1.35*u; J.hd=0.38*u; J.sp=0.25*u; J.nx=0.5*u; J.lLx=J.lRx=-0.15*u; J.kL=J.kR=1.5*(1-ss((ta-0.14)/0.12))+0.05; J.lLz=J.lRz=0.06;
      J.aLx=J.aRx=-1.2*u; J.aLz=J.aRz=0.7*u; J.eL=J.eR=0.4;
      if(ctx.x>=norah.x-1.32){ ctx.hitT=t; ctx.v=1.2; ctx.vy=Math.min(ctx.vy,0.5); ctx.events.push({kind:"dropImpact"}); }
      return J; }
    const th=t-ctx.hitT; ctx.x+=ctx.v*dt; ctx.v=Math.max(0,ctx.v-3*dt);
    if(ctx.y>0.001 && ctx.landT<0){ ctx.phase="impact"; ctx.ghost=th<0.1; const J=P0(); J.hp=-1.4; J.hd=0.38; J.sp=0.2; J.nx=0.45; J.kL=J.kR=0.05; J.lLx=J.lRx=-0.1; J.aLx=J.aRx=-1.4; J.aLz=J.aRz=0.8; return J; }
    if(ctx.landT<0){ ctx.landT=t; ctx.events.push({kind:"land"}); }
    const tl=t-ctx.landT; ctx.v=0;
    if(tl<0.9){ ctx.phase="down"; return RP.lying(t); }
    // it gets up without bending: the hip-pitch of lying becomes the whole body's pitch about its heels, then the plank pivots up
    const PL=()=>{ const J=P0(); J.aLz=J.aRz=0.06; J.eL=J.eR=0.05; J.nx=0.05; J.kL=J.kR=0; J.lLx=J.lRx=0; return J; };
    if(tl<1.2){ const a=ss((tl-0.9)/0.3); ctx.phase="goes rigid"; const J=mix(RP.lying(t),PL(),a); J.hp=-1.5*(1-a); J.hd=(runner.R.hip0-0.2)*(1-a); ctx.rise=-1.5*a; return J; }
    if(tl<2.5){ const u=(tl-1.2)/1.3, k=1-Math.pow(1-u,3); ctx.phase="rises stiff, on its heels"; ctx.rise=-1.5*(1-k); const J=PL(); const tr=noise(t*40,6)*0.012; J.sp+=tr; ctx.ghost=u>0.85; return J; }
    if(tl<2.75){ const u=(tl-2.5)/0.25; ctx.phase="head snaps forward"; const J=PL(); J.nx=0.05+0.5*Math.sin(u*Math.PI)*(u<0.5?1:0.3); return J; }
    ctx.phase="recover"; return mix(PL(),restless(t,dt,{}),ss((tl-2.75)/0.5)); } };
// ---- it mirrors her: every sidestep, every raised arm, as a reflection; later it starts each move before she does
A.mirror={ start(ctx){ ctx.x=0.6; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.mz={x:0,v:0}; ctx.hist=[]; ctx.ph=0; },
  step(t,dt,ctx){ const plan=t2=>{ const k=Math.floor(t2/1.1), f=t2/1.1-k; const pts=[0,0.7,0.7,-0.6,-0.6,0.2,0.9,0.9,-0.4,-0.4]; const a=pts[Math.min(k,pts.length-1)], b=pts[Math.min(k+1,pts.length-1)]; return a+(b-a)*ss(f*1.6); };
    const arm=t2=>t2>3.2&&t2<5.2?ss((t2-3.2)/0.4)*(1-ss((t2-4.8)/0.4)):0;
    const zN=plan(t), zN2=plan(t+dt), vN=(zN2-zN)/dt;
    // her: sidesteps, raises her gun arm, cocks her head
    const nJ=NP.stand(); const st=Math.abs(vN)>0.05?Math.sin(t*11):0; nJ.lLx=0.25*Math.max(0,st); nJ.kL=0.5*Math.max(0,st); nJ.lRx=0.25*Math.max(0,-st); nJ.kR=0.5*Math.max(0,-st);
    nJ.aRx=-1.45*arm(t); nJ.eR=0.15+0.6*(1-arm(t)); nJ.nz=0.25*Math.sin(t*0.9); ctx.nOver={J:nJ, x:3.2, z:zN};
    // it: the same, lagging a tenth of a second at first; by the end it moves a tenth of a second BEFORE her
    const lead=t<4.5?-0.12:0.12*ss((t-4.5)/1.5); const tm=Math.max(0,t+lead); const zR=plan(tm), vR=(plan(tm+dt)-zR)/dt;
    const J=restless(t,dt,{}); const s2=Math.abs(vR)>0.05?Math.sin(t*11):0; J.lLx=-0.12+0.25*Math.max(0,-s2); J.kL=0.32+0.5*Math.max(0,-s2); J.lRx=-0.12+0.25*Math.max(0,s2); J.kR=0.32+0.5*Math.max(0,s2);
    J.aLx=-1.45*arm(tm); J.eL=0.15+0.7*(1-arm(tm)); J.ny=0; J.nz=-0.25*Math.sin(tm*0.9); J.hdy=0;
    ctx.local={x:-zR, z:0}; ctx.v=Math.abs(vR); ctx.levelHead={yaw:0,roll:-0.25*Math.sin(tm*0.9)};
    ctx.phase= t<4.5?"mirrors her · a beat behind":"mirrors her · a beat ahead"; return J; } };
const LEN={neutral:7, walk:13, sprint:4.6, butt:4.8, kick:3.6, stomp:3.8, grab:6.6, drop:7.8, mirror:9};
const NAMES={mirror:"Mirrors her",neutral:"Neutral",walk:"Walk",sprint:"Sprint",butt:"Shoulder butt",kick:"Forward kick",stomp:"Stomp kick",grab:"Sprint grab",drop:"Drop kick"};
const DMG={butt:["NORAH −18","shoulder butt · knocked down"],kick:["NORAH −22","forward kick · knocked down"],stomp:["NORAH −26","stomp kick · down on her knees"],crush:["NORAH −40","crushed · dropped to a knee"],free:["BROKE FREE","the runner reels back a step"],drop:["NORAH −65","drop kick · thrown"]};
let dmgT=0; function showDmg(k){ const d=DMG[k]; if(!d) return; const el=document.getElementById("dmg"); el.innerHTML=`${d[0]}<small>${d[1]}</small>`; el.style.opacity=1; dmgT=1.6; }

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
const loader=new THREE.GLTFLoader(); const cache={};
const load=k=>cache[k]||(cache[k]=new Promise((res,rej)=>loader.load(k,res,undefined,rej)));
let runner=null, norah=null, cur="neutral", t=0, ctx={}, camMode="side", slow=false, ghostsOn=true, playAll=false;
const orbit={yaw:0.9,pitch:0.18,drag:null};
async function setModel(key){ document.getElementById("load").hidden=false;
  const g=await load(`m/bcross/runner/${key}.json`); if(runner){ scene.remove(runner.group); scene.remove(runner.shadow); }
  runner=makeChar(g); makeGhosts(runner); document.getElementById("load").hidden=true; start(cur); }
function start(a){ if(runner) runner.gs=null; if(norah) norah.c.gs=null; cur=a; t=0; ctx={events:[],x:0,yaw:Math.PI/2,v:0,ghost:false,local:null}; A[a].start(ctx); S.shufX={x:0,v:0}; S.shufZ={x:0,v:0};
  if(norah){ norah.x=3.2; norah.kb=0; norah.kt=0; norah.kv=0; norah.fall=0; norah.y=0; norah.vy=0; norah.landed=0; }
  document.getElementById("qte").hidden=true; document.getElementById("dmg").style.opacity=0;
  for(const b of document.querySelectorAll(".anim")) b.setAttribute("aria-pressed",String(b.dataset.a===a)); document.getElementById("hName").textContent=NAMES[a]; }
let freeze=0, freezeLen=0; const inkMat=new THREE.MeshBasicMaterial({color:0x0e0b09,skinning:true}), paper=new THREE.Color(0xefe6d6);
function impactFrame(p){ freeze=freezeLen=0.22*(slow?2:1); const v=p.clone().project(cam), el=document.getElementById("burst"); el.style.setProperty("--bx",`${(v.x*0.5+0.5)*100}%`); el.style.setProperty("--by",`${(-v.y*0.5+0.5)*100}%`); }
function frame(dtReal){
  if(!runner) return;
  if(freeze>0){ freeze-=Math.min(0.05,dtReal); const ink=freeze>freezeLen-0.08, el=document.getElementById("burst");
    el.style.opacity= ink?1:Math.max(0,freeze/(freezeLen-0.08))*0.6; el.style.mixBlendMode= ink?"normal":"multiply";
    if(ink){ const bg=scene.background, fog=scene.fog; scene.background=paper; scene.fog=null; scene.overrideMaterial=inkMat; cam.layers.set(1); renderer.render(scene,cam); cam.layers.set(0); scene.overrideMaterial=null; scene.background=bg; scene.fog=fog; }
    else renderer.render(scene,cam);
    if(freeze<=0) el.style.opacity=0; return; }
  const dt=Math.min(0.05,dtReal)*(slow?0.25:1);
  t+=dt; ctx.events=[]; ctx.ghost=false; ctx.local=null; ctx.footBack=null; ctx.claw=null; ctx.levelHead=null; ctx.rise=null;
  const x0=ctx.x; const J=A[cur].step(t,dt,ctx); const PH=A[cur].phys;
  if(PH&&PH.active(ctx)){ ctx.x=x0; if(!ctx.plOn){ ctx.plOn=1; ctx.plReset=1; if(runner.pl){ runner.pl.vx=ctx.v||0; } } physLoco(runner,J,ctx,dt,PH); } else { ctx.plOn=0; ctx.y=0; applyPose(runner,J); }
  const lx=ctx.local?ctx.local.x:0, lz=ctx.local?ctx.local.z:0;
  const fx_=Math.sin(ctx.yaw), fz_=Math.cos(ctx.yaw);   // forward; right is (fz_, -fx_)
  runner.group.position.set(ctx.x+fx_*lz+fz_*lx, ctx.plOn?ctx.y:0, fz_*lz-fx_*lx);
  runner.group.rotation.set(0,ctx.yaw,0); unnatural(runner,ctx); retarget(runner); ghostRecord(runner);
  for(const e of ctx.events){ if(e.kind==="stomp"){ const f=runner.B["foot_"+e.side]; const p=new THREE.Vector3(); f.getWorldPosition(p); puff(p,e.strength); shake=Math.max(shake,0.03*e.strength); }
    if(e.kind==="skid"){ const p=runner.group.position.clone(); puff(p,1.4); shake=Math.max(shake,0.05); }
    if(e.kind==="stompHit" && norah){ shake=Math.max(shake,0.1); const p=norah.c.group.position.clone(); p.y=0.4; puff(p,1.2); showDmg("stomp"); }
    if(e.kind==="grabbed"){ shake=Math.max(shake,0.07); const p=norah.c.group.position.clone(); puff(p,1.2); }
    if(e.kind==="crush"){ showDmg("crush"); } if(e.kind==="free"){ showDmg("free"); shake=Math.max(shake,0.05); }
    if(e.kind==="pop"){ shake=Math.max(shake,0.05); }
    if(e.kind==="drop"){ const p=norah.c.group.position.clone(); puff(p,1); }
    if(e.kind==="land"){ const p=runner.group.position.clone(); puff(p,1.8); shake=Math.max(shake,0.07); }
    if(e.kind==="dropImpact" && norah){ norah.kb=2; norah.kt=0; norah.kv=9.5; norah.vy=3.3; norah.y=0.01; shake=Math.max(shake,0.22); const p=norah.c.group.position.clone(); p.y=1.2; puff(p,2.2); showDmg("drop"); impactFrame(p); }
    if(e.kind==="impact" && norah){ showDmg(cur); norah.kb=1; norah.kt=0; norah.kv=cur==="kick"?3.2:4.4; shake=Math.max(shake,0.12); const p=norah.c.group.position.clone(); p.y=1.2; puff(p,1.6); } }
  runner.group.position.y=ctx.y||0; PHYS.rig(runner,dt,{balance:!(PH&&PH.active(ctx))&&!ctx.noBal&&!ctx.rise,kick:ctx.kick,rigid:!!ctx.rise}); if(ctx.squeeze) shake=Math.max(shake,ctx.squeeze);
  const q=document.getElementById("qte"); if(ctx.qte!=null){ q.hidden=false; document.getElementById("qteBar").style.width=`${Math.round((ctx.outcome==="free"?ctx.qte:Math.min(0.55,ctx.qte*0.6))*100)}%`; document.getElementById("qteTxt").textContent=ctx.outcome==="free"?"BREAK FREE":"BREAK FREE · too slow"; } else q.hidden=true;
  if(dmgT>0){ dmgT-=dt; if(dmgT<=0) document.getElementById("dmg").style.opacity=0; }
  if(ghostsOn && ctx.ghost){ ghostT-=dt; if(ghostT<=0){ ghostT=0.035; dropGhost(runner); } } updateGhosts(dt);
  if(norah){ norah.c.group.visible=norah.c.shadow.visible=!!ctx.norah; if(ctx.norah){ norahStep(norah,dt,ctx); retarget(norah.c); PHYS.rig(norah.c,dt,{held:ctx.nHeld,balance:!norah.fall}); } }
  for(let i=puffs.length-1;i>=0;i--){ const q=puffs[i]; q.t+=dt; q.m.position.addScaledVector(q.v,dt); q.v.multiplyScalar(1-dt*2.5); q.m.scale.setScalar((0.25+q.t*1.6)*q.s); q.m.material.opacity=Math.max(0,0.8-q.t*1.6); if(q.t>0.6){ scene.remove(q.m); puffs.splice(i,1); } }
  document.getElementById("hPh").textContent=ctx.phase||"—"; document.getElementById("hSp").textContent=`${(ctx.v||0).toFixed(1)} m/s`;
  if(t>LEN[cur]){ if(playAll){ const order=["neutral","walk","sprint","butt","kick","stomp","grab","mirror","drop"]; start(order[(order.indexOf(cur)+1)%order.length]); } else start(cur); }
  // camera
  const rp=runner.group.position, fx = camMode==="follow"? rp.x : (cur==="neutral"||cur==="kick"||cur==="stomp"? rp.x+0.8 : cur==="drop"? clamp(rp.x,-5,4.2) : clamp(rp.x,-5,2.5));
  let p; if(camMode==="side") p=new THREE.Vector3(fx,1.35,6.4); else if(camMode==="front") p=new THREE.Vector3(fx+5.2,1.3,0.4);
  else if(camMode==="follow") p=new THREE.Vector3(rp.x-3.4,1.6,2.6); else p=new THREE.Vector3(fx+Math.sin(orbit.yaw)*6.6*Math.cos(orbit.pitch),1.1+Math.sin(orbit.pitch)*6.6,Math.cos(orbit.yaw)*6.6*Math.cos(orbit.pitch));
  shake=Math.max(0,shake-dtReal*0.4); p.x+=(Math.random()-.5)*shake; p.y+=(Math.random()-.5)*shake;
  cam.position.lerp(p,camMode==="follow"?0.2:1); cam.lookAt(camMode==="front"?fx:(camMode==="follow"?rp.x+1.5:fx),1.0,0);
  renderer.render(scene,cam); }
let last=performance.now();
function loop(now){ requestAnimationFrame(loop); const w=canvas.clientWidth, h=canvas.clientHeight; if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){ renderer.setSize(w,h,false); cam.aspect=w/Math.max(1,h); cam.updateProjectionMatrix(); }
  frame((now-last)/1000); last=now; }
for(const b of document.querySelectorAll(".anim")) b.onclick=()=>{ playAll=false; document.getElementById("oAll").setAttribute("aria-pressed","false"); start(b.dataset.a); };
for(const b of document.querySelectorAll("[data-cam]")) b.onclick=()=>{ camMode=b.dataset.cam; for(const x of document.querySelectorAll("[data-cam]")) x.setAttribute("aria-pressed",String(x===b)); };
const tog=(id,f)=>{ const b=document.getElementById(id); b.onclick=()=>{ const on=b.getAttribute("aria-pressed")!=="true"; b.setAttribute("aria-pressed",String(on)); f(on); }; };
tog("oGhost",on=>ghostsOn=on); tog("oSlow",on=>slow=on); tog("oAll",on=>{ playAll=on; if(on) start("neutral"); });
document.getElementById("oModel").onchange=e=>setModel(e.target.value);
canvas.addEventListener("pointerdown",e=>{ orbit.drag={x:e.clientX,y:e.clientY,yaw:orbit.yaw,pitch:orbit.pitch}; });
addEventListener("pointermove",e=>{ if(!orbit.drag||camMode!=="three") return; orbit.yaw=orbit.drag.yaw-(e.clientX-orbit.drag.x)*0.01; orbit.pitch=clamp(orbit.drag.pitch+(e.clientY-orbit.drag.y)*0.006,0.02,1.1); });
addEventListener("pointerup",()=>orbit.drag=null);
(async()=>{ try{ const ng=await load("m/cast/norah.json"); norah={c:makeChar(ng),x:3.2,kb:0,kt:0,kv:0,fall:0}; norah.c.group.visible=false;
    await setModel("runner_m01"); requestAnimationFrame(loop); }
  catch(e){ document.getElementById("load").textContent="Couldn't load the models: "+(e&&e.message||e); } })();
window.__rp={start,cam,renderer,scene,get norah(){return norah;},get freeze(){return freeze;},get ctx(){return ctx;},get t(){return t;},frame,get runner(){return runner;}};
