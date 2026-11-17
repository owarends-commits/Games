const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:700}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  await p.goto('http://127.0.0.1:8765/ap_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__ap&&__ap.ac)));i++) await p.waitForTimeout(400);
  const out=await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; __ap.start('bite'); const o=[]; let last="";
    for(let i=0;i<620;i++){ __ap.frame(1/60); const c=__ap.ctx; if(!/wipe|stare/.test(c.phase||'')) continue; if(i%8) continue;
      const A=__ap.ac, h=new THREE.Vector3(), m=mouthPos(A); A.B.hand_R.getWorldPosition(h);
      // lateral offset of the hand from the mouth, in the ACROSS's own frame (+ = its left)
      const yaw=A.group.rotation.y, left=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)).negate(); const d=h.clone().sub(m);
      o.push(`${__ap.t.toFixed(2)} ${c.phase.slice(0,14)} hand side ${d.dot(left).toFixed(2)} (+=its left) fwd ${(d.x*Math.sin(yaw)+d.z*Math.cos(yaw)).toFixed(2)} up ${d.y.toFixed(2)} | handBlood ${A.handBlood?A.handBlood.material.opacity.toFixed(2):'-'}`); }
    return o.join('\n'); });
  console.log(out); await b.close(); })();
