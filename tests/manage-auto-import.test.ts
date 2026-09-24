// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'

import ts from 'typescript'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type App, computed, createApp, onMounted, ref } from 'vue'
import { parse } from 'vue/compiler-sfc'

const { descriptor } = parse(readFileSync(resolve('src/renderer/manage/pages/LogInPage.vue'), 'utf8'))
const script = ts.createSourceFile('LogInPage.ts', descriptor.scriptSetup!.content, ts.ScriptTarget.Latest, true)
// Run the actual page setup and mounted hook, with storage and unrelated UI dependencies stubbed.
const setupCode = ts.transpileModule(
  script.statements
    .filter(statement => !ts.isImportDeclaration(statement))
    .map(statement => statement.getText(script))
    .join('\n'),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } },
).outputText

let managerConfigs: IStringKeyMap
let uploaderConfigs: IStringKeyMap
let autoImport: boolean
let autoImportPicBed: string | string[]
const apps: App[] = []
const getConfig = vi.fn(async () => structuredClone(managerConfigs))
const saveConfig = vi.fn((key: string, value: IStringKeyMap) => {
  expect(key).toBe('picBed')
  managerConfigs = structuredClone(value)
})

async function mountLoginPage() {
  const manageStore = {
    config: {} as IStringKeyMap,
    async refreshConfig() {
      this.config = { picBed: structuredClone(managerConfigs) }
    },
  }
  const setup = runInNewContext(`() => { ${setupCode}\nreturn { allConfigAliasList } }`, {
    computed,
    onMounted,
    ref,
    useI18n: () => ({ t: (key: string) => key }),
    useManageStore: () => manageStore,
    useRouter: () => ({}),
    useMessage: () => ({}),
    useConfirm: () => ({}),
    getConfig,
    getPicListConfig: async (key: string) => {
      if (key === 'uploader') return structuredClone(uploaderConfigs)
      if (key === 'settings.autoImport') return autoImport
      if (key === 'settings.autoImportPicBed') return autoImportPicBed
      throw new Error(`Unexpected configuration key: ${key}`)
    },
    saveConfig,
  })
  const app = createApp({ setup, render: () => null })
  const container = document.createElement('div')
  document.body.append(container)
  apps.push(app)
  const page = app.mount(container) as unknown as { allConfigAliasList: IStringKeyMap[] }
  await vi.waitFor(() => {
    expect(page.allConfigAliasList.length).toBeGreaterThan(0)
    expect(page.allConfigAliasList.map(item => item.config)).toEqual(Object.values(managerConfigs))
  })
  return app
}

beforeEach(() => {
  vi.clearAllMocks()
  managerConfigs = {}
  uploaderConfigs = { smms: { configList: [{ _configName: 'Demo', token: 'uploader-token' }] } }
  autoImport = true
  autoImportPicBed = ['smms']
})

afterEach(() => {
  for (const app of apps.splice(0)) app.unmount()
  document.body.replaceChildren()
})

describe('manager automatic import', () => {
  it('preserves the complete customized imported record after unmounting and mounting a fresh page', async () => {
    const firstVisit = await mountLoginPage()
    expect(managerConfigs['smms-Demo-imp']).toEqual({
      alias: 'smms-Demo-imp',
      picBedName: 'smms',
      paging: true,
      token: 'uploader-token',
    })
    expect(saveConfig).toHaveBeenCalledOnce()
    firstVisit.unmount()
    apps.splice(apps.indexOf(firstVisit), 1)

    const customized = {
      ...managerConfigs['smms-Demo-imp'],
      token: 'manager-token',
      paging: false,
      customPasteFormat: '[$fileName]($url)',
      managerOnly: { preferences: ['keep', 'all'] },
    }
    managerConfigs['smms-Demo-imp'] = structuredClone(customized)
    uploaderConfigs.smms.configList[0].token = 'updated-uploader-token'
    saveConfig.mockClear()

    await mountLoginPage()

    expect(managerConfigs).toEqual({ 'smms-Demo-imp': customized })
    expect(saveConfig).not.toHaveBeenCalled()
  })

  it.each([{ setting: ['smms'] }, { setting: 'smms' }])(
    'imports only absent aliases with $setting',
    async ({ setting }) => {
      autoImportPicBed = setting
      const existing = {
        alias: 'smms-Demo-imp',
        picBedName: 'smms',
        token: 'manager-token',
        customPasteFormat: '<img src="$url">',
      }
      const manual = { alias: 'manual', picBedName: 'smms', token: 'manual-token' }
      managerConfigs = { 'smms-Demo-imp': existing, manual }
      uploaderConfigs.smms.configList.push({ _configName: 'New', token: 'new-uploader-token' })

      await mountLoginPage()

      expect(managerConfigs).toEqual({
        'smms-Demo-imp': existing,
        manual,
        'smms-New-imp': { alias: 'smms-New-imp', picBedName: 'smms', paging: true, token: 'new-uploader-token' },
      })
      expect(saveConfig).toHaveBeenCalledOnce()
    },
  )

  it.each(['disabled', 'unselected'])('leaves manager records untouched when automatic import is %s', async mode => {
    autoImport = mode !== 'disabled'
    autoImportPicBed = mode === 'unselected' ? ['github'] : ['smms']
    const existing = { manual: { alias: 'manual', picBedName: 'smms', token: 'manager-token' } }
    managerConfigs = structuredClone(existing)

    await mountLoginPage()

    expect(managerConfigs).toEqual(existing)
    expect(saveConfig).not.toHaveBeenCalled()
  })

  it('preserves a manager record added after the initial store refresh', async () => {
    const existing = {
      alias: 'smms-Demo-imp',
      picBedName: 'smms',
      token: 'manager-token',
      customPasteFormat: '[$fileName]($url)',
    }
    getConfig.mockImplementationOnce(async () => {
      managerConfigs['smms-Demo-imp'] = structuredClone(existing)
      return structuredClone(managerConfigs)
    })
    uploaderConfigs.smms.configList.push({ _configName: 'New', token: 'new-uploader-token' })

    await mountLoginPage()

    expect(managerConfigs).toEqual({
      'smms-Demo-imp': existing,
      'smms-New-imp': { alias: 'smms-New-imp', picBedName: 'smms', paging: true, token: 'new-uploader-token' },
    })
    expect(saveConfig).toHaveBeenCalledOnce()
  })
})
