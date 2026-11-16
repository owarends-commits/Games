#!/usr/bin/env python3
"""Rig the Hob (crossed/assets/characters/lowpoly/bosses/hob/hob.glb) for the animation preview.

The model ships static. This builds a stand-in skeleton (spine, head, jaw, two arms, three-jointed fingers, back legs) and
writes a skinned glTF the preview loads: crossed/tools/hob_preview/m/bosses/hob/hob_rigged.json (+ hob_tex0.png).

  python3 crossed/tools/rig_hob.py

See crossed/docs/project/hob-boss.md for what the rig is for and crossed/tools/hob_preview/README.md for the preview.
"""
import os
HERE=os.path.dirname(os.path.abspath(__file__))
SRC=os.path.join(HERE,'..','assets','characters','lowpoly','bosses','hob','hob.glb')
OUT=os.path.join(HERE,'hob_preview','m','bosses','hob')
# Rig the static Hob mesh for the preview. Weights depend on WHERE a vertex is, not which part it belongs to,
# so parts that touch (knuckles on fingers, ribs on the torso, the arm entering the body) always move together.
# The mouth is cut: a ragged tear across the lips, the lower side on the jaw, so the shriek can rip it open.
import json,struct,base64
import numpy as np
d=open(SRC,'rb').read(); n=struct.unpack('<I',d[12:16])[0]; j=json.loads(d[20:20+n]); bin_=bytes(d[20+n+8:])
def view(i): bv=j['bufferViews'][i]; o=bv.get('byteOffset',0); return bin_[o:o+bv['byteLength']]
def acc(i):
  a=j['accessors'][i]; bv=j['bufferViews'][a['bufferView']]; off=bv.get('byteOffset',0)+a.get('byteOffset',0)
  comp={5126:'f4',5125:'u4',5123:'u2'}[a['componentType']]; nc={'VEC3':3,'VEC2':2,'SCALAR':1}[a['type']]
  r=np.frombuffer(bin_,dtype=comp,count=a['count']*nc,offset=off); return r.reshape(-1,nc) if nc>1 else r
pr=j['meshes'][0]['primitives'][0]; P=acc(pr['attributes']['POSITION']).astype(np.float32).copy(); N=acc(pr['attributes']['NORMAL']).astype(np.float32).copy(); UV=acc(pr['attributes']['TEXCOORD_0']).astype(np.float32).copy(); I=acc(pr['indices']).astype(np.uint32).copy()
P[:,1]=np.maximum(P[:,1],0.005)   # nothing starts below the floor (hair ends, the toes)
tri=I.reshape(-1,3)
# ---- connected parts (welded by position)
par=np.arange(len(P))
def f(a):
  r=a
  while par[r]!=r: r=par[r]
  while par[a]!=r: par[a],a=r,par[a]
  return r
for t in tri:
  a,b,c=f(t[0]),f(t[1]),f(t[2]); par[b]=a; par[f(c)]=a
key={}
for i,p in enumerate(map(tuple,np.round(P,4))):
  if p in key: par[f(i)]=f(key[p])
  else: key[p]=i
root=np.array([f(i) for i in range(len(P))]); comps={}
for i,r in enumerate(root): comps.setdefault(r,[]).append(i)
comp_of=np.zeros(len(P),int); clist=list(comps.values())
for k,c in enumerate(clist): comp_of[c]=k
sm=lambda e0,e1,x: (lambda u: u*u*(3-2*u))(np.clip((np.asarray(x,float)-e0)/(e1-e0),0,1))
# ---- what each part is
arms=[k for k,c in enumerate(clist) if len(c)==90 and (P[c,2].max()-P[c,2].min())>1.5 and abs(P[c,0].mean())>0.5]
assert len(arms)==2
armInfo={}
for k in arms:
  Q=P[clist[k]]; s='R' if Q[:,0].mean()>0 else 'L'; hi=Q[Q[:,1]>=np.quantile(Q[:,1],0.85)].mean(0); lo=Q[Q[:,1]<=np.quantile(Q[:,1],0.15)].mean(0); armInfo[s]=(k,hi,lo)
