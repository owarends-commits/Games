const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await p.route(/fonts\./, r=>r.abort());
  await p.goto('file://'+process.cwd()+'/test.html'); await p.waitForTimeout(3000);
  await p.evaluate(()=>{ ED.doc=sbNormalize(PRESETS[0].make()); edAfterLoad(true); }); await p.waitForTimeout(1200);
  await p.click('#edPlay'); await p.waitForTimeout(300); await p.click('#helpok');
  // Norah hides in the bedroom with the door shut; Louis starts in the woods
  await p.evaluate(()=>{ player.pos.set(6.8,0,3.9); CFG.norah.god=true; for(const d of world.doors) if(Math.hypot(d.hx-6.1,d.hz-3.38)<1){ d.target=0; d.ang=0; } makeNoise(6.8,3.9,30,"test",true); });
  for(let i=0;i<6;i++){ await p.waitForTimeout(5000); console.log(i, await p.evaluate(()=>{ const e=enemies[0]; return `${e.state} at ${e.pos.x.toFixed(1)},${e.pos.z.toFixed(1)} hunt ${e.hunt&&e.hunt.src} dist ${Math.hypot(e.pos.x-player.pos.x,e.pos.z-player.pos.z).toFixed(1)}`; }), await p.evaluate(()=>document.getElementById('log').innerText.split('\n').slice(-2).join(' / '))); }
  await p.screenshot({path:'c6.png'});
  await b.close(); console.log(errs.join('\n')||'no errors');
})();
