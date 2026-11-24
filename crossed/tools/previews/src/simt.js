// node simt.js : every simulation room through the Simulations screen; what got built, who spawned and how, a picture from her camera
const { chromium } = require('playwright'); const fs=require('fs'); const KIND=process.argv[2]||"across", N=+(process.argv[3]||3), ST=process.argv[4]||"wander";
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:500}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  console.log("title buttons:", await p.evaluate(()=>[...document.querySelectorAll("#mmTitle .mmButtons button")].map(b=>b.textContent).join(" · ")));
  await p.click('#mmSimsBtn'); await p.waitForTimeout(500);
  const rooms=await p.evaluate(()=>SIM_ROOMS.map(r=>r.key));
  for(const key of rooms){
    await p.evaluate(([key,K,N,ST])=>{ SIMR.room=key; SIMR.kind=K; SIMR.count=N; SIMR.start=ST; renderSims(); },[key,KIND,N,ST]);
    await p.click('#mmSims .go'); await p.waitForTimeout(2500);
    if(await p.$('#helpok')&&await p.isVisible('#helpok')) { await p.click('#helpok'); }
    await p.waitForTimeout(3500);
    const r=await p.evaluate(()=>{ const ens=enemies.map(e=>({k:e.pvType||e.kind+(e.variant?":"+e.variant:""),st:e.pvUnaware?"unaware("+e.pvUnaware.idle+")":(e.aware||e.state)})); return {mode:MODE,name:ED.doc.name,roofs:(world.roofs||[]).map(r=>r.y),walls:ED.doc.objects.filter(o=>o.type==="wall").map(w=>w.height).join("/"),props:ED.doc.objects.filter(o=>o.type==="prop").length,
      spawn:[+player.pos.x.toFixed(1),+player.pos.z.toFixed(1)],enemies:ens,crashes:Object.keys(CRASHES),camY:+camera.position.y.toFixed(2)}; });
    console.log(key, JSON.stringify(r));
    await p.evaluate(()=>{ for(const el of document.querySelectorAll("#log,#help")) el.style.visibility="hidden"; }); await p.screenshot({path:`../shots/sim_${key}.png`});
    await p.evaluate(()=>{ goMenu("sims"); }); await p.waitForTimeout(400); }
  console.log(errs.slice(0,8).join('\n')||'no page errors'); await b.close(); })();
