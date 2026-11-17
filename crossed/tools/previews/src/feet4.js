const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [clip,secs]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/'+(process.env.P||'tac')+'_test.html'); for(let i=0;i<60&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  console.log(await p.evaluate(([clip,secs])=>{ window.requestAnimationFrame=()=>0; __rp.renderer.render=()=>0; __rp.start(clip);
    let mesh; __rp.runner.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); const g=mesh.geometry, si=g.attributes.skinIndex, sw=g.attributes.skinWeight, bones=mesh.skeleton.bones;
    const F={L:[],R:[]}; for(let i=0;i<g.attributes.position.count;i++){ const n=bones[si.getX(i)].name; if(sw.getX(i)>0.5&&(n==="foot_L"||n==="foot_R")) F[n.slice(-1)].push(i); }
    const v=new THREE.Vector3(); const rows=[]; let gapMax={L:0,R:0}, both=0, frames=0, tiltMax={L:0,R:0};
    for(let k=0;k<secs*60;k++){ __rp.frame(1/60); mesh.updateMatrixWorld(true); const r={};
      for(const s of ["L","R"]){ let lo=1e9, hi=-1e9; for(const i of F[s]){ v.fromBufferAttribute(g.attributes.position,i); mesh.boneTransform(i,v); v.applyMatrix4(mesh.matrixWorld); lo=Math.min(lo,v.y); } r[s]=lo; }
      frames++; if(r.L<0.02&&r.R<0.02) both++; if(__rp.ctx.moving&&((__rp.ctx.ph>0.46&&__rp.ctx.ph<0.56))) rows.push(`${__rp.t.toFixed(2)} ${__rp.ctx.phase.slice(0,22).padEnd(22)} L=${r.L.toFixed(3)} R=${r.R.toFixed(3)} fl=${footLow(__rp.runner,"L").toFixed(3)} fr=${footLow(__rp.runner,"R").toFixed(3)} np=${__rp.ctx.noPlant} mv=${__rp.ctx.moving}`); }
    return rows.join('\n')+`\nboth feet down ${(100*both/frames).toFixed(0)}% of frames`; },[clip,+secs||7])); console.log(errs.join('|')||'noerr'); await b.close(); })();
