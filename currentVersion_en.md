## 🎉 [v3.6.0] Release Notes

This update brings redesigned pages, improved gallery synchronization and batch operations, improving the reliability of concurrent uploads, image processing, and multiple image hosting configurations.

### ⚠️ Important Changes

- Removed the built-in web upload page and its web server.
- Standalone PicList-Core CLI and server usage now requires Node.js `22.13.0` or later in the `22.x` release line.
- The PicList-Core CLI and server now use `~/.piclist/data.json` as the default configuration file. If it does not exist, an existing `~/.piclist/config.json` is used instead; when both files exist, `data.json` takes precedence.

### 🚀 Performance Improvements

- Optimized startup and page loading by loading pages, editors, and media preview components on demand.
- Reduced memory usage in the gallery and cloud file browser, improving rendering and scrolling for large file lists.
- Optimized gallery batch changes, cloud file listing, and uploads, reducing repeated processing and delays caused by reading entire files synchronously.
- Reduced repeated configuration writes and clipboard polling overhead, and improved upload temporary file cleanup.
- Optimized Imgur uploads by resolving the target album once per batch and stopping the lookup after it is found.

### ✨ New Features

#### 🎨 UI Interface

- Redesigned the gallery, cloud account configuration, and file browsing pages, improving grid/list views, file selection, pagination, and file information dialogs.
- Redesigned image processing settings and rename dialogs, with clearer options for compression, resizing, watermarking, format conversion, and renaming.
- Refreshed the settings, upload task, plugin, script, about, toolbox, navigation, and QR code pages, and unified dropdowns, tooltips, and confirmation dialog styles.
- Added tray upload window support on Windows and improved mini window interactions and presentation.
- Changed the default cloud management sidebar width to `180px` and removed the remote announcement system.

#### 🖼️ Gallery and Synchronization

- Gallery now supports SVG image preview, while non-image files display icons based on their file extensions.
- Gallery synchronization now previews additions, updates, deletions, and conflicts before applying changes. Conflicts can be resolved by keeping the local version, the remote version, or both, and a change summary can be exported.
- Gallery synchronization now creates recovery snapshots and can roll back local changes on failure. Added snapshot retention settings, storage usage display, export, and deletion, with protection for snapshots needed by active synchronization or recovery.
- Batch gallery URL editing and cloud file renaming/moving now support operation previews, conflict handling policies, and retries for failed items.

#### 📤 Uploads and Plugins

- Added custom upload shortcut actions for clipboard or file uploads with a specified image host and configuration, including shortcut status and conflict display.
- Upload progress now distinguishes preparation, transfer, and finalization, with separate progress for primary and secondary image hosts and improved display in the main window, mini window, and upload task page.
- The upload task queue now restores saved state after restart and identifies interrupted tasks. Unfinished post-upload steps can be retried without uploading the file again.
- Added an experimental bundled Node/npm option for installing, updating, and removing plugins without a separate Node.js/npm installation when enabled.
- Plugin discovery now displays weekly npm downloads and supports sorting by relevance, downloads, update time, or name.

#### ☁️ Cloud Management

- Added independent custom link copy formats for individual buckets or repositories, with `$url`, `$fileName`, `$filePath` (full object key), and `$dir` (folder path) placeholders.
- S3 now includes and defaults to the `auto` ACL option, which omits the ACL parameter when uploading for compatibility with buckets that disable ACLs.
- Improved file list loading and cancellation when switching folders or accounts, preventing results from earlier requests from replacing the current view.

#### ⚙️ PicList-Core

- Added an interactive terminal interface and a `picgo init` setup guide for managing uploads, image hosts, image processing, and language settings from the terminal.
- Added and improved CLI support for named configurations, configuration editing, and secondary image host settings. Upload commands now accept `--picbed` and `--configName` to select a destination for the current upload.
- Each upload now has its own image host, configuration, proxy, and temporary file context, preventing interference between concurrent uploads or configuration switches.
- Local and SFTP uploads now write to temporary files before replacing the destination, reducing incomplete files left by interrupted uploads.
- Improved TypeScript compatibility for npm package consumers and the reproducibility of Docker release builds.

### 🐛 Bug Fixes

#### 📤 Uploads and Image Processing

