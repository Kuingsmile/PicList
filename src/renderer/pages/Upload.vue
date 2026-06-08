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
            @click="handlePicBedNameClick(picBedName)"
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
              @mousedown="handleBadgeMouseDown(picbedType)"
              @mouseup="handleBadgeMouseUp"
              @mouseleave="handleBadgeMouseUp"
              @touchstart="handleBadgeTouchStart(picbedType, $event)"
              @touchend="handleBadgeTouchEnd"
              @touchcancel="handleBadgeTouchEnd"
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
          <div class="inline-flex overflow-hidden rounded-md bg-bg-secondary shadow-sm">
            <button
              class="segmented-button"
              :title="t('pages.upload.imageProcessNameSingle')"
              @click="handleImageProcessSingle"
            >
              <Settings :size="16" />
              <span>{{ t('pages.upload.imageProcessNameSingle') }}</span>
            </button>
            <button class="segmented-button" :title="t('pages.upload.imageProcessName')" @click="handleImageProcess">
              <span>{{ t('pages.upload.imageProcessName') }}</span>
            </button>
          </div>
          <button
            class="flex cursor-pointer items-center gap-2 rounded-md border-none bg-accent px-4 py-2.5 font-[inherit] text-sm font-medium text-white duration-fast ease-standard hover:-translate-y-px hover:bg-accent-hover hover:shadow-md focus-visible:focus-ring max-md:flex-1 max-md:justify-center max-xs:px-3 max-xs:py-2 max-xs:text-[0.8rem]"
            @click="handleChangePicBed"
          >
            <ArrowLeftRightIcon :size="16" />
            <span>{{ t('pages.upload.changePicBed') }}</span>
          </button>
        </div>
      </div>

      <!-- Main Upload Card -->
      <div
        class="flex min-h-[230px] w-full flex-1 flex-wrap items-center justify-center gap-4 rounded-2xl border border-border-secondary px-6 py-4 shadow-md max-md:flex-col max-md:items-stretch max-md:p-5"
      >
        <div
          id="upload-area"
          ref="uploadArea"
          class="group/upload relative flex h-full w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-bg-secondary px-1 py-12 duration-medium ease-standard focus-visible:focus-ring focus-visible:outline-offset-4 max-md:px-4 max-md:py-8 max-xs:px-2 max-xs:py-6 [:hover,.drag-active]:border-accent [:hover,.drag-active]:bg-[linear-gradient(135deg,var(--color-surface-elevated)_0%,color-mix(in_srgb,var(--color-accent),transparent_95%)_100%)] [:hover,.drag-active]:shadow-lg [:hover,.drag-active&]:-translate-y-[2px]"
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
          <input id="file-uploader" ref="fileInput" type="file" multiple class="hidden" @change="onChange" />
        </div>

        <!-- Progress Bar -->
      </div>

      <div
        v-if="showProgress"
        class="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-secondary p-0 shadow-md"
      >
        <div class="flex w-full items-center gap-2 rounded-lg border border-border bg-surface p-2">
          <div class="h-3 flex-1 overflow-hidden rounded-lg bg-bg-secondary">
            <div
              class="h-full rounded-lg bg-[linear-gradient(90deg,var(--color-accent)_0%,var(--color-primary)_50%)] duration-fast ease-standard data-[error=true]:bg-danger data-[error=true]:bg-none"
              :data-error="showError"
              :style="{ width: `${progress}%` }"
            />
          </div>
          <span class="m-0 flex items-center justify-center text-center text-sm font-semibold text-secondary">
            {{ showError ? t('pages.upload.uploadFailed') : `${progress}%` }}
          </span>
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
                :key="key"
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
    <transition name="modal">
      <CustomModal
        v-if="imageProcessDialogVisible"
        v-model:visible="imageProcessDialogVisible"
        title=" "
        :description="
          PicBedId === '' ? t('pages.imageProcess.subtitle-Global') : t('pages.imageProcess.subtitle-PerPicbed')
        "
      >
        <ImageProcessSetting :config-id="PicBedId" :current-picbed-name="defaultPicBedG" />
      </CustomModal>
    </transition>

    <!-- Task Queue Manager Modal -->
    <transition name="modal">
      <CustomModal v-if="taskDialogVisible" v-model:visible="taskDialogVisible">
        <template #titleBar>
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
                type="primary"
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
              <CustomButton type="primary" :icon="SettingsIcon" text="" @click="showTaskSettings = !showTaskSettings" />
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
                  <label
                    class="m-0 flex items-center gap-2 text-base font-semibold text-main"
                    for="task-pause-on-error"
                  >
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
            <CustomButton
              type="primary"
              :icon="PlusIcon"
              :text="t('pages.upload.taskQueue.selectFiles')"
              @click="addFilesToTask"
            />
          </div>
        </div>
      </CustomModal>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import {
  ArrowLeftRightIcon,
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
import { useStorage } from '@vueuse/core'
import { computed, onBeforeMount, onBeforeUnmount, reactive, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomModal from '@/components/common/CustomModal.vue'
import ImageProcessSetting from '@/components/ImageProcessSetting.vue'
import { usePicBed } from '@/hooks/useGlobal'
import useMessage from '@/hooks/useMessage'
import { PICBEDS_PAGE } from '@/router/config'
import $bus from '@/utils/bus'
import { isUrl } from '@/utils/common'
import { configPaths } from '@/utils/configPaths'
import { SHOW_INPUT_BOX, SHOW_INPUT_BOX_RESPONSE } from '@/utils/constant'
import { getConfig, saveConfig } from '@/utils/dataSender'
import { useDragEventListeners } from '@/utils/drag'
import { IPasteStyle, IRPCActionType } from '@/utils/enum'

// Task queue types
interface IUploadTaskItem {
  id: string
  fileName: string
  filePath: string
  fileSize: number
  status: string
  progress: number
  error?: string
  result?: any
  createdAt: number
  startedAt?: number
  completedAt?: number
  retryCount: number
  priority: number
  uploadSpeed?: number
  uploadDuration?: number
}

interface IUploadTaskQueueStatus {
  tasks: IUploadTaskItem[]
  config: {
    intervalS: number
    isRunning: boolean
    isPaused: boolean
    autoStart: boolean
    pauseOnError: boolean
    maxRetryCount: number
  }
  stats: {
    total: number
    pending: number
    completed: number
    failed: number
    cancelled: number
    uploading: number
    totalSize: number
    completedSize: number
    avgSpeed: number
    estimatedTimeMs: number
  }
}

const uploadArea = useTemplateRef('uploadArea')
useDragEventListeners(uploadArea)
const $router = useRouter()
const { t } = useI18n()
const message = useMessage()
const { picBedG, defaultPicBedG, defaultConfigNameG, defaultIdG, updatePicBeds } = usePicBed()

const imageProcessDialogVisible = ref(false)
const taskDialogVisible = ref(false)
const useShortUrl = ref(false)
const dragover = ref(false)
const progress = ref(0)
const showProgress = ref(false)
const showError = ref(false)
const pasteStyle = ref(IPasteStyle.MARKDOWN)
const PicBedId = ref('')
const fileInput = useTemplateRef('fileInput')
const uploadInterval = ref(1000)
const showTaskSettings = useStorage('upload-task-queue-show-settings', true)
const taskSearchQuery = ref('')
const taskFilter = ref<string>('all')
const autoStart = ref(false)
const pauseOnError = ref(false)
const maxRetryCount = ref(3)
const favoritePicbeds = useStorage<IFavoritePicbedItem[]>('favorite-picbeds', [])
const taskQueueStatus = reactive<IUploadTaskQueueStatus>({
  tasks: [],
  config: {
    intervalS: 1,
    isRunning: false,
    isPaused: false,
    autoStart: false,
    pauseOnError: false,
    maxRetryCount: 3,
  },
  stats: {
    total: 0,
    pending: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
    uploading: 0,
    totalSize: 0,
    completedSize: 0,
    avgSpeed: 0,
    estimatedTimeMs: 0,
  },
})
const longPressedBadge = ref<string | null>(null)
const pasteFormatList = ref<Record<string, string>>({
  [IPasteStyle.MARKDOWN]: '![alt](url)',
  [IPasteStyle.HTML]: '<img src="url"/>',
  [IPasteStyle.URL]: 'http://test.com/test.png',
  [IPasteStyle.UBB]: '[img]url[/img]',
  [IPasteStyle.CUSTOM]: '',
})

const MAX_FAVORITE_PICBEDS = 6
let longPressTimer: NodeJS.Timeout | null = null
const LONG_PRESS_DURATION = 500

const isCurrentPicBedInFavorites = computed(() => {
  const result = favoritePicbeds.value.some(item => item.id === defaultIdG.value)
  return result
})

const filteredTasks = computed(() => {
  let tasks = taskQueueStatus.tasks

  if (taskFilter.value !== 'all') {
    tasks = tasks.filter(t => t.status === taskFilter.value)
  }

  if (taskSearchQuery.value) {
    const query = taskSearchQuery.value.toLowerCase()
    tasks = tasks.filter(t => t.fileName.toLowerCase().includes(query))
  }

  return tasks
})

const overallProgressPercent = computed(() => {
  if (taskQueueStatus.stats.total === 0) return 0
  const completed = taskQueueStatus.stats.completed
  const total = taskQueueStatus.stats.total - taskQueueStatus.stats.cancelled
  return total > 0 ? Math.round((completed / total) * 100) : 0
})

const picBedName = computed(() => {
  if (!picBedG.value || picBedG.value.length === 0) {
    return ''
  }
  const target = picBedG.value.find(item => item.type === defaultPicBedG.value)
  return target ? target.name : defaultPicBedG.value
})

function syncPicBedHandler(): void {
  updatePicBeds()
}

watch(progress, onProgressChange)
watch(favoritePicbeds, valideFavoritePicbeds, { immediate: true })

let removeUploadProgressListenerCallback: () => void = () => {}
let removeSyncPicBedListenerCallback: () => void = () => {}

function uploadProgressHandler(p: number): void {
  if (p !== -1) {
    showProgress.value = true
    progress.value = p
  } else {
    progress.value = 100
    showError.value = true
  }
}

function handleImageProcess() {
  PicBedId.value = ''
  imageProcessDialogVisible.value = true
}

function handleImageProcessSingle() {
  PicBedId.value = defaultIdG.value
  imageProcessDialogVisible.value = true
}

function onProgressChange(val: number) {
  if (val === 100) {
    setTimeout(() => {
      showProgress.value = false
      showError.value = false
    }, 1000)
    setTimeout(() => {
      progress.value = 0
    }, 1200)
  }
}

async function handlePicBedNameClick(_picBedName: string) {
  const currentPicBedConfig = ((await getConfig<any[]>(`uploader.${defaultPicBedG.value}`)) as any) || {}
  $router.push({
    name: PICBEDS_PAGE,
    params: {
      type: defaultPicBedG.value,
      configId: defaultIdG.value,
    },
    query: {
      defaultConfigId: currentPicBedConfig.defaultId || '',
    },
  })
}

function onDrop(e: DragEvent) {
  dragover.value = false

  // send files first
  if (e.dataTransfer?.files?.length) {
    ipcSendFiles(e.dataTransfer.files)
  } else if (e.dataTransfer?.items) {
    const items = e.dataTransfer.items
    if (items.length === 2 && items[0].type === 'text/uri-list') {
      handleURLDrag(items, e.dataTransfer)
    } else if (items[0].type === 'text/plain') {
      const str = e.dataTransfer.getData(items[0].type)
      if (isUrl(str)) {
        window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [{ path: str }])
      } else {
        message.error(t('pages.upload.dragValidPictureOrUrl'))
      }
    }
  }
}

function handleURLDrag(items: DataTransferItemList, dataTransfer: DataTransfer) {
  const urlString = dataTransfer.getData(items[1].type)
  const urlMatch = urlString.match(/<img.*src="(.*?)"/)
  if (urlMatch) {
    window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, [
      {
        path: urlMatch[1],
      },
    ])
  } else {
    message.error(t('pages.upload.dragValidPictureOrUrl'))
  }
}

