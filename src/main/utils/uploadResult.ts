export const isUploadUrl = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
