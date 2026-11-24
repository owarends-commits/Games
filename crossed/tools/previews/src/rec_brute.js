// node rec_brute.js [model] : record the two-armed Brute's approved walk and sweep from the playground and export rig + clips as GLB
const { chromium } = require('playwright'); const fs=require('fs'); const K=process.argv[2]||"brute_twoarm_m01", OUT=process.argv[3]||"../blender/brute_rec.glb";
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:900,height:560}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' | '+(e.stack||'').split('\n').slice(1,3).join(' | '))); p.on('console',m=>{ if(m.type()==='warning'||m.type()==='error') errs.push(m.type()+' '+m.text().slice(0,160)); });
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.addScriptTag({content:fs.readFileSync('GLTFExporter.js','utf8')});
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  await p.evaluate(([K])=>{ paused=true; CFG.norah.god=true; CFG.world.freezeAI=true; clearEnemies(); player.pos.set(0,0,30); /* out of the way */ window.__e=spawnBcross(K,0,0,{}); },[K]);
  await p.waitForFunction(()=>__e.pv.ready,null,{timeout:90000});
  const res=await p.evaluate(()=>new Promise(done=>{ const e=__e, b=e.pv, R=b.C.R, mesh=R.mesh, sk=mesh.skeleton, bones=sk.bones;
    // the rest pose, from the bind (inverse bind matrices are in the mesh's space)
    const restW=bones.map(x=>new THREE.Matrix4().copy(sk.boneInverses[bones.indexOf(x)]).invert());
    const restL=bones.map((x,i)=>{ const pi=bones.indexOf(x.parent); return pi>=0? new THREE.Matrix4().copy(restW[pi]).invert().multiply(restW[i]) : restW[i].clone(); });
    const rec=(n,setup,each)=>{ const fr=[]; setup(); for(let i=0;i<n;i++){ each&&each(i); step(1/60,1/60); mesh.updateMatrixWorld(true);
        fr.push({mp:mesh.position.clone(), mq:mesh.quaternion.clone(), L:bones.map(x=>({p:x.position.clone(),q:x.quaternion.clone(),s:x.scale.clone()})), ev:(b.ctx.events||[]).map(v=>v.a||v.kind)}); } return fr; };
    // walk: steady state, then one full stride that loops
    const W=rec(60*7,()=>{ b.ctx.wantV=1; },()=>{ b.ctx.wantV=1; });
    const stump=["shL","apL","wrL","shR","apR","wrR","root","torso"].map(n=>bones.findIndex(x=>x.name===n)).filter(i=>i>=0);
    const s0=60*3; let best=null, bd=1e9; for(let e2=s0+70;e2<=s0+140;e2++){ let d=0; for(const i of stump){ d+=W[s0].L[i].q.angleTo(W[e2].L[i].q); } d+=W[s0].L[stump[0]].p.distanceTo(W[e2].L[stump[0]].p)*5; if(d<bd){ bd=d; best=e2; } }
    const walk=W.slice(s0,best+1), vavg=(walk[walk.length-1].mp.x-walk[0].mp.x)/((walk.length-1)/60);
    // sweep: from where it stands
    for(let i=0;i<30;i++) step(1/60,1/60); b.play("sweep"); const S=rec(Math.round(60*4.4),()=>{},null);
    const hitF=S.findIndex(f=>f.ev.some(x=>/NORAH/.test(String(x))));
    // bake: in-place (forward travel taken out), resampled to 30 fps; the mesh's own sway goes into the root bone
    const rootI=bones.findIndex(x=>x.parent===mesh||!(x.parent&&x.parent.isBone));
    const clip=(name,F,v)=>{ const tracks=[], T=[], N=F.length; for(let i=0;i<N;i+=2) T.push(i/60);
      for(let bi=0;bi<bones.length;bi++){ const P=[],Q=[],Sc=[]; let sVar=false;
        for(let i=0;i<N;i+=2){ const f=F[i], L=f.L[bi]; let pp=L.p, qq=L.q;
          if(bi===rootI){ const q0i=F[0].mq.clone().invert(), dl=new THREE.Vector3(f.mp.x-(F[0].mp.x+v*i/60),f.mp.y-F[0].mp.y*0,f.mp.z-F[0].mp.z).applyQuaternion(q0i); const m0=new THREE.Matrix4().compose(dl,f.mq.clone().premultiply(q0i),new THREE.Vector3(1,1,1));   /* its sway, in its own frame */ const m=m0.multiply(new THREE.Matrix4().compose(L.p,L.q,new THREE.Vector3(1,1,1))); pp=new THREE.Vector3(); qq=new THREE.Quaternion(); m.decompose(pp,qq,new THREE.Vector3()); }
          P.push(pp.x,pp.y,pp.z); Q.push(qq.x,qq.y,qq.z,qq.w); Sc.push(L.s.x,L.s.y,L.s.z); if(Math.abs(L.s.x-1)>1e-3) sVar=true; }
        tracks.push(new THREE.VectorKeyframeTrack(bones[bi].name+".position",T,P), new THREE.QuaternionKeyframeTrack(bones[bi].name+".quaternion",T,Q)); if(sVar) tracks.push(new THREE.VectorKeyframeTrack(bones[bi].name+".scale",T,Sc)); }
      return new THREE.AnimationClip(name,(N-1)/60,tracks); };
    const cw=clip("walk",walk,vavg), cs=clip("sweep",S,0);
    // the model at rest, on its own, without hit boxes
    const strip=[]; for(const x of bones) for(const c of x.children.slice()) if(!c.isBone){ strip.push([x,c]); x.remove(c); }
    bones.forEach((x,i)=>{ restL[i].decompose(x.position,x.quaternion,x.scale); }); const par=mesh.parent; const sc=new THREE.Scene(); mesh.position.set(0,0,0); mesh.quaternion.identity(); mesh.scale.set(1,1,1); mesh.name="Brute"; sc.add(mesh); sc.updateMatrixWorld(true);
    new THREE.GLTFExporter().parse(sc, out=>{ const u=new Uint8Array(out); let s=""; for(let i=0;i<u.length;i+=0x8000) s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));
      done({glb:btoa(s), meta:{model:"brute_twoarm_m01", bones:bones.length, walkFrames:walk.length, walkLen:+cw.duration.toFixed(3), walkSpeed:+vavg.toFixed(3), loopErr:+bd.toFixed(3), sweepLen:+cs.duration.toFixed(3), sweepHit:hitF>=0?+(hitF/60).toFixed(3):null, verts:mesh.geometry.attributes.position.count}}); },{binary:true, animations:[cw,cs], onlyVisible:false, embedImages:true, forceIndices:true, truncateDrawRange:false}); }));
  fs.writeFileSync(OUT,Buffer.from(res.glb,'base64')); fs.writeFileSync(OUT.replace(/\.glb$/,'.json'),JSON.stringify(res.meta,null,1));
  console.log(JSON.stringify(res.meta), (fs.statSync(OUT).size/1024).toFixed(0)+" KB");
  console.log(errs.slice(0,8).join('\n')||'no errors'); await b.close(); })();
