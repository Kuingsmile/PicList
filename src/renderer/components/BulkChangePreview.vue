<template>
  <CustomModal v-if="snapshot && visible" v-model:visible="modalVisible" width="1100px" :title="t('common.bulk.title')">
    <div class="space-y-4 p-5 text-sm text-main">
      <p>{{ t(snapshot.committed ? 'common.bulk.resultsHint' : 'common.bulk.reviewHint') }}</p>
      <p class="text-secondary">
        {{ t(snapshot.plan.kind === 'gallery-url' ? 'common.bulk.galleryHint' : 'common.bulk.remoteHint') }}
      </p>
      <div class="flex flex-wrap items-center gap-3">
        <label for="bulk-conflict-policy">{{ t('common.bulk.policy') }}</label>
        <select
          id="bulk-conflict-policy"
          v-model="policy"
          :disabled="busy || snapshot.committed"
          class="rounded-md border border-border bg-bg-secondary px-3 py-2 text-main"
        >
          <option disabled value="">{{ t('common.bulk.choosePolicy') }}</option>
          <option value="abort">{{ t('common.bulk.abort') }}</option>
          <option value="skip">{{ t('common.bulk.skip') }}</option>
          <option value="overwrite">
            {{ t(snapshot.plan.kind === 'gallery-url' ? 'common.bulk.overwriteUrls' : 'common.bulk.overwrite') }}
          </option>
        </select>
        <span>{{ t('common.bulk.summary', counts) }}</span>
      </div>
      <p v-if="policy && !snapshot.committed && !canCommit" class="text-warning" role="status">
        {{ t('common.bulk.blocked') }}
      </p>
      <p v-if="error" class="text-danger" role="alert">{{ error }}</p>
      <div class="max-h-[52vh] overflow-auto rounded-md border border-border">
        <table class="w-full table-fixed border-collapse text-left">
          <thead class="sticky top-0 bg-bg-secondary">
            <tr>
              <th class="w-[17%] p-3">{{ t('common.bulk.context') }}</th>
              <th class="w-[25%] p-3">{{ t('common.bulk.source') }}</th>
              <th class="w-[25%] p-3">{{ t('common.bulk.target') }}</th>
              <th class="p-3">{{ t('common.bulk.checks') }}</th>
              <th class="p-3">{{ t('common.bulk.outcome') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in snapshot.plan.items" :key="item.id" class="border-t border-border align-top">
              <td class="p-3 break-all text-secondary">
                {{
                  [item.context.provider, item.context.accountId, item.context.bucketName, item.context.region]
                    .filter(Boolean)
                    .join(' / ')
                }}
              </td>
              <td class="p-3 font-mono break-all whitespace-pre-wrap">{{ item.source }}</td>
              <td class="p-3 font-mono break-all whitespace-pre-wrap">{{ item.target }}</td>
              <td class="p-3">
                <span v-if="!item.issues.length">{{ t('common.bulk.ready') }}</span>
                <p v-for="issue in item.issues" :key="issue" class="mb-1 text-warning">
                  {{ t(`common.bulk.issue.${issue}`) }}
                </p>
              </td>
              <td class="p-3" aria-live="polite">
                <span :class="snapshot.outcomes[index].status === 'failed' ? 'text-danger' : ''">
                  {{ t(`common.bulk.status.${snapshot.outcomes[index].status}`) }}
                </span>
                <p v-if="snapshot.outcomes[index].stage === 'copied'" class="mt-1 text-warning">
                  {{ t('common.bulk.copied') }}
                </p>
                <p v-if="snapshot.outcomes[index].error" class="mt-1 text-danger">
                  {{ t(`common.bulk.error.${snapshot.outcomes[index].error}`) }}
                </p>
                <p v-if="snapshot.outcomes[index].attempts" class="mt-1 text-secondary">
                  {{ t('common.bulk.attempts', { count: snapshot.outcomes[index].attempts }) }}
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <template #footer>
      <CustomButton type="secondary" :text="t('common.bulk.refresh')" @click="workflow.refresh" />
      <CustomButton type="secondary" :text="t('common.bulk.discard')" :disabled="busy" @click="workflow.discard" />
      <CustomButton
        v-if="!snapshot.committed"
        :text="t('common.bulk.commit')"
        :disabled="busy || !canCommit"
        @click="workflow.execute(false)"
      />
      <CustomButton
        v-else
        :text="t('common.bulk.retry')"
        :disabled="busy || !counts.failed"
        @click="workflow.execute(true)"
      />
    </template>
  </CustomModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import type { useBulkChanges } from '@/hooks/useBulkChanges'
import { canCommitBulkPlan } from '#/bulkChanges'

const { workflow } = defineProps<{ workflow: ReturnType<typeof useBulkChanges> }>()
const { snapshot, visible, busy, policy, error } = workflow
const { t } = useI18n()
const modalVisible = computed({
  get: () => visible.value,
  set: value => {
    if (!busy.value) visible.value = value
  },
})
const canCommit = computed(
  () => !!snapshot.value && !!policy.value && canCommitBulkPlan(snapshot.value.plan, policy.value),
)
const counts = computed(() => ({
  total: snapshot.value?.outcomes.length ?? 0,
  succeeded: snapshot.value?.outcomes.filter(item => item.status === 'succeeded').length ?? 0,
  failed: snapshot.value?.outcomes.filter(item => item.status === 'failed').length ?? 0,
  skipped: snapshot.value?.outcomes.filter(item => item.status === 'skipped').length ?? 0,
}))
</script>
