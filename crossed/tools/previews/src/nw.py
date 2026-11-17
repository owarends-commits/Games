# Norah posed by her own preview code (PV_NW, nw_host.js): engine hooks
j = rep(j, "  for(const e of enemies) e.update(dt); pvFxAll(dt);", "  for(const e of enemies) e.update(dt); pvFxAll(dt); plvFrame(dt);")
j = rep(j, "player.hammer = CFG.rev.hammer; player.cockPending=true;", "player.hammer = CFG.rev.hammer; player.cockPending=true; plvShot();")
j = rep(j, 'log("*click* empty. R to reload","#9a9283"); SFX.empty();', 'log("*click* empty. R to reload","#9a9283"); SFX.empty(); plvClick();')
j = rep(j, "const hp = new THREE.Vector3(); player.P.gun.getWorldPosition(hp);", "const hp = new THREE.Vector3(); if(PLV.ready) hp.copy(plvMuzzle()); else player.P.gun.getWorldPosition(hp);")
