declare module 'ssh2-no-cpu-features' {
  export * from 'ssh2'
}

declare module 'shell-path' {
  export const shellPath: () => Promise<string | undefined>
  export const shellPathSync: () => string | null
}