function openUploadWindow() {
  fileInput.value?.click()
}

function onChange(e: any) {
  ipcSendFiles(e.target.files)
  ;(fileInput.value as HTMLInputElement).value = ''
}

function ipcSendFiles(files: FileList) {
  const sendFiles: IFileWithPath[] = []
  Array.from(files).forEach(item => {
    const obj = {
      name: item.name,
      path: window.electron.showFilePath(item),
    }
    sendFiles.push(obj)
  })
  window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, sendFiles)
}

async function initConf() {
  const settingConfig = await getConfig<any>('settings')
  pasteStyle.value = settingConfig?.pasteStyle || IPasteStyle.MARKDOWN
  pasteFormatList.value.Custom = settingConfig?.customLink || '![$fileName]($url)'
  useShortUrl.value = settingConfig?.useShortUrl || false
}

function updatePasteStyle(style: string) {
  pasteStyle.value = style
  saveConfig({
    [configPaths.settings.pasteStyle]: style || IPasteStyle.MARKDOWN,
  })
}

function updateUrlType(shortUrl: boolean) {
  useShortUrl.value = shortUrl
  saveConfig({
    [configPaths.settings.useShortUrl]: shortUrl,
  })
}

async function valideFavoritePicbeds() {
  if (!favoritePicbeds.value.length) return
  const allUploaders = (await getConfig<IStringKeyMap>(configPaths.uploader)) || {}

  const availableFavorites = favoritePicbeds.value.filter(item => {
    return (
      Object.keys(allUploaders).includes(item.type) &&
      allUploaders[item.type]?.configList.some((cfg: any) => cfg._id === item.id && cfg._configName === item.configName)
    )
  })
  if (JSON.stringify(availableFavorites) !== JSON.stringify(favoritePicbeds.value)) {
    favoritePicbeds.value = availableFavorites
  }
}

