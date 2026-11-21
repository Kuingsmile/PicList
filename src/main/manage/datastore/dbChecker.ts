import { checkConfigFile } from '@core/datastore/configFile'
import { manageConfigPath } from '@core/datastore/dirs'

export function manageDbChecker(): void {
  if (process.type === 'renderer') return
  checkConfigFile(manageConfigPath())
}