face=max(range(len(clist)),key=lambda k:len(clist[k]))
kind={}
for k,c in enumerate(clist):
  Q=P[c]; cx,cz=Q[:,0].mean(),Q[:,2].mean(); mn,mx=Q.min(0),Q.max(0)
  if k in arms: kind[k]='arm'
  elif mx[1]<0.45 and cz>-0.8: kind[k]='hand'
  elif cz>-1.25 and abs(cx)<1.0 and mx[1]>1.0 and mn[2]>-1.3: kind[k]='head'
  elif cz<-5.0 and abs(cx)>0.08 and len(c)<500: kind[k]='leg'
  else: kind[k]='body'
fingers={'L':[],'R':[]}
for k,c in enumerate(clist):
  if len(c)==49 and kind[k]=='hand':
    Q=P[c]; s='R' if Q[:,0].mean()>0 else 'L'; wr=np.array(armInfo[s][2]); dd=np.linalg.norm(Q-wr,axis=1); fingers[s].append((Q[dd.argmin()],Q[dd.argmax()]))
for s in 'LR': fingers[s].sort(key=lambda f_: f_[0][0])
# ---- joints (name, parent, bind position; the Hob faces +z)
J=[('root',-1,(0,1.3,-1.5)),('head',0,(0,1.45,-0.9)),('spine1',0,(0,1.25,-2.8)),('spine2',2,(0,1.2,-4.2)),('spine3',3,(0,1.0,-5.6)),
   ('leg_R',4,(0.6,0.75,-5.8)),('foot_R',5,(0.6,0.25,-7.9)),('leg_L',4,(-0.6,0.75,-5.8)),('foot_L',7,(-0.6,0.25,-7.9))]
for s in 'LR':
  _,hi,lo=armInfo[s]; k=len(J); J+=[('shoulder_'+s,0,tuple(hi)),('elbow_'+s,k,tuple((hi+lo)/2)),('hand_'+s,k+1,tuple(lo))]
J.append(('jaw',1,(0,0.75,-0.3)))
for s in 'LR':
  hk=[k for k,(nm,_,_) in enumerate(J) if nm=='hand_'+s][0]
  for i,(b,tp) in enumerate(fingers[s]):   # three joints per finger, so it can curl right round something
    L=np.linalg.norm(tp-b); dv=(tp-b)/L; k0=len(J)
    J.append((f'finger_{s}{i}_0',hk,tuple(b))); J.append((f'finger_{s}{i}_1',k0,tuple(b+dv*L/3))); J.append((f'finger_{s}{i}_2',k0+1,tuple(b+dv*2*L/3)))
idx={nm:i for i,(nm,_,_) in enumerate(J)}
# ---- the mouth tear: triangles of the face below a ragged line across the lips go to the jaw, on their own copies of the shared vertices
ys=lambda x: 0.6+0.035*np.sin(x*31)+0.02*np.sin(x*67+1)
MW=0.42
lowerTri=[]
for ti,t in enumerate(tri):
  if comp_of[t[0]]!=face: continue
  c=P[t].mean(0)
  if abs(c[0])<MW and c[2]>0.3 and 0.15<c[1]<ys(c[0]): lowerTri.append(ti)
lowerV=np.unique(tri[lowerTri].ravel()); upperV=set(np.unique(np.delete(tri,lowerTri,axis=0)[np.isin(np.delete(tri,lowerTri,axis=0),lowerV).any(1)].ravel()).tolist())
shared=[v for v in lowerV if v in upperV]
remap={}
for v in shared: remap[v]=len(P)+len(remap)
if remap:
  src=np.array(list(remap.keys())); P=np.vstack([P,P[src]]); N=np.vstack([N,N[src]]); UV=np.vstack([UV,UV[src]]); comp_of=np.concatenate([comp_of,comp_of[src]])
  for ti in lowerTri:
    for e in range(3):
      v=tri[ti,e]
      if v in remap: tri[ti,e]=remap[v]
