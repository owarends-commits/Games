// ================================================================ Norah, live (the playground player)
// Her approved poses, composed from what the player is really doing each frame (ctx.S, set by the host):
//   S = {fwdV, sideV (m/s, her own frame), run, crouch, aim, aimAt (stage point), shots:[drive times], shotN, rounds,
//        click (time), reload (0..1 or null), dodge {t, side}, shove (time), hurt (time), stagger (time),
//        down {t, up (time she gets up)}, grabbed (bool), dead (time), light (bool), tier (0 fine .. 2 critical)}
const LIVE={}; let NX=3.2;   /* the creature pages keep a target here; Norah has none */
const LEN_W=1.15, LEN_R=2.1, LEN_C=0.85;
const ease=(D,k,to,r,dt)=>{ D[k]=(D[k]??to)+(to-(D[k]??to))*Math.min(1,dt*r); return D[k]; };
let PLVctx=null;
LIVE.drive={ start(ctx){ nStart(ctx,0); ctx.D={ph:0}; ctx.aimT=1.5; PLVctx=ctx; },
  step(t,dt,ctx){ const S=ctx.S||{}, D=ctx.D, P=TP(), fv=S.fwdV||0, sv=S.sideV||0, sp=Math.hypot(fv,sv);
    const L= S.run?LEN_R: S.crouch?LEN_C: LEN_W, dir= fv<-0.05&&Math.abs(fv)>=Math.abs(sv)?-1:1;
    D.ph=((D.ph+dir*sp*dt/L)%1+1)%1;
    const mv=ease(D,"mv",sp>0.12?1:0,8,dt), rn=ease(D,"rn",S.run?1:0,5,dt), cr=ease(D,"cr",S.crouch?1:0,6,dt);
    let aimTo=S.aim&&!S.reloadOn&&!S.grabbed&&S.dead==null?1:0; const aim0=ease(D,"aim",aimTo,aimTo?9:6,dt);
    // ---- the legs and body: stand, walk, run, crouch
    const f=0.75+0.12*(S.tier||0); let J=nStand(t,f); const h=look(J,dt,ctx,0.7*(1-aim0)*(1-mv*0.4));
    if(mv>0.01){ let W=hLegs(D.ph,nStand(t,0.8)); const s=Math.sin(D.ph*Math.PI*2); W.aLx+=0.05*s; W.aRx-=0.07*s; W.sp=0.14+0.05*(S.tier||0); W.hd=0.01;
      if(rn>0.01) W=mix(W,hRun(D.ph,t),rn); J=mix(J,W,mv); }
    if(cr>0.01) J=mix(J,mv>0.05?crouchWalk(D.ph,t):nCrouch(t),cr);
    // ---- the aim: the upper body goes into the hold; the legs keep doing what they do (forward, sideways, back)
    let aim=aim0;
    if(aim>0.01){ const A=nAim(t,0.4), U=mix(J,A,aim); if(mv>0.05){ for(const k of ["lLx","lRx","lLz","lRz","kL","kR","fL","fR","hd"]) U[k]=J[k];
        if(Math.abs(sv)>Math.abs(fv)){ const s=Math.sin(D.ph*Math.PI*2); U.lLx=A.lLx; U.lRx=A.lRx; U.lLz=(U.lLz||0)+0.18*Math.max(0,s); U.lRz=(U.lRz||0)+0.18*Math.max(0,-s); U.kL=A.kL+0.3*Math.max(0,s); U.kR=A.kR+0.3*Math.max(0,-s); } }
      J=U; }
    // ---- shots: the kick throws the aim up; the first after a pause makes her flinch hard; each nudges her back
    let kick=0, back=0, fl=0; const shots=S.shots||[];
    for(let i=0;i<shots.length;i++){ const s=shots[i], k=t-s; if(k<0||k>1.6) continue; const gap=i>0?s-shots[i-1]:9, fk=gap>1.5?1:gap>0.8?0.6:0.35;
      kick+=(0.32+0.12*fk)*Math.exp(-k/0.09)*sat(k/0.02); back+=0.05*Math.exp(-k/0.1)*sat(k/0.02); fl+=fk*Math.exp(-k/0.35)*sat(k/0.03); }
    J.nx-=0.22*fl; J.ny+=0.35*fl; J.sp-=0.12*fl; J.hd+=0.03*fl; J.aLz+=0.1*fl;
    // ---- the empty click: she starts
    if(S.click!=null){ const k=t-S.click, st=k>=0?Math.sin(sat(k/0.35)*Math.PI)*Math.exp(-k*2):0; J.sp-=0.08*st; J.nx-=0.1*st; }
    // ---- hit: a flinch away; a stagger back on stumbling steps
    if(S.hurt!=null){ const k=t-S.hurt, j=k>=0?Math.exp(-k/0.25)*sat(k/0.04):0; J.syaw-=0.45*j; J.sroll+=0.25*j; J.nx-=0.15*j; J.ny-=0.5*j; J.hyaw-=0.15*j; aim*=1-0.6*j; kick-=0.25*j; }
    if(S.stagger!=null){ const k=t-S.stagger; if(k>=0&&k<1.3){ const ph=(k/0.32)%1, s=Math.sin(ph*Math.PI*2), St=nStand(t,1); St.lLx=0.4*s; St.lRx=-0.4*s; St.kL=0.3+0.3*Math.max(0,s); St.kR=0.3+0.3*Math.max(0,-s); St.sp=-0.3*Math.exp(-k/0.4)+0.2; St.nx=-0.3*Math.exp(-k/0.3); St.aLx=-0.8; St.aRx=-0.7; St.aLz=0.45; St.aRz=0.4;
        const w=1-sm5((k-1.0)/0.3); J=mix(J,St,w); aim*=1-w; } }
    // ---- the dodge: she lurches aside on stumbling steps, arms out for balance, and comes back up on the aim
    if(S.dodge){ const k=t-S.dodge.t; if(k>=0&&k<1.6){ const wob=Math.sin(sat((k-0.15)/0.9)*Math.PI)*Math.exp(-k*0.9), sd=S.dodge.side||1, Sd=nStand(t,1), s1=sm5(k/0.2), s2=sm5((k-0.2)/0.24);
        Sd.kL=0.35+0.25*wob; Sd.kR=0.4+0.35*wob; Sd.sroll=(0.32*wob+0.12*wob)*sd; Sd.hroll=-0.12*wob*sd; Sd.sp=0.28+0.18*wob; Sd.nx=-0.15+0.1*wob;
        Sd.aLx=-0.9-0.4*wob; Sd.aLz=0.55; Sd.aRx=-0.75; Sd.aRz=0.5; Sd.eL=Sd.eR=0.7; Sd.lLz=0.25*s1*(1-s2)*sd; Sd.lRz=-0.2*s2*(1-sm5((k-0.6)/0.3))*sd;
        const w=1-sm5((k-1.1)/0.5); J=mix(J,Sd,w); aim*=1-w; } }
    // ---- the shove: both hands still full, she drives her forearms out into it
    let shoveW=0; if(S.shove!=null){ const k=t-S.shove; if(k>=-0.05&&k<0.8){ const push=sat(k/0.12)*(1-sm5((k-0.35)/0.35)); shoveW=1-sm5((k-0.5)/0.3); const Sh=nStand(t,1); Sh.lLx=-0.55*push; Sh.kL=0.45; Sh.lRx=0.35; Sh.sp=0.3+0.25*push; Sh.hz=0.12*push; Sh.nx=0.1; J=mix(J,Sh,shoveW); aim*=1-shoveW; D.push=push; } }
    // ---- knocked down: over backward, dazed on the floor, rolls up and gets up
    if(S.down){ const k=t-S.down.t; const st=NP.stumble(), sit=NG.sit(), lie=NG.lie(t,0.5); sit.aLx=sit.aRx=-0.9; sit.eL=sit.eR=0.4; sit.nx=0.35; lie.nx=0.4;
      const a1=Math.pow(sat(k/0.38),2), a2=Math.pow(sat((k-0.38)/0.3),2); let Dn= k<0.12? mix(J,st,sm5(k/0.12)) : k<0.38? mix(st,sit,a1) : k<0.68? mix(sit,lie,a2) : lie;
      if(S.down.up!=null){ const u=sat((t-S.down.up)/1.2); Dn=u<1?NG.up(t,u):Dn; if(u>0.3) ctx.onLimbs=true; if(u>=1) Dn=J; }
      J=Dn; aim=0; }
    // ---- grabbed: struggling, her forearms braced against it
    let held=0; if(S.grabbed){ const n=s=>noise(t*12,s)*0.12, G=nStand(t,1); G.sp=-0.2+n(1); G.nx=-0.35+n(2); G.ny=0.3; G.lLx=-0.45; G.kL=0.4; G.lRx=0.3; G.kR=0.35; J=G; aim=0; held=1; }
    // ---- dead: her knees go and she drops onto them, sways there a moment, then keels forward and lies flat on her face
    let dead=null; if(S.dead!=null){ const k=t-S.dead, kn=NQknees(t), sl=sm5(k/0.45); aim=0;
      const kw=P0(), sw=sm5((k-0.45)/0.6);    /* on both knees, shins flat behind her, slumping */
      kw.hd=HIP0()-0.5; kw.hz=-0.04; kw.lLx=kw.lRx=-0.02; kw.lLz=0.06; kw.lRz=-0.06; kw.kL=kw.kR=1.62; kw.fL=kw.fR=0.95;
      kw.sp=0.22+0.14*sw+0.03*Math.sin(k*5); kw.nx=0.55+0.4*sw; kw.hroll=0.03*Math.sin(k*3.3);
      kw.aLx=kw.aRx=-0.08; kw.aLz=0.12; kw.aRz=0.1; kw.eL=kw.eR=0.15;
      J=mix(J,kw,sl);
      if(k>1.15){ const pr=P0(); pr.hd=HIP0()-0.1; pr.hz=0.42; pr.hp=1.66; pr.sp=0.22; pr.nx=-0.3; pr.lLx=pr.lRx=-0.1; pr.ny=1.5; pr.nz=0;   /* flat: chest, hips and legs on the floor, cheek down */     /* face down, cheek to the floor */
        pr.lLz=0.1; pr.kL=0.04; pr.kR=0.1; pr.fL=pr.fR=0.9; pr.lLz=0.1; pr.lRz=-0.12;
        pr.aLx=0.15; pr.aRx=0.05; pr.aLz=0.35; pr.aRz=0.28; pr.eL=0.35; pr.eR=0.2;
        const u=Math.pow(sat((k-1.15)/0.5),2), b=k>1.65?0.05*Math.exp(-(k-1.65)*9)*Math.sin((k-1.65)*30):0;   /* falls like a dead weight; one small bounce as she lands */
        J=mix(kw,pr,u); J.hd-=b; J.hp+=b*0.6; }
      dead={gun:k>0.45?"gone":"hand",light:k>0.75?"gone":"hand"}; }
    // ---- any weapon but the revolver: its own approved clips (the hold, the shot, the load, the swing), legs from above
    if(S.wpn&&S.wpn!=="revolver"&&S.dead==null&&!S.grabbed&&!S.down){ const wr=weaponPose(t,dt,ctx,S,D,J,mv,aim0); if(wr) return wr; }
    else if(D.wk){ hideWeapons(); D.wk=null; D.sub=null; }
    // ---- the reload: the approved sequence, run at the playground's reload speed
    if(S.reload!=null&&S.dead==null&&!S.grabbed&&!S.down){ if(!D.rT){ D.rT={}; } const T0=ctx.T, P0x=ctx.post, P2=ctx.post2; ctx.T=D.rT; ctx.out="calm"; const R=A.reload.step(S.reload*6.4,dt,ctx); D.rT=ctx.T; ctx.T=T0;
      const RL=R; for(const k of ["lLx","lRx","lLz","lRz","kL","kR","fL","fR","hd"]) RL[k]=J[k]; ctx.phase="reloads"; return RL; }
    if(D.rT){ D.rT=null; if(ctx.rnd) ctx.rnd.visible=false; }
    // ---- the revolver's working parts, the light
    const G=gunCycle(t,shots.slice(-6)); const n=S.shotN||0, cylA=(n+(G.cylA*5/(Math.PI*2)-G.n))*Math.PI*2/5;
    const live=clamp(S.rounds??5,0,5), ch=[0,1,2,3,4].map(i=>i<live?"live":"spent");
    const H= dead? {aim:0,gun:dead.gun,light:dead.light} : {aim,amp:tremor(ctx,dt,mv<0.05&&fl<0.05)+0.004*(S.tier||0),kick,back,at:S.aimAt,trig:G.trig,cock:Math.max(G.cock,S.cock||0),cylA,ch,lightOn:S.light?1:0,sweep:h*0.8};
    if(S.click!=null&&t-S.click<0.2) H.trig=Math.max(H.trig,1-sat((t-S.click)/0.2));
    hands(ctx,H);
    if(shoveW>0.01||held){ const Hh=ctx.H, w=Math.max(shoveW,held), push=D.push||0;
      ctx.post=()=>{ holdPost(ctx,Hh); const Sr=runner.R.armR.getWorldPosition(new V3()), Sl=runner.R.armL.getWorldPosition(new V3()), tg=runner.B.chest.getWorldPosition(new V3()).addScaledVector(P.fwd,held?0.42:0.25+0.25*push);
        armIK(runner,{side:"R",target:tg.clone().addScaledVector(P.right,0.12),pole:Sr.clone().add(new V3(0,-0.5,0)).addScaledVector(P.right,0.18),w,tip:0.075});
        armIK(runner,{side:"L",target:tg.clone().addScaledVector(P.right,-0.12),pole:Sl.clone().add(new V3(0,-0.5,0)).addScaledVector(P.right,-0.18),w,tip:0.075}); }; }
    ctx.phase= dead?"dead": S.down?"down": held?"grabbed": aim>0.5?"on the aim": mv>0.5?(rn>0.5?"runs":"walks"):"idle";
    return fin(J); } };
