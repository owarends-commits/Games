// ---------------------------------------------------------------- ACROSS movement types: a ladder that wounds push them down
// 0 Marionette (healthy default): upright, jerked along on strings · 1 Lurcher: a stiff leg swung round, tilted, heavy lurching steps
// 2 Puller: down on the floor, dragging itself at her with its arms, flailing. Some spawn lower on the ladder, whatever their subclass.
const MOVES=["marionette","lurcher","puller"];
function pickMove(forced, variant){
  if(variant==="crawler"||variant==="runner") return null;
  if(MOVES.includes(forced)) return forced;
  const A=CFG.across, r=Math.random();
  if(r<A.movePullerChance) return variant==="mourner" ? "marionette" : "puller";
  if(r<A.movePullerChance+A.moveLurcherChance) return "lurcher";
  return "marionette";
}
Enemy.prototype.moveDegrade=function(dir){
  if(!this.move||this.dead) return; const A=CFG.across, f=this.hp/Math.max(0.01,this.maxHp);
  let lv = f<A.moveDegPull ? 2 : f<A.moveDegLurch ? 1 : 0;
  if(lv<1 && (this.hurtLimb("legL")||this.hurtLimb("legR"))) lv=1;
  if(this.variant==="mourner") lv=Math.min(lv,1);
  const cur=MOVES.indexOf(this.move); if(lv<=cur) return;
  this.move=MOVES[lv]; this.moveT=0;
  if(this.move==="puller"){ this.vel.multiplyScalar(0.3); this.flinch=1; this.state="chase"; this.t=0; this.gait.mode="stall"; SFX.scratch(this.pos); log(`${this.name} drops and drags itself on`,"#ffb070"); }
  else log(`${this.name} starts to lurch`,"#ffb070");
};
Enemy.prototype.moveSpeedMul=function(){
  const A=CFG.across, deg=1-Math.max(0,this.hp)/Math.max(0.01,this.maxHp);
  if(this.move==="lurcher") return A.moveLurchSpeed*(0.45+0.95*Math.max(0,Math.sin(this.lph||0)))*(1-0.3*deg);
  if(this.move==="puller") return (0.15+1.4*(this.pullK||0))*(1-0.35*deg);
  return 1;
};
// layered on the upright puppet pose (Marionette and Lurcher)
Enemy.prototype.moveLayer=function(v,dt,mv){
  const A=CFG.across, deg=Math.min(1,(1-Math.max(0,this.hp)/Math.max(0.01,this.maxHp))*1.3+(this.wounds||0)*0.04), m=Math.max(0.2,mv);
  this.clipLegR=1;
  if(this.move==="marionette"){ const k=1+deg;
    v.nZ += Math.sin(gameTime*1.3+this.id)*0.35*k + this.jn("mlz",0.25*k,dt); v.nX += 0.15+this.jn("mlx",0.3*k,dt);       // head lolls on a loose string
    v.aLX = v.aLX*0.35 + 0.08 + this.jn("mal",0.45*k*m,dt); v.aRX = v.aRX*0.35 + 0.08 + this.jn("mar",0.45*k*m,dt);       // arms dangle and get yanked
    v.aLZ = 0.12+Math.abs(this.jn("maz",0.25*k,dt)); v.aRZ = -0.12-Math.abs(this.jn("mbz",0.25*k,dt)); v.eL*=0.4; v.eR*=0.4;
    v.kL += Math.abs(this.jn("mkl",0.55*k*m,dt)); v.kR += Math.abs(this.jn("mkr",0.55*k*m,dt));                          // feet drag, then kick forward
    v.hy += Math.abs(this.jn("mhy",0.05*k*m,dt)); v.hr += this.jn("mhr",0.12*k,dt); }
  else if(this.move==="lurcher"){ const k=1+deg; this.lph=(this.lph||0)+dt*(2.6-0.8*deg)*(0.5+mv);
    const s=Math.max(0,Math.sin(this.lph)), c=Math.cos(this.lph);
    this.clipLegR=0.12;                                                                                                   // the right leg barely bends: it's swung, not stepped
    v.kR=0.04; v.lRX = 0.1*mv*c; v.lRZ = -(0.18+0.35*s*mv)*k;
    v.hr -= (0.2+0.15*deg) + 0.12*s*mv; v.nZ += 0.35*k; v.cH += 0.12*k; v.hp += 0.15+0.1*deg;
    v.hy -= (0.05+0.07*s*mv)*k; v.kL += 0.25*s*mv;                                                                         // drops onto the good leg each lurch
    v.aRX = 0.05+0.1*s; v.aRZ = -0.06; v.eR=0.1; v.aLX += 0.35*s*mv; v.aLZ += 0.2; }                                      // bad-side arm hangs; the other claws at the air
};
// the Puller: arm over arm along the floor, irregular, with sporadic flailing
Enemy.prototype.pullerPose=function(dt,moving,b){
  const deg=Math.min(1,1-Math.max(0,this.hp)/Math.max(0.01,this.maxHp));
  const near=Math.hypot(player.pos.x-this.pos.x,player.pos.z-this.pos.z)<2.2;
  this.pph=(this.pph||0)+dt*(moving?(2.2+(near?1.4:0))*(1-0.35*deg)*(0.6+0.8*Math.abs(Math.sin(gameTime*0.7+this.id))):0.4);
  const p=this.pph, sL=Math.sin(p), sR=Math.sin(p+Math.PI*(0.8+0.3*Math.sin(gameTime*1.1+this.id)));
  // reach (arm forward, high) → plant → haul (arm back under the shoulder)
  const arm = s=>1.35+0.95*Math.max(0,s)+0.35*Math.min(0,s);
  this.pullK = moving ? Math.max(0,-Math.cos(p))*0.6+Math.max(0,-Math.cos(p+Math.PI))*0.4 : 0;
  const fl = near?1.6:1;
  b.armLX = arm(sL)+this.jn("pal",0.5*fl,dt); b.armRX = arm(sR)+this.jn("par",0.5*fl,dt);
  b.hipY = 0.2 + 0.05*this.pullK + Math.abs(this.jn("phy",0.04*fl,dt));
  b.hipPitch = 1.42 - 0.18*this.pullK + this.jn("php",0.1*fl,dt);                                                          // chest heaves up on each haul
  b.neck = -1.0 - 0.35*this.pullK + this.jn("pnx",0.45*fl,dt);                                                            // head jerks up toward her
  b.legLX = -0.1+this.jn("pll",0.12,dt); b.legRX = -0.05+this.jn("plr",0.12,dt); b.kneeL=0.15+Math.abs(this.jn("pkl",0.4,dt)); b.kneeR=0.1+Math.abs(this.jn("pkr",0.4,dt));
  const P=this.P; P.armL.rotation.z=0.35+this.jn("paz",0.35*fl,dt); P.armR.rotation.z=-0.35+this.jn("pbz",0.35*fl,dt);    // elbows out, flailing
  if(P.elbowL){ P.elbowL.rotation.x=-0.4-0.8*Math.max(0,-sL); P.elbowR.rotation.x=-0.4-0.8*Math.max(0,-sR); }
  if(P.torso) P.torso.rotation.y=0.25*Math.sin(p)+this.jn("pty",0.15*fl,dt);
  return b;
};