isLower=np.zeros(len(P),bool); isLower[np.unique(tri[lowerTri].ravel())]=True
print('mouth: lower triangles',len(lowerTri),'split vertices',len(remap))
# ---- weights
W=np.zeros((len(P),4),np.float32); Jt=np.zeros((len(P),4),np.uint16)
def put(v,pairs):
  pairs=[(a,b) for a,b in pairs if b>1e-4]; pairs.sort(key=lambda q:-q[1]); pairs=pairs[:4]; tot=sum(b for _,b in pairs) or 1
  for k,(a,b) in enumerate(pairs): Jt[v,k]=idx[a]; W[v,k]=b/tot
spineZ=[(-1.5,'root'),(-2.8,'spine1'),(-4.2,'spine2'),(-5.6,'spine3')]
def spineW(z):
  if z>=spineZ[0][0]: return [('root',1.0)]
  if z<=spineZ[-1][0]: return [('spine3',1.0)]
  for (z0,a),(z1,b) in zip(spineZ,spineZ[1:]):
    if z1<=z<=z0: t=(z0-z)/(z0-z1); return [(a,1-t),(b,t)]
def armW(p,s):
  _,hi,lo=armInfo[s]; ax=lo-hi; t=float((p-hi)@ax/(ax@ax)); R=1-float(sm(0,0.18,t)); a=float(sm(0.35,0.65,t)); h=float(sm(0.9,1.02,t))
  return [('root',R),('shoulder_'+s,(1-R)*(1-a)),('elbow_'+s,(1-R)*a*(1-h)),('hand_'+s,(1-R)*a*h)]
def fingerW(p,s):
  best=None
  for i,(b,tp) in enumerate(fingers[s]):
    dv=tp-b; L=np.linalg.norm(dv); dv=dv/L; q=p-b; sp=float(q@dv); perp=float(np.linalg.norm(q-dv*sp))
    if sp>-0.12 and perp<0.15 and (best is None or perp<best[0]): best=(perp,i,sp)
  if best is None: return []
  b,tp=fingers[s][best[1]]; L=float(np.linalg.norm(tp-b)); u=best[2]/L; wf=float(sm(-0.04,0.1,best[2]))
  w0=1-float(sm(0.28,0.38,u)); w2=float(sm(0.62,0.72,u)); w1=max(0.0,1-w0-w2); nm=f'finger_{s}{best[1]}_'
  return [(nm+'0',wf*w0),(nm+'1',wf*w1),(nm+'2',wf*w2)]
neckW=lambda x,z: float(sm(-1.45,-0.95,z)*(1-sm(0.55,0.85,abs(x))))
for v in range(len(P)):
  p=P[v]; k=comp_of[v]; kd=kind[k]; x,y,z=p
  if kd=='head':
    jy=float(sm(0.68,0.5,y)*sm(-0.1,0.3,z)) if k==face else 0.0
    inMouth=float(sm(0.62,MW,abs(x))) if k==face else 0.0
    if k==face and isLower[v]: jw=inMouth+(1-inMouth)*jy
    elif k==face: jw=(1-inMouth)*jy
    else: jw=0.0
    hw=max(neckW(x,z),float(sm(-1.3,-0.9,z)))   # the back of the head blends into the neck exactly as the neck does
    put(v,[('jaw',jw),('head',(1-jw)*hw)]+[(a,b*(1-jw)*(1-hw)) for a,b in spineW(z)]); continue
  if kd in ('arm','hand'):
    s='R' if (x>0 if kd=='hand' else P[clist[k],0].mean()>0) else 'L'
    base=armW(p,s); fw=fingerW(p,s) if kd=='hand' else []; wf=sum(b for _,b in fw)
    put(v,[(a,b*(1-wf)) for a,b in base]+fw); continue
  # body and legs: the spine by length, the legs blended in toward the back end and outward
  sw=spineW(z); s='R' if x>0 else 'L'
  hb=float(sm(-5.3,-5.9,z)*sm(0.1,0.4,abs(x)))   # the same blend for the legs and the hips they grow from
  ft=float(sm(-6.6,-7.5,z)); hw=neckW(x,z)
  put(v,[(a,b*(1-hb)*(1-hw)) for a,b in sw]+[('head',hw*(1-hb)),('leg_'+s,hb*(1-ft)),('foot_'+s,hb*ft)])
