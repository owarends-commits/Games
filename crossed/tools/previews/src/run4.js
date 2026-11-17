const { chromium, devices } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1400,height:860}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await p.route(/fonts\./, r=>r.abort());
  await p.goto('file://'+process.cwd()+'/test.html'); await p.waitForTimeout(3000);
  await p.evaluate(t=>{ const m=sbFindDesignerMap(JSON.parse(t)); const r=fromDesigner(m,"L0"); ED.doc=r.doc; edAfterLoad(true); }, fs.readFileSync('chapel.json','utf8')); await p.waitForTimeout(1500);
  console.log(await p.evaluate(()=>JSON.stringify({t:!!ED.doc.terrain, nx:ED.doc.terrain&&ED.doc.terrain.nx, floors:ED.doc.objects.filter(o=>o.type==="floor").length})));
  await p.screenshot({path:'i3.png'});
  await p.click('#edPlay'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1200); await p.screenshot({path:'i4.png'});
  console.log(await p.evaluate(()=>JSON.stringify({mode:MODE,enemies:enemies.length,boxes:world.boxes.length})));
  await b.close();
  // phone
  const b2=await chromium.launch({args:['--use-gl=swiftshader']}); const ctx=await b2.newContext({...devices['iPhone 13']}); const q=await ctx.newPage();
  q.on('pageerror',e=>errs.push('PHONE '+e.message));
  await q.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await q.route(/fonts\./, r=>r.abort());
  await q.goto('file://'+process.cwd()+'/test.html'); await q.waitForTimeout(3500); await q.screenshot({path:'m1.png'});
  await q.click('#edPanelBtn'); await q.waitForTimeout(300); await q.screenshot({path:'m2.png'});
  await b2.close(); console.log(errs.join('\n')||'no errors');
})();
