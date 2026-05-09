## 🎉 [v3.4.0] Release Notes

### ⚠️ Breaking Changes

- The `uploadPath` setting for the built-in AWS S3 image bed no longer supports placeholders. If you previously used placeholders, please replace them with a fixed path or use the advanced renaming feature to achieve dynamic paths.

### ✨ New Features

- Added a new file scaling setting `longEdgeAsHeight`. When enabled, the long edge is treated as the height for scaling, suitable for handling vertical images.
- Updated the available regions for Alibaba Cloud OSS, Tencent Cloud COS, and Qiniu Cloud, removing deprecated regions and adding new ones.
- Added settings for maximum upload concurrency and upload interval for the Upload API service to prevent excessive concurrent uploads that could put too much pressure on the server or lead to access restrictions by image bed providers.
- The cloud page's SM.MS has migrated to the S.EE platform.
- Optimized the logic for obtaining local file extensions, improving compatibility with special file names.
- Updated the clipboard image acquisition script for Linux.
- Now supports monitoring system clipboard changes when copying files.
- Optimized the opening speed of the main interface in poor network conditions.

### 🐛 Bug Fixes

- Fixed an issue where some text on the cloud page did not change according to the language settings.
- Fixed an issue where images or files on the cloud webdav page could not be previewed.
- Fixed an issue where the value set in the configuration file for the single image bed renaming setting was not correctly updated during updates.
- Fixed an issue where renaming did not take effect in certain cases.
- Fixed an issue where the option to ignore software updates was not correctly saved in some cases.
- Fixed an issue where the conversion process would still occur when the source file format was the same as the conversion format.
- Fixed an issue where the Docker version build did not properly clean the build cache, resulting in a reduced image size of 100MB after the fix.
