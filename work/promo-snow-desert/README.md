# 江南听雪 × 沙海拾光 · 60 秒宣传片

交付文件位于 `outputs/promo/`：

- `little-bloom-snow-desert-60s.mp4`：1080 × 1920，30 fps，60 秒。
- `little-bloom-snow-desert-cover.jpg`：竖屏封面。

14 个镜头前后各占半分钟：江南全景、雪廊、水巷、撑伞小兔、暮色梅园、湖心夜景、雪夜全景；沙海全景、透明浅湾、小骆驼、玫瑰石城、绿洲、月光木乃伊、沙海星夜。

`shots.json` 定义取景、时间、慢速环绕幅度和文案。通过独立构建注入拍摄用相机，每帧推进实际场景 1/30 秒并渲染，避免实时录屏因机器负载产生卡顿。角色、水面、飘雪和天空沿用项目实现；生产页面和线上应用不需要改动。两个全景主镜头各旋转约 24 度，细节镜头作轻微环绕与推进。

`build-studio.mjs` 从现有雪景与沙海源码构建独立录制页；`server.cjs` 仅监听 127.0.0.1:4190；`render.cjs` 录制至 `raw/`。`make-music.py` 生成原创 60 秒双声道配乐；`encode.py` 加入 0.4 秒叠化，输出 H.264/AAC MP4，并完整解码检查 1800 帧、音轨、画面非空和运动。

运行顺序：构建 studio → 启动 server → `render.cjs --preview` 检查取景 → `render.cjs` 正式录制 → `encode.py` 合成。`raw/capture-report.json` 保存逐镜头仿真时间与相机轨迹；`video-report.json` 保存最终验证结果；`contact-sheet.jpg` 用于人工检查所有分镜。

字幕已上移，为手机社交平台底部界面留出空间。录制完成后关闭临时 server。上一支宣传视频仍保留在原文件名下。
