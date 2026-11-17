// ---- both feet on the floor: when it stands, the balance lean angles the legs and would leave one foot hovering.
// Two-bone leg solve: the lower foot's knee bends until the soles are level; the guard then sets both down.
function legIK(C,s,T,poleW){ const V=THREE.Vector3, R=C.R, hip=R["leg"+s], knee=R["knee"+s], ank=R["ankle"+s]; C.group.updateMatrixWorld(true);
  const S=hip.getWorldPosition(new V()), K0=knee.getWorldPosition(new V()), A0=ank.getWorldPosition(new V()), L1=S.distanceTo(K0), L2=K0.distanceTo(A0);
  const d=clamp(T.distanceTo(S),Math.abs(L1-L2)+0.01,L1+L2-0.001), interior=Math.acos(clamp((L1*L1+L2*L2-d*d)/(2*L1*L2),-1,1));
  knee.rotation.x=Math.PI-interior; knee.updateMatrixWorld(true);
  const A=ank.getWorldPosition(new V()); rotWorld(hip,new THREE.Quaternion().setFromUnitVectors(A.sub(S).normalize(),T.clone().sub(S).normalize()));
  const ax=T.clone().sub(S).normalize(), ve=knee.getWorldPosition(new V()).sub(S), vp=poleW.clone().sub(S); ve.addScaledVector(ax,-ve.dot(ax)); vp.addScaledVector(ax,-vp.dot(ax));
  if(ve.lengthSq()>1e-8&&vp.lengthSq()>1e-8){ let a=ve.angleTo(vp); if(ve.clone().cross(vp).dot(ax)<0) a=-a; rotWorld(hip,new THREE.Quaternion().setFromAxisAngle(ax,a)); } }
function plantFeet(C,ctx){ if(C.a0==null) return; const fwd=new THREE.Vector3(Math.sin(ctx.yaw),0,Math.cos(ctx.yaw));
  for(let it=0;it<3;it++){ const lL=lowSole(C,"L").y, lR=lowSole(C,"R").y, d=lR-lL; if(Math.abs(d)<0.002) break;
    const s=d>0?"L":"R", R=C.R, A=R["ankle"+s].getWorldPosition(new THREE.Vector3()), pole=R["knee"+s].getWorldPosition(new THREE.Vector3()).addScaledVector(fwd,0.4);
    legIK(C,s,A.add(new THREE.Vector3(0,Math.abs(d),0)),pole); } }
