// node nwt.js : Norah posed live: walk, run, aim, fire, reload, dodge, shove, hurt; renders from the side
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  for(let i=0;i<40&&!(await p.evaluate(()=>PLV.ready));i++) await p.waitForTimeout(250);
  await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; clearEnemies(); });
  const shot=async(name)=>{ await p.evaluate(()=>{ const s=PLV.stage, f=new THREE.Vector3(Math.sin(player.yaw),0,Math.cos(player.yaw)), r=new THREE.Vector3(-f.z,0,f.x), cam=new THREE.PerspectiveCamera(40,900/600,0.05,100);
      const c=new THREE.Vector3(player.pos.x,0.9,player.pos.z); cam.position.copy(c).addScaledVector(r,3.6).addScaledVector(f,1.2).add(new THREE.Vector3(0,0.5,0)); cam.lookAt(c);
      const hl=new THREE.HemisphereLight(0xffffff,0x555555,1.4); scene.add(hl); renderer.render(scene,cam); scene.remove(hl); }); await p.screenshot({path:`/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/nw_${name}.png`}); };
  const run=async(n,fn)=>{ for(let i=0;i<n;i++) await p.evaluate(fn); };
  const st=()=>p.evaluate(()=>({ph:PLV.ctx.phase,fv:+PLV.S.fwdV.toFixed(2),aim:player.aiming,rl:player.reloading,hp:player.hp|0}));
  // walk forward
  await run(60,()=>{ keys.KeyW=true; step(1/60,1/60); }); console.log('walk',JSON.stringify(await st())); await shot('walk');
  await run(50,()=>{ keys.KeyW=true; keys.ShiftLeft=true; step(1/60,1/60); }); console.log('run',JSON.stringify(await st())); await shot('run');
  await p.evaluate(()=>{ keys.KeyW=false; keys.ShiftLeft=false; }); await run(40,()=>step(1/60,1/60)); console.log('idle',JSON.stringify(await st())); await shot('idle');
  await p.evaluate(()=>{ keys.KeyC=true; }); await run(40,()=>{ step(1/60,1/60); }); console.log('aim',JSON.stringify(await st())); await shot('aim');
  await p.evaluate(()=>{ fire(); }); await run(5,()=>{ step(1/60,1/60); }); console.log('fire',JSON.stringify(await st())); await shot('fire');
  await run(60,()=>{ step(1/60,1/60); });
  await p.evaluate(()=>{ keys.KeyC=false; player.rounds=2; player.spare=20; startReload(); }); await run(50,()=>step(1/60,1/60)); console.log('reload',JSON.stringify(await st())); await shot('reload');
  await run(200,()=>step(1/60,1/60));
  await p.evaluate(()=>{ player.hurt(5,{pos:new THREE.Vector3(player.pos.x+1,0,player.pos.z),name:"test"},"test"); }); await run(8,()=>step(1/60,1/60)); console.log('hurt',JSON.stringify(await st())); await shot('hurt');
  await run(60,()=>step(1/60,1/60)); await p.evaluate(()=>{ player.downT=2.0; player.stumble=1; }); await run(50,()=>step(1/60,1/60)); console.log('down',JSON.stringify(await st())); await shot('down');
  await run(200,()=>step(1/60,1/60)); console.log('up',JSON.stringify(await st())); await shot('up');
  console.log(errs.slice(0,8).join('\n')||'no errors'); await b.close(); })();
