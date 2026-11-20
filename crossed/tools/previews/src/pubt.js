// node pubt.js : the page as published (index.html + m/), new creatures spawned by their keys; did each model load?
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1100,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | '))); p.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') errs.push(m.type()+' '+m.text().slice(0,200)); });
  p.on('requestfailed',r=>errs.push('REQFAIL '+r.url().slice(0,120)));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8766/'); await p.waitForTimeout(3000);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(500);
  for(const k of ["Digit7","Digit8","Digit9","KeyK"]){ await p.evaluate(()=>clearEnemies()); await p.keyboard.press(k); await p.waitForTimeout(6000);
    console.log(k, await p.evaluate(()=>JSON.stringify(enemies.map(e=>({type:e.pvType||e.kind,ready:!!(e.pv&&e.pv.ready),mdl:e.mdl||null,vis:e.pv&&e.pv.C?e.pv.C.group.visible:(e.pv&&e.pv.stage?e.pv.stage.children.length:null),skin:!!(e.skin&&e.skin.model),skinVis:!!(e.skin&&e.skin.model&&e.skin.model.visible&&e.skin.model.parent),rootVis:(()=>{ let n=0; e.root.traverse(o=>{ if(o.isMesh&&o.visible) n++; }); return n; })()}))))); }
  console.log('PLV ready', await p.evaluate(()=>PLV.ready));
  console.log(errs.slice(0,15).join('\n')||'no errors'); await b.close(); })();
