const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:500}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' | '+(e.stack||'').split('\n').slice(1,4).join(' | '))); p.on('console',m=>{ if(m.type()==='error') errs.push('console '+m.text().slice(0,200)); }); p.on('crash',()=>errs.push('PAGE CRASHED'));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  console.log(await p.evaluate(()=>{ try{ toBuild(); }catch(x){ return "toBuild failed "+x.message; } return "build mode: "+MODE; }));
  await p.waitForTimeout(1500);
  console.log(await p.evaluate(()=>{ try{ edAdd({type:"enemy",kind:"hob",x:2,z:-6,yaw:180,start:"hunting",hpMul:1,speedMul:1}); edRebuild(true); }catch(x){ return "edAdd failed "+x.message+" "+x.stack.split("\n").slice(0,3).join(" | "); } return "added; objects "+ED.doc.objects.filter(o=>o.kind==="hob").length; }));
  await p.waitForTimeout(8000); await p.screenshot({path:'../shots/edhob.png'});
  console.log(await p.evaluate(()=>{ try{ playMap(); }catch(x){ return "playMap failed "+x.message; } return "playing"; }));
  for(let i=0;i<6;i++){ await p.waitForTimeout(2000); console.log(await Promise.race([p.evaluate(()=>JSON.stringify({mode:MODE,frame:frameNo,hobs:enemies.filter(e=>e.pvType==="hob").map(e=>({ready:e.pv.ready,clip:e.pv.clipName})),crashes:Object.keys(CRASHES)})),new Promise(r=>setTimeout(()=>r("HUNG"),10000))])); }
  console.log(errs.slice(0,10).join('\n')||'no errors'); await b.close(); })();
