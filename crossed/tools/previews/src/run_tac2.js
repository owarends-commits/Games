const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1000,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n')[1]));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(()=>{ window.__L=[]; const o=window.log; window.log=function(m,c){ __L.push(gameTime.toFixed(1)+' '+String(m).replace(/<[^>]+>/g,'')); return o.apply(this,arguments); }; });
  await p.evaluate(()=>{ const d=sbNormalize(PRESETS.find(x=>x.key==="open").make()); d.objects=d.objects.filter(o=>o.type!=="enemy"); ED.doc=d; edAfterLoad(false); });
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  const sim=(sec,fn)=>p.evaluate(([sec,fn])=>{ const f=fn?eval(fn):null; const out=[]; for(let i=0;i<sec*60;i++){ step(1/60,1/60); if(f){ const r=f(i); if(r!==undefined) out.push(r); } } return out; },[sec,fn]);
  // emboldened: two walkers with it, she's 12 m off
  await p.evaluate(()=>{ player.hp=100; player.pos.set(0,0,6); player.yaw=Math.PI; window.TT=spawn("tactician",0,-6,{aware:"hunting"}); for(const x of [-1.2,1.2]){ const w=spawn("across:walker",x,-6.5,{aware:"hunting"}); w.speedMul=0.01; w.cool=99; } });
  console.log((await sim(3,"(i)=>{ if(i%20) return; const e=TT; return `${(i/60).toFixed(2)} ${e.state} conf=${e.tConf} anim=${e.tAnim} tB=${(e.tB||0).toFixed(2)} speed=${Math.hypot(e.vel.x,e.vel.z).toFixed(2)} d=${Math.hypot(e.pos.x-player.pos.x,e.pos.z-player.pos.z).toFixed(1)}`; }")).join('\n'));
  await p.evaluate(()=>{ clearEnemies(); player.pos.set(0,0,3); window.TT=spawn("tactician",0,0,{aware:"hunting"}); TT.cool=99; for(const x of [-1,1]){ const w=spawn("across:walker",x,-1,{aware:"hunting"}); w.speedMul=0.01; w.cool=99; } });
  await sim(1.2); console.log('conf before shot', await p.evaluate(()=>TT.tConf+' tB='+TT.tB.toFixed(2)));
  // shots while emboldened: damage and flinch
  console.log('shot', await p.evaluate(()=>{ const hp0=TT.hp; TT.hit(TT.P.hbTorso||TT.P.hbChest||[...(function(){ const a=[]; TT.root.traverse(o=>{ if(o.userData&&o.userData.zone==='torso') a.push(o); }); return a; })()][0], TT.pos.clone().add(new THREE.Vector3(0,1.3,0)), new THREE.Vector3(0,0,-1)); return `torso: ${(hp0-TT.hp).toFixed(2)} dmg (base ${CFG.rev.damage}) state=${TT.state} stagger=${TT.stagger.toFixed(2)}`; }));
  // head-shot kill: Norah 2 m away, a walker 1.5 m away
  await p.evaluate(()=>{ clearEnemies(); player.hp=100; player.dead=false; player.pos.set(0,0,1.8); window.TT=spawn("tactician",0,0,{aware:"hunting"}); TT.cool=99; window.WN=spawn("across:walker",1.5,-0.4,{aware:"hunting"}); WN.speedMul=0.01; WN.cool=99; });
  await sim(0.5); console.log('burst', await p.evaluate(()=>{ TT.hp=0.5; const w0=WN.hp, n0=player.hp; TT.hit(TT.P.hbHead,TT.P.hbHead.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(0,0,-1));
    return `dead=${TT.dead} headScale=${TT.skin.B.head.scale.x} norah ${n0}->${player.hp} vel=${player.vel.length().toFixed(1)} down=${(player.downT||0).toFixed(1)} walker ${w0.toFixed(1)}->${WN.hp.toFixed(1)} walkerState=${WN.state}/${WN.gait&&WN.gait.mode} gore=${TACFX.gore.length}`; }));
  console.log((await sim(2,"(i)=>{ if(i%30) return; return `${(i/60).toFixed(1)} gore resting ${TACFX.gore.filter(g=>g.rest).length}/${TACFX.gore.length} acid pools ${TACFX.acid.length} hp ${player.hp}`; }")).join('\n'));
  // she walks into a pool
  console.log('acid', await p.evaluate(()=>{ const A=TACFX.acid[0]; if(!A) return 'no pool'; player.vel.set(0,0,0); player.downT=0; player.stumble=0; const h0=player.hp; for(let i=0;i<180;i++){ player.pos.set(A.x,0,A.z); step(1/60,1/60); } return `standing in it 3 s: ${h0} -> ${player.hp}`; }));
  console.log('spread', await p.evaluate(()=>{ const r=TACFX.gore.map(g=>Math.hypot(g.m.position.x,g.m.position.z)); r.sort((a,b)=>a-b); const ang=new Set(TACFX.gore.map(g=>Math.floor((Math.atan2(g.m.position.z,g.m.position.x)+Math.PI)/(Math.PI/4)))); return `gore distance: median ${r[r.length>>1].toFixed(1)} m, max ${r[r.length-1].toFixed(1)} m, octants hit ${ang.size}/8; on walls ${TACFX.gore.filter(g=>g.wall).length}`; }));
  console.log('LOG\n'+(await p.evaluate(()=>__L.slice(-14).join('\n'))));
  console.log(errs.slice(0,6).join('\n')||'noerr'); await b.close(); })();
