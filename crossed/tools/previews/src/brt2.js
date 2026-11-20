const { chromium } = require('playwright'); const fs=require('fs'); const K=process.argv[2]||"brute_twoarm_m01", SECS=+(process.argv[3]||20), D=+(process.argv[4]||9);
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,4).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  await p.evaluate(([K,D])=>{ CFG.norah.god=true; CFG.brute2.eager=0; clearEnemies(); window.__e=spawnBcross(K,player.pos.x+Math.sin(player.yaw)*D,player.pos.z+Math.cos(player.yaw)*D,{}); },[K,D]);
  for(let i=0;i<SECS*2;i++){ await p.waitForTimeout(500);
    console.log((i/2).toFixed(1), await p.evaluate(()=>{ const e=__e, b=e.pv, c=b.ctx, g=c.g; const h=Math.atan2(player.pos.x-e.pos.x,player.pos.z-e.pos.z); let dh=h-b.a; while(dh>Math.PI) dh-=2*Math.PI; while(dh<-Math.PI) dh+=2*Math.PI;
      window.__fc=(window.__fc||0); return `fps~${(()=>{ const n=frameNo||0; const r=n-(window.__fn||0); window.__fn=n; return r*2; })()} ${b.clipName} d=${Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z).toFixed(2)} dh=${dh.toFixed(2)} x=${c.x.toFixed(2)} fL=${c.fL&&c.fL.x.toFixed(2)},${c.fL&&c.fL.z.toFixed(2)} fR=${c.fR&&c.fR.x.toFixed(2)},${c.fR&&c.fR.z.toFixed(2)} g=${g?`v${g.v.toFixed(2)} z${g.z.toFixed(2)} vdes${g.vdes}`:"-"} want=${c.wantV}`; })); }
  console.log(errs.slice(0,8).join('\n')||'no errors'); await b.close(); })();
