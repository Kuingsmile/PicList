<template>
  <div class="relative flex h-full w-full items-center justify-center">
    <div
      class="relative z-1 flex h-full w-full min-w-0 flex-col items-center justify-start gap-4 rounded-xl border-none p-4"
    >
      <!-- Header -->
      <header
        class="flex w-full flex-wrap items-center justify-between gap-4 rounded-2xl border border-border-secondary px-6 py-2 shadow-md max-md:p-5"
      >
        <div class="flex min-w-0 flex-1 items-center gap-4 p-1">
          <ImagesIcon :size="24" class="shrink-0 text-accent" aria-hidden="true" />
          <div class="min-w-0">
            <h1 class="m-0 text-2xl font-semibold tracking-tight text-main">{{ t('pages.gallery.title') }}</h1>
            <p class="m-0 text-sm text-secondary tabular-nums" aria-live="polite">
              {{
                hasActiveFilters
                  ? t('pages.gallery.filteredCount', { shown: filterList.length, total: images.length })
                  : t('pages.gallery.imageCount', images.length)
              }}
            </p>
          </div>
        </div>
        <CustomButton
          type="secondary"
          :text="t('pages.gallery.refresh')"
          :icon="RefreshCwIcon"
          :loading="galleryLoading"
          @click="updateGallery"
        />
      </header>

      <!-- Toolbar -->
      <div class="flex w-full flex-col gap-3 rounded-2xl border border-border-secondary px-4 py-3 shadow-md">
        <div class="flex w-full flex-wrap items-center gap-2">
          <div class="relative flex min-w-[180px] flex-2 items-center">
            <SearchIcon :size="16" class="pointer-events-none absolute left-3 text-secondary" aria-hidden="true" />
            <input
              v-model="searchText"
              type="search"
              class="h-[36px] w-full rounded-lg border border-border bg-bg-secondary pr-8 pl-9 text-sm text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent focus:outline-none focus-visible:focus-ring [&::-webkit-search-cancel-button]:hidden"
              :placeholder="t('pages.gallery.searchFilename')"
              :aria-label="t('pages.gallery.searchFilename')"
            />
            <button
              v-if="searchText"
              type="button"
              class="absolute right-2 flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full text-secondary hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
              :aria-label="t('common.clear')"
              @click="cleanSearch"
            >
              <XIcon :size="14" aria-hidden="true" />
            </button>
          </div>
          <div class="relative flex min-w-[160px] flex-1 items-center">
            <LinkIcon :size="16" class="pointer-events-none absolute left-3 text-secondary" aria-hidden="true" />
            <input
              v-model="searchTextURL"
              type="search"
              class="h-[36px] w-full rounded-lg border border-border bg-bg-secondary pr-8 pl-9 text-sm text-main transition-all duration-fast ease-apple placeholder:text-secondary focus:border-accent focus:outline-none focus-visible:focus-ring [&::-webkit-search-cancel-button]:hidden"
              :placeholder="t('pages.gallery.searchUrl')"
              :aria-label="t('pages.gallery.searchUrl')"
            />
            <button
              v-if="searchTextURL"
              type="button"
              class="absolute right-2 flex h-[22px] w-[22px] cursor-pointer items-center justify-center rounded-full text-secondary hover:bg-accent/10 hover:text-main focus-visible:focus-ring"
              :aria-label="t('common.clear')"
              @click="cleanSearchUrl"
            >
              <XIcon :size="14" aria-hidden="true" />
            </button>
          </div>

          <CustomButton
            type="secondary"
            :text="t('pages.gallery.hideFilters')"
            :icon="SlidersHorizontalIcon"
            :aria-expanded="handleBarActive"
            aria-controls="gallery-options-panel"
            class="h-[36px] px-3! py-0!"
            :class="{ 'border-accent! bg-accent/10! text-accent': handleBarActive }"
            @click="toggleHandleBar"
          >
            <template #extra>
              <span
                v-if="panelFilterCount"
                class="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[11px] font-semibold text-white tabular-nums"
              >
                {{ panelFilterCount }}
              </span>
              <ChevronDownIcon
                :size="14"
                class="transition-transform duration-fast ease-apple"
                :class="{ 'rotate-180': handleBarActive }"
                aria-hidden="true"
              />
            </template>
          </CustomButton>
          <button
            v-if="hasActiveFilters"
            type="button"
            class="flex h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-accent hover:bg-accent/10 focus-visible:focus-ring"
            @click="clearFilters"
          >
            <FilterXIcon :size="15" aria-hidden="true" />{{ t('pages.gallery.clearFilters') }}
          </button>

          <div class="ml-auto flex items-center gap-2">
            <div
              v-if="viewMode === 'grid'"
              class="flex h-[36px] items-center gap-2 rounded-lg border border-border-secondary px-2.5"
            >
              <GridIcon :size="14" class="text-secondary" aria-hidden="true" />
              <input
                v-model.number="userGridColumns"
                v-tooltip="t('pages.gallery.gridSize')"
                type="range"
                min="1"
                max="15"
                step="1"
                class="h-[4px] w-[72px] cursor-pointer appearance-none rounded-[2px] bg-(--color-background-tertiary) outline-none focus-visible:focus-ring [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:w-[14px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 hover:[&::-webkit-slider-thumb]:scale-110"
                :aria-label="t('pages.gallery.gridSize')"
              />
              <span class="w-[1.25rem] text-center text-xs font-semibold text-secondary tabular-nums">
                {{ userGridColumns }}
              </span>
            </div>
            <div
              class="flex h-[36px] items-center gap-0.5 rounded-lg border border-border-secondary p-0.5"
              role="group"
              :aria-label="t('common.fileTable.view')"
            >
              <CustomButton
                type="tab"
                :icon="GridIcon"
                :icon-size="14"
                :active="viewMode === 'grid'"
                :text="t('common.fileTable.grid')"
                class="h-full px-2.5! py-0!"
                @click="viewMode = 'grid'"
              />
              <CustomButton
                type="tab"
                :icon="ListIcon"
                :icon-size="14"
                :active="viewMode === 'table'"
                :text="t('common.fileTable.table')"
                class="h-full px-2.5! py-0!"
                @click="viewMode = 'table'"
              />
            </div>
            <div
              v-if="viewMode === 'table'"
              class="flex h-[36px] items-center gap-0.5 rounded-lg border border-border-secondary p-0.5"
              role="group"
              :aria-label="t('common.fileTable.density')"
            >
              <CustomButton
                v-for="density in ['compact', 'comfortable'] as const"
                :key="density"
                v-tooltip="t('common.fileTable.density')"
                type="tab"
                :icon="density === 'compact' ? Rows4Icon : Rows3Icon"
                :icon-size="14"
                :active="tableDensity === density"
                :text="t(`common.fileTable.${density}`)"
                class="h-full px-2.5! py-0!"
                @click="tableDensity = density"
              />
            </div>
          </div>
        </div>

        <!-- Filters & options -->
        <div
          v-show="handleBarActive"
          id="gallery-options-panel"
          class="flex w-full flex-col gap-3 border-t border-border-secondary pt-3"
        >
          <div
            class="grid grid-cols-2 items-end gap-3 md:grid-cols-4"
            role="group"
            :aria-label="t('pages.gallery.filterAndSort')"
          >
            <div class="flex min-w-0 flex-col gap-1">
              <MultiSelect
                v-model:choosed="choosedPicBed"
                :title="t('pages.gallery.picBedType')"
                :zero-placeholder="t('pages.gallery.chooseShowedPicBed')"
                :all-list="filteredPicBedG"
                trigger-class="min-h-[32px]"
              />
            </div>
            <div class="col-span-2 flex min-w-0 flex-col gap-1 max-md:order-last">
              <span class="text-[0.925rem] leading-[1.4] font-semibold text-secondary">{{
                t('pages.gallery.dateRange')
              }}</span>
              <div class="flex w-full items-center gap-2">
                <input
                  v-model="dateRangeStart"
                  type="date"
                  :max="dateRangeEnd || undefined"
                  class="h-[32px] min-w-0 flex-1 rounded-md border border-border-secondary bg-transparent px-2 text-xs text-main transition-all duration-fast ease-apple hover:border-accent-hover focus:border-accent focus:outline-none focus-visible:focus-ring"
                  :aria-label="t('pages.gallery.dateRangeStart')"
                />
                <span class="shrink-0 text-secondary" aria-hidden="true">–</span>
                <input
                  v-model="dateRangeEnd"
                  type="date"
                  :min="dateRangeStart || undefined"
                  class="h-[32px] min-w-0 flex-1 rounded-md border border-border-secondary bg-transparent px-2 text-xs text-main transition-all duration-fast ease-apple hover:border-accent-hover focus:border-accent focus:outline-none focus-visible:focus-ring"
                  :aria-label="t('pages.gallery.dateRangeEnd')"
                />
              </div>
            </div>
            <div class="flex min-w-0 items-end gap-1.5">
              <div class="flex min-w-0 flex-1 flex-col gap-1">
                <SingleSelect
                  :model-value="currentSortField"
                  :title="t('pages.gallery.sort')"
                  :fronticon="false"
                  class="min-h-[32px]"
                  :select-list="
                    ['name', 'ext', 'time', 'provider', 'check'].map(value => ({
                      value,
                      label: t(`pages.gallery.sortBy.${value}`),
                    }))
                  "
                  @change="field => sortFile(field as GallerySortField, false)"
                />
              </div>
              <button
                v-tooltip="sortAscending ? t('pages.gallery.sortAscending') : t('pages.gallery.sortDescending')"
                type="button"
                class="flex h-[32px] w-[32px] shrink-0 cursor-pointer items-center justify-center rounded-md border border-border-secondary text-secondary transition-all duration-fast ease-apple hover:border-accent-hover hover:text-main focus-visible:focus-ring"
                :aria-label="sortAscending ? t('pages.gallery.sortAscending') : t('pages.gallery.sortDescending')"
                @click="toggleSortDirection"
              >
                <ArrowUpNarrowWideIcon v-if="sortAscending" :size="16" aria-hidden="true" />
                <ArrowDownWideNarrowIcon v-else :size="16" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div
            class="grid grid-cols-2 items-end gap-3 md:grid-cols-4"
            role="group"
            :aria-label="t('pages.gallery.copyOptions')"
          >
            <div class="flex min-w-0 flex-col gap-1">
              <SingleSelect
                v-model="pasteStyle"
                :title="t('pages.gallery.pasteFormat')"
                :fronticon="false"
                class="min-h-[32px]"
                :key-list="pasteStyleList"
              >
                <template #item="{ item }">
                  {{ item }}
                </template>
              </SingleSelect>
            </div>
            <div class="flex min-w-0 flex-col gap-1">
              <SingleSelect
                v-model="useShortUrl"
                :title="t('pages.gallery.urlType')"
                :fronticon="false"
                class="min-h-[32px]"
                :select-list="shortURLList.map(value => ({ value, label: t(`pages.gallery.${value}`) }))"
              />
            </div>
            <div class="flex min-w-0 flex-col gap-1">
              <span class="flex min-w-0 items-center gap-1">
                <span class="truncate text-[0.925rem] leading-[1.4] font-semibold text-secondary">
                  {{ t('pages.gallery.isAlwaysForceReload') }}
                </span>
                <HelpTooltip :content="t('pages.gallery.isAlwaysForceReloadTip')" />
              </span>
              <div class="flex h-[32px] items-center">
                <CustomSwitch
                  v-model="isAlwaysForceReload"
                  :aria-label="t('pages.gallery.isAlwaysForceReload')"
                  small
                  tighter
                  no-border
                  no-hover
                  @update:model-value="handleIsAlwaysForceReload"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Gallery -->
      <section
        class="flex min-h-[240px] w-full min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border-secondary shadow-md"
        :aria-busy="galleryLoading"
        :aria-label="t('pages.gallery.title')"
      >
        <!-- Selection bar -->
        <div
          class="flex min-h-[52px] flex-wrap items-center gap-x-3 gap-y-2 border-b border-border-secondary px-4 py-2 transition-colors duration-fast ease-apple"
          :class="selectedCount ? 'bg-accent/10' : ''"
        >
          <label class="flex cursor-pointer items-center gap-2.5 text-sm select-none">
            <input
              type="checkbox"
              class="h-[16px] w-[16px] cursor-pointer accent-accent focus-visible:focus-ring disabled:cursor-not-allowed"
              :checked="isAllSelected"
              :indeterminate="selectedCount > 0 && !isAllSelected"
              :disabled="!filterList.length"
              :aria-label="t('pages.gallery.selectAll')"
              @change="toggleSelectAll"
            />
            <span v-if="selectedCount" class="font-semibold text-main tabular-nums" aria-live="polite">
              {{ t('pages.gallery.selectedCount', selectedCount) }}
            </span>
            <span v-else class="text-secondary">{{ t('pages.gallery.selectAll') }}</span>
          </label>
          <button
            v-if="selectedCount"
            type="button"
            class="cursor-pointer rounded-md px-1.5 py-0.5 text-xs font-medium text-accent hover:bg-accent/10 focus-visible:focus-ring"
            @click="clearChoosedList"
          >
            {{ t('pages.gallery.clearSelection') }}
          </button>
          <span v-else-if="filterList.length" class="text-xs text-secondary max-md:hidden">
            {{ t('pages.gallery.selectionHint') }}
          </span>

          <div class="ml-auto flex flex-wrap items-center gap-2">
            <CustomSwitch
              v-model="deleteCloud"
              v-tooltip="t('pages.gallery.syncDeleteTip')"
              :aria-label="t('pages.gallery.syncDelete')"
              small
              tighter
              no-border
              no-hover
              class="h-[34px] rounded-lg border px-2.5 transition-colors duration-fast ease-apple"
              :class="deleteCloud ? 'border-warning/30 bg-warning/5' : 'border-border-secondary'"
              @update:model-value="handleDeleteCloudFile"
            >
              <template #custom-title>
                <span class="-ml-2 flex items-center gap-1.5 text-sm font-medium whitespace-nowrap text-secondary">
                  <CloudIcon v-if="deleteCloud" :size="15" aria-hidden="true" />
                  <CloudOffIcon v-else :size="15" aria-hidden="true" />
                  {{ t('pages.gallery.syncDelete') }}
                </span>
              </template>
            </CustomSwitch>
            <span class="mx-0.5 h-[20px] w-px bg-border-secondary max-sm:hidden" aria-hidden="true" />
            <template v-if="selectedCount">
              <CustomButton
                type="secondary"
                :icon="ClipboardIcon"
                :text="t('pages.gallery.copy')"
                class="px-3! py-1.5!"
                @click="multiCopy"
              />
              <CustomButton
                type="secondary"
                :icon="EditIcon"
                :text="t('pages.gallery.batchEditUrl')"
                class="px-3! py-1.5!"
                @click="openBatchRename"
              />
              <CustomButton
                type="danger"
                :icon="TrashIcon"
                :text="`${t('pages.gallery.delete')} (${selectedCount})`"
                class="px-3! py-1.5!"
                @click="multiRemove"
              />
            </template>
            <CustomButton
              v-else
              v-tooltip="t('pages.gallery.batchEditUrlAllTip')"
              type="secondary"
              :icon="EditIcon"
              :text="t('pages.gallery.batchEditUrl')"
              :disabled="!filterList.length"
              class="px-3! py-1.5!"
              @click="openBatchRename"
            />
          </div>
        </div>

        <div class="flex min-h-0 flex-1 flex-col p-4">
          <div
            v-if="galleryLoadFailed"
            role="status"
            class="mb-3 flex items-center justify-between gap-3 rounded-md bg-warning/10 p-3 text-sm text-main"
          >
            <span>{{ t('pages.gallery.loadFailed') }}</span>
            <CustomButton
              type="secondary"
              :text="t('pages.gallery.refresh')"
              :loading="galleryLoading"
              @click="updateGallery"
            />
          </div>
          <div
            v-if="galleryLoading && !images.length"
            role="status"
            class="flex flex-1 items-center justify-center gap-3 p-8 text-secondary"
          >
            <RefreshCwIcon :size="20" class="animate-spin" aria-hidden="true" />
            {{ t('pages.gallery.loading') }}
          </div>
          <div
            v-else-if="filterList.length === 0 && !galleryLoadFailed"
            class="flex flex-1 flex-col items-center justify-center px-8 py-12 text-center"
          >
            <div
              class="mb-4 flex h-[64px] w-[64px] items-center justify-center rounded-2xl bg-accent/10 text-accent"
              aria-hidden="true"
            >
              <SearchXIcon v-if="images.length" :size="30" />
              <ImageIcon v-else :size="30" />
            </div>
            <h3 class="mx-0 mt-0 mb-1.5 text-lg font-semibold text-main">
              {{ images.length ? t('pages.gallery.noMatch') : t('pages.gallery.noImagesFound') }}
            </h3>
            <p class="m-0 max-w-[360px] text-sm text-secondary">
              {{ images.length ? t('pages.gallery.noMatchHint') : t('pages.gallery.emptyHint') }}
            </p>
            <CustomButton
              v-if="images.length"
              type="secondary"
              class="mt-4"
              :icon="FilterXIcon"
              :text="t('pages.gallery.clearFilters')"
              @click="clearFilters"
            />
            <CustomButton
              v-else
              class="mt-4"
              :icon="UploadIcon"
              :text="t('pages.gallery.goUpload')"
              @click="router.push({ name: UPLOAD_PAGE })"
            />
          </div>

          <FileCollection
            v-else-if="filterList.length"
            :key="componentKey"
            ref="virtualScrollerRef"
            :items="filterList"
            :view-mode="viewMode"
            :density="tableDensity"
            :columns="tableColumns"
            :grid-item-height="gridItemHeight"
            :grid-breakpoints="effectiveGridBreakpoints"
            key-field="key"
            :label="t('pages.gallery.title')"
            :preview-id="hoverPreviewId"
            :is-selected="item => !!choosedList[item.id || '']"
            :sort-field="currentSortField"
            :sort-ascending="sortAscending"
            @select="(item, selected) => (choosedList[item.id || ''] = selected)"
            @select-all="setAllSelected"
            @sort="field => sortFile(field as GallerySortField)"
            @open="(_, index) => zoomImage(index)"
            @preview="showHoverPreview"
            @preview-end="hoverPreviewRef?.scheduleHide()"
            @visible-indexes-change="handleVisibleIndexesChange"
          >
            <template #icon="{ item }">
              <span
                class="relative flex aspect-square h-[calc(var(--file-row-height)-10px)] items-center justify-center overflow-hidden rounded-md border border-border-secondary bg-bg-tertiary"
              >
                <img
                  v-if="galleryActive"
                  :src="displayImageSources[item.key || ''] || item.src"
                  alt=""
                  class="h-full w-full object-cover"
                  draggable="false"
                  @load="onImageLoad(item)"
                  @error="onImageError(item)"
                />
              </span>
            </template>
            <template #actions="{ item, index, tabindex }">
              <button
                v-tooltip="t('common.fileTable.open')"
                type="button"
                :tabindex
                :aria-label="t('common.fileTable.open')"
                @click="zoomImage(index)"
              >
                <ImageIcon :size="16" />
              </button>
              <button
                v-tooltip="t('pages.gallery.copy')"
                type="button"
                :tabindex
                :aria-label="t('pages.gallery.copy')"
                @click="copy(item)"
              >
                <ClipboardIcon :size="16" />
              </button>
              <button
                v-tooltip="t('pages.gallery.edit')"
                type="button"
                :tabindex
                :aria-label="t('pages.gallery.edit')"
                @click="openDialog(item)"
              >
                <EditIcon :size="16" />
              </button>
              <button
                v-tooltip="t('pages.gallery.delete')"
                type="button"
                :tabindex
                :aria-label="t('pages.gallery.delete')"
                @click="remove(item, index)"
              >
                <TrashIcon :size="16" />
              </button>
            </template>
            <template #default="{ item, index }">
              <div
                class="group/card relative flex h-full w-full flex-col overflow-hidden rounded-lg border bg-bg-secondary shadow-sm transition-all duration-fast ease-apple hover:shadow-md"
                :class="
                  choosedList[item.id || '']
                    ? 'border-accent ring-2 ring-accent/40'
                    : 'border-border hover:border-accent/60'
                "
              >
                <div
                  class="relative flex min-h-0 flex-1 cursor-pointer items-center justify-center overflow-hidden bg-bg-tertiary focus-visible:focus-ring"
                  role="button"
                  tabindex="0"
                  :aria-label="
                    selectedCount
                      ? t('common.fileTable.selectFile', { name: item.fileName || '' })
                      : `${t('common.fileTable.open')}: ${item.fileName || ''}`
                  "
                  @keydown.enter.prevent="zoomImage(index)"
                  @keydown.space.prevent="handleChooseImage(!choosedList[item.id || ''], index)"
                  @click="handleCardClick(item, index, $event)"
                >
                  <img
                    v-if="galleryActive"
                    :src="displayImageSources[item.key || ''] || item.src"
                    :alt="item.fileName || ''"
                    class="h-full w-full object-contain transition-transform duration-medium ease-apple group-hover/card:scale-[1.03]"
                    draggable="false"
                    @load="onImageLoad(item)"
                    @error="onImageError(item)"
                  />
                  <div
                    v-if="!imageLoadStates[item.key || '']"
                    class="absolute inset-0 flex items-center justify-center bg-bg-tertiary"
                  >
                    <div
                      class="h-[22px] w-[22px] animate-spin rounded-full border-2 border-border-secondary border-t-accent"
                    />
                  </div>
                  <div
                    v-if="choosedList[item.id || '']"
                    class="pointer-events-none absolute inset-0 bg-accent/10"
                    aria-hidden="true"
                  />
                </div>

                <!-- Selection checkbox -->
                <label
                  class="absolute top-2 left-2 z-1 flex cursor-pointer transition-opacity duration-fast ease-apple group-hover/card:opacity-100 focus-within:opacity-100"
                  :class="selectedCount ? 'opacity-100' : 'opacity-0'"
                  @click.stop
                >
                  <input
                    v-model="choosedList[item.id ? item.id : '']"
                    type="checkbox"
                    class="peer sr-only"
                    :aria-label="t('common.fileTable.selectFile', { name: item.fileName || '' })"
                    @change="e => handleChooseImage((e.target as HTMLInputElement).checked, index)"
                  />
                  <span
                    class="group/check flex h-[28px] w-[28px] items-center justify-center rounded-md bg-bg-secondary/90 shadow-sm backdrop-blur-sm transition-all duration-fast ease-apple peer-checked:bg-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent"
                    aria-hidden="true"
                  >
                    <CheckIcon v-if="choosedList[item.id || '']" :size="16" :stroke-width="3" class="text-white" />
                    <span
                      v-else
                      class="h-[16px] w-[16px] rounded-sm border-2 border-accent/60 transition-colors duration-fast ease-apple group-hover/check:border-accent"
                    />
                  </span>
                </label>

                <!-- Quick actions -->
                <div
                  class="absolute top-2 right-2 z-1 flex gap-1 opacity-0 transition-opacity duration-fast ease-apple group-hover/card:opacity-100 focus-within:opacity-100"
                >
                  <button
                    v-for="action in cardActions"
                    :key="action.key"
                    v-tooltip="action.label"
                    type="button"
                    :aria-label="action.label"
                    class="flex h-[28px] w-[28px] cursor-pointer items-center justify-center rounded-md bg-bg-secondary/90 text-main shadow-sm backdrop-blur-sm transition-all duration-fast ease-apple focus-visible:focus-ring"
                    :class="
                      action.key === 'delete' ? 'hover:bg-danger hover:text-white' : 'hover:bg-accent hover:text-white'
                    "
                    @click.stop="action.run(item, index)"
                  >
                    <component :is="action.icon" :size="15" aria-hidden="true" />
                  </button>
                </div>

                <div class="flex min-w-0 shrink-0 flex-col gap-0.5 border-t border-border-secondary px-3 py-2">
                  <div class="flex min-w-0 items-center gap-2">
                    <span
                      v-tooltip.overflow="item.fileName || ''"
                      class="min-w-0 flex-1 truncate text-sm font-medium text-main"
                    >
                      {{ formatFileName(item.fileName || '') }}
                    </span>
                    <span
                      v-if="fileType(item)"
                      class="shrink-0 rounded bg-accent/10 px-1.5 py-px text-[10px] font-semibold text-accent uppercase"
                    >
                      {{ fileType(item) }}
                    </span>
                  </div>
                  <div class="flex min-w-0 items-center gap-1 text-xs text-secondary">
                    <span class="truncate">{{ providerName(item) }}</span>
                    <template v-if="item.updatedAt">
                      <span aria-hidden="true">·</span>
                      <span class="shrink-0 tabular-nums">{{ formatCardDate(item) }}</span>
                    </template>
                  </div>
                </div>
              </div>
            </template>
          </FileCollection>
        </div>
      </section>
    </div>
    <GalleryHoverPreview
      :id="hoverPreviewId"
      ref="hoverPreviewRef"
      :src="hoverPreviewItem ? buildDisplayImageSrc(hoverPreviewItem) : ''"
      :alt="hoverPreviewItem?.fileName || ''"
      @show="ensureJxlPreview(hoverPreviewItem)"
      @hide="hoverPreviewItem = undefined"
    />
    <!-- Custom Image Preview Modal -->
    <ImagePreview
      v-model:gallery-slider-control="gallerySliderControl"
      :filter-list="previewFilterList"
      :is-always-force-reload="isAlwaysForceReload"
    />

    <!-- Edit URL Modal -->
    <GalleryUrlEditor
      ref="urlEditor"
      :filter-list="filterList"
      :choosed-list="choosedList"
      :update-gallery="updateGallery"
      @changed="virtualScrollerRef?.refresh()"
    />
  </div>
