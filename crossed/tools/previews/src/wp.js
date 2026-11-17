// ================================================================ WEAPONS SHE FINDS
// Each is built like the game's items: parts (shape, centre, size, rotation, colour), barrels and blades along −x. Firearms
// have their working parts rigged: the shotgun's pump, the rifle's bolt, the pistol's slide and magazine, the flare gun's
// barrel. The flashlight: taped under the barrel of the long guns, braced under the gun hand with the pistol and flare
// gun, in her other hand with the hand weapons and the road flare.
const WX={
 shotgun:{name:"Pump Shotgun",parts:[
  {name:"Barrel",s:"cyl",p:[-0.4,0.03,0],d:[0.022,0.62,0.022],r:[0,0,90],c:"#2a2c30"},{name:"Mag tube",s:"cyl",p:[-0.27,0.006,0],d:[0.024,0.44,0.024],r:[0,0,90],c:"#2a2c30"},
  {name:"Receiver",s:"box",p:[0.0,0.018,0],d:[0.2,0.058,0.03],r:[0,0,0],c:"#2b2d31"},{name:"Bead",s:"box",p:[-0.705,0.044,0],d:[0.005,0.006,0.005],r:[0,0,0],c:"#d8d0b0"},
  {name:"Forend",s:"box",p:[-0.2,0.008,0],d:[0.2,0.042,0.04],r:[0,0,0],c:"#5a3a22",seg:10},
  {name:"Trigger guard",s:"torus",p:[0.06,-0.022,0],d:[0.03,0.03,0.03],r:[0,0,0],c:"#2a2c30"},{name:"Trigger",s:"box",p:[0.058,-0.018,0],d:[0.0035,0.016,0.0035],r:[0,0,-12],c:"#3a3e46"},
  {name:"Wrist",s:"box",p:[0.15,-0.02,0],d:[0.12,0.046,0.032],r:[0,0,-14],c:"#5a3a22"},{name:"Stock",s:"box",p:[0.34,-0.048,0],d:[0.3,0.078,0.036],r:[0,0,-6],c:"#5a3a22"},
  {name:"Butt pad",s:"box",p:[0.494,-0.064,0],d:[0.014,0.12,0.04],r:[0,0,-6],c:"#141414"},{name:"Port",s:"box",p:[0.005,0.03,-0.0156],d:[0.055,0.018,0.002],r:[0,0,0],c:"#0a0a0a"},
  {name:"Loading port",s:"box",p:[0.03,-0.0115,0],d:[0.06,0.002,0.02],r:[0,0,0],c:"#0a0a0a"}],
  pts:{grip:[0.12,-0.03,0],fore:[-0.2,-0.004,0],butt:[0.5,-0.06,0],eye:[0.3,0.075,0],muzzle:[-0.715,0.03,0],port:[0.005,0.03,-0.017],load:[0.03,-0.014,0],tape:[-0.42,-0.025,0]}},
 rifle:{name:"Hunting Rifle",parts:[
  {name:"Barrel",s:"cyl",p:[-0.4,0.025,0],d:[0.018,0.6,0.018],r:[0,0,90],c:"#25272b"},{name:"Receiver",s:"cyl",p:[0.03,0.024,0],d:[0.03,0.2,0.03],r:[0,0,90],c:"#25272b"},
  {name:"Scope",s:"cyl",p:[0.05,0.078,0],d:[0.026,0.3,0.026],r:[0,0,90],c:"#141517"},{name:"Objective",s:"cyl",p:[-0.12,0.078,0],d:[0.044,0.06,0.044],r:[0,0,90],c:"#141517"},
  {name:"Eyepiece",s:"cyl",p:[0.19,0.078,0],d:[0.038,0.05,0.038],r:[0,0,90],c:"#141517"},{name:"Mount front",s:"box",p:[-0.02,0.052,0],d:[0.014,0.024,0.02],r:[0,0,0],c:"#141517"},
  {name:"Mount rear",s:"box",p:[0.1,0.052,0],d:[0.014,0.024,0.02],r:[0,0,0],c:"#141517"},{name:"Forestock",s:"box",p:[-0.16,0.0,0],d:[0.4,0.042,0.042],r:[0,0,0],c:"#6a4426"},
  {name:"Wrist",s:"box",p:[0.16,-0.016,0],d:[0.12,0.046,0.034],r:[0,0,-12],c:"#6a4426"},{name:"Stock",s:"box",p:[0.34,-0.044,0],d:[0.28,0.086,0.038],r:[0,0,-5],c:"#6a4426"},
  {name:"Butt pad",s:"box",p:[0.484,-0.058,0],d:[0.014,0.12,0.042],r:[0,0,-5],c:"#141414"},{name:"Trigger guard",s:"torus",p:[0.07,-0.022,0],d:[0.03,0.03,0.03],r:[0,0,0],c:"#25272b"},
  {name:"Trigger",s:"box",p:[0.068,-0.018,0],d:[0.0035,0.016,0.0035],r:[0,0,-12],c:"#3a3e46"},{name:"Floorplate",s:"box",p:[0.02,-0.024,0],d:[0.07,0.006,0.03],r:[0,0,0],c:"#25272b"},
  {name:"Lens",s:"cyl",p:[-0.151,0.078,0],d:[0.036,0.002,0.036],r:[0,0,90],c:"#3a4a5a"}],
  pts:{grip:[0.13,-0.03,0],fore:[-0.18,-0.006,0],butt:[0.49,-0.058,0],eye:[0.285,0.078,0],muzzle:[-0.7,0.025,0],port:[0.04,0.04,0],tape:[-0.3,-0.04,0],bolt:[0.085,0.024,0]}},
 pistol:{name:"9mm Pistol",parts:[
  {name:"Frame",s:"box",p:[-0.04,0.0,0],d:[0.15,0.016,0.022],r:[0,0,0],c:"#1e1f22"},{name:"Grip",s:"box",p:[0.042,-0.048,0],d:[0.036,0.09,0.03],r:[0,0,-12],c:"#1a1a1c"},
  {name:"Trigger guard",s:"torus",p:[-0.005,-0.017,0],d:[0.03,0.028,0.028],r:[0,0,0],c:"#1e1f22"},{name:"Trigger",s:"box",p:[-0.007,-0.014,0],d:[0.0035,0.015,0.0035],r:[0,0,-14],c:"#3a3e46"}],
  pts:{grip:[0.046,-0.035,0],muzzle:[-0.122,0.022,0],port:[-0.01,0.032,-0.013]}},
 hatchet:{name:"Hatchet",melee:true,parts:[
  {name:"Handle",s:"cyl",p:[0,-0.17,0],d:[0.028,0.36,0.024],r:[0,0,0],c:"#7a5634"},{name:"Head",s:"box",p:[-0.028,0.0,0],d:[0.1,0.05,0.016],r:[0,0,0],c:"#55595f"},
  {name:"Bit",s:"box",p:[-0.084,0.0,0],d:[0.016,0.078,0.007],r:[0,0,0],c:"#b8bcc4"},{name:"Poll",s:"box",p:[0.03,0.0,0],d:[0.026,0.036,0.022],r:[0,0,0],c:"#45484d"}],
  pts:{grip:[0,-0.29,0],tip:[-0.09,0,0]}},
 crowbar:{name:"Crowbar",melee:true,parts:[
  {name:"Bar",s:"cyl",p:[0,-0.3,0],d:[0.018,0.62,0.018],r:[0,0,0],c:"#8a1e18"},{name:"Bend",s:"cyl",p:[-0.018,0.03,0],d:[0.018,0.07,0.018],r:[0,0,40],c:"#8a1e18"},
  {name:"Claw",s:"box",p:[-0.05,0.04,0],d:[0.03,0.018,0.012],r:[0,0,-20],c:"#5a5e64"},{name:"Chisel",s:"box",p:[-0.008,-0.615,0],d:[0.022,0.026,0.006],r:[0,0,20],c:"#5a5e64"}],
  pts:{grip:[0,-0.48,0],tip:[-0.05,0.04,0]}},
 knife:{name:"Kitchen Knife",melee:true,parts:[
  {name:"Handle",s:"box",p:[0,-0.055,0],d:[0.02,0.11,0.017],r:[0,0,0],c:"#18181a"},{name:"Bolster",s:"box",p:[0,0.002,0],d:[0.026,0.006,0.016],r:[0,0,0],c:"#8a8e94"},
  {name:"Blade",s:"box",p:[0.002,0.085,0],d:[0.03,0.16,0.0025],r:[0,0,0],c:"#c4c8ce"},{name:"Point",s:"box",p:[-0.004,0.17,0],d:[0.016,0.022,0.0025],r:[0,0,-28],c:"#c4c8ce"}],
  pts:{grip:[0,-0.055,0],tip:[0,0.18,0]}},
 flare:{name:"Road Flare",melee:true,parts:[
  {name:"Tube",s:"cyl",p:[0,0,0],d:[0.03,0.24,0.03],r:[0,0,0],c:"#b8201c"},{name:"Band",s:"cyl",p:[0,-0.06,0],d:[0.031,0.03,0.031],r:[0,0,0],c:"#e8d8a0"},
  {name:"Cap",s:"cyl",p:[0,0.133,0],d:[0.034,0.026,0.034],r:[0,0,0],c:"#d8d0c0"},{name:"Wick",s:"cyl",p:[0,0.122,0],d:[0.02,0.006,0.02],r:[0,0,0],c:"#2a1a14"}],
  pts:{grip:[0,-0.06,0],tip:[0,0.125,0]}},
 flaregun:{name:"Flare Gun",parts:[
  {name:"Frame",s:"box",p:[0.018,0.012,0],d:[0.06,0.032,0.026],r:[0,0,0],c:"#d0601c"},{name:"Grip",s:"box",p:[0.04,-0.045,0],d:[0.032,0.085,0.03],r:[0,0,-15],c:"#c45818"},
  {name:"Hammer",s:"box",p:[0.046,0.032,0],d:[0.01,0.016,0.008],r:[0,0,20],c:"#2a2a2a"},{name:"Trigger guard",s:"torus",p:[0.008,-0.012,0],d:[0.028,0.026,0.026],r:[0,0,0],c:"#d0601c"},
  {name:"Trigger",s:"box",p:[0.006,-0.01,0],d:[0.0035,0.014,0.0035],r:[0,0,-12],c:"#2a2a2a"}],
  pts:{grip:[0.046,-0.033,0],muzzle:[-0.13,0.02,0],hinge:[-0.008,0.003,0]}}
};
for(const k in WX) ITEMS["w_"+k]=WX[k].parts;
const W={}; let TL=null, TSP=null;   /* the taped-on flashlight for the long guns */
const v3=a=>new V3(a[0],a[1],a[2]);
const mat=c=>new THREE.MeshLambertMaterial({color:c});
function cylX(r,l,c,at){ const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,l,10),mat(c)); m.rotation.z=Math.PI/2; m.position.copy(at); return m; }
function buildWeapons(){ if(W.shotgun) return;
  for(const k in WX){ const g=buildItem("w_"+k), o={obj:g,pts:{},key:k}; for(const p in WX[k].pts) o.pts[p]=v3(WX[k].pts[p]); g.visible=false; scene.add(g); W[k]=o; }
  const piv=(o,part,at)=>{ const q=new THREE.Group(); q.position.copy(at); o.obj.add(q); const m=o.obj.userData.parts[part]; m.position.sub(at); q.add(m); return q; };
  // shotgun: the pump; a shell in the chamber (seen through the port), shells to load
  { const o=W.shotgun; o.pump=piv(o,"Forend",new V3(0,0,0)); o.trig=piv(o,"Trigger",new V3(0.058,-0.01,0)); }
  // rifle: the bolt (body, handle and knob), turning up and sliding back
  { const o=W.rifle; o.trig=piv(o,"Trigger",new V3(0.068,-0.01,0)); const b=new THREE.Group(); b.position.copy(o.pts.bolt); o.obj.add(b);
    const h=new THREE.Group(); b.add(h); const stem=new THREE.Mesh(new THREE.CylinderGeometry(0.004,0.004,0.042,8),mat(0x3a3e46)); stem.position.set(0,0,-0.024); stem.rotation.x=Math.PI/2; h.add(stem);
    const knob=new THREE.Mesh(new THREE.SphereGeometry(0.009,8,6),mat(0x2a2c30)); knob.position.set(0,-0.006,-0.046); h.add(knob); const body=cylX(0.0085,0.07,0x8a8e94,new V3(0.01,0,0)); b.add(body);
    o.bolt=b; o.handle=h; o.knob=knob; }
  // pistol: the slide (with sights and the ejection port) and the magazine
  { const o=W.pistol; o.trig=piv(o,"Trigger",new V3(-0.007,-0.006,0)); const s=new THREE.Group(); o.obj.add(s);
    const add=(geo,c,p)=>{ const m=new THREE.Mesh(geo,mat(c)); m.position.set(...p); s.add(m); return m; };
    add(new THREE.BoxGeometry(0.18,0.03,0.024),0x26282c,[-0.03,0.023,0]); add(new THREE.BoxGeometry(0.004,0.006,0.004),0x101010,[-0.115,0.041,0]); add(new THREE.BoxGeometry(0.006,0.006,0.012),0x101010,[0.05,0.041,0]);
    add(new THREE.BoxGeometry(0.035,0.012,0.002),0x050505,[-0.01,0.03,-0.0125]); const bore=add(new THREE.CylinderGeometry(0.0045,0.0045,0.002,8),0x050505,[-0.121,0.022,0]); bore.rotation.z=Math.PI/2; o.slide=s;
    const mg=new THREE.Group(); mg.position.set(0.045,-0.005,0); mg.rotation.z=-12*Math.PI/180; o.obj.add(mg); const mb=new THREE.Mesh(new THREE.BoxGeometry(0.022,0.1,0.02),mat(0x3a3c40)); mb.position.set(0,-0.05,0); mg.add(mb);
    const bp=new THREE.Mesh(new THREE.BoxGeometry(0.026,0.008,0.024),mat(0x2a2a2c)); bp.position.set(0,-0.1,0); mg.add(bp); o.mag=mg; }
  // flare gun: the barrel on its hinge (breaks open, muzzle down), a flare shell in it
  { const o=W.flaregun; const b=new THREE.Group(); b.position.copy(o.pts.hinge); o.obj.add(b);
    const bar=cylX(0.017,0.13,0xd0601c,new V3(-0.063,0.017,0)); b.add(bar); const bore=new THREE.Mesh(new THREE.CylinderGeometry(0.0115,0.0115,0.002,10),mat(0x0a0a0a)); bore.rotation.z=Math.PI/2; bore.position.set(-0.129,0.017,0); b.add(bore);
    const sh=new THREE.Group(); sh.position.set(0.0,0.017,0); b.add(sh); const hull=cylX(0.0112,0.06,0xb82a20,new V3(-0.028,0,0)); const head=cylX(0.0125,0.006,0xb08a3a,new V3(0.003,0,0)); sh.add(hull,head);
    o.barrel=b; o.shell=sh; o.hammer=o.obj.userData.parts.Hammer; o.trig=piv(o,"Trigger",new V3(0.006,-0.003,0)); }
  // the flare's fire: a light and the glow at its end
  { const o=W.flare; o.light=new THREE.PointLight(0xff3a1a,0,9,1.6); o.light.position.copy(o.pts.tip); o.obj.add(o.light); o.glow=new THREE.Mesh(new THREE.SphereGeometry(0.02,8,6),new THREE.MeshBasicMaterial({color:0xffd0a0})); o.glow.position.copy(o.pts.tip); o.glow.visible=false; o.obj.add(o.glow); }
  // the taped flashlight: its own lamp, and two wraps of grey tape
  TL=buildItem("flashlight"); TSP=new THREE.SpotLight(0xfff0c8,4.0,16,0.3,0.45,1.0); TSP.position.set(-0.122,0,0); const tg=new THREE.Object3D(); tg.position.set(-1.2,0,0); TL.add(TSP,tg); TSP.target=tg;
  TL.userData.parts.Lens.material=new THREE.MeshBasicMaterial({color:0xfff6d8});
  for(const x of [-0.03,0.05]){ const b=new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.024,0.022,10),mat(0x8a8a86)); b.rotation.z=Math.PI/2; b.position.set(x,0.008,0); TL.add(b); }
  TL.visible=false; scene.add(TL); }
