import json
from PIL import Image, ImageDraw
fs=json.load(open('hug_list.json')); W=Image.new('RGB',(4*330,2*240),(20,20,20))
for i,(f,lab) in enumerate(fs):
  im=Image.open(f).resize((330,230)); W.paste(im,((i%4)*330,(i//4)*240)); ImageDraw.Draw(W).text(((i%4)*330+6,(i//4)*240+214),lab,fill=(255,200,120))
W.save('hug_sheet.png')
