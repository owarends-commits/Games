const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:650}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | '))); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text().slice(0,160)); });
  p.on('requestfailed',r=>errs.push('REQFAIL '+r.url().slice(-60)));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(3000);
  const keys=await p.evaluate(()=>Object.keys(MODEL_LIB)); console.log(keys.length,'models in the library');
  const bad=[]; const t0=Date.now();
  for(const k of keys){ const r=await p.evaluate(async k=>{ try{ const t=performance.now(); const g=await mdlLoad(k); const c=mdlClone(k); let tri=0, sk=0; c.scene.traverse(o=>{ if(o.isMesh){ tri+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3; if(o.isSkinnedMesh) sk++; } });
      // a skinned mesh with bad weights shows as NaN or exploded bounds when posed
      let badW=0; c.scene.traverse(o=>{ if(o.isSkinnedMesh){ const W=o.geometry.attributes.skinWeight; for(let i=0;i<W.count;i++){ const s=W.getX(i)+W.getY(i)+W.getZ(i)+W.getW(i); if(!(s>0.97&&s<1.03)) badW++; } } });
      return {k,ms:Math.round(performance.now()-t),tri,sk,badW}; }catch(e){ return {k,err:String(e&&e.message||e)}; } },k);
    if(r.err||r.badW||!r.tri) bad.push(r); }
  console.log('loaded all in',((Date.now()-t0)/1000).toFixed(1),'s'); console.log('problems:',JSON.stringify(bad,null,0)); console.log(errs.slice(0,10).join('\n')||'no errors'); await b.close(); })();
