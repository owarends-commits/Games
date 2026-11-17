# assemble norah-player-preview.html from the reacher page: engine kept, the Reacher section swapped for pl.js
import json
s=open("reacher-preview.html").read(); pl=open("pl.js").read()
items=json.load(open("/home/user/owarends-commits/games/crossed/data/items/items.json"))["items"]
IT={k:[{"name":p["name"],"s":p["s"],"p":p["p"],"d":p["d"],"r":p["r"],"c":p["c"],"seg":p.get("seg",10)} for p in items[k]["parts"]] for k in ["revolver","flashlight"]}
pl=pl.replace("__ITEMS__",json.dumps(IT))
def rep(x,y,cnt=1):
    global s
    assert s.count(x)==cnt,(x[:70],s.count(x)); s=s.replace(x,y)
a=s.index("// ================================================================ the REACHER (BCROSS)"); b=s.index("// ---- his one elbow, solved")
s=s[:a]+pl+"\n\n"+s[b:]
h0=s.index("<title>"); h1=s.index("\n",h0); s=s[:h0]+"<title>Norah Player Animations</title>"+s[h1:]
h0=s.index("<header>"); h1=s.index("</header>")+9
s=s[:h0]+'<header><h1>Norah · player animations</h1><p>Scared but steadying: she was never trained, so she shakes, flinches at her own shots and hunches, but once the gun is up and held the tremor settles. The flashlight rides under the revolver, wrists crossed, so the beam follows her aim. The revolver and flashlight are built from the game\'s item data, and the flashlight is a real light. An ACROSS stands in as target and attacker. Nothing here is in the playground yet.</p></header>'+s[h1:]
s=s.replace('aria-label="Reacher animation preview"','aria-label="Norah player animation preview"').replace(">Looms at range</b>",">Scared idle</b>").replace("Loading the Reacher…","Loading Norah…")
r0=s.index('    <button class="anim" data-a="loom"'); r1=s.index('    <div class="opts">')
B=[("Moving",None),("idle","Scared idle","Breathing hard, looking about; the light follows her eyes. A noise makes her jump."),("walk","Cautious walk","Slow steps, the light ahead and the gun low, her head never still."),
 ("run","Panicked run","Gun and light pumping; one look back over her shoulder."),("turn","Startled turn","Her head snaps round first, then two quick steps to face it, gun coming up."),
 ("crouch","Crouch","Drops into a crouch, creeps forward at 0.9 m/s, stands."),("land","Hard landing","Steps off a 60 cm ledge, lands hard with a hand to the floor, a woozy beat, gets up."),
 ("Gun",None),("aim","Raise and aim","Up into the hold, wrists crossed, the beam on the target. The shake settles as she holds."),("aimwalk","Aimed walk","0.7 m/s on the aim: forward, to the side, backing away."),
 ("fire","Fire","Four shots. The first makes her flinch hard, eyes shut; the kick throws the aim up and she brings it back."),("empty","Empty click","Click. She starts, then tips the gun to look at it."),
 ("reload","Reload","Light tucked under her arm, cylinder out, empties punched out, five rounds thumbed in, flicked shut. Under pressure she fumbles one."),
 ("Dodge and shove",None),("dodge","Dodge","It lunges; a desperate stumbling sidestep, nearly over, catches herself. It sprawls past."),("shove","Shove","Too close: both forearms into its chest, it goes down, she backs off onto the aim."),
 ("Getting hurt",None),("flinch","Flinch","A swipe catches her arm; she flinches away and brings the aim back."),("stagger","Stagger","A lunge hits her square: knocked back a metre on stumbling steps."),
 ("down","Knocked down","Over backward, dazed on the floor, rolls up and gets up."),("grab","Grabbed","Its hands on her shoulders, its face at hers. Mash to shove it off, or it bites."),
 ("death","Death","Her knees go, the gun drops, she folds onto her side; the light rolls away on the floor.")]
rail=""; n=0
for e in B:
    if e[1] is None: rail+=f'    <p class="grp">{e[0]}</p>\n'; continue
    n+=1; rail+=f'    <button class="anim" data-a="{e[0]}" aria-pressed="{"true" if n==1 else "false"}"><i class="k">{n}</i><strong>{e[1]}</strong><span>{e[2]}</span></button>\n'
