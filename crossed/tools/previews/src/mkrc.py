# assemble reacher-preview.html from the contortionist page: engine kept, the Contortionist section swapped for rc.js
import re
src=open("contortionist-preview.html").read(); rc=open("rc.js").read()
a=src.index("// ================================================================ the CONTORTIONIST"); b=src.index("// ---- his one elbow, solved")
s=src[:a]+rc+"\n\n"+src[b:]
def rep(x,y,cnt=1):
    global s
    assert s.count(x)==cnt,(x[:70],s.count(x)); s=s.replace(x,y)
# header + rail
h0=s.index("<title>"); h1=s.index("\n",h0); s=s[:h0]+"<title>Reacher Preview</title>"+s[h1:]
h0=s.index("<header>"); h1=s.index("</header>")+9
s=s[:h0]+'<header><h1>Reacher · BCROSS</h1><p>Animation proposals for the Reachers: three with necks two or three times a person\'s length, two with arms near four metres long. They loom at the edge of their reach and strike from there. The long parts bend along their whole length on a chain of joints added at load (the model files are untouched), and the physics guard weighs them by volume like the rest of the body. Nothing here is in the playground yet.</p></header>'+s[h1:]
s=s.replace('aria-label="Contortionist animation preview"','aria-label="Reacher animation preview"').replace(">Spider crawl</b>",">Looms at range</b>").replace("Loading the Contortionist…","Loading the Reacher…")
r0=s.index('    <button class="anim" data-a="crawl"'); r1=s.index('    <div class="opts">')
rail='''    <button class="anim" data-a="loom" data-kind="both" aria-pressed="true"><i class="k">1</i><strong>Looms at range</strong><span>It comes on slowly, swaying from the hips, and stops at the very edge of its reach. When she steps in, it backs off to keep that distance and settles again. The neck sways over her like a reed; the arm ones drag their arms along the floor ahead of them.</span></button>
    <button class="anim" data-a="whip" data-kind="neck" aria-pressed="false"><i class="k">2</i><strong>Whip headbutt</strong><span>The neck draws back into an S (the tell), then snaps out straight, the base first and the head last, and the head slams into her from out of her reach.</span></button>
    <button class="anim" data-a="bite" data-kind="neck" aria-pressed="false"><i class="k">3</i><strong>Bite from above</strong><span>It raises its neck tall over her, arches it over, and the head comes down on her shoulder from above and worries at it.</span></button>
    <button class="anim" data-a="coil" data-kind="neck" aria-pressed="false"><i class="k">4</i><strong>Neck coil</strong><span>The neck goes out and wraps round her chest and shoulders, then squeezes. Mash to pry it loose before it brings its head round into her face.</span></button>
    <button class="anim" data-a="neckshot" data-kind="neck" aria-pressed="false"><i class="k">5</i><strong>Shot in the neck</strong><span>Shot mid-wind-up: the neck buckles and sways, and the strike still comes, but wide and low.</span></button>
    <button class="anim" data-a="swipe" data-kind="arm" aria-pressed="false" hidden><i class="k">2</i><strong>Long swipe</strong><span>One arm comes up off the floor and out wide behind it, then sweeps across at her waist, the hand trailing, and slaps her aside from three metres.</span></button>
    <button class="anim" data-a="snatch" data-kind="arm" aria-pressed="false" hidden><i class="k">3</i><strong>Snatch and reel in</strong><span>An arm shoots out and wraps round her waist; it hauls her in, the slack piling on the floor, and bends to bite. Mash to break the grip.</span></button>
    <button class="anim" data-a="trip" data-kind="arm" aria-pressed="false" hidden><i class="k">4</i><strong>Trip from range</strong><span>An arm sweeps low along the floor and takes her feet out. While she's down the other comes up over and down onto her chest and drags her toward it, until she kicks it off and gets up.</span></button>
    <button class="anim" data-a="armshot" data-kind="arm" aria-pressed="false" hidden><i class="k">5</i><strong>Arm shot off</strong><span>She shoots an arm through one of its three main joints. The rest of the arm drops, the stump thrashes and bleeds, and its next swipe falls short of her.</span></button>
'''
s=s[:r0]+rail+s[r1:]
o0=s.index('    <label class="l" for="oDrop">'); o1=s.index('    <p class="note">')
opts='''    <label class="l" for="oModel">Model <select id="oModel"><option value="reacher_m01">m01 · neck (3.1 m)</option><option value="reacher_f01">f01 · neck (2.9 m)</option><option value="reacher_f03">f03 · neck (2.5 m)</option><option value="reacher_f02">f02 · arms (1.85 m)</option><option value="reacher_m02">m02 · arms (1.86 m)</option></select></label>
    <label class="l" for="oCoil" data-kind="neck">Coil <select id="oCoil"><option value="alt">Alternate</option><option value="free">She pries it loose</option><option value="fail">It bites</option></select></label>
    <label class="l" for="oSnatch" data-kind="arm" hidden>Snatch <select id="oSnatch"><option value="alt">Alternate</option><option value="free">She breaks the grip</option><option value="fail">It bites</option></select></label>
    <label class="l" for="oJoint" data-kind="arm" hidden>Shot at <select id="oJoint"><option value="alt">Each joint in turn</option><option value="1">The first joint</option><option value="2">The middle joint</option><option value="3">The last joint</option></select></label>
'''
s=s[:o0]+opts+s[o1:]
# load: chains first, then the rig
rep("const g=await load(`m/bcross/contortionist/${key}.json`); if(runner){ scene.remove(runner.group); scene.remove(runner.shadow); }\n  runner=makeChar(g); MIR=heavySide(runner)===\"L\"; makeGhosts(runner);",
    "const g=await load(`m/bcross/reacher/${key}.json`); if(runner){ goreClear(); scene.remove(runner.group); scene.remove(runner.shadow); }\n  RC=buildChains(g); runner=makeChar(g); chainRig(runner,RC); headCentre(runner); MIR=false; makeGhosts(runner);\n  for(const el of document.querySelectorAll(\"[data-kind]\")) el.hidden=!(el.dataset.kind===\"both\"||el.dataset.kind===RC.kind); if(!ORDERS[RC.kind].includes(cur)) cur=\"loom\";")
