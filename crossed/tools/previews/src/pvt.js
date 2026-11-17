// node pvt.js <type> <seconds> [shots]  -> spawns a preview creature in front of Norah, steps, logs its clips and any errors; screenshots
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [type,secs,shotsArg]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:960,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | '))); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text().slice(0,200)); });
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  await p.evaluate(t=>{ clearEnemies(); window.__e=spawn(t,player.pos.x+Math.sin(player.yaw)*6,player.pos.z+Math.cos(player.yaw)*6,{}); },type);
  for(let i=0;i<40&&!(await p.evaluate(()=>__e.pv&&__e.pv.ready));i++) await p.waitForTimeout(250);
  await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; }); if(process.env.STYLE) await p.evaluate(s=>{ __e.pvMem.style=s; __e.pv.play(s); },process.env.STYLE); if(process.env.MASH) await p.evaluate(()=>{ window.__mash=true; });
  const shots=(shotsArg||'').split(',').filter(Boolean).map(Number); const log=[]; let k=0;
  const N=Math.round(+secs*60);
  for(let i=0;i<N;i++){ const r=await p.evaluate(()=>{ if(window.__mash&&player.grabbed&&player.grabbed.qte&&Math.random()<0.25){ const q=player.grabbed.qte; if(q.mode==="mash"){ q.fill+=CFG.across.mashPer; if(q.fill>=1) pushOff(player.grabbed); } else { q.i++; if(q.i>=q.seq.length) pushOff(player.grabbed); else q.t=q.win; } } if(player.grabbed) qteTick(1/60); step(1/60,1/60); const e=__e, b=e.pv; return {t:+(b.t||0).toFixed(2),clip:b.clipName,ph:b.ctx.phase,d:+Math.hypot(e.pos.x-player.pos.x,e.pos.z-player.pos.z).toFixed(2),hp:+player.hp.toFixed(0),grab:!!player.grabbed,y:+(b.C?b.C.group.position.y:0).toFixed(2)}; });
    if(i%30===0) log.push(JSON.stringify(r));
    if(shots.length&&k<shots.length&&i/60>=shots[k]){ await p.screenshot({path:`/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/pv_${type}_${k}.png`}); k++; } }
  console.log(log.join('\n')); console.log(errs.slice(0,10).join('\n')||'no errors'); await b.close(); })();
