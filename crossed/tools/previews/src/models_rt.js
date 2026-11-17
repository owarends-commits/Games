// ================================================================ the low-poly character models (photo-textured GLBs from the repo)
// Each GLB has the shared 16-bone skeleton. The engine's own procedural rig still does all the posing (it's what the AI,
// hit reactions and limb loss drive); it's hidden, and every frame the model's bones are turned to match it.
const MDL = { ready:{}, loading:{}, failed:{}, live:new Set() };
const MDL_EPS = 1e-4;
function mdlInfo(key){ return MODEL_LIB[key]||null; }
function mdlLoad(key){
  const I=mdlInfo(key); if(!I) return Promise.reject(new Error("no model "+key));
  if(MDL.ready[key]) return Promise.resolve(MDL.ready[key]);
  if(MDL.loading[key]) return MDL.loading[key];
  if(!THREE.GLTFLoader) return Promise.reject(new Error("GLTFLoader missing"));
  MDL.loading[key]=new Promise((res,rej)=>{ new THREE.GLTFLoader().load(I.f, g=>{
      g.scene.traverse(o=>{ if(o.isMesh){ const m=o.material, map=m.map; if(map){ map.encoding=THREE.LinearEncoding; map.anisotropy=1; }
        o.material=new THREE.MeshLambertMaterial({map, color:0xffffff, side:THREE.DoubleSide, skinning:!!o.isSkinnedMesh}); o.frustumCulled=false; o.castShadow=false; } });
      MDL.ready[key]=g; res(g); }, undefined, e=>{ MDL.failed[key]=String(e&&e.message||e); delete MDL.loading[key]; rej(e); }); });
  return MDL.loading[key];
}
function mdlPreload(keys){ return Promise.all([...new Set(keys.filter(k=>mdlInfo(k)))].map(k=>mdlLoad(k).catch(()=>null))); }
function mdlClone(key){ const g=MDL.ready[key]; if(!g) return null; const sc=THREE.SkeletonUtils.clone(g.scene); const B={};
  sc.traverse(o=>{ if(o.isBone) B[o.name]=o; if(o.isSkinnedMesh) o.frustumCulled=false; }); return {scene:sc, B, clips:g.animations}; }

// which model each body uses
const MDL_POOLS = {
  men:k=>MODEL_LIB[k].g==="across/men", women:k=>MODEL_LIB[k].g==="across/women", imposing:k=>MODEL_LIB[k].g==="across/imposing", uncanny:k=>MODEL_LIB[k].g==="across/uncanny" };
const MDL_POOL_OPTS = [["mixed","Men and women"],["men","Men"],["women","Women"],["imposing","Imposing (bigger, extra hits)"],["all","All ACROSS incl. imposing"],["uncanny","Uncanny faces (look test)"],["off","Old procedural body"]];
function mdlPool(name){ const ks=Object.keys(MODEL_LIB).filter(k=>MODEL_LIB[k].hip && !MODEL_LIB[k].end);
  if(name==="mixed") return ks.filter(k=>MDL_POOLS.men(k)||MDL_POOLS.women(k));
  if(name==="all") return ks.filter(k=>MDL_POOLS.men(k)||MDL_POOLS.women(k)||MDL_POOLS.imposing(k));
  if(MDL_POOLS[name]) return ks.filter(MDL_POOLS[name]); return []; }
function mdlSim(){ return (typeof SIM!=="undefined"&&SIM.models)||{}; }
function mdlOn(){ return mdlSim().on!==false; }
function pickModel(what){
  if(!mdlOn()) return null; const M=mdlSim();
  if(what==="norah") return mdlInfo(M.norah||"norah")?(M.norah||"norah"):"norah";
  if(what==="louis") return mdlInfo(M.louis||"louis_brute")?(M.louis||"louis_brute"):"louis_brute";
  const pool=mdlPool((M.pools||{})[what]||MDL_DEFAULT_POOL[what]||"mixed"); if(!pool.length) return null;
  return pool[Math.floor(Math.random()*pool.length)];
}
const MDL_DEFAULT_POOL={walker:"all", crawler:"mixed", matron:"women", mourner:"men"};
function mdlPoolKeys(){ const M=mdlSim(), out=[]; if(!mdlOn()) return out; out.push(pickModel("norah"), pickModel("louis"));
  for(const v of ["walker","crawler","matron","mourner","runner","tactician"]) out.push(...mdlPool((M.pools||{})[v]||MDL_DEFAULT_POOL[v])); return out; }

