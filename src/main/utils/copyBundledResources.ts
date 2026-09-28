import fs from 'fs-extra'

// Preserve unchanged files so each launch does not rewrite the bundled themes
// and clipboard helpers, especially when the data directory is on a slow disk.
export async function copyBundledResources(source: string, destination: string): Promise<void> {
  await fs.copy(source, destination, {
    overwrite: true,
    filter: async (from, to) => {
      if (!(await fs.stat(from)).isFile()) return true
      try {
        const [bundled, installed] = await Promise.all([fs.readFile(from), fs.readFile(to)])
        return !bundled.equals(installed)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return true
        throw error
      }
    },
  })
}
