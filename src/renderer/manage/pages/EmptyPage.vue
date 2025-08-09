<template>
  <div class="empty-page">
    <div class="empty-container">
      <div class="empty-icon">
        <FolderOpenIcon class="icon" />
      </div>
      <div class="empty-content">
        <h3 class="empty-title">
          {{ t('pages.manage.empty.noData') }}
        </h3>
        <p class="empty-description">
          {{ t('pages.manage.empty.noDataDesc') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { FolderOpenIcon } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style lang="stylus" scoped>
.empty-page
  height 100%
  display flex
  align-items center
  justify-content center
  padding 2rem

.empty-container
  display flex
  flex-direction column
  align-items center
  text-align center
  max-width 400px

.empty-icon
  margin-bottom 1.5rem

.icon
  width 64px
  height 64px
  color var(--color-text-secondary)

.empty-content
  .empty-title
    font-size 1.25rem
    font-weight 600
    color var(--color-text-primary)
    margin 0 0 0.5rem 0

  .empty-description
    font-size 0.875rem
    color var(--color-text-secondary)
    margin 0
    line-height 1.5
</style>