# ripples only on the torso proper, fading out before the neck, the shoulders and the hips so nothing tears there
body=np.array([kind[comp_of[v]]=='body' for v in range(len(P))]); rip=(body*sm(-1.6,-2.3,P[:,2])*sm(-6.1,-5.5,P[:,2])*(1-sm(0.9,1.2,np.abs(P[:,0])))).astype(np.float32)
# ---- write glTF
img=j['images'][0]; open(os.path.join(OUT,'hob_tex0.png'),'wb').write(view(img['bufferView']))
buf=b''; views=[]; accs=[]
def add(arr,target=None,comp=5126,typ='VEC3',minmax=False):
  global buf
  arr=np.ascontiguousarray(arr); b=arr.tobytes(); pad=(-len(buf))%4; buf+=b'\0'*pad; o=len(buf); buf+=b
  v={'buffer':0,'byteOffset':o,'byteLength':len(b)}
  if target: v['target']=target
  views.append(v); a={'bufferView':len(views)-1,'componentType':comp,'count':len(arr),'type':typ}
  if minmax: a['min']=arr.min(0).tolist(); a['max']=arr.max(0).tolist()
  accs.append(a); return len(accs)-1
aP=add(P.astype(np.float32),34962,minmax=True); aN=add(N.astype(np.float32),34962); aUV=add(UV.astype(np.float32),34962,typ='VEC2'); aJ=add(Jt,34962,5123,'VEC4'); aW=add(W,34962,5126,'VEC4')
aB=add(np.stack([rip,np.zeros_like(rip)],1),34962,typ='VEC2'); aI=add(tri.ravel().astype(np.uint32),34963,5125,'SCALAR')
ibm=[]
for nm,p,pos in J: m=np.eye(4,dtype=np.float32); m[:3,3]=-np.array(pos,np.float32); ibm.append(m.T.reshape(-1))
aIBM=add(np.array(ibm,np.float32),None,5126,'MAT4')
nodes=[{'name':'hob','mesh':0,'skin':0}]
for i,(nm,p,pos) in enumerate(J):
  pp=np.zeros(3) if p<0 else np.array(J[p][2]); nodes.append({'name':nm,'translation':(np.array(pos)-pp).tolist()})
for i,(nm,p,pos) in enumerate(J):
  ch=[k+1 for k,(_,pk,_) in enumerate(J) if pk==i]
  if ch: nodes[i+1]['children']=ch
mat=j['materials'][0]; mat.pop('extensions',None)
out={'asset':{'version':'2.0','generator':'Crossed colossus.py, rigged for the Hob preview'},'scene':0,'scenes':[{'nodes':[0,1]}],'nodes':nodes,
 'meshes':[{'name':'hob','primitives':[{'attributes':{'POSITION':aP,'NORMAL':aN,'TEXCOORD_0':aUV,'JOINTS_0':aJ,'WEIGHTS_0':aW,'TEXCOORD_1':aB},'indices':aI,'material':0}]}],
 'skins':[{'joints':list(range(1,len(J)+1)),'inverseBindMatrices':aIBM,'skeleton':1}],
 'materials':[mat],'textures':[{'source':0}],'images':[{'uri':'hob_tex0.png'}],
 'buffers':[{'byteLength':len(buf),'uri':'data:application/octet-stream;base64,'+base64.b64encode(buf).decode()}],'bufferViews':views,'accessors':accs}
os.makedirs(OUT,exist_ok=True)
json.dump(out,open(os.path.join(OUT,'hob_rigged.json'),'w'))
print('joints',len(J),'verts',len(P),'fingers',{s:len(v) for s,v in fingers.items()},'kinds',{k:sum(1 for v in kind.values() if v==k) for k in set(kind.values())})
