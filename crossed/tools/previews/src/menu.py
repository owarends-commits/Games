
j = rep(j, 'if(e.code==="KeyB" && !rep && !player.grabbed){ toBuild(); e.stopImmediatePropagation(); return; }', '')
j = rep(j, '  if(MODE!=="play") return;\n  if(e.target.tagName', '  if(MODE!=="play") return;\n  if(SB.simMenu){ if((e.code==="Escape"||e.code==="KeyP")&&!e.repeat) closeSimMenu(); e.preventDefault(); return; }\n  if(e.target.tagName')
j = rep(j, '  if(e.code==="KeyP") togglePause();', '  if(e.code==="KeyP"||e.code==="Escape") openSimMenu();')
j = rep(j, 'if(edge(9)) togglePause();', 'if(edge(9)) openSimMenu();')
j = rep(j, '    else if(invOpen()){ dt=0; }', '    else if(invOpen()||SB.simMenu){ dt=0; }')
j = rep(j, 'if(MODE!=="play"||invOpen()) return;\n  audio();', 'if(MODE!=="play"||invOpen()||SB.simMenu) return;\n  audio();')
j = rep(j, 'R.style.display="block"; if(result!=="DIED") SFX.win();', 'R.style.display="block"; if(result!=="DIED") SFX.win(); setTimeout(()=>{ if(MODE==="play"&&run&&run.over) openSimMenu(result); },1600);')
j = rep(j, 'const w = MODE==="build" ? Math.round(', 'const w = MODE!=="play" ? Math.round(')
