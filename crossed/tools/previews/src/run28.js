const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1200,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  await p.goto('http://127.0.0.1:8765/rp_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  await p.waitForTimeout(400); await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; });
  const shots=[]; const run=async(a,times,pre)=>{ if(pre) await p.evaluate(pre); await p.evaluate(a=>__rp.start(a),a);
    for(const tt of times){ const ph=await p.evaluate(tt=>{ let n=0; while(__rp.t<tt && n<2000){ __rp.frame(1/60); n++; } return (__rp.ctx.phase||'')+(__rp.freeze>0?' [FREEZE]':''); },tt);
      const n=`r2_${a}_${tt}.png`; await p.screenshot({path:n,clip:{x:16,y:70,width:860,height:600}}); shots.push([n,a+' '+tt+' '+ph]); console.log(a,tt,ph); } };
    await run('grab',[3.3,4.0,4.6,5.6],()=>{ document.getElementById('oGrab').value='fail'; });
  await run('grab',[3.3,4.5,4.9,5.4],()=>{ document.getElementById('oGrab').value='free'; });
  await run('drop',[2.35,2.62,2.8,4.6]);
  // catch the impact frame itself: step until the freeze starts, then render a couple of freeze frames
  await p.evaluate(()=>__rp.start('drop')); const fz=await p.evaluate(()=>{ let n=0; while(__rp.freeze<=0 && n<1000){ __rp.frame(1/60); n++; } __rp.frame(1/60); return __rp.t.toFixed(2)+' freeze '+__rp.freeze.toFixed(3); });
  await p.screenshot({path:'r2_impact_ink.png',clip:{x:16,y:70,width:860,height:600}}); shots.push(['r2_impact_ink.png','drop impact frame (ink) '+fz]);
  await p.evaluate(()=>{ for(let i=0;i<6;i++) __rp.frame(1/60); }); await p.screenshot({path:'r2_impact_after.png',clip:{x:16,y:70,width:860,height:600}}); shots.push(['r2_impact_after.png','drop impact frame (held)']);
  fs.writeFileSync('r2_list.json',JSON.stringify(shots));
  console.log(errs.length?errs.slice(0,6).join('\n'):'no errors'); await b.close(); })();