// the bone map: GLB bone ← procedural joint. "ori" copies the joint's world orientation; "dir" points the bone
// (whose rest axis runs toward its child) along a direction taken from the procedural rig.
const AX={L:new THREE.Vector3(1,0,0), R:new THREE.Vector3(-1,0,0), D:new THREE.Vector3(0,-1,0)};
function mdlMap(P, person){
  const m=[["hips","ori",P.hips]];
  if(person){ m.push(["chest","ori",P.chest],["neck","ori",P.neck],["head","ori",P.head]);
    for(const s of ["L","R"]) m.push(["upperarm_"+s,"pts",P["arm"+s],P["elbow"+s],AX[s],"arm"+s],["forearm_"+s,"pts",P["elbow"+s],P["wrist"+s],AX[s],"arm"+s],["hand_"+s,"axis",P["wrist"+s],AX.D,AX[s],"arm"+s]);
    for(const s of ["L","R"]) m.push(["thigh_"+s,"pts",P["leg"+s],P["knee"+s],AX.D,"leg"+s],["shin_"+s,"pts",P["knee"+s],P["ankle"+s],AX.D,"leg"+s],["foot_"+s,"ori",P["ankle"+s],null,null,"leg"+s]); }
  else { m.push(["chest","ori",P.torso],["neck","ori",P.neck],["head","ori",P.neck]);
    for(const s of ["L","R"]) m.push(...(P["elbow"+s] ? [["upperarm_"+s,"pts",P["arm"+s],P["elbow"+s],AX[s],"arm"+s],["forearm_"+s,"pts",P["elbow"+s],P["wrist"+s],AX[s],"arm"+s],["hand_"+s,"axis",P["wrist"+s],AX.D,AX[s],"arm"+s]]
        : [["upperarm_"+s,"axis",P["arm"+s],AX.D,AX[s],"arm"+s],["forearm_"+s,"axis",P["arm"+s],AX.D,AX[s],"arm"+s],["hand_"+s,"axis",P["arm"+s],AX.D,AX[s],"arm"+s]]));
    for(const s of ["L","R"]) m.push(["thigh_"+s,"pts",P["leg"+s],P["knee"+s],AX.D,"leg"+s], P["ankle"+s]?["shin_"+s,"pts",P["knee"+s],P["ankle"+s],AX.D,"leg"+s]:["shin_"+s,"axis",P["knee"+s],AX.D,AX.D,"leg"+s],["foot_"+s,"ori",P["ankle"+s]||P["knee"+s],null,null,"leg"+s]); }
  return m;
}
// fit the hidden rig to the model: scale it so its hips sit at the model's hip height, at the model's true size
function mdlFit(root, procHip, key, height){
  const I=mdlInfo(key); const H=height||I.h, ms=H/I.h; const k=(I.hip*ms)/procHip; root.scale.setScalar(k); return {k, ms, H}; }

