# V15 · 立体施工动画升级说明

## 一、改了什么
- **只改动画层**。19 个单元的课文、题目、学习流程（先答后看、次日复测）、localStorage 数据结构（`shizheng-construction-atlas-v1`、`shizheng-recall-v1`）、哈希路由 `#单元/步骤`、语音与视频都保持原样。
- 新增 `assets/v15/anim3d.js`（约 0.8 MB，内含 Three.js r170 与 OrbitControls，已打包到本地，离线可用，不访问任何 CDN）。
- `bundle.js` 只改了 3 处（由 `tools/patch.py` 自动完成）：
  1. 创建 3D 控制器时用 `window.V15Spatial(...)` 包一层：有 v15 模型的单元走新引擎，其余单元回退到原控制器；
  2. 原来只有 17 个单元能打开 3D，现在 `V15Has(id)` 为真的单元也能打开（测量监控、施工管理两单元因此新增 3D）；
  3. 阴影类型改为 PCF，去掉 three 的控制台警告。
- `index.html`：去掉 Cloudflare 挑战脚本；资源版本号统一为 `v=15`；在 bundle.js 前引入 `./assets/v15/anim3d.js?v=15`；版本文字为「V15 · 立体施工 · 看懂再复述」。
- `styles.css`：在原样式后追加 v15 舞台样式（3D 区高度：桌面 clamp(400px,50vw,600px)，手机 min(470px,62svh)）。
- 全部路径都是相对路径，文件名与目录结构跟原站一致（index.html、styles.css、bundle.js、assets/）。

## 二、新 3D 引擎（每个单元都一样）
- 透视相机，可以旋转、缩放、平移（手机上单指旋转，双指缩放或平移），带阻尼；每一步相机自动飞到预设机位，点「复位」回到该机位。
- 逐步播放：沿用原站的上一步、下一步、自动播放、步骤条和进度条；原站的进度 0–1 驱动本步构件的生长、落下、滑入、吊装、退出。
- 当前步新出现的构件会以橙色脉冲高亮；左下角「本步构件」列出这些构件；「控制要点」按钮显示该步原有的 exam.keypoint 和 check 文本。
- 工具：剖切（隐藏观察侧半边，从中间剖开）、透明（地层半透明）、标签、复位。
- 文字来源：舞台上的阶段文字和标签只用原站已有的字符串（原 3D 标签、步骤标题、watch 文本）。**没有新增任何数字或考点。**几何尺寸只是示意，不按比例。
- 性能：手机限制在 30 fps、像素比不超过 1.6；离开视口时暂停渲染。

## 三、已升级单元（19 个，全部完成）
试点：cut-cover（明挖逐层挖撑）、shield（盾构掘进、拼环、注浆）、bridge-cantilever（悬臂浇筑、合龙、体系转换）。
其余：top-down、natm、bridge-pile、bridge-precast、pipe-trenchless、pipe-open、water-tank、road、utility-tunnel、landfill、sponge、renewal、heat-gas、water-process、survey-monitor（新增 3D）、management（新增 3D）。

## 四、怎样扩展或修改一个单元
源码在 `src3d/`（不随站点发布）：
1. 新建 `src3d/lessons/<id>.js`，导出 `{ cams, phases, build(k) }`，可选 `view:{section,xray}`、`fitExp`。
   - `cams[i]`：第 i 步的机位 `{pos, target}`；
   - `phases[i]`：字符串，或 `[[进度, 文字], …]`，文字只能用原站已有的字符串；
   - `build(k)` 里用 `k.box / cyl / ring / tube / profile / strata …` 建模，再用 `k.part(obj, {name, on, off, enter, exit, win, outWin, front, soil, hl, hlSoft})` 登记每个构件的出现和退出时机；`k.label(text, pos, {steps, win})` 放标签；`k.onUpdate((step, p, t) => …)` 做连续动画。
2. 在 `src3d/main.js` 的 `DEFS` 里登记这个单元。
3. 运行 `bash tools/build.sh`（esbuild 打包，再执行 patch.py），用 `tools/shot.js` 截图检查。
