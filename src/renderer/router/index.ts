import { createRouter, createWebHashHistory } from 'vue-router'

import * as config from '@/router/config'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: config.TRAY_PAGE,
      component: () => import('@/pages/TrayPage.vue'),
    },
    {
      path: '/rename-page',
      name: config.RENAME_PAGE,
      component: () => import('@/pages/RenamePage.vue'),
    },
    {
      path: '/mini-page',
      name: config.MINI_PAGE,
      component: () => import('@/pages/MiniPage.vue'),
    },
    {
      path: '/main-page',
      name: config.MAIN_PAGE,
      component: () => import('@/pages/Main.vue'),
      children: [
        {
          path: 'upload',
          component: () => import('@/pages/Upload.vue'),
          name: config.UPLOAD_PAGE,
        },
        {
          path: 'manage-setting-page',
          name: config.MANAGE_SETTING_PAGE_DIRECT,
          component: () => import('@/manage/pages/ManageSetting.vue'),
        },

        {
          path: 'manage-main-page',
          name: config.MANAGE_MAIN_PAGE,
          component: () => import('@/manage/pages/ManageMain.vue'),
          children: [
            {
              path: '',
              name: config.MANAGE_EMPTY_PAGE,
              component: () => import('@/manage/pages/EmptyPage.vue'),
            },
            {
              path: 'manage-setting-page',
              name: config.MANAGE_SETTING_PAGE,
              component: () => import('@/manage/pages/ManageSetting.vue'),
            },
            {
              path: 'manage-bucket-page',
              name: config.MANAGE_BUCKET_PAGE,
              component: () => import('@/manage/pages/BucketPage.vue'),
            },
          ],
        },
        {
          path: 'manage-login-page',
          name: config.MANAGE_LOGIN_PAGE,
          component: () => import('@/manage/pages/LogInPage.vue'),
        },
        {
          path: 'picbeds/:type/:configId?',
          name: config.PICBEDS_PAGE,
          component: () => import('@/pages/PicBed.vue'),
        },
        {
          path: 'gallery',
          component: () => import('@/pages/Gallery.vue'),
          name: config.GALLERY_PAGE,
          meta: {
            keepAlive: true,
          },
        },
        {
          path: 'settings',
          name: config.SETTING_PAGE,
          component: () => import('@/pages/PicGoSetting.vue'),
        },
        {
          path: 'plugins',
          component: () => import('@/pages/Plugin.vue'),
          name: config.PLUGIN_PAGE,
        },
        {
          path: 'scripts',
          component: () => import('@/pages/ScriptPage.vue'),
          name: config.SCRIPT_PAGE,
        },
        {
          path: 'shortKey',
          component: () => import('@/pages/ShortKey.vue'),
          name: config.SHORTKEY_PAGE,
        },
        {
          path: 'uploader-config-page/:type',
          component: () => import('@/pages/UploaderConfigPage.vue'),
          name: config.UPLOADER_CONFIG_PAGE,
        },
      ],
    },
    {
      path: '/toolbox-page',
      name: config.TOOLBOX_CONFIG_PAGE,
      component: () => import('@/pages/Toolbox.vue'),
    },
    {
      path: '/about-page',
      name: config.ABOUT_PAGE,
      component: () => import('@/pages/AboutPage.vue'),
    },
    {
      path: '/update-page',
      name: config.UPDATE_PAGE,
      component: () => import('@/pages/UpdatePage.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/main-page/upload',
    },
  ],
})
