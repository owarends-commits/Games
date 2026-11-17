const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [clip,tt]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage();
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/cn_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  console.log(await p.evaluate(([c,tt])=>{ window.requestAnimationFrame=()=>0; __rp.renderer.render=()=>0; __rp.start(c); while(__rp.t<tt) __rp.frame(1/60); const R=__rp.runner.R, G=__rp.ctx.G, o=[];
    for(const L of LIMBS){ const st=G.limb[L.k], end=limbEnd(L), root=limbRoot(L);
      const tg=st.anchor||st.tgt; o.push(`${L.k} end=${end.toArray().map(v=>v.toFixed(2))} tgt=${tg?tg.toArray().map(v=>v.toFixed(2)):'-'} err=${tg?end.distanceTo(tg).toFixed(3):'-'} rootToTgt=${tg?root.distanceTo(tg).toFixed(2):'-'} len=${limbLen(L).toFixed(2)}`); }
    return o.join('\n'); },[clip,+tt])); await b.close(); })();
