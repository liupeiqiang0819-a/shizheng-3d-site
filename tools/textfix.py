# 2026-11 复查：残留来源/免责文字清理 + 教材内容修正（在 declutter.py 之后运行，作用于已解码的 v2/bundle.js 与 v2/index.html）
import os, re
ROOT = os.environ.get('SZROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = ROOT + '/v2/'

# ---------------------------------------------------------------- 1. 残留的页码 / 出处 / 免责说明（页面可见字段）
CLEAN = [
    # bridge-precast 第2步：页码出处
    ('trap:"孔道浆体强度口径有差异；必须带条款与设计条件，不可任选一个数。"',
     'trap:"梁体混凝土强度与孔道水泥浆强度是两个指标，分别核查；场内移运与安装吊装的表述也不同，不可任选一个数。"'),
    ('condition:"P82安装条款：先满足设计吊装强度；设计无要求时，一般不低于设计强度75%。"',
     'condition:"安装条款：先满足设计吊装强度；设计无要求时，一般不低于设计强度75%。"'),
    ('condition:"P82安装条款：设计无要求时。P81场内移运条款另有设计强度75%的表述，不能混作同一通则。"',
     'condition:"安装条款，设计无要求时。场内移运条款另有设计强度75%的表述，不能混作同一通则。"'),
    # water-tank 第1步：画法说明
    ('；图示边坡不是通用放坡参数。"', '。"'),
    # cut-cover 第3、4步：页码 / “本书”
    ('trap:"0.3m对应本书软弱饱和土层开挖段落；与P227“200mm人工配合清底”保留各自条件，不合并成一个万能值。"',
     'trap:"0.3m对应软弱饱和土层、机械车辆不易下坑的开挖情形；与接近基底时“200mm人工配合清底”各有条件，不合并成一个万能值。"'),
    ('condition:"P164所述软弱而饱和土层、机械车辆不易下坑的开挖情形。"', 'condition:"软弱而饱和土层、机械车辆不易下坑的开挖情形。"'),
    ('trap:"P227的200mm是该质量控制条文的人工配合清底要求；', 'trap:"200mm是基坑开挖质量控制中的人工配合清底要求；'),
    ('condition:"本书3.8.2基坑开挖质量控制条文；不得超挖或扰动基底土。"', 'condition:"基坑开挖质量控制；不得超挖或扰动基底土。"'),
    ('condition:"本书3.8.2地铁车站明挖结构施工质量控制，混凝土终凝后及时养护。"', 'condition:"地铁车站明挖结构施工质量控制，混凝土终凝后及时养护。"'),
    # top-down / natm / shield：“本书……条文”
    ('condition:"本书盖挖法施工一般规定；', 'condition:"盖挖法施工一般规定；'),
    ('condition:"本书浅埋暗挖二次衬砌泵送混凝土质量控制。"', 'condition:"浅埋暗挖二次衬砌泵送混凝土质量控制。"'),
    ('condition:"本书推进管理测量条文；', 'condition:"推进管理测量；'),
    # utility-tunnel 第6步：讲解与字幕中的资料来源
    ('按已提供的新版对照资料，天然气管道采用钢管', '天然气管道采用钢管'),
    # 动作句里的“依据……”改成“按/根据”
    ('action:"依据设计布置低处滞留区', 'action:"按设计布置低处滞留区'),
    ('action:"依据评估和适用条件选定原位固化方案', 'action:"根据评估和适用条件选定原位固化方案'),
    ('keypoint:"依据缺陷评估与适用条件选法', 'keypoint:"根据缺陷评估与适用条件选法'),
    ('保持贴合压力，依据监测判断固化状态', '保持贴合压力，根据监测判断固化状态'),
    ('action:"依据设计坐标和标高，由控制点测设', 'action:"根据设计坐标和标高，由控制点测设'),
    ('取得变形控制依据。"', '取得变形控制数据。"'),
    # 数字卡：不显示教材章节页码出处（主讲解区的渲染函数；复述弹窗里的那份已由 declutter.py 去掉）
    ('<p class="number-condition">${vt(t.condition)}</p><small>${vt(t.source)}</small></article>', '<p class="number-condition">${vt(t.condition)}</p></article>'),
    # 桩基 2D 剖面说明
    ('"图示首批建立埋深后，连续灌注并保持导管埋入"', '"首批建立埋深后，连续灌注并保持导管埋入"'),
    # 配音状态：不显示“机器复核/待核”
    ('Ke("voiceBadge","本步清甜配音待核 \\xB7 静音")', 'Ke("voiceBadge","本步暂无配音 \\xB7 静音")'),
    ('Ke("voiceBadge",i.voice||"清甜版试听 \\xB7 机器初筛")', 'Ke("voiceBadge",i.voice||"清甜版配音")'),
    # “课程覆盖”弹窗：核查过程与免责段
    ('<p class="study-small">核查日期：${Tm}。出版社公开页面检索未取得可逐页核对的2026全文及完整勘误，不能用“未搜到”证明没有其他变化。当前 114 段清甜版配音均可播放；新增 46 段中 44 段主要经机器复核，另 2 段的指定读音经用户试听确认，尚未对全部讲稿逐段人耳逐字验收，讲解正文、数字卡仍须对照教材。</p>', ''),
]
CLEAN_RE = [
    (r'voice:"清甜版试听 \\xB7 [^"]*"', 'voice:"清甜版配音"'),
]
HTML = [
    ('仅保存在当前浏览器，不代表掌握，也不与聊天练题记录同步。', '仅保存在当前浏览器。'),
    ('仅保存在当前浏览器。不会自动同步设备或本聊天；导入会合并历史，保留首次作答。', '仅保存在当前浏览器，不会自动同步到其他设备；导入会合并历史，保留首次作答。'),
]

# ---------------------------------------------------------------- 2. 教材内容修正与高频考点补充（每条注明单元/步骤）
CONTENT = [
    # bridge-pile 第5步「混凝土从底部上升」：补导管底口距孔底、水下混凝土坍落度（钻孔灌注桩水下混凝土灌注要点）
    ('meaning:"桩顶超灌高度",condition:"高出设计桩顶标高，确保凿除浮浆后桩头质量。",source:"2025教材 第2.2.2节 P71"}]',
     'meaning:"桩顶超灌高度",condition:"高出设计桩顶标高，确保凿除浮浆后桩头质量。",source:"2025教材 第2.2.2节 P71"},'
     '{value:"300～500mm",meaning:"开始灌注时导管底口至孔底的距离",condition:"首批混凝土灌注前的导管就位要求；首批灌注后导管埋深再达到1.0m以上。",source:"2025教材 第2.2.2节 钢筋笼与灌注混凝土施工要点"},'
     '{value:"180～220mm",meaning:"水下混凝土坍落度",condition:"配合比通过试验确定，须具备良好的和易性；灌注必须连续进行。",source:"2025教材 第2.2.2节 钢筋笼与灌注混凝土施工要点"}]'),
    # pipe-open 第5步「按管道类型做试验」：补闭水试验水头、试验管段长度（GB 50268—2008 第9章）
    ('meaning:"闭水试验渗水量观测时间",condition:"达到规定试验水头后计时，持续补水保持试验水头恒定，渗水量不超过允许值。",source:"2025教材 5.1.3 P274"}]',
     'meaning:"闭水试验渗水量观测时间",condition:"达到规定试验水头后计时，持续补水保持试验水头恒定，渗水量不超过允许值。",source:"2025教材 5.1.3 P274"},'
     '{value:"上游管顶内壁＋2m",meaning:"闭水试验的试验水头",condition:"试验段上游设计水头不超过管顶内壁时采用；超过管顶内壁时取上游设计水头＋2m；计算水头小于10m但已超过上游检查井井口时，取上游检查井井口高度。",source:"GB 50268—2008 第9.3节"},'
     '{value:"压力管≤1.0km；无压管≤5个连续井段",meaning:"功能性试验的管段长度",condition:"压力管道水压试验的管段长度不宜大于1.0km；无压管道闭水试验按井距分隔、带井试验，条件允许时可一次试验不超过5个连续井段。",source:"GB 50268—2008 第9.1节"}]'),
    # bridge-cantilever 第3步「两边对称逐段向前」：补悬浇段前端标高控制的考虑因素
    ('keypoint:"两侧对称、平衡逐段悬浇；本段达到条件并完成预应力后，挂篮才能前移。"',
     'keypoint:"两侧对称、平衡逐段悬浇；本段达到条件并完成预应力后，挂篮才能前移。确定悬浇段前端标高时，考虑挂篮前端垂直变形值、预拱度设置、已浇段实际标高和温度影响。"'),
]

log = []
def apply(text, pairs, tag):
    miss = []
    for a, b in pairs:
        n = text.count(a)
        if n == 0: miss.append(a); continue
        text = text.replace(a, b); log.append(f'{tag}\t{n}\t{a[:60]}')
    return text, miss

b = open(V + 'bundle.js', encoding='utf8').read()
b, m1 = apply(b, CLEAN, 'clean')
for pat, rep in CLEAN_RE:
    b, n = re.subn(pat, rep, b); log.append(f'clean-re\t{n}\t{pat}')
b, m2 = apply(b, CONTENT, 'content')
open(V + 'bundle.js', 'w', encoding='utf8').write(b)
h = open(V + 'index.html', encoding='utf8').read()
h, m3 = apply(h, HTML, 'html')
open(V + 'index.html', 'w', encoding='utf8').write(h)
miss = m1 + m2 + m3
open(ROOT + '/tools/txt/textfix.log', 'w', encoding='utf8').write('\n'.join(log) + ('\nMISSING:\n' + '\n'.join(miss) if miss else ''))
print('textfix applied', len(log), 'missing', len(miss))
if miss:
    for x in miss: print('  MISSING:', x[:100])
    raise SystemExit(1)
