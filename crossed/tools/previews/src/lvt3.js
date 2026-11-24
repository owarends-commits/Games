const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:500}, deviceScaleFactor:2});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(async()=>{ ED.doc=sbNormalize(PRESETS.find(x=>x.key==="house3").make()); await sbAddDocTextures(ED.doc); $("mm").hidden=true; playMap(null); });
  await p.waitForTimeout(2500); if(await p.isVisible('#helpok')) await p.click('#helpok');
  await p.evaluate(()=>{ CFG.norah.god=true; CFG.world.freezeAI=true; paused=true; });
  const walk=async(pts)=>p.evaluate((pts)=>{ for(let k=0;k<pts.length-1;k++){ const [ax,az]=pts[k],[bx,bz]=pts[k+1], n=Math.ceil(Math.hypot(bx-ax,bz-az)/0.05);
      for(let s=1;s<=n;s++){ player.pos.x=ax+(bx-ax)*s/n; player.pos.z=az+(bz-az)*s/n; step(1/60,1/60); } } },pts);
  const shot=async(yaw,name)=>{ await p.evaluate((yaw)=>{ player.yaw=yaw; camYaw=yaw; heldYaw=null; window.__cp0=camPitch; camPitch=-0.12; paused=false; },yaw); await p.waitForTimeout(900); await p.screenshot({path:name}); await p.evaluate(()=>{ paused=true; }); console.log(name, await p.evaluate(()=>JSON.stringify({x:+player.pos.x.toFixed(2),z:+player.pos.z.toFixed(2),lv:player._lvY,pitch0:window.__cp0,pitch:camPitch,cam:[+camera.position.x.toFixed(2),+camera.position.y.toFixed(2),+camera.position.z.toFixed(2)]}))); };
  await walk([[3.2,3],[2.5,2.5],[2.5,-1],[-3,-1.2]]);
  await shot(Math.PI/2,'lv_ground_stairs.png');
  await walk([[-3,-1.2],[-1.8,-3.15],[2.2,-3.15]]);
  await shot(Math.PI/2,'lv_on_stairs.png');
  await walk([[2.2,-3.15],[4.4,-3.15],[4.4,-1.2],[1.5,-1.2]]);
  await shot(-Math.PI/2,'lv_upstairs2.png');
  // the builder
  await p.evaluate(()=>{ toBuild(); });
  await p.waitForTimeout(800); if(await p.isVisible('#helpok')) await p.click('#helpok').catch(()=>{});
  await p.evaluate(()=>{ edSetView("plan"); edSetLevel(3.2); edFrameAll(); ED.planDirty=true; });
  await p.waitForTimeout(600); await p.screenshot({path:'lv_ed_plan_up.png'});
  await p.evaluate(()=>{ edSetLevel(0); ED.planDirty=true; }); await p.waitForTimeout(500); await p.screenshot({path:'lv_ed_plan_ground.png'});
  await p.evaluate(()=>{ edSetView("3d"); ED.orbit.pitch=0.75; }); await p.waitForTimeout(800); await p.screenshot({path:'lv_ed_3d_ground.png'});
  // a stairs drag in the plan on the ground floor, and an object added upstairs lands upstairs
  console.log("builder:", await p.evaluate(()=>{ edSetLevel(3.2); const n0=ED.doc.objects.length; edMakeRect("stairs",{x:-4,z:-3},{x:-4,z:1.5}); const st=ED.doc.objects[ED.doc.objects.length-1]; edAdd({type:"pillar",x:-2,z:2,r:0.3,h:3}); const pl=ED.doc.objects.find(o=>o.type==="pillar");
    return JSON.stringify({added:ED.doc.objects.length-n0, stairs:{lv:st.lv,dir:st.dir,w:st.w,d:st.d}, pillarLv:pl&&pl.lv, levels:edLevels()}); }));
  console.log(errs.join('\n')||'no page errors'); await b.close(); })();
