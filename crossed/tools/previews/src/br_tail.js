// ---------------------------------------------------------------- the live host side of the two-armed Brute module
// One live body: its rig (BR) and state (BS) are bound in each frame. Her body is the playground's stand-in.
let nora=null, gameT=0, PV_KEY=""; const pvNoraCache=new WeakMap();
function pvNora(n){ if(!n) return null; let o=pvNoraCache.get(n); if(!o){ o={B:n.c.B, group:n.c.group, shadow:n.c.shadow, gun:null, model:null}; pvNoraCache.set(n,o); } return o; }
function pvPrep(g,h){ PV_KEY=h.key; }
function pvMakeChar(g){ const key=PV_KEY; const R=autoRig(g,{armor:key.includes("armored")}); R.uid=key; R.legless=key.includes("legless"); scene.add(R.mesh);
  const C={group:R.mesh, model:R.mesh, B:R.B, R, bs:{limp:{L:false,R:false}}, shadow:null}; return C; }
function pvBind(h){ ctx=h.ctx; scene=h.stage; t=h.t; nora=pvNora(h.norah); if(h.C){ BR=h.C.R; BS=h.C.bs; } }
function pvSetup(C){ BR=C.R; BS=C.bs; C.hgt=BR.H; C.hip0=BR.shoulderY; return C; }
function pvStep(h,dt){ pvBind(h); h.t+=dt; t=h.t; gameT+=dt; ctx.qte=null; ctx.events=[];
  const st=h.clip.step(t,dt,ctx); ctx.lastSt=st; bruteFrame(st,dt); BR.mesh.updateMatrixWorld(true); return ctx.events; }
function pvFx(dt){ stepFx(dt); stepGore(dt); const s=shake; shake=0; return s; }
