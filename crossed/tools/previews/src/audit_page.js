window.__AUD = (function(){
  const V=THREE.Vector3; const bodies=new Map();
  function meshesOf(obj){ const m=[]; if(!obj) return m; obj.traverse(o=>{ if(o.isSkinnedMesh) m.push(o); }); return m; }
  function visible(o){ for(let q=o;q;q=q.parent) if(q.visible===false) return false; return true; }
  const st={};
  function step(name,obj,dt,t){ if(!obj||!visible(obj)) return null; let B=bodies.get(obj); if(!B){ const ms=meshesOf(obj); if(!ms.length) return null; B=(obj.__phys)||PHYS.body(ms); bodies.set(obj,B); }
    const m=B.measure(); const c=m.com;
    const S=st[name]||(st[name]={h:[]}); S.h.push({t,c:c.clone()}); if(S.h.length>5) S.h.shift();
    let a=null; if(S.h.length>=5){ const h=S.h; const d=(h[4].t-h[0].t)/4; a=new V().copy(h[4].c).sub(h[2].c.clone().multiplyScalar(2)).add(h[0].c).divideScalar(4*d*d); }
    const H=m.hull, pr=m.con.length?PHYS.project(H,c.x,c.z):null; let zp=null; if(a&&m.con.length){ const hh=Math.max(0.3,c.y); zp=PHYS.project(H,c.x-hh/9.8*a.x,c.z-hh/9.8*a.z); }
    return {low:m.low, com:c, a, contacts:m.con.length, out:pr?pr.d:null, zmp:zp?zp.d:null}; }
  return {step, reset(){ for(const k in st) delete st[k]; }};
})();
