export const navItemBase =
  'flex h-10 w-full shrink-0 cursor-pointer items-center gap-2.5 rounded-md text-left text-sm font-medium whitespace-nowrap transition-colors duration-fast ease-apple focus-visible:focus-ring'

export const navChildBase =
  'relative flex h-8 w-full shrink-0 cursor-pointer items-center gap-2 rounded-md px-2.5 text-left text-[13px] transition-colors duration-fast ease-apple focus-visible:focus-ring'

/** `containsActive` tints a parent whose active child is hidden from view. */
export function navItemState(active: boolean, containsActive = false) {
  if (active) return 'bg-accent text-white shadow-sm'
  if (containsActive) return 'bg-accent/10 text-accent hover:bg-accent/15'
  return 'text-secondary hover:bg-accent/10 hover:text-main'
}

/**
 * Children stay lighter than top-level items so only one solid pill shows at a time;
 * the active one also marks the tree line beside it.
 */
export function navChildState(active: boolean) {
  if (active)
    return 'bg-accent/10 font-semibold text-accent before:absolute before:inset-y-1.5 before:-left-[7.5px] before:w-0.5 before:rounded-full before:bg-accent'
  return 'font-medium text-secondary hover:bg-accent/10 hover:text-main'
}
