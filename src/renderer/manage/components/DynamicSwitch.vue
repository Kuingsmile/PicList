<template>
  <el-form-item>
    <template #label>
      <span style="position: absolute; left: 0">
        <span v-for="(segment, index) in segments" :key="index" :style="segment.style">
          {{ segment.text }}
        </span>
        <el-tooltip v-if="tooltip" :content="tooltip" effect="dark" placement="right" :persistent="false" teleported>
          <el-icon>
            <InfoFilled />
          </el-icon>
        </el-tooltip>
      </span>
    </template>
    <el-switch
      v-model="value"
      :active-text="activeText"
      :inactive-text="inactiveText"
      style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949; position: absolute; right: 0"
    />
  </el-form-item>
</template>

<script lang="ts" setup>
import { InfoFilled } from '@element-plus/icons-vue'

defineProps<{
  tooltip?: string
  activeText?: string
  inactiveText?: string
  segments?: { text: string; style: string }[]
}>()

const value = defineModel<boolean>()
</script>
