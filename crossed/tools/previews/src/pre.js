// ================================================================ sandbox: shared state the combat engine reads
// MODE is "build" (the map builder) or "play" (Norah in the map). The engine below only runs its game logic in play.
let MODE = "build";
let REC = null;            // when set, the arena builders record map objects instead of building them
let QUIET_SPAWN = false;
const edPrefs = (()=>{ try{ return Object.assign({pixel:false, fog:false, work:true, grid:true}, JSON.parse(localStorage.getItem("crossed_sandbox_prefs")||"{}")); }catch(e){ return {pixel:false, fog:false, work:true, grid:true}; } })();
function savePrefs(){ try{ localStorage.setItem("crossed_sandbox_prefs", JSON.stringify(edPrefs)); }catch(e){} }
function ED_RES(){ return edPrefs.pixel ? 400 : 1600; }
const hexStr = c => typeof c==="number" ? "#"+c.toString(16).padStart(6,"0") : (c||"#888888");
const hexNum = c => typeof c==="number" ? c : parseInt(String(c||"#888888").replace("#",""),16);

// height of the ground under a point: a raised floor if one covers it, otherwise the terrain, otherwise 0
function groundY(x,z){
  if(!world) return 0;
  let best=null;
  for(const f of world.floorRects){ if(x>=f.x0&&x<=f.x1&&z>=f.z0&&z<=f.z1){ if(best===null||f.y>best) best=f.y; } }
  if(best!==null) return best;
  const T=world.terrain; if(!T) return 0;
  const fx=(x-T.x0)/T.cell, fz=(z-T.z0)/T.cell;
  if(fx<0||fz<0||fx>T.nx-1||fz>T.nz-1) return 0;
  const i=Math.min(T.nx-2,Math.floor(fx)), j=Math.min(T.nz-2,Math.floor(fz)), u=fx-i, v=fz-j, H=T.h, n=T.nx;
  const a=H[j*n+i], b=H[j*n+i+1], c=H[(j+1)*n+i], d=H[(j+1)*n+i+1];
  return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;
}
