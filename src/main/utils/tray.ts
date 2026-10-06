import type { Tray } from 'electron'

export let tray: Tray

export const setTray = (t: Tray) => {
  tray = t
}

export function setTrayToolTip(title: string): void {
  if (tray) {
    tray.setToolTip(title)
  }
}
