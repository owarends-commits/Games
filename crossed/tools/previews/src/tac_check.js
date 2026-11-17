
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
// ================================================================ the TACTICIAN
// A man's body under a head nearly a metre across that hangs forward and to its left. The head is real mass (the guard
// weighs the mesh by volume), so it leans back and to the right to stand over its feet, and its left hand comes up to
// steady the head. It moves carefully, stops dead to watch, mirrors her, waits for an opening, and backs off when hurt.
const sm5=x=>{ x=sat(x); return x*x*x*(x*(x*6-15)+10); };
const Z=()=>(runner&&runner.sz)||1, V3=THREE.Vector3;
SLOUCH.s=0;                                          /* no heavy arm to slouch into */
const TWALK={stance:0.64,front:-0.3,back:0.3,high:-0.5,kStance:0.1,kImpact:0.1,kLift:0.8,liftEnd:0.55};
const TPHYS={ active:ctx=>(ctx.phase||"").startsWith("steps"), stance:ctx=>strideStance(ctx.ph,TWALK), traction:8, imp:0.6, rollK:0 };
const TP=()=>({fwd:new V3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw)), right:new V3(-Math.cos(ctx.yaw),0,Math.sin(ctx.yaw))});
const NX=3.2;
// a point on the head: its centre plus ox to its left, oy up, oz forward (world metres)
function headPt(ox,oy,oz){ runner.group.updateMatrixWorld(true); const P=TP(); return runner.B.head.localToWorld(runner.headC.clone()).addScaledVector(P.right,-ox).add(new V3(0,oy,0)).addScaledVector(P.fwd,oz); }
function headAnchor(C){ let mesh; C.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); const g=mesh.geometry, si=g.attributes.skinIndex, sw=g.attributes.skinWeight, pos=g.attributes.position, hb=mesh.skeleton.bones.findIndex(b=>b.name==="head");
  C.group.updateMatrixWorld(true); const c=new V3(), v=new V3(); let n=0; const pts=[]; for(let i=0;i<pos.count;i++){ if(si.getX(i)===hb&&sw.getX(i)>0.5){ v.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld); c.add(v); n++; if(i%4===0) pts.push(C.B.head.worldToLocal(v.clone())); } }
  c.divideScalar(Math.max(1,n)); C.headC=C.B.head.worldToLocal(c); C.headPts=pts; }
/* the lowest point of the head in the world (it's one rigid lump on the head bone) */
function headLow(){ runner.group.updateMatrixWorld(true); let lo=1e9; const v=new V3(); for(const p of runner.headPts){ v.copy(p); runner.B.head.localToWorld(v); lo=Math.min(lo,v.y); } return lo; }
// the left hand under the left side of the head, the elbow out and down
function braceHead(ctx,w){ if(w<=0.01) return; ctx.ik={side:"L",w,tip:0.07,at:()=>{ const P=TP(), sh=runner.B.upperarm_L.getWorldPosition(new V3());
  return {target:headPt(0.24*Z(),-0.33*Z(),0.03*Z()), pole:sh.addScaledVector(P.right,-0.55).add(new V3(0,-0.35,0)).addScaledVector(P.fwd,-0.1)}; }}; }
// standing braced: leaning back and right against the head's weight, knees soft
function tStand(t){ const J=stance(t); J.kL=0.14; J.kR=0.14; J.lLx=J.lRx=0; J.lLz=0; J.lRz=0; J.sp=-0.1+0.012*Math.sin(t*1.4); J.sroll=0.1; J.hroll=0; J.nz=0.1; J.nx=-0.05;
  J.aRx=0.05; J.aRz=0.16; J.eR=0.35; return J; }
function lookAt(J,ctx,tx,tz,k=1){ const b=Math.atan2(tx-ctx.x,tz-(ctx.z||0)); let d=b-ctx.yaw; d=Math.atan2(Math.sin(d),Math.cos(d)); J.ny=(J.ny||0)+clamp(d,-0.7,0.7)*0.6*k; J.hdy=(J.hdy||0)+clamp(d,-0.7,0.7)*0.3*k; return d; }
// a side-step of the feet: lead foot out, weight across, trailing foot follows. dir +1 = to its right. u 0..1
function sideStep(J,u,dir){ const lead=dir>0?"R":"L", trail=dir>0?"L":"R", a=Math.sin(sat(u/0.5)*Math.PI), b=Math.sin(sat((u-0.5)/0.5)*Math.PI);
  J["l"+lead+"z"]+=0.22*a; J["k"+lead]+=0.35*a; J["l"+trail+"z"]+=0.12*b; J["k"+trail]+=0.3*b; ctx.lift={[lead]:0.07*a,[trail]:0.05*b}; return sm5((u-0.15)/0.7); }
// her poses
const NQ={ aim(){ const J=NP.stand(); J.aRx=-1.5; J.eR=0.12; J.aLx=-1.3; J.eL=0.7; J.aLz=-0.1; return J; },
  reload(t){ const J=NP.stand(); J.aRx=-0.55; J.eR=1.3; J.aLx=-0.75; J.eL=1.7; J.aLz=-0.3; J.nx=0.5+0.04*Math.sin(t*9); J.sp=0.12; return J; },
  walk(ph){ const J=NQ.aim(); const s=Math.sin(ph*Math.PI*2); J.lLx=-0.35*s; J.lRx=0.35*s; J.kL=0.35*Math.max(0,s); J.kR=0.35*Math.max(0,-s); return J; },
  flat(k){ const J=NP.stumble(); J.aLx=J.aRx=-1.8-0.5*sat(k/0.6); J.aLz=J.aRz=0.7; J.lLx=0.3*(1-sat(k/0.8)); J.kL=0.1+0.3*(1-sat(k/0.8)); J.lRx=-0.25*(1-sat(k/0.8)); J.kR=0.2; return J; } };

// ---- studies her: she shifts side to side with the gun on it; it watches, the head tilting slowly, then mirrors her step
const STUDY=[[1.0,0.75],[3.4,-0.55],[5.6,0.3]];
A.idle={ start(ctx){ ctx.x=0.2; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.cz=0; ctx.st=null; },
  step(t,dt,ctx){ let nz=0, nst=null; for(const [t0,z] of STUDY){ const u=(t-t0)/0.6; if(u>=0){ const prev=nz; nz=prev+(z-prev)*sm5(u); if(u<1) nst={u,dir:Math.sign(z-prev)}; } }
    const nJ=NQ.aim(); if(nst){ const a=Math.sin(nst.u*Math.PI); nJ.lLz+=0.18*a; nJ.lRz+=0.12*a; nJ.kL+=0.25*a; } ctx.nOver={J:nJ,x:NX,z:nz};
    const J=tStand(t); braceHead(ctx,1);
    // it follows her bearing with the head first, tilting it slowly as it does; a beat later it mirrors her step
    const tilt=0.16*Math.sin(t*0.7); J.nz+=tilt; J.hdx=-0.04+0.05*Math.sin(t*0.45);
    const want=nz*0.85, lagT=t-0.7; if(!ctx.st && Math.abs(want-ctx.cz)>0.2 && lagT>0){ ctx.st={t0:t,from:ctx.cz,to:want,dir:Math.sign(want-ctx.cz)}; }
    if(ctx.st){ const u=(t-ctx.st.t0)/0.75; const m=sideStep(J,Math.min(1,u),ctx.st.dir); ctx.cz=ctx.st.from+(ctx.st.to-ctx.st.from)*m; ctx.phase="mirrors her step"; if(u>=1) ctx.st=null; }
    else ctx.phase= nst?"watches her move · head tilting": (Math.sin(t*0.7)>0.6?"freezes · studying her":"studies her · head tilting slowly");
    ctx.z=ctx.cz; lookAt(J,ctx,NX,nz); return applyLean(J); } };
