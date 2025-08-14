## 🎉 [v3.0.0] Release Notes

3.0.0 major version, significant underlying architecture updates and front-end UI rewrite.

### ⚠️ Breaking Changes

- **System Requirements Update**: Support for Windows 7 and Windows 8, as well as macOS Big Sur and earlier versions, has been discontinued.

### ✨ Features

- The underlying Electron version has been updated to v36, and the project has been migrated to Vite.
- A Windows ARM64 architecture installation package has been added.
- The UI has been completely rewritten, with a new light/dark theme switch.
- Album performance has been significantly optimized, now only rendering images within the viewport.
- A new image watermark opacity setting has been added.
- The app navigation bar now supports collapsing.
- The repository list sidebar on the management page now supports drag-and-drop width adjustment.

### 🐛 Bug Fixes

- Fixed a crash issue when deleting images from certain cloud storage providers.
- Fixed an issue where custom paths were not effective when backing up settings using WebDAV.
- Fixed an issue where deletion from S3 cloud storage failed in certain cases (#358).