LIVE.muzzle=()=>muzzleAt();
// her abdomen, in her stage (where the blood comes from when she lies dead)
LIVE.abdomen=()=>{ runner.group.updateMatrixWorld(true); const h=runner.B.hips.getWorldPosition(new V3()), c=runner.B.chest.getWorldPosition(new V3()); return h.lerp(c,0.35); };
LIVE.props=()=>({GUN,LIGHT,SPOT});

// ---------------------------------------------------------------- the other weapons
// hold: the clip and time that is her ready (or aimed) hold; act: the clips her actions play, from..to (s)
const WPN={
  shotgun:{hold:k=>["sg_aim",0.8+0.5*k], fire:["sg_fire",0.8,2.25], load:["sg_load",0,4.6]},
  rifle:{hold:k=>["rf_aim",0.8+0.6*k], fire:["rf_fire",0.9,2.95], load:["rf_load",0,4.6]},
  pistol:{hold:k=>["ps_aim",0.8+0.45*k], fire:["ps_fire",0.85,1.3], load:["ps_load",0,3.2]},
  flaregun:{hold:k=>["fg_fire",0.6+0.4*k], fire:["fg_fire",1.75,3.4], load:["fg_load",0,3.6]},
  hatchet:{hold:()=>["hx_chop",0.3], fire:["hx_chop",0.55,2.4], flurry:["hx_flurry",0.5,2.9]},
  crowbar:{hold:()=>["cb_swing",0.3], fire:["cb_swing",0.55,2.5], pry:["cb_pry",0.4,6.4]},
  knife:{hold:()=>["kn_slash",0.3], fire:["kn_slash",0.75,2.2]},
  flare:{hold:()=>["fl_strike",0.3], light:["fl_strike",0.3,2.6], lit:["fl_strike",3.4], fire:["fl_throw",0.6,2.2]} };