A.idle.phys=null;

// ---- careful walk: a couple of slow steps, the hand steadying the head against every footfall, then it stops dead to watch
A.walk={ start(ctx){ ctx.x=-5.4; ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=false; ctx.cyc=0; ctx.pause=0; },
  step(t,dt,ctx){ braceHead(ctx,1);
    if(t<0.6||(t>10.6&&ctx.ph===0&&!(ctx.pause>0))){ ctx.v=0; ctx.phase= t<0.6?"stands braced":"stops"; const J=tLegs(tStand(t),0); return applyLean(J); }   /* it stands as it stops: feet apart, mid-stride */
    if(ctx.pause>0){ ctx.pause-=dt; ctx.v=0; const J=tLegs(tStand(t),0); const k=1-ctx.pause/1.3; J.ny=0.45*Math.sin(k*Math.PI*2)*Math.sin(k*Math.PI); J.hdy=J.ny*0.4; J.nz+=0.08*Math.sin(k*Math.PI);
      ctx.phase="stops dead · watches"; return applyLean(J); }
    const prev=ctx.ph; ctx.ph=(ctx.ph+dt/1.5)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev){ ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.4}); if(ctx.ph<prev){ ctx.cyc++; if(ctx.cyc%1===0){ ctx.pause=1.3; ctx.ph=0; } } }
    ctx.moving=true; ctx.gait={ph:ctx.ph,P:TWALK}; ctx.phase="steps carefully · the hand steadying the head";
    const J=tLegs(tStand(t),ctx.ph);
    const imp=Math.sin(Math.PI*clamp((ctx.ph%0.5)/0.24,0,1)); J.hd=0.04+0.025*imp;   /* the weight settling onto the landing leg: eased in and out, never a jump */ J.nx+=0.07*imp; J.aRx=-0.25*Math.sin(ctx.ph*Math.PI*2); J.hyaw=0.06*Math.sin(ctx.ph*Math.PI*2);
    return applyLean(J); } };
A.walk.phys=TPHYS;

// ---- headbutt: it waits just out of reach while she has the gun on it. When she drops her eyes to reload it closes in,
// rears the head back (the tell) and drops it onto her. The head's weight carries it on into a stagger, or if she stepped
// back, all the way down onto its hands.
let hbAlt=false; const hbOutcome=()=>{ const v=document.getElementById("oButt").value; if(v==="alt"){ hbAlt=!hbAlt; return hbAlt?"hit":"miss"; } return v; };
A.headbutt={ start(ctx){ ctx.x=NX-2.35*Z(); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.out=hbOutcome(); ctx.T={}; },
  step(t,dt,ctx){ const T=ctx.T; const P=TP();
    // her: the gun on it; then she reloads (the opening); if it misses she has stepped back out of the drop
    let nJ= t<1.5||t>4.4 ? NQ.aim() : NQ.reload(t), nx=NX;
    if(ctx.out==="miss"&&T.rear!=null){ const u=sm5((t-T.rear-0.1)/0.4); nx=NX+0.95*u; const a=Math.sin(sat((t-T.rear-0.1)/0.4)*Math.PI); nJ.lLx-=0.3*a; nJ.kL+=0.3*a; nJ=t>T.rear+0.4?NQ.aim():nJ; }
    if(T.hit!=null){ const k=t-T.hit; ctx.nOver={J:NQ.flat(k),x:NX,fall:PHYS.topple(ctx.nT||(ctx.nT={th:0.3,w:2.6}),dt,1.65,1.45),kick:"butt",kickV:{x:1.6,y:0.4,z:0}}; } else ctx.nOver={J:nJ,x:nx};
    // waiting just out of reach
    if(t<1.75){ const J=tStand(t); braceHead(ctx,1); J.nz+=0.1*Math.sin(t*0.8); lookAt(J,ctx,NX,0); ctx.v=0; ctx.phase= t<1.5?"waits just out of reach":"she reloads · an opening"; return applyLean(J); }
    // closes in: quick careful steps until the head is over her
    if(T.close==null && ctx.x<NX-1.2*Z()){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt/0.8)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.5});
      ctx.moving=true; ctx.gait={ph:ctx.ph,P:TWALK}; ctx.phase="steps in"; braceHead(ctx,1); const J=tLegs(tStand(t),ctx.ph); J.sp+=0.05; return applyLean(J); }
    if(T.close==null){ T.close=t; T.rear=t; }
    const k=t-T.rear, J=tStand(t); ctx.v=0;
    if(k<0.5){ const w=sm5(k/0.5); J.sp=-0.1-0.28*w; J.nx=-0.05-0.32*w; J.kL+=0.12*w; J.kR+=0.12*w; J.aRx=0.35*w; J.aRz=0.35; J.eR=0.6; braceHead(ctx,1-w); ctx.phase="rears the head back (the tell)"; return applyLean(J); }
    // the drop: gravity on the head, the hips folding under it
    const d=k-0.5;
    if(T.hit==null&&T.bottom==null){ const u=Math.min(1,(d/0.42)**2); T.u=u; J.sp=-0.38+1.45*u; J.hp=0.42*u; J.nx=-0.37+0.95*u; J.kL+=0.12+0.38*u; J.kR+=0.12+0.38*u; J.hd=0.24*u; J.aRx=0.35-1.2*u; J.aLx=-0.6*u; J.aLz=0.4; J.eL=0.6; J.eR=0.6;
      ctx.phase="drops the head onto her";
      if(ctx.out==="hit"){ const hp=headPt(0,0,0), nh=norah.c.B.head.getWorldPosition(new V3()); if(hp.distanceTo(nh)<0.62*Z()){ T.hit=t; T.hitU=u; ctx.events.push({kind:"headbutt"}); } }
      if(u>=1){ T.bottom=t; ctx.events.push({kind:"headMiss"}); }
      return applyLean(J); }
    if(T.hit!=null){ // the weight carries it on: one staggering step forward, the free hand on its knee, then it straightens and braces again
      const s=t-T.hit, u=T.hitU*(1-sm5((s-0.9)/1.0)), st=sm5(s/0.5);
      J.sp=-0.38+1.45*u; J.hp=0.42*u; J.nx=-0.37+0.95*u+0.15*Math.sin(Math.min(1,s/0.4)*Math.PI); J.hd=0.24*u; J.kL+=0.12+0.38*u; J.kR+=0.12+0.38*u;
      if(s<0.5){ ctx.noPlant=true; J.lRx-=0.45*Math.sin(st*Math.PI); J.kR+=0.5*Math.sin(st*Math.PI); } if(!T.stag&&s>0.12){ T.stag=1; } if(s<0.5) ctx.x+=dt*0.55*Math.sin(st*Math.PI)*Z()*2;
      J.aRx=-0.5*u; J.aRz=0.2; J.eR=0.5+0.4*u; braceHead(ctx,sm5((s-1.1)/0.8)); ctx.phase= s<0.6?"staggers under the weight": s<1.9?"steadies itself":"braces the head again"; return applyLean(J); }
    // missed: nothing stops the head, and it takes it down onto its hands. A window.
    const s=t-T.bottom, dn=sm5(s/0.35), up=sm5((s-1.6)/1.0), w=dn*(1-up);
    J.sp=1.07+0.35*w-1.2*up; J.hp=0.42+0.25*w-0.4*up; J.nx=0.58+0.1*w-0.5*up; J.hd=0.24+0.3*w-0.26*up; J.kL+=0.5+0.55*w-0.5*up; J.kR+=0.5+0.55*w-0.5*up; J.lLx-=0.3*w; J.lRx-=0.3*w;
    const hand=side=>{ const sh=runner.B[side==="L"?"upperarm_L":"upperarm_R"].getWorldPosition(new V3()); return {side,w,tip:0.07,at:()=>{ const P=TP(), o=side==="L"?-0.32:0.32, base=runner.group.position.clone().addScaledVector(P.fwd,0.62*Z()).addScaledVector(P.right,o*Z()); base.y=0.06;
      return {target:base, pole:runner.B[side==="L"?"upperarm_L":"upperarm_R"].getWorldPosition(new V3()).addScaledVector(P.fwd,-0.3).addScaledVector(P.right,o*1.5).add(new V3(0,0.4,0))}; }}; };
    if(w>0.02){ ctx.ik=hand("L"); ctx.ik2=hand("R"); } if(up>0.5) braceHead(ctx,sm5((s-2.2)/0.5));
    ctx.phase= s<0.35?"the head takes it down": s<1.6?"down on its hands (an opening)": "pushes itself back up"; return applyLean(J); } };
