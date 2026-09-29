# Main-process APIs / 主进程 API

See the [development guide](../../../CONTRIBUTING_EN.md) / [开发指南](../../../CONTRIBUTING.md) for setup, scripts, and localization.

## Directory responsibilities / 目录职责

| Directory         | Responsibility / 职责                                                                                                                                                                                 |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `core/bus/`       | Shared main-process events and window ID requests. / 主进程事件和窗口 ID 请求。                                                                                                                       |
| `core/datastore/` | Configuration paths, gallery storage, and database checks. / 配置路径、相册存储和数据库检查。                                                                                                         |
| `core/picgo/`     | The PicList-Core instance, logging, and the desktop plugin handler with optional bundled npm. / PicList-Core 实例、日志，以及支持可选内置 npm 的桌面插件管理器。                                      |
| `core/utils/`     | Local GUI log helpers. / 本地 GUI 日志工具。                                                                                                                                                          |
| `app/`            | Upload orchestration, windows, shortcuts, themes, and system integration. / 上传流程、窗口、快捷键、主题和系统集成。                                                        |
| `gui/`            | `GuiApi` for plugins: dialogs, file selection, uploads, notifications, configuration paths, and guarded gallery access. / 插件的 `GuiApi`：对话框、文件选择、上传、通知、配置路径和带确认的相册访问。 |
| `delete/`         | Gallery remote-deletion adapters, dispatched by uploader ID in `allApi.ts`. / 相册远端删除适配器，由 `allApi.ts` 按上传器 ID 分发。                                                                   |

`core/picgo/index.ts` creates the `PicGo` instance from the `piclist` package (PicList-Core); built-in uploaders come from that dependency. Cloud management clients live separately in [../manage/apis/](../manage/apis/), and their registration is in [../manage/manageApi.ts](../manage/manageApi.ts). Adding a deletion adapter does not add a cloud management client or an uploader.

`core/picgo/index.ts` 从 `piclist` 包（PicList-Core）创建 `PicGo` 实例，内置上传器由该依赖提供。云存储管理客户端位于 [../manage/apis/](../manage/apis/)，在 [../manage/manageApi.ts](../manage/manageApi.ts) 中注册。新增删除适配器不会自动增加管理客户端或上传器。

## Renderer calls / 渲染进程调用

The renderer calls main-process services through [../../preload/index.ts](../../preload/index.ts), which exposes `window.electron` and selected `window.node` helpers. RPC domain routes are in [../events/rpc/routes/](../events/rpc/routes/); [../events/rpc/index.ts](../events/rpc/index.ts) registers them. The local HTTP upload server in [../server/](../server/) is a separate interface.

渲染进程通过 [../../preload/index.ts](../../preload/index.ts) 调用主进程服务，该文件暴露 `window.electron` 和部分 `window.node` 工具。RPC 业务路由位于 [../events/rpc/routes/](../events/rpc/routes/)，由 [../events/rpc/index.ts](../events/rpc/index.ts) 注册。[../server/](../server/) 中的本地 HTTP 上传服务是另一套接口。

For persistent RPC changes:

1. Define the argument and result contract in [../../universal/rpc.ts](../../universal/rpc.ts), and keep the action constants in both processes aligned.
2. Register an `INVOKE` route with `defineRpcHandler` in the relevant domain. Await the write before returning success.
3. Call the renderer's [invokeRPC](../../renderer/utils/rpc.ts) helper to unwrap the result and surface failures before changing saved UI state. Persistent actions are rejected by the notification-only `sendRPC` path.
4. Keep bridge declarations in [electron.d.ts](../../universal/types/electron.d.ts) aligned when changing the exposed interface.

修改持久化 RPC 时：

1. 在 [rpc.ts](../../universal/rpc.ts) 定义参数和返回值契约，并同步两个进程的操作常量。
2. 在对应业务中使用 `defineRpcHandler` 注册 `INVOKE` 路由，等待写入完成后再返回成功。
3. 通过渲染进程的 [invokeRPC](../../renderer/utils/rpc.ts) 工具解包结果，在更新已保存的界面状态前处理失败。仅发送通知的 `sendRPC` 会拒绝持久化操作。
4. 修改暴露接口时，同步 [electron.d.ts](../../universal/types/electron.d.ts) 中的桥接声明。

RPC dispatch validates the renderer sender, request, and registered contracts. Use sanitized diagnostics from [dispatch.ts](../events/rpc/dispatch.ts); keep credentials and private file contents out of logs and RPC error responses.

RPC 分发会验证渲染进程来源、请求和已注册的契约。使用 [dispatch.ts](../events/rpc/dispatch.ts) 中经过脱敏的诊断信息，不要在日志或 RPC 错误响应中包含凭据或私有文件内容。
