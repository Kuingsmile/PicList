<template>
  <component
    :is="icon"
    class="toolbox-status-icon"
    :style="{ color }"
  />
</template>

<script lang="ts" setup>
import { CircleCheck, Loader2, TriangleAlert } from 'lucide-vue-next'
import { computed } from 'vue'

import { IToolboxItemCheckStatus } from '@/utils/enum'

interface IProps {
  status: string
}

const props = defineProps<IProps>()

const color = computed(() => {
  switch (props.status) {
    case IToolboxItemCheckStatus.SUCCESS:
      return '#67C23A'
    case IToolboxItemCheckStatus.ERROR:
      return '#F56C6C'
    default:
      return '#909399'
  }
})

const icon = computed(() => {
  switch (props.status) {
    case IToolboxItemCheckStatus.SUCCESS:
      return CircleCheck
    case IToolboxItemCheckStatus.ERROR:
      return TriangleAlert
    case IToolboxItemCheckStatus.LOADING:
      return Loader2
    default:
      return null
  }
})
</script>
<script lang="ts">
export default {
  name: 'ToolboxStatusIcon'
}
</script>
<style lang="stylus">
.toolbox-status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-full);
  transition: var(--transition-fast);
}
</style>
