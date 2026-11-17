const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await p.route(/fonts\./, r=>r.abort());
  await p.goto('file://'+process.cwd()+'/test.html'); await p.waitForTimeout(3000);
  await p.evaluate(()=>{ ED.doc=sbNormalize(PRESETS.find(x=>x.key==="open").make()); ED.doc.objects=ED.doc.objects.filter(o=>o.type!=="enemy"); edAfterLoad(true); });
  await p.click('#edPlay'); await p.waitForTimeout(300); await p.click('#helpok'); await p.waitForTimeout(300);
  console.log('CFG', await p.evaluate(()=>JSON.stringify({speed:CFG.across.speed, windup:CFG.across.lungeWindup, max:CFG.across.maxAttackers, friction:CFG.rev.aimFriction})));
  // ankle grab sequence
  await p.evaluate(()=>{ const e=spawn("across:walker",player.pos.x,player.pos.z-0.8); CFG.world.freezeAI=true; e.state="grab"; e.hitDone=true; player.grab(e,{dmg:8}); });
  await p.waitForTimeout(300); await p.screenshot({path:'q1.png'});
  const seq=await p.evaluate(()=>player.grabbed.qte.seq.map(k=>k.key));
  for(const k of seq){ await p.keyboard.press(k); await p.waitForTimeout(120); }
  await p.waitForTimeout(150); await p.screenshot({path:'q2.png'});
  console.log('SEQ', seq.join(','), await p.evaluate(()=>JSON.stringify({grabbed:!!player.grabbed, hp:player.hp, result:$("qteResult").textContent})));
  // bear hug mash
  await p.evaluate(()=>{ clearEnemies(); const e=spawn("across:matron",player.pos.x,player.pos.z-0.8); e.state="grab"; e.hitDone=true; player.grab(e,{dmg:12,how:"bear hug"}); });
  await p.waitForTimeout(200); for(let i=0;i<4;i++){ await p.keyboard.press('KeyE'); await p.waitForTimeout(60); } await p.screenshot({path:'q3.png'});
  for(let i=0;i<10;i++){ await p.keyboard.press('KeyE'); await p.waitForTimeout(60); }
  console.log('MASH', await p.evaluate(()=>JSON.stringify({grabbed:!!player.grabbed, result:$("qteResult").textContent})));
  // a too-slow hug
  await p.waitForTimeout(1200); await p.evaluate(()=>{ const e=enemies.find(e=>!e.dead); e.state="grab"; e.hitDone=true; player.grabbed=null; player.grab(e,{dmg:12,how:"bear hug"}); });
  await p.waitForTimeout(3500);
  console.log('SLOW', await p.evaluate(()=>JSON.stringify({grabbed:!!player.grabbed, hp:player.hp, result:$("qteResult").textContent})));
  // punish window
  console.log('PUNISH', await p.evaluate(()=>{ const e=enemies.find(e=>!e.dead); e.state="recover"; e.t=0; e.hp=99; const m=e.P.hbChest; const pt=new THREE.Vector3(); m.getWorldPosition(pt); e.hit(m,pt,new THREE.Vector3(0,0,-1)); return e.stagger.toFixed(2)+" "+document.getElementById("log").innerText.split("\n").pop(); }));
  await b.close(); console.log(errs.join('\n')||'no errors');
})();
