## 🎉 [v3.3.0] Release Notes

This update brings significant memory optimizations, a brand new script extension feature, and a theme system. Additionally, the UI has been comprehensively redesigned and optimized.

### 🚀 Performance Improvements

- Reduced idle memory usage by **60-70%** and memory usage when opening windows by **20%**
- Optimized loading speed and browsing performance on multiple pages

### ✨ New Features

#### 🛠 Script Extensions

Use custom `javascript` scripts to extend PicList's functionality without the need to install a local Node environment, making it lighter and more flexible.

- A brand new script system that supports image hosting upload scripts and various types of general scripts
- Supports running scripts at multiple stages such as before and after uploading, before and after adding/removing albums, meeting more customization needs
- Script management page that supports creating, editing, deleting, and enabling/disabling scripts

#### ⚙️ Core Features

- Now supports editing and saving configuration files within the software
- Advanced custom image hosting now supports script uploads
- Windows portable mode, no installation required, data is stored in the `data` folder in the program directory, and supports automatic updates.
- Added `rpm` installation package for Linux.
- Added image hosting editing card page to resolve confusion when switching multiple configurations.
- Added list mode support to the file browsing page.
- Optimized the configuration saving logic for independent image hosting processing settings.
- Now automatically selects the interface language based on the system language on the first launch.
- Now the main interface will be displayed by default on the first launch of Windows systems.
- Added a 3-second interval when uploading multiple files to GitHub on the management page to avoid triggering GitHub's API rate limits.
- Now supports manually disabling GPU acceleration to resolve black screen or flickering issues caused by some hardware compatibility.
- Added advanced animation settings for a better UI interaction experience when enabled.

#### 🎨 UI Interface

- Redesigned almost all business pages and optimized dozens of UI details.
- Integrated theme repository [PicList ThemeHub](https://github.com/Kuingsmile/PicList-ThemeHub), supporting custom downloads.
- Provided 12 built-in themes (such as bilibili, Anime, purple styles).
- Supports custom theme editing and saving.
- Supports custom background images and their opacity and blur effects.
- Redesigned all pages of the management function
  - Optimized album page card styles, clearer boundaries, improved selection box visual effects.
  - Optimized the display of multiple pages under narrow screens to avoid content overflow.
  - Supported scrolling to display the full name when the file browsing sidebar name exceeds the width.
  - Optimized the display effect of the video playback page.
- The album page supports displaying the number of selected items, the list of matching URLs, and remembering the filter state.
- Optimized the layout distribution of the settings page.
- Supports browsing the complete plugin list, viewing details, and one-click installation.
- Added a new user guide page that automatically pops up on the first run.

#### 📝 Others

- The original "Management" feature has been renamed to **"Cloud"** to better reflect its actual functionality.
- After resetting the image hosting, it no longer automatically returns to the previous page.

### 🐛 Bug Fixes

- Fixed the issue in the image preprocessing settings where variable values were not updated in a timely manner when setting a single image hosting.
- Fixed the issue where the sort dropdown box on the management page displayed abnormally.
- Fixed the issue where the image hosting list on the management page did not correctly highlight the currently selected item.
- Fixed the issue where the markdown preview content on the management page did not render correctly.
- Fixed the display anomaly on the task page in dark mode.
- Fixed the issue where the "Set as Default Image Hosting" button status on the image hosting settings page was not updated in a timely manner.
- Fixed the issue where the button status of the independent watermark setting for image hosting in the preprocessing settings page was not synchronized.
- Fixed the issue where bottom elements on some pages were obscured.
