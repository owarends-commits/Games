const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1100,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | '))); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text()); });
  await p.route(/three\.min\.js/, r=>r.fulfill({body:fs.readFileSync('three.min.js'),contentType:'application/javascript'}));
  await p.route(/GLTFLoader\.js/, r=>r.fulfill({body:fs.readFileSync('GLTFLoader.js'),contentType:'application/javascript'}));
  await p.route(/SkeletonUtils\.js/, r=>r.fulfill({body:fs.readFileSync('SkeletonUtils.js'),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  
  await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ const d=sbNormalize(PRESETS.find(x=>x.key==="open").make()); d.objects=d.objects.filter(o=>o.type!=="enemy"); ED.doc=d; edAfterLoad(false); SIM.models.pools={walker:"men",crawler:"mixed",matron:"women",mourner:"men"}; });
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok');
  console.log('AUTO PICKS', await p.evaluate(()=>{ const c={}; for(let i=0;i<1000;i++){ const m=pickMove("", "walker"); c[m]=(c[m]||0)+1; } const cm={}; for(let i=0;i<1000;i++){ const m=pickMove("", "mourner"); cm[m]=(cm[m]||0)+1; } return JSON.stringify(c)+' mourner '+JSON.stringify(cm)+' crawler '+pickMove("puller","crawler"); }));
  await p.evaluate(()=>{ CFG.norah.god=true; player.pos.set(0,0,9); player.yaw=Math.PI; camYaw=Math.PI; window.updateCamera=()=>{}; edAmb.intensity=0.9; CFG.world.res=960; resize();
    window.E=[spawn("across:walker",-2.2,-3,{aware:"hunting",move:"marionette"}),spawn("across:walker",0,-3,{aware:"hunting",move:"lurcher"}),spawn("across:walker",2.2,-3,{aware:"hunting",move:"puller"})]; });
  for(let i=0;i<40&&(await p.evaluate(()=>E.filter(e=>e.skin&&e.skin.model).length))<3;i++) await p.waitForTimeout(400);
  const sp=await p.evaluate(()=>{ const z0=E.map(e=>e.pos.z); const mx=E.map(()=>0); for(let i=0;i<300;i++){ step(1/60,1/60); E.forEach((e,j)=>mx[j]=Math.max(mx[j],Math.hypot(e.vel.x,e.vel.z))); } return E.map((e,j)=>`${e.move}: ${(e.pos.z-z0[j])/5>0?((e.pos.z-z0[j])/5).toFixed(2):'0'} m/s avg, peak ${mx[j].toFixed(2)}`).join(' | '); });
  console.log('SPEED', sp);
  await p.evaluate(()=>{ paused=true; for(const e of E){ e.pos.z=1; } E[0].pos.x=-2.2; E[1].pos.x=0; E[2].pos.x=2.2; });
  await p.evaluate(()=>{ paused=false; for(const e of E){ e.pos.z=-3; } for(let i=0;i<60;i++) step(1/60,1/60); paused=true; });
  for(const [j,tag] of [[0,'mar'],[1,'lur']]) for(let k=0;k<3;k++){ await p.evaluate((j)=>{ for(let i=0;i<9;i++) step(1/60,1/60); const e=E[j]; camera.position.set(e.pos.x+2.3,1.2,e.pos.z+0.6); camera.lookAt(e.pos.x,0.85,e.pos.z); skinSyncAll(); renderer.render(scene,camera); },j); await p.waitForTimeout(100); await p.screenshot({path:`mt_${tag}${k}.png`,clip:{x:300,y:80,width:500,height:560}}); }
  // degrade: a healthy marionette shot down the ladder
  console.log('DEGRADE', await p.evaluate(()=>{ clearEnemies(); const e=spawn("across:walker",0,0,{aware:"hunting",move:""}); e.move="marionette"; e.maxHp=e.hp=5; const out=[]; let h=null; e.root.traverse(o=>{ if(o.userData&&o.userData.zone==="torso"&&!h) h=o; });
     for(let i=0;i<4;i++){ e.stagger=0; e.hit(h,h.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(0,0,-1)); out.push(`hp ${e.hp.toFixed(1)} → ${e.move} (legsLost ${e.legsLost()})`); } return out.join(' / '); }));
  console.log(errs.length?errs.filter(x=>!x.includes('ERR_FAILED')).slice(0,8).join('\n')||'no errors':'no errors'); await b.close(); })();
