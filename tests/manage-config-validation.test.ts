// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'

import ts from 'typescript'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type App, computed, createApp, onMounted, ref, watch } from 'vue'
import { parse } from 'vue/compiler-sfc'

import { getSupportedPicBedList } from '../src/renderer/manage/utils/constants'

const { descriptor } = parse(readFileSync(resolve('src/renderer/manage/pages/ManageEditPage.vue'), 'utf8'))
const script = ts.createSourceFile('ManageEditPage.ts', descriptor.scriptSetup!.content, ts.ScriptTarget.Latest, true)
// Exercise the actual page setup and save handler with the real validation rules and stubbed persistence.
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

async function mountEditPage(platformName: string, config: IStringKeyMap) {
  const getConfig = vi.fn().mockResolvedValue({})
  const saveConfig = vi.fn()
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
      defineProps: () => ({ aliasName: '', platformName }),
      defineEmits: () => emit,
      useI18n: () => ({ t: (key: string) => key }),
      useManageStore: () => ({ refreshConfig }),
      useMessage: () => message,
      getSupportedPicBedList,
      getConfig,
      saveConfig,
      formatEndpoint: (value: string) => value,
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
  return { page, getConfig, saveConfig, refreshConfig, emit, message }
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
