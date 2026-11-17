// ---- the one-arm brute (her, and Louis: one enemy type, one set of animations). The great arm is the same physical pendulum
// as the club-fist's, she balances its weight the same way, and the thin left arm only ever flings out to balance it.
const BIGTIP=0.22; const Z=()=>(runner&&runner.sz)||1;   /* the model's scale: her ~1.80 m, Louis ~1.70 m */
function thinBalance(J,s){ J.aLx=(J.aLx||0)+0.55*s; J.aLz=0.45+0.35*Math.abs(s); J.eL=0.35; return J; }   /* s: how hard the big arm is pulling her; the thin arm swings the other way */
const OAPOS=()=>({fwd:new THREE.Vector3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw)), right:new THREE.Vector3(-Math.cos(ctx.yaw),0,Math.sin(ctx.yaw)), chest:runner.B.chest.getWorldPosition(new THREE.Vector3()), sh:runner.B.upperarm_R.getWorldPosition(new THREE.Vector3())});
// ---- backhand swat: the arm drawn across her body to the far side, then swept out flat through Norah; its weight spins her on past
A.swat={ start(ctx){ ctx.x=3.2-1.55*Z(); ctx.yaw=Math.PI/2; ctx.yaw0=ctx.yaw; ctx.norah=true; ctx.v=0; ctx.spin={x:0,v:0}; },
  step(t,dt,ctx){ const J=stance(t), P=OAPOS(); const R0=1.45*Z(), H=1.25*Z();
    const at=phi=>P.chest.clone().addScaledVector(P.fwd,R0*Math.cos(phi)).addScaledVector(P.right,R0*Math.sin(phi)).setY(H);
    let phi=null, s=0;
    if(t<0.5){ ctx.phase="watches her"; clubSwing(J,ctx,dt); thinBalance(J,0); return applyLean(J); }
    if(t<1.45){ const w=sm5((t-0.5)/0.95); phi=-1.25*w; J.syaw=0.55*w; J.hyaw=0.2*w; J.sp=0.15; J.kL=J.kR=0.15+0.18*w; s=-0.6*w; ctx.phase="draws the arm across her body (the tell)";
      ctx.ik={target:at(phi).add(new THREE.Vector3(0,0.15*w,0)),pole:P.sh.clone().addScaledVector(P.fwd,-0.4).add(new THREE.Vector3(0,0.4,0)),w:sm5((t-0.5)/0.3),tip:BIGTIP}; }
    else if(t<1.85){ const d=Math.pow((t-1.45)/0.4,1.4); phi=-1.25+3.05*d; J.syaw=0.55-1.25*d; J.hyaw=0.2-0.45*d; J.sp=0.18; J.kL=J.kR=0.33; s=1.2*Math.sin(d*Math.PI);
      ctx.ik={target:at(phi),pole:P.sh.clone().add(new THREE.Vector3(0,0.5,0)).addScaledVector(P.right,0.3),w:1,tip:BIGTIP}; ctx.phase="sweeps it through";
      if(!ctx.hit){ ctx.ikHit=at(phi); } }
    else { const k=t-1.85; const r=sm5((k-0.4)/0.9); phi=1.8; ctx.phase= k<0.6?"the weight spins her round":"turns back";
      // the arm's momentum carries her on round: a spin she has to stop with her feet
      if(!ctx.spun){ ctx.spun=1; ctx.spin.v=2.6; } spring(ctx.spin,0,dt,3.2); ctx.yaw=ctx.yaw0+0.75*ctx.spin.x;
      const st=Math.sin(Math.min(1,k/0.6)*Math.PI*2); J.lLx=-0.35*Math.max(0,st); J.kL+=0.4*Math.max(0,st); J.lRx=-0.3*Math.max(0,-st); J.kR+=0.35*Math.max(0,-st);
      J.syaw=-0.7*(1-r); J.hyaw=-0.25*(1-r); s=0.6*(1-r);
      ctx.ik={target:at(phi).add(new THREE.Vector3(0,-0.3*sm5(k/0.5),0)),pole:P.sh.clone().add(new THREE.Vector3(0,-0.4,0)).addScaledVector(P.right,0.4),w:1-r,tip:BIGTIP};
      if(r>=1){ clubSwing(J,ctx,dt); thinBalance(J,0); return applyLean(J); } }
    thinBalance(J,s);
    // her: stands, until the arm reaches her chest; then she's swatted aside, flying, and lands sprawled
    if(ctx.hit==null && ctx.ikTip && t>1.5){ const nc=norah.c.B.chest.getWorldPosition(new THREE.Vector3()); if(ctx.ikTip.distanceTo(nc)<0.42){ ctx.hit=t; ctx.events.push({kind:"swat"}); } }
    if(ctx.hit!=null){ const k=t-ctx.hit; const nJ=k<0.5?NP.stumble():NP.kneel(t); nJ.aLx=nJ.aRx=-1.6; nJ.aLz=nJ.aRz=0.8; ctx.nOver={J:nJ,x:3.2,roll:PHYS.topple(ctx.nT||(ctx.nT={th:0.2,w:3.2}),dt,1.65,1.45)*Math.PI/2*0.98,kick:"swat",kickV:{x:1.2,y:2.2,z:3.6}}; }
    else ctx.nOver={J:NP.stand(),x:3.2};
    return applyLean(J); } };
