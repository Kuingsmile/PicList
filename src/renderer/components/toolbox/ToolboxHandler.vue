<template>
  <div class="mt-0">
    <CustomButton :text="handlerText" @click="() => handler(value)" />
  </div>
</template>

<script lang="ts" setup generic="T">
import CustomButton from '@/components/common/CustomButton.vue'

defineOptions({ name: 'ToolboxHandler' })
interface IProps {
  status: string
  value: T
  handlerText: string
  handler: (value: T) => void | Promise<void>
}

const { value, handlerText, handler } = defineProps<IProps>()
</script>
