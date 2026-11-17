import sys
pre=open('brute-preview.html').read()
i=pre.index('// ---------------------------------------------------------------- auto-rig'); head=pre[:i]
j=head.find('// ---------------------------------------------------------------- physics guard')
if j>=0: head=head[:j]
tail=pre[pre.index('</script>', pre.index('window.__bp=')):]
out=head+open('phys.js').read()+'\n'+open('bp_rig.js').read()+'\n'+open('bp_body.js').read()+'\n'+tail
open('brute-preview.html','w').write(out)
pfx=open('bp_test.html').read()[:205]
open('bp_test.html','w').write(pfx+out)
