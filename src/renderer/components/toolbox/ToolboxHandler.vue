<template>
  <div class="mt-0">
    <CustomButton type="primary" :text="props.handlerText" @click="() => props.handler(props.value)" />
  </div>
</template>

<script lang="ts" setup>
import CustomButton from '@/components/common/CustomButton.vue'
interface IProps {
  status: string
  value: any
  handlerText: string
  handler: (value: any) => void | Promise<void>
}

const props = defineProps<IProps>()
</script>

<script lang="ts">
export default {
  name: 'ToolboxHandler',
}
</script>
