// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'

import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type App, computed, createApp, onMounted, ref, watch } from 'vue'
import { parse } from 'vue/compiler-sfc'

import { getSupportedPicBedList } from '../src/renderer/manage/utils/constants'
import { formatEndpoint } from '../src/renderer/utils/common'

const { descriptor } = parse(readFileSync(resolve('src/renderer/manage/pages/ManageEditPage.vue'), 'utf8'))
const script = ts.createSourceFile('ManageEditPage.ts', descriptor.scriptSetup!.content, ts.ScriptTarget.Latest, true)
// Exercise the actual page setup and save handler with real validation and normalization and in-memory persistence.
const setupCode = ts.transpileModule(
  script.statements
    .filter(statement => !ts.isImportDeclaration(statement))
    .map(statement => statement.getText(script))
    .join('\n'),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } },
).outputText

interface EditPage {
  configResult: IStringKeyMap
  formErrors: Record<string, string>
  editMode: boolean
  handleConfigChange: () => Promise<void>
  validateField: (platformName: string, option: string) => void
}

const apps: App[] = []
const smmsConfig = { alias: 'manager-test', token: 'test-token', paging: false }
const qiniuConfig = {
  alias: 'manager-test',
  accessKey: 'test-access-key',
  secretKey: 'test-secret-key',
  paging: false,
  isAutoCustomUrl: false,
}

async function mountEditPage(
  platformName: string,
  config: IStringKeyMap,
  aliasName = '',
  storedConfig: IStringKeyMap = {},
) {
  const getConfig = vi.fn(async () => JSON.parse(JSON.stringify(storedConfig)))
  const saveConfig = vi.fn((_key: string, value: IStringKeyMap) => {
    storedConfig[value.alias] = JSON.parse(JSON.stringify(value))
  })
  const refreshConfig = vi.fn().mockResolvedValue(undefined)
  const emit = vi.fn()
  const message = { error: vi.fn(), success: vi.fn() }
  const setup = runInNewContext(
    `() => { ${setupCode}\nreturn { configResult, formErrors, editMode, handleConfigChange, validateField } }`,
    {
      computed,
      onMounted,
      ref,
      watch,
      defineModel: () => ref(true),
      defineProps: () => ({ aliasName, platformName }),
      defineEmits: () => emit,
      useI18n: () => ({ t: (key: string) => key }),
      useManageStore: () => ({ refreshConfig }),
      useMessage: () => message,
      getSupportedPicBedList,
      getConfig,
      saveConfig,
      formatEndpoint,
    },
  )
  const app = createApp({ setup, render: () => null })
  const container = document.createElement('div')
  document.body.append(container)
  apps.push(app)
  const page = app.mount(container) as unknown as EditPage
  await vi.waitFor(() => expect(page.configResult).toHaveProperty('customPasteFormat'))
  Object.assign(page.configResult, config)
  getConfig.mockClear()
  refreshConfig.mockClear()
  return { page, getConfig, saveConfig, refreshConfig, emit, message, storedConfig }
}

async function expectRejectedSave(form: Awaited<ReturnType<typeof mountEditPage>>, fields: string[]) {
  await form.page.handleConfigChange()

  expect(form.page.formErrors).toEqual(Object.fromEntries(fields.map(field => [field, expect.any(String)])))
  expect(form.saveConfig).not.toHaveBeenCalled()
  expect(form.refreshConfig).not.toHaveBeenCalled()
  expect(form.getConfig).not.toHaveBeenCalled()
  expect(form.message.error).toHaveBeenCalledExactlyOnceWith('pages.manage.login.noRequiredMsg')
  expect(form.message.success).not.toHaveBeenCalled()
  expect(form.emit).not.toHaveBeenCalled()
  expect(form.page.editMode).toBe(true)
}

afterEach(() => {
  for (const app of apps.splice(0)) app.unmount()
  document.body.replaceChildren()
})

