# assemble splithead-preview.html from the reacher page: chain machinery kept, its clips and tables swapped for sh.js
s=open("reacher-preview.html").read(); sh=open("sh.js").read()
def rep(x,y,cnt=1):
    global s
    assert s.count(x)==cnt,(x[:70],s.count(x)); s=s.replace(x,y)
a=s.index("// ================================================================ the clips"); b=s.index("// ---- the cut arm and blood")
s=s[:a]+s[b:]
a=s.index("const ORDERS={neck:"); b=s.index("// ---- his one elbow, solved")
s=s[:a]+sh+"\n\n"+s[b:]
rep("const Q=path(hi); if(yMin!=null) Q.y=Math.max(Q.y,yMin); Q.sub(P); const C=p.localToWorld(off.clone()).sub(P);","const ym=yMin==null?null:typeof yMin===\"function\"?yMin(i+1):yMin; const Q=path(hi); if(ym!=null) Q.y=Math.max(Q.y,ym); Q.sub(P); const C=p.localToWorld(off.clone()).sub(P);\n    if(ym!=null&&Q.lengthSq()>1e-10){ const Ln=C.length(); Q.normalize(); if(P.y+Q.y*Ln<ym){ const h=Math.hypot(Q.x,Q.z)||1e-6, dy=clamp((ym-P.y)/Ln,-1,1), hs=Math.sqrt(Math.max(0,1-dy*dy)); Q.set(Q.x/h*hs,dy,Q.z/h*hs); } }   /* the joint itself never lands below its floor */")
rep("    let s1=sl; const far=sl+len*3+4;","    if(path(sl).distanceTo(P)>=len) sl+=len*0.999;   /* knocked off the curve (the floor): still move on along it */\n    let s1=sl; const far=sl+len*3+4;")
rep("if(bn.userData.detached) continue;","if(bn.userData.detached||bn.userData.noContact) continue;")
rep("N=clamp(Math.round(L/0.17),6,14)","N=clamp(Math.round(L/0.17),6,30)")
h0=s.index("<title>"); h1=s.index("\n",h0); s=s[:h0]+"<title>Split-Head Reacher</title>"+s[h1:]
h0=s.index("<header>"); h1=s.index("</header>")+9
s=s[:h0]+'<header><h1>Split-Head Reacher · BCROSS unique</h1><p>The f01 Reacher: her head is split across, the skull and upper fangs on top, a fanged flap below, and her own face hanging upside-down beneath it. Her body sits in the next room; the neck, stretched to 5 m at load (the model file is untouched), runs along the floor and through the doorway, and the head hunts on it. The head is quick and hard to hurt; the body is the weak point. Nothing here is in the playground yet.</p></header>'+s[h1:]
s=s.replace('aria-label="Reacher animation preview"','aria-label="Split-head Reacher animation preview"').replace(">Looms at range</b>",">The neck hunts</b>").replace("Loading the Reacher…","Loading the split-head Reacher…")
r0=s.index('    <button class="anim" data-a="loom"'); r1=s.index('    <div class="opts">')
rail='''    <button class="anim" data-a="hunt" aria-pressed="true"><i class="k">1</i><strong>The neck hunts</strong><span>The head comes through the doorway low along the floor, the face dragging, rises into her room, sways and searches, and finds her. The slack coiled beside the body pays out as it comes.</span></button>
    <button class="anim" data-a="bait" aria-pressed="false"><i class="k">2</i><strong>Face swings like bait</strong><span>It holds off at her eye level and lets the hanging face down on a strand, swinging it slowly. She lowers the gun and steps in; the face is snatched up and the split snaps at her.</span></button>
    <button class="anim" data-a="bite2" aria-pressed="false"><i class="k">3</i><strong>The split opens to bite</strong><span>It draws back as the split opens (the tell), lunges, clamps on her shoulder and worries at it until she wrenches free.</span></button>
    <button class="anim" data-a="engulf" aria-pressed="false"><i class="k">4</i><strong>Engulfs her head</strong><span>The head rises over her, turns face-down, opens the split as wide as it goes and drops over her head and shoulders. Mash to force it open, or it bites down.</span></button>
    <button class="anim" data-a="headshot" aria-pressed="false"><i class="k">5</i><strong>Shooting the head</strong><span>It darts side to side: shots go past it, one glances off the skull. Only a shot into the open split counts: it snaps shut, recoils and sways, and the strike is spoiled.</span></button>
    <button class="anim" data-a="body" aria-pressed="false"><i class="k">6</i><strong>Find the body</strong><span>She comes round into its room. The body goes down in three shots while the head, out in the other room, races back along the neck too late; the whole neck drops where it is.</span></button>
'''
s=s[:r0]+rail+s[r1:]
o0=s.index('    <label class="l" for="oModel">'); o1=s.index('    <p class="note">')
s=s[:o0]+'''    <label class="l" for="oModel">Model <select id="oModel"><option value="reacher_f01">f01 · split head (neck 5 m)</option></select></label>
    <label class="l" for="oEngulf">Engulf <select id="oEngulf"><option value="alt">Alternate</option><option value="free">She forces it open</option><option value="fail">It bites down</option></select></label>
'''+s[o1:]
rep("RC=buildChains(g); runner=makeChar(g); chainRig(runner,RC); headCentre(runner);","stretchNeck(g,SH.L); RC=buildChains(g); SPL=splitRig(g); runner=makeChar(g); chainRig(runner,RC); RC.r=neckR(runner);")
rep('if(!ORDERS[RC.kind].includes(cur)) cur="loom";','if(!ORDERS[RC.kind].includes(cur)) cur="hunt";')
rep('let runner=null, norah=null, cur="loom"','let runner=null, norah=null, cur="hunt"')
rep('if(on) start("loom"); });','if(on) start("hunt"); });')
rep('await setModel("reacher_m01");','await setModel("reacher_f01");')
rep("ctx.post=null; ctx.onLimbs=false;","ctx.post=null; ctx.post2=null; ctx.onLimbs=false;")
rep("retarget(runner); ghostRecord(runner);","retarget(runner); if(ctx.post2){ runner.group.updateMatrixWorld(true); ctx.post2(dt); } ghostRecord(runner);")
rep('(rp.x+3.2)/2);','(ctx.camX??(rp.x+3.2)/2));')
rep("for(let k=0;k<all.length;k++) if(B.bone[k]&&B.bone[k].userData.detached) all[k].y=99;","for(let k=0;k<all.length;k++) if(B.bone[k]&&(B.bone[k].userData.detached||B.bone[k].userData.noContact)) all[k].y=99;   /* noContact: carried on its own (a neck lying on the floor), still weighed */")
rep("RC.r=neckR(runner);","RC.r=neckR(runner); RC.rk=neckRk(runner); for(const [n,b] of Object.entries(runner.B)) if(/^(nk\\d+|head|jawU|jawL|face|hairL|hairR)$/.test(n)) b.userData.noContact=true;")
open("splithead-preview.html","w").write(s)
open("sh_test.html","w").write(open("oa_test.html").read()[:205]+s)
print(len(s))
