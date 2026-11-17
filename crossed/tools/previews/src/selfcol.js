// self-collision: her limbs and the weapon as capsules against her own body; max penetration per clip (metres)
((clips)=>{ window.requestAnimationFrame=()=>0; const V=THREE.Vector3, out={};
 const segDist=(p1,q1,p2,q2)=>{ const d1=q1.clone().sub(p1), d2=q2.clone().sub(p2), r=p1.clone().sub(p2), a=d1.dot(d1), e=d2.dot(d2), f=d2.dot(r); let s,t; if(a<1e-9&&e<1e-9) return p1.distanceTo(p2);
   if(a<1e-9){ s=0; t=Math.min(1,Math.max(0,f/e)); } else { const c=d1.dot(r); if(e<1e-9){ t=0; s=Math.min(1,Math.max(0,-c/a)); } else { const b=d1.dot(d2), den=a*e-b*b; s=den>1e-9?Math.min(1,Math.max(0,(b*f-c*e)/den)):0; t=(b*s+f)/e; if(t<0){ t=0; s=Math.min(1,Math.max(0,-c/a)); } else if(t>1){ t=1; s=Math.min(1,Math.max(0,(b-c)/a)); } } }
   return p1.clone().addScaledVector(d1,s).distanceTo(p2.clone().addScaledVector(d2,t)); };
 for(const c of clips){ __rp.start(c); let n=0, worst={d:0}; const LENc=LEN[c];
   while(n++<Math.round(LENc*60)-2){ __rp.frame(1/60); if(n%3) continue; const B=__rp.runner.B, g=k=>B[k].getWorldPosition(new V()), r=__rp.runner;
     const tipOf=s=>{ const h=g("hand_"+s), d=r.ax["hand_"+s].clone().applyQuaternion(B["hand_"+s].getWorldQuaternion(new THREE.Quaternion())); return h.clone().addScaledVector(d,0.09); };
     const caps={ torso:[g("hips").add(new V(0,0.06,0)),g("neck"),0.115], head:[g("head").add(new V(0,0.08,0)),g("head").add(new V(0,0.12,0)),0.095],
       uaL:[g("upperarm_L"),g("forearm_L"),0.04], faL:[g("forearm_L"),g("hand_L"),0.035], hdL:[g("hand_L"),tipOf("L"),0.03], uaR:[g("upperarm_R"),g("forearm_R"),0.04], faR:[g("forearm_R"),g("hand_R"),0.035], hdR:[g("hand_R"),tipOf("R"),0.03],
       thL:[g("thigh_L"),g("shin_L"),0.065], shL:[g("shin_L"),g("foot_L"),0.045], thR:[g("thigh_R"),g("shin_R"),0.065], shR:[g("shin_R"),g("foot_R"),0.045] };
     // the weapon in her hand, as a capsule from grip to the far end (the stock of a shouldered gun is meant to be in her shoulder, so only its front part counts)
     const k=ctx.wk; if(k&&W[k]&&W[k].obj.visible){ const o=W[k]; o.obj.updateMatrixWorld(true); const P=n=>o.obj.localToWorld(o.pts[n].clone());
       if(o.pts.tip) caps.wpn=[P("grip").lerp(P("tip"),0.25),P("tip"),0.025]; else if(o.pts.butt) caps.wpn=[P("grip").lerp(P("muzzle"),0.35),P("muzzle"),0.02]; else caps.wpn=[P("grip").lerp(P("muzzle"),0.5),P("muzzle"),0.02]; }
     const pairs=[["uaL","torso",0.03],["faL","torso",0.015],["hdL","torso",0.01],["uaR","torso",0.03],["faR","torso",0.015],["hdR","torso",0.01],["faL","head",0],["hdL","head",0],["faR","head",0],["hdR","head",0],["uaL","head",0],["uaR","head",0],
       ["faL","faR",0.01],["hdL","faR",0.01],["faL","hdR",0.01],["faL","thL",0.01],["faL","thR",0.01],["faR","thR",0.01],["faR","thL",0.01],["hdL","thL",0.01],["hdR","thR",0.01],["hdL","thR",0.01],["hdR","thL",0.01],["thL","thR",0.005],["shL","shR",0],["thL","shR",0],["thR","shL",0],
       ["wpn","torso",0],["wpn","head",0],["wpn","thL",0],["wpn","thR",0],["wpn","uaL",0],["wpn","faL",0],["wpn","uaR",0],["wpn","shL",0],["wpn","shR",0]];
     for(const [a,b,tol] of pairs){ if(!caps[a]||!caps[b]) continue; const d=segDist(caps[a][0],caps[a][1],caps[b][0],caps[b][1]), pen=caps[a][2]+caps[b][2]-d-tol; if(pen>worst.d) worst={d:pen,at:__rp.t.toFixed(2),pair:a+"/"+b,ph:(ctx.phase||"").slice(0,40)}; } }
   out[c]=worst.d>0.02?`${(worst.d*100).toFixed(0)} cm  ${worst.pair} @${worst.at} "${worst.ph}"`:"ok"; }
 return out; })(CLIPS)
