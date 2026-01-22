import { createRouter, createWebHashHistory } from 'vue-router'

import ManageBucketPage from '@/manage/pages/BucketPage.vue'
import ManageEmptyPage from '@/manage/pages/EmptyPage.vue'
import ManageLoginPage from '@/manage/pages/LogInPage.vue'
import ManageMainPage from '@/manage/pages/ManageMain.vue'
import ManageSettingPage from '@/manage/pages/ManageSetting.vue'
import GalleryPage from '@/pages/Gallery.vue'
import MainPage from '@/pages/Main.vue'
import MiniPage from '@/pages/MiniPage.vue'
import PicBedsPage from '@/pages/picbeds/index.vue'
import SettingPage from '@/pages/PicGoSetting.vue'
import PluginPage from '@/pages/Plugin.vue'
import RenamePage from '@/pages/RenamePage.vue'
import ShortKeyPage from '@/pages/ShortKey.vue'
import Toolbox from '@/pages/Toolbox.vue'
import TrayPage from '@/pages/TrayPage.vue'
import UpdatePage from '@/pages/UpdatePage.vue'
import UploadPage from '@/pages/Upload.vue'
import UploaderConfigPage from '@/pages/UploaderConfigPage.vue'
import * as config from '@/router/config'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: config.TRAY_PAGE,
      component: TrayPage,
    },
    {
      path: '/rename-page',
      name: config.RENAME_PAGE,
      component: RenamePage,
    },
    {
      path: '/mini-page',
      name: config.MINI_PAGE,
      component: MiniPage,
    },
    {
      path: '/main-page',
      name: config.MAIN_PAGE,
      component: MainPage,
      children: [
        {
          path: 'upload',
          component: UploadPage,
          name: config.UPLOAD_PAGE,
        },
        {
          path: 'manage-main-page',
          name: config.MANAGE_MAIN_PAGE,
          component: ManageMainPage,
          children: [
            {
              path: '',
              name: config.MANAGE_EMPTY_PAGE,
              component: ManageEmptyPage,
            },
            {
              path: 'manage-setting-page',
              name: config.MANAGE_SETTING_PAGE,
              component: ManageSettingPage,
            },
            {
              path: 'manage-bucket-page',
              name: config.MANAGE_BUCKET_PAGE,
              component: ManageBucketPage,
            },
          ],
        },
        {
          path: 'manage-login-page',
          name: config.MANAGE_LOGIN_PAGE,
          component: ManageLoginPage,
        },
        {
          path: 'picbeds/:type/:configId?',
          name: config.PICBEDS_PAGE,
          component: PicBedsPage,
        },
        {
          path: 'gallery',
          component: GalleryPage,
          name: config.GALLERY_PAGE,
          meta: {
            keepAlive: true,
          },
        },
        {
          path: 'settings',
          name: config.SETTING_PAGE,
          component: SettingPage,
        },
        {
          path: 'plugins',
          component: PluginPage,
          name: config.PLUGIN_PAGE,
        },
        {
          path: 'shortKey',
          component: ShortKeyPage,
          name: config.SHORTKEY_PAGE,
        },
        {
          path: 'uploader-config-page/:type',
          component: UploaderConfigPage,
          name: config.UPLOADER_CONFIG_PAGE,
        },
      ],
    },
    {
      path: '/toolbox-page',
      name: config.TOOLBOX_CONFIG_PAGE,
      component: Toolbox,
    },
    {
      path: '/update-page',
      name: config.UPDATE_PAGE,
      component: UpdatePage,
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/main-page/upload',
    },
  ],
})
