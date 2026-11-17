const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const type=process.argv[2]; const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:960,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  await p.evaluate(t=>{ window.requestAnimationFrame=()=>0; clearEnemies(); window.__e=spawn(t,player.pos.x+Math.sin(player.yaw)*7,player.pos.z+Math.cos(player.yaw)*7,{}); },type);
  for(let i=0;i<40&&!(await p.evaluate(()=>__e.pv&&__e.pv.ready));i++) await p.waitForTimeout(250);
  // aim at it and fire through the real fire() path until it drops
  const r=await p.evaluate(()=>{ const out=[]; CFG.world.freezeAI=true; for(let i=0;i<30;i++) step(1/60,1/60);
    for(let s=0;s<40&&!__e.dead;s++){ const tgt=__e.pv.hits[s%__e.pv.hits.length], w=tgt.getWorldPosition(new THREE.Vector3()); const ray=new THREE.Raycaster(new THREE.Vector3(player.pos.x,1.4,player.pos.z),w.clone().sub(new THREE.Vector3(player.pos.x,1.4,player.pos.z)).normalize());
      const hs=ray.intersectObjects(enemyMeshes(),false); if(hs.length){ hs[0].object.userData.enemy&&hs[0].object.userData.enemy.hit(hs[0].object,hs[0].point,ray.ray.direction); out.push(hs[0].object.userData.zone+":"+__e.hp.toFixed(1)); } else out.push("miss");
      for(let i=0;i<10;i++) step(1/60,1/60); }
    for(let i=0;i<120;i++) step(1/60,1/60); return out.join(" ")+" | dead="+__e.dead+" clip="+__e.pv.clipName; });
  console.log(r); await p.screenshot({path:'/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/pvdead_'+type+'.png'}); console.log(errs.slice(0,8).join('\n')||'no errors'); await b.close(); })();
