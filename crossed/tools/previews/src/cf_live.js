// ================================================================ the club-fist Brute, live (playground)
const LIVE={}; const WALK_PHASE="drags himself on · the arm swings";
function turnTo(ctx,dt,rate){ const w=ctx.wantYaw??ctx.yaw; let d=w-ctx.yaw; while(d>Math.PI) d-=2*Math.PI; while(d<-Math.PI) d+=2*Math.PI; return ctx.yaw+clamp(d,-rate*dt,rate*dt); }
const pvZ=()=>typeof Z==="function"?Z():1;
// the drag walk, steered: it turns toward where it wants to go, and stands when there's nowhere to go
LIVE.walk={ start(ctx){ ctx.ph=ctx.ph||0; },
  step(t,dt,ctx){ ctx.yaw=turnTo(ctx,dt,1.0);
    if(!(ctx.wantV>0)){ ctx.phase="stands lopsided"; ctx.v=0; const J=stance(t); clubSwing(J,ctx,dt); return applyLean(J); }
    const prev=ctx.ph, slowR=ctx.ph>=0.5?0.75:1.15; ctx.ph=(ctx.ph+dt/1.25*slowR)%1;
    if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:ctx.ph<prev?0.5:0.85});
    ctx.v=1.05*pvZ()*(0.75+0.5*Math.max(0,1-(ctx.ph%0.5)/0.3)); ctx.moving=true; ctx.phase=WALK_PHASE;
    const J=dragWalk(ctx.ph); if(dragWalk.scrape){ ctx.scrT=(ctx.scrT||0)-dt; if(ctx.scrT<=0){ ctx.scrT=0.09; ctx.events.push({kind:"scrape"}); } }
    clubSwing(J,ctx,dt,{sideDrive:2.2*Math.sin(ctx.ph*Math.PI*2)}); return applyLean(J); } };
LIVE.walk.phys=CWALKPHYS;
// down: goes over backward, rigid, the way the tipped club takes him, and lies there
LIVE.die={ start(ctx){ ctx.dS={th:0.04,w:0.5}; ctx.dJ=ctx.lastJ||stance(0); ctx.dk=0; },
  step(t,dt,ctx){ ctx.dk+=dt; const S2=ctx.dS, u=sm5(ctx.dk/0.6); PHYS.topple(S2,dt,1.9*pvZ(),Math.PI/2-0.05); ctx.rise=-S2.th; ctx.noBal=1;
    const L=P0(); L.sp=-0.08; L.kL=L.kR=0.05; L.aLx=-1.2; L.aLz=0.7; L.eL=0.3; L.aRx=-1.0; L.aRz=0.5; L.eR=0.2; L.nx=-0.3; ctx.phase="dead"; return mix(ctx.dJ,L,u); } };
// up again (after the club tipped him over): rocks back up to his feet
LIVE.rise={ start(ctx){ ctx.rJ=ctx.lastJ||stance(0); ctx.rTh=(ctx.tS&&ctx.tS.th)||0; ctx.rk=0; },
  step(t,dt,ctx){ ctx.rk+=dt; const u=sm5(ctx.rk/1.6); if(ctx.rTh>0.02){ ctx.rise=-ctx.rTh*(1-u); ctx.noBal=1; } else ctx.noBal=0;
    const J=stance(t); clubSwing(J,ctx,dt); ctx.phase=u<1?"heaves himself back up":"stands lopsided"; return mix(ctx.rJ,applyLean(J),u); } };