const LONG=k=>k==="shotgun"||k==="rifle";
function showWeapon(k){ buildWeapons(); for(const q in W) W[q].obj.visible=(q===k); if(GUN) GUN.visible=false;
  TL.visible=false; }   /* no light with the long guns: two hands on the gun, no hand for a light (the drawback of carrying one) */
const wpt=(k,p)=>{ const o=W[k]; o.obj.updateMatrixWorld(true); return o.obj.localToWorld(o.pts[p].clone()); };
// a placement (position + rotation) that puts local point 'loc' at 'at' with −x along f, +y toward u
function placement(loc,at,f,u){ const X=f.clone().normalize().negate(), Y=u.clone().addScaledVector(X,-u.dot(X)).normalize(), Zv=new V3().crossVectors(X,Y), q=new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X,Y,Zv));
  return {q, p:at.clone().sub(loc.clone().applyQuaternion(q))}; }
function applyPl(o,a,b,w){ const q=w<=0?a.q:w>=1?b.q:a.q.clone().slerp(b.q,w), p=w<=0?a.p:w>=1?b.p:a.p.clone().lerp(b.p,w); o.position.copy(p); o.quaternion.copy(q); o.updateMatrixWorld(true); }

// ---------------------------------------------------------------- the long guns: shouldered
// aim 0 = low ready (butt in her shoulder, muzzle dipped), 1 = her eye down the barrel. Then her hands go to the grip and
// the forend. kick/back: the recoil. hands: overrides for either hand (a world point), or null to leave it on the gun.
function longPost(ctx,k,o){ const P=TP(), Wk=W[k]; runner.group.updateMatrixWorld(true);
  const E=eyeAt(), T=o.at||E.clone().addScaledVector(P.fwd,5), f=T.clone().sub(E).normalize(), side=new V3().crossVectors(f,UP).normalize(), up=new V3().crossVectors(side,f).normalize();
  const amp=o.amp||0, sw=side.clone().multiplyScalar(amp*noise(t*3.1,1)).addScaledVector(up,amp*0.8*noise(t*2.7,5));
  const kick=o.kick||0, fa=f.clone().applyAxisAngle(side,kick), ua=up.clone().applyAxisAngle(side,kick);
  // aimed: the butt in her shoulder pocket, the gun pointed from there; her head comes down onto the stock (nShoulder)
  const sh=runner.R.armR.getWorldPosition(new V3()), pocketA=sh.clone().addScaledVector(side,-0.035).addScaledVector(f,0.05).addScaledVector(up,-0.035).addScaledVector(fa,-(o.back||0)).add(sw);
  const fe=T.clone().sub(pocketA.clone().addScaledVector(up,0.12)).normalize(), fA=fe.clone().applyAxisAngle(side,kick), uA=new V3().crossVectors(new V3().crossVectors(fe,UP).normalize(),fe).normalize().applyAxisAngle(side,kick);
  const aimP=placement(Wk.pts.butt,pocketA,fA,uA);
  const dip=o.dip??0.6, fl=f.clone().applyAxisAngle(side,-dip), ul=up.clone().applyAxisAngle(side,-dip).applyAxisAngle(fl,o.cant||0);
  const pocket=runner.R.armR.getWorldPosition(new V3()).addScaledVector(P.right,-0.06).addScaledVector(P.fwd,0.06).add(new V3(0,-0.05,0));
  const lowP=placement(Wk.pts.butt,pocket,fl,ul);
  applyPl(Wk.obj,lowP,aimP,sat(o.aim??1));
  const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
  const gR=o.handR||wpt(k,"grip"), gL=o.handL||(Wk.pump? Wk.pump.localToWorld(Wk.pts.fore.clone()) : wpt(k,"fore"));
  armIK(runner,{side:"R",target:gR,pole:S.clone().add(new V3(0,-0.25,0)).addScaledVector(P.right,0.5),w:o.wR??1,tip:0.07});
  armIK(runner,{side:"L",target:gL,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.12),w:o.wL??1,tip:0.07}); }
