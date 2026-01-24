## 🎉 [v3.3.0] Release Notes

### 🚀 Performance Optimization

- Reduced **60-70%** idle memory usage and **20%** memory usage when opening windows.
- Optimized loading speed and browsing performance for multiple pages

### ✨ New Features

#### ⚙️ Core Features

- Now supports manually disabling GPU acceleration to resolve black screen or flickering issues caused by some hardware compatibility.
- Added advanced animation settings for a better UI interaction experience.
- Windows portable mode, no installation required, data is stored in the `data` folder in the program directory, and supports automatic updates.
- Added `rpm` installation package for Linux.
- Added image hosting editing card page to solve confusion when switching multiple configurations.
- Added list mode support for the file browsing page.

#### 🎨 UI Interface

- Integrated theme repository [PicList ThemeHub](https://github.com/Kuingsmile/PicList-ThemeHub), supporting custom downloads.
- Provided 12 built-in themes (such as bilibili, 二次元, 极夜紫 styles).
- Redesigned all pages of the management feature, refactored almost all business pages, and optimized dozens of UI details.
  - Optimized album page card styles, clearer boundaries, and improved selection box visual effects.
  - Optimized the display of multiple pages on narrow screens to avoid content overflow.
  - Supported scrolling to display the full name when the file browsing sidebar name exceeds the width.
- The album page supports displaying the number of selected items, matching URL lists, and remembering filter states.
- Supports browsing the complete plugin list, viewing details, and one-click installation.
- Added a new user guide page that automatically pops up on the first run.

#### 📝 Others

- The original "Management" feature has been renamed to **"Cloud"** to better reflect its actual functionality.
- After resetting the image hosting, it no longer automatically returns to the previous page.

### 🐛 Bug Fixes

- Fixed the issue of abnormal display of the sorting dropdown box on the management page.
- Fixed the issue where the image hosting list on the management page did not correctly highlight the currently selected item.
- Fixed the display issue of the task page in dark mode.
- Fixed the issue where the "Set as Default Image Hosting" button status on the image hosting settings page was not updated in a timely manner.
- Fixed the issue where the independent watermark setting button status on the image hosting was not synchronized in the preprocessing settings page.
- Fixed the issue where bottom elements of some pages were obscured.
