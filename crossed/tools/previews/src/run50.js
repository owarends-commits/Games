const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [clip,dtS,from,to,opts,model]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/bp_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__bp&&__bp.BR)));i++) await p.waitForTimeout(400);
  if(model){ await p.evaluate(m=>{ const s=document.getElementById('oModel'); s.value=m; s.dispatchEvent(new Event('change')); },model); await p.waitForTimeout(300); for(let i=0;i<40&&!(await p.evaluate(()=>document.getElementById('load').hidden));i++) await p.waitForTimeout(400); }
  if(opts) await p.evaluate(v=>{ for(const [id,val] of Object.entries(JSON.parse(v))) document.getElementById(id).value=val; },opts);
  await p.evaluate(c=>{ window.requestAnimationFrame=()=>0; __bp.renderer.render=()=>0; __bp.start(c); },clip);
  for(let tt=+from; tt<=+to; tt+= +dtS) console.log(await p.evaluate(tt=>{ let n=0; while(__bp.t<tt && n++<3000) __bp.frame(1/60); const g=window.BS_GAP||null; return tt.toFixed(2)+' '+__bp.ctx.phase+' gapL '+(__bp.gap('L'))+' gapR '+(__bp.gap('R')); },tt));
  console.log(errs.join('\n')||'noerr'); await b.close(); })();
