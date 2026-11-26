import type { ManageApi } from './manageApi'

let configApi: ManageApi | undefined

export default async function getManageApi(picBedName?: string): Promise<ManageApi> {
  const { ManageApi } = await import('./manageApi')
  if (picBedName === undefined) return (configApi ??= new ManageApi())
  return new ManageApi(picBedName)
}
