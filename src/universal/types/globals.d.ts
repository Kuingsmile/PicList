declare module 'ssh2-no-cpu-features' {
  const Client: any
  export { Client }
}

declare module 'shell-path' {
  export const shellPathSync: () => string | null
}
