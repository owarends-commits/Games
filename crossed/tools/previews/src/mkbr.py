# wrap the two-armed Brute preview (brute-preview.html: m01, legless m02, split m03, armoured m04) into PV_BR for the playground.
# Its engine is its own (autoRig, the stump gait, bruteFrame), so it has its own tail (br_tail.js) and live clips (br_live.js).
import sys, re
s = open('brute-preview.html').read(); js = s[s.rindex('<script>') + 8:s.rindex('</script>')]
a = js.index('function blob(){'); b = js.index('const loader=new THREE.GLTFLoader()'); body = js[a:b]
def rep(x, y, cnt=1):
    global body
    n = body.count(x)
    if n != cnt: sys.exit(f"BR: patch matched {n}x (want {cnt}): {x[:90]}")
    body = body.replace(x, y)
rep('const BS={};', 'let BS={};   /* live: each body has its own, bound every frame */')
rep('const outcome=(id,ctx)=>{ const v=document.getElementById(id).value;', 'const outcome=(id,ctx)=>{ const v=(ctx.outSel&&ctx.outSel[id])||"a";')
rep('let dmgT=0; function dmg(a,b){', 'let dmgT=0; function dmg(a,b){ if(ctx&&ctx.events) ctx.events.push({kind:"dmg",a,b}); return;')
rep('let cueT=0; function cue(s){', 'let cueT=0; function cue(s){ return;')
rep('function wound(C,bone,off,n,kind,size){', 'function wound(C,bone,off,n,kind,size){ if(C===nora) return;')
rep('contactSolve(R,s,ct,dt);', 'if(nora&&nora.model) contactSolve(R,s,ct,dt);')
rep('function buildWall(){', 'function buildWall(){ if(ctx.live) return;')
rep('const burstLight=new THREE.PointLight(0xff8866,0,6); scene.add(burstLight);', 'const burstLight=new THREE.PointLight(0xff8866,0,6);   /* live: never added (a new light would recompile every material) */')
rep('nora.group.attach(sh.m);', 'sh.m.parent&&sh.m.parent.remove(sh.m);')
# grabs wait for her prompts: only a failed QTE ("a") kills or eats
rep('if(ctx.out!=="b"&&k>2.1){', 'if(ctx.out==="a"&&k>2.1){')
rep('ctx.out!=="b" && pull>=0.999', 'ctx.out==="a" && pull>=0.999')
# the sideways sway is an unstable pendulum that its stump placement can't always catch (it runs away after a few seconds):
# keep the body within 0.45 m of the middle of its stance
rep('g.zp=zp; g.vz+=wl*wl*(g.z-zp)*dt; g.z+=g.vz*dt;', 'g.zp=zp; g.vz+=wl*wl*(g.z-zp)*dt; g.z+=g.vz*dt; { const zm=(fz("L")+fz("R"))/2; if(g.z>zm+0.45){ g.z=zm+0.45; if(g.vz>0) g.vz=0; } if(g.z<zm-0.45){ g.z=zm-0.45; if(g.vz<0) g.vz=0; } }')
# live: the balance guard may shift the body to keep it over its support, but never runs away with it. Once a stump lifts as a
# fist it can decide the body is falling and carry it off at whatever speed the swinging stump gave its centre of mass (in the
# sweep, the punch, the lunge): the body slid 0.2 m a frame, sank up to 1.5 m into the floor, then snapped back metres in one frame.
rep('m.updateMatrixWorld(true); bruteGuard(st,dt,planted,slack);', 'm.updateMatrixWorld(true); bruteGuard(st,dt,planted,slack); { const lim=0.03, c0=PS.hx, c1=PS.hz; PS.hx=clamp(hx0+clamp(PS.hx-hx0,-lim,lim),-0.6,0.6); PS.hz=clamp(hz0+clamp(PS.hz-hz0,-lim,lim),-0.6,0.6); if(PS.e<-0.4) PS.e=-0.4; if(PS.e>e0+0.06) PS.e=e0+0.06; if(Math.abs(c0-PS.hx)>1e-4||Math.abs(c1-PS.hz)>1e-4){ PS.vx=0; PS.vz=0; PS.hinit=false; } }')
tail = open('br_tail.js').read(); lv = open('br_live.js').read()
mod = f"""// ================================================================ PV_BR: brute-preview.html wrapped for the playground (made by mkbr.py)
const PV_BR=(function(){{
let scene=null, t=0, ctx={{events:[]}}, cur=null; const PVHOOK={{}};
{body}
{tail}
{lv}
return {{ A, LIVE, makeChar:pvMakeChar, pvPrep, pvPost:null, pvSetup, pvBind, pvStep, pvFx, PHYS, P0, mix, PVHOOK, NX }};
}})();
"""
open('pv_br.js', 'w').write(mod); print('pv_br.js', len(mod) // 1024, 'KB')
