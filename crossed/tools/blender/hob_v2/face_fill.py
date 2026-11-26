# Cover the whole face with skin: inside the front of the face (the mesh's front-facing UV footprint), pixels that are
# the original photo's background or hair (dark, not skin) are painted over from the surrounding skin. The eyes, nostrils
# and mouth are protected.   python3 face_fill.py <in.png> <face_uv.json> <out.png>
import sys, json, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, uvj, out = sys.argv[1:4]
im=Image.open(src).convert('RGB'); W,H=im.size; A=np.asarray(im).astype(np.float32)/255
fp=Image.new('L',(W,H),0); d=ImageDraw.Draw(fp)
for t in json.load(open(uvj)):
    if t['ny']<-0.3: d.polygon([(u*W,(1-v)*H) for u,v in t['p']],fill=255)
fp=np.asarray(fp.filter(ImageFilter.MaxFilter(5)))>0
lum=A.mean(2); skin=(lum>0.42)&(A[...,0]>A[...,2]+0.06)
Y,X=np.mgrid[0:H,0:W]; sx,sy=W/1024,H/1024
protect=(((X/sx-231)/30)**2+((Y/sy-224)/30)**2<1) | (((X/sx-278)/30)**2+((Y/sy-224)/30)**2<1) | ((abs(X/sx-258)<24)&(abs(Y/sy-292)<22)) | ((abs(X/sx-258)<92)&(Y/sy>340)&(Y/sy<472))
bad=fp & ~skin & ~protect
# smooth fill: normalised convolution of the known skin, coarse to fine (no streaks)
known=(~bad).astype(np.float32); res=A.copy()
for r in (40,20,10,5):
    num=np.stack([np.asarray(Image.fromarray((A[...,c]*known*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32) for c in range(3)],-1)
    den=np.asarray(Image.fromarray((known*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r))).astype(np.float32)[...,None]
    est=num/np.maximum(den,1e-3); ok=(den[...,0]>8)&bad; res[ok]=est[ok]/1.0 if r==40 else res[ok]*0.4+est[ok]*0.6
res=res/np.maximum(1e-3,res.max()) if res.max()>1.5 else res
noise=np.random.default_rng(3).normal(0,0.012,A.shape).astype(np.float32); res=np.clip(res+noise,0,1)
out_=A.copy(); out_[bad]=res[bad]
# soften the seam a touch so the fill doesn't show as a hard edge
blur=np.asarray(Image.fromarray((out_*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2))).astype(np.float32)/255
edge=np.asarray(Image.fromarray((bad*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))).astype(np.float32)/255>0.5
edge&=~protect; out_[edge]=0.5*out_[edge]+0.5*blur[edge]
Image.fromarray((np.clip(out_,0,1)*255).astype(np.uint8)).save(out); print("filled",int(bad.sum()),"px")
