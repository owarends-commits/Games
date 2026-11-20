// ================================================================ the Runner (BCROSS): restless, stomping, sprints in with a charge-up
// Animations come from the Runner preview, posed on the hidden rig and retargeted onto the runner model like every other body.
VMAP.runner={key:"runner",name:"Runner",stance:"stand",p:"walker",h:[2.0,2.1],fw:[1.0,1.08],skin:"grey",hair:[0,0.1],long:0,clothes:"tee",fight:{}};
MDL_POOLS.runner=k=>MODEL_LIB[k].g==="bcross/runner"; MDL_DEFAULT_POOL.runner="runner";
const RFX={ink:0, inkLen:0, last:performance.now(), burst:null, paper:new THREE.Color(0xefe6d6), inkMat:new THREE.MeshBasicMaterial({color:0x0e0b09,skinning:true})};
const RUN=(()=>{
  const sat=x=>Math.max(0,Math.min(1,x)), ss=t=>{ t=sat(t); return t*t*(3-2*t); }, easeIn=t=>{ t=sat(t); return t*t*t; }, easeOut=t=>{ t=sat(t); return 1-(1-t)**3; };
  const nz=(t,s)=>Math.sin(t*1.9+s)*0.5+Math.sin(t*3.7+s*1.7)*0.3+Math.sin(t*7.3+s*2.3)*0.2;
  const spring=(s,target,dt,w)=>{ const a=w*w*(target-s.x)-2*w*s.v; s.v+=a*dt; s.x+=s.v*dt; return s.x; };
  const P0=()=>({hd:0,hz:0,hx:0,hp:0,hyaw:0,hroll:0,sp:0,syaw:0,sroll:0,nx:0,ny:0,nz:0,hdx:0,hdy:0,aLx:0,aLy:0,aLz:0.08,eL:0.15,aRx:0,aRy:0,aRz:0.08,eR:0.15,lLx:0,lLz:0.02,kL:0,fL:0,lRx:0,lRz:0.02,kR:0,fR:0});
  const mix=(a,b,t)=>{ const o={}; for(const k in a) o[k]=a[k]+(b[k]-a[k])*t; return o; };
  function stride(ph,P){ const st=P.stance;
    if(ph<st){ const u=ph/st; return {lx:P.front+(P.back-P.front)*u, k:P.kStance*Math.sin(u*Math.PI)+(u<0.12?P.kImpact*(1-u/0.12):0), f:-0.1*u}; }
    const u=(ph-st)/(1-st);
    if(u<P.liftEnd){ const a=ss(u/P.liftEnd); return {lx:P.back+(P.high-P.back)*a, k:P.kLift*Math.sin(a*Math.PI*0.5)+0.3*(1-a), f:0.35*(1-a)+0.2}; }
    const a=easeIn((u-P.liftEnd)/(1-P.liftEnd)); return {lx:P.high+(P.front-P.high)*a, k:P.kLift*(1-a)+0.02, f:0.2*(1-a)-0.12*a}; }
  function restless(e,t,dt){ const S=e.rS||(e.rS={head:{x:0,v:0},headT:0,headTo:0,sx:{x:0,v:0},sz:{x:0,v:0},shufT:0,to:[0,0],ph:0,cT:2,cK:0,c:0});
    const J=P0(); J.hd=0.07+0.035*S.c; J.kL=J.kR=0.32+0.25*S.c; J.lLx=J.lRx=-0.12-0.1*S.c; J.fL=J.fR=-0.12;
    J.sp=0.16+0.04*Math.sin(t*6.2)+0.12*S.c; J.nx=-0.12-0.1*S.c; J.aLx=J.aRx=-0.3; J.aLz=J.aRz=0.22; J.eL=0.85+0.15*nz(t*2.4,1); J.eR=0.85+0.15*nz(t*2.6,4);
    S.headT-=dt; if(S.headT<=0){ S.headTo=Math.random()<0.25?0:(Math.random()*2-1)*1.05; S.headT=0.3+Math.random()*0.8; }
    const h=spring(S.head,S.headTo,dt,22); J.ny=h*0.62; J.hdy=h*0.3; J.syaw=h*0.22; J.hyaw=h*0.08; J.nz=-h*0.08;
    S.shufT-=dt; if(S.shufT<=0){ S.to=[(Math.random()*2-1)*0.22,(Math.random()*2-1)*0.18]; S.shufT=0.45+Math.random()*0.9; }
    spring(S.sx,S.to[0],dt,13); spring(S.sz,S.to[1],dt,13); const mv=Math.hypot(S.sx.v,S.sz.v); S.ph+=dt*mv*9; const lift=sat(mv*1.6);
    J.lLx+=-0.25*lift*Math.max(0,Math.sin(S.ph)); J.kL+=0.7*lift*Math.max(0,Math.sin(S.ph)); J.lRx+=-0.25*lift*Math.max(0,-Math.sin(S.ph)); J.kR+=0.7*lift*Math.max(0,-Math.sin(S.ph));
    J.hroll=0.06*Math.sin(S.ph)*lift; J.hp=S.sz.v*0.05; J.lLz+=0.06; J.lRz+=0.06; J.hx=S.sx.x; J.hz=S.sz.x;
    S.cT-=dt; if(S.cT<=0){ S.cT=2+Math.random()*3; S.cK=0.55; } if(S.cK>0){ S.cK-=dt; S.c=Math.sin(sat(1-S.cK/0.55)*Math.PI); } else S.c=0;
    return J; }
  const WALK={stance:0.56,front:-0.42,back:0.42,high:-0.95,kStance:0.12,kImpact:0.22,kLift:1.45,liftEnd:0.62};
  function walkPose(ph){ const J=P0(), a=stride(ph,WALK), b=stride((ph+0.5)%1,WALK); const s=Math.sin(ph*Math.PI*2);
    J.lLx=a.lx; J.kL=a.k; J.fL=a.f; J.lRx=b.lx; J.kR=b.k; J.fR=b.f; const imp=Math.max(0,1-(ph%0.5)/0.09);
    J.hd=0.035+0.05*imp+0.03*Math.abs(s); J.sp=0.22+0.06*imp; J.hp=0.04; J.hyaw=0.16*s; J.syaw=-0.28*s; J.hroll=0.06*Math.cos(ph*Math.PI*2);
    J.aLx=0.72*s; J.aRx=-0.72*s; J.eL=0.95+0.25*Math.max(0,-s); J.eR=0.95+0.25*Math.max(0,s); J.aLz=J.aRz=0.16; J.nx=0.06-0.08*imp; return J; }
  const RUNP={stance:0.36,front:-0.62,back:0.62,high:-1.25,kStance:0.25,kImpact:0.3,kLift:1.9,liftEnd:0.55};
  function sprintPose(ph,sh){ const J=P0(), a=stride(ph,RUNP), b=stride((ph+0.5)%1,RUNP), s=Math.sin(ph*Math.PI*2);
    J.lLx=a.lx+0.1; J.kL=a.k; J.fL=a.f; J.lRx=b.lx+0.1; J.kR=b.k; J.fR=b.f; const imp=Math.max(0,1-(ph%0.5)/0.1);
    J.hd=0.09+0.06*imp; J.hp=0.14; J.sp=0.42+0.05*imp; J.nx=-0.22; J.hyaw=0.12*s; J.syaw=-0.32*s;
    J.aLx=1.15*s-0.15; J.aRx=-1.15*s-0.15; J.eL=J.eR=1.55; J.aLz=J.aRz=0.1;
    if(sh){ J.syaw=J.syaw*(1-sh)+0.72*sh; J.sroll=0.38*sh; J.hyaw=J.hyaw*(1-sh)+0.3*sh; J.ny=-0.55*sh; J.nz=-0.2*sh; J.nx=-0.1*sh-0.22*(1-sh);
      J.aRx=J.aRx*(1-sh)-0.15*sh; J.aRz=J.aRz*(1-sh)-0.35*sh; J.eR=1.55*(1-sh)+2.05*sh; J.aLx=J.aLx*(1-sh)+(0.45+0.3*s)*sh; J.aLz=0.1*(1-sh)+0.4*sh; }
    return J; }
  function chargePose(c,t,sh){ const J=P0(), tr=c*c, k=s=>nz(t*38,s)*0.05*tr;
    J.hd=0.08+0.16*c; J.sp=0.18+0.5*c+k(1); J.hp=0.08+0.1*c; J.nx=0.05+0.32*c+k(2);
    J.lLx=-0.35*c; J.kL=0.3+0.55*c; J.fL=-0.1*c; J.lRx=0.45*c; J.kR=0.3+0.75*c; J.fR=-0.35*c;
    J.aLx=J.aRx=-0.2-0.45*c; J.aLz=J.aRz=0.15-0.7*c; J.eL=J.eR=0.8+1.35*c; J.aLx+=k(3); J.aRx+=k(4);
    if(sh){ J.syaw=0.55*c; J.sroll=0.32*c; J.ny=-0.45*c; J.aRz=-0.45*c; J.aRx=-0.15; J.eR=2.0*c+0.4; J.aLz=0.15+0.2*c; J.aLx=0.25*c; J.eL=0.9; }
    return J; }
  function kickPoses(stomp){ const CH=P0(); CH.hd=0.05; CH.lRx=-1.45; CH.kR=2.05; CH.fR=0.35; CH.kL=0.28; CH.lLx=-0.05; CH.fL=-0.1; CH.sp=-0.18; CH.hp=-0.08; CH.nx=0.12; CH.aLx=-0.35; CH.aLz=0.65; CH.aRx=0.25; CH.aRz=0.55; CH.eL=0.6; CH.eR=0.7; CH.hroll=-0.06;
    const ST=Object.assign({},CH); ST.lRx=-1.55; ST.kR=0; ST.fR=-0.35; ST.hz=0.32; ST.sp=-0.36; ST.hp=-0.12; ST.aLx=0.35; ST.aLz=0.5; ST.aRx=0.55; ST.aRz=0.35; ST.nx=0.05; ST.kL=0.34;
    if(stomp){ ST.lRx=-0.62; ST.kR=0.08; ST.fR=-0.05; ST.hd=0.17; ST.hz=0.34; ST.sp=0.36; ST.hp=0.14; ST.nx=0.4; ST.aLx=0.45; ST.aRx=0.4; ST.aLz=0.35; ST.aRz=0.35; ST.kL=0.55; }
    const DN=P0(); DN.lRx=stomp?-0.55:-0.45; DN.kR=0.1; DN.lLx=0.35; DN.kL=0.3; DN.hd=0.1; DN.hz=0.3; DN.sp=0.25; DN.aLx=0.3; DN.aRx=-0.3; DN.eL=DN.eR=0.9; DN.aLz=DN.aRz=0.2;
    return {CH,ST,DN}; }
  function grabPose(t,sq){ const lock=Math.min(1,sq/0.55), lift=sat((sq-0.55)/0.45), n=s=>nz(t*26,s)*0.04*sq;
    const J=P0(); J.hd=0.34+0.02*lift; J.hp=0.15; J.sp=0.2-0.06*lift+n(1); J.nx=0.32; J.ny=0.5;
    J.aLz=J.aRz=1.38; J.aLy=J.aRy=-1.0-0.3*lock-0.12*lift+n(2); J.aLx=J.aRx=0.5+0.12*lift; J.eL=J.eR=1.4+0.35*lock+0.3*lift+n(3);
    J.lLx=-0.6; J.kL=1.0-0.25*lift; J.lRx=0.35; J.kR=1.0-0.2*lift; J.fR=-0.4; J.lLz=J.lRz=0.2; return J; }
  function stunned(u){ const J=P0(); J.sp=-0.4*(1-u)+0.12*u; J.nx=-0.6*(1-u)+0.05; J.aLx=-0.9*(1-u)-0.25; J.aRx=-0.8*(1-u)-0.25; J.aLz=0.95*(1-u)+0.2; J.aRz=0.9*(1-u)+0.2; J.eL=J.eR=0.4+0.45*u; J.lLx=0.3*(1-u); J.kL=0.35; J.lRx=-0.1; J.kR=0.25; J.hd=0.08; return J; }
  function lying(e,t){ const J=P0(); J.hp=-1.5; J.hd=e.rHip0-0.2; J.sp=-0.05; J.nx=0.35+0.1*Math.sin(t*3); J.lLx=0.2; J.kL=0.5; J.lRx=0.05; J.kR=0.2; J.aLx=-0.4; J.aLz=1.0; J.aRx=-0.2; J.aRz=0.9; J.eL=J.eR=0.4; return J; }
  function crouch(){ const J=P0(); J.hd=0.38; J.hp=0.35; J.sp=0.35; J.lLx=-1.0; J.kL=1.9; J.lRx=-0.3; J.kR=2.1; J.fR=0.5; J.aLx=-0.6; J.aRx=0.2; J.aLz=0.4; J.aRz=0.3; J.eL=0.6; J.eR=0.3; J.nx=-0.1; return J; }
  function skidPose(td){ const J=P0(), k=Math.exp(-td*5); J.hp=-0.22*(1-k)+0.1; J.sp=0.1; J.hd=0.16; J.lLx=-0.75; J.kL=0.2; J.fL=0.2; J.lRx=0.55; J.kR=0.9; J.fR=-0.4; J.aLx=-0.6; J.aLz=0.55; J.aRx=0.3; J.aRz=0.5; J.eL=0.5; J.eR=0.7; J.nx=-0.15; return J; }
  function buttImpact(td){ const J=sprintPose(0.08,1); J.syaw=0.95; J.sroll=0.42; J.hz=0.18*Math.exp(-td*6); J.sp=0.5; J.lLx=-0.75; J.kL=0.45; J.lRx=0.6; J.kR=0.35; J.fR=-0.4; return J; }
  function leapPose(ta,hit){ const u=hit?1:ss(ta/0.2), J=P0(); J.hp=-1.35*u-(hit?0.05:0); J.hd=0.38*u; J.sp=0.25*u; J.nx=0.5*u; J.lLx=J.lRx=-0.15*u; J.kL=J.kR=hit?0.05:1.5*(1-ss((ta-0.14)/0.12))+0.05; J.lLz=J.lRz=0.06; J.aLx=J.aRx=-1.2*u-(hit?0.2:0); J.aLz=J.aRz=0.7*u+(hit?0.1:0); J.eL=J.eR=0.4; return J; }
  return {sat,ss,easeIn,easeOut,nz,P0,mix,restless,walkPose,sprintPose,chargePose,kickPoses,grabPose,stunned,lying,crouch,skidPose,buttImpact,leapPose};
})();

