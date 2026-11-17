const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage();
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/oa_test.html');
  for(let i=0;i<60&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  for(const m of ['brute_onearm_f01','louis_brute']){
    await p.evaluate(m=>{ const s=document.getElementById('oModel'); s.value=m; s.dispatchEvent(new Event('change')); },m); await p.waitForTimeout(800);
    for(let i=0;i<40&&!(await p.evaluate(()=>document.getElementById('load').hidden));i++) await p.waitForTimeout(400); await p.waitForTimeout(500);
    console.log(m, await p.evaluate(()=>{ const R=__rp.runner; const cnt={}; let mesh; R.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; });
      const bones=mesh.skeleton.bones, sw=mesh.geometry.attributes.skinWeight, si=mesh.geometry.attributes.skinIndex;
      for(let i=0;i<sw.count;i++){ const n=bones[si.getX(i)].name; if(sw.getX(i)>0.5) cnt[n]=(cnt[n]||0)+1; }
      const k=Object.keys(cnt).filter(n=>/arm|hand|fore|clav|shoulder/i.test(n)); return JSON.stringify(k.map(n=>n+':'+cnt[n])); }));
  } await b.close(); })();
