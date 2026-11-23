// node deatht2.js : her death in the situations that matter, each checked for errors, timing, flatness and getting up again
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:500}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(4000);
  const flat=()=>p.evaluate(()=>{ const y=plvWith(()=>PV_NW.LIVE.boneY()); return `flat: head ${y.head} chest ${y.chest} hips ${y.hips} feet ${y.foot_L}/${y.foot_R}`; });
  const waitK=k=>p.waitForFunction(k=>PLV.S.dead!=null&&PLV.t-PLV.S.dead>=k,k,{timeout:40000,polling:30});
  const getUp=async()=>{ await p.evaluate(()=>{ if(SB.simMenu) closeSimMenu(); respawn(); }); await p.waitForTimeout(2500); return p.evaluate(()=>{ const y=plvWith(()=>PV_NW.LIVE.boneY()); return `after Enter: dead=${player.dead} S.dead=${PLV.S.dead} phase=${PLV.ctx.phase} head ${y.head} hp ${player.hp}`; }); };
  await p.evaluate(()=>{ CFG.norah.god=false; });
  // D: killed holding the shotgun
  await p.evaluate(()=>{ clearEnemies(); wheelPick(WHEEL.indexOf("shotgun")); window.__d=spawn("dummy",player.pos.x+3,player.pos.z,{}); });
  await p.waitForTimeout(1500); console.log("D weapon:", await p.evaluate(()=>WS.wpn||WS.cur||"?")); console.log("  ", await p.evaluate(()=>{ player.hurt(999,__d,"test"); return `dead ${player.dead} hp ${player.hp} guard ${(player.guardT||0).toFixed(2)} downT ${player.downT} stumble ${player.stumble} god ${CFG.norah.god}`; })); await p.waitForTimeout(1500); console.log("  ", await p.evaluate(()=>`S.dead ${PLV.S.dead} t ${PLV.t.toFixed(2)} menu ${SB.simMenu} wheel ${WS.wheel}`)); await waitK(2.6); console.log("  "+await flat()); await p.screenshot({path:`../shots/deathD.png`}); console.log("  "+await getUp());
  console.log(errs.slice(0,8).join('\n')||'no page errors'); await b.close(); })();
