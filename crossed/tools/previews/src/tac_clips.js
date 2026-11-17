// ================================================================ the TACTICIAN
// A man's body under a head nearly a metre across that hangs forward and to its left. The head is real mass (the guard
// weighs the mesh by volume), so it leans back and to the right to stand over its feet, and its left hand comes up to
// steady the head. It moves carefully, stops dead to watch, mirrors her, waits for an opening, and backs off when hurt.
const sm5=x=>{ x=sat(x); return x*x*x*(x*(x*6-15)+10); };
const Z=()=>(runner&&runner.sz)||1, V3=THREE.Vector3;
SLOUCH.s=0;                                          /* no heavy arm to slouch into */
const TWALK={stance:0.64,front:-0.3,back:0.3,high:-0.5,kStance:0.1,kImpact:0.1,kLift:0.8,liftEnd:0.55};
const TPHYS={ active:ctx=>(ctx.phase||"").startsWith("steps"), stance:ctx=>strideStance(ctx.ph,TWALK), traction:8, imp:0.6, rollK:0.3 };
const TP=()=>({fwd:new V3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw)), right:new V3(-Math.cos(ctx.yaw),0,Math.sin(ctx.yaw))});
const NX=3.2;
// a point on the head: its centre plus ox to its left, oy up, oz forward (world metres)
function headPt(ox,oy,oz){ runner.group.updateMatrixWorld(true); const P=TP(); return runner.B.head.localToWorld(runner.headC.clone()).addScaledVector(P.right,-ox).add(new V3(0,oy,0)).addScaledVector(P.fwd,oz); }
function headAnchor(C){ let mesh; C.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); const g=mesh.geometry, si=g.attributes.skinIndex, sw=g.attributes.skinWeight, pos=g.attributes.position, hb=mesh.skeleton.bones.findIndex(b=>b.name==="head");
  C.group.updateMatrixWorld(true); const c=new V3(), v=new V3(); let n=0; const pts=[]; for(let i=0;i<pos.count;i++){ if(si.getX(i)===hb&&sw.getX(i)>0.5){ v.fromBufferAttribute(pos,i).applyMatrix4(mesh.matrixWorld); c.add(v); n++; if(i%4===0) pts.push(C.B.head.worldToLocal(v.clone())); } }
  c.divideScalar(Math.max(1,n)); C.headC=C.B.head.worldToLocal(c); C.headPts=pts; }
/* the lowest point of the head in the world (it's one rigid lump on the head bone) */
function headLow(){ runner.group.updateMatrixWorld(true); let lo=1e9; const v=new V3(); for(const p of runner.headPts){ v.copy(p); runner.B.head.localToWorld(v); lo=Math.min(lo,v.y); } return lo; }
// the left hand under the left side of the head, the elbow out and down
function braceHead(ctx,w){ if(w<=0.01) return; ctx.ik={side:"L",w,tip:0.07,at:()=>{ const P=TP(), sh=runner.B.upperarm_L.getWorldPosition(new V3());
  return {target:headPt(0.24*Z(),-0.33*Z(),0.03*Z()), pole:sh.addScaledVector(P.right,-0.55).add(new V3(0,-0.35,0)).addScaledVector(P.fwd,-0.1)}; }}; }
// standing braced: leaning back and right against the head's weight, knees soft
function tStand(t){ const J=stance(t); J.kL=0.12; J.kR=0.16; J.lLz=0.1; J.lRz=0.12; J.sp=-0.1+0.012*Math.sin(t*1.4); J.sroll=0.1; J.hroll=-0.04; J.nz=0.1; J.nx=-0.05;
  J.aRx=0.05; J.aRz=0.16; J.eR=0.35; return J; }
