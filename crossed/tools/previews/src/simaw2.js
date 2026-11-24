const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmSimsBtn'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ SIMR.room="office"; SIMR.kind="contortionist"; SIMR.count=1; SIMR.start="wander"; renderSims(); window.__spawnArgs=[]; window.__N=[]; const mn=makeNoise; makeNoise=function(...a){ __N.push(a.slice(0,4).map(v=>typeof v==="number"?+v.toFixed(2):v).join(",")+" @"+(new Error().stack.split("\n")[2]||"").trim().slice(0,60)); return mn.apply(this,a); }; const pa=pvAlert; pvAlert=function(e,w){ __N.push("ALERT "+w); return pa(e,w); }; const s0=spawn; spawn=function(...a){ __spawnArgs.push(JSON.stringify(a.slice(0,1).concat([a[3]]))); return s0.apply(this,a); }; });
  await p.click('#mmSims .go'); await p.waitForTimeout(3000);
  console.log(await p.evaluate(()=>JSON.stringify({args:__spawnArgs, noise:__N.slice(0,8), e:enemies.map(e=>({kind:e.kind,pvType:e.pvType,aware:e.aware,un:e.pvUnaware})), wrapped:PVK.contortionist._unaware, brainSrc:String(PVK.contortionist.brain).slice(0,80)})));
  await b.close(); })();
