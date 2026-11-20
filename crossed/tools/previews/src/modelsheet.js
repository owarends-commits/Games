// node modelsheet.js : spawn every BCROSS model by name; check it came out as that model; a render of each
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:400,height:500}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' '+(e.stack||'').split('\n').slice(1,3).join(' | ')));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(300);
  const list=await p.evaluate(()=>{ CFG.world.freezeAI=true; return bcrossModelList(); }); const rows=[];
  for(const [k,lab] of list){ await p.evaluate(k=>{ clearEnemies(); window.__e=spawnBcross(k,player.pos.x+Math.sin(player.yaw)*5,player.pos.z+Math.cos(player.yaw)*5,{}); },k);
    for(let i=0;i<60&&!(await p.evaluate(()=>{ const e=__e; return e&&(e.pv?e.pv.ready:!!(e.skin&&e.skin.model)); }));i++) await p.waitForTimeout(250);
    const r=await p.evaluate(k=>{ const e=__e; if(!e) return {k,err:"not spawned"}; window.requestAnimationFrame=()=>0; for(let i=0;i<30;i++) step(1/60,1/60); const used=e.pv?e.pv.key:e.mdl;
      const root=e.pv?e.pv.C&&e.pv.C.group:e.skin&&e.skin.model; let vis=0; if(root) root.traverse(o=>{ if(o.isMesh&&o.visible&&o.material&&o.material.visible!==false) vis++; }); let proc=0; e.root.traverse(o=>{ if(o.isMesh&&o.visible&&o.material&&o.material.visible!==false&&!o.userData.hitbox) proc++; });
      const bb=root?new THREE.Box3().setFromObject(root):null; const c=bb?bb.getCenter(new THREE.Vector3()):e.pos.clone(), h=bb?bb.max.y-bb.min.y:2;
      const cam=new THREE.PerspectiveCamera(35,400/500,0.05,100), sz=Math.max(h,bb?Math.max(bb.max.x-bb.min.x,bb.max.z-bb.min.z):2); cam.position.set(c.x+sz*1.2,c.y+sz*0.3,c.z+sz*1.6); cam.lookAt(c);
      const hid=[]; scene.traverse(o=>{ if(o.isMesh&&!o.isSkinnedMesh&&o.visible&&!(root&&isAnc(root,o))){ hid.push(o); o.visible=false; } }); function isAnc(a,o){ while(o){ if(o===a) return true; o=o.parent; } return false; }
      const hl=new THREE.HemisphereLight(0xffffff,0x666666,1.5); scene.add(hl); const bg=scene.background, fog=scene.fog; scene.background=new THREE.Color(0x5a6a7a); scene.fog=null; renderer.setSize(400,500,false); renderer.render(scene,cam); scene.remove(hl); scene.background=bg; scene.fog=fog; for(const o of hid) o.visible=true;
      return {k,type:e.pvType||e.kind,used,ok:used===k,vis,proc,h:+h.toFixed(2)}; },k);
    await p.screenshot({path:`/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/ms_${k}.png`}); rows.push(r); console.log(JSON.stringify(r)); }
  fs.writeFileSync('/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/ms_list.json',JSON.stringify(rows));
  console.log(errs.slice(0,6).join('\n')||'no errors'); await b.close(); })();
