## 🎉 [v2.9.9] Release Notes

This update introduces support for WebDAV configuration synchronization and portable mode, while enhancing security and usability.

### ⚠️ Important Changes

* **Environment Requirement Update**: We have stopped supporting Node.js 16. The **minimum Node.js version required to develop this application is now v18.17.0**.

### ✨ New Features

* **WebDAV Configuration Synchronization**: You can now use WebDAV to synchronize your application configuration across multiple devices.
* **Portable Mode Support**: A portable package has been added, allowing you to run the application without installation for an "out-of-the-box" experience.
* **Skip Image Processing**: You can now set specific file extensions (like `.gif`) to skip all image processing during upload.
* **Enhanced Uploader Support**: Added `webPath` parameter for Tencent Cloud, Alibaba Cloud, and advanced custom image hosts.
* **Broader System Support**: Added support for ArchLinux by updating the core image processing library (sharp).
* **Enhanced LAN Security**: The built-in API service no longer listens on `0.0.0.0` by default, preventing unauthorized access from the local network.

### 🐛 Bug Fixes

* **SM.MS Upload**: Fixed an issue where uploads to the SM.MS image host could fail in certain network environments.
* **WebDAV Default Path**: Fixed an issue with the default value of the `webPath` parameter in the WebDAV uploader.
* **macOS Right-Click Menu**: Fixed an issue where the right-click menu would sometimes disappear on macOS, and the program will now attempt to restore it automatically.