// the shouldering stance: bladed a little, her cheek down onto the stock
function nShoulder(t,f,aim){ const J=nStand(t,f); J.lLx=-0.32; J.lRx=0.24; J.kL=0.28; J.kR=0.22; J.lRz=0.16; J.syaw=-0.42*aim; J.hyaw=-0.22*aim; J.sp=0.2+0.06*aim; J.nx=0.18+0.22*aim; J.nz=0.3*aim; J.ny=0.42*aim; J.hp=0.06; return J; }

// ---------------------------------------------------------------- shells, cases and flares in the world
function ammo(kind){ const g=new THREE.Group();
  if(kind==="shell"){ g.add(cylX(0.0098,0.058,0xa0201c,new V3(0.004,0,0)), cylX(0.0105,0.016,0xb08a3a,new V3(0.035,0,0))); }
  else if(kind==="round"){ g.add(cylX(0.0055,0.05,0xb48c3c,new V3(0.01,0,0))); const tip=new THREE.Mesh(new THREE.ConeGeometry(0.0045,0.02,8),mat(0xb06a3a)); tip.rotation.z=Math.PI/2; tip.position.set(-0.025,0,0); g.add(tip); }
  else if(kind==="case"){ g.add(cylX(0.0055,0.05,0xb48c3c,new V3(0,0,0))); }
  else if(kind==="case9"){ g.add(cylX(0.0045,0.019,0xb48c3c,new V3(0,0,0))); }
  else if(kind==="fshell"){ g.add(cylX(0.0112,0.06,0x8a2a20,new V3(-0.028,0,0)), cylX(0.0125,0.006,0xb08a3a,new V3(0.003,0,0))); }
  scene.add(g); return g; }
function eject(kind,at,v){ const g=ammo(kind); g.position.copy(at); g.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3); dropPiece(g,v,new V3(Math.random()*16-8,Math.random()*16-8,Math.random()*16-8)); }
// fire: sparks thrown off a burning flare, and its flickering light
function sparks(at,n,c){ for(let i=0;i<n;i++){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:c||0xffb070,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); m.position.copy(at); m.scale.setScalar(0.03); scene.add(m); puffs.push({m,t:0.35+Math.random()*0.2,v:new V3((Math.random()-.5)*0.9,0.3+Math.random()*0.9,(Math.random()-.5)*0.9),s:0.1}); } }
const FLARES=[];   /* burning flares in the world: {m, light, v, rest} */
function flareStep(dt){ for(const f of FLARES){ if(!f.rest){ f.v.y-=9.8*dt; f.m.position.addScaledVector(f.v,dt); if(f.m.position.y<0.02){ f.m.position.y=0.02; f.v.y=-0.3*f.v.y; f.v.x*=0.5; f.v.z*=0.5; if(f.v.length()<0.15) f.rest=true; } }
    f.light.intensity=4.2+1.2*noise(t*25,f.seed)+0.5*Math.random(); if(Math.random()<0.8) sparks(f.m.position,1,f.c); } }
function flaresClear(){ for(const f of FLARES) scene.remove(f.m); FLARES.length=0; }
function burningFlare(at,v,c){ const m=new THREE.Group(); m.position.copy(at); const core=new THREE.Mesh(new THREE.SphereGeometry(0.018,8,6),new THREE.MeshBasicMaterial({color:0xffe0c0})); const li=new THREE.PointLight(c||0xff3a1a,4.5,12,1.3); const halo=new THREE.Sprite(new THREE.SpriteMaterial({map:puffTex,color:0xff4a2a,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); halo.scale.setScalar(0.5); m.add(core,li,halo); scene.add(m);
  const f={m,light:li,v:v.clone(),seed:Math.random()*9,c:c===0xff5a2a?0xffa060:0xff8050}; FLARES.push(f); return f; }

// ---------------------------------------------------------------- per-weapon starts
function wStart(ctx,k,x){ nStart(ctx,x??0); buildWeapons(); if(DOOR){ DOOR.rotation.y=0; } runner.R.wristR.rotation.set(0,0,0); runner.R.wristL.rotation.set(0,0,0); if(DOOR) DOOR.visible=false; W.pistol.mag.visible=true; showWeapon(k); ctx.wk=k; ctx.camX=null; flaresClear(); if(W.flare){ W.flare.light.intensity=0; W.flare.glow.visible=false; } }
// the hand weapons and pistols: the weapon in her right hand from the palm; f = which way its edge (or barrel) faces, u = its tip (or top)
function inHand(k,f,u){ const o=W[k], R=palm("R"); setProp(o.obj,o.pts.grip,R.p,f,u); }
// the light in her left hand (beam ahead, or wherever 'lf' says)
function lightLeft(lf,on=1){ ensureProps(); const L=palm("L"), P=TP(); LIGHT.visible=true; setProp(LIGHT,LGRIP,L.p,(lf||P.fwd.clone().add(new V3(0,-0.3,0))).normalize(),UP); SPOT.intensity=4*on; }

// ================================================================ SHOTGUN
// ---- aim: from low ready up to the shoulder, her cheek down on the stock; the beam from the taped light on the target
A.sg_aim={ start(ctx){ wStart(ctx,"shotgun"); },
  step(t,dt,ctx){ standTarget(ctx,t); const aim=sm5((t-0.8)/0.5), J=nShoulder(t,1-0.5*aim,aim);
    ctx.post=()=>longPost(ctx,"shotgun",{aim,at:tgtChest(),amp:tremor(ctx,dt,aim>0.99)*0.8}); ctx.post2=()=>{ LIGHT.visible=false; };
    ctx.phase=t<0.8?"low ready · no hand free for a light":t<1.3?"brings it to her shoulder":"cheek on the stock · on the target"; return fin(J); } };
// ---- fire and pump: a heavy kick that rocks her back a step; her left hand racks the pump back (the empty hull flies out
// of the port) and forward again
A.sg_fire={ start(ctx){ wStart(ctx,"shotgun"); ctx.aimT=1.5; ctx.shots=[0.9,2.3]; },
  step(t,dt,ctx){ standTarget(ctx,t); const T=ctx.T; let J=nShoulder(t,0.5,1), kick=0, back=0, rock=0, pump=0;
    ctx.shots.forEach((s,i)=>{ if(t>s&&!T["s"+i]){ T["s"+i]=t; ctx.events.push({kind:"sgShot"}); }
      const k=t-s; if(k>0){ kick+=0.5*Math.exp(-k/0.1)*sat(k/0.02); back+=0.08*Math.exp(-k/0.12)*sat(k/0.02); rock+=Math.exp(-k/0.3)*sat(k/0.03); ctx.x-=0.6*Math.exp(-k/0.1)*dt;
        const pu=k-0.45; pump=Math.max(pump, pu<0?0: pu<0.16? sm5(pu/0.16) : pu<0.36? 1-sm5((pu-0.2)/0.16) : 0); if(pu>0.16&&!T["e"+i]){ T["e"+i]=1; ctx.events.push({kind:"sgEject"}); } } });
    J.sp-=0.2*rock; J.nx-=0.12*rock; J.lRx+=0.12*rock; J.kL+=0.08*rock;
    const G=gunCycle(t,ctx.shots); W.shotgun.trig.rotation.z=0.45*G.trig;
    ctx.post=()=>{ W.shotgun.pump.position.x=0.085*pump; longPost(ctx,"shotgun",{aim:1,at:tgtChest(),kick,back,amp:tremor(ctx,dt,true)*0.7}); }; ctx.post2=()=>{ LIGHT.visible=false; };
    ctx.atk.J=aStand(t); if(T.s1){ const k=t-T.s1; ctx.atk.fall=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.3,w:3.4}),dt,1.6,Math.PI/2-0.08)); } else if(T.s0){ const k=t-T.s0; ctx.atk.J.sp-=0.5*Math.exp(-k/0.25); ctx.atk.x=3.9+0.25*sm5(k/0.3); }
    if(T.s1) ctx.atk.x=4.15+0.35*sm5((t-T.s1)/0.3);
    ctx.phase= t<0.9?"on the target": rock>0.4?"the kick rocks her back": pump>0?"racks the pump · the hull flies out":"back on the target"; return fin(J); } };