</template>

<script setup lang="ts">
import {
  ArrowDownWideNarrowIcon,
  ArrowUpNarrowWideIcon,
  CheckIcon,
  ChevronDownIcon,
  ClipboardIcon,
  CloudIcon,
  CloudOffIcon,
  EditIcon,
  FilterXIcon,
  GridIcon,
  ImageIcon,
  ImagesIcon,
  LinkIcon,
  ListIcon,
  Maximize2Icon,
  RefreshCwIcon,
  Rows3Icon,
  Rows4Icon,
  SearchIcon,
  SearchXIcon,
  SlidersHorizontalIcon,
  TrashIcon,
  UploadIcon,
  XIcon,
} from '@lucide/vue'
import { useStorage } from '@vueuse/core'
import {
  computed,
  nextTick,
  onActivated,
  onBeforeMount,
  onBeforeUnmount,
  onDeactivated,
  onWatcherCleanup,
  reactive,
  ref,
  shallowRef,
  useId,
  useTemplateRef,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { onBeforeRouteUpdate, useRouter } from 'vue-router'

import CustomButton from '@/components/common/CustomButton.vue'
import CustomSwitch from '@/components/common/CustomSwitch.vue'
import HelpTooltip from '@/components/common/HelpTooltip.vue'
import MultiSelect from '@/components/common/MultiSelect.vue'
import SingleSelect from '@/components/common/SingleSelect.vue'
import FileCollection from '@/components/FileCollection.vue'
import GalleryUrlEditor from '@/components/gallery/GalleryUrlEditor.vue'
import GalleryHoverPreview from '@/components/GalleryHoverPreview.vue'
import ImagePreview from '@/components/ImagePreview.vue'
import { useGalleryActions } from '@/composables/useGalleryActions'
import { usePicBed } from '@/composables/useGlobal'
import useMessage from '@/composables/useMessage'
import { UPLOAD_PAGE } from '@/router/config'
import { getConfig, saveConfig } from '@/services/configService'
import $$db from '@/services/galleryDatabase'
import { configPaths } from '@/utils/configPaths'
import { compareFileValues, type FileColumn, fileDate, fileType, formatCollectionDate } from '@/utils/fileCollection'
import { prepareGalleryItems } from '@/utils/galleryItems'
import { getGalleryPreviewSource, getJxlPreviewSource } from '@/utils/galleryPreview'
import { PreviewCache } from '@/utils/previewCache'
import { IPasteStyle } from '#/constants/app'
import { UPDATE_GALLERY } from '#/constants/ipcChannels'
import { IRPCActionType } from '#/constants/rpcActions'
import { customStrMatch } from '#/utils/strings'
import { addCacheBustParam as withCacheBustParam } from '#/utils/url'
import { enforceBoolean } from '#/utils/values'

defineOptions({ name: 'GalleryPage' })

const { t } = useI18n()

const router = useRouter()

const message = useMessage()

const { picBedG } = usePicBed()

const images = shallowRef<IGalleryItem[]>([])

const galleryLoading = ref(false)

const galleryLoadFailed = ref(false)

let galleryRefreshVersion = 0

let galleryRefreshPromise: Promise<boolean> | undefined

let galleryRefreshRequested = false

let galleryDisposed = false

let loadingConfig = false

const galleryActive = ref(true)

let galleryDirty = false

const virtualScrollerRef = useTemplateRef('virtualScrollerRef')

const hoverPreviewRef = useTemplateRef('hoverPreviewRef')

const hoverPreviewId = useId()

const hoverPreviewItem = shallowRef<IGalleryItem>()

const choosedList: IObjT<boolean> = reactive({})
const urlEditor = useTemplateRef('urlEditor')
const { copy, remove, multiRemove, multiCopy } = useGalleryActions({
  choosedList,
  updateGallery,
  refresh: () => virtualScrollerRef.value?.refresh(),
})
function openDialog(item: ImgInfo) {
  urlEditor.value?.open(item)
}
function openBatchRename() {
  urlEditor.value?.openBatch()
}

const gallerySliderControl = ref({
  visible: false,
  index: 0,
})

const deleteCloud = ref<boolean>(false)

const isAlwaysForceReload = ref<boolean>(false)

const choosedPicBed = ref<string[]>([])

const galleryPicBedFilterSetting = ref<string[]>([])

const lastChoosed = ref<string>()

const isShiftKeyPress = ref<boolean>(false)

const searchText = ref<string>('')

const searchTextURL = ref<string>('')

const debouncedSearchText = ref<string>('')

const debouncedSearchTextURL = ref<string>('')

const handleBarActive = useStorage<boolean>('galleryHandleBarActive', true)

const pasteStyle = ref<string>('')

const useShortUrl = ref<string>('longUrl')

const dateRangeStart = ref('')

const dateRangeEnd = ref('')

const picBedDropdownOpen = ref(false)

const sortDropdownOpen = ref(false)

const enableAdvancedAnimation = ref(false)

const storedViewMode = useStorage<'list' | 'table' | 'grid'>('galleryViewMode', 'grid')

const viewMode = computed({
  get: () => (storedViewMode.value === 'grid' ? ('grid' as const) : ('table' as const)),
  set: (value: 'grid' | 'table') => {
    storedViewMode.value = value
  },
})

const tableDensity = useStorage<'compact' | 'comfortable'>('galleryTableDensity', 'compact')

const componentKey = ref(0)

type GallerySortField = 'name' | 'time' | 'ext' | 'provider' | 'check'

const currentSortField = ref<GallerySortField>('time')

const sortAscending = ref(false)

const userGridColumns = useStorage<number>('galleryGridColumns', 4)

const imageLoadStates = reactive<Record<string, boolean>>({})

const imageErrorStates = reactive<Record<string, boolean>>({})

const displayImageSources = reactive<Record<string, string>>({})

const jxlPreviewCache = reactive<Record<string, string>>({})

const jxlPreviewLoading = reactive<Record<string, boolean>>({})

const jxlPreviewErrors = reactive<Record<string, boolean>>({})

const previewCache = new PreviewCache(jxlPreviewCache)

const cacheBustToken = ref(Date.now())

const visibleGalleryIndexes = ref<number[]>([])

let jxlPreviewGeneration = 0

const pasteStyleList = ['markdown', 'HTML', 'URL', 'UBB', 'Custom']

const shortURLList = ['shortUrl', 'longUrl']

// Fewer columns mean wider cards, so give them more height to keep thumbnails roughly proportional.
const gridItemHeight = computed(() => {
  const columns = userGridColumns.value
  if (columns <= 2) return 340
  if (columns <= 4) return 260
  if (columns <= 8) return 220
  return 190
})

const effectiveGridBreakpoints = computed(() => {
  return Array.from({ length: userGridColumns.value }, (_, index) => ({ min: index * 180, cols: index + 1 }))
})

const tableColumns = computed<FileColumn<IGalleryItem>[]>(() => [
  { key: 'name', label: t('common.fileTable.name'), width: 260, value: item => item.fileName },
  { key: 'ext', label: t('common.fileTable.type'), width: 90, value: fileType },
  { key: 'time', label: t('common.fileTable.date'), width: 180, value: fileDate, format: formatCollectionDate },
  {
    key: 'provider',
    label: t('common.fileTable.provider'),
    width: 150,
    value: item => picBedG.value.find(provider => provider.type === item.type)?.name || item.type,
  },
])

const cardActions = computed(() => [
  {
    key: 'open',
    label: t('common.fileTable.open'),
    icon: Maximize2Icon,
    run: (_: IGalleryItem, i: number) => zoomImage(i),
  },
  { key: 'copy', label: t('pages.gallery.copy'), icon: ClipboardIcon, run: (item: IGalleryItem) => copy(item) },
  { key: 'edit', label: t('pages.gallery.edit'), icon: EditIcon, run: (item: IGalleryItem) => openDialog(item) },
  {
    key: 'delete',
    label: t('pages.gallery.delete'),
    icon: TrashIcon,
    run: (item: IGalleryItem, i: number) => remove(item, i),
  },
])

/** Filters hidden inside the collapsible panel; search boxes stay visible, so they are not counted. */
const panelFilterCount = computed(
  () => Number(choosedPicBed.value.length > 0) + Number(!!(dateRangeStart.value || dateRangeEnd.value)),
)

const hasActiveFilters = computed(
  () => panelFilterCount.value > 0 || !!debouncedSearchText.value || !!debouncedSearchTextURL.value,
)

const filteredPicBedG = computed(() => {
  if (galleryPicBedFilterSetting.value.length === 0) {
    return picBedG.value
  }
  return picBedG.value.filter(item => galleryPicBedFilterSetting.value.includes(item.type))
})

const filterList = computed(() => {
  return getGallery()
})

const galleryItemsByKey = computed(() => new Map(filterList.value.map(item => [item.key, item])))

const activeJxlPreviewSources = computed(() => getActiveJxlPreviewSources())

const previewFilterList = computed(() => {
  if (!gallerySliderControl.value.visible) {
    return filterList.value
  }

  const currentIndex = gallerySliderControl.value.index
  return filterList.value.map((item, index) =>
    index === currentIndex ? { ...item, src: buildDisplayImageSrc(item) } : item,
  )
})

const isAllSelected = computed(() => {
  return Object.values(choosedList).length > 0 && filterList.value.every(item => choosedList[item.id!])
})

const selectedCount = computed(() => {
  return Object.values(choosedList).filter(v => v).length
})

watch(pasteStyle, async newVal => {
  if (loadingConfig) return
  await saveConfig(configPaths.settings.pasteStyle, newVal)
})

watch(useShortUrl, async newVal => {
  if (loadingConfig) return
  await saveConfig(configPaths.settings.useShortUrl, newVal === 'shortUrl')
})

watch(filterList, (items, previous) => {
  hoverPreviewRef.value?.hide()
  if (gallerySliderControl.value.visible) {
    const currentKey = previous?.[gallerySliderControl.value.index]?.key
    const index = items.findIndex(item => item.key === currentKey)
    if (!items.length) gallerySliderControl.value.visible = false
    else
      gallerySliderControl.value.index =
        index >= 0 ? index : Math.min(gallerySliderControl.value.index, items.length - 1)
  }
  const visibleIds = new Set(items.map(item => item.id))
  Object.keys(choosedList).forEach(id => {
    if (!visibleIds.has(id)) {
      delete choosedList[id]
    }
  })
  if (!visibleIds.has(lastChoosed.value)) lastChoosed.value = undefined
  pruneDisplayImageSources(items)
  pruneJxlPreviewState(items)
  nextTick(() => {
    syncVisibleDisplayImageSources()
  })
})

watch([viewMode, tableDensity], () => hoverPreviewRef.value?.hide())

watch(
  () => [gallerySliderControl.value.visible, gallerySliderControl.value.index] as const,
  ([visible, index]) => {
    if (visible) {
      ensureJxlPreview(filterList.value[index])
    }
  },
)

watch(isAlwaysForceReload, () => {
  cacheBustToken.value = Date.now()
  invalidateJxlPreviewCache()
  syncVisibleDisplayImageSources()
})

watch(userGridColumns, _ => {
  nextTick(() => {
    if (virtualScrollerRef.value) {
      virtualScrollerRef.value.refresh()
    }
  })
})

watch(searchText, newVal => {
  const timer = setTimeout(() => {
    debouncedSearchText.value = newVal
    nextTick(() => {
      virtualScrollerRef.value?.scrollToTop()
    })
  }, 300)
  onWatcherCleanup(() => clearTimeout(timer))
})

watch(searchTextURL, newVal => {
  const timer = setTimeout(() => {
    debouncedSearchTextURL.value = newVal
    nextTick(() => {
      virtualScrollerRef.value?.scrollToTop()
    })
  }, 300)
  onWatcherCleanup(() => clearTimeout(timer))
})

function onImageLoad(item: IGalleryItem) {
  const id = item.key || ''
  imageLoadStates[id] = true
  if (getJxlPreviewSource(item)) {
    updateDisplayImageSource(item)
  }
}

function onImageError(item: IGalleryItem) {
  const id = item.key || ''
  imageLoadStates[id] = false
  if (ensureJxlPreview(item)) {
    return
  }

  imageErrorStates[id] = true
  updateDisplayImageSource(item)
}

async function initConf() {
  loadingConfig = true
  try {
    const settingConfig = (await getConfig<any>('settings')) || {}
    pasteStyle.value = settingConfig.pasteStyle || IPasteStyle.MARKDOWN
    useShortUrl.value = settingConfig.useShortUrl ? 'shortUrl' : 'longUrl'
    enableAdvancedAnimation.value = settingConfig.enableAdvancedAnimation || false
    isAlwaysForceReload.value = enforceBoolean(settingConfig.isAlwaysForceReload)
    deleteCloud.value = enforceBoolean(settingConfig.deleteCloudFile)
    galleryPicBedFilterSetting.value = settingConfig.galleryPicBedFilter || []
    await nextTick()
  } catch {
    message.error(t('pages.gallery.operationFailed'))
  } finally {
    loadingConfig = false
  }
}

const updateGalleryHandler = () => {
  if (!galleryActive.value) {
    galleryDirty = true
    return
  }
  void updateGallery()
}

function handleOutsideClick(event: Event) {
  const target = event.target as Element
  if (!target.closest('.custom-multiselect') && !target.closest('.sort-dropdown')) {
    picBedDropdownOpen.value = false
    sortDropdownOpen.value = false
  }
}

function handleDetectShiftKey(event: KeyboardEvent) {
  if (event.key === 'Shift') {
    isShiftKeyPress.value = event.type === 'keydown'
  }
}

const addCacheBustParam = (url: string | undefined) => withCacheBustParam(url, cacheBustToken.value)

function formatFileName(name: string) {
  return window.node.path.basename(name)
}

function getPreviewSource(item: ImgInfo) {
  const itemKey = item.key || ''
  const previewPath = getJxlPreviewSource(item)
  if (previewPath && jxlPreviewCache[previewPath]) {
    touchJxlPreviewCache(previewPath)
  }

  return getGalleryPreviewSource(
    item,
    jxlPreviewCache,
    jxlPreviewLoading,
    jxlPreviewErrors,
    itemKey ? imageLoadStates[itemKey] : false,
  )
}

function buildDisplayImageSrc(item: IGalleryItem) {
  if (imageErrorStates[item.key || '']) return './errorLoading.png'
  const src = getJxlPreviewSource(item) ? getPreviewSource(item) : item.src || item.galleryPath || item.imgUrl || ''
  return isAlwaysForceReload.value ? addCacheBustParam(src) : src
}

function updateDisplayImageSource(item?: IGalleryItem) {
  if (!item?.key) return
  if (!galleryItemsByKey.value.has(item.key)) return
  displayImageSources[item.key] = buildDisplayImageSrc(item)
}

function pruneDisplayImageSources(items: IGalleryItem[] = filterList.value, indexes?: number[]) {
  const keys = new Set<string>()
  const sourceItems = indexes ? indexes.map(index => items[index]).filter(Boolean) : items
  sourceItems.forEach(item => {
    if (!item.key) return
    keys.add(item.key)
  })
  Object.keys(displayImageSources).forEach(key => {
    if (!keys.has(key)) {
      delete displayImageSources[key]
    }
  })
}

function syncVisibleDisplayImageSources(indexes: number[] = visibleGalleryIndexes.value) {
  const visibleItems = filterList.value
  pruneDisplayImageSources(visibleItems, indexes)
  indexes.forEach(index => {
    updateDisplayImageSource(visibleItems[index])
  })
}

function getActiveJxlPreviewSources(items: ImgInfo[] = filterList.value) {
  const sources = new Set<string>()
  items.forEach(item => {
    const previewPath = getJxlPreviewSource(item)
    if (previewPath) {
      sources.add(previewPath)
    }
  })
  return sources
}

function isJxlPreviewSourceActive(previewPath: string) {
  return activeJxlPreviewSources.value.has(previewPath)
}

function touchJxlPreviewCache(previewPath: string) {
  previewCache.touch(previewPath)
}

function deleteJxlPreviewCacheEntry(previewPath: string) {
  previewCache.delete(previewPath)
}

function cacheJxlPreview(previewPath: string, previewSrc: string) {
  previewCache.set(previewPath, previewSrc)
}

function invalidateJxlPreviewCache() {
  jxlPreviewGeneration += 1
  previewCache.clear()
  Object.keys(jxlPreviewLoading).forEach(key => {
    delete jxlPreviewLoading[key]
  })
  Object.keys(jxlPreviewErrors).forEach(key => {
    delete jxlPreviewErrors[key]
  })
}

function pruneJxlPreviewState(items: ImgInfo[] = filterList.value) {
  const activeSources = getActiveJxlPreviewSources(items)
  Object.keys(jxlPreviewCache).forEach(previewPath => {
    if (!activeSources.has(previewPath)) {
      deleteJxlPreviewCacheEntry(previewPath)
    }
  })
  Object.keys(jxlPreviewLoading).forEach(previewPath => {
    if (!activeSources.has(previewPath)) {
      delete jxlPreviewLoading[previewPath]
    }
  })
  Object.keys(jxlPreviewErrors).forEach(previewPath => {
    if (!activeSources.has(previewPath)) {
      delete jxlPreviewErrors[previewPath]
    }
  })
}

function handleVisibleIndexesChange(indexes: number[]) {
  visibleGalleryIndexes.value = indexes
  syncVisibleDisplayImageSources(visibleGalleryIndexes.value)
}

function ensureJxlPreview(item?: IGalleryItem): boolean {
  if (!galleryActive.value) return false
  const previewPath = getJxlPreviewSource(item)
  if (!previewPath || jxlPreviewErrors[previewPath]) {
    return false
  }

  if (jxlPreviewCache[previewPath]) {
    updateDisplayImageSource(item)
    return true
  }

  if (jxlPreviewLoading[previewPath]) {
    return true
  }

  jxlPreviewLoading[previewPath] = true
  const previewGeneration = jxlPreviewGeneration
  const previewRequestSource = isAlwaysForceReload.value ? addCacheBustParam(previewPath) : previewPath
  updateDisplayImageSource(item)
  window.electron
    .triggerRPC<string | undefined>(IRPCActionType.GALLERY_GET_JXL_PREVIEW, previewRequestSource, true)
    .then(previewSrc => {
      if (previewGeneration !== jxlPreviewGeneration || !isJxlPreviewSourceActive(previewPath)) {
        return
      }
      if (previewSrc) {
        cacheJxlPreview(previewPath, previewSrc)
        delete jxlPreviewErrors[previewPath]
      } else {
        jxlPreviewErrors[previewPath] = true
      }
    })
    .catch(() => {
      if (previewGeneration !== jxlPreviewGeneration || !isJxlPreviewSourceActive(previewPath)) {
        return
      }
      jxlPreviewErrors[previewPath] = true
    })
    .finally(() => {
      if (previewGeneration !== jxlPreviewGeneration) {
        return
      }
      delete jxlPreviewLoading[previewPath]
      updateDisplayImageSource(item)
    })

  return true
}

function getGallery(): IGalleryItem[] {
  const hasDateRange = !!(dateRangeStart.value || dateRangeEnd.value)
  const start = dateRangeStart.value ? new Date(`${dateRangeStart.value}T00:00:00`).getTime() : -Infinity
  // The exclusive end follows the local calendar, including daylight-saving transitions.
  const endDate = dateRangeEnd.value ? new Date(`${dateRangeEnd.value}T00:00:00`) : undefined
  endDate?.setDate(endDate.getDate() + 1)
  const end = endDate?.getTime() ?? Infinity
  if (
    debouncedSearchText.value ||
    choosedPicBed.value.length > 0 ||
    debouncedSearchTextURL.value ||
    hasDateRange ||
    galleryPicBedFilterSetting.value.length > 0
  ) {
    return images.value.filter(item => {
      let isInChoosedPicBed = true
      let isIncludesSearchText = true
      let isIncludesSearchTextURL = true
      let isIncludesDateRange = true
      if (choosedPicBed.value.length > 0) {
        isInChoosedPicBed = choosedPicBed.value.some(type => type === item.type)
      } else if (galleryPicBedFilterSetting.value.length > 0) {
        isInChoosedPicBed = galleryPicBedFilterSetting.value.some(type => type === item.type)
      }
      if (debouncedSearchText.value) {
        isIncludesSearchText = customStrMatch(item.fileName || '', debouncedSearchText.value)
      }
      if (debouncedSearchTextURL.value) {
        isIncludesSearchTextURL = customStrMatch(item.imgUrl || '', debouncedSearchTextURL.value)
      }
      if (hasDateRange) {
        const date = new Date(item.updatedAt).getTime()
        isIncludesDateRange = date >= start && date < end
      }
      return isIncludesSearchText && isInChoosedPicBed && isIncludesSearchTextURL && isIncludesDateRange
    })
  } else {
    return images.value
  }
}

function updateGallery(): Promise<boolean> {
  if (galleryDisposed) return Promise.resolve(false)
  galleryRefreshRequested = true
  if (galleryRefreshPromise) return galleryRefreshPromise
  galleryLoading.value = true
  galleryRefreshPromise = Promise.resolve()
    .then(async () => {
      let succeeded: boolean
      do {
        galleryRefreshRequested = false
        succeeded = await loadGallerySnapshot()
      } while (galleryRefreshRequested && !galleryDisposed)
      return succeeded
    })
    .finally(() => {
      galleryRefreshPromise = undefined
      if (!galleryDisposed) galleryLoading.value = false
    })
  return galleryRefreshPromise
}

async function loadGallerySnapshot() {
  const version = ++galleryRefreshVersion
  try {
    const result = await $$db.get<ImgInfo>({ orderBy: 'desc' })
    if (galleryDisposed || galleryRefreshRequested) return false
    if (!result || !Array.isArray(result.data)) throw new Error('Missing gallery snapshot')
    const newList = result.data
    const prepared = prepareGalleryItems(newList)
    const previousItems = new Map(images.value.map(item => [item.key, item]))
    const stableIds = new Set(
      prepared
        .filter(item => {
          const previous = previousItems.get(item.key)
          return previous?.src === item.src && previous?.imgUrl === item.imgUrl
        })
        .map(item => item.key),
    )
    Object.keys(imageLoadStates).forEach(k => {
      if (!stableIds.has(k)) delete imageLoadStates[k]
    })
    Object.keys(imageErrorStates).forEach(k => {
      if (!stableIds.has(k)) delete imageErrorStates[k]
    })
    Object.keys(displayImageSources).forEach(k => {
      if (!stableIds.has(k)) delete displayImageSources[k]
    })
    if (isAlwaysForceReload.value) {
      cacheBustToken.value = Date.now()
      invalidateJxlPreviewCache()
    }
    images.value = prepared
    sortFile(currentSortField.value, false)
    nextTick(() => {
      if (galleryDisposed || version !== galleryRefreshVersion) return
      pruneJxlPreviewState()
      syncVisibleDisplayImageSources()
      if (virtualScrollerRef.value) {
        virtualScrollerRef.value.refresh()
      }
    })
    galleryLoadFailed.value = false
    return true
  } catch {
    if (!galleryDisposed && !galleryRefreshRequested) galleryLoadFailed.value = true
    return false
  }
}

function handleChooseImage(val: boolean, index: number) {
  const currentItem = filterList.value[index]
  if (currentItem && currentItem.id) {
    choosedList[currentItem.id] = val
  }

  if (val === true) {
    const anchorIndex = filterList.value.findIndex(item => item.id === lastChoosed.value)
    if (anchorIndex >= 0 && isShiftKeyPress.value) {
      const min = Math.min(anchorIndex, index)
      const max = Math.max(anchorIndex, index)
      for (let i = min + 1; i < max; i++) {
        const id = filterList.value[i].id!
        choosedList[id] = true
      }
      try {
        delete choosedList[currentItem.id!]
        choosedList[currentItem.id!] = val
      } catch (e) {
        console.error(e)
      }
    }
    lastChoosed.value = currentItem.id
  }
}

function clearChoosedList() {
  isShiftKeyPress.value = false
  Object.keys(choosedList).forEach(key => {
    delete choosedList[key]
  })
  lastChoosed.value = undefined
}

function zoomImage(index: number) {
  hoverPreviewRef.value?.hide()
  ensureJxlPreview(filterList.value[index])
  gallerySliderControl.value.index = index
  gallerySliderControl.value.visible = true
}

function showHoverPreview(item: IGalleryItem, anchor: Element) {
  hoverPreviewItem.value = item
  hoverPreviewRef.value?.show(anchor)
}

async function handleIsAlwaysForceReload(value: boolean) {
  if (
    !(await saveConfig({
      [configPaths.settings.isAlwaysForceReload]: value,
    }))
  )
    return
  window.electron.sendRPC(IRPCActionType.REFRESH_SETTING_WINDOW)
}

async function handleDeleteCloudFile(value: boolean) {
  await saveConfig({
    [configPaths.settings.deleteCloudFile]: value,
  })
}

function cleanSearch() {
  searchText.value = ''
}

function cleanSearchUrl() {
  searchTextURL.value = ''
}

function clearFilters() {
  searchText.value = ''
  searchTextURL.value = ''
  debouncedSearchText.value = ''
  debouncedSearchTextURL.value = ''
  choosedPicBed.value = []
  dateRangeStart.value = ''
  dateRangeEnd.value = ''
}

function providerName(item: IGalleryItem) {
  return picBedG.value.find(provider => provider.type === item.type)?.name || item.type || ''
}

function formatCardDate(item: IGalleryItem) {
  const date = fileDate(item)
  return date === undefined ? '' : new Date(date).toLocaleDateString()
}

/** Once anything is selected, clicking a card toggles it instead of opening the preview. */
function handleCardClick(item: IGalleryItem, index: number, event: MouseEvent) {
  if (selectedCount.value > 0 || event.shiftKey || event.ctrlKey || event.metaKey) {
    handleChooseImage(!choosedList[item.id || ''], index)
    return
  }
  zoomImage(index)
}

function handleGalleryShortcut(event: KeyboardEvent) {
  if (!galleryActive.value || event.defaultPrevented || gallerySliderControl.value.visible) return
  const target = event.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"], [role="listbox"]')) return
  if (document.querySelector('[role="dialog"], [aria-modal="true"]')) return
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && filterList.value.length) {
    event.preventDefault()
    setAllSelected(true)
  } else if (event.key === 'Escape' && selectedCount.value > 0) {
    event.preventDefault()
    clearChoosedList()
  }
}

