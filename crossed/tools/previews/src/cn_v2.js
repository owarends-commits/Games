// ---- Norah down on her back, and getting back up: lying, sitting up, onto a knee, standing (one pose space, no snapping)
const NG={ lie(t,k){ const J=P0(), n=s=>noise(t*9,s)*0.08*k; J.hd=norah.c.R.hip0-0.13; J.hp=-1.5; J.sp=-0.05+n(1); J.nx=0.25+n(2); J.lLx=0.05+n(3); J.lRx=-0.05+n(4); J.kL=0.15+Math.abs(n(5)); J.kR=0.1+Math.abs(n(6));
    J.aLx=-2.6+n(7); J.aRx=-2.5+n(8); J.aLz=J.aRz=0.35; J.eL=0.5+n(9); J.eR=0.6+n(10); return J; },   /* flat on her back, arms over her head clawing at the floor */
  sit(){ const J=P0(); J.hd=norah.c.R.hip0-0.14; J.hp=-0.25; J.sp=0.25; J.nx=0.1; J.lLx=-1.3; J.lRx=-1.25; J.kL=0.6; J.kR=0.35; J.aLx=0.7; J.aRx=0.7; J.aLz=J.aRz=0.25; J.eL=J.eR=0.2; return J; },
  knee(){ const J=NP.kneel(0); J.aLx=-0.4; J.aRx=-0.2; return J; },
  up(t,u){ return u<0.3? mix(NG.lie(t,0),NG.sit(),sm5(u/0.3)) : u<0.62? mix(NG.sit(),NG.knee(),sm5((u-0.3)/0.32)) : mix(NG.knee(),NQ.aim(),sm5((u-0.62)/0.38)); } };
const HIPLEN=()=>norah.c.R.hip0*0.97;   /* her hips are this far from her feet: where the lying pose puts them */

// ---- leg wrap: it scuttles in low, coils its arms round her shins and drags her down, then backs away dragging her flat
// along the floor by the legs. She kicks it off and gets up.
A.wrap={ start(ctx){ ctx.x=NX-4.2*Z(); ctx.yaw=Math.PI/2; ctx.travel=null; ctx.norah=true; ctx.v=0; ctx.T={}; ctx.nX=NX; },
  step(t,dt,ctx){ const T=ctx.T, Q=QCRAWL(), vmax=1.7*Z()*QUICK(); ctx.onLimbs=true;
    if(!T.grab){ const go=ctx.x<NX-0.95*Z(); ctx.v+=((go?vmax:0)-ctx.v)*Math.min(1,dt*8); ctx.x+=ctx.v*dt; ctx.moving=ctx.v>0.05; ctx.phase="scuttles in low"; ctx.nOver={J:NQ.aim(),x:NX};
      if(!go&&ctx.v<0.1){ T.grab=t; } const J=crawlBody(t,ctx.moving?Math.sin(t*12):0); ctx.post=()=>{ Q.v=vmax; gaitStep(ctx,Q,dt*(ctx.v/vmax),ctx.moving); limbsIK(ctx,crawlPoles); }; return J; }
    const k=t-T.grab, J=crawlBody(t,0), shin=s=>norah.c.B["shin_"+s].getWorldPosition(new V3());
    const D0=1.5, D1=3.3, K0=3.5;   /* down by 1.5 s; dragged until 3.3 s; she kicks free at 3.5 s */
    // her: pulled off her feet backward, then lying flat (in the lying pose, hips at her old hip spot), dragged feet first
    if(k<D0){ const n= k<0.6? (()=>{ const q=NP.stand(); q.aRx=-1.2; q.aLx=-0.9; q.sp=0.25*sm5(k/0.6); q.nx=0.4*sm5(k/0.6); return q; })() : NQ.flat(k-0.6);
      ctx.nOver={J:n,x:NX,fall:PHYS.topple(ctx.nT||(ctx.nT={th:0.15,w:1.8}),dt,1.65,1.45)}; ctx.nX=NX+HIPLEN(); }
    else if(!T.free){ const dragging=k<D1; if(dragging) ctx.nX-=dt*0.85*Z(); ctx.nOver={J:NG.lie(t,dragging?1:0.5),x:ctx.nX,down:true};
      if(k>K0){ T.free=t; ctx.events.push({kind:"kickFree"}); } }
    else { const u=sat((t-T.free-0.35)/1.9); ctx.nOver={J:u>0?NG.up(t,u):NG.lie(t,1),x:ctx.nX-HIPLEN()*sm5((u-0.62)/0.38),down:u<0.62}; }
    // it: hands on her shins; it backs away on its feet, hauling her along
    const backing=k>=D0&&k<D1, kicked=T.free?t-T.free:-1; ctx.travel= backing? new V3(-1,0,0) : null;
    if(backing) ctx.x-=dt*0.85*Z();
    if(kicked>=0){ ctx.kick={id:"kickfree"+T.free,v:{x:-2.4*Z(),y:1.0,z:0.4}}; }
    ctx.phase= k<0.7?"coils its arms round her shins": k<D0?"drags her down": k<D1?"drags her flat along the floor": !T.free?"holds her by the legs": kicked<0.5?"she kicks it off":"she gets up";
    ctx.post=()=>{ const G=gaitStep(ctx,Q,backing?dt*0.85/1.0:0,backing);
      if(kicked<0||kicked<0.15){ for(const s of ["L","R"]){ const st=G.limb["arm"+s], p=shin(s==="L"?"R":"L"); st.anchor=null; st.swing=null; st.tgt=(st.tgt||p).clone().lerp(p,sm5(k/0.35)); } }
      limbsIK(ctx,crawlPoles); };
    if(k>0.4&&!T.pull){ T.pull=1; ctx.events.push({kind:"wrap"}); }
    return J; } };