// ---- reload: shells from her coat pocket into the loading port under the gun, one at a time, thumbed in; four, then a rack
A.sg_load={ start(ctx){ wStart(ctx,"shotgun"); },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), n=4, t0=0.6, per=0.75; let J=nShoulder(t,0.6,0); J.nx=0.38; J.sp=0.24; J.ny=0.2;
    const i=Math.floor((t-t0)/per), u=((t-t0)%per)/per, loading=t>t0&&i<n, rack=t>t0+n*per+0.15?t-(t0+n*per+0.15):-1;
    const pocket=runner.B.hips.getWorldPosition(new V3()).addScaledVector(P.right,-0.16).addScaledVector(P.fwd,0.04);
    if(loading&&u>0.62&&!T["l"+i]){ T["l"+i]=1; ctx.events.push({kind:"sgLoad"}); }
    const pump=rack<0?0: rack<0.18? sm5(rack/0.18) : rack<0.4? 1-sm5((rack-0.22)/0.18) : 0;
    ctx.post=()=>{ W.shotgun.pump.position.x=0.085*pump;
      // the gun held low across her, turned belly-up toward her left hand; the left hand goes pocket -> port each round
      longPost(ctx,"shotgun",{aim:0,dip:0.35,cant:-1.1,wL:0,at:runner.group.position.clone().addScaledVector(P.fwd,4).setY(0.9)});
      const port=wpt("shotgun","load"), SL=runner.R.armL.getWorldPosition(new V3());
      const lh= !loading? (rack>=0? W.shotgun.pump.localToWorld(W.shotgun.pts.fore.clone()) : port.clone().add(new V3(0,-0.04,0))) : u<0.35? port.clone().lerp(pocket,sm5(u/0.35)) : u<0.5? pocket : pocket.clone().lerp(port,sm5((u-0.5)/0.12));
      armIK(runner,{side:"L",target:lh,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.2),w:sm5(t/0.4),tip:0.07}); };
    ctx.post2=()=>{ LIGHT.visible=false; if(!ctx.shell){ ctx.shell=ammo("shell"); } ctx.shell.visible=loading&&u>0.42&&u<0.66; if(ctx.shell.visible){ const L=palm("L"); setProp(ctx.shell,new V3(0.02,0,0),L.p,P.fwd,UP); } };
    ctx.phase= t<t0?"lowers it, turns it over": loading?`a shell from her pocket · thumbed into the port (${Math.min(n,i+1)} of ${n})`: rack<0.4?"racks one into the chamber":"ready"; return fin(J); } };

// ================================================================ HUNTING RIFLE
A.rf_aim={ start(ctx){ wStart(ctx,"rifle"); },
  step(t,dt,ctx){ standTarget(ctx,t); const aim=sm5((t-0.8)/0.6), J=nShoulder(t,1-0.6*aim,aim);
    ctx.post=()=>longPost(ctx,"rifle",{aim,at:tgtChest(),amp:tremor(ctx,dt,aim>0.99)*0.6}); ctx.post2=()=>{ LIGHT.visible=false; };
    ctx.phase=t<0.8?"low ready":t<1.4?"up to her shoulder · her eye to the scope":"holds her breath · steadier"; return fin(J); } };
// ---- fire and work the bolt: a hard kick; her right hand leaves the grip, lifts the bolt, pulls it back (the case flies
// out), drives it forward and down, and goes back to the grip
A.rf_fire={ start(ctx){ wStart(ctx,"rifle"); ctx.aimT=2; ctx.shots=[1.0,3.0]; },
  step(t,dt,ctx){ standTarget(ctx,t); const T=ctx.T, P=TP(); let J=nShoulder(t,0.4,1), kick=0, back=0, rock=0, lift=0, slide=0, hand=0;
    ctx.shots.forEach((s,i)=>{ if(t>s&&!T["s"+i]){ T["s"+i]=t; ctx.events.push({kind:"rfShot"}); }
      const k=t-s; if(k>0){ kick+=0.38*Math.exp(-k/0.1)*sat(k/0.02); back+=0.06*Math.exp(-k/0.12)*sat(k/0.02); rock+=Math.exp(-k/0.3)*sat(k/0.03); ctx.x-=0.4*Math.exp(-k/0.1)*dt;
        const b=k-0.55; if(b>-0.2&&b<1.1){ hand=Math.max(hand,sm5((b+0.2)/0.2)*(1-sm5((b-0.9)/0.2))); lift=Math.max(lift,b<0?0:b<0.12?sm5(b/0.12):b<0.62?1:1-sm5((b-0.62)/0.12)); slide=Math.max(slide,b<0.14?0:b<0.32?sm5((b-0.14)/0.18):b<0.44?1:1-sm5((b-0.44)/0.16)); if(b>0.3&&!T["e"+i]){ T["e"+i]=1; ctx.events.push({kind:"rfEject"}); } } } });
    J.sp-=0.15*rock; J.nx-=0.1*rock;
    const G=gunCycle(t,ctx.shots); W.rifle.trig.rotation.z=0.45*G.trig;
    ctx.post=()=>{ const R=W.rifle; R.handle.rotation.x=-1.4*lift; R.bolt.position.x=R.pts.bolt.x+0.085*slide;
      longPost(ctx,"rifle",{aim:1,at:tgtChest(),kick,back,amp:tremor(ctx,dt,true)*0.6,wR:0}); R.obj.updateMatrixWorld(true);
      const S=runner.R.armR.getWorldPosition(new V3()), knob=R.knob.getWorldPosition(new V3()), grip=wpt("rifle","grip");
      armIK(runner,{side:"R",target:grip.clone().lerp(knob,hand),pole:S.clone().add(new V3(0,-0.4,0)).addScaledVector(P.right,0.4),w:1,tip:0.07}); };
    ctx.post2=()=>{ LIGHT.visible=false; };
    ctx.atk.J=aStand(t); if(T.s0&&!T.s1){ const k=t-T.s0; ctx.atk.J.sp-=0.45*Math.exp(-k/0.25); } if(T.s1){ ctx.atk.fall=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.25,w:3.0}),dt,1.6,Math.PI/2-0.08)); }
    ctx.phase= t<1?"on the target · holds her breath": hand>0?"works the bolt · up, back (the case flies), forward, down":"back on the target"; return fin(J); } };
// ---- reload: bolt open, four rounds pressed down into the top of the action one at a time, bolt closed
A.rf_load={ start(ctx){ wStart(ctx,"rifle"); },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), n=4, t0=1.0, per=0.7; let J=nShoulder(t,0.6,0); J.nx=0.4; J.sp=0.24; J.ny=0.15;
    const open=sm5((t-0.3)/0.5)*(1-sm5((t-(t0+n*per+0.1))/0.4)), i=Math.floor((t-t0)/per), u=((t-t0)%per)/per, loading=t>t0&&i<n;
    const pocket=runner.B.hips.getWorldPosition(new V3()).addScaledVector(P.right,0.2).addScaledVector(P.fwd,0.06);   /* her right coat pocket, for her right hand */
    if(loading&&u>0.66&&!T["l"+i]){ T["l"+i]=1; ctx.events.push({kind:"rfLoad"}); }
    ctx.post=()=>{ const R=W.rifle; const lift=sat(open*2), slide=sat(open*2-1); R.handle.rotation.x=-1.4*lift; R.bolt.position.x=R.pts.bolt.x+0.085*slide;
      longPost(ctx,"rifle",{aim:0,dip:0.3,cant:0.25,wL:1,wR:0,at:runner.group.position.clone().addScaledVector(P.fwd,4).setY(0.9)});
      const S=runner.R.armR.getWorldPosition(new V3()), port=wpt("rifle","port"), knob=R.knob.getWorldPosition(new V3()), grip=wpt("rifle","grip");
      const rh= loading? (u<0.35? port.clone().lerp(pocket,sm5(u/0.35)) : u<0.5? pocket : pocket.clone().lerp(port.clone().add(new V3(0,0.02,0)),sm5((u-0.5)/0.16))) : (open>0.02&&open<0.98? knob : grip);
      armIK(runner,{side:"R",target:rh,pole:S.clone().add(new V3(0,-0.5,0)).addScaledVector(P.right,0.35),w:1,tip:0.07}); };
    ctx.post2=()=>{ LIGHT.visible=false; if(!ctx.rnd) ctx.rnd=ammo("round"); ctx.rnd.visible=loading&&u>0.42&&u<0.68; if(ctx.rnd.visible){ const R=palm("R"); setProp(ctx.rnd,new V3(0,0,0),R.p,P.fwd,UP); } };
    ctx.phase= t<0.8?"opens the bolt": loading?`presses a round down into the action (${Math.min(n,i+1)} of ${n})`: t<t0+n*per+0.6?"closes the bolt":"ready"; return fin(J); } };

// ================================================================ 9mm PISTOL
// the pistol's working parts each frame: slide back (0..1), magazine out (0..1), trigger
function pistolParts(slide,magOut,trig){ const o=W.pistol; o.slide.position.x=0.034*slide; o.mag.position.set(0.045+0.02*magOut*0.2,-0.005-0.12*magOut,0); o.trig.rotation.z=0.4*trig; }
function pistolPost(ctx,H){ holdPost(ctx,H); }
function pistolPost2(ctx,H){ const P=TP(), R=palm("R"), f=(ctx.aimF||P.fwd).clone(); const w=sat(H.aim||0), low=R.d.clone().multiplyScalar(0.55).add(P.fwd.clone().multiplyScalar(0.8)).normalize();
  inHand("pistol",H.gunF||low.lerp(f,w).normalize(),H.gunU||UP.clone().lerp(ctx.aimU||UP,w)); if(GUN) GUN.visible=false;
  if(H.light==="tuck"){ propsPost(ctx,{gun:"gone",light:"tuck"}); } else { const L=palm("L"); LIGHT.visible=true; setProp(LIGHT,LGRIP,L.p,(H.lightF||P.fwd.clone().add(new V3(0,-0.38,0)).lerp(f,w)).normalize(),UP); SPOT.intensity=4; } }
A.ps_aim={ start(ctx){ wStart(ctx,"pistol"); },
  step(t,dt,ctx){ standTarget(ctx,t); const t0=0.8, aim=sm5((t-t0)/0.45), J=mix(nStand(t,1),nAim(t,1-0.7*sat((t-t0-0.5)/2.5)),aim);
    const H={aim,amp:tremor(ctx,dt,t>t0+0.45),at:tgtChest()}; ctx.H=H; ctx.post=()=>pistolPost(ctx,H); ctx.post2=()=>{ pistolParts(0,0,0); pistolPost2(ctx,H); };
    ctx.phase=t<t0?"low ready":"up into the hold · the light under it · the shake settles"; return fin(J); } };
