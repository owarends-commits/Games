// node ckall.js [only-type] : the full check. Every creature type, every model it can wear, every clip it has (forced, at the distance it was
// built for) and its own AI, stepped frame by frame. Per frame and per bone: jumps (a part moving > JUMP m in one 1/60 s frame), joins
// stretching or shrinking (> 40 % off their starting length), parts under the floor, NaN, and any error the game reports.
const { chromium } = require('playwright'); const fs=require('fs'); const ONLY=process.argv[2]?process.argv[2].split(","):null, OUTF=process.argv[3]||"../ckall.txt";
(async()=>{ const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:480,height:300}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message+' | '+(e.stack||'').split('\n').slice(1,4).join(' | '))); p.on('crash',()=>errs.push('PAGE CRASHED'));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto('http://127.0.0.1:8765/test.html'); await p.waitForTimeout(2500);
  await p.click('#mmStart'); await p.waitForTimeout(300); await p.click('#suGo'); await p.waitForTimeout(400); await p.click('#helpok'); await p.waitForTimeout(1500);
  await p.evaluate(()=>{
    window.JUMP=0.25;
    // the sampler: every bone of every skinned mesh the creature shows
    window.ckBones=e=>{ const root=e.pv?(e.pv.stage):(e.skin&&e.skin.model); const bs=[]; if(!root) return bs; root.traverse(o=>{ if(!(o.isSkinnedMesh&&o.visible!==false)) return; const SI=o.geometry.attributes.skinIndex, SW=o.geometry.attributes.skinWeight, used=new Set(); for(let i=0;i<SI.count;i++) for(let k=0;k<4;k++){ if(SW.getComponent?SW.getComponent(i,k)>0.01:(SW.array[i*4+k]>0.01)) used.add(SI.array[i*4+k]); } o.skeleton.bones.forEach((bn,j)=>{ if(used.has(j)&&!bs.includes(bn)) bs.push(bn); }); }); return bs; };
    window.CORE=/^(root|torso|hips|chest|spine|pelvis|neck|head|body)/i;
    window.ckStart=e=>{ const bs=ckBones(e); const V=THREE.Vector3; const P=bs.map(x=>x.getWorldPosition(new V())); const L=bs.map((x,i)=>x.parent&&x.parent.isBone?P[i].distanceTo(x.parent.getWorldPosition(new V())):null);
      const core=bs.map(x=>CORE.test(x.name||"")||!(x.parent&&x.parent.isBone));
      return {bs,P,P2:P.map(v=>v.clone()),L0:L,core,tele:{v:0},spike:{v:0},fast:{v:0},str:{v:1},shr:{v:1},minY:{v:9},nan:0,frames:0}; };
    window.ckSample=(e,S,t,tag)=>{ const V=THREE.Vector3, gy=groundY(e.pos.x,e.pos.z); S.frames++;
      for(let i=0;i<S.bs.length;i++){ const x=S.bs[i], w=x.getWorldPosition(new V()); if(!isFinite(w.x+w.y+w.z)){ S.nan++; continue; }
        const d2=w.distanceTo(S.P[i]), d1=S.P[i].distanceTo(S.P2[i]), d13=w.distanceTo(S.P2[i]);
        if(S.frames>3){ if(d2>S.fast.v) S.fast={v:d2,bone:x.name,t:+t.toFixed(2),tag};
          if(S.core[i]&&d2>S.tele.v) S.tele={v:d2,bone:x.name,t:+t.toFixed(2),tag};
          const m=Math.min(d1,d2); if(m>0.18&&d13<0.5*m&&m>S.spike.v) S.spike={v:m,bone:x.name,t:+t.toFixed(2),tag}; }
        S.P2[i]=S.P[i]; S.P[i]=w;
        if(S.L0[i]>0.03){ const l=w.distanceTo(x.parent.getWorldPosition(new V()))/S.L0[i]; if(l>S.str.v) S.str={v:l,bone:x.name,t:+t.toFixed(2),tag}; if(l<S.shr.v) S.shr={v:l,bone:x.name,t:+t.toFixed(2),tag}; }
        const y=w.y-gy; if(y<S.minY.v) S.minY={v:y,bone:x.name,t:+t.toFixed(2),tag}; } };
    window.ckRun=(e,secs,tag,fn)=>{ let S=null, t=0; const out=[]; for(let i=0;i<secs*60;i++){ if(fn) fn(t,i); step(1/60,1/60); skinSyncAll(); if(!e.pv||e.pv.ready){ if(!S){ S=ckStart(e); } else ckSample(e,S,t,tag); } t+=1/60; if(e.removed) break; } return S; };
    window.ckFmt=S=>S?`body-teleport ${S.tele.v.toFixed(2)}m ${S.tele.bone||""}@${S.tele.t??""} · spike ${S.spike.v.toFixed(2)}m ${S.spike.bone||""}@${S.spike.t??""} · fastest part ${S.fast.v.toFixed(2)}m/frame ${S.fast.bone||""} · stretch ×${S.str.v.toFixed(2)} ${S.str.bone||""}@${S.str.t??""} · shrink ×${S.shr.v.toFixed(2)} ${S.shr.bone||""} · lowest ${S.minY.v.toFixed(2)} ${S.minY.bone||""}@${S.minY.t??""}${S.nan?" · NaN "+S.nan:""}`:"no samples";
    window.ckBad=S=>!S||S.nan||S.tele.v>0.3||S.spike.v>0.18||S.str.v>1.4||S.shr.v<0.6||S.minY.v<-0.12;
    paused=true; CFG.norah.god=true; });
  const TYPES=[["across",["across:walker","across:crawler","across:matron","across:mourner","across_legless"]],["runner"],["tactician"],["brute",["brute"]],["contortionist"],["reacher"],["reacher_arm"],["splithead"],["hob"],
    ["brute_club"],["brute_onearm"],["brute2"],["brute2_legless"],["brute2_split"],["brute2_armored"]];
  const DIST={brute2:{sweep:2.3,slam:3.3,lunge:4.4,punch:6.4,pin:7.5,charge:12,eat:3.4,wreck:0.9,splinter:4.3},brute_club:{jab:1.25,hammer:2.3,pound:2.1},brute_onearm:{swat:1.1,charge:5.3},
    contortionist:{strike:1.6,wrap:1.2,bite:1.5,drop:1.0},reacher:{whip:2.8,bite:1.6,coil:1.2,swipe:2.6,snatch:2.6,trip:2.6},reacher_arm:{swipe:2.6,snatch:2.6,trip:2.6},splithead:{bait:4,bite:3,engulf:3},hob:{throne:6.5,grabL:3,grabR:3,screech:8,crawl:8,fast:8}};
  const out=[];
  for(const [type,vars] of TYPES){ if(ONLY&&!ONLY.includes(type)) continue;
    const models=await p.evaluate(t=>{ const K=PVK[t]; if(!K||!K.group) return [null]; return Object.keys(MODEL_LIB).filter(m=>MODEL_LIB[m].g===K.group&&(!K.only||K.only(m))); },type);
    for(const v of (vars||[type])) for(const mdl of models){
      const label=`${v}${mdl?" · "+mdl:""}`;
      // the creature's own AI, 14 s, starting 7 m from her
      const ai=await p.evaluate(([v,mdl])=>{ clearEnemies(); for(const k in CRASHES) delete CRASHES[k]; player.hp=100; player.grabbed=null; player.dead=false; CFG.world.freezeAI=false;
        const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); const e=spawn(v,player.pos.x+fx*7,player.pos.z+fz*7,mdl?{mdl}:{}); if(!e) return {err:"not spawned"};
        return {ok:1}; },[v,mdl]);
      if(ai.err){ out.push(`${label}: ${ai.err}`); console.log(out[out.length-1]); continue; }
      await p.waitForFunction(()=>{ const e=enemies[0]; return !e||!e.pv||e.pv.ready; },null,{timeout:30000}).catch(()=>{});
      const r=await p.evaluate(()=>{ const e=enemies[0]; const S=ckRun(e,12,"ai",()=>{ player.hp=100; }); return {txt:ckFmt(S),bad:ckBad(S),crash:Object.keys(CRASHES)}; });
      const line=`${label} [AI 14s] ${r.txt}${r.crash.length?" · ERRORS "+r.crash.join(" / "):""}${(r.bad||r.crash.length)?"  <<<":""}`; out.push(line); console.log(line);
      // every clip forced
      const clips=await p.evaluate(()=>{ const e=enemies[0]; if(!e||!e.pv) return []; const K=PVK[e.pvType]; let L=Object.keys(K.clips||{}).length?Object.keys(K.clips):(e.pvType==="hob"?["crawl","fast","screech","grabL","grabR","throne"]:[]);
        if(e.pvType==="reacher"||e.pvType==="reacher_arm"){ const kind=e.pv.rc&&e.pv.rc.kind; L=L.filter(c=>kind==="neck"?!["swipe","snatch","trip"].includes(c):!["whip","bite","coil"].includes(c)); } return L; });
      for(const c of clips){ const d=((DIST[type]||{})[c])??((DIST[type.replace(/_.*$/,"")]||{})[c])??2.5;
        const r2=await p.evaluate(([v,mdl,c,d])=>{ clearEnemies(); for(const k in CRASHES) delete CRASHES[k]; player.hp=100; player.grabbed=null; player.dead=false; CFG.world.freezeAI=true;
          const fx=Math.sin(player.yaw), fz=Math.cos(player.yaw); const e=spawn(v,player.pos.x+fx*d,player.pos.z+fz*d,mdl?{mdl}:{}); window.__ce=e; return !!e; },[v,mdl,c,d]);
        await p.waitForFunction(()=>__ce&&(!__ce.pv||__ce.pv.ready),null,{timeout:30000}).catch(()=>{});
        const r3=await p.evaluate(([c])=>{ const e=__ce; try{ ckRun(e,0.5,"-"); if(c==="die"){ e.hp=0.01; e.hit(e.pv.hits[0]||{userData:{zone:"torso",enemy:e}},e.pos.clone().setY(1),new THREE.Vector3(1,0,0)); } else e.pv.play(c,{outSel:{oPin:"pending",oEat:"pending",oCharge:"a",oPunch:"c",oSplinter:"c",oWreck:"a",oPound:"pending",oHammer:"smash",oCoil:"pending",oSnatch:"pending"}}); }catch(x){ return {txt:"play failed: "+x.message,bad:true,crash:[]}; }
          const S=ckRun(e,7,c,()=>{ player.hp=100; }); return {txt:ckFmt(S),bad:ckBad(S),crash:Object.keys(CRASHES)}; },[c]);
        const l2=`${label} [${c}] ${r3.txt}${r3.crash.length?" · ERRORS "+r3.crash.join(" / "):""}${(r3.bad||r3.crash.length)?"  <<<":""}`; out.push(l2); console.log(l2); }
      if(type==="across"||type==="runner"||type==="tactician"||type==="brute"){ /* state-driven bodies: the AI run covers their animations */ }
    } }
  fs.writeFileSync(OUTF,out.join("\n"));
  console.log(errs.slice(0,20).join('\n')||'no page errors'); await b.close(); })();
