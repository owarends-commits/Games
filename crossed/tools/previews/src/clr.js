// clearance of the club arm (forearm + hand vertices) from his torso during the grab wind-up
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto(`http://127.0.0.1:8765/cf_test.html`);
  for(let i=0;i<60&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400); await p.waitForTimeout(500);
  console.log(await p.evaluate(()=>{ document.getElementById('oPound').value='beaten'; window.requestAnimationFrame=()=>0; __rp.renderer.render=()=>0; __rp.start('pound'); const L=[]; const V=THREE.Vector3;
    const C=__rp.runner, ms=[]; C.group.traverse(q=>{ if(q.isSkinnedMesh) ms.push(q); }); const mesh=ms[0], g=mesh.geometry, P=g.attributes.position, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, bones=mesh.skeleton.bones;
    const dom=i=>{ let bi=0,bw=-1; for(let w=0;w<4;w++){ const x=[SW.getX(i),SW.getY(i),SW.getZ(i),SW.getW(i)][w]; if(x>bw){ bw=x; bi=[SI.getX(i),SI.getY(i),SI.getZ(i),SI.getW(i)][w]; } } return bones[bi].name; };
    const arm=[], torso=[]; for(let i=0;i<P.count;i+=3){ const n=dom(i); if(n==="hand_R") arm.push(i); else if(n==="hips"||n==="chest") torso.push(i); }
    const wp=i=>{ const v=new V().fromBufferAttribute(P,i); mesh.boneTransform(i,v); return v.applyMatrix4(mesh.matrixWorld); };
    for(let i=0;i<480;i++){ __rp.frame(1/60); const c=__rp.ctx; if(i%2||!c.ik) continue; C.group.updateMatrixWorld(true);
      // penetration: arm vertices inside the torso's horizontal footprint at their height (torso vertices' convex radius around the spine)
      const T=torso.map(wp), A=arm.map(wp); let worst=0; for(const a of A){ const near=T.filter(q=>Math.abs(q.y-a.y)<0.05); if(near.length<6) continue; let cx=0,cz=0; for(const q of near){ cx+=q.x; cz+=q.z; } cx/=near.length; cz/=near.length; let r=0; for(const q of near) r=Math.max(r,Math.hypot(q.x-cx,q.z-cz)); const d=Math.hypot(a.x-cx,a.z-cz); worst=Math.max(worst,r-d); }
      L.push(`${__rp.t.toFixed(2)} ${c.phase} armInsideTorso=${worst.toFixed(3)}`); } return L.join('\n'); })); console.log(errs.join('\n')||'noerr'); await b.close(); })();
