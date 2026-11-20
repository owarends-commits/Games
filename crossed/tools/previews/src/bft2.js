// node bft2.js <type> <clip> <dist> [outSel json]: play one attack at a set distance and report the events and hits
const { chromium } = require('playwright'); const fs=require('fs'); const [T,CL,D,OS]=[process.argv[2],process.argv[3],+process.argv[4],process.argv[5]||"{}"];
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  await p.evaluate(([T,D])=>{ CFG.norah.god=true; CFG.world.freezeAI=true; clearEnemies(); window.__dbg=[]; window.__L=[]; const lg=window.log; window.log=(m,c)=>{ __L.push(String(m)); return lg(m,c); };
    window.__e=spawn(T,player.pos.x+Math.sin(player.yaw)*D,player.pos.z+Math.cos(player.yaw)*D,{}); },[T,D]);
  await p.waitForTimeout(4000);
  await p.evaluate(([CL,OS])=>{ const e=__e; e.pv.play(CL,{outSel:JSON.parse(OS)}); window.__hp=player.hp; },[CL,OS]);
  await p.waitForTimeout(9000);
  console.log(JSON.stringify(await p.evaluate(()=>({dbg:__dbg,L:__L.filter(x=>!/^Hit →/.test(x)).slice(-12),phase:__e.pv.ctx.phase,d:Math.hypot(player.pos.x-__e.pos.x,player.pos.z-__e.pos.z).toFixed(2)}))));
  console.log(errs.slice(0,5).join('\n')||'no errors'); await b.close(); })();