function addCurrentPicbedToFavorites() {
  favoritePicbeds.value.push({
    id: defaultIdG.value,
    type: defaultPicBedG.value,
    configName: defaultConfigNameG.value,
  })
  message.success(t('pages.upload.picbedAddedToFavorites'))
}

function removePicbedFromFavorites(picbedType: IFavoritePicbedItem) {
  const index = favoritePicbeds.value.findIndex(
    item => item.type === picbedType.type && item.id === picbedType.id && item.configName === picbedType.configName,
  )
  if (index === -1) return
  favoritePicbeds.value.splice(index, 1)
}

async function switchToPicbed(picbedType: IFavoritePicbedItem) {
  if (!picbedType.id || !picbedType.type || !picbedType.configName) {
    return
  }
  const uploaders = (await getConfig<IStringKeyMap>(`uploader.${picbedType.type}`)) || {}
  const targetConfig = uploaders?.configList.find(
    (cfg: any) => cfg._id === picbedType.id && cfg._configName === picbedType.configName,
  )
  if (!targetConfig) {
    return
  }
  saveConfig({
    [`uploader.${picbedType.type}.defaultId`]: picbedType.id,
    [`picBed.${picbedType.type}`]: targetConfig,
    [configPaths.picBed.current]: picbedType.type,
    [configPaths.picBed.uploader]: picbedType.type,
  })
  await updatePicBeds()
  const name = getPicbedName(picbedType).split('-')[0]
  window.electron.sendRPC(IRPCActionType.TRAY_SET_TOOL_TIP, `${name} ${targetConfig._configName}`)
  message.success(t('pages.upload.picbedSwitched', { name: getPicbedName(picbedType) }))
}

