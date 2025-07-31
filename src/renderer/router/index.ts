import { createRouter, createWebHashHistory } from 'vue-router'

import * as config from '@/router/config'

export default createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: config.TRAY_PAGE,
      component: () => import('@/pages/TrayPage.vue')
    },
    {
      path: '/rename-page',
      name: config.RENAME_PAGE,
      component: () => import('@/pages/RenamePage.vue')
    },
    {
      path: '/mini-page',
      name: config.MINI_PAGE,
      component: () => import('@/pages/MiniPage.vue')
    },
    {
      path: '/main-page',
      name: config.MAIN_PAGE,
      component: () => import('@/layouts/Main.vue'),
      children: [
        {
          path: 'upload',
          component: () => import('@/pages/Upload.vue'),
          name: config.UPLOAD_PAGE
        },
        {
          path: 'manage-main-page',
          name: config.MANAGE_MAIN_PAGE,
          component: () => import('@/manage/pages/ManageMain.vue'),
          children: [
            {
              path: '',
              name: config.MANAGE_EMPTY_PAGE,
              component: () => import('@/manage/pages/EmptyPage.vue')
            },
            {
              path: 'manage-setting-page',
              name: config.MANAGE_SETTING_PAGE,
              component: () => import('@/manage/pages/ManageSetting.vue')
            },
            {
              path: 'manage-bucket-page',
              name: config.MANAGE_BUCKET_PAGE,
              component: () => import('@/manage/pages/BucketPage.vue')
            }
          ]
        },
        {
          path: 'manage-login-page',
          name: config.MANAGE_LOGIN_PAGE,
          component: () => import('@/manage/pages/LogInPage.vue')
        },
        {
          path: 'picbeds/:type/:configId?',
          name: config.PICBEDS_PAGE,
          component: () => import('@/pages/picbeds/index.vue')
        },
        {
          path: 'gallery',
          component: () => import('@/pages/Gallery.vue'),
          name: config.GALLERY_PAGE,
          meta: {
            keepAlive: true
          }
        },
        {
          path: 'setting',
          name: config.SETTING_PAGE,
          component: () => import('@/pages/PicGoSetting.vue')
        },
        {
          path: 'plugin',
          component: () => import('@/pages/Plugin.vue'),
          name: config.PLUGIN_PAGE
        },
        {
          path: 'shortKey',
          component: () => import('@/pages/ShortKey.vue'),
          name: config.SHORTKEY_PAGE
        },
        {
          path: 'uploader-config-page/:type',
          component: () => import('@/pages/UploaderConfigPage.vue'),
          name: config.UPLOADER_CONFIG_PAGE
        }
      ]
    },
    {
      path: '/documents',
      component: () => import('@/pages/DocumentPage.vue'),
      name: config.DocumentPage
    },
    {
      path: '/toolbox-page',
      name: config.TOOLBOX_CONFIG_PAGE,
      component: () => import('@/pages/Toolbox.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
})
