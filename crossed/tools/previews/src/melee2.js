// ---------------------------------------------------------------- swings that come from the whole body
// A swing is keyed in joint space ([time, pose, easing]). Each group of joints runs a little behind the one before it,
// hips -> chest -> shoulder -> elbow -> wrist, so the motion travels out along the body to the weapon, the way a real
// swing whips. c = the wrist cocked back (+) or snapped through (−). The weapon comes off the hand's own frame: its edge
// along her fingers, its handle along her thumb.
const CHAIN={hyaw:0,hroll:0,hp:0,hz:0,hd:0,lLx:0,lRx:0,kL:0,kR:0,lLz:0,lRz:0,syaw:0.035,sroll:0.035,sp:0.035,ny:0.05,nx:0.05,nz:0.05,aRx:0.065,aRy:0.065,aRz:0.065,eR:0.1,c:0.13,aLx:0.05,aLy:0.05,aLz:0.05,eL:0.08};
const ePow=u=>u*u, eOut=u=>1-(1-u)*(1-u);
function swingPose(K,t,J){ for(const f in CHAIN){ const tt=t-CHAIN[f]; let i=0; while(i<K.length-2&&tt>K[i+1][0]) i++; const a=K[i], b=K[i+1], va=a[1][f], vb=b[1][f]; if(va==null&&vb==null) continue;
    const u=sat((tt-a[0])/(b[0]-a[0])), e=(b[2]||sm5)(u), A=va??(f==="c"?0:J[f]), Bv=vb??(f==="c"?0:J[f]); if(f==="c") J.c=A+(Bv-A)*e; else J[f]=A+(Bv-A)*e; } return J; }
// the hand's frame from the rig: fingers along −y of the wrist, thumb along +z
function handFrame(s){ runner.group.updateMatrixWorld(true); const q=runner.R["wrist"+s].getWorldQuaternion(QI()); return {fingers:new V3(0,-1,0).applyQuaternion(q), thumb:new V3(0,0,1).applyQuaternion(q)}; }
function cock(s,c){ runner.R["wrist"+s].rotation.set(-c,0,0); }
function heldWeapon(k){ const H=handFrame("R"); inHand(k,H.fingers,H.thumb); }
// the stance for a swing: feet apart, knees soft; the left arm (with the light) counter-swings for balance
const MREADY={hyaw:0,syaw:0,sroll:0,sp:0.16,hz:0,aRx:-0.55,aRy:0.15,aRz:0.18,eR:1.25,c:0.1,aLx:-0.55,aLz:0.22,eL:1.15,nx:0.08,ny:0};
function meleeStance(t){ const J=nStand(t,0.6); J.lLx=-0.36; J.kL=0.3; J.lRx=0.26; J.kR=0.26; J.lLz=0.1; J.lRz=0.16; return Object.assign(J,MREADY); }
function chopPost(ctx){ cock("R",ctx.J.c||0); }
function chopPost2(ctx,k){ heldWeapon(k); lightLeft(null,1); }
// ---- hatchet: chop. Weight back, the arm up and back with the elbow high and the wrist cocked so the head hangs behind
// her shoulder; then hips, chest, shoulder, elbow and wrist come through in turn and the edge drives down into its neck;
// she follows through across her body and recovers
const H_WIND={hyaw:0.22,syaw:0.5,sroll:-0.16,sp:-0.04,hz:-0.04,aRx:-2.55,aRy:0.55,aRz:0.42,eR:2.0,c:0.55,aLx:-1.0,aLz:0.35,eL:0.8,nx:0.02,ny:-0.15,lLx:-0.3,lRx:0.32};
const H_HIT={hyaw:-0.2,syaw:-0.38,sroll:0.16,sp:0.36,hz:0.05,aRx:-1.15,aRy:0.05,aRz:0.12,eR:0.3,c:-0.3,aLx:-0.35,aLz:0.45,eL:0.6,nx:0.2,ny:0.1,lLx:-0.48,lRx:0.18};
const H_THRU={hyaw:-0.3,syaw:-0.52,sroll:0.22,sp:0.46,hz:0.06,aRx:-0.75,aRy:-0.1,aRz:0.05,eR:0.5,c:-0.45,aLx:-0.25,aLz:0.5,eL:0.7,nx:0.25,ny:0.12,lLx:-0.5,lRx:0.16};
A.hx_chop={ start(ctx){ wStart(ctx,"hatchet"); },
  step(t,dt,ctx){ const T=ctx.T, t0=0.7, tw=1.25, th=1.47, tf=1.7, tr=2.5;
    const K=[[0,MREADY],[t0,MREADY],[tw,H_WIND],[tw+0.08,H_WIND],[th,H_HIT,ePow],[tf,H_THRU,eOut],[tr,MREADY]];
    const J=swingPose(K,t,meleeStance(t)); ctx.J=J;
    if(t>th-0.02&&!T.h){ T.h=t; ctx.events.push({kind:"chop"}); }
    ctx.atk={x:0.98,z:0.08,yaw:-Math.PI/2,J:aReach(t,0.4)}; if(T.h){ const k=t-T.h; ctx.atk.J.nx=0.6*sm5(k/0.1); ctx.atk.J.sroll=-0.4*sm5(k/0.15); ctx.atk.fall=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.15,w:1.6}),dt,1.6,Math.PI/2-0.08)); ctx.atk.x=0.98+0.2*sm5(k/0.4); }
    ctx.post=()=>chopPost(ctx); ctx.post2=()=>chopPost2(ctx,"hatchet");
    ctx.phase= t<t0?"hatchet ready, the light in her other hand": t<tw+0.08?"weight back · up over her shoulder, the head hanging behind": t<tf?"hips, chest, arm, wrist · down into its neck":"follows through · it drops"; return fin(J); } };
