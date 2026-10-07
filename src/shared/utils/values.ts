export const simpleClone = (obj: any) => JSON.parse(JSON.stringify(obj))

export const enforceNumber = (num: number | string) => (isNaN(+num) ? 0 : +num)

export const enforceBoolean = (value: unknown): boolean => (typeof value === 'string' ? value === 'true' : !!value)

export const trimValues = <T extends IStringKeyMap>(
  obj: T,
): { [K in keyof T]: T[K] extends string ? string : T[K] } => {
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]),
  ) as { [K in keyof T]: T[K] extends string ? string : T[K] }
}