function lookAt(J,ctx,tx,tz,k=1){ const b=Math.atan2(tx-ctx.x,tz-(ctx.z||0)); let d=b-ctx.yaw; d=Math.atan2(Math.sin(d),Math.cos(d)); J.ny=(J.ny||0)+clamp(d,-0.7,0.7)*0.6*k; J.hdy=(J.hdy||0)+clamp(d,-0.7,0.7)*0.3*k; return d; }
// a side-step of the feet: lead foot out, weight across, trailing foot follows. dir +1 = to its right. u 0..1
function sideStep(J,u,dir){ const lead=dir>0?"R":"L", trail=dir>0?"L":"R", a=Math.sin(sat(u/0.5)*Math.PI), b=Math.sin(sat((u-0.5)/0.5)*Math.PI);
  J["l"+lead+"z"]+=0.22*a; J["k"+lead]+=0.35*a; J["l"+trail+"z"]+=0.12*b; J["k"+trail]+=0.3*b; return sm5((u-0.15)/0.7); }
// her poses
const NQ={ aim(){ const J=NP.stand(); J.aRx=-1.5; J.eR=0.12; J.aLx=-1.3; J.eL=0.7; J.aLz=-0.1; return J; },
  reload(t){ const J=NP.stand(); J.aRx=-0.55; J.eR=1.3; J.aLx=-0.75; J.eL=1.7; J.aLz=-0.3; J.nx=0.5+0.04*Math.sin(t*9); J.sp=0.12; return J; },
  walk(ph){ const J=NQ.aim(); const s=Math.sin(ph*Math.PI*2); J.lLx=-0.35*s; J.lRx=0.35*s; J.kL=0.35*Math.max(0,s); J.kR=0.35*Math.max(0,-s); return J; },
  flat(k){ const J=NP.stumble(); J.aLx=J.aRx=-1.8-0.5*sat(k/0.6); J.aLz=J.aRz=0.7; J.lLx=0.3*(1-sat(k/0.8)); J.kL=0.1+0.3*(1-sat(k/0.8)); J.lRx=-0.25*(1-sat(k/0.8)); J.kR=0.2; return J; } };

// ---- studies her: she shifts side to side with the gun on it; it watches, the head tilting slowly, then mirrors her step
const STUDY=[[1.0,0.75],[3.4,-0.55],[5.6,0.3]];
A.idle={ start(ctx){ ctx.x=0.2; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.cz=0; ctx.st=null; },
  step(t,dt,ctx){ let nz=0, nst=null; for(const [t0,z] of STUDY){ const u=(t-t0)/0.6; if(u>=0){ const prev=nz; nz=prev+(z-prev)*sm5(u); if(u<1) nst={u,dir:Math.sign(z-prev)}; } }
    const nJ=NQ.aim(); if(nst){ const a=Math.sin(nst.u*Math.PI); nJ.lLz+=0.18*a; nJ.lRz+=0.12*a; nJ.kL+=0.25*a; } ctx.nOver={J:nJ,x:NX,z:nz};
    const J=tStand(t); braceHead(ctx,1);
    // it follows her bearing with the head first, tilting it slowly as it does; a beat later it mirrors her step
    const tilt=0.16*Math.sin(t*0.7); J.nz+=tilt; J.hdx=-0.04+0.05*Math.sin(t*0.45);
    const want=nz*0.85, lagT=t-0.7; if(!ctx.st && Math.abs(want-ctx.cz)>0.2 && lagT>0){ ctx.st={t0:t,from:ctx.cz,to:want,dir:Math.sign(want-ctx.cz)}; }
    if(ctx.st){ const u=(t-ctx.st.t0)/0.75; const m=sideStep(J,Math.min(1,u),ctx.st.dir); ctx.cz=ctx.st.from+(ctx.st.to-ctx.st.from)*m; ctx.phase="mirrors her step"; if(u>=1) ctx.st=null; }
    else ctx.phase= nst?"watches her move · head tilting": (Math.sin(t*0.7)>0.6?"freezes · studying her":"studies her · head tilting slowly");
    ctx.z=ctx.cz; lookAt(J,ctx,NX,nz); return applyLean(J); } };
A.idle.phys=null;