// ---- smother: the arm raised high, then dropped over her: she's forced down onto her back and pinned under its weight; mash to crawl out
let smAlt=false; const smOutcome=()=>{ const v=document.getElementById("oSmother").value; if(v==="alt"){ smAlt=!smAlt; return smAlt?"free":"crushed"; } return v; };
A.smother={ start(ctx){ ctx.x=3.2-2.2*Z(); ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.ph=0; ctx.out=smOutcome(); ctx.mash=0; },
  step(t,dt,ctx){ const nx=3.2, P=OAPOS();
    if(t<1.0){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt/1.25)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.8});
      ctx.v=1.0*Z(); ctx.x=Math.min(nx-0.95*Z(),ctx.x+ctx.v*dt); ctx.phase="lumbers in"; const J=dragWalk(ctx.ph); clubSwing(J,ctx,dt); thinBalance(J,0); ctx.nOver={J:NP.stand(),x:nx}; return applyLean(J); }
    const tg=t-1.0, J=stance(t); ctx.v=0; const nch=norah.c.B.chest.getWorldPosition(new THREE.Vector3());
    const over=P.chest.clone().addScaledVector(P.fwd,0.5*Z()).add(new THREE.Vector3(0,1.1*Z(),0)).addScaledVector(P.right,0.15*Z());
    if(tg<0.9){ const w=sm5(tg/0.9); ctx.ik={target:P.sh.clone().addScaledVector(P.right,0.6).add(new THREE.Vector3(0,-0.9,0)).lerp(over,w),pole:P.sh.clone().addScaledVector(P.fwd,-0.5).addScaledVector(P.right,0.5),w:sm5(tg/0.25),tip:BIGTIP};
      J.sp=0.12-0.12*w; J.kL=J.kR=0.15+0.12*w; thinBalance(J,-0.5*w); ctx.phase="raises the arm high over her (the tell)"; ctx.nOver={J:NP.stand(),x:nx}; return applyLean(J); }
    // it comes down on her; she buckles to her knees, then is pressed flat on her back under it
    const td=tg-0.9, down=Math.min(1,(td/0.32)**2), done=ctx.res!=null;
    let nJ, fall=0; if(!done){ if(td<0.32){ nJ=NP.stand(); } else { const b=td-0.32; fall=Math.min(1.45,sm5(b/0.7)*1.45); nJ= b<0.35? mix(NP.stand(),NP.kneel(t),sm5(b/0.35)) : NP.kneel(t); nJ.aLx=nJ.aRx=-1.8; nJ.eL=nJ.eR=1.4; nJ.kL+=0.2*Math.sin(t*9); } }
    const press=done&&ctx.res==="free" ? 0 : sm5((td-0.32)/0.7);
    if(!done){ const tgt= td<0.32 ? over.clone().lerp(nch.clone().add(new THREE.Vector3(0,0.2,0)),down) : nch.clone().add(new THREE.Vector3(0,0.12-0.02*Math.sin(t*6),0));
      ctx.ik={target:tgt,pole:P.sh.clone().add(new THREE.Vector3(0,0.6,0)).addScaledVector(P.right,0.4),w:1,tip:BIGTIP};
      J.sp=0.15+0.5*press; J.hp=0.25*press; J.kL=J.kR=0.27+0.35*press; J.hd=0.05+0.25*press; thinBalance(J,-0.7*press);
      if(td>=0.32&&!ctx.landed){ ctx.landed=1; ctx.events.push({kind:"smotherHit"}); }
      if(td>0.6){ const rate=ctx.out==="free"?0.4:0.2; ctx.mash=Math.min(1,ctx.mash+dt*rate); ctx.qte=ctx.mash; if(Math.random()<dt*3) ctx.events.push({kind:"squeeze"}); }
      ctx.phase= td<0.32?"drops the arm over her": td<1.0?"forces her down":"pins her under it · mash";
      if(ctx.out==="free"&&ctx.mash>=1){ ctx.res="free"; ctx.resT=t; ctx.events.push({kind:"crawlOut"}); }
      if(ctx.out!=="free"&&td>4.4){ ctx.res="crushed"; ctx.resT=t; ctx.events.push({kind:"crushed"}); }
      ctx.nOver={J:nJ,x:nx,fall}; }
    else if(ctx.res==="free"){ const r=t-ctx.resT; ctx.qte=null; ctx.phase= r<0.6?"she squirms out from under it":r<1.4?"the arm slams the floor where she was":"turns on her";
      const sl=sm5(r/0.6); const g=Math.max(0,(r-0.6)/0.8); ctx.nOver={J: r<1.0?NP.kneel(t):mix(NP.kneel(t),NP.stand(),sm5((r-1.0)/0.6)), x:nx+0.9*sl, fall:1.45*(1-sm5((r-0.3)/0.7))};
      ctx.ik={target:nch.clone().add(new THREE.Vector3(-0.1,0,0)).setY(0.18+0.25*(1-sm5(r/0.3))),pole:P.sh.clone().add(new THREE.Vector3(0,0.6,0)).addScaledVector(P.right,0.4),w:1-sm5((r-1.2)/0.6),tip:BIGTIP};
      if(r>0.5&&!ctx.sl){ ctx.sl=1; ctx.events.push({kind:"slamFloor"}); } J.sp=0.55*(1-sm5((r-1.2)/0.6))+0.1; J.kL=J.kR=0.4*(1-sm5((r-1.2)/0.6))+0.15; thinBalance(J,-0.4);
      if(r>1.8){ clubSwing(J,ctx,dt); } }
    else { const r=t-ctx.resT; ctx.qte=null; ctx.phase="smothered · she goes still"; ctx.nOver={J:NP.kneel(t),x:nx,fall:1.45};
      ctx.ik={target:nch.clone().add(new THREE.Vector3(0,0.08,0)),pole:P.sh.clone().add(new THREE.Vector3(0,0.6,0)).addScaledVector(P.right,0.4),w:1,tip:BIGTIP}; J.sp=0.65; J.hp=0.25; J.kL=J.kR=0.62; J.hd=0.3; thinBalance(J,-0.7); }
    return applyLean(J); } };
