const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:600}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  await p.goto('http://127.0.0.1:8765/rp_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  const res=await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; __rp.start('grab'); const R=__rp.runner, N=__rp.norah;
    N.c.group.visible=true; applyPose(N.c,NP.crushed(0,0.6)); N.c.group.position.set(3.2,0.08,0); N.c.group.rotation.set(0,-Math.PI/2,0); retarget(N.c);
    const hip=new THREE.Vector3(); N.c.B.hips.getWorldPosition(hip); const sp=new THREE.Vector3(); N.c.B.chest.getWorldPosition(sp);
    const waistY=hip.y+0.12;
    let best=null;
    for(const d of [0.16,0.2,0.24]) for(const hd of [0.34,0.4,0.46]) for(const ax of [0.2,0.35,0.5]) for(const ay of [-1.3,-1.5,-1.7,-1.9]) for(const e of [1.5,1.75,2.0,2.3]) for(const sp of [0.2,0.4]){
      const J=P0(); J.hd=hd; J.hp=0.15; J.sp=sp; J.nx=0.3; J.ny=0.5; J.aLz=J.aRz=1.38; J.aLy=J.aRy=ay; J.aLx=J.aRx=ax; J.eL=J.eR=e; J.lLx=-0.6; J.kL=1.0; J.lRx=0.35; J.kR=1.0; J.fR=-0.4; J.lLz=J.lRz=0.2;
      applyPose(R,J); R.group.position.set(3.2-d,0,0); R.group.rotation.set(0,Math.PI/2,0); retarget(R);
      const hl=new THREE.Vector3(), hr=new THREE.Vector3(), el=new THREE.Vector3(); R.B.hand_L.getWorldPosition(hl); R.B.hand_R.getWorldPosition(hr); R.B.forearm_L.getWorldPosition(el);
      // hands should meet behind her waist; elbows out to the side of her body
      const mid=hl.clone().add(hr).multiplyScalar(0.5);
      const cost=Math.abs(mid.x-(hip.x+0.12))*3 + Math.abs(mid.y-waistY)*2 + hl.distanceTo(hr)*1.5 + Math.abs(mid.z)*1 + Math.max(0,0.16-Math.abs(el.z))*3;
      if(!best||cost<best.cost) best={cost,d,hd,ax,ay,e,sp, apart:hl.distanceTo(hr).toFixed(2), behind:(mid.x-hip.x).toFixed(2), y:mid.y.toFixed(2), waistY:waistY.toFixed(2), elbowOut:Math.abs(el.z).toFixed(2)}; }
    return best; });
  console.log(JSON.stringify(res)); await b.close(); })();
