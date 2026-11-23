const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:700,height:440}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ CFG.norah.god=true; CFG.world.freezeAI=true; clearEnemies(); const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); window.__e=spawn("across_legless",player.pos.x+fx*3,player.pos.z+fz*3,{}); spawn("across:walker",player.pos.x+fx*3+fz*1.2,player.pos.z+fz*3-fx*1.2,{});
    updateCamera=()=>{ const e=__e; camera.position.set(e.pos.x+2.6,1.6,e.pos.z+0.4); camera.lookAt(e.pos.x,0.2,e.pos.z); }; });
  await p.waitForTimeout(6000); await p.evaluate(()=>{ for(const el of document.querySelectorAll("body *")){ const ps=getComputedStyle(el).position; if((ps==="fixed"||ps==="absolute")&&!el.contains(renderer.domElement)) el.style.visibility="hidden"; } });
  await p.screenshot({path:'../shots/legless_floor.png'}); await b.close(); })();
