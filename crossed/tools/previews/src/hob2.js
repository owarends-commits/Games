const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:480,height:300}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('console '+m.text().slice(0,200)); });
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ CFG.norah.god=true; clearEnemies(); }); await p.keyboard.press('KeyK'); await p.waitForTimeout(6000); await p.keyboard.press('KeyK'); await p.waitForTimeout(3000); await p.keyboard.press('KeyK');
  for(let i=0;i<8;i++){ await p.waitForTimeout(1500); console.log(await Promise.race([p.evaluate(()=>JSON.stringify({hobs:enemies.filter(e=>e.pvType==="hob").map(e=>({ready:e.pv.ready,clip:e.pv.clipName,pos:[+e.pos.x.toFixed(1),+e.pos.z.toFixed(1)],meshParentIsOwnStage:PV_HOB.H&&PV_HOB.H.group.parent===e.pv.stage})),frame:frameNo,crashes:Object.keys(CRASHES)})),new Promise(r=>setTimeout(()=>r("HUNG"),8000))])); }
  console.log(errs.slice(0,8).join('\n')||'no errors'); await b.close(); })();