A.headbutt.phys=TPHYS;

// ---- read and counter: it lets her come and commit to a rifle-butt swing, slips it with a side-step, catches her arm and
// throws her with its weight, the hips turning under the head
A.counter={ start(ctx){ ctx.x=0.9; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.T={}; ctx.cz=0; ctx.nph=0; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(); ctx.nHeld=false;
    // her: walks in with the gun up, winds up, swings the butt at its head
    let nx=NX, nJ;
    if(t<1.35){ const u=sm5((t-0.3)/1.0); nx=NX-1.4*u; ctx.nph+=dt/0.75; nJ= t>0.3&&t<1.3 ? NQ.walk(ctx.nph) : NQ.aim(); }
    else { nx=NX-1.4; const w=sm5((t-1.35)/0.4), s=Math.pow(sat((t-1.8)/0.22),1.3); nJ=NP.stand(); nJ.syaw=0.6*w-1.3*s; nJ.aRx=-0.4-0.9*w-0.5*s; nJ.aRz=0.6*w-0.4*s; nJ.eR=1.2*(1-s)+0.4; nJ.aLx=-0.6-0.9*w-0.3*s; nJ.eL=1.3; nJ.lLx=-0.25*w; nJ.kL=0.2*w; nJ.sp=0.1+0.25*s; }
    if(T.grab==null){ ctx.nOver={J:nJ,x:nx}; }
    const J=tStand(t); lookAt(J,ctx,nx,0);
    if(t<1.5){ braceHead(ctx,1); ctx.v=0; ctx.phase= t<1.35?"waits · lets her come":"reads the wind-up"; return applyLean(J); }
    // slips it: a side-step to its left, away from the swing, the head dipped under it
    if(t<2.1){ const u=(t-1.5)/0.6; const m=sideStep(J,u,-1); ctx.cz=-0.55*m*Z(); ctx.z=ctx.cz; J.sp+=0.12*Math.sin(u*Math.PI); J.kL+=0.15*Math.sin(u*Math.PI); J.kR+=0.15*Math.sin(u*Math.PI); braceHead(ctx,1);
      ctx.phase= t<1.8?"side-steps":"the swing whiffs past"; return applyLean(J); }
    ctx.z=ctx.cz;
    // catches her forearm with its right hand
    const fa=()=>norah.c.B.forearm_R.getWorldPosition(new V3()).lerp(norah.c.B.hand_R.getWorldPosition(new V3()),0.4);
    if(T.grab==null){ T.grab=t; T.piv=new V3(ctx.x,0,ctx.cz); T.n0=new V3(nx,0,0); T.yaw0=ctx.yaw; }
    const g=t-T.grab; braceHead(ctx,1);
    const reach=sm5(g/0.18);
    // the throw: it pivots on its feet, the hips turning, and swings her round on the arm; let go, she flies on
    const thr=g-0.35, sw=sm5(thr/0.5), ang=-1.7*Math.max(0,sw);
    if(thr<0.5){ ctx.yaw=T.yaw0+ang*0.9; J.hyaw=ang*0.08; J.syaw=ang*0.15; J.sp+=0.1; J.kL+=0.15; J.kR+=0.15;
      ctx.ik2={side:"R",w:reach,tip:0.06,at:()=>({target:fa(),pole:runner.B.upperarm_R.getWorldPosition(new V3()).add(new V3(0,-0.5,0)).addScaledVector(TP().right,0.4)})};
      const off0=T.n0.clone().sub(T.piv), off=off0.clone().setLength(off0.length()+(0.66*Z()-off0.length())*sm5(g/0.35)), c=Math.cos(ang), s=Math.sin(ang), p=new V3(off.x*c+off.z*s,0,-off.x*s+off.z*c).add(T.piv);
      const nJ2=NP.stumble(); nJ2.aRx=-1.6; nJ2.eR=0.2; nJ2.aLx=-1.0; nJ2.aLz=0.7;
      if(thr<0){ ctx.nOver={J:nJ,x:p.x,z:p.z}; ctx.phase="catches her arm · pulls her in"; }
      else { ctx.nHeld=true; ctx.nOver={J:nJ2,x:p.x,y:0.16*Math.sin(sw*Math.PI*0.5)*Z(),z:p.z,yaw:-Math.PI/2+ang,roll:-0.25*sw};   /* swung up off her feet on the arm */ ctx.phase="throws her with its weight"; T.rel={x:p.x,z:p.z,y:0.16*Z(),yaw:-Math.PI/2+ang}; }
      return applyLean(J); }
    // released: she flies on along the swing and lands flat
    if(!T.relE){ T.relE=1; ctx.events.push({kind:"thrown"}); }
    const k=thr-0.5, rec=sm5(k/1.0); ctx.yaw=T.yaw0+ang*0.9*(1-rec); J.hyaw=-0.42*(1-rec); J.syaw=-0.6*(1-rec);
    const tan=new V3(Math.sin(T.rel.yaw+Math.PI/2),0,Math.cos(T.rel.yaw+Math.PI/2));   /* her sideways, in the swing's direction */
    ctx.nOver={J:NQ.flat(k),x:T.rel.x,y:k<0.02?T.rel.y:0,z:T.rel.z,yaw:T.rel.yaw,roll:-0.25-(Math.PI/2-0.3)*sm5(k/0.5),kick:"thrown",kickV:{x:-tan.x*3.2,y:0.9,z:-tan.z*3.2}};
    ctx.phase= k<0.8?"lets her fly":"watches her land · braced"; lookAt(J,ctx,T.rel.x,T.rel.z,1-rec); return applyLean(J); } };

