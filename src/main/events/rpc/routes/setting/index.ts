import { RPCRouter } from '~/events/rpc/router'
import advancedRoutes from '~/events/rpc/routes/setting/advanced'
import configureRoutes from '~/events/rpc/routes/setting/configure'
import mainAppRoutes from '~/events/rpc/routes/setting/mainApp'
import shortKeyRoutes from '~/events/rpc/routes/setting/shortKey'

const settingRouter = new RPCRouter()

const settingRoutes = [...advancedRoutes, ...configureRoutes, ...mainAppRoutes, ...shortKeyRoutes]

settingRouter.addBatch(settingRoutes)

export { settingRouter }
