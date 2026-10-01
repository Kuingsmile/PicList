import { RPCRouter } from '~/ipc/router'
import bucketRoutes from '~/ipc/routes/manage/bucket'
import bulkChangeRoutes from '~/ipc/routes/manage/bulkChanges'
import configRoutes from '~/ipc/routes/manage/config'
import upDownLoadRoutes from '~/ipc/routes/manage/upDownload'

const manageRouter = new RPCRouter()

const manageRoutes = [...configRoutes, ...bucketRoutes, ...upDownLoadRoutes, ...bulkChangeRoutes]

manageRouter.addBatch(manageRoutes)

export { manageRouter }