s=s[:r0]+rail+s[r1:]
o0=s.index('    <label class="l" for="oModel">'); o1=s.index('    <p class="note">')
s=s[:o0]+'''    <label class="l" for="oModel" hidden>Model <select id="oModel"><option value="norah">Norah</option></select></label>
    <label class="l" for="oReload">Reload <select id="oReload"><option value="alt">Alternate</option><option value="calm">Calm</option><option value="rushed">Under pressure</option></select></label>
    <label class="l" for="oGrab">Grabbed <select id="oGrab"><option value="alt">Alternate</option><option value="free">She shoves it off</option><option value="fail">It bites</option></select></label>
'''+s[o1:]
rep(".anim{display:grid;",".grp{margin:10px 0 2px;font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}\n.anim{display:grid;")
rep("const g=await load(`m/bcross/reacher/${key}.json`); if(runner){ goreClear(); scene.remove(runner.group); scene.remove(runner.shadow); }\n  RC=buildChains(g); runner=makeChar(g); chainRig(runner,RC); headCentre(runner); MIR=false; makeGhosts(runner);",
    "const g=await load(`m/cast/${key}.json`); if(runner){ goreClear(); scene.remove(runner.group); scene.remove(runner.shadow); }\n  runner=makeChar(g); MIR=false; makeGhosts(runner);")
rep('  for(const el of document.querySelectorAll("[data-kind]")) el.hidden=!(el.dataset.kind==="both"||el.dataset.kind===RC.kind); if(!ORDERS[RC.kind].includes(cur)) cur="loom";\n','')
rep('let runner=null, norah=null, cur="loom"','let runner=null, norah=null, cur="idle"')
rep('if(on) start("loom"); });','if(on) start("idle"); });')
rep('await setModel("reacher_m01");','await setModel("norah");')
rep('const ng=await load("m/cast/norah.json"); norah={c:makeChar(ng),x:3.2,kb:0,kt:0,kv:0,fall:0}; norah.c.group.visible=false;\n','')
rep("ctx.post=null; ctx.onLimbs=false;","ctx.post=null; ctx.post2=null; ctx.onLimbs=false;")
rep("retarget(runner); ghostRecord(runner);","retarget(runner); if(ctx.post2){ runner.group.updateMatrixWorld(true); ctx.post2(dt); } ghostRecord(runner);")
rep("runner.group.rotation.set(0,ctx.yaw,0); unnatural(runner,ctx);","runner.group.rotation.set(0,ctx.yaw,0); if(ctx.fall) runner.group.rotateX(-ctx.fall); if(ctx.roll) runner.group.rotateZ(ctx.roll); unnatural(runner,ctx);")
rep("stepBystander(dt);","stepBystander(dt); atkStep(dt);")
rep('(rp.x+3.2)/2);','(ctx.camX??rp.x+0.8));')
rep('let p; if(camMode==="side") p=new THREE.Vector3(fx,1.75,8.4); else if(camMode==="front") p=new THREE.Vector3(fx+6.2,1.7,0.4);',
    'let p; if(camMode==="side") p=new THREE.Vector3(fx,1.3,ctx.camD??5.6); else if(camMode==="front") p=new THREE.Vector3(fx+4.6,1.5,0.4);')
rep('cam.lookAt(camMode==="front"?fx:(camMode==="follow"?rp.x+1.5:fx),1.35,0);','cam.lookAt(camMode==="front"?fx:(camMode==="follow"?rp.x+1.5:fx),0.95,0);')
# a darker room so the flashlight reads
rep("scene.add(new THREE.HemisphereLight(0xd8dce6,0x2a2218,0.85));","scene.add(new THREE.HemisphereLight(0xd8dce6,0x2a2218,0.72));")
rep("const sun=new THREE.DirectionalLight(0xfff0dd,0.7);","const sun=new THREE.DirectionalLight(0xfff0dd,0.55);")
open("norah-player-preview.html","w").write(s)
open("np_test.html","w").write(open("oa_test.html").read()[:205]+s)
print(len(s))
