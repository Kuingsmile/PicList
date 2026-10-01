import { RPCRouter } from '~/ipc/router'
import appRoutes from '~/ipc/routes/system/app'
import windowRoutes from '~/ipc/routes/system/window'

const systemRouter = new RPCRouter()

const systemRoutes = [...appRoutes, ...windowRoutes]

systemRouter.addBatch(systemRoutes)

export { systemRouter }
