<template>
  <el-image
    :src="
      isShowThumbnail && item.isImage
        ? base64Image
        : `/assets/icons/${getFileIconPath(item.fileName ?? '')}`
    "
    fit="contain"
    style="height: 100px; width: 100%; margin: 0 auto"
  >
    <template #placeholder>
      <el-icon>
        <Loading />
      </el-icon>
    </template>
    <template #error>
      <el-image
        :src="`/assets/icons/${getFileIconPath(item.fileName ?? '')}`"
        fit="contain"
        style="height: 100px; width: 100%; margin: 0 auto"
      />
    </template>
  </el-image>
</template>

<script lang="ts" setup>

import { Loading } from '@element-plus/icons-vue'
import { onBeforeMount, ref } from 'vue'

import { getFileIconPath } from '@/manage/utils/common'

const base64Image = ref('')
const props = defineProps<{
  isShowThumbnail: boolean
  item: {
    isImage: boolean
    fileName: string
  }
  localPath: string
}>()

const createBase64Image = async () => {
  const filePath = window.node.path.normalize(props.localPath)
  const base64 = await window.node.fs.readFile(filePath, 'base64')
  base64Image.value = `data:${window.node.mime.lookup(filePath) || 'image/png'};base64,${base64}`
}

onBeforeMount(async () => {
  try {
    await createBase64Image()
  } catch (e) {
    console.log(e)
  }
})
</script>
