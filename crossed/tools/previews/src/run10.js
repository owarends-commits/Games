const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await p.route(/fonts\./, r=>r.abort());
  await p.route(/GLTFLoader\.js/, r=>r.fulfill({body:fs.readFileSync('GLTFLoader.js'),contentType:'application/javascript'})); await p.route(/SkeletonUtils\.js/, r=>r.fulfill({body:fs.readFileSync('SkeletonUtils.js'),contentType:'application/javascript'}));
  await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(3000);
  await p.evaluate(()=>{ ED.doc=sbNormalize(PRESETS[0].make()); edAfterLoad(true); }); await p.waitForTimeout(1200);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok');
  const st=()=>p.evaluate(()=>{ const e=enemies[0]; return `${e.state} ${e.pos.x.toFixed(1)},${e.pos.z.toFixed(1)} stag ${e.stagger.toFixed(1)} | N ${player.pos.x.toFixed(1)},${player.pos.z.toFixed(1)} hp ${player.hp} down ${(player.downT||0).toFixed(1)} | walls ${world.weakWalls.map(w=>w.broken?"X":"o").join("")} | `+document.getElementById('log').innerText.split('\n').slice(-3).join(' / '); });
  // 1) Louis in the kitchen, Norah in the living room behind the solid-looking living|kitchen wall: he should charge through it
  await p.evaluate(()=>{ const e=enemies[0]; e.pos.set(6.5,0,-4.0); player.pos.set(1.8,0,-4.0); e.hunt={x:1.8,z:-4.0,t:gameTime,src:"test"}; e.lc.charge=0; e.cool=0; makeNoise(1.8,-4,10,"test",true); });
  for(let i=0;i<8;i++){ await p.waitForTimeout(700); console.log('A',i, await st()); }
  // 2) charge into a solid outside wall: Norah dodges out of the lane
  await p.evaluate(()=>{ const e=enemies[0]; e.state="chargeWind"; e.t=0; e.stagger=0; e.pos.set(3,0,-8.5); e.chargeDir=new THREE.Vector3(0,0,1); player.pos.set(3,0,-5.8); player.hp=100; player.downT=0; player.stumble=0; });
  await p.waitForTimeout(1500); console.log('B', await st());
  await b.close(); console.log(errs.join('\n')||'no errors');
})();