// ---- fire: four quick shots. The slide snaps back and forward each time and a case spins out; on the last round the
// slide locks back, empty
A.ps_fire={ start(ctx){ wStart(ctx,"pistol"); ctx.aimT=2; ctx.shots=[0.9,1.35,1.75,2.15]; },
  step(t,dt,ctx){ standTarget(ctx,t); const T=ctx.T; let J=nAim(t,0.3), kick=0, slide=0, fl=0;
    ctx.shots.forEach((s,i)=>{ if(t>s&&!T["s"+i]){ T["s"+i]=t; ctx.events.push({kind:"psShot",last:i===3}); ctx.aimT=0.3*i; } const k=t-s;
      if(k>0){ kick+=0.22*Math.exp(-k/0.07)*sat(k/0.015); fl+=[0.7,0.4,0.3,0.25][i]*Math.exp(-k/0.25); slide=Math.max(slide, i===3? sat(k/0.025) : k<0.025? k/0.025 : 1-sat((k-0.025)/0.04)); } });
    J.nx-=0.15*fl; J.ny+=0.2*fl; J.sp-=0.06*fl;
    const trig=Math.max(...ctx.shots.map(s=>sat(1-Math.abs(t-s+0.04)/0.06)));
    const H={aim:1,amp:tremor(ctx,dt,true),kick,at:tgtChest()}; ctx.H=H; ctx.post=()=>pistolPost(ctx,H); ctx.post2=()=>{ pistolParts(slide,0,trig); pistolPost2(ctx,H); };
    ctx.atk.J=aStand(t); const hits=ctx.shots.filter((s,i)=>T["s"+i]).length; ctx.atk.J.sp-=0.12*hits*(1+0.5*Math.sin(t*20)*Math.exp(-(t-(T["s"+(hits-1)]||t))/0.2));
    ctx.phase= t<0.9?"on the target": !T.s3?"quick shots · the slide snaps back, a case spins out":"the slide locks back · empty"; return fin(J); } };
// ---- reload: the empty magazine drops; she tucks the light, takes a fresh one from her pocket, seats it with a slap and
// drops the slide; back on the aim
A.ps_load={ start(ctx){ wStart(ctx,"pistol"); },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t1=0.5, t2=0.8, t3=1.7, t4=2.15, t5=2.5; let J=nStand(t,0.8); J.nx=0.35; J.sp=0.25;
    if(t>t1&&!T.drop){ T.drop=1; ctx.events.push({kind:"magDrop"}); }
    if(t>t4&&!T.seat){ T.seat=1; ctx.events.push({kind:"magSeat"}); }
    if(t>t5&&!T.rel){ T.rel=1; ctx.events.push({kind:"slideRel"}); }
    const back=sm5((t-t5-0.1)/0.45), magOut= t<t1?0: t<t1+0.25? sm5((t-t1)/0.25) : t<t3? 9 : t<t4? 1-sm5((t-t3)/(t4-t3)) : 0;
    const chest=runner.B.chest.getWorldPosition(new V3()).addScaledVector(P.fwd,0.33).addScaledVector(P.right,0.05).add(new V3(0,-0.04,0)), pocket=runner.B.hips.getWorldPosition(new V3()).addScaledVector(P.right,-0.17).addScaledVector(P.fwd,0.06);
    const gF=P.fwd.clone().addScaledVector(P.right,-0.3).add(new V3(0,0.25,0)).normalize();
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
      armIK(runner,{side:"R",target:chest,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.18),w:1-back,tip:0.075});
      const mw=wpt("pistol","grip").add(new V3(0,-0.1,0)), lh= t<t2? null : t<t3? (t<t2+0.4? chest.clone().lerp(pocket,sm5((t-t2)/0.4)) : pocket.clone().lerp(mw,sm5((t-t2-0.5)/0.4))) : t<t4+0.1? mw : t<t5+0.05? wpt("pistol","grip").add(new V3(0,0.04,0)) : null;
      if(lh) armIK(runner,{side:"L",target:lh,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.18),w:1-back,tip:0.075});
      if(back>0) holdPost(ctx,{aim:back,amp:0.02,at:runner.group.position.clone().addScaledVector(P.fwd,5).setY(1.2)}); };
    ctx.post2=()=>{ pistolParts(T.rel?0:1, magOut>1?1:magOut, 0); W.pistol.mag.visible=!(magOut>1); pistolPost2(ctx,{aim:back,gunF:back>0.3?null:gF,light:t>0.25&&back<0.5?"tuck":"hand"});
      if(!ctx.newMag){ ctx.newMag=W.pistol.mag.clone(); scene.add(ctx.newMag); } ctx.newMag.visible=t>t2+0.35&&t<t3; if(ctx.newMag.visible){ const L=palm("L"); ctx.newMag.position.copy(L.p); ctx.newMag.quaternion.copy(W.pistol.obj.quaternion); } };
    ctx.phase= t<t1?"thumbs the release": t<t2?"the empty magazine drops": t<t3?"a fresh one from her pocket": t<t4+0.1?"seats it with a slap": t<t5+0.1?"drops the slide":"back on the aim"; return fin(back>0?mix(J,nAim(t,0.7),back):J); } };

// ================================================================ HAND WEAPONS
// a swing: the hand travels a path (shoulder-relative) while the weapon's tip and edge follow; the light stays in her left hand
function swingPost(ctx,k,o){ const P=TP(); runner.group.updateMatrixWorld(true); const S=runner.R.armR.getWorldPosition(new V3());
  const hp=S.clone().addScaledVector(P.fwd,o.hand[0]).add(new V3(0,o.hand[1],0)).addScaledVector(P.right,o.hand[2]);
  armIK(runner,{side:"R",target:hp,pole:S.clone().add(new V3(0,-0.5,0)).addScaledVector(P.right,0.5).addScaledVector(P.fwd,-0.2),w:1,tip:0.07}); ctx.wTip=o.tip; ctx.wEdge=o.edge; }
function swingPost2(ctx,k,lf){ const P=TP(), tip=P.fwd.clone().multiplyScalar(ctx.wTip[0]).add(new V3(0,ctx.wTip[1],0)).addScaledVector(P.right,ctx.wTip[2]), edge=P.fwd.clone().multiplyScalar(ctx.wEdge[0]).add(new V3(0,ctx.wEdge[1],0)).addScaledVector(P.right,ctx.wEdge[2]);
  inHand(k,edge,tip); lightLeft(lf); }
const lerp3=(a,b,w)=>a.map((x,i)=>x+(b[i]-x)*w);
// keys: [time, hand(fwd,up,right), tip direction, edge direction]
function swingKeys(K,t){ let i=0; while(i<K.length-2&&t>K[i+1][0]) i++; const a=K[i], b=K[i+1], w=sm5((t-a[0])/(b[0]-a[0])); return {hand:lerp3(a[1],b[1],w),tip:lerp3(a[2],b[2],w),edge:lerp3(a[3],b[3],w)}; }
function meleeBody(t,u,wind,hit){ const J=nStand(t,0.8); J.lLx=-0.38; J.kL=0.32; J.lRx=0.25; J.kR=0.25; J.lRz=0.14; J.syaw=0.45*wind-0.55*hit; J.hyaw=0.15*wind-0.2*hit; J.sp=0.15+0.25*hit; J.sroll=0.1*wind-0.15*hit; J.ny=-0.3*wind+0.25*hit; J.aLx=-0.6; J.eL=1.2; J.aLz=0.2; return J; }
// ---- hatchet: chop. Up over her right shoulder, then down hard into the neck of the one in front of her; it drops
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
const F_LEFT={hyaw:-0.35,syaw:-0.6,sroll:0.1,sp:0.22,aRx:-1.85,aRy:-0.45,aRz:0.05,eR:1.2,c:-0.05,aLx:-0.3,aLz:0.6,eL:0.6,ny:0.2};
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
function crowbarAt(th,ht,lift){ runner.group.updateMatrixWorld(true); const q=runner.R.chest.getWorldQuaternion(QI()), cf=new V3(0,0,1).applyQuaternion(q).setY(0).normalize(), cr=new V3().crossVectors(cf,UP).negate().normalize(), C=runner.B.chest.getWorldPosition(new V3()).add(new V3(0,0.08,0));
  /* th is measured from where her chest faces, so the bar turns with her shoulders and her arms stay in front of her */
  const rad=cf.clone().multiplyScalar(Math.cos(th)).addScaledVector(cr,Math.sin(th)), tan=cf.clone().multiplyScalar(-Math.sin(th)).addScaledVector(cr,Math.cos(th));
  const G=C.clone().addScaledVector(rad,0.47+0.08*Math.max(0,ht)).add(new V3(0,ht,0)), tip=rad.clone().multiplyScalar(Math.cos(lift)).add(new V3(0,Math.sin(lift),0)).normalize(); return {G,tip,edge:tan.clone().negate()}; }
function lightOnChest(){ ensureProps(); runner.group.updateMatrixWorld(true); const q=runner.R.chest.getWorldQuaternion(QI()), f=new V3(0,0,1).applyQuaternion(q), r=new V3(-1,0,0).applyQuaternion(q), c=runner.B.chest.getWorldPosition(new V3());
  LIGHT.visible=true; setProp(LIGHT,LGRIP,c.clone().addScaledVector(f,0.13).addScaledVector(r,0.07).add(new V3(0,0.12,0)),f.clone().add(new V3(0,-0.2,0)),UP); SPOT.intensity=4; }
function twoHanded(ctx,k,arc){ const o=W[k]; const pl=placement(new V3(0,-0.49,0),arc.G,arc.edge,arc.tip); o.obj.position.copy(pl.p); o.obj.quaternion.copy(pl.q); o.obj.updateMatrixWorld(true);
  const P=TP(), S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3()), gr=o.obj.localToWorld(new V3(0,-0.43,0)), gl=o.obj.localToWorld(new V3(0,-0.56,0));
  armIK(runner,{side:"R",target:gr,pole:S.clone().add(new V3(0,-0.3,0)).addScaledVector(P.right,0.7),w:1,tip:0.07});
  armIK(runner,{side:"L",target:gl,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.3),w:1,tip:0.07}); }
