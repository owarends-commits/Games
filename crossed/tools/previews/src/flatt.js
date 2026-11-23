// node flatt.js [json pose overrides] : kill her, wait till she's flat, report bone heights and the lowest/highest skin points
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:500}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(4000);
  const OV=JSON.parse(process.argv[2]||'null'); await p.evaluate(ov=>{ globalThis.__prOv=ov; },OV); await p.evaluate(()=>{ clearEnemies(); CFG.norah.god=false; window.__d=spawn("dummy",player.pos.x+3,player.pos.z,{}); player.hurt(999,__d,"test"); });
  await p.waitForFunction(()=>PLV.S.dead!=null&&PLV.t-PLV.S.dead>=2.6,null,{timeout:30000,polling:50});
  console.log(await p.evaluate(()=>{ const y=plvWith(()=>PV_NW.LIVE.boneY()); const M=PLV.stage.matrixWorld; let lo=9,hi=-9; const v=new THREE.Vector3();
    PLV.stage.traverse(o=>{ if(o.isSkinnedMesh&&o.visible){ const P=o.geometry.attributes.position; for(let i=0;i<P.count;i+=7){ v.fromBufferAttribute(P,i); o.boneTransform(i,v); v.applyMatrix4(o.matrixWorld); lo=Math.min(lo,v.y); if(v.y>hi){ hi=v.y; const SI=o.geometry.attributes.skinIndex; window.__hb=o.skeleton.bones[SI.getX(i)].name; } } } });
    return JSON.stringify(y)+`  skin lowest ${lo.toFixed(3)} highest ${hi.toFixed(3)} (${window.__hb}) ground ${groundY(player.pos.x,player.pos.z).toFixed(3)}`; }));
  console.log(errs.join('\n')||'no errors'); await b.close(); })();
