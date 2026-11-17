const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1400,height:860}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await p.route(/fonts\./, r=>r.abort());
  await p.goto('file://'+process.cwd()+'/test.html'); await p.waitForTimeout(3000);
  // new blank outdoor map
  await p.evaluate(()=>{ ED.doc=sbNormalize(PRESETS.find(x=>x.key==="blankOut").make()); edAfterLoad(true); }); await p.waitForTimeout(500);
  await p.click('#vPlan'); await p.waitForTimeout(200);
  const box=await p.locator('#edPlan').boundingBox(); const cx=box.x+box.width/2, cy=box.y+box.height/2;
  // terrain: raise a hill
  await p.keyboard.press('KeyT'); await p.mouse.move(cx+120,cy-80); await p.mouse.down(); for(let i=0;i<25;i++){ await p.mouse.move(cx+120+i*2,cy-80+i,{steps:1}); await p.waitForTimeout(40);} await p.mouse.up();
  // room
  await p.keyboard.press('KeyR'); await p.mouse.move(cx-200,cy-100); await p.mouse.down(); await p.mouse.move(cx-40,cy+40,{steps:5}); await p.mouse.up();
  // door on the bottom wall of the room
  await p.keyboard.press('KeyD'); await p.mouse.click(cx-120,cy+40);
  // wall chain
  await p.keyboard.press('KeyW'); await p.mouse.click(cx+20,cy+100); await p.mouse.click(cx+200,cy+100); await p.mouse.click(cx+200,cy+200); await p.keyboard.press('Escape');
  // prop: wardrobe in the room, then enemy, item, exit
  await p.keyboard.press('KeyA'); await p.mouse.click(cx-150,cy-60);
  await p.keyboard.press('KeyZ'); await p.mouse.move(cx+100,cy+150); await p.mouse.down(); await p.mouse.move(cx+60,cy+150,{steps:3}); await p.mouse.up();
  await p.keyboard.press('KeyI'); await p.mouse.click(cx+60,cy-20);
  await p.keyboard.press('KeyX'); await p.mouse.click(cx+250,cy-150);
  await p.keyboard.press('KeyV'); await p.mouse.click(cx-150,cy-60); await p.waitForTimeout(300);
  let st=await p.evaluate(()=>({n:ED.doc.objects.length, types:ED.doc.objects.map(o=>o.type).join(','), sel:selObj()&&selObj().type, maxH:Math.max(...ED.doc.terrain.h), doors:ED.doc.objects.filter(o=>o.type==="wall").reduce((a,w)=>a+w.openings.length,0), undo:ED.undo.length}));
  console.log('EDIT', JSON.stringify(st));
  await p.screenshot({path:'e1.png'});
  // add items to the wardrobe via the inspector
  await p.locator('#pane-inspect button:has-text("Add")').click(); await p.waitForTimeout(150);
  await p.locator('#pane-inspect button:has-text("Random loot")').click(); await p.waitForTimeout(150);
  console.log('ITEMS', await p.evaluate(()=>JSON.stringify(selObj().items)));
  await p.screenshot({path:'e2.png'});
  // undo twice
  await p.keyboard.press('Control+z'); await p.keyboard.press('Control+z'); console.log('UNDO', await p.evaluate(()=>JSON.stringify(selObj()&&selObj().items)));
  await p.click('#v3d'); await p.waitForTimeout(600); await p.screenshot({path:'e3.png'});
  // import the Map Designer's chapel
  await p.evaluate(()=>edSetTab("files")); await p.waitForTimeout(200);
  await p.locator('#pane-files textarea').nth(1).fill(fs.readFileSync('chapel.json','utf8'));
  await b.close(); console.log(errs.join('\n'));
})().catch(e=>console.log('ERR',e.message));
