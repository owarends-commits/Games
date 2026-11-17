// ================================================================ the Contortionist, live (playground)
// Locomotion that goes anywhere: the preview's bodies and gait, with its heading (ctx.wantYaw, stage yaw) and pace
// (ctx.wantV, 0..1) handed in by the AI. The attacks are the preview's own clips (A.strike, A.wrap, A.bite).
const LIVE={};
function turnTo(ctx,dt,rate){ const w=ctx.wantYaw??ctx.yaw; let d=w-ctx.hd0; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; ctx.hd0+=clamp(d,-rate*dt,rate*dt); return ctx.hd0; }
// spider crawl: bursts and freezes, as in the preview; it goes where it's sent
LIVE.crawl={ start(ctx){ ctx.hd0=ctx.yaw; ctx.burst={on:true,t:0.6}; },
  step(t,dt,ctx){ if(ctx.hd0==null){ ctx.hd0=ctx.yaw; ctx.burst={on:true,t:0.6}; } const B=ctx.burst; B.t-=dt; if(B.t<=0){ B.on=!B.on; B.t=B.on?0.7+Math.random()*0.6:0.35+Math.random()*0.6; }
    const Q=QCRAWL(), vmax=1.6*Z()*QUICK(), want=(ctx.wantV??0)>0.05, go=want&&(B.on||ctx.wantV>1);
    ctx.yaw=turnTo(ctx,dt,2.4); ctx.v+=((go?vmax*Math.min(1,ctx.wantV):0)-ctx.v)*Math.min(1,dt*(go?9:14)); const mv=ctx.v>0.05;
    ctx.x+=Math.sin(ctx.yaw)*ctx.v*dt; ctx.z=(ctx.z||0)+Math.cos(ctx.yaw)*ctx.v*dt; ctx.moving=mv;
    ctx.phase= mv?"scuttles":"freezes · watching"; const J=crawlBody(t,mv?Math.sin(t*12):0); if(!mv){ J.ny=0.35*Math.sin(t*0.9); J.nx+=0.1*Math.sin(t*1.7); }
    ctx.onLimbs=true; ctx.post=()=>{ Q.v=vmax; gaitStep(ctx,Q,dt*(ctx.v/vmax),mv||Math.abs((ctx.wantYaw??ctx.yaw)-ctx.yaw)>0.3); limbsIK(ctx,crawlPoles); }; return J; } };
// backbend spider walk: bent over backward, belly up, head first; the body faces back along its travel
LIVE.bend={ start(ctx){ ctx.hd0=ctx.yaw+Math.PI; },
  step(t,dt,ctx){ if(ctx.hd0==null) ctx.hd0=ctx.yaw+Math.PI; const Q=QBEND(), vmax=2.1*Z()*QUICK(), go=(ctx.wantV??0)>0.05; const tr=turnTo(ctx,dt,2.0);
    ctx.yaw=tr+Math.PI; ctx.travel=new V3(Math.sin(tr),0,Math.cos(tr)); ctx.v+=((go?vmax*Math.min(1,ctx.wantV):0)-ctx.v)*Math.min(1,dt*6);
    ctx.x+=ctx.travel.x*ctx.v*dt; ctx.z=(ctx.z||0)+ctx.travel.z*ctx.v*dt; ctx.moving=ctx.v>0.05;
    ctx.phase= ctx.moving?"skitters, head first, belly up":"bent over backward, head twisted round"; const J=bendBody(t,ctx.moving?Math.sin(t*14):0);
    ctx.onLimbs=true; ctx.post=()=>{ Q.v=vmax; gaitStep(ctx,Q,dt*(ctx.v/vmax||0),ctx.moving); limbsIK(ctx,bendPoles); }; return J; } };
// walks like a man (the disguise), then can fold
LIVE.walk={ start(ctx){ ctx.hd0=ctx.yaw; ctx.ph=ctx.ph||0; },
  step(t,dt,ctx){ if(ctx.hd0==null) ctx.hd0=ctx.yaw; const go=(ctx.wantV??0)>0.05; ctx.yaw=turnTo(ctx,dt,2.2);
    if(go){ const prev=ctx.ph||0; ctx.ph=(prev+dt/1.2)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.4}); ctx.moving=true; ctx.gait={ph:ctx.ph,P:TWALK}; }
    ctx.phase= go?"walks like a man":"stands like a man"; const J=go?tLegs(stance(t),ctx.ph):stance(t); J.aLx=0.25*Math.sin((ctx.ph||0)*Math.PI*2); J.aRx=-J.aLx; J.aLz=J.aRz=0.12; J.eL=J.eR=0.3; J.nx=0.05; J.sp=0.05; return J; } };
LIVE.walk.phys={ active:ctx=>(ctx.phase||"").startsWith("walks"), stance:ctx=>strideStance(ctx.ph,TWALK), traction:8, imp:0.6, rollK:0 };
// the fold: from standing, it snaps down into the crawl, joints popping the wrong way
LIVE.fold={ start(ctx){ ctx.fT=null; ctx.pops=0; },
  step(t,dt,ctx){ if(ctx.fT==null){ ctx.fT=t; ctx.pops=0; } const u=(t-ctx.fT)/0.75, Q=QCRAWL(); ctx.phase="snaps down · its joints pop the wrong way";
    const w=sm5(u); const J=mix(stance(t),crawlBody(t,0),w); for(const th of [0.15,0.35,0.55,0.75]) if(u>=th&&ctx.pops<th*4+0.5){ ctx.pops++; ctx.events.push({kind:"pop"}); }
    ctx.onLimbs=true; ctx.post=()=>{ gaitStep(ctx,Q,0,false); for(const L of LIMBS){ const st=ctx.G.limb[L.k]; st.anchor=null; st.tgt=null; }
      for(const L of LIMBS){ const root=limbRoot(L), down=floorSurf.hold(root,L,Q); const hang=root.clone().add(new V3(0,-limbLen(L)*0.95,0)); ctx.G.limb[L.k].tgt=hang.lerp(down,sm5((u-(L.arm?0.1:0.3))/0.6)); }
      limbsIK(ctx,(L,root)=>{ const a=popPoles(L,root), b=crawlPoles(L,root); return a.lerp(b,sm5((u-0.6)/0.4)); }); };
    if(u>=1) ctx.folded=true; return J; } };
// down: it goes limp onto its front, limbs splayed, and the floor takes it
LIVE.die={ start(ctx){ ctx.dT=null; },
  step(t,dt,ctx){ if(ctx.dT==null) ctx.dT=t; const u=sm5((t-ctx.dT)/0.6), J=P0(); J.hd=runner.hip0-0.14; J.hp=1.45; J.sp=0.05; J.nx=-0.15+0.3*u; J.ny=0.5*u;
    J.aLx=-2.3; J.aRx=-2.0; J.aLz=0.65; J.aRz=0.5; J.eL=0.7; J.eR=0.5; J.lLx=-0.2; J.lRx=0.15; J.kL=0.5; J.kR=0.3; J.lLz=0.25; J.lRz=0.2;
    const from=ctx.dJ||(ctx.dJ=crawlBody(t,0)); ctx.phase="dead"; return mix(from,J,u); } };
