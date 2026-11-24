// node simaware.js <kind> <start> : an unaware creature in the office: does it leave her alone, then notice her when she walks up?
const { chromium } = require('playwright'); const fs=require('fs'); const K=process.argv[2]||"contortionist", ST=process.argv[3]||"wander", MODE=process.argv[4]||"near";
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmSimsBtn'); await p.waitForTimeout(300);
  await p.evaluate(([K,ST])=>{ SIMR.room="office"; SIMR.kind=K; SIMR.count=1; SIMR.start=ST; renderSims(); },[K,ST]); await p.click('#mmSims .go'); await p.waitForTimeout(2500);
  if(await p.isVisible('#helpok')) await p.click('#helpok');
  await p.evaluate(()=>{ CFG.norah.god=true; window.__L=[]; const lg=window.log; window.log=(m,c)=>{ __L.push(String(m)); return lg(m,c); }; });
  await p.waitForTimeout(9000);
  console.log("after 9 s at her spawn:", await p.evaluate(()=>{ const e=enemies[0]; return JSON.stringify({type:e.pvType||e.kind,unaware:!!e.pvUnaware||e.aware==="unaware",state:e.state,clip:e.pv&&e.pv.clipName,d:+Math.hypot(e.pos.x-player.pos.x,e.pos.z-player.pos.z).toFixed(2),hp:player.hp,hitsLogged:__L.filter(x=>/hit|bite|grab/i.test(x)).length,log:__L.slice(-3)}); }));
  await p.evaluate((MODE)=>{ const e=enemies[0]; const M=MODE; if(M==='near'){ const dx=player.pos.x-e.pos.x, dz=player.pos.z-e.pos.z, L=Math.hypot(dx,dz)||1; player.pos.x=e.pos.x+dx/L*1.3; player.pos.z=e.pos.z+dz/L*1.3; } else { makeNoise(player.pos.x,player.pos.z,CFG.stealth.gunNoise||14,'gunshot',true); } collide(player.pos,0.3); window.__gt=gameTime; const K=PVK[e.pvType], br=K.brain; K.brain=function(...a){ window.__bc=(window.__bc||0)+1; return br.apply(this,a); }; },MODE);
  await p.waitForFunction(()=>gameTime-__gt>3||!enemies[0].pvUnaware,null,{timeout:60000}).catch(()=>{});
  console.log("stood in front of it:", await p.evaluate(()=>{ const e=enemies[0]; const toP=new THREE.Vector3(player.pos.x-e.pos.x,0,player.pos.z-e.pos.z).normalize(); return JSON.stringify({los:lineOfSight(e.pos.x,e.pos.z,player.pos.x,player.pos.z,false),dist:+Math.hypot(e.pos.x-player.pos.x,e.pos.z-player.pos.z).toFixed(2),crouch:!!player.crouch,brainCalls:window.__bc||0,gameSecs:+(gameTime-__gt).toFixed(2),front:+e.facing(toP).toFixed(2),see:e.pvUnaware&&+e.pvUnaware.see.toFixed(2),unaware:!!e.pvUnaware,state:e.state,clip:e.pv&&e.pv.clipName,log:__L.filter(x=>/notic|heard|shot/i.test(x)).slice(-2)}); }));
  console.log(errs.join('\n')||'no page errors'); await b.close(); })();
