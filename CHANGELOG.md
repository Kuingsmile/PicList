## :tada: 1.9.9 (2023-08-01)


### :sparkles: Features

* add new config item to skip resizing small pictures ([e6b80e8](https://github.com/Kuingsmile/PicList/commit/e6b80e8)), closes [#81](https://github.com/Kuingsmile/PicList/issues/81)
* optimize gallery page UI ([3bf4683](https://github.com/Kuingsmile/PicList/commit/3bf4683))
* option sslenabled of webdav is not required now ([530e30c](https://github.com/Kuingsmile/PicList/commit/530e30c))
* support scale images by fixed width or fixed height ([3cc118e](https://github.com/Kuingsmile/PicList/commit/3cc118e)), closes [#81](https://github.com/Kuingsmile/PicList/issues/81)


### :bug: Bug Fixes

* exclude gif picture from image process pipline ([40efb5d](https://github.com/Kuingsmile/PicList/commit/40efb5d)), closes [#76](https://github.com/Kuingsmile/PicList/issues/76)
* fix an issue of url upload and wechat urls ([baf358d](https://github.com/Kuingsmile/PicList/commit/baf358d)), closes [#80](https://github.com/Kuingsmile/PicList/issues/80)
* fix an issue of webdav and file rename ([3e76ba1](https://github.com/Kuingsmile/PicList/commit/3e76ba1)), closes [#79](https://github.com/Kuingsmile/PicList/issues/79)
* modify gallery page UI ([bce6303](https://github.com/Kuingsmile/PicList/commit/bce6303)), closes [#77](https://github.com/Kuingsmile/PicList/issues/77)



## :tada: 1.9.8 (2023-07-20)


### :sparkles: Features

* add a new config item to close upload result notification ([c1698e8](https://github.com/Kuingsmile/PicList/commit/c1698e8)), closes [#74](https://github.com/Kuingsmile/PicList/issues/74)
* add two new config items to control mini window and main window ([2eff772](https://github.com/Kuingsmile/PicList/commit/2eff772))
* pictures uploaded using webdav and local path can be previewed in gallery now ([6a94503](https://github.com/Kuingsmile/PicList/commit/6a94503)), closes [#64](https://github.com/Kuingsmile/PicList/issues/64)


### :bug: Bug Fixes

* fix a bug of file server when the request path is url encoded ([48b13b2](https://github.com/Kuingsmile/PicList/commit/48b13b2))
* fix an issue related with yourls ([58486a3](https://github.com/Kuingsmile/PicList/commit/58486a3)), closes [#72](https://github.com/Kuingsmile/PicList/issues/72)



## :tada: 1.9.7 (2023-07-12)


### :sparkles: Features

* add a new buildin picbed - local pc ([5018ce7](https://github.com/Kuingsmile/PicList/commit/5018ce7))
* add custom short url server ([d4a22f9](https://github.com/Kuingsmile/PicList/commit/d4a22f9)), closes [#69](https://github.com/Kuingsmile/PicList/issues/69) [#69](https://github.com/Kuingsmile/PicList/issues/69)


### :bug: Bug Fixes

* fix gallery page display bugs ([b6f5d9f](https://github.com/Kuingsmile/PicList/commit/b6f5d9f))
* fix url bug of qiniu ([3b3c70a](https://github.com/Kuingsmile/PicList/commit/3b3c70a)), closes [#70](https://github.com/Kuingsmile/PicList/issues/70)


### :pencil: Documentation

* reopen wechat group ([57bf45f](https://github.com/Kuingsmile/PicList/commit/57bf45f))



## :tada: 1.9.6 (2023-06-30)


### :bug: Bug Fixes

* fix an issue which cause upload failed ([db5a2af](https://github.com/Kuingsmile/PicList/commit/db5a2af)), closes [#66](https://github.com/Kuingsmile/PicList/issues/66)



## :tada: 1.9.5 (2023-06-29)


### :sparkles: Features

* optimize image convert for imgur ([38d03fc](https://github.com/Kuingsmile/PicList/commit/38d03fc))


### :bug: Bug Fixes

* remove gif from extension list which can be converted ([b72cdf4](https://github.com/Kuingsmile/PicList/commit/b72cdf4)), closes [#60](https://github.com/Kuingsmile/PicList/issues/60)


### :package: Chore

* add team id ([f6b4806](https://github.com/Kuingsmile/PicList/commit/f6b4806))
* add team id for notarizing app ([749c66e](https://github.com/Kuingsmile/PicList/commit/749c66e))
* add XCODE_TEAM_ID ([0660218](https://github.com/Kuingsmile/PicList/commit/0660218))
* using notarytool instead of altool which will be disabled on 2023.11.01 ([37ea225](https://github.com/Kuingsmile/PicList/commit/37ea225))



## :tada: 1.9.4 (2023-06-11)


### :sparkles: Features

* mini page will not be closed when main page is opened ([8a19ca2](https://github.com/Kuingsmile/PicList/commit/8a19ca2))


### :bug: Bug Fixes

* fix an issue that clipboard listening is not working in windows ([0800456](https://github.com/Kuingsmile/PicList/commit/0800456))
* fix i18n bug ([0c56de5](https://github.com/Kuingsmile/PicList/commit/0c56de5))


### :package: Chore

* add new action script ([917e69a](https://github.com/Kuingsmile/PicList/commit/917e69a))
* fix send email action ([fe0d779](https://github.com/Kuingsmile/PicList/commit/fe0d779))


### :pencil: Documentation

* chage wechat group ([25b845e](https://github.com/Kuingsmile/PicList/commit/25b845e))
* fix wechat id error ([b971f05](https://github.com/Kuingsmile/PicList/commit/b971f05))



## :tada: 1.9.3 (2023-05-23)


### :sparkles: Features

* add addvanced rename feature ([c4b0235](https://github.com/Kuingsmile/PicList/commit/c4b0235))
* add always on top icon on main page ([8f512fe](https://github.com/Kuingsmile/PicList/commit/8f512fe))
* auto close timestamp rename when advanced rename is enabled ([0c6e8d1](https://github.com/Kuingsmile/PicList/commit/0c6e8d1))
* rewrite the layout of the settings page ([5ccb899](https://github.com/Kuingsmile/PicList/commit/5ccb899))


### :bug: Bug Fixes

* fix batch delete bug of gallery page ([86505c1](https://github.com/Kuingsmile/PicList/commit/86505c1)), closes [#54](https://github.com/Kuingsmile/PicList/issues/54)



## :tada: 1.9.2 (2023-05-21)


### :sparkles: Features

* beautify UI ([e733f6c](https://github.com/Kuingsmile/PicList/commit/e733f6c))
* optimize gallery page and plugin page UI ([0c7f49b](https://github.com/Kuingsmile/PicList/commit/0c7f49b))


### :bug: Bug Fixes

* fix config dialog bug of plugin page ([bd9e33c](https://github.com/Kuingsmile/PicList/commit/bd9e33c))
* fixed the issue where bulk copying links was not functioning properly ([f8a886c](https://github.com/Kuingsmile/PicList/commit/f8a886c))


### :zap: Performance Improvements

* remove talkingdata ([d9d2a84](https://github.com/Kuingsmile/PicList/commit/d9d2a84))



## :tada: 1.9.1 (2023-05-11)


### :sparkles: Features

* add webpath for webdav, fix urlEncode bug ([5628901](https://github.com/Kuingsmile/PicList/commit/5628901))


### :pencil: Documentation

* update docs ([80057c8](https://github.com/Kuingsmile/PicList/commit/80057c8))



# :tada: 1.9.0 (2023-05-07)


### :sparkles: Features

* optimize url encode and filename encode ([8d1b817](https://github.com/Kuingsmile/PicList/commit/8d1b817))


### :bug: Bug Fixes

* fix several bugs of manage page and minipage ([5dbac83](https://github.com/Kuingsmile/PicList/commit/5dbac83))



## :tada: 1.8.4 (2023-05-06)


### :sparkles: Features

* support heic convert now ([b23dfd4](https://github.com/Kuingsmile/PicList/commit/b23dfd4))



## :tada: 1.8.3 (2023-05-06)


### :sparkles: Features

* remember last time choosed sort type ([efd9d54](https://github.com/Kuingsmile/PicList/commit/efd9d54))


### :bug: Bug Fixes

* fix config file sync bug ([344088f](https://github.com/Kuingsmile/PicList/commit/344088f))


### :pencil: Documentation

* modify readme ([d8eea9c](https://github.com/Kuingsmile/PicList/commit/d8eea9c))



## :tada: 1.8.2 (2023-05-05)


### :sparkles: Features

* auto import of manage page can be closed now ([ebcfbdf](https://github.com/Kuingsmile/PicList/commit/ebcfbdf))
* sync with picgo 2.4.0 beta 1 ([e8d54fa](https://github.com/Kuingsmile/PicList/commit/e8d54fa))


### :bug: Bug Fixes

* fix configure files sync bug ([a1981ab](https://github.com/Kuingsmile/PicList/commit/a1981ab))



## :tada: 1.8.1 (2023-05-02)


### :sparkles: Features

* url encode in manage page ([9fa989e](https://github.com/Kuingsmile/PicList/commit/9fa989e))


### :pencil: Documentation

* update Features ([b97f79b](https://github.com/Kuingsmile/PicList/commit/b97f79b))



# :tada: 1.8.0 (2023-05-02)


### :sparkles: Features

* add config sync module ([ab4e31f](https://github.com/Kuingsmile/PicList/commit/ab4e31f))
* add interval for sync setting ([7150bf3](https://github.com/Kuingsmile/PicList/commit/7150bf3))



## :tada: 1.7.1 (2023-04-18)


### :sparkles: Features

* add delete local file after uploading, fix compatibility with auto-delete ([6b49198](https://github.com/Kuingsmile/PicList/commit/6b49198)), closes [#40](https://github.com/Kuingsmile/PicList/issues/40)
* support imgur auth upload and delete ([d5f7121](https://github.com/Kuingsmile/PicList/commit/d5f7121))
* support short url now ([d554581](https://github.com/Kuingsmile/PicList/commit/d554581))


### :bug: Bug Fixes

* fix copy link bug ([72c9374](https://github.com/Kuingsmile/PicList/commit/72c9374))
* fix tray image after drag ([22f8aa8](https://github.com/Kuingsmile/PicList/commit/22f8aa8))
* sync with picgo, suppress epiep error ([dc1458f](https://github.com/Kuingsmile/PicList/commit/dc1458f))


### :package: Chore

* fix markdown format err ([19e341a](https://github.com/Kuingsmile/PicList/commit/19e341a))


### :pencil: Documentation

* update docs ([15d34ac](https://github.com/Kuingsmile/PicList/commit/15d34ac))
* update typora 1.6.0-dev support ([34997f5](https://github.com/Kuingsmile/PicList/commit/34997f5))


### :zap: Performance Improvements

* optimize imgur album list speed ([6c5fdf1](https://github.com/Kuingsmile/PicList/commit/6c5fdf1))
* remove duplicate check of new version, refactor getLatestVersion func ([ef917ce](https://github.com/Kuingsmile/PicList/commit/ef917ce))



# :tada: 1.7.0 (2023-04-12)


### :sparkles: Features

* add clipbord listening menu for mini page ([04d6705](https://github.com/Kuingsmile/PicList/commit/04d6705))


### :bug: Bug Fixes

* fix macos traypage bug ([b20c6d7](https://github.com/Kuingsmile/PicList/commit/b20c6d7))
* mac shortcut bug ([9305293](https://github.com/Kuingsmile/PicList/commit/9305293))


### :package: Chore

* add sha256 calculate script for macos build ([0bf9e91](https://github.com/Kuingsmile/PicList/commit/0bf9e91))
* add sha256 command ([ccafb2d](https://github.com/Kuingsmile/PicList/commit/ccafb2d))



## :tada: 1.6.2 (2023-04-11)


### :sparkles: Features

* add check to avoid hide dock and tray at the same time ([8421925](https://github.com/Kuingsmile/PicList/commit/8421925))
* add config import for picbed setting ([1b15ccb](https://github.com/Kuingsmile/PicList/commit/1b15ccb))
* add config item to hide dock, only for macos ([0466fa7](https://github.com/Kuingsmile/PicList/commit/0466fa7))
* add url encode setting ([8c7c3b2](https://github.com/Kuingsmile/PicList/commit/8c7c3b2))
* automatically upload  when clipboard changes ([3c3e7cd](https://github.com/Kuingsmile/PicList/commit/3c3e7cd)), closes [#35](https://github.com/Kuingsmile/PicList/issues/35)
* on macos, tray icon can be hidden now ([4043dbf](https://github.com/Kuingsmile/PicList/commit/4043dbf))


### :bug: Bug Fixes

* fix repeated upload bug when listening clipboard ([6c18bcb](https://github.com/Kuingsmile/PicList/commit/6c18bcb))
* fix some bugs ([7e0991d](https://github.com/Kuingsmile/PicList/commit/7e0991d))
* hide dock setting for non-darwin os ([fe8112b](https://github.com/Kuingsmile/PicList/commit/fe8112b))


### :package: Chore

* modify link generate script ([9915526](https://github.com/Kuingsmile/PicList/commit/9915526))
* remove unusable console.log ([dce26ff](https://github.com/Kuingsmile/PicList/commit/dce26ff))


### :zap: Performance Improvements

* stop clipboard listening when app quit ([993d2ac](https://github.com/Kuingsmile/PicList/commit/993d2ac))


### :pencil: Documentation

* add homebrew install describe ([350e6a3](https://github.com/Kuingsmile/PicList/commit/350e6a3))



## :tada: 1.6.1 (2023-04-08)


### :bug: Bug Fixes

* fix bug that traypage copy link func not work ([acf6609](https://github.com/Kuingsmile/PicList/commit/acf6609)), closes [#32](https://github.com/Kuingsmile/PicList/issues/32)
* fix tcyun delete bug ([37dfe49](https://github.com/Kuingsmile/PicList/commit/37dfe49))


### :pencil: Documentation

* update FAQ ([d259a01](https://github.com/Kuingsmile/PicList/commit/d259a01))
* update README ([4770fcd](https://github.com/Kuingsmile/PicList/commit/4770fcd))



# :tada: 1.6.0 (2023-04-06)


### :sparkles: Features

* add batch rename , sort and more search options for gallery ([38e48df](https://github.com/Kuingsmile/PicList/commit/38e48df))
* add dock menu and appbar menu ([19e1191](https://github.com/Kuingsmile/PicList/commit/19e1191))
* support auto update now ([e39cac9](https://github.com/Kuingsmile/PicList/commit/e39cac9))
* users can set start mode now, mini window position will be remembered ([76c0cfb](https://github.com/Kuingsmile/PicList/commit/76c0cfb))


### :bug: Bug Fixes

* fix linux build bug caused by sharp ([1dc70e6](https://github.com/Kuingsmile/PicList/commit/1dc70e6)), closes [#29](https://github.com/Kuingsmile/PicList/issues/29)


### :package: Chore

* change macos icon files ([107e8ae](https://github.com/Kuingsmile/PicList/commit/107e8ae))
* modify icon size ([ca950db](https://github.com/Kuingsmile/PicList/commit/ca950db))


### :pencil: Documentation

* update FAQ ([a05fbf6](https://github.com/Kuingsmile/PicList/commit/a05fbf6))



## :tada: 1.5.3 (2023-03-29)


### :bug: Bug Fixes

* fix aliyun upload bug ([ef018ff](https://github.com/Kuingsmile/PicList/commit/ef018ff))


### :pencil: Documentation

* remove from mac app store, and add describe for refund ([1aa133f](https://github.com/Kuingsmile/PicList/commit/1aa133f))



## :tada: 1.5.2 (2023-03-28)


### :sparkles: Features

* add /delete route for build in http server ([9e8ae93](https://github.com/Kuingsmile/PicList/commit/9e8ae93))


### :bug: Bug Fixes

* fix url encode bug when filename contains special chars ([a736190](https://github.com/Kuingsmile/PicList/commit/a736190))



## :tada: 1.5.1 (2023-03-24)


### :sparkles: Features

* optimize UI, rewrite some css settings ([f47d273](https://github.com/Kuingsmile/PicList/commit/f47d273))
* picbeds config can be reseted to empty now ([086b287](https://github.com/Kuingsmile/PicList/commit/086b287))


### :bug: Bug Fixes

* fix backgroud color mismatch problem on MacOS ([f0daf97](https://github.com/Kuingsmile/PicList/commit/f0daf97))



# :tada: 1.5.0 (2023-03-20)


### :sparkles: Features

* click picbed name can link to login page now, add some i18n key ([d725e71](https://github.com/Kuingsmile/PicList/commit/d725e71))
* click the picbed name at upload page will route to config page now ([016075e](https://github.com/Kuingsmile/PicList/commit/016075e))
* complete i18n support for manage func ([a473e25](https://github.com/Kuingsmile/PicList/commit/a473e25))
* i18n of new bucket config ([67fe85e](https://github.com/Kuingsmile/PicList/commit/67fe85e))
* users can customize mini window icon now ([8feb30a](https://github.com/Kuingsmile/PicList/commit/8feb30a))



## :tada: 1.4.3 (2023-03-14)


### :bug: Bug Fixes

* downgrade element-plus , fix picbed setting bug ([d2b048f](https://github.com/Kuingsmile/PicList/commit/d2b048f))
* fix webdav path error when setting to root dir ([1371e95](https://github.com/Kuingsmile/PicList/commit/1371e95))


### :pencil: Documentation

* picList is available at Mac App Store ! ([4613aa3](https://github.com/Kuingsmile/PicList/commit/4613aa3))



## :tada: 1.4.2 (2023-03-09)


### :sparkles: Features

* update piclist-core, reduce package size ([c88dd1d](https://github.com/Kuingsmile/PicList/commit/c88dd1d))


### :bug: Bug Fixes

* fix aliasArray bug ([b027a73](https://github.com/Kuingsmile/PicList/commit/b027a73))
* fix config name validate rule ([f715233](https://github.com/Kuingsmile/PicList/commit/f715233))
* fix sharp build error on MacOS M1 chip ([1240afa](https://github.com/Kuingsmile/PicList/commit/1240afa))


### :package: Chore

* add mas.yml ([198157d](https://github.com/Kuingsmile/PicList/commit/198157d))
* fix main.yml syntax error ([27b92d8](https://github.com/Kuingsmile/PicList/commit/27b92d8))



## :tada: 1.4.1 (2023-03-07)


### :bug: Bug Fixes

* fix config ([040ad5f](https://github.com/Kuingsmile/PicList/commit/040ad5f))
* fix picbed config page scroll bug ([d515cc5](https://github.com/Kuingsmile/PicList/commit/d515cc5))
* mac.yml ([def9502](https://github.com/Kuingsmile/PicList/commit/def9502))


### :package: Chore

* add app sign and for mac, add win ([ab48363](https://github.com/Kuingsmile/PicList/commit/ab48363))
* fix mac.yml ([4a9d646](https://github.com/Kuingsmile/PicList/commit/4a9d646))
* mac auto build test ([ed74764](https://github.com/Kuingsmile/PicList/commit/ed74764))
* mac build test ([bc2749e](https://github.com/Kuingsmile/PicList/commit/bc2749e))
* macos code signing test ([4915290](https://github.com/Kuingsmile/PicList/commit/4915290))
* update mac autoflow ([f4d313f](https://github.com/Kuingsmile/PicList/commit/f4d313f))
* update mac.yml ([b3d8e4d](https://github.com/Kuingsmile/PicList/commit/b3d8e4d))


### :pencil: Documentation

* update README.md ([a2ffd4f](https://github.com/Kuingsmile/PicList/commit/a2ffd4f))



# :tada: 1.4.0 (2023-03-04)


### :sparkles: Features

* add buildin watermark process and image resize/compress/rotate/convert feature ([da42bb4](https://github.com/Kuingsmile/PicList/commit/da42bb4))



## :tada: 1.3.1 (2023-03-02)


### :sparkles: Features

* add {atuo} for rename placholders, represent for auto increment number ([d6df9bc](https://github.com/Kuingsmile/PicList/commit/d6df9bc)), closes [#14](https://github.com/Kuingsmile/PicList/issues/14)
* add file batch rename, and support placeholder now ([327a7ac](https://github.com/Kuingsmile/PicList/commit/327a7ac)), closes [#14](https://github.com/Kuingsmile/PicList/issues/14)
* now prompts if there are duplicate file names ([8ba46d9](https://github.com/Kuingsmile/PicList/commit/8ba46d9))



# :tada: 1.3.0 (2023-02-27)


### :sparkles: Features

* downloaded file or folder can keey folder structure now ([1e9c87d](https://github.com/Kuingsmile/PicList/commit/1e9c87d))
* folder structure can be keeped when uploading folders ([750ea58](https://github.com/Kuingsmile/PicList/commit/750ea58))


### :bug: Bug Fixes

* optimized software UI ([d6ce555](https://github.com/Kuingsmile/PicList/commit/d6ce555)), closes [#12](https://github.com/Kuingsmile/PicList/issues/12)



## :tada: 1.2.2 (2023-02-24)


### :sparkles: Features

* add grid view for file explorer ([69e1b48](https://github.com/Kuingsmile/PicList/commit/69e1b48))



## :tada: 1.2.1 (2023-02-23)


### :sparkles: Features

* add picbed config name in upload page ([0a31143](https://github.com/Kuingsmile/PicList/commit/0a31143))
* configs of picBeds can be auto imported to manage config now ([be68f0f](https://github.com/Kuingsmile/PicList/commit/be68f0f))
* picture upload support webdav now ([1dacd3c](https://github.com/Kuingsmile/PicList/commit/1dacd3c))



# :tada: 1.2.0 (2023-02-22)


### :sparkles: Features

* add concurrency limit for download ([8440b75](https://github.com/Kuingsmile/PicList/commit/8440b75))
* add video,text file and markdown file preview ([b3ce9b9](https://github.com/Kuingsmile/PicList/commit/b3ce9b9))



## :tada: 1.1.1 (2023-02-21)


### :bug: Bug Fixes

* fix auto link copy funtion failure bug when using custom format ([9c96870](https://github.com/Kuingsmile/PicList/commit/9c96870))



# :tada: 1.1.0 (2023-02-20)


### :sparkles: Features

* s3-compatible storage is supported now ([176bdac](https://github.com/Kuingsmile/PicList/commit/176bdac))


### :bug: Bug Fixes

* fix S3 deletion endpoint parse bug ([7f7f400](https://github.com/Kuingsmile/PicList/commit/7f7f400))


### :pencil: Documentation

* update README.md ([0263351](https://github.com/Kuingsmile/PicList/commit/0263351))



## :tada: 1.0.2 (2023-02-17)


### :sparkles: Features

* album remote deletion now Support picgo-plugin-s3 ([21e870d](https://github.com/Kuingsmile/PicList/commit/21e870d))


### :bug: Bug Fixes

* fix qiniu file modified time error ([681da4a](https://github.com/Kuingsmile/PicList/commit/681da4a))


### :pencil: Documentation

* update README.md ([23652d9](https://github.com/Kuingsmile/PicList/commit/23652d9))
* update README.md ([0488ad3](https://github.com/Kuingsmile/PicList/commit/0488ad3))



## :tada: 1.0.1 (2023-02-17)


### :bug: Bug Fixes

* fix proxy setting bug ([22bee0b](https://github.com/Kuingsmile/PicList/commit/22bee0b)), closes [#1](https://github.com/Kuingsmile/PicList/issues/1)



# :tada: 1.0.0 (2023-02-15)


### :sparkles: Features

* first version of PicList ([efeadb8](https://github.com/Kuingsmile/PicList/commit/efeadb8))


### :bug: Bug Fixes

* add new tray icon for macOS dark-mode ([c5adf3b](https://github.com/Kuingsmile/PicList/commit/c5adf3b)), closes [#267](https://github.com/Kuingsmile/PicList/issues/267)
* add plugin install failed notice ([b05139f](https://github.com/Kuingsmile/PicList/commit/b05139f))
* auto-copy option && copy style ([b6e3adb](https://github.com/Kuingsmile/PicList/commit/b6e3adb))
* beforeOpen handler in windows ([cd30a6c](https://github.com/Kuingsmile/PicList/commit/cd30a6c))
* beta version update bug ([18ad542](https://github.com/Kuingsmile/PicList/commit/18ad542))
* bug of gallery db for plugin ([96a63ea](https://github.com/Kuingsmile/PicList/commit/96a63ea))
* build error ([1db84a2](https://github.com/Kuingsmile/PicList/commit/1db84a2))
* busApi event register first && emit later ([e1a0cbb](https://github.com/Kuingsmile/PicList/commit/e1a0cbb))
* change decodeURI -> decodeURIComponent & encode also ([7677f1e](https://github.com/Kuingsmile/PicList/commit/7677f1e))
* choose default picBed failure ([21d3942](https://github.com/Kuingsmile/PicList/commit/21d3942)), closes [#537](https://github.com/Kuingsmile/PicList/issues/537)
* confused port number auto increasing when opening a new PicGo app ([cd70a1a](https://github.com/Kuingsmile/PicList/commit/cd70a1a))
* correct inputbox value && remove listener ([32334e9](https://github.com/Kuingsmile/PicList/commit/32334e9))
* **db:** fix some db bugs ([d3bb5ca](https://github.com/Kuingsmile/PicList/commit/d3bb5ca)), closes [#873](https://github.com/Kuingsmile/PicList/issues/873) [#806](https://github.com/Kuingsmile/PicList/issues/806)
* decrease title-bar z-index when config-form dialog shows ([f2750e1](https://github.com/Kuingsmile/PicList/commit/f2750e1))
* default github placeholder ([51d80a6](https://github.com/Kuingsmile/PicList/commit/51d80a6))
* default picBed using picBed.uploader instead of picBed.current ([0a986c8](https://github.com/Kuingsmile/PicList/commit/0a986c8))
* dev error with install vue-devtools ([a657c51](https://github.com/Kuingsmile/PicList/commit/a657c51)), closes [#653](https://github.com/Kuingsmile/PicList/issues/653) [#658](https://github.com/Kuingsmile/PicList/issues/658)
* disable plugin need reload app ([a1b70b4](https://github.com/Kuingsmile/PicList/commit/a1b70b4))
* disabled plugin won't be shown in plugin page ([33fdb16](https://github.com/Kuingsmile/PicList/commit/33fdb16))
* electron builder actions bug ([5dd6e72](https://github.com/Kuingsmile/PicList/commit/5dd6e72))
* enable plugin should reload ([49e5f34](https://github.com/Kuingsmile/PicList/commit/49e5f34)), closes [#659](https://github.com/Kuingsmile/PicList/issues/659)
* encoding the result of picgo-server ([db71139](https://github.com/Kuingsmile/PicList/commit/db71139))
* enum type error ([4e3fa28](https://github.com/Kuingsmile/PicList/commit/4e3fa28))
* fix analytics value ([06d40ef](https://github.com/Kuingsmile/PicList/commit/06d40ef))
* fix mini-page can't upload image from dragging browser image ([6bcd019](https://github.com/Kuingsmile/PicList/commit/6bcd019)), closes [#822](https://github.com/Kuingsmile/PicList/issues/822)
* gallery db bug ([f1eb7f4](https://github.com/Kuingsmile/PicList/commit/f1eb7f4))
* **gallery:** can't copy gallery pics link ([8d861be](https://github.com/Kuingsmile/PicList/commit/8d861be)), closes [#901](https://github.com/Kuingsmile/PicList/issues/901)
* give a hint when node.js is not installed ([7e86618](https://github.com/Kuingsmile/PicList/commit/7e86618))
* handle empty request-body ([81e6acb](https://github.com/Kuingsmile/PicList/commit/81e6acb))
* handleUploaderConfig should be placed in main/utils ([fc897ce](https://github.com/Kuingsmile/PicList/commit/fc897ce))
* i18n bug ([911e34e](https://github.com/Kuingsmile/PicList/commit/911e34e))
* initialize db bugs ([5f87018](https://github.com/Kuingsmile/PicList/commit/5f87018))
* launch error in new structrue ([bc8e641](https://github.com/Kuingsmile/PicList/commit/bc8e641))
* linux github actions workflow bug ([5cb8151](https://github.com/Kuingsmile/PicList/commit/5cb8151))
* log-level filter bug ([4e02244](https://github.com/Kuingsmile/PicList/commit/4e02244)), closes [#237](https://github.com/Kuingsmile/PicList/issues/237)
* log-level's reset value from 'all' -> ['all'] ([3c6b329](https://github.com/Kuingsmile/PicList/commit/3c6b329)), closes [#240](https://github.com/Kuingsmile/PicList/issues/240) [#237](https://github.com/Kuingsmile/PicList/issues/237)
* macos clipboard image can't show on tray page ([20e38f4](https://github.com/Kuingsmile/PicList/commit/20e38f4)), closes [#961](https://github.com/Kuingsmile/PicList/issues/961)
* macOS tray icon background color bug ([9791ff2](https://github.com/Kuingsmile/PicList/commit/9791ff2)), closes [#970](https://github.com/Kuingsmile/PicList/issues/970)
* mini window drag bug ([34b3656](https://github.com/Kuingsmile/PicList/commit/34b3656))
* mini window hidden bug in linux ([466dbec](https://github.com/Kuingsmile/PicList/commit/466dbec)), closes [#239](https://github.com/Kuingsmile/PicList/issues/239)
* mini window not always on top after reopen ([c79a286](https://github.com/Kuingsmile/PicList/commit/c79a286))
* miniWindow minimize bug ([5f2b7c7](https://github.com/Kuingsmile/PicList/commit/5f2b7c7))
* multiple uploading in the same time will cause output conflict ([06b67e5](https://github.com/Kuingsmile/PicList/commit/06b67e5)), closes [#666](https://github.com/Kuingsmile/PicList/issues/666)
* multiple uploading in the same time will cause rename failed ([12cecc2](https://github.com/Kuingsmile/PicList/commit/12cecc2))
* notification freeze the main-process after uploading with clipboard ([3a50315](https://github.com/Kuingsmile/PicList/commit/3a50315)), closes [#824](https://github.com/Kuingsmile/PicList/issues/824)
* nsis script ([44f5fbb](https://github.com/Kuingsmile/PicList/commit/44f5fbb)), closes [#1019](https://github.com/Kuingsmile/PicList/issues/1019)
* paste url encoding bug ([59d3eba](https://github.com/Kuingsmile/PicList/commit/59d3eba)), closes [#454](https://github.com/Kuingsmile/PicList/issues/454)
* picgo-server upload clipboard file's result bug ([4ebd76f](https://github.com/Kuingsmile/PicList/commit/4ebd76f))
* picgo.log path error ([6b6ae27](https://github.com/Kuingsmile/PicList/commit/6b6ae27)), closes [#819](https://github.com/Kuingsmile/PicList/issues/819)
* plugin config can't save ([09e4e82](https://github.com/Kuingsmile/PicList/commit/09e4e82)), closes [#943](https://github.com/Kuingsmile/PicList/issues/943)
* plugin config-form && default plugin logo ([514fc40](https://github.com/Kuingsmile/PicList/commit/514fc40))
* qiniu area option from select group -> input ([c64959a](https://github.com/Kuingsmile/PicList/commit/c64959a)), closes [#230](https://github.com/Kuingsmile/PicList/issues/230)
* release script ([b4f10c6](https://github.com/Kuingsmile/PicList/commit/b4f10c6))
* releaseUrl may can't get latest version ([ee46ab1](https://github.com/Kuingsmile/PicList/commit/ee46ab1))
* removeById handler error ([c4f0a30](https://github.com/Kuingsmile/PicList/commit/c4f0a30)), closes [#382](https://github.com/Kuingsmile/PicList/issues/382)
* rename page not work ([29a55ed](https://github.com/Kuingsmile/PicList/commit/29a55ed))
* right-click menu upload fails with PicGo open ([96cdfea](https://github.com/Kuingsmile/PicList/commit/96cdfea)), closes [#415](https://github.com/Kuingsmile/PicList/issues/415)
* save debug mode && PICGO_ENV into config file ([c6ead5b](https://github.com/Kuingsmile/PicList/commit/c6ead5b))
* server may never start ([73870a5](https://github.com/Kuingsmile/PicList/commit/73870a5))
* settingPage && miniPage style in windows ([3fd9572](https://github.com/Kuingsmile/PicList/commit/3fd9572))
* settings bug ([20d3cf9](https://github.com/Kuingsmile/PicList/commit/20d3cf9)), closes [#710](https://github.com/Kuingsmile/PicList/issues/710)
* shift key function in gallery page ([5895889](https://github.com/Kuingsmile/PicList/commit/5895889))
* shortkey disabled failure ([4f0809e](https://github.com/Kuingsmile/PicList/commit/4f0809e)), closes [#534](https://github.com/Kuingsmile/PicList/issues/534)
* shortKeyConfig maybe undefined ([7b5e5ef](https://github.com/Kuingsmile/PicList/commit/7b5e5ef)), closes [#557](https://github.com/Kuingsmile/PicList/issues/557)
* showFileExplorer result bug ([b6b2eea](https://github.com/Kuingsmile/PicList/commit/b6b2eea))
* some bugs ([a676c08](https://github.com/Kuingsmile/PicList/commit/a676c08)), closes [#722](https://github.com/Kuingsmile/PicList/issues/722)
* some bugs will case picgo-gui-local.log too large ([012a01d](https://github.com/Kuingsmile/PicList/commit/012a01d)), closes [#995](https://github.com/Kuingsmile/PicList/issues/995)
* some case will cause picgo-gui-local.log too large ([3c01861](https://github.com/Kuingsmile/PicList/commit/3c01861))
* some texts in zh-TW ([#978](https://github.com/Kuingsmile/PicList/issues/978)) ([531bc13](https://github.com/Kuingsmile/PicList/commit/531bc13))
* some win10 upload clipboard image crash ([cc182b0](https://github.com/Kuingsmile/PicList/commit/cc182b0))
* travis-ci bug ([b357dfb](https://github.com/Kuingsmile/PicList/commit/b357dfb))
* upload clipboard images via http should return list ([ae69263](https://github.com/Kuingsmile/PicList/commit/ae69263)), closes [#721](https://github.com/Kuingsmile/PicList/issues/721)
* upload-area can't upload images ([4000cea](https://github.com/Kuingsmile/PicList/commit/4000cea))
* uploader error in linux ([ab762ef](https://github.com/Kuingsmile/PicList/commit/ab762ef)), closes [#627](https://github.com/Kuingsmile/PicList/issues/627)
* upyun options is not required ([167e424](https://github.com/Kuingsmile/PicList/commit/167e424)), closes [#1002](https://github.com/Kuingsmile/PicList/issues/1002)
* url encode before uploading by url ([ce2b5cd](https://github.com/Kuingsmile/PicList/commit/ce2b5cd)), closes [#581](https://github.com/Kuingsmile/PicList/issues/581)
* url encode bug && copy-paste url encode bug ([4de7a1d](https://github.com/Kuingsmile/PicList/commit/4de7a1d)), closes [#996](https://github.com/Kuingsmile/PicList/issues/996)
* url uploader bug ([96544f5](https://github.com/Kuingsmile/PicList/commit/96544f5))
* urlEncode bug when copy ([6c6f847](https://github.com/Kuingsmile/PicList/commit/6c6f847)), closes [#731](https://github.com/Kuingsmile/PicList/issues/731)
* use uploader first ([92022a6](https://github.com/Kuingsmile/PicList/commit/92022a6))
* **website:** website pictures error ([a5b6526](https://github.com/Kuingsmile/PicList/commit/a5b6526))
* windows cli uploading bug ([321e339](https://github.com/Kuingsmile/PicList/commit/321e339)), closes [#657](https://github.com/Kuingsmile/PicList/issues/657)
* windows ia32 && x64 build options ([bdf523a](https://github.com/Kuingsmile/PicList/commit/bdf523a))
* windows upload clipboard file with builtin-clipboard not work ([7b50ba7](https://github.com/Kuingsmile/PicList/commit/7b50ba7))


### :pencil: Documentation

* add brew cask source ([6122e17](https://github.com/Kuingsmile/PicList/commit/6122e17))
* add flutter-picgo ([92ff282](https://github.com/Kuingsmile/PicList/commit/92ff282))
* add gitads ([2d42381](https://github.com/Kuingsmile/PicList/commit/2d42381))
* add note for windows electron mirror ([46a49ed](https://github.com/Kuingsmile/PicList/commit/46a49ed))
* add PicHoro ([a355bc0](https://github.com/Kuingsmile/PicList/commit/a355bc0))
* fix electron_mirror link error ([5d06469](https://github.com/Kuingsmile/PicList/commit/5d06469)), closes [#849](https://github.com/Kuingsmile/PicList/issues/849)
* remove weibo picbed ([e81b8f4](https://github.com/Kuingsmile/PicList/commit/e81b8f4))
* rm gitads ([bb90e17](https://github.com/Kuingsmile/PicList/commit/bb90e17))
* update choco install picgo ([f357557](https://github.com/Kuingsmile/PicList/commit/f357557))
* update cos links ([3102d7b](https://github.com/Kuingsmile/PicList/commit/3102d7b))
* update discussions in doc ([e793599](https://github.com/Kuingsmile/PicList/commit/e793599))
* update docs ([fd7673e](https://github.com/Kuingsmile/PicList/commit/fd7673e))
* update FAQ ([a79efbf](https://github.com/Kuingsmile/PicList/commit/a79efbf))
* update FAQ ([58420c8](https://github.com/Kuingsmile/PicList/commit/58420c8))
* update FAQ && ISSUE_TEMPLATE ([2c57a27](https://github.com/Kuingsmile/PicList/commit/2c57a27))
* update FAQ.md ([#1011](https://github.com/Kuingsmile/PicList/issues/1011)) ([05998bb](https://github.com/Kuingsmile/PicList/commit/05998bb))
* update install command by Homebrew ([#599](https://github.com/Kuingsmile/PicList/issues/599)) ([bd2311b](https://github.com/Kuingsmile/PicList/commit/bd2311b))
* update installation by scoop ([91b397d](https://github.com/Kuingsmile/PicList/commit/91b397d)), closes [#295](https://github.com/Kuingsmile/PicList/issues/295)
* update readme ([6bcda9b](https://github.com/Kuingsmile/PicList/commit/6bcda9b)), closes [#849](https://github.com/Kuingsmile/PicList/issues/849) [#850](https://github.com/Kuingsmile/PicList/issues/850)
* update readme ([1c5880a](https://github.com/Kuingsmile/PicList/commit/1c5880a))
* update readme ([2adff1e](https://github.com/Kuingsmile/PicList/commit/2adff1e))
* update readme ([fb014dd](https://github.com/Kuingsmile/PicList/commit/fb014dd))
* update readme ([1b3522e](https://github.com/Kuingsmile/PicList/commit/1b3522e))
* update README ([f491209](https://github.com/Kuingsmile/PicList/commit/f491209))
* update readme & FAQ ([d438f82](https://github.com/Kuingsmile/PicList/commit/d438f82))
* update readme & FAQ ([746635e](https://github.com/Kuingsmile/PicList/commit/746635e))
* update README.md ([f14c584](https://github.com/Kuingsmile/PicList/commit/f14c584))
* update README.md ([#555](https://github.com/Kuingsmile/PicList/issues/555)) ([2151857](https://github.com/Kuingsmile/PicList/commit/2151857))
* update site ([fe9e19a](https://github.com/Kuingsmile/PicList/commit/fe9e19a))


### :package: Chore

* add issue template ([db6c5b8](https://github.com/Kuingsmile/PicList/commit/db6c5b8))
* add mac-arm64 build support ([f2a4197](https://github.com/Kuingsmile/PicList/commit/f2a4197))
* add main process hot reload ([3fd6e4e](https://github.com/Kuingsmile/PicList/commit/3fd6e4e))
* add picgo bump-version ([37f1d34](https://github.com/Kuingsmile/PicList/commit/37f1d34))
* change travis-ci -> GitHub Actions ([064f37d](https://github.com/Kuingsmile/PicList/commit/064f37d))
* fix eslint error notice in indent ([69e1dc8](https://github.com/Kuingsmile/PicList/commit/69e1dc8))
* fix github action build scripts ([e6b9d88](https://github.com/Kuingsmile/PicList/commit/e6b9d88))
* fix version error ([0a9e169](https://github.com/Kuingsmile/PicList/commit/0a9e169))
* types change ([43d2a8e](https://github.com/Kuingsmile/PicList/commit/43d2a8e))
* up issue template ([5f1fb08](https://github.com/Kuingsmile/PicList/commit/5f1fb08))
* update ci build scripts ([56e814a](https://github.com/Kuingsmile/PicList/commit/56e814a))
* update cos upload url ([86012c0](https://github.com/Kuingsmile/PicList/commit/86012c0))
* update electron from v6 -> v16 ([ea20d3b](https://github.com/Kuingsmile/PicList/commit/ea20d3b))
* update fix-path ([bcaf255](https://github.com/Kuingsmile/PicList/commit/bcaf255)), closes [#774](https://github.com/Kuingsmile/PicList/issues/774)
* update funding url ([024d9cf](https://github.com/Kuingsmile/PicList/commit/024d9cf))
* update macOS tray icon ([87161b3](https://github.com/Kuingsmile/PicList/commit/87161b3))
* update manually action ([351fbda](https://github.com/Kuingsmile/PicList/commit/351fbda))



# :tada: 2.4.0-beta.0 (2023-01-05)


### :sparkles: Features

* add file-name in gallery & add unknown-file-type placholder image ([f0787d3](https://github.com/Molunerfinn/PicGo/commit/f0787d3)), closes [#1050](https://github.com/Molunerfinn/PicGo/issues/1050)
* add file-name in tray-page ([c011654](https://github.com/Molunerfinn/PicGo/commit/c011654)), closes [#1054](https://github.com/Molunerfinn/PicGo/issues/1054)
* support multiple config ([#1016](https://github.com/Molunerfinn/PicGo/issues/1016)) ([9555649](https://github.com/Molunerfinn/PicGo/commit/9555649))


### :bug: Bug Fixes

* handleUploaderConfig should be placed in main/utils ([fc897ce](https://github.com/Molunerfinn/PicGo/commit/fc897ce))
* nsis script ([44f5fbb](https://github.com/Molunerfinn/PicGo/commit/44f5fbb)), closes [#1019](https://github.com/Molunerfinn/PicGo/issues/1019)


### :pencil: Documentation

* update FAQ.md ([#1011](https://github.com/Molunerfinn/PicGo/issues/1011)) ([05998bb](https://github.com/Molunerfinn/PicGo/commit/05998bb))



## :tada: 2.3.1 (2022-11-13)


### :sparkles: Features

* add $extName for paste template ([64e54d0](https://github.com/Molunerfinn/PicGo/commit/64e54d0)), closes [#1000](https://github.com/Molunerfinn/PicGo/issues/1000)


### :bug: Bug Fixes

* upyun options is not required ([167e424](https://github.com/Molunerfinn/PicGo/commit/167e424)), closes [#1002](https://github.com/Molunerfinn/PicGo/issues/1002)



## :tada: 2.3.1-beta.8 (2022-10-30)


### :sparkles: Features

* add remoteNotice ([9317871](https://github.com/Molunerfinn/PicGo/commit/9317871))
* macOS tray icon more clearer ([ecd462f](https://github.com/Molunerfinn/PicGo/commit/ecd462f))


### :bug: Bug Fixes

* url encode bug && copy-paste url encode bug ([4de7a1d](https://github.com/Molunerfinn/PicGo/commit/4de7a1d)), closes [#996](https://github.com/Molunerfinn/PicGo/issues/996)


### :pencil: Documentation

* add PicHoro ([a355bc0](https://github.com/Molunerfinn/PicGo/commit/a355bc0))



## :tada: 2.3.1-beta.7 (2022-10-23)


### :sparkles: Features

* add zh-TW.yml ([#976](https://github.com/Molunerfinn/PicGo/issues/976)) ([72371de](https://github.com/Molunerfinn/PicGo/commit/72371de))


### :bug: Bug Fixes

* change decodeURI -> decodeURIComponent & encode also ([7677f1e](https://github.com/Molunerfinn/PicGo/commit/7677f1e))
* macOS tray icon background color bug ([9791ff2](https://github.com/Molunerfinn/PicGo/commit/9791ff2)), closes [#970](https://github.com/Molunerfinn/PicGo/issues/970)
* some bugs will case picgo-gui-local.log too large ([012a01d](https://github.com/Molunerfinn/PicGo/commit/012a01d)), closes [#995](https://github.com/Molunerfinn/PicGo/issues/995)
* some case will cause picgo-gui-local.log too large ([3c01861](https://github.com/Molunerfinn/PicGo/commit/3c01861))
* some texts in zh-TW ([#978](https://github.com/Molunerfinn/PicGo/issues/978)) ([531bc13](https://github.com/Molunerfinn/PicGo/commit/531bc13))


### :pencil: Documentation

* update readme & FAQ ([d438f82](https://github.com/Molunerfinn/PicGo/commit/d438f82))



## :tada: 2.3.1-beta.6 (2022-09-04)


### :sparkles: Features

* cli support uploading image with url ([e848918](https://github.com/Molunerfinn/PicGo/commit/e848918))
* finish i18n system ([428ffc7](https://github.com/Molunerfinn/PicGo/commit/428ffc7))


### :bug: Bug Fixes

* macos clipboard image can't show on tray page ([20e38f4](https://github.com/Molunerfinn/PicGo/commit/20e38f4)), closes [#961](https://github.com/Molunerfinn/PicGo/issues/961)
* showFileExplorer result bug ([b6b2eea](https://github.com/Molunerfinn/PicGo/commit/b6b2eea))
* windows upload clipboard file with builtin-clipboard not work ([7b50ba7](https://github.com/Molunerfinn/PicGo/commit/7b50ba7))


### :package: Chore

* up issue template ([5f1fb08](https://github.com/Molunerfinn/PicGo/commit/5f1fb08))
* update cos upload url ([86012c0](https://github.com/Molunerfinn/PicGo/commit/86012c0))



## :tada: 2.3.1-beta.5 (2022-08-14)


### :sparkles: Features

* add dist upload to cos & update checkupdate logic ([c926414](https://github.com/Molunerfinn/PicGo/commit/c926414))
* add logFileSizeLimit for log file ([219b367](https://github.com/Molunerfinn/PicGo/commit/219b367)), closes [#935](https://github.com/Molunerfinn/PicGo/issues/935) [#945](https://github.com/Molunerfinn/PicGo/issues/945)
* add server response headers for CORS ([#939](https://github.com/Molunerfinn/PicGo/issues/939)) ([fb69bad](https://github.com/Molunerfinn/PicGo/commit/fb69bad))
* tray-window add open-setting-window button ([83ab3c6](https://github.com/Molunerfinn/PicGo/commit/83ab3c6))
* update tray icon in macOS 11 or 12 ([4ebdc72](https://github.com/Molunerfinn/PicGo/commit/4ebdc72)), closes [#776](https://github.com/Molunerfinn/PicGo/issues/776)


### :bug: Bug Fixes

* build error ([1db84a2](https://github.com/Molunerfinn/PicGo/commit/1db84a2))
* plugin config can't save ([09e4e82](https://github.com/Molunerfinn/PicGo/commit/09e4e82)), closes [#943](https://github.com/Molunerfinn/PicGo/issues/943)


### :package: Chore

* fix github action build scripts ([e6b9d88](https://github.com/Molunerfinn/PicGo/commit/e6b9d88))
* fix version error ([0a9e169](https://github.com/Molunerfinn/PicGo/commit/0a9e169))
* update macOS tray icon ([87161b3](https://github.com/Molunerfinn/PicGo/commit/87161b3))
* update manually action ([351fbda](https://github.com/Molunerfinn/PicGo/commit/351fbda))


### :pencil: Documentation

* update cos links ([3102d7b](https://github.com/Molunerfinn/PicGo/commit/3102d7b))



## :tada: 2.3.1-beta.4 (2022-06-12)


### :bug: Bug Fixes

* **db:** fix some db bugs ([d3bb5ca](https://github.com/Molunerfinn/PicGo/commit/d3bb5ca)), closes [#873](https://github.com/Molunerfinn/PicGo/issues/873) [#806](https://github.com/Molunerfinn/PicGo/issues/806)
* **gallery:** can't copy gallery pics link ([8d861be](https://github.com/Molunerfinn/PicGo/commit/8d861be)), closes [#901](https://github.com/Molunerfinn/PicGo/issues/901)


### :pencil: Documentation

* fix electron_mirror link error ([5d06469](https://github.com/Molunerfinn/PicGo/commit/5d06469)), closes [#849](https://github.com/Molunerfinn/PicGo/issues/849)
* update FAQ ([a79efbf](https://github.com/Molunerfinn/PicGo/commit/a79efbf))
* update readme & FAQ ([746635e](https://github.com/Molunerfinn/PicGo/commit/746635e))


### :package: Chore

* add issue template ([db6c5b8](https://github.com/Molunerfinn/PicGo/commit/db6c5b8))



## :tada: 2.3.1-beta.3 (2022-04-04)


### :sparkles: Features

* add i18n for en ([1936ccf](https://github.com/Molunerfinn/PicGo/commit/1936ccf))
* add tencent-cos options for url ([af291e4](https://github.com/Molunerfinn/PicGo/commit/af291e4)), closes [#862](https://github.com/Molunerfinn/PicGo/issues/862) [#863](https://github.com/Molunerfinn/PicGo/issues/863) [#865](https://github.com/Molunerfinn/PicGo/issues/865) [#524](https://github.com/Molunerfinn/PicGo/issues/524) [#845](https://github.com/Molunerfinn/PicGo/issues/845) [#732](https://github.com/Molunerfinn/PicGo/issues/732)
* add upload-clipboard-image from electron' clipboard ([27628da](https://github.com/Molunerfinn/PicGo/commit/27628da)), closes [#822](https://github.com/Molunerfinn/PicGo/issues/822)
* add wayland support for linux ([f1c8507](https://github.com/Molunerfinn/PicGo/commit/f1c8507))
* click cancel in rename-window will use origin filename now ([04701d4](https://github.com/Molunerfinn/PicGo/commit/04701d4)), closes [#791](https://github.com/Molunerfinn/PicGo/issues/791)


### :bug: Bug Fixes

* fix mini-page can't upload image from dragging browser image ([6bcd019](https://github.com/Molunerfinn/PicGo/commit/6bcd019)), closes [#822](https://github.com/Molunerfinn/PicGo/issues/822)
* mini window not always on top after reopen ([c79a286](https://github.com/Molunerfinn/PicGo/commit/c79a286))
* notification freeze the main-process after uploading with clipboard ([3a50315](https://github.com/Molunerfinn/PicGo/commit/3a50315)), closes [#824](https://github.com/Molunerfinn/PicGo/issues/824)
* picgo.log path error ([6b6ae27](https://github.com/Molunerfinn/PicGo/commit/6b6ae27)), closes [#819](https://github.com/Molunerfinn/PicGo/issues/819)


### :pencil: Documentation

* update readme ([6bcda9b](https://github.com/Molunerfinn/PicGo/commit/6bcda9b)), closes [#849](https://github.com/Molunerfinn/PicGo/issues/849) [#850](https://github.com/Molunerfinn/PicGo/issues/850)


### :package: Chore

* types change ([43d2a8e](https://github.com/Molunerfinn/PicGo/commit/43d2a8e))
* update fix-path ([bcaf255](https://github.com/Molunerfinn/PicGo/commit/bcaf255)), closes [#774](https://github.com/Molunerfinn/PicGo/issues/774)



## :tada: 2.3.1-beta.2 (2022-01-06)


### :bug: Bug Fixes

* electron builder actions bug ([5dd6e72](https://github.com/Molunerfinn/PicGo/commit/5dd6e72))
* linux github actions workflow bug ([5cb8151](https://github.com/Molunerfinn/PicGo/commit/5cb8151))



## :tada: 2.3.1-beta.1 (2022-01-05)


### :package: Chore

* update ci build scripts ([56e814a](https://github.com/Molunerfinn/PicGo/commit/56e814a))



## :tada: 2.3.1-beta.0 (2022-01-05)


### :bug: Bug Fixes

* mini window drag bug ([34b3656](https://github.com/Molunerfinn/PicGo/commit/34b3656))


### :package: Chore

* add mac-arm64 build support ([f2a4197](https://github.com/Molunerfinn/PicGo/commit/f2a4197))
* update electron from v6 -> v16 ([ea20d3b](https://github.com/Molunerfinn/PicGo/commit/ea20d3b))



# :tada: 2.3.0 (2021-09-11)


### :sparkles: Features

* add open devtool option ([75e3edc](https://github.com/Molunerfinn/PicGo/commit/75e3edc))


### :bug: Bug Fixes

* shift key function in gallery page ([5895889](https://github.com/Molunerfinn/PicGo/commit/5895889))
* some bugs ([a676c08](https://github.com/Molunerfinn/PicGo/commit/a676c08)), closes [#722](https://github.com/Molunerfinn/PicGo/issues/722)
* urlEncode bug when copy ([6c6f847](https://github.com/Molunerfinn/PicGo/commit/6c6f847)), closes [#731](https://github.com/Molunerfinn/PicGo/issues/731)


### :pencil: Documentation

* update FAQ ([58420c8](https://github.com/Molunerfinn/PicGo/commit/58420c8))



# :tada: 2.3.0-beta.8 (2021-08-13)


### :bug: Bug Fixes

* settings bug ([20d3cf9](https://github.com/Molunerfinn/PicGo/commit/20d3cf9)), closes [#710](https://github.com/Molunerfinn/PicGo/issues/710)
* upload clipboard images via http should return list ([ae69263](https://github.com/Molunerfinn/PicGo/commit/ae69263)), closes [#721](https://github.com/Molunerfinn/PicGo/issues/721)



# :tada: 2.3.0-beta.7 (2021-08-01)


### :sparkles: Features

* add gallery db ([6ddd660](https://github.com/Molunerfinn/PicGo/commit/6ddd660))
* add win32 support ([1657542](https://github.com/Molunerfinn/PicGo/commit/1657542)), closes [#632](https://github.com/Molunerfinn/PicGo/issues/632)
* finish custom config path ([7030f7a](https://github.com/Molunerfinn/PicGo/commit/7030f7a)), closes [#255](https://github.com/Molunerfinn/PicGo/issues/255)


### :bug: Bug Fixes

* bug of gallery db for plugin ([96a63ea](https://github.com/Molunerfinn/PicGo/commit/96a63ea))
* enable plugin should reload ([49e5f34](https://github.com/Molunerfinn/PicGo/commit/49e5f34)), closes [#659](https://github.com/Molunerfinn/PicGo/issues/659)
* gallery db bug ([f1eb7f4](https://github.com/Molunerfinn/PicGo/commit/f1eb7f4))
* multiple uploading in the same time will cause output conflict ([06b67e5](https://github.com/Molunerfinn/PicGo/commit/06b67e5)), closes [#666](https://github.com/Molunerfinn/PicGo/issues/666)
* multiple uploading in the same time will cause rename failed ([12cecc2](https://github.com/Molunerfinn/PicGo/commit/12cecc2))
* uploader error in linux ([ab762ef](https://github.com/Molunerfinn/PicGo/commit/ab762ef)), closes [#627](https://github.com/Molunerfinn/PicGo/issues/627)
* use uploader first ([92022a6](https://github.com/Molunerfinn/PicGo/commit/92022a6))
* windows ia32 && x64 build options ([bdf523a](https://github.com/Molunerfinn/PicGo/commit/bdf523a))



# :tada: 2.3.0-beta.6 (2021-04-24)


### :sparkles: Features

* add baidu tongji for analytics ([f536391](https://github.com/Molunerfinn/PicGo/commit/f536391))
* add logs for picgo-server ([2d9e9c0](https://github.com/Molunerfinn/PicGo/commit/2d9e9c0)), closes [#627](https://github.com/Molunerfinn/PicGo/issues/627)
* add privacy policy ([992ff35](https://github.com/Molunerfinn/PicGo/commit/992ff35))


### :bug: Bug Fixes

* add plugin install failed notice ([b05139f](https://github.com/Molunerfinn/PicGo/commit/b05139f))
* default picBed using picBed.uploader instead of picBed.current ([0a986c8](https://github.com/Molunerfinn/PicGo/commit/0a986c8))
* dev error with install vue-devtools ([a657c51](https://github.com/Molunerfinn/PicGo/commit/a657c51)), closes [#653](https://github.com/Molunerfinn/PicGo/issues/653) [#658](https://github.com/Molunerfinn/PicGo/issues/658)
* disable plugin need reload app ([a1b70b4](https://github.com/Molunerfinn/PicGo/commit/a1b70b4))
* fix analytics value ([06d40ef](https://github.com/Molunerfinn/PicGo/commit/06d40ef))
* windows cli uploading bug ([321e339](https://github.com/Molunerfinn/PicGo/commit/321e339)), closes [#657](https://github.com/Molunerfinn/PicGo/issues/657)


### :package: Chore

* add main process hot reload ([3fd6e4e](https://github.com/Molunerfinn/PicGo/commit/3fd6e4e))
* fix eslint error notice in indent ([69e1dc8](https://github.com/Molunerfinn/PicGo/commit/69e1dc8))



# :tada: 2.3.0-beta.5 (2021-04-04)


### :sparkles: Features

* add local plugin support && npm registry/proxy support ([f0e1fa1](https://github.com/Molunerfinn/PicGo/commit/f0e1fa1))
* 为Linux系统适配桌面图标栏（Tray） ([#603](https://github.com/Molunerfinn/PicGo/issues/603)) ([0fe3ade](https://github.com/Molunerfinn/PicGo/commit/0fe3ade))


### :bug: Bug Fixes

* default github placeholder ([51d80a6](https://github.com/Molunerfinn/PicGo/commit/51d80a6))


### :package: Chore

* change travis-ci -> GitHub Actions ([064f37d](https://github.com/Molunerfinn/PicGo/commit/064f37d))



# :tada: 2.3.0-beta.4 (2020-12-19)


### :sparkles: Features

* add global value for PicGo get GUI_VERSION & CORE_VERSION ([eab014d](https://github.com/Molunerfinn/PicGo/commit/eab014d))
* **config:** auto configuration backup & fallback to avoid main process crash ([32b8b97](https://github.com/Molunerfinn/PicGo/commit/32b8b97)), closes [#568](https://github.com/Molunerfinn/PicGo/issues/568)


### :bug: Bug Fixes

* disabled plugin won't be shown in plugin page ([33fdb16](https://github.com/Molunerfinn/PicGo/commit/33fdb16))
* shortKeyConfig maybe undefined ([7b5e5ef](https://github.com/Molunerfinn/PicGo/commit/7b5e5ef)), closes [#557](https://github.com/Molunerfinn/PicGo/issues/557)
* url encode before uploading by url ([ce2b5cd](https://github.com/Molunerfinn/PicGo/commit/ce2b5cd)), closes [#581](https://github.com/Molunerfinn/PicGo/issues/581)


### :pencil: Documentation

* add flutter-picgo ([92ff282](https://github.com/Molunerfinn/PicGo/commit/92ff282))
* add gitads ([2d42381](https://github.com/Molunerfinn/PicGo/commit/2d42381))
* rm gitads ([bb90e17](https://github.com/Molunerfinn/PicGo/commit/bb90e17))
* update discussions in doc ([e793599](https://github.com/Molunerfinn/PicGo/commit/e793599))
* update install command by Homebrew ([#599](https://github.com/Molunerfinn/PicGo/issues/599)) ([bd2311b](https://github.com/Molunerfinn/PicGo/commit/bd2311b))
* update README.md ([#555](https://github.com/Molunerfinn/PicGo/issues/555)) ([2151857](https://github.com/Molunerfinn/PicGo/commit/2151857))



# :tada: 2.3.0-beta.3 (2020-07-12)


### :bug: Bug Fixes

* choose default picBed failure ([21d3942](https://github.com/Molunerfinn/PicGo/commit/21d3942)), closes [#537](https://github.com/Molunerfinn/PicGo/issues/537)
* shortkey disabled failure ([4f0809e](https://github.com/Molunerfinn/PicGo/commit/4f0809e)), closes [#534](https://github.com/Molunerfinn/PicGo/issues/534)



# :tada: 2.3.0-beta.2 (2020-07-12)


### :sparkles: Features

* add qrcode for picbeds' config ([7fabc47](https://github.com/Molunerfinn/PicGo/commit/7fabc47))


### :bug: Bug Fixes

* encoding the result of picgo-server ([db71139](https://github.com/Molunerfinn/PicGo/commit/db71139))
* initialize db bugs ([5f87018](https://github.com/Molunerfinn/PicGo/commit/5f87018))


### :pencil: Documentation

* update readme ([1c5880a](https://github.com/Molunerfinn/PicGo/commit/1c5880a))



# :tada: 2.3.0-beta.1 (2020-06-28)


### :bug: Bug Fixes

* auto-copy option && copy style ([b6e3adb](https://github.com/Molunerfinn/PicGo/commit/b6e3adb))
* beta version update bug ([18ad542](https://github.com/Molunerfinn/PicGo/commit/18ad542))
* paste url encoding bug ([59d3eba](https://github.com/Molunerfinn/PicGo/commit/59d3eba)), closes [#454](https://github.com/Molunerfinn/PicGo/issues/454)


### :pencil: Documentation

* update FAQ && ISSUE_TEMPLATE ([2c57a27](https://github.com/Molunerfinn/PicGo/commit/2c57a27))
* update readme ([2adff1e](https://github.com/Molunerfinn/PicGo/commit/2adff1e))



# :tada: 2.3.0-beta.0 (2020-04-30)


### :sparkles: Features

* add autoCopy option for users to use or not ([67e526f](https://github.com/Molunerfinn/PicGo/commit/67e526f))
* add beta-version update support ([ad6acd8](https://github.com/Molunerfinn/PicGo/commit/ad6acd8))
* add smms-v2 support ([3f3ea69](https://github.com/Molunerfinn/PicGo/commit/3f3ea69))
* add uploading image from URL support ([a28c678](https://github.com/Molunerfinn/PicGo/commit/a28c678))
* finish all-select && shift multi-select ([2aeca50](https://github.com/Molunerfinn/PicGo/commit/2aeca50)), closes [#342](https://github.com/Molunerfinn/PicGo/issues/342)


### :bug: Bug Fixes

* confused port number auto increasing when opening a new PicGo app ([cd70a1a](https://github.com/Molunerfinn/PicGo/commit/cd70a1a))
* correct inputbox value && remove listener ([32334e9](https://github.com/Molunerfinn/PicGo/commit/32334e9))
* give a hint when node.js is not installed ([7e86618](https://github.com/Molunerfinn/PicGo/commit/7e86618))
* right-click menu upload fails with PicGo open ([96cdfea](https://github.com/Molunerfinn/PicGo/commit/96cdfea)), closes [#415](https://github.com/Molunerfinn/PicGo/issues/415)
* some win10 upload clipboard image crash ([cc182b0](https://github.com/Molunerfinn/PicGo/commit/cc182b0))
* travis-ci bug ([b357dfb](https://github.com/Molunerfinn/PicGo/commit/b357dfb))
* url uploader bug ([96544f5](https://github.com/Molunerfinn/PicGo/commit/96544f5))


### :pencil: Documentation

* update choco install picgo ([f357557](https://github.com/Molunerfinn/PicGo/commit/f357557))
* update docs ([fd7673e](https://github.com/Molunerfinn/PicGo/commit/fd7673e))
* update readme ([fb014dd](https://github.com/Molunerfinn/PicGo/commit/fb014dd))


### :package: Chore

* update funding url ([024d9cf](https://github.com/Molunerfinn/PicGo/commit/024d9cf))



## :tada: 2.2.2 (2020-01-20)


### :bug: Bug Fixes

* picgo-server upload clipboard file's result bug ([4ebd76f](https://github.com/Molunerfinn/PicGo/commit/4ebd76f))
* releaseUrl may can't get latest version ([ee46ab1](https://github.com/Molunerfinn/PicGo/commit/ee46ab1))



## :tada: 2.2.1 (2020-01-09)


### :sparkles: Features

* add alias for plugin config name ([5a06483](https://github.com/Molunerfinn/PicGo/commit/5a06483))
* add aliyun oss options ([a33f1ad](https://github.com/Molunerfinn/PicGo/commit/a33f1ad)), closes [#347](https://github.com/Molunerfinn/PicGo/issues/347)
* **server:** add http server for uploading images by a http request ([c56d4ef](https://github.com/Molunerfinn/PicGo/commit/c56d4ef))
* add server config settings ([6b57cf7](https://github.com/Molunerfinn/PicGo/commit/6b57cf7))
* only shows visible pic-beds ([9d4d605](https://github.com/Molunerfinn/PicGo/commit/9d4d605)), closes [#310](https://github.com/Molunerfinn/PicGo/issues/310)


### :bug: Bug Fixes

* decrease title-bar z-index when config-form dialog shows ([f2750e1](https://github.com/Molunerfinn/PicGo/commit/f2750e1))
* **website:** website pictures error ([a5b6526](https://github.com/Molunerfinn/PicGo/commit/a5b6526))
* add new tray icon for macOS dark-mode ([c5adf3b](https://github.com/Molunerfinn/PicGo/commit/c5adf3b)), closes [#267](https://github.com/Molunerfinn/PicGo/issues/267)
* beforeOpen handler in windows ([cd30a6c](https://github.com/Molunerfinn/PicGo/commit/cd30a6c))
* busApi event register first && emit later ([e1a0cbb](https://github.com/Molunerfinn/PicGo/commit/e1a0cbb))
* enum type error ([4e3fa28](https://github.com/Molunerfinn/PicGo/commit/4e3fa28))
* handle empty request-body ([81e6acb](https://github.com/Molunerfinn/PicGo/commit/81e6acb))
* launch error in new structrue ([bc8e641](https://github.com/Molunerfinn/PicGo/commit/bc8e641))
* miniWindow minimize bug ([5f2b7c7](https://github.com/Molunerfinn/PicGo/commit/5f2b7c7))
* plugin config-form && default plugin logo ([514fc40](https://github.com/Molunerfinn/PicGo/commit/514fc40))
* release script ([b4f10c6](https://github.com/Molunerfinn/PicGo/commit/b4f10c6))
* removeById handler error ([c4f0a30](https://github.com/Molunerfinn/PicGo/commit/c4f0a30)), closes [#382](https://github.com/Molunerfinn/PicGo/issues/382)
* rename page not work ([29a55ed](https://github.com/Molunerfinn/PicGo/commit/29a55ed))
* save debug mode && PICGO_ENV into config file ([c6ead5b](https://github.com/Molunerfinn/PicGo/commit/c6ead5b))
* server may never start ([73870a5](https://github.com/Molunerfinn/PicGo/commit/73870a5))
* settingPage && miniPage style in windows ([3fd9572](https://github.com/Molunerfinn/PicGo/commit/3fd9572))


### :pencil: Documentation

* add note for windows electron mirror ([46a49ed](https://github.com/Molunerfinn/PicGo/commit/46a49ed))
* remove weibo picbed ([e81b8f4](https://github.com/Molunerfinn/PicGo/commit/e81b8f4))
* update installation by scoop ([91b397d](https://github.com/Molunerfinn/PicGo/commit/91b397d)), closes [#295](https://github.com/Molunerfinn/PicGo/issues/295)
* update readme ([1b3522e](https://github.com/Molunerfinn/PicGo/commit/1b3522e))
* update README ([f491209](https://github.com/Molunerfinn/PicGo/commit/f491209))
* update site ([fe9e19a](https://github.com/Molunerfinn/PicGo/commit/fe9e19a))



# :tada: 2.2.0 (2020-01-01)


### :sparkles: Features

* add alias for plugin config name ([5a06483](https://github.com/Molunerfinn/PicGo/commit/5a06483))
* add aliyun oss options ([a33f1ad](https://github.com/Molunerfinn/PicGo/commit/a33f1ad)), closes [#347](https://github.com/Molunerfinn/PicGo/issues/347)
* **server:** add http server for uploading images by a http request ([c56d4ef](https://github.com/Molunerfinn/PicGo/commit/c56d4ef))
* add server config settings ([6b57cf7](https://github.com/Molunerfinn/PicGo/commit/6b57cf7))
* only shows visible pic-beds ([9d4d605](https://github.com/Molunerfinn/PicGo/commit/9d4d605)), closes [#310](https://github.com/Molunerfinn/PicGo/issues/310)


### :bug: Bug Fixes

* beforeOpen handler in windows ([cd30a6c](https://github.com/Molunerfinn/PicGo/commit/cd30a6c))
* **website:** website pictures error ([a5b6526](https://github.com/Molunerfinn/PicGo/commit/a5b6526))
* add new tray icon for macOS dark-mode ([c5adf3b](https://github.com/Molunerfinn/PicGo/commit/c5adf3b)), closes [#267](https://github.com/Molunerfinn/PicGo/issues/267)
* busApi event register first && emit later ([e1a0cbb](https://github.com/Molunerfinn/PicGo/commit/e1a0cbb))
* decrease title-bar z-index when config-form dialog shows ([f2750e1](https://github.com/Molunerfinn/PicGo/commit/f2750e1))
* enum type error ([4e3fa28](https://github.com/Molunerfinn/PicGo/commit/4e3fa28))
* handle empty request-body ([81e6acb](https://github.com/Molunerfinn/PicGo/commit/81e6acb))
* launch error in new structrue ([bc8e641](https://github.com/Molunerfinn/PicGo/commit/bc8e641))
* plugin config-form && default plugin logo ([514fc40](https://github.com/Molunerfinn/PicGo/commit/514fc40))
* release script ([b4f10c6](https://github.com/Molunerfinn/PicGo/commit/b4f10c6))
* rename page not work ([29a55ed](https://github.com/Molunerfinn/PicGo/commit/29a55ed))
* save debug mode && PICGO_ENV into config file ([c6ead5b](https://github.com/Molunerfinn/PicGo/commit/c6ead5b))
* settingPage && miniPage style in windows ([3fd9572](https://github.com/Molunerfinn/PicGo/commit/3fd9572))


### :pencil: Documentation

* add note for windows electron mirror ([46a49ed](https://github.com/Molunerfinn/PicGo/commit/46a49ed))
* remove weibo picbed ([e81b8f4](https://github.com/Molunerfinn/PicGo/commit/e81b8f4))
* update installation by scoop ([91b397d](https://github.com/Molunerfinn/PicGo/commit/91b397d)), closes [#295](https://github.com/Molunerfinn/PicGo/issues/295)
* update readme ([1b3522e](https://github.com/Molunerfinn/PicGo/commit/1b3522e))
* update README ([f491209](https://github.com/Molunerfinn/PicGo/commit/f491209))
* update site ([fe9e19a](https://github.com/Molunerfinn/PicGo/commit/fe9e19a))



## :tada: 2.1.2 (2019-04-19)


### :sparkles: Features

* add file-name for customurl ([c59e2bc](https://github.com/Molunerfinn/PicGo/commit/c59e2bc)), closes [#173](https://github.com/Molunerfinn/PicGo/issues/173)


### :bug: Bug Fixes

* log-level filter bug ([4e02244](https://github.com/Molunerfinn/PicGo/commit/4e02244)), closes [#237](https://github.com/Molunerfinn/PicGo/issues/237)
* log-level's reset value from 'all' -> ['all'] ([3c6b329](https://github.com/Molunerfinn/PicGo/commit/3c6b329)), closes [#240](https://github.com/Molunerfinn/PicGo/issues/240) [#237](https://github.com/Molunerfinn/PicGo/issues/237)
* mini window hidden bug in linux ([466dbec](https://github.com/Molunerfinn/PicGo/commit/466dbec)), closes [#239](https://github.com/Molunerfinn/PicGo/issues/239)



## :tada: 2.1.1 (2019-04-16)


### :bug: Bug Fixes

* upload-area can't upload images ([4000cea](https://github.com/Molunerfinn/PicGo/commit/4000cea))



# :tada: 2.1.0 (2019-04-15)


### :sparkles: Features

* add commandline argvs support for picgo app ([6db86ec](https://github.com/Molunerfinn/PicGo/commit/6db86ec))
* add gui-api for remove event ([407b821](https://github.com/Molunerfinn/PicGo/commit/407b821)), closes [#201](https://github.com/Molunerfinn/PicGo/issues/201)
* add windows context menu ([e5fbe75](https://github.com/Molunerfinn/PicGo/commit/e5fbe75))
* add workflow for mac ([7f17697](https://github.com/Molunerfinn/PicGo/commit/7f17697))
* support commandline -> upload images in clipboard ([74c7016](https://github.com/Molunerfinn/PicGo/commit/74c7016))


### :bug: Bug Fixes

* qiniu area option from select group -> input ([c64959a](https://github.com/Molunerfinn/PicGo/commit/c64959a)), closes [#230](https://github.com/Molunerfinn/PicGo/issues/230)


### :pencil: Documentation

* add brew cask source ([6122e17](https://github.com/Molunerfinn/PicGo/commit/6122e17))


### :package: Chore

* add picgo bump-version ([37f1d34](https://github.com/Molunerfinn/PicGo/commit/37f1d34))



