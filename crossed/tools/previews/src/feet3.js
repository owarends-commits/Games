const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage();
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/tac_test.html'); for(let i=0;i<60&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  console.log(await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; __rp.renderer.render=()=>0; __rp.start("walk"); const C=__rp.runner; const rows=[];
    for(let k=0;k<4*60;k++){ __rp.frame(1/60); const cx=__rp.ctx; if(!cx.moving) continue; const ph=cx.ph; if((ph>0.40&&ph<0.62)||(ph>0.9||ph<0.12)) rows.push(`ph=${ph.toFixed(3)} L=${footLow(C,"L").toFixed(3)} R=${footLow(C,"R").toFixed(3)} gy=${C.group.position.y.toFixed(3)} cy=${(cx.y||0).toFixed(3)} st=${strideStance(ph,TWALK)}`); }
    return rows.slice(0,40).join('\n'); })); await b.close(); })();
