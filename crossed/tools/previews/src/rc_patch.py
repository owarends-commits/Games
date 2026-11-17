# the Reachers' clips, live: a shot in the neck during the whip spoils it (as the neck-shot clip shows)
rep('step(t,dt,ctx){ return whipStep(t,dt,ctx,null); } };', 'step(t,dt,ctx){ return whipStep(t,dt,ctx,ctx.liveShotAt??null); } };')
