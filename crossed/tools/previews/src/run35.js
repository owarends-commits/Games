const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:700}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  await p.goto('http://127.0.0.1:8765/ap_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__ap&&__ap.ac)));i++) await p.waitForTimeout(400);
  await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; document.getElementById('oDrag').value='a'; __ap.start('drag'); });
  const shots=[]; for(const [tt,v] of [[2.6,'s'],[3.1,'s'],[3.6,'s'],[4.1,'s'],[4.7,'s'],[5.1,'t'],[5.75,'s'],[5.75,'t']]){
    await p.evaluate(([tt,v])=>{ while(__ap.t<tt) __ap.frame(1/60); const c=__ap.cam, n=new THREE.Vector3(); __ap.nora.B.hips.getWorldPosition(n);
      if(v==='s'){ c.position.set(n.x+0.2,1.0,2.4); c.lookAt(n.x+0.2,0.3,0); } else { c.position.set(n.x+1.2,1.7,1.1); c.lookAt(n.x+1.1,0.2,0); } __ap.renderer.render(__ap.scene,c); },[tt,v]);
    const f=`dc_${shots.length}.png`; await p.screenshot({path:f,clip:{x:16,y:62,width:860,height:600}}); shots.push([f,`${tt} ${await p.evaluate(()=>__ap.ctx.phase)}`]); }
  fs.writeFileSync('fr_list.json',JSON.stringify(shots)); await b.close(); })();
