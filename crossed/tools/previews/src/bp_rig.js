// ---------------------------------------------------------------- auto-rig: the two-armed Brutes come as one static mesh. Split it into its pieces and bind them to bones:
// each stump arch gets a chain (shoulder → arch top → knee → foot) bent with IK; each viscera lump its own bone (so it can burst);
// each little arm two bones (wriggle, go limp); the man gets torso, head and legs.
function autoRig(gltf,opt={}){
  let src=null; gltf.scene.traverse(o=>{ if(o.isMesh&&!src) src=o; });
  const geo=src.geometry.clone(); const P=geo.attributes.position, N=P.count, idx=geo.index.array;
  const par=new Int32Array(N); for(let i=0;i<N;i++) par[i]=i; const f=x=>{ while(par[x]!==x){ par[x]=par[par[x]]; x=par[x]; } return x; }; const u=(a,b)=>{ a=f(a); b=f(b); if(a!==b) par[b]=a; };
  for(let i=0;i<idx.length;i+=3){ u(idx[i],idx[i+1]); u(idx[i],idx[i+2]); }
  const weld=new Map(); for(let i=0;i<N;i++){ const k=`${P.getX(i).toFixed(3)},${P.getY(i).toFixed(3)},${P.getZ(i).toFixed(3)}`; if(weld.has(k)) u(weld.get(k),i); else weld.set(k,i); }
  const C=new Map(); for(let i=0;i<N;i++){ const r=f(i); if(!C.has(r)) C.set(r,[]); C.get(r).push(i); }
  const v=new THREE.Vector3(); const comps=[...C.values()].map(vs=>{ const b=new THREE.Box3(), c=new THREE.Vector3(); for(const i of vs){ v.fromBufferAttribute(P,i); b.expandByPoint(v); c.add(v); } c.divideScalar(vs.length); const s=new THREE.Vector3(); b.getSize(s); return {vs,box:b,c,size:s,ext:Math.max(s.x,s.y,s.z)}; }).sort((a,b)=>b.vs.length-a.vs.length);
  const H=new THREE.Box3().setFromBufferAttribute(P).max.y;
  // the two stump arches are the two biggest pieces
  const stumps=comps.slice(0,2).sort((a,b)=>a.c.x-b.c.x); const side={L:stumps[1],R:stumps[0]};      // model faces +z: its left is +x
  const mean=(vs,test)=>{ const c=new THREE.Vector3(); let n=0; for(const i of vs){ v.fromBufferAttribute(P,i); if(test(v)){ c.add(v); n++; } } return n?c.divideScalar(n):null; };
  const L={};
  for(const s of ["L","R"]){ const st=side[s], sg=Math.sign(st.c.x), top=st.box.max.y;
    const foot=mean(st.vs,p=>p.y<0.06*top), apex=mean(st.vs,p=>p.y>0.93*top), knee=mean(st.vs,p=>p.y>0.5*top&&p.y<0.58*top), wrist=mean(st.vs,p=>p.y>0.15*top&&p.y<0.21*top);
    let minAX=1e9; for(const i of st.vs){ v.fromBufferAttribute(P,i); if(v.y>0.7*top) minAX=Math.min(minAX,Math.abs(v.x)); }
    const inner=mean(st.vs,p=>p.y>0.7*top && Math.abs(p.x)<minAX+0.16) || apex.clone();
    L[s]={shoulder:new THREE.Vector3(inner.x,Math.max(inner.y,apex.y-0.3),inner.z), apex, knee, wrist, foot}; }
  const shoulderY=(L.L.shoulder.y+L.R.shoulder.y)/2;
  const isArm=c=>c.vs.length<130 && c.ext>0.26 && !(Math.abs(c.c.x)<0.3 && c.c.y<shoulderY);   // the little arms: long thin pieces
  // bones (bind pose: identity rotations, positions only)
  const bones=[], B={}; const mk=(name,pos,parent)=>{ const b=new THREE.Bone(); b.name=name; const w=pos.clone(); if(parent){ parent.updateMatrixWorld(true); parent.worldToLocal(w); } b.position.copy(w); if(parent) parent.add(b); bones.push(b); B[name]=b; return b; };
  const root=mk("root",new THREE.Vector3(0,shoulderY,0),null); root.updateMatrixWorld(true);
  const torso=mk("torso",new THREE.Vector3(0,shoulderY,0),root);
  for(const s of ["L","R"]){ const l=L[s]; const a=mk("sh"+s,l.shoulder,root), b=mk("ap"+s,l.apex,a), c=mk("kn"+s,l.knee,b), w=mk("wr"+s,l.wrist,c), d=mk("ft"+s,l.foot,w); root.updateMatrixWorld(true); }
  const center=comps.slice(2).filter(c=>!isArm(c) && Math.abs(c.c.x)<0.3);
  const headC=center.filter(c=>c.box.min.y>shoulderY+0.02).sort((a,b)=>b.c.y-a.c.y)[0];
  if(headC) mk("head",new THREE.Vector3(0,headC.box.min.y,headC.c.z*0.3),torso);
  const legC=center.filter(c=>c.c.y<shoulderY-0.9);
  const hipY=legC.length?Math.max(...legC.map(c=>c.box.max.y)):null;
  if(hipY!=null){ for(const s of ["L","R"]){ const sg=s==="L"?1:-1; mk("leg"+s,new THREE.Vector3(0.12*sg,hipY,0),torso); } }
  root.updateMatrixWorld(true);
  // weights
  const SI=new Uint16Array(N*4), SW=new Float32Array(N*4), bi=b=>bones.indexOf(b);
  const setW=(i,list)=>{ list.sort((a,b)=>b[1]-a[1]); let tot=0; for(let k=0;k<4&&k<list.length;k++) tot+=list[k][1]; for(let k=0;k<4;k++){ if(k<list.length){ SI[i*4+k]=list[k][0]; SW[i*4+k]=list[k][1]/tot; } } };
  const wpos=b=>{ const p=new THREE.Vector3(); b.getWorldPosition(p); return p; };
  const chains={}; for(const s of ["L","R"]) chains[s]=[B["sh"+s],B["ap"+s],B["kn"+s],B["wr"+s],B["ft"+s]].map(b=>({b,p:wpos(b)}));
  const segInfo=(p,ch)=>{ let best=null; for(let k=0;k<ch.length-1;k++){ const a=ch[k].p,b=ch[k+1].p, ab=b.clone().sub(a), t=Math.max(0,Math.min(1,p.clone().sub(a).dot(ab)/ab.lengthSq())), d=a.clone().addScaledVector(ab,t).distanceTo(p); if(!best||d<best.d) best={k,t,d}; } return best; };
  const chainW=(p,ch)=>{ const s=segInfo(p,ch), k=s.k, t=s.t, list=[[bi(ch[k].b),1]];
    if(t<0.06 && k>0){ const w=0.5*(1-t/0.06); list[0][1]=1-w; list.push([bi(ch[k-1].b),w]); }
    if(t>0.94 && k<ch.length-2){ const w=0.5*((t-0.94)/0.06); list[0][1]=1-w; list.push([bi(ch[k+1].b),w]); } return list; };
  for(const s of ["L","R"]) for(const i of side[s].vs){ v.fromBufferAttribute(P,i); setW(i,chainW(v,chains[s])); }
  for(const s of ["L","R"]){ const ch=chains[s]; for(const i of side[s].vs){ v.fromBufferAttribute(P,i); const si=segInfo(v,ch); let f=0;
      if(si.k===0) f=0.45*(1-0.5*si.t); else if(si.k===1 && si.t<0.35) f=0.22*(1-si.t/0.35);
      if(f>0){ const a=ch[si.k].p, b=ch[si.k+1].p, c=a.clone().lerp(b,si.t); const d=v.clone().sub(c); d.multiplyScalar(1+f); const np=c.add(d); if(si.k===0) np.y+=0.06*(1-si.t); P.setXYZ(i,np.x,np.y,np.z); } } }
  P.needsUpdate=true; geo.computeVertexNormals();
  const lumps=[], arms=[];
  const allSeg=[]; for(const s of ["L","R"]) for(let k=0;k<4;k++) allSeg.push({s,k,a:chains[s][k],b:chains[s][k+1]});
  const nearestStump=p=>{ let best=null; for(const g of allSeg){ const ab=g.b.p.clone().sub(g.a.p), t=Math.max(0,Math.min(1,p.clone().sub(g.a.p).dot(ab)/ab.lengthSq())), d=g.a.p.clone().addScaledVector(ab,t).distanceTo(p); if(!best||d<best.d) best={...g,t,d}; } return best; };
  const manBones=[torso,B.head,B.legL,B.legR].filter(Boolean);
  const halves=comps.slice(2).filter(c=>!isArm(c) && c.vs.length>=21 && c.c.y>shoulderY-0.8 && c.c.y<shoulderY+0.2 && Math.abs(c.c.x)>0.06 && Math.abs(c.c.x)<0.3 && c.size.x>0.15 && c.size.y>0.12);
  const organs=[]; let jaw=null;
  if(halves.length>=2){ const backZ=Math.min(...halves.map(h=>h.box.min.z)); const midY=(Math.min(...halves.map(h=>h.box.min.y))+Math.max(...halves.map(h=>h.box.max.y)))/2;
    mk("jawL",new THREE.Vector3(0.02,midY,backZ),torso); mk("jawR",new THREE.Vector3(-0.02,midY,backZ),torso); jaw={halves:new Set(halves)}; }
  // armour (the endgame one): pale bone-coloured pieces, read from the texture under each piece
  const map0=src.material.map, UV=geo.attributes.uv; let tex=null;
  if(map0&&map0.image&&UV){ try{ const im=map0.image, cv=document.createElement("canvas"); cv.width=cv.height=256; const g2=cv.getContext("2d"); g2.drawImage(im,0,0,256,256); tex=g2.getImageData(0,0,256,256).data; }catch(e){ tex=null; } }
  const colOf=c=>{ if(!tex) return null; let r=0,g=0,b=0,n=0; for(let k=0;k<c.vs.length;k+=Math.max(1,c.vs.length>>6)){ const i=c.vs[k]; let x=UV.getX(i)%1, y=UV.getY(i)%1; if(x<0) x+=1; if(y<0) y+=1; const px=Math.min(255,Math.floor(x*256)), py=Math.min(255,Math.floor((map0.flipY?1-y:y)*256)), o=(py*256+px)*4; r+=tex[o]; g+=tex[o+1]; b+=tex[o+2]; n++; } return n?[r/n,g/n,b/n]:null; };
  const isArmor=c=>{ if(!opt.armor) return false; const q=colOf(c); c.col=q; return q && q[0]>100 && q[1]>q[0]*0.77 && q[2]>q[0]*0.6; };
  const armor=[];
  for(const c of comps.slice(2)){
    if(isArmor(c)){ // armour rides whatever it is strapped to, rigidly, on its own bone so it can be knocked off
      let host; if(Math.abs(c.c.x)<0.3 && c.c.y<shoulderY+0.8 && !(c.size.x>0.5)){ host= (B.head && c.c.y>shoulderY+0.05) ? B.head : torso; } else { const ns=nearestStump(c.c); host=ns.t>0.5?ns.b.b:ns.a.b; c.side=ns.s; }
      const ab=mk("armor"+armor.length,c.c,host); armor.push({b:ab,c:c.c.clone(),side:c.side||null,vs:c.vs,ext:c.ext,size:c.size.clone(),hp:3,off:false,host:host.name}); for(const i of c.vs) setW(i,[[bi(ab),1]]); continue; }
    if(isArm(c)){ // base: the end nearest a stump
      let far=null, near=null, fd=-1, nd=1e9; for(const i of c.vs){ v.fromBufferAttribute(P,i); const ns=nearestStump(v); if(ns.d<nd){ nd=ns.d; near=v.clone(); } if(ns.d>fd){ fd=ns.d; far=v.clone(); } }
      const ns=nearestStump(near), parent=ns.t>0.5?ns.b.b:ns.a.b; const base=mk("arm"+arms.length+"a",near,parent), mid=mk("arm"+arms.length+"b",near.clone().lerp(far,0.5),base); const tip=mk("arm"+arms.length+"c",far,mid);
      const ab=far.clone().sub(near); for(const i of c.vs){ v.fromBufferAttribute(P,i); const t=Math.max(0,Math.min(1,v.clone().sub(near).dot(ab)/ab.lengthSq())); setW(i, t<0.5?[[bi(base),1-t],[bi(mid),t]]:[[bi(mid),1.5-t],[bi(tip),t-0.5]]); }
      arms.push({base,mid,tip,side:ns.s,len:ab.length(),dir:ab.clone().normalize(),c}); continue; }
    if(jaw && jaw.halves.has(c)){ const jb=c.c.x>0?B.jawL:B.jawR; for(const i of c.vs) setW(i,[[bi(jb),1]]); continue; }
    if(jaw && c.vs.length<=60 && c.ext<0.2 && Math.abs(c.c.x)<0.25 && c.c.y>shoulderY-0.7 && c.c.y<shoulderY+0.12 && c.c.z<0){ const ob=mk("organ"+organs.length,c.c,torso); organs.push({b:ob,c:c.c.clone(),alive:true}); for(const i of c.vs) setW(i,[[bi(ob),1]]); continue; }
    if(Math.abs(c.c.x)<0.3 && c.c.y<shoulderY+0.6){ // the man
      let tgt=torso; if(B.head && c===headC) tgt=B.head; else if(B.legL && c.c.y<shoulderY-0.9) tgt=c.c.x>0?B.legL:B.legR;
      for(const i of c.vs){ setW(i,[[bi(tgt),1]]); }
      // a plate strapped onto the man himself (chest plate, helmet cage): its bone-coloured vertices become their own piece
      if(opt.armor && tex){ const cream=[]; for(const i of c.vs){ const q=colOf({vs:[i]}); if(q && q[0]>100 && q[1]>q[0]*0.77 && q[2]>q[0]*0.6) cream.push(i); }
        if(cream.length>30){ const cc=new THREE.Vector3(), bb=new THREE.Box3(); for(const i of cream){ v.fromBufferAttribute(P,i); cc.add(v); bb.expandByPoint(v); } cc.divideScalar(cream.length); const sz=bb.getSize(new THREE.Vector3());
          const ab=mk("armor"+armor.length,cc,tgt); armor.push({b:ab,c:cc.clone(),side:null,vs:cream,ext:Math.max(sz.x,sz.y,sz.z),size:sz,hp:4,off:false,host:tgt.name,plate:true}); for(const i of cream) setW(i,[[bi(ab),1]]); } }
      continue; }
    // lumps, foot nubs, plates: ride the nearest stump bone; the round lumps get their own bone so they can burst
    const ns=nearestStump(c.c); const host=ns.t>0.5?ns.b.b:ns.a.b;
    if(c.vs.length<=60 && c.ext<0.25 && c.c.y>0.4){ const lb=mk("lump"+lumps.length,c.c,host); lumps.push({b:lb,side:ns.s,c:c.c.clone(),r:c.ext/2,alive:true}); for(const i of c.vs) setW(i,[[bi(lb),1]]); }
    else for(const i of c.vs) setW(i,[[bi(host),1]]); }
  for(let i=0;i<N;i++) if(SW[i*4]===0){ v.fromBufferAttribute(P,i); setW(i,[[bi(torso),1]]); }
  // armour is fitted to the skin: every armour vertex takes the skinning of the flesh right under it, so it bends exactly as
  // that flesh bends (over a joint it flexes with the joint, elsewhere it is carried rigidly) and can never lift off or sink in.
  // Only when a piece is knocked loose does it switch to its own bone and become a rigid body.
  if(armor.length){ const body=new Set(["root","torso","head","legL","legR"]); for(const s of ["L","R"]) for(const k of ["sh","ap","kn","wr","ft"]) body.add(k+s);
    const isBody=i=>{ const b=bones[SI[i*4]]; return b && body.has(b.name) && SW[i*4]>0; };
    const armV=new Set(); for(const a of armor) for(const i of a.vs) armV.add(i);
    const hc=0.08, H2=new Map(), key=(x,y,z)=>`${Math.floor(x/hc)},${Math.floor(y/hc)},${Math.floor(z/hc)}`;
    for(let i=0;i<N;i++){ if(armV.has(i)||!isBody(i)) continue; const k=key(P.getX(i),P.getY(i),P.getZ(i)); let L=H2.get(k); if(!L) H2.set(k,L=[]); L.push(i); }
    const nearestBody=(x,y,z)=>{ for(let r=1;r<6;r++){ let best=-1,bd=1e18; const cx=Math.floor(x/hc),cy=Math.floor(y/hc),cz=Math.floor(z/hc);
        for(let a=-r;a<=r;a++) for(let b2=-r;b2<=r;b2++) for(let c2=-r;c2<=r;c2++){ const L=H2.get(`${cx+a},${cy+b2},${cz+c2}`); if(!L) continue; for(const j of L){ const dx=P.getX(j)-x,dy=P.getY(j)-y,dz=P.getZ(j)-z, d=dx*dx+dy*dy+dz*dz; if(d<bd){ bd=d; best=j; } } }
        if(best>=0) return best; } return -1; };
    for(const a of armor){ a.own=bi(a.b); a.skinI=new Uint16Array(a.vs.length*4); a.skinW=new Float32Array(a.vs.length*4); a.multi=0;
      a.vs.forEach((i,n)=>{ const j=nearestBody(P.getX(i),P.getY(i),P.getZ(i)); if(j>=0){ for(let k=0;k<4;k++){ SI[i*4+k]=SI[j*4+k]; SW[i*4+k]=SW[j*4+k]; } if(SW[j*4]<0.95) a.multi++; }
        for(let k=0;k<4;k++){ a.skinI[n*4+k]=SI[i*4+k]; a.skinW[n*4+k]=SW[i*4+k]; } }); a.bends=a.multi>a.vs.length*0.1; } }
  geo.setAttribute("skinIndex",new THREE.Uint16BufferAttribute(SI,4)); geo.setAttribute("skinWeight",new THREE.Float32BufferAttribute(SW,4));
  const map=src.material.map; if(map) map.encoding=THREE.LinearEncoding;
  const mesh=new THREE.SkinnedMesh(geo,new THREE.MeshLambertMaterial({map,side:THREE.DoubleSide,skinning:true})); mesh.frustumCulled=false;
  mesh.add(root); mesh.bind(new THREE.Skeleton(bones));
  // bind directions (each bone's child) for aiming bones later
  const bind={}; for(const b of bones){ const ch=b.children.find(x=>x.isBone); if(ch) bind[b.name]=ch.position.clone().normalize(); }
  bind.legL=new THREE.Vector3(0,-1,0); bind.legR=new THREE.Vector3(0,-1,0); bind.head=new THREE.Vector3(0,1,0);
  const len={}; for(const s of ["L","R"]){ len["a"+s]=chains[s][0].p.distanceTo(chains[s][1].p); len["b"+s]=chains[s][1].p.distanceTo(chains[s][2].p); len["c"+s]=chains[s][2].p.distanceTo(chains[s][3].p); len["d"+s]=chains[s][3].p.distanceTo(chains[s][4].p); }
  const rest={}; for(const s of ["L","R"]){ rest["foot"+s]=chains[s][4].p.clone(); rest["sh"+s]=chains[s][0].p.clone(); rest["ap"+s]=chains[s][1].p.clone(); }
  return {mesh,B,bones,lumps,arms,organs,armor,jaw:!!jaw,bind,len,rest,shoulderY,H,hasLegs:!!B.legL,hasHead:!!B.head};
}
// aim a bone so its child points along a world direction
const _aq=new THREE.Quaternion(), _av=new THREE.Vector3();
function aimBone(R,name,dirW){ const b=R.B[name]; if(!b||!R.bind[name]) return; b.parent.getWorldQuaternion(_aq); _aq.invert(); _av.copy(dirW).normalize().applyQuaternion(_aq); b.quaternion.setFromUnitVectors(R.bind[name],_av); b.updateMatrixWorld(true); }
function wposB(R,name){ const p=new THREE.Vector3(); R.B[name].getWorldPosition(p); return p; }
// two-bone IK for the arch: from the arch top to the knee to the foot, the knee bending outward (pole)
function stumpIK(R,s,footW,pole,lift){
  const sh=wposB(R,"sh"+s); const out=new THREE.Vector3(s==="L"?1:-1,0,0).applyQuaternion(R.mesh.getWorldQuaternion(new THREE.Quaternion()));
  // the arch top: up and out from the shoulder, raised by "lift"
  const ap0=R.rest["ap"+s].clone().sub(R.rest["sh"+s]); const apDir=new THREE.Vector3(out.x*Math.abs(ap0.x),ap0.y+lift*R.len["a"+s],out.z*Math.abs(ap0.x)).normalize();
  aimBone(R,"sh"+s,apDir); const A=wposB(R,"ap"+s);
  const wristW=footW.clone().add(new THREE.Vector3(0,R.len["d"+s],0));
  const L1=R.len["b"+s], L2=R.len["c"+s]; const d=wristW.clone().sub(A); let D=d.length(); D=Math.min(D,L1+L2-1e-3); D=Math.max(D,Math.abs(L1-L2)+1e-3);
  const dir=d.clone().normalize(); const cosA=(L1*L1+D*D-L2*L2)/(2*L1*D); const a=Math.acos(Math.max(-1,Math.min(1,cosA)));
  const pl=pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  const kneeDir=dir.clone().multiplyScalar(Math.cos(a)).addScaledVector(pl,Math.sin(a));
  aimBone(R,"ap"+s,kneeDir); const K=wposB(R,"kn"+s); aimBone(R,"kn"+s,wristW.clone().sub(K)); const W=wposB(R,"wr"+s); aimBone(R,"wr"+s,footW.clone().sub(W)); }