// attach a model to a body. owner: the Enemy, or null for Norah. Returns the skin record (the model appears once loaded).
function skinBody(root, P, key, opts={}){
  const I=mdlInfo(key); if(!I||!I.hip) return null;
  const S={root, P, key, person:!!opts.person, owner:opts.owner||null, fit:opts.fit, model:null, B:null, map:null, hidden:[], collapsed:{}, on:true};
  const attach=()=>{ if(!S.on||S.model) return; const c=mdlClone(key); if(!c) return;
    S.model=c.scene; S.B=c.B; S.clips=c.clips; if((MODEL_LIB[key]||{}).g==="bcross/tactician") S.model.traverse(o=>{ if(o.isSkinnedMesh) tacBulbFix(o); });   /* close the cracks round its head bulbs */ S.model.scale.setScalar(S.fit.ms/S.fit.k); root.add(S.model);
    S.map=mdlMap(P,S.person).filter(r=>S.B[r[0]] && r[2]);
    // hide the procedural body; keep its hitboxes (they still take the shots) and Norah's gun
    root.traverse(o=>{ if(!o.isMesh || o===P.gun || S.model===o || isUnder(o,S.model)) return;
      if(o.userData.hitbox) return;
      if(o.userData.zone){ o.material=o.material.clone(); o.material.transparent=true; o.material.opacity=0.35; o.material.depthWrite=false; o.material.visible=!!CFG.world.showZones; o.userData.hitbox=true; o.userData.baseCol=o.material.color.getHex(); return; }
      if(o.visible){ o.visible=false; S.hidden.push(o); } });
    if(P.gun && opts.gun){ const hb=S.B.hand_R; P.gun.userData.home={parent:P.gun.parent,pos:P.gun.position.clone(),rot:P.gun.rotation.clone(),scale:P.gun.scale.clone()};
      hb.add(P.gun); const u=1/S.fit.ms; P.gun.position.set(-0.07*u,-0.035*u,0.0); P.gun.rotation.set(0,-Math.PI/2,0); P.gun.scale.setScalar(u); }
    for(const l in (S.owner&&S.owner.lost)||{}) if(S.owner.lost[l]) mdlCollapse(S,l,S.owner.lostSeg&&S.owner.lostSeg[l]);
    MDL.live.add(S); skinSync(S); };
  if(MDL.ready[key]) attach(); else mdlLoad(key).then(attach).catch(()=>{});
  return S;
}
function isUnder(o,top){ while(o){ if(o===top) return true; o=o.parent; } return false; }
function skinDrop(S){ if(!S) return; S.on=false; const g=S.P&&S.P.gun, h=g&&g.userData.home; if(h){ h.parent.add(g); g.position.copy(h.pos); g.rotation.copy(h.rot); g.scale.copy(h.scale); g.userData.home=null; } MDL.live.delete(S); if(S.model&&S.model.parent) S.model.parent.remove(S.model); }

const _q1=new THREE.Quaternion(), _q2=new THREE.Quaternion(), _v1=new THREE.Vector3(), _v2=new THREE.Vector3(), _v3=new THREE.Vector3();
function skinSync(S){
  if(!S.model) return; const B=S.B; S.root.updateMatrixWorld(true);
  const hips=B.hips; S.P.hips.getWorldPosition(_v1); hips.parent.updateWorldMatrix(true,false); hips.parent.worldToLocal(_v1); hips.position.copy(_v1);
  for(const r of S.map){ const [name,kind,src,b,axis,limb]=r, bone=B[name];
    if(limb && S.collapsed[name]) continue;
    bone.parent.getWorldQuaternion(_q1); _q1.invert();
    if(kind==="ori"){ src.getWorldQuaternion(_q2); bone.quaternion.copy(_q1).multiply(_q2); }
    else { if(kind==="pts"){ src.getWorldPosition(_v2); b.getWorldPosition(_v3); _v3.sub(_v2); } else { src.getWorldQuaternion(_q2); _v3.copy(b).applyQuaternion(_q2); }
      if(_v3.lengthSq()<1e-10) continue; _v3.normalize().applyQuaternion(_q1); bone.quaternion.setFromUnitVectors(axis,_v3); }
    bone.updateMatrixWorld(true); }
  if(S.owner && S.person && (S.owner.clipW||0)>0.01 && !S.owner.dead) legsFromClip(S,S.owner);
}
// the model's own clips, sampled per bone (shared by every copy of a model)
MDL.samp={};
function mdlSamplers(key){ if(MDL.samp[key]) return MDL.samp[key]; const g=MDL.ready[key]; if(!g) return null; const out={};
  for(const c of g.animations){ const tr={}; for(const t of c.tracks){ const dot=t.name.lastIndexOf("."), node=t.name.slice(0,dot), prop=t.name.slice(dot+1); if(prop==="quaternion") tr[node]=t.createInterpolant(); } out[c.name]={tr,dur:c.duration}; }
  return MDL.samp[key]=out; }
