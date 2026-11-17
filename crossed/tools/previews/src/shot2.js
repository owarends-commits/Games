const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [model,clip,tt,out]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:620}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/bp_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__bp&&__bp.BR)));i++) await p.waitForTimeout(400);
  await p.evaluate(m=>{ const s=document.getElementById('oModel'); s.value=m; s.dispatchEvent(new Event('change')); },model); await p.waitForTimeout(500); for(let i=0;i<40&&!(await p.evaluate(()=>document.getElementById('load').hidden));i++) await p.waitForTimeout(400);
  await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; });
  await p.evaluate(c=>__bp.start(c),clip); const imgs=[];
  for(const cm of ['side','front','three']){ await p.evaluate(m=>document.querySelector(`[data-cam=${m}]`).click(),cm); await p.evaluate(([tt])=>{ __bp.start("sweep"); let n=0; while(__bp.t<tt&&n++<2000) __bp.frame(1/60); },[+tt]); await p.screenshot({path:`${out}_${cm}.png`,clip:{x:0,y:0,width:900,height:470}}); }
  const info=await p.evaluate(()=>{ const R=__bp.BR; return JSON.stringify({armCols:R.arms.map(a=>a.c.col?a.c.col.map(v=>Math.round(v)).join("/")+"@"+a.c.vs.length+"e"+a.c.ext.toFixed(2):"-").join(" "),armorCols:R.armor.slice(0,8).map(a=>a.ext.toFixed(2)).join(","),armor:R.armor.length,armorHosts:R.armor.map(a=>a.host).join(","),hasLegs:R.hasLegs,hasHead:R.hasHead,arms:R.arms.length,lumps:R.lumps.length,shoulderY:R.shoulderY.toFixed(2),comH:R.comH&&R.comH.toFixed(2),bones:Object.keys(R.B).filter(k=>!/lump|arm\d|organ/.test(k))}); });
  console.log(info, errs.join('\n')||'noerr'); await b.close(); })();
