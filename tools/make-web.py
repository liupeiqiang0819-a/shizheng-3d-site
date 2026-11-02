# Build /workspace/sz/web/{core,voice-a,voice-b,video-a,video-b} from v2 for free static hosting (25 MB/site).
import os, shutil, re, sys
SRC='/workspace/sz/v2'; OUT='/workspace/sz/web'; PFX=os.environ.get('SLUGPFX','sz2027')
host=lambda s: f'https://{PFX}-{s}.deed.page/'
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
core=f'{OUT}/core'; shutil.copytree(SRC, core, ignore=shutil.ignore_patterns('voice-trial','videos','atlas-offline-*.zip'))
os.makedirs(f'{core}/assets/videos')
for f in os.listdir(f'{SRC}/assets/videos'):
    if not f.endswith('.mp4'): shutil.copy(f'{SRC}/assets/videos/{f}', f'{core}/assets/videos/{f}')
voices=sorted(os.listdir(f'{SRC}/assets/voice-trial')); half=len(voices)//2
vmap={}
for i,f in enumerate(voices):
    s='voice-a' if i<half else 'voice-b'; d=f'{OUT}/{s}/assets/voice-trial'; os.makedirs(d,exist_ok=True); shutil.copy(f'{SRC}/assets/voice-trial/{f}', d); vmap[f]=s
vids={'bridge-pile.mp4':'video-a','pipe-open.mp4':'video-a','cut-cover.mp4':'video-b','water-tank.mp4':'video-b'}
for f,s in vids.items():
    d=f'{OUT}/{s}/assets/videos'; os.makedirs(d,exist_ok=True); shutil.copy(f'{SRC}/assets/videos/{f}', d)
b=open(f'{core}/bundle.js',encoding='utf-8').read()
for f,s in vmap.items(): b=b.replace(f'"./assets/voice-trial/{f}"', f'"{host(s)}assets/voice-trial/{f}"')
for f,s in vids.items(): b=b.replace(f'"./assets/videos/{f}"', f'"{host(s)}assets/videos/{f}"')
open(f'{core}/bundle.js','w',encoding='utf-8').write(b)
h=open(f'{core}/index.html',encoding='utf-8').read()
h=re.sub(r'href="\./assets/atlas-offline-0([12])\.zip[^"]*"', lambda m: f'href="{host("offline"+m.group(1))}atlas-offline-0{m.group(1)}.zip"', h)
open(f'{core}/index.html','w',encoding='utf-8').write(h)
for n in ('1','2'):
    d=f'{OUT}/offline{n}'; os.makedirs(d); shutil.copy(f'{SRC}/assets/atlas-offline-0{n}.zip', d)
    open(f'{d}/index.html','w').write(f'<meta charset=utf-8><a href="atlas-offline-0{n}.zip">atlas-offline-0{n}.zip</a>')
for s in ('voice-a','voice-b','video-a','video-b'):
    open(f'{OUT}/{s}/index.html','w').write('<meta charset=utf-8>media')
os.system(f'du -sh {OUT}/*')
