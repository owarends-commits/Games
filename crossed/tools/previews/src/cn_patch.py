# the Contortionist's clips, live: she breaks the leg wrap herself (the playground's prompt), not on a timer
rep('if(k>K0){ T.free=t; ctx.events.push({kind:"kickFree"}); }', 'if(k>K0&&!ctx.live){ T.free=t; ctx.events.push({kind:"kickFree"}); }')
rep('const backing=k>=D0&&k<D1, kicked=', 'const backing=k>=D0&&k<D1&&!(ctx.live&&T.free), kicked=')
# the wall climb and drop, live: the stage's wall is a real wall of the map (no preview wall), she is where she really is,
# and it lets go when the host says she's under it
rep('function ensureWall(){ if(wallMesh) return;', 'function ensureWall(){ if(ctx&&ctx.live) return; if(wallMesh) return;')
rep('    if(!T.landT){ if(T.ph==="hang"||T.ph==="drop"){', '    if(ctx.live){ ctx.nx=NX; } else if(!T.landT){ if(T.ph==="hang"||T.ph==="drop"){')
rep('wait:()=> ctx.nx>=under-0.06 ?', 'wait:()=> (ctx.live?ctx.underNow:ctx.nx>=under-0.06) ?')
rep('const T=ctx.T, Q=QCRAWL(), QW=QWALL(), sz=Z(), top=(dropOn?1.95:1.75)*sz;', 'const T=ctx.T, Q=QCRAWL(), QW=QWALL(), sz=Z(), top=Math.min((dropOn?1.95:1.75)*sz, ctx.wallTop??9);')
