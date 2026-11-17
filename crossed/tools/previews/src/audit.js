// node audit.js <bp|ap|rp> [clip,clip...] [model]  -> per clip, per character: floating / sinking / non-ballistic flight / COM outside support
const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{ const [pg,clipsArg,model]=process.argv.slice(2); const b=await chromium.launch({args:['--use-gl=swiftshader']}); const p=await b.newPage({viewport:{width:640,height:480}});
  const errs=[]; p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  for(const [re,f] of [[/three\.min\.js/,'three.min.js'],[/GLTFLoader\.js/,'GLTFLoader.js'],[/SkeletonUtils\.js/,'SkeletonUtils.js']]) await p.route(re, r=>r.fulfill({body:fs.readFileSync(f),contentType:'application/javascript'}));
  await p.route(/fonts\./, r=>r.abort()); await p.goto(`http://127.0.0.1:8765/${pg}_test.html`);
  const G={bp:'__bp',ap:'__ap',rp:'__rp'}[pg];
  const ready={bp:'__bp&&__bp.BR&&__bp.nora',ap:'__ap&&__ap.ac&&__ap.nora',rp:'__rp&&__rp.runner'}[pg];
  for(let i=0;i<60&&!(await p.evaluate(r=>{ try{ return !!eval(r); }catch(e){ return false; } },ready));i++) await p.waitForTimeout(400);
  if(model){ await p.evaluate(m=>{ const s=document.getElementById('oModel'); s.value=m; s.dispatchEvent(new Event('change')); },model); await p.waitForTimeout(300); for(let i=0;i<40&&!(await p.evaluate(()=>document.getElementById('load').hidden));i++) await p.waitForTimeout(400); }
  if(!(await p.evaluate(()=>typeof PHYS!=='undefined'))) await p.addScriptTag({content:fs.readFileSync('phys.js','utf8')}); await p.addScriptTag({content:fs.readFileSync('audit_page.js','utf8')});
  const clips = clipsArg&&clipsArg!=='all' ? clipsArg.split(',') : await p.evaluate(pg=>pg==='bp'?["walk","vault","sweep","slam","lunge","pin","charge","punch","weak","eat","gut"]:pg==='ap'?["marionette","lurcher","grab","swipe","stumble","bite","drag","whip","trip","shot"]:["neutral","walk","sprint","butt","kick","stomp","grab","drop"],pg);
  for(const clip of clips){
    const res=await p.evaluate(([G,pg,clip])=>{ const X=window[G]; window.requestAnimationFrame=()=>0; X.renderer.render=()=>0; __AUD.reset(); X.start(clip);
      const len = pg==='rp' ? ({neutral:6, walk:13, sprint:4.6, butt:4.8, kick:3.6, stomp:3.8, grab:6.6, drop:6.6})[clip] : null;
      const chars = ()=> pg==='bp' ? {brute:X.BR.mesh, norah:X.nora.group} : pg==='ap' ? {across:X.ac.group, across2:X.ac2&&X.ac2.group, norah:X.nora.group} : {runner:X.runner.group, norah:X.norah&&X.norah.c&&X.norah.c.group};
      const R={}; let n=0, tl=0; const dt=1/60; const L=len||8; let lastT=-1;
      while(n++<60*14){ const t0=X.t; X.frame(dt); if(X.t<t0) break; // clip restarted
        if(X.t===t0) continue; // frozen frame (hit-stop)
        const cs=chars(); for(const k in cs){ if(!cs[k]) continue; const m=__AUD.step(k,cs[k],dt,X.t); if(!m) continue; const r=R[k]||(R[k]={hover:[],sink:0,flight:[],imb:[],zmp:[]});
          const ph=X.ctx.phase||'';
          if(m.low<-0.03) r.sink=Math.max(r.sink,-m.low);
          if(m.low>0.03){ if(m.a && m.a.y>-5) r.hover.push([+X.t.toFixed(2),+m.low.toFixed(2),+m.a.y.toFixed(1),ph]); else r.flight.push(+X.t.toFixed(2)); }
          else if(m.out!=null && m.out>0.06){ r.imb.push([+X.t.toFixed(2),+m.out.toFixed(2),ph]); r.imbMax=Math.max(r.imbMax||0,m.out); }
          else if(m.zmp!=null && m.zmp>0.25) r.zmp.push([+X.t.toFixed(2),+m.zmp.toFixed(2),ph]); } }
      const sum=a=>{ if(!a.length) return 'ok'; const seg=[]; let s=a[0],pr=a[0]; for(const q of a.slice(1)){ if(q[0]-pr[0]>0.05){ seg.push([s,pr]); s=q; } pr=q; } seg.push([s,pr]); return a.length+'f: '+seg.slice(0,8).map(([s,e])=>`${s[0]}-${e[0]}(${s[1]}) "${(s[3]||s[2]||'').toString().slice(0,34)}"`).join(' | '); };
      const out={}; for(const k in R){ const r=R[k]; out[k]={imbMax:(r.imbMax||0).toFixed(2),hover:sum(r.hover), sink:r.sink.toFixed(2), imbalance:sum(r.imb), zmp:sum(r.zmp), flightFrames:r.flight.length}; } return out; },[G,pg,clip]);
    console.log('== '+clip); for(const k in res) console.log('  '+k.padEnd(8)+JSON.stringify(res[k])); }
  console.log(errs.join('\n')||'noerr'); await b.close(); })();
