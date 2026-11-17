// node wpt.js : every weapon in the playground: switch, hold, aim, fire/swing at a target, reload; side renders
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  for(let i=0;i<40&&!(await p.evaluate(()=>PLV.ready));i++) await p.waitForTimeout(250);
  await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; clearEnemies(); wpnArmoury(); CFG.world.freezeAI=true; });
  const shot=async(name)=>{ await p.evaluate(()=>{ const f=new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw)), r=new THREE.Vector3(-f.z,0,f.x), cam=new THREE.PerspectiveCamera(40,900/600,0.05,100);
      const c=new THREE.Vector3(player.pos.x,1.0,player.pos.z); cam.position.copy(c).addScaledVector(r,3.0).addScaledVector(f,1.0).add(new THREE.Vector3(0,0.4,0)); cam.lookAt(c);
      const hl=new THREE.HemisphereLight(0xffffff,0x555555,1.4); scene.add(hl); renderer.render(scene,cam); scene.remove(hl); }); await p.screenshot({path:`/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/wp_${name}.png`}); };
  const run=async(n)=>{ for(let i=0;i<n;i++) await p.evaluate(()=>step(1/60,1/60)); };
  const info=()=>p.evaluate(()=>{ const e=enemies[0]; return {w:WS.wpn,ph:PLV.ctx.phase,ehp:e?+e.hp.toFixed(1):null,st:JSON.stringify(wpnState(WS.wpn)),rl:+player.reloading.toFixed(2)}; });
  for(const k of ["shotgun","rifle","pistol","flaregun","hatchet","crowbar","knife","flare"]){
    await p.evaluate(k=>{ while(WS.wpn!==k){ WS.cool=0; wpnSwitch(1); } clearEnemies(); const d=["hatchet","crowbar","knife"].includes(k)?1.2:5; window.__t=spawn("walker",player.pos.x+Math.sin(player.yaw)*d,player.pos.z+Math.cos(player.yaw)*d,{}); },k);
    await run(30); await shot(k+'_hold');
    if(["shotgun","rifle","pistol","flaregun"].includes(k)){ await p.evaluate(()=>{ keys.KeyC=true; }); await run(40); await shot(k+'_aim'); await p.evaluate(()=>{ fire(); }); await run(8); await shot(k+'_fire'); await run(60); console.log(k,'fired',JSON.stringify(await info()));
      await p.evaluate(()=>{ keys.KeyC=false; }); await run(20); await p.evaluate(()=>{ startReload(); }); await run(40); await shot(k+'_load'); await run(240); console.log(k,'loaded',JSON.stringify(await info())); }
    else if(k==="flare"){ await p.evaluate(()=>{ fire(); }); await run(100); await shot('flare_lit'); await run(60); await p.evaluate(()=>{ fire(); }); await run(30); await shot('flare_throw'); await run(90); console.log(k,JSON.stringify(await info()), await p.evaluate(()=>WS.flares.length+' flares burning')); }
    else { await p.evaluate(()=>{ fire(); }); await run(24); await shot(k+'_swing'); await run(80); console.log(k,'swung',JSON.stringify(await info())); } }
  console.log(errs.slice(0,8).join('\n')||'no errors'); await b.close(); })();
