// ---------------------------------------------------------------- aiming: after each frame the page measures a body part against a target on Norah,
// and the clip nudges the ACROSS (position, crouch) so the mouth or face actually arrives there instead of passing through her
function headPos(C){ const p=new THREE.Vector3(0,0.1,0.02); C.B.head.localToWorld(p); return p; }
function noraPoint(kind){ const B=nora.B, p=new THREE.Vector3();
  if(kind==="flank"){ B.hips.getWorldPosition(p); const r=new THREE.Vector3(0,0,1); p.y+=0.2; p.addScaledVector(r,0.13); p.x-=0.08; return p; }   // her right side, just above the hip
  if(kind==="face"){ B.head.getWorldPosition(p); p.y+=0.3; return p; }                                                                   // above her face, lying on her back
  if(kind==="neck"){ B.neck.getWorldPosition(p); p.y+=0.06; return p; }
  return p; }
function aimStep(ctx,dt,gain){ const e=ctx.aimErr; if(!e) return; ctx.ox=(ctx.ox||0)+e.x*Math.min(1,dt*gain); ctx.oz=(ctx.oz||0)+e.z*Math.min(1,dt*gain); ctx.oy=(ctx.oy||0)-e.y*Math.min(1,dt*gain); ctx.oy=clamp(ctx.oy,-0.25,0.45); }
// a gaping mouth for the unhinged jaw (the model has no jaw bone yet): a dark slot on the face that stretches open
function gape(C,k){ if(!C.gape){ const c=document.createElement("canvas"); c.width=32; c.height=64; const g=c.getContext("2d"); g.fillStyle="#120404"; g.beginPath(); g.ellipse(16,32,12,30,0,0,7); g.fill(); g.fillStyle="#d8ccb0"; for(let i=0;i<5;i++){ g.fillRect(6+i*4,6,2,6); g.fillRect(6+i*4,52,2,6); }
    const m=new THREE.Mesh(new THREE.PlaneGeometry(0.05,0.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false})); m.position.set(0,0.0,0.118); C.B.head.add(m); C.gape=m; }
  C.gape.visible=k>0.02; C.gape.scale.set(0.7+0.5*k,0.15+1.35*k,1); C.gape.position.y=0.02-0.03*k; }

