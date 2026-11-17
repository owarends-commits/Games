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
  const st=()=>p.evaluate(()=>`${MN.aware} st${MN.mstage||0} ${MN.state} idle ${MN.idle.kind} at ${MN.pos.x.toFixed(1)},${MN.pos.z.toFixed(1)}`);
  const fresh=`clearEnemies(); player.grabbed=null; player.stumble=0; player.dazed=0; player.crouch=false; player.flash.on=false; SWARM.lastTell=-9; window.MN=spawn("across:mourner",0,0,{aware:"unaware",idle:"feed",yaw:0});`;
  await p.evaluate(()=>{ CFG.norah.god=true; });
  // 1) ignores her in plain sight at 6 m, even with a gunshot nearby
  await p.evaluate(fresh+'player.pos.set(0,0,6); player.yaw=Math.PI; makeNoise(0,6,20,"gunshot",true);');
  await sim(3); console.log('IGNORE', await st());
  // 2) crouched at 2.5 m: still ignores; standing at 3 m: wakes
  await p.evaluate('player.crouch=true; player.pos.set(0,0,2.5);'); await sim(1); console.log('CROUCH 2.5m', await st());
  await p.evaluate('player.crouch=false; player.pos.set(0,0,3.2);'); await sim(0.3); console.log('STAND 3.2m', await st(), '|', await L());
  // 3) flashlight held on it from 6 m
  await p.evaluate(fresh+'player.pos.set(0,0,6); player.yaw=Math.PI; camYaw=Math.PI; player.flash.has=true; player.flash.charge=1; player.flash.on=true;');
  const lt=await sim(1.6,"(i)=>i%12?undefined:MN.aware[0]+(MN.lightT||0).toFixed(1)"); console.log('LIGHT', lt.join(' '));
  // 4) stage 1: stands and wails; a Walker 6 m away answers, one 12 m away doesn't
  await p.evaluate(fresh+'player.pos.set(0,0,5); window.W1=spawn("across:walker",6,0,{aware:"unaware",idle:"stand"}); window.W2=spawn("across:walker",-12,0,{aware:"unaware",idle:"stand"}); MN.mournerWake("test");');
  const s1=await sim(2,"(i)=>i%20?undefined:Math.hypot(MN.vel.x,MN.vel.z).toFixed(2)"); console.log('STAGE1 speeds', s1.join(' '), '| near walker', await p.evaluate('W1.aware'), 'far walker', await p.evaluate('W2.aware'));
  // 5) headshots: stage up each hit, dead on the third
  const head=`(()=>{ let h=null; MN.root.traverse(o=>{ if(o.userData&&o.userData.zone==="head"&&o.userData.hitbox) h=h||o; }); return h; })()`;
  for(let i=1;i<=3;i++){ const r=await p.evaluate(`(()=>{ MN.stagger=0; const h=${head}; const d=MN.hit(h,h.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(0,0,-1)); return (d?"DEAD":"alive")+" hp "+MN.hp+" st"+MN.mstage; })()`); console.log('HEADSHOT', i, r); }
  // 6) stage 2 lunges, stage 3 sprint and map-wide wail
  await p.evaluate(fresh+'player.pos.set(0,0,14); MN.mournerWake("test"); MN.mstage=2; MN.mc.wail=99; MN.mc.scream=99; MN.mc.cling=99;');
  const s2=await sim(2.4,"(i)=>i%8?undefined:Math.hypot(MN.vel.x,MN.vel.z).toFixed(1)"); console.log('STAGE2 speeds', s2.join(' '));
  await p.evaluate(fresh+'player.pos.set(0,0,16); window.W3=spawn("across:walker",30,-20,{aware:"unaware",idle:"stand"}); MN.mournerWake("test"); MN.mournerHurt(); MN.mournerHurt();');
  const s3=await sim(2,"(i)=>i%20?undefined:Math.hypot(MN.vel.x,MN.vel.z).toFixed(1)"); console.log('STAGE3 speeds', s3.join(' '), '| far walker', await p.evaluate('W3.aware'), '|', await L());
  // 7) scream stun at 2 m
  await p.evaluate(fresh+'player.pos.set(0,0,2); MN.mournerWake("test"); MN.mc.scream=0; MN.mc.cling=99;');
  const sc=await sim(1,"(i)=>i%10?undefined:MN.state+':'+player.stumble.toFixed(2)"); console.log('SCREAM', sc.join(' '), '|', await L());
  // 8) cling at 1 m, wails while clinging
  await p.evaluate(fresh+'player.pos.set(0,0,1); MN.mournerWake("test"); MN.mc.scream=99; MN.mc.cling=0; MN.mc.wail=99;');
  await sim(0.6); console.log('CLING', await p.evaluate('player.grabbed?player.grabbed.how+" mode "+player.grabbed.qte.mode+" dmg "+player.grabbed.dmg:"none"'));
  await sim(1.7); console.log('CLING WAIL', await L()); await p.evaluate('if(player.grabbed) pushOff(player.grabbed)');
  // 9) loses her: back to the body, calm (stage 0), kneeling again
  await p.evaluate(fresh+'player.pos.set(0,0,5); MN.mournerWake("test"); MN.mournerHurt();'); await sim(1);
  await p.evaluate('player.pos.set(40,0,40);'); const cm=await sim(12,"(i)=>i%120?undefined:MN.aware[0]+(MN.mstage||0)+MN.idle.kind"); console.log('CALM', cm.join(' '), '|', await st());
  await p.evaluate('player.pos.set(0,0,6);'); await sim(2); console.log('AFTER CALM in sight 6 m', await st());
  console.log(errs.length?errs.join('\n'):'no errors'); await b.close(); })();
