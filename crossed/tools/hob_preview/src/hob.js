// ================================================================ THE HOB
const V3=THREE.Vector3, Q4=THREE.Quaternion, UP=new V3(0,1,0);
const qE=(x,y,z)=>new Q4().setFromEuler(new THREE.Euler(x,y,z,"YXZ"));
const wrap=a=>{ while(a>Math.PI) a-=2*Math.PI; while(a<-Math.PI) a+=2*Math.PI; return a; };
let H=null;   // the rigged Hob: {group, mesh, B (bones by name), bind (rest positions), ...}

// ---------------------------------------------------------------- the eye in the right palm, and its tongue (stand-ins added here)
const eyeTex=canvasTex(256,128,(g,w,h)=>{ g.fillStyle="#e6dccb"; g.fillRect(0,0,w,h); g.strokeStyle="rgba(150,20,20,0.6)";
  for(let i=0;i<40;i++){ g.lineWidth=0.5+Math.random(); g.beginPath(); let a=Math.random()*7, x=64+Math.cos(a)*60, y=64+Math.sin(a)*50; g.moveTo(x,y); for(let k=0;k<5;k++){ x+=(64-x)*0.18+(Math.random()-.5)*8; y+=(64-y)*0.18+(Math.random()-.5)*8; g.lineTo(x,y); } g.stroke(); }
  const gr=g.createRadialGradient(64,64,2,64,64,19); gr.addColorStop(0,"#f6d24a"); gr.addColorStop(0.7,"#d9a41c"); gr.addColorStop(1,"#6a4a08"); g.fillStyle=gr; g.beginPath(); g.arc(64,64,19,0,7); g.fill();
  g.strokeStyle="rgba(90,60,0,0.5)"; g.lineWidth=0.8; for(let i=0;i<24;i++){ const a=i/24*7; g.beginPath(); g.moveTo(64+Math.cos(a)*6,64+Math.sin(a)*6); g.lineTo(64+Math.cos(a)*18,64+Math.sin(a)*18); g.stroke(); }
  g.fillStyle="#0a0604"; g.fillRect(61,48,6,30); g.fillRect(54,57,20,6); });
let skinMat=null, lidMat=null;   // the Hob's own skin (the eyelids and palm lips use a patch of it)
// ---------------------------------------------------------------- the tongues: one in each palm. Flesh, about half Norah's height long (0.85 m), broad and flat
// like a tongue, tapering to a rounded tip; it can stretch only a little past that (1.05 m at most).
const fleshTex=canvasTex(128,128,(g,w,h)=>{ g.fillStyle="#b4534c"; g.fillRect(0,0,w,h);
  for(let i=0;i<300;i++){ const r=1.5+Math.random()*6; g.fillStyle=`rgba(${150+Math.random()*80|0},${50+Math.random()*40|0},${50+Math.random()*30|0},0.35)`; g.beginPath(); g.ellipse(Math.random()*w,Math.random()*h,r,r*(0.5+Math.random()),Math.random()*3,0,7); g.fill(); }
  g.strokeStyle="rgba(90,20,30,0.45)"; for(let i=0;i<10;i++){ g.lineWidth=0.6+Math.random(); g.beginPath(); let x=Math.random()*w,y=Math.random()*h; g.moveTo(x,y); for(let k=0;k<6;k++){ x+=(Math.random()-.5)*24; y+=(Math.random()-.5)*24; g.lineTo(x,y); } g.stroke(); }
  g.fillStyle="rgba(255,220,210,0.25)"; for(let i=0;i<60;i++) g.fillRect(Math.random()*w,Math.random()*h,1.5,1.5); },[1,4]);
const fleshMat=new THREE.MeshLambertMaterial({map:fleshTex,color:0xffffff});
const TL=0.85, TMAX=1.05, TS=40, TR=14;
function makeTongue(){ const g=new THREE.BufferGeometry(), n=(TS+1)*(TR+1); g.setAttribute("position",new THREE.BufferAttribute(new Float32Array(n*3),3)); const uv=new Float32Array(n*2), idx=[];
  for(let i=0;i<=TS;i++) for(let j=0;j<=TR;j++){ uv[2*(i*(TR+1)+j)]=j/TR; uv[2*(i*(TR+1)+j)+1]=i/TS; if(i<TS&&j<TR){ const a=i*(TR+1)+j, b=a+TR+1; idx.push(a,b,a+1,b,b+1,a+1); } }
  g.setAttribute("uv",new THREE.BufferAttribute(uv,2)); g.setIndex(idx); const m=new THREE.Mesh(g,fleshMat); m.frustumCulled=false; m.visible=false; scene.add(m); return m; }
const tongues={L:makeTongue(),R:makeTongue()};
// base: where it leaves the palm, and the way out; pts: where it is going; k: how far out (0..1 of that path, never past TMAX)
function drawTongue(s,base,dir,pts,k,t,wig=1){ const m=tongues[s]; if(k<0.02){ m.visible=false; return; }
  const c=new THREE.CatmullRomCurve3([base.clone(),base.clone().addScaledVector(dir,0.12),...pts]); const Lc=c.getLength(), len=Math.min(k*Lc,TMAX), uEnd=len/Lc;
  const P=m.geometry.attributes.position;
  for(let i=0;i<=TS;i++){ const f=i/TS, u=uEnd*f, p=c.getPointAt(Math.min(1,u)), T=c.getTangentAt(Math.min(1,u)); let S=T.clone().cross(UP); if(S.lengthSq()<1e-4) S.set(1,0,0); S.normalize(); const U=S.clone().cross(T).normalize();
    const wv=wig*0.035*Math.sin(f*8-t*7)*f; p.addScaledVector(S,wv).addScaledVector(U,0.5*wv*Math.cos(f*6-t*5));
    const tip=f>0.86?Math.sqrt(Math.max(0,1-Math.pow((f-0.86)/0.14,2))):1, w=0.15*(1-0.4*f)*tip*(1+0.05*Math.sin(t*9+f*12)), h=0.045*(1-0.3*f)*(0.35+0.65*tip);
    for(let j=0;j<=TR;j++){ const a=j/TR*Math.PI*2, ix=i*(TR+1)+j; const cr=Math.cos(a)*w, sr=Math.sin(a)*h*(1-0.25*Math.max(0,Math.sin(a))); P.setXYZ(ix,p.x+S.x*cr+U.x*sr,p.y+S.y*cr+U.y*sr,p.z+S.z*cr+U.z*sr); } }
  P.needsUpdate=true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); m.visible=true; }
function tongueTip(s){ const P=tongues[s].geometry.attributes.position, i=TS*(TR+1); return new V3(P.getX(i),P.getY(i),P.getZ(i)); }
// ---------------------------------------------------------------- rig helpers. Bones are posed in the Hob's model space (it faces +z), then shown through the group
function resetBones(){ for(const n in H.B){ const b=H.B[n]; b.position.copy(H.bind[n]); b.quaternion.identity(); } H.group.updateMatrixWorld(true); }
const m2w=v=>H.group.localToWorld(v.clone()), w2m=v=>H.group.worldToLocal(v.clone());
function bonePosM(n){ return w2m(H.B[n].getWorldPosition(new V3())); }
function setRotM(n,qModel){ // give a bone this orientation in model space
  const b=H.B[n], qp=b.parent.getWorldQuaternion(new Q4()), qg=H.group.getWorldQuaternion(new Q4()); b.quaternion.copy(qp.invert().multiply(qg).multiply(qModel)); b.updateMatrixWorld(true); }
function setHand(s,qModel,maxDeg=25){ const qg=H.group.getWorldQuaternion(new Q4()), qe=qg.clone().invert().multiply(H.B["elbow_"+s].getWorldQuaternion(new Q4())), ang=qe.angleTo(qModel)*180/Math.PI;
  setRotM("hand_"+s,ang>maxDeg?qe.clone().slerp(qModel,maxDeg/ang):qModel); }
function aimM(n,child,dirModel){ // point a bone so its child lies along dirModel
  const b=H.B[n], qp=b.parent.getWorldQuaternion(new Q4()), qg=H.group.getWorldQuaternion(new Q4()); const d=dirModel.clone().applyQuaternion(qg).applyQuaternion(qp.invert()).normalize();
  b.quaternion.setFromUnitVectors(H.bind[child].clone().normalize(),d); b.updateMatrixWorld(true); }
// two-bone IK: the shoulder stays where the body put it; the wrist goes to the target; the elbow bends toward the pole
function armIK(s,target,pole,stretch=0){ const S=bonePosM("shoulder_"+s), a0=H.bind["elbow_"+s].length(), b0=H.bind["hand_"+s].length();
  const kS=stretch?clamp(target.distanceTo(S)/(a0+b0)*1.03,1,1+stretch):1; if(kS>1){ H.B["elbow_"+s].position.copy(H.bind["elbow_"+s]).multiplyScalar(kS); H.B["hand_"+s].position.copy(H.bind["hand_"+s]).multiplyScalar(kS); }
  const a=a0*kS, b=b0*kS;
  const d0=target.clone().sub(S), L=d0.length(), d=clamp(L,0.05,a+b-1e-3), dir=d0.normalize(); const cosA=clamp((a*a+d*d-b*b)/(2*a*d),-1,1), sinA=Math.sqrt(1-cosA*cosA);
  let E; for(let it=0,py=0;it<6;it++,py+=0.35){ const pl=pole.clone().add(new V3(0,py,0)); const p=pl.addScaledVector(dir,-pl.dot(dir)).normalize(); E=S.clone().addScaledVector(dir,a*cosA).addScaledVector(p,a*sinA); if(E.y>=0.3) break; }   // low elbows, but never through the floor
  aimM("shoulder_"+s,"elbow_"+s,E.clone().sub(S)); aimM("elbow_"+s,"hand_"+s,S.clone().addScaledVector(dir,d).sub(E)); return L<=a+b; }
