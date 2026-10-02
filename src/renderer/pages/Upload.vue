<template>
  <div class="relative no-scrollbar flex h-full w-full items-center justify-center">
    <div
      class="relative z-1 no-scrollbar flex h-full w-full flex-col items-center justify-start gap-6 overflow-auto rounded-xl border-none p-8 shadow-sm"
    >
      <!-- Header Card -->
      <div
        class="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-4 shadow-md max-md:flex-col max-md:items-stretch max-md:p-5"
      >
        <div class="flex max-w-[calc(100%-300px)] flex-1 flex-wrap items-center gap-2 max-md:order-1">
          <button
            class="provider-button group/provider flex w-auto min-w-[150px] shrink-0 cursor-pointer items-center gap-3 rounded-lg bg-bg-secondary px-4 py-2 font-[inherit] shadow-sm duration-fast ease-standard hover:-translate-y-px hover:bg-accent/30 hover:text-white hover:shadow-sm focus-visible:focus-ring max-xs:w-full max-xs:min-w-[100px]"
            :title="t('pages.upload.uploadViewHint')"
            @click="openPicBedSettings"
          >
            <div class="flex flex-1 flex-col items-start">
              <span class="text-sm leading-[1.2] font-semibold text-main group-hover/provider:text-white">{{
                picBedName
              }}</span>
              <span class="text-xs leading-[1.2] text-secondary group-hover/provider:text-white">{{
                defaultConfigNameG || 'Default'
              }}</span>
            </div>
            <EditIcon :size="16" class="text-secondary duration-fast ease-standard group-hover/provider:text-white" />
          </button>
          <div
            class="flex h-[22px] w-[22px] shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-surface font-[inherit] text-secondary duration-fast ease-standard hover:-translate-y-px hover:bg-accent/30 hover:text-white data-[disabled=true]:pointer-events-none data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50"
            :title="t('pages.upload.addToFavorites')"
            :data-disabled="favoritePicbeds.length >= MAX_FAVORITE_PICBEDS || isCurrentPicBedInFavorites"
            @click="addCurrentPicbedToFavorites"
          >
            <component
              :is="isCurrentPicBedInFavorites ? CheckIcon : PlusIcon"
              :size="14"
              class="duration-fast ease-standard"
            />
          </div>
          <transition-group
            name="badges-slide"
            tag="div"
            class="flex max-w-[calc(100%-300px)] flex-wrap items-center gap-[0.2rem] [.has-many]:max-w-[300px]"
            :class="{ 'has-many': favoritePicbeds.length >= 4 }"
            enter-active-class="transition-all duration-200 ease-apple"
            leave-active-class="transition-all duration-200 ease-apple"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0"
          >
            <button
              v-for="picbedType in favoritePicbeds"
              :key="picbedType.id"
              class="group/badge relative flex w-[85px] shrink-0 cursor-pointer items-center gap-2 overflow-hidden rounded-md bg-bg-secondary pt-1.5 pr-2 pb-1.5 pl-3 text-xs font-medium whitespace-nowrap text-secondary shadow-sm transition-all duration-fast ease-standard select-none hover:-translate-y-px hover:border-accent-hover hover:bg-accent/30 hover:text-white [.is-active]:border-[0.1rem] [.is-active]:border-accent-hover [.is-active]:font-semibold [.show-delete]:pr-2"
              :class="{ 'is-active': isCurrentPicbed(picbedType), 'show-delete': longPressedBadge === picbedType.id }"
              :title="t('pages.upload.longPressToRemoveFromFavorites') + getPicbedName(picbedType)"
              @click="handleBadgeClick(picbedType)"
              @mousedown="startBadgeLongPress(picbedType)"
              @mouseup="endBadgeLongPress"
              @mouseleave="endBadgeLongPress"
              @touchstart="startBadgeLongPress(picbedType, $event)"
              @touchend="endBadgeLongPress"
              @touchcancel="endBadgeLongPress"
            >
              <div class="min-w-0 flex-1 overflow-hidden">
                <div
                  class="flex overflow-hidden text-ellipsis whitespace-nowrap group-hover/badge:w-fit group-hover/badge:animate-[badge-scroll_5s_linear_infinite] group-hover/badge:text-clip"
                >
                  <span class="leading-none whitespace-nowrap group-hover/badge:pr-[20px]">{{
                    getPicbedName(picbedType)
                  }}</span>
                  <span class="hidden leading-none whitespace-nowrap group-hover/badge:block">{{
                    getPicbedName(picbedType)
                  }}</span>
                </div>
              </div>
              <button
                v-if="longPressedBadge === picbedType.id"
                class="flex shrink-0 animate-[fade-in_0.2s_ease-in] cursor-pointer items-center justify-center rounded-full border-none bg-transparent p-0.5 text-inherit duration-fast ease-standard hover:bg-danger/20 hover:text-danger"
                :title="t('pages.upload.removeFromFavorites')"
                @click.stop="removePicbedFromFavorites(picbedType)"
              >
                <XIcon :size="12" />
              </button>
            </button>
          </transition-group>
        </div>
        <div class="flex flex-wrap items-center gap-3 max-md:order-2 max-md:justify-stretch">
          <button
            class="segmented-button rounded-md bg-bg-secondary shadow-sm"
            :title="t('pages.imageProcess.editor.title')"
            @click="handleImageProcess"
          >
            <Settings :size="16" />
            <span>{{ t('pages.imageProcess.editor.title') }}</span>
          </button>
          <PicBedSwitcher />
        </div>
      </div>

      <!-- Main Upload Card -->
      <div
        class="flex min-h-[230px] w-full flex-1 flex-wrap items-center justify-center gap-4 rounded-2xl border border-border-secondary px-6 py-4 shadow-md max-md:flex-col max-md:items-stretch max-md:p-5"
      >
        <div
          id="upload-area"
          ref="uploadArea"
          class="group/upload relative flex h-full w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-secondary px-1 py-12 duration-medium ease-standard focus-visible:focus-ring focus-visible:outline-offset-4 max-md:px-4 max-md:py-8 max-xs:px-2 max-xs:py-6 [:hover,.drag-active]:border-accent [:hover,.drag-active]:bg-[linear-gradient(135deg,var(--color-surface-elevated)_0%,color-mix(in_srgb,var(--color-accent),transparent_95%)_100%)] [:hover,.drag-active]:shadow-lg [:hover,.drag-active&]:translate-y-[-2px]"
          :class="{ 'drag-active': dragover }"
          @drop.prevent="onDrop"
          @dragover.prevent="dragover = true"
          @dragleave.prevent="dragover = false"
          @click="openUploadWindow"
        >
          <div class="flex flex-col items-center justify-center gap-6 text-center">
            <div
              class="flex h-[80px] w-[80px] items-center justify-center rounded-full bg-accent text-white duration-medium ease-standard group-[:hover,.drag-active]/upload:animate-[float_1.5s_ease-in-out_infinite] max-md:h-[60px] max-md:w-[60px]"
            >
              <UploadCloudIcon :size="48" />
            </div>
            <div class="flex flex-col gap-2">
              <h3 class="m-0 text-xl font-semibold tracking-tight text-main max-xs:text-lg">
                {{ t('pages.upload.dragFileToHere') }}
              </h3>
              <p class="m-0 text-sm text-secondary">
                {{ ' ' }}
              </p>
              <div class="mt-2 flex flex-col gap-1">
                <span class="text-xs font-medium tracking-wide text-secondary uppercase">{{
                  t('pages.upload.uploadHint')
                }}</span>
              </div>
            </div>
          </div>
          <input id="file-uploader" ref="fileInput" type="file" multiple class="hidden" @change="handleFileSelection" />
        </div>

        <!-- Progress Bar -->
      </div>

      <div
        v-if="showProgress"
        class="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-secondary p-0 shadow-md"
      >
        <div class="flex w-full flex-col gap-2 rounded-lg border border-border bg-surface p-3">
          <div class="flex w-full items-center justify-between gap-3 text-sm">
            <span class="font-medium text-main">{{ progressLabel }}</span>
            <span
              v-if="
                !progressState?.indeterminate &&
                (progressState?.activeCount || (!progressState?.failed && !progressState?.cancelled))
              "
              class="font-semibold text-secondary tabular-nums"
            >
              {{ Math.round(progress) }}%
            </span>
          </div>
          <div
            class="h-2 w-full overflow-hidden rounded-lg bg-bg-secondary"
            :role="progressState?.activeCount ? 'progressbar' : 'status'"
            :aria-label="progressLabel"
            :aria-valuenow="progressState?.activeCount && !progressState.indeterminate ? progress : undefined"
            :aria-valuemin="progressState?.activeCount ? 0 : undefined"
            :aria-valuemax="progressState?.activeCount ? 100 : undefined"
          >
            <div
              class="h-full rounded-lg bg-[linear-gradient(90deg,var(--color-accent)_0%,var(--color-primary)_50%)] transition-[width] duration-300 ease-standard data-[error=true]:bg-danger data-[error=true]:bg-none motion-reduce:transition-none"
              :class="{ 'upload-progress-indeterminate': progressState?.indeterminate }"
              :data-error="showError"
              :style="{ width: progressState?.indeterminate ? '35%' : `${progress}%` }"
            />
          </div>
          <div
            v-if="progressState?.totalFiles"
            class="flex flex-wrap justify-between gap-2 text-xs text-secondary tabular-nums"
          >
            <span>{{
              t('pages.upload.progress.files', {
                completed: progressState.completedFiles,
                total: progressState.totalFiles,
              })
            }}</span>
            <span v-if="progressState.totalBytes !== null">
              {{ formatSize(progressState.transferredBytes) }} / {{ formatSize(progressState.totalBytes) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Quick Actions Card -->
      <div
        class="flex w-full flex-col flex-wrap items-center justify-between gap-2 rounded-2xl border border-border-secondary px-6 py-4 shadow-md max-md:items-stretch max-md:p-5"
      >
        <div class="flex w-full items-start p-0">
          <h4 class="m-0 text-[0.9rem] font-semibold tracking-tight text-main">
            {{ t('pages.upload.quickUpload') }}
          </h4>
        </div>
        <div class="flex w-full flex-1 flex-row flex-wrap items-center justify-center gap-4 max-md:gap-3 max-md:px-5">
          <button class="quick-action-button group" @click="uploadClipboardFiles">
            <ClipboardIcon class="shrink-0 text-accent group-hover:text-white" :size="15" />
            <span class="text-sm font-medium text-secondary group-hover:text-white">{{
              t('pages.upload.clipboardPicture')
            }}</span>
          </button>
          <button class="quick-action-button group" @click="uploadURLFiles">
            <LinkIcon class="shrink-0 text-accent group-hover:text-white" :size="15" />
            <span class="text-sm font-medium text-secondary group-hover:text-white">{{
              t('pages.upload.urlUpload')
            }}</span>
          </button>
          <button
            class="quick-action-button group"
            :class="{ 'has-badge': taskQueueStatus.tasks.length > 0 }"
            @click="openTaskDialog"
          >
            <ListTodoIcon class="shrink-0 text-accent group-hover:text-white" :size="15" />
            <span class="mt-1 text-sm font-medium text-secondary group-hover:text-white">{{
              t('pages.upload.taskUpload')
            }}</span>
            <span
              v-if="taskQueueStatus.tasks.length > 0"
              class="absolute top-1/2 right-3 flex min-w-6 -translate-y-1/2 animate-[badge-pulse_2s_ease-in-out_infinite] items-center justify-center rounded-full border border-border-secondary px-1.5 py-0 text-sm font-bold text-accent group-hover:text-white"
            >
              {{ taskQueueStatus.tasks.length }}
            </span>
          </button>
        </div>
      </div>

      <!-- Settings Card -->
      <div
        class="flex w-full flex-row flex-wrap items-center justify-between gap-0 rounded-2xl border border-border-secondary px-6 py-4 shadow-md max-md:flex-col max-md:items-stretch max-md:p-5"
      >
        <div class="flex w-full items-start p-0">
          <h4 class="m-0 text-[0.9rem] font-semibold tracking-tight text-main">
            {{ t('pages.upload.linkFormat') }}
          </h4>
        </div>
        <div class="flex w-full flex-row gap-2 p-2">
          <!-- Format Options -->
          <div class="flex flex-1 flex-col gap-3">
            <label class="m-0 text-xs font-medium text-secondary">{{ t('pages.upload.outputFormat') }}</label>
            <div class="flex flex-row">
              <button
                v-for="(format, key) in pasteFormatList"
                :key
                class="flex-1 cursor-pointer rounded-md border border-border-secondary bg-bg-secondary px-1 py-1 font-['SF_Mono',Monaco,'Cascadia_Code','Roboto_Mono',Consolas,'Courier_New',monospace] text-[0.7rem] font-medium text-secondary duration-fast ease-standard hover:bg-accent/30 hover:text-white focus-visible:focus-ring data-[active=true]:border-accent data-[active=true]:bg-accent data-[active=true]:text-white"
                :data-active="pasteStyle === key"
                :title="format"
                @click="updatePasteStyle(key)"
              >
                {{ key }}
              </button>
            </div>
          </div>

          <!-- URL Length Options -->
          <div class="flex flex-1 flex-col gap-3">
            <label class="m-0 text-xs font-medium text-secondary">{{ t('pages.upload.urlType.title') }}</label>
            <div class="flex w-full overflow-hidden rounded-md border border-border-secondary bg-bg-secondary">
              <button
                class="flex-1 cursor-pointer border-0 bg-transparent py-1 font-[inherit] text-xs font-medium text-secondary duration-fast ease-standard hover:bg-accent/30 hover:text-white focus-visible:focus-ring data-[active=true]:bg-accent data-[active=true]:text-white"
                :data-active="!useShortUrl"
                @click="updateUrlType(false)"
              >
                <span>{{ t('pages.upload.urlType.normal') }}</span>
              </button>
              <button
                class="flex-1 cursor-pointer border-0 bg-transparent py-1 font-[inherit] text-xs font-medium text-secondary duration-fast ease-standard hover:bg-accent/30 hover:text-white focus-visible:focus-ring data-[active=true]:bg-accent data-[active=true]:text-white"
                :data-active="useShortUrl"
                @click="updateUrlType(true)"
              >
                <span>{{ t('pages.upload.urlType.short') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Image Process Dialog -->
    <ImageProcessDialog
      v-if="imageProcessDialogVisible"
      v-model:visible="imageProcessDialogVisible"
      :config-id="defaultIdG"
      :current-picbed-name="defaultPicBedG"
    />

    <!-- Task Queue Manager Modal -->
    <CustomModal v-model:visible="taskDialogVisible" :title="t('pages.upload.taskQueue.title')">
      <template #header>
        <div class="flex flex-row items-center gap-4">
          <h3 class="flex items-center gap-2.5 bg-clip-text text-xl font-bold tracking-tight text-main">
            {{ t('pages.upload.taskQueue.title') }}
          </h3>
          <span class="m-0 text-lg font-semibold text-secondary">
            {{
              t('pages.upload.taskQueue.stats', {
                completed: taskQueueStatus.stats.completed,
                total: taskQueueStatus.stats.total,
              })
            }}
          </span>
        </div>
      </template>

      <div class="no-scrollbar max-h-[calc(90vh-90px)] overflow-y-auto">
        <!-- Action Bar -->
        <div
          class="flex flex-wrap items-center justify-between gap-4 border-b border-b-border px-5 py-4 max-md:flex-col max-md:items-stretch"
        >
          <div class="flex flex-wrap items-center gap-2.5 max-md:w-full max-md:justify-center">
            <CustomButton
              v-show="taskQueueStatus.tasks.length > 0"
              :icon="PlusIcon"
              :text="t('pages.upload.taskQueue.addFiles')"
              @click="addFilesToTask"
            />
            <CustomButton
              v-if="!taskQueueStatus.config.isRunning && taskQueueStatus.stats.pending > 0"
              class="bg-success hover:bg-success!"
              :icon="PlayIcon"
              :text="t('pages.upload.taskQueue.start')"
              @click="startTaskQueue"
            />
            <CustomButton
              v-if="taskQueueStatus.config.isRunning && !taskQueueStatus.config.isPaused"
              class="bg-warning hover:bg-warning!"
              :icon="PauseIcon"
              :text="t('pages.upload.taskQueue.pause')"
              @click="pauseTaskQueue"
            />
            <CustomButton
              v-if="taskQueueStatus.config.isPaused"
              class="bg-success hover:bg-success!"
              :icon="PlayIcon"
              :text="t('pages.upload.taskQueue.resume')"
              @click="resumeTaskQueue"
            />
          </div>
          <div class="flex flex-wrap items-center gap-2.5 max-md:w-full max-md:justify-center">
            <CustomButton
              v-if="taskQueueStatus.stats.failed > 0"
              class="bg-warning hover:bg-warning!"
              :icon="RefreshCwIcon"
              :text="t('pages.upload.taskQueue.retryAllFailed')"
              @click="retryAllFailedTasks"
            />
            <CustomButton
              v-if="taskQueueStatus.config.isRunning || taskQueueStatus.stats.pending > 0"
              class="bg-error hover:bg-error!"
              :icon="XIcon"
              :text="t('pages.upload.taskQueue.cancelAll')"
              @click="cancelAllTasks"
            />
            <CustomButton
              v-if="
                taskQueueStatus.stats.completed > 0 ||
                taskQueueStatus.stats.failed > 0 ||
                taskQueueStatus.stats.cancelled > 0
              "
              class="bg-danger hover:bg-danger!"
              :icon="Trash2Icon"
              :text="t('pages.upload.taskQueue.clearFinished')"
              @click="clearFinishedTasks"
            />
            <CustomButton
              :icon="SettingsIcon"
              :aria-label="t('pages.settings.title')"
              :aria-expanded="showTaskSettings"
              @click="showTaskSettings = !showTaskSettings"
            />
          </div>
        </div>

        <!-- Overall Progress -->
        <div v-if="taskQueueStatus.stats.total > 0" class="border-b border-b-border p-5">
          <div class="mb-3.5 flex items-center justify-between">
            <span class="text-sm font-semibold text-main">{{ t('pages.upload.taskQueue.overallProgress') }}</span>
            <span class="text-xl leading-1 font-bold text-accent">{{ overallProgressPercent }}%</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-surface-elevated">
            <div
              class="h-full bg-[linear-gradient(90deg,var(--color-accent)_0%,var(--color-primary)_50%)] shadow-sm transition-[width] duration-medium ease-standard"
              :style="{ width: `${overallProgressPercent}%` }"
            />
          </div>
          <div class="mt-2 flex flex-wrap justify-between gap-4">
            <span
              v-if="taskQueueStatus.stats.avgSpeed > 0"
              class="flex items-center gap-2 py-1.5 text-xs text-secondary"
            >
              <ZapIcon :size="14" class="text-accent" />
              {{ formatSpeed(taskQueueStatus.stats.avgSpeed) }}
            </span>
            <span
              v-if="taskQueueStatus.stats.estimatedTimeMs > 0 && taskQueueStatus.config.isRunning"
              class="flex items-center gap-2 py-1.5 text-xs text-secondary"
            >
              <ClockIcon :size="14" class="text-accent" />
              {{ formatTime(taskQueueStatus.stats.estimatedTimeMs) }}
            </span>
            <span class="flex items-center gap-2 py-1.5 text-xs text-secondary">
              <HardDriveIcon :size="14" class="text-accent" />
              {{ formatSize(taskQueueStatus.stats.completedSize) }} /
              {{ formatSize(taskQueueStatus.stats.totalSize) }}
            </span>
          </div>
        </div>

        <!-- Settings Panel -->
        <transition name="settings-slide">
          <div v-if="showTaskSettings" class="overflow-visible border-b border-b-border p-4">
            <div class="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] items-center gap-4 max-md:grid-cols-1">
              <div class="flex min-w-0 flex-col gap-2">
                <label class="m-0 flex items-center gap-2 text-sm font-medium text-main">
                  {{ t('pages.upload.taskQueue.interval') }}
                </label>
                <div class="flex items-center gap-2.5 max-sm:flex-row">
                  <input
                    v-model.number="uploadInterval"
                    type="number"
                    min="1"
                    max="99999"
                    step="1"
                    class="box-border w-full flex-1 rounded-md bg-surface-elevated px-3 py-2 text-sm text-main transition-all duration-fast ease-standard hover:border-accent hover:bg-surface focus:border-accent focus:bg-white focus:shadow-md focus:outline-0 disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60"
                    :disabled="taskQueueStatus.config.isRunning"
                    @change="updateInterval"
                  />
                  <span class="bg-transparent px-1 py-2 text-sm font-semibold text-secondary">s</span>
                </div>
              </div>
              <div class="flex min-w-0 flex-col gap-2">
                <label class="m-0 flex items-center gap-2 text-sm font-medium text-main">{{
                  t('pages.upload.taskQueue.maxRetry')
                }}</label>
                <input
                  v-model.number="maxRetryCount"
                  type="number"
                  min="0"
                  max="10"
                  step="1"
                  class="box-border w-full rounded-md bg-surface-elevated px-3 py-2 text-sm text-main transition-all duration-fast ease-standard hover:border-accent hover:bg-surface focus:border-accent focus:bg-white focus:shadow-md focus:outline-0 disabled:cursor-not-allowed disabled:bg-surface disabled:opacity-60"
                  @change="updateSettings"
                />
              </div>
              <div
                class="flex min-h-[40px] min-w-0 flex-row items-center justify-between gap-2 rounded-md bg-transparent px-3 py-2.5 transition-all duration-fast ease-standard hover:bg-surface-elevated"
              >
                <label class="m-0 flex items-center gap-2 text-base font-semibold text-main" for="task-auto-start">
                  {{ t('pages.upload.taskQueue.autoStart') }}
                </label>
                <input
                  id="task-auto-start"
                  v-model="autoStart"
                  type="checkbox"
                  class="h-[16px] w-[16px] cursor-pointer accent-accent"
                  @change="updateSettings"
                />
              </div>
              <div
                class="flex min-h-[40px] min-w-0 flex-row items-center justify-between gap-2 rounded-md bg-transparent px-3 py-2.5 transition-all duration-fast ease-standard hover:bg-surface-elevated"
              >
                <label class="m-0 flex items-center gap-2 text-base font-semibold text-main" for="task-pause-on-error">
                  {{ t('pages.upload.taskQueue.pauseOnError') }}
                </label>
                <input
                  id="task-pause-on-error"
                  v-model="pauseOnError"
                  type="checkbox"
                  class="h-[16px] w-[16px] cursor-pointer accent-accent"
                  @change="updateSettings"
                />
              </div>
            </div>
          </div>
        </transition>

        <!-- Filter & Search Bar -->
        <div v-if="taskQueueStatus.tasks.length > 0" class="flex flex-col gap-2 border-b border-b-border p-5">
          <div
            class="flex items-center gap-2.5 rounded-lg border border-border-secondary bg-bg-secondary px-4 py-2.5 shadow-sm transition-all duration-fast ease-standard focus-within:border-accent focus-within:bg-white focus-within:shadow-md"
          >
            <SearchIcon :size="16" class="shrink-0 text-accent" />
            <input
              v-model="taskSearchQuery"
              type="text"
              class="flex border-0 bg-transparent text-sm text-main outline-0 placeholder:text-tertiary max-sm:max-w-none"
              :placeholder="t('pages.upload.taskQueue.searchPlaceholder')"
            />
          </div>
          <div class="flex flex-wrap gap-2.5">
            <CustomButton
              v-for="status in ['all', 'pending', 'completed', 'failed']"
              :key="status"
              :type="taskFilter === status ? 'primary' : 'secondary'"
              :text="t(`pages.upload.taskQueue.filter${status.charAt(0).toUpperCase() + status.slice(1)}`)"
              @click="taskFilter = status"
            />
          </div>
        </div>

        <!-- Task List -->
        <div v-if="taskQueueStatus.tasks.length > 0" class="min-h-[300px] flex-1 overflow-y-auto">
          <TransitionGroup name="task" tag="div" class="flex flex-col">
            <div
              v-for="task in filteredTasks"
              :key="task.id"
              class="group/tasklist relative flex items-center justify-between gap-2 border-b border-b-border bg-surface px-5 py-4 transition-all duration-fast ease-standard last:border-b-0 hover:bg-surface-elevated hover:shadow-sm max-md:flex-col max-md:items-start max-md:gap-3"
              :class="getTaskStatusClass(task.status)"
            >
              <div class="flex min-w-0 flex-1 flex-col gap-2.5">
                <div class="flex items-center justify-between gap-3.5">
                  <div class="flex min-w-0 flex-1 items-center gap-2.5">
                    <span
                      class="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap text-main group-[.status-cancelled]/tasklist:text-tertiary group-[.status-cancelled]/tasklist:line-through group-[.status-completed]/tasklist:text-success group-[.status-failed]/tasklist:text-danger"
                      :title="task.filePath"
                      >{{ task.fileName }}</span
                    >
                    <span
                      v-if="task.priority === 2"
                      class="flex shrink-0 items-center justify-center rounded-full bg-warning p-1 text-white"
                    >
                      <StarIcon :size="13" />
                    </span>
                  </div>
                  <div
                    class="rounded-full px-2.5 py-1 text-xs font-semibold tracking-wider whitespace-nowrap uppercase [.status-cancelled]:bg-tertiary/15 [.status-cancelled]:text-tertiary [.status-cancelled]:line-through [.status-completed]:bg-success/15 [.status-completed]:text-success [.status-failed]:bg-danger/15 [.status-failed]:text-danger [.status-pending]:bg-accent/15 [.status-pending]:text-secondary [.status-uploading]:bg-primary/15 [.status-uploading]:text-primary"
                    :class="getTaskStatusClass(task.status)"
                  >
                    {{ getTaskStatusText(task.status) }}
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-3">
                  <span v-if="task.fileSize > 0" class="flex items-center gap-1 text-[0.75rem] text-tertiary">
                    <HardDriveIcon :size="12" class="text-secondary" />
                    {{ formatSize(task.fileSize) }}
                  </span>
                  <span
                    v-if="task.uploadSpeed && task.status === 'uploading'"
                    class="flex items-center gap-1 text-[0.75rem] text-tertiary"
                  >
                    <ZapIcon :size="12" />
                    {{ formatSpeed(task.uploadSpeed) }}
                  </span>
                  <span v-if="task.retryCount > 0" class="flex items-center gap-1 text-[0.75rem] text-warning">
                    {{ t('pages.upload.taskQueue.retryCount', { count: task.retryCount }) }}
                  </span>
                  <span
                    v-if="task.error"
                    class="flex max-w-[200px] items-center gap-1 overflow-hidden text-[0.75rem] text-ellipsis whitespace-nowrap text-danger"
                    :title="task.error"
                  >
                    {{ task.error }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-1.5">
                <!-- Pending task actions -->
                <template v-if="task.status === 'pending'">
                  <button
                    class="task-icon-btn"
                    :title="t('pages.upload.taskQueue.moveUp')"
                    @click="moveTaskUp(task.id)"
                  >
                    <ChevronUpIcon :size="16" />
                  </button>
                  <button
                    class="task-icon-btn"
                    :title="t('pages.upload.taskQueue.moveDown')"
                    @click="moveTaskDown(task.id)"
                  >
                    <ChevronDownIcon :size="16" />
                  </button>
                  <button
                    class="task-icon-btn"
                    :class="{ 'is-high': task.priority === 2 }"
                    :title="t('pages.upload.taskQueue.togglePriority')"
                    @click="toggleTaskPriority(task.id, task.priority)"
                  >
                    <StarIcon :size="16" />
                  </button>
                  <button
                    class="task-icon-btn danger"
                    :title="t('pages.upload.taskQueue.cancelTask')"
                    @click="cancelTask(task.id)"
                  >
                    <XIcon :size="16" />
                  </button>
                </template>
                <!-- Failed task actions -->
                <template v-if="task.status === 'failed'">
                  <button
                    class="task-icon-btn"
                    :title="t('pages.upload.taskQueue.retryTask')"
                    @click="retryTask(task.id)"
                  >
                    <RefreshCwIcon :size="16" />
                  </button>
                  <button
                    class="task-icon-btn danger"
                    :title="t('pages.upload.taskQueue.removeTask')"
                    @click="removeTask(task.id)"
                  >
                    <Trash2Icon :size="16" />
                  </button>
                </template>
                <!-- Completed/Cancelled task actions -->
                <template v-if="task.status === 'completed' || task.status === 'cancelled'">
                  <button
                    class="task-icon-btn"
                    :title="t('pages.upload.taskQueue.removeTask')"
                    @click="removeTask(task.id)"
                  >
                    <Trash2Icon :size="16" />
                  </button>
                </template>
                <!-- Status icon -->
                <div class="flex h-[32px] w-[32px] items-center justify-center">
                  <CheckCircleIcon v-if="task.status === 'completed'" :size="18" class="text-success" />
                  <XCircleIcon v-if="task.status === 'failed'" :size="18" class="text-error" />
                  <LoaderIcon
                    v-if="task.status === 'uploading'"
                    :size="18"
                    class="animate-[spin_1s_linear_infinite] text-accent"
                  />
                  <ClockIcon v-if="task.status === 'pending'" :size="18" class="text-tertiary" />
                </div>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Empty State -->
        <div v-else class="flex h-full flex-col items-center gap-4 bg-bg-tertiary px-8 py-12 text-center">
          <ListTodoIcon class="text-accent opacity-90" :size="48" />
          <h4 class="m-0 text-xl font-semibold text-main">{{ t('pages.upload.taskQueue.empty') }}</h4>
          <p class="m-0 max-w-[400px] text-base text-secondary">{{ t('pages.upload.taskQueue.emptyHint') }}</p>
          <CustomButton :icon="PlusIcon" :text="t('pages.upload.taskQueue.selectFiles')" @click="addFilesToTask" />
        </div>
      </div>
    </CustomModal>
  </div>
</template>

<script lang="ts" setup>
import {
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardIcon,
  ClockIcon,
  EditIcon,
  HardDriveIcon,
  LinkIcon,
  ListTodoIcon,
  LoaderIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Settings,
  SettingsIcon,
  StarIcon,
  Trash2Icon,
  UploadCloudIcon,
  XCircleIcon,
  XIcon,
  ZapIcon,
} from '@lucide/vue'
import { computed, defineAsyncComponent, onBeforeMount, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import PicBedSwitcher from '@/components/PicBedSwitcher.vue'
import { useDragEventListeners } from '@/composables/useDragEventListeners'
import { MAX_FAVORITE_PICBEDS, useFavoritePicbeds } from '@/composables/useFavoritePicbeds'
import { usePicBed } from '@/composables/useGlobal'
import useMessage from '@/composables/useMessage'
import { useUploadProgress } from '@/composables/useUploadProgress'
import { useUploadTaskQueue } from '@/composables/useUploadTaskQueue'
import { PICBEDS_PAGE } from '@/router/config'
import { getConfig, saveConfig } from '@/services/configService'
import $bus from '@/utils/bus'
import { configPaths } from '@/utils/configPaths'
import { getUploadFiles } from '@/utils/uploadFiles'
import { IPasteStyle } from '#/constants/app'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '#/constants/ipcChannels'
import { IRPCActionType } from '#/constants/rpcActions'
import { isUrl } from '#/utils/url'

defineOptions({ name: 'UploadPage' })

const ImageProcessDialog = defineAsyncComponent(() => import('@/components/ImageProcessDialog.vue'))

const uploadArea = useTemplateRef('uploadArea')
const fileInput = useTemplateRef('fileInput')
useDragEventListeners(uploadArea)

const $router = useRouter()
const { t } = useI18n()
const message = useMessage()
const { picBedG, defaultPicBedG, defaultConfigNameG, defaultIdG, updatePicBeds } = usePicBed()
const {
  favoritePicbeds,
  longPressedBadge,
  isCurrentPicBedInFavorites,
  addCurrentPicbedToFavorites,
  removePicbedFromFavorites,
  getPicbedName,
  isCurrentPicbed,
  handleBadgeClick,
  startBadgeLongPress,
  endBadgeLongPress,
} = useFavoritePicbeds()
const { progress, showProgress, showError, progressState, progressLabel } = useUploadProgress()
const {
  taskDialogVisible,
  uploadInterval,
  showTaskSettings,
  taskSearchQuery,
  taskFilter,
  autoStart,
  pauseOnError,
  maxRetryCount,
  taskQueueStatus,
  filteredTasks,
  overallProgressPercent,
  openTaskDialog,
  refreshTaskStatus,
  addFilesToTask,
  startTaskQueue,
  pauseTaskQueue,
  resumeTaskQueue,
  cancelAllTasks,
  cancelTask,
  removeTask,
  clearFinishedTasks,
  updateInterval,
  retryTask,
  retryAllFailedTasks,
  moveTaskUp,
  moveTaskDown,
  toggleTaskPriority,
  updateSettings,
  getTaskStatusClass,
  getTaskStatusText,
} = useUploadTaskQueue()

const imageProcessDialogVisible = ref(false)
const dragover = ref(false)
const useShortUrl = ref(false)
const pasteStyle = ref(IPasteStyle.MARKDOWN)
const pasteFormatList = ref<Record<string, string>>({
  [IPasteStyle.MARKDOWN]: '![alt](url)',
  [IPasteStyle.HTML]: '<img src="url"/>',
  [IPasteStyle.URL]: 'http://test.com/test.png',
  [IPasteStyle.UBB]: '[img]url[/img]',
  [IPasteStyle.CUSTOM]: '',
})

const picBedName = computed(() => {
  if (!picBedG.value || picBedG.value.length === 0) return ''
  const provider = picBedG.value.find(item => item.type === defaultPicBedG.value)
  return provider ? provider.name : defaultPicBedG.value
})

function handleImageProcess() {
  imageProcessDialogVisible.value = true
}

async function openPicBedSettings() {
  const uploader = await getConfig<IUploaderConfigItem>(`uploader.${defaultPicBedG.value}`)
  $router.push({
    name: PICBEDS_PAGE,
    params: {
      type: defaultPicBedG.value,
      configId: defaultIdG.value,
    },
    query: {
      defaultConfigId: uploader?.defaultId || '',
    },
  })
}

function onDrop(event: DragEvent) {
  dragover.value = false
  const dataTransfer = event.dataTransfer
  if (!dataTransfer) return

  // Local files take precedence over dragged text or HTML.
  if (dataTransfer.files?.length) {
    uploadFiles(dataTransfer.files)
    return
  }

  const items = dataTransfer.items
  if (!items?.length) return
  if (items.length === 2 && items[0].type === 'text/uri-list') {
    handleURLDrag(items, dataTransfer)
    return
  }
  if (items[0].type !== 'text/plain') return

  const url = dataTransfer.getData(items[0].type)
  if (!isUrl(url)) {
    message.error(t('pages.upload.dragValidPictureOrUrl'))
    return
  }
  window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [{ path: url }])
}

function handleURLDrag(items: DataTransferItemList, dataTransfer: DataTransfer) {
  const html = dataTransfer.getData(items[1].type)
  const imageMatch = html.match(/<img.*src="(.*?)"/)
  if (!imageMatch) {
    message.error(t('pages.upload.dragValidPictureOrUrl'))
    return
  }
  window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [{ path: imageMatch[1] }])
}

function openUploadWindow() {
  fileInput.value?.click()
}

function handleFileSelection(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files) uploadFiles(input.files)
  if (fileInput.value) fileInput.value.value = ''
}

function uploadFiles(files: FileList) {
  window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, getUploadFiles(files))
}

async function loadUploadSettings() {
  const settings = await getConfig<{ pasteStyle?: string; customLink?: string; useShortUrl?: boolean }>('settings')
  pasteStyle.value = settings?.pasteStyle || IPasteStyle.MARKDOWN
  pasteFormatList.value.Custom = settings?.customLink || '![$fileName]($url)'
  useShortUrl.value = settings?.useShortUrl || false
}

async function updatePasteStyle(style: string) {
  pasteStyle.value = style
  await saveConfig({
    [configPaths.settings.pasteStyle]: style || IPasteStyle.MARKDOWN,
  })
}

async function updateUrlType(shortUrl: boolean) {
  useShortUrl.value = shortUrl
  await saveConfig({
    [configPaths.settings.useShortUrl]: shortUrl,
  })
}

function uploadClipboardFiles() {
  window.electron.sendRPC(IRPCActionType.UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE)
}

async function uploadURLFiles() {
  const text = await navigator.clipboard.readText()
  $bus.emit(SHOW_INPUT_BOX, {
    value: isUrl(text) ? text : '',
    title: t('pages.upload.inputUrlTip'),
    placeholder: t('pages.upload.httpPrefixTip') + '\n' + t('pages.upload.multipleUrlsHint'),
    multiLine: true,
  })
}

function showInvalidUrls(urls: string[]) {
  if (!urls.length) return
  const errorMessage =
    urls.length === 1
      ? t('pages.upload.inputValidUrl') + ': ' + urls[0]
      : t('pages.upload.invalidUrlsFound', {
          count: urls.length,
          urls: urls.slice(0, 3).join(', ') + (urls.length > 3 ? '...' : ''),
        })
  message.error(errorMessage)
}

function handleInputBoxValue(value: string) {
  const validUrls: string[] = []
  const invalidUrls: string[] = []
  for (const line of value.split('\n')) {
    const url = line.trim()
    if (!url) continue
    if (isUrl(url)) validUrls.push(url)
    else invalidUrls.push(url)
  }

  showInvalidUrls(invalidUrls)
  if (!validUrls.length) return

  window.electron.sendRPC(
    IRPCActionType.UPLOAD_CHOOSED_FILES,
    validUrls.map(path => ({ path })),
  )
  if (validUrls.length > 1) {
    message.success(t('pages.upload.uploadingMultipleUrls', { count: validUrls.length }))
  }
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const unitSize = 1024
  const units = ['B', 'KB', 'MB', 'GB']
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(unitSize))
  return parseFloat((bytes / Math.pow(unitSize, unitIndex)).toFixed(1)) + ' ' + units[unitIndex]
}

function formatSpeed(bytesPerSecond: number): string {
  return formatSize(bytesPerSecond) + '/s'
}

function formatTime(ms: number): string {
  if (ms < 1000) return '< 1s'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

let removeSyncPicBedListener: () => void = () => {}

onBeforeMount(async () => {
  removeSyncPicBedListener = window.electron.ipcRendererOn('syncPicBed', () => {
    updatePicBeds()
  })
  $bus.on(SHOW_INPUT_BOX_RESPONSE, handleInputBoxValue)
  await Promise.all([loadUploadSettings(), refreshTaskStatus()])
})

onBeforeUnmount(() => {
  $bus.off(SHOW_INPUT_BOX_RESPONSE)
  removeSyncPicBedListener()
})
</script>

<style scoped src="./Upload.css"></style>