// ---- careful walk: a couple of slow steps, the hand steadying the head against every footfall, then it stops dead to watch
A.walk={ start(ctx){ ctx.x=-5.4; ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=false; ctx.cyc=0; ctx.pause=0; },
  step(t,dt,ctx){ braceHead(ctx,1);
    if(t<0.6||t>10.6){ ctx.v=0; ctx.phase= t<0.6?"stands braced":"stops"; const J=tStand(t); return applyLean(J); }
    if(ctx.pause>0){ ctx.pause-=dt; ctx.v=0; const J=tStand(t); const k=1-ctx.pause/1.3; J.ny=0.45*Math.sin(k*Math.PI*2)*Math.sin(k*Math.PI); J.hdy=J.ny*0.4; J.nz+=0.08*Math.sin(k*Math.PI);
      ctx.phase="stops dead · watches"; return applyLean(J); }
    const prev=ctx.ph; ctx.ph=(ctx.ph+dt/1.5)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev){ ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.4}); if(ctx.ph<prev){ ctx.cyc++; if(ctx.cyc%1===0){ ctx.pause=1.3; ctx.ph=0; } } }
    ctx.moving=true; ctx.phase="steps carefully · the hand steadying the head";
    const J=tStand(t), a=stride(ctx.ph,TWALK), b=stride((ctx.ph+0.5)%1,TWALK); J.lLx=a.lx; J.kL=a.k+0.08; J.fL=a.f; J.lRx=b.lx; J.kR=b.k+0.08; J.fR=b.f;
    const imp=Math.max(0,1-(ctx.ph%0.5)/0.14); J.hd=0.04+0.04*imp; J.nx+=0.07*imp; J.aRx=-0.25*Math.sin(ctx.ph*Math.PI*2); J.hyaw=0.06*Math.sin(ctx.ph*Math.PI*2);
    return applyLean(J); } };
A.walk.phys=TPHYS;

