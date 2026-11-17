const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1280,height:800}});
  p.on('pageerror',e=>console.log('PAGEERR '+e.message));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await p.route(/fonts\./, r=>r.abort());
  await p.goto('file://'+process.cwd()+'/test.html'); await p.waitForTimeout(3000);
  await p.click('#edPlay'); await p.waitForTimeout(300); await p.click('#helpok');
  console.log(await p.evaluate(async()=>{ clearEnemies(); CFG.world.freezeAI=true; const e=spawn("across:matron",player.pos.x,player.pos.z-0.8); e.state="grab"; e.hitDone=true; player.grab(e,{dmg:12,how:"bear hug"});
    const out=[]; for(let i=0;i<12&&player.grabbed;i++){ dispatchEvent(new KeyboardEvent("keydown",{code:"KeyE"})); dispatchEvent(new KeyboardEvent("keyup",{code:"KeyE"})); out.push(player.grabbed?player.grabbed.qte.fill.toFixed(2):"free"); await new Promise(r=>setTimeout(r,90)); }
    return out.join(" ")+" | "+$("qteResult").textContent+" | frame ms "+(()=>{return 0})(); }));
  await b.close(); })();
