// node cnclose.js clip from to step angle(deg) dist [opts] -> fr_*.png + fr_list.json
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [clip,from,to,stepS,ang,dist,opts]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/'+(process.env.P||'cn')+'_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  if(process.env.M){ await p.evaluate(m=>{ const s=document.getElementById('oModel'); s.value=m; s.dispatchEvent(new Event('change')); },process.env.M); await p.waitForTimeout(600); for(let i=0;i<40&&!(await p.evaluate(()=>document.getElementById('load').hidden));i++) await p.waitForTimeout(400); await p.waitForTimeout(400); }
  if(opts) await p.evaluate(v=>{ for(const [id,val] of Object.entries(JSON.parse(v))) document.getElementById(id).value=val; },opts);
  await p.evaluate(([c,f])=>{ window.__FOC=f; window.requestAnimationFrame=()=>0; __rp.start(c); },[clip,process.env.FOC||""]);
  const shots=[]; for(let tt=+from; tt<=+to+1e-6; tt+= +stepS){ const ph=await p.evaluate(([tt,ang,dist])=>{ while(__rp.t<tt) __rp.frame(1/60); const R=__rp.runner; const c=(window.__FOC==="n"?__rp.norah.c.R:R.R).hips.getWorldPosition(new THREE.Vector3()); const a=ang*Math.PI/180;
      __rp.cam.position.set(c.x+Math.sin(a)*dist,Math.max(0.4,c.y+0.5),c.z+Math.cos(a)*dist); __rp.cam.lookAt(c.x,c.y*0.7,c.z); __rp.renderer.render(__rp.scene,__rp.cam); return __rp.ctx.phase; },[tt,+ang,+dist]);
    const f=`fr_${shots.length}.png`; await p.screenshot({path:f,clip:{x:16,y:62,width:640,height:560}}); shots.push([f,tt.toFixed(2)+' '+ph]); }
  fs.writeFileSync('fr_list.json',JSON.stringify(shots)); console.log(errs.join('\n')||'ok '+shots.length); await b.close(); })();
