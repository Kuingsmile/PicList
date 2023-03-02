<template>
  <el-image
    :src="isShowThumbnail && item.isImage ?
      base64Url
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

const base64Url = ref('')
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
    url: {
      type: String,
      required: true
    },
    headers: {
      type: Object,
      required: true
    }
  }
)

const urlCreateObjectURL = async () => {
  await fetch(props.url, {
    method: 'GET',
    headers: props.headers
  }).then(res => res.blob()).then(blob => {
    base64Url.value = URL.createObjectURL(blob)
  }).catch(err => {
    console.log(err)
  })
}

onBeforeMount(async () => {
  await urlCreateObjectURL()
})
</script>
