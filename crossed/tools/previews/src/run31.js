const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1100,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | '))); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text()); });
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'}));
  await p.route(/GLTFLoader\.js/, r=>r.fulfill({body:fs.readFileSync('GLTFLoader.js'),contentType:'application/javascript'}));
  await p.route(/SkeletonUtils\.js/, r=>r.fulfill({body:fs.readFileSync('SkeletonUtils.js'),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ const d=sbNormalize(PRESETS.find(x=>x.key==="runner").make()); d.objects=d.objects.filter(o=>o.type!=="enemy"); ED.doc=d; edAfterLoad(false); });
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok');
  await p.evaluate(()=>{ CFG.norah.god=true; paused=true; window.updateCamera=()=>{}; edAmb.intensity=0.9; CFG.world.res=960; resize(); });
  const L=()=>p.evaluate(()=>document.getElementById('log').innerText.split('\n').slice(-2).join(' / '));
  const setup=(x)=>p.evaluate((x)=>{ clearEnemies(); player.grabbed=null; player.downT=0; player.stumble=0; player.kneelT=0; player.crushT=0; player.thrown=null; player.vel.set(0,0,0); player.pos.set(0,0,4); player.yaw=Math.PI; window.R=spawn("runner",0,4-x,{}); R.yaw=0; R.rc={sprint:99,kick:99}; return R.name+' '+R.mdl+' hp '+R.hp; },x);
  console.log('SPAWN', await setup(10));
  for(let i=0;i<40&&!(await p.evaluate(()=>!!(R.skin&&R.skin.model)));i++) await p.waitForTimeout(400);
  console.log('WALK', await p.evaluate(()=>{ const z0=R.pos.z; let mx=0; for(let i=0;i<120;i++){ step(1/60,1/60); mx=Math.max(mx,Math.hypot(R.vel.x,R.vel.z)); } return `${R.state}/${R.rAnim} moved ${(R.pos.z-z0).toFixed(2)} m in 2 s, peak ${mx.toFixed(2)}`; }));
  const sprintTest=async(kind,x)=>{ await setup(x); return p.evaluate((kind)=>{ R.rKind=kind; R.state="rcharge"; R.rt=0; const seq=[]; let peak=0, last="";
      for(let i=0;i<240;i++){ step(1/60,1/60); peak=Math.max(peak,Math.hypot(R.vel.x,R.vel.z)); if(R.state!==last){ seq.push(R.state+'@'+(i/60).toFixed(2)); last=R.state; } if(hitstop>0 && !window.__hs){ window.__hs=1; seq.push('HITSTOP '+hitstop.toFixed(2)+' ink '+RFX.ink.toFixed(2)); } if(player.grabbed) break; }
      return `${kind}: ${seq.join(' → ')} | peak ${peak.toFixed(1)} m/s | Norah down ${player.downT.toFixed(2)} vel ${Math.hypot(player.vel.x,player.vel.z).toFixed(1)} grabbed ${player.grabbed?player.grabbed.by.name+' '+player.grabbed.qte.mode:'no'} thrown ${!!player.thrown}`; },kind); };
  for(const [k,x] of [["sprint",8],["butt",8],["drop",9]]){ await p.evaluate(()=>{ window.__hs=0; }); console.log('SPRINT', await sprintTest(k,x), '|', await L()); }
  console.log('GRAB', await sprintTest("grab",8));
  await p.evaluate(()=>{ for(let i=0;i<30;i++) step(1/60,1/60); });
  await p.evaluate(()=>{ paused=true; camera.position.set(player.pos.x+1.8,1.5,player.pos.z-1.4); camera.lookAt(player.pos.x,1.0,player.pos.z-0.2); skinSyncAll(); runnerRender(); }); await p.waitForTimeout(150); await p.screenshot({path:'rn_grab.png'});
  console.log('FAIL', await p.evaluate(()=>{ qteFail(player.grabbed,"too slow"); const s=[]; for(let i=0;i<150;i++){ step(1/60,1/60); if(i%25===0) s.push(`${R.state} crushT ${(player.crushT||0).toFixed(2)} kneel ${(player.kneelT||0).toFixed(2)}`); } return s.join(' | '); }), '|', await L());
  await setup(8); await p.evaluate(()=>{ R.rKind="grab"; R.state="rcharge"; R.rt=0; for(let i=0;i<240&&!player.grabbed;i++) step(1/60,1/60); for(let i=0;i<20;i++) step(1/60,1/60); });
  console.log('FREE', await p.evaluate(()=>{ pushOff(player.grabbed); const s=[]; const z0=R.pos.z; for(let i=0;i<60;i++){ step(1/60,1/60); if(i%15===0) s.push(R.state); } return s.join(',')+` stepped back ${(z0-R.pos.z).toFixed(2)} m`; }), '|', await L());
  for(const [k,down] of [["kick",false],["stomp",true]]){ await setup(1.45); console.log('KICK', k, await p.evaluate(([k,down])=>{ if(down) player.downT=1.5; R.rc.kick=0; const s=[]; let last="";
      for(let i=0;i<90;i++){ step(1/60,1/60); if(R.state!==last){ s.push(R.state+(R.rKind?'/'+R.rKind:'')); last=R.state; } } return s.join(' → ')+` | Norah down ${player.downT.toFixed(2)} kneel ${(player.kneelT||0).toFixed(2)}`; },[k,down]), '|', await L()); }
  // shot mid-charge: no stagger
  await setup(8); console.log('SHOT CHARGE', await p.evaluate(()=>{ R.rKind="butt"; R.state="rcharge"; R.rt=0; for(let i=0;i<10;i++) step(1/60,1/60); let h=null; R.root.traverse(o=>{ if(o.userData&&o.userData.zone==="torso"&&!h) h=o; }); R.hit(h,h.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(0,0,1)); return R.state+' stagger '+R.stagger.toFixed(2); }));
  // impact frame screenshot
  await setup(9); await p.evaluate(()=>{ R.rKind="drop"; R.state="rcharge"; R.rt=0; for(let i=0;i<300&&!(RFX.ink>0);i++) step(1/60,1/60); camera.position.set(player.pos.x+4,1.6,player.pos.z-1.5); camera.lookAt(player.pos.x,1.0,player.pos.z-1); RFX.last=performance.now(); runnerRender(); }); await p.screenshot({path:'rn_ink.png'});
  console.log(errs.length?errs.filter(x=>!x.includes('ERR_FAILED')).slice(0,8).join('\n')||'no errors':'no errors'); await b.close(); })();
