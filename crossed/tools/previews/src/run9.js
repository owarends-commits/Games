const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1400,height:860}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await p.route(/fonts\./, r=>r.abort());
  await p.goto('file://'+process.cwd()+'/test.html'); await p.waitForTimeout(3000);
  await p.evaluate(()=>{ ED.doc=sbNormalize(PRESETS[0].make()); edAfterLoad(true); }); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ Object.assign(ED.orbit,{tx:2,tz:-3,dist:15,yaw:-2.3,pitch:1.0}); }); await p.waitForTimeout(400); await p.screenshot({path:'g1.png'});
  await p.click('#vPlan'); await p.evaluate(()=>{ ED.pan={x:-2,z:-4}; ED.zoom=34; ED.planDirty=true; }); await p.waitForTimeout(300); await p.screenshot({path:'g2.png'});
  await p.click('#edPlay'); await p.waitForTimeout(300); await p.click('#helpok');
  console.log(await p.evaluate(()=>JSON.stringify({boxes:world.boxes.length,circles:world.circles.length,lights:world.lightPts.length,capped:world.lightCapped,cont:world.containers.map(c=>c.name)})));
  await p.waitForTimeout(800); await p.screenshot({path:'g3.png'});
  // Norah hides in the bedroom; Louis outside the bedroom window
  await p.evaluate(()=>{ CFG.norah.god=true; player.pos.set(6.4,0,-1.0); const e=enemies[0]; e.pos.set(10.5,0,-1.2); e.hunt={x:6.4,z:-1.0,t:gameTime,src:"test"}; });
  for(let i=0;i<4;i++){ await p.waitForTimeout(4000); console.log(i, await p.evaluate(()=>{ const e=enemies[0]; return `${e.state} at ${e.pos.x.toFixed(1)},${e.pos.z.toFixed(1)} hunt ${e.hunt&&e.hunt.src} dist ${Math.hypot(e.pos.x-player.pos.x,e.pos.z-player.pos.z).toFixed(1)} | `+document.getElementById('log').innerText.split('\n').slice(-2).join(' / '); })); }
  await b.close(); console.log(errs.join('\n')||'no errors');
})();
