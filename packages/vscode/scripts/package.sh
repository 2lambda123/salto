#!/bin/bash
set -xeuo pipefail
shopt -s extglob

mkdir -p ./tmp_pkg && cp ../../LICENSE . && vsce package --yarn -o ./tmp_pkg/salto.vsix && rm -f LICENSE
cd ./tmp_pkg && unzip salto.vsix
cp -r ../node_modules/!(@salto-io) extension/node_modules/
zip -ur salto.vsix extension
cd ..
mkdir -p ./pkg
cp ./tmp_pkg/salto.vsix ./pkg/salto.vsix
rm -rf ./tmp_pkg
