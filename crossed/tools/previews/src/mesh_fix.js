// ================================================================ every part joined: load-time fixes to the models' meshes
// The model files are left as they are; when a model loads, its skinned mesh is fixed in memory:
//  1. a piece (bulb, shoe, flap) modelled floating a little off what it belongs to is moved onto it (3 mm in);
//  2. where a smaller piece meets one moved by a different bone (an arm against the chest, a head on the neck), its
//     vertices near the join take a share of that bone's skinning, falling off over 4 cm, so the join stretches with
//     the motion instead of opening up.
// Done once per mesh (clones share it). Limbs that are cut or come off on purpose still come off: those detach bones.
const MESHFIX={gapMax:0.06, sink:0.003, glueR:0.05, glueK:0.9};
function mfAttr(A,i,k){ let x=A.isInterleavedBufferAttribute?A.data.array[i*A.data.stride+A.offset+k]:A.array[i*A.itemSize+k]; if(A.normalized){ const T=A.array.constructor; x/=T===Uint8Array?255:T===Uint16Array?65535:1; } return x; }
function mfSetW(A,i,k,v){ if(A.isInterleavedBufferAttribute){ A.data.array[i*A.data.stride+A.offset+k]=v; A.data.needsUpdate=true; } else { A.array[i*A.itemSize+k]=A.normalized?Math.round(v*(A.array.constructor===Uint8Array?255:65535)):v; A.needsUpdate=true; } }
function mfIslands(g){ const P=g.attributes.position, n=P.count, I=g.index;
  const par=new Int32Array(n).map((_,i)=>i), f=i=>{ while(par[i]!==i){ par[i]=par[par[i]]; i=par[i]; } return i; }, un=(a,b)=>{ a=f(a); b=f(b); if(a!==b) par[a]=b; };
  const tris=[]; if(I){ for(let t=0;t<I.count;t+=3){ const a=I.getX(t),b=I.getX(t+1),c=I.getX(t+2); un(a,b); un(a,c); tris.push(a,b,c); } } else for(let t=0;t+2<n;t+=3){ un(t,t+1); un(t,t+2); tris.push(t,t+1,t+2); }
  const B=new Map(); for(let i=0;i<n;i++){ const k=Math.round(P.getX(i)/0.0005)+","+Math.round(P.getY(i)/0.0005)+","+Math.round(P.getZ(i)/0.0005); if(B.has(k)) un(i,B.get(k)); else B.set(k,i); }
  const id=new Int32Array(n), map=new Map(), size=[]; for(let i=0;i<n;i++){ const r=f(i); if(!map.has(r)){ map.set(r,map.size); size.push(0); } id[i]=map.get(r); size[id[i]]++; }
  return {id,tris,size,count:map.size}; }
function mfGrid(P,tris,q){ const G=new Map(); for(let t=0;t<tris.length;t+=3){ let x0=1e9,y0=1e9,z0=1e9,x1=-1e9,y1=-1e9,z1=-1e9; for(let k=0;k<3;k++){ const i=tris[t+k]; x0=Math.min(x0,P.getX(i)); x1=Math.max(x1,P.getX(i)); y0=Math.min(y0,P.getY(i)); y1=Math.max(y1,P.getY(i)); z0=Math.min(z0,P.getZ(i)); z1=Math.max(z1,P.getZ(i)); }
    for(let a=Math.floor((x0-MESHFIX.gapMax)/q);a<=Math.floor((x1+MESHFIX.gapMax)/q);a++) for(let b=Math.floor((y0-MESHFIX.gapMax)/q);b<=Math.floor((y1+MESHFIX.gapMax)/q);b++) for(let c=Math.floor((z0-MESHFIX.gapMax)/q);c<=Math.floor((z1+MESHFIX.gapMax)/q);c++){ const k=a+","+b+","+c; (G.get(k)||G.set(k,[]).get(k)).push(t); } }
  return G; }