// ---- hatchet: flurry. A forehand chop across from her right, carried round into a backhand from her left, the whole
// upper body winding and unwinding, more desperate than skilled
const F_BACK={hyaw:0.25,syaw:0.55,sroll:-0.1,sp:0.08,aRx:-1.55,aRy:0.7,aRz:0.85,eR:1.7,c:0.5,aLx:-0.9,aLz:0.2,eL:1.0,ny:-0.1};
const F_ACROSS={hyaw:-0.25,syaw:-0.55,sroll:0.12,sp:0.3,aRx:-1.25,aRy:-0.55,aRz:-0.15,eR:0.55,c:-0.4,aLx:-0.4,aLz:0.55,eL:0.6,ny:0.15};
const F_LEFT={hyaw:-0.35,syaw:-0.65,sroll:0.1,sp:0.25,aRx:-1.45,aRy:-0.9,aRz:-0.1,eR:1.75,c:0.5,aLx:-0.3,aLz:0.6,eL:0.6,ny:0.2};
const F_BACKHIT={hyaw:0.2,syaw:0.45,sroll:-0.08,sp:0.3,aRx:-1.3,aRy:0.35,aRz:0.75,eR:0.35,c:-0.45,aLx:-0.9,aLz:0.25,eL:1.0,ny:-0.15};
A.hx_flurry={ start(ctx){ wStart(ctx,"hatchet"); },
  step(t,dt,ctx){ const T=ctx.T;
    const K=[[0,MREADY],[0.6,MREADY],[1.0,F_BACK],[1.22,F_ACROSS,ePow],[1.5,F_LEFT,eOut],[1.72,F_BACKHIT,ePow],[2.0,Object.assign({},F_BACKHIT,{aRz:0.85,syaw:0.55}),eOut],[2.8,MREADY]];
    const J=swingPose(K,t,meleeStance(t)); ctx.J=J;
    if(t>1.18&&!T.a){ T.a=1; ctx.events.push({kind:"chop"}); } if(t>1.68&&!T.b){ T.b=1; ctx.events.push({kind:"chop"}); }
    ctx.atk={x:1.02-0.12*sat(t/0.9),z:0,yaw:-Math.PI/2,J:aReach(t,0.6)}; if(T.a){ ctx.atk.J.syaw=-0.4; } if(T.b){ ctx.atk.fall=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.2,w:2.2}),dt,1.6,Math.PI/2-0.08)); }
    ctx.post=()=>chopPost(ctx); ctx.post2=()=>chopPost2(ctx,"hatchet");
    ctx.phase= t<0.6?"it comes in": t<1.3?"winds and chops across": t<1.8?"carries round into a backhand":"it goes down"; return fin(J); } };
