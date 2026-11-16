// ---------------------------------------------------------------- run it
const loader=new THREE.GLTFLoader(); const load=k=>new Promise((res,rej)=>loader.load(k,res,undefined,rej));
let nora=null, cur="crawl", t=0, ctx={}, camMode="side", slow=false, playAll=false, boneHelp=null;
const orbit={yaw:0.9,pitch:0.3,drag:null};
function setupHob(g){ const group=new THREE.Group(); group.rotation.y=Math.PI/2; scene.add(group); group.add(g.scene);
  let mesh=null; g.scene.traverse(o=>{ if(o.isSkinnedMesh) mesh=o; }); mesh.frustumCulled=false;
  const geo=mesh.geometry; geo.computeVertexNormals(); const n=geo.attributes.position.count; geo.setAttribute("color",new THREE.BufferAttribute(new Float32Array(n*3).fill(1),3));
  skinMat=new THREE.MeshLambertMaterial({map:mesh.material.map,skinning:true,vertexColors:true,side:THREE.DoubleSide}); if(skinMat.map) skinMat.map.encoding=THREE.LinearEncoding; mesh.material=skinMat;
  // the tongue wears the Hob's own skin: a patch of the atlas cut from where the torso's skin is mapped
  { const uv=geo.attributes.uv, f2=geo.attributes.uv2, us=[], vs=[]; for(let i=0;i<n;i++) if(f2&&f2.getX(i)>0.9){ us.push(uv.getX(i)); vs.push(uv.getY(i)); } us.sort((a,b)=>a-b); vs.sort((a,b)=>a-b);
    const img=skinMat.map&&skinMat.map.image; let tmap=null; if(img&&us.length){ const cu=us[us.length>>1], cv=vs[vs.length>>1], W=img.width, Hh=img.height, c=document.createElement("canvas"); c.width=c.height=128; const g2=c.getContext("2d");
      const sw=Math.max(16,(us[Math.floor(us.length*0.7)]-us[Math.floor(us.length*0.3)])*W*0.5), sh=Math.max(16,(vs[Math.floor(vs.length*0.7)]-vs[Math.floor(vs.length*0.3)])*Hh*0.5);
      g2.drawImage(img,cu*W-sw/2,(skinMat.map.flipY?1-cv:cv)*Hh-sh/2,sw,sh,0,0,128,128); tmap=new THREE.CanvasTexture(c); tmap.wrapS=tmap.wrapT=THREE.MirroredRepeatWrapping; tmap.repeat.set(1,6); }
    lidMat=new THREE.MeshLambertMaterial({map:tmap,color:tmap?0xf0d8b8:0xc8a070,side:THREE.DoubleSide}); }
  const B={}, bind={}; for(const b of mesh.skeleton.bones){ B[b.name]=b; bind[b.name]=b.position.clone(); }
  const P=geo.attributes.position, base=new Float32Array(P.array), flag=geo.attributes.uv2;
  // the torso's verts, each with its way out from the body's centre line, how far along it is, and its angle round it
  const idx=[], bw=[]; for(let i=0;i<n;i++) if(flag && flag.getX(i)>0.01){ idx.push(i); bw.push(flag.getX(i)); }
  const bins={}; for(const i of idx){ const k=Math.round(P.getZ(i)*4); (bins[k]=bins[k]||[]).push(P.getY(i)); } const cy={}; for(const k in bins){ const a=bins[k]; cy[k]=(Math.min(...a)+Math.max(...a))/2; }
  const D=new Float32Array(idx.length*3), Z=new Float32Array(idx.length), Ang=new Float32Array(idx.length);
  idx.forEach((i,k)=>{ const x=P.getX(i), y=P.getY(i), z=P.getZ(i), c=cy[Math.round(z*4)]; let dx=x, dy=y-c; const L=Math.hypot(dx,dy)||1; D[3*k]=dx/L; D[3*k+1]=dy/L; Z[k]=z; Ang[k]=Math.atan2(dx,dy); });
  H={group,mesh,B,bind,base,bodyIdx:Int32Array.from(idx),bodyDir:D,bodyZ:Z,bodyA:Ang,bodyW:Float32Array.from(bw)};
  // the mouth inside: dark, so an open jaw shows a throat instead of the back of the face
  const throat=new THREE.Mesh(new THREE.SphereGeometry(0.42,16,12),new THREE.MeshLambertMaterial({color:0x2a0504,side:THREE.DoubleSide})); throat.position.set(0,0.6-B.head.position.y-B.root.position.y,0.05-B.head.position.z-B.root.position.z); throat.scale.set(1.15,0.75,1); B.head.add(throat);
  const sh=blob(); sh.scale.set(3.2,1,11); H.shadow=sh;
  boneHelp=new THREE.SkeletonHelper(g.scene); boneHelp.visible=false; scene.add(boneHelp); setupPalms(); setupCross(); setupFaceEyes(); }
