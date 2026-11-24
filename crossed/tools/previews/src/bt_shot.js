const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:560}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmSimsBtn'); await p.waitForTimeout(300); await p.evaluate(()=>{ SIMR.room="forest"; SIMR.kind="dummy"; SIMR.count=1; SIMR.start="stand"; renderSims(); }); await p.click('#mmSims .go'); await p.waitForTimeout(2500); if(await p.isVisible('#helpok')) await p.click('#helpok');
  await p.evaluate(()=>{ CFG.norah.god=true; clearEnemies(); player.pos.set(0,0,5.5);
    window.__a=spawnBcross("brute_twoarm_m01",-1.8,-3,{}); window.__b=spawn("brute2_blender",1.8,-3,{});
    window.__cam={p:new THREE.Vector3(0,1.9,3.2),t:new THREE.Vector3(0,1.3,-2)}; updateCamera=()=>{ camera.position.copy(__cam.p); camera.lookAt(__cam.t); }; });
  await p.waitForFunction(()=>__a.pv.ready&&__b.pv.ready,null,{timeout:60000});
  const hide=()=>p.evaluate(()=>{ for(const el of document.querySelectorAll("body *")){ const ps=getComputedStyle(el).position; if((ps==="fixed"||ps==="absolute")&&!el.contains(renderer.domElement)) el.style.visibility="hidden"; } });
  for(const [i,ms] of [[1,2500],[2,1200]]){ await p.waitForTimeout(ms); await hide(); await p.screenshot({path:`../shots/bt_side${i}.png`}); }
  // arm close-ups, same moment for both
  for(const [nm,e] of [["code","__a"],["blender","__b"]]){ await p.evaluate(nm=>{ const e=window[nm], B=e.pv.C?e.pv.C.R.B:e.pv.B; const a=B.arm1a||B.arm0a; const w=a.getWorldPosition(new THREE.Vector3()); const s=new THREE.Vector3(Math.cos(e.yaw),0,-Math.sin(e.yaw)); __cam.p.copy(w).addScaledVector(s,1.0).add(new THREE.Vector3(0,0.3,0.3)); __cam.t.copy(w); },e);
    await p.waitForTimeout(700); await hide(); await p.screenshot({path:`../shots/bt_arm_${nm}.png`}); }
  await b.close(); })();
