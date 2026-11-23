// node deatht.js : kill Norah and photograph her death from the side at set moments
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:500}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(4000);
  await p.evaluate(()=>{ clearEnemies(); CFG.norah.god=false; window.__d=spawn("dummy",player.pos.x+3,player.pos.z,{}); });
  // step the sim by hand: a fixed camera to her side
  await p.evaluate(()=>{ player.hurt(999,__d,"test"); window.__cam=()=>{ const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); camera.position.set(player.pos.x+fz*3.2, 1.0, player.pos.z-fx*3.2); camera.lookAt(player.pos.x+fx*0.3,0.5,player.pos.z+fz*0.3); }; updateCamera=()=>__cam(); });
  for(const at of [0.3,0.9,1.4,1.75,2.4,3.0]){ await p.waitForFunction(a=>PLV.S.dead!=null&&PLV.t-PLV.S.dead>=a,at,{timeout:20000,polling:20});
    await p.evaluate(()=>{ const keep=renderer.domElement; for(const el of document.querySelectorAll("body *")){ if(el===keep||el.contains(keep)) continue; const ps=getComputedStyle(el).position; if(ps==="fixed"||ps==="absolute") el.style.visibility="hidden"; } });
    await p.screenshot({path:`../shots/death_${at}.png`}); }
  console.log(await p.evaluate(()=>`pools=${pools.length} dead=${player.dead} phase=${PLV.ctx.phase}`));
  console.log(errs.slice(0,5).join('\n')||'no errors'); await b.close(); })();
