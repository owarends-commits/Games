const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:600}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'})); await p.route(/fonts\./, r=>r.abort());
  await p.route(/GLTFLoader\.js/, r=>r.fulfill({body:fs.readFileSync('GLTFLoader.js'),contentType:'application/javascript'})); await p.route(/SkeletonUtils\.js/, r=>r.fulfill({body:fs.readFileSync('SkeletonUtils.js'),contentType:'application/javascript'}));
  await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ const d=sbNormalize(PRESETS.find(x=>x.key==="open").make()); d.objects=d.objects.filter(o=>o.type!=="enemy"); ED.doc=d; edAfterLoad(false); });
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok');
  const sim=(sec,fn)=>p.evaluate(([sec,fn])=>{ const f=fn?eval(fn):null; const out=[]; for(let i=0;i<sec*60;i++){ step(1/60,1/60); if(f){ const r=f(i); if(r!==undefined) out.push(r); } } return out; },[sec,fn]);
  const L=()=>p.evaluate(()=>document.getElementById('log').innerText.split('\n').slice(-2).join(' / '));
  // 1) steady approach
  await p.evaluate(()=>{ CFG.norah.god=true; player.pos.set(0,0,8); window.MT=spawn("across:matron",0,-1,{aware:"hunting"}); });
  const sp=await sim(4,"(i)=>i%30?undefined:Math.hypot(MT.vel.x,MT.vel.z).toFixed(2)"); console.log('APPROACH speeds', sp.join(' '), '| trips', await p.evaluate(()=>MT.trips||0));
  // 2) hug: mash out
  await p.evaluate(()=>{ MT.pos.set(0,0,6.9); MT.yaw=0; player.pos.set(0,0,8); player.downT=0; player.grabbed=null; MT.mc.hug=0; MT.mc.shove=9; SWARM.lastTell=-9; });
  const hg=await sim(1.2,"(i)=>player.grabbed&&!window.h1?(window.h1=1,'hugged: '+player.grabbed.how+' mode '+player.grabbed.qte.mode):undefined"); console.log('HUG', hg.join(' '));
  console.log('MASH', await p.evaluate(()=>{ for(let i=0;i<14&&player.grabbed;i++){ dispatchEvent(new KeyboardEvent('keydown',{code:'KeyE'})); dispatchEvent(new KeyboardEvent('keyup',{code:'KeyE'})); for(let k=0;k<5;k++) step(1/60,1/60); } return 'free '+!player.grabbed; }), await L());
  // 3) shove when too close
  await p.evaluate(()=>{ player.downT=0; player.stumble=0; MT.state="chase"; MT.stagger=0; MT.gait.mode="shamble"; MT.pos.set(0,0,7.3); MT.mc.shove=0; MT.mc.hug=9; SWARM.lastTell=-9; player.hp=100; });
  await sim(1); console.log('SHOVE', await L(), '| downT', await p.evaluate(()=>player.downT.toFixed(2)));
  // 4) swipe while the hug cools
  await p.evaluate(()=>{ player.downT=0; player.stumble=0; MT.state="chase"; MT.stagger=0; MT.gait.mode="shamble"; MT.pos.set(0,0,6.95); MT.mc.shove=9; MT.mc.hug=9; MT.swCool=0; SWARM.lastTell=-9; });
  const sw=await sim(1,"(i)=>MT.state==='swipe'?1:undefined"); console.log('SWIPE frames', sw.length);
  // 5) shrug it off: 10 torso shots worth of staggers / knockdowns
  console.log('SHRUG', await p.evaluate(()=>{ let st=0, kd=0; for(let i=0;i<10;i++){ MT.hp=99; MT.state="chase"; MT.stagger=0; MT.gait.mode="shamble"; const m=MT.P.hbChest; MT.hit(m,m.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(0,0,-1)); st+=MT.stagger; if(MT.gait.mode==="fallen") kd++; } return `avg stagger ${(st/10).toFixed(2)} s (torso default 0.55), knockdowns ${kd}/10`; }));
  // 6) second grab: a Crawler joins the Matron's hug
  await p.evaluate(()=>{ MT.stagger=0; MT.state="chase"; MT.gait.mode="shamble"; MT.pos.set(0,0,6.9); MT.kb.set(0,0,0); if(MT.vel) MT.vel.set(0,0,0); MT.hp=99; MT.yaw=0; player.pos.set(0,0,8); player.downT=0; player.grabbed=null; MT.mc.hug=0; MT.mc.shove=9; SWARM.lastTell=-9; window.h1=0; });
  await sim(1.2); console.log('2ND before', await p.evaluate(()=>`MT ${MT.state} d ${MT.pos.distanceTo(player.pos).toFixed(2)} sees ${MT.sees} down ${(player.downT||0).toFixed(2)} `+(player.grabbed?'fill '+player.grabbed.qte.fill.toFixed(2):'none')));
  await p.evaluate(()=>{ const c=spawn("across:crawler",1.2,8,{aware:"hunting"}); c.cr={mode:"hold",spot:{x:1.2,z:8},pause:0,playDead:true}; SWARM.lastTell=-9; window.Cr=c; });
  await sim(1); console.log('2ND after', await p.evaluate(()=>player.grabbed?`fill ${(player.grabbed.qte.fill||0).toFixed(2)} extra ${(player.grabbed.extra||[]).map(e=>e.name)}`:'none'), await L());
  await p.evaluate(()=>{ if(player.grabbed) qteFail(player.grabbed,"too slow"); }); console.log('2ND fail', await p.evaluate(()=>document.getElementById('log').innerText.split('\n').slice(-3).join(' / ')));
  // 7) batter a door, then guard: Norah behind the corridor door in the open arena
  await p.evaluate(()=>{ clearEnemies(); player.grabbed=null; player.pos.set(-7.5,0,-9); const d=world.doors[0]; d.target=0; d.ang=0; window.MT=spawn("across:matron",-7.5,-3.5,{aware:"hunting"}); MT.lastKnown={x:-7.5,z:-9}; MT.lostT=3; SWARM.lastTell=-9; });
  const bt=await sim(8,"(i)=>i%60?undefined:(world.doors[0].broken?'broken':world.doors[0].hp.toFixed(2))"); console.log('BATTER door hp', bt.join(' '));
  await p.evaluate(()=>{ clearEnemies(); player.pos.set(9,0,9); window.MT=spawn("across:matron",-4,0,{aware:"hunting"}); MT.lastKnown={x:-2,z:2}; MT.lostT=3; MT.sees=false; });
  await sim(6); await p.evaluate(()=>makeNoise(6,6,20,"test",true)); await sim(4);
  console.log('GUARD', await p.evaluate(()=>`${MT.aware} at ${MT.pos.x.toFixed(1)},${MT.pos.z.toFixed(1)} (last seen -2,2) speed ${Math.hypot(MT.vel.x,MT.vel.z).toFixed(2)}`));
  await b.close(); console.log(errs.join('\n')||'no errors');
})();
