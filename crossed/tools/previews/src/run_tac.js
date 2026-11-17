const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  const map=process.argv[2]||'corridor'; await p.evaluate(()=>{ window.__L=[]; const o=window.log; window.log=function(m,c){ __L.push((typeof gameTime!=='undefined'?gameTime.toFixed(1):'')+' '+String(m).replace(/<[^>]+>/g,'')); return o.apply(this,arguments); }; });
  await p.evaluate(m=>{ const d=sbNormalize(PRESETS.find(x=>x.key===m).make()); d.objects=d.objects.filter(o=>o.type!=="enemy"); ED.doc=d; edAfterLoad(false); },map);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  const sim=(sec,fn)=>p.evaluate(([sec,fn])=>{ const f=fn?eval(fn):null; const out=[]; for(let i=0;i<sec*60;i++){ step(1/60,1/60); if(f){ const r=f(i); if(r!==undefined) out.push(r); } } return out; },[sec,fn]);
  window_logs=()=>p.evaluate(()=>{ const L=[...document.querySelectorAll('#log div, #log p, #log span')].slice(-14).map(x=>x.textContent); return L; });
  const T="(i)=>{ if(i%30) return; const e=TT; return `${(i/60).toFixed(1)} ${e.state}${e.tPh?'/'+e.tPh:''} conf=${e.tConf} anim=${e.tAnim} d=${Math.hypot(e.pos.x-player.pos.x,e.pos.z-player.pos.z).toFixed(1)} hp=${player.hp.toFixed(0)} pos=${e.pos.x.toFixed(1)},${e.pos.z.toFixed(1)}`; }";
  // 1) bold with two walkers: holds, studies, waits for an opening; then she reloads
  await p.evaluate(()=>{ CFG.norah.god=false; player.hp=100; player.pos.set(0,0,-4); player.yaw=Math.PI; window.TT=spawn("tactician",0,-9,{aware:"hunting"}); window.W1=spawn("across:walker",-1.2,-9.5,{aware:"hunting"}); window.W2=spawn("across:walker",1.2,-9.5,{aware:"hunting"}); for(const w of [W1,W2]){ w.cool=99; w.swCool=99; w.speedMul=0.05; } });
  console.log('--- bold'); console.log((await sim(5,T)).join('\n'));
  await p.evaluate(()=>{ player.rounds=0; startReload(); }); console.log('--- she reloads'); console.log((await sim(3,T)).join('\n'));
  // 2) she shoves it
  await p.evaluate(()=>{ player.hp=100; player.stumble=0; player.downT=0; TT.pos.set(player.pos.x,0,player.pos.z-1.3); TT.state="chase"; TT.tc.ctr=0; player.yaw=Math.PI; player.shoveCd=0; shove(); });
  console.log('--- shove'); console.log((await sim(2.5,T)).join('\n'));
  // 3) kill one walker: upper hand; kill the other: loses its nerve, flees out of sight, then hides at a choke
  await p.evaluate(()=>{ W1.die(new THREE.Vector3(0,0,1)); }); console.log('--- one ally left'); console.log((await sim(2,T)).join('\n'));
  await p.evaluate(()=>{ W2.die(new THREE.Vector3(0,0,1)); }); console.log('--- alone'); console.log((await sim(9,T)).join('\n'));
  console.log('DBG', await p.evaluate(()=>{ const e=TT, pp=player.pos; const g=e.tSpot||e.tGoal; return JSON.stringify({spot:e.tSpot, mv:e.mvGoal, heading:e.heading, yaw:e.yaw, vel:[e.vel.x,e.vel.z], goal:g, pos:[e.pos.x,e.pos.z], desired:e.desired, seen:lineOfSight(e.pos.x,e.pos.z,pp.x,pp.z,false), hide:tacHideFrom(e,null), doors:world.doors.map(d=>[+d.hx.toFixed(1),+d.hz.toFixed(1),+d.ang.toFixed(2),d.locked]), route:g?route(e.pos.x,e.pos.z,g.x,g.z):null, bounds:world.bounds}); }));
  console.log('chokes', await p.evaluate(()=>tacChokes().length+' '+JSON.stringify(tacChokes().slice(0,6).map(c=>[c.kind,+c.x.toFixed(1),+c.z.toFixed(1)]))));
  // 4) she walks toward its hiding spot: ambush
  await p.evaluate(()=>{ window.S0=TT.tSpot||{x:TT.pos.x,z:TT.pos.z}; });
  console.log('--- she comes by'); console.log((await sim(8,"(i)=>{ const e=TT; const dx=e.pos.x-player.pos.x, dz=e.pos.z-player.pos.z, d=Math.hypot(dx,dz); if(d>1.0 && !player.grabbed && e.state!=='theadbutt'){ const s=1.4/60; player.pos.x+=dx/d*s; player.pos.z+=dz/d*s; collide(player.pos,0.3); player.yaw=Math.atan2(dx,dz); } if(player.grabbed && player.grabbed.qte){ } if(i%30) return; return `${(i/60).toFixed(1)} ${e.state}${e.tPh?'/'+e.tPh:''} d=${d.toFixed(1)} grabbed=${!!player.grabbed} hp=${player.hp.toFixed(0)}`; }")).join('\n'));
  await p.evaluate(()=>{ if(player.grabbed) qteFail(player.grabbed,"too slow"); }); console.log('--- failed escape'); console.log((await sim(2,"(i)=>{ if(i%20) return; const e=TT; return `${(i/60).toFixed(2)} ${e.state} hp=${player.hp.toFixed(0)}`; }")).join('\n'));
  // 4b) regroup: alone, but a Walker 14 m off: it scurries out of sight toward it
  await p.evaluate(()=>{ clearEnemies(); player.grabbed=null; player.dead=false; player.hp=100; player.downT=0; player.stumble=0; player.pos.set(0,0,-6); player.yaw=Math.PI; window.TT=spawn("tactician",0,-9,{aware:"hunting"}); window.WF=spawn("across:walker",3.5,1.5,{aware:"unaware"}); WF.speedMul=0.01; });
  console.log('--- regroup'); console.log((await sim(9,"(i)=>{ if(i%45) return; const e=TT; return `${(i/60).toFixed(1)} ${e.state} goal=${e.tGoal?e.tGoal.x.toFixed(1)+','+e.tGoal.z.toFixed(1):'-'} mv=${e.mvGoal?e.mvGoal.x.toFixed(1)+','+e.mvGoal.z.toFixed(1):'-'} pos=${e.pos.x.toFixed(1)},${e.pos.z.toFixed(1)} toAlly=${Math.hypot(e.pos.x-WF.pos.x,e.pos.z-WF.pos.z).toFixed(1)} seen=${lineOfSight(e.pos.x,e.pos.z,player.pos.x,player.pos.z,false)}`; }")).join('\n'));
  // 4c) upper hand: one ally, which dies
  await p.evaluate(()=>{ clearEnemies(); player.dead=false; player.hp=100; player.pos.set(0,0,-4); window.TT=spawn("tactician",0,-7.5,{aware:"hunting"}); window.W1=spawn("across:walker",1,-8,{aware:"hunting"}); W1.speedMul=0.01; W1.cool=99; });
  await sim(1.5); console.log('upper conf', await p.evaluate(()=>TT.tConf)); await p.evaluate(()=>W1.die(new THREE.Vector3(0,0,1)));
  console.log('--- its one ally dies'); console.log((await sim(2,"(i)=>{ if(i%20) return; const e=TT; return `${(i/60).toFixed(2)} ${e.state} conf=${e.tConf} anim=${e.tAnim}`; }")).join('\n'));
  // 5) head shot topple
  await p.evaluate(()=>{ clearEnemies(); player.grabbed=null; player.dead=false; player.hp=100; player.pos.set(0,0,-4); window.TT=spawn("tactician",0,-7,{aware:"hunting"}); spawn("across:walker",-1,-8,{aware:"hunting"}).speedMul=0.01; spawn("across:walker",1,-8,{aware:"hunting"}).speedMul=0.01; });
  await sim(1.5); await p.evaluate(()=>{ CFG.tactician.headTopple=1; TT.hit(TT.P.hbHead,TT.P.hbHead.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(0,0,-1)); });
  console.log('--- head shot'); console.log((await sim(5,"(i)=>{ if(i%20) return; const e=TT; return `${(i/60).toFixed(2)} ${e.state} rise=${(e.tRise||0).toFixed(2)} headLow=${(tacHead(e)?tacHead(e).low():-1).toFixed(2)}`; }")).join('\n'));
  console.log('LOG', (await p.evaluate(()=>__L.slice(-40).join('\n'))));
  console.log(errs.slice(0,8).join('\n')||'noerr'); await b.close(); })();