function meshFix(mesh){ const g=mesh.geometry; if(!g||g.userData.mfDone||!g.attributes.position) return null; g.userData.mfDone=true;
  const P=g.attributes.position, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, L=mfIslands(g); if(L.count<2) return {moved:0,glued:0};
  const q=0.06, G=mfGrid(P,L.tris,q), v=new THREE.Vector3(), A=new THREE.Vector3(), B=new THREE.Vector3(), C=new THREE.Vector3(), cp=new THREE.Vector3(), tri=new THREE.Triangle();
  const big=L.size.indexOf(Math.max(...L.size)); let moved=0, glued=0;
  // closest point on another piece, for one vertex
  const nearest=(i,ci)=>{ v.fromBufferAttribute(P,i); const cell=G.get(Math.floor(v.x/q)+","+Math.floor(v.y/q)+","+Math.floor(v.z/q)); let best=null, bd=1e9;
    if(cell) for(const t of cell){ const a=L.tris[t],b=L.tris[t+1],c=L.tris[t+2]; if(L.id[a]===ci) continue; A.fromBufferAttribute(P,a); B.fromBufferAttribute(P,b); C.fromBufferAttribute(P,c); tri.set(A,B,C); tri.closestPointToPoint(v,cp); const d=cp.distanceTo(v); if(d<bd){ bd=d; best={p:cp.clone(),d,tri:[a,b,c],other:L.id[a]}; } }
    return best; };
  // 1. floating pieces: their nearest approach to another piece
  const members=[]; for(let c=0;c<L.count;c++) members.push([]); for(let i=0;i<P.count;i++) members[L.id[i]].push(i);
  for(let c=0;c<L.count;c++){ if(c===big||L.size[c]<3) continue; let best=null, bi=-1; const vs=members[c];
    for(let s=0;s<vs.length;s+=Math.max(1,vs.length/300|0)){ const r=nearest(vs[s],c); if(r&&(!best||r.d<best.d)){ best=r; bi=vs[s]; } if(best&&best.d<0.004) break; }
    if(!best||best.d<0.004||best.d>MESHFIX.gapMax) continue;
    v.fromBufferAttribute(P,bi); const mv=best.p.clone().sub(v); const len=mv.length(); mv.setLength(len+MESHFIX.sink);
    for(const i of vs) P.setXYZ(i,P.getX(i)+mv.x,P.getY(i)+mv.y,P.getZ(i)+mv.z); moved++; }
  if(moved){ P.needsUpdate=true; g.computeBoundingSphere(); g.computeBoundingBox&&g.computeBoundingBox(); }
  // 2. joins between pieces on different bones
  if(SI&&SW){ const G2=mfGrid(P,L.tris,q), dom=i=>{ let b=0,w=-1; for(let k=0;k<4;k++){ const x=mfAttr(SW,i,k); if(x>w){ w=x; b=mfAttr(SI,i,k); } } return b; };
    const near2=(i,ci)=>{ v.fromBufferAttribute(P,i); const cell=G2.get(Math.floor(v.x/q)+","+Math.floor(v.y/q)+","+Math.floor(v.z/q)); let best=null, bd=MESHFIX.glueR;
      if(cell) for(const t of cell){ const a=L.tris[t],b=L.tris[t+1],c=L.tris[t+2]; if(L.id[a]===ci||L.size[L.id[a]]<L.size[ci]) continue; A.fromBufferAttribute(P,a); B.fromBufferAttribute(P,b); C.fromBufferAttribute(P,c); tri.set(A,B,C); tri.closestPointToPoint(v,cp); const d=cp.distanceTo(v); if(d<bd){ bd=d; const da=cp.distanceTo(A), db=cp.distanceTo(B), dc=cp.distanceTo(C); best={d, src: da<=db&&da<=dc?a:db<=dc?b:c}; } }
      return best; };
    const changes=[];
    for(let i=0;i<P.count;i++){ const ci=L.id[i]; if(ci===big) continue; const r=near2(i,ci); if(!r) continue; if(dom(r.src)===dom(i)) continue;
      const w=MESHFIX.glueK*Math.pow(1-r.d/MESHFIX.glueR,2); if(w<0.03) continue;
      const mix=new Map(); for(let k=0;k<4;k++){ const b=mfAttr(SI,i,k), x=mfAttr(SW,i,k)*(1-w); if(x>0) mix.set(b,(mix.get(b)||0)+x); } for(let k=0;k<4;k++){ const b=mfAttr(SI,r.src,k), x=mfAttr(SW,r.src,k)*w; if(x>0) mix.set(b,(mix.get(b)||0)+x); }
      const top=[...mix.entries()].sort((a,b)=>b[1]-a[1]).slice(0,4), sum=top.reduce((s,e)=>s+e[1],0)||1; changes.push([i,top.map(e=>[e[0],e[1]/sum])]); }
    for(const [i,top] of changes){ for(let k=0;k<4;k++){ const e=top[k]; mfSetW(SI,i,k,e?e[0]:0); mfSetW(SW,i,k,e?e[1]:0); } glued++; } }
  return {moved,glued}; }
function meshFixAll(root){ const out=[]; root.traverse(o=>{ if(o.isMesh&&o.geometry){ const r=meshFix(o); if(r) out.push(r); } }); return out; }
// when models load: fixed at once, unless the creature's own code adds joints first (the Reachers' long necks and arms,
// the split head): those are fixed after it has (PVBody, after pvPrep)
{ const ml0=mdlLoad; mdlLoad=function(key){ return ml0(key).then(g=>{ const grp=(MODEL_LIB[key]||{}).g||""; if(!g.userData.mfDone&&grp!=="bcross/reacher"&&!(window.__noMF&&/twoarm/.test(key))){ g.userData.mfDone=true; meshFixAll(g.scene); } return g; }); }; }
