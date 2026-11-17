const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [pg,clip,tt,who]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage();
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto(`http://127.0.0.1:8765/${pg}_test.html`); const G={ap:'__ap',rp:'__rp',bp:'__bp'}[pg];
  for(let i=0;i<60&&!(await p.evaluate(G=>{ const X=window[G]; return !!(X&&(X.ac||X.runner||X.BR)); },G));i++) await p.waitForTimeout(400); await p.waitForTimeout(1500);
  console.log(await p.evaluate(([G,clip,tt,who])=>{ const X=window[G]; window.requestAnimationFrame=()=>0; X.renderer.render=()=>0; X.start(clip); let n=0; while(X.t<tt&&n++<3000) X.frame(1/60);
    const C= who==='n'? X.nora : X.ac; const g=C.group; const sv=g.position.y; const S=C.gs; // measure the authored pose: undo the guard lift
    const ms=[]; g.traverse(q=>{ if(q.isSkinnedMesh) ms.push(q); }); const B=PHYS.body(ms); g.position.y-= (S?S.e:0); g.updateMatrixWorld(true); const m=B.measure(); const by={}; m.pts.forEach((p,k)=>{ const nm=m.bone[k].name; by[nm]=Math.min(by[nm]??9,p.y); }); g.position.y=sv;
    return Object.entries(by).sort((a,b)=>a[1]-b[1]).slice(0,8).map(([k,v])=>k+':'+v.toFixed(2)).join(' ')+' | '+X.ctx.phase; },[G,clip,+tt,who])); await b.close(); })();
