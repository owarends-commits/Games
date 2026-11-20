const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.route(/\/m\/.*\.json$/, async r=>{ await new Promise(z=>setTimeout(z,4000)); r.continue(); });
  await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(800);
  await p.click('#mmStart'); await p.waitForTimeout(200); await p.click('#suGo'); await p.waitForTimeout(200); await p.click('#helpok'); await p.waitForTimeout(100);
  await p.evaluate(()=>{ clearEnemies(); for(const [t,a] of [["runner",0],["tactician",0.6],["across",-0.6],["contortionist",1.2],["hob",-1.4]]) spawn(t,player.pos.x+Math.sin(player.yaw+a)*7,player.pos.z+Math.cos(player.yaw+a)*7,{}); });
  const seen=[]; for(let s=0;s<14;s++){ await p.waitForTimeout(1000); const r=await p.evaluate(()=>enemies.map(e=>{ let proc=0; e.root.traverse(o=>{ if(o.isMesh&&o.visible&&o.material&&o.material.visible!==false&&!o.userData.hitbox&&!(e.skin&&e.skin.model&&(o===e.skin.model||isUnder(o,e.skin.model)))) proc++; }); const shown=e.kind==="pv"?true:e.root.visible!==false;
      const real = e.kind==="pv" ? !!(e.pv&&e.pv.ready) : !!(e.skin&&e.skin.model); return (e.pvType||e.kind)+":"+(shown?(real?"model":(proc?"STAND-IN BODY":"shown")):"hidden"); }).join(" ")); seen.push((s+1)+"s "+r); }
  console.log(seen.join("\n")); console.log("preloaded",await p.evaluate(()=>PRELOAD.done+"/"+PRELOAD.total)); console.log(errs.slice(0,6).join('\n')||'no errors'); await b.close(); })();