// fingers: + curls them under (dig in, or close on something); - splays them up
function curl(s,k,jit=0,first=0.6){ for(let i=0;i<4;i++){ const d=H.bind[`finger_${s}${i}_1`].clone().setY(0).normalize(), ax=UP.clone().cross(d).normalize();
    for(let q=0;q<3;q++){ const b=H.B[`finger_${s}${i}_${q}`]; b.quaternion.setFromAxisAngle(ax,(q===0?first:1)*k*(1+0.06*i)+jit*Math.sin(performance.now()/40+i*2+q)); } } }
function fingerLen(s){ return 3*H.bind[`finger_${s}1_1`].length(); }
// ---------------------------------------------------------------- the skin: a heartbeat in the torso, and swellings that ache, quiver and jump around under it
const lumps=[]; for(let i=0;i<8;i++) lumps.push({z:-1.8-Math.random()*4.6,a:(Math.random()-.5)*2.6,r:0.32+Math.random()*0.22,amp:0,tg:0.05,t:Math.random()*1.5,jz:0,ja:0,vz:0});
function skin(t,dt,ctx){ const g=H.mesh.geometry, P=g.attributes.position, C=g.attributes.color, B=H.base, idx=H.bodyIdx, D=H.bodyDir, Z=H.bodyZ, A=H.bodyA;
  const hr=ctx.heart||1.0, ph=(t*hr)%1, beat=Math.exp(-Math.pow((ph-0.08)/0.05,2))+0.6*Math.exp(-Math.pow((ph-0.3)/0.06,2));   // lub-dub
  const pulse=0.022*beat*(ctx.pulseK||1);
  for(const L of lumps){ L.t-=dt*(ctx.frantic?2.6:1);
    if(L.t<=0){ L.jz=clamp(L.z+(Math.random()-.5)*1.6,-6.4,-1.6); L.ja=clamp(L.a+(Math.random()-.5)*1.6,-1.5,1.5); L.tg=(0.09+Math.random()*0.12)*(ctx.lumpK||1); L.t=0.6+Math.random()*1.4; L.jump=0.12; }
    if(L.jump>0){ L.jump-=dt; L.z+=(L.jz-L.z)*Math.min(1,dt*22); L.a+=(L.ja-L.a)*Math.min(1,dt*22); L.amp*=0.9; }   // it jumps: a quick dart to a new place, flattening as it goes
    else { L.amp+=(L.tg-L.amp)*Math.min(1,dt*1.6); L.z+=0.12*dt; }                                                  // it aches: swelling slowly, creeping forward
    L.z+=(ctx.slosh||0)*dt; L.z=clamp(L.z,-6.6,-1.4); }                                                              // and every surge of the body throws them back
  const qv=0.012*(ctx.frantic?2.5:1);
  for(let k=0;k<idx.length;k++){ const i=idx[k], z=Z[k], a=A[k]; let s=pulse*(0.6+0.4*Math.sin(z*1.3-t*3*hr)), bruise=0;
    for(const L of lumps){ const dz=z-L.z, da=wrap(a-L.a)*0.7, e=Math.exp(-(dz*dz+da*da)/(L.r*L.r)); if(e<0.01) continue; const h=e*(L.amp+qv*Math.sin(t*37+L.r*50)); s+=h; bruise+=e*L.amp*6; }
    s*=H.bodyW[k]; P.setXYZ(i,B[3*i]+D[3*k]*s,B[3*i+1]+D[3*k+1]*s,B[3*i+2]); bruise*=H.bodyW[k]; const c=1-Math.min(0.55,bruise*0.8), r_=Math.min(1,bruise); C.setXYZ(i,c*(1-0.05*r_),c*(1-0.35*r_),c*(1-0.25*r_)); }
  P.needsUpdate=true; C.needsUpdate=true; g.computeVertexNormals(); }

// ---------------------------------------------------------------- the palms: where each tongue lives. The right palm has the eye (yellow iris, a cross
// for a pupil); the left has a lipped slit. Both are always there, closed under lids of the Hob's skin, and open only when the tongue is used.
const palm={};
function setupPalms(){ resetBones(); const g=H.mesh.geometry, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, bones=H.mesh.skeleton.bones;
  for(const s of ["L","R"]){ const hi=bones.indexOf(H.B["hand_"+s]); let n=0, cx=0, cz=0, lo=1e9; const pts=[];
    for(let i=0;i<SI.count;i++){ let w=0; for(let k=0;k<4;k++){ if([SI.getX(i),SI.getY(i),SI.getZ(i),SI.getW(i)][k]===hi) w+=[SW.getX(i),SW.getY(i),SW.getZ(i),SW.getW(i)][k]; } if(w>0.95){ cx+=H.base[3*i]; cz+=H.base[3*i+2]; lo=Math.min(lo,H.base[3*i+1]); n++; pts.push(i); } }
    const wr=bonePosM("hand_"+s), off=new V3(cx/n-wr.x,lo-wr.y,cz/n-wr.z);   // the palm's underside, from the wrist, in the hand's own frame
    // the back of the hand: the highest skin above the middle of the palm
    let top=-1e9; for(const i of pts){ const dx=H.base[3*i]-cx/n, dz=H.base[3*i+2]-cz/n; if(dx*dx+dz*dz<0.12*0.12) top=Math.max(top,H.base[3*i+1]); }
    const back=new V3(cx/n-wr.x,top-wr.y,cz/n-0.08-wr.z);
    const sock=new THREE.Group(); sock.position.copy(back).add(new V3(0,-0.035,0)); sock.rotation.x=-Math.PI/2; H.B["hand_"+s].add(sock);   // facing up out of the back of the hand
    const ball=new THREE.Mesh(new THREE.SphereGeometry(0.09,22,16),s==="R"?new THREE.MeshLambertMaterial({map:eyeTex}):new THREE.MeshLambertMaterial({color:0x2a0807})); sock.add(ball);
    const rim=new THREE.Mesh(new THREE.TorusGeometry(0.095,0.03,8,24),lidMat); sock.add(rim);
    const mk=(top)=>{ const gg=new THREE.Group(); const m=new THREE.Mesh(new THREE.SphereGeometry(0.099,22,10,0,Math.PI*2,top?0:Math.PI/2,Math.PI/2),lidMat); m.rotation.x=Math.PI/2; if(s==="L") gg.scale.set(1,0.55,1); gg.add(m); sock.add(gg); return gg; };
    palm[s]={off,back,sock,ball,up:mk(true),lo:mk(false),open:1,look:new V3()}; } }
// the lids stay parted round the tongue; the eye on the right hand looks about on its own
function updatePalm(s,E,dt){ const p=palm[s]; p.open=1; p.up.rotation.x=-1.1; p.lo.rotation.x=1.1;
  if(s==="R"){ const tgt=(E&&E.at)||p.sock.localToWorld(new V3(Math.sin(performance.now()/1300)*0.6,0.3*Math.sin(performance.now()/900),1)); p.look.lerp(tgt,Math.min(1,dt*4)); p.ball.lookAt(p.look); } }
function palmOut(s){ const p=palm[s]; const b=p.sock.getWorldPosition(new V3()), d=new V3(0,0,1).applyQuaternion(p.sock.getWorldQuaternion(new Q4())); return {p:b.addScaledVector(d,0.05),d}; }
// the tongue, always fully out: up out of the back of the hand, over the knuckles, then hanging off the outer edge under its own weight, writhing slowly
function tonguePath(s,t){ const sd=s==="R"?1:-1, h=H.B["hand_"+s], b=palm[s].back, L=(v)=>h.localToWorld(v.clone());
  const p1=L(b.clone().add(new V3(0,0.16,0.05))), p2=L(b.clone().add(new V3(sd*0.12,0.14,0.24))), edge=L(b.clone().add(new V3(sd*0.3,0.02,0.3)));
  const down=new V3(0,-1,0), out=L(b.clone().add(new V3(sd*0.6,0,0.3))).sub(edge).setY(0).normalize(), w=Math.sin(t*1.7+sd)*0.06, w2=Math.cos(t*1.3+sd*2)*0.05;
  const p4=edge.clone().addScaledVector(out,0.08+w).addScaledVector(down,0.22), p5=p4.clone().addScaledVector(out,0.05+w2).addScaledVector(down,0.22).add(new V3(w2,0,w));
  for(const p of [p4,p5]) p.y=Math.max(0.03,p.y);   // a planted hand's tongue lies on the floor
  return [p1,p2,edge,p4,p5]; }
