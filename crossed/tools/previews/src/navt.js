const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const old=process.argv[2]==="old"; const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(500);
  const info=await p.evaluate(o=>{ if(o) route=routePortals; navReady(); // two points far apart with obstacles between: the most nav-distant pair of free cells near the house
      let best=null; const pts=[]; for(let j=2;j<NAV.nz-2;j+=6) for(let i=2;i<NAV.nx-2;i+=6) if(navFree(i,j)) pts.push([NAV.x0+(i+0.5)*NAV.cell,NAV.z0+(j+0.5)*NAV.cell]);
      const sp=world.spawn; pts.sort((a,b)=>Math.hypot(a[0]-sp.x,a[1]-sp.z)-Math.hypot(b[0]-sp.x,b[1]-sp.z)); const near=pts.slice(0,140);
      for(const a of near.slice(0,30)) for(const c of near){ const d=Math.hypot(a[0]-c[0],a[1]-c[1]); if(d<6||d>11) continue; const P=navPath(a[0],a[1],c[0],c[1]); if(!P) continue; let crossesDoor=false, q0=a; for(const r of P){ for(const dd of world.doors){ if(dd.broken||dd.ang>0.6) continue; const sg=doorSeg(dd); if(segsCross(q0[0],q0[1],r[0],r[1],sg.ax,sg.az,sg.bx,sg.bz)) crossesDoor=true; } q0=r; } if(crossesDoor) continue; let L=0, q=a; for(const r of P){ L+=Math.hypot(r[0]-q[0],r[1]-q[1]); q=r; } const ratio=L/d; if(!best||ratio>best.ratio) best={a,c,ratio,L}; }
      window.__pair=best; return best; },old);
  console.log((old?"OLD route":"NEW nav")+" pair:", JSON.stringify(info));
  for(const t of ["across","runner","tactician","contortionist","reacher","brute"]){
    const r=await p.evaluate(t=>{ clearEnemies(); CFG.norah.god=true; CFG.world.freezeAI=false; const P=__pair; player.pos.set(P.c[0],0,P.c[1]); player.crouch=false;
      const e=spawn(t,P.a[0],P.a[1],{aware:"hunting"}); window.__e=e; return !!e; },t);
    for(let i=0;i<60&&!(await p.evaluate(()=>{ const e=__e; return e.pv?e.pv.ready:true; }));i++) await p.waitForTimeout(250);
    const res=await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; const e=__e, P=__pair; let t=0, reach=null, stuck=0, last=e.pos.clone(), minD=1e9;
      for(let i=0;i<60*30;i++){ player.pos.set(P.c[0],0,P.c[1]); player.vel.set(0,0,0); if(player.grabbed) qteTick(1/60); step(1/60,1/60); player.hp=100; t+=1/60; const d=Math.hypot(e.pos.x-player.pos.x,e.pos.z-player.pos.z); minD=Math.min(minD,d);
        if(reach==null&&d<2.0) reach=t; if(i%30===0){ if(e.pos.distanceTo(last)<0.08&&d>3) stuck++; last.copy(e.pos); } if(reach!=null&&t>reach+1) break; }
      return {reach:reach&&+reach.toFixed(1), stuckHalfSecs:stuck, closest:+minD.toFixed(2)}; });
    console.log(" ",t.padEnd(14),JSON.stringify(res)); }
  console.log(errs.slice(0,5).join('\n')||'no errors'); await b.close(); })();