function hideWeapons(){ if(typeof W!=="undefined") for(const q in W) if(W[q]&&W[q].obj) W[q].obj.visible=false; if(typeof TL!=="undefined"&&TL) TL.visible=false; }
function subStart(c,ctx,place){ const keep={x:ctx.x,z:ctx.z,yaw:ctx.yaw,ph:ctx.ph,look:ctx.look,D:ctx.D,S:ctx.S,aimT:ctx.aimT,T:ctx.T}; A[c].start(ctx); if(place){ keep.x=ctx.x; keep.z=ctx.z; keep.yaw=ctx.yaw; } const st={}; for(const q of ["shots","out","mash","s0","yaw0"]) if(ctx[q]!==undefined) st[q]=ctx[q]; Object.assign(ctx,keep); return st; }
function runSub(c,tc,dt,ctx,T,st,place){ const keep={x:ctx.x,z:ctx.z,yaw:ctx.yaw,ph:ctx.ph,look:ctx.look,D:ctx.D,S:ctx.S}; const T0=ctx.T; ctx.T=T; if(st) Object.assign(ctx,st); const J=A[c].step(tc,dt,ctx); ctx.T=T0; if(place){ keep.x=ctx.x; keep.z=ctx.z; keep.yaw=ctx.yaw; } Object.assign(ctx,keep); return J; }
function weaponPose(t,dt,ctx,S,D,Jb,mv,aimK){ const k=S.wpn, Wd=WPN[k]; if(!Wd) return null;
  if(D.wk!==k){ const keep={look:ctx.look,D:ctx.D,S:ctx.S,aimT:ctx.aimT}; wStart(ctx,k); Object.assign(ctx,keep); D.wk=k; D.sub=null; D.lastAct=null; D.hc=null; }
  // a new action from the host: start its clip
  const act=S.act; if(act&&act.id!==D.lastAct){ D.lastAct=act.id; if(act.kind==="cancel"){ D.sub=null; } const c=Wd[act.kind]; if(c){ const place=act.kind==="pry"; D.sub={c:c[0],from:c[1],to:c[2],t0:t,T:{},kind:act.kind,dur:act.dur,place,st:subStart(c[0],ctx,place)}; if(place){ D.pryX=ctx.x; D.pryZ=ctx.z; D.pryYaw=ctx.yaw; } if(act.kind==="fire"&&k==="flare") D.sub.T.cap=1; } }
  let J=null, sub=D.sub;
  if(sub&&sub.kind==="load"){ if(S.reload==null) { D.sub=sub=null; } }
  if(sub){ let tc; if(sub.kind==="load") tc=sub.from+(S.reload||0)*(sub.to-sub.from); else tc=sub.from+(t-sub.t0)*(sub.dur?(sub.to-sub.from)/sub.dur:1);
    if(tc>sub.to&&sub.kind!=="load"){ D.sub=sub=null; } else { J=runSub(sub.c,Math.min(tc,sub.to),dt,ctx,sub.T,sub.st,sub.place); if(sub.place){ D.pryX=ctx.x; D.pryZ=ctx.z; D.pryYaw=ctx.yaw; D.doorAng=DOOR?Math.abs(DOOR.leaf.rotation.y):0; if(DOOR) DOOR.visible=false; } } }
  if(!sub&&D.pryX!=null){ D.pryX=null; ctx.x=0; ctx.z=0; ctx.yaw=Math.PI/2; }
  if(!J){ const h= k==="flare"&&S.lit? Wd.lit : Wd.hold(aimK); D.holdT=D.holdT||{}; if(k==="flare"&&S.lit){ D.holdT.cap=1; D.holdT.lit=D.holdT.lit||0.01; } if(D.hc!==h[0]){ D.hc=h[0]; D.hst=subStart(h[0],ctx); } J=runSub(h[0],h[1],dt,ctx,k==="flare"&&S.lit?D.holdT:{},D.hst); }
  // the legs keep walking under it
  if(mv>0.05) for(const q of ["lLx","lRx","lLz","lRz","kL","kR","fL","fR","hd"]) J[q]=Jb[q];
  ctx.phase=(sub?sub.kind:"holds")+" · "+k; return J; }
