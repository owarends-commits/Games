# the low-poly character models: pick one per body, extra hits, limb loss on the model, sync before each render
j = rep(j, "    const S = this.S;\n    this.name = type===\"dummy\"", "    this.mdl = big ? (type===\"brute\"?pickModel(\"louis\"):null) : pickModel(this.variant);\n    const S = this.S;\n    this.name = type===\"dummy\"")
j = rep(j, "this.root.scale.setScalar(this.scale);\n", "this.root.scale.setScalar(this.scale);\n    skinEnemy(this);\n")
j = rep(j, "    const kn=m.knock??1;", "    if(this.mdl && this.variant!==\"mourner\") o.hp += (MODEL_LIB[this.mdl]||{}).x||0;\n    const kn=m.knock??1;")
j = rep(j, "    const piece = new THREE.Group(); scene.add(piece); piece.attach(cut);\n",
           "    const piece = new THREE.Group(); scene.add(piece); piece.attach(cut);\n    if(this.skin){ (this.lostSeg=this.lostSeg||{})[limb]=seg; const mp=mdlCollapse(this.skin, limb, seg); if(mp){ this.root.add(mp); mp.updateMatrixWorld(true); piece.attach(mp); } }\n")
j = rep(j, "  updateHud();\n  renderer.render(scene,camera);\n  requestAnimationFrame(frame);", "  updateHud();\n  skinSyncAll();\n  renderer.render(scene,camera);\n  requestAnimationFrame(frame);")
j = rep(j, "brute:{hp:16, bigArm:3, limb:2, height:2.75,", "brute:{hp:16, bigArm:3, limb:2, height:2.64,")
