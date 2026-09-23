import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import clipboardWatcher from '../src/main/utils/clipboardPoll'

type ClipboardKind = 'empty' | 'text' | 'image' | 'path'

const state = vi.hoisted(() => ({ kind: 'empty' as ClipboardKind, value: '' }))

vi.mock('@core/picgo/logger', () => ({ default: { info: vi.fn() } }))
vi.mock('~/utils/common', () => ({
  getClipboardFilePath: () => (state.kind === 'path' ? state.value : ''),
}))
vi.mock('electron', () => ({
  clipboard: {
    readImage: () => {
      const bitmap = state.kind === 'image' ? state.value : null
      return {
        isEmpty: () => bitmap === null,
        toBitmap: () => Buffer.from(bitmap ?? ''),
      }
    },
  },
}))

const onChange = vi.fn()

function copy(kind: ClipboardKind, value = 'first') {
  state.kind = kind
  state.value = value
}

beforeEach(() => {
  vi.useFakeTimers()
  copy('empty')
  onChange.mockClear()
  clipboardWatcher.on('change', onChange)
})

afterEach(() => {
  clipboardWatcher.stopListening(false)
  clipboardWatcher.removeAllListeners()
  vi.useRealTimers()
})

describe('clipboard watcher', () => {
  it.each(['empty', 'text', 'image', 'path'] as const)(
    'does not emit for existing %s content when monitoring starts',
    kind => {
      copy(kind)
      clipboardWatcher.startListening()
      expect(onChange).not.toHaveBeenCalled()

      vi.advanceTimersByTime(3000)
      expect(onChange).not.toHaveBeenCalled()
    },
  )

  it.each(['empty', 'text', 'image', 'path'] as const)(
    'detects a screenshot copied before the first poll after starting with %s',
    kind => {
      copy(kind)
      clipboardWatcher.startListening()
      copy('image', 'new screenshot')
      vi.advanceTimersByTime(1000)

      expect(onChange).toHaveBeenCalledOnce()
    },
  )

  it.each(['empty', 'text'] as const)('detects the first screenshot after repeated %s polls', kind => {
    copy(kind)
    clipboardWatcher.startListening()
    vi.advanceTimersByTime(3000)
    expect(onChange).not.toHaveBeenCalled()

    copy('image')
    vi.advanceTimersByTime(1000)
    expect(onChange).toHaveBeenCalledOnce()

    vi.advanceTimersByTime(2000)
    expect(onChange).toHaveBeenCalledOnce()

    copy('image', 'second screenshot')
    vi.advanceTimersByTime(1000)
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('emits once for each new file path', () => {
    clipboardWatcher.startListening()
    copy('path', '/first.png')
    vi.advanceTimersByTime(3000)
    expect(onChange).toHaveBeenCalledOnce()

    copy('path', '/second.png')
    vi.advanceTimersByTime(3000)
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['image', 'empty'],
    ['image', 'text'],
    ['path', 'empty'],
    ['path', 'text'],
  ] as const)('detects the same %s again after a %s transition', (kind, gap) => {
    copy(kind)
    clipboardWatcher.startListening()
    vi.advanceTimersByTime(1000)
    onChange.mockClear()

    copy(gap)
    vi.advanceTimersByTime(2000)
    expect(onChange).not.toHaveBeenCalled()

    copy(kind)
    vi.advanceTimersByTime(2000)
    expect(onChange).toHaveBeenCalledOnce()
  })

  it.each([
    ['image', 'path'],
    ['path', 'image'],
  ] as const)('detects a %s to %s transition and a return to the original content', (first, second) => {
    copy(first)
    clipboardWatcher.startListening()
    vi.advanceTimersByTime(1000)
    onChange.mockClear()

    copy(second)
    vi.advanceTimersByTime(2000)
    expect(onChange).toHaveBeenCalledOnce()

    copy(first)
    vi.advanceTimersByTime(2000)
    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it.each(['empty', 'text', 'image', 'path'] as const)('takes a fresh %s snapshot when restarted', kind => {
    copy('image', 'old screenshot')
    clipboardWatcher.startListening()
    vi.advanceTimersByTime(1000)
    clipboardWatcher.stopListening(false)
    expect(vi.getTimerCount()).toBe(0)

    copy(kind)
    vi.advanceTimersByTime(2000)
    expect(onChange).not.toHaveBeenCalled()

    clipboardWatcher.startListening()
    vi.advanceTimersByTime(2000)
    expect(onChange).not.toHaveBeenCalled()

    copy('image', 'new screenshot')
    vi.advanceTimersByTime(1000)
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('replaces the timer and baseline when started again while listening', () => {
    clipboardWatcher.startListening()
    copy('image', 'new baseline')
    clipboardWatcher.startListening(250)
    expect(vi.getTimerCount()).toBe(1)

    copy('image', 'new screenshot')
    vi.advanceTimersByTime(249)
    expect(onChange).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(onChange).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(1000)
    expect(onChange).toHaveBeenCalledOnce()
  })
})