// ---- crowbar: two-handed. The light clipped to her jacket, beam ahead; both hands on the bar. She winds the whole upper
// body back to her right, the bar up over her shoulder, then unwinds hips first and the bar comes round flat into the
// side of its head and on through
function crowbarAt(th,ht,lift){ const P=TP(), C=runner.B.chest.getWorldPosition(new V3()).add(new V3(0,0.08,0));
  const rad=P.fwd.clone().multiplyScalar(Math.cos(th)).addScaledVector(P.right,Math.sin(th)), tan=P.fwd.clone().multiplyScalar(-Math.sin(th)).addScaledVector(P.right,Math.cos(th));
  const G=C.clone().addScaledVector(rad,0.4).add(new V3(0,ht,0)), tip=rad.clone().multiplyScalar(Math.cos(lift)).add(new V3(0,Math.sin(lift),0)).normalize(); return {G,tip,edge:tan.clone().negate()}; }
function lightOnChest(){ ensureProps(); runner.group.updateMatrixWorld(true); const q=runner.R.chest.getWorldQuaternion(QI()), f=new V3(0,0,1).applyQuaternion(q), r=new V3(-1,0,0).applyQuaternion(q), c=runner.B.chest.getWorldPosition(new V3());
  LIGHT.visible=true; setProp(LIGHT,LGRIP,c.clone().addScaledVector(f,0.13).addScaledVector(r,0.07).add(new V3(0,0.12,0)),f.clone().add(new V3(0,-0.2,0)),UP); SPOT.intensity=4; }
function twoHanded(ctx,k,arc){ const o=W[k]; const pl=placement(new V3(0,-0.49,0),arc.G,arc.edge,arc.tip); o.obj.position.copy(pl.p); o.obj.quaternion.copy(pl.q); o.obj.updateMatrixWorld(true);
  const P=TP(), S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3()), gr=o.obj.localToWorld(new V3(0,-0.43,0)), gl=o.obj.localToWorld(new V3(0,-0.56,0));
  armIK(runner,{side:"R",target:gr,pole:S.clone().add(new V3(0,-0.5,0)).addScaledVector(P.right,0.45),w:1,tip:0.07});
  armIK(runner,{side:"L",target:gl,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.3),w:1,tip:0.07}); }
const CB={ ready:{th:0.35,ht:-0.3,lift:0.75}, wind:{th:1.75,ht:0.12,lift:1.35}, hit:{th:-0.05,ht:0.05,lift:0.05}, thru:{th:-1.15,ht:-0.12,lift:-0.25} };
const CBB={ ready:{hyaw:0,syaw:0.05,sroll:0,sp:0.18}, wind:{hyaw:0.3,syaw:0.62,sroll:-0.12,sp:0.04,hz:-0.04,ny:-0.35,lLx:-0.28,lRx:0.34}, hit:{hyaw:-0.12,syaw:-0.2,sroll:0.1,sp:0.3,hz:0.05,ny:0.1,lLx:-0.48,lRx:0.18}, thru:{hyaw:-0.38,syaw:-0.62,sroll:0.16,sp:0.36,hz:0.06,ny:0.35,lLx:-0.5,lRx:0.15} };
A.cb_swing={ start(ctx){ wStart(ctx,"crowbar"); },
  step(t,dt,ctx){ const T=ctx.T, t0=0.7, tw=1.3, th=1.52, tf=1.78, tr=2.6;
    const keys=[[0,"ready"],[t0,"ready"],[tw,"wind"],[tw+0.08,"wind"],[th,"hit",ePow],[tf,"thru",eOut],[tr,"ready"]];
    const seg=tt=>{ let i=0; while(i<keys.length-2&&tt>keys[i+1][0]) i++; return [keys[i],keys[i+1],(keys[i+1][2]||sm5)(sat((tt-keys[i][0])/(keys[i+1][0]-keys[i][0])))]; };
    const [a,b,e]=seg(t-0.06), arc={}; for(const f of ["th","ht","lift"]) arc[f]=CB[a[1]][f]+(CB[b[1]][f]-CB[a[1]][f])*e;
    const K=keys.map(k=>[k[0],CBB[k[1]],k[2]]), J=swingPose(K,t,meleeStance(t)); J.aLx=-0.6; J.eL=1.2;
    if(t>th-0.03&&!T.h){ T.h=t; ctx.events.push({kind:"bash"}); }
    ctx.atk={x:1.0,z:0.05,yaw:-Math.PI/2,J:aReach(t,0.35)}; if(T.h){ const k=t-T.h; ctx.atk.J.ny=0.8*sm5(k/0.1); ctx.atk.J.sroll=0.35; ctx.atk.fall=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.2,w:2.4}),dt,1.6,Math.PI/2-0.08)); ctx.atk.z=0.05-0.4*sm5(k/0.5); }
    ctx.post=()=>twoHanded(ctx,"crowbar",crowbarAt(arc.th,arc.ht,arc.lift)); ctx.post2=()=>{ twoHanded(ctx,"crowbar",crowbarAt(arc.th,arc.ht,arc.lift)); lightOnChest(); };
    ctx.phase= t<t0?"two hands on the bar · the light clipped to her jacket": t<tw+0.08?"winds the whole upper body back, the bar over her shoulder": t<tf?"unwinds hips first · the bar comes round flat into its head":"on through · it goes down"; return fin(J); } };