const CB={ ready:{th:0.3,ht:-0.3,lift:0.75}, wind:{th:0.55,ht:0.24,lift:1.25}, hit:{th:0.25,ht:0.05,lift:0.05}, thru:{th:-0.4,ht:-0.06,lift:-0.15} };
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
A.cb_pry={ start(ctx){ wStart(ctx,"crowbar",0); ctx.yaw=Math.PI-0.6; const f=TP().fwd; ctx.s0=-0.24; ctx.x=f.x*ctx.s0; ctx.z=f.z*ctx.s0;   /* turned so the camera sees the door's face over her shoulder */
    ensureDoor(); DOOR.leaf.rotation.y=0; DOOR.position.copy(f.clone().multiplyScalar(0.72)); DOOR.rotation.y=ctx.yaw-Math.PI/2; ctx.camX=0; ctx.camD=4.6; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), tIn=0.8, heaves=[1.2,2.0,2.8], tOut=3.55, tSet=4.1, tPush=4.35, tGive=5.25; let J=nStand(t,0.6);
    // the door: each heave opens it to a peak and it springs back part of the way (the give); then the shove
    let ang=0, lean=0, rest=0; heaves.forEach((h,i)=>{ const k=t-h, peak=[0.07,0.14,0.21][i], keep=[0.025,0.07,0.12][i]; if(k>0){ const up=sat(k/0.35), down=sat((k-0.4)/0.3); const a=peak*sm5(up)-(peak-keep)*sm5(down)+0.012*Math.sin(k*40)*Math.exp(-k*6)*(k<0.7?1:0); ang=Math.max(ang,i===0||k<0.8?a:keep); rest=keep; lean=Math.max(lean,Math.sin(Math.PI*sat(k/0.75))); } });
    const shove=t>tPush? sat((t-tPush)/0.25) : 0, creep=t>tPush? 0.07*sm5((t-tPush)/0.5)+0.025*Math.sin((t-tPush)*18)*Math.exp(-(t-tPush)*3)*(t<tGive?1:0) : 0;
    if(t>tGive&&!T.give){ T.give=t; ctx.events.push({kind:"doorGive"}); } if(t>tPush+0.05&&!T.p){ T.p=1; ctx.events.push({kind:"doorShove"}); }
    const swing=T.give? 1.55*eOut(sat((t-T.give)/0.7)) : 0; ang=Math.max(ang, rest+creep+swing);
    if(T.give) ang=Math.max(ang,rest+0.07); DOOR.leaf.rotation.y=ang;
    // her: pry stance, leaning back on the bar with each heave
    if(t<tOut){ J.lLx=-0.5-0.15*lean; J.kL=0.42+0.15*lean; J.lRx=0.32; J.kR=0.3; J.sp=0.15-0.2*lean; J.hp=-0.1*lean; J.hz=-0.05*lean; J.syaw=0.25; J.nx=0.12; }
    // the shove: steps in, left shoulder and both hands to the door, drives with the back leg
    const step=sm5((t-tOut)/0.6); if(t>tOut){ const sAl=-0.24+0.58*step+(T.give?0.45*sm5((t-T.give-0.1)/0.6):0), f=P.fwd; ctx.x=f.x*sAl; ctx.z=f.z*sAl; ctx.moving=t<tSet||!!T.give; }
    if(t>tOut){ const S={...nStand(t,0.8)}; const d=sat((t-tSet)/0.3); S.lLx=-0.55*d; S.kL=0.5*d+0.1; S.lRx=0.55*d; S.kR=0.15; S.fR=-0.2*d; S.sp=0.18+0.32*d+0.08*shove; S.hp=0.12*d; S.syaw=-0.35*d; S.sroll=0.12*d; S.nx=0.1; S.ny=-0.3*d;
      if(T.give){ const k=t-T.give, st=Math.sin(Math.PI*sat(k/0.5)); S.sp+=0.15*st; S.lLx-=0.3*st; S.kL+=0.3*st; }
      J=mix(J,S,step); }
    const gap=doorEdge(1.05,-0.02), hold=gap.clone().addScaledVector(P.fwd,-0.36-0.07*lean).add(new V3(0,-0.04,0)).addScaledVector(P.right,0.08);
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
      if(t<tOut){ const w=sm5((t-0.2)/0.5)*(1-sm5((t-tOut+0.3)/0.3));
        armIK(runner,{side:"R",target:hold,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.35),w,tip:0.07});
        const onBar=hold.clone().addScaledVector(gap.clone().add(new V3(0,0.06,0)).sub(hold).normalize(),0.22); /* her left hand on the bar, between her right and the claw */
        armIK(runner,{side:"L",target:onBar,pole:SL.clone().add(new V3(0,-0.25,0)).addScaledVector(P.right,-0.9).addScaledVector(P.fwd,-0.2),w:w*sm5((t-tIn)/0.4),tip:0.07}); }
      else { const d=sm5((t-tSet+0.2)/0.4)*(T.give?1-sm5((t-T.give-0.5)/0.5):1);
        armIK(runner,{side:"L",target:doorEdge(1.25,0.04).addScaledVector(P.right,-0.12),pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.4),w:d,tip:0.07});
        armIK(runner,{side:"R",target:doorEdge(1.0,0.04).addScaledVector(P.right,0.1),pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.4),w:d*0.9,tip:0.07}); } };
    ctx.post2=()=>{ if(t<tOut){ const R=palm("R"), claw=gap.clone().add(new V3(0,0.06,0)); inHand("crowbar",P.right.clone().negate(),claw.sub(R.p).normalize()); }
      else { const H=handFrame("R"); inHand("crowbar",H.fingers,H.thumb); }
      lightOnChest(); };
    const hv=heaves.findIndex(h=>t>h&&t<h+0.8);
    ctx.phase= t<tIn?"the claw into the gap": t<tOut? (hv>=0?`heaves (${hv+1} of 3) · it cracks open, springs back`:"resets her grip"): t<tPush?"it won't go · she sets her shoulder and hands to it": !T.give?"drives with her legs · it gives a little, sticks":"it breaks free and swings wide · she stumbles in";
    return fin(J); } };

A.kn_slash={ start(ctx){ wStart(ctx,"knife"); },
  step(t,dt,ctx){ const T=ctx.T, R0=[0.25,-0.3,0.15], tR=[0.8,0.3,0], eR=[0.1,0,-1];
    const K=[[0,R0,tR,eR],[0.8,R0,tR,eR],[1.0,[0.15,0.0,0.3],[0.6,0.4,0.6],[0.2,0,-1]],[1.15,[0.45,-0.05,-0.25],[0.6,0.1,-0.7],[0.2,0,-1]],[1.5,[0.15,-0.2,0.15],[0.8,0.2,0],[0,-1,0]],[1.7,[0.55,-0.15,0.0],[1,0,0],[0,-1,0]],[2.4,R0,tR,eR]];
    const sk=swingKeys(K,t); if(t>1.1&&!T.a){ T.a=1; ctx.events.push({kind:"slash"}); } if(t>1.66&&!T.b){ T.b=1; ctx.events.push({kind:"stab"}); }
    ctx.atk={x:0.85,z:0,yaw:-Math.PI/2,J:aReach(t,0.5)}; if(T.a){ ctx.atk.J.sp-=0.2; } if(T.b){ const k=t-1.66; ctx.atk.J.sp-=0.35*sm5(k/0.2); ctx.atk.x=0.85+0.35*sm5((k-0.1)/0.5); }
    const sw=t<1.15?sm5((t-0.8)/0.35):t<1.7?1:1-sm5((t-1.7)/0.6), J=meleeBody(t,0,0.3*(1-sw),sw*0.6); J.lLx=-0.45; J.kL=0.4;
    ctx.post=()=>swingPost(ctx,"knife",sk); ctx.post2=()=>swingPost2(ctx,"knife");
    ctx.phase= t<0.8?"knife low, the light up": t<1.3?"slashes across": t<1.8?"stabs":"it reels back"; return fin(J); } };