// the pose onto the hidden rig (sizes in metres of the model, so divided by the rig's scale)
Enemy.prototype.runnerApply=function(J){ const P=this.P, k=this.scale||1;
  P.hips.position.set(J.hx/k, this.hipY-J.hd/k, J.hz/k); P.hips.rotation.set(J.hp,J.hyaw,J.hroll); P.torso.rotation.set(0,0,0);
  P.chest.rotation.set(J.sp,J.syaw,J.sroll); P.neck.rotation.set(J.nx,J.ny,J.nz); P.head.rotation.set(J.hdx,J.hdy,0);
  P.armL.rotation.set(J.aLx,J.aLy,J.aLz); P.armR.rotation.set(J.aRx,-J.aRy,-J.aRz); P.elbowL.rotation.set(-J.eL,0,0); P.elbowR.rotation.set(-J.eR,0,0); P.wristL.rotation.set(0,0,0); P.wristR.rotation.set(0,0,0);
  P.legL.rotation.set(J.lLx,0,J.lLz); P.legR.rotation.set(J.lRx,0,-J.lRz); P.kneeL.rotation.x=J.kL; P.kneeR.rotation.x=J.kR; P.ankleL.rotation.x=J.fL; P.ankleR.rotation.x=J.fR; };

// ---------------------------------------------------------------- hits on Norah
function runnerHitNorah(e, dmg, how, push, down, extra={}){
  if(player.dead) return false; if((player.guardT||0)>0&&!player.grabbed) return false;   /* stun grace: she gets to move before the next hit */ if(dodgeSaves()){ log(`Norah ducks ${e.name}'s ${how}`,"#bfe0ff"); if(run) run.saves++; return false; }
  player.hurt(dmg, e, how); if(player.dead) return true;
  const d=new THREE.Vector3(player.pos.x-e.pos.x,0,player.pos.z-e.pos.z); if(d.lengthSq()<1e-4) d.set(Math.sin(e.yaw),0,Math.cos(e.yaw)); d.normalize();
  if(push){ player.vel.copy(d.multiplyScalar(push)); } if(down){ player.stumble=Math.max(player.stumble,down); player.downT=down; player.search=null; }
  if(extra.thrown) player.thrown={t:0.9,last:push,hit:false,by:e};
  if(extra.kneel){ player.vel.set(0,0,0); player.kneelT=Math.max(player.kneelT||0,extra.kneel); }
  return true; }
