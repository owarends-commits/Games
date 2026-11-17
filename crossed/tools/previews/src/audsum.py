import json,re,sys
def parse(fn):
    R={}; clip=None
    for l in open(fn):
        if l.startswith('== '): clip=l[3:].strip(); continue
        m=re.match(r'\s+(\w+)\s+(\{.*\})$',l)
        if m and clip:
            d=json.loads(m.group(2)); 
            hov=d['hover']; hmax=0.0
            for x in re.findall(r'\(([\d.]+)\)',hov): hmax=max(hmax,float(x))
            hn=int(hov.split('f')[0]) if hov!='ok' else 0
            R[(clip,m.group(1))]=(hn,hmax,float(d['sink']),float(d.get('imbMax',0)))
    return R
a=parse(sys.argv[1]); b=parse(sys.argv[2])
print(f"{'clip':12}{'who':8}{'float frames':>14}{'max float m':>14}{'max sink m':>13}")
for k in b:
    x=a.get(k,(None,None,None,None)); y=b[k]
    f=lambda v: '-' if v is None else (f"{v:.2f}" if isinstance(v,float) else str(v))
    print(f"{k[0]:12}{k[1]:8}{f(x[0]):>6} → {f(y[0]):<6}{f(x[1]):>6} → {f(y[1]):<6}{f(x[2]):>5} → {f(y[2]):<5}")
