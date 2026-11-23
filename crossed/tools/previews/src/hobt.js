// node hobt.js : spawn the Hob the ways a player does (K key, menu button, a map with it placed) and watch for errors and freezes
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:500}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' | '+(e.stack||'').split('\n').slice(1,5).join(' | '))); p.on('console',m=>{ if(m.type()==='error') errs.push('console '+m.text().slice(0,300)); });
  p.on('crash',()=>errs.push('PAGE CRASHED'));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(2000);
  await p.evaluate(()=>{ CFG.norah.god=false; player.hp=100000; clearEnemies(); });
  await p.keyboard.press('KeyK');
  for(let i=0;i<70;i++){ const t0=Date.now(); let s; try{ s=await Promise.race([p.evaluate(()=>{ const e=enemies.find(e=>e.pvType==="hob"); return {n:enemies.length, hob:!!e, ready:e&&e.pv&&e.pv.ready, clip:e&&e.pv&&e.pv.clipName, frame:frameNo, hp:player.hp, grabbed:!!player.grabbed, log:(window.__lg=(window.__lg||0),''), pos:e?[+e.pos.x.toFixed(1),+e.pos.z.toFixed(1)]:null}; }), new Promise(r=>setTimeout(()=>r("TIMEOUT (page hung)"),8000))]); }catch(x){ s="EVAL FAIL "+x.message; }
    console.log(i, Date.now()-t0+"ms", JSON.stringify(s)); if(typeof s==="string") break; if(i%3===0) await p.evaluate(()=>{ const e=enemies.find(e=>e.pvType==="hob"); if(!e||!e.pv.ready) return; const cw=PV_HOB.crossWorld(); const pt=cw||e.pos.clone().setY(1); const dir=pt.clone().sub(player.pos).setY(0).normalize(); e.hit({userData:{zone:"torso",enemy:e}},pt,dir); }); await p.waitForTimeout(1000); }
  console.log(errs.slice(0,15).join('\n')||'no errors'); await b.close(); })();