function getPicbedName(picbedType: IFavoritePicbedItem): string {
  if (!picBedG.value || picBedG.value.length === 0) {
    return picbedType.configName || 'Default'
  }
  const target = picBedG.value.find(item => item.type === picbedType.type)
  return `${target ? target.name : picbedType.type}-${picbedType.configName}`
}

function isCurrentPicbed(picbedType: IFavoritePicbedItem): boolean {
  return defaultIdG.value === picbedType.id
}

function handleBadgeClick(picbedType: IFavoritePicbedItem) {
  if (longPressedBadge.value === picbedType.id) {
    return
  }
  if (isCurrentPicbed(picbedType)) {
    return
  }
  switchToPicbed(picbedType)
}

function handleBadgeMouseDown(picbedType: IFavoritePicbedItem) {
  longPressTimer = setTimeout(() => {
    longPressedBadge.value = picbedType.id
  }, LONG_PRESS_DURATION)
}

function handleBadgeMouseUp() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  setTimeout(() => {
    longPressedBadge.value = null
  }, 10000)
}

function handleBadgeTouchStart(picbedType: IFavoritePicbedItem, event: TouchEvent) {
  longPressTimer = setTimeout(() => {
    longPressedBadge.value = picbedType.id
    event.preventDefault()
  }, LONG_PRESS_DURATION)
}