// ---- headbutt: it waits just out of reach while she has the gun on it. When she drops her eyes to reload it closes in,
// rears the head back (the tell) and drops it onto her. The head's weight carries it on into a stagger, or if she stepped
// back, all the way down onto its hands.
let hbAlt=false; const hbOutcome=()=>{ const v=document.getElementById("oButt").value; if(v==="alt"){ hbAlt=!hbAlt; return hbAlt?"hit":"miss"; } return v; };
A.headbutt={ start(ctx){ ctx.x=NX-2.35*Z(); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.out=hbOutcome(); ctx.T={}; },
  step(t,dt,ctx){ const T=ctx.T; const P=TP();
    // her: the gun on it; then she reloads (the opening); if it misses she has stepped back out of the drop
    let nJ= t<1.5||t>4.4 ? NQ.aim() : NQ.reload(t), nx=NX;
    if(ctx.out==="miss"&&T.rear!=null){ const u=sm5((t-T.rear-0.1)/0.4); nx=NX+0.95*u; const a=Math.sin(sat((t-T.rear-0.1)/0.4)*Math.PI); nJ.lLx-=0.3*a; nJ.kL+=0.3*a; nJ=t>T.rear+0.4?NQ.aim():nJ; }
    if(T.hit!=null){ const k=t-T.hit; ctx.nOver={J:NQ.flat(k),x:NX,fall:PHYS.topple(ctx.nT||(ctx.nT={th:0.3,w:2.6}),dt,1.65,1.45),kick:"butt",kickV:{x:1.6,y:0.4,z:0}}; } else ctx.nOver={J:nJ,x:nx};
    // waiting just out of reach
    if(t<1.75){ const J=tStand(t); braceHead(ctx,1); J.nz+=0.1*Math.sin(t*0.8); lookAt(J,ctx,NX,0); ctx.v=0; ctx.phase= t<1.5?"waits just out of reach":"she reloads · an opening"; return applyLean(J); }
    // closes in: quick careful steps until the head is over her
    if(T.close==null && ctx.x<NX-1.2*Z()){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt/0.8)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.5});
      ctx.moving=true; ctx.phase="steps in"; braceHead(ctx,1); const J=tStand(t), a=stride(ctx.ph,TWALK), b=stride((ctx.ph+0.5)%1,TWALK); J.lLx=a.lx; J.kL=a.k+0.1; J.fL=a.f; J.lRx=b.lx; J.kR=b.k+0.1; J.fR=b.f; J.sp+=0.05; return applyLean(J); }
    if(T.close==null){ T.close=t; T.rear=t; }
    const k=t-T.rear, J=tStand(t); ctx.v=0;
    if(k<0.5){ const w=sm5(k/0.5); J.sp=-0.1-0.28*w; J.nx=-0.05-0.32*w; J.kL+=0.12*w; J.kR+=0.12*w; J.aRx=0.35*w; J.aRz=0.35; J.eR=0.6; braceHead(ctx,1-w); ctx.phase="rears the head back (the tell)"; return applyLean(J); }
    // the drop: gravity on the head, the hips folding under it
    const d=k-0.5;
    if(T.hit==null&&T.bottom==null){ const u=Math.min(1,(d/0.42)**2); T.u=u; J.sp=-0.38+1.45*u; J.hp=0.42*u; J.nx=-0.37+0.95*u; J.kL+=0.12+0.38*u; J.kR+=0.12+0.38*u; J.hd=0.24*u; J.aRx=0.35-1.2*u; J.aLx=-0.6*u; J.aLz=0.4; J.eL=0.6; J.eR=0.6;
      ctx.phase="drops the head onto her";
      if(ctx.out==="hit"){ const hp=headPt(0,0,0), nh=norah.c.B.head.getWorldPosition(new V3()); if(hp.distanceTo(nh)<0.62*Z()){ T.hit=t; T.hitU=u; ctx.events.push({kind:"headbutt"}); } }
      if(u>=1){ T.bottom=t; ctx.events.push({kind:"headMiss"}); }
      return applyLean(J); }
    if(T.hit!=null){ // the weight carries it on: one staggering step forward, the free hand on its knee, then it straightens and braces again
      const s=t-T.hit, u=T.hitU*(1-sm5((s-0.9)/1.0)), st=sm5(s/0.5);
      J.sp=-0.38+1.45*u; J.hp=0.42*u; J.nx=-0.37+0.95*u+0.15*Math.sin(Math.min(1,s/0.4)*Math.PI); J.hd=0.24*u; J.kL+=0.12+0.38*u; J.kR+=0.12+0.38*u;
      if(s<0.5){ J.lRx-=0.45*Math.sin(st*Math.PI); J.kR+=0.5*Math.sin(st*Math.PI); } if(!T.stag&&s>0.12){ T.stag=1; } if(s<0.5) ctx.x+=dt*0.55*Math.sin(st*Math.PI)*Z()*2;
      J.aRx=-0.5*u; J.aRz=0.2; J.eR=0.5+0.4*u; braceHead(ctx,sm5((s-1.1)/0.8)); ctx.phase= s<0.6?"staggers under the weight": s<1.9?"steadies itself":"braces the head again"; return applyLean(J); }
    // missed: nothing stops the head, and it takes it down onto its hands. A window.
    const s=t-T.bottom, dn=sm5(s/0.35), up=sm5((s-1.6)/1.0), w=dn*(1-up);
    J.sp=1.07+0.35*w-1.2*up; J.hp=0.42+0.25*w-0.4*up; J.nx=0.58+0.1*w-0.5*up; J.hd=0.24+0.3*w-0.26*up; J.kL+=0.5+0.55*w-0.5*up; J.kR+=0.5+0.55*w-0.5*up; J.lLx-=0.3*w; J.lRx-=0.3*w;
    const hand=side=>{ const sh=runner.B[side==="L"?"upperarm_L":"upperarm_R"].getWorldPosition(new V3()); return {side,w,tip:0.07,at:()=>{ const P=TP(), o=side==="L"?-0.32:0.32, base=runner.group.position.clone().addScaledVector(P.fwd,0.62*Z()).addScaledVector(P.right,o*Z()); base.y=0.06;
      return {target:base, pole:runner.B[side==="L"?"upperarm_L":"upperarm_R"].getWorldPosition(new V3()).addScaledVector(P.fwd,-0.3).addScaledVector(P.right,o*1.5).add(new V3(0,0.4,0))}; }}; };
    if(w>0.02){ ctx.ik=hand("L"); ctx.ik2=hand("R"); } if(up>0.5) braceHead(ctx,sm5((s-2.2)/0.5));
    ctx.phase= s<0.35?"the head takes it down": s<1.6?"down on its hands (an opening)": "pushes itself back up"; return applyLean(J); } };
