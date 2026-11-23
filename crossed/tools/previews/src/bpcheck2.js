const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/brute-preview.html'); await p.waitForTimeout(6000);
  await p.evaluate(async()=>{ document.getElementById("oModel").value="brute_twoarm_m02_legless"; document.getElementById("oModel").onchange({target:{value:"brute_twoarm_m02_legless"}}); }); await p.waitForTimeout(4000); await p.evaluate(()=>__bp.start("crawl"));
  for(let i=0;i<16;i++){ await p.waitForTimeout(500); console.log(await p.evaluate(()=>{ const c=__bp.ctx, m=__bp.BR.mesh; return `t=${__bp.t.toFixed(1)} uid=${__bp.BR.uid} mesh=${m.position.x.toFixed(2)},${m.position.z.toFixed(2)} fL=${c.fL.x.toFixed(2)},${c.fL.z.toFixed(2)} fR=${c.fR.x.toFixed(2)},${c.fR.z.toFixed(2)}`; })); }
  console.log(errs.join('\n')||'no errors'); await b.close(); })();