function palmPointM(s){ H.group.updateMatrixWorld(true); return w2m(H.B["hand_"+s].localToWorld(palm[s].off.clone())); }
// ---------------------------------------------------------------- the crawl: the hands drag everything
const HAND={L:{x:-1.38,front:-0.15,back:-1.35,y:0.33},R:{x:1.32,front:1.0,back:-0.2,y:0.4}}, STRIDE=1.2;
const haul=u=>0.5-0.5*Math.cos(Math.PI*Math.pow(sat(u),0.8));
function crawl(t,dt,ctx,T,I){ // I: 0 slow .. 1 frantic
  const h=T/2, cyc=t/h, k=Math.floor(cyc), u=cyc-k, pull=k%2===0?"R":"L", reach=pull==="R"?"L":"R";
  const X=ctx.x0+STRIDE*(k+haul(u)); const v=(X-(ctx.X??X))/Math.max(1e-4,dt); ctx.acc=(v-(ctx.v??v))/Math.max(1e-4,dt); ctx.v=v; ctx.X=X;
  const sgn=pull==="R"?1:-1, sw=Math.sin(Math.PI*u);
  // the body: shoulders hauled up a little and toward the pulling side; the torso sags and lags behind in a wave; the tail end drags
  H.B.root.position.add(new V3(0.04*sgn*sw,(0.06+0.06*I)*sw,0)); H.B.root.quaternion.copy(qE(-0.05*sw*(1+I),0.05*sgn*sw,0.07*sgn*sw));
  const w=s=>Math.sin(2*Math.PI*(cyc/2)-s); H.B.spine1.quaternion.copy(qE(0.04*w(0.8)*(1+I),0.05*Math.sin(Math.PI*cyc-0.7),0.03*w(1.1)));
  H.B.spine2.quaternion.copy(qE(0.05*w(1.6)*(1+I),0.06*Math.sin(Math.PI*cyc-1.4),0.03*w(1.9))); H.B.spine3.quaternion.copy(qE(0.05*w(2.4)*(1+I),0.06*Math.sin(Math.PI*cyc-2.1),0));
  // back legs trail: dragged, the feet scraping, bumping at every surge
  for(const s of ["L","R"]){ const sd=s==="R"?1:-1; H.B["leg_"+s].quaternion.copy(qE(0.05+0.08*I*Math.max(0,Math.sin(2*Math.PI*cyc+sd)),0.08*sd+0.06*Math.sin(Math.PI*cyc+sd),0)); H.B["foot_"+s].quaternion.copy(qE(-0.06+0.05*Math.sin(2*Math.PI*cyc+sd*2),0,0)); }
  // the face: level, heaving slightly with each pull, a slight turn toward the hauling hand
  H.B.head.quaternion.copy(qE(-0.04*sw*(1+I)+0.012*Math.sin(t*13)*I,0.04*sgn*sw,0.03*sgn*sw)); H.B.jaw.quaternion.copy(qE(0,0,0));
  H.group.updateMatrixWorld(true);
  // hands: the pulling one is planted (its place on the floor fixed while the body slides up to it); the other swings ahead and slams down
  const P=HAND[pull], R=HAND[reach];
  armIK(pull,new V3(P.x,P.y,P.front-STRIDE*haul(u)),new V3(sgn*1.4,-0.35,0)); setHand(pull,qE(0.05,0,0)); curl(pull,0.06+0.04*I,0.02*I);
  const lift=(0.55-0.15*I)*Math.sin(Math.PI*u), rz=R.back+STRIDE*(u<0.85?ss(u/0.85):1), rsg=-sgn;
  armIK(reach,new V3(R.x+0.25*rsg*Math.sin(Math.PI*u),R.y+lift,rz),new V3(rsg*1.4,-0.35,0)); setHand(reach,qE(-0.45*Math.sin(Math.PI*u),0.1*rsg*Math.sin(Math.PI*u),0)); curl(reach,-0.25*Math.sin(Math.PI*u)+0.06*sat((u-0.85)/0.15));
  // impacts: the slam of each hand, dust under the dragged belly and legs
  if(k!==ctx.lastK){ ctx.lastK=k; const p=m2w(new V3(P.x,0.02,P.front+0.5)); dust(p,0.7+0.5*I,4+Math.round(4*I)); debris(p,3+Math.round(4*I),0.6+0.4*I); shake=Math.max(shake,0.05+0.1*I); cue(I>0.5?"slam":"fingers dig into the boards"); ctx.dig=1; }
  if(Math.random()<dt*(6+14*I)*sat(Math.abs(v)/2)){ const p=m2w(new V3((Math.random()-.5)*1.2,0.02,-2-Math.random()*6)); dust(p,0.6+0.4*I,1); }
  ctx.slosh=-clamp(ctx.acc,-12,12)*0.06; ctx.phase=`${pull==="R"?"right":"left"} hand hauls · ${reach==="R"?"right":"left"} reaches`;
  return X; }

// ---------------------------------------------------------------- the animations
const A={};
A.crawl={ name:"Crawl", len:14, start(ctx){ ctx.x0=-4; ctx.heart=1.0; },
  step(t,dt,ctx){ const X=crawl(t,dt,ctx,2.8,0); H.group.position.x=X; ctx.sp=`${(STRIDE/1.4).toFixed(1)} m/s`; } };
A.fast={ name:"Fast crawl", len:7.5, start(ctx){ ctx.x0=-9; ctx.heart=1.9; ctx.lumpK=1.4; },
  step(t,dt,ctx){ const X=crawl(t,dt,ctx,1.0,1); H.group.position.x=X; ctx.sp=`${(STRIDE/0.5).toFixed(1)} m/s`; ctx.frantic=true; } };
A.screech={ name:"Screech", len:6, start(ctx){ ctx.heart=1.2; H.group.position.x=0; },
  step(t,dt,ctx){ const tense=ss(t/0.7)*(1-ss((t-4.2)/0.9)), rear=ss((t-0.7)/0.45)*(1-ss((t-3.6)/0.9)), scream=t>1.1&&t<3.5;
    ctx.lumpK=1+0.7*tense; ctx.pulseK=1+1.5*tense; ctx.heart=1.2+1.4*tense; ctx.frantic=scream;
    const n=s=>Math.sin(t*s)*Math.sin(t*s*0.37+1);
    H.B.root.position.add(new V3(0,0.42*rear-0.05*tense*(1-rear),-0.15*rear)); H.B.root.quaternion.copy(qE(-0.32*rear+0.04*tense*(1-rear),0,scream?0.02*n(31):0));
    H.B.spine1.quaternion.copy(qE(0.12*rear,0,0)); H.B.spine2.quaternion.copy(qE(0.1*rear,0,0)); H.B.spine3.quaternion.copy(qE(0.05*rear,0,0));
    H.B.head.quaternion.copy(qE(0.14*tense*(1-rear)-0.5*rear+(scream?0.05*n(43):0),scream?0.06*n(29):0,scream?0.05*n(37):0)); H.B.jaw.quaternion.copy(qE(0.85*rear+(scream?0.07*Math.sin(t*47):0),0,0));
    for(const s of ["L","R"]){ const sd=s==="R"?1:-1; H.B["leg_"+s].quaternion.copy(qE(-0.06*rear,0.1*sd*tense,0)); }
    H.group.updateMatrixWorld(true);
    for(const s of ["L","R"]){ const P=HAND[s], sd=s==="R"?1:-1; armIK(s,new V3(P.x,P.y,(P.front+P.back)/2+0.3),new V3(sd*1.4,-0.35,0)); setHand(s,qE(0,0,0)); curl(s,0.06+0.06*tense,scream?0.03:0); }
    if(scream){ if(!ctx.c){ ctx.c=1; camPunch(0.7); shake=0.3; } const mp=m2w(new V3(0,0.05,1.3)); if(Math.random()<dt*9) dust(mp,1.0,2); shake=Math.max(shake,0.12); }
    ctx.phase=t<0.7?"tenses · the swellings bulge":t<1.1?"rears up onto straight arms":scream?"screams · the mouth tears open":"settles back down"; } };
// sound made visible: a ring travelling out from the mouth
function soundRing_unused(p){ const m=new THREE.Mesh(new THREE.RingGeometry(0.92,1,48),new THREE.MeshBasicMaterial({color:0xe8c77a,transparent:true,opacity:0.5,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})); m.position.copy(p); m.lookAt(cam.position); scene.add(m); fx.push({m,t:0,life:0.8,ring:true,r:6}); }
function idleBody(t,ctx,lunge,yaw,lean){ H.B.root.position.add(new V3(0,0.12*lunge,0.9*lunge)); H.B.root.quaternion.copy(qE(-0.08*lunge,yaw*0.5,0)); H.B.spine1.quaternion.copy(qE(0.06*lunge,-yaw*0.3,0));
  H.B.head.quaternion.copy(qE(lean,yaw,0)); for(const s of ["L","R"]) H.B["leg_"+s].quaternion.copy(qE(0.02,0.05*(s==="R"?1:-1),0)); H.group.updateMatrixWorld(true); }