A.headbutt.phys=TPHYS;

// ---- read and counter: it lets her come and commit to a rifle-butt swing, slips it with a side-step, catches her arm and
// throws her with its weight, the hips turning under the head
A.counter={ start(ctx){ ctx.x=0.9; ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.T={}; ctx.cz=0; ctx.nph=0; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(); ctx.nHeld=false;
    // her: walks in with the gun up, winds up, swings the butt at its head
    let nx=NX, nJ;
    if(t<1.35){ const u=sm5((t-0.3)/1.0); nx=NX-1.4*u; ctx.nph+=dt/0.75; nJ= t>0.3&&t<1.3 ? NQ.walk(ctx.nph) : NQ.aim(); }
    else { nx=NX-1.4; const w=sm5((t-1.35)/0.4), s=Math.pow(sat((t-1.8)/0.22),1.3); nJ=NP.stand(); nJ.syaw=0.6*w-1.3*s; nJ.aRx=-0.4-0.9*w-0.5*s; nJ.aRz=0.6*w-0.4*s; nJ.eR=1.2*(1-s)+0.4; nJ.aLx=-0.6-0.9*w-0.3*s; nJ.eL=1.3; nJ.lLx=-0.25*w; nJ.kL=0.2*w; nJ.sp=0.1+0.25*s; }
    if(T.grab==null){ ctx.nOver={J:nJ,x:nx}; }
    const J=tStand(t); lookAt(J,ctx,nx,0);
    if(t<1.5){ braceHead(ctx,1); ctx.v=0; ctx.phase= t<1.35?"waits · lets her come":"reads the wind-up"; return applyLean(J); }
    // slips it: a side-step to its left, away from the swing, the head dipped under it
    if(t<2.1){ const u=(t-1.5)/0.6; const m=sideStep(J,u,-1); ctx.cz=-0.55*m*Z(); ctx.z=ctx.cz; J.sp+=0.12*Math.sin(u*Math.PI); J.kL+=0.15*Math.sin(u*Math.PI); J.kR+=0.15*Math.sin(u*Math.PI); braceHead(ctx,1);
      ctx.phase= t<1.8?"side-steps":"the swing whiffs past"; return applyLean(J); }
    ctx.z=ctx.cz;
    // catches her forearm with its right hand
    const fa=()=>norah.c.B.forearm_R.getWorldPosition(new V3()).lerp(norah.c.B.hand_R.getWorldPosition(new V3()),0.4);
    if(T.grab==null){ T.grab=t; T.piv=new V3(ctx.x,0,ctx.cz); T.n0=new V3(nx,0,0); T.yaw0=ctx.yaw; }
    const g=t-T.grab; braceHead(ctx,1);
    const reach=sm5(g/0.18);
    // the throw: it pivots on its feet, the hips turning, and swings her round on the arm; let go, she flies on
    const thr=g-0.35, sw=sm5(thr/0.5), ang=-1.7*Math.max(0,sw);
    if(thr<0.5){ ctx.yaw=T.yaw0+ang*0.9; J.hyaw=ang*0.08; J.syaw=ang*0.15; J.sp+=0.1; J.kL+=0.15; J.kR+=0.15;
      ctx.ik2={side:"R",w:reach,tip:0.06,at:()=>({target:fa(),pole:runner.B.upperarm_R.getWorldPosition(new V3()).add(new V3(0,-0.5,0)).addScaledVector(TP().right,0.4)})};
      const off0=T.n0.clone().sub(T.piv), off=off0.clone().setLength(off0.length()+(0.66*Z()-off0.length())*sm5(g/0.35)), c=Math.cos(ang), s=Math.sin(ang), p=new V3(off.x*c+off.z*s,0,-off.x*s+off.z*c).add(T.piv);
      const nJ2=NP.stumble(); nJ2.aRx=-1.6; nJ2.eR=0.2; nJ2.aLx=-1.0; nJ2.aLz=0.7;
      if(thr<0){ ctx.nOver={J:nJ,x:p.x,z:p.z}; ctx.phase="catches her arm · pulls her in"; }
      else { ctx.nHeld=true; ctx.nOver={J:nJ2,x:p.x,y:0.16*Math.sin(sw*Math.PI*0.5)*Z(),z:p.z,yaw:-Math.PI/2+ang,roll:-0.25*sw};   /* swung up off her feet on the arm */ ctx.phase="throws her with its weight"; T.rel={x:p.x,z:p.z,y:0.16*Z(),yaw:-Math.PI/2+ang}; }
      return applyLean(J); }
    // released: she flies on along the swing and lands flat
    if(!T.relE){ T.relE=1; ctx.events.push({kind:"thrown"}); }
    const k=thr-0.5, rec=sm5(k/1.0); ctx.yaw=T.yaw0+ang*0.9*(1-rec); J.hyaw=-0.42*(1-rec); J.syaw=-0.6*(1-rec);
    const tan=new V3(Math.sin(T.rel.yaw+Math.PI/2),0,Math.cos(T.rel.yaw+Math.PI/2));   /* her sideways, in the swing's direction */
    ctx.nOver={J:NQ.flat(k),x:T.rel.x,y:k<0.02?T.rel.y:0,z:T.rel.z,yaw:T.rel.yaw,roll:-0.25-(Math.PI/2-0.3)*sm5(k/0.5),kick:"thrown",kickV:{x:-tan.x*3.2,y:0.9,z:-tan.z*3.2}};
    ctx.phase= k<0.8?"lets her fly":"watches her land · braced"; lookAt(J,ctx,T.rel.x,T.rel.z,1-rec); return applyLean(J); } };