A.bite={ name:"Bite (rare)", len:10.5, start(ctx){ ctx.x=NX-2.8; ctx.z=0; ctx.n={}; smear(ac,0); gape(ac,0); ctx.ox=ctx.oy=ctx.oz=0; },
  step(t,dt,ctx){ const C=ac; const ZS=0.32;
    if(ctx.arr==null){ const J=approach(t,dt,ctx,NX-1.2); ctx.z=ZS*sat((ctx.x-(NX-2.8))/1.6); return J; }
    const ta=t-ctx.arr, x0=NX-1.2; ctx.z=ZS+ctx.oz; const face=Math.atan2(NX-ctx.x,0.1-ctx.z); ctx.yaw=Math.PI/2+(face-Math.PI/2)*0.6;
    const HOOK=(u)=>{ const J=idleA(C,t,dt,true); J.aLz=J.aRz=0.15+0.5*u; J.aLy=J.aRy=-0.55*u; J.aLx=J.aRx=0.05-1.05*u; J.eL=J.eR=0.2+0.75*u; J.sp=0.25+0.15*u; J.lLx=-0.4*u; J.kL=0.4; J.lRx=0.3*u; J.kR=0.3; J.hd=0.06; J.nx=0.05; return J; };
    const held=()=>{ const J=NP.held(t); J.aLx=-1.0+noise(t*12,1)*0.2; J.aRx=-1.1+noise(t*13,2)*0.2; J.eL=J.eR=0.7; return J; };   // pushing at its head and shoulders
    if(ta<0.3){ const u=ss(ta/0.3); ctx.phase="stumbles in, hooks her sides"; ctx.x=x0+0.45*u; return HOOK(u); }
    ctx.x=x0+0.45+ctx.ox;
    if(ta<0.6){ const u=ss((ta-0.3)/0.3); ctx.phase="jaw unhinges"; if(!ctx.c1){ ctx.c1=1; cue("jaw cracks open"); } gape(C,u); const J=HOOK(1); J.nx=0.05-0.6*u; J.hdx=-0.35*u; ctx.n={J:held(),x:NX}; return J; }
    if(ta<0.85){ const u=ss((ta-0.6)/0.25); ctx.phase="head twists sideways"; gape(C,1); const J=HOOK(1); J.nx=-0.55; J.hdx=-0.35; J.hdz=1.2*u; ctx.n={J:held(),x:NX}; return J; }
    const BITE=(u)=>{ const J=HOOK(1); J.nx=-0.55+1.15*u; J.hdx=-0.35+0.25*u; J.hdz=1.2; J.sp=0.4+0.35*u; J.hp=0.12*u; J.hd=0.06+(0.16+ctx.oy)*u; J.ny=0.35*u; J.kL=0.4+0.35*u; J.kR=0.3+0.35*u; return J; };
    if(ta<1.15){ const u=easeIn((ta-0.85)/0.3); ctx.phase="lunges into her side"; ctx.aim={part:"mouth",target:"flank"}; aimStep(ctx,dt,10*u); ctx.n={J:held(),x:NX}; gape(C,1); return BITE(u); }
    if(ctx.bitT==null){ ctx.bitT=t; hitStop(0.15); shake=Math.max(shake,0.38); cue("crunch"); const p=noraPoint("flank"); blood(p,24,2.2,0.08); dmg("NORAH −30","bite · a chunk torn from her side"); }
    const tb=t-ctx.bitT;
    if(tb<0.6){ ctx.phase="shakes its head to tear"; ctx.aim={part:"mouth",target:"flank"}; aimStep(ctx,dt,8); gape(C,0.6); const J=BITE(1); J.hdy=0.45*Math.sin(tb*62); J.ny+=0.2*Math.sin(tb*62+1); J.syaw=0.1*Math.sin(tb*31); J.hp+=0.05*Math.sin(tb*40);
      if(Math.random()<0.5) blood(mouthPos(C),1,1.2); ctx.n={J:NP.clutch(1,0.3,held()),x:NX}; shake=Math.max(shake,0.07); return J; }
    ctx.aim=null;
    if(!ctx.ripped){ ctx.ripped=1; const p=mouthPos(C); chunks(p,new THREE.Vector3(-1,0,-0.3),7); blood(p,16,2.4,0.07); cue("flesh rips"); smear(C,0.95); }
    const tr=tb-0.6;
    // Norah: reels away doubled over, holding her stomach, then straightens a little, still holding it
    const back=easeOut(tr/0.7); const nJ=tr<0.75? mix(NP.doubled(ss(tr/0.12),t),NP.backstep(tr*1.6),0.0) : mix(NP.doubled(1,t),NP.clutch(1,1),ss((tr-0.75)/0.7));
    if(tr<0.7){ const s=Math.sin(tr*14); nJ.lLx+=0.35*s; nJ.lRx-=0.35*s; nJ.kL+=0.2*Math.max(0,-s); nJ.kR+=0.2*Math.max(0,s); }
    ctx.n={J:nJ, x:NX+1.0*back};
    if(Math.random()<dt*7) drip(mouthPos(C)); gape(C,Math.max(0,0.6-tr*1.5));
    const ox=ctx.ox; ctx.ox=ox*(1-Math.min(1,dt*2));
    if(tr<0.3){ ctx.phase="rips free"; const J=mix(BITE(1),idleA(C,t,dt,true),easeOut(tr/0.3)); J.nx-=0.5*(1-tr/0.3); return J; }
    // the slow face-wipe: forearm dragged across its mouth, head turning into it
    if(tr<1.8){ const u=ss((tr-0.3)/1.5); ctx.phase="wipes its face, slowly"; const J=idleA(C,t,dt,true); J.aRx=-1.4; J.aRz=-0.25; J.aRy=0.75-1.6*u; J.eR=2.0; J.wR=0.25; J.nx=0.12; J.ny=0.2-0.45*u; J.hdz=0.12; J.sp=0.12; return J; }
    // it lifts the hand to its eyes and stares at the gore on it, utterly still
    if(tr<2.9){ const u=ss((tr-1.8)/0.35); ctx.phase="stares at the gore on its hand"; const J=idleA(C,t,dt,true); J.aRx=-1.35*u-1.4*(1-u); J.aRz=0.05; J.aRy=0.2; J.eR=1.95; J.wR=-0.55*u; J.nx=0.3*u; J.ny=0.5*u-0.25*(1-u); J.hdz=0.5*u; J.sp=0.1; return J; }
    if(tr<2.98){ const u=(tr-2.9)/0.08; if(!ctx.c3){ ctx.c3=1; cue("neck snaps round"); } ctx.phase="head snaps back to her"; const J=idleA(C,t,dt,true); J.aRx=-1.35*(1-u)+0.05*u; J.eR=1.95*(1-u)+0.15*u; J.ny=0.5*(1-u); J.hdz=0.5*(1-u); J.nx=0.3*(1-u); return J; }
    ctx.phase="watches her"; return idleA(C,t,dt); } };

