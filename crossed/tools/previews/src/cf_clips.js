// ---------------------------------------------------------------- the club-fist: a man dragged lopsided by one monstrous arm
// The club arm is a real pendulum hung from the shoulder (gravity, damping, and the body's own acceleration swing it);
// he leans away from it by a balance controller that reads his real centre of mass (the voxelised mesh) against his feet.
const GRAVC=9.8, CS={club:{x:0,v:0},side:{x:0,v:0},lastV:0,lastYaw:0,lean:0,err:0,leanF:0,errF:0};
function clubSwing(J,ctx,dt,o={}){ const Lc=0.62, c=CS.club, a=((ctx.v||0)-CS.lastV)/Math.max(dt,1e-4); CS.lastV=ctx.v||0;
  // body accelerating forward swings it back; a turn of the chest flings it out sideways
  const drive=(o.drive||0), turn=((J.syaw||0)-CS.lastYaw)/Math.max(dt,1e-4); CS.lastYaw=J.syaw||0;
  c.v+=(-(GRAVC/Lc)*Math.sin(c.x)-1.6*c.v+clamp(a,-12,12)/Lc*Math.cos(c.x)+drive)*dt; c.x+=c.v*dt;
  const s=CS.side; s.v+=(-(GRAVC/Lc)*Math.sin(s.x)-1.8*s.v+clamp(turn,-20,20)*0.9+(o.sideDrive||0))*dt; s.x+=s.v*dt;
  J.aRx=c.x+(o.base||0); J.aRz=0.3+s.x; J.eR=0.18; return J; }
// balance: lean the hips and chest away from the heavy side until the centre of mass is over the feet
function balance(C,m,ctx,dt){ if(!m||!m.con.length) return; let cx=0,cz=0; for(const p of m.con){ cx+=p.x; cz+=p.z; } cx/=m.con.length; cz/=m.con.length;
  const rx=Math.cos(ctx.yaw), rz=-Math.sin(ctx.yaw), fx=Math.sin(ctx.yaw), fz=Math.cos(ctx.yaw); CS.err=(m.com.x-cx)*rx+(m.com.z-cz)*rz; CS.lean=clamp(CS.lean+CS.err*dt*6,-0.45,0.45);
  if(!ctx.moving){ CS.errF=(m.com.x-cx)*fx+(m.com.z-cz)*fz; CS.leanF=clamp(CS.leanF-CS.errF*dt*6,-0.5,0.5); } else CS.leanF*=Math.max(0,1-dt*3); }   /* front-back too, when he's not walking */
function applyLean(J){ J.hroll=(J.hroll||0)+CS.lean*0.55; J.sroll=(J.sroll||0)+CS.lean*0.8; J.hp=(J.hp||0)+CS.leanF*0.45; J.sp=(J.sp||0)+CS.leanF*0.55; J.nz=(J.nz||0)-CS.lean*0.6; J.aLz=(J.aLz||0)+Math.max(0,-CS.lean)*0; return J; }
function stance(t){ const J=P0(); J.hd=0.05; J.kL=0.14; J.kR=0.2; J.lLx=-0.05; J.lRx=0.06; J.lLz=0.08; J.lRz=0.1; J.sp=0.12+0.015*Math.sin(t*1.6); J.nx=0.05;
  J.aLx=0.05+0.05*Math.sin(t*1.1); J.aLz=0.35; J.eL=0.45; return J; }   /* the left arm held out from the body: it helps balance him */
const CWALK={stance:0.6,front:-0.36,back:0.36,high:-0.6,kStance:0.16,kImpact:0.25,kLift:0.95,liftEnd:0.55};
function dragWalk(ph){ const J=P0(); const a=stride(ph,CWALK), b=stride((ph+0.5)%1,CWALK);
  J.lLx=a.lx; J.kL=a.k; J.fL=a.f; J.lRx=b.lx*0.8; J.kR=b.k*0.8+0.12; J.fR=b.f;    /* the heavy side's leg takes shorter, flatter steps: the limp */
  const imp=Math.max(0,1-(ph%0.5)/0.12); J.hd=0.06+0.06*imp*(ph>=0.5?1.4:0.7); J.sp=0.2+0.05*imp; J.hp=0.05; J.nx=-0.02;
  J.hyaw=0.1*Math.sin(ph*Math.PI*2); J.syaw=-0.14*Math.sin(ph*Math.PI*2); J.aLx=0.5*Math.sin(ph*Math.PI*2); J.aLz=0.4; J.eL=0.5; return J; }
A.idle={ start(ctx){ ctx.x=-0.5; ctx.yaw=Math.PI/2; ctx.norah=false; ctx.v=0; },
  step(t,dt,ctx){ ctx.phase= Math.abs(CS.club.x)>0.08?"the arm sways":"stands lopsided"; const J=stance(t); const push=t%3.2<0.15?2.2:0;   /* now and then he shifts his weight and the arm swings */
    clubSwing(J,ctx,dt,{drive:push}); return applyLean(J); } };
