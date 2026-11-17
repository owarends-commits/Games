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
