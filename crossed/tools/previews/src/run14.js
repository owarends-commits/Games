const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await p.route(/fonts\./, r=>r.abort());
  await p.route(/GLTFLoader\.js/, r=>r.fulfill({body:fs.readFileSync('GLTFLoader.js'),contentType:'application/javascript'})); await p.route(/SkeletonUtils\.js/, r=>r.fulfill({body:fs.readFileSync('SkeletonUtils.js'),contentType:'application/javascript'}));
  await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ const d=sbNormalize(PRESETS.find(x=>x.key==="ch1house").make()); d.objects=d.objects.filter(o=>o.type!=="enemy"); ED.doc=d; edAfterLoad(false); });
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  const sim=(sec,fn)=>p.evaluate(([sec,fn])=>{ const f=fn?eval(fn):null; const out=[]; for(let i=0;i<sec*60;i++){ step(1/60,1/60); if(f){ const r=f(i); if(r!==undefined) out.push(r); } } return out; },[sec,fn]);
  const S=()=>p.evaluate(()=>{ const e=C; return `${e.state}/${e.cr&&e.cr.mode}${e.cr&&e.cr.playDead?"(dead)":""} at ${e.pos.x.toFixed(1)},${e.pos.z.toFixed(1)} spot ${e.cr&&e.cr.spot?e.cr.spot.kind+"@"+e.cr.spot.x.toFixed(1)+","+e.cr.spot.z.toFixed(1):"-"} | N ${player.pos.x.toFixed(1)},${player.pos.z.toFixed(1)} hp ${player.hp.toFixed(0)} grabbed ${!!player.grabbed}`; });
  console.log('COVER', await p.evaluate(()=>{ const c=coverSpots(); return c.filter(s=>s.kind==="under").length+' under, '+c.filter(s=>s.kind==="dark").length+' dark'; }));
  // 1) advance and hold: Crawler in the kitchen, Norah in the living room (not looking at it)
  await p.evaluate(()=>{ CFG.norah.god=true; player.pos.set(1.5,0,-1.0); player.yaw=Math.PI; camYaw=Math.PI; window.C=spawn("across:crawler",7.0,-4.0,{aware:"hunting"}); });
  const tr=await sim(14,"(i)=>{ if(i%60) return; return C.cr?C.cr.mode+':'+C.pos.x.toFixed(1)+','+C.pos.z.toFixed(1):'-'; }"); console.log('ADVANCE', tr.join(' '));
  console.log('HOLD', await S());
  // 2) ambush: walk Norah toward the held spot
  const sp=await p.evaluate(()=>({x:C.pos.x,z:C.pos.z}));
  await p.evaluate(sp=>{ player.pos.set(sp.x-3.5,0,-2.75); player.yaw=Math.PI/2; camYaw=Math.PI/2; },sp);
  const amb=await sim(4,"(i)=>{ if(!player.grabbed && C.state!=='grab'){ player.pos.x+=1.2/60; } if(C.state==='grab'&&!window.g0){ window.g0=gameTime; return 'grab at d='+Math.hypot(C.pos.x-player.pos.x,C.pos.z-player.pos.z).toFixed(2); } }");
  console.log('AMBUSH', amb.join(' '), '| grabbed', await p.evaluate(()=>!!player.grabbed));
  await p.evaluate(()=>{ if(player.grabbed) qteFail(player.grabbed,"too slow"); }); await sim(0.2); console.log('BITE log:', await p.evaluate(()=>document.getElementById('log').innerText.split('\n').slice(-2).join(' / ')));
  // 3) exposed in the open: yard, Norah looking at it from 5 m
  await p.evaluate(()=>{ clearEnemies(); player.grabbed=null; player.stumble=0; player.downT=0; player.pos.set(-8,0,-2.5); player.yaw=Math.PI/2; camYaw=Math.PI/2; window.C=spawn("across:crawler",-3,-2.5,{aware:"hunting"}); C.cr={mode:"advance",spot:{x:-3,z:-6,kind:"dark"},pause:0}; });
  const fl=await sim(2,"(i)=>{ if(i%20) return; return C.cr.mode+':'+Math.hypot(C.vel.x,C.vel.z).toFixed(2); }"); console.log('EXPOSED', fl.join(' '));
  await p.evaluate(()=>{ C.pos.set(-6.8,0,-2.5); C.cr={mode:"advance",spot:{x:-3,z:-6,kind:"dark"},pause:0}; C.swCool=0; SWARM.lastTell=-9; player.hp=100; });
  const cn=await sim(1.2,"(i)=>C.state==='swipe'?'swipe':undefined"); console.log('CORNERED swipes', cn.length, await p.evaluate(()=>document.getElementById('log').innerText.split('\n').slice(-1)[0]));
  // 4) hurt: shoot an arm
  await p.evaluate(()=>{ clearEnemies(); player.pos.set(1.5,0,-1.0); window.C=spawn("across:crawler",2.5,-4.5,{aware:"hunting"}); const m=C.P.hbChest; C.hit(m,m.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(0,0,-1)); });
  console.log('HURT', await S(), 'avoid', await p.evaluate(()=>(C.cr.avoidA*R2D).toFixed(0)));
  const ht=await sim(16,"(i)=>{ if(i%120) return; return C.cr.mode+':'+C.pos.x.toFixed(1)+','+C.pos.z.toFixed(1); }"); console.log('RETREAT→', ht.join(' '));
  // 5) no cover: open arena, all lights out, no furniture under-spots
  await p.evaluate(()=>{ clearEnemies(); world.coverSpots=[]; player.pos.set(0,0,0); window.C=spawn("across:crawler",4,4,{aware:"hunting"}); C.sees=false; });
  await sim(8); console.log('NO COVER', await S());
  await b.close(); console.log(errs.join('\n')||'no errors');
})();