function handleBadgeTouchEnd() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
  setTimeout(() => {
    longPressedBadge.value = null
  }, 10000)
}

function uploadClipboardFiles() {
  window.electron.sendRPC(IRPCActionType.UPLOAD_CLIPBOARD_FILES_FROM_UPLOAD_PAGE)
}

async function uploadURLFiles() {
  const str = await navigator.clipboard.readText()
  $bus.emit(SHOW_INPUT_BOX, {
    value: isUrl(str) ? str : '',
    title: t('pages.upload.inputUrlTip'),
    placeholder: t('pages.upload.httpPrefixTip') + '\n' + t('pages.upload.multipleUrlsHint'),
    multiLine: true,
  })
}

function handleInputBoxValue(val: string) {
  if (val === '') return

  const urls = val
    .split('\n')
    .map(url => url.trim())
    .filter(url => url !== '')

  if (urls.length === 0) return

  const invalidUrls: string[] = []
  const validUrls: string[] = []

  urls.forEach(url => {
    if (isUrl(url)) {
      validUrls.push(url)
    } else {
      invalidUrls.push(url)
    }
  })

  if (invalidUrls.length > 0) {
    const errorMessage =
      invalidUrls.length === 1
        ? t('pages.upload.inputValidUrl') + ': ' + invalidUrls[0]
        : t('pages.upload.invalidUrlsFound', {
            count: invalidUrls.length,
            urls: invalidUrls.slice(0, 3).join(', ') + (invalidUrls.length > 3 ? '...' : ''),
          })
    message.error(errorMessage)
  }

  if (validUrls.length > 0) {
    const filesToUpload = validUrls.map(url => ({ path: url }))
    window.electron.sendRPC(IRPCActionType.UPLOAD_CHOOSED_FILES, filesToUpload)

    if (validUrls.length > 1) {
      message.success(t('pages.upload.uploadingMultipleUrls', { count: validUrls.length }))
    }
  }
}

async function handleChangePicBed() {
  window.electron.sendRPC(IRPCActionType.SHOW_UPLOAD_PAGE_MENU)
}

function openTaskDialog() {
  taskDialogVisible.value = true
  refreshTaskStatus()
}

async function refreshTaskStatus() {
  const status = await window.electron.triggerRPC<IUploadTaskQueueStatus>(IRPCActionType.UPLOAD_TASK_GET_STATUS)
  if (status) {
    Object.assign(taskQueueStatus, status)
    uploadInterval.value = status.config.intervalS
    autoStart.value = status.config.autoStart
    pauseOnError.value = status.config.pauseOnError
    maxRetryCount.value = status.config.maxRetryCount
  }
}

async function addFilesToTask() {
  const input = document.createElement('input')
  input.type = 'file'
  input.multiple = true
  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files && target.files.length > 0) {
      const files: IFileWithPath[] = Array.from(target.files).map(file => ({
        name: file.name,
        path: window.electron.showFilePath(file),
      }))

      await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_ADD, files)
      await refreshTaskStatus()
      message.success(t('pages.upload.taskQueue.filesAdded', { count: files.length }))
    }
  }
  input.click()
}

async function startTaskQueue() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_START, uploadInterval.value)
  await refreshTaskStatus()
  message.success(t('pages.upload.taskQueue.started'))
}

