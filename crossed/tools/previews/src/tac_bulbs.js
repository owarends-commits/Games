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
