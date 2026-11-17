const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [clip,dtS,to,opts]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/ap_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__ap&&__ap.ac)));i++) await p.waitForTimeout(400);
  if(opts) await p.evaluate(v=>{ for(const [id,val] of Object.entries(JSON.parse(v))) document.getElementById(id).value=val; },opts);
  await p.evaluate(c=>{ window.requestAnimationFrame=()=>0; __ap.renderer.render=()=>0; __ap.start(c); },clip);
  for(let tt=0; tt<=+to; tt+= +dtS) console.log(await p.evaluate(tt=>{ let n=0; while(__ap.t<tt && n++<2000) __ap.frame(1/60); const c=__ap.ctx, g=c.g||{}; return [tt.toFixed(2),'x',(+c.x).toFixed(3),'y',(+(c.y||0)).toFixed(3),'v',(+(c.v||0)).toFixed(2),'st',(__ap.ac.pl||{}).stance,c.phase].join(' '); },tt));
  console.log(errs.join('\n')||'noerr'); await b.close(); })();