function restHand(s,k=-0.24){ const P=HAND[s], sd=s==="R"?1:-1; armIK(s,new V3(P.x,P.y,(P.front+P.back)/2+0.3),new V3(sd*1.4,-0.35,0)); setHand(s,qE(0,0,0)); curl(s,0.1+k*0.3); }
// a hand turned so its palm faces direction n (toward her) and its fingers run along t, round her
function handQ(n,t){ const y=n.clone().negate().normalize(), z=t.clone().sub(y.clone().multiplyScalar(t.dot(y))).normalize(), x=y.clone().cross(z); return new Q4().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,z)); }
const HER_R=0.18;
function armIKPalm(s,P,toward,pole,stretch=0,faceM=null){ const S=bonePosM("shoulder_"+s), a0=H.bind["elbow_"+s].length(), hb=H.bind["hand_"+s], off=palm[s].off;
  let k=1; if(stretch){ const need=P.distanceTo(S)*1.02, full=a0+hb.clone().add(off).length(); if(need>full){ k=clamp((need-off.length())/(a0+hb.length()),1,1+stretch); H.B["elbow_"+s].position.copy(H.bind["elbow_"+s]).multiplyScalar(k); H.B["hand_"+s].position.copy(hb).multiplyScalar(k); } }
  const v0=hb.clone().multiplyScalar(k).add(off), a=a0*k, b=v0.length();
  const d0=P.clone().sub(S), L=d0.length(), d=clamp(L,0.05,a+b-1e-3), dir=d0.normalize(); const cosA=clamp((a*a+d*d-b*b)/(2*a*d),-1,1), sinA=Math.sqrt(1-cosA*cosA);
  let E; for(let it=0,py=0;it<6;it++,py+=0.35){ const pl=pole.clone().add(new V3(0,py,0)); const p=pl.addScaledVector(dir,-pl.dot(dir)).normalize(); E=S.clone().addScaledVector(dir,a*cosA).addScaledVector(p,a*sinA); if(E.y>=0.3) break; }
  aimM("shoulder_"+s,"elbow_"+s,E.clone().sub(S));
  if(faceM && s==="R" && crossBind){ // roll the upper arm about its own length so the brand on it turns toward faceM
    const axis=E.clone().sub(S).normalize(), qg=H.group.getWorldQuaternion(new Q4()), qm=qg.clone().invert().multiply(H.B.shoulder_R.getWorldQuaternion(new Q4()));
    const axb=crossBind.E.clone().sub(crossBind.S).normalize(), nb=crossBind.P.clone().sub(crossBind.S); nb.addScaledVector(axb,-nb.dot(axb)).normalize();
    const nc=nb.applyQuaternion(qm); nc.addScaledVector(axis,-nc.dot(axis)).normalize(); const d=faceM.clone().sub(E); d.addScaledVector(axis,-d.dot(axis)).normalize();
    const th=Math.atan2(axis.dot(nc.clone().cross(d)),nc.dot(d)); setRotM("shoulder_R",new Q4().setFromAxisAngle(axis,th).multiply(qm)); }
  // the forearm and hand as one piece: its palm point goes to P, rolled so the palm faces 'toward' as nearly as the roll allows
  const f1=S.clone().addScaledVector(dir,d).sub(E).normalize(); let f2=toward.clone().addScaledVector(f1,-toward.dot(f1)); if(f2.lengthSq()<1e-5) f2=new V3(0,-1,0).addScaledVector(f1,f1.y); f2.normalize();
  const e1=v0.clone().normalize(), n0=new V3(0,-1,0), e2=n0.addScaledVector(e1,-n0.dot(e1)).normalize();
  const Mf=new THREE.Matrix4().makeBasis(f1,f2,f1.clone().cross(f2)), Me=new THREE.Matrix4().makeBasis(e1,e2,e1.clone().cross(e2));
  setRotM("elbow_"+s,new Q4().setFromRotationMatrix(Mf.multiply(Me.transpose()))); H.B["hand_"+s].quaternion.identity(); H.B["hand_"+s].updateMatrixWorld(true); }
function settleHand(s,wrist,qUsed,n,tSide,pole,stretch,turn=0.6){ armIK(s,wrist,pole,stretch);
  const f=bonePosM("hand_"+s).sub(bonePosM("elbow_"+s)).normalize(); let z=f.clone().addScaledVector(n,-f.dot(n)); if(z.lengthSq()<1e-4) z=tSide.clone(); z.normalize();
  let side=tSide.clone().addScaledVector(n,-tSide.dot(n)); side.addScaledVector(z,-side.dot(z)); side=side.lengthSq()>1e-4?side.normalize():z.clone();
  const zz=z.multiplyScalar(Math.cos(turn)).addScaledVector(side,Math.sin(turn)).normalize(), qN=handQ(n,zz), off=palm[s].off;
  armIK(s,wrist.clone().add(off.clone().applyQuaternion(qUsed)).sub(off.clone().applyQuaternion(qN)),pole,stretch); return qN; }   // her waist, as the hand wraps it
// One grab: notice her, the arm extends, the tongue lashes the short distance and hooks her, yanks her onto the palm, the fingers wrap right round
// her body, then the hand carries her (beside the face, or to the mouth) and drops her.
function grab(t,dt,ctx,s,cfg){ const sd=s==="R"?1:-1, other=s==="R"?"L":"R";
  const lunge=cfg.lunge*ss((t-0.6)/0.4)*(1-ss((t-5.4)/1.2)), yaw=cfg.yaw*ss((t-0.1)/0.5)*(1-ss((t-5.8)/1)), lean=cfg.lean*ss((t-2.6)/0.8)*(1-ss((t-5.4)/0.8));
  idleBody(t,ctx,lunge,yaw,lean); H.B.jaw.quaternion.copy(qE(cfg.jaw*ss((t-cfg.jawAt)/0.8)*(1-ss((t-5.0)/0.5)),0,0)); restHand(other);
  const C0=cfg.her.clone().add(new V3(0,1.0,0)), S=bonePosM("shoulder_"+s);
  const n0=C0.clone().sub(S).setY(0).normalize(), nC=cfg.nCarry.clone().normalize();
  const tOf=n=>UP.clone().cross(n).multiplyScalar(cfg.tSign).normalize();
  const carry=ss((t-1.9)/1.2), n=n0.clone().lerp(nC,carry).normalize(), tt=tOf(n), q=handQ(n,tt), off=palm[s].off;
  const wristFor=(C,gap)=>C.clone().addScaledVector(n,-(HER_R+gap)).sub(off.clone().applyQuaternion(q));
  const rest=new V3(HAND[s].x,HAND[s].y+0.3,(HAND[s].front+HAND[s].back)/2+0.3);
  const CC=cfg.carryTo; let wrist, her={m:cfg.her.clone(),pose:"stand"}, E={open:0}, tg=null, phase;
  const wrapK=Math.min(1.25,fingerLen(s)/(3*(HER_R+0.05))), wrap=(k,j=0)=>curl(s,k,j,k>0?1:0.6);
  if(t<0.6){ wrist=rest.clone().lerp(rest.clone().add(new V3(0,0.25,0.2)),ss(t/0.6)); setHand(s,qE(-0.2*ss(t/0.6),0,0)); curl(s,-0.15); phase="it turns to her"; }
  else if(t<1.9){ const u=ss((t-0.6)/0.4); wrist=rest.clone().lerp(wristFor(C0,0.62),u); setHand(s,new Q4().slerp(q,u)); phase=t<1.0?"the arm extends":"";
    E={open:sat((t-0.75)/0.2)*(1-sat((t-1.85)/0.15)),at:C0.clone(),snap:t>0.95};
    // the tongue: lash (1.0-1.18), hook round her waist (1.18-1.32), then yank her onto the palm (1.32-1.7); the fingers close round her as she arrives
    const yank=easeIn(sat((t-1.32)/0.38)); let C=C0.clone();
    if(t>=1.32){ const attach=palmPointM(s).addScaledVector(n,HER_R); C=C0.clone().lerp(attach,yank); her={m:C.clone().add(new V3(0,-1.0,0)),pose:yank<1?"dragged":"held",k:yank}; if(yank<1&&Math.random()<dt*20) dust(m2w(her.m),0.4,1); }
    const front=C.clone().addScaledVector(n,-HER_R), hook=[front,C.clone().addScaledVector(n,-HER_R*0.7).addScaledVector(tt,HER_R*0.7),C.clone().addScaledVector(tt,HER_R)];
    if(t>=1.0 && t<1.95){ const k=t<1.18?easeOut((t-1.0)/0.18):t<1.7?1:1-sat((t-1.7)/0.25); tg={pts:t<1.18?[front]:hook,k,wig:t<1.18?0.15:0.35}; if(t<1.18) streak(m2w(front),1.5); }
    wrap(t<1.55?-0.3:-0.3+(wrapK+0.3)*ss((t-1.55)/0.3),t>1.6?0.02:0);
    if(!ctx.c1&&t>1.18){ ctx.c1=1; shake=0.12; hitStop(0.05); }
    phase=phase||(t<1.18?"the tongue lashes out":t<1.32?"hooks her waist":t<1.7?"yanks her onto the palm":"the fingers wrap right round her"); }
  if(t>=1.9 && t<5.2){ const C=C0.clone().lerp(CC,carry); wrist=wristFor(C,0); setHand(s,q); wrap(wrapK,0.015); phase=t<3.1?cfg.carryPhase:cfg.holdPhase; }
  if(t>=5.2){ const u=ss((t-5.3)/1.2); wrist=wristFor(CC,0).lerp(rest,u); setHand(s,q.clone().slerp(new Q4(),u)); wrap(wrapK*(1-sat((t-5.2)/0.25))-0.2*sat((t-5.2)/0.25)); phase="lets her drop"; }
  const qHand=t<0.6?qE(-0.2*ss(t/0.6),0,0):t<1.9?new Q4().slerp(q,ss((t-0.6)/0.4)):t<5.2?q:q.clone().slerp(new Q4(),ss((t-5.3)/1.2));
  armIK(s,wrist,new V3(sd*1.4,-0.35,0)); setHand(s,qHand);   // the arm first, then the hand's own turn on the end of it
  // once caught she is part of the hand: her waist sits against the actual palm, wherever the arm managed to put it
  if(t>=1.7 && t<5.2){ const attach=palmPointM(s).addScaledVector(n,HER_R); her={m:attach.add(new V3(0,-1.0,0)),pose:"held"}; }
  if(t>=5.2){ const f=t-5.2; if(!ctx.dropY){ const a=palmPointM(s).addScaledVector(n,HER_R); ctx.dropY=a.y-1.0; ctx.dropM=a.add(new V3(0,-1.0,0)); } const y=Math.max(0,ctx.dropY-4.9*f*f); her={m:new V3(ctx.dropM.x,y,ctx.dropM.z),pose:"fall",k:sat(f/0.55)}; }
  ctx.her=her; ctx.palm={[s]:E}; if(tg) ctx.tongues={[s]:tg}; ctx.phase=phase; }
