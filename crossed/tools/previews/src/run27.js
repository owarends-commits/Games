const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1200,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'}));
  await p.route(/GLTFLoader\.js/, r=>r.fulfill({body:fs.readFileSync('GLTFLoader.js'),contentType:'application/javascript'}));
  await p.route(/SkeletonUtils\.js/, r=>r.fulfill({body:fs.readFileSync('SkeletonUtils.js'),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  await p.goto('http://127.0.0.1:8765/rp_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  await p.waitForTimeout(500); await p.screenshot({path:'rp_page.png'});
  await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; });
  const shots=[];
  for(const [a,times] of [["neutral",[0.8,1.6,2.6]],["walk",[0.75,1.0,1.3]],["sprint",[1.35,1.7,2.0,2.5]],["butt",[1.3,1.75,2.15,2.6]],["kick",[1.15,1.37,1.5,1.75]]]){
    await p.evaluate(a=>__rp.start(a),a);
    for(const tt of times){ const ph=await p.evaluate(tt=>{ while(__rp.t<tt) __rp.frame(1/60); return __rp.ctx.phase+' x='+__rp.ctx.x.toFixed(2); },tt);
      const n=`rp_${a}_${tt}.png`; await p.screenshot({path:n,clip:{x:16,y:70,width:860,height:600}}); shots.push([n,a+' '+ph]); console.log(a,tt,ph); } }
  fs.writeFileSync('rp_list.json',JSON.stringify(shots));
  console.log(errs.length?errs.slice(0,6).join('\n'):'no errors'); await b.close(); })();
