// node armt.js <model> <clip> : how far each little arm's root drifts from where it sits on its host bone (and how far its skin is from the body)
const { chromium } = require('playwright'); const fs=require('fs'); const K=process.argv[2]||"brute_twoarm_m01", CL=process.argv[3]||"walk";
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:560}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  await p.evaluate(([K])=>{ paused=true; CFG.norah.god=true; CFG.world.freezeAI=true; clearEnemies(); const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); window.__e=spawnBcross(K,player.pos.x+fx*3,player.pos.z+fz*3,{}); },[K]);
  await p.waitForFunction(()=>__e.pv.ready,null,{timeout:60000});
  console.log(await p.evaluate(([CL])=>{ const e=__e, b=e.pv, R=b.C.R, V=THREE.Vector3, out=[];
    out.push("arms: "+R.arms.map((a,i)=>`#${i} ${a.base.name} parent=${a.base.parent&&a.base.parent.name}`).join(" | "));
    for(let i=0;i<10;i++) step(1/60,1/60); if(CL!=="walk") b.play(CL);
    // the arm root in its parent's frame at rest, then how far it moves away from that while the clip plays
    const rest=R.arms.map(a=>a.base.position.clone()); const host=R.arms.map(a=>a.base.parent);
    const mesh=R.mesh, P=mesh.geometry.attributes.position, SI=mesh.geometry.attributes.skinIndex, bones=mesh.skeleton.bones;
    const armSet=new Set(); R.arms.forEach(a=>{ [a.base,a.mid,a.tip].forEach(x=>armSet.add(bones.indexOf(x))); });
    const maxDrift=R.arms.map(()=>0), maxGap=R.arms.map(()=>0); const v=new V();
    for(let f=0;f<60*6;f++){ step(1/60,1/60);
      R.arms.forEach((a,i)=>{ maxDrift[i]=Math.max(maxDrift[i],a.base.position.distanceTo(rest[i])); });
      if(f===0||f%15===0){ mesh.updateMatrixWorld(true); if(!window.__cls){ const SW=mesh.geometry.attributes.skinWeight; window.__cls=[]; for(let k=0;k<P.count;k++){ let ai=-1; for(let q=0;q<4;q++){ const bi=[SI.getX(k),SI.getY(k),SI.getZ(k),SI.getW(k)][q], wt=[SW.getX(k),SW.getY(k),SW.getZ(k),SW.getW(k)][q]; if(wt>0.02){ const t=R.arms.findIndex(a=>[a.base,a.mid,a.tip].includes(bones[bi])); if(t>=0) ai=t; } } __cls.push(ai); } }
        const armV=R.arms.map(()=>[]), body=[];
        for(let k=0;k<P.count;k++){ v.fromBufferAttribute(P,k); mesh.boneTransform(k,v); v.applyMatrix4(mesh.matrixWorld); if(__cls[k]>=0) armV[__cls[k]].push(v.clone()); else if(k%2===0) body.push(v.clone()); }
        R.arms.forEach((a,i)=>{ let best=1e9; for(const q of armV[i]) for(const w of body){ const d=q.distanceToSquared(w); if(d<best) best=d; } best=Math.sqrt(best); if(f===0) (window.__g0=window.__g0||[])[i]=best; else maxGap[i]=Math.max(maxGap[i],best); }); } }
    out.push("gap arm skin to body skin at start (m): "+(window.__g0||[]).map(x=>x.toFixed(3)).join(" "));
    out.push("root drift from rest (m): "+maxDrift.map(x=>x.toFixed(3)).join(" ")); out.push("gap arm skin to body skin, worst (m): "+maxGap.map(x=>x.toFixed(3)).join(" ")); return out.join("\n"); },[CL]));
  console.log(errs.join('\n')||'no page errors'); await b.close(); })();
