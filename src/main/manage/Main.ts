/* eslint-disable */
import { manageDbChecker } from './datastore/dbChecker'
import { ManageApi } from './manageApi'

manageDbChecker()
const getManageApi = (picBedName: string = 'placeholder'): ManageApi => {
  return new ManageApi(picBedName)
}

export default getManageApi
