const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1400,height:860}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await p.route(/fonts\./, r=>r.abort());
  console.log('step 3');
  await p.goto('file://'+process.cwd()+'/test.html'); await p.waitForTimeout(3000);
  // new blank outdoor map
  await p.evaluate(()=>{ ED.doc=sbNormalize(PRESETS.find(x=>x.key==="blankOut").make()); edAfterLoad(true); }); await p.waitForTimeout(500);
  console.log('step 6');
  await p.click('#vPlan'); await p.waitForTimeout(200);
  console.log('step 7');
  const box=await p.locator('#edPlan').boundingBox(); const cx=box.x+box.width/2, cy=box.y+box.height/2;
  // terrain: raise a hill
  await p.keyboard.press('KeyT'); await p.mouse.move(cx+120,cy-80); await p.mouse.down(); for(let i=0;i<25;i++){ await p.mouse.move(cx+120+i*2,cy-80+i,{steps:1}); await p.waitForTimeout(40);} await p.mouse.up();
  console.log('step 10');
  // room
  await p.keyboard.press('KeyR'); await p.mouse.move(cx-200,cy-100); await p.mouse.down(); await p.mouse.move(cx-40,cy+40,{steps:5}); await p.mouse.up();
  console.log('step 12');
  // door on the bottom wall of the room
  await p.keyboard.press('KeyD'); await p.mouse.click(cx-120,cy+40);
  console.log('step 14');
  // wall chain
  await p.keyboard.press('KeyW'); await p.mouse.click(cx+20,cy+100); await p.mouse.click(cx+200,cy+100); await p.mouse.click(cx+200,cy+200); await p.keyboard.press('Escape');
  console.log('step 16');
  // prop: wardrobe in the room, then enemy, item, exit
  await p.keyboard.press('KeyA'); await p.mouse.click(cx-150,cy-60);
  console.log('step 18');
  await p.keyboard.press('KeyZ'); await p.mouse.move(cx+100,cy+150); await p.mouse.down(); await p.mouse.move(cx+60,cy+150,{steps:3}); await p.mouse.up();
  console.log('step 19');
  await p.keyboard.press('KeyI'); await p.mouse.click(cx+60,cy-20);
  console.log('step 20');
  await p.keyboard.press('KeyX'); await p.mouse.click(cx+250,cy-150);
  console.log('step 21');
  await p.keyboard.press('KeyV'); await p.mouse.click(cx-150,cy-60); await p.waitForTimeout(300);
  console.log('step 22');
  let st=await p.evaluate(()=>({n:ED.doc.objects.length, types:ED.doc.objects.map(o=>o.type).join(','), sel:selObj()&&selObj().type, maxH:Math.max(...ED.doc.terrain.h), doors:ED.doc.objects.filter(o=>o.type==="wall").reduce((a,w)=>a+w.openings.length,0), undo:ED.undo.length}));
  console.log('EDIT', JSON.stringify(st));
  await p.screenshot({path:'e1.png'});
  console.log('step 25');
  // add items to the wardrobe via the inspector
  await p.locator('#pane-inspect button:has-text("Add")').click(); await p.waitForTimeout(150);
  console.log('step 27');
  await p.locator('#pane-inspect button:has-text("Random loot")').click(); await p.waitForTimeout(150);
  console.log('step 28');
  console.log('ITEMS', await p.evaluate(()=>JSON.stringify(selObj().items)));
  await p.screenshot({path:'e2.png'});
  console.log('step 30');
  // undo twice
  await p.keyboard.press('Control+z'); await p.keyboard.press('Control+z'); console.log('UNDO', await p.evaluate(()=>JSON.stringify(selObj()&&selObj().items)));
  console.log('step 32');
  await p.click('#v3d'); await p.waitForTimeout(600); await p.screenshot({path:'e3.png'});
  console.log('step 33');
  // import the Map Designer's chapel
  await p.evaluate(()=>edSetTab("files")); await p.waitForTimeout(200);
  console.log('step 35');
  await p.locator('#pane-files textarea').nth(1).fill(fs.readFileSync('chapel.json','utf8')); await p.locator('#pane-files button:has-text("Import pasted JSON")').click(); await p.waitForTimeout(500);
  console.log('IMPORT MSG', await p.evaluate(()=>document.querySelector('#pane-files').innerText.slice(-600)));
  const lvBtn=p.locator('#pane-files button:has-text("Import this floor")'); if(await lvBtn.count()){ await lvBtn.click(); await p.waitForTimeout(2500); }
  console.log('IMPORTED', await p.evaluate(()=>JSON.stringify({name:ED.doc.name,n:ED.doc.objects.length,types:[...new Set(ED.doc.objects.map(o=>o.type))],props:world.boxes.length,cams:world.cams.length})));
  await p.screenshot({path:'i1.png'}); await p.click('#vPlan'); await p.waitForTimeout(300); await p.screenshot({path:'i2.png'});
  await b.close();
  console.log('step 36');
  console.log(errs.join('\n'));
})().catch(e=>console.log('ERR',e.message));
