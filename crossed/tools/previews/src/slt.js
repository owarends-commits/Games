const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage();
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto(`http://127.0.0.1:8765/cf_test.html`);
  for(let i=0;i<60&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400); await p.waitForTimeout(500);
  for(const [ss,hh] of [[1,1],[1,-1]]) console.log(ss,hh,await p.evaluate(([ss,hh])=>{ window.requestAnimationFrame=()=>0; __rp.renderer.render=()=>0; SLOUCH.s=ss; SLOUCH.h=hh; __rp.start('idle'); for(let i=0;i<240;i++) __rp.frame(1/60); const R=__rp.runner.B; const a=new THREE.Vector3(), c=new THREE.Vector3(); R.upperarm_R.getWorldPosition(a); R.upperarm_L.getWorldPosition(c); return `dy(R-L)=${(a.y-c.y).toFixed(3)} err=${CS.err.toFixed(3)} lean=${CS.lean.toFixed(3)}`; },[ss,hh]));
  await b.close(); })();
