const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:500}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(4000);
  await p.evaluate(()=>{ clearEnemies(); CFG.norah.god=false; window.__d=spawn("dummy",player.pos.x+3,player.pos.z,{}); player.hurt(999,__d,"test"); });
  for(let i=0;i<8;i++){ await p.waitForTimeout(700); console.log(await p.evaluate(()=>JSON.stringify({t:PLV.t.toFixed(2),dead:PLV.S.dead,pd:player.dead,menu:SB.simMenu,hs:hitstop,ks:killSlowmo,ready:PLV.ready,grab:!!player.grabbed}))); }
  await b.close(); })();
