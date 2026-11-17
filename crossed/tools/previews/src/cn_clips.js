// ================================================================ the CONTORTIONIST (BCROSS)
// Spider-like. Three movement subclasses on one body: the backbend spider walk (belly up, head twisted round the right
// way), the face-down spider crawl (elbows and knees jutting high over its back), and the upright walker that folds
// down into the crawl with its joints popping the wrong way. Hands and feet are planted on the floor (or the wall) at
// fixed points and swung to the next: nothing skates, and the physics guard holds the body up on them.
const sm5=x=>{ x=sat(x); return x*x*x*(x*(x*6-15)+10); };
const Z=()=>(runner&&runner.sz)||1, V3=THREE.Vector3;
SLOUCH.s=0; SLOUCH.h=0;
const NX=3.2;
// size: the small ones are quick and light, the big ones slow and heavy (same animations)
const SZ=()=>runner&&runner.hgt?runner.hgt:1.56, QUICK=()=>Math.sqrt(1.56/SZ());
const TP=()=>({fwd:new V3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw)), right:new V3(-Math.cos(ctx.yaw),0,Math.sin(ctx.yaw))});
const LIMBS=[{k:"armL",arm:true,s:"L",off:0.0},{k:"armR",arm:true,s:"R",off:0.5},{k:"legL",arm:false,s:"L",off:0.5},{k:"legR",arm:false,s:"R",off:0.0}];
function limbRoot(L){ runner.group.updateMatrixWorld(true); return (L.arm?runner.R["arm"+L.s]:runner.R["leg"+L.s]).getWorldPosition(new V3()); }
function limbLen(L){ const R=runner.R; if(L.arm){ const a=R["arm"+L.s].getWorldPosition(new V3()), e=R["elbow"+L.s].getWorldPosition(new V3()), w=R["wrist"+L.s].getWorldPosition(new V3()); return a.distanceTo(e)+e.distanceTo(w); }
  const h=R["leg"+L.s].getWorldPosition(new V3()), k=R["knee"+L.s].getWorldPosition(new V3()), a=R["ankle"+L.s].getWorldPosition(new V3()); return h.distanceTo(k)+k.distanceTo(a); }
// the gait: each limb in stance holds its anchor; in swing it arcs to a foothold ahead of where its root will be at landing
// Q: {T (cycle s), duty, stride (m), lift (m), splay (m out from the root), reach (m ahead of the root), offs}
function gaitStep(ctx,Q,dt,moving,surf){ const G=ctx.G||(ctx.G={ph:0,limb:{}}); const S=surf||floorSurf;
  if(moving) G.ph+=dt/Q.T;
  for(const L of LIMBS){ const st=G.limb[L.k]||(G.limb[L.k]={anchor:null,swing:null});
    const ph=((G.ph+(Q.offs?Q.offs[L.k]:L.off))%1+1)%1, inStance= !moving || ph<Q.duty;
    const hold=(root)=>S.hold(root,L,Q);   /* where this limb would plant now */
    if(inStance){ if(st.swing){ st.anchor=st.swing.to.clone(); st.swing=null; ctx.events.push({kind:"plant",limb:L.k,p:st.anchor.clone(),arm:L.arm}); } if(!st.anchor) st.anchor=hold(limbRoot(L)); st.tgt=st.anchor; }
    else { const u=(ph-Q.duty)/(1-Q.duty);
      if(!st.swing){ const ahead=limbRoot(L).addScaledVector(S.along(),Q.stride*0.5+ (ctx.v||0)*Q.T*(1-Q.duty)); st.swing={from:(st.anchor||hold(limbRoot(L))).clone(), to:hold(ahead)}; st.anchor=null; }
      const p=st.swing.from.clone().lerp(st.swing.to,sm5(u)); p.addScaledVector(S.normal(),Q.lift*Math.sin(Math.PI*u)); st.tgt=p; } }
  return G; }
// a surface the limbs plant on: the floor, or the wall
const floorSurf={ along:()=>TP().fwd, normal:()=>new V3(0,1,0),
  hold(root,L,Q){ const P=TP(), side=L.s==="L"?-1:1, p=root.clone().addScaledVector(P.right,side*(Q.splay||0)).addScaledVector(P.fwd,(Q.reach||0)*(L.arm?1:-0.3)); p.y= L.arm?Q.handY:runner.a0; return p; } };
