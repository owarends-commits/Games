// node shshot.js <seconds> <shot times> : the split-head across a real doorway in Norah's house, side camera renders
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [secs,ts]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:640}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  const info=await p.evaluate(()=>{ clearEnemies(); const P=world.portals; let pick=null;
    for(let i=0;i<P.length&&!pick;i++){ const A=P[i], B=P[A.pair]; if(!B||A.win||B.win) continue; const ux=(A.x-B.x)/1.4, uz=(A.z-B.z)/1.4;
      const body={x:A.x+ux*0.9,z:A.z+uz*0.9}, pl={x:B.x-ux*2.6,z:B.z-uz*2.6};
      if(wallsClear(A.x,A.z,body.x,body.z)&&wallsClear(B.x,B.z,pl.x,pl.z)) pick={A,B,body,pl,ux,uz}; }
    const k=pick; player.pos.set(k.pl.x,0,k.pl.z); player.yaw=Math.atan2(k.ux,k.uz); window.__k=k;
    window.__e=spawn("splithead",k.body.x,k.body.z,{}); return JSON.stringify(k); });
  console.log(info);
  for(let i=0;i<40&&!(await p.evaluate(()=>__e.pv&&__e.pv.ready));i++) await p.waitForTimeout(250);
  await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; CFG.world.ambient=1; });
  const shots=(ts||'').split(',').filter(Boolean).map(Number); let k=0; const log=[];
  for(let i=0;i<Math.round(+secs*60);i++){ const r=await p.evaluate(()=>{ if(player.grabbed) qteTick(1/60); step(1/60,1/60); const e=__e,b=e.pv, h=b.C.B.head.getWorldPosition(new THREE.Vector3());
      return {t:+b.t.toFixed(2),clip:b.clipName,ph:b.ctx.phase,mode:b.ctx.mode,hp:player.hp|0,head:[+h.x.toFixed(2),+h.y.toFixed(2),+h.z.toFixed(2)],hd:+Math.hypot(h.x-player.pos.x,h.z-player.pos.z).toFixed(2)}; });
    if(i%30===0) log.push(JSON.stringify(r));
    if(k<shots.length&&i/60>=shots[k]){ await p.evaluate(()=>{ const k=__k, cx=(k.A.x+k.B.x)/2, cz=(k.A.z+k.B.z)/2, cam=new THREE.PerspectiveCamera(55,1000/640,0.05,100);
        cam.position.set(cx-k.uz*2.2-k.ux*0.6, 5.2, cz+k.ux*2.2-k.uz*0.6); cam.lookAt(cx-k.ux*1.2,0.5,cz-k.uz*1.2); const hid=[]; scene.traverse(o=>{ if(o.isMesh&&o.visible&&!o.isSkinnedMesh){ const bb=new THREE.Box3().setFromObject(o); if(bb.max.y>1.6&&bb.min.y<1.0&&(bb.max.x-bb.min.x<0.5||bb.max.z-bb.min.z<0.5)){ o.visible=false; hid.push(o); } } }); setTimeout(()=>0); window.__hid=hid; for(const o of scene.children) if(o.isAmbientLight) o.intensity=1.2;
        const hl=new THREE.HemisphereLight(0xffffff,0x444444,1.4); scene.add(hl); const walls=[]; scene.traverse(o=>{ if(o.isMesh&&o.position.y>1.0&&o.geometry&&o.geometry.parameters&&o.geometry.parameters.height>2&&o.visible){ walls.push(o); } });
        renderer.render(scene,cam); scene.remove(hl); for(const o of window.__hid) o.visible=true; });
      await p.screenshot({path:`/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/sh_${k}.png`}); k++; } }
  console.log(log.join('\n')); console.log(errs.slice(0,8).join('\n')||'no errors'); await b.close(); })();