// ---- crowbar: pry the jammed door. The claw in the gap; each heave cracks it open a little more and it springs back part
// of the way, the frame creaking. It won't go. She pulls the bar out, sets her shoulder and both hands against the door and
// drives with her legs: it gives a little, sticks, then breaks free and swings wide; she stumbles in after it.
let DOOR=null; function ensureDoor(){ if(!DOOR){ DOOR=new THREE.Group(); const m=mat(0x2e2a26); const fr=(w,h,x,y)=>{ const b=new THREE.Mesh(new THREE.BoxGeometry(0.12,h,w),m); b.position.set(0,y,x); DOOR.add(b); };
    fr(1.2,2.2,-1.02,1.1); fr(0.12,2.2,0.48,1.1); fr(2.2,0.3,-0.45,2.35);   /* the near jamb is left thin so the side camera sees her */
    const d=new THREE.Group(); d.position.set(0,0,-0.42); const leaf=new THREE.Mesh(new THREE.BoxGeometry(0.05,2.05,0.84),mat(0x4a3a2c)); leaf.position.set(0.0,1.03,0.42); d.add(leaf);
    const knob=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,6),mat(0x8a7a50)); knob.position.set(-0.04,1.0,0.76); d.add(knob); DOOR.add(d); DOOR.leaf=d; DOOR.position.set(0.72,0,0); scene.add(DOOR); } DOOR.visible=true; }
