// node brshot.js <key> : shoot each kind of hit box once (armour, lumps, little arms, stumps, body), then kill it; report
const { chromium } = require('playwright'); const fs=require('fs'); const K=process.argv[2]||"brute_twoarm_m04_armored";
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,4).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  await p.evaluate(K=>{ CFG.norah.god=true; CFG.world.freezeAI=true; clearEnemies(); window.__L=[]; const lg=window.log; window.log=(m,c)=>{ __L.push(String(m)); return lg(m,c); };
    window.__e=spawnBcross(K,player.pos.x+Math.sin(player.yaw)*5,player.pos.z+Math.cos(player.yaw)*5,{}); },K);
  await p.waitForTimeout(5000);
  console.log(await p.evaluate(()=>{ const e=__e, out=[]; const kinds={}; for(const m of e.pv.hits){ const k=m.userData.limb; (kinds[k]=kinds[k]||[]).push(m); }
    out.push("boxes "+Object.entries(kinds).map(([k,v])=>k+":"+v.length).join(" "));
    for(const k of Object.keys(kinds)){ const m=kinds[k][0]; const pt=m.getWorldPosition(new THREE.Vector3()); const dir=new THREE.Vector3(e.pos.x-player.pos.x,0,e.pos.z-player.pos.z).normalize(); const hp0=e.hp; e.hit(m,pt,dir); out.push(`${k}: −${(hp0-e.hp).toFixed(2)} ${__L.splice(0).filter(x=>!/^Hit/.test(x)).join(" | ")}`); }
    return out.join("\n"); }));
  await p.evaluate(()=>{ const e=__e; const m=e.pv.hits.find(h=>h.userData.limb==="body"); for(let i=0;i<60&&!e.dead;i++) e.hit(m,m.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(1,0,0)); });
  await p.waitForTimeout(3000);
  console.log(await p.evaluate(()=>`dead=${__e.dead} clip=${__e.pv.clipName} ph=${__e.pv.ctx.phase} y=${__e.pv.C.group.position.y.toFixed(2)}`));
  await p.screenshot({path:`../shots/brdead_${K}.png`});
  console.log(errs.slice(0,8).join('\n')||'no errors'); await b.close(); })();
