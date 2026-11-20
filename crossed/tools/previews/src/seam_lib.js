// ---- connectivity audit for skinned meshes (test helper, injected into the page; not part of the game)
// In the rest pose: (1) seams: vertices at the same spot that are skinned differently (where two body parts meet);
// (2) contacts: separate pieces of mesh (bulbs, an arm modelled apart) touching another piece. Posed: how far each has
// opened up. A gap over ~1.5 cm is a visible crack; over ~4 cm, a floating part.
window.SEAM={ cache:new Map(),
  prep(mesh){ if(this.cache.has(mesh.geometry)) return this.cache.get(mesh.geometry);
    const g=mesh.geometry, P=g.attributes.position, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, n=P.count, bones=mesh.skeleton.bones;
    const C=(A,i,k)=>{ let x=A.isInterleavedBufferAttribute?A.data.array[i*A.data.stride+A.offset+k]:A.array[i*A.itemSize+k]; if(A.normalized){ const T=A.array.constructor; x/= T===Uint8Array?255:T===Uint16Array?65535:1; } return x; };
    const sig=i=>{ const a=[]; for(let k=0;k<4;k++){ const w=C(SW,i,k); if(w>0.02) a.push([C(SI,i,k),w]); } a.sort((x,y)=>y[1]-x[1]); return a; };
    const dom=i=>{ let b=0,w=-1; for(let k=0;k<4;k++){ const x=C(SW,i,k); if(x>w){ w=x; b=C(SI,i,k); } } return b; };
    const key=(i,q)=>Math.round(P.getX(i)/q)+","+Math.round(P.getY(i)/q)+","+Math.round(P.getZ(i)/q);
    // welded components (islands)
    const par=new Int32Array(n).map((_,i)=>i), f=i=>{ while(par[i]!==i){ par[i]=par[par[i]]; i=par[i]; } return i; }, un=(a,b)=>{ a=f(a); b=f(b); if(a!==b) par[a]=b; };
    const I=g.index; if(I){ for(let t=0;t<I.count;t+=3){ un(I.getX(t),I.getX(t+1)); un(I.getX(t),I.getX(t+2)); } } else for(let t=0;t<n;t+=3){ un(t,t+1); un(t,t+2); }
    const B=new Map(); for(let i=0;i<n;i++){ const k=key(i,0.0005); if(B.has(k)) un(i,B.get(k)); else B.set(k,i); }
    // seams
    const pairs=[], S=new Map(); for(let i=0;i<n;i++){ const k=key(i,0.002); (S.get(k)||S.set(k,[]).get(k)).push(i); }
    const diff=(a,b)=>{ const A=sig(a),Bs=sig(b); if(A.length!==Bs.length) return true; for(let k=0;k<A.length;k++) if(A[k][0]!==Bs[k][0]||Math.abs(A[k][1]-Bs[k][1])>0.05) return true; return false; };
    for(const arr of S.values()){ if(arr.length<2) continue; for(let a=1;a<arr.length;a++) if(diff(arr[0],arr[a])) pairs.push([arr[0],arr[a],0,"seam"]); }
    // contacts between islands
    const comp=new Map(); for(let i=0;i<n;i++){ const r=f(i); (comp.get(r)||comp.set(r,[]).get(r)).push(i); }
    const isl=[...comp.values()].sort((a,b)=>b.length-a.length);
    if(isl.length>1&&isl.length<400){ const G=new Map(), q=0.06, gk=(x,y,z)=>Math.floor(x/q)+","+Math.floor(y/q)+","+Math.floor(z/q);
      isl.forEach((vs,ci)=>{ for(const i of vs){ const k=gk(P.getX(i),P.getY(i),P.getZ(i)); (G.get(k)||G.set(k,[]).get(k)).push([i,ci]); } });
      isl.forEach((vs,ci)=>{ if(ci===0&&isl.length>1&&vs.length>n*0.5) {}; const best=new Map();
        for(let s=0;s<vs.length;s+=Math.max(1,vs.length/400|0)){ const i=vs[s], x=P.getX(i),y=P.getY(i),z=P.getZ(i), bx=Math.floor(x/q),by=Math.floor(y/q),bz=Math.floor(z/q);
          for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)for(let dz=-1;dz<=1;dz++){ const c=G.get((bx+dx)+","+(by+dy)+","+(bz+dz)); if(!c) continue;
            for(const [j,cj] of c){ if(cj===ci) continue; const d=Math.hypot(P.getX(j)-x,P.getY(j)-y,P.getZ(j)-z); if(d<0.06){ const b=best.get(cj); if(!b||d<b[2]) best.set(cj,[i,j,d]); } } } }
        for(const [cj,b] of best) if(ci<cj||!(isl[cj]&&best)) pairs.push([b[0],b[1],b[2],"contact"]); }); }
    const info={pairs, dom, bones, islands:isl.length}; this.cache.set(mesh.geometry,info); return info; },
  // largest opening (m) on this mesh now, and where
  gap(mesh){ const I=this.prep(mesh), v=new THREE.Vector3(), w=new THREE.Vector3(); mesh.updateMatrixWorld(true); if(mesh.skeleton) mesh.skeleton.update();
    const sc=new THREE.Vector3().setFromMatrixScale(mesh.matrixWorld).x; let worst={g:0}; const P=mesh.geometry.attributes.position;
    for(const [a,b,d0,kind] of I.pairs){ v.fromBufferAttribute(P,a); mesh.boneTransform(a,v); v.applyMatrix4(mesh.matrixWorld); w.fromBufferAttribute(P,b); mesh.boneTransform(b,w); w.applyMatrix4(mesh.matrixWorld);
      const g=v.distanceTo(w)-d0*sc; if(g>worst.g) worst={g,kind,a:I.bones[I.dom(a)].name,b:I.bones[I.dom(b)].name,at:v.clone()}; }
    return worst; },
  meshes(root){ const m=[]; root.traverse(o=>{ if(o.isSkinnedMesh&&o.visible) m.push(o); }); return m; } };
