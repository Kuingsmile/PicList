export function normalizeScriptFileName(input: string): string | null {
  const trimmedName = input.trim()
  if (!trimmedName) return null

  return trimmedName.endsWith('.js') ? trimmedName : `${trimmedName}.js`
}
