// ---------------------------------------------------------------- the attacks
const NQ={ aim(){ const J=NP.stand(); J.aRx=-1.5; J.eR=0.12; J.aLx=-1.3; J.eL=0.7; J.aLz=-0.1; return J; },
  aimUp(){ const J=NQ.aim(); J.aRx=-2.2; J.aLx=-2.0; J.nx=-0.45; J.sp=-0.12; return J; },
  walk(ph){ const J=NP.stand(); const s=Math.sin(ph*Math.PI*2); J.lLx=-0.35*s; J.lRx=0.35*s; J.kL=0.35*Math.max(0,s); J.kR=0.35*Math.max(0,-s); J.aLx=0.3*s; J.aRx=-0.3*s; return J; },
  flat(k){ const J=NP.stumble(); J.aLx=J.aRx=-1.8-0.5*sat(k/0.6); J.aLz=J.aRz=0.7; J.lLx=0.3*(1-sat(k/0.8)); J.kL=0.1+0.3*(1-sat(k/0.8)); J.lRx=-0.25*(1-sat(k/0.8)); J.kR=0.2; return J; },
  struggle(t){ const J=NQ.flat(1), n=s=>noise(t*16,s)*0.25; J.aLx=-1.2+n(1); J.aRx=-1.1+n(2); J.aLz=0.3; J.aRz=0.3; J.eL=1.2+n(3); J.eR=1.3+n(4); J.lLx=-0.4+n(5); J.kL=0.9; J.lRx=-0.2+n(6); J.kR=0.7; J.nx=0.35; return J; } };
// an upright stance and walk for the third subclass (it walks like a man, then does what a man can't)
function manStand(t){ const J=stance(t); J.aLz=J.aRz=0.12; J.eL=J.eR=0.3; J.nx=0.05; J.sp=0.05; J.lLz=J.lRz=0; J.lLx=J.lRx=0; J.kL=J.kR=0.1; return J; }
function manWalk(t,ph){ const J=tLegs(manStand(t),ph); J.aLx=0.25*Math.sin(ph*Math.PI*2); J.aRx=-J.aLx; return J; }
function walkTo(ctx,t,dt,stopAt){ const go=ctx.x<stopAt; if(go){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt/1.1)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.4}); ctx.moving=true; ctx.gait={ph:ctx.ph,P:TWALK}; ctx.phase="walks like a man"; return manWalk(t,ctx.ph); } return null; }
let altK={};
const outcome=(id,a,b)=>{ const v=document.getElementById(id).value; if(v==="alt"){ altK[id]=!altK[id]; return altK[id]?a:b; } return v; };

// ---- drop from above: it hangs high on the wall; when she passes under, it lets go onto her and pins her. Mash to throw it off.
A.drop={ start(ctx){ ensureWall(); ctx.wallOn=true; ctx.x=WX-1.6; ctx.yaw=Math.PI/2; ctx.travel=null; ctx.norah=true; ctx.v=0; ctx.elev=0; ctx.T={ph:"crawl"}; ctx.nx=NX+2.5; ctx.nph=0; ctx.out=outcome("oDrop","off","bitten"); ctx.mash=0; },
  step(t,dt,ctx){ const T=ctx.T, under=WX-1.2*Z();
    // her: walks in under the wall, aiming about; it drops onto her and she goes down under it
    if(!T.landT){ if(T.ph==="hang"||T.ph==="drop"){ if(ctx.nx>under+0.05){ ctx.nph+=dt/0.75; ctx.nx=Math.max(under,ctx.nx-1.1*dt); ctx.nOver={J:NQ.walk(ctx.nph),x:ctx.nx}; } else ctx.nOver={J:T.ph==="drop"?NQ.aimUp():NQ.aim(),x:ctx.nx}; } else ctx.nOver={J:NQ.aim(),x:ctx.nx}; }
    const J=climbClip(ctx,t,dt,{ wait:()=> ctx.nx<=under+0.06 ? (T.waitT??(T.waitT=t-T.t0))+0.35 : 99,
      look:k=>{}, v:()=>({x:-1.6*Z(),y:0.5,z:0}),
      post:k=>{ if(k>0.5&&!T.landT){ T.landT=t; ctx.events.push({kind:"dropHit"}); } } });
    if(T.landT){ const k=t-T.landT; ctx.onLimbs=true;
      if(ctx.out==="off" && ctx.mash>=1){ if(!T.offT){ T.offT=t; ctx.events.push({kind:"thrownOff"}); } }
      const pinned=!T.offT; if(pinned){ ctx.mash=Math.min(1,ctx.mash+dt*(ctx.out==="off"?0.38:0.18)); ctx.qte=ctx.mash; } else ctx.qte=null;
      const n= pinned? (k<0.3?NP.stumble():NQ.struggle(t)) : NQ.struggle(t); ctx.nOver={J:n,x:ctx.nx,fall:PHYS.topple(ctx.nT||(ctx.nT={th:0.3,w:2.6}),dt,1.65,1.45)};
      if(pinned){ ctx.phase= k<0.4?"drops onto her · she goes down under it":"pins her · mash to throw it off";
        if(ctx.out==="bitten"&&k>1.4){ const b=Math.max(0,Math.sin((k-1.4)*7)); J.nx=(J.nx||0)+0.7*b; if(b>0.97&&!T.bit){ T.bit=1; ctx.events.push({kind:"bite"}); } if(b<0.5) T.bit=0; } }
      else { const r=t-T.offT; ctx.phase="she throws it off"; ctx.kick={id:"off"+T.offT,v:{x:-2.4*Z(),y:1.2,z:0}}; }
      if(ctx.out==="bitten"&&k>4.0&&!T.end){ T.end=1; ctx.qte=null; } }
    return J; } };

