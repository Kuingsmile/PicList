### ✨ Features
  
- Optimized the short link processing logic:
  - Now when copying links in the album interface, the same short link will be obtained, instead of reacquiring it each time
  - Now the upload result notification will be displayed correctly when the short link is enabled
  - Now the upload interface will return a short link when the short link is enabled
- Added the option to display preview images using presigned links in the management interface
- Now the image compression quality only allows setting positive integers between 1-100
- Added support for the short link project [Sink](https://github.com/ccbikai/Sink)

### 🐛 Bug Fixes

- Fixed the issue where some options without tooltips in the management page settings interface would still display icons
- Fixed the issue where the download folder could not be modified in the management page
- Fixed the issue where HEIC images could not be converted
