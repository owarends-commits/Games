const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  const meas=async(lbl)=>{ const r=await p.evaluate(()=>new Promise(res=>{ const t0=performance.now(); let n=0, sum=0; const s0=window.step; window.step=function(...a){ const q=performance.now(); const o=s0.apply(this,a); sum+=performance.now()-q; n++; return o; }; setTimeout(()=>{ window.step=s0; res({fps:(n/((performance.now()-t0)/1000)).toFixed(1), stepMs:(sum/Math.max(1,n)).toFixed(1)}); },5000); })); console.log(lbl, JSON.stringify(r)); };
  await p.evaluate(()=>{ CFG.norah.god=true; clearEnemies(); }); await meas("none");
  for(const k of ["hob"]){ await p.evaluate(k=>{ clearEnemies(); spawn(k,player.pos.x+Math.sin(player.yaw)*8,player.pos.z+Math.cos(player.yaw)*8,{}); },k); await p.waitForTimeout(3000); await meas(k); }
  await b.close(); })();
