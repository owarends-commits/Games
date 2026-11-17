// ---------------------------------------------------------------- the Hob, live (playground side, inside the module)
// One Hob. Its stage is a group in the world: stage +x is the way it faces, its origin is under its shoulders. Its clips
// move it along the stage by setting H.group.position.x; that advance is taken out each frame and the stage moved instead,
// so the Hob can turn as it crawls. ctx.herW: her waist, in the world (the grabs aim at it).
let LT=0;
const LIVE={
  crawl:{ start(ctx){ ctx.x0=0; ctx.heart=1.0; }, step(t,dt,ctx){ const I=ctx.I||0; H.group.position.x=crawl(t,dt,ctx,2.8-1.8*I,I); ctx.frantic=I>0.5; ctx.heart=1+0.9*I; ctx.lumpK=1+0.4*I; } },
  screech:A.screech,
  grabL:{ start(ctx){ ctx.x0=0; ctx.heart=1.3; }, step(t,dt,ctx){ chaseGrab(t,dt,ctx,"L",{side:-1.6,catchZ:1.6,lead:1.3,catchAt:3.4,tSign:-1}); } },
  grabR:{ start(ctx){ ctx.x0=0; ctx.heart=1.3; }, step(t,dt,ctx){ chaseGrab(t,dt,ctx,"R",{side:1.45,catchZ:2.0,lead:1.3,catchAt:3.4,tSign:1}); } },
  throne:{ start(ctx){ A.throne.start(ctx); ctx.x0=0; ctx.route=null; }, step(t,dt,ctx){ A.throne.step(t,dt,ctx); } } };
function hobInit(g,stage){ STAGE=stage; setupHob(g); H.group.position.set(0,0,0); return H; }
function hobStart(name,ctx){ for(const s of ["L","R"]) if(palm[s]) palm[s].open=0; hideEyeWounds(); LIVE[name].start(ctx); }
// one frame of the clip, exactly as the preview's frame() ran it; returns how far it moved forward (m)
function hobStep(name,t,dt,ctx){ ctx.tongues=null; ctx.palm=null; ctx.frantic=false; ctx.lumpK=ctx.lumpK??1; ctx.slosh=0;
  resetBones(); LIVE[name].step(t,dt,ctx); groundLegs(); H.group.updateMatrixWorld(true);
  skin(t,dt,ctx); H.group.updateMatrixWorld(true);
  for(const s of ["L","R"]){ const E=ctx.palm&&ctx.palm[s]; updatePalm(s,E,dt); const b=palmOut(s); drawTongue(s,b.p,b.d,tonguePath(s,t),1,t,0.6); }
  H.shadow.position.set(H.group.position.x-3.3,0.006,0); placeCross(); stepCross(t,dt,ctx.flare||0);
  const X=H.group.position.x; if(X!==0){ H.group.position.x=0; for(const k of ["x0","X","Xc","Xp"]) if(ctx[k]!=null) ctx[k]-=X; H.shadow.position.x-=X; H.group.updateMatrixWorld(true); }
  return X; }
function pvFx(dt){ stepFx(dt); stepGore(dt); const s=shake; shake=0; return s; }
function hobHold(){ const h=hold; hold=0; return h; }
function hobPalm(s){ H.group.updateMatrixWorld(true); return m2w(palmPointM(s)); }
function hobHerAt(ctx){ return ctx.her&&ctx.her.m? m2w(ctx.her.m) : null; }
function hobBlood(p,n){ blood(p,n||12,1.8); }
return { LIVE, hobInit, hobStart, hobStep, pvFx, hobHold, hobPalm, hobHerAt, hobBlood, crossWorld:()=>crossG?crossWorld():null, eyeWorld:s=>faceEyeWorld(s), get H(){ return H; }, faceEye, embers:(p,n,s)=>embers(p,n,s), w2m:v=>w2m(v), hide(){ for(const s of ["L","R"]) tongues[s].visible=false; if(crossG){ crossG.parent&&crossG.parent.remove(crossG); crossG=null; } H=null; } };
