declare module 'ssh2-no-cpu-features' {
  export * from 'ssh2'
}

declare module 'shell-path' {
  export const shellPathSync: () => string | null
}
