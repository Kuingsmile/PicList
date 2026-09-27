import { RPCRouter } from '~/events/rpc/router'
import bucketRoutes from '~/events/rpc/routes/manage/bucket'
import bulkChangeRoutes from '~/events/rpc/routes/manage/bulkChanges'
import configRoutes from '~/events/rpc/routes/manage/config'
import upDownLoadRoutes from '~/events/rpc/routes/manage/upDownload'

const manageRouter = new RPCRouter()

const manageRoutes = [...configRoutes, ...bucketRoutes, ...upDownLoadRoutes, ...bulkChangeRoutes]

manageRouter.addBatch(manageRoutes)

export { manageRouter }
