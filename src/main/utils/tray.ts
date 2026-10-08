import type { Rectangle, Size, Tray } from 'electron'

export let tray: Tray

export const setTray = (t: Tray) => {
  tray = t
}

// Clicking the tray icon blurs (and hides) an open panel before the click event arrives.
const REOPEN_GUARD_MS = 400
let trayWindowHiddenAt = 0

export const markTrayWindowHidden = () => {
  trayWindowHiddenAt = Date.now()
}

export const isTrayWindowJustHidden = () => Date.now() - trayWindowHiddenAt < REOPEN_GUARD_MS

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max))

/**
 * Place the tray panel next to its icon, on the side facing the work area:
 * below a macOS menu bar or top taskbar, above a bottom taskbar, beside a side taskbar.
 */
export function getTrayWindowPosition(icon: Rectangle, size: Size, workArea: Rectangle, gap: number) {
  const right = workArea.x + workArea.width
  const bottom = workArea.y + workArea.height
  const iconCenterX = icon.x + icon.width / 2
  const iconCenterY = icon.y + icon.height / 2
  let x = iconCenterX - size.width / 2
  let y: number
  if (icon.x >= right) {
    x = right - size.width - gap
    y = iconCenterY - size.height / 2
  } else if (icon.x + icon.width <= workArea.x) {
    x = workArea.x + gap
    y = iconCenterY - size.height / 2
  } else if (iconCenterY > workArea.y + workArea.height / 2) {
    y = Math.min(icon.y, bottom) - size.height - gap
  } else {
    y = Math.max(icon.y + icon.height, workArea.y) + gap
  }
  return {
    x: Math.round(clamp(x, workArea.x + gap, right - size.width - gap)),
    y: Math.round(clamp(y, workArea.y + gap, bottom - size.height - gap)),
  }
}

export function setTrayToolTip(title: string): void {
  if (tray) {
    tray.setToolTip(title)
  }
}
