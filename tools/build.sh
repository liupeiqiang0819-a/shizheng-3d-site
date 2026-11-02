#!/bin/bash
set -e
cd "$(dirname "$0")/.."
O=original; V=v2
mkdir -p $V/assets/v15
# copy original static assets (once)
[ -d $V/assets/videos ] || [ ! -d $O/assets/videos ] || cp -r $O/assets/videos $O/assets/voice-trial $O/assets/atlas-cjk.woff $O/assets/atlas-offline-01.zip $O/assets/atlas-offline-02.zip $V/assets/
# bundle 3D engine
NODE_PATH=tools/node_modules tools/node_modules/.bin/esbuild src3d/main.js --bundle --minify --format=iife --target=es2019 --outfile=$V/assets/v15/anim3d.js --legal-comments=eof --log-level=warning
# patch app bundle
python3 tools/patch.py
