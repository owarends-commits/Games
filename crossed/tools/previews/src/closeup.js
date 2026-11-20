// node closeup.js <type> <bone> <dist> [out] : a close render of a spawned creature's bone region (live model)
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [type,bone,dist,out]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:700}});
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  await p.evaluate(t=>{ clearEnemies(); CFG.world.freezeAI=true; window.__e=spawn(t,player.pos.x+Math.sin(player.yaw)*4,player.pos.z+Math.cos(player.yaw)*4,{}); },type);
  for(let i=0;i<60&&!(await p.evaluate(()=>{ const e=__e; return e.pv?e.pv.ready:!!(e.skin&&e.skin.model); }));i++) await p.waitForTimeout(250);
  await p.evaluate(u=>{ window.__up=u; },+(process.env.UP||0)); await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; for(let i=0;i<+(window.__steps||40);i++) step(1/60,1/60); });
  for(const [i,az] of [[0,0.6],[1,2.4],[2,-1.6]]) { await p.evaluate(([bone,dist,az])=>{ const e=__e, root=e.pvType==="hob"?PV_HOB.H.group:e.pv?e.pv.C.group:e.skin.model; let B=null; root.traverse(o=>{ if(o.isBone&&o.name===bone) B=o; }); const c=(B||root).getWorldPosition(new THREE.Vector3()); c.y+=+(window.__up||0);
      const cam=new THREE.PerspectiveCamera(35,900/700,0.01,100); cam.position.set(c.x+Math.sin(az)*dist,c.y+dist*0.3,c.z+Math.cos(az)*dist); cam.lookAt(c); const hid=[]; scene.traverse(o=>{ if(o.isMesh&&!o.isSkinnedMesh&&o.visible){ hid.push(o); o.visible=false; } });
      const hl=new THREE.HemisphereLight(0xffffff,0x666666,1.5); scene.add(hl); const bg=scene.background; scene.background=new THREE.Color(0x5a6a7a); const fog=scene.fog; scene.fog=null; renderer.render(scene,cam); scene.remove(hl); scene.background=bg; scene.fog=fog; for(const o of hid) o.visible=true; },[bone,+dist,az]);
    await p.screenshot({path:`/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/${out||type}_${i}.png`}); }
  await b.close(); })();
