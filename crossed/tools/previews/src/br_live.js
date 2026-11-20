// ---------------------------------------------------------------- the two-armed Brutes, live (playground)
const LIVE={};
// walking on its stumps: the preview's pendulum gait, toward wherever the AI wants it (ctx.wantV: 0 stop, 1 walk, 2 hurry)
LIVE.walk={ start(ctx){ if(!ctx.fL) plantInit(ctx,0); if(!ctx.g||ctx.g.mode!=="alt") gaitInit(ctx,{Ts:0.66,Tds:0.16,H:0.5,loss:0.8,push:2.4}); },
  step(t,dt,ctx){ const g=ctx.g, st=base(ctx); g.vdes=ctx.wantV>0?1.35*(ctx.speedK||1):0;
    ctx.phase= g.vdes>0?(g.v<0.9?"leans in · heavy steps":"walking · vaults over each stump"):Math.abs(g.v)>0.1?"brakes · steps catch its momentum":"stands · weight settled";
    return gaitStep(ctx,dt,st,landFx); } };
// hurrying: both stumps at once, vaulting between them
LIVE.vault={ start(ctx){ if(!ctx.fL) plantInit(ctx,0); if(!ctx.g||ctx.g.mode!=="pair") gaitInit(ctx,{mode:"pair",Ts:0.5,H:0.7,loss:0.78,width:1.05,v0:ctx.g?Math.max(0,ctx.g.v):0}); },
  step(t,dt,ctx){ const g=ctx.g, st=base(ctx); g.vdes=ctx.wantV>0?2.6:0; const r=gaitStep(ctx,dt,st,(p,k)=>{ stumpSlam(p,0.6+0.4*k); if(k>1) crack(p,0.5); });
    ctx.phase=g.air?"swings through · airborne for a beat":g.vdes?"lands on both stumps · vaults over them":"stops"; st.manSwing=-0.25*clamp(g.v/2.5,0,1)+(g.air?-0.3:0); return r; } };
