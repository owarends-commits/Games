const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [clip,t0,t1]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage();
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/cn_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  console.log(await p.evaluate(([c,t0,t1])=>{ window.requestAnimationFrame=()=>0; __rp.renderer.render=()=>0; __rp.start(c); const o=[]; let k=0;
    while(__rp.t<t1){ __rp.frame(1/60); if(__rp.t<t0||(k++%8)) continue; const G=__rp.ctx.G, gs=__rp.runner.gs||{}; const wall=__rp.ctx.held; const n=wall?new THREE.Vector3(-1,0,0):new THREE.Vector3(0,1,0), lvl=wall?-WX:0;
      o.push(__rp.t.toFixed(2)+' e='+((gs.e||0).toFixed(3))+' air='+!!gs.air+' '+LIMBS.map(L=>{ const st=G&&G.limb[L.k]; return L.k+(st&&st.anchor?'*':' ')+limbContact(L,n,lvl).toFixed(3); }).join(' ')); }
    return o.join('\n'); },[clip,+t0,+t1])); await b.close(); })();