// solve every limb onto its target; poles put the elbows and knees where this subclass carries them
function limbsIK(ctx,poles){ for(const L of LIMBS){ const st=ctx.G.limb[L.k]; if(!st||!st.tgt) continue; const pole=poles(L,limbRoot(L));
    if(L.arm) armIK(runner,{side:L.s,target:st.tgt,pole,w:1,tip:0.1}); else legIK(runner,L.s,st.tgt,pole); } }
function crawlPoles(L,root){ const P=TP(), side=L.s==="L"?-1:1; return root.clone().add(new V3(0,0.9*Z(),0)).addScaledVector(P.right,side*0.5*Z()).addScaledVector(P.fwd,L.arm?0.1:-0.25); }   /* elbows and knees high over the back */
const TPHYS={ active:ctx=>(ctx.phase||"").startsWith("walks"), stance:ctx=>strideStance(ctx.ph,TWALK), traction:8, imp:0.6, rollK:0 };
floorSurf.along=()=>ctx.travel||TP().fwd;
// ---- the body poses for each subclass (the limbs are placed by IK)
function crawlBody(t,k){ const J=P0(), q=Math.sin(t*9)*0.01; J.hd=runner.hip0-(0.42*Z()+q); J.hp=1.38; J.sp=0.1; J.nx=-1.15; J.hdx=-0.1; J.hyaw=0.05*k; J.syaw=-0.06*k; return J; }
function bendBody(t,k){ const J=P0(); J.hd=runner.hip0-0.5*Z(); J.hp=-1.32; J.sp=-0.32; J.nx=-0.55; J.ny=Math.PI*0.97; J.hroll=0.04*k; J.sroll=-0.05*k; return J; }   /* belly up, the head twisted right way round */
function bendPoles(L,root){ const tr=ctx.travel||TP().fwd, side=L.s==="L"?-1:1, r=new V3(-tr.z,0,tr.x); return root.clone().add(new V3(0,0.8*Z(),0)).addScaledVector(r,-side*0.35*Z()).addScaledVector(tr,L.arm?-0.35:0.4); }
// gaits (scaled by size: small ones quicker)
const QCRAWL=()=>({T:0.62/QUICK(),duty:0.62,stride:0.34*Z(),lift:0.14*Z(),splay:0.32*Z(),reach:0.22*Z(),handY:0.07*Z(),offs:{armL:0,legR:0.08,armR:0.5,legL:0.58}});
const QBEND=()=>({T:0.5/QUICK(),duty:0.58,stride:0.36*Z(),lift:0.12*Z(),splay:0.2*Z(),reach:0.18*Z(),handY:0.07*Z(),offs:{armL:0,legR:0.06,armR:0.5,legL:0.56}});
// ---- 1 · face-down spider crawl: scuttles in bursts and freezes, head up, watching
A.crawl={ start(ctx){ ctx.x=-5.2; ctx.yaw=Math.PI/2; ctx.travel=null; ctx.norah=false; ctx.v=0; ctx.burst={on:false,t:0.6}; },
  step(t,dt,ctx){ const B=ctx.burst; B.t-=dt; if(B.t<=0){ B.on=!B.on; B.t=B.on?0.7+Math.random()*0.6:0.5+Math.random()*0.8; }
    const Q=QCRAWL(), vmax=1.6*Z()*QUICK(); ctx.v+=((B.on&&ctx.x<5.5?vmax:0)-ctx.v)*Math.min(1,dt*(B.on?9:14)); const mv=ctx.v>0.05; ctx.x+=ctx.v*dt; ctx.moving=mv;
    ctx.phase= mv?"scuttles":"freezes · watching"; const J=crawlBody(t,mv?Math.sin(t*12):0); if(!mv){ J.ny=0.35*Math.sin(t*0.9); J.nx+=0.1*Math.sin(t*1.7); }
    ctx.post=()=>{ gaitStep(ctx,Q,dt*(ctx.v/vmax),mv); limbsIK(ctx,crawlPoles); }; return J; } };
