# Norah live: the weapon clips aim at what she really aims at (no stand-in target), and never stand one up
body = re.sub(r'const tgtChest=\(\)=>', 'const tgtChest=()=>(ctx&&ctx.S&&ctx.S.aimAt)?ctx.S.aimAt.clone():', body, count=1)
rep('function standTarget(ctx,t){', 'function standTarget(ctx,t){ if(ctx.S){ ctx.atk=ctx.atk||{x:9,z:0,yaw:-Math.PI/2,J:P0(),live:1}; return; }')
