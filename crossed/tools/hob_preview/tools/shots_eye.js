// node shots.js <anim> <t1,t2,...> : still frames from the Hob preview at given times (fixed 1/30 s steps)
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs=require('fs'); const SB='/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/sb/';
const A=process.argv[2], TS=(process.argv[3]||"1,3,5").split(",").map(Number), CAM=process.argv[4]||"side";
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message)); p.on('console',m=>{ if(/HAND/.test(m.text())) console.log(m.text()); if(m.type()==='error') errs.push('CONSOLE '+m.text().slice(0,200)); });
  await p.route(/three(\.min)?\.js/, r=>r.fulfill({body:fs.readFileSync(SB+'three.min.js'),contentType:'application/javascript'}));
  await p.route(/GLTFLoader\.js/, r=>r.fulfill({body:fs.readFileSync(SB+'GLTFLoader.js'),contentType:'application/javascript'}));
  await p.route(/SkeletonUtils\.js/, r=>r.fulfill({body:fs.readFileSync(SB+'SkeletonUtils.js'),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  await p.addInitScript(()=>{ window.requestAnimationFrame=()=>0; });
  await p.goto('http://127.0.0.1:8766/index.html'); try{ await p.waitForFunction(()=>window.__hp&&window.__hp.H&&document.getElementById('load').hidden,null,{timeout:300000,polling:1000}); }catch(e){ console.log('LOAD FAIL',errs.join('\n'),await p.evaluate(()=>document.getElementById('load')&&document.getElementById('load').textContent)); await b.close(); return; }
  await p.addStyleTag({content:`body{padding:0!important;margin:0!important;overflow:hidden} header,.cams,#cue,.wrap>:not(.stage){display:none!important} .wrap{display:block!important} .stage{position:fixed!important;inset:0!important;border:0!important} #c{width:100vw!important;height:100vh!important}`});
  await p.evaluate(()=>{ const c=document.getElementById('c'); renderer.setSize(c.clientWidth,c.clientHeight,false); __hp.cam.aspect=c.clientWidth/c.clientHeight; __hp.cam.updateProjectionMatrix(); });
  await p.evaluate(([A,C])=>{ __hp.setCam(C); __hp.start(A); window.__focus=true; },[A,CAM]);
  let t=0; for(const T of TS){ await p.evaluate(n=>{ for(let i=0;i<n;i++) __hp.frame(1/30); },Math.round((T-t)*30)); t=T;
    const url=await p.evaluate(()=>{ if(window.__focus){ const h=MA.hand.getWorldPosition(new THREE.Vector3()); const her=nora.group.position.clone().add(new THREE.Vector3(0,1.3,0)); const pe=MA.palmEye.g.getWorldPosition(new THREE.Vector3()); __hp.cam.position.copy(pe).lerp(her,0.25).add(new THREE.Vector3(0,0.1,0.25)); __hp.cam.lookAt(pe); console.log('HAND',JSON.stringify({lid:MA.palmEye.lidU.rotation.z,vis:MA.palmEye.ball.visible}));  const q=MA.hand.getWorldQuaternion(new THREE.Quaternion()), sc=MA.hand.getWorldScale(new THREE.Vector3()); console.log('HAND',JSON.stringify({sc,kids:MA.hand.children.length,fing:MA.fingers.length,seg0:MA.fingers[0].segs[0].getWorldScale(new THREE.Vector3())})); } renderer.render(scene,__hp.cam); return document.getElementById('c').toDataURL('image/png'); }); fs.writeFileSync(`${process.env.OUT||'.'}/${A}_${T}.png`,Buffer.from(url.split(',')[1],'base64')); console.log(A,T,await p.evaluate(()=>__hp.ctx.phase)); }
  console.log(errs.slice(0,8).join('\n')||'no errors'); await b.close(); })();
