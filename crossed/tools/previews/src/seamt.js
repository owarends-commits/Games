// node seamt.js [types] [secs] : the connectivity audit over live play
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const types=(process.argv[2]||"across,brute,runner,tactician,contortionist,reacher,reacher_arm,splithead,hob").split(","), secs=+(process.argv[3]||25);
  const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  await p.addScriptTag({content:fs.readFileSync('seam_lib.js','utf8')});
  for(const type of types){
    await p.evaluate(t=>{ clearEnemies(); CFG.norah.god=true; player.hp=CFG.norah.hp; window.__e=spawn(t,player.pos.x+Math.sin(player.yaw)*5,player.pos.z+Math.cos(player.yaw)*5,{aware:"hunting"}); window.__W={}; },type);
    for(let i=0;i<60&&!(await p.evaluate(()=>{ const e=__e; return e.pv?e.pv.ready:!!(e.skin&&e.skin.model); }));i++) await p.waitForTimeout(250);
    await p.evaluate(()=>{ window.requestAnimationFrame=()=>0; });
    const N=Math.round(secs*60);
    for(let i=0;i<N;i+=6){ await p.evaluate(()=>{ for(let k=0;k<6;k++){ if(player.grabbed) qteTick(1/60); step(1/60,1/60); } player.hp=CFG.norah.hp; if(player.dead){ respawn&&respawn(); }
        const e=__e; if(!e||e.dead||e.removed) return; const lost=e.lost&&Object.values(e.lost).some(Boolean); if(lost) return; if(e.pv&&e.pv.rc&&e.pv.C&&e.pv.C.ar&&Object.values(e.pv.C.ar).some(a=>a&&a.cut!=null)) return;
        const root= e.pvType==="hob"? (PV_HOB.H&&PV_HOB.H.group) : e.pv? (e.pv.C&&e.pv.C.group) : (e.skin&&e.skin.model); if(!root) return;
        const clip=e.pv?e.pv.clipName:(e.state||"?");
        for(const m of SEAM.meshes(root)){ const w=SEAM.gap(m); if(!w.g) continue; const k=clip+" | "+w.kind+" "+w.a+"~"+w.b; if(!__W[k]||w.g>__W[k]) __W[k]=w.g; } }); }
    const res=await p.evaluate(()=>{ const e=__e, root= e.pvType==="hob"? (PV_HOB.H&&PV_HOB.H.group) : e.pv? (e.pv.C&&e.pv.C.group) : (e.skin&&e.skin.model); const ms=root?SEAM.meshes(root):[];
      return {mdl:e.mdl||(e.pv&&e.pv.key)||"", meshes:ms.map(m=>{ const I=SEAM.prep(m); return {n:m.geometry.attributes.position.count,islands:I.islands,pairs:I.pairs.length,contacts:I.pairs.filter(x=>x[3]==="contact").length}; }), worst:Object.entries(__W).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,g])=>(g*100).toFixed(1)+" cm  "+k)}; });
    console.log("== "+type+" ("+res.mdl+") "+JSON.stringify(res.meshes)); console.log(res.worst.join("\n")||"  (no openings)"); }
  console.log(errs.slice(0,6).join('\n')||'no errors'); await b.close(); })();
