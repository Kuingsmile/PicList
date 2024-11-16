<template>
  <el-image :src="imageSource" fit="contain" style="height: 100px; width: 100%; margin: 0 auto">
    <template #placeholder>
      <el-icon>
        <Loading />
      </el-icon>
    </template>
    <template #error>
      <el-image :src="iconPath" fit="contain" style="height: 100px; width: 100%; margin: 0 auto" />
    </template>
  </el-image>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'

import { getFileIconPath } from '@/manage/utils/common'
import { IRPCActionType } from '#/types/enum'
import { triggerRPC } from '@/utils/common'

const preSignedUrl = ref('')

const props = defineProps<{
  item: {
    key: string
    isImage: boolean
    fileName: string | null | undefined
  }
  alias: string
  url: string
  config: any
  isShowThumbnail: boolean
}>()

const imageSource = computed(() => {
  return props.isShowThumbnail && props.item.isImage
    ? preSignedUrl.value
    : require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? '')}`)
})

const iconPath = computed(() => require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? '')}`))

async function getUrl() {
  preSignedUrl.value = await triggerRPC<any>(IRPCActionType.MANAGE_GET_PRE_SIGNED_URL, props.alias, props.config)
}

watch(() => [props.url, props.item], getUrl, { deep: true })

onMounted(getUrl)
</script>
