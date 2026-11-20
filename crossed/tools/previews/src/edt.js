// node edt.js : a map made in the editor with each new creature placed, then played: what comes out?
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1100,height:700}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:'+(process.env.PORT||8766)+'/'); await p.waitForTimeout(3000);
  console.log(await p.evaluate(()=>{ try{ const d=ED.doc; const sp=d.objects.find(o=>o.type==="spawn")||{x:0,z:0}; let i=0;
      for(const k of ["hob","splithead","reacher","contortionist"]){ d.objects.push({id:"t"+k,type:"enemy",kind:k,x:sp.x+(i%2?4:-4),z:sp.z+(i<2?6:12),yaw:0,start:"hunting"}); i++; }
      playMap(); return "played, kinds in doc: "+d.objects.filter(o=>o.type==="enemy").map(o=>o.kind).join(","); }catch(e){ return "ERR "+e.message; } }));
  await p.waitForTimeout(12000);
  console.log(await p.evaluate(()=>JSON.stringify(enemies.map(e=>({type:e.pvType||e.kind,ready:!!(e.pv&&e.pv.ready),rootVis:(()=>{ let n=0; e.root.traverse(o=>{ if(o.isMesh&&o.visible) n++; }); return n; })(),skin:!!(e.skin&&e.skin.model&&e.skin.model.visible)})))));
  console.log(errs.slice(0,8).join('\n')||'no errors'); await b.close(); })();