A.walk={ start(ctx){ ctx.x=-6; ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=false; },
  step(t,dt,ctx){ if(t<0.6){ ctx.phase="stands lopsided"; ctx.v=0; const J=stance(t); clubSwing(J,ctx,dt); return applyLean(J); }
    const prev=ctx.ph, slowR=ctx.ph>=0.5?0.75:1.15; ctx.ph=(ctx.ph+dt/1.25*slowR)%1;    /* lingers on the heavy-side foot */
    if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:ctx.ph<prev?0.5:0.85});
    if(t>9.4){ ctx.phase="stops"; ctx.v=Math.max(0,(ctx.v||0)-dt*2); const J=stance(t); clubSwing(J,ctx,dt); return applyLean(J); }
    ctx.v=1.05*(0.75+0.5*Math.max(0,1-(ctx.ph%0.5)/0.3)); ctx.x+=ctx.v*dt; ctx.phase="drags himself on · the arm swings";
    const J=dragWalk(ctx.ph); clubSwing(J,ctx,dt,{sideDrive:2.2*Math.sin(ctx.ph*Math.PI*2)}); return applyLean(J); } };
// ---- left jabs: quick and short, the left shoulder snapping forward
A.jab={ start(ctx){ ctx.x=3.2-1.25; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.k=0; },
  step(t,dt,ctx){ const J=stance(t); const jabs=[0.9,1.55,3.1];
    let e=0; for(const j0 of jabs){ const u=t-j0; if(u>=0&&u<0.36){ e= u<0.09? easeOut(u/0.09) : u<0.13? 1 : 1-ss((u-0.13)/0.23); if(u>=0.09&&!ctx["h"+j0]){ ctx["h"+j0]=1; ctx.events.push({kind:"jabHit"}); } } }
    J.aLx=-0.2-1.4*e; J.aLz=0.35-0.25*e; J.eL=1.7*(1-e)+0.05; J.syaw=-0.4*e; J.sp=0.12+0.08*e; J.lLx=-0.05-0.2*e; J.kL=0.14+0.15*e; J.hz=0.05*e;
    if(e===0){ J.aLx=-0.45; J.eL=1.7; J.aLz=0.25; }    /* guard up between jabs */
    ctx.phase= e>0?"jab":"guard up"; clubSwing(J,ctx,dt); return applyLean(J); } };
// ---- overhead hammer: heaves the club up over his head (the tell), brings it down; the weight drags him a step after it
A.hammer={ start(ctx){ ctx.x=3.2-2.25; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.soft=true; },
  step(t,dt,ctx){ const J=stance(t); ctx.soft=true;
    if(t<0.5){ ctx.phase="sizes her up"; clubSwing(J,ctx,dt); return applyLean(J); }
    let th;
    if(t<1.6){ const u=ss((t-0.5)/1.1); th=-3.0*u; J.sp=0.12+0.05*u; J.hp=0; J.kL=J.kR=0.14+0.25*u; J.hd=0.05+0.06*u; J.aLx=-0.9*u; J.aLz=0.35+0.3*u; J.eL=0.4; ctx.phase="heaves the club up over his head"; }
    else if(t<1.95){ const tr=noise(t*40,4)*0.05; th=-3.0+tr; J.sp=0.17+tr; J.hp=0; J.kL=J.kR=0.39; J.hd=0.11; J.aLx=-0.9; J.aLz=0.65; ctx.phase="holds it up, trembling (the tell)"; }
    else if(t<2.45){ const u=((t-1.95)/0.5)**2; th=-3.0+1.75*u; J.sp=0.17+0.45*u; J.hp=0.2*u; J.kL=J.kR=0.39+0.35*u; J.hd=0.11+0.12*u; J.aLx=-0.9+1.3*u; J.aLz=0.65-0.2*u; ctx.phase="brings it down";
      if(u>=0.999&&!ctx.hit){ ctx.hit=t; ctx.events.push({kind:"hammer"}); } }
    else { const k=t-(ctx.hit||2.45); const pull=ss(k/0.35), back=ss((k-0.9)/1.0);
      th=-1.25+1.25*back; J.sp=0.62*(1-back)+0.12*back; J.hp=0.2*(1-back); J.kL=0.74*(1-back)+0.14*back; J.kR=0.74*(1-back)+0.2*back; J.hd=0.23*(1-back)+0.05*back; J.aLx=0.4*(1-back); J.aLz=0.45;
      if(k<0.5){ const s2=Math.sin(Math.min(1,k/0.4)*Math.PI); J.lRx=-0.55*s2; J.kR+=0.6*s2; ctx.x+=dt*0.9*(1-pull*0.4); ctx.phase="its weight drags him a step forward"; } else ctx.phase= back<1?"drags the club back":"recovers";
      if(back>=1){ clubSwing(J,ctx,dt); return applyLean(J); } }
    CS.club.x=th; CS.club.v=0; J.aRx=th; J.aRz=0.3; J.eR=0.15; return applyLean(J); } };
