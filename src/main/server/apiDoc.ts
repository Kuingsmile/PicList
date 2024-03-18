export const markdownContent = `
## 内置Server的使用

PicList内置了一个小型的服务器，用于接收来自其他应用或其他主机的HTTP请求来上传图片。

默认监听地址：\`0.0.0.0\`，默认监听端口：\`36677\`

### 接口鉴权

当将接口暴露于公网时，为了防止恶意上传，PicList提供了接口鉴权功能。

![202310102349225](https://assets.piclist.cn/image/202310102349225.webp)

发送请求时添加URL查询参数\`key\`即可，例如：\`http://xxx:36677/upload?key=xxx\`。

### 表单上传 <Badge type="tip" text="2.6.3+" />

- 请求方法: \`POST\`
- url: \`http://127.0.0.1:36677/upload\` （此处以默认配置为例）
- 请求body: \`multipart/form-data\`格式，key任选，value为图片文件

即可上传。

### HTTP调用上传剪贴板图片

- 请求方法: \`POST\`
- url: \`http://127.0.0.1:36677/upload\` （此处以默认配置为例）
- 请求body: \`{list: ['xxx.jpg']}\` 必须是JSON格式

即可上传。

::: tip Tip
PicList支持通过设置\`picbed\`和\`configName\`两个URL查询参数来指定上传图床和配置文件。例如：
\`http://127.0.0.1:36677/upload?picbed=aws-s3&configName=piclist-test\`
该配置将会使用\`aws-s3\`图床，并且使用\`piclist-test\`配置文件。
:::

返回的数据：

\`\`\`json
{
  "success": true, // or false
  "result": ["url"]
}
\`\`\`

### HTTP调用上传具体路径图片

- method: \`POST\`
- url: \`http://127.0.0.1:36677/upload\` （此处以默认配置为例）
- request body: \`{list: ['xxx.jpg']}\` 必须是JSON格式

返回的数据：

\`\`\`json
{
  "success": true, // or false
  "result": ["url"]
}
\`\`\`

### HTTP调用删除图片

- method: \`POST\`
- url: \`http://127.0.0.1:36677/delete\` （此处以默认配置为例）
- request body: \`{list: [{xx:xx}]}\` 必须是JSON格式

list中的每一项都是一个对象，由上传接口返回数据的\`fullResult\`字段组成。

返回的数据：

\`\`\`json
{
  "success": true, // or false
  "message": xxx
}
\`\`\`
`