function runnerPuff(p,s){ for(let i=0;i<4;i++) spray(new THREE.Vector3(p.x,groundY(p.x,p.z)+0.05,p.z), new THREE.Vector3((Math.random()-.5)*0.6,0.4,(Math.random()-.5)*0.6), 0x8a7a66); if(s>0.8) SFX.stomp(p); }

// ---------------------------------------------------------------- the brain
Enemy.prototype.brainRunner=function(dt,dist,want,toP){
  const C=CFG.runner, pp=player.pos; this.rDirect=false; this.rSuper=false; this.rGhost=false; this.rNoPush=false;
  const los=lineOfSight(this.pos.x,this.pos.z,pp.x,pp.z,false);
  this.sees = !player.dead && los && dist<C.sight; if(this.sees){ this.lastKnown={x:pp.x,z:pp.z}; this.lostT=0; } else this.lostT=(this.lostT||0)+dt;
  const rc=this.rc||(this.rc={sprint:C.sprintCool*0.5,kick:0.5}); rc.sprint-=dt; rc.kick-=dt; this.rt=(this.rt||0)+dt;
  const go=s=>{ this.state=s; this.rt=0; this.t=0; this.rHit=false; }, legs=this.legsLost();
  const fwd=()=>new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw));
  if(this.state==="stagger"||this.state==="recover"){ this.desired={x:0,z:0}; if(this.state==="recover"&&this.rt>0.4) go("chase"); return; }
  switch(this.state){
  case "rcharge": { this.desired={x:0,z:0}; this.rSuper=true; this.turnTo(want,dt,C.turn*2);
    if(this.rt>=C.charge){ this.rDir=this.yaw; this.rV=0; go("rsprint"); SFX.grunt(this.pos,0.3); } return; }
  case "rsprint": { this.rDirect=true; this.rSuper=true; this.rGhost=true;
    const vmax=C.sprint*(this.rKind==="butt"?0.93:1); this.rV=Math.min(vmax, vmax*RUN.easeOut(this.rt/0.32)+1.5);
    const d=wrapA(want-this.rDir), turn=C.homing*Math.PI/180*dt; if(this.sees) this.rDir+=Math.max(-turn,Math.min(turn,d)); this.yaw=this.rDir;
    this.vel.set(Math.sin(this.rDir)*this.rV,0,Math.cos(this.rDir)*this.rV);
    const ahead=this.facing(toP);
    if(this.rKind==="butt" && dist<1.05 && ahead>0.4){ go("rbutt"); this.vel.multiplyScalar(0.15); SFX.slam(this.pos); shake=Math.max(shake,0.3); if(runnerHitNorah(this,C.buttDamage,"shoulder butt",C.buttPush,C.buttDown)) log(`${this.name} drives a shoulder into her`,"#ff7070"); return; }
    if(this.rKind==="grab" && dist<0.85 && ahead>0.4){ if(!player.grabbed && player.grab(this,{dmg:C.grabDamage,how:"bear hug"})){ go("grab"); this.state="grab"; this.rDrag=this.rV*0.42; this.hitDone=true; shake=Math.max(shake,0.25); } else go("rskid"); return; }
    if(this.rKind==="drop" && dist<3.4 && ahead>0.5){ go("rleap"); this.rVy=3.1; this.rY=0; runnerPuff(this.pos,1.4); return; }
    if(this.rKind==="sprint" && dist<1.4){ go("rskid"); rc.kick=Math.min(rc.kick,0.05); runnerPuff(this.pos,1.2); return; }
    if(this.rt>2.6 || (ahead<0 && dist<3) || (this.rt>0.4 && Math.hypot(this.vel.x,this.vel.z)<1)){ go("rskid"); runnerPuff(this.pos,1.2); log(`${this.name} overshoots and skids`,"#9ed08a"); }
    return; }
  case "rskid": { this.rDirect=true; this.rGhost=this.rt<0.1; this.vel.multiplyScalar(Math.exp(-5*dt)); if(this.rt>0.65) go("chase"); return; }
  case "rbutt": { this.rDirect=true; this.rGhost=this.rt<0.12; this.vel.multiplyScalar(Math.exp(-6*dt)); if(this.rt>0.95) go("chase"); return; }
  case "rleap": { this.rDirect=true; this.rSuper=true; this.rGhost=true; this.rVy-=9.8*dt; this.rY=Math.max(0,this.rY+this.rVy*dt);
    if(!this.rHit){ this.vel.set(Math.sin(this.rDir)*this.rV,0,Math.cos(this.rDir)*this.rV);
      if(dist<1.5 && this.facing(toP)>0.3){ this.rHit=true; this.rHitT=this.rt; this.vel.multiplyScalar(0.15); this.rVy=Math.min(this.rVy,0.5);
        if(runnerHitNorah(this,C.dropDamage,"drop kick",C.dropThrow,C.dropDown,{thrown:true})){ log(`${this.name}'s drop kick throws her`,"#ff5050"); runnerImpactFrame(new THREE.Vector3(pp.x,groundY(pp.x,pp.z)+1.2,pp.z)); } } }
    else this.vel.multiplyScalar(Math.exp(-2*dt));
    if(this.rY<=0 && this.rt>0.15){ go("rdown"); this.rY=0; runnerPuff(this.pos,1.6); shake=Math.max(shake,0.15); } return; }
  case "rdown": { this.rDirect=true; this.vel.multiplyScalar(Math.exp(-6*dt)); if(this.rt>C.downTime) go("rgetup"); return; }
  case "rgetup": { this.desired={x:0,z:0}; if(this.rt>0.75){ go("chase"); rc.sprint=Math.max(rc.sprint,C.sprintCool*0.6); } return; }
  case "rkick": { this.desired={x:0,z:0}; this.turnTo(want,dt,C.turn*(this.rt<C.chamber?1:0.2));
    const ts=this.rt-C.chamber-C.chamberHold;
    if(ts>=0.09 && !this.rHit){ this.rHit=true; this.rGhost=true;
      if(this.rKind==="stomp"){ if(dist<C.stompReach && this.facing(toP)>0.5 && runnerHitNorah(this,C.stompDamage,"stomp kick",0,0,{kneel:C.kneel})){ shake=Math.max(shake,0.3); SFX.slam(this.pos); log(`${this.name} stamps through her knee`,"#ff7070"); } }
      else if(dist<C.kickReach && this.facing(toP)>0.6 && runnerHitNorah(this,C.kickDamage,"forward kick",C.kickPush,C.kickDown)){ shake=Math.max(shake,0.3); SFX.slam(this.pos); log(`${this.name}'s kick sends her back`,"#ff7070"); } }
    if(ts>=0 && ts<0.18) this.rGhost=true;
    if(ts>=0.09+0.2 && !this.rStompT){ this.rStompT=1; runnerPuff(this.pos,1); }
    if(ts>0.09+0.2+0.45+0.2){ this.rStompT=0; go("chase"); } return; }
  case "grab": { this.rNoPush=true; this.desired={x:0,z:0}; this.vel.set(0,0,0);
    const f=new THREE.Vector3(pp.x-this.pos.x,0,pp.z-this.pos.z); if(f.lengthSq()<1e-4) f.copy(fwd()); f.normalize(); this.yaw=Math.atan2(f.x,f.z);
    if(this.rDrag>0){ player.pos.addScaledVector(f,this.rDrag*dt); collide(player.pos,0.3); this.rDrag=Math.max(0,this.rDrag-6*dt); }      // its momentum drags them both back
    this.pos.set(player.pos.x-f.x*C.hugGap, 0, player.pos.z-f.z*C.hugGap);
    if(!(player.grabbed && player.grabbed.by===this)) go("chase"); return; }
  case "rcrush": { this.rNoPush=true; this.desired={x:0,z:0}; this.vel.set(0,0,0); player.crushT=Math.max(player.crushT||0,0.05); player.vel.set(0,0,0);
    const f=new THREE.Vector3(Math.sin(this.yaw),0,Math.cos(this.yaw)); this.pos.set(player.pos.x-f.x*C.hugGap,0,player.pos.z-f.z*C.hugGap);
    const pulse=Math.floor(this.rt/(C.crushTime/4)); if(!player.dead && pulse>(this.rPulse??-1) && pulse<4){ this.rPulse=pulse; player.hurt(Math.round(C.crushDamage/4), this, "crushing hug"); shake=Math.max(shake,0.18); } shake=Math.max(shake,0.04);
    if(this.rt>=C.crushTime || player.dead){ player.crushT=0; player.kneelT=C.kneel; go("rrelease"); log(`${this.name} drops her`,"#ff9a6a"); } return; }
  case "rrelease": { this.desired={x:0,z:0}; if(this.rt>0.7){ go("chase"); rc.sprint=Math.max(rc.sprint,C.sprintCool); rc.kick=Math.min(rc.kick,0.3); } return; }
  case "rstun": { const b=fwd().multiplyScalar(this.rt<0.5?-C.stunStep:0); this.desired={x:b.x,z:b.z}; if(this.rt>C.stunTime){ go("chase"); rc.sprint=Math.max(rc.sprint,1.5); } return; }
  default: { if(this.state!=="chase") go("chase");
    if(player.dead){ this.desired={x:0,z:0}; this.rAnim="neutral"; return; }
    if(this.sees){ this.turnTo(want,dt,C.turn);
      const downed=(player.downT>0)||(player.kneelT>0);
      if(dist<C.kickRange && rc.kick<=0 && !player.grabbed && legs===0 && this.facing(toP)>0.7){ this.rKind = downed||Math.random()<C.stompChance ? "stomp":"kick"; go("rkick"); rc.kick=C.kickCool; SFX.grunt(this.pos,0.25); return; }
      if(legs===0 && dist>C.sprintMin && dist<C.sprintMax && rc.sprint<=0 && !player.grabbed && los){
        const r=Math.random(); this.rKind = (dist>5 && r<C.dropChance)?"drop" : r<C.dropChance+C.grabChance?"grab" : r<C.dropChance+C.grabChance+C.buttChance?"butt" : "sprint";
        go("rcharge"); rc.sprint=C.sprintCool; log(`${this.name} curls in, about to charge`,"#ffb070"); return; }
      if(dist<C.holdDist){ this.desired={x:0,z:0}; this.rAnim="neutral"; return; }
      const g=this.goal(dt); this.steer(dt,Math.atan2(g.x-this.pos.x,g.z-this.pos.z),C.walk*(legs?0.3:1),C.turn); this.rAnim="walk"; return; }
    if(this.lastKnown && Math.hypot(this.lastKnown.x-this.pos.x,this.lastKnown.z-this.pos.z)>0.8){ this.goalPt=null; this.steer(dt,(()=>{ const g=route(this.pos.x,this.pos.z,this.lastKnown.x,this.lastKnown.z); return Math.atan2(g.x-this.pos.x,g.z-this.pos.z); })(),C.walk*(legs?0.3:1),C.turn); this.rAnim="walk"; return; }
    this.desired={x:0,z:0}; this.rAnim="neutral"; }
  }
};
// the escape and the failure (called from the grab prompts)
Enemy.prototype.runnerFreed=function(dir){ this.state="rstun"; this.rt=0; this.stagger=0; this.rc.sprint=Math.max(this.rc.sprint,1.5); log(`${this.name} reels back a step`,"#9ed08a"); };
Enemy.prototype.runnerCrush=function(){ this.state="rcrush"; this.rt=0; this.rPulse=-1; player.crushT=CFG.runner.crushTime; log(`${this.name} crushes her in its arms`,"#ff5050"); SFX.grunt(this.pos,0.6); };

