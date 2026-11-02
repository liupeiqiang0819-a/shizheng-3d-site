# 一建市政 3D 升级 · 进度（最后更新：2026-11-01 09:19 东京时间）

## 线上地址（不用账号，不用密码，长期有效）
- 主站：https://shizheng2027v15-core.deed.page/ （例：#cut-cover/0、#shield/0）
- 媒体分站由主站自动引用：shizheng2027v15-voice-a / -voice-b（语音）、-video-a / -video-b（视频）、-offline1 / -offline2（旧 V14 离线包），域名都是 .deed.page
- 托管在 deed.page 免费版：每个站点上限 25MB，右下角有一个小角标。更新用的 token 存在 ~/.config/deed-page/token（权限 600，不要外泄）。
- 重新部署：`cd /workspace/sz && bash tools/build.sh && rm -rf live && cp -r v2 live && SLUGPFX=shizheng2027v15 python3 tools/make-web.py && cd tools && node publish-large.mjs ../web/core --slug shizheng2027v15-core --client "Grok Bot"`
- 旧的 Netlify 匿名试点（jovial-puffpuff-8aa42a.netlify.app）带密码，且到期未认领会被删除，已作废。

## 已完成（19/19 个单元都换成了 v15 3D）
- 试点：cut-cover、shield、bridge-cantilever
- 其余：top-down、natm、bridge-pile、bridge-precast、pipe-trenchless、pipe-open、water-tank、road、utility-tunnel、landfill、sponge、renewal、heat-gas、water-process、survey-monitor（新增 3D）、management（新增 3D）

## 验证
- 线上冒烟测试：19 个单元都加载了 v15 画布；上一步、下一步、2D/3D 切换、剖切都正常；控制台 0 个错误
- 语音、视频跨站加载：实测可以播放
- 最终截图：screens/final/（27 张以上，含 1280 和 390 两种宽度），控制台 0 个错误

## 交付物
- /workspace/sz/shizheng-v2.zip（约 100MB，结构与原站相同）
- v2/CHANGES.md、v2/给GPT的部署说明.md


## 盾构单元「Spline 风格画质」试点（2026-11-01 08:54 东京时间）
- 预览地址（独立站点，主站未动）：https://shizheng2027v15-preview.deed.page/#shield/0
- 主站 https://shizheng2027v15-core.deed.page/ 仍是上一版（盾构为旧画质）；确认后用同一套 v2 重新发布 core 即可。
- 盾构单元工具栏新增「画质：精致/简洁」切换（记在 localStorage v15-quality）；其他 18 个单元没有这个按钮，渲染参数与之前一致。
- 新文件：src3d/lessons/shield-hq.js（精致模型）；engine.js 增加 hq 材质、圆角几何、PMREM 环境光、PCFSoft 软阴影、SSAO 后期、分档与帧时降级。
- 档位：桌面 high（软阴影 4096 + SSAO，1.5–2 倍渲染）；手机 mid（软阴影 2048，无后期，1.5 倍）；低端手机 low（普通阴影，无后期，1.25 倍）。连续 90 帧平均超过 42ms 时自动降一档。可用 ?v15tier=high|mid|low 强制指定档位。
- 截图：screens/hq/（compare-s1/s3/s4-1280.png 是新旧对比；new-s1…s6-1280.png；new-s3-390 和 new-s4-390 是手机截图）。控制台 0 错误。
- 预览重新部署：`cd /workspace/sz && bash tools/build.sh && rm -rf live && cp -r v2 live && SLUGPFX=shizheng2027v15 python3 tools/make-web.py && cd tools && node publish-large.mjs ../web/core --slug shizheng2027v15-preview --client "Grok Bot"`
- 注意：shizheng-v2.zip 还是上一版，没有包含这次的试点。

## 全部 19 个单元默认开启「精致」画质（2026-11-01 09:19 东京时间）
- 其余 18 个单元直接用自己原来的模型，套上精致材质、柔和光影、圆角、土层渐变，再加画质切换和分档降级。没有新增模型和动作，文字、步骤、数据都不变。默认是「精致」，工具栏可以切回「简洁」。
- 引擎修正：土体纹理改成按世界尺寸铺贴，修好了路基等方块土层纹理被拉成条纹的问题。
- 已发布到预览站 https://shizheng2027v15-preview.deed.page/ 和主站 https://shizheng2027v15-core.deed.page/ 。主站冒烟测试：19/19 个单元都加载了 v15 画布，上一步/下一步/2D/3D/剖切都正常，控制台 0 个错误；画质切换正常。预览站冒烟测试同样 0 个错误。
- 截图：screens/hq-all/（18 张 1280 宽；cut-cover-390 和 natm-390 两张手机截图）。
- shizheng-v2.zip 已按当前 v2 重新打包。
- 主站重新部署：同上面那条命令，把 --slug 改成 shizheng2027v15-core。

