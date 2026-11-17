phys=open('phys.js').read(); s=open('ap_body.js').read()
pre=open('across-preview.html').read(); i=pre.index('// ---------------------------------------------------------------- pose format'); head=pre[:i]
j=head.find('// ---------------------------------------------------------------- physics guard')
if j>=0: head=head[:j]
tail=pre[pre.index('</script>', pre.index('window.__ap=')):]
out=head+phys+'\n'+s+'\n'+tail
open('across-preview.html','w').write(out)
pfx=open('ap_test.html').read()[:205]; open('ap_test.html','w').write(pfx+out)
a=out.rfind('<script>'); b=out.rfind('</script>'); open('ap_check.js','w').write(out[a+8:b])
