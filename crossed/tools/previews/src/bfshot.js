const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:560}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ CFG.norah.god=true; clearEnemies(); const f=[Math.sin(player.yaw),Math.cos(player.yaw)], r=[Math.cos(player.yaw),-Math.sin(player.yaw)];
    spawn("brute_club",player.pos.x+f[0]*5+r[0]*1.2,player.pos.z+f[1]*5+r[1]*1.2,{}); spawn("brute_onearm",player.pos.x+f[0]*5-r[0]*1.2,player.pos.z+f[1]*5-r[1]*1.2,{}); });
  for(const t of [3500,2500]){ await p.waitForTimeout(t); await p.screenshot({path:`../shots/bf_${t}.png`}); }
  await b.close(); })();
