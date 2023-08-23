<template>
  <el-image
    :src="isShowThumbnail && item.isImage ?
      base64Image
      : require(`../manage/pages/assets/icons/${getFileIconPath(item.fileName ?? '')}`)"
    fit="contain"
    style="height: 100px;width: 100%;margin: 0 auto;"
  >
    <template #placeholder>
      <el-icon>
        <Loading />
      </el-icon>
    </template>
    <template #error>
      <el-image
        :src="require(`../manage/pages/assets/icons/${getFileIconPath(item.fileName ?? '')}`)"
        fit="contain"
        style="height: 100px;width: 100%;margin: 0 auto;"
      />
    </template>
  </el-image>
</template>

<script lang="ts" setup>
import { ref, onBeforeMount } from 'vue'
import { getFileIconPath } from '@/manage/utils/common'
import { Loading } from '@element-plus/icons-vue'
import fs from 'fs-extra'
import mime from 'mime-types'
import path from 'path'

const base64Image = ref('')
const props = defineProps(
  {
    isShowThumbnail: {
      type: Boolean,
      required: true
    },
    item: {
      type: Object,
      required: true
    },
    localPath: {
      type: String,
      required: true
    }
  }
)

const createBase64Image = async () => {
  const filePath = path.normalize(props.localPath)
  const base64 = await fs.readFile(filePath, 'base64')
  base64Image.value = `data:${mime.lookup(filePath) || 'image/png'};base64,${base64}`
}

onBeforeMount(async () => {
  try {
    await createBase64Image()
  } catch (e) {
    console.log(e)
  }
})
</script>
