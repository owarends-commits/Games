// node lvt.js : the three-storey house: levels, stairs, heights, creatures following across levels
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:800,height:500}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message)); p.on('console',m=>{ if(m.type()==='error') errs.push('CONSOLE '+m.text().slice(0,200)); });
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.evaluate(async()=>{ ED.doc=sbNormalize(PRESETS.find(x=>x.key==="house3").make()); await sbAddDocTextures(ED.doc); $("mm").hidden=true; playMap(null); });
  await p.waitForTimeout(2500); if(await p.isVisible('#helpok')) await p.click('#helpok');
  await p.evaluate(()=>{ CFG.norah.god=true; paused=true; });
  const info=()=>p.evaluate(()=>JSON.stringify({lvls:LV.levels,views:LV.views,stairs:LV.stairs.length,player:{x:+player.pos.x.toFixed(2),z:+player.pos.z.toFixed(2),y:+(player._lvY||0).toFixed(2),i:player._lvI,rootY:+player.root.position.y.toFixed(2)},
    enemies:enemies.map(e=>({n:e.name,x:+e.pos.x.toFixed(2),z:+e.pos.z.toFixed(2),y:+(e._lvY||0).toFixed(2),i:e._lvI,aware:e.aware,state:e.state})), view:LV.view, segs:world.segs.length, allSegs:LV.all&&LV.all.segs.length}));
  console.log("start:", await info());
  // walk her along a path in small steps, one frame each, through the real player update (collision on)
  const walk=async(pts,label)=>{ const r=await p.evaluate((pts)=>{ const out=[]; for(let k=0;k<pts.length-1;k++){ const [ax,az]=pts[k],[bx,bz]=pts[k+1], n=Math.ceil(Math.hypot(bx-ax,bz-az)/0.05);
      for(let s=1;s<=n;s++){ const tx=ax+(bx-ax)*s/n, tz=az+(bz-az)*s/n; player.pos.x=tx; player.pos.z=tz; step(1/60,1/60); if(s%8===0) out.push([+player.pos.x.toFixed(2),+player.pos.z.toFixed(2),+(player._lvY).toFixed(2),player._lvI]); } } return out; },pts);
    console.log(label, JSON.stringify(r.filter((_,i)=>i%3===0))); };
  await walk([[3.2,3],[2,3.2],[1.5,3.2],[-4.4,3.2]],"down to the basement:");
  console.log("in basement:", await info());
  await walk([[-4.4,3.2],[1.6,3.2],[2.5,3.2],[2.5,-1],[-1.8,-1],[-1.8,-3.15],[4.4,-3.15],[4.4,-1]],"back up, then upstairs:");
  console.log("upstairs:", await info());
  // let the world run: does the hunting walker follow her up?
  await p.evaluate(()=>{ for(const e of enemies) if(e._lvI===1){ e.aware="hunting"; e._lvSeen=gameTime; } });
  for(let t=0;t<6;t++){ await p.evaluate(()=>{ for(let k=0;k<300;k++) step(1/60,1/60); }); console.log(`+${(t+1)*5}s`, await p.evaluate(()=>JSON.stringify(enemies.map(e=>({n:e.name,x:+e.pos.x.toFixed(2),z:+e.pos.z.toFixed(2),y:+(e._lvY||0).toFixed(2),i:e._lvI,aware:e.aware,st:e.state,d:+Math.hypot(e.pos.x-player.pos.x,e.pos.z-player.pos.z).toFixed(1)}))))); }
  await p.evaluate(()=>{ paused=false; });
  await p.waitForTimeout(600); await p.screenshot({path:'lv_up.png'});
  console.log(errs.slice(0,10).join('\n')||'no page errors'); console.log("crashes", await p.evaluate(()=>JSON.stringify(CRASHES)));
  await b.close(); })();
