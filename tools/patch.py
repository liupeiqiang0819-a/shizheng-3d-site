import os as _os
ROOT=_os.environ.get('SZROOT') or _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
import re
O=ROOT+'/original/'; V=ROOT+'/v2/'
b=open(O+'bundle.js',encoding='utf8').read()
a='Pn=u0(Q("spatialHost"))'
assert b.count(a)==1, b.count(a)
b=b.replace(a,'Pn=window.V15Spatial?window.V15Spatial(u0(Q("spatialHost")),Q("spatialHost"),Ls):u0(Q("spatialHost"))')
a2='nu.has(Pt)&&Pn.load(Pt,bt)'
assert b.count(a2)==1, b.count(a2)
b=b.replace(a2,'(nu.has(Pt)||window.V15Has&&window.V15Has(Pt))&&Pn.load(Pt,bt)')
b=b.replace('shadowMap.type=Xc','shadowMap.type=1')
open(V+'bundle.js','w',encoding='utf8').write(b)
h=open(O+'index.html',encoding='utf8').read()
# drop the CDN-injected challenge script (host adds it itself)
i=h.rfind('<script>(function(){function c(){'); j=h.find('</script>',i)
if i>0: h=h[:i]+h[j+9:]
h=h.replace('./styles.css?v=14','./styles.css?v=15').replace('<script src="./bundle.js?v=14" defer></script>','<script src="./assets/v15/anim3d.js?v=15" defer></script>\n<script src="./bundle.js?v=15" defer></script>')
h=h.replace('V14 · 清甜配音 · 看懂再复述','V15 · 立体施工 · 看懂再复述')
assert 'v=15' in h and 'anim3d' in h
open(V+'index.html','w',encoding='utf8').write(h)
css=open(O+'styles.css',encoding='utf8').read()+'\n'+open(ROOT+'/src3d/v15.css',encoding='utf8').read()
open(V+'styles.css','w',encoding='utf8').write(css)
print('patched')
import subprocess; subprocess.run(['python3',ROOT+'/tools/declutter.py'],check=True)
subprocess.run(['python3',ROOT+'/tools/textfix.py'],check=True)
