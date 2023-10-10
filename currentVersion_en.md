✨ Features

- Now that the watermark font file path has been set or the image watermark is used, the built-in font file is no longer checked
- The built-in server of PicList and PicList-Core now support uploading image files through `formData`
- PicList-Core now supports starting the built-in upload server through `picgo-server`, and the usage is the same as the built-in server of PicList
- The built-in server now supports setting the authentication key `key` parameter, which is passed in the form of url parameters `?key=xxx` to avoid being maliciously used
- PicList-Core now supports starting the built-in upload server through `picgo-server`, and the usage is the same as the built-in server of PicList

🐛 Bug Fixes

- Fix the problem that the local image bed upload fails due to not creating a new temporary folder