// ---------------------------------------------------------------- the pose for each state
Enemy.prototype.poseRunner=function(dt){
  const C=CFG.runner, t=gameTime, st=this.state; let J;
  const sp=Math.hypot(this.vel.x,this.vel.z);
  const step=(T)=>{ const prev=this.rph||0; this.rph=((this.rph||0)+dt/T)%1; if((prev<0.5&&this.rph>=0.5)||this.rph<prev){ const s=this.rph<prev?"L":"R"; const P=this.P["ankle"+s], w=new THREE.Vector3(); P.getWorldPosition(w); runnerPuff(w,st==="rsprint"?1:0.6); if(st==="rsprint") shake=Math.max(shake,0.03); } };
  if(this.dead) return;
  if(st==="rcharge") J=RUN.chargePose(RUN.ss(this.rt/C.charge),t,this.rKind==="butt");
  else if(st==="rsprint"){ step(0.44*(8/Math.max(4,this.rV||8))); J=RUN.sprintPose(this.rph,this.rKind==="butt"?1:0); if(this.rt<0.12) J=RUN.mix(RUN.chargePose(1,t,this.rKind==="butt"),J,RUN.ss(this.rt/0.12)); }
  else if(st==="rskid") J=RUN.mix(RUN.skidPose(this.rt),RUN.restless(this,t,dt),RUN.ss((this.rt-0.45)/0.2));
  else if(st==="rbutt") J=this.rt<0.35?RUN.buttImpact(this.rt):RUN.mix(RUN.buttImpact(this.rt),RUN.restless(this,t,dt),RUN.ss((this.rt-0.35)/0.6));
  else if(st==="rleap") J=RUN.leapPose(this.rt,this.rHit);
  else if(st==="rdown") J=RUN.lying(this,t);
  else if(st==="rgetup") J=this.rt<0.45?RUN.mix(RUN.lying(this,t),RUN.crouch(),RUN.ss(this.rt/0.45)):RUN.mix(RUN.crouch(),RUN.restless(this,t,dt),RUN.ss((this.rt-0.45)/0.3));
  else if(st==="rkick"){ const K=RUN.kickPoses(this.rKind==="stomp"), ts=this.rt-C.chamber-C.chamberHold;
    if(ts<0){ J=RUN.mix(RUN.restless(this,t,dt),K.CH,RUN.ss(this.rt/C.chamber)); if(this.rt>=C.chamber){ const tr=RUN.nz(t*45,7)*0.06; J.lRx+=tr; J.kR+=tr*1.3; J.sp+=tr*0.4; } }
    else if(ts<0.09) J=RUN.mix(K.CH,K.ST,RUN.easeIn(ts/0.09));
    else if(ts<0.29){ J=Object.assign({},K.ST); J.lRx+=RUN.nz(t*40,3)*0.025; }
    else if(ts<0.51) J=RUN.mix(K.ST,K.DN,RUN.easeIn((ts-0.29)/0.22));
    else J=RUN.mix(K.DN,RUN.restless(this,t,dt),RUN.ss((ts-0.51)/0.45)); }
  else if(st==="grab") J=RUN.grabPose(t,Math.min(0.55,this.rt/0.4*0.55));
  else if(st==="rcrush") J=RUN.grabPose(t,0.55+0.45*RUN.ss(this.rt/0.35));
  else if(st==="rrelease"){ const o=RUN.stunned(1); o.sp=0.05; J=RUN.mix(RUN.grabPose(t,1),o,RUN.ss(this.rt/0.35)); }
  else if(st==="rstun"){ J=RUN.stunned(RUN.ss(this.rt/C.stunTime)); if(this.rt>0.15&&this.rt<0.65){ const a=Math.sin((this.rt-0.15)/0.5*Math.PI); J.lRx=0.55*a; J.kR=0.25+0.7*a; } }
  else if(st==="stagger"){ J=RUN.restless(this,t,dt); J.sp-=0.35*Math.min(1,this.stagger*3); J.nx-=0.4*this.flinch; }
  else if(this.rAnim==="walk" && sp>0.2){ step(1.05*1.85/Math.max(0.6,sp)); J=RUN.walkPose(this.rph); }
  else J=RUN.restless(this,t,dt);
  if(this.legsLost()){ J.kL+=this.lost.legL?0:0.6; J.kR+=this.lost.legR?0:0.6; J.hd+=0.25; J.sp+=0.3; }
  this.runnerApply(J);
  this.rootY = st==="rleap"?(this.rY||0):0;
  this.runnerFx(dt);
};
// afterimages and the layer the impact frame inks
Enemy.prototype.runnerFx=function(dt){
  const S=this.skin; if(!S||!S.model) return;
  if(!S.inkLayer){ S.inkLayer=1; S.model.traverse(o=>{ if(o.isMesh) o.layers.enable(1); }); }
  const G=this.rGhosts||(this.rGhosts=[]);
  if(this.rGhost && CFG.runner.afterimages){ this.rGhT=(this.rGhT||0)-dt; if(this.rGhT<=0){ this.rGhT=0.035;
    let g=G.find(x=>x.life<=0); if(!g && G.length<10){ const obj=THREE.SkeletonUtils.clone(S.model), B={}; obj.traverse(o=>{ if(o.isBone) B[o.name]=o; if(o.isMesh){ o.frustumCulled=false; o.material=new THREE.MeshBasicMaterial({map:o.material.map,color:0xff8a66,transparent:true,opacity:0,depthWrite:false,skinning:!!o.isSkinnedMesh}); } });
      const h=new THREE.Group(); h.add(obj); scene.add(h); g={h,obj,B,life:0}; G.push(g); }
    if(g){ g.life=0.2; g.h.visible=true; this.root.updateMatrixWorld(true); this.root.matrixWorld.decompose(g.h.position,g.h.quaternion,g.h.scale);
      for(const k in S.B){ const a=S.B[k], b=g.B[k]; if(b){ b.position.copy(a.position); b.quaternion.copy(a.quaternion); b.scale.copy(a.scale); } } } } }
  for(const g of G){ if(g.life<=0) continue; g.life-=dt; const o=Math.max(0,g.life/0.2)*0.42; g.obj.traverse(m=>{ if(m.isMesh) m.material.opacity=o; }); if(g.life<=0) g.h.visible=false; }
};
Enemy.prototype.runnerRemoveFx=function(){ for(const g of this.rGhosts||[]) scene.remove(g.h); this.rGhosts=[]; };

