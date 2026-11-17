import sys,subprocess,json
from PIL import Image
m,clip,ts=sys.argv[1:4]; out=sys.argv[4] if len(sys.argv)>4 else "sheet"
r=subprocess.run(["node","rshot.js",m,clip,ts],capture_output=True,text=True); print(r.stdout.strip()[-1500:])
n=len(ts.split(",")); ims=[Image.open(f"/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/r_{clip}_{i}.png") for i in range(n)]
w,h=ims[0].size; cols=2 if n<=4 else 3; rows=(n+cols-1)//cols; o=Image.new("RGB",(w*cols,h*rows))
for i,im in enumerate(ims): o.paste(im,((i%cols)*w,(i//cols)*h))
o.resize((w*cols//2 if cols==2 else w*cols//3, h*rows//2 if cols==2 else h*rows//3)).save(f"/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/{out}.png")
