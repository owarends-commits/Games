// ---------------------------------------------------------------- ACROSS animation layer: flinches, and the leg clip's weight and (snapping) time
Enemy.prototype.animLayer=function(v,dt,mv){
  const A=CFG.across, P=this.P;
  // per-zone flinch: snaps in, then lets go in jerky steps (a puppet dropped and caught on its wires)
  let tw=0; const F=this.hfx;
  if(F){ F.t+=dt; const T=A.animFlinchTime; if(F.t>=T) this.hfx=null; else {
    const raw=1-F.t/T, steps=A.animSnap>0?Math.max(2,Math.round(5/A.animSnap)):0, a=(steps?Math.ceil(raw*steps)/steps:raw)*A.animFlinch*(F.t<0.04?F.t/0.04:1);
    const s = F.limb && F.limb.endsWith("R") ? -1 : 1;
    if(F.z==="head"){ v.nX-=1.1*a; v.hp-=0.25*a; v.cH-=0.2*a; v.jaw=Math.max(v.jaw,0.7*a); v.nZ+=0.3*a*(this.id%2?1:-1); }
    else if(F.z==="torso"){ v.hp+=0.55*a; v.cH+=0.35*a; v.aLX+=0.5*a; v.aRX+=0.5*a; v.nX+=0.4*a; v.hy-=0.05*a; }
    else if(F.z==="arm"){ tw=0.75*a*s; if(s>0){ v.aLX-=1.3*a; v.aLZ+=0.7*a; v.eL*=1-a; } else { v.aRX-=1.3*a; v.aRZ-=0.7*a; v.eR*=1-a; } v.hr+=0.15*a*s; v.nZ+=0.25*a*s; }
    else if(F.z==="leg"){ if(s>0){ v.kL+=1.2*a; v.lLX-=0.35*a; } else { v.kR+=1.2*a; v.lRX-=0.35*a; } v.hy-=0.14*a; v.hr+=0.28*a*s; v.hp+=0.2*a; } } }
  this.twist=tw;
  // the leg clip: on while it walks upright toward her; the puppet takes the legs back for anything else
  const G=this.gait, sp=Math.hypot(this.vel.x,this.vel.z);
  const upright = this.stance!=="crawling" && this.legsLost()===0 && this.state==="chase" && G && G.mode!=="fallen" && G.mode!=="rising" && !this.disguised
    && !(this.aware==="unaware" && (this.idle.kind==="feed"||this.idle.kind==="playdead"||this.idle.kind==="lurk")) && !(this.cr&&this.cr.playDead) && sp>0.05;
  const want = upright ? A.animClip : 0; this.clipW=(this.clipW||0)+(want-(this.clipW||0))*Math.min(1,dt*8);
  this.clipRun=(this.clipRun||0)+((sp>(A.animWalkRef+A.animRunRef)/2?A.animRunMix:0)-(this.clipRun||0))*Math.min(1,dt*5);
  const rate = sp/(A.animWalkRef+(A.animRunRef-A.animWalkRef)*Math.min(1,(this.clipRun||0)/Math.max(0.05,A.animRunMix)));
  this.clipRaw=(this.clipRaw||0)+dt*rate; this.clipHold=(this.clipHold||0)-dt;
  if(A.animSnap<=0) this.clipT=this.clipRaw;
  else if(this.clipHold<=0 || this.clipT==null){ this.clipT=this.clipRaw; this.clipHold=(0.04+Math.random()*0.12)*A.animSnap*(G&&G.mode==="burst"?0.6:1); }
};