// ---- shot: a body shot makes it back off out of reach and circle to come again from a new angle; a head shot snaps the
// head back, and its weight takes the whole body over backward, rigid
let shAlt=false; const shOutcome=()=>{ const v=document.getElementById("oShot").value; if(v==="alt"){ shAlt=!shAlt; return shAlt?"body":"head"; } return v; };
A.shot={ start(ctx){ ctx.x=NX-3.0*Z(); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.out=shOutcome(); ctx.T={}; },
  step(t,dt,ctx){ const T=ctx.T; ctx.nOver={J:NQ.aim(),x:NX};
    if(t<1.3){ if(t>0.4){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt/1.5)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.4}); }
      braceHead(ctx,1); const J=tStand(t); if(t>0.4){ tLegs(J,ctx.ph); ctx.moving=true; ctx.gait={ph:ctx.ph,P:TWALK}; ctx.phase="steps toward her"; } else ctx.phase="stands braced";
      lookAt(J,ctx,NX,0); return applyLean(J); }
    if(T.shot==null){ T.shot=t; ctx.events.push({kind:"tShot",where:ctx.out}); if(ctx.out==="head") T.tS={th:0.05,w:1.05}; }
    const k=t-T.shot;
    if(ctx.out==="head"){ const S=T.tS; /* rigid: it pivots on its heels until the back of the head reaches the floor too; the head props it there */ if(!S.done&&S.th>0.6&&headLow()<=runner.group.position.y+0.012){ S.done=true; S.impactW=S.w; S.w=0; } PHYS.topple(S,dt,2.1*Z(),Math.PI/2-0.05); ctx.rise=-S.th;
      const J=tStand(t); const snap=sm5(k/0.12); J.nx=-0.55*snap; J.sp=-0.1; J.kL=J.kR=0.05; J.lLx=J.lRx=0; J.hd=0; braceHead(ctx,1-sm5(k/0.25));
      J.aLx=-1.3*sm5(k/0.4); J.aLz=0.9; J.eL=0.3; J.aRx=-1.5*sm5(k/0.4); J.aRz=0.8; J.eR=0.3;
      if(S.done&&!T.landed){ T.landed=t; ctx.events.push({kind:"tipLand"}); }
      if(S.done){ const l=t-T.landed; J.aLx=-2.0+0.08*Math.sin(l*3); J.aRx=-2.0+0.08*Math.sin(l*2.6); J.nx=-0.55+0.05*Math.sin(l*2); }
      ctx.phase= !S.done? (k<0.25?"head shot · the head snaps back":"the head's weight takes it over, rigid") : "flat on its back"; return J; }
    // body shot: a flinch, then careful steps back out of reach
    if(k<0.45){ const J=tStand(t); const f=Math.sin(sat(k/0.45)*Math.PI); J.sp-=0.25*f; J.nx-=0.2*f; J.aRx=-0.6*f; J.eR=1.2*f; braceHead(ctx,1); ctx.phase="hit · flinches"; return applyLean(J); }
    const J=tStand(t); braceHead(ctx,1);
    const back=k<2.6, circ=!back&&k<6.0, inn=!back&&!circ&&k<7.4;
    if(back||circ||inn){ const rate=back?-1/1.2:1/1.3; const prev=ctx.ph; ctx.ph=((ctx.ph+dt*rate)%1+1)%1; if(Math.floor(prev*2)!==Math.floor(ctx.ph*2)) ctx.events.push({kind:"stomp",side:"L",strength:0.4});
      tLegs(J,ctx.ph); ctx.moving=true; ctx.gait={ph:ctx.ph,P:TWALK};
      // circling: it walks across her, keeping its eyes on her, the path bending round her; then turns in
      const dx=NX-ctx.x, dz=0-(ctx.z||0), bear=Math.atan2(dx,dz);
      let want= back? bear : circ? bear-1.25 : bear; let dY=want-ctx.yaw; dY=Math.atan2(Math.sin(dY),Math.cos(dY)); ctx.yaw+=clamp(dY,-1,1)*Math.min(1,dt*2.2);
      lookAt(J,ctx,NX,0); ctx.phase= back?"steps back out of reach": circ?"steps round her · a new angle":"steps in again from the side"; return applyLean(J); }
    ctx.v=0; lookAt(J,ctx,NX,0); ctx.phase="studies her again"; return applyLean(J); } };
A.shot.phys=TPHYS;
// ---- emboldened: with two or more Crossed beside it its nerve comes up. It straightens, carries the head without a hand,
// chest out, shoulders back, and runs her down; close in it walks tall and studies her, ready.
const BR={stance:0.42,front:-0.55,back:0.5,high:-1.05,kLift:1.5};   /* the run: a flight phase between steps */
const BW={stance:0.62,front:-0.42,back:0.42,high:-0.7,kLift:1.0};
const BOLDPHYS={ active:ctx=>(ctx.phase||"").startsWith("runs")||(ctx.phase||"").startsWith("strides"), stance:ctx=>strideStance(ctx.ph,ctx.gaitP||BR), traction:7, imp:0.8, rollK:0, flight:true, bounce:0 };
function boldStand(t){ const J=P0(); J.hd=0.02; J.kL=J.kR=0.1; J.sp=0.04+0.015*Math.sin(t*1.3); J.hp=-0.04; J.nx=-0.14; J.sroll=0.04; J.nz=0.06;
  J.aLx=-0.1+0.04*Math.sin(t*1.1); J.aLz=0.28; J.eL=0.45; J.aRx=-0.1+0.04*Math.sin(t*1.2+1); J.aRz=0.28; J.eR=0.45; return J; }
function strideP(ph,P){ const st=P.stance; if(ph<st){ const u=ph/st; return {lx:P.front+(P.back-P.front)*u, f:-0.1*(1-sm5(u/0.2))-0.1*sm5((u-0.6)/0.4), plant:true}; }
  const u=(ph-st)/(1-st), up=sm5(u/0.5), dn=sm5((u-0.35)/0.65); return {lx:P.back+(P.high-P.back)*up+(P.front-P.high)*dn, k:P.kLift*Math.sin(Math.PI*clamp(u,0,1))+0.1, f:0.25*Math.sin(Math.PI*clamp(u/0.7,0,1))-0.06, plant:false}; }