// ---- knife: breaking a grab. Its hands on her shoulders; she drives the knife up into its neck, again, until it lets go
A.kn_free={ start(ctx){ wStart(ctx,"knife"); ctx.mash=0; ctx.out="free"; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), tG=0.5; let J=nStand(t,1);
    const g=t-tG, held=g>0&&!T.free; if(g>0&&!T.g){ T.g=1; ctx.events.push({kind:"grab"}); }
    ctx.atk={x:Math.max(0.62,1.6-1.2*sm5(t/0.5)),z:0,yaw:-Math.PI/2,J:aReach(t,1)};
    const stabs=[1.0,1.45,1.9], si=stabs.findIndex(s=>t<s+0.3&&t>s-0.25), ph=si>=0?(t-stabs[si]+0.25)/0.55:0;
    stabs.forEach((s,i)=>{ if(t>s&&!T["s"+i]){ T["s"+i]=1; ctx.events.push({kind:"stab"}); } });
    if(held){ ctx.qte=Math.min(1,(t-tG)/1.5); const S=nStand(t,1); S.sp=-0.18; S.nx=-0.3; S.ny=0.25; S.lLx=-0.4; S.kL=0.4; J=S; ctx.atk.J.nx=-0.5+0.15*Math.sin(t*9); ctx.atk.J.hz=0.1; if(T.s0) ctx.atk.J.nx-=0.2*Math.sin(t*14); }
    if(t>2.1&&!T.free){ T.free=t; ctx.events.push({kind:"knFree"}); ctx.qte=null; }
    if(T.free){ const k=t-T.free; ctx.atk.fall=Math.min(1,PHYS.topple(ctx.aT||(ctx.aT={th:0.2,w:2.0}),dt,1.6,Math.PI/2-0.08)); ctx.atk.x=0.62+0.4*sm5(k/0.5); J=mix(J,nStand(t,1),sm5(k/0.4)); ctx.x-=0.25*dt*(k<0.6?1:0); }
    const neck=by.c.B.neck.getWorldPosition(new V3()), low=runner.B.chest.getWorldPosition(new V3()).addScaledVector(P.fwd,0.2).add(new V3(0,-0.12,0)).addScaledVector(P.right,0.08);
    const stab=si>=0? Math.sin(Math.PI*sat(ph)) : 0, hand=held? low.clone().lerp(neck.clone().addScaledVector(P.fwd,-0.08),stab) : null;
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
      if(hand) armIK(runner,{side:"R",target:hand,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.3),w:1,tip:0.07});
      if(held){ const ch=by.c.B.chest.getWorldPosition(new V3()); armIK(runner,{side:"L",target:ch.clone().addScaledVector(P.right,-0.1).add(new V3(0,0.1,0)),pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.3),w:1,tip:0.07});
        const sh=s=>runner.B["upperarm_"+s].getWorldPosition(new V3()); armIK(by.c,{side:"L",target:sh("R"),pole:by.c.R.armL.getWorldPosition(new V3()).add(new V3(0,-0.6,0)),w:1,tip:0.1}); armIK(by.c,{side:"R",target:sh("L"),pole:by.c.R.armR.getWorldPosition(new V3()).add(new V3(0,-0.6,0)),w:1,tip:0.1}); } };
    ctx.post2=()=>{ const R=palm("R"), tipDir=held? neck.clone().sub(R.p).normalize() : P.fwd.clone().add(new V3(0,0.3,0)); inHand("knife",P.right.clone(),tipDir); lightLeft(held?P.fwd.clone().add(new V3(0,-0.6,0)):null); };
    ctx.phase= g<0?"it lunges": held?"grabbed · she drives the knife up into its neck":"it lets go and drops"; return fin(J); } };

// ================================================================ ROAD FLARE
function flarePost2(ctx,lit,fd){ const P=TP(); inHand("flare",P.right.clone().negate(),fd||P.fwd.clone().add(new V3(0,1.2,0))); lightLeft(null,1);
  const o=W.flare; o.glow.visible=lit>0; o.light.intensity=lit*(2.6+0.9*noise(t*25,3)+0.4*Math.random()); if(lit>0&&Math.random()<0.85){ o.obj.updateMatrixWorld(true); sparks(o.obj.localToWorld(o.pts.tip.clone()),1,0xff8050); }
  o.obj.userData.parts.Cap.visible=!ctx.T.cap; }
// ---- strike: pulls the cap, strikes the end across it; it catches and burns red. She holds it up; the one in the dark
// backs off from the light, an arm over its eyes
A.fl_strike={ start(ctx){ wStart(ctx,"flare"); ctx.camX=1.4; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t0=0.6, t1=1.2, t2=1.45; let J=nStand(t,1);
    if(t>t0&&!T.cap){ T.cap=1; } if(t>t2&&!T.lit){ T.lit=t; ctx.events.push({kind:"flareLit"}); }
    const lit=T.lit?Math.min(1,(t-T.lit)/0.25):0, up=sm5((t-t2-0.4)/0.5);
    ctx.atk={x:2.6,z:0.1,yaw:-Math.PI/2,J:aStand(t)}; if(T.lit){ const k=t-T.lit; const sh=sm5((k-0.2)/0.4); ctx.atk.J.aLx=-1.4*sh; ctx.atk.J.eL=1.9*sh; ctx.atk.J.aLz=-0.3*sh; ctx.atk.J.nx=0.3*sh; ctx.atk.J.sp=0.3-0.15*sh; ctx.atk.x=2.6+1.0*sm5((k-0.4)/1.4); ctx.atk.J.lLx=0.3*Math.sin(k*6)*sat(k-0.4)*(1-sat((k-1.8)/0.2)); }
    const chest=runner.B.chest.getWorldPosition(new V3());
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
      const hold=chest.clone().addScaledVector(P.fwd,0.28).addScaledVector(P.right,0.06), high=S.clone().addScaledVector(P.fwd,0.35).add(new V3(0,0.3,0)).addScaledVector(P.right,0.1);
      const strike=t>t1&&t<t2+0.1? Math.sin(Math.PI*sat((t-t1)/0.3)) : 0;
      armIK(runner,{side:"R",target:hold.clone().lerp(high,up).addScaledVector(P.fwd,0.06*strike),pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.4),w:sm5(t/0.4),tip:0.07});
      if(t>t0-0.3&&t<t2+0.2) armIK(runner,{side:"L",target:hold.clone().addScaledVector(P.right,-0.06).add(new V3(0,0.18-0.15*strike,0)).addScaledVector(P.fwd,0.05),pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.3),w:sm5((t-t0+0.3)/0.2)*(1-sm5((t-t2)/0.2)),tip:0.07}); };
    ctx.post2=()=>{ flarePost2(ctx,lit,P.fwd.clone().multiplyScalar(0.3).add(new V3(0,1,0))); if(t>t0-0.3&&t<t2+0.2){ const L=palm("L"); /* the cap in her left hand, struck across the end */ } };
    J.nx=0.15-0.25*up; J.sp=0.12; ctx.phase= t<t0?"a road flare from her pocket": t<t1?"pulls the cap": t<t2+0.1?"strikes it":"it burns red · she holds it up · it backs off from the light"; return fin(J); } };
// ---- throw: lit, she lobs it underarm down the hall; it lands, rolls and keeps burning there
A.fl_throw={ start(ctx){ wStart(ctx,"flare"); ctx.T.cap=1; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t0=0.8, t1=1.25; let J=nStand(t,0.8);
    if(t>t1&&!T.thrown){ T.thrown=t; ctx.events.push({kind:"flareThrow"}); }
    const wind=sm5((t-t0)/(t1-t0-0.1))*(1-sm5((t-t1)/0.12)), thr=sm5((t-t1+0.12)/0.2)*(1-sm5((t-t1-0.5)/0.6));
    J.lLx=-0.4*thr; J.kL=0.3; J.lRx=0.3*wind; J.sp=0.15+0.1*thr; J.syaw=0.4*wind-0.2*thr; J.nx=0.1;
    ctx.atk={x:3.9,z:-0.2,yaw:-Math.PI/2,J:aStand(t)}; if(T.thrown){ const k=t-T.thrown; const sh=sm5((k-0.6)/0.4); ctx.atk.J.aLx=-1.4*sh; ctx.atk.J.eL=1.9*sh; ctx.atk.x=3.9+0.8*sm5((k-0.8)/1.5); }
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()); const back=S.clone().addScaledVector(P.fwd,-0.35).add(new V3(0,-0.45,0)).addScaledVector(P.right,0.15), rel=S.clone().addScaledVector(P.fwd,0.5).add(new V3(0,-0.05,0)), hold=S.clone().addScaledVector(P.fwd,0.3).add(new V3(0,-0.25,0)).addScaledVector(P.right,0.05);
      const tg= t<t0? hold : t<t1? hold.clone().lerp(back,wind) : t<t1+0.25? back.clone().lerp(rel,sm5((t-t1+0.05)/0.25)) : rel.clone().lerp(hold,sm5((t-t1-0.3)/0.7));
      armIK(runner,{side:"R",target:tg,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.35),w:1,tip:0.07}); };
    ctx.post2=()=>{ if(!T.thrown) flarePost2(ctx,1); else { W.flare.obj.visible=false; W.flare.light.intensity=0; lightLeft(null,1); } };
    ctx.phase= t<t0?"a lit flare": t<t1?"swings it back": !T.thrown||t-T.thrown<1?"lobs it underarm down the hall":"it burns on the floor · the dark ahead lit red"; ctx.camX=ctx.x+1.6; ctx.camD=6.2; return fin(J); } };

// ================================================================ FLARE GUN
function fgParts(open,cock,trig,shell){ const o=W.flaregun; o.barrel.rotation.z=0.75*open; o.hammer.rotation.z=(20-40*cock)*Math.PI/180; o.trig.rotation.z=0.4*trig; o.shell.visible=shell!=="none"; o.shell.children[0].material.color.set(shell==="spent"?0x5a2a20:0xb82a20); o.shell.position.x=shell==="out"?0.03:0; }
// ---- fire: she thumbs the hammer back, aims high, fires; the flare arcs out burning and lands far down, lighting the dark
A.fg_fire={ start(ctx){ wStart(ctx,"flaregun"); ctx.aimT=1.5; },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t0=0.6, tc=1.0, tf=1.9; const aim=sm5((t-t0)/0.45); let J=mix(nStand(t,1),nAim(t,0.5),aim);
    if(t>tf&&!T.f){ T.f=t; ctx.events.push({kind:"fgShot"}); }
    const k=T.f?t-T.f:-1, kick=k>=0?0.45*Math.exp(-k/0.1)*sat(k/0.02):0, cock=t<tc?0:t<tc+0.2?sm5((t-tc)/0.2):k>=0?0:1, trig=k>=0?sat(1-(k-0.05)/0.15):t>tf-0.12?sm5((t-tf+0.12)/0.12):0;
    J.nx-=0.12*(k>=0?Math.exp(-k/0.3):0);
    const at=runner.group.position.clone().addScaledVector(P.fwd,8).setY(3.0), H={aim,amp:tremor(ctx,dt,aim>0.99),kick,at}; ctx.H=H;
    ctx.post=()=>holdPost(ctx,H); ctx.post2=()=>{ fgParts(0,cock,trig,k>=0?"spent":"live"); const R=palm("R"), f=(ctx.aimF||P.fwd); inHand("flaregun",f.clone().lerp(R.d.clone().multiplyScalar(0.55).add(P.fwd.clone().multiplyScalar(0.8)).normalize(),1-aim).normalize(),UP.clone().lerp(ctx.aimU||UP,aim)); const L=palm("L"); LIGHT.visible=true; setProp(LIGHT,LGRIP,L.p,f.clone().lerp(P.fwd.clone().add(new V3(0,-0.38,0)),1-aim).normalize(),UP); SPOT.intensity=4; };
    const fx=ctx.fgF?ctx.fgF.m.position.x:ctx.x; ctx.camX= k>0? (ctx.x+fx)/2+0.4 : null; ctx.camD= k>0? Math.max(5.6,(fx-ctx.x)*1.05+2) : null;
    ctx.phase= t<t0?"a flare gun": t<tc?"up, aimed high": t<tf?"thumbs the hammer back": k<1.2?"fires · the flare arcs out burning":"it lands far down and burns · the dark lit red"; return fin(J); } };
