const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:560}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  for(const which of ["code","blender","code","blender"]){
    await p.evaluate(which=>{ paused=true; CFG.norah.god=true; clearEnemies(); const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); window.__e=which==="code"?spawnBcross("brute_twoarm_m01",player.pos.x+fx*9,player.pos.z+fz*9,{}):spawn("brute2_blender",player.pos.x+fx*9,player.pos.z+fz*9,{}); },which);
    await p.waitForFunction(()=>__e.pv.ready,null,{timeout:60000});
    console.log(which, await p.evaluate(()=>{ const e=__e; for(let i=0;i<30;i++) step(1/60,1/60); let sum=0; for(let i=0;i<180;i++){ const t=performance.now(); e.update(1/60); sum+=performance.now()-t; } return `${(sum/180).toFixed(2)} ms of game logic a frame (walking)`; })); }
  await b.close(); })();
