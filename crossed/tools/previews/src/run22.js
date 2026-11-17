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
  await p.evaluate(()=>{ CFG.norah.god=true; player.pos.set(0,0,9); player.yaw=Math.PI; camYaw=Math.PI; window.W=spawn("across:walker",0,-4,{aware:"hunting"}); window.updateCamera=()=>{}; edAmb.intensity=0.9; CFG.world.res=960; resize(); });
  for(let i=0;i<40&&!(await p.evaluate(()=>!!(W.skin&&W.skin.model)));i++) await p.waitForTimeout(400);
  console.log('SAMPLERS', await p.evaluate(()=>{ const s=mdlSamplers(W.mdl); return Object.keys(s).join(',')+' walk bones '+Object.keys(s.walk.tr).length; }));
  const tr=await p.evaluate(()=>{ const o=[]; for(let i=0;i<180;i++){ step(1/60,1/60); skinSyncAll(); if(i%15===0) o.push(`${W.gait.mode}:${Math.hypot(W.vel.x,W.vel.z).toFixed(2)} w${(W.clipW||0).toFixed(2)} t${(W.clipT||0).toFixed(2)}`); } return o; });
  console.log('WALK', tr.join(' | '));
  const cam=()=>{ camera.position.set(W.pos.x+2.6,1.3,W.pos.z+1.6); camera.lookAt(W.pos.x,0.9,W.pos.z); };
  const shot=async(name)=>{ await p.evaluate(`(${cam.toString()})(); skinSyncAll(); renderer.render(scene,camera);`); await p.waitForTimeout(120); await p.screenshot({path:name,clip:{x:250,y:60,width:600,height:600}}); };
  for(let k=0;k<3;k++){ await p.evaluate(()=>{ W.gait.mode="burst"; W.gait.t=1; for(let i=0;i<9;i++){ step(1/60,1/60); } }); await shot(`an_w${k}.png`); }
  // flinches
  const hitZ=async(z,limb)=>p.evaluate(([z,limb])=>{ W.hp=99; let h=null; W.root.traverse(o=>{ if(o.userData&&o.userData.zone===z&&(!limb||o.userData.limb===limb)&&!h) h=o; }); W.hit(h,h.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(0,0,-1)); for(let i=0;i<4;i++) step(1/60,1/60); return W.hfx?W.hfx.z:'none'; },[z,limb]);
  await p.evaluate(()=>{ CFG.world.freezeAI=true; });
  for(const [z,l] of [["head",null],["arm","armL"],["leg","legR"],["torso",null]]){ console.log('FLINCH', z, await hitZ(z,l)); await shot(`an_f_${z}.png`); await p.evaluate(()=>{ for(let i=0;i<60;i++) step(1/60,1/60); }); }
  // deaths by zone
  for(const [z,l] of [["head",null],["leg","legL"]]){
    await p.evaluate(([z,l])=>{ clearEnemies(); window.W=spawn("across:walker",0,0,{aware:"hunting"}); W.yaw=0; },[z,l]); for(let i=0;i<20&&!(await p.evaluate(()=>!!(W.skin&&W.skin.model)));i++) await p.waitForTimeout(300);
    const r=await p.evaluate(([z,l])=>{ CFG.world.freezeAI=false; W.hp=0.01; let h=null; W.root.traverse(o=>{ if(o.userData&&o.userData.zone===z&&(!l||o.userData.limb===l)&&!h) h=o; }); W.hit(h,h.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(0,0,-1));
      const out=[]; for(let i=0;i<90;i++){ step(1/60,1/60); if(i%15===0) out.push(`hipY ${W.P.hips.position.y.toFixed(2)} th ${(W.rag.th||0).toFixed(2)}`); } return `${W.rag.kind} dir ${W.rag.dir.x.toFixed(2)},${W.rag.dir.z.toFixed(2)} | `+out.join(' / '); },[z,l]);
    console.log('DEATH', z, r); await shot(`an_d_${z}.png`); }
  console.log(errs.length?errs.filter(x=>!x.includes('ERR_FAILED')).slice(0,8).join('\n')||'no errors':'no errors'); await b.close(); })();
