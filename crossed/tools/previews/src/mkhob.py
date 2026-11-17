# wrap the Hob preview (crossed/tools/hob_preview/src) into one closed module for the playground: pv_hob.js
#   python3 mkhob.py <hob_preview/src dir>
# The Hob is one of a kind: the module holds one Hob. Its engine and creature code go in whole; the clips are changed
# only where the preview scripted Norah: here her real position goes in, and her real shots decide the throne grab.
import sys, re
R = (sys.argv[1] if len(sys.argv) > 1 else '/home/user/owarends-commits/games/crossed/tools/hob_preview/src').rstrip('/') + '/'
sc = open(R+'scene.js').read(); eng = open(R+'engine.js').read(); hob = open(R+'hob.js').read(); run = open(R+'run.js').read()
def take(s, a, b):
    i = s.index(a); j = s.index(b, i); return s[i:j]
def rep(s, x, y, cnt=1):
    n = s.count(x)
    if n != cnt: sys.exit(f"mkhob: matched {n}x (want {cnt}): {x[:100]}")
    return s.replace(x, y)
canvas = take(sc, 'function canvasTex(', '\n(function(){') + '\n' + take(sc, 'function blob(){', '\n// ') if '\n// ' in sc[sc.index('function blob(){'):] else take(sc, 'function canvasTex(', '\n(function(){') + '\n' + sc[sc.index('function blob(){'):]
eng = eng.replace('"use strict";', '')
eng = re.sub(r'let cueT=0; function cue\(s\)\{.*?\n', 'let cueT=0; function cue(s){}\n', eng, count=1, flags=re.S)
eng = re.sub(r'let dmgT=0; function dmg\(a,b\)\{.*?\n', 'let dmgT=0; function dmg(a,b){}\n', eng, count=1, flags=re.S)
eng = rep(eng, 'let hold=0; function hitStop(s)', 'let slow=false; let hold=0; function hitStop(s)')
setup = take(run, 'function setupHob(g){', '\nfunction start(a)')
setup = rep(setup, 'scene.add(group);', 'STAGE.add(group);')
setup = rep(setup, 'boneHelp=new THREE.SkeletonHelper(g.scene); boneHelp.visible=false; scene.add(boneHelp); ', '')
setup = rep(setup, 'const sh=blob(); sh.scale.set(3.2,1,11); H.shadow=sh;', 'const sh=blob(); sh.scale.set(3.2,1,11); STAGE.add(sh); H.shadow=sh;')
# ---- the one-handed chase grab: aims at her where she really is; the host says when the hand has her (ctx.got)
hob = rep(hob, 'const tm=Math.min(t,tc+0.35), cyc=tm/T,', 'const tm=Math.min(t,(ctx.got??1e9)+0.35), cyc=tm/T,')
hob = rep(hob, 'const sw=hauling?Math.sin(Math.PI*hu):0, got=t>=tc, sqT=t-tc;', 'const sw=hauling?Math.sin(Math.PI*hu):0, got=ctx.got!=null, sqT=t-(ctx.got??tc);')
hob = rep(hob, 'const herWX=Xs+cfg.catchZ+cfg.lead*(1-sat(t/tc)), C0=new V3(cfg.side,1.0,herWX-X);', 'const C0=ctx.herW?w2m(ctx.herW):new V3(cfg.side,1.0,Xs+cfg.catchZ+cfg.lead*(1-sat(t/tc))-X);')
# ---- the throne grab: it catches her only if she is under it when it lands; her two real shots (cross or eyes) free her
hob = rep(hob, 'const tPush=1.7, tLaunch=2.0, tLand=2.62, tStill=3.5, tDraw=4.4, shot1=6.0, shot2=6.8;', 'const tPush=1.7, tLaunch=2.0, tLand=2.62, tStill=3.5, tDraw=4.4, shot1=ctx.s1??99, shot2=ctx.s2??99;')
hob = rep(hob, 'if(ctx.caught==null && t>=tLand-0.06) ctx.caught=t;', 'if(ctx.caught==null && !ctx.missed && t>=tLand-0.06){ const hm=ctx.herW?w2m(ctx.herW):null; if(!hm||(hm.z>0.5&&hm.z<4.4&&Math.abs(hm.x)<1.9)) ctx.caught=t; else ctx.missed=t; }')
hob = rep(hob, 'if(ctx.caught==null) herM=new V3(herSide,1.0,herW0+0.5*(t-tPush)-X);', 'if(ctx.caught==null) herM=ctx.herW?w2m(ctx.herW):new V3(herSide,1.0,herW0+0.5*(t-tPush)-X);')
hob = rep(hob, 'ctx.catchM||(ctx.catchM=new V3(herSide,1.0,herW0+0.5*(ctx.caught-tPush)-X));', 'ctx.catchM||(ctx.catchM=ctx.herW?w2m(ctx.herW):new V3(herSide,1.0,herW0+0.5*(ctx.caught-tPush)-X));')
hob = rep(hob, '`draws her toward the mouth · ${ctx.route==="eyes"?"SHOOT ITS EYES":"SHOOT THE CROSS ON ITS RIGHT ARM"} (0 / 2)`', '`draws her toward the mouth · ${ctx.route==="eyes"?"SHOOT ITS EYES":ctx.route==="cross"?"SHOOT THE CROSS ON ITS RIGHT ARM":"SHOOT THE CROSS ON ITS RIGHT ARM, OR ITS EYES"} (0 / 2)`')
hob = rep(hob, 'fireAt(p,true); blood(p,26,2.6);', 'blood(p,26,2.6);')
hob = rep(hob, '} else { fireAt(p); ctx.flare=1; } };', '} else { ctx.flare=1; } };')
live = open('hob_live.js').read()
mod = f"""// ================================================================ PV_HOB: the Hob preview (crossed/tools/hob_preview) wrapped for the playground (made by mkhob.py)
const PV_HOB=(function(scene){{
let STAGE=null;
{canvas}
{eng}
{hob}
{setup}
{live}
}})(scene);
"""
open('pv_hob.js', 'w').write(mod); print('pv_hob.js', len(mod)//1024, 'KB')
