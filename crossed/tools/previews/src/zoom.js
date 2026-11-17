const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [model,clip,ts,bone,out]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:700}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto(`http://127.0.0.1:8765/bp_test.html`);
  for(let i=0;i<60&&!(await p.evaluate(()=>!!(window.__bp&&__bp.BR&&__bp.nora)));i++) await p.waitForTimeout(400);
  await p.evaluate(m=>{ const s=document.getElementById('oModel'); s.value=m; s.dispatchEvent(new Event('change')); },model); await p.waitForTimeout(500); for(let i=0;i<40&&!(await p.evaluate(()=>document.getElementById('load').hidden));i++) await p.waitForTimeout(400);
  await p.evaluate(c=>{ window.requestAnimationFrame=()=>0; __bp.start(c); },clip); let k=0;
  for(const tt of ts.split(',').map(Number)){ await p.evaluate(([tt,bone])=>{ let n=0; while(__bp.t<tt&&n++<3000) __bp.frame(1/60); const R=__bp.BR, q=new THREE.Vector3(); R.B[bone].getWorldPosition(q); const c=__bp.cam; c.position.set(q.x+1.4,q.y+0.5,q.z+(q.z<0?-1.3:1.3)); c.lookAt(q); c.fov=40; c.updateProjectionMatrix(); __bp.renderer.render(__bp.scene,c); },[tt,bone]);
    const el=await p.$('canvas'); await el.screenshot({path:`${out}_${k++}.png`}); }
  await b.close(); })();