// The squeeze grab (no tongue): the arm reaches out with the hand open, the palm presses into her and the fingers snap shut right round her,
// it lifts her a little off the floor and squeezes down hard three times, the arm trembling, then lets her drop.
function squeeze(t,dt,ctx,s,cfg){ const sd=s==="R"?1:-1, other=s==="R"?"L":"R";
  const lunge=cfg.lunge*ss((t-0.45)/0.5)*(1-ss((t-4.6)/1.2)), yaw=cfg.yaw*ss((t-0.1)/0.5)*(1-ss((t-5)/1)), tense=sat((t-1.8)/0.3)*(1-sat((t-4.2)/0.2));
  idleBody(t,ctx,lunge,yaw,0.06*tense); H.B.jaw.quaternion.copy(qE(0,0,0)); restHand(other);
  const C0=cfg.her.clone().add(new V3(0,1.0,0)), S=bonePosM("shoulder_"+s), n=C0.clone().sub(S).setY(0).normalize(), tt=UP.clone().cross(n).multiplyScalar(cfg.tSign).normalize(), q=handQ(n,tt), off=palm[s].off;
  const wristFor=(C,gap)=>C.clone().addScaledVector(n,-(HER_R+gap)).sub(off.clone().applyQuaternion(q));
  const rest=new V3(HAND[s].x,HAND[s].y+0.3,(HAND[s].front+HAND[s].back)/2+0.3), wrapK=Math.min(1.25,fingerLen(s)/(3*(HER_R+0.05))), wrap=(k,j=0)=>curl(s,k,j,k>0?1:0.6);
  // three hard squeezes: each one clamps tighter, holds shaking, and eases a little
  const sq=(t>=1.8&&t<4.2)?Math.max(...[1.85,2.65,3.45].map(t0=>{ const u=t-t0; return u<0?0:u<0.12?u/0.12:u<0.45?1:Math.max(0,1-(u-0.45)/0.25); })):0;
  const Cup=C0.clone().add(new V3(0,0.45,0)).addScaledVector(n,-0.25);   // lifted a little and drawn back toward the body
  let wrist, qHand, her={m:cfg.her.clone(),pose:"stand"}, phase;
  if(t<0.45){ wrist=rest.clone().lerp(rest.clone().add(new V3(0,0.25,0.2)),ss(t/0.45)); qHand=qE(-0.2*ss(t/0.45),0,0); wrap(-0.15); phase="it turns to her"; }
  else if(t<1.1){ const u=ss((t-0.45)/0.65); wrist=rest.clone().lerp(wristFor(C0,0.05),u); qHand=new Q4().slerp(q,u); wrap(-0.15-0.25*u); phase="the arm reaches out, hand open"; if(u>0.3&&u<0.9) streak(m2w(palmPointM(s)),1.6); }
  else if(t<4.2){ const lift=ss((t-1.35)/0.45), C=C0.clone().lerp(Cup,lift); const tr=0.012*tense*(1+2*sq);
    wrist=wristFor(C,0).add(new V3(Math.sin(t*61)*tr,Math.sin(t*47+1)*tr,Math.sin(t*53+2)*tr)); qHand=q;
    const close=ss((t-1.1)/0.18); wrap(-0.4+(wrapK+0.4)*close+0.22*sq,0.01+0.02*sq);
    if(!ctx.hit){ ctx.hit=1; shake=0.15; camPunch(0.35); hitStop(0.05); }
    if(sq>0.95&&!ctx["s"+Math.floor(t*1.25)]){ ctx["s"+Math.floor(t*1.25)]=1; shake=Math.max(shake,0.12); hitStop(0.04); }
    phase=t<1.35?"the fingers snap shut round her":t<1.8?"lifts her off the floor":sq>0.5?"squeezes down hard":"squeezes · holds her shaking"; }
  else { const u=ss((t-4.3)/1.2); wrist=wristFor(Cup,0).lerp(rest,u); qHand=q.clone().slerp(new Q4(),u); wrap((wrapK+0.22)*(1-sat((t-4.2)/0.2))-0.2*sat((t-4.2)/0.2)); phase="lets her drop"; }
  armIK(s,wrist,new V3(sd*1.4,-0.35,0)); setHand(s,qHand);
  if(t>=1.1 && t<4.2){ const at=palmPointM(s).addScaledVector(n,HER_R); her={m:at.add(new V3(0,-1.0,0)),pose:"held",squash:sq}; }
  if(t>=4.2){ const f=t-4.2; if(!ctx.dropY){ const a=palmPointM(s).addScaledVector(n,HER_R); ctx.dropY=a.y-1.0; ctx.dropM=a.add(new V3(0,-1.0,0)); } her={m:new V3(ctx.dropM.x,Math.max(0,ctx.dropY-4.9*f*f),ctx.dropM.z),pose:"fall",k:sat(f/0.55)}; }
  ctx.her=her; ctx.phase=phase; }
