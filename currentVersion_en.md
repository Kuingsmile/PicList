## 🎉 [v3.6.2] Release Notes

This update restores the built-in local file server, introduces a gallery tag system, watermark presets, and random watermarks, and upgrades PicList-Core to v3.1.2, improving stability across uploads, cloud management, and multi-profile workflows.

### ⚠️ Important Changes

- Upgraded runtime and build dependencies. Development and standalone PicList-Core 3.1 CLI and server usage now require Node.js 24.x (at least `24.15.0`) or Node.js 26 and newer.
- Restored the built-in local file server (disabled by default; enable it in Advanced Settings with its own port and folder to serve).

### ✨ New Features

#### 🖼️ Gallery and Image Processing

- Added a tag system for the gallery: create, edit, and batch-manage tags on images, filter and sort by tags (including untagged images), view tags in grid/table/detail views, and sync tags with gallery synchronization.
- Added watermark presets, text placeholders, and random watermark selection: save text or image watermark setups as presets and randomly apply one checked preset per upload; text watermarks now support fixed font sizes (`0` scales proportionally to image width) along with `{filename}` and date/time placeholders.

#### 🌐 Services and Updates

- Restored the built-in local file server: configure the listen address, port, and folder in Advanced Settings, with directory browsing, loopback Host checks, and symlink boundary validation.
- Windows auto-updates now download the full installer directly in one pass, avoiding delays from differential download verification fallbacks.
- Improved URL filename extraction by decoding percent-encoded filenames once while keeping unsafe characters escaped and handling Windows reserved device names.
- Improved upload server port retries and logging, including continuing through the port range when Windows reports `EACCES` on an exclusively bound port.
- Improved image file type detection for dynamic URLs using `wx_fmt` hints, `Content-Type` headers, and magic numbers.
- S3 upload results now include `s3Object` (`bucket` and unencoded `key`) for more reliable downstream deletion and handling.
- Added core support for random watermark presets, fixed font sizes, and text placeholders.

#### 🚀 Performance

- Optimized batch uploads and gallery writes: eliminated redundant byte-by-byte traversal when deep-cloning image `Buffer`s, batched gallery database inserts, and grouped upload recovery journal checkpoints by stage to significantly speed up batch uploads and reduce disk flushes.
- Optimized clipboard monitoring and reading: hashes compressed PNG/JPEG clipboard payloads directly instead of decoding full uncompressed bitmaps to lower idle CPU and memory usage, and verifies clipboard file paths asynchronously with in-flight deduplication and a timeout so slow network shares do not block the main process.
- Optimized Cloud Management transfer task lists: replaced periodic IPC polling with event-driven subscriptions and batched incremental diffs backed by `Map` lookups; progress-only updates stay in memory, writing checkpoints to disk only when recovery-relevant task metadata changes.
- Optimized gallery edits and sync performance: tracks modified records incrementally and caches verified sync revisions so gallery reads and edits only revalidate and recalculate changed entries; sync preview now releases the gallery lock while fetching remote data so local edits remain unblocked.
- Optimized JPEG XL (`.jxl`) previews: offloaded decoding to a pool of background worker threads (with automatic idle cleanup) to keep the UI responsive, and added an LRU preview cache with concurrent request deduplication so reopened images reuse decoded results.
- Optimized application startup: lazy-loads the Cloud Management module on first use, caches portable-mode and data-directory checks.
- Reduced frequent synchronous disk I/O: debounces mini-window position saving until dragging pauses or the window closes (skipping unchanged coordinates), and buffers local log writes into asynchronous batches flushed gracefully on shutdown.

### 🐛 Bug Fixes

#### 📤 Uploads, Gallery, and Settings

- Fixed gallery cloud deletion potentially targeting the wrong S3 key by preferring exact `s3Object` metadata and aligning URL prefix matching.
- Fixed gallery "Copy URL" double-encoding links that were already encoded by PicList-Core.
- Fixed post-upload source file cleanup deleting the completed Local uploader destination file.
- Improved compatibility with the `autoback` plugin by cleaning up leftover temporary upload payloads in the gallery database in a background worker at startup after creating a verified backup.
- Fixed the advanced-rename preview showing an incorrect result for folder-only templates such as `{localFolder}`.
- Prevented saving duplicate profile names for the same uploader (which core rejects at upload) and displayed Profile IDs in the configuration list.
- Fixed desktop startup treating readable configuration files containing comments as broken and deleting them; comments are now supported and truly invalid files are backed up before falling back to defaults.
- Fixed remote settings restore (such as GitHub) reporting success after writing an invalid configuration.
- Fixed fresh Traditional Chinese installations mixing two Chinese language variants between windows.

#### ☁️ Cloud Management

- Fixed an S3 region lookup failure hiding every subsequent bucket, and added clearer feedback for unknown bucket regions and failed list loads.
- Fixed an S3 folder entry blocking its own download.
- Fixed Tencent Cloud COS ignoring the concurrent download limit.
- Fixed disabling folder preservation still creating subdirectories on providers whose filenames contained path separators.
- Fixed a single network error stranding an entire private GitHub download batch.
- Fixed GitHub Storage Manager potentially writing to the wrong repository and distinguished download task IDs across regions/repositories.
- Fixed Storage Manager sending a truncated GitHub upload path.
- Fixed Storage Manager public links truncating object keys containing `#` and double-encoding pre-encoded URLs.
- Fixed Storage Manager batch renaming altering literal `$` sequences in filenames.

#### 🌐 Server and API

- Fixed multipart uploads corrupting properly decoded accented and UTF-8 filenames.
- Fixed split multi-byte UTF-8 characters in JSON upload or delete requests causing the server to miss existing files.
- Fixed "Copy API" generating an unusable endpoint after port fallback or on IPv6/wildcard addresses (`0.0.0.0`, `::`), and added a warning when the upload server is not running.

#### ⚙️ PicList-Core (v3.0.0 → v3.1.2)

- Fixed S3 tolerating `proxy: null` and fixed reading built-in image watermark assets through Node so Electron can load them from `app.asar`.
- Fixed `{localFolder}` as the only rename token breaking local uploads, and fixed filename templates altering literal `$` sequences.
- Fixed generated filenames overwriting other images in the same upload batch.
- Fixed watermarks appearing on only the last animation frame of animated GIFs, and fixed the TUI connection check using a PNG that Sharp could not decode.
- Fixed Qiniu download links losing the portion of an object key after `#`.
- Fixed plugins with `exports`-only entry points failing to load, legacy `ctx.request` compatibility (`baseUrl`, `json: false`, and proxy tunneling), and a broken lifecycle script silently disabling sibling scripts at the same stage.
