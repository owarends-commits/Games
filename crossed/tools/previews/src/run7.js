const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1400,height:860}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' ')));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await p.route(/fonts\./, r=>r.abort());
  await p.goto('file://'+process.cwd()+'/test.html'); await p.waitForTimeout(3000);
  await p.evaluate(()=>{ ED.doc=sbNormalize(PRESETS[0].make()); edAfterLoad(true); }); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ Object.assign(ED.orbit,{tx:3,tz:4,dist:16,yaw:-0.9,pitch:0.95}); }); await p.waitForTimeout(400); await p.screenshot({path:'c1.png'});
  await p.click('#vPlan'); await p.evaluate(()=>{ ED.pan={x:3,z:8}; ED.zoom=26; ED.planDirty=true; }); await p.waitForTimeout(300); await p.screenshot({path:'c2.png'});
  await p.click('#edPlay'); await p.waitForTimeout(300); await p.click('#helpok'); await p.waitForTimeout(500);
  const L=()=>p.evaluate(()=>{ const e=enemies.find(e=>e.kind==="brute"); return {st:e.state,pos:[+e.pos.x.toFixed(1),+e.pos.z.toFixed(1)],hunt:e.hunt&&e.hunt.src,hp:e.hp,np:[+player.pos.x.toFixed(1),+player.pos.z.toFixed(1)],nhp:player.hp,down:+(player.downT||0).toFixed(2)}; });
  console.log('START', JSON.stringify(await L()), await p.evaluate(()=>JSON.stringify({weak:world.weakWalls.length,boxes:world.boxes.length,cont:world.containers.length,lights:world.lightPts.length,capped:world.lightCapped})));
  // put Norah inside the bathroom; Louis in the bedroom: should go through the weak divider wall (or door)
  await p.evaluate(()=>{ const e=enemies.find(e=>e.kind==="brute"); e.pos.set(7.0,0,4.1); player.pos.set(4.6,0,4.8); e.hunt={x:4.6,z:4.8,t:gameTime,src:"test"}; });
  await p.waitForTimeout(9000); console.log('WALL', JSON.stringify(await L()), await p.evaluate(()=>JSON.stringify(world.weakWalls.map(w=>[w.hp,w.broken]))), await p.evaluate(()=>document.getElementById('log').innerText.split('\n').slice(-4).join(' / ')));
  // slam
  await p.evaluate(()=>{ const e=enemies.find(e=>e.kind==="brute"); e.pos.set(-8,0,12); player.pos.set(-8,0,13.3); e.yaw=0; e.state="slamWind"; e.t=0; e.hitDone=false; player.hp=100; });
  await p.waitForTimeout(450); await p.screenshot({path:'c3.png'}); await p.waitForTimeout(1500); console.log('SLAM', JSON.stringify(await L()));
  // grab then fail -> throw
  await p.evaluate(()=>{ const e=enemies.find(e=>e.kind==="brute"); player.hp=100; player.downT=0; player.stumble=0; e.pos.set(-8,0,12); player.pos.set(-8,0,13.2); e.yaw=0; e.state="grabWind"; e.t=0; e.lc.grab=0; });
  await p.waitForTimeout(1500); console.log('GRAB', JSON.stringify(await L()), await p.evaluate(()=>!!player.grabbed&&player.grabbed.qte.seq.length));
  await p.screenshot({path:'c4.png'});
  await p.evaluate(()=>{ if(player.grabbed) qteFail(player.grabbed,"too slow"); }); await p.waitForTimeout(1200); console.log('THROWN', JSON.stringify(await L()), await p.evaluate(()=>document.getElementById('log').innerText.split('\n').slice(-3).join(' / ')));
  // furniture throw: Norah far in the open, Louis by the trashcans
  await p.evaluate(()=>{ const e=enemies.find(e=>e.kind==="brute"); player.hp=100; player.downT=0; player.stumble=0; player.thrown=null; e.state="chase"; e.stagger=0; e.pos.set(-1.5,0,8.5); player.pos.set(-10,0,9.5); e.lc.throw=0; e.cool=0; });
  await p.waitForTimeout(6000); console.log('FURN', JSON.stringify(await L()), await p.evaluate(()=>JSON.stringify({flying:world.flying.length, log:document.getElementById('log').innerText.split('\n').slice(-4).join(' / ')})));
  await p.screenshot({path:'c5.png'});
  await b.close(); console.log(errs.join('\n')||'no errors');
})();
