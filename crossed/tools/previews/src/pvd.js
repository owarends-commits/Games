const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:960,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,4).join(' | '))); p.on('console',m=>errs.push('C '+m.type()+' '+m.text().slice(0,300))); p.on('requestfailed',r=>errs.push('REQFAIL '+r.url()));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  console.log(await p.evaluate(()=>{ clearEnemies(); window.__e=spawn("contortionist",player.pos.x+3,player.pos.z,{}); return JSON.stringify({key:__e.pv.key, f:MODEL_LIB[__e.pv.key]&&MODEL_LIB[__e.pv.key].f}); }));
  await p.waitForTimeout(5000); console.log(await p.evaluate(async()=>{ const b=__e.pv; const g=await mdlLoad(b.key); try{ b.withStage(()=>{ b.C=b.mod.makeChar(g); b.mod.pvSetup(b.C); }); b.makeHits(); return 'ok'; }catch(err){ return 'ERR '+err.message+' '+err.stack.split('\n').slice(0,4).join(' | '); } }));
  console.log(errs.slice(0,15).join('\n')); await b.close(); })();