// The chase grab: Norah walks away ahead; the Hob drags itself after her on ONE hand while the other arm stays stretched out in front, hand open,
// inching closer until the fingers just reach her back. Then it closes on her, stops, lifts her, squeezes down hard three times and drops her.
const VHOB=STRIDE/2.4;   // one-handed: one haul every 2.4 s
function chaseGrab(t,dt,ctx,s,cfg){ const sd=s==="R"?1:-1, cr=s==="R"?"L":"R", cs=-sd, T=2.4, tc=cfg.catchAt;
  // ---- the one-handed crawl, until it has her
  const tm=Math.min(t,tc+0.35), cyc=tm/T, k=Math.floor(cyc), u=cyc-k, hauling=u>=0.5, hu=hauling?(u-0.5)/0.5:0;
  const X=ctx.x0+STRIDE*(k+(hauling?haul(hu):0)); H.group.position.x=X;
  const Xs=ctx.x0+VHOB*t;   // its average progress, which she keeps just ahead of
  const sw=hauling?Math.sin(Math.PI*hu):0, got=t>=tc, sqT=t-tc;
  const reachLean=ss(t/1.2)*(got?1-ss((t-tc-3.3)/1.2):1);
  H.B.root.position.add(new V3(0.05*cs*sw+0.05*sd*reachLean,0.05*sw,0.3*reachLean)); H.B.root.quaternion.copy(qE(-0.05*sw-0.04*reachLean,0.05*cs*sw+0.12*sd*reachLean,0.07*cs*sw+0.05*sd*reachLean));
  const w=p=>Math.sin(2*Math.PI*cyc-p); H.B.spine1.quaternion.copy(qE(0.04*w(0.8),0.06*Math.sin(Math.PI*cyc-0.7),0.03*w(1.1))); H.B.spine2.quaternion.copy(qE(0.05*w(1.6),0.07*Math.sin(Math.PI*cyc-1.4),0.03*w(1.9))); H.B.spine3.quaternion.copy(qE(0.05*w(2.4),0.07*Math.sin(Math.PI*cyc-2.1),0));
  for(const q of ["L","R"]){ const d=q==="R"?1:-1; H.B["leg_"+q].quaternion.copy(qE(0.05,0.08*d+0.06*Math.sin(Math.PI*cyc+d),0)); }
  H.B.head.quaternion.copy(qE(-0.03*sw,0.08*sd*reachLean,0)); H.B.jaw.quaternion.copy(qE(0,0,0)); H.group.updateMatrixWorld(true);
  // the crawling hand: swings ahead, slams down, hauls the whole body up to it; once it has her it stays planted
  const P=HAND[cr];
  if(!got){ if(hauling){ armIK(cr,new V3(P.x,P.y,P.front-STRIDE*haul(hu)),new V3(cs*1.4,-0.35,0)); setHand(cr,qE(0.05,0,0)); curl(cr,0.08); }
    else { const v=u/0.5; armIK(cr,new V3(P.x+0.2*cs*Math.sin(Math.PI*v),P.y+0.5*Math.sin(Math.PI*v),P.back+STRIDE*ss(v)),new V3(cs*1.4,-0.35,0)); setHand(cr,qE(-0.45*Math.sin(Math.PI*v),0,0)); curl(cr,-0.25*Math.sin(Math.PI*v)); }
    if(hauling && k!==ctx.slamK){ ctx.slamK=k; const p=m2w(new V3(P.x,0.02,P.front+0.5)); dust(p,0.7,4); debris(p,3,0.6); shake=Math.max(shake,0.05); }
    if(hauling && Math.random()<dt*8) dust(m2w(new V3((Math.random()-.5)*1.2,0.02,-2-Math.random()*6)),0.5,1); }
  else { const zl=ctx.crZ??(ctx.crZ=hauling?P.front-STRIDE*haul(hu):P.front); armIK(cr,new V3(P.x,P.y,zl),new V3(cs*1.4,-0.35,0)); setHand(cr,qE(0.05,0,0)); curl(cr,0.08+0.06*sat(sqT/0.3)); }
  // ---- Norah, walking away ahead of it and glancing back; she never quite gets clear
  const herWX=Xs+cfg.catchZ+cfg.lead*(1-sat(t/tc)), C0=new V3(cfg.side,1.0,herWX-X);
  const C=got?null:C0;
  // ---- the reaching arm
  const S=bonePosM("shoulder_"+s), aim=(C||ctx.catchC||C0), n=aim.clone().sub(S).setY(0).normalize(), tt=UP.clone().cross(n).multiplyScalar(cfg.tSign).normalize(), q=handQ(n,tt), off=palm[s].off;
  const wristFor=(c,gap)=>c.clone().addScaledVector(n,-(HER_R+gap)).sub(off.clone().applyQuaternion(q));
  const wrapK=Math.min(1.25,fingerLen(s)/(3*(HER_R+0.05))), wrap=(kk,j=0)=>curl(s,kk,j,kk>0?1:0.6);
  const sq=(got&&sqT>=0.75&&sqT<3.1)?Math.max(...[0.8,1.6,2.4].map(t0=>{ const v=sqT-t0; return v<0?0:v<0.12?v/0.12:v<0.45?1:Math.max(0,1-(v-0.45)/0.25); })):0;
  let wrist, qHand=q, her, phase, hk=1;
  if(!got){ const gap=0.9*(1-ss(t/tc))+0.02, ext=ss(t/1.2); const rest=new V3(HAND[s].x,HAND[s].y+0.3,(HAND[s].front+HAND[s].back)/2+0.3);
    wrist=rest.clone().lerp(wristFor(C0,gap),ext).add(new V3(0,0.03*Math.sin(t*2.3),0)); qHand=new Q4().slerp(q,ext); hk=ext; wrap(-0.3+0.08*Math.sin(t*3.1),0.02);
    const ph=ctx.herPh=(ctx.herPh||0)+dt*1.15; her={m:C0.clone().add(new V3(0,-1.0,0)),pose:"walk",ph,look:Math.max(0,Math.sin(t*0.9-0.6))};
    phase=t<1.2?"it drags itself after her · the other arm stretches out":gap>0.3?`one hand crawls · the other reaches for her (${gap.toFixed(1)} m short)`:"the fingertips just reach her back"; }
  else { if(!ctx.catchC){ ctx.catchC=C0.clone(); shake=0.15; camPunch(0.35); hitStop(0.05); }
    const lift=ss((sqT-0.2)/0.45), Cup=ctx.catchC.clone().add(new V3(0,0.4,0)).addScaledVector(n,-0.2), Cc=ctx.catchC.clone().lerp(Cup,lift), tense=sat((sqT-0.7)/0.2)*(1-sat((sqT-3.1)/0.2)), tr=0.012*tense*(1+2*sq);
    if(sqT<3.2){ wrist=wristFor(Cc,0).add(new V3(Math.sin(t*61)*tr,Math.sin(t*47+1)*tr,Math.sin(t*53+2)*tr)); wrap(-0.3+(wrapK+0.3)*ss(sqT/0.18)+0.22*sq,0.01+0.02*sq);
      if(sq>0.95&&!ctx["s"+Math.floor(sqT*1.25)]){ ctx["s"+Math.floor(sqT*1.25)]=1; shake=Math.max(shake,0.12); hitStop(0.04); }
      phase=sqT<0.2?"the fingers snap shut round her":sqT<0.7?"lifts her off the floor":sq>0.5?"squeezes down hard":"squeezes · holds her shaking"; }
    else { const v=ss((sqT-3.3)/1.2), rest=new V3(HAND[s].x,HAND[s].y+0.3,(HAND[s].front+HAND[s].back)/2+0.3); wrist=wristFor(Cup,0).lerp(rest,v); qHand=q.clone().slerp(new Q4(),v); hk=1-v; wrap((wrapK+0.22)*(1-sat((sqT-3.2)/0.2))-0.2*sat((sqT-3.2)/0.2)); phase="lets her drop"; }
  }
  { const qb=new Q4().slerp(q,hk), P=wrist.clone().add(off.clone().applyQuaternion(qb)), tw=new V3(0,-1,0).lerp(n,hk).normalize(); armIKPalm(s,P,tw,new V3(sd*1.4,-0.35,0),0.8); }   /* no wrist bend: the arm brings the palm to her */
  if(got){ if(sqT<3.2){ const at=palmPointM(s).addScaledVector(n,HER_R), from=ctx.catchC.clone(); her={m:from.lerp(at,ss(sqT/0.15)).add(new V3(0,-1.0,0)),pose:"held",squash:sq}; }
    else { const f=sqT-3.2; if(ctx.dropY==null){ const a=palmPointM(s).addScaledVector(n,HER_R); ctx.dropY=a.y-1.0; ctx.dropM=a.add(new V3(0,-1.0,0)); } her={m:new V3(ctx.dropM.x,Math.max(0,ctx.dropY-4.9*f*f),ctx.dropM.z),pose:"fall",k:sat(f/0.55)}; } }
  ctx.her=her; ctx.phase=phase; ctx.sp=got?"":`${VHOB.toFixed(1)} m/s`; ctx.heart=1.3+0.8*(got?1:0); }
A.grabL={ name:"Grab · left hand", len:10.5, start(ctx){ ctx.x0=-6; ctx.heart=1.3; },
  step(t,dt,ctx){ chaseGrab(t,dt,ctx,"L",{side:-1.6,catchZ:1.6,lead:1.3,catchAt:5.4,tSign:-1}); } };
A.grabR={ name:"Grab · right hand", len:10.5, start(ctx){ ctx.x0=-6; ctx.heart=1.3; },
  step(t,dt,ctx){ chaseGrab(t,dt,ctx,"R",{side:1.45,catchZ:2.0,lead:1.3,catchAt:5.4,tSign:1}); } };
const ORDER=["crawl","fast","screech","grabL","grabR","throne"];
// ---------------------------------------------------------------- the back legs rest on the floor: after posing, their lowest points are measured
// and each leg is tipped about the hip until they touch the boards: never through them, never floating
let legProbe=null;
function setupProbes(){ const g=H.mesh.geometry, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, P=g.attributes.position, bones=H.mesh.skeleton.bones, out={L:[],R:[]};
  for(const s of ["L","R"]){ const ids=[bones.indexOf(H.B["leg_"+s]),bones.indexOf(H.B["foot_"+s])], cand=[];
    for(let i=0;i<P.count;i++){ let w=0; for(let k=0;k<4;k++){ const bi=[SI.getX(i),SI.getY(i),SI.getZ(i),SI.getW(i)][k]; if(ids.includes(bi)) w+=[SW.getX(i),SW.getY(i),SW.getZ(i),SW.getW(i)][k]; } if(w>0.3) cand.push([P.getY(i),i]); }
    cand.sort((a,b)=>a[0]-b[0]); out[s]=cand.slice(0,80).map(c=>c[1]); }
  legProbe=out; }
const _pv=new V3();
function lowest(s){ H.mesh.updateMatrixWorld(true); let lo=1e9; for(const i of legProbe[s]){ H.mesh.boneTransform(i,_pv); _pv.applyMatrix4(H.mesh.matrixWorld); if(_pv.y<lo) lo=_pv.y; } return lo; }
function groundLegs(){ if(!legProbe) setupProbes();
  for(const s of ["L","R"]){ const b=H.B["leg_"+s];
    for(let it=0;it<4;it++){ H.group.updateMatrixWorld(true); const lo=lowest(s); if(lo>=0.004 && lo<=0.03) break;
      const d=clamp((0.012-lo)/2.3,-0.15,0.15); b.quaternion.multiply(new Q4().setFromAxisAngle(new V3(1,0,0),d)); b.updateMatrixWorld(true); } } }

// ---------------------------------------------------------------- the cross burnt into its right shoulder: smouldering, smoking; the weak point
let crossG=null, crossLight=null, crossHalo=null;
const emberTex=canvasTex(32,32,(g)=>{ const gr=g.createRadialGradient(16,16,1,16,16,15); gr.addColorStop(0,"rgba(255,230,160,1)"); gr.addColorStop(0.4,"rgba(255,120,30,0.8)"); gr.addColorStop(1,"rgba(160,30,0,0)"); g.fillStyle=gr; g.fillRect(0,0,32,32); });
let crossV=-1;
let crossR=0.06, crossBind=null;
const brandTex=canvasTex(128,160,(g,w,h)=>{ g.clearRect(0,0,w,h); const gr=g.createRadialGradient(w/2,h/2,8,w/2,h/2,70); gr.addColorStop(0,"rgba(40,8,2,0.95)"); gr.addColorStop(0.7,"rgba(70,20,8,0.7)"); gr.addColorStop(1,"rgba(70,20,8,0)"); g.fillStyle=gr; g.fillRect(0,0,w,h);
  g.fillStyle="#ff8a30"; g.fillRect(w/2-9,22,18,116); g.fillRect(w/2-36,52,72,17); g.strokeStyle="rgba(255,220,150,0.9)"; g.lineWidth=3; g.strokeRect(w/2-9,22,18,116); g.strokeRect(w/2-36,52,72,17); });
