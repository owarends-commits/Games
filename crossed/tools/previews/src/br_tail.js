// ---------------------------------------------------------------- the live host side of the two-armed Brute module
// One live body: its rig (BR) and state (BS) are bound in each frame. Her body is the playground's stand-in.
let nora=null, gameT=0, PV_KEY=""; const pvNoraCache=new WeakMap();
function pvNora(n){ if(!n) return null; let o=pvNoraCache.get(n); if(!o){ o={B:n.c.B, group:n.c.group, shadow:n.c.shadow, gun:null, model:null}; pvNoraCache.set(n,o); } return o; }
function pvPrep(g,h){ PV_KEY=h.key; }
function pvMakeChar(g){ const key=PV_KEY; const R=autoRig(g,{armor:key.includes("armored")}); R.uid=key; R.legless=key.includes("legless"); scene.add(R.mesh); if(R.armor&&R.armor.length) armorReset(R);   /* its loose-armour list, as the preview's clip start sets up */
  const C={group:R.mesh, model:R.mesh, B:R.B, R, bs:{limp:{L:false,R:false},lastRoot:null,lastV:null,ps:null,pf:null,al:null,cah:null,alp:null,ns:null,wasAir:false}, shadow:null}; return C; }
function pvBind(h){ ctx=h.ctx; scene=h.stage; t=h.t; nora=pvNora(h.norah); if(h.C){ BR=h.C.R; BS=h.C.bs; } }
function pvSetup(C){ BR=C.R; BS=C.bs; C.hgt=BR.H; C.hip0=BR.shoulderY; return C; }
function pvStep(h,dt){ pvBind(h); h.t+=dt; t=h.t; gameT+=dt; ctx.qte=null; ctx.events=[];
  const st=h.clip.step(t,dt,ctx); ctx.lastSt=st;
  // a stump never jumps more than 0.35 m in one frame (at a charge's speed the gait's swing target can leap a metre): it gets there a frame or two later
  { const F=ctx.fPrev||(ctx.fPrev={}); for(const s of ["L","R"]){ const f=st.feet&&st.feet[s]; if(!f||!f.isVector3) continue; const q=F[s]; if(q&&!ctx.fNoCap){ const d=f.distanceTo(q); if(d>0.35){ f.copy(q.clone().lerp(f,0.35/d)); } } F[s]=f.clone(); } ctx.fNoCap=false; }
  bruteFrame(st,dt); if(BS.ps&&BS.ps.e<-0.4) BS.ps.e=-0.4;   /* never sunk more than 0.4 m below its stance */
  // and its body never jolts up or down more than 10 cm in a frame (the flight physics at a charge's speed can): eased over a few frames
  // the body never jumps more than 0.25 m a frame beyond how far the creature itself moved (a clip handing its place from the gait
  // to a scripted path, as the charge does when it ploughs on past her): it eases across instead
  { const mp=BR.mesh.position; if(ctx.mPrev&&!ctx.fNoCap){ const d=mp.distanceTo(ctx.mPrev), lim=0.25+Math.abs(ctx.x-(ctx.xPrev??ctx.x)); if(d>lim){ mp.copy(ctx.mPrev.clone().lerp(mp,lim/d)); BR.mesh.updateMatrixWorld(true); } } ctx.mPrev=mp.clone(); ctx.xPrev=ctx.x; }
  { const rt=BR.B.root; if(rt){ const y=rt.position.y; if(ctx.rootY!=null&&!ctx.fNoCap){ const dy=y-ctx.rootY; if(Math.abs(dy)>0.1){ rt.position.y=ctx.rootY+Math.sign(dy)*0.1; BR.mesh.updateMatrixWorld(true); } } ctx.rootY=rt.position.y; } } BR.mesh.updateMatrixWorld(true); return ctx.events; }
function pvFx(dt){ stepFx(dt); stepGore(dt); const s=shake; shake=0; return s; }
