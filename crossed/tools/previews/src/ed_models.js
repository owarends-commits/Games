// ================================================================ the editor shows the creatures as they are
// The preview-body creatures (and the Runner and Tactician) are drawn in the editor with their real models, not as an
// ACROSS person. The model loads in the background; until then a dim outline of its size stands in.
const ED_GROUP={runner:"bcross/runner",tactician:"bcross/tactician"};
function edCreatureKind(k){ k=String(k).split("@")[0]; return !!(PVK[k]||ED_GROUP[k]); }
let ED_HOB=null;
function edCreature(k,o){ const forced=String(k).split("@")[1]; k=String(k).split("@")[0]; const g=new THREE.Group(), K=PVK[k];
  const ph=new THREE.Mesh(k==="hob"?new THREE.BoxGeometry(3.0,1.4,7):new THREE.CylinderGeometry(0.3,0.3,1.7,10),new THREE.MeshBasicMaterial({color:0xd8b040,wireframe:true,transparent:true,opacity:0.35}));
  ph.position.set(0,k==="hob"?0.7:0.85,k==="hob"?-2.6:0); g.add(ph);
  const put=sc=>{ g.remove(ph); g.add(sc); };
  if(k==="hob"){ (ED_HOB||(ED_HOB=new Promise((res,rej)=>new THREE.GLTFLoader().load("m/bosses/hob/hob_rigged.json",res,undefined,rej)))).then(gl=>put(THREE.SkeletonUtils.clone(gl.scene))).catch(()=>{}); return g; }
  const pool=forced&&MODEL_LIB[forced]?[forced]:Object.keys(MODEL_LIB).filter(m=>MODEL_LIB[m].g===(K?K.group:ED_GROUP[k])&&(!K||!K.only||K.only(m))); if(!pool.length) return g;
  const key=pool[((((o&&o.x)||0)*1000+((o&&o.z)||0)*37)|0)%pool.length<0?0:((((o&&o.x)||0)*1000+((o&&o.z)||0)*37)|0)%pool.length];
  mdlLoad(key).then(()=>{ const c=mdlClone(key); if(c) put(c.scene); }).catch(()=>{});
  return g; }
// every BCROSS model, and the creature type that plays it
function bcrossType(key){ const g=(MODEL_LIB[key]||{}).g||""; if(g==="bcross/runner") return "runner"; if(g==="bcross/tactician") return "tactician"; if(g==="bcross/contortionist") return "contortionist";
  if(g==="bcross/reacher") return /f01$/.test(key)?"splithead":/(m02|f02)$/.test(key)?"reacher_arm":"reacher"; if(g==="bcross/brute") return (typeof BRUTE_TYPE==="function"&&BRUTE_TYPE(key))||(key==="louis_brute"?"brute":null); return null; }
const BCROSS_NAMES={runner:"Runner",tactician:"Tactician",contortionist:"Contortionist",reacher:"Reacher (neck)",reacher_arm:"Reacher (arms)",splithead:"Split-head Reacher",brute:"Louis"};
function bcrossModelList(){ return Object.keys(MODEL_LIB).filter(k=>(MODEL_LIB[k].g||"").startsWith("bcross/")&&bcrossType(k)).map(k=>[k,`${(typeof BRUTE_NAMES!=="undefined"&&BRUTE_NAMES[bcrossType(k)])||BCROSS_NAMES[bcrossType(k)]||bcrossType(k)} · ${k}${MODEL_LIB[k].end?" (endgame)":""}`]); }
function spawnBcross(key,x,z,opts={}){ const t=bcrossType(key); if(!t){ log(`No creature plays ${key} yet`,"#ff7070"); return null; } return spawn(t,x,z,Object.assign({},opts,{mdl:key})); }
// "type@model" (the editor's per-model entries) names the exact model
// an unknown kind never turns silently into an ACROSS
{ const sp0=spawn; spawn=function(type,x,z,opts){ if(typeof type==="string"&&type.includes("@")){ const [t,m]=type.split("@"); opts=Object.assign({},opts||{},{mdl:m}); type=t; } if(typeof type==="string"&&!PVK[type]&&!["across","brute","dummy","runner","tactician"].includes(type)&&!/^across/.test(type)){ log(`Unknown enemy "${type}"`,"#ff7070"); return null; } const e=sp0(type,x,z,opts); if(e&&!(opts&&opts.aware==="unaware")){ const L={x:player.pos.x,z:player.pos.z}; if(e.kind==="runner"||e.kind==="tactician") e.lastKnown=e.lastKnown||L; if(e.pvMem&&!e.pvMem.last) e.pvMem.last=L; } return e; }; }   /* a hunting one knows where she is to start with */
