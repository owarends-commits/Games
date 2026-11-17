const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const out=process.argv[2]||'hc'; const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:700,height:600}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/tac_test.html');
  for(let i=0;i<60&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400); await p.waitForTimeout(600);
  await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; __rp.start("walk"); __rp.frame(1/60); __rp.norah&&(__rp.norah.c.group.visible=false); });
  const shots=[]; for(const a of [0,90,180,270]){ await p.evaluate(a=>{ const R=__rp.runner; R.group.updateMatrixWorld(true); const c=R.B.head.localToWorld(R.headC.clone()); const r=1.5, th=a*Math.PI/180;
      __rp.cam.position.set(c.x+r*Math.sin(th),c.y+0.25,c.z+r*Math.cos(th)); __rp.cam.lookAt(c); __rp.cam.updateMatrixWorld(); window.__cf=1; __rp.renderer.render(__rp.scene,__rp.cam); },a);
    const f=`${out}_${a}.png`; await p.screenshot({path:f,clip:{x:16,y:62,width:640,height:500}}); shots.push([f,`${a}°`]); }
  fs.writeFileSync('fr_list.json',JSON.stringify(shots)); await b.close(); })();
