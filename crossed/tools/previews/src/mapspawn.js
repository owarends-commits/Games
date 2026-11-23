// node mapspawn.js : every enemy the editor offers, placed the way a map places it (hunting, and idle/unaware), run for a while
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' | '+(e.stack||'').split('\n').slice(1,4).join(' | '))); p.on('crash',()=>errs.push('PAGE CRASHED'));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  const types=await p.evaluate(()=>{ const out=[]; for(const o of enemyOptions()){ if(Array.isArray(o)) out.push(o[0]); else for(const i of o.items) out.push(i[0]); } return out; });
  console.log(types.length,"enemy options");
  for(const t of types) for(const st of ["hunting","wander"]){
    const r=await p.evaluate(([t,st])=>{ clearEnemies(); for(const k in CRASHES) delete CRASHES[k]; CFG.norah.god=true; player.hp=100; player.dead=false; player.grabbed=null;
      const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw), x=player.pos.x+fx*6, z=player.pos.z+fz*6, yaw=0;
      const opts= st==="hunting" ? {aware:"hunting",yaw} : {aware:"unaware",idle:st,yaw,face:yaw};
      let e=null, err=null; try{ e=spawn(t,x,z,opts); if(e){ e.hpMul=1.5; e._sf=-1; e.maxHp=e.hp=e.kind==="brute"?CFG.brute.hp*e.hpMul:e.S.hp; } }catch(x){ err=x.message; } window.__e=e; return {err, made:!!e}; },[t,st]);
    await p.waitForTimeout(6000);
    const s=await p.evaluate(()=>{ const e=__e; if(!e) return null; let vis=0; const root=e.pv?(e.pv.C&&e.pv.C.group||e.pv.stage):e.skin&&e.skin.model; if(root) root.traverse(o=>{ if(o.isMesh&&o.visible) vis++; });
      const bad=[]; if(!isFinite(e.pos.x)||!isFinite(e.pos.z)) bad.push("pos NaN"); return {kind:e.kind, mdl:e.mdl||"", vis, state:e.state, removed:!!e.removed, inList:enemies.includes(e), bad, crashes:Object.keys(CRASHES)}; });
    const flag=(r.err||!r.made||!s||s.vis===0||s.removed||s.crashes.length||s.bad.length)?"  <<<":"";
    console.log(`${t} [${st}]`, JSON.stringify(r), JSON.stringify(s), flag); }
  console.log(errs.slice(0,20).join('\n')||'no page errors'); await b.close(); })();
