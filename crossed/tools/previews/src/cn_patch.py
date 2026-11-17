# the Contortionist's clips, live: she breaks the leg wrap herself (the playground's prompt), not on a timer
rep('if(k>K0){ T.free=t; ctx.events.push({kind:"kickFree"}); }', 'if(k>K0&&!ctx.live){ T.free=t; ctx.events.push({kind:"kickFree"}); }')
rep('const backing=k>=D0&&k<D1, kicked=', 'const backing=k>=D0&&k<D1&&!(ctx.live&&T.free), kicked=')
