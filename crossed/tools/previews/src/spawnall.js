// node spawnall.js : spawn every BCROSS type (and each model it can use) and report what really appears
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | '))); p.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') errs.push(m.type()+' '+m.text().slice(0,160)); });
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  console.log(await p.evaluate(()=>JSON.stringify(Object.entries(MODEL_LIB).filter(([k,v])=>v.g.startsWith("bcross")).map(([k,v])=>k+":"+v.g))));
  for(const t of ["runner","tactician","contortionist","reacher","reacher_arm","splithead","brute","brute_club","brute_onearm","brute2","brute2_legless","brute2_split","brute2_armored"]){
    const r=await p.evaluate(t=>{ clearEnemies(); const L=[]; const lg=window.log; window.log=(m,c)=>{ L.push(String(m)); return lg(m,c); }; let e=null, err=null; try{ e=spawn(t,player.pos.x+Math.sin(player.yaw)*5,player.pos.z+Math.cos(player.yaw)*5,{}); }catch(x){ err=x.message; } window.log=lg; window.__e=e; return {err,made:!!e,kind:e&&e.kind,mdl:e&&e.mdl,log:L}; },t);
    await p.waitForTimeout(3500);
    const s=await p.evaluate(()=>{ const e=__e; if(!e) return null; let vis=0; const root=e.pv?(e.pv.C&&e.pv.C.group):e.skin&&e.skin.model; if(root) root.traverse(o=>{ if(o.isMesh&&o.visible) vis++; }); let proc=0; e.root.traverse(o=>{ if(o.isMesh&&o.visible) proc++; });
      return {enemies:enemies.length, skinModel:!!(e.skin&&e.skin.model), modelMeshes:vis, procMeshes:proc, state:e.state, dead:e.dead, removed:!!e.removed, pos:[+e.pos.x.toFixed(1),+e.pos.z.toFixed(1)]}; });
    console.log(t, JSON.stringify(r), JSON.stringify(s)); }
  console.log(errs.slice(0,10).join('\n')||'no errors'); await b.close(); })();
