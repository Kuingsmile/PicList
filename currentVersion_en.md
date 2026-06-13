## 🎉 [v3.5.0] Release Notes

### ✨ New Features

- Added the `{ulid}` placeholder for advanced renaming, allowing random ULID segments in generated file names.
- Added an image preview thumbnail suffix setting for cloud management. It can append thumbnail parameters to public image previews without changing the original URLs used for copy, download, or delete operations.
- Gallery now supports JXL image preview by converting local or remote JXL files to PNG previews for the gallery list and preview dialog.
- Clipboard upload now recognizes absolute file path text and `file://` URLs from the clipboard, making it possible to upload directly from copied file path text.

### 🐛 Bug Fixes

- Fixed the issue of slow software startup under certain network conditions.
- Fixed the issue in macOS where Typora upload would automatically activate the main interface.
- Fixed compatibility issues when converting to HEIF format.
- Modified the handling of EXIF data to avoid file size anomalies after removal.
- Removed automatic Vue DevTools installation during development startup to avoid startup impact or error logs when installation fails.
