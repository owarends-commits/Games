// node deatht3.js : killed by an ACROSS, gameplay camera: is she in shot, and when do the results box and YOU DIED show
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:500}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(4000);
  await p.evaluate(()=>{ clearEnemies(); CFG.norah.god=false; player.hp=8; const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); window.__e=spawn("across",player.pos.x+fx*2.5,player.pos.z+fz*2.5,{}); }); await p.waitForTimeout(2000); await p.evaluate(()=>player.bite(__e,"bite",999));
  await p.waitForFunction(()=>player.dead,null,{timeout:60000,polling:50}); const t0=Date.now();
  for(const k of [0.6,1.5,2.2,3.2]){ await p.waitForFunction(k=>PLV.t-PLV.S.dead>=k,k,{timeout:40000,polling:30});
    const s=await p.evaluate(()=>{ const h=plvWith(()=>PV_NW.LIVE.abdomen()).applyMatrix4(PLV.stage.matrixWorld).project(camera); return {res:document.getElementById("result").style.display, op:(+getComputedStyle(document.getElementById("dead")).opacity).toFixed(2), menu:SB.simMenu, fixed:isFixed(), ndc:[+h.x.toFixed(2),+h.y.toFixed(2),+h.z.toFixed(2)]}; });
    await p.screenshot({path:`../shots/deathA_${k}.png`}); console.log(`k=${k} (${((Date.now()-t0)/1000).toFixed(1)}s real)`, JSON.stringify(s)); }
  console.log(errs.join('\n')||'no page errors'); await b.close(); })();