describe('manager configuration save validation', () => {
  it.each([
    { field: 'token', value: '' },
    { field: 'token', value: undefined },
    { field: 'alias', value: '' },
  ])('rejects a missing required $field ($value)', async ({ field, value }) => {
    const form = await mountEditPage('smms', { ...smmsConfig, [field]: value })

    await expectRejectedSave(form, [field])
  })

  it('rejects an error already displayed by field validation', async () => {
    const form = await mountEditPage('smms', { ...smmsConfig, token: '' })
    form.page.validateField('smms', 'token')
    expect(form.page.formErrors.token).toBeTruthy()

    await expectRejectedSave(form, ['token'])
  })

  it.each(['bad alias', 'bad.alias', 'bad/alias', 'bad@alias'])('rejects the invalid alias %s', async alias => {
    const form = await mountEditPage('smms', { ...smmsConfig, alias })

    await expectRejectedSave(form, ['alias'])
  })

  it.each([undefined, '', 0, -1, 19, 1001, Number.POSITIVE_INFINITY, 'not-a-number'])(
    'rejects an invalid page size (%s)',
    async itemsPerPage => {
      const form = await mountEditPage('qiniu', { ...qiniuConfig, itemsPerPage })

      await expectRejectedSave(form, ['itemsPerPage'])
    },
  )

  it('reports every invalid field before returning from Save', async () => {
    const form = await mountEditPage('qiniu', {
      ...qiniuConfig,
      alias: 'bad alias',
      accessKey: '',
      secretKey: '',
      itemsPerPage: 19,
    })

    await expectRejectedSave(form, ['alias', 'accessKey', 'secretKey', 'itemsPerPage'])
  })

  it('blocks errors returned by a provider-specific validator', async () => {
    const form = await mountEditPage('github', {
      ...smmsConfig,
      githubUsername: 'test-user',
      customUrl: 'https://cdn.example.invalid/{unclosed',
    })

    await expectRejectedSave(form, ['customUrl'])
    expect(form.page.formErrors.customUrl).toBe('pages.manage.constant.github.bracketRuleMsg')
  })

  it.each([20, 1000])('saves the inclusive page-size boundary %s with false boolean values', async itemsPerPage => {
    const form = await mountEditPage('qiniu', { ...qiniuConfig, itemsPerPage })

    await form.page.handleConfigChange()

    expect(form.page.formErrors).toEqual({})
    expect(form.saveConfig).toHaveBeenCalledExactlyOnceWith(
      'picBed.manager-test',
      expect.objectContaining({ ...qiniuConfig, itemsPerPage, picBedName: 'qiniu' }),
    )
    expect(form.refreshConfig).toHaveBeenCalledOnce()
    expect(form.message.error).not.toHaveBeenCalled()
    expect(form.message.success).toHaveBeenCalledOnce()
    expect(form.emit).toHaveBeenCalledWith('update:editMode', false)
    expect(form.page.editMode).toBe(false)
  })

  it.each(['Manager_123-test', '\u56fe\u5e8a-1'])(
    'saves after correcting errors with the valid alias %s',
    async alias => {
      const form = await mountEditPage('smms', { alias: 'bad alias', token: '', paging: false })
      await expectRejectedSave(form, ['alias', 'token'])
      Object.assign(form.page.configResult, { alias, token: 'test-token' })

      await form.page.handleConfigChange()

      expect(form.page.formErrors).toEqual({})
      expect(form.saveConfig).toHaveBeenCalledExactlyOnceWith(
        `picBed.${alias}`,
        expect.objectContaining({ alias, token: 'test-token', paging: false, picBedName: 'smms' }),
      )
      expect(form.message.success).toHaveBeenCalledOnce()
      expect(form.page.editMode).toBe(false)
    },
  )
})

