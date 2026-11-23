// node brdbg.js <model> <clip> <dist> : step a forced clip and explain every frame where its body jumps
const { chromium } = require('playwright'); const fs=require('fs'); const [K,CL,D]=[process.argv[2],process.argv[3],+process.argv[4]];
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:480,height:300}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' | '+(e.stack||'').split('\n').slice(1,4).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  await p.evaluate(([K,D])=>{ paused=true; CFG.norah.god=true; CFG.world.freezeAI=true; clearEnemies(); const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); window.__e=spawnBcross(K,player.pos.x+fx*D,player.pos.z+fz*D,{}); },[K,D]);
  await p.waitForFunction(()=>__e.pv.ready,null,{timeout:60000});
  console.log(await p.evaluate(([CL])=>{ const e=__e, b=e.pv, R=b.C.R, out=[]; for(let i=0;i<20;i++) step(1/60,1/60);
    b.play(CL,{outSel:{oPin:"pending",oEat:"pending",oCharge:"a",oPunch:"c",oSplinter:"c",oWreck:"a"}});
    const V=THREE.Vector3; const root=R.B.root||R.B.torso; let prev=null;
    for(let i=0;i<60*7;i++){ try{ b.step(1/60); }catch(x){ return "ERROR at "+(i/60).toFixed(2)+": "+x.message+"\n"+x.stack.split("\n").slice(0,6).join("\n"); } const w=root.getWorldPosition(new V()), so=new V().setFromMatrixPosition(b.M), ml=R.mesh.position.clone(), rl=root.position.clone(), c=b.ctx, PS=b.C.bs.ps||{};
      const now={w,so,ml,rl,x:c.x,ex:e.pos.clone(),ps:{e:PS.e,hx:PS.hx,hz:PS.hz},ph:c.phase,fL:c.fL&&c.fL.clone(),fR:c.fR&&c.fR.clone()};
      if(prev){ const d=w.distanceTo(prev.w); const dfL=now.fL&&prev.fL?now.fL.distanceTo(prev.fL):0, dfR=now.fR&&prev.fR?now.fR.distanceTo(prev.fR):0;
        if(d>0.2||dfL>0.4||dfR>0.4) out.push(`t=${(i/60).toFixed(2)} "${now.ph}" root moved ${d.toFixed(2)} | stage origin moved ${now.so.distanceTo(prev.so).toFixed(2)} | mesh local moved ${now.ml.distanceTo(prev.ml).toFixed(2)} (y ${prev.ml.y.toFixed(2)}→${now.ml.y.toFixed(2)}) | root local moved ${now.rl.distanceTo(prev.rl).toFixed(2)} | ctx.x ${prev.x.toFixed(2)}→${now.x.toFixed(2)} | PS e ${(+prev.ps.e).toFixed(2)}→${(+now.ps.e).toFixed(2)} hx ${(+prev.ps.hx).toFixed(2)}→${(+now.ps.hx).toFixed(2)} hz ${(+prev.ps.hz).toFixed(2)}→${(+now.ps.hz).toFixed(2)} | feet moved L ${dfL.toFixed(2)} R ${dfR.toFixed(2)} (L ${prev.fL&&prev.fL.toArray().map(v=>v.toFixed(2))}→${now.fL&&now.fL.toArray().map(v=>v.toFixed(2))})`); }
      prev=now; } return out.slice(0,3).join("\n")||"no jumps"; },[CL]));
  console.log(errs.slice(0,5).join('\n')||'no page errors'); await b.close(); })();
