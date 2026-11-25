// node shots.js <anim> <t1,t2,...> : still frames from the Hob preview at given times (fixed 1/30 s steps)
const { chromium } = require('/opt/node22/lib/node_modules/playwright'); const fs=require('fs'); const SB='/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/sb/';
const LIST=JSON.parse(process.argv[2]); const OUTD=process.argv[3];
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:1280,height:720}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text().slice(0,200)); });
  await p.route(/three(\.min)?\.js/, r=>r.fulfill({body:fs.readFileSync(SB+'three.min.js'),contentType:'application/javascript'}));
  await p.route(/GLTFLoader\.js/, r=>r.fulfill({body:fs.readFileSync(SB+'GLTFLoader.js'),contentType:'application/javascript'}));
  await p.route(/SkeletonUtils\.js/, r=>r.fulfill({body:fs.readFileSync(SB+'SkeletonUtils.js'),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort());
  await p.addInitScript(()=>{ window.requestAnimationFrame=()=>0; });
  await p.goto('http://127.0.0.1:8766/index.html'); try{ await p.waitForFunction(()=>window.__hp&&window.__hp.H&&document.getElementById('load').hidden,null,{timeout:300000,polling:1000}); }catch(e){ console.log('LOAD FAIL',errs.join('\n'),await p.evaluate(()=>document.getElementById('load')&&document.getElementById('load').textContent)); await b.close(); return; }
  await p.addStyleTag({content:`body{padding:0!important;margin:0!important;overflow:hidden} header,.cams,#cue,.wrap>:not(.stage){display:none!important} .wrap{display:block!important} .stage{position:fixed!important;inset:0!important;border:0!important} #c{width:100vw!important;height:100vh!important}`});
  await p.evaluate(()=>{ const c=document.getElementById('c'); renderer.setSize(c.clientWidth,c.clientHeight,false); __hp.cam.aspect=c.clientWidth/c.clientHeight; __hp.cam.updateProjectionMatrix(); });
  for(const [A,CAM,SEC] of LIST){ fs.mkdirSync(`${OUTD}/${A}`,{recursive:true}); await p.evaluate(([A,C])=>{ __hp.setCam(C); __hp.start(A); },[A,CAM]);
    const N=Math.round(SEC*30); for(let f=0;f<N;f++){ const url=await p.evaluate(()=>{ __hp.frame(1/30); renderer.render(scene,__hp.cam); return document.getElementById('c').toDataURL('image/jpeg',0.92); });
      fs.writeFileSync(`${OUTD}/${A}/f_${String(f).padStart(4,'0')}.jpg`,Buffer.from(url.split(',')[1],'base64')); if(f%60===0) console.log(A,f,'/',N, await p.evaluate(()=>__hp.ctx.phase)); }
    console.log('CLIPDONE',A); }
  console.log(errs.slice(0,8).join('\n')||'no errors'); await b.close(); })();
