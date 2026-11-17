const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage();
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/tac_test.html'); for(let i=0;i<60&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  console.log(await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; __rp.renderer.render=()=>0; __rp.start("walk"); const C=__rp.runner; const rows=[]; let prev=0;
    for(let k=0;k<9*60;k++){ __rp.frame(1/60); const cx=__rp.ctx; if(!cx.moving){ prev=cx.ph; continue; } const ph=cx.ph;
      if((prev<0.5&&ph>=0.5)||(ph>0.47&&ph<0.53)){ const m=C.pb.measure(); let lo=1e9, li=-1; m.pts.forEach((q,i)=>{ if(q.y<lo){ lo=q.y; li=i; } }); const S=C.pb.st||{};
        rows.push(`ph=${ph.toFixed(3)} low=${lo.toFixed(3)} bone=${m.bone[li]&&m.bone[li].name} gy=${C.group.position.y.toFixed(3)} comY=${m.com.y.toFixed(3)} st=${JSON.stringify(Object.fromEntries(Object.entries(S).filter(([k,v])=>typeof v==='number').map(([k,v])=>[k,+v.toFixed(3)])))}`); }
      prev=ph; }
    return rows.join('\n'); })); await b.close(); })();
