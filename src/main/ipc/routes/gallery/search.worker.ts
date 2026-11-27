import { parentPort, workerData } from 'node:worker_threads'

function pattern(text: string) {
  if (!text) return
  try {
    return new RegExp(text, 'u')
  } catch {
    return /(?!)/
  }
}

function gallerySearchMatcher(nameText: string, urlText: string) {
  const name = pattern(nameText)
  const url = pattern(urlText)
  return (filename: string | undefined, address: string | undefined) =>
    (!name || (!!filename && name.test(filename))) && (!url || (!!address && url.test(address)))
}

const { name, url, fields } = workerData as {
  name: string
  url: string
  fields: [string, string | undefined, string | undefined][]
}
const matches = gallerySearchMatcher(name, url)
parentPort!.postMessage(fields.filter(([, filename, address]) => matches(filename, address)).map(([id]) => id))
