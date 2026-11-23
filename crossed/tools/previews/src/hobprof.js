const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{ CFG.norah.god=true; clearEnemies(); spawn("hob"); }); await p.waitForTimeout(4000);
  const cdp=await p.context().newCDPSession(p); await cdp.send('Profiler.enable'); await cdp.send('Profiler.start'); await p.waitForTimeout(5000); const {profile}=await cdp.send('Profiler.stop');
  const self={}; const dt=profile.timeDeltas; const byId={}; for(const n of profile.nodes) byId[n.id]=n; const cnt={}; for(const s of profile.samples) cnt[s]=(cnt[s]||0)+1;
  for(const id in cnt){ const n=byId[id], k=n.callFrame.functionName+" @"+n.callFrame.lineNumber+":"+(n.callFrame.url.split('/').pop()); self[k]=(self[k]||0)+cnt[id]; }
  const tot=profile.samples.length; console.log(Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,22).map(([k,v])=>(v/tot*100).toFixed(1)+"% "+k).join('\n'));
  const tri=await p.evaluate(()=>{ let t=0,m=0; const e=enemies[0]; e.pv.stage.traverse(o=>{ if(o.isMesh){ m++; const g=o.geometry; t+=(g.index?g.index.count:g.attributes.position.count)/3; } }); return {meshes:m,tris:t,renderCalls:renderer.info.render.calls,rtris:renderer.info.render.triangles}; }); console.log(JSON.stringify(tri));
  await b.close(); })();
