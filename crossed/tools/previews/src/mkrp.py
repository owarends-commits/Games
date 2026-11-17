phys=open('phys.js').read(); f='runner-preview.html'; s=open(f).read()
j=s.find('// ---------------------------------------------------------------- physics guard'); k=s.index('function applyPose(C,J)')
s=s[:j]+phys+'\n'+s[k:]
open(f,'w').write(s); pfx=open('rp_test.html').read()[:205]; open('rp_test.html','w').write(pfx+s)
a=s.rfind('<script>'); b=s.rfind('</script>'); open('rp_check.js','w').write(s[a+8:b])