describe('manager custom domain save round-trip', () => {
  const s3Config = {
    alias: 'manager-test',
    accessKeyId: 'test-access-key',
    secretAccessKey: 'test-secret-key',
    bucketName: 'photos',
  }

  it.each([
    { platform: 'github', config: { token: 'test-token', githubUsername: 'test-user' } },
    { platform: 's3plist', config: s3Config },
    {
      platform: 'webdavplist',
      config: { endpoint: 'https://webdav.example.invalid', username: 'test-user', password: 'test-password' },
    },
    { platform: 'local', config: { baseDir: '/files' } },
    { platform: 'sftp', config: { host: 'sftp.example.invalid', baseDir: '/files' } },
    { platform: 'upyun', config: { bucketName: 'photos', operator: 'test-user', password: 'test-password' } },
  ])('preserves HTTPS on create and HTTP on edit for $platform', async ({ platform, config }) => {
    const alias = 'manager-test'
    const customUrl = 'https://cdn.example.invalid/images/'
    const form = await mountEditPage(platform, { ...config, alias, customUrl })

    await form.page.handleConfigChange()

    expect(form.saveConfig).toHaveBeenCalledExactlyOnceWith(`picBed.${alias}`, expect.objectContaining({ customUrl }))
    const saved = form.storedConfig[alias]
    if (saved.bucketName) {
      expect(JSON.parse(saved.transformedConfig)[saved.bucketName].customUrl).toBe(customUrl)
    }
    const reopened = await mountEditPage(platform, {}, alias, form.storedConfig)
    expect(reopened.page.configResult.customUrl).toBe(customUrl)

    const httpUrl = 'http://cdn.example.invalid/images/'
    reopened.page.configResult.customUrl = httpUrl
    await reopened.page.handleConfigChange()

    expect(reopened.saveConfig).toHaveBeenCalledExactlyOnceWith(
      `picBed.${alias}`,
      expect.objectContaining({ customUrl: httpUrl }),
    )
    const edited = await mountEditPage(platform, {}, alias, form.storedConfig)
    expect(edited.page.configResult.customUrl).toBe(httpUrl)
  })

  it.each([true, false])('preserves explicit HTTPS with S3 TLS set to %s', async sslEnabled => {
    const customUrl = 'https://cdn.example.invalid'
    const form = await mountEditPage('s3plist', { ...s3Config, customUrl, sslEnabled })

    await form.page.handleConfigChange()

    expect(form.storedConfig[s3Config.alias]).toMatchObject({ customUrl, sslEnabled })
  })

  it.each([
    { sslEnabled: true, scheme: 'https' },
    { sslEnabled: false, scheme: 'http' },
    { sslEnabled: undefined, scheme: 'https' },
  ])('defaults bare S3 domains to $scheme with TLS set to $sslEnabled', async ({ sslEnabled, scheme }) => {
    const form = await mountEditPage('s3plist', {
      ...s3Config,
      bucketName: 'photos,fallback,archive',
      customUrl: ' cdn.example.invalid/photos , , archive.example.invalid ',
      sslEnabled,
    })

    await form.page.handleConfigChange()

    const saved = form.storedConfig[s3Config.alias]
    expect(saved.customUrl).toBe(`${scheme}://cdn.example.invalid/photos,,${scheme}://archive.example.invalid`)
    expect(JSON.parse(saved.transformedConfig)).toMatchObject({
      photos: { customUrl: `${scheme}://cdn.example.invalid/photos` },
      fallback: { customUrl: '' },
      archive: { customUrl: `${scheme}://archive.example.invalid` },
    })
  })

  it('preserves schemes, templates, and empty entries in a GitHub domain list', async () => {
    const customUrl = 'https://cdn.example.invalid/{owner}/{repo},,http://mirror.example.invalid/{branch}'
    const form = await mountEditPage('github', {
      ...smmsConfig,
      githubUsername: 'test-user',
      customUrl,
    })

    await form.page.handleConfigChange()

    expect(form.storedConfig[smmsConfig.alias].customUrl).toBe(customUrl)
  })

  it('keeps an empty optional domain empty', async () => {
    const form = await mountEditPage('s3plist', { ...s3Config, customUrl: '' })

    await form.page.handleConfigChange()

    const saved = form.storedConfig[s3Config.alias]
    expect(saved.customUrl).toBe('')
    expect(JSON.parse(saved.transformedConfig).photos.customUrl).toBe('')
  })
})
