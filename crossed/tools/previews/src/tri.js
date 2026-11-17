const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage();
 for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
 await p.route(/fonts\./, r=>r.abort());
 for(const [pg,G,ex] of [['bp','__bp','[__bp.BR.mesh,__bp.nora.group]'],['ap','__ap','[__ap.ac.group]'],['rp','__rp','[__rp.runner.group]']]){ await p.goto(`http://127.0.0.1:8765/${pg}_test.html`); await p.waitForTimeout(6000);
  console.log(pg, await p.evaluate(ex=>eval(ex).map(o=>{ const r=[]; o.traverse(m=>{ if(m.isSkinnedMesh) r.push([m.name, m.geometry.attributes.position.count, m.geometry.index?m.geometry.index.count/3:0, m.skeleton.bones.length]); }); return JSON.stringify(r); }),ex)); }
 await b.close(); })();
