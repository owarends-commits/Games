const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:600}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(500);
  console.log(await p.evaluate(()=>{ const out={}; let t=performance.now(); navBuild(); out.navBuildMs=+(performance.now()-t).toFixed(0); out.grid=NAV.nx+"x"+NAV.nz; out.segs=world.segs.length; out.boxes=world.boxes.length; out.circles=world.circles.length;
    // the worst case: a point it can't reach (inside a box)
    const b=world.boxes[0]; t=performance.now(); for(let i=0;i<10;i++) navPath(player.pos.x,player.pos.z,b.x,b.z); out.unreachableMs=+((performance.now()-t)/10).toFixed(1);
    t=performance.now(); for(let i=0;i<10;i++) navPath(world.bounds.x0+1,world.bounds.z0+1,world.bounds.x1-1,world.bounds.z1-1); out.acrossMapMs=+((performance.now()-t)/10).toFixed(1);
    return JSON.stringify(out); }));
  await b.close(); })();
