// node rett.js : each gun's reticle while aiming (free aim), standing, then after a shot; screenshots of the HUD
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ clearEnemies(); CFG.ctrl.cam="fixed"; wpnArmoury(); keys.KeyC=true; window.__e=spawn("walker",player.pos.x+Math.sin(player.yaw)*5,player.pos.z+Math.cos(player.yaw)*5,{}); CFG.world.freezeAI=true; });
  for(const k of ["revolver","shotgun","rifle","pistol","flaregun"]){
    await p.evaluate(k=>{ while(WS.wpn!==k){ WS.cool=0; wpnSwitch(1); } WS.bloom=0; },k); await p.waitForTimeout(1500);
    await p.screenshot({path:`/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/retF_${k}.png`});
    await p.evaluate(()=>{ WS.cool=0; player.hammer=0; fire(); }); await p.waitForTimeout(120);
    await p.screenshot({path:`/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/retF_${k}_shot.png`});
    console.log(k, await p.evaluate(()=>({mode:isFixed()?"fixed":"free",bloom:+(WS.bloom||0).toFixed(2),ret:RET&&RET.style.display})).then(JSON.stringify)); }
  console.log(errs.join('\n')||'no errors'); await b.close(); })();
