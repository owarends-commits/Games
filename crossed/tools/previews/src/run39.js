const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:700}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  await p.goto('http://127.0.0.1:8765/ap_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__ap&&__ap.ac)));i++) await p.waitForTimeout(400);
  console.log(await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; __ap.start('swipe'); while(__ap.t<3.6) __ap.frame(1/60);
    const N=__ap.nora; const o=[]; N.model.traverse(x=>{ if(x.isMesh && x.geometry.type==="PlaneGeometry"){ const w=new THREE.Vector3(); x.getWorldPosition(w); const hp=new THREE.Vector3(); N.B.hips.getWorldPosition(hp); o.push(`${x.parent.name} local ${x.position.toArray().map(v=>v.toFixed(3))} world ${w.toArray().map(v=>v.toFixed(2))} hips ${hp.toArray().map(v=>v.toFixed(2))} vis ${x.visible} op ${x.material.opacity.toFixed(2)}`); } });
    // test the search directly
    const r=surfacePoint(N,"hips",new THREE.Vector3(0,0.17,0.0),new THREE.Vector3(0,0,1)); let mesh; N.model.traverse(x=>{ if(x.isSkinnedMesh) mesh=x; });
    return o.join('\n')+'\nsurface(front of hips) '+r.toArray().map(v=>v.toFixed(3))+' | bindMatrix identity '+mesh.bindMatrix.equals(new THREE.Matrix4())+' bones '+mesh.skeleton.bones.length+' hipsIndex '+mesh.skeleton.bones.indexOf(N.B.hips); }));
  await b.close(); })();
