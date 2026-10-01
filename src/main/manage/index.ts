import { manageDbChecker } from '~/manage/datastore/dbChecker'
import { ManageApi } from '~/manage/manageApi'

manageDbChecker()
const getManageApi = (picBedName: string = 'placeholder'): ManageApi => {
  return new ManageApi(picBedName)
}

export default getManageApi
