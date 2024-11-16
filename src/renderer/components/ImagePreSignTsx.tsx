import { ElImage, ElIcon } from 'element-plus'
import { defineComponent, ref, onMounted, watch, computed } from 'vue'
import { Loading } from '@element-plus/icons-vue'

import { getFileIconPath } from '@/manage/utils/common'
import { IRPCActionType } from '#/types/enum'
import { triggerRPC } from '@/utils/common'

export default defineComponent({
  props: {
    isShowThumbnail: {
      type: Boolean,
      required: true
    },
    item: {
      type: Object,
      required: true
    },
    alias: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    config: {
      type: Object,
      required: true
    }
  },

  setup(props) {
    const preSignedUrl = ref('')

    const imageSource = computed(() => {
      return props.isShowThumbnail && props.item.isImage
        ? preSignedUrl.value
        : require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? '')}`)
    })
    const iconPath = computed(() =>
      require(`../manage/pages/assets/icons/${getFileIconPath(props.item.fileName ?? '')}`)
    )

    async function getUrl() {
      preSignedUrl.value = await triggerRPC<any>(IRPCActionType.MANAGE_GET_PRE_SIGNED_URL, props.alias, props.config)
    }

    watch(() => [props.url, props.item], getUrl, { deep: true })
    onMounted(getUrl)

    return () => (
      <ElImage src={imageSource.value} fit='contain' style='height: 100px;width: 100%;margin: 0 auto;'>
        {{
          placeholder: () => (
            <ElIcon>
              <Loading />
            </ElIcon>
          ),
          error: () => <ElImage src={iconPath.value} fit='contain' style='height: 100px;width: 100%;margin: 0 auto;' />
        }}
      </ElImage>
    )
  }
})