function start(a){ cur=a; t=0; ctx={}; for(const q of fx) scene.remove(q.m); fx.length=0; clearGore(); for(const s of ["L","R"]){ tongues[s].visible=false; if(palm[s]) palm[s].open=0; } for(const L of lumps){ L.amp=0; } if(nora) nora.gs=null;
  A[a].start(ctx); for(const b of document.querySelectorAll(".anim")) b.setAttribute("aria-pressed",String(b.dataset.a===a)); document.getElementById("hName").textContent=A[a].name; }
function poseHer(n){ const show=!!n; nora.group.scale.set(1,1,1); if(!show) gun.visible=false; nora.group.visible=nora.shadow.visible=show; if(!show) return;
  let J; const k=n.k||0; if(n.pose==="walk"){ const s=Math.sin(n.ph*2*Math.PI), c=Math.cos(n.ph*2*Math.PI); J=NP.stand(); J.lLx=-0.4*s; J.lRx=0.4*s; J.kL=0.1+0.5*Math.max(0,c); J.kR=0.1+0.5*Math.max(0,-c); J.aLx=0.35*s; J.aRx=-0.35*s; J.eL=J.eR=0.4; J.sp=0.08; J.ny=1.1*(n.look||0); J.syaw=0.35*(n.look||0); J.hd=0.02*Math.abs(c); }
  else if(n.pose==="held"){ J=NP.held(t); if(n.aim){ const hp=nora.group.position.clone(), d=Math.hypot(n.aim.x-hp.x,n.aim.z-hp.z), pitch=Math.atan2(n.aim.y-(hp.y+1.42),Math.max(0.3,d)); J.aRx=-1.5-pitch; J.aRz=0.05; J.eR=0.05; J.ny=0.2; } }
  else if(n.pose==="backstep") J=NP.backstep(n.ph);
  else if(n.pose==="scramble"){ J=NP.lie(t,1,1); } else if(n.pose==="dragged"){ J=NP.stumble(); J.sp=-0.5; J.aLx=-1.2; J.aRx=-1.0; J.lLx=-0.6; J.lRx=-0.3; } else if(n.pose==="fall") J=mix(NP.held(t),NP.lie(t,1,0.3),ss(k)); else J=NP.stand();
  applyPose(nora,J); const w=m2w(n.m); nora.group.position.copy(w); nora.group.rotation.set(0,(n.pose==="walk"||n.pose==="held"||n.pose==="fall")&&!n.faceIt?Math.PI/2:-Math.PI/2,0);
  if(n.pose==="dragged") nora.group.rotateX(-0.55*ss(k*4)); const sq=n.squash||0; nora.group.scale.set(1-0.08*sq,1+0.03*sq,1-0.08*sq);   /* crushed in the fist */ if(n.pose==="fall"||n.pose==="scramble") nora.group.rotateX(-(n.pose==="scramble"?1:ss(k))*Math.PI/2); retarget(nora);
  gun.visible=!!n.aim; if(n.aim){ nora.group.updateMatrixWorld(true); gun.position.copy(tipOf(nora,"R")); gun.lookAt(n.aim); } }