LIVE.wmuzzle=k=>{ const o=W[k]; if(!o) return null; o.obj.updateMatrixWorld(true); return o.obj.localToWorld((o.pts.muzzle||o.pts.tip||new V3()).clone()); };
LIVE.wtip=k=>{ const o=W[k]; if(!o) return null; o.obj.updateMatrixWorld(true); return o.obj.localToWorld((o.pts.tip||o.pts.muzzle||new V3()).clone()); };
LIVE.pryState=()=>{ const D=PLVctx&&PLVctx.D; return D&&D.pryX!=null?{x:D.pryX,z:D.pryZ,yaw:D.pryYaw,door:D.doorAng||0,on:!!(D.sub&&D.sub.kind==="pry")}:null; };
LIVE.itemModel=k=>{ const key=WX[k]?"w_"+k:k; if(!ITEMS[key]) return null; const g=buildItem(key); if(g.parent) g.parent.remove(g); return g; };
LIVE.loose=()=>({pieces:PIECES, blood:BLOOD, flares:FLARES});
LIVE.flareStep=dt=>{ if(typeof flareStep==="function") flareStep(dt); };
// for tests: how high each of her bones is off the floor (stage), and the lowest point of her mesh
LIVE.boneY=()=>{ runner.group.updateMatrixWorld(true); const o={}; for(const n of ["head","neck","chest","hips","hand_L","hand_R","thigh_L","shin_L","foot_L","shin_R","foot_R"]) if(runner.B[n]) o[n]=+runner.B[n].getWorldPosition(new V3()).y.toFixed(3); return o; };
