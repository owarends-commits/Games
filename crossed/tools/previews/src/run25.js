const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1100,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | '))); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text()); });
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'}));
  await p.route(/GLTFLoader\.js/, r=>r.fulfill({body:fs.readFileSync('GLTFLoader.js'),contentType:'application/javascript'}));
  await p.route(/SkeletonUtils\.js/, r=>r.fulfill({body:fs.readFileSync('SkeletonUtils.js'),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  
  await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ const d=sbNormalize(PRESETS.find(x=>x.key==="ch1house").make()); ED.doc=d; edAfterLoad(false); });
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok');
  for(let i=0;i<40&&!(await p.evaluate(()=>!!(player.skin&&player.skin.model)));i++) await p.waitForTimeout(400);
  await p.waitForTimeout(1500); console.log('res', await p.evaluate(()=>CFG.world.res+' '+renderer.domElement.width)); await p.screenshot({path:'res480.png'});
  await p.evaluate(()=>{ CFG.world.res=320; resize(); }); await p.waitForTimeout(500); await p.screenshot({path:'res320.png'});
  console.log(errs.length?errs.filter(x=>!x.includes('ERR_FAILED')).slice(0,8).join('\n')||'no errors':'no errors'); await b.close(); })();
