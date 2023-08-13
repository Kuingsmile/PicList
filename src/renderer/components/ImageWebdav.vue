<template>
  <el-image
    :src="imageSource"
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
        :src="iconPath"
        fit="contain"
        style="height: 100px;width: 100%;margin: 0 auto;"
      />
    </template>
  </el-image>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed } from 'vue'
import { getFileIconPath } from '@/manage/utils/common'
import { Loading } from '@element-plus/icons-vue'

const base64Url = ref('')
const success = ref(false)

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

const imageSource = computed(() => {
  return (props.isShowThumbnail && props.item.isImage && success.value)
    ? base64Url.value
    : require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? '')}`)
})

const iconPath = computed(() => require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? '')}`))

const fetchImage = async () => {
  try {
    const res = await fetch(props.url, { method: 'GET', headers: props.headers })
    if (res.status >= 200 && res.status < 300) {
      const blob = await res.blob()
      success.value = true
      base64Url.value = URL.createObjectURL(blob)
    } else {
      throw new Error('Network response was not ok.')
    }
  } catch (err) {
    success.value = false
    console.log(err)
  }
}

watch(() => [props.url, props.headers], fetchImage, { deep: true })

onMounted(fetchImage)

</script>