const glowTex=canvasTex(128,160,(g,w,h)=>{ g.clearRect(0,0,w,h); g.filter="blur(6px)"; g.fillStyle="rgba(255,140,40,1)"; g.fillRect(w/2-14,16,28,128); g.fillRect(w/2-42,46,84,29); });
function wrapGeo(wd,ht,r){ const g=new THREE.PlaneGeometry(wd,ht,12,4), P=g.attributes.position; for(let i=0;i<P.count;i++){ const x=P.getX(i), th=x/r; P.setXYZ(i,r*Math.sin(th),P.getY(i),r*Math.cos(th)-r); } g.computeVertexNormals(); return g; }
function setupCross(){ resetBones(); const g=H.mesh.geometry, SI=g.attributes.skinIndex, SW=g.attributes.skinWeight, bones=H.mesh.skeleton.bones, B=H.base;
  const sh=bones.indexOf(H.B.shoulder_R), el=bones.indexOf(H.B.elbow_R), S=bonePosM("shoulder_R"), W=bonePosM("hand_R"), ax=W.clone().sub(S), L2=ax.lengthSq();
  let best=-1, score=-1e9;
  for(let i=0;i<SI.count;i++){ let w=0; const ix=[SI.getX(i),SI.getY(i),SI.getZ(i),SI.getW(i)], wx=[SW.getX(i),SW.getY(i),SW.getZ(i),SW.getW(i)]; for(let k=0;k<4;k++) if(ix[k]===sh||ix[k]===el) w+=wx[k]; if(w<0.9) continue;
    const p=new V3(B[3*i],B[3*i+1],B[3*i+2]), tt=p.clone().sub(S).dot(ax)/L2; if(tt<0.4||tt>0.5) continue; const onAxis=S.clone().addScaledVector(ax,tt); if(p.distanceTo(onAxis)>0.15) continue;   /* on the arm's own skin */
    const sc=p.y+0.6*p.x; if(sc>score){ score=sc; best=i; } }
  crossV=best; crossBind={P:new V3(B[3*best],B[3*best+1],B[3*best+2]),S:S.clone(),E:bonePosM("elbow_R")}; { const p=new V3(B[3*best],B[3*best+1],B[3*best+2]), c=S.clone().addScaledVector(ax.clone().normalize(),p.clone().sub(S).dot(ax.clone().normalize())); crossR=p.distanceTo(c); }
  crossG=new THREE.Group(); scene.add(crossG); const r=crossR+0.004, wd=Math.min(0.2,crossR*2.4), ht=0.3;
  const brand=new THREE.Mesh(wrapGeo(wd,ht,r),new THREE.MeshBasicMaterial({map:brandTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4})); crossG.add(brand);
  crossHalo=new THREE.Mesh(wrapGeo(wd*1.15,ht*1.1,r+0.003),new THREE.MeshBasicMaterial({map:glowTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0.6})); crossG.add(crossHalo);
  crossLight=new THREE.PointLight(0xff6a20,0.9,3.5,2); crossLight.position.z=0.2; crossG.add(crossLight); }
const _cp=new V3();
function placeCross(){ if(crossV<0) return; H.mesh.updateMatrixWorld(true); H.mesh.boneTransform(crossV,_cp); _cp.applyMatrix4(H.mesh.matrixWorld);
  const S=H.B.shoulder_R.getWorldPosition(new V3()), E=H.B.elbow_R.getWorldPosition(new V3()), ax=E.clone().sub(S).normalize();
  const c=S.clone().addScaledVector(ax,_cp.clone().sub(S).dot(ax)), nrm=_cp.clone().sub(c).normalize(), y=ax.clone().addScaledVector(nrm,-ax.dot(nrm)).normalize(), x=y.clone().cross(nrm);
  crossG.position.copy(_cp).addScaledVector(nrm,0.003); crossG.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,nrm)); }   /* on the skin: the arm's axis plus its own radius */
function crossWorld(){ return crossG.getWorldPosition(new V3()); }
function stepCross(t,dt,flare){ const f=(0.85+0.15*Math.sin(t*17)+0.08*Math.sin(t*41))*(1+flare); crossHalo.material.opacity=Math.min(1,0.45*f); crossLight.intensity=0.9*f;
  if(Math.random()<dt*4) { const p=crossWorld(); const m=new THREE.Sprite(new THREE.SpriteMaterial({map:dustTex,transparent:true,depthWrite:false,color:0x9a9088})); m.position.copy(p); m.scale.setScalar(0.08); scene.add(m); fx.push({m,t:0,life:1.6,o:0.35,v:new V3((Math.random()-.5)*0.1,0.35,(Math.random()-.5)*0.1),g:-0.05,grow:1.3,drag:0.6}); } }
function embers(p,n,spd){ for(let i=0;i<n;i++){ const m=new THREE.Sprite(new THREE.SpriteMaterial({map:emberTex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending})); m.position.copy(p); m.scale.setScalar(0.04+Math.random()*0.05); scene.add(m); fx.push({m,t:0,life:0.6+Math.random()*0.8,o:1,v:new V3((Math.random()-.5)*spd,Math.random()*spd*0.9,(Math.random()-.5)*spd),g:3,drag:1.5}); } }
// ---------------------------------------------------------------- Norah's revolver, for the escape
const gun=new THREE.Group(); { const m=new THREE.MeshLambertMaterial({color:0x2a2a2c}); const b=new THREE.Mesh(new THREE.BoxGeometry(0.025,0.03,0.16),m); b.position.z=0.07; const c=new THREE.Mesh(new THREE.CylinderGeometry(0.022,0.022,0.045,8),m); c.rotation.x=Math.PI/2; const gp=new THREE.Mesh(new THREE.BoxGeometry(0.024,0.08,0.03),new THREE.MeshLambertMaterial({color:0x4a3022})); gp.position.set(0,-0.05,-0.03); gp.rotation.x=-0.3; gun.add(b,c,gp); } gun.visible=false; scene.add(gun);
function fireAt(to,flesh){ const mz=gun.localToWorld(new V3(0,0.01,0.17)), d=to.clone().sub(mz), L=d.length();
  const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.008,0.008,1,4),new THREE.MeshBasicMaterial({color:0xffe0a0,transparent:true,opacity:0.9,blending:THREE.AdditiveBlending,depthWrite:false})); tr.position.copy(mz).addScaledVector(d,0.5); tr.quaternion.setFromUnitVectors(UP,d.clone().normalize()); tr.scale.y=L; scene.add(tr); fx.push({m:tr,t:0,life:0.07,o:0.9,v:new V3(),g:0});
  streak(mz,2.2); embers(mz,4,1.2); if(!flesh) embers(to,34,2.8); shake=Math.max(shake,0.1); hitStop(0.05); }

