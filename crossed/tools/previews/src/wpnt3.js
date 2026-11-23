// node wpnt3.js : every weapon in real play. Picked up as an item, chosen on the wheel, then aimed (C), fired (F), reloaded (R),
// swung (V): checks the model in her hands, the animation she plays, ammo, damage to a target.
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(2500);
  const st=()=>p.evaluate(()=>({wpn:WS.wpn, phase:PLV.ctx.phase, vis:plvWith(()=>PV_NW.LIVE.wvis()), mag:WS.wpn==="revolver"?player.rounds:wpnState(WS.wpn).mag, spare:WS.wpn==="revolver"?player.spare:wpnState(WS.wpn).spare, rl:player.reloading}));
  const phases=async(ms)=>{ const seen=new Set(); const t0=Date.now(); while(Date.now()-t0<ms){ seen.add((await st()).phase); await p.waitForTimeout(60); } return [...seen].join(" | "); };
  const out=[];
  for(const [k,item] of [["revolver",null],["pistol","pistol"],["shotgun","shotgun"],["rifle","rifle"],["flaregun","flaregun"],["flare","road_flare"],["knife","knife"],["hatchet","hatchet"],["crowbar","crowbar"]]){
    await p.evaluate(([k,item])=>{ clearEnemies(); CFG.norah.god=true; player.hp=100; const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw);
      window.__d=spawn("dummy",player.pos.x+fx*(["knife","hatchet","crowbar"].includes(k)?1.1:4),player.pos.z+fz*(["knife","hatchet","crowbar"].includes(k)?1.1:4),{}); __d.hp=__d.maxHp=999;
      if(item) giveItem({item,qty:1},true); const am={pistol:"nine_mm",shotgun:"shells",rifle:"rifle_rounds",flaregun:"flare_shells"}[k]; if(am) giveItem({item:am,qty:8},true); if(k==="revolver"){ player.spare=10; } wheelPick(WHEEL.indexOf(k)); },[k,item]);
    await p.waitForTimeout(1200); const s0=await st(); const hp0=await p.evaluate(()=>__d.hp);
    let line=`${k}: holds → wpn=${s0.wpn} model in hands=${s0.vis[k]} phase="${s0.phase}" ammo ${s0.mag}/${s0.spare}`;
    if(k==="knife"||k==="hatchet"||k==="crowbar"){ await p.keyboard.press('KeyV'); const ph=await phases(1600); const hp1=await p.evaluate(()=>__d.hp); line+=` · V swing: phases [${ph}] target −${(hp0-hp1).toFixed(1)}`;
      await p.keyboard.down('KeyC'); await p.waitForTimeout(400); await p.keyboard.press('KeyF'); const ph2=await phases(1600); await p.keyboard.up('KeyC'); const hp2=await p.evaluate(()=>__d.hp); line+=` · aim+F: [${ph2}] target −${(hp1-hp2).toFixed(1)}`; }
    else { await p.keyboard.down('KeyC'); await p.waitForTimeout(700); const sa=await st(); line+=` · aim: "${sa.phase}"`;
      await p.keyboard.press('KeyF'); const ph=await phases(1400); const s1=await st(); const hp1=await p.evaluate(()=>__d.hp);
      line+=` · fire: [${ph}] ammo ${s0.mag}→${s1.mag} target −${(hp0-hp1).toFixed(1)}${k==="flare"?" flares on floor "+(await p.evaluate(()=>WS.flares.length)):""}`;
      await p.keyboard.up('KeyC'); await p.waitForTimeout(300);
      if(k!=="flare"){ await p.keyboard.press('KeyR'); const ph2=await phases(4500); const s2=await st(); line+=` · reload: [${ph2}] ammo →${s2.mag}/${s2.spare}`; } }
    const s3=await st(); line+=` · model still shown ${s3.vis[k]}`; out.push(line); console.log(line); }
  console.log(errs.slice(0,10).join('\n')||'no page errors'); await b.close(); })();