// ---- shot: a body shot makes it back off out of reach and circle to come again from a new angle; a head shot snaps the
// head back, and its weight takes the whole body over backward, rigid
let shAlt=false; const shOutcome=()=>{ const v=document.getElementById("oShot").value; if(v==="alt"){ shAlt=!shAlt; return shAlt?"body":"head"; } return v; };
A.shot={ start(ctx){ ctx.x=NX-3.0*Z(); ctx.yaw=Math.PI/2; ctx.ph=0; ctx.norah=true; ctx.v=0; ctx.out=shOutcome(); ctx.T={}; },
  step(t,dt,ctx){ const T=ctx.T; ctx.nOver={J:NQ.aim(),x:NX};
    if(t<1.3){ if(t>0.4){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt/1.5)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.4}); }
      braceHead(ctx,1); const J=tStand(t); if(t>0.4){ const a=stride(ctx.ph,TWALK), b=stride((ctx.ph+0.5)%1,TWALK); J.lLx=a.lx; J.kL=a.k+0.08; J.fL=a.f; J.lRx=b.lx; J.kR=b.k+0.08; J.fR=b.f; ctx.moving=true; ctx.phase="steps toward her"; } else ctx.phase="stands braced";
      lookAt(J,ctx,NX,0); return applyLean(J); }
    if(T.shot==null){ T.shot=t; ctx.events.push({kind:"tShot",where:ctx.out}); if(ctx.out==="head") T.tS={th:0.05,w:1.05}; }
    const k=t-T.shot;
    if(ctx.out==="head"){ const S=T.tS; /* rigid: it pivots on its heels until the back of the head reaches the floor too; the head props it there */ if(!S.done&&S.th>0.6&&headLow()<=runner.group.position.y+0.012){ S.done=true; S.impactW=S.w; S.w=0; } PHYS.topple(S,dt,2.1*Z(),Math.PI/2-0.05); ctx.rise=-S.th;
      const J=tStand(t); const snap=sm5(k/0.12); J.nx=-0.55*snap; J.sp=-0.1; J.kL=J.kR=0.05; J.lLx=J.lRx=0; J.hd=0; braceHead(ctx,1-sm5(k/0.25));
      J.aLx=-1.3*sm5(k/0.4); J.aLz=0.9; J.eL=0.3; J.aRx=-1.5*sm5(k/0.4); J.aRz=0.8; J.eR=0.3;
      if(S.done&&!T.landed){ T.landed=t; ctx.events.push({kind:"tipLand"}); }
      if(S.done){ const l=t-T.landed; J.aLx=-2.0+0.08*Math.sin(l*3); J.aRx=-2.0+0.08*Math.sin(l*2.6); J.nx=-0.55+0.05*Math.sin(l*2); }
      ctx.phase= !S.done? (k<0.25?"head shot · the head snaps back":"the head's weight takes it over, rigid") : "flat on its back"; return J; }
    // body shot: a flinch, then careful steps back out of reach
    if(k<0.45){ const J=tStand(t); const f=Math.sin(sat(k/0.45)*Math.PI); J.sp-=0.25*f; J.nx-=0.2*f; J.aRx=-0.6*f; J.eR=1.2*f; braceHead(ctx,1); ctx.phase="hit · flinches"; return applyLean(J); }
    const J=tStand(t); braceHead(ctx,1);
    const back=k<2.6, circ=!back&&k<6.0, inn=!back&&!circ&&k<7.4;
    if(back||circ||inn){ const rate=back?-1/1.2:1/1.3; const prev=ctx.ph; ctx.ph=((ctx.ph+dt*rate)%1+1)%1; if(Math.floor(prev*2)!==Math.floor(ctx.ph*2)) ctx.events.push({kind:"stomp",side:"L",strength:0.4});
      const a=stride(ctx.ph,TWALK), b=stride((ctx.ph+0.5)%1,TWALK); J.lLx=a.lx; J.kL=a.k+0.08; J.fL=a.f; J.lRx=b.lx; J.kR=b.k+0.08; J.fR=b.f; ctx.moving=true;
      // circling: it walks across her, keeping its eyes on her, the path bending round her; then turns in
      const dx=NX-ctx.x, dz=0-(ctx.z||0), bear=Math.atan2(dx,dz);
      let want= back? bear : circ? bear-1.25 : bear; let dY=want-ctx.yaw; dY=Math.atan2(Math.sin(dY),Math.cos(dY)); ctx.yaw+=clamp(dY,-1,1)*Math.min(1,dt*2.2);
      lookAt(J,ctx,NX,0); ctx.phase= back?"steps back out of reach": circ?"steps round her · a new angle":"steps in again from the side"; return applyLean(J); }
    ctx.v=0; lookAt(J,ctx,NX,0); ctx.phase="studies her again"; return applyLean(J); } };
A.shot.phys=TPHYS;

const LEN={idle:8, walk:11.4, headbutt:6.6, counter:5.2, shot:9.6};
const NAMES={idle:"Studies her",walk:"Careful walk",headbutt:"Headbutt",counter:"Read and counter",shot:"Shot"};
const DMG={headbutt:["NORAH −35","the head comes down on her"],headMiss:["MISS","she stepped back · it's down on its hands"],thrown:["NORAH −20","caught mid-swing · thrown"],
  body:["TACTICIAN −20","shot · it backs off"],head:["HEAD SHOT","the head's weight takes it over"]};