function boldGait(t,ph,P,run){ const J=boldStand(t), a=strideP(ph%1,P), b=strideP((ph+0.5)%1,P), s=Math.sin(ph*Math.PI*2);
  J.lLx=a.lx; J.fL=a.f; J.kL=a.plant?levelKnee(a.lx,0.12,P.front)+(run?0.25:0.1)*Math.sin(Math.PI*clamp((ph%1)/P.stance,0,1)):a.k; J.lRx=b.lx; J.fR=b.f; J.kR=b.plant?levelKnee(b.lx,0.12,P.front)+(run?0.25:0.1)*Math.sin(Math.PI*clamp(((ph+0.5)%1)/P.stance,0,1)):b.k;
  J.lLz=J.lRz=0; const sw=run?1.0:0.55; J.aLx=sw*s-0.15; J.aRx=-sw*s-0.15; J.eL=J.eR=run?1.4:0.55; J.aLz=J.aRz=0.15; J.hyaw=0.1*s; J.syaw=-0.18*s;
  if(run){ J.sp=0.22; J.hp=0.08; J.nx=-0.3; } else J.sp+=0.06; return J; }
A.bold={ start(ctx){ ctx.x=NX-8.2*Z(); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.by=true; ctx.byN=2; ctx.B=0; ctx.rate=0; byPlace([[ctx.x-0.7,-1.1],[ctx.x-0.5,1.2]]); },
  step(t,dt,ctx){ ctx.nOver={J:NQ.aim(),x:NX};
    if(t<1.6){ const B=sm5((t-0.3)/1.1); ctx.B=B; const J=mix(tStand(t),boldStand(t),B); braceHead(ctx,1-B); ctx.v=0; lookAt(J,ctx,NX,0);
      ctx.phase= t<0.6?"two Crossed beside it":"its nerve comes up · it lets go of its head"; return applyLean(J); }
    const gap=NX-ctx.x; let P=BR, run=true, target=2.6;   /* the stride rate: a sprint until it's close, then it slows to a walk */
    if(gap<3.6*Z()){ P=BW; run=false; target=gap<1.95*Z()?0:1.0; }
    ctx.rate+=(target-ctx.rate)*Math.min(1,dt*(run?2.2:3.5)); ctx.gaitP=P;
    if(ctx.rate>0.08){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt*ctx.rate)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:run?0.9:0.5});
      ctx.moving=true; if(!run) ctx.gait={ph:ctx.ph,P:{stance:BW.stance}}; ctx.phase= run?"runs her down":"strides in, tall"; return boldGait(t,ctx.ph,P,run); }
    ctx.v=0; const J=boldStand(t); lookAt(J,ctx,NX,0); J.nz+=0.08*Math.sin(t*0.6); ctx.phase="studies her, emboldened"; return J; } };
A.bold.phys=BOLDPHYS;

// ---- killed by a head shot: the head bursts. A shockwave throws back everyone close, gore flies in every direction and
// sticks where it lands, and the brain matter pools on the floor and fizzes.
const GORE=[], ACID=[], GORECOL=[0x4a0606,0x6a0c0c,0x8a2a2a,0xb87a70,0xd9c8b0,0x5c1010];
function goreClear(){ for(const g of GORE) scene.remove(g.m); for(const a of ACID) scene.remove(a.m); GORE.length=0; ACID.length=0; if(runner&&runner.stump){ runner.stump.parent&&runner.stump.parent.remove(runner.stump); runner.stump=null; } if(runner&&runner.B.head){ runner.B.head.scale.setScalar(1); runner.B.head.userData.massScale=1; } }
function goreBurst(c){ for(let i=0;i<90;i++){ const u=Math.random()*2-1, a=Math.random()*Math.PI*2, r=Math.sqrt(1-u*u), v=new THREE.Vector3(r*Math.cos(a),Math.abs(u)*0.8+0.15,r*Math.sin(a)).multiplyScalar(3+Math.random()*7);
    const sz=0.025+Math.random()*0.06, m=new THREE.Mesh(new THREE.BoxGeometry(sz,sz*(0.5+Math.random()),sz*(0.6+Math.random())),new THREE.MeshLambertMaterial({color:GORECOL[i%GORECOL.length]})); m.position.copy(c); scene.add(m);
    GORE.push({m,v,spin:new THREE.Vector3(Math.random()*14-7,Math.random()*14-7,Math.random()*14-7),rest:false,acid:i<12}); } }
function goreStep(dt){ for(const g of GORE){ if(g.rest) continue; const p=g.m.position; g.v.y-=9.8*dt; p.addScaledVector(g.v,dt); g.m.rotation.x+=g.spin.x*dt; g.m.rotation.y+=g.spin.y*dt;
    if(p.y<=0.015){ p.y=0.015; g.rest=true; g.m.rotation.set(0,Math.random()*6,0); g.m.scale.y=0.25;
      const pool=new THREE.Mesh(new THREE.CircleGeometry(1,12),new THREE.MeshBasicMaterial({color:g.acid?0x5c5212:0x2a0404,transparent:true,opacity:0.85,depthWrite:false})); pool.rotation.x=-Math.PI/2; pool.position.set(p.x,0.006+ACID.length*0.0003,p.z);
      const rr=g.acid?0.25+Math.random()*0.25:0.06+Math.random()*0.1; pool.scale.setScalar(0.02); scene.add(pool); ACID.push({m:pool,r:rr,t:0,acid:g.acid,bub:Math.random()}); } }
  for(const a of ACID){ a.t+=dt; a.m.scale.setScalar(Math.min(a.r,0.02+a.t*a.r*2)); if(a.acid){ a.bub-=dt; if(a.bub<=0){ a.bub=0.2+Math.random()*0.4; const q=a.m.position; const s=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xc8c040,transparent:true,depthWrite:false})); s.position.set(q.x+(Math.random()-.5)*a.r,0.04,q.z+(Math.random()-.5)*a.r); s.scale.setScalar(0.06); scene.add(s); puffs.push({m:s,t:0,v:new THREE.Vector3(0,0.25,0),s:0.25}); } } } }
