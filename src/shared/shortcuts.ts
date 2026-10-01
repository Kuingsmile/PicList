export interface UploadShortcutAction {
  type: 'uploadClipboard' | 'uploadFiles'
  picBed: string
  configId: string
}

export interface ShortcutConfig {
  enable: boolean
  key: string
  name: string
  label: string
  from?: string
  action?: UploadShortcutAction
}

export type ShortcutStatus =
  'active' | 'disabled' | 'unbound' | 'invalid' | 'conflict' | 'unavailable' | 'failed' | 'paused'

export interface ShortcutEntry extends ShortcutConfig {
  id: string
  from: string
  available: boolean
  status: ShortcutStatus
  conflicts: string[]
  defaultKey?: string
}

export interface ShortcutTarget {
  picBed: string
  picBedName: string
  configId: string
  configName: string
}

const modifierAliases: Record<string, string> = {
  command: 'Command',
  cmd: 'Command',
  control: 'Control',
  ctrl: 'Control',
  commandorcontrol: 'CommandOrControl',
  cmdorctrl: 'CommandOrControl',
  alt: 'Alt',
  option: 'Alt',
  altgr: 'AltGr',
  shift: 'Shift',
  super: 'Super',
  meta: 'Super',
}
const keyAliases: Record<string, string> = {
  enter: 'Return',
  esc: 'Escape',
  arrowup: 'Up',
  arrowdown: 'Down',
  arrowleft: 'Left',
  arrowright: 'Right',
}
const namedKeys = [
  'Plus',
  'Space',
  'Tab',
  'Capslock',
  'Numlock',
  'Scrolllock',
  'Backspace',
  'Delete',
  'Insert',
  'Return',
  'Up',
  'Down',
  'Left',
  'Right',
  'Home',
  'End',
  'PageUp',
  'PageDown',
  'Escape',
  'VolumeUp',
  'VolumeDown',
  'VolumeMute',
  'MediaNextTrack',
  'MediaPreviousTrack',
  'MediaStop',
  'MediaPlayPause',
  'PrintScreen',
  'numdec',
  'numadd',
  'numsub',
  'nummult',
  'numdiv',
]
const keyNames = new Map(namedKeys.map(key => [key.toLowerCase(), key]))
const modifierOrder = ['CommandOrControl', 'Command', 'Control', 'Alt', 'AltGr', 'Shift', 'Super']
const shiftedKeys: Record<string, string> = {
  '!': '1',
  '@': '2',
  '#': '3',
  $: '4',
  '%': '5',
  '^': '6',
  '&': '7',
  '*': '8',
  '(': '9',
  ')': '0',
  _: '-',
  Plus: '=',
  ':': ';',
  '"': "'",
  '<': ',',
  '>': '.',
  '?': '/',
  '~': '`',
  '{': '[',
  '}': ']',
  '|': '\\',
}

/** Electron accelerators are case/order insensitive. Resolve platform aliases for ownership checks. */
export function normalizeShortcut(value: string, platform: string): string | null {
  if (typeof value !== 'string' || !value.trim() || value.length > 150) return null
  // Accept Electron's literal plus syntax as well as its unambiguous "Plus" spelling.
  const tokens = (value.trim() === '+' ? 'Plus' : value.trim().replace(/\+\+$/, '+Plus')).split('+')
  const modifiers = new Set<string>()
  let key: string | undefined
  for (const token of tokens) {
    const lower = token.trim().toLowerCase()
    if (!lower) return null
    let modifier = Object.hasOwn(modifierAliases, lower) ? modifierAliases[lower] : undefined
    if (modifier) {
      if (modifier === 'CommandOrControl') modifier = platform === 'darwin' ? 'Command' : 'Control'
      if (modifier === 'Super' && platform === 'darwin') modifier = 'Command'
      // Command is ignored by Electron outside macOS; do not silently bind a different key.
      if (modifier === 'Command' && platform !== 'darwin') return null
      modifiers.add(modifier)
      continue
    }
    if (key) return null
    key = Object.hasOwn(keyAliases, lower) ? keyAliases[lower] : keyNames.get(lower)
    if (!key && (/^[a-z0-9]$/.test(lower) || /^f([1-9]|1\d|2[0-4])$/.test(lower))) key = lower.toUpperCase()
    if (!key && /^num[0-9]$/.test(lower)) key = lower
    if (!key && lower.length === 1 && ')!@#$%^&*(:;=<,_->.?/~`{]}[|\\"\''.includes(lower)) key = lower
    if (!key) return null
  }
  if (!key) return null
  // Electron parses shifted punctuation as its base key plus Shift (including Plus vs Shift+=).
  if (Object.hasOwn(shiftedKeys, key)) {
    key = shiftedKeys[key]
    modifiers.add('Shift')
  }
  return [...modifierOrder.filter(modifier => modifiers.has(modifier)), key].join('+')
}

export function shortcutSource(id: string): string {
  return id.slice(0, id.indexOf(':'))
}

export function findShortcutConflicts(
  entries: Pick<ShortcutEntry, 'id' | 'key' | 'enable' | 'available'>[],
  id: string,
  key: string,
  platform: string,
): string[] {
  const normalized = normalizeShortcut(key, platform)
  if (!normalized) return []
  return entries
    .filter(
      entry =>
        entry.id !== id && entry.enable && entry.available && normalizeShortcut(entry.key, platform) === normalized,
    )
    .map(entry => entry.id)
}

export function isUploadShortcutAction(value: unknown): value is UploadShortcutAction {
  if (!value || typeof value !== 'object') return false
  const action = value as UploadShortcutAction
  return (
    (action.type === 'uploadClipboard' || action.type === 'uploadFiles') &&
    typeof action.picBed === 'string' &&
    /^[\w-]+$/.test(action.picBed) &&
    !['__proto__', 'prototype', 'constructor'].includes(action.picBed) &&
    typeof action.configId === 'string' &&
    action.configId.trim().length > 0
  )
}

export interface ShortcutKeyEvent {
  key: string
  code: string
  ctrlKey: boolean
  shiftKey: boolean
  altKey: boolean
  metaKey: boolean
  isComposing?: boolean
}

/** Use physical letters/digits with modifiers so Alt/Option and Shift don't record composed characters. */
export function shortcutFromKeyboardEvent(event: ShortcutKeyEvent, platform: string): string | null {
  if (
    event.isComposing ||
    ['Shift', 'Control', 'Alt', 'Meta', 'AltGraph', 'Dead', 'Process', 'Unidentified'].includes(event.key)
  )
    return null
  let key = event.key
  const numpad: Record<string, string> = {
    NumpadAdd: 'numadd',
    NumpadSubtract: 'numsub',
    NumpadMultiply: 'nummult',
    NumpadDivide: 'numdiv',
    NumpadDecimal: 'numdec',
  }
  if (/^Numpad\d$/.test(event.code)) key = `num${event.code.slice(-1)}`
  else if (numpad[event.code]) key = numpad[event.code]
  else if (/^Key[A-Z]$/.test(event.code) && !/^[a-z]$/i.test(key)) key = event.code.slice(3)
  else if (/^Digit\d$/.test(event.code)) key = event.code.slice(5)
  else if (key === ' ') key = 'Space'
  else if (key === '+') key = 'Plus'
  const modifiers = [
    event.ctrlKey && 'Control',
    event.altKey && 'Alt',
    event.shiftKey && 'Shift',
    event.metaKey && (platform === 'darwin' ? 'Command' : 'Super'),
  ].filter(Boolean)
  return normalizeShortcut([...modifiers, key].join('+'), platform)
}
