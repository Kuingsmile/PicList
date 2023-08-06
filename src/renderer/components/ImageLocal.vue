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
  const base64 = await fs.readFile(props.localPath, 'base64')
  base64Image.value = `data:image/png;base64,${base64}`
}

onBeforeMount(async () => {
  await createBase64Image()
})
</script>
