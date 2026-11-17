const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await p.route(/fonts\./, r=>r.abort());
  await p.route(/GLTFLoader\.js/, r=>r.fulfill({body:fs.readFileSync('GLTFLoader.js'),contentType:'application/javascript'})); await p.route(/SkeletonUtils\.js/, r=>r.fulfill({body:fs.readFileSync('SkeletonUtils.js'),contentType:'application/javascript'}));
  await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ const d=sbNormalize(PRESETS.find(x=>x.key==="open").make()); d.objects=d.objects.filter(o=>o.type!=="enemy"); ED.doc=d; edAfterLoad(false); });
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  // advance the simulation deterministically: step() with fixed dt
  const sim=(sec,fn)=>p.evaluate(([sec,fn])=>{ const f=fn?eval(fn):null; const out=[]; for(let i=0;i<sec*60;i++){ step(1/60,1/60); if(f){ const r=f(i); if(r!==undefined) out.push(r); } } return out; },[sec,fn]);
  // 1) gait: Walker 10 m away, record speed vs distance
  await p.evaluate(()=>{ CFG.norah.god=true; player.pos.set(0,0,8); const e=spawn("across:walker",0,-2,{aware:"hunting"}); e.cool=99; e.swCool=99; window.W=e; });
  const g=await sim(8,"(i)=>{ if(i%10) return; const e=W; const d=Math.hypot(e.pos.x-player.pos.x,e.pos.z-player.pos.z); return [+d.toFixed(1), e.gait.mode, +Math.hypot(e.vel.x,e.vel.z).toFixed(2)]; }");
  const far=g.filter(r=>r[0]>4.5).map(r=>r[2]), near=g.filter(r=>r[0]<=4&&r[0]>1.2);
  console.log('GAIT far speeds', far.slice(-8).join(' '), '| near modes', [...new Set(near.map(r=>r[1]))].join(','), 'near speeds', near.map(r=>r[2]).join(' '));
  // 2) swarm tells: 6 walkers around Norah
  await p.evaluate(()=>{ clearEnemies(); SWARM.lastTell=-9; window.tells=[]; player.pos.set(0,0,0); for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; spawn("across:walker",Math.sin(a)*2.2,Math.cos(a)*2.2,{aware:"hunting"}); } window.prevStates=enemies.map(e=>e.state); });
  const t=await sim(6,"(i)=>{ const r=[]; enemies.forEach((e,k)=>{ const was=prevStates[k]; if(e.state!==was && ['windup','swipe','grab','bite'].includes(e.state)) r.push([+gameTime.toFixed(2),e.state]); prevStates[k]=e.state; }); return r.length?r:undefined; }");
  const flat=t.flat(); const times=flat.map(x=>x[0]).sort((a,b)=>a-b); const gaps=times.slice(1).map((x,i)=>+(x-times[i]).toFixed(2));
  console.log('TELLS', flat.length, 'starts; attackers', new Set(flat.map(x=>x)).size, '| min gap', Math.min(...gaps), '| kinds', [...new Set(flat.map(x=>x[1]))].join(','));
  // 3) bite on a downed Norah
  await p.evaluate(()=>{ clearEnemies(); SWARM.lastTell=-9; player.pos.set(0,0,0); player.hp=100; const e=spawn("across:walker",0,-1.0,{aware:"hunting"}); e.cool=99; e.swCool=99; window.W=e; player.downT=1.2; player.stumble=1.2; });
  const bt=await sim(1.2,"(i)=>W.state==='bite'?'bite':undefined");
  console.log('BITE states', bt.length, 'hp', await p.evaluate(()=>player.hp), await p.evaluate(()=>document.getElementById('log').innerText.split('\n').slice(-1)[0]));
  // 4) mob tracking: Walkers lose her, then a noise elsewhere
  await p.evaluate(()=>{ clearEnemies(); player.pos.set(-8,0,-9); world.crowd=null; window.ws=[]; for(let i=0;i<3;i++){ const e=spawn("across:walker",6+i*0.8,6,{aware:"hunting"}); e.lastKnown={x:6,z:-6}; e.lostT=2; ws.push(e); } crowdNote(6,-6,"sight"); player.pos.set(-11,0,-9.5); });
  await sim(3); const m1=await p.evaluate(()=>ws.map(e=>`${e.aware}@${e.pos.x.toFixed(1)},${e.pos.z.toFixed(1)}`).join(' '));
  await p.evaluate(()=>makeNoise(-5,6,20,"test",true)); await sim(5);
  const m2=await p.evaluate(()=>ws.map(e=>`${e.aware}@${e.pos.x.toFixed(1)},${e.pos.z.toFixed(1)}`).join(' ')+' crowd '+JSON.stringify(world.crowd));
  console.log('MOB toward (6,-6):', m1, '| after noise at (-5,6):', m2);
  // 5) wounds slow
  console.log('WOUND', await p.evaluate(()=>{ clearEnemies(); const e=spawn("across:walker",0,-4,{aware:"hunting"}); e.hp=50; const s0=e.speedNow(); for(let i=0;i<2;i++){ e.hit(e.P.hbChest,e.pos.clone(),new THREE.Vector3(0,0,-1)); } return (e.speedNow()/s0).toFixed(3); }));
  await b.close(); console.log(errs.join('\n')||'no errors');
})();
