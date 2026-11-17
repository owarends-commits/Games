const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1200,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  await p.goto('http://127.0.0.1:8765/bp_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__bp&&__bp.BR)));i++) await p.waitForTimeout(400);
  await p.waitForTimeout(300); await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; });
  const clips=(process.argv[2]||"grab,swipe,stumble,bite,drag,whip,marionette,lurcher").split(","); const shots=[];
  for(const c of clips){ if(process.argv[3]) await p.evaluate(v=>{ for(const [id,val] of Object.entries(JSON.parse(v))) document.getElementById(id).value=val; },process.argv[3]);
    await p.evaluate(c=>__bp.start(c),c); if(process.argv[5]) await p.evaluate(m=>{ document.querySelector(`[data-cam=${m}]`).click(); },process.argv[5]); let last="", n=0, pend=-1;
    const skip=+(process.argv[4]||0); for(let i=0;i<1100 && n<7;i++){ const r=await p.evaluate(()=>{ __bp.frame(1/60); return [__bp.ctx.phase||'',__bp.t]; });
      if(r[0]!==last){ last=r[0]; pend=r[1]+0.13; }
      if(pend>0 && r[1]>=pend && r[1]>=skip){ pend=-1; const f=`bq_${c}_${n}.png`; await p.screenshot({path:f,clip:{x:16,y:70,width:860,height:600}}); shots.push([f,`${c}: ${last}`]); n++; }
      if(r[1]>await p.evaluate(c=>A[c].len,c)-0.05) break; } }
  fs.writeFileSync('ap_list.json',JSON.stringify(shots)); console.log(shots.map(s=>s[1]).join('\n'));
  console.log(errs.length?errs.slice(0,6).join('\n'):'no errors'); await b.close(); })();
