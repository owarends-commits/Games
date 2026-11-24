const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']});
  for(const [W,H,name] of [[1280,760,'lv_ed_wide.png'],[390,780,'lv_ed_phone.png']]){
  const p=await b.newPage({viewport:{width:W,height:H}, deviceScaleFactor:2}); const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(async()=>{ ED.doc=sbNormalize(PRESETS.find(x=>x.key==="house3").make()); await sbAddDocTextures(ED.doc); edAfterLoad(true); openBuilder(); edSetView("plan"); edSetLevel(-3.2); edFrameAll(); });
  await p.waitForTimeout(900); await p.screenshot({path:name}); console.log(name, errs.join(' ')||'ok');
  console.log(await p.evaluate(()=>{ const r=$("edLvBox").getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height,opts:[...$("edLv").options].map(o=>o.text)}); })); await p.close(); }
  await b.close(); })();
