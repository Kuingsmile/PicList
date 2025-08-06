<template>
  <div class="toolbox-handler">
    <ElButton
      type="primary"
      :link="true"
      @click="() => props.handler(value)"
    >
      {{ props.handlerText }}
    </ElButton>
  </div>
</template>

<script lang="ts" setup>

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
  name: 'ToolboxHandler'
}
</script>
<style lang="stylus"></style>
