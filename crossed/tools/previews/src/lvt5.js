const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:500}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(async()=>{ ED.doc=sbNormalize(PRESETS.find(x=>x.key==="house3").make()); await sbAddDocTextures(ED.doc); $("mm").hidden=true; playMap(null); });
  await p.waitForTimeout(2500); if(await p.isVisible('#helpok')) await p.click('#helpok');
  const kinds=await p.evaluate(()=>Object.keys(PVK)); console.log("PV kinds:",kinds.join(","));
  await p.evaluate(()=>{ CFG.norah.god=true; clearEnemies(); for(let k=0;k<5;k++) step(1/60,1/60); });
  await p.evaluate(()=>{ const pts=[[3.2,3],[2.5,2.5],[2.5,-1],[-1.8,-1],[-1.8,-3.15],[4.4,-3.15],[4.4,-1.5],[-2,-1.5]]; for(let k=0;k<pts.length-1;k++){ const [ax,az]=pts[k],[bx,bz]=pts[k+1], n=Math.ceil(Math.hypot(bx-ax,bz-az)/0.05); for(let s=1;s<=n;s++){ player.pos.x=ax+(bx-ax)*s/n; player.pos.z=az+(bz-az)*s/n; step(1/60,1/60); } } });
  for(const k of ["brute2","hob","contortionist","reacher","tactician","clubfist"]){ if(!kinds.includes(k)) continue;
    await p.evaluate((k)=>{ clearEnemies(); spawn(k,1,2.5,{aware:"hunting"}); paused=true; },k); await p.waitForTimeout(5000);
    const r=await p.evaluate((k)=>{ for(let i=0;i<600;i++) step(1/60,1/60); const e2=enemies[0]; return JSON.stringify({k, lv:e2&&+e2._lvY.toFixed(2), lvI:e2&&e2._lvI, x:e2&&+e2.pos.x.toFixed(1), z:e2&&+e2.pos.z.toFixed(1), d:e2&&+Math.hypot(e2.pos.x-player.pos.x,e2.pos.z-player.pos.z).toFixed(1)}); },k).catch(e=>"ERR "+e.message);
    console.log(r); }
  console.log(errs.join('\n')||'no page errors', await p.evaluate(()=>JSON.stringify(CRASHES))); await b.close(); })();
