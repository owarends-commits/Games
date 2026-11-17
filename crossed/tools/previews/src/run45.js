const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:700}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/bp_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__bp&&__bp.BR)));i++) await p.waitForTimeout(400);
  await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; document.getElementById('oPunch').value='b'; __bp.start('punch'); });
  for(const tt of [1.9,2.0,2.1,2.3,3.0]) console.log(tt, await p.evaluate(tt=>{ while(__bp.t<tt) __bp.frame(1/60); const g=__bp.nora.group; return JSON.stringify([g.position.toArray().map(v=>+v.toFixed(2)),g.visible,__bp.ctx.n.fall]); },tt));
  await b.close(); })();
