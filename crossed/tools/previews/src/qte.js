// grabs: a sequence of prompts (ankle grabs), or mash one key to fill a meter (bear hugs)
function startQte(g, hug){
  const S=CFG.across;
  if(hug && S.hugMash){ g.qte={mode:"mash", key:QTE_KEYS[0], fill:0.12, win:S.hugTime, t:S.hugTime, pulse:0, wrong:0}; return; }
  const n=Math.round(hug?S.hugSteps:g.by.kind==="brute"?CFG.brute.grabSteps:S.qteSteps); const seq=[]; let prev=-1;
  for(let i=0;i<n;i++){ let k; do{ k=Math.floor(Math.random()*QTE_KEYS.length); }while(k===prev && QTE_KEYS.length>1); prev=k; seq.push(QTE_KEYS[k]); }
  const w=S.qteWindow*(hug?0.85:1); g.qte={mode:"seq", seq, i:0, win:w, t:w, pulse:0, wrong:0};
}
const qteMatch=(code,k)=> code===k.key || code==="pad"+k.pad || code==="touch";
function qtePress(code){
  const g=player.grabbed; if(!g||!g.qte) return false; const q=g.qte;
  if(q.mode==="mash"){
    if(qteMatch(code,q.key)){ q.fill+=CFG.across.mashPer; q.pulse=0.12; SFX.shove(); shake=Math.max(shake,0.08); if(q.fill>=1) pushOff(g); }
    else q.wrong=0.3;
    return true; }
  const want=q.seq[q.i];
  if(qteMatch(code,want)){ q.i++; q.pulse=0.18; SFX.shove(); shake=Math.max(shake,0.15); if(q.i>=q.seq.length) pushOff(g); else q.t=q.win; }
  else qteFail(g,"wrong key");
  return true;
}
function qteTick(rdt){
  const g=player.grabbed; if(!g||!g.qte) return; const q=g.qte;
  q.pulse=Math.max(0,q.pulse-rdt); q.wrong=Math.max(0,q.wrong-rdt);
  if(q.mode==="mash") q.fill=Math.max(0,q.fill-CFG.across.mashDecay*rdt);
  q.t-=rdt; if(q.t<=0) qteFail(g,"too slow");
}
function pushOff(g){
  player.grabbed=null; const e=g.by; if(run) run.escapes++;
  const dir=new THREE.Vector3(e.pos.x-player.pos.x,0,e.pos.z-player.pos.z).normalize();
  if(!e.dead){ e.cool=1.5; e.swCool=1.2; e.door=null;
    if(e.kind==="runner") e.runnerFreed(dir);
    else if(e.kind==="across" && e.legsLost()===0 && e.gait && e.variant!=="matron") e.knockDown(dir,"push");
    else { e.state="stagger"; e.stagger=0.8; e.t=0; e.flinch=1; }
    e.kb.addScaledVector(dir, 1.2); }
  joinedRelease(g,false); player.shoveT=0.3; SFX.shove(); log(`Norah pushes ${e.name} off`,"#9ed08a"); qteBanner("BROKE FREE","ok");
}
function qteFail(g, why){
  player.grabbed=null; const e=g.by;
  if(e.kind==="brute"){ e.state="recover"; e.t=0; e.cool=1.0; louisThrowPlayer(e); qteBanner("","bad"); return; }
  if(e.kind==="runner"){ joinedRelease(g,true); e.runnerCrush(); qteBanner("CRUSHED","bad"); return; }
  player.bite(e,"bite",g.dmg); joinedRelease(g,true);
  if(!e.dead){ e.state="recover"; e.t=0; e.cool=1.5; e.swCool=1.0; }
  player.stumble=0.35; log(`${why==="wrong key"?"Wrong key":"Too slow"}: ${e.name} bites`,"#ff7070");
  qteBanner(`${why==="wrong key"?"WRONG KEY":"TOO SLOW"} · BITTEN −${Math.round(g.dmg)}`,"bad");
}
