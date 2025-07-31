import { RPCRouter } from '~/events/rpc/router'
import bucketRoutes from '~/events/rpc/routes/manage/bucket'
import configRoutes from '~/events/rpc/routes/manage/config'
import upDownLoadRoutes from '~/events/rpc/routes/manage/upDownload'

const manageRouter = new RPCRouter()

const manageRoutes = [...configRoutes, ...bucketRoutes, ...upDownLoadRoutes]

manageRouter.addBatch(manageRoutes)

export { manageRouter }
