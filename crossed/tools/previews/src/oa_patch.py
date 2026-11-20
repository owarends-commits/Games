# the one-arm's clips, live: outcomes from the AI; the charge rams her only if she's really in its line, and runs past if she isn't
body = re.sub(r'document\.getElementById\("(o\w+)"\)\.value', r'((ctx.outSel&&ctx.outSel["\1"])||"alt")', body)
rep('if(ctx.ikTip.x>nc.x-0.25){', 'if(ctx.ikTip.x>nc.x-0.25&&(!ctx.live||Math.abs(ctx.ikTip.z-nc.z)<0.75)){')
rep('past=ctx.out==="sidestep"&&ctx.x>nx-0.2*Z();', 'past=(ctx.out==="sidestep"&&ctx.x>nx-0.2*Z())||(ctx.live&&ctx.hitT==null&&ctx.x>nx+0.5*Z());')