async function pauseTaskQueue() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_PAUSE)
  await refreshTaskStatus()
  message.info(t('pages.upload.taskQueue.paused'))
}

async function resumeTaskQueue() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_RESUME)
  await refreshTaskStatus()
  message.success(t('pages.upload.taskQueue.resumed'))
}

async function cancelAllTasks() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_CANCEL_ALL)
  await refreshTaskStatus()
  message.info(t('pages.upload.taskQueue.allCancelled'))
}

async function cancelTask(taskId: string) {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_CANCEL_ONE, taskId)
  await refreshTaskStatus()
}

async function removeTask(taskId: string) {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_REMOVE_ONE, taskId)
  await refreshTaskStatus()
}

async function clearFinishedTasks() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_CLEAR_FINISHED)
  await refreshTaskStatus()
  message.success(t('pages.upload.taskQueue.cleared'))
}

async function updateInterval() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_SET_INTERVAL, uploadInterval.value)
}

async function retryTask(taskId: string) {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_RETRY_ONE, taskId)
  await refreshTaskStatus()
  message.success(t('pages.upload.taskQueue.taskRetried'))
}

async function retryAllFailedTasks() {
  const count = await window.electron.triggerRPC<number>(IRPCActionType.UPLOAD_TASK_RETRY_ALL_FAILED)
  await refreshTaskStatus()
  message.success(t('pages.upload.taskQueue.retriedAllFailed', { count }))
}

async function moveTaskUp(taskId: string) {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_MOVE_UP, taskId)
  await refreshTaskStatus()
}

async function moveTaskDown(taskId: string) {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_MOVE_DOWN, taskId)
  await refreshTaskStatus()
}

async function toggleTaskPriority(taskId: string, currentPriority: number) {
  const newPriority = currentPriority === 2 ? 1 : 2
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_SET_PRIORITY, taskId, newPriority)
  await refreshTaskStatus()
}

async function updateSettings() {
  await window.electron.triggerRPC(IRPCActionType.UPLOAD_TASK_UPDATE_SETTINGS, {
    intervalS: uploadInterval.value,
    autoStart: autoStart.value,
    pauseOnError: pauseOnError.value,
    maxRetryCount: maxRetryCount.value,
  })
}

// Helper functions
function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
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

function getTaskStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'status-pending',
    uploading: 'status-uploading',
    completed: 'status-completed',
    failed: 'status-failed',
    cancelled: 'status-cancelled',
  }
  return statusMap[status] || ''
}

function getTaskStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: t('pages.upload.taskQueue.statusPending'),
    uploading: t('pages.upload.taskQueue.statusUploading'),
    completed: t('pages.upload.taskQueue.statusCompleted'),
    failed: t('pages.upload.taskQueue.statusFailed'),
    cancelled: t('pages.upload.taskQueue.statusCancelled'),
  }
  return statusMap[status] || status
}

function taskQueueUpdateHandler(status: IUploadTaskQueueStatus) {
  Object.assign(taskQueueStatus, status)
  uploadInterval.value = status.config.intervalS
}

let removeTaskQueueUpdateListenerCallback: () => void = () => {}

onBeforeUnmount(() => {
  $bus.off(SHOW_INPUT_BOX_RESPONSE)
  removeUploadProgressListenerCallback()
  removeSyncPicBedListenerCallback()
  removeTaskQueueUpdateListenerCallback()
})

onBeforeMount(async () => {
  removeUploadProgressListenerCallback = window.electron.ipcRendererOn('uploadProgress', uploadProgressHandler)
  removeSyncPicBedListenerCallback = window.electron.ipcRendererOn('syncPicBed', syncPicBedHandler)
  removeTaskQueueUpdateListenerCallback = window.electron.ipcRendererOn('uploadTaskQueueUpdate', taskQueueUpdateHandler)
  $bus.on(SHOW_INPUT_BOX_RESPONSE, handleInputBoxValue)
  await Promise.all([initConf(), refreshTaskStatus()])
})
</script>

<script lang="ts">
export default {
  name: 'UploadPage',
}
</script>

<style scoped src="./css/UploadPage.css"></style>
