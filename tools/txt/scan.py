import re, json, sys
src=open('/workspace/sz/v2/bundle.js',encoding='utf-8').read()
# double-quoted and backtick-free string literals
pat=re.compile(r'"((?:[^"\\\n]|\\.)*)"')
KW=['依据','为准','教材','机构','待复核','示意','非比例','比例','观察侧','受控','基线','2026','2025','核对','来源','出处','变动表','改动','说明','仅','实际']
out=[]
for m in pat.finditer(src):
    raw=m.group(1)
    if '\\u' not in raw and not re.search(r'[\u4e00-\u9fff]',raw): continue
    try: s=json.loads('"'+raw+'"')
    except Exception: continue
    hits=[k for k in KW if k in s]
    if hits:
        # field name before
        pre=src[max(0,m.start()-25):m.start()]
        out.append((m.start(),pre.replace('\n',' '),s,hits))
print(len(out))
for o in out: print(o[0],'|',o[1][-20:],'|',o[2][:160],'|',','.join(o[3]))
