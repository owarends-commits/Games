// ---------------------------------------------------------------- Norah's movement: a reluctant walk and jog, in three states by health
// fine: upright and wary · hurt (bleeding): a limp on the right, her left hand clutching her side · critical: hunched, dragging the right leg, lurching
// Her rig gets hidden elbows, wrists and ankles so the model bends at them.
(function(){ const P=player.P; for(const s of ["L","R"]){
  if(!P["elbow"+s]){ const e=new THREE.Object3D(); e.position.y=-0.34; P["arm"+s].add(e); P["elbow"+s]=e; const w=new THREE.Object3D(); w.position.y=-0.3; e.add(w); P["wrist"+s]=w; }
  if(!P["ankle"+s]){ const a=new THREE.Object3D(); a.position.y=-0.48; P["knee"+s].add(a); P["ankle"+s]=a; } } })();
function norahTier(){ const N=CFG.norah, f=player.hp/Math.max(1,N.hp); return f>N.hurtAt?0 : f>N.critAt?1 : 2; }
// only the jog slows down: her walk keeps its pace whatever her health
function norahSpeedMul(){ if(!isRunning()||player.crouch||player.aiming) return 1; const t=norahTier(); return t===0?1 : t===1?CFG.norah.hurtSpeed : CFG.norah.critSpeed; }
const NG={ph:0, blend:0, run:0, tier:0, lurch:0, lurchT:2, stag:0, stagT:2, arm:{L:{x:0,z:0,e:0.1},R:{x:0,z:0,e:0.1}}};
function norahGait(P, moving, spd, dt){
  const N=CFG.norah, tier=norahTier(); NG.tier += (tier-NG.tier)*Math.min(1,dt*2);           // eases between states
  const hurt=Math.min(1,Math.max(0,NG.tier)), crit=Math.min(1,Math.max(0,NG.tier-1));
  const run = moving===2 ? 1 : 0; NG.run += (run-NG.run)*Math.min(1,dt*5);
  const mv = moving ? Math.min(1, spd/Math.max(0.3,N.walk*0.8)) : 0; NG.blend += (mv-NG.blend)*Math.min(1,dt*6);
  const b=NG.blend, r=NG.run;
  // cadence: walk ~1.7 steps/s, jog ~2.5; slower and more uneven the worse she is
  // hurt: now and then a step goes wrong (more often the lower her health); critical: the limp takes every step
  const f=player.hp/Math.max(1,N.hp), sev=Math.min(1,Math.max(0,(N.hurtAt-f)/Math.max(0.01,N.hurtAt-N.critAt)));
  NG.stagT-=dt; if(hurt>0.5 && crit<0.5 && b>0.3 && NG.stagT<=0 && NG.stag<0.1){ NG.stag=1; NG.stagT=(3.4-2.2*sev)*(0.7+Math.random()*0.6)*(r>0.5?0.75:1); }
  NG.stag=Math.max(0,NG.stag-dt*2.0); const st=Math.sin(Math.min(1,NG.stag)*Math.PI*0.5)*(1-crit);
  const cad = (1.7 + 0.8*r) * (1-0.04*hurt-0.18*crit) * (1+0.06*Math.sin(gameTime*0.9)) * (1-0.55*st);
  NG.ph += dt*Math.PI*cad*Math.max(0.35,b);
  let p=NG.ph; if(crit>0) p += 0.5*crit*Math.sin(NG.ph);                                   // limp: hurries off the bad (right) leg
  const sL=Math.sin(p), cL=Math.cos(p);
  // critical: now and then the bad leg gives and she lurches
  NG.lurchT-=dt; if(crit>0.5 && b>0.3 && NG.lurchT<=0){ NG.lurch=1; NG.lurchT=1.6+Math.random()*2.5; } NG.lurch=Math.max(0,NG.lurch-dt*3.5);
  const strideW=0.38, strideJ=N.jogStride;                                                // the jog stays short: she doesn't want to go
  const A=(strideW+(strideJ-strideW)*r)*b*(1-0.25*crit);
  const lean = 0.04 + 0.1*r*b + 0.08*hurt + 0.14*crit + 0.04*(1-b)*crit;
  const breathe = Math.sin(gameTime*(2.2+2.5*hurt+2*crit))*(0.012+0.02*hurt+0.035*crit);
  // legs (positive x = back). The right leg is the hurt one: shorter, stiffer, dragging when critical
  const legAmpR = 1 - 0.6*crit - 0.3*st;
  const thL = -A*sL, thR = A*sL*legAmpR;
  const kneeK = (0.55+0.55*r)*b;
  const knL = 0.08 + kneeK*Math.pow(Math.max(0,Math.cos(p-0.35)),1.4) + 0.12*crit;
  const knR = 0.05 + kneeK*(1-0.85*crit)*Math.pow(Math.max(0,-Math.cos(p-0.35)),1.4) + 0.4*NG.lurch + 0.95*st;
  P.legL.rotation.set(thL,0,0.03); P.legR.rotation.set(thR,0,-0.03-0.05*crit);
  P.kneeL.rotation.x=knL; P.kneeR.rotation.x=knR;
  P.ankleL.rotation.x=-thL*0.6-knL*0.5; P.ankleR.rotation.x=-thR*0.6-knR*0.5 + 0.5*crit*b;   // drags the toe
  // hips and spine: bob, sway over the stance leg, counter-twist, a dip onto the bad leg
  const bob = (0.025+0.03*r)*b*(0.5-0.5*Math.cos(2*p)) + 0.13*crit*b*Math.max(0,-sL) + 0.14*st*b;
  P.hips.position.y = 0.95 - bob - 0.01*hurt - 0.07*crit - 0.12*NG.lurch + breathe*0.3;
  P.hips.rotation.set(0.04*crit, 0.12*sL*b*(1-0.4*crit), (0.05+0.01*hurt+0.15*crit)*cL*b - 0.06*crit - 0.12*NG.lurch - 0.2*st*b);
  P.torso.rotation.set(lean*1.15 + breathe*2 + 0.1*hurt*(1-b) + 0.22*st*b, -0.2*sL*b*(1-0.5*crit), 0.05*hurt+0.08*crit);
  // head: down and turned a little; a nervous glance back now and then when she's fine and moving
  const glance = (tier===0 && b>0.5) ? Math.max(0,Math.sin(gameTime*0.7))**8*0.6 : 0;
  P.neck.rotation.set(0.05*r*b + 0.08*hurt + 0.12*crit - breathe, glance*(Math.sin(gameTime*0.35)>0?1:-1), 0);
  // arms: bent and close at a jog, loose at a walk; left hand clutches her side when hurt
  const aA = (0.32+0.12*r)*b*(1-0.4*hurt-0.5*crit);
  NG.arm.L={x: aA*sL - 0.1*r*b, z:0.1+0.25*st, e:0.2+0.9*r*b};
  NG.arm.R={x:-aA*sL*(1-0.4*crit) - 0.1*r*b + 0.1*crit, z:-0.12, e:0.25+0.8*r*b*(1-0.5*crit)};
  if(hurt>0.01){ const h=Math.min(1,hurt*1.4); NG.arm.L={x:NG.arm.L.x*(1-h)+(-0.55)*h, z:NG.arm.L.z*(1-h)+(-0.55)*h, e:NG.arm.L.e*(1-h)+1.9*h}; }
  for(const s of ["L","R"]){ P["elbow"+s].rotation.set(-0.08,0,0); P["wrist"+s].rotation.set(0,0,0); }
  return sL*(0.45+0.35*r)*b;
}
function norahArms(P){ const a=NG.arm; P.armL.rotation.set(a.L.x,0,a.L.z); P.armR.rotation.set(a.R.x,0,a.R.z); P.elbowL.rotation.x=-a.L.e; P.elbowR.rotation.x=-a.R.e; }
