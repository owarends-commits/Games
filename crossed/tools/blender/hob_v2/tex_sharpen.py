# Sharpen the Hob atlas: 1024 -> 2048, real paint sharpened, generated fine detail (pores, veins, grime) on skin,
# strand detail on the hair strip, a bump map for the lighting, and a new "insides" tile in the empty space.
#   python3 tex_sharpen.py <in.png> <out_color.png> <out_bump.png> <out_normal.png>
import sys, numpy as np
from PIL import Image, ImageFilter
src, oc, ob, on = sys.argv[1:5]
rng=np.random.default_rng(7)
im=Image.open(src).convert('RGB'); S=2048
up=im.resize((S,S),Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.2,percent=90,threshold=1))
A=np.asarray(up).astype(np.float32)/255
def noise(n,cell,oct=4,seed=0):
    r=np.random.default_rng(seed); out=np.zeros((n,n),np.float32); amp=1; tot=0
    for o in range(oct):
        c=max(2,int(n/cell*(2**o))); g=r.random((c+1,c+1)).astype(np.float32)
        out+=amp*np.asarray(Image.fromarray((g*255).astype(np.uint8)).resize((n,n),Image.BICUBIC)).astype(np.float32)/255; tot+=amp; amp*=0.5
    return out/tot
pores=noise(S,6,3,1); pores=(pores-pores.mean())*2.2
vein=1-np.abs(noise(S,160,4,2)*2-1); vein=np.clip((vein-0.86)/0.14,0,1)**1.6
vein2=1-np.abs(noise(S,70,3,3)*2-1); vein2=np.clip((vein2-0.9)/0.1,0,1)**2
grime=np.clip((noise(S,260,4,4)-0.52)*3,0,1)
mask=np.zeros((S,S),np.float32)
def box(x0,y0,x1,y1,v=1): mask[y0*2:y1*2,x0*2:x1*2]=v
box(0,512,640,768)                           # skin tiles
face=np.zeros((S,S),np.float32); face[0:1024,280:760]=1
lum=A.mean(2); skinlike=((A[...,0]>A[...,2]+0.05)&(lum>0.25)).astype(np.float32)
fm=face*skinlike
m=(np.clip(mask+fm*0.45,0,1)*skinlike)[...,None]
col=A.copy()
col*= (1+ (pores*0.10)[...,None]*m)
vc=np.array([0.42,0.30,0.42],np.float32)                 # bruise-purple veins
col=col*(1-(vein*0.45+vein2*0.3)[...,None]*m)+vc*((vein*0.45+vein2*0.3)[...,None]*m)
col*= (1-(grime*0.22)[...,None]*m)
# hair strip: sharper strands and wet highlights
hx0,hx1=576*2,704*2; hs=noise(S,3,2,5)[:512, hx0:hx1]; st=np.tile(rng.random((1,hx1-hx0)).astype(np.float32),(512,1))
col[0:512,hx0:hx1]*=(0.75+0.5*st[...,None]); col[0:512,hx0:hx1]+=((st>0.93)*0.18)[...,None]
# the insides tile (empty atlas area, x 1280-1792, y 1024-1536): wet red-purple coils with dark folds
X,Y=np.meshgrid(np.arange(512),np.arange(512)); n1=noise(512,40,4,9); n2=noise(512,14,3,10)
coil=np.sin((X*0.06+n1*9))*np.sin((Y*0.05+n1*7)); fold=np.clip(1-np.abs(coil)*3,0,1)
ins=np.stack([0.55+0.25*n2,0.12+0.12*n2,0.18+0.15*n2],-1)*(1-0.55*fold[...,None])
ins+=((n2>0.72)*0.25)[...,None]*np.array([1,0.8,0.8])
col[1024:1536,1280:1792]=ins
col=np.clip(col,0,1)
Image.fromarray((col*255).astype(np.uint8)).save(oc)
# bump: paint's own high-pass + pores + raised veins, then normal map
g=np.asarray(Image.fromarray((lum*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(6))).astype(np.float32)/255
hp=lum-g; bump=0.5+hp*1.4+pores*0.035*m[...,0]+vein*0.10*m[...,0]+vein2*0.06*m[...,0]
bump[1024:1536,1280:1792]=0.5+fold*0.25+n2*0.1
bump=np.clip(bump,0,1); Image.fromarray((bump*255).astype(np.uint8)).save(ob)
dx=np.gradient(bump,axis=1)*6; dy=np.gradient(bump,axis=0)*6; nz=np.ones_like(dx); L=np.sqrt(dx*dx+dy*dy+1)
nm=np.stack([(-dx/L)*0.5+0.5,(dy/L)*0.5+0.5,(nz/L)*0.5+0.5],-1)
Image.fromarray((nm*255).astype(np.uint8)).save(on); print("ok",S)
