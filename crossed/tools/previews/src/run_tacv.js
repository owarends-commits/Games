const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ const d=sbNormalize(PRESETS.find(x=>x.key==="open").make()); d.objects=d.objects.filter(o=>o.type!=="enemy"); ED.doc=d; edAfterLoad(false); });
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; CFG.norah.god=true; player.pos.set(0,0,3); player.yaw=Math.PI; window.TT=spawn("tactician",0,-1,{aware:"hunting"}); TT.cool=99; });
  for(let i=0;i<40&&!(await p.evaluate(()=>!!(TT.skin&&TT.skin.model)));i++) await p.waitForTimeout(300);
  await p.evaluate(()=>{ CFG.world.freezeAI=true; const fl=document.getElementById('flash'); if(fl) fl.style.display='none'; });
  const shots=[]; const shot=async(label,setup,secs,camA)=>{ await p.evaluate(([setup,secs,camA])=>{ const e=TT; eval(setup); for(let i=0;i<secs*60;i++){ e.tt=(e.tt||0)+1/60; if(e.tMove){ e.vel.set(0,0,e.tMove); } step(1/60,1/60); if(e.tMove) e.vel.set(0,0,e.tMove); }
      skinSyncAll(); for(const el of document.querySelectorAll('div')){ const cs=getComputedStyle(el); if(cs.position==='fixed'&&cs.backgroundColor.includes('255, 0, 0')) el.style.display='none'; }
      const a=e.yaw+camA, c=e.pos.clone().add(new THREE.Vector3(0,1.15,0)); camera.position.set(c.x+Math.sin(a)*3.4,1.6,c.z+Math.cos(a)*3.4); camera.lookAt(c); camera.updateMatrixWorld(); renderer.render(scene,camera); },[setup,secs,camA]);
    const f=`tv_${shots.length}.png`; await p.screenshot({path:f}); shots.push([f,label]); console.log(label, JSON.stringify(await p.evaluate(()=>{ const x=TT.tIkErr; TT.tIkErr={}; return x; })), await p.evaluate(()=>{ const h=tacHead(TT); const s=TT.P.armL.getWorldPosition(new THREE.Vector3()), r=TT.P.armR.getWorldPosition(new THREE.Vector3()); return 'headC '+h.c.toArray().map(v=>v.toFixed(2))+' shL '+s.toArray().map(v=>v.toFixed(2))+' shR '+r.toArray().map(v=>v.toFixed(2)); })); };
  const S=(st,extra)=>`e.state='${st}'; e.tt=0; e.tMove=0; e.vel.set(0,0,0); e.tPh=null; ${extra||''}`;
  const B="e.tConf='bold'; e.tB=1; ";
  await shot('normal: braced',S('chase',"e.tAnim='study'; e.tConf='upper'; e.tB=0;"),0.6,0.6);
  await shot('emboldened: stands',S('chase',B+"e.tAnim='study'"),0.6,0.6);
  await shot('emboldened: stands (side)',S('chase',B+"e.tAnim='study'"),0.3,1.5);
  await shot('emboldened: walk',S('chase',B+"e.tAnim='walk'; e.tMove=1.8"),0.7,1.5);
  await shot('emboldened: run',S('chase',B+"e.tAnim='run'; e.tMove=5.5"),0.37,1.5);
  await shot('emboldened: run (2)',S('chase',B+"e.tAnim='run'; e.tMove=5.5"),0.12,1.5);
  await p.evaluate(()=>{ CFG.world.freezeAI=false; clearEnemies(); player.pos.set(0,0,2.2); player.hp=100; player.dead=false; window.TT=spawn("tactician",0,0,{aware:"hunting"}); TT.cool=99; window.WN=spawn("across:walker",-1.6,-0.6,{aware:"hunting"}); WN.speedMul=0.01; WN.cool=99; });
  for(let i=0;i<40&&!(await p.evaluate(()=>!!(TT.skin&&TT.skin.model)));i++) await p.waitForTimeout(300);
  await p.evaluate(()=>{ for(let i=0;i<40;i++) step(1/60,1/60); TT.hp=0.5; TT.hit(TT.P.hbHead,TT.P.hbHead.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(0,0,-1)); window.TT0=TT.pos.clone(); });
  const wide=async(label,secs,camA,R)=>{ await p.evaluate(([secs,camA,R])=>{ for(let i=0;i<secs*60;i++) step(1/60,1/60); skinSyncAll(); for(const el of document.querySelectorAll('div')){ const cs=getComputedStyle(el); if(cs.position==='fixed'&&cs.backgroundColor.includes('255, 0, 0')) el.style.display='none'; }
      const c=TT0.clone().add(new THREE.Vector3(0,0.9,0)); camera.position.set(c.x+Math.sin(camA)*R,2.4,c.z+Math.cos(camA)*R); camera.lookAt(c); camera.updateMatrixWorld(); renderer.render(scene,camera); },[secs,camA,R]);
    const f=`tv_${shots.length}.png`; await p.screenshot({path:f}); shots.push([f,label]); };
  await wide('head burst: 0.03 s',0.03,1.2,5); await wide('0.12 s',0.09,1.2,5); await wide('0.3 s',0.18,1.2,6); await wide('0.8 s',0.5,1.2,7); await wide('2 s: gore, brain-matter pools',1.2,0.9,8); await wide('6 s, from above',4,0.4,4);
  fs.writeFileSync('fr_list.json',JSON.stringify(shots)); console.log(errs.slice(0,5).join('\n')||'noerr'); await b.close(); })();
