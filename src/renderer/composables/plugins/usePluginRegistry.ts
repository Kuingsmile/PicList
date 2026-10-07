import { useStorage } from '@vueuse/core'
import { debounce } from 'lodash-es'
import type { Ref } from 'vue'
import { computed, onBeforeUnmount, onWatcherCleanup, reactive, ref, watch } from 'vue'

import { fetchRegistryJson } from '@/services/pluginRegistry'
import { handleStreamlinePluginName } from '#/utils/strings'
interface PluginRegistryOptions {
  pluginNameList: Ref<string[]>
}

export function usePluginRegistry({ pluginNameList }: PluginRegistryOptions) {
  const METADATA_CONCURRENCY = 4

  const METADATA_CACHE_TTL_MS = 5 * 60_000

  const searchText = ref('')

  const latestVersionMap = reactive<Record<string, string>>({})

  const updateTimeMap = reactive<Record<string, string>>({})

  const strictSearch = useStorage('plugin-strict-search', true)

  const searchResults = ref<IPicGoPlugin[]>([])

  const searching = ref(false)

  const searchFailed = ref(false)

  const browsePlugins = ref<IPicGoPlugin[]>([])

  const loadingBrowse = ref(false)

  const browseFailed = ref(false)

  let searchController: AbortController | undefined

  let browseController: AbortController | undefined

  let disposed = false

  const metadataQueue = new Set<string>()

  const metadataControllers = new Map<string, AbortController>()

  const metadataFetchedAt = new Map<string, number>()

  const npmSearchText = computed(() => {
    const text = searchText.value.trim()
    return text === '' || text.includes('picgo-plugin-') ? text : `picgo-plugin-${text}`
  })

  // With no query, Discover lists the whole registry; otherwise it shows npm search results.
  const discoverPlugins = computed(() => (npmSearchText.value ? searchResults.value : browsePlugins.value))

  const discoverLoading = computed(() => (npmSearchText.value ? searching.value : loadingBrowse.value))

  const discoverFailed = computed(() => (npmSearchText.value ? searchFailed.value : browseFailed.value))

  const getSearchResult = debounce(_getSearchResult, 300)

  function markInstalled() {
    const installed = new Set(pluginNameList.value)
    for (const item of [...searchResults.value, ...browsePlugins.value]) {
      item.hasInstall = installed.has(item.fullName)
    }
  }

  function setInstalling(fullName: string, ing: boolean, hasInstall?: boolean) {
    for (const item of [...searchResults.value, ...browsePlugins.value]) {
      if (item.fullName !== fullName) continue
      item.ing = ing
      if (hasInstall !== undefined) item.hasInstall = hasInstall
    }
  }

  function queuePluginMetadata(list: IPicGoPlugin[]) {
    for (const { fullName } of list) {
      const fetchedAt = metadataFetchedAt.get(fullName)
      if (fetchedAt !== undefined && Date.now() - fetchedAt < METADATA_CACHE_TTL_MS) continue
      if (!metadataControllers.has(fullName)) metadataQueue.add(fullName)
    }
    loadNextPluginMetadata()
  }

  function loadNextPluginMetadata() {
    while (!disposed && metadataControllers.size < METADATA_CONCURRENCY && metadataQueue.size > 0) {
      const pluginName = metadataQueue.values().next().value!
      metadataQueue.delete(pluginName)
      const controller = new AbortController()
      metadataControllers.set(pluginName, controller)
      void getLatestVersionOfPlugIn(pluginName, controller)
    }
  }

  async function getLatestVersionOfPlugIn(pluginName: string, controller: AbortController) {
    try {
      const data = await fetchRegistryJson(`https://registry.npmjs.com/${encodeURIComponent(pluginName)}`, controller)
      if (disposed || controller.signal.aborted || typeof data['dist-tags']?.latest !== 'string') return
      latestVersionMap[pluginName] = data['dist-tags'].latest
      updateTimeMap[pluginName] = (data.time?.modified || '').split('T')[0]
      metadataFetchedAt.set(pluginName, Date.now())
    } catch {
      if (!controller.signal.aborted) console.error('Failed to fetch plugin metadata')
    } finally {
      metadataControllers.delete(pluginName)
      loadNextPluginMetadata()
    }
  }

  async function _getSearchResult(val: string, strict: boolean, controller: AbortController) {
    try {
      const data = await fetchRegistryJson(
        `https://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(val)}`,
        controller,
      )
      if (controller !== searchController || controller.signal.aborted) return
      searchResults.value = data.objects
        .filter((item: INPMSearchResultObject) => {
          return strict
            ? item.package.name.includes('picgo-plugin-') && item.package.name.includes(val)
            : item.package.name.includes('picgo-plugin-')
        })
        .map((item: INPMSearchResultObject) => {
          return handleSearchResult(item)
        })
    } catch {
      if (controller === searchController && !controller.signal.aborted) {
        searchFailed.value = true
        console.error('Failed to search plugins')
      }
    } finally {
      if (controller === searchController) {
        searching.value = false
        searchController = undefined
      }
    }
  }

  function handleSearchResult(item: INPMSearchResultObject): IPicGoPlugin {
    const pkg = item.package
    const name = handleStreamlinePluginName(pkg.name)
    return {
      name,
      date: pkg.date ? pkg.date.split('T')[0] : '',
      fullName: pkg.name,
      author: pkg.author?.name || pkg.publisher?.username || 'unknown',
      description: pkg.description,
      logo: `https://cdn.jsdelivr.net/npm/${pkg.name}/logo.png`,
      config: {},
      homepage: pkg.links ? pkg.links.homepage : '',
      hasInstall: pluginNameList.value.includes(pkg.name),
      version: pkg.version,
      gui: !!pkg.keywords?.includes('picgo-gui-plugin'),
      ing: false, // installing or uninstalling
    }
  }

  // Loads the registry listing once; pass force to reload it.
  async function loadBrowsePlugins(force = false) {
    if (disposed || (!force && (browsePlugins.value.length > 0 || loadingBrowse.value))) return
    browseController?.abort()
    const controller = new AbortController()
    browseController = controller
    loadingBrowse.value = true
    browseFailed.value = false
    try {
      const data = await fetchRegistryJson(
        'https://registry.npmjs.com/-/v1/search?text=picgo-plugin-&size=250',
        controller,
      )
      if (controller !== browseController || controller.signal.aborted) return
      browsePlugins.value = data.objects
        .filter((item: INPMSearchResultObject) => item.package.name.startsWith('picgo-plugin-'))
        .map((item: INPMSearchResultObject) => handleSearchResult(item))
    } catch {
      if (controller === browseController && !controller.signal.aborted) {
        browseFailed.value = true
        console.error('Failed to fetch plugins')
      }
    } finally {
      if (controller === browseController) {
        loadingBrowse.value = false
        browseController = undefined
      }
    }
  }

  function retryDiscover() {
    if (npmSearchText.value) {
      searchController?.abort()
      const controller = new AbortController()
      searchController = controller
      searching.value = true
      searchFailed.value = false
      void _getSearchResult(npmSearchText.value, strictSearch.value, controller)
    } else {
      void loadBrowsePlugins(true)
    }
  }

  watch(
    [npmSearchText, strictSearch],
    ([val, strict]) => {
      searchResults.value = []
      searchFailed.value = false
      if (!val) {
        searching.value = false
        return
      }
      const controller = new AbortController()
      onWatcherCleanup(() => {
        getSearchResult.cancel()
        controller.abort()
        if (searchController === controller) searchController = undefined
      })
      searching.value = true
      searchController = controller
      getSearchResult(val, strict, controller)
    },
    { flush: 'sync' },
  )

  onBeforeUnmount(() => {
    disposed = true
    getSearchResult.cancel()
    searchController?.abort()
    browseController?.abort()
    metadataQueue.clear()
    metadataControllers.forEach(controller => controller.abort())
    metadataControllers.clear()
  })
  return {
    searchText,
    strictSearch,
    latestVersionMap,
    updateTimeMap,
    discoverPlugins,
    discoverLoading,
    discoverFailed,
    markInstalled,
    setInstalling,
    queuePluginMetadata,
    loadBrowsePlugins,
    retryDiscover,
  }
}
