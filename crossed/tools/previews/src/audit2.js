// strict float/sink audit: node audit2.js <bp|ap|rp> clips|all [model]
// float = every point off the floor (>3 cm) through a 7-frame window while the centre of mass is NOT accelerating down at ~g
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [pg0,clipsArg,model]=process.argv.slice(2); const pg=(pg0==='cf'||pg0==='oa'||pg0==='tac'||pg0==='cn'||pg0==='rch'||pg0==='sh'||pg0==='np'||pg0==='nw')?'rp':pg0; const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:480}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto(`http://127.0.0.1:8765/${pg0}_test.html`); const G={bp:'__bp',ap:'__ap',rp:'__rp'}[pg];
  const ready={bp:'__bp&&__bp.BR&&__bp.nora',ap:'__ap&&__ap.ac&&__ap.nora',rp:'__rp&&__rp.runner'}[pg];
  for(let i=0;i<60&&!(await p.evaluate(r=>{ try{ return !!eval(r); }catch(e){ return false; } },ready));i++) await p.waitForTimeout(400); await p.waitForTimeout(800);
  if(model){ await p.evaluate(m=>{ const s=document.getElementById('oModel'); s.value=m; s.dispatchEvent(new Event('change')); },model); await p.waitForTimeout(400); for(let i=0;i<40&&!(await p.evaluate(()=>document.getElementById('load').hidden));i++) await p.waitForTimeout(400); }
  if(process.env.OPT) await p.evaluate(v=>{ for(const [id,val] of Object.entries(JSON.parse(v))) document.getElementById(id).value=val; },process.env.OPT);
  const clips = clipsArg!=='all' ? clipsArg.split(',') : (pg==='bp'? (await p.evaluate(()=>MODEL_CLIPS[__bp.BR.uid])) : pg==='ap'?["marionette","lurcher","grab","swipe","stumble","bite","drag","whip","trip","shot"]:(pg0==='cf'?["idle","walk","jab","hammer","pound"]:pg0==='oa'?["idle","walk","swat","smother","flail"]:["neutral","walk","sprint","butt","kick","stomp","grab","mirror","drop"]));
  if(process.env.DUMP) await p.evaluate(d=>{ window.__DUMP=d; },process.env.DUMP);
  for(const clip of clips){
    const res=await p.evaluate(([G,pg,clip])=>{ const X=window[G]; window.requestAnimationFrame=()=>0; X.renderer.render=()=>0; X.start(clip);
      const chars=()=> pg==='bp' ? {brute:X.BR.mesh, norah:X.nora.group} : pg==='ap' ? {across:X.ac.group, norah:X.nora.group} : {runner:X.runner.group, norah:X.norah&&X.norah.c&&X.norah.c.group};
      const vis=o=>{ for(let q=o;q;q=q.parent) if(q.visible===false) return false; return true; };
      const D={}; let n=0; const bodies=new Map(); const gsOf={runner:()=>X.runner&&X.runner.gs, across:()=>X.ac&&X.ac.gs, norah:()=>pg==='bp'?X.BS&&X.BS.ns:(pg==='ap'?X.nora.gs:X.norah&&X.norah.c.gs), brute:()=>X.BS&&X.BS.ps};
      while(n++<60*14){ const t0=X.t; X.frame(1/60); if(X.t<t0) break; if(X.t===t0) continue;
        const cs=chars(); for(const k in cs){ const o=cs[k]; if(!o||!vis(o)) continue; let B=bodies.get(o); if(!B){ const ms=[]; o.traverse(q=>{ if(q.isSkinnedMesh) ms.push(q); }); if(o.isSkinnedMesh&&!ms.length) ms.push(o); B=PHYS.body(ms); bodies.set(o,B); }
          o.updateMatrixWorld(true); const m=B.measure(); const grip2=X.ctx.ik2&&X.ctx.ik2Tip&&X.ctx.ik2.target?X.ctx.ik2Tip.distanceTo(X.ctx.ik2.target):9; const held = (k==='norah' && ((pg==='bp' && X.ctx.n && X.ctx.n.held) || (X.ctx.nHeld && grip2<0.1))) || (k==='runner' && X.ctx.held && (X.ctx.grip??9)<0.06 && (X.ctx.gripN||0)>=2);   /* on the wall: held by at least two planted limbs (a hand and the diagonal foot) actually touching it */ const gs=gsOf[k]&&gsOf[k](); (D[k]||(D[k]=[])).push({t:X.t,low:m.low,cy:m.com.y,held,ph:X.ctx.phase||'',ge:gs?gs.e:0,ga:gs?gs.air:0,gcy:gs?gs.cy:0,gy:o.position.y}); } }
      const out={}; const dt=1/60; if(window.__DUMP){ const [dc,dw,d0,d1]=window.__DUMP.split(':'); if(dc===clip&&D[dw]) out._dump=D[dw].filter(r=>r.t>=+d0&&r.t<=+d1).map(r=>r.t.toFixed(3)+':'+r.cy.toFixed(4)+':'+r.low.toFixed(3)+':e'+(+r.ge).toFixed(3)+':a'+(r.ga?1:0)+':gy'+r.gy.toFixed(3)+':scy'+(+r.gcy).toFixed(4)).join(' '); }
      for(const k in D){ const A=D[k]; let sink=0, sinkAt='', fl=[];
        for(let i=0;i<A.length;i++){ if(A[i].low<-0.02 && -A[i].low>sink){ sink=-A[i].low; sinkAt=A[i].t.toFixed(2)+' '+A[i].ph.slice(0,30); }
          if(i<3||i>=A.length-3||A[i].held) continue; let air=true; for(let j=i-3;j<=i+3;j++) if(A[j].low<=0.03||A[j].held) air=false; if(!air) continue;
          const a=(A[i+2].cy-2*A[i].cy+A[i-2].cy)/(4*dt*dt); if(a>-6) fl.push([A[i].t,A[i].low,a,A[i].ph]); }
        const seg=[]; for(const f of fl){ const l=seg[seg.length-1]; if(l&&f[0]-l.e<0.05){ l.e=f[0]; l.mx=Math.max(l.mx,f[1]); } else seg.push({s:f[0],e:f[0],mx:f[1],a:f[2],ph:f[3]}); }
        out[k]={floatFrames:fl.length, sink:+sink.toFixed(2), sinkAt, segs:seg.slice(0,6).map(s=>`${s.s.toFixed(2)}-${s.e.toFixed(2)} up${s.mx.toFixed(2)} a${s.a.toFixed(1)} "${s.ph.slice(0,28)}"`).join(' | ')}; }
      return out; },[G,pg,clip]);
    console.log('== '+clip); for(const k in res) console.log('  '+k.padEnd(7)+JSON.stringify(res[k])); }
  console.log(errs.join('\n')||'noerr'); await b.close(); })();
