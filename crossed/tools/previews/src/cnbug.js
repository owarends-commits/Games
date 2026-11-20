// node cnbug.js <style> : the Contortionist hunting a Norah who walks laps of the house; jumps, wall clipping, float/sink, facing
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const style=process.argv[2]||"crawl"; const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:400}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  await p.evaluate(()=>{ clearEnemies(); CFG.norah.god=true; window.__e=spawn("contortionist",player.pos.x+Math.sin(player.yaw)*7,player.pos.z+Math.cos(player.yaw)*7,{}); });
  for(let i=0;i<60&&!(await p.evaluate(()=>__e.pv&&__e.pv.ready));i++) await p.waitForTimeout(250);
  await p.evaluate(s=>{ window.requestAnimationFrame=()=>0; __e.pvMem.style=s; if(s!=="walk"){ __e.pvMem.after=s; __e.pv.play("fold"); } else __e.pv.play(s); window.__S={jumps:[],inWall:0,low:[],high:[],face:[],stuck:0,clips:{},frames:0}; window.__last=__e.pos.clone(); window.__o=player.pos.clone(); },style);
  const res=await p.evaluate(()=>{ const e=__e, S=__S; let t=0; const rc=new THREE.Raycaster();
    for(let i=0;i<60*60;i++){ t+=1/60; // Norah walks a slow lap round where she started, 3 m across, unless held
      if(!player.grabbed&&!(player.downT>0)){ const a=t*0.25; const tx=__o.x+Math.sin(a)*3, tz=__o.z+Math.cos(a)*3; const d=new THREE.Vector3(tx-player.pos.x,0,tz-player.pos.z); if(d.length()>0.05){ d.normalize(); player.pos.addScaledVector(d,1.1/60); collide(player.pos,0.3); } }
      if(player.grabbed) qteTick(1/60); step(1/60,1/60); player.hp=100;
      const b=e.pv; S.frames++; S.clips[b.clipName]=(S.clips[b.clipName]||0)+1;
      const jump=e.pos.distanceTo(__last); if(jump>0.25) S.jumps.push([+t.toFixed(2),b.clipName,+jump.toFixed(2)]); __last.copy(e.pos);
      // inside a wall: the centre collides
      const q=e.pos.clone(); collide(q,0.05); if(q.distanceTo(e.pos)>0.08) S.inWall++;
      // body height: the lowest point of the mesh vs the floor
      if(i%10===0&&b.C){ const bb=new THREE.Box3().setFromObject(b.C.model||b.C.group), gy=groundY(e.pos.x,e.pos.z); const lo=bb.min.y-gy; if(lo<-0.06) S.low.push([+t.toFixed(1),b.clipName,+lo.toFixed(2)]); if(lo>0.25&&!["drop"].includes(b.clipName)) S.high.push([+t.toFixed(1),b.clipName,+lo.toFixed(2)]); }
    }
    S.jumps=S.jumps.slice(0,12); S.low=S.low.slice(0,10); S.high=S.high.slice(0,10); return S; });
  console.log(style, JSON.stringify(res)); console.log(errs.slice(0,5).join('\n')||'no errors'); await b.close(); })();
