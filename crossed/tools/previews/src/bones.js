const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage();
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  for(const [pg,ex] of [['ap','[__ap.ac,__ap.nora]'],['rp','[__rp.runner]']]){ await p.goto(`http://127.0.0.1:8765/${pg}_test.html`); await p.waitForTimeout(6000);
    console.log(pg, await p.evaluate(ex=>eval(ex).map(C=>{ const r=[]; C.group.traverse(m=>{ if(m.isSkinnedMesh) r.push(m.skeleton.bones.map(b=>b.name+'<'+(b.parent&&b.parent.name)).join(' ')); }); return r.join('|'); }).join('\n'),ex)); }
  await b.close(); })();
