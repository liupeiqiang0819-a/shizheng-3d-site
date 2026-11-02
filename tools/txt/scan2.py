import re, json
src=open('/workspace/sz/v2/bundle.js',encoding='utf-8').read()
pat=re.compile(r'"((?:[^"\\\n]|\\.)*)"')
KW=['依据','为准','教材','原文','原书','机构','变动表','改动','复核','示意','非比例','比例','观察侧','受控','基线','2026','2025','剖切','剖去','透明','代表性','仅表示','不代表','夸张','画法','本图','图中','本模型','本例','本课','动画','转写','听审']
SKIP={'source','chapter','pages','uncertainty'}
rows=[]
for m in pat.finditer(src):
    pass
    raw=m.group(1)
    try: s=json.loads('"'+raw+'"')
    except Exception: continue
    if not re.search(r'[\u4e00-\u9fff]',s): continue
    pre=src[max(0,m.start()-30):m.start()]
    fm=re.search(r'([A-Za-z_$]+):$',pre)
    f=fm.group(1) if fm else '?'
    if f in SKIP: continue
    hits=[k for k in KW if k in s]
    if hits: rows.append((m.start(),f,s,hits))
for r in rows: print(r[0],r[1],'|',r[2],'|',','.join(r[3]))