const _cq=[new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion(),new THREE.Quaternion()];
function clipQ(sm,clip,bone,t,out){ const c=sm[clip], it=c&&c.tr[bone]; if(!it){ out.identity(); return false; } const r=it.evaluate(((t%c.dur)+c.dur)%c.dur); out.set(r[0],r[1],r[2],r[3]); return true; }
function clipBlend(sm,bone,t,run,out){ clipQ(sm,"walk",bone,t,out); if(run>0.01 && sm.run){ clipQ(sm,"run",bone,t,_cq[4]); out.slerp(_cq[4],run); } return out; }
// legs from the walk/run clip, under whatever the procedural hips are doing; blended over the puppet's legs by the clip weight
function legsFromClip(S,o){
  const sm=mdlSamplers(S.key); if(!sm||!sm.walk) return; const B=S.B, w=Math.min(1,o.clipW), t=o.clipT||0, run=o.clipRun||0;
  const hq=clipBlend(sm,"hips",t,run,_cq[0]); S.model.getWorldQuaternion(_cq[1]); _cq[1].multiply(hq);   // an upright clip hips, in the world
  B.hips.getWorldQuaternion(_cq[2]); _cq[2].invert();
  for(const s of ["L","R"]){ if(S.collapsed["thigh_"+s]) continue;
    const th=B["thigh_"+s]; clipBlend(sm,"thigh_"+s,t,run,_cq[3]); _cq[3].premultiply(_cq[1]).premultiply(_cq[2]); th.quaternion.slerp(_cq[3],w*(s==="R"?(o.clipLegR??1):1));
    for(const n of ["shin_"+s,"foot_"+s]){ if(S.collapsed[n]) continue; clipBlend(sm,n,t,run,_cq[3]); B[n].quaternion.slerp(_cq[3],w*(s==="R"?(o.clipLegR??1):1)); }
    th.updateMatrixWorld(true); }
}
function skinSyncAll(){ for(const S of MDL.live){ if(!S.root.parent){ MDL.live.delete(S); continue; } if(S.root.visible!==false) skinSync(S); } }

// limb loss: the model's limb folds away to nothing at the cut, and a copy of just that limb flies off
const LIMB_BONE={armL:["upperarm_L"], armR:["upperarm_R"], legL:["thigh_L","shin_L"], legR:["thigh_R","shin_R"]};
function mdlCollapse(S, limb, seg){
  if(!S||!S.model) return null; const bn=limb.startsWith("leg")&&seg==="lower"?LIMB_BONE[limb][1]:LIMB_BONE[limb][0], bone=S.B[bn]; if(!bone||S.collapsed[bn]) return null;
  // the flying piece: a clone posed like the body, with everything but this limb folded into the hips
  let piece=null; const c=mdlClone(S.key);
  if(c){ c.scene.scale.copy(S.model.scale); c.scene.position.copy(S.model.position); c.scene.quaternion.copy(S.model.quaternion);
    for(const k in S.B){ if(c.B[k]){ c.B[k].position.copy(S.B[k].position); c.B[k].quaternion.copy(S.B[k].quaternion); } }
    let depth=0; for(let o=c.B[bn].parent; o&&o.isBone; o=o.parent) depth++;
    c.B.hips.scale.setScalar(MDL_EPS); c.B[bn].scale.setScalar(1/MDL_EPS);
    piece=c.scene; }
  for(const k of Object.keys(S.B)){ let o=S.B[k]; while(o&&o.isBone){ if(o===bone){ S.collapsed[k]=true; break; } o=o.parent; } }
  bone.scale.setScalar(MDL_EPS); bone.updateMatrixWorld(true);
  return piece;
}

// ---------------------------------------------------------------- bodies
function skinEnemy(e){
  if(!e.mdl) return; const I=mdlInfo(e.mdl); if(!I) return;
  const person=e.kind!=="brute"; const procHip = person ? e.root.userData.person.hipY : 0.95;
  const H = e.kind==="brute" ? CFG.brute.height*I.h/MDL_LOUIS_H() : I.h;
  const fit=mdlFit(e.root, procHip, e.mdl, H); e.scale=fit.k; if(person) e.height=fit.H;
  e.skin=skinBody(e.root, e.P, e.mdl, {person, owner:e, fit});
}
function MDL_LOUIS_H(){ const I=mdlInfo(mdlSim().louis||"louis_brute"); return I?I.h:2.64; }
function skinPlayer(){
  skinDrop(player.skin); player.skin=null; player.root.scale.setScalar(1);
  for(const o of player.hiddenProc||[]) o.visible=true; player.hiddenProc=null;
  const key=pickModel("norah"); if(!key) return; const I=mdlInfo(key); if(!I||!I.hip) return;
  const fit=mdlFit(player.root, 0.95, key, I.h);
  player.skin=skinBody(player.root, player.P, key, {person:false, fit, gun:true});
  if(player.skin) player.hiddenProc=player.skin.hidden;
}
