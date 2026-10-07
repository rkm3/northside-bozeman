from pathlib import Path
import numpy as np
from PIL import Image
from skimage.color import rgb2lab

ROOT = Path(__file__).resolve().parents[3]
SOURCES = ROOT / 'design/logo/sources'
BRAND={'rust':'#a62b1d','rust-deep':'#7e2015','ember':'#d96b07','ember-deep':'#a85205','olive':'#5c6f3b','olive-deep':'#46552c','ochre':'#ebaf17','cream':'#fdfbfa','ink':'#2c351f'}
def hex2rgb(h): h=h.lstrip('#'); return np.array([int(h[i:i+2],16) for i in (0,2,4)])
def lab(rgb): return rgb2lab(np.asarray(rgb,float).reshape(-1,1,3)/255).reshape(-1,3)
BG=np.array([247,244,234])
# name -> (source image, crop box x0,y0,x1,y1, boxes to blank out before cropping).
# Blank boxes remove neighbouring logos that poke into the crop.
SRC={'primary':(SOURCES/'logo-sheet-v2.jpg',(600,190,1950,1370),[(0,1200,690,1400)]),
     'badge':(SOURCES/'badge-large-v2.jpg',(560,130,1960,1530),[(0,1150,680,1600)])}
ICON_SRC = SOURCES/'icon-v1.png'
def load(name):
    f,(x0,y0,x1,y1),blanks=SRC[name]
    im=np.asarray(Image.open(f).convert('RGB')).copy()
    for bx0,by0,bx1,by1 in blanks: im[by0:by1,bx0:bx1]=BG
    return im[y0:y1,x0:x1]
