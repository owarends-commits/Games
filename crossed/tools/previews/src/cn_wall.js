// ---- the wall, and climbing it. On the wall it hangs by its grip (the guard lets a body that's held hang); let go and
// gravity has it.
const WX=4.6; let wallMesh=null;
function ensureWall(){ if(wallMesh) return; wallMesh=new THREE.Mesh(new THREE.BoxGeometry(0.3,3.6,7),new THREE.MeshLambertMaterial({color:0x4a4640})); wallMesh.position.set(WX+0.15,1.8,0); scene.add(wallMesh); }
const wallSurf={ along:()=>new V3(0,1,0), normal:()=>new V3(-1,0,0),
  hold(root,L,Q){ const side=L.s==="L"?-1:1, r=TP().right, p=root.clone(); p.x=WX-(L.arm?0.05:0.07)*Z(); p.addScaledVector(r,side*(Q.splay||0)); p.y+=(Q.reach||0)*(L.arm?1:-0.5); return p; } };
function wallPoles(L,root){ const side=L.s==="L"?-1:1, r=TP().right; return root.clone().add(new V3(-0.55*Z(),(L.arm?0.25:-0.05)*Z(),0)).addScaledVector(r,side*0.45*Z()); }   /* elbows and knees jut out from the wall */
function climbBody(t,k){ const J=P0(); J.hp=0.12; J.sp=0.12+0.04*k; J.nx=-0.55; J.hyaw=0.06*k; J.syaw=-0.08*k; return J; }
const QWALL=()=>({T:0.7/QUICK(),duty:0.65,stride:0.3*Z(),lift:0.1*Z(),splay:0.3*Z(),reach:0.32*Z(),handY:0,offs:{armL:0,legR:0.08,armR:0.5,legL:0.58}});
// how far each limb's end is from where it's meant to be: the grip that holds it on the wall
function gripErr(ctx){ let worst=0; const R=runner.R; for(const L of LIMBS){ const st=ctx.G&&ctx.G.limb[L.k]; if(!st||!st.anchor) continue;
    const end= L.arm? R["elbow"+L.s].localToWorld(R["wrist"+L.s].position.clone().multiplyScalar(1.1)) : R["ankle"+L.s].getWorldPosition(new V3()); worst=Math.max(worst,end.distanceTo(st.anchor)); } return worst; }
function climbClip(ctx,t,dt,dropOn){ ctx.wall=true; const T=ctx.T, Q=QCRAWL(), QW=QWALL(), sz=Z(), top=(dropOn?1.95:1.75)*sz;
  if(T.ph==="crawl"){ const vmax=1.5*sz*QUICK(); const go=ctx.x<WX-0.95*sz; ctx.v+=((go?vmax:0)-ctx.v)*Math.min(1,dt*8); ctx.x+=ctx.v*dt; ctx.moving=ctx.v>0.05; ctx.onLimbs=true; ctx.phase="scuttles to the wall";
    if(!go&&ctx.v<0.08){ T.ph="rear"; T.t0=t; T.x0=ctx.x; }
    const J=crawlBody(t,ctx.moving?Math.sin(t*12):0); ctx.post=()=>{ gaitStep(ctx,Q,dt*(ctx.v/vmax),ctx.moving); limbsIK(ctx,crawlPoles); }; return J; }
  if(T.ph==="rear"){ const u=(t-T.t0)/0.9, w=sm5(u); ctx.x=T.x0+(WX-0.3*sz-T.x0)*w; ctx.lift=0.12*sz*w; ctx.onLimbs=true; ctx.phase="rears up onto the wall";
    const J=mix(crawlBody(t,0),climbBody(t,0),w);
    ctx.post=()=>{ const G=ctx.G; for(const L of LIMBS){ const st=G.limb[L.k]; if(L.arm){ const root=limbRoot(L), to=wallSurf.hold(root,L,QW); if(!st.from) st.from=(st.anchor||st.tgt).clone(); st.tgt=st.from.clone().lerp(to,sm5(u/0.8)).addScaledVector(new V3(-1,0,0),0.12*Math.sin(Math.PI*sat(u/0.8))); } }
      limbsIK(ctx,(L,root)=>crawlPoles(L,root).lerp(wallPoles(L,root),w)); };
    if(u>=1){ T.ph="climb"; for(const L of LIMBS){ const st=ctx.G.limb[L.k]; st.from=null; st.anchor=L.arm?st.tgt.clone():null; st.swing=null; } ctx.G.ph=0.0; }
    return J; }
  if(T.ph==="climb"){ ctx.held=true; ctx.onLimbs=true; const v=0.75*sz*QUICK(), go=ctx.lift<top; ctx.v=go?v:0; ctx.lift=Math.min(top,ctx.lift+ctx.v*dt); ctx.moving=go; ctx.phase="climbs the wall, hanging by its grip";
    if(!go){ T.ph="hang"; T.t0=t; } const J=climbBody(t,go?Math.sin(t*10):0);
    ctx.post=()=>{ gaitStep(ctx,QW,dt,go,wallSurf); limbsIK(ctx,wallPoles); ctx.grip=gripErr(ctx); }; return J; }
  if(T.ph==="hang"){ ctx.held=true; ctx.onLimbs=true; const k=t-T.t0; ctx.phase="hangs · the head twists round to look down at the room";
    const J=climbBody(t,0); J.ny=Math.min(1,k/0.5)*2.4; J.hdy=Math.min(1,k/0.5)*0.6; J.nx=-0.2; if(dropOn) dropOn.look(k);
    ctx.post=()=>{ gaitStep(ctx,QW,0,false,wallSurf); limbsIK(ctx,wallPoles); ctx.grip=gripErr(ctx); };
    if(k>(dropOn?dropOn.wait():1.6)){ T.ph="drop"; T.t0=t; T.yaw0=ctx.yaw; ctx.events.push({kind:"letgo"}); } return J; }
  // let go: it pushes off, twists round in the air and lands on all fours
  const k=t-T.t0, w=sm5(k/0.45); ctx.onLimbs=true; ctx.kick={id:"drop"+T.t0,v:dropOn?dropOn.v():{x:-1.4,y:0.6,z:0}}; ctx.yaw=T.yaw0+Math.PI*w; ctx.phase= k<0.6?"lets go · twists round in the air":"lands on all fours";
  const J=mix(climbBody(t,0),crawlBody(t,0),w);
  ctx.post=()=>{ const G=ctx.G; if(k<0.55){ for(const L of LIMBS){ const st=G.limb[L.k]; st.anchor=null; st.swing=null; const root=limbRoot(L); st.tgt=root.clone().add(new V3(0,-limbLen(L)*0.75,0)).addScaledVector(TP().fwd,L.arm?0.25:-0.1); } limbsIK(ctx,crawlPoles); }
    else { gaitStep(ctx,Q,0,false); limbsIK(ctx,crawlPoles); } if(dropOn&&dropOn.post) dropOn.post(k); };
  if(k>0.45 && !T.landed){ T.landed=1; } return J; }
A.climb={ start(ctx){ ensureWall(); ctx.x=-0.6; ctx.yaw=Math.PI/2; ctx.travel=null; ctx.norah=false; ctx.v=0; ctx.lift=0; ctx.T={ph:"crawl"}; },
  step(t,dt,ctx){ return climbClip(ctx,t,dt,null); } };