// ---- reload: breaks it open, the spent shell slides out and drops, a fresh flare shell from her pocket in, snaps it shut
A.fg_load={ start(ctx){ wStart(ctx,"flaregun"); },
  step(t,dt,ctx){ const T=ctx.T, P=TP(), t1=0.5, t2=0.9, t3=1.8, t4=2.2; let J=nStand(t,0.8); J.nx=0.38; J.sp=0.24;
    const open= t<t1?0: t<t1+0.2? sm5((t-t1)/0.2) : t<t4? 1 : 1-sm5((t-t4)/0.12);
    if(t>t2&&!T.ex){ T.ex=1; ctx.events.push({kind:"fgEject"}); } if(t>t3&&!T.in){ T.in=1; }
    const back=sm5((t-t4-0.3)/0.45), chest=runner.B.chest.getWorldPosition(new V3()).addScaledVector(P.fwd,0.32).addScaledVector(P.right,0.05).add(new V3(0,-0.04,0)), pocket=runner.B.hips.getWorldPosition(new V3()).addScaledVector(P.right,-0.17).addScaledVector(P.fwd,0.06);
    const gF=P.fwd.clone().addScaledVector(P.right,-0.4).add(new V3(0,0.15,0)).normalize();
    ctx.post=()=>{ const S=runner.R.armR.getWorldPosition(new V3()), SL=runner.R.armL.getWorldPosition(new V3());
      armIK(runner,{side:"R",target:chest,pole:S.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,0.18),w:1-back,tip:0.075});
      const breech=W.flaregun.barrel.localToWorld(new V3(0.0,0.017,0)), lh= t<t1-0.1? null : t<t2+0.2? breech : t<t3? (t<t2+0.6? breech.clone().lerp(pocket,sm5((t-t2-0.2)/0.4)) : pocket.clone().lerp(breech,sm5((t-t2-0.75)/0.35))) : t<t4+0.15? breech : null;
      if(lh) armIK(runner,{side:"L",target:lh,pole:SL.clone().add(new V3(0,-0.6,0)).addScaledVector(P.right,-0.18),w:1-back,tip:0.075});
      if(back>0) holdPost(ctx,{aim:back,amp:0.02,at:runner.group.position.clone().addScaledVector(P.fwd,5).setY(1.4)}); };
    ctx.post2=()=>{ fgParts(open,0,0,T.in?"live":T.ex?"none":"spent"); const R=palm("R"); inHand("flaregun",back>0.3?(ctx.aimF||P.fwd):gF,UP); propsPost(ctx,{gun:"gone",light:t>0.2&&back<0.5?"tuck":"hand",aim:back});
      if(!ctx.fs) ctx.fs=ammo("fshell"); ctx.fs.visible=t>t2+0.5&&t<t3; if(ctx.fs.visible){ const L=palm("L"); setProp(ctx.fs,new V3(0,0,0),L.p,gF,UP); } };
    ctx.phase= t<t1?"lowers it": t<t2?"breaks it open": t<t2+0.5?"the spent shell slides out and drops": t<t3?"a fresh flare from her pocket": t<t4?"slides it in":"snaps it shut · back up"; return fin(back>0?mix(J,nAim(t,0.7),back):J); } };

// ================================================================ the menu
const WCLIPS={shotgun:["sg_aim","sg_fire","sg_load"],rifle:["rf_aim","rf_fire","rf_load"],pistol:["ps_aim","ps_fire","ps_load"],hatchet:["hx_chop","hx_flurry"],crowbar:["cb_swing","cb_pry"],knife:["kn_slash","kn_free"],flare:["fl_strike","fl_throw"],flaregun:["fg_fire","fg_load"]};
const ORDERS={pl:[].concat(...Object.values(WCLIPS))};
const LEN={sg_aim:4.5,sg_fire:4.4,sg_load:5.0,rf_aim:4.8,rf_fire:5.2,rf_load:5.0,ps_aim:4.0,ps_fire:3.6,ps_load:4.0,hx_chop:3.6,hx_flurry:3.4,cb_swing:3.6,cb_pry:7.2,kn_slash:3.2,kn_free:4.0,fl_strike:5.0,fl_throw:5.6,fg_fire:6.0,fg_load:4.0};
const NAMES={sg_aim:"Shotgun · aim",sg_fire:"Shotgun · fire and pump",sg_load:"Shotgun · reload",rf_aim:"Rifle · aim",rf_fire:"Rifle · fire and bolt",rf_load:"Rifle · reload",ps_aim:"Pistol · aim",ps_fire:"Pistol · fire",ps_load:"Pistol · reload",
  hx_chop:"Hatchet · chop",hx_flurry:"Hatchet · flurry",cb_swing:"Crowbar · swing",cb_pry:"Crowbar · pry a door",kn_slash:"Knife · slash and stab",kn_free:"Knife · break a grab",fl_strike:"Road flare · strike",fl_throw:"Road flare · throw",fg_fire:"Flare gun · fire",fg_load:"Flare gun · reload"};
const DMG={doorShove:["SHOVE","her shoulder to it"],sgShot:["BOOM","12-gauge"],rfShot:["CRACK",".30-06"],psShot:["9mm",""],chop:["CHOP",""],bash:["CLANG",""],slash:["SLASH",""],stab:["STAB",""],grab:["GRABBED",""],knFree:["FREE","it lets go"],flareLit:["LIT","it backs off from the light"],doorGive:["IT GIVES",""],fgShot:["FLARE",""]};
const RCEV={
  sgShot(){ const m=wpt("shotgun","muzzle"); FLASH.position.copy(m); FLASH.intensity=7; puffAt(m,0.9); sparks(m,6,0xffd27a); shake=Math.max(shake,0.14); const c=tgtChest(); puffAt(c,0.8); BLOODsplat(c,14); },
  sgEject(){ const p=wpt("shotgun","port"), P=TP(); eject("shell",p,P.right.clone().multiplyScalar(1.6).add(new V3(0,1.4,0)).addScaledVector(P.fwd,-0.3)); },
  sgLoad(){ shake=Math.max(shake,0.01); },
  rfShot(){ const m=wpt("rifle","muzzle"); FLASH.position.copy(m); FLASH.intensity=7; puffAt(m,0.7); shake=Math.max(shake,0.12); const c=tgtChest(); puffAt(c,0.5); BLOODsplat(c,10); },
  rfEject(){ const p=wpt("rifle","port"), P=TP(); eject("case",p,P.right.clone().multiplyScalar(1.4).add(new V3(0,1.2,0))); }, rfLoad(){},
  psShot(e){ const m=wpt("pistol","muzzle"); FLASH.position.copy(m); FLASH.intensity=4.5; puffAt(m,0.3); shake=Math.max(shake,0.04); const p=wpt("pistol","port"), P=TP(); eject("case9",p,P.right.clone().multiplyScalar(1.8).add(new V3(0,1.6,0))); const c=tgtChest(); BLOODsplat(c,4); },
  magDrop(){ const o=W.pistol; o.obj.updateMatrixWorld(true); const m=o.mag.clone(); o.mag.getWorldPosition(m.position); o.mag.getWorldQuaternion(m.quaternion); scene.add(m); dropPiece(m,new V3(0,-0.4,0),new V3(1,0,2)); },
  magSeat(){ shake=Math.max(shake,0.02); }, slideRel(){ shake=Math.max(shake,0.02); },
  chop(){ const c=by.c.B.neck.getWorldPosition(new V3()); BLOODsplat(c,12); shake=Math.max(shake,0.1); }, bash(){ const c=by.c.B.head.getWorldPosition(new V3()); BLOODsplat(c,8); shake=Math.max(shake,0.12); },
  slash(){ BLOODsplat(by.c.B.chest.getWorldPosition(new V3()),6); }, stab(){ BLOODsplat(by.c.B.neck.getWorldPosition(new V3()),6); shake=Math.max(shake,0.05); }, grab(){ shake=Math.max(shake,0.1); }, knFree(){ shake=Math.max(shake,0.06); },
  flareLit(){ const o=W.flare; o.obj.updateMatrixWorld(true); sparks(o.obj.localToWorld(o.pts.tip.clone()),14,0xffc080); },
  flareThrow(){ const o=W.flare, P=TP(); o.obj.updateMatrixWorld(true); const p=o.obj.localToWorld(o.pts.tip.clone()); burningFlare(p,P.fwd.clone().multiplyScalar(3.4).add(new V3(0,2.0,0))); },
  doorGive(){ shake=Math.max(shake,0.14); puff(new V3(0.72,0,0.4),1); }, doorShove(){ shake=Math.max(shake,0.05); },
  fgShot(){ const m=W.flaregun.barrel.localToWorld(new V3(-0.13,0.017,0)), P=TP(); FLASH.position.copy(m); FLASH.intensity=5; puffAt(m,0.6); sparks(m,10,0xff8050); shake=Math.max(shake,0.06); const d=(ctx.aimF||P.fwd).clone(); ctx.fgF=burningFlare(m,d.multiplyScalar(9),0xff5a2a); },
  fgEject(){ const o=W.flaregun; const p=o.shell.getWorldPosition(new V3()); eject("fshell",p,new V3(0,-0.2,0)); } };