let bAlt=false;
A.burst={ start(ctx){ goreClear(); ctx.x=NX-2.2*Z(); ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.by=true; ctx.byN=2; ctx.T={}; byPlace([[ctx.x-1.4,-1.2],[ctx.x-1.1,1.3]]); },
  step(t,dt,ctx){ const T=ctx.T;
    if(T.shot==null){ ctx.nOver={J:NQ.aim(),x:NX}; const J=tStand(t); braceHead(ctx,1); lookAt(J,ctx,NX,0); ctx.phase="she has the gun on its head";
      if(t>1.2){ T.shot=t; const h=runner.B.head; runner.group.updateMatrixWorld(true); T.c=headPt(0,0,0); ctx.events.push({kind:"tShot",where:"head"}); ctx.events.push({kind:"burst"});
        h.scale.setScalar(0.001); h.userData.massScale=0.0001; const st=new THREE.Mesh(new THREE.SphereGeometry(0.11,8,6),new THREE.MeshLambertMaterial({color:0x5a0a0a})); st.scale.set(1,0.55,1); (runner.B.neck||runner.B.chest).add(st); st.position.set(0,0.1,0); runner.stump=st;
        goreBurst(T.c); T.tS={th:0.04,w:0.5,done:false}; T.nT={th:0.2,w:2.8};
        // the shockwave: Norah and the two Crossed are thrown back from it
        for(const b of [by,by2]) if(b){ const d=Math.hypot(b.x-T.c.x,b.z-T.c.z), k=Math.max(0,1-d/4); if(k>0){ b.hit=t; const f=new THREE.Vector3(b.x-T.c.x,0,b.z-T.c.z).normalize(); b.kick={id:"burst"+b.z,v:{x:f.x*5*k,y:1.6*k,z:f.z*5*k}}; b.fs={th:0.2,w:2.4*k+0.6}; } } }
      return applyLean(J); }
    const k=t-T.shot, J=tStand(t); braceHead(ctx,0); J.aLx=-0.9*sm5(k/0.3); J.aLz=0.6; J.aRx=-0.8*sm5(k/0.3); J.aRz=0.6; J.eL=J.eR=0.3;
    // headless: the knees go, and it falls back where the shot drove it
    const S=T.tS; PHYS.topple(S,dt,1.6*Z(),Math.PI/2-0.08); ctx.rise=-S.th; J.kL=J.kR=0.05; J.lLx=J.lRx=0; J.hd=0;
    if(S.done&&!T.land){ T.land=t; ctx.events.push({kind:"tipLand"}); }
    const nk=k; ctx.nOver={J:NQ.flat(nk),x:NX,fall:PHYS.topple(T.nT,dt,1.65,1.45),kick:"burst",kickV:{x:4.2,y:1.8,z:0}};
    ctx.phase= k<0.25?"the head bursts · the shockwave throws them back": !S.done?"the headless body goes over": "brain matter fizzing on the floor"; return J; } };

const LEN={idle:8, walk:11.4, headbutt:6.6, counter:5.2, shot:9.6, bold:6.4, burst:6.5};
const NAMES={idle:"Studies her",walk:"Careful walk",headbutt:"Headbutt",counter:"Read and counter",shot:"Shot",bold:"Emboldened",burst:"Head burst"};
const DMG={burst:["NORAH −18","the head bursts · thrown back by the blast"],headbutt:["NORAH −35","the head comes down on her"],headMiss:["MISS","she stepped back · it's down on its hands"],thrown:["NORAH −20","caught mid-swing · thrown"],
  body:["TACTICIAN −20","shot · it backs off"],head:["HEAD SHOT","the head's weight takes it over"]};


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
let dmgT=0; function showDmg(k){ const d=DMG[k]; if(!d) return; const el=document.getElementById("dmg"); el.innerHTML=`${d[0]}<small>${d[1]}</small>`; el.style.opacity=1; dmgT=1.6; }

