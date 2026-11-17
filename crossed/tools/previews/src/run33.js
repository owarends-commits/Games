// dense frame strip: node run33.js clip from to step cam opts out
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [clip,from,to,stepS,camM,opts,out]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  await p.goto('http://127.0.0.1:8765/ap_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__ap&&__ap.ac)));i++) await p.waitForTimeout(400);
  await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; });
  if(opts) await p.evaluate(v=>{ for(const [id,val] of Object.entries(JSON.parse(v))) document.getElementById(id).value=val; },opts);
  await p.evaluate(c=>__ap.start(c),clip); await p.evaluate(m=>document.querySelector(`[data-cam=${m}]`).click(),camM||'side');
  const shots=[]; for(let tt=+from; tt<=+to; tt+= +stepS){ const ph=await p.evaluate(tt=>{ while(__ap.t<tt) __ap.frame(1/60); return __ap.ctx.phase; },tt);
    const f=`fr_${shots.length}.png`; await p.screenshot({path:f,clip:{x:16,y:62,width:640,height:560}}); shots.push([f,tt.toFixed(2)+' '+ph]); }
  fs.writeFileSync('fr_list.json',JSON.stringify(shots)); console.log(errs.length?errs.join('\n'):'ok '+shots.length); await b.close(); })();
