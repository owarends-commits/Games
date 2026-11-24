// ---------------------------------------------------------------- the live host side of the two-armed Brute module
// One live body: its rig (BR) and state (BS) are bound in each frame. Her body is the playground's stand-in.
let nora=null, gameT=0, PV_KEY=""; const pvNoraCache=new WeakMap();
function pvNora(n){ if(!n) return null; let o=pvNoraCache.get(n); if(!o){ o={B:n.c.B, group:n.c.group, shadow:n.c.shadow, gun:null, model:null}; pvNoraCache.set(n,o); } return o; }
function pvPrep(g,h){ PV_KEY=h.key; }
// the little arms stay on: each is skinned only to its own bones, but the stump surface it grows from bends with the stump's
// bones, so the join opened up a few centimetres as the stump flexed. Arm skin near the body takes the skinning of the body
// surface right next to it (fully at the join, fading out over GLUE_R), so the root moves with that surface.
const GLUE_R=0.06;
function brGlueArms(R){ const m=R.mesh, g=m.geometry, P=g.attributes.position, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, bones=m.skeleton.bones;
  const armB=new Set(); for(const a of R.arms) for(const b of [a.base,a.mid,a.tip]) armB.add(bones.indexOf(b));
  const isArm=i=>{ for(let k=0;k<4;k++) if(SW.getX? (k===0?SW.getX(i):k===1?SW.getY(i):k===2?SW.getZ(i):SW.getW(i))>0.5&&armB.has(k===0?SI.getX(i):k===1?SI.getY(i):k===2?SI.getZ(i):SI.getW(i)) : false) return true; return false; };
  const cell=0.05, grid=new Map(), key=(x,y,z)=>`${Math.floor(x/cell)},${Math.floor(y/cell)},${Math.floor(z/cell)}`, arm=[];
  for(let i=0;i<P.count;i++){ if(isArm(i)){ arm.push(i); continue; } const k=key(P.getX(i),P.getY(i),P.getZ(i)); let L=grid.get(k); if(!L) grid.set(k,L=[]); L.push(i); }
  let glued=0; const w=[0,0,0,0], ix=[0,0,0,0];
  for(const i of arm){ const x=P.getX(i), y=P.getY(i), z=P.getZ(i); let best=-1, bd=GLUE_R*GLUE_R; const cx=Math.floor(x/cell), cy=Math.floor(y/cell), cz=Math.floor(z/cell);
    for(let a=-2;a<=2;a++) for(let b=-2;b<=2;b++) for(let c=-2;c<=2;c++){ const L=grid.get(`${cx+a},${cy+b},${cz+c}`); if(!L) continue; for(const j of L){ const dx=P.getX(j)-x, dy=P.getY(j)-y, dz=P.getZ(j)-z, d=dx*dx+dy*dy+dz*dz; if(d<bd){ bd=d; best=j; } } }
    if(best<0) continue; const t=1-Math.sqrt(bd)/GLUE_R, share=Math.min(1,t*1.15);   /* how much of the body's skinning it takes */
    const acc=new Map(); const add=(bi,wt)=>{ if(wt>1e-4) acc.set(bi,(acc.get(bi)||0)+wt); };
    for(let k=0;k<4;k++){ add(SI.getComponent?SI.getComponent(i,k):[SI.getX(i),SI.getY(i),SI.getZ(i),SI.getW(i)][k],(1-share)*[SW.getX(i),SW.getY(i),SW.getZ(i),SW.getW(i)][k]); add([SI.getX(best),SI.getY(best),SI.getZ(best),SI.getW(best)][k],share*[SW.getX(best),SW.getY(best),SW.getZ(best),SW.getW(best)][k]); }
    const top=[...acc.entries()].sort((p,q)=>q[1]-p[1]).slice(0,4), sum=top.reduce((s,e)=>s+e[1],0)||1;
    for(let k=0;k<4;k++){ ix[k]=top[k]?top[k][0]:0; w[k]=top[k]?top[k][1]/sum:0; } SI.setXYZW(i,ix[0],ix[1],ix[2],ix[3]); SW.setXYZW(i,w[0],w[1],w[2],w[3]); glued++; }
  SI.needsUpdate=SW.needsUpdate=true; R.armGlued=glued; return glued; }
function pvMakeChar(g){ const key=PV_KEY; const R=autoRig(g,{armor:key.includes("armored")}); R.uid=key; R.legless=key.includes("legless"); scene.add(R.mesh); if(R.armor&&R.armor.length) armorReset(R); if(R.arms&&R.arms.length) brGlueArms(R);   /* its loose-armour list, as the preview's clip start sets up */
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
