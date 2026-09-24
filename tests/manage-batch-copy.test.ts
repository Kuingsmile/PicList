import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

import ts from 'typescript'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { parse } from 'vue/compiler-sfc'

import { formatLink } from '../src/renderer/manage/utils/common'
import { IRPCActionType } from '../src/renderer/utils/enum'

vi.mock('@/manage/utils/dataSender', () => ({ getConfig: vi.fn().mockResolvedValue(true) }))
vi.mock('@/manage/utils/icon', () => ({ availableIconList: [] }))
vi.mock('@/manage/utils/linkFormat', () => import('../src/renderer/manage/utils/linkFormat'))
vi.mock('@/utils/common', () => ({ isNeedToShorten: vi.fn(), safeSliceF: vi.fn() }))

const { descriptor } = parse(
  readFileSync(new URL('../src/renderer/manage/pages/BucketPage.vue', import.meta.url), 'utf8'),
)
const script = ts.createSourceFile('BucketPage.ts', descriptor.scriptSetup!.content, ts.ScriptTarget.Latest, true)
const actionDeclarations = new Set(['linkFormatList', 'preSignedUrlFormat', 'handleBatchCopyLink', 'getPreSignedUrl'])
// Execute the actual SFC action and RPC adapter without initializing the unrelated bucket UI.
const actionCode = ts.transpileModule(
  script.statements
    .filter(statement => {
      if (ts.isFunctionDeclaration(statement)) return actionDeclarations.has(statement.name!.text)
      return (
        ts.isVariableStatement(statement) &&
        statement.declarationList.declarations.some(declaration =>
          actionDeclarations.has(declaration.name.getText(script)),
        )
      )
    })
    .map(statement => statement.getText(script))
    .join('\n'),
  { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None } },
).outputText

type TemplateNode = NonNullable<NonNullable<typeof descriptor.template>['ast']>['children'][number]

function findPreSignedMenuClick(nodes: TemplateNode[]): string | undefined {
  for (const node of nodes) {
    if (node.type !== 1) continue
    const isPreSignedMenu = node.props.some(
      prop =>
        prop.type === 7 && prop.name === 'if' && prop.exp?.type === 4 && prop.exp.content === 'isShowPresignedUrl',
    )
    if (isPreSignedMenu) {
      const click = node.props.find(
        prop => prop.type === 7 && prop.name === 'on' && prop.arg?.type === 4 && prop.arg.content === 'click',
      )
      if (click?.type === 7 && click.exp?.type === 4) return click.exp.content
    }
    const click = findPreSignedMenuClick(node.children)
    if (click) return click
  }
}

const menuClick = findPreSignedMenuClick(descriptor.template!.ast!.children)
if (!menuClick) throw new Error('Bulk pre-signed URL menu action not found')

const files = [
  { key: 'folder/a %2F#?+中.png', fileName: 'a.png', url: 'https://example.invalid/unsigned-a.png' },
  { key: 'folder/b.png', fileName: 'b.png', url: 'https://example.invalid/unsigned-b.png' },
]
const signedUrls = [
  'https://example.invalid/folder/a%20%252F%23%3F%2B%E4%B8%AD.png?X-Amz-Credential=test%2Fscope&X-Amz-Signature=a%2Bb',
  'https://example.invalid/folder/b.png?X-Amz-Security-Token=a%2Bb%2Fc%3D&X-Amz-Signature=abc',
]

