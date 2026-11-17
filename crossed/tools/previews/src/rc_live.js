// ================================================================ the Reachers, live (playground)
// Each body keeps its own joint chains (RC): bound in with the rest of it every frame.
function pvPrep(g,h){ h.rc=buildChains(g); RC=h.rc; }
function pvPost(C,h){ C.rc=h.rc; chainRig(C,h.rc); headCentre(C); }
{ const bind0=pvBind; pvBind=function(h){ bind0(h); if(h.C&&h.C.rc) RC=h.C.rc; else if(h.rc) RC=h.rc; }; }
const LIVE={};
function turnTo(ctx,dt,rate){ const w=ctx.wantYaw??ctx.yaw; let d=w-ctx.yaw; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return ctx.yaw+clamp(d,-rate*dt,rate*dt); }
// loom: comes on slowly, swaying, to the edge of its reach (ctx.gap: how far she really is); backs off if she steps inside it
LIVE.loom={ start(ctx){ ctx.ph=ctx.ph||0; ctx.T=ctx.T||{}; ctx.T.mode="in"; },
  step(t,dt,ctx){ const T=ctx.T, R=REACH(), gap=ctx.gap??(NX-ctx.x); let J; ctx.yaw=turnTo(ctx,dt,0.9);
    const lost=ctx.wantV===0;
    if(lost||(gap<=R-0.02&&gap>=R-0.5)){ if(T.mode!=="hold"&&!gaitStop(ctx,dt,T.mode==="back"?-1:1,T.mode==="back"?1.3:1.7)) J=rWalk(t,ctx.ph); else { T.mode="hold"; J=tLegs(rStand(t),ctx.ph); }
      ctx.phase= lost?"stands, swaying":"at the edge of its reach · sways"; }
    else if(gap>R-0.02){ T.mode="in"; gaitOn(ctx,dt,1,1.7); J=rWalk(t,ctx.ph); ctx.phase="comes on slowly, swaying"; ctx.events.push({kind:"drag"}); }
    else { T.mode="back"; gaitOn(ctx,dt,-1,1.3); J=rWalk(t,ctx.ph); ctx.phase="backs off to keep its distance"; ctx.events.push({kind:"drag"}); }
    ctx.post=()=>{ if(KIND()==="neck") neckTo(neckShape(loomP(t)),nHead(),0.15); else { armTo("L",drape("L",t)); armTo("R",drape("R",t)); } };
    return fin(J); } };
LIVE.loom.phys=TPHYS;
// down: the legs go and it falls forward on its face; the neck (or the arms) lie out along the floor
LIVE.die={ start(ctx){ ctx.dT=null; },
  step(t,dt,ctx){ if(ctx.dT==null){ ctx.dT=t; ctx.dJ=rStand(t); } const u=sm5((t-ctx.dT)/0.7), J=P0(); J.hd=runner.hip0-0.14; J.hp=1.45; J.sp=0.05; J.nx=-0.4;
    J.aLx=-1.6; J.aRx=-1.3; J.aLz=0.5; J.aRz=0.6; J.eL=0.4; J.eR=0.6; J.lLx=-0.1; J.lRx=0.1; J.kL=0.3; J.kR=0.2;
    ctx.post=()=>{ const P=TP(), g=runner.group.position.clone().setY(0.07);
      if(KIND()==="neck"){ const root=nRoot(), down=mkPath([root, root.clone().addScaledVector(P.fwd,0.25).setY(Math.max(0.15,root.y*0.5)), g.clone().addScaledVector(P.fwd,0.9), g.clone().addScaledVector(P.fwd,1.8).addScaledVector(P.right,0.3), g.clone().addScaledVector(P.fwd,2.8).addScaledVector(P.right,-0.2)]);
        chainTo(runner.nk,runner.nkEnd,lerpPath(neckShape(loomP(t)),down,u),0.08); }
      else { armTo("L",drape("L",t,{fw:1.1})); armTo("R",drape("R",t,{fw:1.1,spread:0.3})); } };
    ctx.phase="dead"; return mix(ctx.dJ,J,u); } };
// an arm taken off at a joint by her shots (side, joint 1..3)
LIVE.cutArm=(h,s,j)=>{ pvBind(h); if(!runner.ar||runner.ar[s].cut!=null) return false; cutArm(s,RC.main[j-1]); return true; };
LIVE.kind=h=>{ pvBind(h); return RC&&RC.kind; };
LIVE.reach=h=>{ pvBind(h); return REACH(); };
