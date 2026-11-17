# wrap a preview page's engine and creature code into one closed module for the playground:
#   python3 mkpv.py <page.html> <NAME> <live.js> <out.js> [patch.py]
# The module holds everything the page defined (so names never clash with the playground or with another module), then
# pv_tail.js (one live frame of it) and the live clips in live.js, and returns its API as PV_<NAME>.
import sys, re
page, NAME, live, out = sys.argv[1:5]; patch = sys.argv[5] if len(sys.argv) > 5 else None
s = open(page).read(); js = s[s.rindex('<script>') + 8:s.rindex('</script>')]
a = js.index('function blob(){'); b = js.index('const loader=new THREE.GLTFLoader()')
body = js[a:b]
def rep(x, y, cnt=1):
    global body
    n = body.count(x)
    if n != cnt: sys.exit(f"{NAME}: patch matched {n}x (want {cnt}): {x[:90]}")
    body = body.replace(x, y)
# the page's own bits that have no place in a live body
rep('const NX=3.2;', 'let NX=3.2;   /* live: where she is along the stage line, set every frame */', body.count('const NX=3.2;'))
body = re.sub(r'const NX=3\.2,\s*', 'let NX=3.2; const ', body)
body = re.sub(r'document\.getElementById\(id\)\.value', '((ctx.outSel&&ctx.outSel[id])||"alt")', body)
body = re.sub(r'let dmgT=0; function showDmg\(k\)\{.*?\n', 'let dmgT=0; function showDmg(k){ if(PVHOOK.dmg) PVHOOK.dmg(k); }\n', body, count=1, flags=re.S)
if patch: exec(open(patch).read())
tail = open('pv_tail.js').read(); lv = open(live).read()
exports = "A, LIVE, makeChar, pvPrep:(typeof pvPrep===\"function\"?pvPrep:null), pvPost:(typeof pvPost===\"function\"?pvPost:null), pvSetup, pvBind, pvStep, pvFx, PHYS, P0, mix, PVHOOK, get NX(){ return NX; }"
mod = f"""// ================================================================ PV_{NAME}: {page} wrapped for the playground (made by mkpv.py)
const PV_{NAME}=(function(){{
let scene=null, runner=null, norah=null, t=0, ctx={{events:[]}}, cur=null; const PVHOOK={{}};
{body}
{tail}
{lv}
return {{ {exports} }};
}})();
"""
open(out, 'w').write(mod); print(out, len(mod) // 1024, 'KB')