- Fixed silent URL upload failures and repeated uploads of the last file when importing multiple URLs with the same file name.
- Fixed incomplete batch uploads being reported as successful and incorrect deletion of original files after partial or concurrent uploads.
- Fixed GitHub uploads reporting success when a different file already existed at the same path, and incorrect content metadata in S3 Base64/data URI uploads.
- Fixed file names, gallery metadata, and image host configurations being mixed between uploads, along with issues in separate secondary image processing and explicit selection of non-default configurations.
- Fixed preview caches from different local, WebDAV, and SFTP configurations overwriting one another, and cache write failures incorrectly marking successful uploads as failed.
- Fixed per-format conversion overrides not taking effect and same-format JPEG compression ignoring quality settings.
- Fixed HEIC/HEIF output extensions not matching the actual format, failed conversions producing mislabeled files, and EXIF removal compatibility with some HEIF files.
- Fixed invisible image watermarks when opacity was not specified and successful compression results being discarded after watermark initialization failed.
- Fixed SVG passthrough attempting unsupported encoding and removed unsupported output formats from conversion settings.

#### 🖼️ Gallery and Synchronization

- Fixed gallery sorting clearing the selection, along with issues in grid scrolling, positioning, and click interactions.
- Fixed duplicate filename extensions during batch URL editing and the clipboard being overwritten when link formatting failed.
- Fixed failed cloud deletions being reported as successful or still triggering gallery removal scripts.
- Fixed gallery synchronization failing when legacy backup files were missing, and improved synchronization failure and recovery feedback.

#### ☁️ Cloud Management

- Fixed missing signatures, authentication, or 403 errors when previewing or downloading files from S3, OSS, WebDAV, Upyun, Imgur, and SFTP.
- Fixed SFTP folder downloads missing nested files, local image host downloads failing on Windows, and zero-byte files being omitted from listings.
- Fixed uploads targeting the wrong folder, duplicate path separators, and Tencent Cloud COS batch uploads resubmitting earlier files.
- Fixed duplicate download workers after pause/resume, overwritten cancellation states, failed downloads occupying concurrency slots, and completed history blocking later downloads of the same file.
- Fixed renaming files with multiple dots, no extension, or regex characters, and renaming the wrong file after filtering.
- Fixed account edits losing bucket settings, regions, or custom domains, HTTPS domains being downgraded to HTTP, and incorrect configuration imports, validation, and resets.
- Fixed batch pre-signed URL copying returning unsigned links, existing signed URLs being double-encoded, and malformed public URLs for SFTP and local image hosts.
- Fixed incomplete paginated or recursive file listings for S.EE/SM.MS, DogeCloud, and Upyun.
- Fixed authentication for private GitHub folder deletion, AList deletion paths, mixed DogeCloud temporary credentials, and Gitea updates using file information from the wrong branch.

#### ⚙️ Settings, Plugins, and Platform Compatibility

- Fixed active image host configurations not staying in sync after edits, resets, or deletions, saved values being replaced by defaults, duplicate configuration names selecting the wrong profile, and incomplete required-field validation.
- Fixed parsing of scoped or versioned plugin names and names containing dots, and cleaned up handlers left behind after failed plugin registration.
- Fixed plugin settings being read from incorrect paths, missing author information hiding the installed plugin list, and outdated search results overwriting current results.
- Fixed empty script name validation, theme import options, overlapping confirmation dialogs, and stale text after switching languages.
- Fixed Linux AppImage auto-start paths, clipboard file paths containing spaces, and Linux/WSL clipboard helper compatibility.
- Fixed macOS close/minimize shortcuts, mini window reopening and custom icons, offline update checks, and portable update version comparisons.
- Fixed mixed Windows installer and portable packaging settings, along with failures in update fallback and open-directory operations.

#### 🌐 Services and Previews

- Fixed upload API temporary files being created before authentication, improved error feedback for invalid requests and failed deletions, and improved handling of occupied ports, server restarts, and shutdowns.
- Fixed local file preview path access, restricting the service to files inside the preview cache directory and connections from the local machine.
- Fixed remote Markdown previews executing embedded HTML.
- Fixed proxy URLs losing username/password authentication, compatibility with standard Axios proxy settings, and incorrect responses to legacy plugin requests using `json: false`.
