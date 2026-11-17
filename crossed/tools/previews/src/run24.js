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
  await p.evaluate(()=>{ CFG.norah.god=true; paused=true; window.updateCamera=()=>{}; edAmb.intensity=0.9; CFG.world.res=960; resize(); });
  for(const [hp,tag] of [[100,"fine"],[55,"hurt(high)"],[35,"hurt(low)"],[15,"crit"]]) for(const run of [false,true]){
    const r=await p.evaluate(([hp,run])=>{ player.hp=hp; NG.tier=norahTier(); NG.stagT=0.5; let n=0, prev=0, dist=0, lastX=0;
      player.pos.set(-3,0,-8); player.vel.set(0,0,0); player.yaw=0; camYaw=0; keys.KeyW=true; keys.ShiftLeft=run;
      for(let i=0;i<360;i++){ const z0=player.pos.z; step(1/60,1/60); if(i>=60) dist+=player.pos.z-z0; if(NG.stag>0.9&&prev<=0.9) n++; prev=NG.stag; if(player.pos.z>6){ player.pos.z=-8; } }
      return `speed ${(dist/5).toFixed(2)} m/s, staggers ${n} in 6 s`; },[hp,run]);
    console.log(tag.padEnd(11), run?'jog ':'walk', r); }
  // frames across one stagger, hurt walk
  await p.evaluate(()=>{ player.hp=40; keys.ShiftLeft=false; player.pos.set(-3,0,-8); NG.tier=1; NG.stag=0; NG.stagT=0.4; for(let i=0;i<20;i++) step(1/60,1/60); });
  const shots=[]; for(let k=0;k<6;k++){ await p.evaluate(()=>{ for(let i=0;i<5;i++) step(1/60,1/60); const f=player.yaw; camera.position.set(player.pos.x+Math.cos(f)*2.4,1.1,player.pos.z-Math.sin(f)*2.4+0.4); camera.lookAt(player.pos.x,0.85,player.pos.z); skinSyncAll(); renderer.render(scene,camera); });
    const n=`st${k}.png`; await p.waitForTimeout(80); await p.screenshot({path:n,clip:{x:350,y:100,width:400,height:520}}); shots.push(n); console.log('frame',k,'stag',await p.evaluate(()=>NG.stag.toFixed(2))); }
  fs.writeFileSync('st_list.json',JSON.stringify(shots));
  console.log(errs.length?errs.filter(x=>!x.includes('ERR_FAILED')).slice(0,8).join('\n')||'no errors':'no errors'); await b.close(); })();
