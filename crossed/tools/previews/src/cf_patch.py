# the club-fist's clips, live: outcomes come from the AI (ctx.outSel), not the page's selects
body = re.sub(r'document\.getElementById\("(o\w+)"\)\.value', r'((ctx.outSel&&ctx.outSel["\1"])||"alt")', body)
