<template>
  <div class="toolbox-handler">
    <button
      class="handler-button"
      @click="() => props.handler(value)"
    >
      {{ props.handlerText }}
    </button>
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
<style lang="stylus">
.toolbox-handler {
  margin-top: 0.75rem;
}

.handler-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition-fast);
  font-family: inherit;
  text-decoration: none;
}

.handler-button:hover {
  background: var(--color-accent-hover);
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.handler-button:active {
  transform: translateY(0);
}
</style>
