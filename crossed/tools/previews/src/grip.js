// gap between the small (left) hand and Norah's body, every frame of the hold
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [out]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto(`http://127.0.0.1:8765/cf_test.html`);
  for(let i=0;i<60&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400); await p.waitForTimeout(500);
  console.log(await p.evaluate(out=>{ document.getElementById('oPound').value=out; window.requestAnimationFrame=()=>0; __rp.renderer.render=()=>0; __rp.start('pound'); const V=THREE.Vector3;
    const pts=(C,names,step)=>{ const ms=[]; C.group.traverse(q=>{ if(q.isSkinnedMesh) ms.push(q); }); const m=ms[0], g=m.geometry, P=g.attributes.position, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, bones=m.skeleton.bones, idx=[];
      for(let i=0;i<P.count;i+=step){ let bi=0,bw=-1; for(let w=0;w<4;w++){ const x=[SW.getX(i),SW.getY(i),SW.getZ(i),SW.getW(i)][w]; if(x>bw){ bw=x; bi=[SI.getX(i),SI.getY(i),SI.getZ(i),SI.getW(i)][w]; } } if(names.includes(bones[bi].name)) idx.push(i); }
      return ()=>idx.map(i=>{ const v=new V().fromBufferAttribute(P,i); m.boneTransform(i,v); return v.applyMatrix4(m.matrixWorld); }); };
    const hand=pts(__rp.runner,["hand_L"],1), body=pts(__rp.norah.c,["chest","neck","hips"],2); const L=[]; let worst=0, n=0;
    for(let i=0;i<520;i++){ __rp.frame(1/60); const c=__rp.ctx; if(!(c.grip>=0.999)) continue; __rp.runner.group.updateMatrixWorld(true); __rp.norah.c.group.updateMatrixWorld(true);
      const H=hand(), Bd=body(); let d=1e9; for(const a of H) for(const q of Bd) d=Math.min(d,a.distanceTo(q)); worst=Math.max(worst,d); n++; if(i%20===0) L.push(`${__rp.t.toFixed(2)} gap=${d.toFixed(3)} | ${c.phase}`); }
    return L.join('\n')+`\nframes held=${n} worst gap=${worst.toFixed(3)}`; },out)); console.log(errs.join('\n')||'noerr'); await b.close(); })();
