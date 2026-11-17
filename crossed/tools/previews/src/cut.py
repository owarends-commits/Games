# the cut ACROSS subclasses: Fresh, Kneeler, Dragger, Patient, Wailer. Only Walker, Crawler, Mourner and Matron remain.
import re as _re
for _k in ["fresh","kneeler","dragger","patient","wailer"]:
    _m = _re.search(r'\n  \{key:"%s",name:.*?fights:"[^"]*"\},?' % _k, j, _re.S)
    assert _m, _k
    j = j[:_m.start()] + j[_m.end():]
j = rep(j, '\n];\n\nfunction cyl(', '\n];\n\nfunction cyl(')  # sanity: list still closes
j = _re.sub(r'(fights:"[^"]*"\}),(\n\];\n\nfunction cyl\()', r'\1\2', j)
for _k in ["fresh","patient","wailer"]:
    _m = _re.search(r'\n  %s:\{hunch:[^}]*\},?' % _k, j); assert _m, _k; j = j[:_m.start()] + j[_m.end():]
j = rep(j, '    if(V.p==="wailer"){ v.aLZ+=Math.sin(w*7)*0.08; v.aRZ+=Math.cos(w*6.3)*0.08; v.jaw=q.jaw+Math.sin(w*3)*0.1; } }', ' }')
j = rep(j, ' if(this.V&&this.V.key==="wailer") c*=1.3;', '')
# maps saved with a cut subclass load it as a Walker
j = rep(j, 'this.variant = opts.variant || keys[Math.floor(rng()*keys.length)];', 'this.variant = opts.variant ? (VMAP[opts.variant]?opts.variant:"walker") : keys[Math.floor(rng()*keys.length)];')
# random picks never roll a Mourner: it only makes sense placed, kneeling over a body
j = rep(j, 'const keys=VARIANTS.map(v=>v.key);', 'const keys=VARIANTS.filter(v=>v.key!=="mourner").map(v=>v.key);')
j = rep(j, 'const st=VARIANTS.filter(v=>v.stance!=="crawl");', 'const st=VARIANTS.filter(v=>v.stance!=="crawl" && v.key!=="mourner");')
