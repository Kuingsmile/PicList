<template>
  <div id="gallery-view" :style="handleBarActive ? 'height: 85%;' : 'height: 95%;'">
    <div class="view-title">
      {{ $T('GALLERY') }} - {{ filterList.length }}
      <el-icon style="margin-left: 4px" class="cursor-pointer" @click="toggleHandleBar">
        <CaretBottom v-show="!handleBarActive" />
        <CaretTop v-show="handleBarActive" />
      </el-icon>
      <span style="position: absolute; right: 0; top: 0; margin-right: 20px; font-size: 0.8em; color: #fff">
        {{ $T('GALLERY_SYNC_DELETE') }}
        <el-switch
          v-model="deleteCloud"
          :active-text="$T('SETTINGS_OPEN')"
          :inactive-text="$T('SETTINGS_CLOSE')"
          @change="handleDeleteCloudFile"
        />
        <el-button type="primary" :link="true" @click="refreshPage">
          <el-tooltip
            class="item"
            effect="dark"
            :content="$T('REFRESH')"
            placement="bottom"
            :persistent="false"
            teleported
          >
            <el-icon size="25" style="cursor: pointer; margin-left: 10px">
              <Refresh />
            </el-icon>
          </el-tooltip>
        </el-button>
      </span>
    </div>
    <transition name="el-zoom-in-top">
      <el-row v-show="handleBarActive">
        <el-col :span="22" :offset="1">
          <el-row class="handle-bar" :gutter="16">
            <el-col :span="5">
              <el-select
                v-model="choosedPicBed"
                multiple
                collapse-tags
                size="small"
                style="width: 100%"
                :placeholder="$T('CHOOSE_SHOWED_PICBED')"
                :persistent="false"
                teleported
              >
                <el-option v-for="item in picBedGlobal" :key="item.type" :label="item.name" :value="item.type" />
              </el-select>
            </el-col>
            <el-col :span="10">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                unlink-panels
                range-separator="To"
                start-placeholder="Start date"
                end-placeholder="End date"
                size="small"
                teleported
              />
            </el-col>
            <el-col :span="1">
              <el-divider direction="vertical" style="height: 100%" border-style="hidden" />
            </el-col>
            <el-col :span="3">
              <el-select
                v-model="pasteStyle"
                size="small"
                style="width: 100%"
                :placeholder="$T('CHOOSE_PASTE_FORMAT')"
                :persistent="false"
                teleported
                @change="handlePasteStyleChange"
              >
                <el-option v-for="(value, key) in pasteStyleMap" :key="key" :label="key" :value="value" />
              </el-select>
            </el-col>
            <el-col :span="3">
              <el-select
                v-model="useShortUrl"
                size="small"
                style="width: 100%"
                placeholder="Choose"
                :persistent="false"
                teleported
                @change="handleUseShortUrlChange"
              >
                <el-option v-for="(value, key) in shortURLMap" :key="key" :label="key" :value="value" />
              </el-select>
            </el-col>
            <el-col :span="2">
              <el-dropdown teleported>
                <el-button size="small" type="primary" :icon="Sort">
                  {{ $T('MANAGE_BUCKET_SORT_TITLE') }}
                </el-button>
                <template #dropdown>
                  <el-dropdown-item @click="sortFile('name')">
                    {{ $T('MANAGE_BUCKET_SORT_NAME') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="sortFile('ext')">
                    {{ $T('MANAGE_BUCKET_SORT_EXT') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="sortFile('time')">
                    {{ $T('MANAGE_BUCKET_SORT_TIME') }}
                  </el-dropdown-item>
                  <el-dropdown-item @click="sortFile('check')">
                    {{ $T('MANAGE_BUCKET_SORT_CHECK') }}
                  </el-dropdown-item>
                </template>
              </el-dropdown>
            </el-col>
          </el-row>
          <el-row class="handle-bar" :gutter="16">
            <el-col :span="5">
              <el-input v-model="searchText" :placeholder="$T('GALLERY_SEARCH_FILENAME')" size="small">
                <template #suffix>
                  <el-icon class="el-input__icon" style="cursor: pointer" @click="cleanSearch">
                    <close />
                  </el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :span="6">
              <el-input v-model="searchTextURL" :placeholder="$T('GALLERY_SEARCH_URL')" size="small">
                <template #suffix>
                  <el-icon class="el-input__icon" style="cursor: pointer" @click="cleanSearchUrl">
                    <close />
                  </el-icon>
                </template>
              </el-input>
            </el-col>
            <el-col :span="1">
              <el-divider direction="vertical" style="height: 100%" border-style="hidden" />
            </el-col>
            <el-col :span="3">
              <div class="item-base copy round" :class="{ active: isMultiple(choosedList) }" @click="multiCopy">
                {{ $T('COPY') }}
              </div>
            </el-col>
            <el-col :span="3">
              <div
                class="item-base all-pick round"
                :class="{ active: filterList.length > 0 }"
                @click="() => (isShowBatchRenameDialog = true)"
              >
                {{ $T('GALLERY_CHANGE_URL') }}
              </div>
            </el-col>
            <el-col :span="3">
              <div class="item-base delete round" :class="{ active: isMultiple(choosedList) }" @click="multiRemove">
                {{ $T('DELETE') }}
              </div>
            </el-col>
            <el-col :span="3">
              <div class="item-base all-pick round" :class="{ active: filterList.length > 0 }" @click="toggleSelectAll">
                {{ isAllSelected ? $T('CANCEL') : $T('SELECT_ALL') }}
              </div>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </transition>
    <el-row class="gallery-list" :class="{ small: handleBarActive }">
      <el-col :span="22" :offset="1">
        <el-row :gutter="16">
          <photo-slider
            :items="filterList"
            :visible="gallerySliderControl.visible"
            :index="gallerySliderControl.index"
            :should-transition="true"
            @change-index="zoomImage"
            @click-mask="handleClose"
            @close-modal="handleClose"
          />
          <el-col
            v-for="(item, index) in filterList"
            :key="item.id"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="4"
            :xl="2"
            class="gallery-list__img"
          >
            <div class="gallery-list__item" @click="zoomImage(index)">
              <img
                v-lazy="{
                  src: item.galleryPath || item.imgUrl
                }"
                class="gallery-list__item-img"
              />
            </div>
            <div class="gallery-list__file-name" :title="item.fileName">
              {{ formatFileName(item.fileName || '') }}
            </div>
            <el-row class="gallery-list__tool-panel" justify="space-between" align="middle">
              <el-row>
                <el-icon class="cursor-pointer document" @click="copy(item)">
                  <Document />
                </el-icon>
                <el-icon class="cursor-pointer edit" @click="openDialog(item)">
                  <Edit />
                </el-icon>
                <el-icon class="cursor-pointer delete" @click="remove(item)">
                  <Delete />
                </el-icon>
              </el-row>
              <el-checkbox
                v-model="choosedList[item.id ? item.id : '']"
                @change="(val: string | number | boolean) => handleChooseImage(val, index)"
              />
            </el-row>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
    <el-dialog
      v-model="dialogVisible"
      :title="$T('CHANGE_IMAGE_URL')"
      width="500px"
      :modal-append-to-body="false"
      append-to-body
    >
      <el-input v-model="imgInfo.imgUrl" />
      <template #footer>
        <el-button @click="dialogVisible = false">
          {{ $T('CANCEL') }}
        </el-button>
        <el-button type="primary" @click="confirmModify">
          {{ $T('CONFIRM') }}
        </el-button>
      </template>
    </el-dialog>
    <el-dialog
      v-model="isShowBatchRenameDialog"
      :title="$T('CHANGE_IMAGE_URL')"
      center
      align-center
      draggable
      destroy-on-close
      append-to-body
    >
      <el-link :underline="false" style="margin-bottom: 10px">
        <span>
          {{ $T('MANAGE_BUCKET_RENAME_FILE_INPUT_A') + $T('GALLERY_MATCHED') + mathcedCount + ' ' }}
          <el-tooltip
            effect="dark"
            :content="$T('MANAGE_BUCKET_RENAME_FILE_INPUT_A_TIPS')"
            placement="right"
            :persistent="false"
            teleported
          >
            <el-icon color="#409EFF">
              <InfoFilled />
            </el-icon>
          </el-tooltip>
        </span>
      </el-link>
      <el-input
        v-model="batchRenameMatch"
        :placeholder="$T('MANAGE_BUCKET_RENAME_FILE_INPUT_A_PLACEHOLDER')"
        clearable
      />
      <el-link :underline="false" style="margin-bottom: 10px; margin-top: 10px">
        <span>
          {{ $T('MANAGE_BUCKET_RENAME_FILE_INPUT_B') }}
          <el-popover effect="light" placement="right" width="280" :persistent="false" teleported>
            <template #reference>
              <el-icon color="#409EFF">
                <InfoFilled />
              </el-icon>
            </template>
            <el-descriptions :column="1" style="width: 250px" border>
              <el-descriptions-item
                v-for="(item, index) in customRenameFormatTable"
                :key="index"
                :label="item.placeholder"
                align="center"
                label-style="width: 100px;"
              >
                {{ item.description }}
              </el-descriptions-item>
              <el-descriptions-item
                v-for="(item, index) in customRenameFormatTable.slice(0, customRenameFormatTable.length - 1)"
                :key="index"
                :label="item.placeholderB"
                align="center"
                label-style="width: 100px;"
              >
                {{ item.descriptionB }}
              </el-descriptions-item>
              <el-descriptions-item label="{auto}" align="center" label-style="width: 100px;">
                {{ $T('MANAGE_BUCKET_RENAME_FILE_TABLE_IID') }}
              </el-descriptions-item>
            </el-descriptions>
          </el-popover>
        </span>
      </el-link>
      <el-input v-model="batchRenameReplace" placeholder="Ex. {Y}-{m}-{uuid}" clearable />
      <div style="margin-top: 10px; align-items: center; display: flex; justify-content: flex-end">
        <el-button
          type="danger"
          style="margin-right: 30px"
          plain
          :icon="Close"
          @click="
            () => {
              isShowBatchRenameDialog = false
            }
          "
        >
          {{ $T('MANAGE_BUCKET_RENAME_FILE_CANCEL') }}
        </el-button>
        <el-button type="primary" plain :icon="Edit" @click="handleBatchRename()">
          {{ $T('MANAGE_BUCKET_RENAME_FILE_CONFIRM') }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ipcRenderer, clipboard } from 'electron'
import { CheckboxValueType, ElMessageBox, ElNotification, ElMessage } from 'element-plus'
import {
  InfoFilled,
  Close,
  CaretBottom,
  Document,
  Edit,
  Delete,
  CaretTop,
  Sort,
  Refresh
} from '@element-plus/icons-vue'
import path from 'path'
import { computed, nextTick, onActivated, onBeforeUnmount, onBeforeMount, reactive, ref, watch } from 'vue'
import { onBeforeRouteUpdate } from 'vue-router'
import type { IResult } from '@picgo/store/dist/types'

import ALLApi from '@/apis/allApi'
import { T as $T } from '@/i18n/index'
import { customRenameFormatTable, customStrMatch, customStrReplace } from '@/manage/utils/common'
import { sendRPC, triggerRPC } from '@/utils/common'
import { getConfig, saveConfig } from '@/utils/dataSender'
import $$db from '@/utils/db'
import { picBedGlobal } from '@/utils/global'

import { configPaths } from '#/utils/configPaths'
import { picBedsCanbeDeleted } from '#/utils/static'
import { IPasteStyle, IRPCActionType } from '#/types/enum'

const images = ref<ImgInfo[]>([])
const dialogVisible = ref(false)
const imgInfo = reactive({
  id: '',
  imgUrl: ''
})
const $confirm = ElMessageBox.confirm
const choosedList: IObjT<boolean> = reactive({})
const gallerySliderControl = reactive({
  visible: false,
  index: 0
})
const deleteCloud = ref<boolean>(false)
const choosedPicBed = ref<string[]>([])
const lastChoosed = ref<number>(-1)
const isShiftKeyPress = ref<boolean>(false)
const searchText = ref<string>('')
const searchTextURL = ref<string>('')
const handleBarActive = ref<boolean>(true)
const pasteStyle = ref<string>('')
const pasteStyleMap = {
  Markdown: 'markdown',
  HTML: 'HTML',
  URL: 'URL',
  UBB: 'UBB',
  Custom: 'Custom'
}
const useShortUrl = ref<string>('')
const shortURLMap = {
  [$T('UPLOAD_SHORT_URL')]: $T('UPLOAD_SHORT_URL'),
  [$T('UPLOAD_NORMAL_URL')]: $T('UPLOAD_NORMAL_URL')
}
const fileSortNameReverse = ref(false)
const fileSortTimeReverse = ref(false)
const fileSortExtReverse = ref(false)
const isShowBatchRenameDialog = ref(false)
const batchRenameMatch = ref('')
const batchRenameReplace = ref('')
const dateRange = ref('')

const mathcedCount = computed(() => {
  return filterList.value.filter((item: any) => {
    return customStrMatch(item.imgUrl, batchRenameMatch.value)
  }).length
})

onBeforeRouteUpdate((to, from) => {
  if (from.name === 'gallery') {
    clearChoosedList()
  }
  if (to.name === 'gallery') {
    updateGallery()
  }
})

async function initDeleteCloud() {
  deleteCloud.value = (await getConfig<boolean>(configPaths.settings.deleteCloudFile)) || false
}

onBeforeMount(async () => {
  ipcRenderer.on('updateGallery', () => {
    nextTick(async () => {
      updateGallery()
    })
  })
  updateGallery()
  document.addEventListener('keydown', handleDetectShiftKey)
  document.addEventListener('keyup', handleDetectShiftKey)
})

function handleDetectShiftKey(event: KeyboardEvent) {
  if (event.key === 'Shift') {
    isShiftKeyPress.value = event.type === 'keydown'
  }
}

const filterList = computed(() => {
  const res = getGallery()
  return res
})

const isAllSelected = computed(() => {
  return Object.values(choosedList).length > 0 && filterList.value.every(item => choosedList[item.id!])
})

function formatFileName(name: string) {
  return path.basename(name)
}

function getGallery(): IGalleryItem[] {
  if (searchText.value || choosedPicBed.value.length > 0 || searchTextURL.value || dateRange.value) {
    return images.value
      .filter(item => {
        let isInChoosedPicBed = true
        let isIncludesSearchText = true
        let isIncludesSearchTextURL = true
        let isIncludesDateRange = true
        if (choosedPicBed.value.length > 0) {
          isInChoosedPicBed = choosedPicBed.value.some(type => type === item.type)
        }
        if (searchText.value) {
          isIncludesSearchText = customStrMatch(item.fileName || '', searchText.value)
        }
        if (searchTextURL.value) {
          isIncludesSearchTextURL = customStrMatch(item.imgUrl || '', searchTextURL.value)
        }
        if (dateRange.value) {
          const [start, end] = dateRange.value
          const date = new Date(item.updatedAt).getTime()
          isIncludesDateRange = date >= new Date(start).getTime() && date <= new Date(end).getTime() + 86400000
        }
        return isIncludesSearchText && isInChoosedPicBed && isIncludesSearchTextURL && isIncludesDateRange
      })
      .map(item => {
        return {
          ...item,
          src: item.galleryPath || item.imgUrl || '',
          key: item.id || `${Date.now()}`,
          intro: item.fileName || ''
        }
      })
  } else {
    return images.value.map(item => {
      return {
        ...item,
        src: item.galleryPath || item.imgUrl || '',
        key: item.id || `${Date.now()}`,
        intro: item.fileName || ''
      }
    })
  }
}

async function updateGallery() {
  images.value = (await $$db.get({ orderBy: 'desc' }))!.data
}

watch(
  () => filterList,
  () => {
    clearChoosedList()
  }
)

function handleChooseImage(val: CheckboxValueType, index: number) {
  if (val === true) {
    handleBarActive.value = true
    if (lastChoosed.value !== -1 && isShiftKeyPress.value) {
      const min = Math.min(lastChoosed.value, index)
      const max = Math.max(lastChoosed.value, index)
      for (let i = min + 1; i < max; i++) {
        const id = filterList.value[i].id!
        choosedList[id] = true
      }
    }
    lastChoosed.value = index
  }
}

function refreshPage() {
  sendRPC(IRPCActionType.REFRESH_SETTING_WINDOW)
}

function clearChoosedList() {
  isShiftKeyPress.value = false
  Object.keys(choosedList).forEach(key => {
    choosedList[key] = false
  })
  lastChoosed.value = -1
}

function zoomImage(index: number) {
  gallerySliderControl.index = index
  gallerySliderControl.visible = true
  changeZIndexForGallery(true)
}

function changeZIndexForGallery(isOpen: boolean) {
  if (isOpen) {
    // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
    document.querySelector('.main-content.el-row').style.zIndex = 101
  } else {
    // @ts-expect-error ts-migrate(2531) FIXME: Object is possibly 'null'.
    document.querySelector('.main-content.el-row').style.zIndex = 10
  }
}

function handleClose() {
  gallerySliderControl.index = 0
  gallerySliderControl.visible = false
  changeZIndexForGallery(false)
}

async function copy(item: ImgInfo) {
  item.config = JSON.parse(JSON.stringify(item.config) || '{}')
  const result = await triggerRPC<[string, string]>(IRPCActionType.GALLERY_PASTE_TEXT, item)
  if (result && result[1] && item.id) {
    await $$db.updateById(item.id, {
      shortUrl: result[1]
    })
  }
  const obj = {
    title: $T('COPY_LINK_SUCCEED'),
    body: result ? result[0] : ''
  }
  const myNotification = new Notification(obj.title, obj)
  myNotification.onclick = () => {
    return true
  }
  updateGallery()
}

function remove(item: ImgInfo) {
  if (!item.id) return
  $confirm($T('TIPS_REMOVE_LINK'), $T('TIPS_NOTICE'), {
    confirmButtonText: $T('CONFIRM'),
    cancelButtonText: $T('CANCEL'),
    type: 'warning'
  })
    .then(async () => {
      const file = await $$db.getById(item.id!)
      if (
        (await getConfig(configPaths.settings.deleteCloudFile)) &&
        picBedsCanbeDeleted.includes(item?.type || 'placeholder')
      ) {
        const result = await ALLApi.delete(item)
        if (result) {
          ElNotification({
            title: $T('GALLERY_SYNC_DELETE_NOTICE_TITLE'),
            message: `${item.fileName} ${$T('GALLERY_SYNC_DELETE_NOTICE_SUCCEED')}`,
            type: 'success'
          })
        } else {
          ElNotification({
            title: $T('GALLERY_SYNC_DELETE_NOTICE_TITLE'),
            message: `${item.fileName} ${$T('GALLERY_SYNC_DELETE_NOTICE_FAILED')}`,
            type: 'error'
          })
          return true
        }
      }
      await $$db.removeById(item.id!)
      sendRPC(IRPCActionType.GALLERY_REMOVE_FILES, [file])
      const obj = {
        title: $T('OPERATION_SUCCEED'),
        body: ''
      }
      const myNotification = new Notification(obj.title, obj)
      myNotification.onclick = () => {
        return true
      }
      updateGallery()
    })
    .catch(e => {
      console.log(e)
      return true
    })
}

function handleDeleteCloudFile(val: ICheckBoxValueType) {
  saveConfig({
    [configPaths.settings.deleteCloudFile]: val
  })
}

function openDialog(item: ImgInfo) {
  imgInfo.id = item.id!
  imgInfo.imgUrl = item.imgUrl as string
  dialogVisible.value = true
}

async function confirmModify() {
  await $$db.updateById(imgInfo.id, {
    imgUrl: imgInfo.imgUrl
  })
  const obj = {
    title: $T('CHANGE_IMAGE_URL_SUCCEED'),
    body: imgInfo.imgUrl
  }
  const myNotification = new Notification(obj.title, obj)
  myNotification.onclick = () => {
    return true
  }
  dialogVisible.value = false
  updateGallery()
}

function cleanSearch() {
  searchText.value = ''
}

function cleanSearchUrl() {
  searchTextURL.value = ''
}

function isMultiple(obj: IObj) {
  return Object.values(obj).some(item => item)
}

function toggleSelectAll() {
  const result = !isAllSelected.value
  filterList.value.forEach(item => {
    choosedList[item.id!] = result
  })
}

function multiRemove() {
  const multiRemoveNumber = Object.values(choosedList).filter(item => item).length
  if (multiRemoveNumber) {
    $confirm(
      $T('TIPS_WILL_REMOVE_CHOOSED_IMAGES', {
        m: multiRemoveNumber
      }),
      $T('TIPS_NOTICE'),
      {
        confirmButtonText: $T('CONFIRM'),
        cancelButtonText: $T('CANCEL'),
        type: 'warning'
      }
    )
      .then(async () => {
        const files: IResult<ImgInfo>[] = []
        const imageIDList = Object.keys(choosedList)
        const isDeleteCloudFile = await getConfig(configPaths.settings.deleteCloudFile)
        if (isDeleteCloudFile) {
          for (let i = 0; i < imageIDList.length; i++) {
            const key = imageIDList[i]
            if (choosedList[key]) {
              const file = await $$db.getById<ImgInfo>(key)
              if (file) {
                if (file.type !== undefined && picBedsCanbeDeleted.includes(file.type)) {
                  const result = await ALLApi.delete(file)
                  if (result) {
                    ElNotification({
                      title: $T('GALLERY_SYNC_DELETE'),
                      message: `${file.fileName} ${$T('GALLERY_SYNC_DELETE_NOTICE_SUCCEED')}`,
                      type: 'success',
                      duration: multiRemoveNumber > 5 ? 1000 : 2000
                    })
                    files.push(file)
                    await $$db.removeById(key)
                  } else {
                    ElNotification({
                      title: $T('GALLERY_SYNC_DELETE'),
                      message: `${file.fileName} ${$T('GALLERY_SYNC_DELETE_NOTICE_FAILED')}`,
                      type: 'error',
                      duration: multiRemoveNumber > 5 ? 1000 : 2000
                    })
                  }
                } else {
                  files.push(file)
                  await $$db.removeById(key)
                }
              }
            }
          }
        } else {
          for (let i = 0; i < imageIDList.length; i++) {
            const key = imageIDList[i]
            if (choosedList[key]) {
              const file = await $$db.getById<ImgInfo>(key)
              if (file) {
                files.push(file)
                await $$db.removeById(key)
              }
            }
          }
        }
        clearChoosedList()
        // TODO: check this
        // choosedList = {} // 只有删除才能将这个置空
        const obj = {
          title: $T('OPERATION_SUCCEED'),
          body: ''
        }
        sendRPC(IRPCActionType.GALLERY_REMOVE_FILES, files)
        const myNotification = new Notification(obj.title, obj)
        myNotification.onclick = () => {
          return true
        }
        updateGallery()
      })
      .catch(() => {
        return true
      })
  }
}

async function multiCopy() {
  if (Object.values(choosedList).some(item => item)) {
    const copyString: string[] = []
    // choosedList -> { [id]: true or false }; true means choosed. false means not choosed.
    const imageIDList = Object.keys(choosedList)
    for (let i = 0; i < imageIDList.length; i++) {
      const key = imageIDList[i]
      if (choosedList[key]) {
        const item = await $$db.getById<ImgInfo>(key)
        if (item) {
          const result = await triggerRPC<string>(IRPCActionType.GALLERY_PASTE_TEXT, item)
          copyString.push(result ? result[0] : '')
          if (result && result[1] && item.id) {
            await $$db.updateById(item.id, {
              shortUrl: result[1]
            })
          }
          choosedList[key] = false
        }
      }
    }
    const obj = {
      title: $T('BATCH_COPY_LINK_SUCCEED'),
      body: copyString.join('\n')
    }
    const myNotification = new Notification(obj.title, obj)
    clipboard.writeText(copyString.join('\n'))
    myNotification.onclick = () => {
      return true
    }
    updateGallery()
  }
}

function toggleHandleBar() {
  handleBarActive.value = !handleBarActive.value
}

async function handlePasteStyleChange(val: string) {
  saveConfig(configPaths.settings.pasteStyle, val)
  pasteStyle.value = val
}

function handleUseShortUrlChange(value: string) {
  saveConfig(configPaths.settings.useShortUrl, value === $T('UPLOAD_SHORT_URL'))
  useShortUrl.value = value
}

function sortFile(type: 'name' | 'time' | 'ext' | 'check') {
  switch (type) {
    case 'name':
      fileSortNameReverse.value = !fileSortNameReverse.value
      images.value.sort((a: any, b: any) => {
        if (fileSortNameReverse.value) {
          return a.fileName.localeCompare(b.fileName)
        } else {
          return b.fileName.localeCompare(a.fileName)
        }
      })
      break
    case 'time':
      fileSortTimeReverse.value = !fileSortTimeReverse.value
      images.value.sort((a: any, b: any) => {
        if (fileSortTimeReverse.value) {
          return a.updatedAt - b.updatedAt
        } else {
          return b.updatedAt - a.updatedAt
        }
      })
      break
    case 'ext':
      fileSortExtReverse.value = !fileSortExtReverse.value
      images.value.sort((a: any, b: any) => {
        if (fileSortExtReverse.value) {
          return a.extname.localeCompare(b.extname)
        } else {
          return b.extname.localeCompare(a.extname)
        }
      })
      break
    case 'check':
      images.value.sort((a: any, b: any) => {
        if (choosedList[a.id] && !choosedList[b.id]) {
          return -1
        } else if (!choosedList[a.id] && choosedList[b.id]) {
          return 1
        } else {
          return 0
        }
      })
      break
  }
}

function handleBatchRename() {
  isShowBatchRenameDialog.value = false
  if (batchRenameMatch.value === '') {
    ElMessage.warning($T('MANAGE_BUCKET_BATCH_RENAME_ERROR_MSG'))
    return
  }
  let matchedFiles = [] as any[]
  filterList.value.forEach((item: any) => {
    if (customStrMatch(item.imgUrl, batchRenameMatch.value)) {
      matchedFiles.push(item)
    }
  })
  if (matchedFiles.length === 0) {
    ElMessage.warning($T('MANAGE_BUCKET_BATCH_RENAME_ERROR_MSG2'))
    return
  }
  for (let i = 0; i < matchedFiles.length; i++) {
    matchedFiles[i].newUrl = customStrReplace(matchedFiles[i].imgUrl, batchRenameMatch.value, batchRenameReplace.value)
  }
  matchedFiles = matchedFiles.filter((item: any) => item.imgUrl !== item.newUrl)
  if (matchedFiles.length === 0) {
    ElMessage.warning($T('MANAGE_BUCKET_BATCH_RENAME_ERROR_MSG3'))
  }
  for (let i = 0; i < matchedFiles.length; i++) {
    matchedFiles[i].newUrl = matchedFiles[i].newUrl.replaceAll('{auto}', (i + 1).toString())
  }
  const duplicateFilesNum = matchedFiles.filter(
    (item: any) => matchedFiles.filter((item2: any) => item2.newUrl === item.newUrl).length > 1
  ).length
  const renamefunc = async (item: any) => {
    await $$db.updateById(item.id, {
      imgUrl: item.newUrl
    })
  }
  const rename = () => {
    const promiseList = [] as any[]
    for (let i = 0; i < matchedFiles.length; i++) {
      promiseList.push(renamefunc(matchedFiles[i]))
    }
    Promise.all(promiseList)
      .then(() => {
        const obj = {
          title: $T('OPERATION_SUCCEED'),
          body: ''
        }
        const myNotification = new Notification(obj.title, obj)
        myNotification.onclick = () => {
          return true
        }
        updateGallery()
      })
      .catch(() => {
        return true
      })
  }
  if (duplicateFilesNum > 0) {
    ElMessageBox.confirm(
      `${$T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_A')} ${duplicateFilesNum} ${$T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_B')}`,
      $T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_MSG_C'),
      {
        confirmButtonText: $T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_CONFIRM'),
        cancelButtonText: $T('MANAGE_BUCKET_BATCH_RENAME_REPEATED_CANCEL'),
        type: 'warning'
      }
    )
      .then(() => {
        rename()
      })
      .catch(() => {
        ElMessage.info($T('MANAGE_BUCKET_BATCH_RENAME_CANCEL'))
      })
  } else {
    rename()
  }
}

onBeforeUnmount(() => {
  ipcRenderer.removeAllListeners('updateGallery')
})

onActivated(async () => {
  pasteStyle.value = (await getConfig(configPaths.settings.pasteStyle)) || IPasteStyle.MARKDOWN
  useShortUrl.value = (await getConfig(configPaths.settings.useShortUrl))
    ? $T('UPLOAD_SHORT_URL')
    : $T('UPLOAD_NORMAL_URL')
  initDeleteCloud()
})
</script>

<script lang="ts">
export default {
  name: 'GalleryPage'
}
</script>

<style lang="stylus">
.PhotoSlider
  &__BannerIcon
    &:nth-child(1)
      display none
  &__Counter
    margin-top 20px
.view-title
  color #eee
  font-size 20px
  text-align center
  margin 10px auto
  .sub-title
    font-size 14px
  .el-icon-caret-bottom
    cursor: pointer
    transition all .2s ease-in-out
    &.active
      transform: rotate(180deg)
#gallery-view
  position absolute
  left 142px
  right 0
  height 85%
  .cursor-pointer
    cursor pointer
.item-base
  background #2E2E2E
  text-align center
  padding 5px 0
  cursor pointer
  font-size 13px
  transition all .2s ease-in-out
  height: 28px
  box-sizing: border-box
  &.copy
    cursor not-allowed
    background #49B1F5
    &.active
      cursor pointer
      background #1B9EF3
      color #fff
  &.delete
    cursor not-allowed
    background #F47466
    &.active
      cursor pointer
      background #F15140
      color #fff
  &.all-pick
    cursor not-allowed
    background #69C282
    &.active
      cursor pointer
      background #44B363
      color #fff
#gallery-view
  .round
    border-radius 14px
  .pull-right
    float right
  .gallery-list
    height 100%
    box-sizing border-box
    padding 8px 0
    overflow-y auto
    overflow-x auto
    position absolute
    top: 38px
    transition all .2s ease-in-out .1s
    width 100%
    &.small
      height: 100%
      top: 113px
    &__img
      // height 150px
      position relative
      margin-bottom 8px
    &__item
      width 100%
      height 120px
      transition all .2s ease-in-out
      cursor pointer
      margin-bottom 4px
      overflow hidden
      display flex
      margin-bottom 6px
      &-fake
        position absolute
        top 0
        left 0
        opacity 0
        width 100%
        z-index -1
      &:hover
        transform scale(1.1)
      &-img
        width 100%
        object-fit contain
    &__tool-panel
      color #ddd
      margin-bottom 4px
      display flex
      .el-checkbox
        height 16px
      i
        cursor pointer
        transition all .2s ease-in-out
        margin-right 4px
        &.document
          &:hover
            color #49B1F5
        &.edit
          &:hover
            color #69C282
        &.delete
          &:hover
            color #F15140
    &__file-name
      overflow hidden
      text-overflow ellipsis
      white-space nowrap
      color #ddd
      font-size 14px
      margin-bottom 4px
      text-align center
      align-self center
  .handle-bar
    color #ddd
    margin-bottom 10px
</style>