// ---------------------------------------------------------------- the impact frame: a hit-stop, bodies inked black on paper, speed lines from the hit
function runnerImpactFrame(p){
  hitstop=Math.max(hitstop,CFG.runner.impactFreeze); RFX.ink=RFX.inkLen=CFG.runner.impactFreeze; shake=Math.max(shake,0.6); SFX.slam(p);
  if(!RFX.burst){ const d=document.createElement("div"); d.style.cssText="position:fixed;inset:0;pointer-events:none;z-index:5;opacity:0;background:repeating-conic-gradient(from 0deg at var(--bx,50%) var(--by,50%), rgba(20,16,12,.85) 0deg 2.2deg, transparent 2.2deg 9deg)"; document.body.appendChild(d); RFX.burst=d; }
  const v=p.clone().project(camera), r=renderer.domElement.getBoundingClientRect();
  RFX.burst.style.setProperty("--bx",`${r.left+(v.x*0.5+0.5)*r.width}px`); RFX.burst.style.setProperty("--by",`${r.top+(-v.y*0.5+0.5)*r.height}px`);
}
function runnerRender(){
  const now=performance.now(), rdt=Math.min(0.05,(now-RFX.last)/1000); RFX.last=now;
  if(RFX.ink>0){ RFX.ink-=rdt; const ink=RFX.ink>RFX.inkLen-0.08;
    if(RFX.burst){ RFX.burst.style.opacity = ink?1:Math.max(0,RFX.ink/Math.max(0.01,RFX.inkLen-0.08))*0.55; RFX.burst.style.mixBlendMode= ink?"normal":"multiply"; }
    if(ink){ if(player.skin&&player.skin.model&&!player.skin.inkLayer){ player.skin.inkLayer=1; player.skin.model.traverse(o=>{ if(o.isMesh) o.layers.enable(1); }); }
      const bg=scene.background, fog=scene.fog; scene.background=RFX.paper; scene.fog=null; scene.overrideMaterial=RFX.inkMat; camera.layers.set(1);
      renderer.render(scene,camera); camera.layers.set(0); scene.overrideMaterial=null; scene.background=bg; scene.fog=fog; return; } }
  else if(RFX.burst) RFX.burst.style.opacity=0;
  renderer.render(scene,camera);
}

