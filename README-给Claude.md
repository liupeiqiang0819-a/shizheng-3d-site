# 一建市政实务 · 3D 施工动画导学 —— 源文件包

线上地址：https://shizheng2027v15-core.deed.page/ （#单元id/步骤号 直达，如 #shield/0）

## 目录
- v2/            当前线上版本的完整成品（本地看：cd v2 && python3 -m http.server 8000）
- src3d/         3D 动画源码（three.js）
  - engine.js    渲染引擎（材质、光影、画质分档、剖切）
  - main.js      入口，挂载到原站
  - lessons/<单元id>.js      各单元基础模型与分步动画
  - lessons/hq/<单元id>.js   精致档的机械和工序细节；hq/lib.js 部件库；hq/index.js 注册
  - v15.css      3D 部分样式
- original/      GPT 做的原站（bundle.js、styles.css、index.html、lessons.json 是文字内容）。构建时以它为底打补丁，不要直接改 v2/bundle.js
- tools/
  - build.sh     构建：esbuild 打包 src3d → v2/assets/v15/anim3d.js，再跑 patch.py
  - patch.py     给原站 bundle/样式打补丁生成 v2（含教材文字修正）
  - declutter.py 删掉"依据…/以…为准/示意/尺寸非比例"这类来源、免责文字
  - smoke.js / qtest.js / shot.js  Playwright 冒烟测试、题目测试、截图
  - make-web.py  拆分站点用于发布（不用管）
- STATUS.md      历次修改记录

## 构建
脚本里写死了路径 /workspace/sz，请改成你的目录，或建软链接 /workspace/sz 指向本文件夹。
需要 Node（npm i esbuild three playwright js-beautify）和 Python3。
  bash tools/build.sh   → 产物在 v2/
视频、语音、离线包已在 v2/assets 里；original/ 省略了这些大文件，build.sh 见 v2/assets/videos 已存在就不会复制。

## 19 个单元 id
cut-cover shield bridge-cantilever top-down natm bridge-pile bridge-precast pipe-trenchless pipe-open water-tank road utility-tunnel landfill sponge renewal heat-gas water-process survey-monitor management

## 交回方式
改完把整个 shizheng-src 文件夹重新打包成 zip（包含 src3d/、tools/、original/ 和重新构建好的 v2/），附一份改动说明（哪个单元第几步、改了什么、依据）。不用部署，发布由另一位助手负责。

## 仓库里省略的大文件
v2/assets 下的 videos/、voice-trial/（配音）和 atlas-offline-*.zip（离线包）体积太大没放进仓库，本地预览时视频和配音会缺，不影响 3D 动画和文字。线上版这些文件由独立的媒体站提供。不要改动这些文件的引用路径。
