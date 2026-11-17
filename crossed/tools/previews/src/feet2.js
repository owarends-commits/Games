const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage();
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/tac_test.html'); for(let i=0;i<60&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  console.log(await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; __rp.renderer.render=()=>0; __rp.start("walk"); const C=__rp.runner; const st={dbl:0,dblOk:0,single:0,singleOk:0,worst:0}; const rows=[];
    for(let k=0;k<10*60;k++){ __rp.frame(1/60); const cx=__rp.ctx; if(!cx.moving) continue; const ph=cx.ph, a=ph%1, bb=(ph+0.5)%1, inL=a<TWALK.stance, inR=bb<TWALK.stance; const L=footLow(C,"L"), R=footLow(C,"R");
      if(inL&&inR){ st.dbl++; if(L<0.012&&R<0.012) st.dblOk++; else { st.worst=Math.max(st.worst,Math.max(L,R)); if(rows.length<8) rows.push(`dbl ph=${ph.toFixed(2)} L=${L.toFixed(3)} R=${R.toFixed(3)}`); } }
      else { st.single++; const s=inL?L:R; if(s<0.012) st.singleOk++; else if(rows.length<8) rows.push(`single ${inL?'L':'R'} ph=${ph.toFixed(2)} L=${L.toFixed(3)} R=${R.toFixed(3)}`); } }
    return "kBias="+JSON.stringify(kBias)+" "+JSON.stringify(st)+'\n'+rows.join('\n'); })); await b.close(); })();
