// node wheelt.js : T opens the wheel; pick by mouse direction, by number and by T; Esc closes
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:680}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  const st=()=>p.evaluate(()=>({open:WS.wheel,wpn:WS.wpn,owned:WS.owned.length,sel:WS.wsel,enemies:enemies.length}));
  await p.keyboard.press('KeyT'); await p.waitForTimeout(300); console.log('T', JSON.stringify(await st()));
  await p.mouse.move(500+120,340-40,{steps:5}); await p.waitForTimeout(200); console.log('after move', await p.evaluate(()=>JSON.stringify({wpt:WS.wpt,sel:wheelSel(),lock:!!document.pointerLockElement,rect:WHL.getBoundingClientRect()}))); await p.screenshot({path:'/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/wheel.png'});
  await p.mouse.down(); await p.mouse.up(); await p.waitForTimeout(200); console.log('click (up-right)', JSON.stringify(await st()));
  await p.keyboard.press('KeyT'); await p.waitForTimeout(200); await p.keyboard.press('Digit3'); await p.waitForTimeout(200); console.log('T then 3', JSON.stringify(await st()));
  await p.keyboard.press('KeyT'); await p.waitForTimeout(200); await p.keyboard.press('Digit8'); await p.waitForTimeout(200); console.log('T then 8', JSON.stringify(await st()));
  await p.keyboard.press('KeyT'); await p.waitForTimeout(200); await p.keyboard.press('Escape'); await p.waitForTimeout(200); console.log('T then Esc', JSON.stringify(await st()), await p.evaluate(()=>SB.simMenu));
  await p.keyboard.press('KeyT'); await p.waitForTimeout(200); await p.keyboard.press('KeyT'); await p.waitForTimeout(200); console.log('T then T', JSON.stringify(await st()));
  console.log(errs.join('\n')||'no errors'); await b.close(); })();