// the legless one: drags itself on its waist, a stump at a time
LIVE.crawl={ start(ctx){ if(!ctx.fL) plantInit(ctx,0); ctx.v=ctx.v||0; ctx.s=ctx.s||"L"; ctx.ph=ctx.ph||"reach"; ctx.pt=ctx.pt||0; ctx.sk=ctx.sk??(ctx.lastSt?0.9:0); },
  step(t,dt,ctx){ const st=base(ctx); const other=s=>s==="L"?"R":"L"; ctx.sk+=dt;
    if(ctx.sk<0.9){ const u=ss(ctx.sk/0.9); ctx.phase="sinks onto its waist"; st.rootY=BR.shoulderY-0.95*u; st.sink=u>0.5; st.pitch=0.12*u; return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); }
    st.rootY=BR.shoulderY-0.95; st.sink=true; const fr=MU_K*GRAV*WAIST_LOAD; let pull=0;
    if(ctx.wantV>0||ctx.ph==="pull"||ctx.from){ const s=ctx.s; ctx.pt+=dt;
      if(ctx.ph==="reach"){ const T=0.62, u=Math.min(1,ctx.pt/T); if(!ctx.from) ctx.from=ctx["f"+s].clone(); const to=footSpot({x:ctx.x,yaw:Math.PI/2},s,0.9,0.9);
        stepFoot(ctx,s,ctx.from,to,u,0.5); st.lift[s]=0.4*Math.sin(u*Math.PI); ctx.phase="reaches a stump ahead";
        if(u>=1){ stumpSlam(ctx["f"+s],0.6); ctx.ph="pull"; ctx.pt=0; ctx.from=null; } }
      else { const lead=ctx["f"+s].x-ctx.x; pull = lead>0.3 ? 3.9 : 0; ctx.phase="hauls itself forward · waist scraping"; if(lead<=0.3||ctx.pt>1.1){ ctx.ph="reach"; ctx.pt=0; ctx.s=other(s); } } }
    else ctx.phase= ctx.v>0.02?"slides to a stop":"lies on its wound, breathing";
    ctx.v+=pull*dt; if(ctx.v>0){ ctx.v=Math.max(0,ctx.v-fr*dt); } ctx.x+=ctx.v*dt; st.x=ctx.x;
    const pk=pull>0?1:0; BS.pk=(BS.pk||0)+(pk-(BS.pk||0))*Math.min(1,dt*6); st.pitch=0.12+0.14*BS.pk; st.z=(ctx.s==="L"?-1:1)*0.1*BS.pk; st.roll=-st.z*0.6; st.manSwing=0.25*BS.pk;
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
// down for good: both stumps buckle outward and it sinks onto its belly; the man hangs still
LIVE.die={ start(ctx){ ctx.dk=0; ctx.dL=ctx.fL&&ctx.fL.clone(); ctx.dR=ctx.fR&&ctx.fR.clone(); if(!ctx.dL){ plantInit(ctx,0); ctx.dL=ctx.fL.clone(); ctx.dR=ctx.fR.clone(); } ctx.g=null; BS.limp={L:true,R:true}; },
  step(t,dt,ctx){ ctx.dk+=dt; const st=base(ctx), c=ss(ctx.dk/0.7), legless=BR.legless; ctx.phase="dead";
    for(const s of ["L","R"]){ const F=footSpot(st,s,0.3,1.45); F.y=0.02; ctx["f"+s]=ctx["d"+s].clone().lerp(F,c); }
    st.rootY=(legless?BR.shoulderY-0.95:BR.shoulderY)-(legless?0.15:0.95)*c; st.roll=0.18*c; st.pitch=0.2*c; st.sink=legless;
    if(c>0.95&&!ctx.dslam){ ctx.dslam=1; slamLine(bruteLocal(st,-1.0,0,0),bruteLocal(st,1.0,0,0),1.0); }
    return Object.assign(st,{feet:{L:ctx.fL,R:ctx.fR}}); } };
// a shot from the playground lands on it: lumps burst, little arms tear off, armour cracks and drops, the open body bleeds.
// pt and dir in stage coordinates; returns what it hit and the damage multiplier
LIVE.shot=(h,pt,dir)=>{ pvBind(h); const R=BR, V=THREE.Vector3; R.mesh.updateMatrixWorld(true);
  // armour first: the plates cover what's under them
  if(R.armor&&R.armor.length){ armorPrep(R); const near=R.armor.filter(a=>!a.off&&armorHome(a).distanceTo(pt)<Math.max(0.14,a.ext*0.45));
    if(near.length){ let broke=0; for(const a of near){ a.hp--; if(a.hp<=0){ broke++; armorKnock(R,a,dir.clone().multiplyScalar(1.6+Math.random()*1.4).add(new V((Math.random()-.5)*1.2,1.2+Math.random(),(Math.random()-.5)*1.2))); } }
      debris(pt,broke?8:3,0.6); dust(pt,0.4,2); return {what:broke?"armorOff":"armor", mult:broke?0.25:0.08}; } }
  for(const l of R.lumps){ if(l.burst!=null||!l.alive) continue; const p=lumpWorld(l); if(p.distanceTo(pt)<Math.max(0.1,l.r*1.25)){ l.burst=0; growthBurst(p); BS.twitch=1;
      for(const o of R.lumps) if(o!==l&&o.burst==null&&lumpWorld(o).distanceTo(p)<0.22) o.burst=0;
      const left=R.lumps.filter(o=>o.side===l.side&&o.burst==null).length; if(!left&&l.side) BS.limp[l.side]=true; return {what:"lump", mult:2.5}; } }
  for(const a of R.arms){ if(a.dead) continue; const p=a.mid.getWorldPosition(new V()); if(p.distanceTo(pt)<0.16){ a.dead=true; blood(p,18,2.4,0.07); chunks(p,dir.clone(),5); BS.twitch=1.4; return {what:"arm", mult:3.0}; } }
  for(const o of R.organs||[]){ if(o.burst!=null) continue; const p=o.b.getWorldPosition(new V()); if(p.distanceTo(pt)<0.13){ o.burst=0; growthBurst(p); blood(p,14,2,0.07); BS.twitch=1.2; return {what:"organ", mult:3.0}; } }
  blood(pt,4,1.4,0.05); BS.twitch=Math.max(BS.twitch||0,0.6); return {what:"flesh", mult:1}; };
LIVE.info=h=>{ pvBind(h); const R=BR; return {legless:!!R.legless, split:!!(R.organs&&R.organs.length), armored:!!(R.armor&&R.armor.length), lumps:R.lumps.filter(l=>l.burst==null).length}; };
// the bones its hit boxes ride on: the stumps (shoulder to fist), the torso, the man and the little arms
LIVE.hitBones=h=>{ pvBind(h); const R=BR, B=R.B, out=[]; for(const s of ["L","R"]){ for(const [a,b] of [["sh"+s,"ap"+s],["ap"+s,"wr"+s],["wr"+s,"ft"+s]]) if(B[a]&&B[b]) out.push({a:B[a],b:B[b],r:0.16,zone:"arm",limb:"stump"+s}); }
  if(B.torso) out.push({a:B.torso,b:null,r:0.55,zone:"torso",limb:"body"}); if(B.head) out.push({a:B.head,b:null,r:0.16,zone:"head",limb:"head"});
  for(const s of ["L","R"]) if(B["leg"+s]&&B["kn"+s]) out.push({a:B["leg"+s],b:B["kn"+s],r:0.09,zone:"leg",limb:"man"});
  for(const a of R.arms) out.push({a:a.base,b:a.tip,r:0.07,zone:"arm",limb:"little"});
  for(const l of R.lumps) out.push({a:l.b,b:null,r:Math.max(0.08,l.r),zone:"torso",limb:"lump"});
  for(const a of R.armor||[]) out.push({a:a.b,b:null,r:Math.max(0.1,a.ext*0.4),zone:"torso",limb:"armor"});
  return out; };
