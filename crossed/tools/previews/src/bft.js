// node bft.js <type> : spawn a Brute 6 m in front of her and log what it does for ~30 s (she stands still, can't die)
const { chromium } = require('playwright'); const fs=require('fs'); const T=process.argv[2]||"brute_club", SECS=+(process.argv[3]||30);
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | '))); p.on('console',m=>{ if(m.type()==='error') errs.push(m.type()+' '+m.text().slice(0,200)); });
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  await p.evaluate(T=>{ CFG.norah.god=true; clearEnemies(); window.__L=[]; const lg=window.log; window.log=(m,c)=>{ __L.push((performance.now()/1000).toFixed(1)+" "+String(m)); return lg(m,c); };
    window.__e=spawn(T,player.pos.x+Math.sin(player.yaw)*6,player.pos.z+Math.cos(player.yaw)*6,{}); },T);
  let last="";
  for(let i=0;i<SECS*2;i++){ await p.waitForTimeout(500);
    const s=await p.evaluate(()=>{ const e=__e, b=e.pv; const d=Math.hypot(player.pos.x-e.pos.x,player.pos.z-e.pos.z); let vis=0; if(b.C) b.C.group.traverse(o=>{ if(o.isMesh&&o.visible) vis++; });
      const L=__L.splice(0); return {clip:b.clipName, ph:b.ctx.phase, d:+d.toFixed(2), hp:+player.hp.toFixed(0), grabbed:!!player.grabbed, vis, ready:b.ready, y:b.C?+b.C.group.position.y.toFixed(2):null, L}; });
    const k=s.clip+"|"+s.ph; if(k!==last||s.L.length){ console.log((i/2).toFixed(1)+"s", JSON.stringify(s)); last=k; } }
  console.log(errs.slice(0,10).join('\n')||'no errors'); await b.close(); })();