// ---------------------------------------------------------------- Norah: held, crushed, down on a knee
function runnerNorahPose(P){
  const g=player.grabbed, k=performance.now()/1000;
  if(g && g.by && g.by.kind==="runner"){ const n=s=>Math.sin(k*14+s)*0.14;
    P.armL.rotation.set(0.05+n(1),0,0.0); P.armR.rotation.set(0.05+n(2),0,0.0); if(P.elbowL){ P.elbowL.rotation.x=-0.6; P.elbowR.rotation.x=-0.7; }
    P.torso.rotation.set(-0.15+n(3)*0.5,n(4),0); P.neck.rotation.set(-0.25+n(5),0,0); P.hips.position.y=0.92; P.hips.rotation.set(0,0,0); P.legL.rotation.x=-0.12; P.legR.rotation.x=0.18; P.kneeL.rotation.x=0.25; P.kneeR.rotation.x=0.15; }
  if(player.crushT>0){ const a=Math.min(1,(CFG.runner.crushTime-player.crushT)/0.35), n=s=>Math.sin(k*30+s)*0.06*(0.5+a);
    P.armL.rotation.set(0.1+n(1),0,0); P.armR.rotation.set(0.1+n(2),0,0); if(P.elbowL){ P.elbowL.rotation.x=-0.9; P.elbowR.rotation.x=-0.9; }
    P.torso.rotation.set(-0.25-0.35*a+n(3),0,0); P.hips.rotation.set(0.1+0.15*a,0,0); P.neck.rotation.set(-0.45-0.4*a+n(4),n(5),0);
    P.legL.rotation.x=-0.25; P.legR.rotation.x=0.05; P.kneeL.rotation.x=0.45; P.kneeR.rotation.x=0.35; P.hips.position.y=0.95; }
  if(player.kneelT>0 && !player.crushT){ P.hips.position.y=0.95-0.42; P.hips.rotation.set(0.05,0,0); P.legL.rotation.set(-1.25,0,0.02); P.kneeL.rotation.x=1.55; P.legR.rotation.set(0.25,0,-0.02); P.kneeR.rotation.x=1.8;
    if(P.ankleL){ P.ankleL.rotation.x=-0.25; P.ankleR.rotation.x=0.7; } P.torso.rotation.set(0.5+0.04*Math.sin(k*5),0,0); P.neck.rotation.set(0.45,0,0);
    P.armL.rotation.set(-0.75,0,-0.45); if(P.elbowL) P.elbowL.rotation.x=-1.9; if(!player.aiming){ P.armR.rotation.set(-0.35,0,0.15); if(P.elbowR) P.elbowR.rotation.x=-0.4; } }
}
