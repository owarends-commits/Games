import json,sys
from PIL import Image, ImageDraw
fs=json.load(open('ap_list.json')); n=len(fs); cols=4; rows=(n+cols-1)//cols; W=Image.new('RGB',(cols*300,rows*215),(20,20,20))
for i,(f,lab) in enumerate(fs):
  im=Image.open(f).resize((300,209)); W.paste(im,((i%cols)*300,(i//cols)*215)); ImageDraw.Draw(W).text(((i%cols)*300+5,(i//cols)*215+196),lab[:48],fill=(255,200,120))
W.save(sys.argv[1] if len(sys.argv)>1 else 'ap_sheet.png')