// ---- 2 · backbend spider walk: bent over backward, belly up, head first, the head twisted round the right way up
A.bend={ start(ctx){ ctx.x=-5.6; ctx.yaw=-Math.PI/2; ctx.travel=new V3(1,0,0); ctx.norah=false; ctx.v=0; },
  step(t,dt,ctx){ const Q=QBEND(), vmax=2.1*Z()*QUICK(), go=t>0.5&&ctx.x<5.4; ctx.v+=((go?vmax:0)-ctx.v)*Math.min(1,dt*6); ctx.x+=ctx.v*dt; ctx.moving=ctx.v>0.05;
    ctx.phase= ctx.moving?"skitters, head first, belly up":"bent over backward, head twisted round"; const J=bendBody(t,ctx.moving?Math.sin(t*14):0);
    ctx.post=()=>{ gaitStep(ctx,Q,dt*(ctx.v/vmax||0),ctx.moving); limbsIK(ctx,bendPoles); }; return J; } };
// ---- 3 · upright, then folds: walks like a man, then snaps down into the crawl, joints popping the wrong way
function popPoles(L,root){ const P=TP(), side=L.s==="L"?-1:1; return root.clone().add(new V3(0,-0.2*Z(),0)).addScaledVector(P.right,side*0.2*Z()).addScaledVector(P.fwd,L.arm?-0.6:0.6); }   /* elbows back, knees forward: the wrong way */
A.fold={ start(ctx){ ctx.x=-5.4; ctx.yaw=Math.PI/2; ctx.travel=null; ctx.norah=false; ctx.v=0; ctx.ph=0; ctx.pops=0; },
  step(t,dt,ctx){ const F0=3.0, F1=3.75;
    if(t<F0){ if(t>0.4){ const prev=ctx.ph; ctx.ph=(ctx.ph+dt/1.2)%1; if((prev<0.5&&ctx.ph>=0.5)||ctx.ph<prev) ctx.events.push({kind:"stomp",side:ctx.ph<prev?"L":"R",strength:0.4}); ctx.moving=true; ctx.gait={ph:ctx.ph,P:TWALK}; }
      ctx.phase= t>0.4?"walks like a man":"stands like a man"; const J=t>0.4?tLegs(stance(t),ctx.ph):stance(t); J.aLx=0.25*Math.sin(ctx.ph*Math.PI*2); J.aRx=-J.aLx; J.aLz=J.aRz=0.12; J.eL=J.eR=0.3; J.nx=0.05; J.sp=0.05; return J; }
    const u=(t-F0)/(F1-F0), Q=QCRAWL();
    if(u<1){ ctx.phase="snaps down · its joints pop the wrong way"; const w=sm5(u); const J=mix(stance(t),crawlBody(t,0),w);
      for(const th of [0.15,0.35,0.55,0.75]) if(u>=th&&ctx.pops<th*4+0.5){ ctx.pops++; ctx.events.push({kind:"pop"}); }
      ctx.post=()=>{ gaitStep(ctx,Q,0,false); for(const L of LIMBS){ const st=ctx.G.limb[L.k]; st.anchor=null; st.tgt=null; }
        for(const L of LIMBS){ const root=limbRoot(L), down=floorSurf.hold(root,L,Q); const hang=root.clone().add(new V3(0,-limbLen(L)*0.95,0)); ctx.G.limb[L.k].tgt=hang.lerp(down,sm5((u-(L.arm?0.1:0.3))/0.6)); }
        limbsIK(ctx,(L,root)=>{ const a=popPoles(L,root), b=crawlPoles(L,root); return a.lerp(b,sm5((u-0.6)/0.4)); }); };
      return J; }
    const B=ctx.burst||(ctx.burst={on:true,t:0.8}); B.t-=dt; if(B.t<=0){ B.on=!B.on; B.t=B.on?0.7+Math.random()*0.5:0.5+Math.random()*0.6; }
    const vmax=1.6*Z()*QUICK(); ctx.v+=((B.on&&ctx.x<5.5?vmax:0)-ctx.v)*Math.min(1,dt*9); ctx.x+=ctx.v*dt; ctx.moving=ctx.v>0.05; ctx.phase=ctx.moving?"scuttles":"freezes";
    const J=crawlBody(t,ctx.moving?Math.sin(t*12):0); ctx.post=()=>{ gaitStep(ctx,Q,dt*(ctx.v/vmax),ctx.moving); limbsIK(ctx,crawlPoles); }; return J; } };
A.fold.phys=TPHYS;
const LEN={crawl:8, bend:6.5, fold:8};
const NAMES={crawl:"Spider crawl",bend:"Backbend spider walk",fold:"Upright, then folds"};
const DMG={};