rep("solePts(runner,\"L\"); footAnchor(runner); limbAnchor(runner); runner.hip0=runner.R.hip0; }","solePts(runner,\"L\"); footAnchor(runner); runner.hip0=runner.R.hip0; }")
rep('let runner=null, norah=null, cur="crawl"','let runner=null, norah=null, cur="loom"')
rep("  if(!runner) return; if(wallMesh) wallMesh.visible=!!(ctx&&ctx.wallOn);","  if(!runner) return;")
e0=s.index("  for(const e of ctx.events){ if(e.kind===\"stomp\")"); e1=s.index("  runner.group.position.y=ctx.plOn?(ctx.y||0):(ctx.elev||0);")
s=s[:e0]+'''  for(const e of ctx.events){ if(e.kind==="stomp"){ const f=runner.B["foot_"+e.side]; const p=new THREE.Vector3(); f.getWorldPosition(p); puff(p,e.strength); shake=Math.max(shake,0.03*e.strength); }
    if(RCEV[e.kind]) RCEV[e.kind](e); if(DMG[e.kind]) showDmg(e.kind); }
'''+s[e1:]
rep('if(t>LEN[cur]){ if(playAll){ const order=["crawl","bend","fold","climb","drop","strike","wrap","bite"]; start(order[(order.indexOf(cur)+1)%order.length]); } else start(cur); }',
    'if(t>LEN[cur]){ if(playAll){ const order=ORDERS[KIND()]; start(order[(order.indexOf(cur)+1)%order.length]); } else start(cur); }')
rep('tog("oAll",on=>{ playAll=on; if(on) start("idle"); });','tog("oAll",on=>{ playAll=on; if(on) start("loom"); });')
rep('await setModel("contortionist_m01");','await setModel("reacher_m01");')
# camera: tall bodies and long reach
rep('let p; if(camMode==="side") p=new THREE.Vector3(fx,1.35,6.4); else if(camMode==="front") p=new THREE.Vector3(fx+5.2,1.3,0.4);',
    'let p; if(camMode==="side") p=new THREE.Vector3(fx,1.75,8.4); else if(camMode==="front") p=new THREE.Vector3(fx+6.2,1.7,0.4);')
rep('cam.lookAt(camMode==="front"?fx:(camMode==="follow"?rp.x+1.5:fx),1.0,0);','cam.lookAt(camMode==="front"?fx:(camMode==="follow"?rp.x+1.5:fx),1.35,0);')
rep('const x0=ctx.x; const J=A[cur].step(t,dt,ctx);','const x0=ctx.x; const J=A[cur].step(t,dt,ctx); if(!ctx.gait) ctx.v=0;')
open("reacher-preview.html","w").write(s)
open("rch_test.html","w").write(open("oa_test.html").read()[:205]+s)
print(len(s))