// pieces not touching anything: for each separate piece of mesh, the closest its vertices come to another piece's
// triangles, posed as it is now. Returns those further than thr (m).
SEAM.islands=function(mesh){ const g=mesh.geometry, n=g.attributes.position.count, P=g.attributes.position, I=g.index;
  const par=new Int32Array(n).map((_,i)=>i), f=i=>{ while(par[i]!==i){ par[i]=par[par[i]]; i=par[i]; } return i; }, un=(a,b)=>{ a=f(a); b=f(b); if(a!==b) par[a]=b; };
  const tris=[]; if(I){ for(let t=0;t<I.count;t+=3){ const a=I.getX(t),b=I.getX(t+1),c=I.getX(t+2); un(a,b); un(a,c); tris.push([a,b,c]); } } else for(let t=0;t<n;t+=3){ un(t,t+1); un(t,t+2); tris.push([t,t+1,t+2]); }
  const B=new Map(); for(let i=0;i<n;i++){ const k=Math.round(P.getX(i)/0.0005)+","+Math.round(P.getY(i)/0.0005)+","+Math.round(P.getZ(i)/0.0005); if(B.has(k)) un(i,B.get(k)); else B.set(k,i); }
  const id=new Int32Array(n); const map=new Map(); for(let i=0;i<n;i++){ const r=f(i); if(!map.has(r)) map.set(r,map.size); id[i]=map.get(r); }
  return {id, tris, count:map.size}; };
SEAM.floaters=function(mesh,thr=0.01,bind=false){ const key=mesh.geometry; let S=this.cache.get("isl"); if(!S) this.cache.set("isl",S=new Map()); let L=S.get(key); if(!L) S.set(key,L=this.islands(mesh));
  const P=mesh.geometry.attributes.position, n=P.count, pos=new Float32Array(n*3), v=new THREE.Vector3(); mesh.updateMatrixWorld(true); if(mesh.skeleton) mesh.skeleton.update();
  for(let i=0;i<n;i++){ v.fromBufferAttribute(P,i); if(mesh.isSkinnedMesh&&!bind) mesh.boneTransform(i,v); v.applyMatrix4(mesh.matrixWorld); pos[3*i]=v.x; pos[3*i+1]=v.y; pos[3*i+2]=v.z; }
  const q=0.05, G=new Map(), gk=(x,y,z)=>Math.floor(x/q)+","+Math.floor(y/q)+","+Math.floor(z/q);
  L.tris.forEach((t,ti)=>{ let x0=1e9,y0=1e9,z0=1e9,x1=-1e9,y1=-1e9,z1=-1e9; for(const i of t){ x0=Math.min(x0,pos[3*i]); x1=Math.max(x1,pos[3*i]); y0=Math.min(y0,pos[3*i+1]); y1=Math.max(y1,pos[3*i+1]); z0=Math.min(z0,pos[3*i+2]); z1=Math.max(z1,pos[3*i+2]); }
    for(let a=Math.floor((x0-thr)/q);a<=Math.floor((x1+thr)/q);a++) for(let b=Math.floor((y0-thr)/q);b<=Math.floor((y1+thr)/q);b++) for(let c=Math.floor((z0-thr)/q);c<=Math.floor((z1+thr)/q);c++){ const k=a+","+b+","+c; (G.get(k)||G.set(k,[]).get(k)).push(ti); } });
  const tri=new THREE.Triangle(), A=new THREE.Vector3(),Bv=new THREE.Vector3(),Cv=new THREE.Vector3(), cp=new THREE.Vector3(), out=[], best=new Float64Array(L.count).fill(1e9), sizes=new Int32Array(L.count), bonesOf=new Map();
  const SI=mesh.geometry.attributes.skinIndex;
  for(let i=0;i<n;i++){ const ci=L.id[i]; sizes[ci]++; if(best[ci]<=thr) continue; v.set(pos[3*i],pos[3*i+1],pos[3*i+2]); const cell=G.get(gk(v.x,v.y,v.z)); if(!cell) continue;
    for(const ti of cell){ const t=L.tris[ti]; if(L.id[t[0]]===ci) continue; A.fromArray(pos,3*t[0]); Bv.fromArray(pos,3*t[1]); Cv.fromArray(pos,3*t[2]); tri.set(A,Bv,Cv); tri.closestPointToPoint(v,cp); const d=cp.distanceTo(v); if(d<best[ci]) best[ci]=d; if(best[ci]<=thr) break; }
    if(SI&&!bonesOf.has(ci)) bonesOf.set(ci,mesh.skeleton?mesh.skeleton.bones[SI.array[i*SI.itemSize]].name:"?"); }
  for(let c=0;c<L.count;c++) if(best[c]>thr&&sizes[c]>3) out.push({island:c, verts:sizes[c], gap:best[c]>=1e9?">5cm":+(best[c]*100).toFixed(1), bone:bonesOf.get(c)});
  return out; };
