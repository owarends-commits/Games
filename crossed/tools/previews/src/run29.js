const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1200,height:760}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  await p.goto('http://127.0.0.1:8765/rp_test.html'); for(let i=0;i<40&&!(await p.evaluate(()=>!!(window.__rp&&__rp.runner)));i++) await p.waitForTimeout(400);
  await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; document.getElementById('oGrab').value='fail'; __rp.start('grab'); });
  const shots=[];
  for(const tt of [3.5,4.9]){ await p.evaluate(tt=>{ while(__rp.t<tt) __rp.frame(1/60); },tt);
    for(const [v,pos] of [['side',[0,1.2,3.2]],['top',[0,4.2,0.6]],['three',[1.6,1.6,2.0]],['back',[1.9,1.2,-1.6]]]){
      const lab=await p.evaluate(([pos])=>{ const n=__rp.norah.c.group.position; const c=__rp.cam; c.position.set(n.x-0.2+pos[0],pos[1],pos[2]); c.lookAt(n.x-0.2,0.95,0); __rp.renderer.render(__rp.scene,c);
        // how far round her do the hands get? distance between his two hands, and their position relative to her hips
        const r=__rp.runner, h=new THREE.Vector3(), hl=new THREE.Vector3(), hr=new THREE.Vector3(); r.B.hand_L.getWorldPosition(hl); r.B.hand_R.getWorldPosition(hr); __rp.norah.c.B.hips.getWorldPosition(h);
        return `hands apart ${hl.distanceTo(hr).toFixed(2)} m, hands at height ${((hl.y+hr.y)/2).toFixed(2)} (her hips ${h.y.toFixed(2)}), behind her by ${(((hl.x+hr.x)/2)-h.x).toFixed(2)} m`; },[pos]);
      const n=`hug_${tt}_${v}.png`; await p.screenshot({path:n,clip:{x:16,y:70,width:860,height:600}}); shots.push([n,`${tt} ${v}`]); if(v==='side') console.log(tt, lab); } }
  fs.writeFileSync('hug_list.json',JSON.stringify(shots)); console.log(errs.length?errs.join('\n'):'no errors'); await b.close(); })();
