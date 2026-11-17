const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.goto('http://127.0.0.1:8765/bp_t.html'); await p.waitForTimeout(800);
  console.log(JSON.stringify(await p.evaluate(k=>__go(k),'m/bcross/brute/'+(process.argv[2]||'brute_twoarm_m01')+'.json')));
  await p.evaluate(()=>__shot([3.2,2.0,5.2])); await p.screenshot({path:'bp_rest.png'});
  // pose test: lift the left foot forward and up, plant the right one further out; burst two lumps; bend the little arms
  console.log(await p.evaluate(()=>{ const m=R.mesh; m.updateMatrixWorld(true); stumpIK(R,"L",new THREE.Vector3(1.0,1.0,1.4),new THREE.Vector3(1,0.2,-0.5),0.3); stumpIK(R,"R",new THREE.Vector3(-1.3,0,0.4),new THREE.Vector3(-1,0,-0.3),0);
    R.lumps.filter(l=>l.side==="L").slice(0,2).forEach(l=>l.b.scale.setScalar(0.001)); for(const a of R.arms){ a.base.rotation.z=0.8; }
    const f=wposB(R,"ftL"); return 'footL now '+f.toArray().map(v=>v.toFixed(2)); }));
  await p.evaluate(()=>__shot([3.2,2.0,5.2])); await p.screenshot({path:'bp_pose.png'});
  console.log(errs.length?errs.join('\n'):'no errors'); await b.close(); })();
