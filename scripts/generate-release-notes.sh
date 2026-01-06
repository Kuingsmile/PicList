#!/bin/bash
set -e

VERSION=${1:-$(node -p "require('./package.json').version")}
OUTPUT_FILE=${2:-"release-notes.md"}

if [ ! -f "currentVersion.md" ]; then
    echo "Error: currentVersion.md not found"
    exit 1
fi

if [ ! -f "currentVersion_en.md" ]; then
    echo "Error: currentVersion_en.md not found"
    exit 1
fi

echo "Generating release notes for version $VERSION..."

CN_CONTENT=$(cat currentVersion.md)
EN_CONTENT=$(cat currentVersion_en.md)

cat > "$OUTPUT_FILE" << EOF
# Release v${VERSION}

---

## 📦 Download / 下载

### Windows

[**x64&i386**](https://github.com/Kuingsmile/PicList/releases/download/v${VERSION}/PicList-Setup-${VERSION}.exe) | [**x64**](https://github.com/Kuingsmile/PicList/releases/download/v${VERSION}/PicList-Setup-${VERSION}-x64.exe) | [**i386**](https://github.com/Kuingsmile/PicList/releases/download/v${VERSION}/PicList-${VERSION}-ia32.exe) | [**ARM64**](https://github.com/Kuingsmile/PicList/releases/download/v${VERSION}/PicList-Setup-${VERSION}-arm64.exe)

### macOS

[**ARM64 (M1-M6)**](https://github.com/Kuingsmile/PicList/releases/download/v${VERSION}/PicList-${VERSION}-arm64.dmg) | [**Intel**](https://github.com/Kuingsmile/PicList/releases/download/v${VERSION}/PicList-${VERSION}-x64.dmg)

### Linux

- AppImage:
  [**x64**](https://github.com/Kuingsmile/PicList/releases/download/v${VERSION}/PicList-${VERSION}-x86_64.AppImage) |
  [**ARM64**](https://github.com/Kuingsmile/PicList/releases/download/v${VERSION}/PicList-${VERSION}-arm64.AppImage)
- deb:
  [**x64**](https://github.com/Kuingsmile/PicList/releases/download/v${VERSION}/Piclist-${VERSION}-amd64.deb) |
  [**ARM64**](https://github.com/Kuingsmile/PicList/releases/download/v${VERSION}/Piclist-${VERSION}-arm64.deb)
- snap:
  [**x64**](https://github.com/Kuingsmile/PicList/releases/download/v${VERSION}/Piclist-${VERSION}-amd64.snap)

---

$EN_CONTENT

---

$CN_CONTENT

---

**Full Changelog**: [https://github.com/Kuingsmile/PicList/compare/v${VERSION}...HEAD](https://github.com/Kuingsmile/PicList/compare/v${VERSION}...HEAD)
EOF

echo "Release notes generated successfully: $OUTPUT_FILE"
