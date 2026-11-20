// node brt.js <model key> [secs] [dist] : spawn a two-armed Brute and log what it does (she stands still, can't die)
const { chromium } = require('playwright'); const fs=require('fs'); const K=process.argv[2]||"brute_twoarm_m01", SECS=+(process.argv[3]||30), D=+(process.argv[4]||9);
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,4).join(' | '))); p.on('console',m=>{ if(m.type()==='error') errs.push(m.type()+' '+m.text().slice(0,200)); });
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  console.log(await p.evaluate(([K,D])=>{ CFG.norah.god=true; clearEnemies(); window.__L=[]; const lg=window.log; window.log=(m,c)=>{ __L.push(String(m)); return lg(m,c); };
    window.__e=spawnBcross(K,player.pos.x+Math.sin(player.yaw)*D,player.pos.z+Math.cos(player.yaw)*D,{}); return __e&&__e.pvType; },[K,D]));
  let last="";
  for(let i=0;i<SECS*2;i++){ await p.waitForTimeout(500);
    const s=await p.evaluate(()=>{ const e=__e, b=e.pv; const d=Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z); let vis=0; if(b.C) b.C.group.traverse(o=>{ if(o.isMesh&&o.visible) vis++; });
      const L=__L.splice(0).filter(x=>!/^Hit →/.test(x)); const toP=new THREE.Vector3(player.pos.x-e.pos.x,0,player.pos.z-e.pos.z).normalize(); return {clip:b.clipName, cool:+(e.pvMem.cool||0).toFixed(1), face:+e.facing(toP).toFixed(2), ph:b.ctx.phase, d:+d.toFixed(2), hp:e.hp, grabbed:!!player.grabbed, vis, ready:b.ready, pos:[+e.pos.x.toFixed(1),+e.pos.z.toFixed(1)], L}; });
    const k=s.clip+"|"+s.ph; if(k!==last||s.L.length){ console.log((i/2).toFixed(1)+"s", JSON.stringify(s)); last=k; } }
  console.log(errs.slice(0,8).join('\n')||'no errors'); await b.close(); })();
