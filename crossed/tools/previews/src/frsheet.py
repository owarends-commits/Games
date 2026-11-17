import json,sys
from PIL import Image, ImageDraw
fs=json.load(open('fr_list.json')); n=len(fs); cols=int(sys.argv[2]) if len(sys.argv)>2 else 5; rows=(n+cols-1)//cols; w,h=240,210
W=Image.new('RGB',(cols*w,rows*h),(20,20,20))
for i,(f,lab) in enumerate(fs):
  im=Image.open(f).resize((w,h-12)); W.paste(im,((i%cols)*w,(i//cols)*h)); ImageDraw.Draw(W).text(((i%cols)*w+3,(i//cols)*h+h-12),lab[:40],fill=(255,200,120))
W.save(sys.argv[1])