// ---- neck-twist run: its back is to her. The head ticks round, crack by crack, until it faces her over its spine; then
// it comes at her backward in a stiff, quickening shuffle, the head locked on her while the body twists the other way
// at every step, and lunges back into her, biting.
A.bite={ start(ctx){ ctx.x=NX-4.6*Z(); ctx.yaw=-Math.PI/2; ctx.norah=true; ctx.v=0; ctx.T={}; ctx.ph=0; },
  step(t,dt,ctx){ const T=ctx.T, J=manStand(t), toN=()=>Math.atan2(NX-ctx.x,0)-ctx.yaw;
    ctx.nOver={J:NQ.aim(),x:NX};
    if(t<0.5){ ctx.phase="its back to her"; return J; }
    const k=t-0.5;
    if(k<1.6){ const n=Math.min(6,Math.floor(k/0.26)), f=(n+sm5(((k%0.26))/0.09))/6;   /* six ticks: the head turns all the way back */
      if(n!==T.cr){ T.cr=n; ctx.events.push({kind:"pop"}); } J.ny=Math.PI*Math.min(1,f); J.nx=-0.08; J.hdy=0.02*Math.sin(t*60)*(1-f);
      ctx.phase="the head ticks round, crack by crack, until it faces her"; return J; }
    // the shuffle: backward toward her, quickening; each step the body twists to the other side, the head held on her
    const s=k-1.6, gap=NX-ctx.x;
    if(!T.lunge){ const v=Math.min(2.4,0.8+s*0.9)*Z(), rate=v/(0.34*Z()); const prev=ctx.ph; ctx.ph=(ctx.ph+dt*rate*0.5)%1; const step=Math.floor(ctx.ph*2);
      if(step!==T.st){ T.st=step; ctx.events.push({kind:"stomp",side:step?"R":"L",strength:0.5}); }
      ctx.x+=v*dt; ctx.moving=true; const sw=step?1:-1, snap=sm5(((ctx.ph*2)%1)/0.25); T.tw=(T.tw||0)+((sw*0.75)-(T.tw||0))*snap*0.5;
      ctx.yaw=-Math.PI/2+T.tw; ctx.levelHead={pitch:0.05,yaw:Math.atan2(NX-ctx.x,0.0001)-ctx.yaw,roll:0};
      const a=Math.sin(ctx.ph*Math.PI*2); J.lLx=0.28*a; J.lRx=-0.28*a; J.kL=0.06+0.12*Math.max(0,-a); J.kR=0.06+0.12*Math.max(0,a); J.fL=J.fR=0; J.sp=-0.05; J.aLx=J.aRx=0.05; J.aLz=J.aRz=0.1; J.eL=J.eR=0.1;   /* stiff: barely bends a knee */
      J.hd=0.02*Math.abs(a); J.syaw=-T.tw*0.4; ctx.phase= s<1.2?"shuffles at her backward, stiff, the body switching sides each step":"breaks into a stiff backward run";
      if(gap<0.95*Z()){ T.lunge=t; } return J; }
    const l=t-T.lunge, lg=sm5(l/0.18)*(1-sm5((l-0.7)/0.6)); ctx.levelHead={pitch:0.05-0.35*lg,yaw:Math.atan2(NX-ctx.x,0.0001)-ctx.yaw,roll:0};
    J.sp=-0.4*lg; J.hp=-0.15*lg; J.kL=J.kR=0.1+0.25*lg; ctx.local={x:0,z:-0.3*lg*Z()}; ctx.phase= l<0.7?"lunges back into her, biting":"holds on her, still facing away";
    if(lg>0.95&&!T.bit){ T.bit=t; ctx.events.push({kind:"bite"}); }
    if(T.bit){ const h=t-T.bit; const n=NP.stumble(); n.aLx=-1.4; n.aLz=0.3; n.eL=1.6; ctx.nOver={J:h<0.6?n:NQ.aim(),x:NX+0.35*sm5(h/0.3)}; }
    return J; } };
