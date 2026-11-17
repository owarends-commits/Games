# the split-head Reacher, live: no preview room; the dangling face and hair keep their state from clip to clip; the
# attacks start from wherever the head really is; the mouth and the neck's joints are kept every frame (for the next
# clip, and for the neck to fall as a rope when it dies)
rep('function ensureRoom(){ if(ROOM) return;', 'function ensureRoom(){ return;')
rep('ctx.T={}; ctx.dyn={}; ctx.camX=null; }', 'ctx.T={}; ctx.dyn=ctx.dyn||{}; ctx.camX=null; }')
rep('  return R.head.localToWorld(SPL.mouth.clone()); }', '  ropeRecord(ctx); return (ctx.mouthAt=R.head.localToWorld(SPL.mouth.clone())); }')
rep('const base=new V3(1.55,1.58,0.12),', 'const base=ctx.M0?ctx.M0.clone():new V3(1.55,1.58,0.12),')
rep('const hold=new V3(1.6,1.45,0.1), rear=sh.clone().add(new V3(-1.05,0.45,-0.15));',
    'const hold=ctx.M0?ctx.M0.clone():new V3(1.6,1.45,0.1), bk=hold.clone().sub(sh).setY(0); if(bk.lengthSq()<1e-4) bk.set(-1,0,0); bk.normalize(); const rear=sh.clone().addScaledVector(bk,1.05).add(new V3(0,0.45,0));')
rep('M=sh.clone().lerp(new V3(1.35,1.2,0.3),sm5((k-0.08)/0.7));', 'M=sh.clone().lerp(hold.clone().add(new V3(0,-0.25,0.2)),sm5((k-0.08)/0.7));')
rep('const hold=new V3(1.6,1.45,0.1), over=hd.clone()', 'const hold=ctx.M0?ctx.M0.clone():new V3(1.6,1.45,0.1), over=hd.clone()')
