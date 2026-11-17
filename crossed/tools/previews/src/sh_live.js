// ================================================================ the split-head Reacher, live (playground)
// Its body sits where it was put, in its own room; the stage's doorway (x=0) is set on the real doorway out of that room.
// The head roams on 5 m of neck: low along the floor searching, up at her eye level holding off when it has her, darting
// side to side when she aims at it, racing back when the body is shot.
function pvPrep(g,h){ stretchNeck(g,SH.L); h.rc=buildChains(g); RC=h.rc; h.spl=splitRig(g); SPL=h.spl; }
function pvPost(C,h){ C.rc=h.rc; C.spl=h.spl; C.bx=SH.BX; chainRig(C,h.rc); RC.r=neckR(C); RC.rk=neckRk(C);
  for(const [n,b] of Object.entries(C.B)) if(/^(nk\d+|head|jawU|jawL|face|hairL|hairR)$/.test(n)) b.userData.noContact=true; }
{ const bind0=pvBind; pvBind=function(h){ bind0(h); const C=h.C; if(C&&C.rc){ RC=C.rc; SPL=C.spl; SH.BX=C.bx; } else if(h.rc){ RC=h.rc; SPL=h.spl; } }; }
const LIVE={};
const dz7=k=>[0.5,-0.55,0.35,-0.45,0.6,-0.3,0.15][((k%7)+7)%7];
// prowl: what the AI wants (ctx.mode: idle | search | hold | back; ctx.target; ctx.aimed), the head goes there
LIVE.prowl={ start(ctx){ shStart(ctx); ctx.M=(ctx.mouthAt||ctx.M||new V3(0.9,0.45,0)).clone(); ctx.dodgeW=ctx.dodgeW||0; },
  step(t,dt,ctx){ const J=sSit(t,{jolt:ctx.jolt||0}); ctx.jolt=Math.max(0,(ctx.jolt||0)-dt*2.5);
    const H=nHead(), mode=ctx.mode||"idle"; let goal, look, jaw=JAW.rest, part=0, sp=2.4;
    if(mode==="hold"){ const bk=new V3(0.3,0,0).sub(H).setY(0); if(bk.lengthSq()<1e-4) bk.set(-1,0,0); bk.normalize();
      goal=H.clone().addScaledVector(bk,ctx.holdD||1.3); goal.y=1.45+0.05*Math.sin(t*1.7); look=nFace(); jaw=JAW.ajar; part=0.25; sp=3.6; }
    else if(mode==="search"&&ctx.target){ goal=ctx.target.clone(); goal.y=0.5; look=goal.clone().add(new V3(2*Math.sin(t*0.9),0.5,2*Math.cos(t*0.7))); }
    else if(mode==="back"){ goal=new V3(0.6,0.8,0); look=new V3(SH.BX,0.7,0); jaw=JAW.open; part=0.6; sp=6.5; }
    else { goal=new V3(1.4+0.7*Math.sin(t*0.3),0.45,0.9*Math.sin(t*0.37)); look=goal.clone().add(new V3(2,0.1,1.5*Math.sin(t*0.5))); }
    // she has it in her sights: it darts from side to side
    ctx.dodgeW+=((ctx.aimed?1:0)-ctx.dodgeW)*Math.min(1,dt*3);
    const ph=t/0.42, k0=Math.floor(ph), u=sm5((ph-k0)/0.45), dart=(dz7(k0)+(dz7(k0+1)-dz7(k0))*u)*ctx.dodgeW;
    const fw=look.clone().sub(goal).setY(0); if(fw.lengthSq()<1e-4) fw.set(1,0,0); fw.normalize(); goal.addScaledVector(new V3(-fw.z,0,fw.x),dart*0.9);
    if(ctx.kick){ goal.add(ctx.kick); ctx.kick.multiplyScalar(Math.max(0,1-dt*5)); }
    const mv=goal.clone().sub(ctx.M).multiplyScalar(Math.min(1,dt*5)), cap=(sp+4*ctx.dodgeW)*dt; if(mv.length()>cap) mv.setLength(cap); ctx.M.add(mv);
    const M=ctx.M.clone().add(new V3(0,0.04*Math.sin(t*1.9),0));
    ctx.jawOpen=jaw[1]; ctx.post=()=>{ placeHead(M,look,t,{}); }; ctx.post2=d=>headDyn(ctx,d,jaw,{part});
    ctx.phase= mode==="hold"?(ctx.dodgeW>0.4?"darts side to side · hard to hit":"holds off at her eye level · the split eases open"): mode==="search"?"slides along the floor low, searching": mode==="back"?"the body is hurt · the head races back":"lies low by the doorway · the face dragging";
    return fin(J); } };
// shot inside the open split: it snaps shut, the neck recoils and sways, then it comes back, wary
LIVE.recoil={ start(ctx){ shStart(ctx); ctx.R0=(ctx.mouthAt||ctx.M).clone(); },
  step(t,dt,ctx){ const J=sSit(t), R0=ctx.R0, bk=new V3(0,0,0).sub(R0).setY(0); if(bk.lengthSq()<1e-4) bk.set(-1,0,0); bk.normalize();
    const low=R0.clone().addScaledVector(bk,0.7).add(new V3(0,-0.5,0.2)); low.y=Math.max(0.5,low.y);
    const M=R0.clone().lerp(low,sm5(t/0.35)).lerp(R0,sm5((t-1.3)/1.0)), wob=0.5*Math.exp(-1.5*t)*Math.sin(t*10), roll=0.5*Math.exp(-2*t)*Math.sin(t*14);
    let jaw=jawMix(JAW.open,JAW.shut,sm5(t/0.06)); if(t>1.4) jaw=jawMix(JAW.shut,JAW.rest,sm5((t-1.4)/0.6));
    ctx.jawOpen=0; ctx.M=M.clone(); ctx.post=()=>{ placeHead(M,nFace(),t,{wob,roll}); }; ctx.post2=d=>headDyn(ctx,d,jaw,{part:0.05,fDamp:0.7});
    ctx.phase= t<1.3?"shot inside the split · it snaps shut and recoils":"comes back, wary"; return fin(J); } };
// dead: the body slumps, the neck drops where it is like a rope, the head goes over onto its side
LIVE.die={ start(ctx){ shStart(ctx); },
  step(t,dt,ctx){ const J=sSit(t,{dead:sm5(t/0.6)}); if(ctx.rope) ctx.post=()=>ropeFall(ctx,dt);
    const jaw=jawMix(JAW.open,[-0.2,0.35],sm5(t/0.5)); ctx.post2=d=>headDyn(ctx,d,jaw,{fDamp:2.5}); ctx.phase="dead"; return fin(J); } };
LIVE.mouth=h=>h.ctx.mouthAt||h.ctx.M;
