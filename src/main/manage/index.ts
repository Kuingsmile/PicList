import type { ManageApi } from './manageApi'

let configApi: ManageApi | undefined

export default async function getManageApi(picBedName?: string): Promise<ManageApi> {
  const { ManageApi } = await import('./manageApi')
  const api = (configApi ??= new ManageApi())
  await api.refreshIfChanged()
  return picBedName === undefined ? api : api.forAccount(picBedName)
}

export function destroyManageClients() {
  return configApi?.destroy()
}