const doorEdge=(h,out=0)=>{ DOOR.updateMatrixWorld(true); return DOOR.leaf.localToWorld(new V3(-0.03-out,h,0.8)); };
A.cb_pry={ start(ctx){ wStart(ctx,"crowbar"); ensureDoor(); DOOR.leaf.rotation.y=0; ctx.camX=0.4; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), tIn=0.8, heaves=[1.2,2.0,2.8], tOut=3.55, tSet=4.1, tPush=4.35, tGive=5.25; let J=nStand(t,0.6);
    // the door: each heave opens it to a peak and it springs back part of the way (the give); then the shove
    let ang=0, lean=0, rest=0; heaves.forEach((h,i)=>{ const k=t-h, peak=[0.05,0.11,0.17][i], keep=[0.02,0.06,0.11][i]; if(k>0){ const up=sat(k/0.35), down=sat((k-0.4)/0.3); const a=peak*sm5(up)-(peak-keep)*sm5(down)+0.012*Math.sin(k*40)*Math.exp(-k*6)*(k<0.7?1:0); ang=Math.max(ang,i===0||k<0.8?a:keep); rest=keep; lean=Math.max(lean,Math.sin(Math.PI*sat(k/0.75))); } });
    const shove=t>tPush? sat((t-tPush)/0.25) : 0, creep=t>tPush? 0.07*sm5((t-tPush)/0.5)+0.025*Math.sin((t-tPush)*18)*Math.exp(-(t-tPush)*3)*(t<tGive?1:0) : 0;
    if(t>tGive&&!T.give){ T.give=t; ctx.events.push({kind:"doorGive"}); } if(t>tPush+0.05&&!T.p){ T.p=1; ctx.events.push({kind:"doorShove"}); }
    const swing=T.give? 1.55*eOut(sat((t-T.give)/0.7)) : 0; ang=Math.max(ang, rest+creep+swing);
    if(T.give) ang=Math.max(ang,rest+0.07); DOOR.leaf.rotation.y=ang;
    // her: pry stance, leaning back on the bar with each heave
    if(t<tOut){ J.lLx=-0.5-0.15*lean; J.kL=0.42+0.15*lean; J.lRx=0.32; J.kR=0.3; J.sp=0.15-0.28*lean; J.hp=-0.12*lean; J.hz=-0.05*lean; J.syaw=0.25; J.nx=0.12; }
    // the shove: steps in, left shoulder and both hands to the door, drives with the back leg
    const step=sm5((t-tOut)/0.6); if(t>tOut){ ctx.x=0.35*step+(T.give?0.45*sm5((t-T.give-0.1)/0.6):0); ctx.moving=t<tSet||!!T.give; }
    if(t>tOut){ const S={...nStand(t,0.8)}; const d=sat((t-tSet)/0.3); S.lLx=-0.55*d; S.kL=0.5*d+0.1; S.lRx=0.55*d; S.kR=0.15; S.fR=-0.2*d; S.sp=0.18+0.32*d+0.08*shove; S.hp=0.12*d; S.syaw=-0.35*d; S.sroll=0.12*d; S.nx=0.1; S.ny=-0.3*d;
      if(T.give){ const k=t-T.give, st=Math.sin(Math.PI*sat(k/0.5)); S.sp+=0.15*st; S.lLx-=0.3*st; S.kL+=0.3*st; }
      J=mix(J,S,step); }
    const gap=doorEdge(1.05,-0.02), hold=gap.clone().addScaledVector(P.fwd,-0.36-0.07*lean).add(new V3(0,-0.04,0)).addScaledVector(P.right,0.08);
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
      if(t<tOut){ const w=sm5((t-0.2)/0.5)*(1-sm5((t-tOut+0.3)/0.3));
        armIK(runner,{side:"R",target:hold,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.35),w,tip:0.07});
        armIK(runner,{side:"L",target:hold.clone().add(new V3(0,0.13,0)).addScaledVector(P.fwd,0.07).addScaledVector(P.right,-0.03),pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.45),w:w*sm5((t-tIn)/0.4),tip:0.07}); }
      else { const d=sm5((t-tSet+0.2)/0.4)*(T.give?1-sm5((t-T.give-0.5)/0.5):1);
        armIK(runner,{side:"L",target:doorEdge(1.25,0.04).addScaledVector(P.right,-0.12),pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.4),w:d,tip:0.07});
        armIK(runner,{side:"R",target:doorEdge(1.0,0.04).addScaledVector(P.right,-0.32),pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.4),w:d*0.9,tip:0.07}); } };
    ctx.post2=()=>{ if(t<tOut){ const R=palm("R"), claw=gap.clone().add(new V3(0,0.06,0)); inHand("crowbar",P.right.clone().negate(),claw.sub(R.p).normalize()); }
      else { const H=handFrame("R"); inHand("crowbar",H.fingers,H.thumb); }
      lightOnChest(); };
    const hv=heaves.findIndex(h=>t>h&&t<h+0.8);
    ctx.phase= t<tIn?"the claw into the gap": t<tOut? (hv>=0?`heaves (${hv+1} of 3) · it cracks open, springs back`:"resets her grip"): t<tPush?"it won't go · she sets her shoulder and hands to it": !T.give?"drives with her legs · it gives a little, sticks":"it breaks free and swings wide · she stumbles in";
    return fin(J); } };
