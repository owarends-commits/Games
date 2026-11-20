// ================================================================ navigation: around walls, furniture, pillars and every other map piece
// A grid over the map (0.25 m), each cell blocked if a body of 0.32 m radius can't stand there (walls, windows, boxes,
// pillars; doorways stay open, closed doors are bashed). A* over it; the next waypoint is the furthest point along the
// path that can be walked to in a straight line. Rebuilt when the map changes or furniture is pushed.
const NAV={cell:0.25, r:0.32, world:null, sig:"", t:0};
function navSig(){ let s=world.boxes.length+":"; for(const d of world.doors) s+=(d.broken?"b":d.ang>0.6?"o":"c"); for(const b of world.boxes) s+=(b.x*10|0)+","+(b.z*10|0)+";"; return s+world.segs.length+":"+world.circles.length; }
function navBuild(){ const B=world.bounds, c=NAV.cell, nx=Math.max(1,Math.ceil((B.x1-B.x0)/c)), nz=Math.max(1,Math.ceil((B.z1-B.z0)/c)), g=new Uint8Array(nx*nz), r=NAV.r;
  // each obstacle marks the cells it covers (its bounding box grown by the body's radius), tested exactly there
  const mark=(x0,z0,x1,z1,hit)=>{ const i0=Math.max(0,Math.floor((x0-r-B.x0)/c)), i1=Math.min(nx-1,Math.floor((x1+r-B.x0)/c)), j0=Math.max(0,Math.floor((z0-r-B.z0)/c)), j1=Math.min(nz-1,Math.floor((z1+r-B.z0)/c));
    for(let j=j0;j<=j1;j++) for(let i=i0;i<=i1;i++){ const k=j*nx+i; if(g[k]) continue; if(hit(B.x0+(i+0.5)*c,B.z0+(j+0.5)*c)) g[k]=1; } };
  const segHit=(s,t)=>(x,z)=>{ const dx=s.bx-s.ax, dz=s.bz-s.az, L2=dx*dx+dz*dz||1e-9, u=Math.max(0,Math.min(1,((x-s.ax)*dx+(z-s.az)*dz)/L2)); return Math.hypot(x-s.ax-dx*u,z-s.az-dz*u)<r+t; };
  for(const s of world.segs){ if(s.win) continue;   /* windows: the enemies that climb go through them (and smash the glass) */ const t=(s.t||0.2)/2; mark(Math.min(s.ax,s.bx)-t,Math.min(s.az,s.bz)-t,Math.max(s.ax,s.bx)+t,Math.max(s.az,s.bz)+t,segHit(s,t)); }
  for(const d of world.doors){ if(d.broken||d.ang<=0.6) continue; const s=doorSeg(d); mark(Math.min(s.ax,s.bx),Math.min(s.az,s.bz),Math.max(s.ax,s.bx),Math.max(s.az,s.bz),segHit(s,0.04)); }
  for(const ci of world.circles) mark(ci.x-ci.r,ci.z-ci.r,ci.x+ci.r,ci.z+ci.r,(x,z)=>Math.hypot(x-ci.x,z-ci.z)<ci.r+r);
  for(const b of world.boxes) mark(b.x0,b.z0,b.x1,b.z1,(x,z)=>{ const qx=Math.max(b.x0,Math.min(b.x1,x)), qz=Math.max(b.z0,Math.min(b.z1,z)); return Math.hypot(x-qx,z-qz)<r; });
  for(let j=0;j<nz;j++) for(let i=0;i<nx;i++){ const x=B.x0+(i+0.5)*c, z=B.z0+(j+0.5)*c; if(x<B.x0+r||x>B.x1-r||z<B.z0+r||z>B.z1-r) g[j*nx+i]=1; }
  const cl=new Uint8Array(nx*nz).fill(255), Q=[]; for(let k=0;k<nx*nz;k++) if(g[k]){ cl[k]=0; Q.push(k); }
  for(let q=0;q<Q.length;q++){ const k=Q[q], x=k%nx, z=(k/nx)|0; for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){ const X=x+dx, Z=z+dz; if(X<0||Z<0||X>=nx||Z>=nz) continue; const m=Z*nx+X; if(cl[m]>cl[k]+1){ cl[m]=cl[k]+1; Q.push(m); } } }
  NAV.g=g; NAV.cl=cl; NAV.nx=nx; NAV.nz=nz; NAV.x0=B.x0; NAV.z0=B.z0; NAV.world=world; NAV.sig=navSig(); }
