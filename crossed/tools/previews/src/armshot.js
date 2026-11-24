const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:560}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  for(const K of ["brute_twoarm_m01","brute_twoarm_m02_legless","brute_twoarm_m03_split","brute_twoarm_m04_armored"]){
    await p.evaluate((K)=>{ CFG.norah.god=true; CFG.world.freezeAI=false; clearEnemies(); const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); window.__e=spawnBcross(K,player.pos.x+fx*6,player.pos.z+fz*6,{});
      updateCamera=()=>{ const e=__e; if(!e.pv.ready) return; const R=e.pv.C.R, a=R.arms[0]; if(!a) return; const w=a.base.getWorldPosition(new THREE.Vector3()); const s=new THREE.Vector3(Math.cos(e.yaw),0,-Math.sin(e.yaw)); camera.position.copy(w).addScaledVector(s,1.1).add(new THREE.Vector3(0,0.25,0)); camera.lookAt(w); }; },K);
    await p.waitForFunction(()=>__e.pv.ready,null,{timeout:60000}); await p.waitForTimeout(3500);
    await p.evaluate(()=>{ for(const el of document.querySelectorAll("body *")){ const ps=getComputedStyle(el).position; if((ps==="fixed"||ps==="absolute")&&!el.contains(renderer.domElement)) el.style.visibility="hidden"; } });
    await p.screenshot({path:`../shots/arm_${K}.png`}); }
  await b.close(); })();