// ---------------------------------------------------------------- THRONE GRAB: a lunge on both arms, a crash onto its belly, both hands on her; she must shoot the shoulder cross twice
A.throne={ name:"Throne grab", len:12, start(ctx){ ctx.x0=-8; ctx.heart=1.6; ctx.shots=0; ctx.route=escapeRoute(); hideEyeWounds(); },
  step(t,dt,ctx){ const tPush=1.7, tLaunch=2.0, tLand=2.62, tStill=3.5, tDraw=4.4, shot1=6.0, shot2=6.8;
    let X; ctx.flare=0;
    if(t<tPush){ X=crawl(t,dt,ctx,1.4,0.5); ctx.Xp=X; ctx.vx=STRIDE/0.7; ctx.phase="crawls at her"; }
    else { // from here the body moves under its own momentum: the shove, the flight, the crash and the skid
      if(ctx.Xc==null){ ctx.Xc=ctx.Xp; } let a=0; if(t>=tLaunch&&t<tLaunch+0.12) a=55; else if(t>=tLand) a=-14;   // the shove; then the floor's friction
      ctx.vx=Math.max(0,ctx.vx+a*dt); if(t<tLaunch) ctx.vx=Math.max(0.3,ctx.vx-dt*6); ctx.Xc+=ctx.vx*dt; X=ctx.Xc; }
    H.group.position.x=X;
    const air=t>=tLaunch&&t<tLand?(t-tLaunch)/(tLand-tLaunch):0, hop=0.75*4*air*(1-air), flat=ss((t-tLand)/0.18)*(1-ss((t-10.4)/1.0)), load=t>=tPush&&t<tLaunch?ss((t-tPush)/(tLaunch-tPush)):0;
    if(t>=tPush){ // the body: loads down, flies up and forward nose-high, then slams flat on its belly
      H.B.root.position.add(new V3(0,-0.18*load+hop-0.34*flat,0.25*hop)); H.B.root.quaternion.copy(qE(0.08*load-0.18*Math.sin(Math.PI*air)+0.04*flat,0,0));
      H.B.spine1.quaternion.copy(qE(0.08*Math.sin(Math.PI*air)-0.03*flat,0,0)); H.B.spine2.quaternion.copy(qE(0.1*Math.sin(Math.PI*air)-0.02*flat,0,0)); H.B.spine3.quaternion.copy(qE(0.06*Math.sin(Math.PI*air),0,0));
      for(const q of ["L","R"]) H.B["leg_"+q].quaternion.copy(qE(0.25*Math.sin(Math.PI*air),0.08*(q==="R"?1:-1),0));
      // the head: up, looking at her the whole time; jaw slack while it draws her in, wide for the scream when the cross is hit
      const look=-0.28*flat-0.1*Math.sin(Math.PI*air), draw=ss((t-tDraw)/3.6)*(t<shot2?1:1-ss((t-shot2)/0.6));
      const hit=t>=shot2?Math.exp(-(t-shot2)*1.4):0; H.B.head.quaternion.copy(qE(look+0.1*draw-0.25*hit+(t>=shot1&&t<shot1+0.3?-0.08*Math.sin((t-shot1)*30):0),0.06*Math.sin(t*0.7)*flat*(1-draw),0));
      H.B.jaw.quaternion.copy(qE(0.2*draw+0.75*hit,0,0)); H.group.updateMatrixWorld(true); }
    if(t>=tLand && !ctx.crash){ ctx.crash=1; const p=m2w(new V3(0,0.02,-2.5)); slamLine(m2w(new V3(0,0.02,1)),m2w(new V3(0,0.02,-6)),1.6); dust(p,1.6,14); shake=0.6; camPunch(0.8); hitStop(0.1); }
    if(t>=tLand && ctx.vx>0.2 && Math.random()<dt*30) dust(m2w(new V3((Math.random()-.5)*1.4,0.02,-1-Math.random()*6)),0.9,2);
    // Norah: stands her ground ahead, backs off as it comes, is caught as it crashes down
    const herW0=ctx.x0+STRIDE*(tPush/0.7)+6.3, herSide=0;
    if(t>=tPush){
      const S={L:bonePosM("shoulder_L"),R:bonePosM("shoulder_R")};
      let herM;   // her waist, in the Hob's own space
      if(ctx.caught==null && t>=tLand-0.06) ctx.caught=t;
      if(ctx.caught==null) herM=new V3(herSide,1.0,herW0+0.5*(t-tPush)-X);
      else { const u=t-ctx.caught; const hold=new V3(0,1.5,2.35); /* centred in front of the face */  const base=ctx.catchM||(ctx.catchM=new V3(herSide,1.0,herW0+0.5*(ctx.caught-tPush)-X));
        const toMouth=new V3(0,1.2,1.75), draw=ss((t-tDraw)/3.6)*(t<shot2?1:0); /* drawn toward the mouth */  herM=base.clone().lerp(hold,ss(u/0.25)).lerp(toMouth,draw); ctx.drawM=herM.clone(); }
      // both arms: thrown forward in flight, reaching for her; on the crash they close on her from both sides, stretching as far as they need
      const reachK=ss((t-tLaunch)/0.25);
      for(const s of ["L","R"]){ const sd=s==="R"?1:-1, n=new V3(-sd,0,0.18).normalize(), tt=new V3(0,0,1), q=handQ(n,tt), off=palm[s].off;
        const C=herM.clone().add(new V3(0,s==="R"?-0.08:-0.22,0)),   /* both at her waist and hips: her chest, arms and sight stay free for the shots */  wristHold=C.clone().addScaledVector(n,-HER_R).sub(off.clone().applyQuaternion(q));
        let wrist, qh, wk=Math.min(1.25,fingerLen(s)/(3*(HER_R+0.05)));
        if(t<tLaunch){ const P=HAND[s]; wrist=new V3(P.x*0.9,P.y+0.05,P.front-0.1-0.6*load); qh=qE(0.05,0,0); curl(s,0.08+0.1*load,0,0.6); }   // both hands planted, pressing
        else if(ctx.caught==null || t<ctx.caught+0.12){ const P=HAND[s]; const out=new V3(P.x*0.9,P.y+0.05,P.front-0.7).lerp(wristHold.clone().add(new V3(sd*0.6,0.35,0.4)),reachK); wrist=out; qh=new Q4().slerp(q,reachK); ctx.hk=reachK; curl(s,-0.35*reachK,0,0.6); }
        else { const close=ss((t-ctx.caught-0.12)/0.15), spasm=t>=shot2?ss((t-shot2)/0.15):0, out=wristHold.clone().add(new V3(sd*0.35*spasm,0.2*spasm,-0.3*ss((t-shot2-0.3)/1.2)));
          wrist=out.add(new V3(0,0,0)); qh=q; ctx.hk=1; curl(s,(-0.35+(wk+0.35)*close)*(1-spasm)-0.35*spasm,t>=shot1&&t<shot2?0.02:0,1); }
        const wide=new V3(sd*1.7,0.35,0.6);   /* elbows swung wide, so each arm passes outside the head */
        if(t<tLaunch){ armIK(s,wrist,wide,1.0); setHand(s,qh); } else { const hk=ctx.hk??1, qb=new Q4().slerp(q,hk), P=wrist.clone().add(off.clone().applyQuaternion(qb)), tw=new V3(0,-1,0).lerp(n,hk).normalize(); armIKPalm(s,P,tw,wide,1.0,ctx.caught!=null?herM.clone().add(new V3(0,0.65,0)):null); } }   /* while it holds her, the branded arm turns its cross toward her face */
      // her: caught she's part of the hands; the shots; then she drops and scrambles clear
      if(ctx.caught==null) ctx.her={m:herM.clone().add(new V3(0,-1.0,0)),pose:"backstep",ph:t*0.8};
      else if(t<shot2+0.15){ const shooting=t>shot1-0.7, eyes=ctx.route==="eyes", tgt=()=>eyes?faceEyeWorld(ctx.shots<1?"R":"L"):crossWorld();
        ctx.her={m:herM.clone().add(new V3(0,-1.0,0)),pose:"held",faceIt:true,aim:shooting?tgt():null};
        const hit=(k)=>{ const p=tgt(); if(eyes){ const s2=k===1?"R":"L"; fireAt(p,true); blood(p,26,2.6); blood(p,10,1.2,0.1); faceEye[s2].wound.visible=true; } else { fireAt(p); ctx.flare=1; } };
        if(t>=shot1&&ctx.shots<1){ hit(1); ctx.shots=1; } if(t>=shot2&&ctx.shots<2){ hit(2); ctx.shots=2; shake=0.35; camPunch(0.6); } }
      else { const f=t-shot2-0.15; if(ctx.dropY==null){ ctx.dropY=Math.max(0,ctx.drawM.y-1.0); ctx.dropM=ctx.drawM.clone().add(new V3(0,-1.0,0)); }
        const y=Math.max(0,ctx.dropY-4.9*f*f), away=ss((f-0.6)/1.6)*1.8; ctx.her={m:new V3(ctx.dropM.x,y,ctx.dropM.z+0.5+away),pose:f<0.6?"fall":"scramble",faceIt:true,k:sat(f/0.4),ph:f}; }
      if(ctx.route!=="eyes"){ if(t>=shot1&&t<shot1+0.4) ctx.flare=1.5*(1-(t-shot1)/0.4); if(t>=shot2&&t<shot2+0.8) ctx.flare=2.5*(1-(t-shot2)/0.8); }
      ctx.phase=ctx.caught==null?(t<tLaunch?"both hands plant · it loads":t<tLand?"shoves off · flies at her, arms reaching":"crashes down"):
        t<tStill?"both hands close on her as it slams flat":t<tDraw?"lies flat, holding still, head up, looking at her":t<shot1?`draws her toward the mouth · ${ctx.route==="eyes"?"SHOOT ITS EYES":"SHOOT THE CROSS ON ITS RIGHT ARM"} (0 / 2)`:t<shot2?`draws her toward the mouth · ${ctx.route==="eyes"?"ONE EYE BURST · SHOOT THE OTHER":"SHOOT THE CROSS ON ITS RIGHT ARM"} (1 / 2)`:t<shot2+0.15?(ctx.route==="eyes"?"both eyes burst (2 / 2)":"cross hit (2 / 2)"):"it spasms and lets go · she scrambles clear";
      ctx.sp=ctx.caught==null?`${ctx.vx.toFixed(1)} m/s`:""; }
    else { ctx.her={m:new V3(herSide,0,herW0+0-X),pose:"stand"}; }
  } };

// ---------------------------------------------------------------- the face's eyes: the other way out of the throne grab
const faceEye={L:{v:-1,wound:null},R:{v:-1,wound:null}};
function setupFaceEyes(){ resetBones(); const B=H.base, n=B.length/3, hb=bonePosM("head");
  for(const s of ["L","R"]){ const tx=(s==="L"?-1:1)*0.25; let best=-1, bz=-1e9;
    for(let i=0;i<n;i++){ if(Math.abs(B[3*i]-tx)<0.07 && Math.abs(B[3*i+1]-1.73)<0.07 && B[3*i+2]>bz){ bz=B[3*i+2]; best=i; } }
    faceEye[s].v=best; const p=new V3(B[3*best],B[3*best+1],B[3*best+2]).sub(hb);
    const w=new THREE.Group(); w.position.copy(p).add(new V3(0,0,0.012)); w.visible=false; H.B.head.add(w);
    w.add(new THREE.Mesh(new THREE.CircleGeometry(0.13,18),new THREE.MeshBasicMaterial({color:0x1a0303})));
    const rim=new THREE.Mesh(new THREE.RingGeometry(0.11,0.17,18),new THREE.MeshBasicMaterial({color:0x6a0a08,transparent:true,opacity:0.85,depthWrite:false})); rim.position.z=0.002; w.add(rim);
    faceEye[s].wound=w; } }
const _fe=new V3();
function faceEyeWorld(s){ H.mesh.updateMatrixWorld(true); H.mesh.boneTransform(faceEye[s].v,_fe); return _fe.applyMatrix4(H.mesh.matrixWorld).clone(); }
function hideEyeWounds(){ for(const s of ["L","R"]) if(faceEye[s].wound) faceEye[s].wound.visible=false; }
let escapeAlt=false;
function escapeRoute(){ const el=document.getElementById("oEscape"), v=el?el.value:"alt"; if(v!=="alt") return v; escapeAlt=!escapeAlt; return escapeAlt?"cross":"eyes"; }
