// node cdrop.js [mash] : a Contortionist climbs a real wall, hangs, and drops on Norah when she walks under it
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const mash=process.argv[2]==="mash"; const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  // a spot 1.6-2.4 m from a tall wall, with Norah far off
  console.log(await p.evaluate(()=>{ clearEnemies(); let spot=null; const P=world.portals;
    for(let i=0;i<P.length&&!spot;i++){ for(const a of [0,1,2,3,4,5,6,7]){ const d=new THREE.Vector3(Math.sin(a*Math.PI/4),0,Math.cos(a*Math.PI/4)); const s={x:P[i].x+d.x*1.2,z:P[i].z+d.z*1.2,pos:new THREE.Vector3(P[i].x+d.x*1.2,0,P[i].z+d.z*1.2)}; const w=cnWall(s); if(w&&w.d>1.4&&w.d<2.6){ spot={s,w}; break; } } }
    window.__spot=spot; if(!spot) return "no wall spot"; window.__e=spawn("contortionist",spot.s.x,spot.s.z,{}); player.pos.set(spot.s.x-spot.w.dir.x*7,0,spot.s.z-spot.w.dir.z*7); return "wall at "+spot.w.d.toFixed(2)+" top "+spot.w.top.toFixed(2); }));
  for(let i=0;i<40&&!(await p.evaluate(()=>__e.pv&&__e.pv.ready));i++) await p.waitForTimeout(250);
  await p.evaluate(m=>{ window.requestAnimationFrame=()=>0; window.__mash=m; const e=__e, w=__spot.w; e.pvMem.style="crawl"; e.pv.play("drop",{dir:w.dir,outSel:{oDrop:"pending"}}); e.pv.ctx.x=4.6-w.d; e.pv.ctx.wallTop=Math.max(0.6,w.top-1.75); e.pv.anchor(w.at,w.dir,4.6,0); e.pvMem.dropGive=60; e.pvMem.cool=99; },mash);
  const log=[]; let moved=false, prev="";
  for(let i=0;i<60*16;i++){ const r=await p.evaluate(()=>{ if(window.__mash&&player.grabbed&&player.grabbed.qte){ const q=player.grabbed.qte; if(Math.random()<0.25){ if(q.mode==="mash"){ q.fill+=CFG.across.mashPer; if(q.fill>=1) pushOff(player.grabbed); } else { q.i++; if(q.i>=q.seq.length) pushOff(player.grabbed); else q.t=q.win; } } }
      if(player.grabbed) qteTick(1/60); step(1/60,1/60); const e=__e,b=e.pv; const hy=b.C.B.hips.getWorldPosition(new THREE.Vector3()).y;
      return {t:+b.ct.toFixed(1),clip:b.clipName,ph:(b.ctx.phase||"").slice(0,48),T:b.ctx.T&&b.ctx.T.ph,hipY:+hy.toFixed(2),hp:player.hp|0,grab:!!player.grabbed,d:+Math.hypot(e.pos.x-player.pos.x,e.pos.z-player.pos.z).toFixed(2)}; });
    const key=r.clip+r.ph+r.grab+r.hp; if(key!==prev){ log.push(JSON.stringify(r)); prev=key; }
    if(r.T==="hang"&&!moved&&r.t>0){ moved=true; await p.evaluate(()=>{ const b=__e.pv, u=b.toWorld(new THREE.Vector3(4.6-1.2,0,0)); player.pos.set(u.x,0,u.z); }); log.push("-- Norah walks in under it"); }
    if(i===60*3||(r.T==="hang"&&i%60===0)||(r.ph.startsWith("pins")&&i%90===0)) await p.evaluate(()=>{ const e=__e, f=__spot.w.dir, r=new THREE.Vector3(-f.z,0,f.x), cam=new THREE.PerspectiveCamera(50,900/600,0.05,100), c=new THREE.Vector3(e.pos.x,1.2,e.pos.z); const W=__spot.w.at; cam.position.set(W.x-f.x*3.2+r.x*2.6,1.7,W.z-f.z*3.2+r.z*2.6); cam.lookAt(W.x-f.x*0.8,1.1,W.z-f.z*0.8); const hid=[]; scene.traverse(o=>{ if(o.isMesh&&o.visible&&o!==__spot.w.obj&&!o.isSkinnedMesh){ const bb=new THREE.Box3().setFromObject(o); if(bb.max.y>1.2&&bb.min.y<1.0){ o.visible=false; hid.push(o); } } }); const hl=new THREE.HemisphereLight(0xffffff,0x555555,1.4); scene.add(hl); renderer.render(scene,cam); scene.remove(hl); for(const o of hid) o.visible=true; }).then(()=>p.screenshot({path:`/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/cdrop_${i}.png`}));
    if(r.clip==="crawl"&&moved){ log.push("-- back to crawling"); break; } }
  console.log(log.join('\n')); console.log(errs.slice(0,6).join('\n')||'no errors'); await b.close(); })();