function navReady(){ if(NAV.world!==world||!NAV.g){ navBuild(); return; } const now=performance.now(); if(now-NAV.t>700){ NAV.t=now; const s=navSig(); if(s!==NAV.sig) navBuild(); } }
const navCell=(x,z)=>[Math.floor((x-NAV.x0)/NAV.cell),Math.floor((z-NAV.z0)/NAV.cell)];
const navFree=(i,j)=>i>=0&&j>=0&&i<NAV.nx&&j<NAV.nz&&!NAV.g[j*NAV.nx+i];
function navNearestFree(i,j){ if(navFree(i,j)) return [i,j]; for(let R=1;R<10;R++) for(let dj=-R;dj<=R;dj++) for(let di=-R;di<=R;di++){ if(Math.max(Math.abs(di),Math.abs(dj))!==R) continue; if(navFree(i+di,j+dj)) return [i+di,j+dj]; } return null; }
// can a body walk straight from a to b (grid samples every 8 cm)
function navLine(ax,az,bx,bz,w=0.14){ const L0=Math.hypot(bx-ax,bz-az)||1, px=-(bz-az)/L0*w, pz=(bx-ax)/L0*w; if(!navLine1(ax,az,bx,bz)) return false; if(L0<0.45) return true; const sx=ax+(bx-ax)*0.3/L0, sz=az+(bz-az)*0.3/L0; return navLine1(sx+px,sz+pz,bx+px,bz+pz)&&navLine1(sx-px,sz-pz,bx-px,bz-pz); }
function navLine1(ax,az,bx,bz){ const L=Math.hypot(bx-ax,bz-az), n=Math.max(1,Math.ceil(L/0.08)); for(let k=1;k<=n;k++){ const u=k/n, [i,j]=navCell(ax+(bx-ax)*u,az+(bz-az)*u); if(!navFree(i,j)) return false; } return true; }
function navPath(fx,fz,tx,tz){ navReady(); let s=navCell(fx,fz), g=navCell(tx,tz); s=navNearestFree(s[0],s[1]); g=navNearestFree(g[0],g[1]); if(!s||!g) return null;
  const nx=NAV.nx, N=nx*NAV.nz, si=s[1]*nx+s[0], gi=g[1]*nx+g[0]; if(si===gi) return [[tx,tz]];
  const G=new Float32Array(N).fill(1e9), from=new Int32Array(N).fill(-1), closed=new Uint8Array(N), heap=[], h=i=>{ const x=i%nx, z=(i/nx)|0, dx=Math.abs(x-g[0]), dz=Math.abs(z-g[1]); return Math.max(dx,dz)+0.414*Math.min(dx,dz); };
  const push=(i,f)=>{ heap.push([f,i]); let k=heap.length-1; while(k>0){ const p=(k-1)>>1; if(heap[p][0]<=heap[k][0]) break; [heap[p],heap[k]]=[heap[k],heap[p]]; k=p; } };
  const pop=()=>{ const top=heap[0], last=heap.pop(); if(heap.length){ heap[0]=last; let k=0; for(;;){ const a=2*k+1, b=a+1; let m=k; if(a<heap.length&&heap[a][0]<heap[m][0]) m=a; if(b<heap.length&&heap[b][0]<heap[m][0]) m=b; if(m===k) break; [heap[m],heap[k]]=[heap[k],heap[m]]; k=m; } } return top; };
  G[si]=0; push(si,h(si)); let it=0;
  while(heap.length&&it++<40000){ const [,u]=pop(); if(closed[u]) continue; closed[u]=1; if(u===gi) break; const ux=u%nx, uz=(u/nx)|0;
    for(let dz=-1;dz<=1;dz++) for(let dx=-1;dx<=1;dx++){ if(!dx&&!dz) continue; const vx=ux+dx, vz=uz+dz; if(!navFree(vx,vz)) continue; if(dx&&dz&&(!navFree(ux+dx,uz)||!navFree(ux,uz+dz))) continue;
      const v=vz*nx+vx, cv=NAV.cl[v], c=G[u]+(dx&&dz?1.414:1)*(cv<=1?3.0:cv===2?1.6:1); if(c<G[v]){ G[v]=c; from[v]=u; push(v,c+h(v)); } } }
  if(from[gi]<0) return null; const P=[]; for(let k=gi;k!==si&&k>=0;k=from[k]) P.push(k); P.reverse();
  const out=P.map(k=>[NAV.x0+((k%nx)+0.5)*NAV.cell, NAV.z0+(((k/nx)|0)+0.5)*NAV.cell]); out[out.length-1]=[tx,tz]; return out; }
// the playground's route(): the next point to head for (direct when she can be walked to in a straight line)
const routePortals=route;
route=function(fx,fz,tx,tz){ navReady();
  if(navLine(fx,fz,tx,tz)&&wallsClear(fx,fz,tx,tz)) return {x:tx,z:tz,direct:true};
  const P=navPath(fx,fz,tx,tz); if(!P) return routePortals(fx,fz,tx,tz);
  let k=0; for(let q=P.length-1;q>=0;q--){ if(navLine(fx,fz,P[q][0],P[q][1])){ k=q; break; } }
  while(k<P.length-1&&Math.hypot(P[k][0]-fx,P[k][1]-fz)<0.6) k++;   /* never a waypoint at its feet */
  // a closed door on the way: head for the far side of its middle, as the doorway router did (enemies bash or scratch through)
  { let q=[fx,fz]; for(let m=0;m<=k;m++){ const r=P[m]; for(const d of world.doors){ if(d.broken||d.ang>0.6) continue; const sg=doorSeg(d); if(segsCross(q[0],q[1],r[0],r[1],sg.ax,sg.az,sg.bx,sg.bz)){ const mx=(sg.ax+sg.bx)/2, mz=(sg.az+sg.bz)/2, L=Math.hypot(sg.bx-sg.ax,sg.bz-sg.az)||1; let nx=-(sg.bz-sg.az)/L, nz=(sg.bx-sg.ax)/L; if((mx-fx)*nx+(mz-fz)*nz<0){ nx=-nx; nz=-nz; } return {x:mx+nx*0.7,z:mz+nz*0.7,direct:false}; } } q=r; } }
  const w=P[k]; return {x:w[0],z:w[1],direct:k===P.length-1}; };
