const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(800);
  console.log(await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; clearEnemies(); CFG.world.freezeAI=true; const e=spawn("across",player.pos.x+2,player.pos.z,{}); const out=[];
    const hp0=player.hp; runnerHitNorah(e,15,"test slam",3,1.6); out.push("first hit: hp "+hp0+"→"+player.hp+", stumble "+player.stumble.toFixed(2)+", down "+(player.downT||0).toFixed(2));
    let t=0, landed=0, freeAt=null; for(let i=0;i<240;i++){ step(1/60,1/60); t+=1/60; if(i%20===0){ const h=player.hp; runnerHitNorah(e,15,"test slam",3,1.6); if(player.hp<h) landed++; } if(freeAt==null&&player.stumble<=0&&!(player.downT>0)) freeAt=t; }
    out.push(`follow-up hits every 0.33 s for 4 s: ${landed} landed; she could move again after ${freeAt&&freeAt.toFixed(2)} s; hp ${player.hp}`);
    return out.join("\n"); }));
  console.log(await p.evaluate(()=>{ wpnArmoury(); while(WS.wpn!=="hatchet") wpnSwitch(1); clearEnemies(); const e=spawn("across",player.pos.x+Math.sin(player.yaw)*1.1,player.pos.z+Math.cos(player.yaw)*1.1,{}); const h0=e.hp; player.shoveCd=0; WS.cool=0; shove(); for(let i=0;i<60;i++) step(1/60,1/60); return `shove with the hatchet out: swing ${WS.act>0?"played":"no"}, ACROSS hp ${h0}→${e.hp.toFixed(1)}, shove cooldown ${player.shoveCd.toFixed(2)}`; }));
  console.log(errs.join('\n')||'no errors'); await b.close(); })();