function createAction() {
  const triggerRPC = vi.fn().mockResolvedValueOnce(signedUrls[0]).mockResolvedValueOnce(signedUrls[1])
  const writeText = vi.fn()
  const message = { warning: vi.fn(), success: vi.fn(), error: vi.fn() }
  const selectedItems = ref([...files])
  const copyDropdownOpen = ref(true)
  const dependencies = {
    selectedItems,
    copyDropdownOpen,
    message,
    t: (key: string) => key,
    formatLink,
    customPasteFormat: ref('[$filePath]($url)'),
    configMap: ref({ alias: 'private-storage', bucketName: 'private-bucket', bucketConfig: { Location: 'us-east-1' } }),
    currentCustomDomain: ref('https://example.invalid'),
    manageStore: { config: { settings: { PreSignedExpire: 600 } } },
    IRPCActionType,
    window: { electron: { triggerRPC, clipboard: { writeText } } },
  }
  const action = runInNewContext(
    `${actionCode}\n({ click: () => ${menuClick}, copy: handleBatchCopyLink, formats: linkFormatList })`,
    dependencies,
  ) as {
    click: () => Promise<void>
    copy: (format: string) => Promise<void>
    formats: string[]
  }
  return { ...action, selectedItems, copyDropdownOpen, triggerRPC, writeText, message }
}

beforeEach(() => vi.clearAllMocks())

describe('bucket bulk copy menu', () => {
  it('signs every selected file using the actual menu argument and preserves signed URLs exactly', async () => {
    const action = createAction()
    action.selectedItems.value.splice(1, 0, { ...files[0], isDir: true } as (typeof files)[number])

    await action.click()

    expect(action.triggerRPC).toHaveBeenCalledTimes(files.length)
    files.forEach((file, index) => {
      expect(action.triggerRPC).toHaveBeenNthCalledWith(
        index + 1,
        IRPCActionType.MANAGE_GET_PRE_SIGNED_URL,
        'private-storage',
        {
          bucketName: 'private-bucket',
          region: 'us-east-1',
          key: file.key,
          customUrl: 'https://example.invalid',
          expires: 600,
          githubPrivate: undefined,
          rawUrl: file.url,
        },
      )
    })
    expect(action.writeText).toHaveBeenCalledExactlyOnceWith(signedUrls.join('\n'))
    expect(action.message.success).toHaveBeenCalledExactlyOnceWith('pages.manage.bucket.copySuccess')
    expect(action.message.error).not.toHaveBeenCalled()
    expect(action.copyDropdownOpen.value).toBe(false)
  })

  it.each(['error', '', '   ', null, undefined, false, new Error('Signer unavailable')])(
    'reports signing failure (%s) without copying unsigned or partial results',
    async failure => {
      const action = createAction()
      action.triggerRPC.mockReset().mockResolvedValueOnce(signedUrls[0])
      if (failure instanceof Error) action.triggerRPC.mockRejectedValueOnce(failure)
      else action.triggerRPC.mockResolvedValueOnce(failure)

      await action.click()

      expect(action.triggerRPC).toHaveBeenCalledTimes(2)
      expect(action.writeText).not.toHaveBeenCalled()
      expect(action.message.success).not.toHaveBeenCalled()
      expect(action.message.error).toHaveBeenCalledExactlyOnceWith('pages.manage.bucket.copyPreSignedUrlFailed')
      expect(action.copyDropdownOpen.value).toBe(false)
    },
  )

  it('keeps ordinary copy formats working without signing', async () => {
    const action = createAction()
    for (const format of action.formats) {
      await action.copy(format)
      const expected = await Promise.all(
        files.map(file => formatLink(file.url, file.fileName, format, '[$filePath]($url)', file.key)),
      )
      expect(action.writeText).toHaveBeenLastCalledWith(expected.join('\n'))
    }
    expect(action.triggerRPC).not.toHaveBeenCalled()
    expect(action.message.error).not.toHaveBeenCalled()
  })

  it('warns on an empty selection without signing or replacing the clipboard', async () => {
    const action = createAction()
    action.selectedItems.value = []

    await action.click()

    expect(action.message.warning).toHaveBeenCalledExactlyOnceWith('pages.manage.bucket.selectFileMsg')
    expect(action.message.success).not.toHaveBeenCalled()
    expect(action.triggerRPC).not.toHaveBeenCalled()
    expect(action.writeText).not.toHaveBeenCalled()
    expect(action.copyDropdownOpen.value).toBe(false)
  })
})
