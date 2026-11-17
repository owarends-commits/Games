const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [clip,ts,bone,out,side]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:700}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto(`http://127.0.0.1:8765/rp_test.html`);
  for(let i=0;i<60&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400); await p.waitForTimeout(800);
  await p.evaluate(c=>{ window.requestAnimationFrame=()=>0; __rp.start(c); },clip); let k=0;
  for(const tt of ts.split(',').map(Number)){ await p.evaluate(([tt,bone,side])=>{ let n=0; while(__rp.t<tt&&n++<3000) __rp.frame(1/60); const q=new THREE.Vector3(); __rp.runner.B[bone].getWorldPosition(q); const c=__rp.cam; c.position.set(q.x+(+side||1.2),q.y+0.35,q.z+1.3); c.lookAt(q); c.fov=40; c.updateProjectionMatrix(); __rp.renderer.render(__rp.scene,c); },[tt,bone,side]);
    const el=await p.$('canvas'); await el.screenshot({path:`${out}_${k++}.png`}); }
  await b.close(); })();