// ---- flail: a frenzy of overhead blows with the great arm, each one coming down somewhere new, stepping in after her
let flAlt=false; const flOutcome=()=>{ const v=document.getElementById("oFlail").value; if(v==="alt"){ flAlt=!flAlt; return flAlt?"dodges":"caught"; } return v; };
A.flail={ start(ctx){ ctx.x=3.2-1.6*Z(); ctx.yaw=Math.PI/2; ctx.norah=true; ctx.v=0; ctx.out=flOutcome(); ctx.nx=3.2; ctx.k=0; },
  step(t,dt,ctx){ const J=stance(t), P=OAPOS(); const blows=[[0.9,0.4],[1.55,-0.15],[2.15,0.55],[2.7,0.0],[3.3,0.25]]; // [time, sideways aim]
    let ik=null, s=0; ctx.phase="frenzy";
    for(let i=0;i<blows.length;i++){ const [b0,aim]=blows[i], u=t-b0+0.42; if(u<0||u>0.62) continue;
      const last=i===blows.length-1, land= last&&ctx.out==="caught" ? norah.c.B.chest.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(-0.12,-0.05,0)) : new THREE.Vector3(ctx.nx-0.4,0.12,0).addScaledVector(P.right,aim*0.8*Z()); const up=P.sh.clone().addScaledVector(P.right,0.35+aim*0.3).addScaledVector(P.fwd,-0.15).add(new THREE.Vector3(0,1.05,0));
      if(u<0.3){ const w=sm5(u/0.3); ik={target:(ctx.lastLand||P.sh.clone().addScaledVector(P.right,0.6).add(new THREE.Vector3(0,-0.9,0))).clone().lerp(up,w),pole:P.sh.clone().addScaledVector(P.fwd,-0.6).addScaledVector(P.right,0.4),w:1,tip:BIGTIP}; J.sp=0.1-0.1*w; J.syaw=0.3*w*Math.sign(aim||1); s=-0.5*w; }
      else if(u<0.42){ const d=((u-0.3)/0.12)**2; ik={target:up.clone().lerp(land,d),pole:P.sh.clone().add(new THREE.Vector3(0,0.6,0)).addScaledVector(P.right,0.4),w:1,tip:BIGTIP}; J.sp=0.0+0.55*d; J.hp=0.2*d; J.kL=J.kR=0.15+0.3*d; s=0.9*d;
        if(d>=0.95&&ctx.k<=i){ ctx.k=i+1; ctx.lastLand=land.clone(); ctx.events.push({kind:"flailHit",i,p:land.clone()}); if(i<blows.length-1){ ctx.step=t; } if(last&&ctx.out==="caught"){ ctx.down=t; ctx.events.push({kind:"flail"}); } else ctx.bk=t; } }
      else { ik={target:land,pole:P.sh.clone().add(new THREE.Vector3(0,0.6,0)).addScaledVector(P.right,0.4),w:1,tip:BIGTIP}; J.sp=0.55; J.hp=0.2; J.kL=J.kR=0.45; s=0.6; } }
    if(ctx.step!=null && t-ctx.step<0.3){ const q=(t-ctx.step)/0.3; ctx.x+=dt*0.85*Z()*(1-q); J.lRx=-0.4*Math.sin(q*Math.PI); J.kR+=0.5*Math.sin(q*Math.PI); }   /* steps in after her between blows */
    if(t>3.95){ const r=sm5((t-3.95)/0.8); ik= ctx.lastLand? {target:ctx.lastLand,pole:P.sh.clone().add(new THREE.Vector3(0,0.6,0)),w:1-r,tip:BIGTIP} : null; ctx.phase= r<1?"heaving, the arm on the floor":"stands, panting"; if(r>=1){ ik=null; clubSwing(J,ctx,dt); } }
    if(ik) ctx.ik=ik; thinBalance(J,s);
    // her: backs away from each blow; caught by the last one (or slips clear)
    if(ctx.down!=null){ const k=t-ctx.down; ctx.nOver={J:k<0.4?NP.stumble():NP.kneel(t),x:ctx.nx,fall:PHYS.topple(ctx.nT||(ctx.nT={th:0.2,w:2.6}),dt,1.65,1.45)*1.0}; }
    else { const k=ctx.bk!=null?t-ctx.bk:9; if(k<0.35) ctx.nx+=dt*1.1*(1-k/0.35); const nJ=NP.stand(); nJ.aLx=nJ.aRx=-0.9; nJ.eL=nJ.eR=1.2; nJ.sp=-0.15; ctx.nOver={J:nJ,x:ctx.nx}; }
    return applyLean(J); } };
const LEN={idle:7, walk:11, swat:4.4, smother:8.4, flail:5.4};
const NAMES={idle:"Stands lopsided",walk:"Drag walk",swat:"Backhand swat",smother:"Smother",flail:"Flail"};
const CWALKPHYS={ active:ctx=>(ctx.phase||"").startsWith("drags himself")||(ctx.phase||"").startsWith("drags herself"), stance:ctx=>strideStance(ctx.ph,CWALK), traction:9, imp:0.7, rollK:0.25, drag:{R:true} };
A.walk.phys=CWALKPHYS;
const DMG={swat:["NORAH −30","backhand swat · knocked flying"],smotherHit:["NORAH −15","the arm comes down on her"],squeeze:["NORAH −3","pinned · can't breathe"],crawlOut:["CRAWLED OUT","she squirms free"],crushed:["NORAH −70","smothered under the arm"],flail:["NORAH −25","caught by a flailing blow"],flailMiss:["MISS","she backs out of reach"]};
