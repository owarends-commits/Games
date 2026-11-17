const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:700}});
  p.on('pageerror',e=>console.log('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/nw_test.html');
  for(let i=0;i<60&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400); await p.waitForTimeout(500);
  const out=await p.evaluate(src=>eval(src), fs.readFileSync(process.argv[2],'utf8')); console.log(typeof out==='string'?out:JSON.stringify(out,null,1)); await b.close(); })();
