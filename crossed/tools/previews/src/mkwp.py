# assemble norah-player-preview.html from the reacher page: engine kept, the Reacher section swapped for pl.js
import json
s=open("reacher-preview.html").read(); pl=open("pl.js").read(); pl=pl[:pl.index("const ORDERS=")]+open("wp.js").read()
items=json.load(open("/home/user/owarends-commits/games/crossed/data/items/items.json"))["items"]
IT={k:[{"name":p["name"],"s":p["s"],"p":p["p"],"d":p["d"],"r":p["r"],"c":p["c"],"seg":p.get("seg",10)} for p in items[k]["parts"]] for k in ["revolver","flashlight"]}
pl=pl.replace("__ITEMS__",json.dumps(IT))
def rep(x,y,cnt=1):
    global s
    assert s.count(x)==cnt,(x[:70],s.count(x)); s=s.replace(x,y)
a=s.index("// ================================================================ the REACHER (BCROSS)"); b=s.index("// ---- his one elbow, solved")
s=s[:a]+pl+"\n\n"+s[b:]
h0=s.index("<title>"); h1=s.index("\n",h0); s=s[:h0]+"<title>Norah Weapons</title>"+s[h1:]
h0=s.index("<header>"); h1=s.index("</header>")+9
s=s[:h0]+'<header><h1>Norah · weapons she finds</h1><p>Three firearms, three hand weapons, a road flare and a flare gun, each built in the game\'s item format with its working parts: the shotgun\'s pump, the rifle\'s bolt, the pistol\'s slide and magazine, the flare gun\'s barrel. The long guns take both hands, so she carries no light with them; with the pistol and flare gun she braces the flashlight under the gun hand; with the rest it is in her other hand. Nothing here is in the game or the playground yet.</p></header>'+s[h1:]
s=s.replace('aria-label="Reacher animation preview"','aria-label="Norah weapons preview"').replace(">Looms at range</b>",">Shotgun · aim</b>").replace("Loading the Reacher…","Loading Norah…")
r0=s.index('    <button class="anim" data-a="loom"'); r1=s.index('    <div class="opts">')
B=[("Pump shotgun",None),("sg_aim","Aim","Low ready to the shoulder, her cheek on the stock. Both hands on the gun, so no light."),("sg_fire","Fire and pump","A heavy kick rocks her back; she racks the pump and the hull flies out."),("sg_load","Reload","Turns it over and thumbs four shells into the port underneath, then racks one in."),
 ("Hunting rifle",None),("rf_aim","Aim","Up to her shoulder, her eye to the scope, breath held."),("rf_fire","Fire and bolt","A hard kick; up, back (the case flies), forward, down."),("rf_load","Reload","Bolt open, four rounds pressed down into the action, bolt shut."),
 ("9mm pistol",None),("ps_aim","Aim","Into the two-handed hold, the light under it."),("ps_fire","Fire","Four quick shots; the slide cycles and cases spin out; it locks back empty."),("ps_load","Reload","The empty magazine drops; a fresh one, a slap, the slide drops."),
 ("Hatchet",None),("hx_chop","Chop","Up over her shoulder and down into its neck."),("hx_flurry","Flurry","Two desperate chops, backhand and forehand."),
 ("Crowbar",None),("cb_swing","Swing","Round into the side of its head."),("cb_pry","Pry a door","The claw in the gap; she leans back on it until it gives."),
 ("Kitchen knife",None),("kn_slash","Slash and stab","Short and fast, at one too close."),("kn_free","Break a grab","Grabbed: she drives the knife up into its neck until it lets go."),
 ("Road flare",None),("fl_strike","Strike","Cap off, struck, it burns red; she holds it up and the creature backs off from the light."),("fl_throw","Throw","Lobbed underarm down the hall; it lands and burns there."),
 ("Flare gun",None),("fg_fire","Fire","Hammer back, aimed high; the flare arcs out burning and lands far off."),("fg_load","Reload","Breaks it open, the spent shell drops, a fresh one in, snapped shut.")]
rail=""; n=0
for e in B:
    if e[1] is None: rail+=f'    <p class="grp">{e[0]}</p>\n'; continue
    n+=1; rail+=f'    <button class="anim" data-a="{e[0]}" aria-pressed="{"true" if n==1 else "false"}"><i class="k">{n}</i><strong>{e[1]}</strong><span>{e[2]}</span></button>\n'
s=s[:r0]+rail+s[r1:]
o0=s.index('    <label class="l" for="oModel">'); o1=s.index('    <p class="note">')
s=s[:o0]+'''    <label class="l" for="oModel" hidden>Model <select id="oModel"><option value="norah">Norah</option></select></label>
    <label class="l" for="oReload" hidden>Reload <select id="oReload"><option value="calm">Calm</option></select></label>
    <label class="l" for="oGrab" hidden>Grabbed <select id="oGrab"><option value="free">Free</option></select></label>
'''+s[o1:]
rep(".anim{display:grid;",".grp{margin:10px 0 2px;font-family:var(--mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}\n.anim{display:grid;")
rep("const g=await load(`m/bcross/reacher/${key}.json`); if(runner){ goreClear(); scene.remove(runner.group); scene.remove(runner.shadow); }\n  RC=buildChains(g); runner=makeChar(g); chainRig(runner,RC); headCentre(runner); MIR=false; makeGhosts(runner);",
    "const g=await load(`m/cast/${key}.json`); if(runner){ goreClear(); scene.remove(runner.group); scene.remove(runner.shadow); }\n  runner=makeChar(g); MIR=false; makeGhosts(runner);")
rep('  for(const el of document.querySelectorAll("[data-kind]")) el.hidden=!(el.dataset.kind==="both"||el.dataset.kind===RC.kind); if(!ORDERS[RC.kind].includes(cur)) cur="loom";\n','')
rep('let runner=null, norah=null, cur="loom"','let runner=null, norah=null, cur="sg_aim"')
rep('if(on) start("loom"); });','if(on) start("sg_aim"); });')
rep("  goreStep(dt);","  goreStep(dt); flareStep(dt);")
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
open("norah-weapons-preview.html","w").write(s)
open("nw_test.html","w").write(open("oa_test.html").read()[:205]+s)
print(len(s))
