// node lvt2.js : chased down two flights; where are the bodies drawn; screenshots of each level and the builder
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:500}, deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(async()=>{ ED.doc=sbNormalize(PRESETS.find(x=>x.key==="house3").make()); await sbAddDocTextures(ED.doc); $("mm").hidden=true; playMap(null); });
  await p.waitForTimeout(2500); if(await p.isVisible('#helpok')) await p.click('#helpok');
  await p.evaluate(()=>{ CFG.norah.god=true; paused=true; });
  const bodyY=()=>p.evaluate(()=>JSON.stringify(enemies.map(e=>{ const bb=new THREE.Box3(); const r=e.root||e.group||(e.pv&&e.pv.stage); if(r){ r.updateMatrixWorld(true); bb.setFromObject(r); } return {n:e.name,lv:e._lvY,minY:r?+bb.min.y.toFixed(2):null}; })));
  for(let k=0;k<30;k++) await p.evaluate(()=>step(1/60,1/60));
  console.log("bodies drawn at:", await bodyY());
  const walk=async(pts)=>p.evaluate((pts)=>{ for(let k=0;k<pts.length-1;k++){ const [ax,az]=pts[k],[bx,bz]=pts[k+1], n=Math.ceil(Math.hypot(bx-ax,bz-az)/0.05);
      for(let s=1;s<=n;s++){ player.pos.x=ax+(bx-ax)*s/n; player.pos.z=az+(bz-az)*s/n; step(1/60,1/60); } } },pts);
  // upstairs with the upstairs Walker hunting her, then she runs down to the basement
  await walk([[3.2,3],[2.5,3.2],[2.5,-1],[-1.8,-1],[-1.8,-3.15],[4.4,-3.15],[4.4,-1.5]]);
  await p.evaluate(()=>{ const w=enemies.find(e=>e._lvI===2); w.aware="hunting"; w._lvSeen=gameTime; for(let k=0;k<60;k++) step(1/60,1/60); });
  await p.evaluate(()=>{ paused=false; }); await p.waitForTimeout(700); await p.screenshot({path:'lv_upstairs.png'}); await p.evaluate(()=>{ paused=true; });
  await walk([[4.4,-1.5],[4.4,-3.15],[-1.6,-3.15],[-1.8,-1],[2.5,-1],[2.5,3.2],[-4.4,3.2],[-4.4,1]]);
  console.log("she's in the basement:", await p.evaluate(()=>JSON.stringify({p:player._lvI,e:enemies.map(e=>[e.name,e._lvI,+e.pos.x.toFixed(1),+e.pos.z.toFixed(1),e.aware])})));
  for(let t=0;t<5;t++){ await p.evaluate(()=>{ for(let k=0;k<300;k++) step(1/60,1/60); }); console.log(`+${(t+1)*5}s`, await p.evaluate(()=>JSON.stringify(enemies.map(e=>[e.name,e._lvI,+e.pos.x.toFixed(1),+e.pos.z.toFixed(1),+(e._lvY||0).toFixed(2),e.aware,e.state])))); }
  console.log("bodies drawn at:", await bodyY());
  await p.evaluate(()=>{ paused=false; }); await p.waitForTimeout(700); await p.screenshot({path:'lv_basement.png'});
  // the builder: plan of upstairs, 3D of the ground floor
  await p.evaluate(()=>{ goMenu&&0; MODE="build"; });
  await p.evaluate(()=>{ try{ stopPlay&&stopPlay(); }catch(e){} });
  await p.waitForTimeout(500);
  console.log(errs.slice(0,10).join('\n')||'no page errors'); console.log("crashes", await p.evaluate(()=>JSON.stringify(CRASHES)));
  await b.close(); })();
