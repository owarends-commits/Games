const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:560}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  // 1. in play: walks up, sweeps, hits
  await p.evaluate(()=>{ CFG.norah.god=true; clearEnemies(); window.__L=[]; const lg=window.log; window.log=(m,c)=>{ __L.push(String(m)); return lg(m,c); }; const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); window.__e=spawn("brute2_blender",player.pos.x+fx*7,player.pos.z+fz*7,{}); });
  await p.waitForFunction(()=>__e.pv.ready,null,{timeout:60000});
  for(let i=0;i<14;i++){ await p.waitForTimeout(1000); const s=await p.evaluate(()=>({clip:__e.pv.clipName,d:+Math.hypot(__e.pos.x-player.pos.x,__e.pos.z-player.pos.z).toFixed(2),L:__L.splice(0).filter(x=>!/^Hit →/.test(x))})); if(s.L.length||i%3===0) console.log(i+"s",JSON.stringify(s)); }
  // 2. shot to death
  console.log("shots:", await p.evaluate(()=>{ const e=__e; let n=0; while(!e.dead&&n<200){ const m=e.pv.hits[n%e.pv.hits.length]; e.hit(m,m.getWorldPosition(new THREE.Vector3()),new THREE.Vector3(1,0,0)); n++; } return `dead=${e.dead} after ${n} shots`; }));
  await p.waitForTimeout(2500); console.log("after death:", await p.evaluate(()=>`tilt ${__e.pv.model.rotation.z.toFixed(2)} y ${__e.pv.model.position.y.toFixed(2)}`));
  // 3. side by side, walking, for pictures
  await p.evaluate(()=>{ clearEnemies(); CFG.world.freezeAI=false; const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw), rx=fz, rz=-fx;
    window.__a=spawnBcross("brute_twoarm_m01",player.pos.x+fx*8+rx*1.8,player.pos.z+fz*8+rz*1.8,{}); window.__b=spawn("brute2_blender",player.pos.x+fx*8-rx*1.8,player.pos.z+fz*8-rz*1.8,{}); });
  await p.waitForFunction(()=>__a.pv.ready&&__b.pv.ready,null,{timeout:60000}); await p.waitForTimeout(2200);
  await p.evaluate(()=>{ for(const el of document.querySelectorAll("#log,#help")) el.style.visibility="hidden"; }); await p.screenshot({path:'../shots/bt_side.png'});
  // 4. joins: the gap between each little arm (and lump) and the body skin while it walks
  console.log("join gaps:", await p.evaluate(()=>{ const b=__b.pv, V=THREE.Vector3; let mesh=null; b.model.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); const P=mesh.geometry.attributes.position, SI=mesh.geometry.attributes.skinIndex, SW=mesh.geometry.attributes.skinWeight, bones=mesh.skeleton.bones;
    const armOf=k=>{ for(let q=0;q<4;q++){ const bi=[SI.getX(k),SI.getY(k),SI.getZ(k),SI.getW(k)][q], w=[SW.getX(k),SW.getY(k),SW.getZ(k),SW.getW(k)][q]; if(w>0.02&&/^arm\d/.test(bones[bi].name)) return bones[bi].name.replace(/[abc]$/,""); } return null; };
    const cls=[]; for(let k=0;k<P.count;k++) cls.push(armOf(k)); const names=[...new Set(cls.filter(Boolean))]; const worst={}, v=new V();
    for(let f=0;f<6;f++){ for(let i=0;i<10;i++) step(1/60,1/60); mesh.updateMatrixWorld(true); const A={}, body=[];
      for(let k=0;k<P.count;k++){ v.fromBufferAttribute(P,k); mesh.boneTransform(k,v); v.applyMatrix4(mesh.matrixWorld); if(cls[k]) (A[cls[k]]=A[cls[k]]||[]).push(v.clone()); else if(k%2===0) body.push(v.clone()); }
      for(const n of names){ let best=1e9; for(const q of A[n]) for(const w of body){ const d=q.distanceToSquared(w); if(d<best) best=d; } worst[n]=Math.max(worst[n]||0,Math.sqrt(best)); } }
    return Object.entries(worst).map(([n,g])=>n+" "+(g*100).toFixed(1)+" cm").join(", "); }));
  // 5. cost per frame, each alone
  for(const which of ["code","blender"]){ console.log(which, await p.evaluate(which=>new Promise(res=>{ clearEnemies(); const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); const e=which==="code"?spawnBcross("brute_twoarm_m01",player.pos.x+fx*8,player.pos.z+fz*8,{}):spawn("brute2_blender",player.pos.x+fx*8,player.pos.z+fz*8,{});
      const wait=()=>{ if(!e.pv.ready) return setTimeout(wait,100); setTimeout(()=>{ let n=0,sum=0; const u0=e.update.bind(e); e.update=function(dt){ const t=performance.now(); u0(dt); sum+=performance.now()-t; n++; }; setTimeout(()=>res(`its update: ${(sum/Math.max(1,n)).toFixed(2)} ms a frame over ${n} frames`),5000); },1500); }; wait(); }),which)); }
  console.log(errs.slice(0,6).join('\n')||'no page errors'); await b.close(); })();
