const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:680}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  for(const [dx,dy,want] of [[0,-100,"revolver (up)"],[100,-35,"shotgun? (up-right)"],[100,60,"flaregun-ish (right-down)"],[-20,100,"flare/knife (down)"],[-100,-40,"crowbar (up-left)"]]){
    const r=await p.evaluate(([dx,dy])=>{ wheelOpen(); wheelMouse({movementX:dx,movementY:dy}); const s=WHEEL[wheelSel()]; return s; },[dx,dy]); console.log(dx,dy,"->",r,"   expected:",want);
    if(dx===100&&dy===-35) await p.screenshot({path:'/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/wheel.png'}); await p.evaluate(()=>wheelClose()); }
  await b.close(); })();
