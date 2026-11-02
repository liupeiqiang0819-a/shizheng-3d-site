# 请帮我把网站替换为 V15 立体动画版

附件 shizheng-v2.zip 是 https://shizheng-construction-guide-2027.liupeiqiang0819.chatgpt.site 的升级版，只改了动画，课文、题目、学习流程和本地学习记录格式都没有动。请按下面的步骤，把它原样替换到当前站点：

1. 解压 zip。根目录有 index.html、styles.css、bundle.js 和 assets/ 文件夹，结构跟当前站点一样。
2. 用解压出来的文件覆盖站点根目录里的同名文件：index.html、styles.css、bundle.js。
3. 把 assets/ 整个目录覆盖上去。其中新增了 assets/v15/anim3d.js，一定要上传，3D 动画全靠它。其他资源（videos、voice-trial、atlas-cjk.woff、atlas-offline-01/02.zip）文件名没有变化。
4. 不要改任何文件名或路径。页面全部使用相对路径（./assets/...），版本号统一是 ?v=15，不要再加 CDN 或外部脚本。
5. 不要压缩、合并或重写 bundle.js 和 anim3d.js，原样发布即可。
6. 发布后请检查以下几项：
   - 打开首页，页脚或标题区显示「V15 · 立体施工 · 看懂再复述」；
   - 打开任一单元（比如 #cut-cover/0），3D 区域可以用鼠标或手指旋转、缩放，右上角有「剖切 / 透明 / 标签 / 复位」按钮；点「下一步」时相机会自动转到下一个机位，当前构件会橙色高亮；
   - 浏览器控制台没有报错，assets/v15/anim3d.js?v=15 返回 200；
   - 之前的学习进度和复测记录仍然保留（存在 localStorage 里，键名没变）。
7. 如果页面还是旧版，请清一下缓存，或者确认 index.html 引用的是 ?v=15。

说明：atlas-offline-01.zip 和 atlas-offline-02.zip 仍是旧版（V14）离线包，没有包含新的 3D 动画，请保持原样，不要删除。