function toggleSelectAll() {
  setAllSelected(!isAllSelected.value)
}

function setAllSelected(selected: boolean) {
  filterList.value.forEach(item => {
    choosedList[item.id!] = selected
  })
}

function toggleSortDirection() {
  sortAscending.value = !sortAscending.value
  sortFile(currentSortField.value, false)
}

function toggleHandleBar() {
  handleBarActive.value = !handleBarActive.value
}

function sortFile(type: GallerySortField, toggle = true) {
  if (toggle) sortAscending.value = type === currentSortField.value ? !sortAscending.value : true
  currentSortField.value = type
  const column = tableColumns.value.find(column => column.key === type)
  images.value = [...images.value].sort((a, b) =>
    type === 'check'
      ? Number(!!choosedList[b.id!]) - Number(!!choosedList[a.id!])
      : compareFileValues(column?.value(a), column?.value(b), sortAscending.value),
  )
}

onBeforeRouteUpdate((to, from) => {
  if (from.name === 'gallery') {
    clearChoosedList()
  }
  if (to.name === 'gallery') {
    updateGallery()
  }
})

onActivated(async () => {
  galleryActive.value = true
  await initConf()
  if (galleryDirty) {
    galleryDirty = false
    await updateGallery()
  }
  nextTick(() => {
    if (virtualScrollerRef.value && typeof virtualScrollerRef.value.refresh === 'function') {
      virtualScrollerRef.value.refresh()
    } else {
      componentKey.value++
    }
  })
})