A.drag={ name:"Drag-down (very rare)", len:11.5, start(ctx){ ctx.x=NX-2.3; ctx.z=0; ctx.n={}; ctx.out=outcome("oDrag",ctx); ctx.b={vis:false}; ctx.mash=0; ctx.ox=ctx.oy=ctx.oz=0; smear(ac,0); gape(ac,0); },
  step(t,dt,ctx){ const C=ac; if(ctx.arr==null) return approach(t,dt,ctx,NX-1.55);
    const ta=t-ctx.arr, x0=NX-1.55, hip0=ac.R.hip0;
    const PRONE=(J)=>{ J.hp=1.42; J.hd=hip0-0.2; J.sp=-0.15; J.nx=-0.7; J.lLx=-0.1; J.lRx=-0.06; J.kL=0.1; J.kR=0.12; J.fL=J.fR=0.6; return J; };
    if(ta<0.35){ const u=easeIn(ta/0.35); ctx.phase="falls at her feet"; ctx.x=x0+0.45*u; const J=idleA(C,t,dt,true); J.hp=1.42*u; J.hd=(hip0-0.2)*u; J.aLx=J.aRx=-2.5*u; J.aLz=J.aRz=0.25; J.eL=J.eR=0.2; J.nx=-0.7*u; J.kL=J.kR=0.4*(1-u); return J; }
    if(ta<0.6){ ctx.phase="hooks her shin"; ctx.x=x0+0.45; if(!ctx.c1){ ctx.c1=1; cue("thud · grip"); } const J=PRONE(P0()); J.aRx=-2.6; J.aRz=0.15; J.eR=0.4; J.aLx=-2.2; J.aLz=0.4; J.eL=0.6; return J; }
    const tf=ta-0.6, fall=ss(tf/0.45); if(!ctx.c2 && tf>0.4){ ctx.c2=1; shake=Math.max(shake,0.2); cue("slams down"); dmg("NORAH DOWN","dragged to the floor · mash to kick free"); }
    if(tf<0.45){ ctx.phase="drags her down"; ctx.x=x0+0.45; const J=PRONE(P0()); J.aRx=-2.6+1.2*fall; J.eR=0.4+1.0*fall; J.aLx=-2.2+0.8*fall; J.eL=0.6+0.6*fall;
      const nJ=NP.lie(t,fall,0.3); nJ.kL+=0.9*Math.sin(fall*Math.PI); nJ.kR+=0.8*Math.sin(fall*Math.PI); nJ.hd=0.25*Math.sin(fall*Math.PI); ctx.n={J:nJ, x:NX, fall}; return J; }
    const tc=tf-0.45;
    const pinned = tc>1.9; const rate = ctx.out==="b" ? (pinned?0.2:0.38) : (pinned?0.1:0.24); ctx.mash=Math.min(1,ctx.mash+dt*rate);
    const nJ=NP.lie(t,1,1); if(pinned) NP.pinnedArm(nJ); ctx.n={J:nJ, x:NX, fall:1};
    ctx.qte={k:"E",fill:ctx.mash,txt: pinned?"MASH · PINNED, HARDER":"MASH · KICK IT OFF"};
    // the second ACROSS slithers in low from the side and pins her right arm
    if(tc>0.7){ const u=ss((tc-0.7)/1.3); const J=PRONE(P0()); const w=Math.sin(t*6);
      J.hyaw=0.35*Math.sin(t*5); J.hroll=0.25*Math.sin(t*5+1); J.aLx=-2.2+0.7*Math.max(0,w); J.aRx=-2.2+0.7*Math.max(0,-w); J.eL=0.3+0.9*Math.max(0,w); J.eR=0.3+0.9*Math.max(0,-w); J.aLz=J.aRz=0.35; J.nx=-0.6;
      if(u>=1){ J.aRx=-1.55; J.aLx=-1.5; J.eL=J.eR=0.9; J.aLz=0.6; J.aRz=0.3; J.nx=-0.2; J.hyaw*=0.3; J.hroll*=0.3; }
      ctx.b={vis:true, J, x:NX+1.05, z:2.4-1.95*u, yaw:Math.PI, y:0}; }
    const climbEnd=2.4, faceEnd=climbEnd+1.0;
    if(ctx.out==="b" && ctx.mash>=1 && !ctx.freeT){ ctx.freeT=t; cue("kick · thud"); dmg("KICKED FREE","it's thrown off her"); shake=Math.max(shake,0.15); }
    if(ctx.freeT){ const k=t-ctx.freeT; ctx.qte=null; ctx.aim=null; ctx.phase="kicked off"; const J=PRONE(P0()); J.hroll=0.9*ss(k/0.4); J.aLx=J.aRx=-1.4; J.aLz=J.aRz=0.9; ctx.x=(ctx.xf??(ctx.xf=ctx.x))-1.0*easeOut(k/0.5); ctx.y=Math.max(0,(ctx.yf??(ctx.yf=ctx.y||0))*(1-k/0.3));
      ctx.n={J: k<0.5?NP.lie(t,1,0.6):mix(NP.lie(t,1,0),NP.stand(),ss((k-0.5)/0.6)), x:NX+0.1*ss(k), fall:1-ss((k-0.5)/0.6)}; if(ctx.b.vis) ctx.b.z=Math.min(2.4,ctx.b.z+dt*1.4); return J; }
    // it climbs her the whole way: hand over hand up her legs, hips, chest, until its face hangs over hers
    if(tc<climbEnd){ const u=tc/climbEnd; ctx.phase="fingers walk up her · slithers"; ctx.aim={part:"head",target:"face"}; if(u>0.6) aimStep(ctx,dt,3*(u-0.6));
      ctx.x=x0+0.45+1.75*ss(u)+ctx.ox*ss((u-0.6)/0.4); ctx.y=0.2*ss((u-0.12)/0.5);
      const J=PRONE(P0()); const w=Math.sin(tc*7.5), w2=Math.sin(tc*7.5+Math.PI);
      J.aLx=-2.35+0.85*Math.max(0,w); J.aRx=-2.35+0.85*Math.max(0,w2); J.eL=0.25+1.1*Math.max(0,w); J.eR=0.25+1.1*Math.max(0,w2); J.wL=0.7*Math.max(0,-w); J.wR=0.7*Math.max(0,-w2); J.aLz=J.aRz=0.35;
      J.hyaw=0.3*Math.sin(tc*4.6); J.hroll=0.28*Math.sin(tc*4.6+1.2); J.syaw=-0.28*Math.sin(tc*4.6); J.nx=-0.75+0.6*ss((u-0.7)/0.3); J.hd+=ctx.oy*ss((u-0.6)/0.4); return J; }
    // face to face: arms planted either side of her head, it lowers itself and studies her, head tilting
    const planted=(J)=>{ J.aLx=J.aRx=-1.45; J.aLz=J.aRz=0.55; J.eL=J.eR=1.05; J.wL=J.wR=-0.5; J.nx=-0.1; return J; };
    if(tc<faceEnd){ const u=tc-climbEnd; ctx.phase="face to face, head tilting"; ctx.aim={part:"head",target:"face"}; aimStep(ctx,dt,5); ctx.x=x0+2.2+ctx.ox; ctx.y=0.2;
      const J=planted(PRONE(P0())); J.hd+=ctx.oy; J.hdz=0.5*Math.sin(u*2.2); J.hdx=0.06*Math.sin(u*40); return J; }
    const tb=tc-faceEnd; ctx.phase="bites into her"; ctx.aim=null; ctx.x=x0+2.2+ctx.ox; ctx.y=0.2;
    if(!ctx.bit){ ctx.bit=1; hitStop(0.15); shake=Math.max(shake,0.32); cue("crunch"); dmg("NORAH −30","bitten while pinned"); blood(noraPoint("neck"),22,2,0.08); smear(C,0.95); }
    if(tb>1.5 && !ctx.bit2){ ctx.bit2=1; hitStop(0.1); shake=Math.max(shake,0.25); cue("crunch"); dmg("NORAH −30","bitten again"); blood(noraPoint("neck"),14,2,0.07); }
    const J=planted(PRONE(P0())); J.hd+=ctx.oy; const dive=(tb<0.12)? easeIn(tb/0.12) : (tb<0.7||(tb>1.5&&tb<2.0))?1:0.35;
    J.nx=-0.1+0.75*dive; J.hdz=0.5; J.eL=J.eR=1.05+0.4*dive; J.hd+=0.08*dive;
    if(dive>0.9){ J.hdy=0.4*Math.sin(tb*60); if(Math.random()<0.4) blood(mouthPos(C),1,1); shake=Math.max(shake,0.05); }
    return J; } };