// ---- wrong-angle strike: it walks up like a man; the arm bends back the wrong way at the elbow and swings round over the
// top from behind, hitting her from an angle she didn't expect
A.strike={ start(ctx){ ctx.x=NX-4.5*Z(); ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.ph=0; ctx.T={}; },
  step(t,dt,ctx){ const T=ctx.T; ctx.nOver={J:NQ.aim(),x:NX};
    const W=walkTo(ctx,t,dt,NX-1.05*Z()); if(W) return W; if(T.t0==null){ T.t0=t; }
    const k=t-T.t0, J=manStand(t); ctx.phase= k<0.7?"stops · the elbow pops the wrong way (the tell)": k<1.05?"the arm whips round over the top":"recovers, twisting back";
    const pop=sm5(k/0.5), sw=Math.pow(sat((k-0.7)/0.32),1.3), back=sm5((k-1.3)/0.8);
    J.eR=-1.15*pop*(1-back)+0.3*back; J.aRz=0.15+0.5*pop*(1-sw);                      /* the elbow bent backward: a joint going the wrong way */
    J.aRx= (0.9*pop)*(1-sw) + (-4.5)*sw*(1-back) + 0.05*back;                          /* back, then up and over and down into her */
    J.syaw= 0.45*pop*(1-sw) - 0.7*sw*(1-back); J.sroll=-0.2*sw*(1-back); J.sp=0.1+0.2*sw*(1-back); J.ny=-0.5*pop*(1-back); J.kL=J.kR=0.15+0.15*sw*(1-back);
    if(sw>0.85&&!T.hit){ T.hit=t; ctx.events.push({kind:"strike"}); }
    if(T.hit){ const h=t-T.hit; const n=h<0.5?NP.stumble():NP.stand(); n.syaw=0.4*(1-sat(h/0.8)); ctx.nOver={J:n,x:NX+0.25*sm5(h/0.4),z:-0.35*sm5(h/0.4),roll:-0.2*Math.sin(Math.min(1,h/0.6)*Math.PI)}; }
    return J; } };

