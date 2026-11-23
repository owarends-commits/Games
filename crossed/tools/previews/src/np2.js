const { chromium } = require('playwright'); const fs=require('fs'); const LOGS=[];
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:480,height:300}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  p.on('console',m=>{ if(/BRNAN/.test(m.text())) LOGS.push(m.text()); }); await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ window.__noMF=!!false; paused=true; CFG.norah.god=true; CFG.world.freezeAI=true; clearEnemies(); const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); window.__e=spawnBcross("brute_twoarm_m02_legless",player.pos.x+fx*5,player.pos.z+fz*5,{}); });
  await p.waitForFunction(()=>__e.pv.ready,null,{timeout:30000});
  console.log(await p.evaluate(()=>{ const e=__e, m=e.pv.C.group, f=v=>isFinite(v)?+v.toFixed(3):String(v); let prev=null;
    for(let i=0;i<120;i++){ const st0=JSON.stringify({M:Array.from(e.pv.M.elements).map(f), pos:m.position.toArray().map(f), q:m.quaternion.toArray().map(f), sc:m.scale.toArray().map(f), ctx:{x:e.pv.ctx.x,sk:e.pv.ctx.sk}, st:e.pv.ctx.lastSt&&Object.fromEntries(Object.entries(e.pv.ctx.lastSt).filter(([k,v])=>typeof v==="number").map(([k,v])=>[k,f(v)]))});
      step(1/60,1/60); if(!isFinite(m.position.x+m.quaternion.x+m.position.y)) return `NaN after frame ${i}. before: ${st0}\nafter: pos ${m.position.toArray().map(f)} q ${m.quaternion.toArray().map(f)} st ${JSON.stringify(Object.fromEntries(Object.entries(e.pv.ctx.lastSt).filter(([k,v])=>typeof v==="number").map(([k,v])=>[k,f(v)])))} BS ${JSON.stringify(Object.fromEntries(Object.entries(e.pv.C.bs).filter(([k,v])=>typeof v==="number").map(([k,v])=>[k,f(v)])))}`; }
    return "no NaN"; }));
  console.log(LOGS.join('\n').slice(0,3000)); await b.close(); })();