// ---- grab and pound: the left hand seizes her collar, the club pounds; mash to tear free
let poundAlt=false; const poundOutcome=()=>{ const v=document.getElementById("oPound").value; if(v==="alt"){ poundAlt=!poundAlt; return poundAlt?"free":"beaten"; } return v; };
A.pound={ start(ctx){ ctx.x=3.2-2.1; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.ph=0; ctx.out=poundOutcome(); ctx.mash=0; ctx.n=0; },
  step(t,dt,ctx){ const nx=3.2;
    if(t<1.2){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt/1.0)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.7});
      ctx.v=1.1; ctx.x=Math.min(nx-0.82,ctx.x+ctx.v*dt); ctx.phase="lurches at her"; const J=dragWalk(ctx.ph); J.aLx=-0.9*ss((t-0.6)/0.6); J.eL=0.6; clubSwing(J,ctx,dt); return applyLean(J); }
    ctx.v=0; const tg=t-1.2; const J=stance(t);
    // the grip: left hand at her collar, his arm braced straight
    const reach=ss(tg/0.2); J.aLx=-1.25*reach; J.aLz=0.15; J.eL=0.35*reach+0.5*(1-reach); J.syaw=-0.25*reach; J.sp=0.18;
    if(tg>=0.2&&!ctx.seized){ ctx.seized=1; ctx.events.push({kind:"seized"}); }
    const free = ctx.out==="free" && ctx.mash>=1, done=ctx.res!=null;
    if(!done){ const rate=ctx.out==="free"?0.42:0.22; if(tg>0.2) ctx.mash=Math.min(1,ctx.mash+dt*rate); ctx.qte= tg>0.2? ctx.mash : null; }
    // pounding: each cycle heaves the club up and brings it down on her shoulder
    let th=0; const cyc=1.15, k=tg-0.35, c=Math.floor(k/cyc), u=k-c*cyc;
    if(!done && k>0){ if(u<0.7){ th=-2.5*ss(u/0.7); J.sp=0.18-0.25*ss(u/0.7); ctx.phase="raises the club"; }
      else { const d=Math.min(1,((u-0.7)/0.24)**2); th=-2.5+1.45*d; J.sp=-0.07+0.4*d; J.syaw=-0.25+0.35*d; ctx.phase="pounds her"; if(d>=1&&ctx.n<=c){ ctx.n=c+1; ctx.events.push({kind:"pound",n:ctx.n}); ctx.jolt=t; } } }
    if(free&&!done){ ctx.res="free"; ctx.resT=t; ctx.events.push({kind:"escape"}); }
    if(!done && ctx.out!=="free" && ctx.n>=3 && u>0.9){ ctx.res="beaten"; ctx.resT=t; ctx.events.push({kind:"beaten"}); }
    const jl=ctx.jolt!=null?Math.max(0,1-(t-ctx.jolt)/0.35):0;
    // her
    if(!done){ const nJ=NP.stand(); nJ.aLx=nJ.aRx=-1.15; nJ.eL=nJ.eR=1.5; nJ.aLz=nJ.aRz=-0.1; nJ.sp=-0.1-0.35*jl; nJ.kL=nJ.kR=0.1+0.5*jl; nJ.nx=-0.2+0.5*jl; nJ.hd=0.12*jl; ctx.nOver={J:nJ,x:nx}; }
    else if(ctx.res==="free"){ const r=t-ctx.resT; ctx.phase= r<0.5?"she tears loose":"he swings at air"; ctx.qte=null; J.aLx=-0.6*(1-ss(r/0.3)); th= r<0.6? -2.5+1.8*ss(r/0.5) : -0.7+0.7*ss((r-0.6)/0.8);
      ctx.nOver={J: r<0.5?NP.stumble():mix(NP.stumble(),NP.stand(),ss((r-0.5)/0.6)), x:nx+1.1*easeOut(Math.min(1,r/0.6))}; if(r>0.6){ clubSwing(J,ctx,dt); return applyLean(J); } }
    else { const r=t-ctx.resT; ctx.phase= r<0.6?"lets her drop":"stands over her"; ctx.qte=null; J.aLx=-1.25*(1-ss(r/0.4)); th=-1.05+1.05*ss(r/0.8);
      const nJ= r<0.5? mix(NP.stand(),NP.kneel(t),ss(r/0.5)) : NP.kneel(t); ctx.nOver={J:nJ,x:nx}; if(r>0.8){ clubSwing(J,ctx,dt); return applyLean(J); } }
    CS.club.x=th; CS.club.v=0; J.aRx=th; J.aRz=0.3; J.eR=0.15; return applyLean(J); } };
const LEN={idle:7, walk:11, jab:4.4, hammer:5.6, pound:7.5};
const NAMES={idle:"Stands lopsided",walk:"Drag walk",jab:"Left jabs",hammer:"Overhead hammer",pound:"Grab and pound"};
const DMG={jab:["NORAH −6","left jab"],hammer:["NORAH −45","overhead hammer · knocked down"],pound:["NORAH −15","pounded"],escape:["BROKE FREE","she tears out of his grip"],beaten:["NORAH −60","beaten to her knees"]};