// ---- leg wrap: it scuttles in low, coils its arms round her shins and drags her down, then climbs up her body
A.wrap={ start(ctx){ ctx.x=NX-4.2*Z(); ctx.yaw=Math.PI/2; ctx.travel=null; ctx.norah=true; ctx.v=0; ctx.T={}; },
  step(t,dt,ctx){ const T=ctx.T, Q=QCRAWL(), vmax=1.7*Z()*QUICK(); ctx.onLimbs=true;
    if(!T.grab){ const go=ctx.x<NX-0.95*Z(); ctx.v+=((go?vmax:0)-ctx.v)*Math.min(1,dt*8); ctx.x+=ctx.v*dt; ctx.moving=ctx.v>0.05; ctx.phase="scuttles in low"; ctx.nOver={J:NQ.aim(),x:NX};
      if(!go&&ctx.v<0.1){ T.grab=t; } const J=crawlBody(t,ctx.moving?Math.sin(t*12):0); ctx.post=()=>{ Q.v=vmax; gaitStep(ctx,Q,dt*(ctx.v/vmax),ctx.moving); limbsIK(ctx,crawlPoles); }; return J; }
    const k=t-T.grab, J=crawlBody(t,0);
    // her shins: the hands wrap round them; she's dragged down backward
    const shin=s=>norah.c.B["shin_"+s].getWorldPosition(new V3());
    const fall=k>0.7? PHYS.topple(ctx.nT||(ctx.nT={th:0.15,w:1.8}),dt,1.65,1.45):0;
    ctx.nOver={J: k<0.7? (()=>{ const n=NP.stand(); n.aRx=-1.2; n.aLx=-0.9; n.sp=0.25*sm5(k/0.7); n.nx=0.4*sm5(k/0.7); return n; })() : NQ.flat(k-0.7), x:NX, fall};
    // climbing up her: it advances along her body as she lies
    const climb=sm5((k-1.6)/1.6); if(climb>0) ctx.x=Math.min(NX+0.55*Z(),ctx.x+dt*0.5*Z()*(k<3.2?1:0));
    ctx.phase= k<0.7?"coils its arms round her shins": k<1.6?"drags her down":"climbs up her body";
    ctx.post=()=>{ const G=gaitStep(ctx,Q,dt*(climb>0&&k<3.2?0.45:0),climb>0&&k<3.2);
      if(k<1.4){ for(const s of ["L","R"]){ const st=G.limb["arm"+s], p=shin(s==="L"?"R":"L"); st.anchor=null; st.swing=null; st.tgt=(st.tgt||p).clone().lerp(p,sm5(k/0.35)); } }
      limbsIK(ctx,crawlPoles); };
    if(k>0.4&&!T.pull){ T.pull=1; ctx.events.push({kind:"wrap"}); }
    if(k>3.2){ const b=Math.max(0,Math.sin((k-3.2)*6)); J.nx-=0.6*b; if(b>0.97&&!T.bit){ T.bit=1; ctx.events.push({kind:"bite"}); } if(b<0.5) T.bit=0; }
    return J; } };

// ---- neck-twist bite: its back is to her. As she comes up behind it, the head turns all the way round, joint by joint
// with a crack, and it lunges backward, biting, while the body still faces away
A.bite={ start(ctx){ ctx.x=NX-1.0*Z(); ctx.yaw=-Math.PI/2; ctx.norah=true; ctx.v=0; ctx.T={}; ctx.nx=NX+2.2; ctx.nph=0; },
  step(t,dt,ctx){ const T=ctx.T, J=manStand(t);
    if(ctx.nx>NX+0.05){ ctx.nph+=dt/0.8; ctx.nx=Math.max(NX,ctx.nx-1.0*dt); ctx.nOver={J:NQ.walk(ctx.nph),x:ctx.nx}; } else ctx.nOver={J:NQ.aim(),x:NX};
    if(T.t0==null && ctx.nx<NX+0.6) T.t0=t; if(T.t0==null){ ctx.phase="its back to her · she comes up behind it"; J.ny=0.15*Math.sin(t*0.8); return J; }
    const k=t-T.t0, turn=k<1.3? (Math.floor(k/0.32)+sm5((k%0.32)/0.12))/4 : 1;   /* in jerks, a crack at each */
    if(Math.floor(k/0.32)!==T.cr&&k<1.3){ T.cr=Math.floor(k/0.32); ctx.events.push({kind:"pop"}); }
    J.ny=Math.PI*0.98*Math.min(1,turn); J.hdy=0; J.nx=-0.05;
    const lunge=sm5((k-1.5)/0.22)*(1-sm5((k-2.2)/0.5)); J.sp=-0.35*lunge; J.hp=-0.12*lunge; J.kL+=0.25*lunge; J.kR+=0.25*lunge; J.nx=-0.05-0.5*lunge;
    ctx.local={x:0,z:-0.35*lunge*Z()};
    ctx.phase= k<1.3?"the head turns all the way round, crack by crack": k<2.2?"lunges backward, biting":"holds her gaze, body still turned away";
    if(lunge>0.95&&!T.bit){ T.bit=t; ctx.events.push({kind:"bite"}); }
    if(T.bit){ const h=t-T.bit; const n=NP.stumble(); n.aLx=-1.4; n.aLz=0.3; n.eL=1.6; ctx.nOver={J:h<0.6?n:NQ.aim(),x:NX+0.35*sm5(h/0.3)}; }
    return J; } };