// ---------------------------------------------------------------- Norah: stands in the way, gets knocked back
function norahStep(N,dt,ctx){
  if(ctx.nOver){ const o=ctx.nOver; if(MIR){ if(o.roll) o.roll=-o.roll; if(o.z) o.z=-o.z; if(o.kickV) o.kickV=Object.assign({},o.kickV,{z:-(o.kickV.z||0)}); } if(o.x!=null) N.x=o.x; const J=o.J; if(o.jolt){ J.sp+=0.25*o.jolt; J.nx+=0.3*o.jolt; } applyPose(N.c,J); N.c.group.position.set(N.x,o.y||0,o.z||0); N.c.group.rotation.set(0,o.yaw??-Math.PI/2,0); if(o.fall) N.c.group.rotateX(-o.fall); if(o.roll) N.c.group.rotateZ(o.roll);
    ctx.nKick=o.kick?{id:o.kick,v:o.kickV}:null; ctx.nDown=!!(o.fall||o.roll); ctx.nOver=null; return; }
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
const loader=new THREE.GLTFLoader(); const cache={};
const load=k=>cache[k]||(cache[k]=new Promise((res,rej)=>loader.load(k,res,undefined,rej)));
let runner=null, norah=null, cur="idle", t=0, ctx={}, camMode="side", slow=false, ghostsOn=false, playAll=false;
const orbit={yaw:0.9,pitch:0.18,drag:null};
async function setModel(key){ document.getElementById("load").hidden=false;
  const g=await load(`m/bcross/tactician/${key}.json`); if(runner){ scene.remove(runner.group); scene.remove(runner.shadow); }
  runner=makeChar(g); runner.model.traverse(o=>{ if(o.isSkinnedMesh) runner.bulbsMoved=tacBulbFix(o); }); MIR=heavySide(runner)==="L"; makeGhosts(runner);
  { runner.group.updateMatrixWorld(true); const bb=new THREE.Box3().setFromObject(runner.model), h=bb.max.y-bb.min.y; runner.sz=1; /* model scale as built: shoulders about Norah's, the head on top */ runner.group.scale.setScalar(runner.sz); runner.pb=null; runner.a0=null; headAnchor(runner); solePts(runner,"L"); footAnchor(runner); }   /* her slightly taller than Norah, Louis about her height */ document.getElementById("load").hidden=true; start(cur); }
function start(a){ if(runner) runner.gs=null; if(norah) norah.c.gs=null; cur=a; t=0; ctx={events:[],x:0,yaw:Math.PI/2,v:0,ghost:false,local:null}; CS.leanF=0; CS.club={x:0,v:0}; for(const b of [by,by2]) if(b){ b.hit=null; b.fs=null; b.kick=null; b.c.gs=null; } goreClear(); CS.side={x:0,v:0}; CS.lastV=0; CS.lastYaw=0; A[a].start(ctx); ctx.outcome=ctx.out==="free"?"free":"fail"; S.shufX={x:0,v:0}; S.shufZ={x:0,v:0};
  if(norah){ norah.x=3.2; norah.kb=0; norah.kt=0; norah.kv=0; norah.fall=0; norah.y=0; norah.vy=0; norah.landed=0; }
  document.getElementById("qte").hidden=true; document.getElementById("dmg").style.opacity=0;
  for(const b of document.querySelectorAll(".anim")) b.setAttribute("aria-pressed",String(b.dataset.a===a)); document.getElementById("hName").textContent=NAMES[a]; }
let freeze=0, freezeLen=0; const inkMat=new THREE.MeshBasicMaterial({color:0x0e0b09,skinning:true}), paper=new THREE.Color(0xefe6d6);
function impactFrame(p){}   /* impact frames are reserved for the runner's drop kick */
function frame(dtReal){
  if(!runner) return;
  if(freeze>0){ freeze-=Math.min(0.05,dtReal); const ink=freeze>freezeLen-0.08, el=document.getElementById("burst");
    el.style.opacity= ink?1:Math.max(0,freeze/(freezeLen-0.08))*0.6; el.style.mixBlendMode= ink?"normal":"multiply";
    if(ink){ const bg=scene.background, fog=scene.fog; scene.background=paper; scene.fog=null; scene.overrideMaterial=inkMat; cam.layers.set(1); renderer.render(scene,cam); cam.layers.set(0); scene.overrideMaterial=null; scene.background=bg; scene.fog=fog; }
    else renderer.render(scene,cam);
    if(freeze<=0) el.style.opacity=0; return; }
  const dt=Math.min(0.05,dtReal)*(slow?0.25:1);
  t+=dt; ctx.moving=false; ctx.armScale=1; ctx.rise=null; ctx.ik=null; ctx.ik2=null; ctx.noPlant=false; ctx.lift=null; ctx.gait=null; ctx.grip=0; ctx.events=[]; ctx.ghost=false; ctx.local=null; ctx.footBack=null; ctx.claw=null; ctx.levelHead=null; ctx.rise=null;
  const x0=ctx.x; const J=A[cur].step(t,dt,ctx); const PH=A[cur].phys;
  if(PH&&PH.active(ctx)){ ctx.x=x0; if(!ctx.plOn){ ctx.plOn=1; ctx.plReset=1; if(runner.pl){ runner.pl.vx=ctx.v||0; } } physLoco(runner,J,ctx,dt,PH); } else { ctx.plOn=0; ctx.y=0; applyPose(runner,J); }
  const lx=ctx.local?MS()*ctx.local.x:0, lz=ctx.local?ctx.local.z:0;
  const fx_=Math.sin(ctx.yaw), fz_=Math.cos(ctx.yaw);   // forward; right is (fz_, -fx_)
  runner.group.position.set(ctx.x+fx_*lz+fz_*lx, ctx.plOn?ctx.y:0, (ctx.z||0)+fz_*lz-fx_*lx);
  runner.group.rotation.set(0,ctx.yaw,0); unnatural(runner,ctx); for(const k of ["ik","ik2"]){ const o=ctx[k]; if(!o) continue; if(o.at){ const r=o.at(); o.target=r.target; o.pole=r.pole; } ctx[k+"Tip"]=armIK(runner,o); } retarget(runner); ghostRecord(runner);
  { const sc=ctx.armScale||1, ua=runner.B[HB("upperarm_R")]; ua.scale.setScalar(sc); ua.updateMatrixWorld(true); for(const n of ["upperarm_R","forearm_R","hand_R"].map(HB)) runner.B[n].userData.massScale=sc*sc*sc; }   /* the swollen arm: bigger and, by volume, heavier */
  for(const e of ctx.events){ if(e.kind==="stomp"){ const f=runner.B["foot_"+e.side]; const p=new THREE.Vector3(); f.getWorldPosition(p); puff(p,e.strength); shake=Math.max(shake,0.03*e.strength); }
    if(e.kind==="skid"){ const p=runner.group.position.clone(); puff(p,1.4); shake=Math.max(shake,0.05); }
    if(e.kind==="stompHit" && norah){ shake=Math.max(shake,0.1); const p=norah.c.group.position.clone(); p.y=0.4; puff(p,1.2); showDmg("stomp"); }
    if(e.kind==="grabbed"){ shake=Math.max(shake,0.07); const p=norah.c.group.position.clone(); puff(p,1.2); }
    if(e.kind==="crush"){ showDmg("crush"); } if(e.kind==="free"){ showDmg("free"); shake=Math.max(shake,0.05); }
    if(e.kind==="pop"){ shake=Math.max(shake,0.05); }
    if(e.kind==="scrape"){ const p=new THREE.Vector3(); runner.B[HB("foot_R")].getWorldPosition(p); p.y=0.02; puff(p,0.35); }

    if(e.kind==="seized" && norah){ shake=Math.max(shake,0.06); }
    if(e.kind==="pound" && norah){ showDmg("pound"); shake=Math.max(shake,0.16); const p=norah.c.group.position.clone(); p.y=1.3; puff(p,1.2); }
    if(e.kind==="escape"){ showDmg("escape"); shake=Math.max(shake,0.05); } if(e.kind==="beaten"){ showDmg("beaten"); shake=Math.max(shake,0.1); }
    if(e.kind==="headbutt"&&norah){ showDmg("headbutt"); shake=Math.max(shake,0.3); const p=norah.c.B.head.getWorldPosition(new THREE.Vector3()); puff(p,1.4); }
    if(e.kind==="headMiss"){ showDmg("headMiss"); shake=Math.max(shake,0.12); }
    if(e.kind==="thrown"){ showDmg("thrown"); shake=Math.max(shake,0.15); }
    if(e.kind==="tShot"){ runner.group.updateMatrixWorld(true); const p=e.where==="head"?headPt(0,0.05,0.2):runner.B.chest.getWorldPosition(new THREE.Vector3()); puff(p,0.6); muzzleFlash(); shake=Math.max(shake,0.06); showDmg(e.where); }
    if(e.kind==="charge"&&norah){ showDmg("charge"); shake=Math.max(shake,0.3); const p=norah.c.group.position.clone(); p.y=1.0; puff(p,1.8); }
    if(e.kind==="chargeMiss"){ showDmg("chargeMiss"); }
    if(e.kind==="swat"&&norah){ showDmg("swat"); shake=Math.max(shake,0.25); const p=norah.c.group.position.clone(); p.y=1.1; puff(p,1.6); impactFrame(p); }
    if(e.kind==="smotherHit"&&norah){ showDmg("smotherHit"); shake=Math.max(shake,0.2); puff(norah.c.group.position.clone(),2); }
    if(e.kind==="squeeze"){ showDmg("squeeze"); shake=Math.max(shake,0.04); } if(e.kind==="crawlOut"){ showDmg("crawlOut"); } if(e.kind==="crushed"){ showDmg("crushed"); shake=Math.max(shake,0.12); }
    if(e.kind==="slamFloor"){ runner.group.updateMatrixWorld(true); const p=new THREE.Vector3(); runner.B[HB("hand_R")].getWorldPosition(p); p.y=0.02; puff(p,2.4); shake=Math.max(shake,0.22); }
    if(e.kind==="flailHit"){ const p=e.p.clone(); p.y=0.02; puff(p,1.6); shake=Math.max(shake,0.14); } if(e.kind==="flail"&&norah){ showDmg("flail"); shake=Math.max(shake,0.2); }
    if(e.kind==="swell"){ shake=Math.max(shake,0.04); }
    if(e.kind==="shot"){ runner.group.updateMatrixWorld(true); const p=new THREE.Vector3(); runner.B[HB("forearm_R")].getWorldPosition(p); puff(p,0.6); muzzleFlash(); shake=Math.max(shake,0.05); showDmg(e.n===2?"shotTip":"shot"); }
    if(e.kind==="tipLand"){ runner.group.updateMatrixWorld(true); const p=new THREE.Vector3(); runner.B[HB("hand_R")].getWorldPosition(p); p.y=0.02; puff(p,3); puff(runner.group.position.clone(),2); shake=Math.max(shake,0.35); impactFrame(p.clone().setY(0.3));
      if(by && by.c.group.visible && Math.hypot(by.x-p.x,by.z-p.z)<1.7 && by.hit==null){ by.hit=t; by.kick={id:"by"+t,v:{x:-2.6,y:1.6,z:0.5}}; by.fs={th:0.25,w:2.6}; showDmg("byHit"); } }
    if(e.kind==="hammer"){ runner.group.updateMatrixWorld(true); const p=new THREE.Vector3(); runner.B[HB("hand_R")].getWorldPosition(p); p.y=0.02; puff(p,3.2); puff(p.clone().add(new THREE.Vector3(0.4,0,0.3)),2); puff(p.clone().add(new THREE.Vector3(0.3,0,-0.4)),2); shake=Math.max(shake,0.32); impactFrame(p.clone().setY(0.4));
      if(norah && Math.abs(norah.x-p.x)<(e.big?3.0:2.4)){ showDmg("hammer"); norah.kb=1; norah.kt=0; norah.kv=e.big?3.4:2.4; } }
    if(e.kind==="drop"){ const p=norah.c.group.position.clone(); puff(p,1); }
    if(e.kind==="land"){ const p=runner.group.position.clone(); puff(p,1.8); shake=Math.max(shake,0.07); }
    if(e.kind==="dropImpact" && norah){ norah.kb=2; norah.kt=0; norah.kv=9.5; norah.vy=3.3; norah.y=0.01; shake=Math.max(shake,0.22); const p=norah.c.group.position.clone(); p.y=1.2; puff(p,2.2); showDmg("drop"); impactFrame(p); }
    if(e.kind==="impact" && norah){ showDmg(cur); norah.kb=1; norah.kt=0; norah.kv=cur==="kick"?3.2:4.4; shake=Math.max(shake,0.12); const p=norah.c.group.position.clone(); p.y=1.2; puff(p,1.6); } }
  runner.group.position.y=ctx.y||0; const mB=PHYS.rig(runner,dt,{balance:false,kick:ctx.kick,soft:[HB("upperarm_R")],rigid:!!ctx.rise}); if(!ctx.rise) balance(runner,mB,ctx,dt); if(ctx.squeeze) shake=Math.max(shake,ctx.squeeze);
  const q=document.getElementById("qte"); if(ctx.qte!=null){ q.hidden=false; document.getElementById("qteBar").style.width=`${Math.round((ctx.outcome==="free"?ctx.qte:Math.min(0.55,ctx.qte*0.6))*100)}%`; document.getElementById("qteTxt").textContent=ctx.outcome==="free"?"BREAK FREE":"BREAK FREE · too slow"; } else q.hidden=true;
  if(dmgT>0){ dmgT-=dt; if(dmgT<=0) document.getElementById("dmg").style.opacity=0; }
  if(ghostsOn && ctx.ghost){ ghostT-=dt; if(ghostT<=0){ ghostT=0.035; dropGhost(runner); } } updateGhosts(dt);
  stepBystander(dt);
  if(ctx.grip && norah && norah.c.group.visible){ const V=THREE.Vector3; norah.c.group.updateMatrixWorld(true); runner.group.updateMatrixWorld(true);
    const nk=norah.c.B.neck.getWorldPosition(new V()), ch=norah.c.B.chest.getWorldPosition(new V()), sh=runner.B[HB("upperarm_L")].getWorldPosition(new V());
    const collar=ch.clone().lerp(nk,0.72), toHim=sh.clone().sub(collar).setY(0).normalize(); collar.addScaledVector(toHim,0.075);     /* the front of her collar */
    const left=new V(Math.cos(ctx.yaw),0,-Math.sin(ctx.yaw)).multiplyScalar(MS()), pole=sh.clone().add(new V(0,-0.6,0)).addScaledVector(left,0.35);
    ctx.gripTip=armIK(runner,{side:"L",target:collar,pole,w:ctx.grip,tip:0.06}); retarget(runner); ctx.gripTarget=collar; }
  if(norah){ norah.c.group.visible=norah.c.shadow.visible=!!ctx.norah; if(ctx.norah){ norahStep(norah,dt,ctx); retarget(norah.c); PHYS.rig(norah.c,dt,{held:ctx.nHeld,balance:!norah.fall&&!ctx.nDown,kick:ctx.nKick}); } }
  goreStep(dt);
  for(let i=puffs.length-1;i>=0;i--){ const q=puffs[i]; q.t+=dt; q.m.position.addScaledVector(q.v,dt); q.v.multiplyScalar(1-dt*2.5); q.m.scale.setScalar((0.25+q.t*1.6)*q.s); q.m.material.opacity=Math.max(0,0.8-q.t*1.6); if(q.t>0.6){ scene.remove(q.m); puffs.splice(i,1); } }
  document.getElementById("hPh").textContent=ctx.phase||"—"; document.getElementById("hSp").textContent=`${(ctx.v||0).toFixed(1)} m/s`;
  if(t>LEN[cur]){ if(playAll){ const order=["idle","walk","headbutt","counter","shot","bold","burst"]; start(order[(order.indexOf(cur)+1)%order.length]); } else start(cur); }
  // camera
  const rp=runner.group.position, fx = camMode==="follow"? rp.x : (cur==="idle"? rp.x : cur==="walk"? clamp(rp.x,-5,4) : (rp.x+3.2)/2);
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
tog("oGhost",on=>ghostsOn=on); tog("oSlow",on=>slow=on); tog("oAll",on=>{ playAll=on; if(on) start("idle"); });
document.getElementById("oModel").onchange=e=>setModel(e.target.value);
canvas.addEventListener("pointerdown",e=>{ orbit.drag={x:e.clientX,y:e.clientY,yaw:orbit.yaw,pitch:orbit.pitch}; });
addEventListener("pointermove",e=>{ if(!orbit.drag||camMode!=="three") return; orbit.yaw=orbit.drag.yaw-(e.clientX-orbit.drag.x)*0.01; orbit.pitch=clamp(orbit.drag.pitch+(e.clientY-orbit.drag.y)*0.006,0.02,1.1); });
addEventListener("pointerup",()=>orbit.drag=null);
(async()=>{ try{ const ng=await load("m/cast/norah.json"); norah={c:makeChar(ng),x:3.2,kb:0,kt:0,kv:0,fall:0}; norah.c.group.visible=false;
    try{ const bg=await load("m/across/men/across_v01.json"); by={c:makeChar(bg),x:0,z:0.45}; by.c.group.visible=false; by2={c:makeChar(bg),x:0,z:-0.45}; by2.c.group.visible=false; }catch(e){ by=null; }
    await setModel("tactician_m01"); requestAnimationFrame(loop); }
  catch(e){ document.getElementById("load").textContent="Couldn't load the models: "+(e&&e.message||e); } })();
window.__rp={start,cam,renderer,scene,get norah(){return norah;},get freeze(){return freeze;},get ctx(){return ctx;},get t(){return t;},frame,get runner(){return runner;}};