onDeactivated(() => {
  galleryActive.value = false
  gallerySliderControl.value.visible = false
  hoverPreviewRef.value?.hide()
  hoverPreviewItem.value = undefined
  invalidateJxlPreviewCache()
  for (const state of [displayImageSources, imageLoadStates, imageErrorStates]) {
    for (const key of Object.keys(state)) delete state[key]
  }
})

onBeforeMount(async () => {
  window.electron.ipcRendererOn(UPDATE_GALLERY, updateGalleryHandler)
  updateGallery()
  document.addEventListener('keydown', handleDetectShiftKey)
  document.addEventListener('keyup', handleDetectShiftKey)
  document.addEventListener('keydown', handleGalleryShortcut)
  document.addEventListener('click', handleOutsideClick)
})

onBeforeUnmount(() => {
  galleryDisposed = true
  galleryRefreshVersion++
  galleryActive.value = false
  invalidateJxlPreviewCache()
  window.electron.ipcRendererRemoveAllListeners(UPDATE_GALLERY)
  document.removeEventListener('click', handleOutsideClick)
  document.removeEventListener('keydown', handleDetectShiftKey)
  document.removeEventListener('keyup', handleDetectShiftKey)
  document.removeEventListener('keydown', handleGalleryShortcut)
})
</script>
