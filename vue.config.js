const path = require('path')
function resolve (dir) {
  return path.join(__dirname, dir)
}

const config = {
  configureWebpack: {
    devtool: 'nosources-source-map'
  },
  chainWebpack: config => {
    config.resolve.alias
      .set('@', resolve('src/renderer'))
      .set('~', resolve('src'))
      .set('root', resolve('./'))
      .set('#', resolve('src/universal'))
    // define
    // config.plugin('define')
    //   .tap(args => {
    //     return args
    //   })
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true, // will remove in the future
      customFileProtocol: 'picgo://./',
      externals: ['piclist'],
      chainWebpackMainProcess: config => {
        config.resolve.alias
          .set('@', resolve('src/renderer'))
          .set('~', resolve('src'))
          .set('root', resolve('./'))
          .set('#', resolve('src/universal'))
          .set('apis', resolve('src/main/apis'))
          .set('@core', resolve('src/main/apis/core'))
        config.resolve.mainFields
          .clear()
          .add('main') // fix some modules will use browser target
          .add('module')
      },
      builderOptions: {
        productName: 'PicList',
        appId: 'com.kuingsmile.piclist',
        afterSign: 'scripts/notarize.js',
        publish: [
          {
            provider: 'github',
            owner: 'Kuingsmile',
            repo: 'PicList',
            releaseType: 'draft'
          }
        ],
        dmg: {
          sign: false,
          contents: [
            {
              x: 410,
              y: 150,
              type: 'link',
              path: '/Applications'
            },
            {
              x: 130,
              y: 150,
              type: 'file'
            }
          ]
        },
        mac: {
          icon: 'build/icons/icon.icns',
          hardenedRuntime: true,
          entitlements: 'build/entitlements.mas.plist',
          entitlementsInherit: 'build/entitlements.mas.inherit.plist',
          provisioningProfile: 'build/piclistmass.provisionprofile',
          extendInfo: {
            LSUIElement: 0
          },
          target: [{
            target: 'mas',
            arch: [
              'universal'
            ]
          }],
          // eslint-disable-next-line no-template-curly-in-string
          artifactName: 'PicList-${version}-${arch}.${ext}'
        },
        mas: {
          type: 'distribution',
          icon: 'build/icons/icon.icns',
          hardenedRuntime: true,
          entitlements: 'build/entitlements.mas.plist',
          entitlementsInherit: 'build/entitlements.mas.inherit.plist',
          provisioningProfile: 'build/piclistmass.provisionprofile',
          entitlementsLoginHelper: 'build/entitlements.mas.loginhelper.plist'
        },
        win: {
          icon: 'build/icons/icon.ico',
          // eslint-disable-next-line no-template-curly-in-string
          artifactName: 'PicList-Setup-${version}-${arch}.exe',
          target: [{
            target: 'nsis',
            arch: [
              'x64',
              'ia32'
            ]
          }]
        },
        nsis: {
          shortcutName: 'PicList',
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          include: 'build/installer.nsh'
        },
        linux: {
          icon: 'build/icons/'
        },
        snap: {
          publish: ['github']
        }
      }
    }
  }
}

if (process.env.NODE_ENV === 'development') {
  config.configureWebpack = {
    devtool: 'source-map'
  }
  // for dev main process hot reload
  config.pluginOptions.electronBuilder.mainProcessWatch = ['src/main/**/*']
}

module.exports = {
  ...config
}
