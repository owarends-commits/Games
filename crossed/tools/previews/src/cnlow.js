const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [clip,tt]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage();
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/cn_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  console.log(await p.evaluate(([c,tt])=>{ window.requestAnimationFrame=()=>0; __rp.renderer.render=()=>0; __rp.start(c); while(__rp.t<tt) __rp.frame(1/60); const C=__rp.runner; C.group.updateMatrixWorld(true); const m=C.pb.measure();
    const by={}; m.pts.forEach((q,k)=>{ const n=m.bone[k]?m.bone[k].name:'?'; by[n]=Math.min(by[n]??9,q.y); }); return 'gy='+C.group.position.y.toFixed(3)+' '+Object.entries(by).sort((a,b)=>a[1]-b[1]).slice(0,8).map(([n,y])=>n+':'+y.toFixed(3)).join(' '); },[clip,+tt])); await b.close(); })();
