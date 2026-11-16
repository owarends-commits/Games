// ---------------------------------------------------------------- scene: a plain floor marked in metres
const canvas=document.getElementById("c");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true}); renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
const scene=new THREE.Scene(); scene.background=new THREE.Color(0x0e0d0c); scene.fog=new THREE.Fog(0x0e0d0c,16,36);
const cam=new THREE.PerspectiveCamera(38,1,0.05,100);
scene.add(new THREE.HemisphereLight(0xd8dce6,0x2a2218,0.8));
const sun=new THREE.DirectionalLight(0xfff0dd,0.7); sun.position.set(-3,7,5); scene.add(sun);
function canvasTex(w,h,draw,rep){ const c=document.createElement("canvas"); c.width=w; c.height=h; draw(c.getContext("2d"),w,h); const t=new THREE.CanvasTexture(c); if(rep){ t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rep[0],rep[1]); } return t; }
(function(){ const t=canvasTex(256,256,(g)=>{ g.fillStyle="#2a2724"; g.fillRect(0,0,256,256); for(let i=0;i<900;i++){ g.fillStyle=`rgba(${Math.random()<.5?0:255},${Math.random()<.5?0:255},${Math.random()<.5?0:255},0.035)`; g.fillRect(Math.random()*256,Math.random()*256,2,2); } g.strokeStyle="rgba(255,255,255,0.07)"; g.lineWidth=2; g.strokeRect(0,0,256,256); },[90,40]);
  const fl=new THREE.Mesh(new THREE.PlaneGeometry(90,40),new THREE.MeshLambertMaterial({map:t})); fl.rotation.x=-Math.PI/2; scene.add(fl);
  for(let x=-9;x<=7;x++){ const m=new THREE.Mesh(new THREE.PlaneGeometry(0.03,x%5===0?0.7:0.35),new THREE.MeshBasicMaterial({color:x%5===0?0xd8723a:0x6a6158})); m.rotation.x=-Math.PI/2; m.position.set(x,0.003,1.6); scene.add(m);
    if(x%5===0){ const lt=canvasTex(64,32,g=>{ g.fillStyle="#d8723a"; g.font="20px monospace"; g.fillText(x+" m",4,22); }); const s=new THREE.Mesh(new THREE.PlaneGeometry(0.6,0.3),new THREE.MeshBasicMaterial({map:lt,transparent:true})); s.rotation.x=-Math.PI/2; s.position.set(x+0.3,0.004,2.1); scene.add(s); } } })();
function blob(){ const c=document.createElement("canvas"); c.width=c.height=64; const g=c.getContext("2d"); const gr=g.createRadialGradient(32,32,2,32,32,30); gr.addColorStop(0,"rgba(0,0,0,0.55)"); gr.addColorStop(1,"rgba(0,0,0,0)"); g.fillStyle=gr; g.fillRect(0,0,64,64);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(1,1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=0.005; scene.add(m); return m; }
