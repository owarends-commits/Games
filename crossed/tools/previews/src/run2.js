const { chromium } = require('playwright');
const fs=require('fs');
(async()=>{
  const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
  const p=await b.newPage({viewport:{width:1400,height:860}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n'))); p.on('console',m=>{ if(m.type()==='error') errs.push(m.type()+' '+m.text()); });
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'}));
  await p.route(/fonts\.(googleapis|gstatic)/, r=>r.abort());
  await p.goto('file://'+process.cwd()+'/test.html'); await p.waitForTimeout(3500);
  // play the clinic
  await p.click('#edPlay'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(800);
  let st=await p.evaluate(()=>({mode:MODE, enemies:enemies.length, pos:[player.pos.x,player.pos.z], inv:player.inv.map(entryLabel), flash:player.flash, rounds:player.rounds, spare:player.spare}));
  console.log('PLAY', JSON.stringify(st));
  await p.screenshot({path:'p1.png'});
  // walk to the office cabinet and search it (teleport next to it, facing it)
  const r=await p.evaluate(()=>{ const c=world.containers.find(c=>c.name==="cabinet"); player.pos.set(c.box.x+0.75,0,c.box.z); player.yaw=-Math.PI/2; const f=findInteract(); return {name:c.name, f:f&&f.text}; });
  console.log('NEAR', JSON.stringify(r));
  await p.keyboard.press('KeyE'); await p.waitForTimeout(2200);
  st=await p.evaluate(()=>({inv:player.inv.map(entryLabel), search:!!player.search, log:document.getElementById('log').innerText.split('\n').slice(-3)}));
  console.log('AFTER SEARCH', JSON.stringify(st));
  await p.keyboard.press('KeyI'); await p.waitForTimeout(300); await p.screenshot({path:'p2.png'}); await p.keyboard.press('KeyI');
  // locked exit door
  const d=await p.evaluate(()=>{ const d=world.doors.find(d=>d.locked); const s=doorSeg(d); player.pos.set((s.ax+s.bx)/2,0,(s.az+s.bz)/2+0.8); player.yaw=Math.PI; const f=findInteract(); return {f:f&&f.text}; });
  console.log('DOOR', JSON.stringify(d));
  await p.keyboard.press('KeyE'); await p.waitForTimeout(800);
  console.log('DOOR AFTER', await p.evaluate(()=>{ const d=world.doors.find(d=>d.key==="Clinic key"); return JSON.stringify({locked:d.locked,target:d.target}); }));
  await p.evaluate(()=>{ player.pos.set(0,0,-12.75); }); await p.waitForTimeout(500);
  console.log('RUN', await p.evaluate(()=>JSON.stringify({over:run.over,result:run.result})));
  // back to build, open hillside
  await p.keyboard.press('KeyB'); await p.waitForTimeout(500);
  await p.evaluate(()=>{ ED.doc=sbNormalize(PRESETS.find(x=>x.key==="hillside").make()); edAfterLoad(true); }); await p.waitForTimeout(1500);
  await p.screenshot({path:'h1.png'});
  await p.click('#vPlan'); await p.waitForTimeout(400); await p.screenshot({path:'h2.png'});
  await p.click('#edPlay'); await p.waitForTimeout(1200);
  st=await p.evaluate(()=>({mode:MODE, enemies:enemies.length, gy:groundY(player.pos.x,player.pos.z), py:player.root.position.y, lights:world.lightPts.length, capped:world.lightCapped}));
  console.log('HILL PLAY', JSON.stringify(st));
  await p.screenshot({path:'h3.png'});
  console.log(errs.slice(0,20).join('\n'));
  await b.close();
})();