A.whip={ name:"Marionette whip", len:9.5, start(ctx){ ctx.x=NX-6.2; ctx.z=0; ctx.out=outcome("oWhip",ctx); ctx.n={}; ctx.nx=NX; ctx.tw=0.9; ctx.bend=0; },
  step(t,dt,ctx){ const C=ac;
    // folded back in a C: hips thrust forward, spine and neck bent back so the head hangs behind it, arms trailing down behind toward the floor
    const BENT=(k,ph,extra=0)=>{ const J=P0(); const s=Math.sin(ph*2*Math.PI), b=k*(1+extra);
      J.hz=0.2*k; J.hp=-0.28*b; J.sp=-1.15*b; J.nx=-0.95*b; J.hd=0.12*k+0.06*extra; J.kL=0.32*k+0.3*Math.max(0,s); J.kR=0.32*k+0.3*Math.max(0,-s); J.lLx=0.2*k-0.32*s; J.lRx=0.2*k+0.32*s; J.fL=J.fR=-0.1*k;
      J.aLx=1.7*b+0.12*s; J.aRx=1.7*b-0.12*s; J.aLz=J.aRz=0.18*k; J.eL=J.eR=0.08; J.wL=J.wR=0.3*k; J.hroll=0.07*s; return J; };
    ctx.tw-=dt; if(ctx.tw<=0 && !ctx.whipT && t>1.5){ ctx.tw=0.5+Math.random()*0.8; ctx.jolt=1; cue("spine cracks"); }
    ctx.jolt=Math.max(0,(ctx.jolt||0)-dt*6); const J0=j=>{ j.sp-=0.22*ctx.jolt; j.nz+=0.35*ctx.jolt*(Math.random()<0.5?1:-1); j.aLx+=0.3*ctx.jolt; return j; };
    if(ctx.whipT==null){
      // it bends back in four cracking stages
      if(t<1.5){ const st=Math.min(4,Math.floor(t/0.32)+1); if(st!==ctx.stage){ ctx.stage=st; ctx.jolt=1; cue("crack"); } ctx.bend+= (st/4-ctx.bend)*Math.min(1,dt*18);
        ctx.phase="bends its spine back"; return J0(mix(idleA(C,t,dt),BENT(1,0),ctx.bend)); }
      ctx.ph=(ctx.ph||0)+dt*0.95; ctx.x+=dt*0.8*(0.55+0.9*Math.max(0,Math.sin(ctx.ph*2*Math.PI))); ctx.phase="walks in, bent backwards";
      if(ctx.out==="b" && ctx.x>ctx.nx-2.7) ctx.nx+=dt*1.7;                                          // she backs off: it whips at air
      if(ctx.x>=ctx.nx-1.95){ ctx.whipT=t; }
      ctx.n={J:ctx.out==="b"?NP.backstep(t*1.3):NP.stand(), x:ctx.nx}; return J0(BENT(1,ctx.ph)); }
    const tw=t-ctx.whipT;
    // anticipation: it bends further back with one last crack, then everything whips over
    if(tw<0.2){ const u=ss(tw/0.2); if(!ctx.c9){ ctx.c9=1; cue("spine cracks · winds back"); } ctx.phase="winds back"; ctx.n={J:ctx.out==="b"?NP.backstep(t*1.3):NP.stand(), x:ctx.nx}; return BENT(1,ctx.ph||0,0.25*u); }
    const WHIP=(u)=>{ const J=P0(), a=easeIn(u);
      J.hz=0.2+0.2*a; J.hp=-0.35+0.75*a; J.sp=-1.45+2.4*a; J.nx=-1.2+1.7*a; J.hd=0.18; J.kL=0.4+0.2*a; J.kR=0.45; J.lLx=-0.15-0.25*a; J.lRx=0.25; J.fL=0;
      const arc=v=> v<0.6 ? 2.1-5.2*ss(v/0.6) : -3.1+2.1*ss((v-0.6)/0.4);                                  // arms trail behind, fling over the top, slap down in front
      J.aLx=arc(u); J.aRx=arc(Math.max(0,u-0.12)); J.aLz=J.aRz=0.15; J.eL=0.05; J.eR=0.1+0.3*a; J.wL=J.wR=-0.3*a; return J; };
    const tw2=tw-0.2;
    if(tw2<0.2){ const u=tw2/0.2; ctx.phase="whips forward"; if(u>0.78 && !ctx.hit){ ctx.hit=1; if(ctx.out!=="b"){ hitStop(0.1); shake=Math.max(shake,0.3); cue("slap"); dmg("NORAH −20","marionette whip · knocked down"); ctx.down=t; } else { cue("whoosh"); dmg("MISSED","she backed out of reach"); } }
      ctx.n={J:ctx.out==="b"?NP.backstep(t):NP.stand(), x:ctx.nx}; return WHIP(u); }
    if(ctx.down){ const k=t-ctx.down; const nJ=NP.stumble(); nJ.nx=-0.3; ctx.n={J:nJ, x:ctx.nx+0.7*easeOut(k/0.35), fall:Math.min(1,k/0.45)*0.95}; } else ctx.n={J:NP.stand(), x:ctx.nx};
    // strings cut: folds over limp, swaying, then jerks itself upright in three snaps
    const LIMP=()=>{ const J=P0(); J.sp=1.05; J.hp=0.5; J.nx=0.75; J.hd=0.3; J.kL=0.75; J.kR=0.7; J.lLx=-0.35; J.lRx=-0.2; J.aLx=J.aRx=-0.2+0.08*Math.sin(t*2.2); J.aLz=J.aRz=0.05; J.eL=J.eR=0.05; J.hroll=0.06*Math.sin(t*1.7); J.nz=0.1*Math.sin(t*1.3); return J; };
    if(tw2<0.5){ ctx.phase="strings cut"; return mix(WHIP(1),LIMP(),ss((tw2-0.2)/0.3)); }
    if(tw2<1.9){ ctx.phase="hangs limp (cooldown)"; return LIMP(); }
    const u=tw2-1.9, st=Math.min(3,Math.floor(u/0.24)+1); if(u<0.72 && st!==ctx.jerk){ ctx.jerk=st; cue("jerks upright"); }
    ctx.phase= u<0.72?"jerks upright":"recovers"; return mix(LIMP(),idleA(C,t,dt),u<0.72?st/3:1); } };