function frame(dtReal){
  if(!H||!nora) return;
  if(hold>0){ hold-=Math.min(0.05,dtReal); renderer.render(scene,cam); return; }
  const dt=Math.min(0.05,dtReal)*(slow?0.25:1); t+=dt; ctx.tongues=null; ctx.palm=null; ctx.dropY=ctx.dropY; ctx.frantic=false; ctx.lumpK=ctx.lumpK??1; ctx.slosh=0;
  resetBones(); A[cur].step(t,dt,ctx); groundLegs(); H.group.updateMatrixWorld(true);
  skin(t,dt,ctx); H.group.updateMatrixWorld(true);
  for(const s of ["L","R"]){ const E=ctx.palm&&ctx.palm[s]; updatePalm(s,E,dt); const b=palmOut(s); drawTongue(s,b.p,b.d,tonguePath(s,t),1,t,0.6); }   /* the tongues: always out, always visible */
  poseHer(ctx.her); H.shadow.position.set(H.group.position.x-3.3,0.006,0);
  placeCross(); stepCross(t,dt,ctx.flare||0); stepFx(dt); stepGore(dt);
  if(cueT>0){ cueT-=dt; if(cueT<=0) document.getElementById("cue").style.opacity=0; }
  document.getElementById("hPh").textContent=ctx.phase||"—"; document.getElementById("hSp").textContent=ctx.sp||"";
  if(t>A[cur].len){ if(playAll) start(ORDER[(ORDER.indexOf(cur)+1)%ORDER.length]); else start(cur); return; }
  // camera
  const gx=H.group.position.x, cx=gx-(cur.startsWith("grab")?0.6:cur==="throne"?-0.5:3.2); let p, look=new V3(cx,1.0,0);
  if(camMode==="side") p=new V3(cx,3.0,cur.startsWith("grab")||cur==="screech"?9.5:12.5);
  else if(camMode==="front"){ p=new V3(gx+7.5,1.6,0.4); look=new V3(gx,1.3,0); }
  else if(camMode==="top") p=new V3(cx+0.01,15,0.6);
  else if(camMode==="back"){ p=new V3(gx-15,3.2,-3.5); look=new V3(gx-3,1.0,0); }
  else if(camMode==="pov"&&nora.group.visible){ const e=nora.B.head.localToWorld(new V3(0,0.12,0.12)); p=e; look=(crossG?crossWorld():new V3(gx,1.5,0)); }
  else if(camMode==="skin"){ p=new V3(gx-3.6,2.9,3.2); look=new V3(gx-3.9,1.2,0); }
  else p=new V3(cx+Math.sin(orbit.yaw)*11*Math.cos(orbit.pitch),1.0+Math.sin(orbit.pitch)*11,Math.cos(orbit.yaw)*11*Math.cos(orbit.pitch));
  shake=Math.max(0,shake-dtReal*0.5); p.x+=(Math.random()-.5)*shake; p.y+=(Math.random()-.5)*shake;
  punch=Math.max(0,punch-dtReal*3.5); const fov=38-7*punch; if(Math.abs(cam.fov-fov)>0.01){ cam.fov=fov; cam.updateProjectionMatrix(); }
  if(camMode==="pov"){ shake=0; } cam.position.copy(p); cam.lookAt(look); renderer.render(scene,cam); }
let last=performance.now();
function loop(now){ requestAnimationFrame(loop); const w=canvas.clientWidth, h=canvas.clientHeight; if(canvas.width!==Math.round(w*renderer.getPixelRatio())||canvas.height!==Math.round(h*renderer.getPixelRatio())){ renderer.setSize(w,h,false); cam.aspect=w/Math.max(1,h); cam.updateProjectionMatrix(); }
  frame((now-last)/1000); last=now; }
for(const b of document.querySelectorAll(".anim")) b.onclick=()=>{ playAll=false; document.getElementById("oAll").setAttribute("aria-pressed","false"); start(b.dataset.a); };
for(const b of document.querySelectorAll("[data-cam]")) b.onclick=()=>{ camMode=b.dataset.cam; for(const x of document.querySelectorAll("[data-cam]")) x.setAttribute("aria-pressed",String(x===b)); };
const tog=(id,f)=>{ const b=document.getElementById(id); b.onclick=()=>{ const on=b.getAttribute("aria-pressed")!=="true"; b.setAttribute("aria-pressed",String(on)); f(on); }; };
tog("oSlow",on=>slow=on); tog("oAll",on=>{ playAll=on; if(on) start(ORDER[0]); }); tog("oBones",on=>{ if(boneHelp) boneHelp.visible=on; });
canvas.addEventListener("pointerdown",e=>{ orbit.drag={x:e.clientX,y:e.clientY,yaw:orbit.yaw,pitch:orbit.pitch}; });
addEventListener("pointermove",e=>{ if(!orbit.drag||camMode!=="three") return; orbit.yaw=orbit.drag.yaw-(e.clientX-orbit.drag.x)*0.01; orbit.pitch=clamp(orbit.drag.pitch+(e.clientY-orbit.drag.y)*0.006,0.02,1.3); });
addEventListener("pointerup",()=>orbit.drag=null);
addEventListener("keydown",e=>{ if(e.metaKey||e.ctrlKey||e.altKey) return; const i="123456".indexOf(e.key); if(i>=0){ playAll=false; start(ORDER[i]); } });
(async()=>{ try{ const [hg,ng]=await Promise.all([load("m/bosses/hob/hob_rigged.json"),load("m/cast/norah.json")]); setupHob(hg); nora=makeChar(ng); document.getElementById("load").hidden=true; start(cur); requestAnimationFrame(loop); }
  catch(e){ document.getElementById("load").textContent="Couldn't load the models: "+(e&&e.message||e); console.error(e); } })();
window.__hp={frame:(d)=>frame(d),start,get ctx(){return ctx;},get t(){return t;},get H(){return H;},cam,setCam:m=>camMode=m};
