// node floatt.js types : at rest (a few frames in), which pieces of each creature's mesh float free of the rest
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const types=(process.argv[2]||"tactician").split(","); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  await p.addScriptTag({content:fs.readFileSync('seam_lib.js','utf8')});
  for(const type of types){ await p.evaluate(t=>{ clearEnemies(); CFG.world.freezeAI=true; window.__e=spawn(t,player.pos.x+Math.sin(player.yaw)*5,player.pos.z+Math.cos(player.yaw)*5,{}); },type);
    for(let i=0;i<60&&!(await p.evaluate(()=>{ const e=__e; return e.pv?e.pv.ready:!!(e.skin&&e.skin.model); }));i++) await p.waitForTimeout(250);
    console.log("== "+type, await p.evaluate(()=>{ for(let i=0;i<20;i++) step(1/60,1/60); const e=__e, root=e.pvType==="hob"?PV_HOB.H.group:e.pv?e.pv.C.group:e.skin.model; const r=[];
      root.traverse(o=>{ if(o.isSkinnedMesh&&o.visible&&o.material&&o.material.visible!==false&&o.geometry&&o.geometry.attributes.position&&o.geometry.attributes.position.count>50){ const f=SEAM.floaters(o,0.01), fb=SEAM.floaters(o,0.01,true); r.push({n:o.geometry.attributes.position.count,posed:f.map(x=>x.bone+":"+x.verts+"v "+x.gap),bind:fb.map(x=>x.bone+":"+x.verts+"v "+x.gap)}); } }); return (e.mdl||(e.pv&&e.pv.key)||"")+" "+JSON.stringify(r); })); }
  console.log(errs.join('\n')||'no errors'); await b.close(); })();