## 精细版（逐单元机械+工序动作）进度
- 批次1 完成 2026-11-01 09:47 东京：cut-cover、bridge-cantilever、pipe-trenchless（实体土+剖切）、natm。部件库 src3d/lessons/hq/lib.js，增强文件 src3d/lessons/hq/<id>.js，注册在 hq/index.js。预览+主站已验证 0 报错。
- 批次2 完成 2026-11-01 09:55 东京：top-down、bridge-pile、bridge-precast、pipe-open、utility-tunnel（另：Kit.crane 精致档自动换为塔吊模型；泵车臂架改为搜索式折叠）。预览+主站已验证 0 报错。
- 批次3 完成 2026-11-01 10:01 东京：water-tank、road、heat-gas（实体土+阶梯剖切）、water-process、landfill。预览+主站已验证 0 报错。
- 批次4 完成 2026-11-01 10:10 东京：sponge、renewal、survey-monitor、management（另：common.person/tripod 精致档自动换为精细工人/全站仪）。预览+主站 19 单元 smoke 全部 v15、0 报错，qtest 通过。shizheng-v2.zip 已重新打包。全部 4 批完成。截图：screens/detail/
- 精简修复 2026-11-01 01:22 东京：road（熨平板贴铺层横跨摊铺宽度、剖切时机械走保留半幅、自卸车倒车贴料斗后铰翻斗卸料）、bridge-precast（泵车不放大，改长臂架+避梁约束、车位后移，不穿梁）、renewal（第3步精致档机位拉远+清洗车靠近井口）、natm（凿岩台车按断面放大+双钻臂）、heat-gas（改竖直剖切面+管位区局部透明窗口，细线标窗口范围）、landfill（自卸车翻斗改后铰）。预览+主站 0 报错，zip 已重打。截图 screens/fix/。

## 2026-11-01 01:44 (Tokyo) 教材核对修正 + 说明性文字清理
- landfill：先边坡后场底；坡顶伸缩臂叉装机吊卷材，沿坡自上而下展开，工人随行下移；幅间顺坡搭接、顺坡焊缝；已铺膜压沙袋；场底后铺与坡面衔接。
- renewal：管道上游高、下游低（整体倾 2.6°）；热水由下游井进入、上游端返回锅炉车（CJJ/T 210—2014 §6.4.3 方向）；锅炉车移至下游；清洗喷头自下游井插入向上游推进、向后喷射，污泥回流下游井并吸走。
- natm：第 2 步 开挖后初喷 → 钢架、钢筋网 → 复喷（先网与岩面间、再网间，按拱脚→拱顶分层）。
- bridge-pile：补正循环泥浆泵、胶管、钻杆内下行颗粒及孔壁环空上返。
- 文字清理：tools/declutter.py（由 patch.py 自动调用，188 处）+ src3d 标签/阶段文字 28 处；来源、免责、画法说明删除；章节/教材定位/版本徽标/核对提示改为不显示。日志 tools/txt/declutter.log。
- 截图 screens/textbook/；preview、core 均 19/19 v15、0 errors。

## 2026-11-02 逐单元复查（分支 fix/content-anim-review）
- 构建：tools/build.sh、patch.py、declutter.py、make-web.py 改为按脚本所在目录定位仓库（也可用环境变量 SZROOT 指定），不再写死 /workspace/sz；esbuild 通过 NODE_PATH=tools/node_modules 找 three；original/assets 缺媒体文件时跳过复制。
- 新增 tools/textfix.py（patch.py 在 declutter.py 之后调用）：清理残留页码出处/免责文字、数字卡出处行、配音"机器复核/待核"字样，并补 3 处教材考点；日志 tools/txt/textfix.log。
- 3D 修正：bridge-cantilever 改墩旁塔吊（原履带吊臂穿挂篮）；bridge-precast 墩顶负弯矩束；bridge-pile 凿桩头、钢筋笼不伸出承台、笼式检孔器；pipe-trenchless 扩孔器位于成品管前端；top-down 第1步坑内土半透明看中间柱；起重机隐藏时吊钩一并隐藏；survey-monitor 默认不剖切；renewal 进回水胶管；road 透层油洒布罐车；若干阶段文字去掉"此例/此图/放大演示/已压缩/剖面外"。
- 测试：smoke.js 增加作答后看讲解、等待步号变化；新增 tools/stepwalk.js（每单元下一步走到第6步再上一步）。19/19 单元 v15 画布、逐步前进后退正常、控制台 0 错误；手机 390 宽无横向溢出。
