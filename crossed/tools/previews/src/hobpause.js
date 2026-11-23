const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:480,height:300}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ CFG.norah.god=true; clearEnemies(); window.__e=spawn("hob"); }); await p.waitForFunction(()=>__e.pv.ready,null,{timeout:90000}); await p.waitForTimeout(2000);
  console.log(await p.evaluate(()=>{ const b=__e.pv, c=b.ctx; const r=[]; for(const name of ["crawl","throne","grabL","screech"]){ b.play(name); for(let i=0;i<20;i++) b.step(1/60);
      const X=PV_HOB.hobStep(b.clipName,b.ct,0,c); r.push(`${name}: hobStep(dt=0) → ${X}`); } return r.join("\n"); }));
  await b.close(); })();
