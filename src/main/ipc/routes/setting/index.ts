import { RPCRouter } from '~/ipc/router'
import advancedRoutes from '~/ipc/routes/setting/advanced'
import configureRoutes from '~/ipc/routes/setting/configure'
import mainAppRoutes from '~/ipc/routes/setting/mainApp'
import shortKeyRoutes from '~/ipc/routes/setting/shortKey'

const settingRouter = new RPCRouter()

const settingRoutes = [...advancedRoutes, ...configureRoutes, ...mainAppRoutes, ...shortKeyRoutes]

settingRouter.addBatch(settingRoutes)

export { settingRouter }
