const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1100,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | '))); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text()); });
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'}));
  await p.route(/GLTFLoader\.js/, r=>r.fulfill({body:fs.readFileSync('GLTFLoader.js'),contentType:'application/javascript'}));
  await p.route(/SkeletonUtils\.js/, r=>r.fulfill({body:fs.readFileSync('SkeletonUtils.js'),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  
  await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ const d=sbNormalize(PRESETS.find(x=>x.key==="open").make()); d.objects=d.objects.filter(o=>o.type!=="enemy"); ED.doc=d; edAfterLoad(false); });
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok');
  for(let i=0;i<40&&!(await p.evaluate(()=>!!(player.skin&&player.skin.model)));i++) await p.waitForTimeout(400);
  await p.evaluate(()=>{ CFG.norah.god=true; window.updateCamera=()=>{}; edAmb.intensity=0.9; CFG.world.res=960; resize(); });
  const shots=[];
  for(const [hp,tag] of [[100,"fine"],[45,"hurt"],[15,"crit"]]) for(const run of [false,true]){
    const r=await p.evaluate(([hp,run])=>{ player.hp=hp; player.pos.set(-3,0,-8); player.yaw=0; camYaw=0; player.vel.set(0,0,0); keys.KeyW=true; keys.ShiftLeft=run; keys.ShiftRight=run; NG.tier=norahTier();
      paused=false; const x0=player.pos.z; for(let i=0;i<(run?50:120);i++) step(1/60,1/60); return `tier ${norahTier()} moved ${(player.pos.z-x0).toFixed(2)} m in 2 s, ph ${NG.ph.toFixed(1)} blend ${NG.blend.toFixed(2)}`; },[hp,run]);
    console.log(tag, run?'jog':'walk', r);
    for(let k=0;k<3;k++){ await p.evaluate(()=>{ paused=true; for(let i=0;i<7;i++) step(1/60,1/60); const f=player.yaw; camera.position.set(player.pos.x+Math.cos(f)*2.4,1.1,player.pos.z-Math.sin(f)*2.4+0.4); camera.lookAt(player.pos.x,0.85,player.pos.z); skinSyncAll(); renderer.render(scene,camera); });
      const n=`nr_${tag}_${run?'j':'w'}${k}.png`; await p.waitForTimeout(100); await p.screenshot({path:n,clip:{x:350,y:100,width:400,height:520}}); shots.push(n); } }
  await p.evaluate(()=>{ keys.KeyW=false; keys.ShiftLeft=keys.ShiftRight=false; player.hp=45; for(let i=0;i<60;i++) step(1/60,1/60); const f=player.yaw; camera.position.set(player.pos.x+Math.sin(f)*2.2+0.8,1.3,player.pos.z+Math.cos(f)*2.2); camera.lookAt(player.pos.x,0.95,player.pos.z); skinSyncAll(); renderer.render(scene,camera); });
  await p.waitForTimeout(100); await p.screenshot({path:'nr_idle_hurt.png',clip:{x:350,y:100,width:400,height:520}}); shots.push('nr_idle_hurt.png');
  fs.writeFileSync('nr_list.json',JSON.stringify(shots));
  console.log(errs.length?errs.filter(x=>!x.includes('ERR_FAILED')).slice(0,8).join('\n')||'no errors':'no errors'); await b.close(); })();
