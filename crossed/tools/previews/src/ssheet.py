import sys,glob
from PIL import Image
clip=sys.argv[1]; n=int(sys.argv[2]); cols=int(sys.argv[3]) if len(sys.argv)>3 else 3; sc=float(sys.argv[4]) if len(sys.argv)>4 else 0.5
ims=[Image.open(f"/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/s_{clip}_{i}.png") for i in range(n)]
w,h=ims[0].size; rows=(n+cols-1)//cols; o=Image.new("RGB",(w*cols,h*rows))
for i,im in enumerate(ims): o.paste(im,((i%cols)*w,(i//cols)*h))
o.resize((int(w*cols*sc),int(h*rows*sc))).save(f"/tmp/claude-0/-home-user/e5900e36-00d6-5b4b-82f0-38a92cf30ee1/scratchpad/shots/S_{clip}.png")
